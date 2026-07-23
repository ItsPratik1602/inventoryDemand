import { Router } from "express";
import {
  calculateRedeemableCoinsController,
  getRewardBalanceController,
  getRewardHistoryController,
  previewRewardRedemptionController
} from "../controllers/reward.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);
router.get("/balance", getRewardBalanceController);
router.get("/history", getRewardHistoryController);
router.post("/preview", previewRewardRedemptionController);
router.post("/calculate-redeemable", calculateRedeemableCoinsController);

export default router;
