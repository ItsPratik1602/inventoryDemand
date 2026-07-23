import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseCsvObjects } from "../utils/import.js";
import { getStockStatus } from "../utils/stock-classification.js";

const formatProduct = (product) => {
  try {
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description
          }
        : null,
      reorderLevel: product.reorderLevel,
      description: product.description,
      createdAt: product.createdAt,
      inventory: product.inventory || null,
      images: product.images || [],
      demandPrediction: product.sales && Array.isArray(product.sales) ? calculateMovingAverage(product.sales) : null
    };
  } catch (error) {
    console.error('Error in formatProduct:', error);
    console.error('Product data:', product);
    throw error;
  }
};

const formatProductForPublic = (product) => {
  try {
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description
          }
        : null,
      reorderLevel: product.reorderLevel,
      description: product.description,
      createdAt: product.createdAt,
      inventory: product.inventory || null,
      images: product.images || []
    };
  } catch (error) {
    console.error('Error in formatProductForPublic:', error);
    console.error('Product data:', product);
    throw error;
  }
};

const productSortFieldMap = {
  createdAt: "createdAt",
  name: "name",
  price: "price",
  stock: "stockQuantity"
};

const ensureCategory = async (categoryId) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new AppError("Selected category does not exist", 400);
  }

  return category;
};

const ensureCategoryByName = async (name) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new AppError("Category is required", 400);
  }

  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: "insensitive"
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.category.create({
    data: {
      name: trimmedName
    }
  });
};

export const getProducts = async (userId, query = {}) => {
  // Get user to check role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const safeSortBy = productSortFieldMap[query.sortBy] || "createdAt";
  const safeOrder = query.order === "asc" ? "asc" : "desc";
  const trimmedSearch = String(query.search || "").trim();
  const categoryFilter = query.categoryFilter || "ALL";
  const stockStatus = query.stockStatus || "ALL";

  // Build where clause dynamically
  const whereConditions = [];
  
  // Ownership filter: STAFF can only see their own products, ADMIN can see all
  if (user?.role === "STAFF") {
    whereConditions.push({ createdBy: userId });
  }
  
  // Search filter
  if (trimmedSearch) {
    whereConditions.push({
      OR: [
        { name: { contains: trimmedSearch, mode: "insensitive" } },
        {
          category: {
            name: {
              contains: trimmedSearch,
              mode: "insensitive"
            }
          }
        }
      ]
    });
  }
  
  // Category filter
  if (categoryFilter !== "ALL" && categoryFilter !== "") {
    const categoryId = Number(categoryFilter);
    if (!isNaN(categoryId) && categoryId > 0) {
      whereConditions.push({ categoryId });
    }
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Build orderBy dynamically
  const orderBy = [{ [safeSortBy]: safeOrder }];
  
  console.log("FILTER:", JSON.stringify(where, null, 2));
  console.log("SORT:", JSON.stringify(orderBy, null, 2));

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        category: true,
        inventory: true,
        sales: {
          orderBy: { createdAt: "desc" }
        }
      }
    })
  ]);

  // Post-process for stock status filtering using unified classification
  let filteredProducts = products;
  if (stockStatus !== "ALL") {
    console.log("Filter:", stockStatus);
    
    filteredProducts = products.filter(product => {
      // Use inventory data as primary source, fallback to stockQuantity
      const currentStock = product.inventory?.quantity || product.stockQuantity || 0;
      const reorderLevel = product.reorderLevel || 10;
      const productStockStatus = getStockStatus(currentStock, reorderLevel);
      
      // Direct comparison with stock status constants
      return productStockStatus === stockStatus;
    });
    
    console.log(`Filtered ${products.length} products to ${filteredProducts.length} for status: ${stockStatus}`);
  }

  const result = {
    items: filteredProducts.map(formatProduct),
    total: stockStatus !== "ALL" ? filteredProducts.length : total,
    page: safePage,
    limit: safeLimit
  };

  console.log("ADMIN API RESPONSE:", {
    total: result.total,
    itemsCount: result.items.length,
    page: result.page,
    limit: result.limit,
    stockStatus,
    categoryFilter,
    search: trimmedSearch,
    safeSortBy,
    safeOrder
  });

  return result;
};

