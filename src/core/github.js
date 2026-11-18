import { HttpError } from "./errors.js";

export class GitHubClient {
  constructor(env) {
    this.token = env.GITHUB_TOKEN;
    this.owner = env.GITHUB_OWNER;
    this.repo = env.GITHUB_REPO;
    this.branch = env.GITHUB_BRANCH || "main";

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
    this.rateLimit = {
      limit: headers.get("x-ratelimit-limit"),
      remaining: headers.get("x-ratelimit-remaining"),
      reset: headers.get("x-ratelimit-reset")
    };
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
      signal: AbortSignal.timeout(8000)
    });

    this.extractRateLimit(response.headers);

    if (response.status === 404) {
      throw new HttpError("GitHub resource not found", 404);
    }

    if (!response.ok) {
      throw new HttpError(`GitHub API error: ${response.status}`, response.status);
    }

    return response.json();
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
      // Decode twice to catch double-encoded traversal segments like %252e                                                                                                                                                                                                                                                0.000000e+00
      decodedPath = decodeURIComponent(decodeURIComponent(path));
    } catch (e) {
      try {
        decodedPath = decodeURIComponent(path);
      } catch (e2) {
        throw new HttpError("Malformed path encoding", 400);
      }
    }

    // Block forbidden characters: backslash, null byte, control characters
    if (decodedPath.includes("\\") || /[\x00-\x1F\x7F]/.test(decodedPath)) {
      throw new HttpError("Invalid file path", 400);
    }

    const segments = decodedPath.split("/");
    for (const segment of segments) {
      // Block traversal segments and empty segments (no leading/trailing/double slash)
      if (segment === "." || segment === ".." || segment === "") {
        throw new HttpError("Invalid file path", 400);
      }
      // Block any segment containing ".." to prevent "folder../file" patterns
      if (segment === ".." || segment === ".") {
        throw new HttpError("Invalid file path", 400);
      }
    }

    const encodedPath = segments.map(encodeURIComponent).join("/");
    return this.request(`/contents/${encodedPath}?ref=${this.branch}`);
  }
}
