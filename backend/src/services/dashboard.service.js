import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { normalizePagination } from "../utils/pagination.js";
import { getStockStatus } from "../utils/stock-classification.js";
import { calculateMovingAverage } from "./product.service.js";

const LOW_STOCK_THRESHOLD = 10;

// Reusable date filter function
const getDateRange = (range) => {
  if (!range || range === 'all') {
    return {};
  }

  // Always work with UTC dates to match PostgreSQL storage
  const now = new Date();
  const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  
  console.log("=== FIXED Date Filter ===");
  console.log("Range:", range);
  console.log("Local now:", now.toString());
  console.log("UTC now:", utcNow.toISOString());
  console.log("Timezone offset:", now.getTimezoneOffset(), "minutes");
  
  switch (range) {
    case 'today':
      // Get start of today in UTC
      const startOfTodayUTC = new Date(utcNow);
      startOfTodayUTC.setUTCHours(0, 0, 0, 0);
      
      // Get end of today in UTC
      const endOfTodayUTC = new Date(utcNow);
      endOfTodayUTC.setUTCHours(23, 59, 59, 999);
      
      console.log("Today UTC filter:", {
        gte: startOfTodayUTC.toISOString(),
        lte: endOfTodayUTC.toISOString()
      });
      
      return { 
        gte: startOfTodayUTC, 
        lte: endOfTodayUTC 
      };
    
    case 'last7':
      const sevenDaysAgoUTC = new Date(utcNow);
      sevenDaysAgoUTC.setUTCDate(sevenDaysAgoUTC.getUTCDate() - 7);
      sevenDaysAgoUTC.setUTCHours(0, 0, 0, 0);
      
      console.log("Last 7 days UTC filter:", {
        gte: sevenDaysAgoUTC.toISOString()
      });
      
      return { gte: sevenDaysAgoUTC };
    
    case 'last30':
      const thirtyDaysAgoUTC = new Date(utcNow);
      thirtyDaysAgoUTC.setUTCDate(thirtyDaysAgoUTC.getUTCDate() - 30);
      thirtyDaysAgoUTC.setUTCHours(0, 0, 0, 0);
      
      console.log("Last 30 days UTC filter:", {
        gte: thirtyDaysAgoUTC.toISOString()
      });
      
      return { gte: thirtyDaysAgoUTC };
    
    default:
      console.log("Unknown range:", range, "returning empty filter");
      return {};
  }
};

