import api from "../lib/api.js";

export const validateCoupon = async (code, cartTotal) => {
  try {
    const response = await api.post("/coupons/validate", {
      code,
      cartTotal
    });
    
    return response.data;
  } catch (error) {
    // Extract the actual error message from the API response
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to validate coupon";
    throw new Error(errorMessage);
  }
};

export const applyCoupon = async (code, cartTotal, orderId) => {
  try {
    const response = await api.post("/coupons/apply", {
      code,
      cartTotal,
      orderId
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserCoupons = async () => {
  try {
    const response = await api.get("/coupons/user");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserCouponUsage = async () => {
  try {
    const response = await api.get("/coupons/user/usage");
    return response.data;
  } catch (error) {
    throw error;
  }
};
