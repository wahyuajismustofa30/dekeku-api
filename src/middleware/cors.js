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

export const getAllowedOrigin = (value, env = {}) => {
  const requestOrigin = parseHttpsOrigin(
    typeof value === "string" ? value.trim().toLowerCase() : value
  );
  if (!requestOrigin || typeof env.ALLOWED_ORIGINS !== "string") return null;

  const allowedPatterns = env.ALLOWED_ORIGINS
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);

  const isAllowed = allowedPatterns.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const domain = parseHttpsOrigin("https://" + pattern.slice(2));
      if (!domain) return false;

      return (
        requestOrigin.hostname !== domain.hostname &&
        requestOrigin.hostname.endsWith("." + domain.hostname)
      );
    }

    const exactOrigin = parseHttpsOrigin(pattern);
    return exactOrigin?.origin === requestOrigin.origin;
  });

  return isAllowed ? requestOrigin.origin : null;
};

export const handleCors = (request, env = {}) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");

  const rawOrigin = request?.headers?.get
    ? request.headers.get("Origin")
    : null;

  if (rawOrigin) {
    headers.set("Vary", "Origin");
  }

  const allowedOrigin = getAllowedOrigin(rawOrigin, env);
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }

  return headers;
};
