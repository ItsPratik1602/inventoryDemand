import { Router } from "express";
import {
  getListAlerts,
  getAlertStatsController,
  resolveAlertController,
  ignoreAlertController,
  generateAlertsController,
  cleanupAlertsController
} from "../controllers/alert.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect, requireAdmin);

// Get all alerts with filtering
router.get("/", getListAlerts);

// Get alert statistics for dashboard
router.get("/stats", getAlertStatsController);

// Generate alerts for all products (manual trigger or cron job)
router.post("/generate", generateAlertsController);

// Clean up invalid alerts
router.post("/cleanup", cleanupAlertsController);

// Resolve an alert
router.patch("/:id/resolve", resolveAlertController);

// Ignore an alert
router.patch("/:id/ignore", ignoreAlertController);

export default router;
