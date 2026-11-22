import { validateGuestbookPayload } from "./resource-validators.js";

export const PUBLIC_RESOURCE_REGISTRY = Object.freeze({
  guestbook: Object.freeze({
    enabled: true,
    method: "POST",
    validate: validateGuestbookPayload,
    storagePath: "assets/data/bukutamu.json",
    documentType: "array",
    maxBodyBytes: 15360,
    maxFileBytes: 1024 * 1024,
    commitMessage: "Append public guestbook entry"
  })
});

export const getPublicResource = (name) => {
  if (typeof name !== "string" || !Object.hasOwn(PUBLIC_RESOURCE_REGISTRY, name)) return null;
  const resource = PUBLIC_RESOURCE_REGISTRY[name];
  return resource.enabled ? resource : null;
};
