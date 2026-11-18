import { router } from "./core/router.js";
import { handleCors } from "./middleware/cors.js";
import { error } from "./utils/response.js";
import { HttpError } from "./core/errors.js";

export default {
  async fetch(request, env, ctx) {
    try {
      const corsHeaders = handleCors(request);

      if (request.method === "OPTIONS") {
        corsHeaders.set("X-Content-Type-Options", "nosniff");
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const response = await router(request, env);

      // Apply CORS headers to the response
      const finalResponse = new Response(response.body, response);
      corsHeaders.forEach((v, k) => finalResponse.headers.set(k, v));

      return finalResponse;
    } catch (err) {
      if (err instanceof HttpError) {
        return error(err.message, err.status);
      }
      console.error(err);
      return error("Internal Server Error", 500);
    }
  }
};
