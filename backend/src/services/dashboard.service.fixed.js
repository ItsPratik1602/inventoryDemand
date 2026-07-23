/**
 * Fixed Dashboard Service with proper timezone handling
 */

import { getDateRangeUTC, getDateRangeLocal, testTimezoneHandling } from "../utils/date-filter.js";
import { prisma } from "../config/prisma.js";

/**
 * Get dashboard summary with fixed date filtering
 * @param {Object} query - Query parameters including dateRange
 * @returns {Object} Dashboard data
 */
export const getDashboardSummaryFixed = async (query = {}) => {
  console.log('=== FIXED DASHBOARD SERVICE ===');
  console.log('Query parameters:', query);
  
  // Test timezone handling (remove in production)
  if (query.debugTimezone) {
    testTimezoneHandling();
  }
  
  // Choose your timezone strategy:
  // Option 1: UTC-based filtering (recommended for most cases)
  const dateRange = getDateRangeUTC(query.dateRange);
  
  // Option 2: Local timezone filtering (if business requires local time)
  // const dateRange = getDateRangeLocal(query.dateRange);
  
  console.log('Final date range for Prisma:', dateRange);
  
  try {
    // Get all users (global count)
    const allUsers = await prisma.user.findMany({
      select: { id: true, role: true }
    });

    // Build order filter
    const orderFilter = {
      status: { not: "CANCELLED" }
    };
    
    // Add date range filter if specified
    if (Object.keys(dateRange).length > 0) {
      orderFilter.createdAt = dateRange;
    }

    console.log('Order filter for Prisma:', JSON.stringify(orderFilter, null, 2));

    // Get orders with date filtering applied at database level
    const orders = await prisma.order.findMany({
      where: orderFilter,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Orders found: ${orders.length}`);

    // Calculate metrics
    const totalSalesAmount = orders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    const totalOrders = orders.length;

    // Generate sales trend data
    const salesTrend = generateSalesTrend(orders);

    // Get top selling products
    const topSellingProducts = getTopSellingProducts(orders);

    // Get product counts (global, not filtered by date)
    const productStats = await getProductStats();

    return {
      counts: {
        users: allUsers.length,
        products: productStats.total,
        totalSales: totalSalesAmount,
        totalOrders,
        outOfStockCount: productStats.outOfStockCount,
        criticalCount: productStats.criticalCount,
        lowStockCount: productStats.lowStockCount
      },
      salesTrend,
      topSellingProducts,
      orders: orders.slice(0, 10), // Recent orders for display
      dateRange: query.dateRange || 'all',
      debugInfo: {
        dateFilter: dateRange,
        ordersFound: orders.length,
        timezone: new Date().getTimezoneOffset()
      }
    };

  } catch (error) {
    console.error('Dashboard service error:', error);
    throw error;
  }
};

/**
 * Generate sales trend data from orders
 * @param {Array} orders - Array of orders
 * @returns {Array} Sales trend data
 */
const generateSalesTrend = (orders) => {
  const salesByDate = new Map();

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    // Use UTC date for consistency
    const dateKey = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD
    
    const currentAmount = salesByDate.get(dateKey) || 0;
    salesByDate.set(dateKey, currentAmount + Number(order.totalAmount));
  });

  return Array.from(salesByDate.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Get top selling products from orders
 * @param {Array} orders - Array of orders
 * @returns {Array} Top selling products
 */
const getTopSellingProducts = (orders) => {
  const productSales = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const currentSales = productSales.get(item.product.id) || 0;
      productSales.set(item.product.id, currentSales + item.quantity);
    });
  });

  return Array.from(productSales.entries())
    .map(([productId, totalSold]) => ({
      id: productId,
      totalSold
    }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);
};

/**
 * Get product statistics
 * @returns {Object} Product stats
 */
const getProductStats = async () => {
  const products = await prisma.product.findMany({
    include: {
      inventory: true
    }
  });

  let outOfStockCount = 0;
  let criticalCount = 0;
  let lowStockCount = 0;

  products.forEach(product => {
    const stock = product.inventory?.quantity || product.stockQuantity || 0;
    
    if (stock === 0) {
      outOfStockCount++;
    } else if (stock <= 2) {
      criticalCount++;
    } else if (stock <= 10) {
      lowStockCount++;
    }
  });

  return {
    total: products.length,
    outOfStockCount,
    criticalCount,
    lowStockCount
  };
};

/**
 * Test function to verify today filter works
 */
export const testTodayFilter = async () => {
  console.log('=== TESTING TODAY FILTER ===');
  
  try {
    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        userId: 1, // Assuming user exists
        totalAmount: 99.99,
        status: 'PENDING'
      }
    });
    
    console.log('Test order created:', testOrder);
    console.log('Order createdAt:', testOrder.createdAt.toISOString());
    
    // Test today filter
    const todayData = await getDashboardSummaryFixed({ dateRange: 'today' });
    console.log('Today filter results:', {
      ordersFound: todayData.orders.length,
      totalOrders: todayData.counts.totalOrders,
      totalSales: todayData.counts.totalSales
    });
    
    // Clean up test order
    await prisma.order.delete({ where: { id: testOrder.id } });
    
    return todayData;
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};
