import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      const cartData = response.data.data || response.data;
      // Ensure cart has proper structure and maintain order
      const items = Array.isArray(cartData?.items) ? cartData.items : [];
      setCart({
        items: items,
        total: cartData?.total || 0
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      showToast({ type: "error", message: "Failed to load cart" });
      // Fallback to empty cart
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await api.put(`/cart/${itemId}`, { quantity: newQuantity });
      await fetchCart(); // Refresh cart data
      window.dispatchEvent(new Event('cartUpdated'));
      showToast({ type: "success", message: "Cart updated" });
    } catch (error) {
      showToast({ type: "error", message: "Failed to update cart" });
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeFromCart = async (itemId) => {
    if (!itemId) {
      showToast({ type: "error", message: "Invalid item ID" });
      return;
    }
    
    try {
      console.log("Removing item from cart:", itemId, typeof itemId);
      const response = await api.delete(`/cart/${itemId}`);
      console.log("Remove response:", response.data);
      await fetchCart(); // Refresh cart data
      window.dispatchEvent(new Event('cartUpdated'));
      showToast({ type: "success", message: "Item removed from cart" });
    } catch (error) {
      console.error("Failed to remove item:", error.response?.data);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to remove item" });
    }
  };

  const clearCart = async () => {
    try {
      await api.delete("/cart");
      setCart({ items: [], total: 0 });
      window.dispatchEvent(new Event('cartUpdated'));
      showToast({ type: "success", message: "Cart cleared" });
    } catch (error) {
      showToast({ type: "error", message: "Failed to clear cart" });
    }
  };

  const proceedToCheckout = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading cart..." />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">Shopping Cart</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-gray-600 mt-1">{cart.items.length} items in your cart</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={proceedToCheckout}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors transform hover:scale-105"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-32 h-32 flex-shrink-0">
                        <img
                          src={(() => {
                            if (item.product?.image) {
                              // If it's already a full URL (starts with http), use as-is
                              if (item.product.image.startsWith('http')) {
                                return item.product.image;
                              }
                              // If it's a local path, add backend URL
                              return `http://localhost:5000${item.product.image}`;
                            }
                            // Fallback to default image
                            return '/defaultProduct.png';
                          })()}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            console.log(`Cart image failed to load: ${e.target.src}`);
                            if (e.target.src !== '/defaultProduct.png') {
                              e.target.src = '/defaultProduct.png';
                            }
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <Link 
                            to={`/product/${item.product.id}`}
                            className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.product.category?.name || 'Uncategorized'}
                          </p>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-gray-500">
                              Price per item:
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${Number(item.price).toFixed(2)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-2">
                              Quantity:
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updating[item.id]}
                                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                              >
                                -
                              </button>
                              <span className="px-4 py-2 border border-gray-300 rounded-lg font-semibold min-w-[60px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updating[item.id]}
                                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                              >
                                +
                              </button>
                              {updating[item.id] && (
                                <div className="w-6 h-6">
                                  <div className="animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">
                              Subtotal:
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ${Number(cart.total).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold text-green-600">
                    {Number(cart.total) >= 50 ? 'Free' : '$9.99'}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-900">
                    ${(Number(cart.total) * 0.08).toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-orange-600">
                      ${(Number(cart.total) * 1.08 + (Number(cart.total) >= 50 ? 0 : 9.99)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={proceedToCheckout}
                  className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-lg transition-colors transform hover:scale-105"
                >
                  Proceed to Checkout
                </button>
                
                <Link
                  to="/products"
                  className="block w-full px-6 py-4 text-center border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center text-sm text-gray-500">
                  <div className="flex justify-center space-x-4 mb-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path d="M18 9H2v5a2 2 0 002 2h14a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z" />
                    </svg>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2zm5-4a1 1 0 00-1 1v1a1 1 0 102 0V6a1 1 0 00-1-1zM6 4a2 2 0 00-2 2v1a2 2 0 104 0V6a2 2 0 00-2-2z" clipRule="evenodd" />
                    </svg>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <p className="text-xs">Secure checkout with SSL encryption</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
