import { prisma } from "../config/prisma.js";
import pkg from "@prisma/client";
const { Prisma } = pkg;
import { AppError } from "../utils/app-error.js";
import { getStockStatus, getAlertTypeForStockStatus, getAlertSeverityForStockStatus, generateAlertMessage, needsAlert } from "../utils/stock-classification.js";

/**
 * Generate stock alerts for a product
 * @param {Object} product - Product object with stock information
 * @param {number} product.id - Product ID
 * @param {string} product.name - Product name
 * @param {number} product.currentStock - Current stock level
 * @param {number} product.reorderLevel - Reorder level threshold
 * @param {number} [product.avgDailySales] - Average daily sales for demand spike detection
 */
export const generateStockAlerts = async (product) => {
  const { id, name, currentStock = 0, reorderLevel = 10, avgDailySales = 0 } = product;
  try {
    // Validate input
    if (currentStock === null || currentStock === undefined || currentStock < 0) {
      console.warn(`Invalid stock value for product ${id}: ${currentStock}`);
      return;
    }

    // Use unified stock classification
    const stockStatus = getStockStatus(currentStock, reorderLevel);
    
    // Generate alert only if needed based on stock status
    if (needsAlert(currentStock, reorderLevel)) {
      const alertType = getAlertTypeForStockStatus(stockStatus);
      const alertSeverity = getAlertSeverityForStockStatus(stockStatus);
      const alertMessage = generateAlertMessage(name, stockStatus, currentStock, reorderLevel);
      
      await createAlertOnce(id, alertType, alertSeverity, alertMessage);
    }

    // DEMAND_SPIKE: If daily sales exceed average by 50%
    if (avgDailySales > 0 && currentStock > 0) {
      // This would be calculated from recent sales data
      // For now, we'll skip demand spike detection as it requires sales history analysis
      // TODO: Implement demand spike detection based on recent sales trends
    }
  } catch (error) {
    console.error(`Failed to generate alerts for product ${id}:`, error);
    throw new AppError("Failed to generate stock alerts", 500);
  }
};

/**
 * Create an alert only if no unresolved alert of the same type exists for the product
 * @param {number} productId - Product ID
 * @param {string} type - Alert type
 * @param {string} severity - Alert severity
 * @param {string} message - Alert message
 */
export const createAlertOnce = async (productId, type, severity, message) => {
  try {
    // Check if alert exists for this product and type
    const existingAlert = await prisma.alert.findFirst({
      where: {
        productId,
        type
      }
    });

    if (existingAlert) {
      // Skip if alert is ignored
      if (existingAlert.ignored) {
        console.log(`Alert ignored for product ${productId}, type: ${type}`);
        return existingAlert;
      }

      // Update existing alert
      const updatedAlert = await prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          message,
          severity,
          isResolved: false,
          updatedAt: new Date()
        }
      });
      console.log(`Updated ${type} alert for product ${productId}: ${message}`);
      return updatedAlert;
    } else {
      // Create new alert
      const newAlert = await prisma.alert.create({
        data: {
          productId,
          type,
          severity,
          message
        }
      });
      console.log(`Created ${type} alert for product ${productId}: ${message}`);
      return newAlert;
    }
  } catch (error) {
    console.error(`Failed to create alert for product ${productId}:`, error);
    throw new AppError("Failed to create alert", 500);
  }
};

/**
 * Auto-resolve alerts when stock conditions improve
 * @param {number} productId - Product ID
 * @param {number} currentStock - Current stock level
 * @param {number} reorderLevel - Reorder level threshold
 */
