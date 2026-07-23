import { Router } from "express";
import {
  adjustRewardPointsController,
  adjustUserCoinsController,
  getRewardOverviewController,
  getUserRewardHistoryAdminController,
  updateRewardConfigController,
  getRewardConfigController,
  getRewardRulesController,
  updateRewardRulesController
} from "../controllers/reward.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect);
router.use(requireRole(["ADMIN", "STAFF"]));

router.get("/overview", getRewardOverviewController);
router.get("/config", getRewardConfigController);
router.put("/config", updateRewardConfigController);
router.get("/rules", getRewardRulesController);
router.put("/rules", updateRewardRulesController);
router.get("/users/:id/history", getUserRewardHistoryAdminController);
router.post("/adjust-points", adjustRewardPointsController);
router.post("/adjust-coins", adjustUserCoinsController);

export default router;
