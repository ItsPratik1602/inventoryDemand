import React, { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

const PaymentMethod = ({ onPaymentComplete, disabled, validateAddress }) => {
  const [selectedMethod, setSelectedMethod] = useState('COD');
  const [onlinePaymentType, setOnlinePaymentType] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '📱' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱' },
    { id: 'paytm', name: 'Paytm', icon: '📱' }
  ];

  const banks = [
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' },
    { id: 'pnb', name: 'Punjab National Bank' }
  ];

  const validateUpiId = (id) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(id);
  };

  const isPaymentValid = () => {
    if (selectedMethod === 'COD') return true;
    
    if (selectedMethod === 'ONLINE') {
      switch (onlinePaymentType) {
        case 'UPI':
          return validateUpiId(upiId);
        case 'APP':
          return selectedApp !== '';
        case 'BANK':
          return selectedBank !== '';
        default:
          return false;
      }
    }
    
    return false;
  };

  const simulatePayment = async (method, details) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // COD always succeeds since there's no actual payment processing
        if (method === 'COD') {
          resolve({
            success: true,
            transactionId: 'COD' + Date.now(),
            method: method,
            details: details
          });
        } else {
          // 80% success rate for online payment methods (demo)
          if (Math.random() < 0.8) {
            resolve({
              success: true,
              transactionId: 'TXN' + Date.now(),
              method: method,
              details: details
            });
          } else {
            reject(new Error('Payment failed. Please try again.'));
          }
        }
      }, 2000 + Math.random() * 1000); // 2-3 seconds
    });
  };

  const handlePayment = async () => {
    // Validate address first if validation function is provided
    if (validateAddress && !validateAddress()) {
      showToast({ type: 'error', message: 'Please fill in all required address fields' });
      return;
    }

    if (!isPaymentValid()) {
      showToast({ type: 'error', message: 'Please complete all required payment fields' });
      return;
    }

    setProcessing(true);

    try {
      let paymentDetails = {};
      let paymentMessage = '';

      // Handle different payment methods
      if (selectedMethod === 'COD') {
        paymentMessage = 'Order confirmed! Cash on delivery selected.';
        showToast({ type: 'info', message: 'Placing your order...' });
      } else {
        // Handle online payment methods
        switch (onlinePaymentType) {
          case 'UPI':
            paymentDetails = { upiId };
            paymentMessage = 'Request sent to your UPI app...';
            break;
          case 'APP':
            const app = upiApps.find(a => a.id === selectedApp);
            paymentDetails = { app: app.name };
            paymentMessage = `Redirecting to ${app.name}...`;
            break;
          case 'BANK':
            const bank = banks.find(b => b.id === selectedBank);
            paymentDetails = { bank: bank.name };
            paymentMessage = `Redirecting to ${bank.name}...`;
            break;
        }
        showToast({ type: 'info', message: paymentMessage });
      }

      const result = await simulatePayment(selectedMethod, paymentDetails);
      
      // Show appropriate success message
      if (selectedMethod === 'COD') {
        showToast({ type: 'success', message: 'Order placed successfully! Cash on delivery.' });
      } else {
        showToast({ type: 'success', message: 'Payment successful!' });
      }
      
      // Call parent callback with payment result
      onPaymentComplete({
        method: selectedMethod,
        status: 'PAID',
        transactionId: result.transactionId,
        details: paymentDetails
      });

    } catch (error) {
      console.error('Payment failed:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const renderOnlinePaymentOptions = () => {
    return (
      <div className="space-y-4">
        {/* Payment Type Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'UPI', label: 'UPI ID' },
            { id: 'APP', label: 'UPI Apps' },
            { id: 'BANK', label: 'Net Banking' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setOnlinePaymentType(type.id)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                onlinePaymentType === type.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Payment Options Content */}
        <div className="p-4">
          {onlinePaymentType === 'UPI' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Enter UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                placeholder="name@upi"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  upiId && !validateUpiId(upiId) ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={processing}
              />
              {upiId && !validateUpiId(upiId) && (
                <p className="text-red-500 text-sm">Please enter a valid UPI ID (e.g., name@upi)</p>
              )}
              <p className="text-xs text-gray-500">
                Example: john@upi, 9876543210@ybl
              </p>
            </div>
          )}

          {onlinePaymentType === 'APP' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select UPI App
              </label>
              <div className="grid grid-cols-3 gap-3">
                {upiApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app.id)}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedApp === app.id
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-2xl mb-1">{app.icon}</div>
                    <div className="text-sm font-medium">{app.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {onlinePaymentType === 'BANK' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processing}
              >
                <option value="">Choose your bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Payment Method</h2>
      
      {/* Main Payment Methods */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={selectedMethod === 'COD'}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="mr-3"
            disabled={disabled}
          />
          <div>
            <div className="font-medium text-gray-900">Cash on Delivery</div>
            <div className="text-sm text-gray-500">Pay when you receive your order</div>
          </div>
        </label>

        <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="ONLINE"
            checked={selectedMethod === 'ONLINE'}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="mr-3"
            disabled={disabled}
          />
          <div>
            <div className="font-medium text-gray-900">Online Payment</div>
            <div className="text-sm text-gray-500">UPI, Credit/Debit Cards, Net Banking</div>
          </div>
        </label>
      </div>

      {/* Online Payment Options */}
      {selectedMethod === 'ONLINE' && renderOnlinePaymentOptions()}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={disabled || processing || !isPaymentValid()}
        className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : selectedMethod === 'COD' ? 'Place Order' : 'Pay Now'}
      </button>
    </div>
  );
};

export default PaymentMethod;