export const autoResolveAlerts = async (productId, currentStock, reorderLevel = 10) => {
  try {
    const alertsToResolve = [];

    // Get all unresolved alerts for this product
    const unresolvedAlerts = await prisma.alert.findMany({
      where: {
        productId,
        isResolved: false
      }
    });

    // Auto-resolve based on current stock and unified classification
    const newStockStatus = getStockStatus(currentStock, reorderLevel);
    
    for (const alert of unresolvedAlerts) {
      let shouldResolve = false;

      switch (alert.type) {
        case 'OUT_OF_STOCK':
          // Resolve if stock status is no longer OUT_OF_STOCK
          shouldResolve = newStockStatus !== 'OUT_OF_STOCK';
          break;
        case 'CRITICAL':
          // Resolve if stock status is no longer CRITICAL
          shouldResolve = newStockStatus !== 'CRITICAL';
          break;
        case 'LOW_STOCK':
          // Resolve if stock status is no longer LOW_STOCK
          shouldResolve = newStockStatus !== 'LOW_STOCK';
          break;
        case 'DEMAND_SPIKE':
          // Demand spike alerts don't auto-resolve based on stock
          shouldResolve = false;
          break;
      }

      if (shouldResolve) {
        alertsToResolve.push(alert.id);
      }
    }

    // Mark alerts as resolved
    if (alertsToResolve.length > 0) {
      await prisma.alert.updateMany({
        where: {
          id: { in: alertsToResolve }
        },
        data: {
          isResolved: true,
          updatedAt: new Date()
        }
      });
      console.log(`Auto-resolved ${alertsToResolve.length} alerts for product ${productId}:`, {
        resolvedTypes: alertsToResolve.length,
        newStock: currentStock
      });
    }
  } catch (error) {
    console.error(`Failed to auto-resolve alerts for product ${productId}:`, error);
    throw new AppError("Failed to auto-resolve alerts", 500);
  }
};

/**
 * Get all alerts with filtering options
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - Get only unresolved alerts
 * @param {string} options.type - Filter by alert type
 * @param {string} options.severity - Filter by severity
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset results
 */
export const getAlerts = async (options = {}) => {
  const {
    activeOnly = false,
    type,
    severity,
    limit = 50,
    offset = 0
  } = options;

  try {
    const where = {};

    if (activeOnly) {
      where.isResolved = false;
      where.ignored = false;
    }

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            stockQuantity: true,
            reorderLevel: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' }, // HIGH first
        { createdAt: 'desc' }  // Most recent first
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.alert.count({ where });

    return {
      alerts,
      total,
      hasMore: offset + alerts.length < total
    };
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    throw new AppError("Failed to fetch alerts", 500);
  }
};

/**
 * Resolve an alert
 * @param {number} alertId - Alert ID
 */
export const resolveAlert = async (alertId) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(alertId) }
    });

    if (!alert) {
      throw new AppError("Alert not found", 404);
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: parseInt(alertId) },
      data: {
        isResolved: true,
        updatedAt: new Date()
      }
    });

    return updatedAlert;
  } catch (error) {
    throw new AppError("Failed to resolve alert", 500);
  }
};

/**
 * Ignore an alert (mark as resolved with ignored status)
 * @param {number} alertId - Alert ID
 */
export const ignoreAlert = async (alertId) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(alertId) }
    });

    if (!alert) {
      throw new AppError("Alert not found", 404);
    }

    // Mark as ignored and resolved
    const updatedAlert = await prisma.alert.update({
      where: { id: parseInt(alertId) },
      data: {
        ignored: true,
        isResolved: true,
        updatedAt: new Date()
      }
    });

    return updatedAlert;
  } catch (error) {
    throw new AppError("Failed to ignore alert", 500);
  }
};

/**
 * Generate alerts for all products
 * Useful for cron jobs or bulk operations
 */
