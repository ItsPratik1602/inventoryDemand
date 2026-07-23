import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';

const CustomerOrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const { orderId, orderData } = location.state || {};

  React.useEffect(() => {
    if (!orderId) {
      navigate('/cart');
      showToast({ type: 'error', message: 'No order found' });
    }
  }, [orderId, navigate, showToast]);

  if (!orderId) {
    return null;
  }

  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. We've received your order and will begin processing it right away.
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Order ID:</span>
              <p className="font-medium text-gray-900">#{orderId}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Order Date:</span>
              <p className="font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Payment Method:</span>
              <p className="font-medium text-gray-900">
                {orderData?.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Payment Status:</span>
              <p className={`font-medium ${
                orderData?.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {orderData?.paymentStatus === 'PAID' ? 'Paid successfully' : 'Pay on delivery'}
              </p>
            </div>

            {orderData?.paymentDetails && orderData.paymentDetails.method === 'ONLINE' && (
              <div>
                <span className="text-sm text-gray-500">Transaction Details:</span>
                <p className="font-medium text-gray-900">
                  {orderData.paymentDetails.details.upiId && `UPI ID: ${orderData.paymentDetails.details.upiId}`}
                  {orderData.paymentDetails.details.app && `App: ${orderData.paymentDetails.details.app}`}
                  {orderData.paymentDetails.details.bank && `Bank: ${orderData.paymentDetails.details.bank}`}
                </p>
                <p className="text-sm text-gray-500">
                  Transaction ID: {orderData.paymentDetails.transactionId}
                </p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Estimated Delivery:</span>
              <p className="font-medium text-gray-900">
                {estimatedDeliveryDate.toLocaleDateString()} - {new Date(estimatedDeliveryDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            <div className="md:col-span-2">
              <span className="text-sm text-gray-500">Shipping Address:</span>
              <p className="font-medium text-gray-900">
                {orderData?.shippingAddress?.fullName}, {orderData?.shippingAddress?.address}, {orderData?.shippingAddress?.city}, {orderData?.shippingAddress?.postalCode}
              </p>
            </div>

            <div className="md:col-span-2">
              <span className="text-sm text-gray-500">Total Amount:</span>
              <p className="font-semibold text-lg text-gray-900">
                ${Number(orderData?.totalAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <div className="space-y-2 text-blue-800">
            <p>📦 You'll receive an order confirmation email shortly</p>
            <p>🚚 We'll process your order and ship it within 1-2 business days</p>
            <p>📱 You can track your order status in your account</p>
            <p>📞 Our customer service team is here to help if you need anything</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Order Details
          </button>
          
          <button
            onClick={() => navigate('/orders')}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            View All Orders
          </button>
          
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderSuccessPage;
