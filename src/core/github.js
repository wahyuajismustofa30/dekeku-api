import { HttpError } from "./errors.js";
import { validatePublicPath } from "../utils/github-content.js";
import { uint8ArrayToBase64 } from "../utils/base64.js";

const SHA_REGEX = /^[0-9a-fA-F]{40}$/;

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

  isRateLimitError(status, headers, body) {
    if (status === 429) return true;
    if (status === 403) {
      const remaining = headers.get("x-ratelimit-remaining");
      if (remaining === "0") return true;
      // Check for secondary rate limit indicators in body
      if (body && typeof body === "object") {
        const message = String(body.message || "").toLowerCase();
        if (message.includes("rate limit") || message.includes("abuse") || message.includes("secondary rate limit")) {
          return true;
        }
      }
    }
    if (status === 422) {
      if (body && typeof body === "object") {
        const message = String(body.message || "").toLowerCase();
        if (message.includes("rate limit") || message.includes("abuse") || message.includes("secondary rate limit")) {
          return true;
        }
      }
    }
    return false;
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

      // Parse error response for better error mapping
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // Ignore JSON parse errors for error responses
      }

      // Handle specific GitHub error codes with refined mapping
      const status = response.status;
      let gatewayStatus = status;
      let errorMessage = "GitHub API error";

      if (status === 401) {
        gatewayStatus = 502;
        errorMessage = "Internal server error";
      } else if (status === 403) {
        if (this.isRateLimitError(status, response.headers, errorBody)) {
          gatewayStatus = 429;
          errorMessage = "Rate limit exceeded";
        } else {
          gatewayStatus = 502;
          errorMessage = "Internal server error";
        }
      } else if (status === 404) {
        gatewayStatus = 404;
        errorMessage = "File not found";
      } else if (status === 409) {
        gatewayStatus = 409;
        errorMessage = "Conflict: file has been modified";
      } else if (status === 422) {
        if (this.isRateLimitError(status, response.headers, errorBody)) {
          gatewayStatus = 429;
          errorMessage = "Rate limit exceeded";
        } else {
          gatewayStatus = 422;
          errorMessage = "Validation failed";
        }
      } else if (status === 429) {
        gatewayStatus = 429;
        errorMessage = "Rate limit exceeded";
      } else if (status >= 500) {
        gatewayStatus = 502;
        errorMessage = "Upstream server error";
      }

      // Create HttpError with mapped status
      const httpError = new HttpError(errorMessage, gatewayStatus);

      // Attach Retry-After header if present
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter) {
        httpError.retryAfter = retryAfter;
      }

      throw httpError;

    } catch (err) {
      if (err instanceof HttpError) throw err;

      if (err.name === "AbortError") {
        if (options.signal?.aborted) {
          throw new HttpError("Request aborted by caller", 499);
        }
        throw new HttpError("Gateway timeout", 504);
      }

      // Network or other fetch errors
      throw new HttpError("Bad gateway", 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  
  async getDirectoryContents(path) {
    if (!path || typeof path !== "string") {
      throw new HttpError("Invalid path", 400);
    }

    const segments = path.split("/").filter(Boolean);
    const encodedPath = segments.map(encodeURIComponent).join("/");
    const endpoint = encodedPath
      ? `/contents/${encodedPath}?ref=${encodeURIComponent(this.branch)}`
      : `/contents?ref=${encodeURIComponent(this.branch)}`;

    return this.request(endpoint, { method: "GET" });
  }

  async getRepository() {
    return this.request("", { method: "GET" });
  }

  async getBranch(branchName = this.branch) {
    return this.request(`/branches/${branchName}`, { method: "GET" });
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
    return this.request(`/contents/${encodedPath}?ref=${encodeURIComponent(this.branch)}`, { method: "GET" });
  }

  async createFile(path, content, message) {
    const base64Content = uint8ArrayToBase64(content);
    const body = {
      message,
      content: base64Content,
      branch: this.branch
    };
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return this.request(`/contents/${encodedPath}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  validateSha(sha) {
    if (typeof sha !== "string" || !SHA_REGEX.test(sha)) {
      throw new HttpError("Invalid SHA format", 400);
    }
  }

  async putFile(path, content, sha, message) {
    // Validate SHA
    this.validateSha(sha);

    // Encode content to Base64 in chunks
    const base64Content = uint8ArrayToBase64(content);

    // Prepare request body
    const body = {
      message,
      content: base64Content,
      sha,
      branch: this.branch
    };

    // Encode path for URL
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");

    return this.request(`/contents/${encodedPath}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  async deleteFile(path, sha, message) {
    // Validate SHA
    this.validateSha(sha);

    // Prepare request body
    const body = {
      message,
      sha,
      branch: this.branch
    };

    // Encode path for URL
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");

    return this.request(`/contents/${encodedPath}`, {
      method: "DELETE",
      body: JSON.stringify(body)
    });
  }
}
