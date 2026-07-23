import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress
} from "../services/address.service.js";
import { sendResponse } from "../utils/api-response.js";
import { catchAsync } from "../utils/catch-async.js";

export const getUserAddressesController = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const addresses = await getUserAddresses(userId);

  return sendResponse(res, 200, "Addresses retrieved successfully", addresses);
});

export const createAddressController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const addressData = req.body;

  // Validate required fields
  const requiredFields = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'];
  const missingFields = requiredFields.filter(field => !addressData[field]);
  
  if (missingFields.length > 0) {
    return sendResponse(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  const address = await createAddress(userId, addressData);

  return sendResponse(res, 201, "Address created successfully", address);
});

export const updateAddressController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const addressData = req.body;

  const address = await updateAddress(userId, id, addressData);

  return sendResponse(res, 200, "Address updated successfully", address);
});

export const deleteAddressController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await deleteAddress(userId, id);

  return sendResponse(res, 200, "Address deleted successfully", result);
});

export const setDefaultAddressController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await setDefaultAddress(userId, id);

  return sendResponse(res, 200, "Default address set successfully", result);
});

export const getDefaultAddressController = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const address = await getDefaultAddress(userId);

  return sendResponse(res, 200, "Default address retrieved successfully", address);
});
