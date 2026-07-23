import {
  getInventory,
  getInventoryForExport,
  importInventoryFromCsv,
  upsertInventory,
  getLowStockProducts
} from "../services/inventory.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { buildCsv, parseIdsQuery, sendCsv } from "../utils/csv.js";
import { buildPdf, sendPdf } from "../utils/pdf.js";

export const listInventory = catchAsync(async (req, res) => {
  const data = await getInventory(req.query);
  return sendResponse(res, 200, "Inventory fetched successfully", data);
});

export const updateInventoryController = catchAsync(async (req, res) => {
  const data = await upsertInventory(req.validatedBody);
  return sendResponse(res, 200, "Inventory updated successfully", data);
});

export const importInventoryCsvController = catchAsync(async (req, res) => {
  const data = await importInventoryFromCsv(req.validatedBody, req.user);
  return sendResponse(res, 200, "Inventory imported successfully", data);
});

export const exportInventoryController = catchAsync(async (req, res) => {
  const data = await getInventoryForExport(req.query, parseIdsQuery(req.query.ids));
  const csv = buildCsv(data, [
    { label: "Inventory ID", value: (item) => item.id },
    { label: "Product ID", value: (item) => item.productId },
    { label: "Product", value: (item) => item.product.name },
    { label: "Quantity", value: (item) => item.quantity },
    { label: "Unit Price", value: (item) => item.product.price.toFixed(2) }
  ]);

  return sendCsv(res, "inventory.csv", csv);
});

export const exportInventoryPdfController = catchAsync(async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const data = await getInventoryForExport(req.body || {}, ids);
  const pdf = buildPdf("Inventory Export", data, [
    { label: "ID", value: (item) => item.id, width: 6 },
    { label: "Product", value: (item) => item.product.name, width: 20 },
    { label: "Qty", value: (item) => item.quantity, width: 8 },
    { label: "Reorder", value: (item) => item.product.reorderLevel ?? 0, width: 8 },
    { label: "Price", value: (item) => item.product.price.toFixed(2), width: 10 }
  ]);

  return sendPdf(res, "inventory.pdf", pdf);
});

export const getLowStockController = catchAsync(async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const lowStockProducts = await getLowStockProducts(threshold);
    
    return sendResponse(res, 200, "Low stock products retrieved successfully", lowStockProducts);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
});
