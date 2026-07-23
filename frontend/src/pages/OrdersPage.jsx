import { useState, useEffect } from "react";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log("Fetching customer orders...");
      const response = await api.get("/orders");
      console.log("Orders response:", response.data);
      
      // Ensure orders is always an array
      const ordersData = response.data.data?.items || response.data.data || response.data || [];
      console.log("Orders data:", ordersData);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showToast({ type: "error", message: "Failed to load orders" });
      // Fallback to empty array on error
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl text-gray-300 mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your order history.
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Product List */}
                <div className="space-y-3 mb-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center py-3 border-t border-gray-100">
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={
                            (() => {
                              const image = item.product.images?.find(img => img.isPrimary) || item.product.images?.[0];
                              if (image?.url) {
                                if (image.url.startsWith('http')) {
                                  return image.url;
                                }
                                return `http://localhost:5000${image.url}`;
                              }
                              return '/defaultProduct.png';
                            })()
                          }
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            if (e.target.src !== '/defaultProduct.png') {
                              e.target.src = '/defaultProduct.png';
                            }
                          }}
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate mb-1">
                          {item.product?.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <button 
                        className="text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                        onClick={() => console.log('View details for order', order.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                        onClick={() => console.log('Buy again for order', order.id)}
                      >
                        Buy Again
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping Address (Compact) */}
                {order.shippingAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Delivery Address:</span> {order.shippingAddress}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
