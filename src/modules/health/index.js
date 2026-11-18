import { success } from "../../utils/response.js";

export const getHealth = (request) => {
  return success({
    service: "DEKEKU API Gateway",
    version: "v1",
    status: "online"
  });
};
