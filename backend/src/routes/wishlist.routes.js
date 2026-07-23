import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController,
  checkWishlistController
} from "../controllers/wishlist.controller.js";

const router = Router();

router.use(protect);

router.get("/", getWishlistController);
router.post("/", addToWishlistController);
router.delete("/:id", removeFromWishlistController);
router.get("/check/:productId", checkWishlistController);

export default router;
