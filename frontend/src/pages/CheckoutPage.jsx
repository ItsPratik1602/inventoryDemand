import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      const cartData = response.data.data || response.data;
      const items = Array.isArray(cartData?.items) ? cartData.items : [];
      if (items.length === 0) {
        navigate("/cart");
        return;
      }
      setCart({
        items: items,
        total: cartData?.total || 0
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      showToast({ type: "error", message: "Failed to load cart" });
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!shippingAddress.trim()) {
      showToast({ type: "error", message: "Please enter shipping address" });
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        shippingAddress,
        paymentMethod,
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // Add couponCode if exists in cart
      if (cart.couponId) {
        orderPayload.couponCode = cart.couponId;
        console.log("Using couponCode from cart:", cart.couponId);
      }

      console.log("ORDER PAYLOAD:", orderPayload);

      const response = await api.post("/orders", orderPayload);

      // Clear cart after successful order
      await api.delete("/cart");

      showToast({ type: "success", message: "Order placed successfully!" });
      navigate("/orders");
    } catch (error) {
      console.error("Failed to place order:", error);
      showToast({ type: "error", message: "Failed to place order" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading checkout..." />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-[color:var(--text)] mb-2">
            Your cart is empty
          </h3>
          <button
            onClick={() => navigate("/cart")}
            className="px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent-dark)] transition-colors"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.total;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="app-page">
      {/* Page Header */}
      <div className="bg-white border-b border-[color:var(--line)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">
            Checkout
          </h1>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
                  Shipping Address
                </h3>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                    Address
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your shipping address"
                    rows={3}
                    className="w-full px-4 py-2 border border-[color:var(--line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-[color:var(--text)]">
                      Cash on Delivery (COD)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT_CARD"
                      checked={paymentMethod === "CREDIT_CARD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-[color:var(--text)]">
                      Credit Card (Demo)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === "BANK_TRANSFER"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-[color:var(--text)]">
                      Bank Transfer (Demo)
                    </span>
                  </label>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={item.product.image || "/placeholder-product.jpg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[color:var(--text)]">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-[color:var(--muted)]">
                          Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[color:var(--text)]">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Subtotal:</span>
                    <span className="font-semibold text-[color:var(--text)]">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Shipping:</span>
                    <span className="font-semibold text-[color:var(--text)]">
                      Free
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Tax:</span>
                    <span className="font-semibold text-[color:var(--text)]">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[color:var(--line)] pt-4">
                    <div className="flex justify-between">
                      <span className="text-xl font-bold text-[color:var(--text)]">Total:</span>
                      <span className="text-xl font-bold text-[color:var(--accent)]">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="w-full mt-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full mt-3 py-3 border border-[color:var(--line)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--accent-soft)] transition-colors"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
