import { sendResponse } from "../utils/api-response.js";

export const notFoundHandler = (_req, res) => {
  return sendResponse(res, 404, "Route not found");
};
