import { Router } from "express";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  getOrdersController,
  getAdminOrdersController,
  getOrderByIdController,
  updateOrderStatusController
} from "../controllers/order.controller.js";

const router = Router();

router.use(protect);
router.use(requireAdmin);

router.get("/", getAdminOrdersController);
router.get("/:id", getOrderByIdController);
router.patch("/:id/status", updateOrderStatusController);

export default router;
