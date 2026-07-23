import {
  adjustRewardPoints,
  adjustUserCoins,
  earnCoins,
  getRewardBalance,
  getRewardConfig,
  getRewardHistory,
  getRewardOverview,
  getRewardRules,
  getUserRewardHistoryAdmin,
  previewRewardRedemption,
  redeemCoins,
  updateRewardConfig,
  updateRewardRules,
  calculateRedeemableCoins
} from "../services/reward.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";

export const getRewardBalanceController = catchAsync(async (req, res) => {
  const data = await getRewardBalance(req.user.id);
  return sendResponse(res, 200, "Reward balance fetched successfully", data);
});

export const getRewardHistoryController = catchAsync(async (req, res) => {
  const data = await getRewardHistory(req.user.id, req.query);
  return sendResponse(res, 200, "Reward history fetched successfully", data);
});

export const previewRewardRedemptionController = catchAsync(async (req, res) => {
  const data = await previewRewardRedemption({
    userId: req.user.id,
    cartTotal: req.body.cartTotal,
    couponDiscount: req.body.couponDiscount,
    requestedPoints: req.body.pointsToUse
  });

  return sendResponse(res, 200, "Reward redemption preview generated successfully", data);
});

export const getRewardRulesController = catchAsync(async (_req, res) => {
  try {
    const data = await getRewardRules({ includeInactive: true });
    return sendResponse(res, 200, "Reward rules fetched successfully", data || []);
  } catch (error) {
    console.error("Error in getRewardRulesController:", error);
    return sendResponse(res, 500, "Failed to fetch reward rules", []);
  }
});

export const updateRewardRulesController = catchAsync(async (req, res) => {
  const rules = Array.isArray(req.body?.rules) ? req.body.rules : [];
  const data = await updateRewardRules(rules);
  return sendResponse(res, 200, "Reward rules updated successfully", data);
});

export const adjustRewardPointsController = catchAsync(async (req, res) => {
  const data = await adjustRewardPoints({
    userId: req.body.userId,
    points: req.body.points,
    description: req.body.description,
    adminUserId: req.user.id
  });

  return sendResponse(res, 200, "Reward points adjusted successfully", data);
});

export const getRewardOverviewController = catchAsync(async (_req, res) => {
  const data = await getRewardOverview();
  return sendResponse(res, 200, "Reward overview fetched successfully", data);
});

export const getUserRewardHistoryAdminController = catchAsync(async (req, res) => {
  const data = await getUserRewardHistoryAdmin(req.params.id, req.query);
  return sendResponse(res, 200, "User reward history fetched successfully", data);
});

// Coin system endpoints
export const getRewardConfigController = catchAsync(async (req, res) => {
  const data = await getRewardConfig();
  return sendResponse(res, 200, "Reward config fetched successfully", data);
});

export const calculateRedeemableCoinsController = catchAsync(async (req, res) => {
  const { orderTotal } = req.body;
  const data = await calculateRedeemableCoins(req.user.id, orderTotal);
  return sendResponse(res, 200, "Redeemable coins calculated successfully", data);
});

export const adjustUserCoinsController = catchAsync(async (req, res) => {
  const { userId, coins, description } = req.body;
  const data = await adjustUserCoins({
    userId,
    coins,
    description,
    adminUserId: req.user.id
  });
  return sendResponse(res, 200, "User coins adjusted successfully", data);
});

export const updateRewardConfigController = catchAsync(async (req, res) => {
  const data = await updateRewardConfig(req.body);
  return sendResponse(res, 200, "Reward config updated successfully", data);
});
