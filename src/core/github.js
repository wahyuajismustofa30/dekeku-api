import { HttpError } from "./errors.js";
import { validatePublicPath } from "../utils/github-content.js";

export class GitHubClient {
  constructor(env) {
    this.token = env.GITHUB_TOKEN;
    this.owner = env.GITHUB_OWNER;
    this.repo = env.GITHUB_REPO;
    this.branch = env.GITHUB_BRANCH || "main";
    this.timeout = 8000;

    if (!this.token || !this.owner || !this.repo) {
      throw new HttpError("GitHub configuration is missing", 500);
    }

    this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}`;
    this.headers = {
      "Authorization": `Bearer ${this.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "dekeku-api-gateway",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    this.rateLimit = {};
  }

  extractRateLimit(headers) {
    if (!headers) return;
    this.rateLimit = {
      limit: headers.get("x-ratelimit-limit"),
      remaining: headers.get("x-ratelimit-remaining"),
      reset: headers.get("x-ratelimit-reset")
    };
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Link caller signal if provided
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new HttpError("Request aborted by caller", 499);
      }
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...options.headers },
        signal: controller.signal
      });

      this.extractRateLimit(response.headers);

      if (response.ok) {
        return await response.json();
      }

      // Handle specific GitHub error codes
      let errorMessage = `GitHub API error: ${response.status}`;
      const status = response.status;

      if (status === 401) errorMessage = "GitHub authentication failed (Invalid Token)";
      else if (status === 403) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        errorMessage = remaining === "0" ? "GitHub API rate limit exceeded" : "GitHub access forbidden";
      }
      else if (status === 404) errorMessage = "GitHub resource not found";
      else if (status === 409) errorMessage = "GitHub resource conflict";
      else if (status === 422) errorMessage = "GitHub validation failed (Unprocessable Entity)";
      else if (status === 429) errorMessage = "GitHub too many requests";
      else if (status >= 500) errorMessage = "GitHub server error";

      throw new HttpError(errorMessage, status);

    } catch (err) {
      if (err instanceof HttpError) throw err;

      if (err.name === "AbortError") {
        if (options.signal?.aborted) {
          throw new HttpError("Request aborted by caller", 499);
        }
        throw new HttpError("GitHub API request timeout", 408);
      }

      // Network or other fetch errors
      throw new HttpError("GitHub API network error or connection failed", 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getRepository() {
    return this.request("");
  }

  async getBranch(branchName = this.branch) {
    return this.request(`/branches/${branchName}`);
  }

  async getFile(path) {
    if (!path || typeof path !== "string") {
      throw new HttpError("Invalid file path", 400);
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(decodeURIComponent(path));
    } catch (e) {
      try {
        decodedPath = decodeURIComponent(path);
      } catch (e2) {
        throw new HttpError("Malformed path encoding", 400);
      }
    }

    if (decodedPath.includes("\\") || /[\x00-\x1F\x7F]/.test(decodedPath)) {
      throw new HttpError("Invalid file path", 400);
    }

    const segments = decodedPath.split("/");
    if (segments.some(s => s === "")) {
      throw new HttpError("Invalid file path", 400);
    }

    if (segments.some(s => s === "." || s === "..")) {
      throw new HttpError("Invalid file path", 400);
    }

    const validation = validatePublicPath(segments);
    if (!validation.valid) {
      throw new HttpError(validation.error, validation.status);
    }

    const encodedPath = segments.map(encodeURIComponent).join("/");
    return this.request(`/contents/${encodedPath}?ref=${this.branch}`);
  }
}
