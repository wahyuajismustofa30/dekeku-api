import { HttpError } from "../../core/errors.js";
import { resolveProjectRepository } from "../github/repositories.js";
import { success } from "../../utils/response.js";

const SHA_PATTERN = /^[a-f0-9]{40}$/i;

const readBoundedJsonObject = async (request, maxBytes) => {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw new HttpError("Content-Type must be application/json", 415);
  }

  const rawLength = request.headers.get("Content-Length");
  if (rawLength !== null) {
    if (!/^(0|[1-9][0-9]*)$/.test(rawLength)) throw new HttpError("Invalid Content-Length", 400);
    if (Number(rawLength) > maxBytes) throw new HttpError("Payload too large", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body is required", 400);
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new HttpError("Payload too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total) throw new HttpError("Request body is required", 400);

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Request body is not valid UTF-8", 400);
  }

  let body;
  try {
    body = JSON.parse(source);
  } catch {
    throw new HttpError("Invalid JSON object", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError("JSON object required", 400);
  }
  return body;
};

const decodeStoredDocument = (file, resource) => {
  if (!file || file.type !== "file" || typeof file.sha !== "string" || !SHA_PATTERN.test(file.sha)) {
    throw new HttpError("Stored document metadata is invalid", 502);
  }
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > resource.maxFileBytes) {
    throw new HttpError("Stored document exceeds its size limit", 413);
  }
  if (typeof file.content !== "string") throw new HttpError("Stored document content is unavailable", 502);

  let binary;
  try {
    binary = atob(file.content.replace(/\s/g, ""));
  } catch {
    throw new HttpError("Stored document is not valid Base64", 502);
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.byteLength !== file.size || bytes.byteLength > resource.maxFileBytes) {
    throw new HttpError("Stored document size metadata is invalid", 502);
  }

  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HttpError("Stored document is not valid UTF-8", 502);
  }

  let document;
  try {
    document = JSON.parse(source);
  } catch {
    throw new HttpError("Stored document contains invalid JSON", 502);
  }
  if (resource.documentType === "array" && !Array.isArray(document)) {
    throw new HttpError("Stored document must contain a JSON array", 502);
  }
  return { document, sha: file.sha };
};

const readStoredDocument = async (github, resource) => {
  const encodedPath = resource.storagePath.split("/").map(encodeURIComponent).join("/");
  const file = await github.request(
    `/contents/${encodedPath}?ref=${encodeURIComponent(github.branch)}`,
    { method: "GET" }
  );
  return decodeStoredDocument(file, resource);
};

export const writePublicResource = async (request, env, resourceName, resource) => {
  const body = await readBoundedJsonObject(request, resource.maxBodyBytes);
  const entry = resource.validate(body);

  // Origin is a trust selector only; repository identity and branch come from
  // the validated config.json + GitHub repository metadata, never the client.
  const { client } = await resolveProjectRepository(request, env, { allowProjectOriginHeader: false });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let document = resource.documentType === "array" ? [] : {};
    let sha = null;
    let exists = true;
    try {
      const current = await readStoredDocument(client, resource);
      document = current.document;
      sha = current.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
      exists = false;
    }

    if (typeof resource.buildDocument !== "function") {
      throw new HttpError("Resource document strategy is unavailable", 500);
    }
    const nextDocument = resource.buildDocument(document, entry);
    if (resource.documentType === "array" && !Array.isArray(nextDocument)) {
      throw new HttpError("Resource document shape is invalid", 500);
    }

    const serialized = JSON.stringify(nextDocument, null, 2);
    const bytes = new TextEncoder().encode(serialized);
    if (bytes.byteLength > resource.maxFileBytes) {
      throw new HttpError("Stored document has reached its size limit", 413);
    }

    try {
      const result = exists
        ? await client.putFile(resource.storagePath, bytes, sha, resource.commitMessage)
        : await client.createFile(resource.storagePath, bytes, resource.commitMessage);
      return success({
        resource: resourceName,
        message: "Submission successful",
        file: resource.storagePath.split("/").pop(),
        path: resource.storagePath,
        count: Array.isArray(nextDocument) ? nextDocument.length : undefined,
        sha: result.content?.sha
      }, 201);
    } catch (error) {
      if (error.status !== 409) throw error;
    }
  }

  throw new HttpError("Resource is busy; please retry the submission", 409);
};
