import { Router } from "express";
import {
  createCategoryController,
  deleteCategoryController,
  exportCategoriesController,
  listCategoriesController,
  listCategoryOptionsController,
  updateCategoryController
} from "../controllers/category.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { categorySchema } from "../utils/validators.js";

const router = Router();

router.use(protect);
router.get("/options", listCategoryOptionsController);

router.use(requireAdmin);
router.get("/", listCategoriesController);
router.get("/export", exportCategoriesController);
router.post("/", validate(categorySchema), createCategoryController);
router.put("/:id", validate(categorySchema), updateCategoryController);
router.delete("/:id", deleteCategoryController);

export default router;
