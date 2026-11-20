import { router } from "./core/router.js";
import { handleCors } from "./middleware/cors.js";
import { error } from "./utils/response.js";
import { HttpError } from "./core/errors.js";

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = handleCors(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const response = await router(request, env);

      // Apply CORS headers to the response
      const finalResponse = new Response(response.body, response);
      corsHeaders.forEach((v, k) => finalResponse.headers.set(k, v));

      return finalResponse;
    } catch (err) {
      const extraHeaders = {};
      if (err instanceof HttpError) {
        if (err.retryAfter) {
          extraHeaders["Retry-After"] = String(err.retryAfter);
        }
        const errResponse = error(err.message, err.status, extraHeaders);
        corsHeaders.forEach((v, k) => errResponse.headers.set(k, v));
        return errResponse;
      }

      console.error(err);
      const errResponse = error("Internal Server Error", 500);
      corsHeaders.forEach((v, k) => errResponse.headers.set(k, v));
      return errResponse;
    }
  }
};
