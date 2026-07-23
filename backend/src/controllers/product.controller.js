import {
  createProduct,
  deleteProduct,
  getProductOptions,
  getProductsForExport,
  getProducts,
  getPublicProducts,
  getProductById,
  getProductStats,
  importProductsFromCsv,
  listCategories,
  updateProduct,
  saveProductImages,
  restockProduct
} from "../services/product.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { buildCsv, parseIdsQuery, sendCsv } from "../utils/csv.js";
import { buildPdf, sendPdf } from "../utils/pdf.js";
import { logAuditAction } from "../middlewares/audit.middleware.js";

export const listProducts = catchAsync(async (req, res) => {
  const data = await getProducts(req.user.id, req.query);
  return sendResponse(res, 200, "Products fetched successfully", data);
});

export const listPublicProducts = catchAsync(async (req, res) => {
  const data = await getPublicProducts(req.query);
  return sendResponse(res, 200, "Products fetched successfully", data);
});

export const listProductOptionsController = catchAsync(async (_req, res) => {
  const data = await getProductOptions();
  return sendResponse(res, 200, "Product options fetched successfully", data);
});

export const createProductController = catchAsync(async (req, res) => {
  const data = await createProduct(req.validatedBody, req.user.id);
  
  // Log product creation
  await logAuditAction(req.user.id, "CREATE", "PRODUCT", data.id, {
    productName: data.name,
    price: data.price,
    stockQuantity: data.stockQuantity,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return sendResponse(res, 201, "Product created successfully", data);
});

export const updateProductController = catchAsync(async (req, res) => {
  const data = await updateProduct(Number(req.params.id), req.validatedBody, req.user.id);
  
  // Log product update
  await logAuditAction(req.user.id, "UPDATE", "PRODUCT", Number(req.params.id), {
    productName: data.name,
    updatedFields: Object.keys(req.validatedBody),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return sendResponse(res, 200, "Product updated successfully", data);
});

export const deleteProductController = catchAsync(async (req, res) => {
  const productId = Number(req.params.id);
  await deleteProduct(productId, req.user.id);
  
  // Log product deletion
  await logAuditAction(req.user.id, "DELETE", "PRODUCT", productId, {
    productId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return sendResponse(res, 200, "Product deleted successfully");
});

export const exportProductsController = catchAsync(async (req, res) => {
  const data = await getProductsForExport(req.user.id, req.query, parseIdsQuery(req.query.ids));
  const csv = buildCsv(data, [
    { label: "ID", value: (product) => product.id },
    { label: "Name", value: (product) => product.name },
    { label: "Category", value: (product) => product.category?.name || "" },
    { label: "Price", value: (product) => product.price.toFixed(2) },
    { label: "Stock Quantity", value: (product) => product.stockQuantity ?? 0 },
    { label: "Reorder Level", value: (product) => product.reorderLevel },
    { label: "Demand Prediction", value: (product) => product.demandPrediction },
    {
      label: "Created At",
      value: (product) => new Date(product.createdAt).toISOString()
    }
  ]);

  return sendCsv(res, "products.csv", csv);
});

export const exportProductsPdfController = catchAsync(async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const data = await getProductsForExport(req.user.id, req.body || {}, ids);
  const pdf = buildPdf("Products Export", data, [
    { label: "ID", value: (product) => product.id, width: 6 },
    { label: "Name", value: (product) => product.name, width: 20 },
    { label: "Category", value: (product) => product.category?.name || "", width: 16 },
    { label: "Price", value: (product) => product.price.toFixed(2), width: 10 },
    { label: "Stock", value: (product) => product.stockQuantity ?? 0, width: 8 },
    { label: "Reorder", value: (product) => product.reorderLevel, width: 8 }
  ]);

  return sendPdf(res, "products.pdf", pdf);
});

export const importProductsCsvController = catchAsync(async (req, res) => {
  const data = await importProductsFromCsv(req.validatedBody);
  return sendResponse(res, 200, "Products imported successfully", data);
});

export const listCategoriesController = catchAsync(async (_req, res) => {
  const data = await listCategories();
  return sendResponse(res, 200, "Categories fetched successfully", data);
});

export const getProductByIdController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await getProductById(parseInt(id));
  return sendResponse(res, 200, "Product fetched successfully", data);
});

export const productStatsController = catchAsync(async (_req, res) => {
  const data = await getProductStats();
  return sendResponse(res, 200, "Product stats fetched successfully", data);
});

export const uploadProductImagesController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return sendResponse(res, 400, "No images uploaded");
  }

  try {
    const imageUrls = files.map(file => `/api/v1/images/products/${file.filename}`);
    
    // Save image URLs to database
    const savedImages = await saveProductImages(id, imageUrls);
    
    console.log(`Uploaded ${files.length} images for product ${id}:`, imageUrls);
    
    return sendResponse(res, 200, "Images uploaded and saved successfully", {
      imageUrls,
      savedImages,
      message: `${files.length} image(s) uploaded and saved successfully`
    });
  } catch (error) {
    console.error('Error saving product images:', error);
    return sendResponse(res, 500, "Failed to upload and save images");
  }
});

export const restockProductController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  const result = await restockProduct(id, quantity);
  
  return sendResponse(res, 200, "Product restocked successfully", result);
});
