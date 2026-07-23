import { Router } from "express";
import { listPublicProducts, getProductByIdController } from "../controllers/product.controller.js";

const router = Router();

// Public routes - no authentication required
router.get("/", listPublicProducts);
router.get("/:id", getProductByIdController);

export default router;
