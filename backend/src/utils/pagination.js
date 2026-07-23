/**
 * Pagination utilities
 * Provides consistent pagination logic across the application
 */

/**
 * Get pagination parameters for database queries
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Object} Pagination parameters with take and skip
 */
export const getPagination = (page = 1, limit = 10) => {
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;
  return { take, skip };
};

/**
 * Normalize pagination parameters with validation
 * @param {Object} query - Query parameters
 * @returns {Object} Normalized pagination parameters
 */
export const normalizePagination = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  
  return {
    page,
    limit,
    take: limit,
    skip: (page - 1) * limit
  };
};

/**
 * Calculate total pages based on total count and limit
 * @param {number} total - Total number of items
 * @param {number} limit - Items per page
 * @returns {number} Total pages
 */
export const getTotalPages = (total, limit) => {
  return Math.ceil(total / limit);
};

/**
 * Create pagination metadata for API responses
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
export const createPaginationMeta = (page, limit, total) => {
  const totalPages = getTotalPages(total, limit);
  
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null
  };
};
