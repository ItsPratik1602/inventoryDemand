import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';
import OrderTimeline from '../components/OrderTimeline.jsx';

const CustomerOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/customer/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showToast({ type: 'error', message: 'Failed to load order details' });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    
    try {
      await api.patch(`/customer/orders/${id}/status`, { status: 'CANCELLED' });
      await fetchOrderDetails();
      showToast({ type: 'success', message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showToast({ type: 'error', message: error.response?.data?.message || 'Failed to cancel order' });
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      // Add all items back to cart
      for (const item of order.items) {
        await api.post('/cart', {
          productId: item.product.id,
          quantity: item.quantity
        });
      }
      
      window.dispatchEvent(new Event('cartUpdated'));
      showToast({ type: 'success', message: 'Items added to cart successfully' });
      navigate('/cart');
    } catch (error) {
      console.error('Failed to reorder:', error);
      showToast({ type: 'error', message: 'Failed to add items to cart' });
    }
  };

  const canCancelOrder = () => {
    return order && (order.status === 'PENDING' || order.status === 'SHIPPED');
  };

  const canReorder = () => {
    return order && order.status === 'DELIVERED';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    return [
      address.fullName,
      address.address,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean).join(', ');
  };

  if (loading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
          <p className="text-gray-600">Order #{order.id}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <OrderTimeline status={order.status} orderDate={order.createdAt} />

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
            
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                  <img
                    src={(() => {
                const primaryImage = item.product.images?.find(img => img.isPrimary);
                if (primaryImage?.url) {
                  // If it's already a full URL (starts with http), use as-is
                  if (primaryImage.url.startsWith('http')) {
                    return primaryImage.url;
                  }
                  // If it's a local path, add backend URL
                  return `http://localhost:5000${primaryImage.url}`;
                }
                // Fallback to default image
                return '/defaultProduct.png';
              })()}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      console.log(`Customer image failed to load: ${e.target.src}`);
                      if (e.target.src !== '/defaultProduct.png') {
                        e.target.src = '/defaultProduct.png';
                      }
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">{item.product.category?.name || 'Uncategorized'}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${Number(item.price).toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                {formatAddress(order.shippingAddress)}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">FREE</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-lg text-gray-900">
                  ${Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/orders')}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ← Back to Orders
              </button>
              
              {canCancelOrder() && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              
              {canReorder() && (
                <button
                  onClick={handleReorder}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Reorder Items
                </button>
              )}
              
              {order.status === 'SHIPPED' && (
                <div className="text-center text-sm text-gray-600">
                  <p>📦 Your order is on the way!</p>
                  <p>You'll receive it soon.</p>
                </div>
              )}
              
              {order.status === 'DELIVERED' && (
                <div className="text-center text-sm text-green-600">
                  <p>✅ Order delivered successfully!</p>
                  <p>Thank you for your purchase.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetailsPage;
