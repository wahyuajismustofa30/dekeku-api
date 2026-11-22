import { HttpError } from "../../core/errors.js";
import { getPublicResource } from "./resource-registry.js";
import { writePublicResource } from "./storage-engine.js";

export const handlePublicData = async (request, env, resourceName) => {
  if (request.method !== "POST") throw new HttpError("Method Not Allowed", 405);

  const resource = getPublicResource(resourceName);
  if (!resource) throw new HttpError("Public resource not found", 404);
  if (resource.method !== request.method) throw new HttpError("Method Not Allowed", 405);

  return writePublicResource(request, env, resourceName, resource);
};
