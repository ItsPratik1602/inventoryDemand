import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createOrderController,
  getOrdersController,
  getOrderByIdController,
  updateOrderStatusController
} from "../controllers/order.controller.js";

const router = Router();

router.use(protect);

router.post("/", createOrderController);
router.get("/", getOrdersController);
router.get("/:id", getOrderByIdController);
router.put("/:id/status", updateOrderStatusController);

export default router;
