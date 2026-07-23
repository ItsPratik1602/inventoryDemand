import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { ensureProduct } from "./product.service.js";
import { parseCsvObjects } from "../utils/import.js";
import { generateStockAlerts } from "./alert.service.js";

const inventorySortFieldMap = {
  createdAt: "id",
  quantity: "quantity",
  productName: "productName"
};

const normalizeInventory = (item) => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
  product: {
    ...item.product,
    price: Number(item.product.price)
  }
});

const ensureUncategorizedCategory = async () => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: "Uncategorized",
        mode: "insensitive"
      }
    }
  });

  if (existingCategory) {
    return existingCategory;
  }

  return prisma.category.create({
    data: {
      name: "Uncategorized",
      description: "Default category created by inventory CSV import"
    }
  });
};

export const getInventory = async ({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  order = "desc",
  stockFilter = "ALL"
} = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safeSortBy = inventorySortFieldMap[sortBy] || "id";
  const safeOrder = order === "asc" ? "asc" : "desc";
  const trimmedSearch = String(search).trim();

  const where = {
    AND: [
      trimmedSearch
        ? {
            product: {
              name: {
                contains: trimmedSearch,
                mode: "insensitive"
              }
            }
          }
        : {},
      stockFilter === "OUT_OF_STOCK"
        ? {
            quantity: 0
          }
        : {},
      stockFilter === "IN_STOCK"
        ? {
            quantity: {
              gt: 0
            }
          }
        : {}
    ]
  };

  const [total, inventory] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where,
      orderBy: { id: safeOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })
  ]);

  const items = inventory.map(normalizeInventory);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total
  };
};

export const getInventoryForExport = async (query = {}, ids = []) => {
  const result = await getInventory({
    ...query,
    page: 1,
    limit: 100000
  });

  const rows = ids.length
    ? result.items.filter((item) => ids.includes(item.id))
    : result.items;

  return rows;
};

export const getInventorySnapshot = async () => {
  const inventory = await prisma.inventory.findMany({
    orderBy: { id: "desc" },
    include: {
      product: true
    }
  });

  return inventory.map(normalizeInventory);
};

export const upsertInventory = async ({ productId, quantity }) => {
  await ensureProduct(productId);

  const item = await prisma.$transaction(async (tx) => {
    const updatedInventory = await tx.inventory.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
      include: {
        product: true
      }
    });

    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: quantity }
    });

    return updatedInventory;
  });

  // Generate alerts after inventory update
  try {
    await generateStockAlerts({
      id: item.product.id,
      name: item.product.name,
      currentStock: quantity,
      reorderLevel: item.product.reorderLevel
    });

    // Note: Alerts are only resolved manually or via restock function
    // Auto-resolution is disabled to maintain alert consistency
  } catch (error) {
    console.error("Failed to generate alerts after inventory update:", error);
    // Don't fail the inventory update if alert generation fails
  }

  return {
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price)
    }
  };
};

export const importInventoryFromCsv = async ({ content }, currentUser) => {
  const rows = parseCsvObjects(content);
  const requiredHeaders = ["productName", "quantity"];
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
      const productName = row.productName?.trim();
      const quantity = Number(row.quantity);
      const price = row.price ? Number(row.price) : 0;
      const category = row.category?.trim();
      const reorderLevel = row.reorderLevel ? Number(row.reorderLevel) : 10;

      if (!productName) {
        throw new AppError("Product name is required", 400);
      }

      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new AppError("Quantity must be a non-negative integer", 400);
      }

      if (row.price && (isNaN(price) || price < 0)) {
        throw new AppError("Price must be a non-negative number", 400);
      }

      if (row.reorderLevel && (!Number.isInteger(reorderLevel) || reorderLevel < 0)) {
        throw new AppError("Reorder level must be a non-negative integer", 400);
      }

      let product = await prisma.product.findFirst({
        where: {
          name: {
            equals: productName,
            mode: "insensitive"
          }
        }
      });

      if (!product) {
        let categoryId;
        
        if (category) {
          // Find or create category
          let categoryRecord = await prisma.category.findFirst({
            where: {
              name: {
                equals: category,
                mode: "insensitive"
              }
            }
          });
          
          if (!categoryRecord) {
            categoryRecord = await prisma.category.create({
              data: {
                name: category,
                description: `Category created during inventory import`
              }
            });
          }
          
          categoryId = categoryRecord.id;
        } else {
          const uncategorizedCategory = await ensureUncategorizedCategory();
          categoryId = uncategorizedCategory.id;
        }

        product = await prisma.product.create({
          data: {
            name: productName,
            price,
            reorderLevel,
            stockQuantity: quantity,
            createdBy: currentUser.id,
            categoryId: categoryId,
            inventory: {
              create: {
                quantity
              }
            }
          }
        });
      } else {
        // Update existing product with optional fields if provided
        const updateData = {};
        if (row.price) updateData.price = price;
        if (row.reorderLevel) updateData.reorderLevel = reorderLevel;
        if (category) {
          let categoryRecord = await prisma.category.findFirst({
            where: {
              name: {
                equals: category,
                mode: "insensitive"
              }
            }
          });
          
          if (!categoryRecord) {
            categoryRecord = await prisma.category.create({
              data: {
                name: category,
                description: `Category created during inventory import`
              }
            });
          }
          
          updateData.categoryId = categoryRecord.id;
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data: updateData
          });
        }
        
        await upsertInventory({
          productId: product.id,
          quantity
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

export const adjustInventoryForSale = async (tx, productId, soldQuantity) => {
  const inventory = await tx.inventory.findUnique({ where: { productId } });

  if (!inventory) {
    throw new AppError("Inventory record not found for product", 400);
  }

  if (inventory.quantity < soldQuantity) {
    throw new AppError("Insufficient inventory for this sale", 400);
  }

  return tx.inventory.update({
    where: { productId },
    data: {
      quantity: inventory.quantity - soldQuantity
    }
  }).then(async (updatedInventory) => {
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: updatedInventory.quantity }
    });

    return updatedInventory;
  });
};

export const getLowStockProducts = async (threshold = 5) => {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      OR: [
        {
          inventory: {
            quantity: {
              lte: threshold
            }
          }
        },
        {
          stockQuantity: {
            lte: threshold
          }
        }
      ]
    },
    include: {
      inventory: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      {
        inventory: {
          quantity: 'asc'
        }
      },
      {
        stockQuantity: 'asc'
      }
    ]
  });

  return lowStockProducts.map(product => ({
    id: product.id,
    name: product.name,
    quantity: product.inventory?.quantity || product.stockQuantity,
    category: product.category,
    price: Number(product.price),
    reorderLevel: product.reorderLevel,
    hasInventoryRecord: !!product.inventory
  }));
};