export const getDashboardSummary = async (query = {}) => {
  const dateRange = query.dateRange || 'all';
  
  // Debug logging
  console.log("=== Dashboard Service ===");
  console.log("Date Range:", dateRange);
  console.log("Query:", query);
  
  // Get reusable date filter
  const dateFilter = getDateRange(dateRange);
  console.log("Final dateFilter:", dateFilter);
  
  // Apply date filter to orders (fixed timezone handling)
  const actualFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
  console.log("ACTUAL FILTER APPLIED:", actualFilter);
  
  // Separate global system metrics (no date filter) from business metrics (with date filter)
  const [allProducts, allInventory, allUsers, allOrders] = await Promise.all([
    prisma.product.findMany({
      include: {
        inventory: true
      }
    }),
    prisma.inventory.findMany(), // Inventory table doesn't have createdAt field
    prisma.user.findMany(),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  ]);

  // Filtered business metrics (with date filter)
  const [products, inventory, users, orders] = await Promise.all([
    prisma.product.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      include: {
        inventory: true
      }
    }),
    prisma.inventory.findMany(), // Inventory table doesn't have createdAt field
    prisma.user.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    }),
    prisma.order.findMany({
      where: actualFilter, // Use the actual filter with force test
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  ]);

  // Global system metrics (no date filtering)
  const totalInventory = allInventory.reduce((sum, item) => sum + item.quantity, 0);
  
  // Unified stock classification using single source of truth
  const stockCounts = allProducts.reduce((counts, product) => {
    const currentStock = product.inventory?.quantity ?? 0;
    const reorderLevel = product.reorderLevel || LOW_STOCK_THRESHOLD;
    const stockStatus = getStockStatus(currentStock, reorderLevel);
    
    switch (stockStatus) {
      case 'OUT_OF_STOCK':
        counts.outOfStockCount++;
        break;
      case 'CRITICAL':
        counts.criticalCount++;
        break;
      case 'LOW_STOCK':
        counts.lowStockCount++;
        break;
      case 'NORMAL':
        counts.normalCount++;
        break;
    }
    
    return counts;
  }, { outOfStockCount: 0, criticalCount: 0, lowStockCount: 0, normalCount: 0 });

  const { outOfStockCount, criticalCount, lowStockCount } = stockCounts;
  
  // Calculate order metrics from Orders table (single source of truth)
  const validOrders = orders.filter(order => order.status !== "CANCELLED");
  const totalOrders = validOrders.length;
  const totalSalesAmount = validOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  // Debug: Verify filtering worked
  console.log("=== ORDERS VERIFICATION ===");
  console.log("Total orders returned:", orders.length);
  console.log("Valid orders (non-cancelled):", validOrders.length);
  console.log("Date filter applied:", Object.keys(dateFilter).length > 0 ? dateFilter : 'none');
  console.log("Date range:", dateRange);
  
  // Debug: Show actual order dates
  console.log("=== ORDER DATES ANALYSIS ===");
  orders.slice(0, 5).forEach(order => {
    console.log("Order ID:", order.id, "Created:", order.createdAt, "Status:", order.status);
  });
  
  
  // Debug: Log filtered counts
  console.log("Filtered counts:", {
    products: products.length,
    inventory: inventory.length, // Not filtered - no createdAt field
    users: users.length,
    orders: orders.length
  });
    
  // Sales by date from orders - use consistent date filtering
  const salesByDate = validOrders.reduce((accumulator, order) => {
    // Format date as YYYY-MM-DD for consistent grouping
    const orderDate = new Date(order.createdAt);
    const dateKey = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD
    accumulator.set(dateKey, (accumulator.get(dateKey) || 0) + Number(order.totalAmount));
    return accumulator;
  }, new Map());

  const salesTrend = Array.from(salesByDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, quantity]) => ({ date, quantity }));

  // Debug sales trend
  console.log("Sales by date (", dateRange, "):", Object.fromEntries(salesByDate));
  console.log("Sales trend (", dateRange, "):", salesTrend);
  
  
  // Calculate top selling products from order items - use consistent date filtering
  const productSales = new Map();
  
  // Debug: Check validOrders and items
  console.log("=== TOP SELLING PRODUCTS DEBUG ===");
  console.log("Valid orders count:", validOrders.length);
  console.log("Valid orders:", validOrders.map(o => ({ id: o.id, items: o.items.length })));
  
  validOrders.forEach(order => {
    console.log("Processing order:", order.id, "with", order.items.length, "items");
    order.items.forEach(item => {
      console.log("Processing item:", { productId: item.productId, quantity: item.quantity });
      const current = productSales.get(item.productId) || 0;
      productSales.set(item.productId, current + item.quantity);
    });
  });
  
  console.log("Product sales map:", Array.from(productSales.entries()));
  
  const topSellingProducts = products
    .map((product) => ({
      id: product.id,
      name: product.name,
      totalSold: productSales.get(product.id) || 0
    }))
    .sort((left, right) => right.totalSold - left.totalSold)
    .slice(0, 5);
  
  console.log("Top selling products:", topSellingProducts);

  // Unified stock classification for items using single source of truth
  const outOfStockItems = [];
  const criticalItems = [];
  const lowStockItems = [];

  products.forEach(product => {
    const currentStock = product.inventory?.quantity ?? 0;
    const reorderLevel = product.reorderLevel || LOW_STOCK_THRESHOLD;
    const stockStatus = getStockStatus(currentStock, reorderLevel);

    const item = {
      id: product.id,
      name: product.name,
      currentStock,
      reorderLevel
    };

    if (stockStatus === 'OUT_OF_STOCK') outOfStockItems.push(item);
    else if (stockStatus === 'CRITICAL') criticalItems.push(item);
    else if (stockStatus === 'LOW_STOCK') lowStockItems.push(item);
  });

  // Sort arrays for display
  outOfStockItems.sort((a, b) => a.currentStock - b.currentStock);
  criticalItems.sort((a, b) => a.currentStock - b.currentStock);
  lowStockItems.sort((a, b) => a.currentStock - b.currentStock);

  // Critical demand alerts based on demand prediction (separate from stock level critical)
  const criticalDemandAlerts = products
    .map((product) => {
      const currentStock = product.inventory?.quantity ?? 0;
      const demandPrediction = calculateMovingAverage(product.sales || []);
      return {
        id: product.id,
        name: product.name,
        currentStock,
        demandPrediction,
        riskLevel: demandPrediction > currentStock ? (demandPrediction > currentStock * 1.5 ? 'CRITICAL' : 'HIGH') : 'NORMAL'
      };
    })
    .filter(product => product.riskLevel !== 'NORMAL')
    .sort((left, right) => (right.demandPrediction - right.currentStock) - (left.demandPrediction - left.currentStock))
    .slice(0, 8);

  // Check if there's any data for the selected period
  const hasDataForPeriod = validOrders.length > 0;

  // Debug: Show separation of global vs filtered metrics
  console.log("=== METRICS SEPARATION ===");
  console.log("Has data for period:", hasDataForPeriod);
  console.log("Global products count:", allProducts.length);
  console.log("Filtered products count:", products.length);
  console.log("Global users count:", allUsers.length);
  console.log("Filtered orders count:", validOrders.length);

  return {
    counts: {
      users: allUsers.length, // Global - not filtered
      products: hasDataForPeriod ? products.length : allProducts.length, // Show filtered if data exists, else global
      totalSales: totalSalesAmount, // Business metric - filtered
      lowStockCount, // Global - not filtered  
      outOfStockCount, // Global - not filtered
      criticalCount, // Global - not filtered
      totalOrders, // Business metric - filtered
      // For compatibility
      inventoryUnits: totalInventory, // Global - not filtered
      lowStockAlerts: lowStockCount // Global - not filtered
    },
    salesTrend: hasDataForPeriod ? salesTrend : [], // Business metric - filtered
    topSellingProducts: hasDataForPeriod ? topSellingProducts : [], // Business metric - filtered
    // Full arrays for accurate counts
    lowStockItems, // Global - not filtered (full array)
    outOfStockItems, // Global - not filtered (full array)
    criticalItems, // Global - not filtered (full array)
    // Preview arrays for UI display (limited to 5 items)
    lowStockItemsPreview: lowStockItems.slice(0, 5),
    outOfStockItemsPreview: outOfStockItems.slice(0, 5),
    criticalItemsPreview: criticalItems.slice(0, 5),
    criticalDemandAlerts // Global - not filtered
  };
};

