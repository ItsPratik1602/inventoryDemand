import {
  validateCoupon,
  applyCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getAllCoupons,
  getUserCoupons,
  getUserCouponUsage,
  getCouponUsageDetails,
  getCouponAssignedUsers,
  assignUsersToCoupon,
  removeUserFromCoupon
} from "../services/coupon.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";
import { validationResult } from "express-validator";

// Validate coupon before applying
export const validateCouponController = catchAsync(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || !cartTotal || cartTotal <= 0) {
    return sendResponse(res, 400, "Invalid coupon code or cart total");
  }

  try {
    const result = await validateCoupon(code, cartTotal, req.user?.id ?? null);
    return sendResponse(res, 200, "Coupon validated successfully", result);
  } catch (error) {
    return sendResponse(res, error.statusCode || 400, error.message);
  }
});

// Apply coupon to order
export const applyCouponController = catchAsync(async (req, res) => {
  const { code, cartTotal, orderId } = req.body;

  if (!code || !cartTotal || !orderId || cartTotal <= 0) {
    return sendResponse(res, 400, "Invalid request data");
  }

  try {
    // For applying coupon, we need user authentication
    if (!req.user) {
      return sendResponse(res, 401, "Authentication required");
    }
    const result = await applyCoupon(code, cartTotal, req.user.id, orderId);
    return sendResponse(res, 200, "Coupon applied successfully", result);
  } catch (error) {
    return sendResponse(res, error.statusCode || 400, error.message);
  }
});

// Create new coupon (admin)
export const createCouponController = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", { errors: errors.array() });
  }
  
  const result = await createCoupon(req.validatedBody, req.user.id);
  return sendResponse(res, 201, "Coupon created successfully", result);
});

// Update coupon (admin)
export const updateCouponController = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", { errors: errors.array() });
  }

  const { id } = req.params;
  const result = await updateCoupon(id, req.body);
  return sendResponse(res, 200, "Coupon updated successfully", result);
});

// Delete coupon (admin)
export const deleteCouponController = catchAsync(async (req, res) => {
  const { id } = req.params;
  await deleteCoupon(id);
  return sendResponse(res, 200, "Coupon deleted successfully");
});

// Toggle coupon status (admin)
export const toggleCouponController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await toggleCouponStatus(id);
  return sendResponse(res, 200, "Coupon status updated successfully", result);
});

// Get all coupons (admin)
export const listCouponsController = catchAsync(async (req, res) => {
  try {
    const data = await getAllCoupons(req.query);
    return sendResponse(res, 200, "Coupons retrieved successfully", data);
  } catch (error) {
    console.error("Coupons API error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export const getCouponAssignedUsersController = catchAsync(async (req, res) => {
  const data = await getCouponAssignedUsers(req.params.id);
  return sendResponse(res, 200, "Assigned users retrieved successfully", data);
});

export const assignUsersToCouponController = catchAsync(async (req, res) => {
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
  const data = await assignUsersToCoupon(req.params.id, userIds);
  return sendResponse(res, 200, "Coupon users updated successfully", data);
});

export const removeUserFromCouponController = catchAsync(async (req, res) => {
  const data = await removeUserFromCoupon(req.params.id, req.params.userId);
  return sendResponse(res, 200, "User removed from coupon successfully", data);
});

// Get user's coupons
export const getUserCouponsController = catchAsync(async (req, res) => {
  const data = await getUserCoupons(req.user.id);
  return sendResponse(res, 200, "User coupons retrieved successfully", data);
});

// Get user coupon usage history
export const getUserCouponUsageController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const usage = await getUserCouponUsage(userId);
    return sendResponse(res, 200, "User coupon usage retrieved successfully", usage);
  } catch (error) {
    return sendResponse(res, error.statusCode || 400, error.message);
  }
});

// Get coupon usage details
export const getCouponUsageDetailsController = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  console.log("received id:", id);
  
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const usageDetails = await getCouponUsageDetails(id);
    return sendResponse(res, 200, "Coupon usage details retrieved successfully", usageDetails);
  } catch (error) {
    return sendResponse(res, error.statusCode || 400, error.message);
  }
});
