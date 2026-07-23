/**
 * SINGLE SOURCE OF TRUTH for stock classification
 * Used across dashboard, alerts, product filters, and inventory management
 */

/**
 * Get stock status for a product
 * @param {number} currentStock - Current stock quantity
 * @param {number} reorderLevel - Reorder level threshold (default: 10)
 * @returns {string} Stock status: OUT_OF_STOCK, CRITICAL, LOW_STOCK, or NORMAL
 */
export const getStockStatus = (currentStock, reorderLevel = 10) => {
  const stock = Number(currentStock) || 0;
  const threshold = Number(reorderLevel) || 10;

  if (stock === 0) {
    return 'OUT_OF_STOCK';
  } else if (stock > 0 && stock <= 2) {
    return 'CRITICAL';
  } else if (stock > 2 && stock <= threshold) {
    return 'LOW_STOCK';
  } else {
    return 'NORMAL';
  }
};

/**
 * Get alert type for stock status
 * @param {string} stockStatus - Stock status from getStockStatus
 * @returns {string|null} Alert type or null if no alert needed
 */
export const getAlertTypeForStockStatus = (stockStatus) => {
  switch (stockStatus) {
    case 'OUT_OF_STOCK':
      return 'OUT_OF_STOCK';
    case 'CRITICAL':
      return 'CRITICAL';
    case 'LOW_STOCK':
      return 'LOW_STOCK';
    case 'NORMAL':
    default:
      return null; // No alert needed for normal stock
  }
};

/**
 * Get alert severity for stock status
 * @param {string} stockStatus - Stock status from getStockStatus
 * @returns {string|null} Alert severity or null if no alert needed
 */
export const getAlertSeverityForStockStatus = (stockStatus) => {
  switch (stockStatus) {
    case 'OUT_OF_STOCK':
      return 'HIGH';
    case 'CRITICAL':
      return 'HIGH';
    case 'LOW_STOCK':
      return 'MEDIUM';
    case 'NORMAL':
    default:
      return null; // No alert needed for normal stock
  }
};

/**
 * Check if product needs an alert based on stock status
 * @param {number} currentStock - Current stock quantity
 * @param {number} reorderLevel - Reorder level threshold
 * @returns {boolean} True if alert is needed
 */
export const needsAlert = (currentStock, reorderLevel = 10) => {
  const stockStatus = getStockStatus(currentStock, reorderLevel);
  return getAlertTypeForStockStatus(stockStatus) !== null;
};

/**
 * Generate alert message for stock status
 * @param {string} productName - Product name
 * @param {string} stockStatus - Stock status from getStockStatus
 * @param {number} currentStock - Current stock quantity
 * @param {number} reorderLevel - Reorder level threshold
 * @returns {string} Alert message
 */
export const generateAlertMessage = (productName, stockStatus, currentStock, reorderLevel = 10) => {
  switch (stockStatus) {
    case 'OUT_OF_STOCK':
      return `${productName} is out of stock`;
    case 'CRITICAL':
      return `${productName} stock critically low (${currentStock} units)`;
    case 'LOW_STOCK':
      return `${productName} stock is low (${currentStock} units, reorder at ${reorderLevel})`;
    default:
      return '';
  }
};
