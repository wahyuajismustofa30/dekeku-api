const parseHttpsOrigin = (value) => {
  if (typeof value !== "string" || !value) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.origin !== value
    ) {
      return null;
    }

    return { origin: url.origin, hostname: url.hostname.toLowerCase() };
  } catch {
    return null;
  }
};

export const handleCors = (request, env = {}) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");

  const rawOrigin = request?.headers?.get
    ? request.headers.get("Origin")?.trim().toLowerCase()
    : null;

  if (rawOrigin) {
    // Origin-dependent responses must not be reused for a different origin.
    headers.set("Vary", "Origin");
  }

  const requestOrigin = parseHttpsOrigin(rawOrigin);
  if (!requestOrigin || typeof env.ALLOWED_ORIGINS !== "string") {
    return headers;
  }

  const allowedPatterns = env.ALLOWED_ORIGINS
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAllowed = allowedPatterns.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const domain = parseHttpsOrigin("https://" + pattern.slice(2));
      if (!domain) return false;

      // Wildcards allow subdomains only; the apex must be listed explicitly.
      return (
        requestOrigin.hostname !== domain.hostname &&
        requestOrigin.hostname.endsWith("." + domain.hostname)
      );
    }

    const exactOrigin = parseHttpsOrigin(pattern);
    return exactOrigin?.origin === requestOrigin.origin;
  });

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", requestOrigin.origin);
  }

  return headers;
};
