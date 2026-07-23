import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Loader from '../../components/Loader.jsx';
import Button from '../../components/Button.jsx';
import OrderStatusBadge from '../../components/admin/OrderStatusBadge.jsx';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, status: null });

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    console.log(`Fetching order details for ID: ${id}`);
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/admin/orders/${id}`);
      console.log('Order details response:', response.data);
      const orderData = response.data.data || response.data;
      
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setError(error.response?.data?.message || 'Failed to load order details');
      showToast({ type: 'error', message: 'Failed to load order details' });
    } finally {
      setLoading(false);
    }
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

  const formatOrderId = (id) => {
    return `#ORD-${String(id).padStart(6, '0')}`;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusActions = (currentStatus) => {
    switch (currentStatus?.toUpperCase()) {
      case 'PENDING':
        return [
          { label: 'Mark as Shipped', status: 'SHIPPED', variant: 'primary' },
          { label: 'Cancel Order', status: 'CANCELLED', variant: 'danger' }
        ];
      case 'SHIPPED':
        return [
          { label: 'Mark as Delivered', status: 'DELIVERED', variant: 'primary' },
          { label: 'Cancel Order', status: 'CANCELLED', variant: 'danger' }
        ];
      case 'DELIVERED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    
    try {
      const response = await api.patch(`/admin/orders/${order.id}/status`, {
        status: newStatus
      });

      if (response.data) {
        const isCOD = order.paymentMethod === 'COD';
        const baseMessage = `Order marked as ${newStatus.toLowerCase()} successfully`;
        const codMessage = isCOD && newStatus === 'DELIVERED' ? ' and payment marked as paid' : '';
        
        showToast({ 
          type: 'success', 
          message: `${baseMessage}${codMessage}!` 
        });
        fetchOrderDetails(); // Refresh order data
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      showToast({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to update order status' 
      });
    } finally {
      setUpdating(false);
      setConfirmModal({ isOpen: false, action: null, status: null });
    }
  };

  const openConfirmModal = (action, status) => {
    setConfirmModal({ isOpen: true, action, status });
  };

  const calculateTotals = () => {
    const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const shipping = order.shippingAddress ? 10 : 0; // Example shipping cost
    const discount = 0; // Could be calculated from coupons
    const total = subtotal + shipping - discount;

    return { subtotal, shipping, discount, total };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader text="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Order</h3>
          <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
          <div className="space-x-3">
            <Button onClick={fetchOrderDetails}>Retry</Button>
            <Button variant="soft" onClick={() => navigate('/admin/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="soft" onClick={() => navigate('/admin/orders')} className="mb-4">
                ← Back to Orders
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{formatOrderId(order.id)}</h1>
              <p className="text-gray-600">Order placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Button variant="soft" size="small" onClick={fetchOrderDetails}>
                  🔄 Refresh
                </Button>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-500 mt-1">Last updated: {formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
            <p className="text-sm text-gray-900">{order.paymentMethod || 'N/A'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Status</h3>
            <span className={`px-2 py-1 text-xs rounded ${
              order.paymentStatus === 'PAID' 
                ? 'bg-green-100 text-green-800'
                : order.paymentStatus === 'FAILED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.paymentStatus || 'PENDING'}
            </span>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Total Amount</h3>
            <p className="text-lg font-semibold text-gray-900">{formatAmount(order.totalAmount)}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Name</h4>
              <p className="text-sm text-gray-900">{order.user?.name || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Email</h4>
              <p className="text-sm text-gray-900">{order.user?.email || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Phone</h4>
              <p className="text-sm text-gray-900">{order.shippingAddress?.phone || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Address</h4>
              <p className="text-sm text-gray-900">
                {order.shippingAddress ? (
                  <>
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                    {order.shippingAddress.postalCode}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded object-cover"
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
                            alt={item.product?.name || 'Product'}
                            onLoad={() => console.log(`Image loaded successfully: ${item.product?.image || '/defaultProduct.png'}`)}
                            onError={(e) => {
                              console.log(`Image failed to load: ${e.target.src}`);
                              console.log('Product data:', item.product);
                              // Try fallback
                              if (e.target.src !== '/defaultProduct.png') {
                                e.target.src = '/defaultProduct.png';
                              }
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product?.category || 'No category'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatAmount(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-{formatAmount(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">{formatAmount(totals.shipping)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-base font-bold text-gray-900">{formatAmount(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {getStatusActions(order.status).length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h3>
            <div className="flex flex-wrap gap-3">
              {getStatusActions(order.status).map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  onClick={() => openConfirmModal(action.label, action.status)}
                  disabled={updating}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {confirmModal.action}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to {confirmModal.action?.toLowerCase()} for order {formatOrderId(order.id)}? 
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="soft"
                  onClick={() => setConfirmModal({ isOpen: false, action: null, status: null })}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate(confirmModal.status)}
                  disabled={updating}
                  loading={updating}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailsPage;
