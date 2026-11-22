import { HttpError } from "../../core/errors.js";
import { success } from "../../utils/response.js";

const getCoordinator = env => {
  if (!env.DASHBOARD_REFRESH) throw new HttpError("Dashboard refresh service is not configured", 503);
  const id = env.DASHBOARD_REFRESH.idFromName("dashboard-refresh-v1");
  return env.DASHBOARD_REFRESH.get(id);
};

export const handleDashboardRefresh = async (request, env, action) => {
  const stub = getCoordinator(env);
  const method = action === "state" ? "GET" : "POST";
  let body;
  if (method === "POST") {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > 128 * 1024) throw new HttpError("Request body is too large", 413);
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 128 * 1024) throw new HttpError("Request body is too large", 413);
  }
  const response = await stub.fetch(new Request(`https://dashboard-refresh.internal/${action}`, {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body
  }));
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new HttpError(payload?.error || "Dashboard refresh request failed", response.status || 502);
  }
  return success({ job: payload.job }, response.status, { "Cache-Control": "no-store" });
};
