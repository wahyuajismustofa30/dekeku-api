import { verifyPassword } from "../../utils/hash.js";
import { signJwt } from "../../utils/jwt.js";
import { GitHubClient } from "../../core/github.js";
import { readPrivateDocument } from "../rbac/storage.js";
import { HttpError } from "../../core/errors.js";
import { error, success } from "../../utils/response.js";

const BODY_MAX = 16 * 1024;
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/;
const PASSWORD_MAX = 128;
// A valid-format dummy hash keeps unknown-user requests on the PBKDF2 verification path.
const DUMMY_PASSWORD_HASH = "pbkdf2:100000:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";

const readLoginBody = async request => {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Malformed or empty JSON body", 422);
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > BODY_MAX) {
        await reader.cancel();
        throw new HttpError("Request body is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  let source;
  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Request body is not valid UTF-8", 422);
  }

  try {
    const body = JSON.parse(source);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    if (Object.keys(body).some(key => !["username", "password"].includes(key))) {
      throw new HttpError("Request contains unsupported fields", 422);
    }
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Malformed JSON body", 422);
  }
};

export const userLogin = async (request, env) => {
  if (request.method !== "POST") return error("Method Not Allowed", 405);

  try {
    const body = await readLoginBody(request);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!USERNAME_PATTERN.test(username) || password.length < 1 || password.length > PASSWORD_MAX) {
      return error("Authentication failed", 401);
    }

    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return error("Internal Server Error", 500);
    }

    const github = new GitHubClient(env);
    const { document } = await readPrivateDocument(github, "users");
    const account = document.users.find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );

    const passwordValid = await verifyPassword(
      password,
      account?.passwordHash || DUMMY_PASSWORD_HASH
    );

    if (!account || account.status !== "active" || !passwordValid) {
      return error("Authentication failed", 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt({
      iss: "dekeku-api",
      aud: "dekeku-user",
      sub: account.id,
      role: "user",
      iat: now,
      exp: now + 1800
    }, env.JWT_SECRET);

    return success({
      access_token: token,
      token_type: "Bearer",
      expires_in: 1800,
      user: {
        id: account.id,
        username: account.username,
        role: account.role
      }
    });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
};
