import { handlePublicData } from "./index.js";

// Backward-compatible endpoint. The legacy route shares the same registry,
// validator, resolver, storage engine, and response contract as /public/data/guestbook.
export const handlePublicSubmit = (request, env) =>
  handlePublicData(request, env, "guestbook");
