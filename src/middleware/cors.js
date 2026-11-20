export const handleCors = (request, env = {}) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");

  const origin = request?.headers?.get ? request.headers.get("Origin")?.toLowerCase() : null;
  if (origin && env && typeof env.ALLOWED_ORIGINS === "string" && env.ALLOWED_ORIGINS.trim()) {
    const allowedPatterns = env.ALLOWED_ORIGINS.split(",").map(o => o.trim().toLowerCase()).filter(Boolean);
    
    const isAllowed = allowedPatterns.some(pattern => {
      // Wildcard subdomain support: *.domain.com
      if (pattern.startsWith("*.")) {
        const domain = pattern.substring(2);
        return origin === `https://${domain}` || origin.endsWith(`.${domain}`);
      }
      // Exact match
      return origin === pattern;
    });

    if (isAllowed) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
    }
  }

  return headers;
};
