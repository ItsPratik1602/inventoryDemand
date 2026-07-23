import { Router } from "express";
import {
  exportInventoryController,
  exportInventoryPdfController,
  importInventoryCsvController,
  listInventory,
  updateInventoryController,
  getLowStockController
} from "../controllers/inventory.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  exportPdfSchema,
  importInventoryCsvSchema,
  inventorySchema
} from "../utils/validators.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/", listInventory);
router.get("/export", exportInventoryController);
router.get("/low-stock", getLowStockController);
router.post("/export/pdf", validate(exportPdfSchema), exportInventoryPdfController);
router.post("/import/csv", validate(importInventoryCsvSchema), importInventoryCsvController);
router.put("/", validate(inventorySchema), updateInventoryController);

export default router;
