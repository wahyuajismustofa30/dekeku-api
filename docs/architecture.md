# Architecture

The DEKEKU API Gateway follows a modular design pattern.

## GitHub Core
Implemented as a read-only client in `src/core/github.js`. It uses the `fetch` API to communicate with GitHub and handles Base64 decoding for file contents.

## Modules
- **Health**: System status check.
- **GitHub**: Repository, Branch, and File metadata/content retrieval.

## Security
- **Read-Only**: No write operations are implemented in this version.
- **Path Validation**: Prevents path traversal in file requests.
- **Secrets**: Token is managed via `env.GITHUB_TOKEN` and never exposed.
