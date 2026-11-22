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
  const body = method === "POST" ? await request.text() : undefined;
  const response = await stub.fetch(new Request(`https://dashboard-refresh.internal/${action}`, {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body
  }));
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new HttpError(payload?.error || "Dashboard refresh request failed", response.status || 502);
  }
  return success(action === "state" ? { job: payload.job } : { job: payload.job }, response.status);
};
