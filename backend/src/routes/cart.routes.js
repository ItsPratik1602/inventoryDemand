import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getCartController,
  addToCartController,
  updateCartController,
  removeFromCartController,
  clearCartController
} from "../controllers/cart.controller.js";

const router = Router();

router.use(protect);

router.get("/", getCartController);
router.post("/", addToCartController);
router.put("/:itemId", updateCartController);
router.delete("/:itemId", removeFromCartController);
router.delete("/", clearCartController);

export default router;
