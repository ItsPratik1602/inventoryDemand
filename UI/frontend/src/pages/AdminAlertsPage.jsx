import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RestockModal from '../components/RestockModal.jsx';

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [restockModal, setRestockModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    currentStock: 0
  });
  const [filters, setFilters] = useState({
    activeOnly: true,
    type: '',
    severity: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });

  const { showToast } = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      };

      const response = await api.get('/alerts', { params });
      const data = response.data.data;

      setAlerts(data.alerts);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        hasMore: data.hasMore
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/alerts/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch alert stats:', err);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      setActionLoading(prev => ({ ...prev, [alertId]: 'resolve' }));
      await api.patch(`/alerts/${alertId}/resolve`);
      showToast('Alert resolved successfully', 'success');
      fetchAlerts();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve alert', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [alertId]: null }));
    }
  };

  const handleIgnoreAlert = async (alertId) => {
    try {
      setActionLoading(prev => ({ ...prev, [alertId]: 'ignore' }));
      await api.patch(`/alerts/${alertId}/ignore`);
      showToast('Alert ignored successfully', 'success');
      fetchAlerts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to ignore alert', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [alertId]: null }));
    }
  };

  const openRestockModal = (alert) => {
    setRestockModal({
      isOpen: true,
      productId: alert.productId,
      productName: alert.product?.name || 'Unknown Product',
      currentStock: alert.product?.stockQuantity || 0
    });
  };

  const closeRestockModal = () => {
    setRestockModal({
      isOpen: false,
      productId: null,
      productName: '',
      currentStock: 0
    });
  };

  const handleRestockProduct = async (quantity) => {
    try {
      setActionLoading(prev => ({ ...prev, [restockModal.productId]: 'restock' }));
      await api.patch(`/products/${restockModal.productId}/restock`, { quantity });
      showToast('Product restocked successfully', 'success');
      fetchAlerts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restock product', 'error');
      throw err; // Re-throw to let modal handle the error
    } finally {
      setActionLoading(prev => ({ ...prev, [restockModal.productId]: null }));
    }
  };

  const generateAlerts = async () => {
    try {
      await api.post('/alerts/generate');
      showToast('Alerts generated successfully', 'success');
      fetchAlerts();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate alerts', 'error');
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [filters, pagination.page]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-50 border-red-200';
      case 'CRITICAL': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW_STOCK': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'DEMAND_SPIKE': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && alerts.length === 0) {
    return <Loader text="Loading alerts..." />;
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Alert Management"
        description="Monitor and manage inventory alerts and system notifications"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={generateAlerts}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Generate Alerts
            </button>
          </div>
        }
      />

      {/* Alert Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Alerts</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-red-600">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Alerts</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-purple-600">{stats.bySeverity?.HIGH || 0}</p>
                <p className="text-sm text-gray-500">High Priority</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">🔥</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 border mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={filters.activeOnly ? 'active' : 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, activeOnly: e.target.value === 'active' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="active">Active Only</option>
              <option value="all">All Alerts</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="CRITICAL">Critical</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="DEMAND_SPIKE">Demand Spike</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Severity:</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No alerts found'}
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(alert.type)}`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {alert.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: {alert.product?.stockQuantity || 0} | Reorder: {alert.product?.reorderLevel || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{alert.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(alert.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!alert.isResolved && (
                          <>
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              disabled={actionLoading[alert.id] === 'resolve'}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[alert.id] === 'resolve' ? 'Resolving...' : 'Mark Resolved'}
                            </button>
                            <button
                              onClick={() => openRestockModal(alert)}
                              disabled={actionLoading[alert.productId] === 'restock'}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[alert.productId] === 'restock' ? 'Restocking...' : 'Restock'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleIgnoreAlert(alert.id)}
                          disabled={actionLoading[alert.id] === 'ignore'}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[alert.id] === 'ignore' ? 'Ignoring...' : 'Ignore'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page}
              </span>
              <button
                disabled={!pagination.hasMore}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      <RestockModal
        isOpen={restockModal.isOpen}
        onClose={closeRestockModal}
        onConfirm={handleRestockProduct}
        productName={restockModal.productName}
        currentStock={restockModal.currentStock}
      />
    </div>
  );
};

export default AdminAlertsPage;
