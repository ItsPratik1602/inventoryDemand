import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryOptions,
  updateCategory
} from "../services/category.service.js";
import { catchAsync } from "../utils/catch-async.js";
import { sendResponse } from "../utils/api-response.js";
import { buildCsv, parseIdsQuery, sendCsv } from "../utils/csv.js";

export const listCategoriesController = catchAsync(async (req, res) => {
  const data = await getCategories(req.query);
  return sendResponse(res, 200, "Categories fetched successfully", data);
});

export const listCategoryOptionsController = catchAsync(async (_req, res) => {
  const data = await getCategoryOptions();
  return sendResponse(res, 200, "Category options fetched successfully", data);
});

export const createCategoryController = catchAsync(async (req, res) => {
  const data = await createCategory(req.validatedBody);
  return sendResponse(res, 201, "Category created successfully", data);
});

export const updateCategoryController = catchAsync(async (req, res) => {
  const data = await updateCategory(Number(req.params.id), req.validatedBody);
  return sendResponse(res, 200, "Category updated successfully", data);
});

export const deleteCategoryController = catchAsync(async (req, res) => {
  await deleteCategory(Number(req.params.id));
  return sendResponse(res, 200, "Category deleted successfully");
});

export const exportCategoriesController = catchAsync(async (req, res) => {
  const query = {
    ...req.query,
    page: 1,
    limit: 100000
  };
  const result = await getCategories(query);
  const ids = parseIdsQuery(req.query.ids);
  const rows = ids.length
    ? result.items.filter((category) => ids.includes(category.id))
    : result.items;
  const csv = buildCsv(rows, [
    { label: "ID", value: (category) => category.id },
    { label: "Name", value: (category) => category.name },
    { label: "Description", value: (category) => category.description || "" },
    { label: "Products", value: (category) => category.productCount },
    {
      label: "Created At",
      value: (category) => new Date(category.createdAt).toISOString()
    }
  ]);

  return sendCsv(res, "categories.csv", csv);
});
