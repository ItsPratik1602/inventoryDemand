import { Router } from "express";
import {
  createUserController,
  deleteUserController,
  exportUsersController,
  exportUsersPdfController,
  listUsersController,
  updateUserRoleController
} from "../controllers/user.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createUserSchema, exportPdfSchema, updateUserRoleSchema } from "../utils/validators.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.post("/create", validate(createUserSchema), createUserController);
router.get("/", listUsersController);
router.get("/export", exportUsersController);
router.post("/export/pdf", validate(exportPdfSchema), exportUsersPdfController);
router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRoleController);
router.delete("/:id", deleteUserController);

export default router;
