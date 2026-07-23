import { Router } from "express";
import {
  validateCouponController,
  applyCouponController,
  createCouponController,
  updateCouponController,
  deleteCouponController,
  toggleCouponController,
  listCouponsController,
  getUserCouponsController,
  getUserCouponUsageController,
  getCouponUsageDetailsController,
  getCouponAssignedUsersController,
  assignUsersToCouponController,
  removeUserFromCouponController
} from "../controllers/coupon.controller.js";
import { optionalProtect, protect, requireAdmin } from "../middlewares/auth.middleware.js";
import { body, validationResult } from "express-validator";
import { couponCreateSchema } from "../utils/validators.js";
import { sendResponse } from "../utils/api-response.js";

// Validation result middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", { errors: errors.array() });
  }
  
  req.validatedBody = req.body;
  next();
};

const router = Router();

// Public routes (for frontend coupon validation/usage)
router.post("/validate", optionalProtect, validateCouponController);
router.post("/apply", protect, applyCouponController);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.get("/user", getUserCouponsController);
router.get("/user/usage", getUserCouponUsageController);

// Admin routes (require admin role)
router.use(requireAdmin);
router.post("/", body(couponCreateSchema), validateRequest, createCouponController);
router.put("/:id", updateCouponController);
router.delete("/:id", deleteCouponController);
router.patch("/:id/toggle", toggleCouponController);
router.get("/", listCouponsController);
router.get("/:id/users", getCouponAssignedUsersController);
router.post("/:id/users", assignUsersToCouponController);
router.delete("/:id/users/:userId", removeUserFromCouponController);
router.get("/:id/usage", getCouponUsageDetailsController);

export default router;
