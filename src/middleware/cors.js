export const handleCors = (request) => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");
  // Explicit configuration required for Origin later
  return headers;
};
