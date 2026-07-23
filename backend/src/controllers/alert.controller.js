import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import {
  getAlerts,
  getAlertStats,
  resolveAlert,
  generateAllProductAlerts,
  cleanupInvalidAlerts
} from "../services/alert.service.js";

export const getListAlerts = catchAsync(async (req, res) => {
  const { activeOnly, type, severity, limit = 50, offset = 0 } = req.query;
  
  const data = await getAlerts({
    activeOnly: activeOnly === 'true',
    type,
    severity,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return sendResponse(res, 200, "Alerts fetched successfully", data);
});

export const getAlertStatsController = catchAsync(async (_req, res) => {
  const stats = await getAlertStats();
  return sendResponse(res, 200, "Alert statistics fetched successfully", stats);
});

export const resolveAlertController = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const alert = await resolveAlert(parseInt(id));
  return sendResponse(res, 200, "Alert resolved successfully", alert);
});

export const ignoreAlertController = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const alert = await ignoreAlert(parseInt(id));
  return sendResponse(res, 200, "Alert ignored successfully", alert);
});

export const generateAlertsController = catchAsync(async (_req, res) => {
  await generateAllProductAlerts();
  return sendResponse(res, 200, "Alert generation completed successfully");
});

export const cleanupAlertsController = catchAsync(async (_req, res) => {
  try {
    const cleanedCount = await cleanupInvalidAlerts();
    return sendResponse(res, 200, "Alert cleanup completed", { cleanedCount });
  } catch (error) {
    return sendResponse(res, 500, "Failed to cleanup alerts");
  }
});
