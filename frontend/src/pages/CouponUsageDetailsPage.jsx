import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatCurrency } from '../utils/currency.js';

const emptyUsageData = {
  totalUsage: 0,
  uniqueUsers: 0,
  totalDiscount: 0,
  averageDiscount: 0,
  invalidUsageCount: 0,
  excludedUsageCount: 0,
  usages: []
};

const CouponUsageDetailsPage = () => {
  const { id: couponId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [coupon, setCoupon] = useState(null);
  const [usageData, setUsageData] = useState(emptyUsageData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!couponId) {
      setError('Invalid coupon ID');
      setLoading(false);
      return;
    }
    fetchCouponUsageDetails();
  }, [couponId]);

  const fetchCouponUsageDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      setCoupon(null);
      setUsageData(emptyUsageData);

      const usageResponse = await api.get(`/coupons/${couponId}/usage`, {
        params: { _ts: Date.now() }
      });

      console.log("Coupon from API:", usageResponse.data.data.coupon);

      setCoupon(usageResponse.data.data.coupon);
      setUsageData(usageResponse.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch coupon usage details');
      showToast({
        type: 'error',
        message: err.message || 'Failed to fetch coupon usage details'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { bg: 'bg-green-100', text: 'text-green-700' },
      Disabled: { bg: 'bg-gray-100', text: 'text-gray-700' },
      Expired: { bg: 'bg-red-100', text: 'text-red-700' },
      'Used Up': { bg: 'bg-orange-100', text: 'text-orange-700' }
    };
    
    const config = statusConfig[status] || statusConfig.Active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={() => navigate('/admin/coupons')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Coupons
          </button>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 text-xl">Coupon not found</div>
          <button
            onClick={() => navigate('/admin/coupons')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Coupons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin/coupons')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Coupons
          </button>
          <button
            type="button"
            onClick={fetchCouponUsageDetails}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh Data
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Coupon Usage Details</h1>
      </div>

      {/* Coupon Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Coupon Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
            <div className="text-lg font-semibold text-gray-900">{coupon.code}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="text-lg text-gray-900">
              {coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div>{getStatusBadge(coupon.status)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage</label>
            <div className="text-lg text-gray-900">
              {usageData.totalUsage} / {coupon.usageLimit || 'Unlimited'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Cart Value</label>
            <div className="text-lg text-gray-900">
              {coupon.minCartValue ? formatCurrency(coupon.minCartValue) : 'No minimum'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
            <div className="text-lg text-gray-900">
              {coupon.maxDiscount ? formatCurrency(coupon.maxDiscount) : 'No maximum'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
            <div className="text-lg text-gray-900">{coupon.perUserLimit || 1}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Order Only</label>
            <div className="text-lg text-gray-900">
              {coupon.isFirstOrderOnly ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
            <div className="text-lg text-gray-900">
              {new Date(coupon.expiresAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {usageData.invalidUsageCount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          {usageData.invalidUsageCount} usage record(s) are missing stored discount values and are excluded from statistics.
        </div>
      )}

      {usageData.excludedUsageCount > 0 && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          {usageData.excludedUsageCount} usage record(s) are excluded from statistics because the related order was cancelled or the payment failed.
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-sm font-medium text-blue-700">Total Uses</div>
            <div className="mt-2 text-3xl font-bold text-blue-900">{usageData.totalUsage}</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <div className="text-sm font-medium text-green-700">Unique Users</div>
            <div className="mt-2 text-3xl font-bold text-green-900">{usageData.uniqueUsers}</div>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <div className="text-sm font-medium text-purple-700">Total Discount</div>
            <div className="mt-2 text-3xl font-bold text-purple-900">{formatCurrency(usageData.totalDiscount)}</div>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <div className="text-sm font-medium text-orange-700">Avg Discount</div>
            <div className="mt-2 text-3xl font-bold text-orange-900">{formatCurrency(usageData.averageDiscount)}</div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usage History</h2>
        
        {usageData.usages && usageData.usages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageData.usages.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {usage.user?.name ?? '—'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {usage.user?.email ?? '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usage.orderId ? (
                        <Link
                          to={`/admin/orders/${usage.orderId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{usage.orderId}
                        </Link>
                      ) : (
                        <div className="text-sm text-gray-500">—</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {usage.discount !== null && usage.discount !== undefined ? (
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(usage.discount)}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-amber-700">
                          Invalid usage record (missing discount)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {usage.includedInStats ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Counted
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {usage.invalidReason && (
                            <div className="text-xs font-medium text-amber-700">{usage.invalidReason}</div>
                          )}
                          {usage.exclusionReason && (
                            <div className="text-xs text-gray-600">{usage.exclusionReason}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(usage.usedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} {new Date(usage.usedAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No usage history available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponUsageDetailsPage;
