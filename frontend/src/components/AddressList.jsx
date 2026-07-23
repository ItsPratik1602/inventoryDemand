import React, { useState, useEffect } from 'react';
import AddressCard from './AddressCard.jsx';
import Loader from './Loader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';

const AddressList = ({ 
  onAddressSelect, 
  selectedAddressId, 
  showEditButton = false,
  onEditAddress,
  disabled = false 
}) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== AddressList: Fetching addresses ===');
      const response = await api.get('/user/addresses');
      console.log('AddressList: API Response:', response.data);
      console.log('AddressList: Addresses data:', response.data.data);
      
      const addresses = response.data.data || [];
      console.log('AddressList: Setting addresses:', addresses);
      setAddresses(addresses);
    } catch (error) {
      console.error('AddressList: Failed to fetch addresses:', error);
      console.error('AddressList: Error response:', error.response);
      setError('Failed to load addresses');
      showToast({
        type: 'error',
        message: 'Failed to load addresses'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  const handleEditAddress = (address) => {
    if (onEditAddress) {
      onEditAddress(address);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {/* Skeleton loaders */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24 mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchAddresses}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-2">No saved addresses</p>
        <p className="text-sm text-gray-500">Please add a new delivery address below</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        <button
          onClick={fetchAddresses}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onSelect={handleSelectAddress}
          isSelected={selectedAddressId === address.id}
          showEditButton={showEditButton}
          onEditAddress={handleEditAddress}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default AddressList;
