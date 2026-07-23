import { Router } from "express";
import {
  createSaleController,
  deleteSaleController,
  exportSalesController,
  exportSalesPdfController,
  listSales
} from "../controllers/sales.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { exportPdfSchema, salesSchema } from "../utils/validators.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/", listSales);
router.get("/export", exportSalesController);
router.post("/export/pdf", validate(exportPdfSchema), exportSalesPdfController);
router.post("/", validate(salesSchema), createSaleController);
router.delete("/:id", deleteSaleController);

export default router;
