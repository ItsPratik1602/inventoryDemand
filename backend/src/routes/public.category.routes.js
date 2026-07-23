import { Router } from "express";
import { listCategoriesController } from "../controllers/category.controller.js";

const router = Router();

// Public routes - no authentication required
router.get("/", listCategoriesController);

export default router;
