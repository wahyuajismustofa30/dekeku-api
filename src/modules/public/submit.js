import { HttpError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github.js";
import { success } from "../../utils/response.js";

const MAX_BODY_SIZE = 15360; // 15 KB max for public submission
const MAX_STRING_LENGTH = 1000;

export const handlePublicSubmit = async (request, env) => {
  if (request.method !== "POST") {
    throw new HttpError("Method Not Allowed", 405);
  }

  // 1. Content-Type check
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError("Content-Type must be application/json", 415);
  }

  // 2. Content-Length check
  const contentLength = parseInt(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_BODY_SIZE) {
    throw new HttpError("Payload too large", 413);
  }

  // 3. Read body with limit
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch (e) {
    throw new HttpError("Invalid request body", 400);
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_SIZE) {
    throw new HttpError("Payload too large", 413);
  }

  // 4. Parse JSON
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch (e) {
    throw new HttpError("Invalid JSON", 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError("Request body must be a JSON object", 400);
  }

  // 5. Validate required fields: name and message
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (!name || name.length > 100) {
    throw new HttpError("Field 'name' is required and must be between 1 and 100 characters", 422);
  }

  if (!message || message.length > MAX_STRING_LENGTH) {
    throw new HttpError("Field 'message' is required and must be between 1 and 1000 characters", 422);
  }

  // Optional email validation if provided
  let email = "";
  if (data.email !== undefined) {
    if (typeof data.email !== "string" || data.email.length > 254) {
      throw new HttpError("Invalid 'email' format", 422);
    }
    email = data.email.trim();
  }

  const submissionPayload = {
    name,
    message,
    ...(email ? { email } : {}),
    createdAt: new Date().toISOString()
  };

  const serialisedContent = JSON.stringify(submissionPayload, null, 2);
  const contentBytes = new TextEncoder().encode(serialisedContent);

  // Generate unique path in public/data/guestbook/
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const fileName = `sub_${Date.now()}_${randomSuffix}.json`;
  const filePath = `public/data/guestbook/${fileName}`;

  // Initialize GitHub client
  const github = new GitHubClient(env);
  const result = await github.createFile(filePath, contentBytes, `Public guestbook submission from ${name}`);

  return success({
    message: "Submission successful",
    file: fileName,
    path: filePath,
    sha: result.content?.sha
  }, 201);
};
