import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const CustomerOrdersPage = () => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-blue-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
        <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-red-500 text-3xl">ORDERS PAGE DEBUG</h1>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your order history.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              console.log('Rendering order:', order);
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="font-bold text-lg">Order #{order.id}</h2>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                      {order.status}
                    </span>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={
                            (() => {
                              const image = item.product?.images?.find(img => img.isPrimary) || item.product?.images?.[0];
                              if (image?.url) {
                                if (image.url.startsWith('http')) {
                                  return image.url;
                                }
                                return `http://localhost:5000${image.url}`;
                              }
                              return '/defaultProduct.png';
                            })()
                          }
                          className="w-16 h-16 rounded object-cover"
                          onError={(e) => {
                            if (e.target.src !== '/defaultProduct.png') {
                              e.target.src = '/defaultProduct.png';
                            }
                          }}
                        />

                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>

                        <div className="font-semibold">
                          ${Number(item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <span className="text-gray-600">
                      {order.items?.length || 0} items
                    </span>

                    <span className="text-blue-600 font-bold text-lg">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
