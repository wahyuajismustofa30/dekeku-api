import { GitHubClient } from "../../core/github.js";
import { HttpError } from "../../core/errors.js";
import { discoverPublicRepositories, inspectPublicRepository } from "./dashboard.js";
import { readDashboardDocument, writeDashboardDocument } from "./dashboard-storage.js";

const ACTIVE = new Set(["queued", "running", "cancelling"]);
const MAX_TARGETS = 1000;
const cleanName = value => typeof value === "string" ? value.slice(0, 100) : "unknown";

const response = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

export class DashboardRefreshCoordinator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async readState() {
    return await this.state.storage.get("latest-job") || null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/state" && request.method === "GET") {
      return response({ success: true, job: await this.readState() });
    }
    if (url.pathname === "/start" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return response({ success: false, error: "Invalid request body" }, 400); }
      const repositories = await discoverPublicRepositories(this.env);
      const previous = await this.readState();
      if (previous && ACTIVE.has(previous.status)) {
        return response({ success: false, error: "A refresh job is already active" }, 409);
      }
      let targets = repositories;
      if (body.repositories !== undefined) {
        if (!Array.isArray(body.repositories) || body.repositories.length < 1 ||
            body.repositories.length > MAX_TARGETS ||
            body.repositories.some(name => typeof name !== "string" || name.length > 100)) {
          return response({ success: false, error: "Invalid refresh selection" }, 422);
        }
        const requested = new Set(body.repositories.map(name => name.toLowerCase()));
        if (requested.size !== body.repositories.length) {
          return response({ success: false, error: "Duplicate refresh selection" }, 422);
        }
        if ([...requested].some(name => !repositories.some(repo => repo.name.toLowerCase() === name))) {
          return response({ success: false, error: "Refresh selection contains an unknown repository" }, 422);
        }
        targets = repositories.filter(repo => requested.has(repo.name.toLowerCase()));
      }
      if (targets.length > MAX_TARGETS) return response({ success: false, error: "Too many repositories to refresh" }, 413);
      const job = {
        jobId: crypto.randomUUID(),
        generation: (previous?.generation || 0) + 1,
        status: "queued",
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        total: targets.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
        remaining: targets.length,
        cancelRequested: false,
        pending: targets.map(repo => ({ owner: repo.owner, name: repo.name, defaultBranch: repo.defaultBranch, archived: repo.archived })),
        results: []
      };
      const accepted = await this.state.storage.transaction(async transaction => {
        const latest = await transaction.get("latest-job");
        if (latest && ACTIVE.has(latest.status)) return false;
        job.generation = (latest?.generation || 0) + 1;
        await transaction.put("latest-job", job);
        return true;
      });
      if (!accepted) return response({ success: false, error: "A refresh job is already active" }, 409);
      await this.state.storage.setAlarm(Date.now() + 25);
      return response({ success: true, job });
    }
    if (url.pathname === "/cancel" && request.method === "POST") {
      const job = await this.readState();
      if (!job || !ACTIVE.has(job.status)) return response({ success: false, error: "No active refresh job" }, 409);
      job.cancelRequested = true;
      job.status = "cancelling";
      await this.state.storage.put("latest-job", job);
      return response({ success: true, job });
    }
    if (url.pathname === "/retry" && request.method === "POST") {
      const previous = await this.readState();
      if (!previous || ACTIVE.has(previous.status)) return response({ success: false, error: "No completed job is available for retry" }, 409);
      const failedNames = new Set(previous.results.filter(item => !item.success).map(item => item.repository));
      if (failedNames.size === 0) return response({ success: false, error: "There are no failed repositories to retry" }, 409);
      const discovered = await discoverPublicRepositories(this.env);
      const targets = discovered.filter(repo => failedNames.has(repo.name));
      const job = {
        jobId: crypto.randomUUID(),
        generation: (previous.generation || 0) + 1,
        status: "queued",
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        total: targets.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
        remaining: targets.length,
        cancelRequested: false,
        pending: targets.map(repo => ({ owner: repo.owner, name: repo.name, defaultBranch: repo.defaultBranch, archived: repo.archived })),
        results: []
      };
      const accepted = await this.state.storage.transaction(async transaction => {
        const latest = await transaction.get("latest-job");
        if (!latest || latest.jobId !== previous.jobId || ACTIVE.has(latest.status)) return false;
        job.generation = (latest.generation || 0) + 1;
        await transaction.put("latest-job", job);
        return true;
      });
      if (!accepted) return response({ success: false, error: "Refresh state changed; reload and retry" }, 409);
      await this.state.storage.setAlarm(Date.now() + 25);
      return response({ success: true, job });
    }
    return response({ success: false, error: "Not Found" }, 404);
  }

  async persistCheck(repository, result) {
    const github = new GitHubClient(this.env);
    const stored = await readDashboardDocument(github, this.env);
    const projects = [...stored.document.projects];
    const index = projects.findIndex(item =>
      item.owner.toLowerCase() === repository.owner.toLowerCase() &&
      item.repo.toLowerCase() === repository.name.toLowerCase()
    );
    const timestamp = new Date().toISOString();
    if (index >= 0) {
      projects[index] = { ...projects[index], updatedAt: timestamp, lastCheck: result, domain: projects[index].domain || result.cname?.domain || null };
    } else {
      projects.push({
        id: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
        owner: repository.owner,
        repo: repository.name,
        projectType: "other",
        domain: result.cname?.domain || null,
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        lastCheck: result
      });
    }
    await writeDashboardDocument(github, this.env, { version: 1, projects }, stored.sha);
  }

  async alarm() {
    const claim = await this.state.storage.transaction(async transaction => {
      const current = await transaction.get("latest-job");
      if (!current || !ACTIVE.has(current.status)) return null;
      if (current.cancelRequested) {
        current.status = "cancelled";
        current.completedAt = new Date().toISOString();
        current.remaining = current.pending.length;
        await transaction.put("latest-job", current);
        return { terminal: true };
      }
      if (!current.startedAt) {
        current.startedAt = new Date().toISOString();
        current.status = "running";
      }
      const target = current.pending.shift();
      if (!target) {
        current.status = current.failed ? "completed_with_errors" : "completed";
        current.completedAt = new Date().toISOString();
        current.remaining = 0;
        await transaction.put("latest-job", current);
        return { terminal: true };
      }
      current.remaining = current.pending.length;
      await transaction.put("latest-job", current);
      return { job: current, target };
    });
    if (!claim || claim.terminal) return;

    const { job, target } = claim;
    let itemResult;
    try {
      const repository = { owner: target.owner, name: target.name, defaultBranch: target.defaultBranch, archived: target.archived };
      const inspection = await inspectPublicRepository(this.env, repository);
      await this.persistCheck(repository, inspection);
      itemResult = { repository: target.name, success: true, status: inspection.status, checkedAt: inspection.checkedAt };
    } catch (error) {
      itemResult = {
        repository: cleanName(target.name),
        success: false,
        stage: "persist-or-inspect",
        error: error instanceof HttpError ? error.message : "Refresh failed",
        checkedAt: new Date().toISOString()
      };
    }

    const shouldContinue = await this.state.storage.transaction(async transaction => {
      const latest = await transaction.get("latest-job");
      if (!latest || latest.jobId !== job.jobId || latest.generation !== job.generation) return false;
      latest.results.push(itemResult);
      latest.completed += 1;
      if (itemResult.success) latest.succeeded += 1;
      else latest.failed += 1;
      latest.remaining = latest.pending.length;
      if (latest.cancelRequested) {
        latest.status = "cancelled";
        latest.completedAt = new Date().toISOString();
      } else if (latest.pending.length) {
        latest.status = "running";
        await transaction.put("latest-job", latest);
        return true;
      } else {
        latest.status = latest.failed ? "completed_with_errors" : "completed";
        latest.completedAt = new Date().toISOString();
      }
      await transaction.put("latest-job", latest);
      return false;
    });
    if (shouldContinue) await this.state.storage.setAlarm(Date.now() + 25);
  }
}
