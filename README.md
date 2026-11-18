# DEKEKU API Gateway

Modular API Gateway built with Cloudflare Workers.

## Structure
- `src/core`: Core logic (Router, GitHub Client, Error Handling)
- `src/middleware`: Request/Response interceptors
- `src/modules`: API features (Health, GitHub Integration)
- `src/utils`: Reusable helpers

## Development
Run `npm run dev` to start the local wrangler server.

## Endpoints
- `GET /api/v1/health`: Service health status.
- `GET /api/v1/github/repository`: Repository metadata.
- `GET /api/v1/github/branch`: Branch metadata.
- `GET /api/v1/github/file?path=...`: Read file content.

## Environment Variables
Required for GitHub integration (Secrets):
- `GITHUB_TOKEN`: GitHub personal access token.
- `GITHUB_OWNER`: Repository owner.
- `GITHUB_REPO`: Repository name.
- `GITHUB_BRANCH`: Target branch (default: `main`).
