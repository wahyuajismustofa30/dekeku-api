# DEKEKU API Gateway

Cloudflare Workers-based API gateway that centrally mediates access to GitHub private repositories.

## Deskripsi

DEKEKU API Gateway adalah layanan backend for website/app untuk:
- **Membaca** data JSON di direktori `public/` - Gratis (no API key).
- **Menulis** data JSON di direktori `public/data/` - Wajib login admin (JWT).
- **Mengelola** repository GitHub menggunakan Contents API.

## Fitur

- ✅ Public read access: GET data tanpa authenticated request.
- ✅ Admin write access: POST/PUT/DELETE data via JWT auth.
- ✅ GitHub integration: Operasi performed through GitHub Contents API.
- ✅ Optimistic concurrency: SHA-based conflict control on write operations.
- ✅ Auto-error mapping: Network timeouts → 504, 4xx → 4xx, 5xx → 502, rate limit → 429.

## Struktur Repository

\`\`\`
dekeku-api/
├── src/
│   ├── core/                   # Core logic
│   │   ├── router.js          # HTTP routing
│   │   ├── github.js          # GitHub Contents API client
│   │   └── errors.js          # Custom error classes
│   ├── middleware/            # HTTP middleware
│   │   ├── auth.js            # JWT authentication
│   │   └── cors.js            # CORS handling
│   ├── modules/               # Domain logic
│   │   ├── auth/              # Admin login & JWT
│   │   ├── github/            # File & repo handlers
│   │   │   ├── files.js       # Public file GET
│   │   │   ├── repositories.js
│   │   │   ├── write.js       # Write engine (build phase IN PROGRESS)
│   │   │   └── write-router.js
│   │   └── health/            # /health endpoint
│   └── utils/                 # Utilities
│       ├── jwt.js             # JWT utilities
│       ├── hash.js            # PBKDF2 password verification
│       ├── response.js        # JSON response formatter
│       └── github-content.js  # GitHub content processing
├── test/                      # Test suites
│   ├── auth.test.js           # Login & JWT tests
│   ├── write-foundation.test.js
│   ├── github-write.test.js
│   ├── write-router.test.js
│   └── github-core.test.js
├── project/                    # Project documentation
│   ├── MASTER.md              # Core rules & authority
│   ├── PROGRESS.md            # Feature status (authoritative)
│   ├── ROADMAP.md             # Phase planning
│   ├── BACKLOG.md             # Pending work
│   ├── DECISIONS.md           # Architecture decisions
│   ├── CHECKPOINT.md          # Operational checkpoint
│   └── CHANGELOG.md           # History of changes
├── docs/
│   └── architecture.md        # Architecture documentation
├── package.json               # Dependencies & scripts
├── wrangler.jsonc             # Cloudflare Workers config
├── AGENTS.md                  # Git workflow (dev + PR)
├── README.md                  # This file
└── CLAUDE_PROJECT_CONTEXT.md  # Context for AI reviewers
\`\`\`

## Endpoint

### Public (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/github/repository` | Repository metadata |
| GET | `/api/v1/github/branch` | Branch metadata |
| GET | `/api/v1/github/file?path=...` | Read JSON file from public/ |

### Admin Write (Require Admin JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/write/create` | Create new JSON file in `public/data/` |
| PUT | `/api/v1/admin/write/update` | Update existing JSON file (requires SHA) |
| DELETE | `/api/v1/admin/write/delete` | Delete JSON file (requires SHA) |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/login` | Admin login, returns JWT token |

## Environment Variables (Dev)

### Secrets (Production)
- `GITHUB_TOKEN` - GitHub Personal Access Token (write access to repo)
- `JWT_SECRET` - JWT signing secret (32 chars or longer)
- `ADMIN_PASSWORD_HASH` - Hashed admin password (PBKDF2-SHA256)

### Configuration
- `GITHUB_OWNER` - GitHub repository owner
- `GITHUB_REPO` - GitHub repository name
- `GITHUB_BRANCH` - Default branch (usually main)
- `ALLOWED_ORIGINS` - Comma-separated allowed origins (supports wildcard `*.domain.com`, e.g., `*.dekeku.my.id,*.artoprintingpbg.com`)

## Running Development

**Prasyarat**: Node.js, npm, and Wrangler CLI installed.

\`\`\`bash
# Install dependencies
npm install

# Run development server locally
npm run dev

# Validate source code syntax
npm run check

# Build for production (optional, for Fleet)
npm run build
\`\`\`

Development server runs in watch mode via Cloudflare Workers Dev.

## Testing

\`\`\`bash
# Run full test suite
npm test

# Run specific test files
npm test test/auth.test.js
npm test test/github-write.test.js
\`\`\`

Current test results: 103 PASS from 112 total tests (as of 2026-11-20).

## Development Workflow

1. Create branch (if needed): `git checkout -b feature/xyz`
2. Develop and test: Coding followed by `npm test`
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin dev`
5. Create PR: PR `dev` → `main` reviewed by human before merge

For detailed workflow and policies, see [project/MASTER.md](project/MASTER.md) and [AGENTS.md](AGENTS.md).

## Operational Checkout

- Branch kesesuaian: `dev`
- Jalur integrasi: Pull Request `dev` → `main`
- Development Worker: `dekeku-api-dev` (deploy via Wrangler)
- Production Worker: `github`, alias: `api.dekeku.my.id` (wajib approval manual untuk deploy & config)

## Documentation

- **Project Rules**: [project/MASTER.md](project/MASTER.md)
- **Feature Status**: [project/PROGRESS.md](project/PROGRESS.md) (authoritative, single source of truth)
- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **Roadmap**: [project/ROADMAP.md](project/ROADMAP.md)
- **Decisions**: [project/DECISIONS.md](project/DECISIONS.md)
- **Change History**: [project/CHANGELOG.md](project/CHANGELOG.md)
- **Myself Guidance**: [AGENTS.md](AGENTS.md)
- **Review Context**: [project/CLAUDE_PROJECT_CONTEXT.md](project/CLAUDE_PROJECT_CONTEXT.md)

## License

Internal DEKEKU project. Not for external distribution.
