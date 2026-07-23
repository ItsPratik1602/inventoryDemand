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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
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
    <div className="app-page">
      {/* Page Header */}
      <div className="bg-white border-b border-[color:var(--line)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">
            Order History
          </h1>
        </div>
      </div>

      {/* Orders List */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl text-[color:var(--muted)] mb-4">package</div>
              <h3 className="text-xl font-semibold text-[color:var(--text)] mb-2">
                No orders yet
              </h3>
              <p className="text-[color:var(--muted)] mb-8">
                You haven't placed any orders yet. Start shopping to see your order history.
              </p>
              <a
                href="/products"
                className="inline-block px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent-dark)] transition-colors"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--text)]">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-lg font-semibold text-[color:var(--accent)] mt-2">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-[color:var(--line)] pt-4">
                    <h4 className="font-medium text-[color:var(--text)] mb-3">
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-20 h-20 flex-shrink-0">
                            <img
                              src={
                              item.product.images?.find(img => img.isPrimary)?.url ||
                              item.product.images?.[0]?.url ||
                              "/default.png"
                            }
                              alt={item.product?.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-[color:var(--text)]">
                              {item.product?.name}
                            </h5>
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

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="border-t border-[color:var(--line)] pt-4 mt-4">
                      <h4 className="font-medium text-[color:var(--text)] mb-2">
                        Shipping Address
                      </h4>
                      <p className="text-sm text-[color:var(--muted)]">
                        {order.shippingAddress}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
