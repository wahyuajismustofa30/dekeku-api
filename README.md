# DEKEKU API Gateway

Cloudflare Workers-based API gateway that centrally mediates access to GitHub private repositories.

## Deskripsi

DEKEKU API Gateway adalah layanan backend for website/app untuk:
- **Membaca** data JSON di direktori `public/` - Gratis (no API key).
- **Menulis** data JSON di direktori `public/data/` - Wajib login admin (JWT).
- **Mengirim** guestbook publik via `POST /api/v1/public/submit` - Tanpa auth admin, concurrent-safe.
- **Mengelola** repository GitHub menggunakan Contents API.

## Fitur

- ✅ Public read access: GET data tanpa authenticated request.
- ✅ Public guestbook submission: POST pesan guestbook publik ke `public/data/guestbook/`.
- ✅ Admin write access: POST/PUT/DELETE data via JWT auth.
- ✅ GitHub integration: Operasi performed through GitHub Contents API.
- ✅ Optimistic concurrency: SHA-based conflict control on write operations.
- ✅ Automatic SHA lookup: authenticated endpoint supplies the current GitHub Blob SHA before UPDATE/DELETE.
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
│   │   │   ├── write.js       # Write engine
│   │   │   └── write-router.js
│   │   ├── public/            # Public guestbook submission
│   │   ├── tester/            # Same-origin Tester Dashboard
│   │   └── health/            # /health endpoint
│   └── utils/                 # Utilities
│       ├── jwt.js             # JWT utilities
│       ├── hash.js            # PBKDF2 password verification
│       ├── response.js        # JSON response formatter
│       └── github-content.js  # GitHub content processing
├── test/                      # Isolated local and explicit remote suites
│   ├── auth.test.js
│   ├── github-core.test.js
│   ├── write-foundation.test.js
│   ├── github-write.test.js
│   ├── write-router.test.js
│   ├── public-submission.test.js
│   ├── security-edge-cases.test.js
│   ├── tester-dashboard.test.js
│   ├── cors-policy.test.js
│   └── live-remote.test.js     # Explicit remote test; may write Guestbook data
├── project/                    # Project documentation
│   ├── MASTER.md              # Core rules & authority
│   ├── PROGRESS.md            # Feature status (authoritative)
│   ├── ROADMAP.md             # Phase planning
│   ├── BACKLOG.md             # Pending work
│   ├── DECISIONS.md           # Architecture decisions
│   ├── CHECKPOINT.md          # Operational checkpoint
│   └── CHANGELOG.md           # History of changes
├── docs/
│   ├── architecture.md        # Architecture documentation
│   └── USAGE.md               # Usage guide
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
| POST | `/api/v1/public/submit` | Submit public guestbook entry |

### Admin Write (Require Admin JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/write/sha?path=...` | Retrieve current Blob SHA for an existing JSON file (admin JWT required) |
| POST | `/api/v1/admin/write/create` | Create new JSON file in `public/data/` |
| PUT | `/api/v1/admin/write/update` | Update existing JSON file (tester retrieves SHA automatically; API still requires SHA) |
| DELETE | `/api/v1/admin/write/delete` | Delete JSON file (tester retrieves SHA automatically; API still requires SHA) |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/login` | Admin login, returns JWT token |

## Environment Variables (Dev)

### Worker Secrets (configured separately per environment)
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

# Build for production
npm run build
\`\`\`

## Testing

Hasil terbaru yang dilaporkan pengguna pada 2026-11-21 untuk branch `dev`, commit `a6a089d`: `npm run check` PASS dan `npm test` 149 PASS, 0 FAIL, 0 SKIP. Hasil ini merupakan laporan pengguna, bukan verifikasi independen pada sesi dokumentasi ini. Remote test dan runtime/deployment Development tidak termasuk dalam hasil tersebut.


\`\`\`bash
# Run syntax check and isolated local test suite
npm run check
npm test

# Explicitly run Development Worker tests (may write Guestbook data)
npm run test:remote
\`\`\`

`npm test` excludes `test/live-remote.test.js`. The remote suite accesses the active Development Worker and includes a Guestbook submission that writes to the configured GitHub repository. Run it only when explicitly intended. Historical test totals are not a substitute for a fresh test run.

## Development Workflow

1. Update the development branch: `git fetch origin && git switch dev && git pull --ff-only origin dev`
2. Develop and verify: `npm run check && npm test`
3. Commit the completed work on `dev`: `git commit -m "type: description"`
4. Push: `git push origin dev`
5. Open/update PR `dev` → `main`; a human reviews and merges it.

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
- **Usage Guide**: [docs/USAGE.md](docs/USAGE.md)
- **Roadmap**: [project/ROADMAP.md](project/ROADMAP.md)
- **Decisions**: [project/DECISIONS.md](project/DECISIONS.md)
- **Change History**: [project/CHANGELOG.md](project/CHANGELOG.md)
- **Reviewer Context**: [project/CLAUDE_PROJECT_CONTEXT.md](project/CLAUDE_PROJECT_CONTEXT.md)

## License

Internal DEKEKU project. Not for external distribution.
