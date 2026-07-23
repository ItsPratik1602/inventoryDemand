import React, { useState, useEffect } from "react";
import { getUserCoupons, getUserCouponUsage } from "../services/couponService.js";
import { useToast } from "../context/ToastContext.jsx";

const UserCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [couponsData, usageData] = await Promise.all([
          getUserCoupons(),
          getUserCouponUsage()
        ]);
        
        setCoupons(couponsData || []);
        setUsage(usageData || []);
      } catch (error) {
        setError(error.message || "Failed to load coupons");
        showToast({
          type: "error",
          message: error.message || "Failed to load coupons"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDiscount = (coupon) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}% OFF`;
    } else {
      return `$${coupon.value} OFF`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const expiresAt = new Date(coupon.expiresAt);
    
    if (!coupon.isActive) {
      return { text: "Inactive", className: "bg-gray-100 text-gray-700" };
    }
    
    if (expiresAt < now) {
      return { text: "Expired", className: "bg-red-100 text-red-700" };
    }
    
    return { text: "Active", className: "bg-green-100 text-green-700" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Error loading coupons</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "available" 
                  ? "text-blue-600 border-b-2 border-blue-500" 
                  : "text-gray-600 border-b-2 border-transparent hover:text-gray-800"
              }`}
            >
              Available Coupons ({coupons.length})
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "usage" 
                  ? "text-blue-600 border-b-2 border-blue-500" 
                  : "text-gray-600 border-b-2 border-transparent hover:text-gray-800"
              }`}
            >
              Usage History
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "available" && (
            <div className="space-y-4">
              {coupons.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No available coupons</div>
                  <p className="text-gray-600">Start shopping and come back here to see your coupons!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{coupon.code}</h3>
                          <div className={getStatusBadge(coupon).className}>
                            {getStatusBadge(coupon).text}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(coupon.expiresAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {formatDiscount(coupon)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {coupon.minCartValue && `Min order: $${coupon.minCartValue}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {coupon.usageLimit !== null ? `${coupon.usageCount}/${coupon.usageLimit} uses` : "Unlimited"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {coupon.remainingUses !== null ? `${coupon.remainingUses} left` : "Unlimited"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        {coupon.description || "No description available"}
                      </p>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <div className="space-y-4">
              {usage.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No coupon usage history</div>
                  <p className="text-gray-600">Your coupon usage will appear here once you start using coupons.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coupon Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Used At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usage.map((usage, index) => (
                        <tr key={usage.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {usage.coupon?.code || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {usage.coupon ? formatDiscount(usage.coupon) : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${usage.order?.totalAmount ? `$${usage.order.totalAmount.toFixed(2)}` : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(usage.usedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCoupons;
