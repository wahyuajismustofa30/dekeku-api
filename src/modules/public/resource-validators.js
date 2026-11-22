import { HttpError } from "../../core/errors.js";

export const validateGuestbookPayload = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError("JSON object required", 400);
  }
  if (Object.keys(body).some((key) => !["name", "message", "email"].includes(key))) {
    throw new HttpError("Request contains unsupported fields", 422);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name || name.length > 100) {
    throw new HttpError("Field 'name' is required and must be between 1 and 100 characters", 422);
  }
  if (!message || message.length > 1000) {
    throw new HttpError("Field 'message' is required and must be between 1 and 1000 characters", 422);
  }

  let email = "";
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || body.email.length > 254) {
      throw new HttpError("Invalid 'email' format", 422);
    }
    email = body.email.trim();
  }

  return {
    name,
    message,
    ...(email ? { email } : {}),
    createdAt: new Date().toISOString()
  };
};
