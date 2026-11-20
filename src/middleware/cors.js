export const handleCors = (request, env = {}) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");

  const origin = request?.headers?.get ? request.headers.get("Origin") : null;
  if (origin && env && typeof env.ALLOWED_ORIGINS === "string" && env.ALLOWED_ORIGINS.trim()) {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
    }
  }

  return headers;
};
