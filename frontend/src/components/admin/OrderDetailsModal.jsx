import React, { useState } from 'react';
import Modal from '../Modal.jsx';
import Button from '../Button.jsx';
import OrderStatusBadge from './OrderStatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../lib/api.js';

const OrderDetailsModal = ({ order, isOpen, onClose, onOrderUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, status: null });
  const { showToast } = useToast();

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
        showToast({ 
          type: 'success', 
          message: `Order marked as ${newStatus.toLowerCase()} successfully` 
        });
        onOrderUpdated();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
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

  const totals = calculateTotals();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={formatOrderId(order.id)} size="large">
        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <OrderStatusBadge status={order.status} />
              <p className="text-sm text-gray-500 mt-1">Last updated: {formatDate(order.updatedAt)}</p>
            </div>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
              <p className="text-sm text-gray-900">{order.paymentMethod || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Status</h4>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Total Amount</h4>
              <p className="text-lg font-semibold text-gray-900">{formatAmount(order.totalAmount)}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Name</h5>
                  <p className="text-sm text-gray-900">{order.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Email</h5>
                  <p className="text-sm text-gray-900">{order.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Phone</h5>
                  <p className="text-sm text-gray-900">{order.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Address</h5>
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
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                              src={item.product?.image || '/placeholder-product.png'}
                              alt={item.product?.name || 'Product'}
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
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
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
          </div>

          {/* Status Actions */}
          {getStatusActions(order.status).length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h4>
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

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, status: null })}
        title="Confirm Action"
        size="small"
      >
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
      </Modal>
    </>
  );
};

export default OrderDetailsModal;
