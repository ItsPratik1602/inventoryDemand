import React from 'react';

const OrderTimeline = ({ status, orderDate }) => {
  const timelineSteps = [
    { key: 'placed', label: 'Order Placed', status: 'completed', date: orderDate },
    { key: 'shipped', label: 'Shipped', status: status === 'PENDING' ? 'pending' : (status === 'CANCELLED' ? 'cancelled' : 'completed'), date: status !== 'PENDING' ? orderDate : null },
    { key: 'delivered', label: 'Delivered', status: status === 'DELIVERED' ? 'completed' : (status === 'CANCELLED' ? 'cancelled' : 'pending'), date: status === 'DELIVERED' ? orderDate : null }
  ];

  const getStepStyles = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'pending':
        return 'bg-gray-200 border-gray-300 text-gray-500';
      case 'cancelled':
        return 'bg-red-500 border-red-500 text-white';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500';
    }
  };

  const getConnectorStyles = (index, totalSteps, currentStatus) => {
    if (currentStatus === 'CANCELLED') {
      return index < totalSteps - 1 ? 'bg-gray-300' : 'bg-gray-300';
    }
    return index < totalSteps - 1 ? (status === 'DELIVERED' || (status === 'SHIPPED' && index === 0) ? 'bg-green-500' : 'bg-gray-300') : '';
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">Order Timeline</h3>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200"></div>
        
        <div className="relative flex justify-between">
          {timelineSteps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${getStepStyles(step.status)}`}>
                {step.status === 'completed' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.status === 'pending' && (
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                )}
                {step.status === 'cancelled' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Step label */}
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium ${step.status === 'completed' ? 'text-green-600' : step.status === 'cancelled' ? 'text-red-600' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(step.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {/* Connector line */}
              {index < timelineSteps.length - 1 && (
                <div className={`absolute top-5 left-10 right-0 h-0.5 -z-10 transition-colors ${getConnectorStyles(index, timelineSteps.length, status)}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {status === 'CANCELLED' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Order Cancelled</strong> - This order was cancelled and will not be delivered.
          </p>
        </div>
      )}
      
      {status === 'DELIVERED' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Order Delivered</strong> - Your order has been successfully delivered. Thank you for your purchase!
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
