import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingCart, ChevronLeft, Trash2, Plus, Minus, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user, navigate]);

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

  const subtotal = cart?.total || 0;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cart?.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            {cart?.items?.map((item) => (
              <div key={item.id} className="p-6 border-b last:border-b-0">
                <div className="flex gap-4">
                  {/* Product Image */}
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
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      console.log(`Cart image failed to load: ${e.target.src}`);
                      if (e.target.src !== '/defaultProduct.png') {
                        e.target.src = '/defaultProduct.png';
                      }
                    }}
                  />

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-4">${Number(item.price).toFixed(2)}</p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.stockQuantity === 0 ? (
                          <span className="text-red-500">Out of stock</span>
                        ) : item.stockQuantity < 5 ? (
                          <span className="text-yellow-500">Only {item.stockQuantity} left</span>
                        ) : (
                          <span className="text-green-500">In stock</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <ChevronLeft className="h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart?.items?.length || 0} items)</span>
                <span>${(cart?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{(cart?.total || 0) >= 50 ? 'FREE' : '$9.99'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${((cart?.total || 0) * 0.08).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Free Shipping Notice */}
            {subtotal < 50 && (
              <div className="bg-blue-50 p-3 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                </p>
              </div>
            )}

            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition mb-3"
            >
              Clear Cart
            </button>

            {/* Checkout Button */}
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Proceed to Checkout
            </button>

            {/* Security Notice */}
            <div className="mt-4 text-center text-sm text-gray-600">
              <Shield className="h-5 w-5 inline-block mr-1" />
              Secure checkout powered by ShopHub
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