export const getPublicProducts = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    order = "desc",
    categoryFilter = "ALL",
    excludeOutOfStock = false
  } = query;

  const skip = (page - 1) * limit;

  // Build where clause dynamically
  const whereConditions = [];

  // Search filter
  if (search) {
    whereConditions.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          category: {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        }
      ]
    });
  }

  // Category filter - handle both category names and IDs
  if (categoryFilter !== "ALL" && categoryFilter !== "") {
    // Try to parse as number first (ID)
    const categoryId = Number(categoryFilter);
    if (!isNaN(categoryId) && categoryId > 0) {
      whereConditions.push({ categoryId });
    } else {
      // Treat as category name
      whereConditions.push({
        category: {
          name: categoryFilter
        }
      });
    }
  }

  // Out-of-stock filter (optional)
  if (excludeOutOfStock) {
    whereConditions.push({ stockQuantity: { gt: 0 } });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  console.log("PUBLIC FILTER:", JSON.stringify(where, null, 2));
  console.log("PUBLIC SORT:", JSON.stringify([{ [sortBy]: order }], null, 2));

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: true,
        images: true
      },
      orderBy: {
        [sortBy]: order
      },
      skip: Number(skip),
      take: Number(limit)
    }),
    prisma.product.count({
      where
    })
  ]);

  const result = {
    items: products.map(formatProductForPublic),
    total,
    page: Number(page),
    limit: Number(limit)
  };

  console.log("PUBLIC API RESPONSE:", {
    total: result.total,
    itemsCount: result.items.length,
    page: result.page,
    limit: result.limit,
    categoryFilter,
    search,
    sortBy,
    order,
    excludeOutOfStock
  });

  return result;
};

export const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return formatProduct(product);
};

export const getProductsForExport = async (userId, query = {}, ids = []) => {
  const result = await getProducts(userId, {
    ...query,
    page: 1,
    limit: 100000
  });

  return ids.length
    ? result.items.filter((product) => ids.includes(product.id))
    : result.items;
};

export const getProductRecords = async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      inventory: true,
      sales: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return products.map(formatProduct);
};

export const getProductOptions = async () => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true
    }
  });

  return products;
};

export const listCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description
  }));
};

export const getProductStats = async () => {
  const products = await prisma.product.findMany({
    include: {
      inventory: true
    }
  });

  const stats = products.reduce((acc, product) => {
    const stock = product.inventory?.quantity || product.stockQuantity || 0;
    const reorderLevel = product.reorderLevel || 10;
    const stockStatus = getStockStatus(stock, reorderLevel);
    
    acc.total++;
    
    if (stockStatus === 'OUT_OF_STOCK') {
      acc.outOfStock++;
    } else if (stockStatus === 'CRITICAL' || stockStatus === 'LOW_STOCK') {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    
    return acc;
  }, { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });

  return stats;
};

export const createProduct = async ({
  name,
  price,
  stockQuantity,
  categoryId,
  reorderLevel
}, userId) => {
  await ensureCategory(categoryId);

  const product = await prisma.product.create({
    data: {
      name,
      price,
      stockQuantity,
      reorderLevel,
      createdBy: userId,
      categoryId: categoryId,
      inventory: {
        create: {
          quantity: stockQuantity
        }
      }
    },
    include: {
      category: true,
      inventory: true,
      sales: true
    }
  });

  return formatProduct(product);
};

export const updateProduct = async (
  id,
  { name, price, stockQuantity, categoryId, reorderLevel },
  userId
) => {
  // Get user to check role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Get product to check ownership
  const existingProduct = await ensureProduct(id);
  
  // Enforce ownership: STAFF can only edit their own products
  if (user?.role === "STAFF" && existingProduct.createdBy !== userId) {
    throw new AppError("You can only edit your own products", 403);
  }
  
  await ensureCategory(categoryId);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      price,
      stockQuantity,
      reorderLevel,
      category: {
        connect: { id: categoryId }
      }
    },
    include: {
      category: true,
      inventory: true,
      sales: true
    }
  });

  await prisma.inventory.upsert({
    where: { productId: id },
    update: { quantity: stockQuantity },
    create: {
      productId: id,
      quantity: stockQuantity
    }
  });

  return formatProduct({
    ...product,
    inventory: {
      ...(product.inventory || {}),
      quantity: stockQuantity
    }
  });
};

