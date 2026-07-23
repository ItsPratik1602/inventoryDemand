import React, { useState, useEffect } from "react";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import Button from "../components/Button.jsx";

function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    user: '',
    dateRange: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get("/admin/audit", {
        params: { 
          page, 
          limit: 20,
          ...filters
        }
      });
      setLogs(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      showToast({ type: "error", message: "Failed to load audit logs" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse and format details
  const formatDetails = (details, ipAddress) => {
    if (!details) return '-';
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      const parts = [];
      
      // Handle different action types
      if (parsed.email) {
        parts.push(`Email: ${parsed.email}`);
      }
      
      if (parsed.role) {
        parts.push(`Role: ${parsed.role}`);
      }
      
      if (parsed.productName) {
        parts.push(`Product: ${parsed.productName}`);
      }
      
      if (parsed.categoryName) {
        parts.push(`Category: ${parsed.categoryName}`);
      }
      
      if (parsed.orderId) {
        parts.push(`Order: #${parsed.orderId}`);
      }
      
      if (parsed.quantity) {
        parts.push(`Quantity: ${parsed.quantity}`);
      }
      
      if (parsed.price) {
        parts.push(`Price: $${parsed.price}`);
      }
      
      if (parsed.status) {
        parts.push(`Status: ${parsed.status}`);
      }
      
      // Add IP only if it's not already in the IP column
      if (parsed.ipAddress && parsed.ipAddress !== ipAddress) {
        parts.push(`IP: ${parsed.ipAddress}`);
      }
      
      // Add any other relevant fields
      Object.keys(parsed).forEach(key => {
        if (!['email', 'role', 'productName', 'categoryName', 'orderId', 'quantity', 'price', 'status', 'ipAddress', 'userAgent'].includes(key) && parsed[key]) {
          parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${parsed[key]}`);
        }
      });
      
      return parts.length > 0 ? parts.join(' • ') : '-';
    } catch (error) {
      return '-';
    }
  };

  // Get action-specific styling
  const getActionBadge = (action) => {
    const styles = {
      'LOGIN': 'bg-green-100 text-green-700 border-green-200',
      'LOGOUT': 'bg-gray-100 text-gray-700 border-gray-200',
      'CREATE': 'bg-blue-100 text-blue-700 border-blue-200',
      'UPDATE': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'DELETE': 'bg-red-100 text-red-700 border-red-200',
      'ORDER_PLACED': 'bg-purple-100 text-purple-700 border-purple-200',
      'PAYMENT': 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    
    return styles[action] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get action icon
  const getActionIcon = (action) => {
    const icons = {
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'ORDER_PLACED': '🛒',
      'PAYMENT': '💳'
    };
    
    return icons[action] || '📝';
  };

  // Toggle row expansion
  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading audit logs..." />
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Page Header */}
      <div className="bg-white border-b border-[color:var(--line)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">
            Audit Logs
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Filters
            </h2>
            <Button
              variant="soft"
              size="small"
              onClick={() => setFilters({ action: '', entityType: '', user: '', dateRange: '' })}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">🔑 Login</option>
                <option value="LOGOUT">🚪 Logout</option>
                <option value="CREATE">➕ Create</option>
                <option value="UPDATE">✏️ Update</option>
                <option value="DELETE">🗑️ Delete</option>
                <option value="ORDER_PLACED">🛒 Order Placed</option>
                <option value="PAYMENT">💳 Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Entities</option>
                <option value="USER">👤 User</option>
                <option value="PRODUCT">📦 Product</option>
                <option value="ORDER">🛒 Order</option>
                <option value="CATEGORY">📂 Category</option>
                <option value="CART">🛗 Cart</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <input
                type="text"
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                placeholder="Search by user name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No audit logs found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {Object.values(filters).some(v => v) 
                ? "No audit logs match your current filters. Try adjusting your search criteria."
                : "No audit logs have been recorded yet. Activity will appear here as users interact with the system."
              }
            </p>
            {Object.values(filters).some(v => v) && (
              <Button
                variant="soft"
                onClick={() => setFilters({ action: '', entityType: '', user: '', dateRange: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const isExpanded = expandedRows.has(log.id);
                  const formattedDetails = formatDetails(log.details, log.ipAddress);
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleRowExpansion(log.id)}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs">👤</span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {log.user?.name || 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadge(log.action)}`}>
                            <span className="mr-1">{getActionIcon(log.action)}</span>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-xs text-gray-500">#{log.entityId}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="max-w-xs truncate" title={formattedDetails}>
                            {formattedDetails}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(log.id);
                            }}
                          >
                            {isExpanded ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-900">Full Details</h4>
                                <span className="text-xs text-gray-500">Log ID: {log.id}</span>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                              {log.userAgent && (
                                <div className="text-xs text-gray-500">
                                  <strong>User Agent:</strong> {log.userAgent}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                size="small"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ← Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <Button
                variant="soft"
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page * 20 >= total}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAuditPage;
