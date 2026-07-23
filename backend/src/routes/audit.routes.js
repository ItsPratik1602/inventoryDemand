import { Router } from "express";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  getAuditLogsController,
  createAuditLogController
} from "../controllers/audit.controller.js";

const router = Router();

router.use(protect);
router.use(requireAdmin);

router.get("/", getAuditLogsController);
router.post("/", createAuditLogController);

export default router;
