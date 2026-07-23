import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { ensureProduct } from "./product.service.js";
import { adjustInventoryForSale } from "./inventory.service.js";

const salesSortFieldMap = {
  createdAt: "createdAt",
  quantity: "quantity",
  productName: "productName"
};

const normalizeSale = (sale) => ({
  id: sale.id,
  productId: sale.productId,
  quantity: sale.quantity,
  createdAt: sale.createdAt,
  product: {
    ...sale.product,
    price: Number(sale.product.price)
  }
});

export const getSales = async ({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  order = "desc",
  quantityFilter = "ALL"
} = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safeSortBy = salesSortFieldMap[sortBy] || "createdAt";
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
      quantityFilter === "BULK"
        ? {
            quantity: {
              gte: 10
            }
          }
        : {},
      quantityFilter === "STANDARD"
        ? {
            quantity: {
              lt: 10
            }
          }
        : {}
    ]
  };

  const [total, sales] = await Promise.all([
    prisma.sales.count({ where }),
    prisma.sales.findMany({
      where,
      orderBy: { createdAt: safeOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        product: true
      }
    })
  ]);

  return {
    items: sales.map(normalizeSale),
    page: safePage,
    limit: safeLimit,
    total
  };
};

export const getSalesForExport = async (query = {}, ids = []) => {
  const result = await getSales({
    ...query,
    page: 1,
    limit: 100000
  });

  const rows = ids.length
    ? result.items.filter((sale) => ids.includes(sale.id))
    : result.items;

  return rows;
};

export const getSalesHistory = async () => {
  const sales = await prisma.sales.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: true
    }
  });

  return sales.map(normalizeSale);
};

export const createSale = async ({ productId, quantity }) => {
  await ensureProduct(productId);

  return prisma.$transaction(async (tx) => {
    await adjustInventoryForSale(tx, productId, quantity);

    const sale = await tx.sales.create({
      data: {
        productId,
        quantity
      },
      include: {
        product: true
      }
    });

    return {
      ...sale,
      product: {
        ...sale.product,
        price: Number(sale.product.price)
      }
    };
  });
};

export const deleteSale = async (id) => {
  const sale = await prisma.sales.findUnique({ where: { id } });

  if (!sale) {
    throw new AppError("Sale not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { productId: sale.productId },
      data: {
        quantity: {
          increment: sale.quantity
        }
      }
    });

    await tx.product.update({
      where: { id: sale.productId },
      data: {
        stockQuantity: {
          increment: sale.quantity
        }
      }
    });

    await tx.sales.delete({
      where: { id }
    });
  });
};
