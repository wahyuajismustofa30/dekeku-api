# Guestbook Storage

## Layout
Each validated HTTPS Origin hostname has one JSON array file in the configured GitHub data repository (GITHUB_OWNER/GITHUB_REPO, branch GITHUB_BRANCH):

    public/data/{hostname-origin}/bukutamu.json

Examples:
- https://demo.dekeku.my.id -> public/data/demo.dekeku.my.id/bukutamu.json
- https://shop.example.com -> public/data/shop.example.com/bukutamu.json

The Worker derives the hostname after exact/wildcard ALLOWED_ORIGINS validation. Client-supplied paths and repository identities are never accepted. Hostname dots are preserved.

## Format and concurrency
Each file is a JSON array of submission objects containing name, message, optional email, and createdAt (UTC ISO-8601). The Worker reads the current blob SHA before updating. On HTTP 409 it re-reads the latest contents and retries with a fresh SHA, at most three write attempts. A conflict after that returns 409; stale writes are never retried.

The serialized file is limited to 1 MiB and requests to 15 KiB. A full file returns 413 without truncating or deleting entries. Existing legacy files under public/data/guestbook/ are not migrated or deleted.

Origin is a tenant/path selector, not authentication. Non-browser clients can spoof Origin; the allowlist restricts namespace creation but does not prove caller identity.