export const generateAllProductAlerts = async () => {
  try {
    // Get all products with their inventory
    const products = await prisma.product.findMany({
      include: {
        inventory: true
      }
    });

    console.log(`Generating alerts for ${products.length} products...`);

    for (const product of products) {
      const currentStock = product.inventory?.quantity || product.stockQuantity || 0;
      const reorderLevel = product.reorderLevel || 10;
      const stockStatus = getStockStatus(currentStock, reorderLevel);

      // Skip normal stock - no alert needed
      if (stockStatus === 'NORMAL') continue;

      // Check if alert already exists and is active
      const existingAlert = await prisma.alert.findFirst({
        where: {
          productId: product.id,
          type: stockStatus,
          isResolved: false,
          ignored: false
        }
      });

      // Create alert if it doesn't exist
      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            productId: product.id,
            type: stockStatus,
            severity: stockStatus === 'LOW_STOCK' ? 'MEDIUM' : 'HIGH',
            message: generateAlertMessage(product.name, stockStatus, currentStock, reorderLevel),
            ignored: false
          }
        });
      }
    }

    console.log("Alert generation completed");
  } catch (error) {
    console.error("Failed to generate all product alerts:", error);
    throw new AppError("Failed to generate product alerts", 500);
  }
};

/**
 * Get alert statistics for dashboard
 */
export const getAlertStats = async () => {
  try {
    const stats = await prisma.alert.groupBy({
      by: ['type', 'severity', 'isResolved'],
      _count: {
        id: true
      }
    });

    // Get ignored alerts
    const ignoredAlerts = await prisma.alert.count({
      where: {
        ignored: true
      }
    });

    const result = {
      total: 0,
      active: 0,
      resolved: 0,
      ignored: ignoredAlerts,
      byType: {},
      bySeverity: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      }
    };

    stats.forEach(stat => {
      const count = stat._count.id;
      result.total += count;

      if (stat.isResolved) {
        result.resolved += count;
      } else {
        result.active += count;
      }

      // By type
      if (!result.byType[stat.type]) {
        result.byType[stat.type] = { active: 0, resolved: 0 };
      }
      if (stat.isResolved) {
        result.byType[stat.type].resolved += count;
      } else {
        result.byType[stat.type].active += count;
      }

      // By severity (only active alerts)
      if (!stat.isResolved) {
        result.bySeverity[stat.severity] += count;
      }
    });

    return result;
  } catch (error) {
    console.error("Failed to get alert statistics:", error);
    throw new AppError("Failed to get alert statistics", 500);
  }
};

/**
 * Clean up invalid alerts that don't match current stock reality
 * This removes duplicates and incorrect classifications
 */
export const cleanupInvalidAlerts = async () => {
  try {
    console.log("Starting alert cleanup...");
    
    // Simple test - just return count for now
    const unresolvedAlerts = await prisma.alert.findMany({
      where: {
        isResolved: false
      }
    });
    
    console.log(`Found ${unresolvedAlerts.length} unresolved alerts`);
    return unresolvedAlerts.length;
  } catch (error) {
    console.error("Failed to cleanup invalid alerts:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new AppError("Failed to cleanup invalid alerts", 500);
  }
};

export const cleanupDuplicateAlerts = async () => {
  try {
    console.log("Starting duplicate alert cleanup...");
    
    // Find all products with multiple alerts of the same type
    const duplicateAlertGroups = await prisma.alert.groupBy({
      by: ['productId', 'type'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });

    let cleanedCount = 0;

    for (const group of duplicateAlertGroups) {
      // Get all alerts for this product and type, ordered by creation date (newest first)
      const alerts = await prisma.alert.findMany({
        where: {
          productId: group.productId,
          type: group.type
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Keep the newest alert, remove the rest
      if (alerts.length > 1) {
        const alertsToDelete = alerts.slice(1); // All except the first (newest)
        
        await prisma.alert.deleteMany({
          where: {
            id: {
              in: alertsToDelete.map(alert => alert.id)
            }
          }
        });

        cleanedCount += alertsToDelete.length;
      }
    }

    console.log(`Duplicate alert cleanup completed. Removed ${cleanedCount} duplicate alerts`);
    return cleanedCount;
  } catch (error) {
    console.error("Error during duplicate alert cleanup:", error);
    throw new AppError("Failed to cleanup duplicate alerts", 500);
  }
};
