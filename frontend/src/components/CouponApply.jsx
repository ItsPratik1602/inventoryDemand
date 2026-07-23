import React, { useState } from "react";
import CouponInput from "./CouponInput.jsx";
import { validateCoupon, applyCoupon } from "../services/couponService.js";
import { useToast } from "../context/ToastContext.jsx";

const CouponApply = ({ cartTotal, onCouponApplied, onTotalChange }) => {
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || cartTotal <= 0) {
      setError("Please enter a valid coupon code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First validate the coupon
      const validationResult = await validateCoupon(couponCode, cartTotal);
      
      if (!validationResult.data?.coupon) {
        setError("Invalid coupon code");
        return;
      }

      // If we get here, coupon is valid, use the validation result
      const discount = validationResult.data.discount;
      
      if (discount > 0) {
        showToast({
          type: "success",
          message: `Coupon applied! You saved $${discount.toFixed(2)}`
        });
        
        onCouponApplied({
          couponId: validationResult.data.coupon.id,
          discount: discount,
          finalTotal: cartTotal - discount
        });
        
        onTotalChange(cartTotal - discount);
      } else {
        setError("This coupon doesn't provide any discount");
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to apply coupon";
      setError(errorMessage);
      showToast({
        type: "error",
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setError("");
    onCouponApplied(null);
    onTotalChange(cartTotal);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Apply Coupon</h3>
      
      <div className="space-y-4">
        <div>
          <CouponInput
            label="Coupon Code"
            value={couponCode}
            onChange={setCouponCode}
            placeholder="Enter coupon code"
            error={error}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApplyCoupon}
            disabled={isLoading || !couponCode.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Applying..." : "Apply Coupon"}
          </button>
          
          {couponCode && (
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Remove
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default CouponApply;
