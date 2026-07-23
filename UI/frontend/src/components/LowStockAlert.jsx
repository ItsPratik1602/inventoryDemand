import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';

const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/low-stock?threshold=5');
      setLowStockProducts(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch low stock products:', err);
      setError('Failed to load low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-700 text-sm">All products are sufficiently stocked</span>
        </div>
      </div>
    );
  }

  const outOfStockCount = lowStockProducts.filter(p => p.quantity === 0).length;
  const lowStockCount = lowStockProducts.filter(p => p.quantity > 0 && p.quantity <= 5).length;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-red-600 font-semibold">Low Stock Alert</h3>
        </div>
        <span className="text-red-600 text-sm font-medium">
          {lowStockProducts.length} items
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 mb-3">
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
          {outOfStockCount} out of stock
        </span>
        {lowStockCount > 0 && (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
            {lowStockCount} low stock
          </span>
        )}
      </div>

      {/* Product list */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {lowStockProducts.slice(0, 5).map((product) => (
          <div key={product.id} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="font-medium text-gray-900">{product.name}</span>
              {product.category && (
                <span className="text-gray-500 text-xs ml-2">
                  ({product.category.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                product.quantity === 0 
                  ? 'text-red-600' 
                  : product.quantity <= 2 
                    ? 'text-orange-600' 
                    : 'text-yellow-600'
              }`}>
                {product.quantity} left
              </span>
              <span className="text-gray-500 text-xs">
                ${product.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
        
        {lowStockProducts.length > 5 && (
          <div className="text-center text-xs text-gray-500 pt-1 border-t">
            +{lowStockProducts.length - 5} more items
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="mt-3 pt-3 border-t border-red-200">
        <button
          onClick={() => window.location.href = '/admin/inventory'}
          className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Manage Inventory
        </button>
      </div>
    </div>
  );
};

export default LowStockAlert;
