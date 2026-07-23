import {
  createSale,
  deleteSale,
  getSales,
  getSalesForExport
} from "../services/sales.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { buildCsv, parseIdsQuery, sendCsv } from "../utils/csv.js";
import { buildPdf, sendPdf } from "../utils/pdf.js";

export const listSales = catchAsync(async (req, res) => {
  const allowedFields = ["createdAt", "totalAmount", "status"];
  let { sortBy = "createdAt", order = "desc" } = req.query;

  if (!allowedFields.includes(sortBy)) {
    sortBy = "createdAt";
  }

  const validatedQuery = {
    ...req.query,
    sortBy,
    order
  };

  const data = await getSales(validatedQuery);
  return sendResponse(res, 200, "Sales fetched successfully", data);
});

export const createSaleController = catchAsync(async (req, res) => {
  const data = await createSale(req.validatedBody);
  return sendResponse(res, 201, "Sale recorded successfully", data);
});

export const deleteSaleController = catchAsync(async (req, res) => {
  await deleteSale(Number(req.params.id));
  return sendResponse(res, 200, "Sale deleted successfully");
});

export const exportSalesController = catchAsync(async (req, res) => {
  const data = await getSalesForExport(req.query, parseIdsQuery(req.query.ids));
  const csv = buildCsv(data, [
    { label: "Sale ID", value: (sale) => sale.id },
    { label: "Product ID", value: (sale) => sale.productId },
    { label: "Product", value: (sale) => sale.product.name },
    { label: "Quantity", value: (sale) => sale.quantity },
    {
      label: "Created At",
      value: (sale) => new Date(sale.createdAt).toISOString()
    }
  ]);

  return sendCsv(res, "sales.csv", csv);
});

export const exportSalesPdfController = catchAsync(async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const data = await getSalesForExport(req.body || {}, ids);
  const pdf = buildPdf("Sales Export", data, [
    { label: "ID", value: (sale) => sale.id, width: 6 },
    { label: "Product", value: (sale) => sale.product.name, width: 20 },
    { label: "Qty", value: (sale) => sale.quantity, width: 8 },
    { label: "Value", value: (sale) => (sale.quantity * sale.product.price).toFixed(2), width: 10 },
    { label: "Created", value: (sale) => new Date(sale.createdAt).toISOString().slice(0, 10), width: 12 }
  ]);

  return sendPdf(res, "sales.pdf", pdf);
});
