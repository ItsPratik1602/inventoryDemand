import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import {
  getAuditLogs as getAuditLogsService,
  createAuditLog as createAuditLogService
} from "../services/audit.service.js";

export const getAuditLogsController = catchAsync(async (req, res) => {
  try {
    const result = await getAuditLogsService(req.query);
    
    return sendResponse(res, 200, "Audit logs retrieved successfully", result);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});

export const createAuditLogController = catchAsync(async (req, res) => {
  const { action, entityType, entityId, details } = req.body;
  const userId = req.user?.id || null;

  if (!action || !entityType) {
    return sendResponse(res, 400, "Action and entityType are required");
  }

  try {
    const auditLog = await createAuditLogService(userId, action, entityType, entityId, {
      ...details,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return sendResponse(res, 201, "Audit log created successfully", auditLog);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
});
