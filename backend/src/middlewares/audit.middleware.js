import { createAuditLog } from "../services/audit.service.js";

export const logAction = (action, entityType) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to intercept successful responses
    res.json = function(data) {
      // Only log on successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const entityId = req.params.id || (req.body?.id) || null;
        
        // Extract relevant details from request
        const details = {
          method: req.method,
          url: req.originalUrl,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestBody: req.body
        };
        
        // Create audit log asynchronously (don't wait for it)
        createAuditLog(userId, action, entityType, entityId, details).catch(error => {
          console.error('Failed to create audit log:', error);
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Helper function to manually log actions
export const logAuditAction = async (userId, action, entityType, entityId, metadata = {}) => {
  try {
    await createAuditLog(userId, action, entityType, entityId, {
      ...metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to create manual audit log:', error);
  }
};
