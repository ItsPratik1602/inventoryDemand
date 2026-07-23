import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

const categorySortFieldMap = {
  name: "name",
  createdAt: "createdAt"
};

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description || "",
  createdAt: category.createdAt,
  productCount: category._count?.products ?? 0
});

export const getCategoryOptions = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return categories.map(normalizeCategory);
};

export const getCategories = async ({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  order = "desc",
  descriptionFilter = "ALL"
}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safeSortBy = categorySortFieldMap[sortBy] || "createdAt";
  const safeOrder = order === "asc" ? "asc" : "desc";
  const trimmedSearch = String(search).trim();

  const where = {
    AND: [
      trimmedSearch
        ? {
            OR: [
              {
                name: {
                  contains: trimmedSearch,
                  mode: "insensitive"
                }
              },
              {
                description: {
                  contains: trimmedSearch,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {},
      descriptionFilter === "WITH_DESCRIPTION"
        ? {
            description: {
              not: ""
            }
          }
        : {},
      descriptionFilter === "WITHOUT_DESCRIPTION"
        ? {
            OR: [{ description: "" }, { description: null }]
          }
        : {}
    ]
  };

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
  ]);

  return {
    items: categories.map(normalizeCategory),
    page: safePage,
    limit: safeLimit,
    total
  };
};

export const createCategory = async ({ name, description }) => {
  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      description: description?.trim() || ""
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  return normalizeCategory(category);
};

export const updateCategory = async (id, { name, description }) => {
  await ensureCategory(id);

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: name.trim(),
      description: description?.trim() || ""
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  return normalizeCategory(category);
};

export const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (category._count.products > 0) {
    throw new AppError("Category cannot be deleted while products are assigned", 400);
  }

  await prisma.category.delete({ where: { id } });
};

export const ensureCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};
