# Guestbook Storage

## Storage contract (current)

The Public Data API stores each project's Guestbook in that project's own public GitHub repository at the fixed server-side path:

```text
assets/data/bukutamu.json
```

The Worker resolves the project repository from the request's trusted HTTPS `Origin` using the shared File Manager `resolveProjectRepository()` flow and the project's schema-v1 `config.json`. The resolver enforces the trusted `GITHUB_OWNER`, verifies that the repository is public, and uses the repository's GitHub `default_branch`. The client cannot choose the owner, repository, branch, or storage path.

The Public Data API uses the actual request `Origin`; it ignores `X-DEKEKU-Project-Origin`. That header remains a File Manager selector for authenticated Admin operations and is not a Public Data API override or authentication mechanism.

## API and document format

- Generic endpoint: `POST /api/v1/public/data/{resource}`.
- Active resource: `guestbook`.
- Compatibility alias: `POST /api/v1/public/submit`, delegated to the same Guestbook handler.
- Stored document: JSON array of entries containing `name`, `message`, optional `email`, and server-generated `createdAt` (UTC ISO-8601).
- Request body limit: 15,360 bytes; stored file limit: 1 MiB.
- Guestbook validation: trimmed `name` 1–100 characters, trimmed `message` 1–1,000 characters, optional `email` up to 254 characters; unknown fields are rejected.
- Public websites read the resulting JSON directly from their public repository/CDN. No public GET API is introduced for this flow.

## Safety and concurrency

Origin is a project-selection and browser-origin trust input, not user authentication; non-browser clients can spoof it. The allowlist and server-side repository/config validation restrict the target but do not prove caller identity. The storage engine uses GitHub SHA concurrency and bounded conflict handling; it must not accept client-selected paths or repository coordinates.

## Historical note

The former layout `public/data/{hostname-origin}/bukutamu.json` is obsolete and does not describe the current Public Data API. Do not create new files at that path or use it as the Guestbook integration contract. Existing legacy files are not implicitly migrated or deleted by this documentation update.

See also: [Public Data API](PUBLIC_DATA_API.md), [Guestbook Integration](GUESTBOOK_INTEGRATION.md), and [Usage](USAGE.md).
