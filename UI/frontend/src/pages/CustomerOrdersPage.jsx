import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [imageCache, setImageCache] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [page]);

  // Load base64 images for orders
  useEffect(() => {
    const loadImages = async () => {
      const newImageCache = { ...imageCache };
      
      for (const order of orders) {
        for (const item of order.items || []) {
          if (item.product.image?.startsWith('/api/v1/images/base64/')) {
            const cacheKey = item.product.image;
            if (!newImageCache[cacheKey]) {
              try {
                const filename = item.product.image.split('/').pop();
                const response = await api.get(`/images/base64/products/${filename}`);
                if (response.data.success) {
                  newImageCache[cacheKey] = response.data.dataUrl;
                }
              } catch (error) {
                console.error('Error loading base64 image:', error);
                newImageCache[cacheKey] = '/defaultProduct.png';
              }
            }
          }
        }
      }
      
      setImageCache(newImageCache);
    };
    
    if (orders.length > 0) {
      loadImages();
    }
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/customer/orders', {
        params: { page, limit: 10 }
      });
      
      setOrders(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showToast({ type: 'error', message: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await api.patch(`/customer/orders/${orderId}/status`, { status: 'CANCELLED' });
      await fetchOrders();
      showToast({ type: 'success', message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showToast({ type: 'error', message: error.response?.data?.message || 'Failed to cancel order' });
    }
  };

  const canCancelOrder = (order) => {
    return order.status === 'PENDING' || order.status === 'SHIPPED';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <Link
          to="/products"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl text-gray-300 mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-lg font-bold text-gray-900">
                    ${Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={(() => {
                        if (item.product.image) {
                          // If it's a base64 endpoint, use cached base64 data
                          if (item.product.image.startsWith('/api/v1/images/base64/')) {
                            return imageCache[item.product.image] || '/defaultProduct.png';
                          }
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
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        console.log(`CustomerOrders image failed to load: ${e.target.src}`);
                        if (e.target.src !== '/defaultProduct.png') {
                          e.target.src = '/defaultProduct.png';
                        }
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                {order.items?.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>

              {/* Order Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Link
                  to={`/orders/${order.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  View Details
                </Link>
                
                {canCancelOrder(order) && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
                
                {order.status === 'DELIVERED' && (
                  <button
                    onClick={() => {
                      // Add reorder functionality
                      showToast({ type: 'info', message: 'Reorder feature coming soon!' });
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {page} of {Math.ceil(total / 10)}
              </span>
              
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 10)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
