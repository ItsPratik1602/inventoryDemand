import React from 'react';

const AddressCard = ({ 
  address, 
  onSelect, 
  isSelected = false, 
  showEditButton = false, 
  onEdit,
  disabled = false 
}) => {
  const {
    id,
    fullName,
    phone,
    street,
    city,
    state,
    pincode,
    isDefault
  } = address;

  const handleSelect = () => {
    if (!disabled && onSelect) {
      onSelect(address);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(address);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleSelect}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{fullName}</h3>
            {isDefault && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{phone}</p>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {/* Address */}
      <div className="text-sm text-gray-700">
        <p className="mb-1">{street}</p>
        <p>{city}, {state} - {pincode}</p>
      </div>

      {/* Action Button */}
      <div className="mt-3">
        <button
          onClick={handleSelect}
          disabled={disabled || isSelected}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-green-600 text-white cursor-default'
              : disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSelected ? 'Selected' : 'Deliver Here'}
        </button>
      </div>
    </div>
  );
};

export default AddressCard;
