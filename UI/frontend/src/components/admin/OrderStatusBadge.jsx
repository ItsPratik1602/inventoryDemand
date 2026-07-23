import React from 'react';

const OrderStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          className: 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800',
          label: 'Pending'
        };
      case 'SHIPPED':
        return {
          className: 'px-2 py-1 text-xs rounded bg-blue-100 text-blue-800',
          label: 'Shipped'
        };
      case 'DELIVERED':
        return {
          className: 'px-2 py-1 text-xs rounded bg-green-100 text-green-800',
          label: 'Delivered'
        };
      case 'CANCELLED':
        return {
          className: 'px-2 py-1 text-xs rounded bg-red-100 text-red-800',
          label: 'Cancelled'
        };
      default:
        return {
          className: 'px-2 py-1 text-xs rounded bg-gray-100 text-gray-800',
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return <span className={config.className}>{config.label}</span>;
};

export default OrderStatusBadge;
