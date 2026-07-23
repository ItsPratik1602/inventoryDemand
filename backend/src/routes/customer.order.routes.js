import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createOrderController,
  getCustomerOrdersController,
  getCustomerOrderByIdController,
  updateCustomerOrderStatusController
} from "../controllers/customer.order.controller.js";

const router = Router();

router.use(protect); // All customer routes require authentication

router.post("/", createOrderController);
router.get("/", getCustomerOrdersController);
router.get("/:id", getCustomerOrderByIdController);
router.patch("/:id/status", updateCustomerOrderStatusController);

export default router;
