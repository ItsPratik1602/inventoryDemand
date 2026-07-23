import { Router } from "express";
import {
  getUserAddressesController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
  getDefaultAddressController
} from "../controllers/address.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// All address routes require authentication
router.use(protect);

// GET /user/addresses - Get all user addresses
router.get("/", getUserAddressesController);

// POST /user/addresses - Create new address
router.post("/", createAddressController);

// GET /user/addresses/default - Get default address
router.get("/default", getDefaultAddressController);

// PATCH /user/addresses/:id/default - Set address as default
router.patch("/:id/default", setDefaultAddressController);

// PUT /user/addresses/:id - Update address
router.put("/:id", updateAddressController);

// DELETE /user/addresses/:id - Delete address
router.delete("/:id", deleteAddressController);

export default router;