const buildAlerts = async () => {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        include: {
          category: true,
          sales: {
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  return inventory
    .filter((item) => item.quantity < (item.product.reorderLevel || LOW_STOCK_THRESHOLD))
    .map((item) => ({
      inventoryId: item.id,
      productId: item.productId,
      productName: item.product.name,
      category: item.product.category?.name || "Uncategorized",
      quantity: item.quantity,
      threshold: item.product.reorderLevel || LOW_STOCK_THRESHOLD,
      demandPrediction: calculateMovingAverage(item.product.sales || [])
    }));
};

const sortAlerts = (alerts, sortBy, order) => {
  const safeOrder = order === "asc" ? 1 : -1;

  return [...alerts].sort((left, right) => {
    if (sortBy === "productName") {
      return left.productName.localeCompare(right.productName) * safeOrder;
    }

    if (sortBy === "threshold") {
      return (left.threshold - right.threshold) * safeOrder;
    }

    if (sortBy === "demandPrediction") {
      return (left.demandPrediction - right.demandPrediction) * safeOrder;
    }

    return (left.quantity - right.quantity) * safeOrder;
  });
};

export const getAlerts = async ({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "quantity",
  order = "asc",
  stockFilter = "ALL"
} = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const trimmedSearch = String(search).trim().toLowerCase();

  const filteredAlerts = (await buildAlerts()).filter((alert) => {
    if (
      trimmedSearch &&
      ![alert.productName, String(alert.quantity), String(alert.threshold)].some((value) =>
        value.toLowerCase().includes(trimmedSearch)
      )
    ) {
      return false;
    }

    if (stockFilter === "CRITICAL") {
      return alert.quantity <= Math.max(0, Math.floor(alert.threshold / 2));
    }

    if (stockFilter === "NEAR_THRESHOLD") {
      return alert.quantity > Math.max(0, Math.floor(alert.threshold / 2));
    }

    return true;
  });

  const sortedAlerts = sortAlerts(filteredAlerts, sortBy, order);
  const items = sortedAlerts.slice((safePage - 1) * safeLimit, safePage * safeLimit);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total: filteredAlerts.length
  };
};

export const getAlertsForExport = async (query = {}, ids = []) => {
  const result = await getAlerts({
    ...query,
    page: 1,
    limit: 100000
  });

  if (!ids.length) {
    return result.items;
  }

  return result.items.filter((alert) => ids.includes(alert.inventoryId));
};
