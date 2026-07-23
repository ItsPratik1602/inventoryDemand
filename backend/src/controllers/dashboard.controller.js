import { getDashboardSummary } from "../services/dashboard.service.js";
import { generateAllProductAlerts } from "../services/alert.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";

export const dashboardSummary = catchAsync(async (req, res) => {
  console.log("=== CONTROLLER INPUT ===");
  console.log("req.query.dateRange:", req.query.dateRange);
  console.log("Full req.query:", req.query);
  
  // Auto-generate alerts to ensure dashboard and alerts are in sync
  await generateAllProductAlerts();
  
  const data = await getDashboardSummary(req.query);
  return sendResponse(res, 200, "Dashboard summary fetched successfully", data);
});
