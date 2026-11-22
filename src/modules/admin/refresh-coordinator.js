import { HttpError } from "../../core/errors.js";
import { discoverPublicRepositories, inspectPublicRepository } from "./dashboard.js";

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
    if (url.pathname === "/checks" && request.method === "GET") {
      return response({ success: true, checks: await this.state.storage.get("latest-checks") || {} });
    }
    if (url.pathname === "/start" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return response({ success: false, error: "Invalid request body" }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return response({ success: false, error: "Invalid request body" }, 400);
      const previous = await this.readState();
      if (previous && ACTIVE.has(previous.status)) {
        return response({ success: false, error: "A refresh job is already active" }, 409);
      }
      const repositories = await discoverPublicRepositories(this.env);
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
      await this.state.storage.setAlarm(Date.now() + 1000);
      return response({ success: true, job });
    }
    if (url.pathname === "/cancel" && request.method === "POST") {
      const job = await this.state.storage.transaction(async transaction => {
        const current = await transaction.get("latest-job");
        if (!current || !ACTIVE.has(current.status)) return null;
        current.cancelRequested = true;
        current.status = "cancelling";
        await transaction.put("latest-job", current);
        return current;
      });
      if (!job) return response({ success: false, error: "No active refresh job" }, 409);
      return response({ success: true, job });
    }
    if (url.pathname === "/retry" && request.method === "POST") {
      const previous = await this.readState();
      if (!previous || ACTIVE.has(previous.status)) return response({ success: false, error: "No completed job is available for retry" }, 409);
      const failedNames = new Set(previous.results.filter(item => !item.success).map(item => item.repository.toLowerCase()));
      if (failedNames.size === 0) return response({ success: false, error: "There are no failed repositories to retry" }, 409);
      const discovered = await discoverPublicRepositories(this.env);
      const targets = discovered.filter(repo => failedNames.has(repo.name.toLowerCase()));
      if (targets.length === 0) return response({ success: false, error: "Failed repositories are no longer available for retry" }, 409);
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
      await this.state.storage.setAlarm(Date.now() + 1000);
      return response({ success: true, job });
    }
    return response({ success: false, error: "Not Found" }, 404);
  }

  async persistCheck(repository, result) {
    const checks = await this.state.storage.get("latest-checks") || {};
    const key = `${repository.owner.toLowerCase()}/${repository.name.toLowerCase()}`;
    checks[key] = result;
    await this.state.storage.put("latest-checks", checks);
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
      itemResult = { repository: target.name, success: !inspection.error, status: inspection.status, checkedAt: inspection.checkedAt, ...(inspection.error ? { stage: inspection.error.stage, error: inspection.error.message, httpStatus: inspection.error.status } : {}) };
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
    if (shouldContinue) await this.state.storage.setAlarm(Date.now() + 1000);
  }
}