export const deleteProduct = async (id, userId) => {
  // Get user to check role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Get product to check ownership
  const product = await ensureProduct(id);
  
  // Enforce ownership: STAFF can only delete their own products
  if (user?.role === "STAFF" && product.createdBy !== userId) {
    throw new AppError("You can only delete your own products", 403);
  }
  
  await prisma.product.delete({ where: { id } });
};

export const importProductsFromCsv = async ({ content }) => {
  const rows = parseCsvObjects(content);
  const requiredHeaders = ["name", "price", "stockQuantity", "category", "reorderLevel"];
  const headers = Object.keys(rows[0] || {});
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (!rows.length) {
    throw new AppError("CSV file is empty", 400);
  }

  if (missingHeaders.length) {
    throw new AppError(`Missing CSV columns: ${missingHeaders.join(", ")}`, 400);
  }

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    try {
      const name = row.name?.trim();
      const price = Number(row.price);
      const stockQuantity = Number(row.stockQuantity);
      const reorderLevel = Number(row.reorderLevel);
      const categoryName = row.category?.trim();

      if (!name || name.length < 2) {
        throw new AppError("Name must be at least 2 characters", 400);
      }

      if (!Number.isFinite(price) || price <= 0) {
        throw new AppError("Price must be greater than 0", 400);
      }

      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        throw new AppError("Stock quantity must be a non-negative integer", 400);
      }

      if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
        throw new AppError("Reorder level must be a non-negative integer", 400);
      }

      const category = await ensureCategoryByName(categoryName);
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive"
          }
        }
      });

      if (existingProduct) {
        await updateProduct(existingProduct.id, {
          name,
          price,
          stockQuantity,
          categoryId: category.id,
          reorderLevel
        });
      } else {
        await createProduct({
          name,
          price,
          stockQuantity,
          categoryId: category.id,
          reorderLevel
        });
      }

      success += 1;
    } catch (error) {
      failed += 1;
      errors.push({
        row: index + 2,
        message: error.message || "Unable to import row"
      });
    }
  }

  return {
    success,
    failed,
    errors
  };
};

export const ensureProduct = async (id) => {
  const product = await prisma.product.findUnique({ 
    where: { id },
    select: {
      id: true,
      name: true,
      price: true,
      stockQuantity: true,
      categoryId: true,
      reorderLevel: true,
      createdAt: true,
      createdBy: true
    }
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

function calculateMovingAverage(data = [], windowSize = 3) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const result = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const subset = data.slice(start, i + 1);

    const avg = subset.reduce((sum, val) => sum + (val || 0), 0) / subset.length;

    result.push(avg);
  }

  return result;
}

export const saveProductImages = async (productId, imageUrls) => {
  // First, delete existing images for this product
  await prisma.productImage.deleteMany({
    where: { productId: parseInt(productId) }
  });

  // Then create new image records
  const imageRecords = imageUrls.map((url, index) => ({
    productId: parseInt(productId),
    url: url,
    isPrimary: index === 0 // First image is primary
  }));

  const savedImages = await prisma.productImage.createMany({
    data: imageRecords
  });

  // Return the created images
  return await prisma.productImage.findMany({
    where: { productId: parseInt(productId) },
    orderBy: { createdAt: 'asc' }
  });
};

export const restockProduct = async (productId, quantity) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { inventory: true }
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!quantity || quantity <= 0) {
      throw new AppError("Quantity must be greater than 0", 400);
    }

    const currentStock = product.inventory?.quantity || product.stockQuantity || 0;
    const newStock = currentStock + quantity;

    // Update inventory or product stock
    if (product.inventory) {
      await prisma.inventory.update({
        where: { productId: parseInt(productId) },
        data: { quantity: newStock }
      });
    } else {
      await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { stockQuantity: newStock }
      });
    }

    // Auto-resolve related alerts
    await prisma.alert.updateMany({
      where: {
        productId: parseInt(productId),
        isResolved: false,
        type: { in: ['OUT_OF_STOCK', 'CRITICAL', 'LOW_STOCK'] }
      },
      data: {
        isResolved: true,
        updatedAt: new Date()
      }
    });

    return {
      productId: parseInt(productId),
      previousStock: currentStock,
      newStock,
      quantity,
      alertsResolved: true
    };
  } catch (error) {
    throw new AppError("Failed to restock product", 500);
  }
};

export { calculateMovingAverage };
