import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import OrderDetailsModal from '../components/admin/OrderDetailsModal.jsx';
import OrderStatusBadge from '../components/admin/OrderStatusBadge.jsx';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    dateRange: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Debounced search
  const debouncedSearch = useMemo(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        order: sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await api.get(`/admin/orders?${params}`);
      const data = response.data.data || response.data;
      
      setOrders(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders');
      showToast({ type: 'error', message: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, sortBy, sortOrder, filters.status, filters.paymentStatus, filters.dateRange]);

  useEffect(() => {
    return debouncedSearch;
  }, [debouncedSearch]);

  
  // Define valid status transitions
  const getValidTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['SHIPPED', 'CANCELLED'];
      case 'SHIPPED':
        return ['DELIVERED', 'CANCELLED'];
      case 'DELIVERED':
      case 'CANCELLED':
        return []; // Terminal states
      default:
        return [];
    }
  };

  // Get confirmation message based on transition
  const getConfirmationMessage = (currentStatus, newStatus) => {
    if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
      return `Are you sure you want to mark this order as ${newStatus.toLowerCase()}? This action cannot be undone.`;
    }
    return `Are you sure you want to change order status from ${currentStatus.toLowerCase()} to ${newStatus.toLowerCase()}?`;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewOrder = (order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
    setIsDetailsModalOpen(false);
    showToast({ type: 'success', message: 'Order updated successfully' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
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
    <div className="app-page">
      {/* Page Header */}
      <div className="bg-white border-b border-[color:var(--line)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">
            Orders Management
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Order ID, Customer name, Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="soft"
                size="small"
                onClick={() => setFilters({ search: '', status: '', paymentStatus: '', dateRange: '' })}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-[color:var(--muted)] mb-4">📦</div>
            <h3 className="text-xl font-semibold text-[color:var(--text)] mb-2">
              No orders found
            </h3>
            <p className="text-[color:var(--muted)]">
              No orders have been placed yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-hidden">
              <table 
                className="w-full" 
                style={{ 
                  tableLayout: 'fixed',
                  width: '100%'
                }}
              >
                <thead className="bg-[color:var(--background)] border-b border-[color:var(--line)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[color:var(--muted)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--line)]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleViewOrder(order)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[color:var(--text)]">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--text)] max-w-xs truncate">
                        {order.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[color:var(--accent)]">
                        ${Number(order.totalAmount || order.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleViewOrder(order)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="soft"
                size="small"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page}
              </span>
              <Button
                variant="soft"
                size="small"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}

export default AdminOrdersPage;
