import { Router } from "express";
import {
  createProductController,
  deleteProductController,
  exportProductsController,
  exportProductsPdfController,
  importProductsCsvController,
  listProductOptionsController,
  listProducts,
  productStatsController,
  restockProductController,
  updateProductController,
  uploadProductImagesController
} from "../controllers/product.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";
import { exportPdfSchema, importProductsCsvSchema, productSchema } from "../utils/validators.js";

const router = Router();

router.use(protect);
router.get("/stats", productStatsController);
router.get("/options", listProductOptionsController);
router.get("/", listProducts);
router.get("/export", exportProductsController);
router.post("/export/pdf", validate(exportPdfSchema), exportProductsPdfController);
router.post("/import/csv", requireAdmin, validate(importProductsCsvSchema), importProductsCsvController);
router.post("/", validate(productSchema), createProductController);
router.put("/:id", validate(productSchema), updateProductController);
router.delete("/:id", deleteProductController);
router.patch("/:id/restock", requireAdmin, restockProductController);

// Image upload routes
router.post("/:id/images", requireAdmin, uploadProductImages, uploadProductImagesController);

export default router;
