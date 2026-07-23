import { Router } from "express";
import { dashboardSummary } from "../controllers/dashboard.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/summary", dashboardSummary);

export default router;
