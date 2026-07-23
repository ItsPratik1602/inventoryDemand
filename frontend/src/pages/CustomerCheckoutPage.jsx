import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import CouponApply from '../components/CouponApply.jsx';
import PaymentMethod from '../components/PaymentMethod.jsx';
import AddressList from '../components/AddressList.jsx';
import { formatCurrency } from '../utils/currency.js';

const CustomerCheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: ''
  });
  const [paymentResult, setPaymentResult] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [errors, setErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(null);
  const [rewardPointsToUse, setRewardPointsToUse] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCart();
    fetchRewardBalance();
  }, [user, navigate]);

  useEffect(() => {
    // Auto-load default address if no address is selected
    const loadDefaultAddress = async () => {
      try {
        const response = await api.get('/user/addresses/default');
        if (response.data.data) {
          handleAddressSelect(response.data.data);
        }
      } catch (error) {
        // No default address or error - that's fine
        console.log('No default address found');
      }
    };

    if (!selectedAddress) {
      loadDefaultAddress();
    }
  }, [selectedAddress]);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      const cartData = response.data.data || response.data;
      
      if (!cartData?.items || cartData.items.length === 0) {
        navigate('/cart');
        return;
      }

      setCart({
        items: cartData.items,
        total: cartData.total || 0
      });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to load cart' });
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardBalance = async () => {
    try {
      const response = await api.get('/rewards/balance');
      setRewardBalance(response.data.data);
    } catch (error) {
      console.error('Failed to load reward balance:', error);
    }
  };

  const validateAddress = () => {
    const newErrors = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    
    // Auto-fill the form with selected address
    setShippingAddress({
      fullName: address.fullName,
      address: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.pincode,
      country: 'United States', // Default country
      phone: address.phone
    });

    // Clear any existing errors
    setErrors({});
    
    showToast({
      type: 'success',
      message: 'Address selected successfully'
    });
  };

  const saveAddressImmediately = async () => {
    if (!validateAddress()) {
      showToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const addressData = {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.postalCode,
        isDefault: false
      };

      console.log('=== Saving Address Immediately ===');
      console.log('Address data:', addressData);

      const response = await api.post('/user/addresses', addressData);
      
      console.log('Address saved successfully:', response.data);
      
      showToast({
        type: 'success',
        message: 'Address saved successfully!'
      });

      // Clear the form after saving
      setShippingAddress({
        fullName: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: ''
      });
      
      // Uncheck the save checkbox
      setSaveNewAddress(false);
      
      // Clear any existing errors
      setErrors({});
      
      // Trigger a refresh of the AddressList component by forcing a re-render
      setSelectedAddress(null);
      
      // Refresh the page to show the new address
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save address:', error);
      showToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save address'
      });
    }
  };

  const saveAddressAfterOrder = async () => {
    if (!saveNewAddress || selectedAddress) {
      return; // Don't save if checkbox is not checked or if using existing address
    }

    try {
      const addressData = {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.postalCode,
        isDefault: false
      };

      await api.post('/user/addresses', addressData);
      
      showToast({
        type: 'success',
        message: 'Address saved for future use'
      });
    } catch (error) {
      console.error('Failed to save address:', error);
      // Don't show error to user as order was placed successfully
    }
  };

  const handleInputChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCouponApplied = (couponData) => {
    setAppliedCoupon(couponData);
    setCouponError("");
    showToast({ type: 'success', message: `Coupon applied! You saved $${couponData.discount.toFixed(2)}` });
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const calculateSubtotal = () => {
    return cart.total;
  };

  const calculateDiscount = () => {
    return appliedCoupon && appliedCoupon.discountAmount ? appliedCoupon.discountAmount : 0;
  };

  const calculateShipping = () => {
    return cart.total > 50 ? 0 : 5.99;
  };

  const getMaxRewardPointsRedeemable = () => {
    const subtotalAfterCoupon = Math.max(0, calculateSubtotal() - (appliedCoupon?.discount || 0));
    const availablePoints = rewardBalance?.totalPoints || 0;
    return Math.min(availablePoints, Math.floor(subtotalAfterCoupon));
  };

  const calculateRewardDiscount = () => {
    return Math.min(Math.max(Number(rewardPointsToUse) || 0, 0), getMaxRewardPointsRedeemable());
  };

  const calculateEarnablePoints = () => {
    const orderRule = rewardBalance?.rules?.find((rule) => rule.actionType === 'ORDER' && rule.isActive);

    if (!orderRule) {
      return 0;
    }

    const spendUnit = rewardBalance?.orderSpendUnit || 100;
    const netAmount = Math.max(0, calculateSubtotal() - (appliedCoupon?.discount || 0) - calculateRewardDiscount());
    return Math.floor(netAmount / spendUnit) * orderRule.points;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const couponDiscount = appliedCoupon?.discount || 0;
    const rewardDiscount = calculateRewardDiscount();
    return Math.max(0, subtotal + shipping - couponDiscount - rewardDiscount);
  };

  const handlePaymentComplete = async (paymentData) => {
    if (!validateAddress()) {
      showToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setPaymentResult(paymentData);
    setPlacingOrder(true);
    
    try {
      const orderData = {
        shippingAddress,
        paymentMethod: paymentData.method,
        couponId: appliedCoupon?.couponId ?? null,
        rewardPointsToUse: calculateRewardDiscount(),
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      console.log('=== CUSTOMER CHECKOUT ORDER PAYLOAD ===');
      console.log('Applied coupon state:', appliedCoupon);
      console.log('Final order payload:', orderData);

      const response = await api.post('/customer/orders', orderData);
      
      // Save address for future use if requested
      await saveAddressAfterOrder();
      
      showToast({ type: 'success', message: 'Order placed successfully!' });
      
      // Clear cart
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Redirect to order success page
      navigate('/order-success', { 
        state: { 
          orderId: response.data.data.id,
          orderData: {
            ...response.data.data,
            paymentDetails: paymentData
          }
        } 
      });
    } catch (error) {
      console.error('Failed to place order:', error);
      showToast({ type: 'error', message: error.response?.data?.message || 'Failed to place order' });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  console.log('=== Checkout Page Render ===');
  console.log('Cart items:', cart.items?.length);
  console.log('Selected address:', selectedAddress);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saved Addresses */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <AddressList
              onAddressSelect={handleAddressSelect}
              selectedAddressId={selectedAddress?.id}
              showEditButton={false}
              disabled={placingOrder}
            />
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {selectedAddress ? 'Delivery Address' : 'New Delivery Address'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => {
                    // Only allow numbers, plus, spaces, dashes, and parentheses
                    const value = e.target.value.replace(/[^0-9+\s\-\(\)]/g, '');
                    handleInputChange('phone', value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 234 567 8900"
                  inputMode="tel"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={shippingAddress.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main St, Apt 4B"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange('postalCode', value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10001"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Save Address Option */}
          {!selectedAddress && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Save this address for future use
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                We'll save this address to make future checkouts faster
              </p>
              
              {/* Save Address Button */}
              {saveNewAddress && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={saveAddressImmediately}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Save Address Now
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Save this address immediately and use it for future orders
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Coupon Section */}
          <CouponApply 
            cartTotal={calculateSubtotal()} 
            onCouponApplied={handleCouponApplied}
            onTotalChange={(newTotal) => {
              // Update the total calculation to include coupon discount
              // This will be handled in the calculateTotal function
            }}
          />

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Use Reward Points</h2>
                <p className="text-sm text-gray-500">
                  Available balance: <span className="font-medium text-gray-900">{rewardBalance?.totalPoints || 0} points</span>
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Value: {formatCurrency((rewardBalance?.totalPoints || 0) * (rewardBalance?.pointValue || 1))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="number"
                min="0"
                max={getMaxRewardPointsRedeemable()}
                value={rewardPointsToUse}
                onChange={(event) => setRewardPointsToUse(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reward points to redeem"
              />
              <p className="text-sm text-gray-500">
                Max redeemable now: {getMaxRewardPointsRedeemable()} points
              </p>
              <p className="text-sm text-green-600">
                {calculateEarnablePoints() > 0 
                  ? `You will earn ${calculateEarnablePoints()} point${calculateEarnablePoints() !== 1 ? 's' : ''} from this order (${rewardBalance?.orderSpendUnit || 100} currency units = 1 point)`
                  : 'No reward points will be earned from this order.'}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <PaymentMethod 
            onPaymentComplete={handlePaymentComplete}
            disabled={placingOrder}
            validateAddress={validateAddress}
          />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-4">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Order Summary</h2>
            
            {/* Items */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img
                    src={item.product.image || `https://picsum.photos/seed/${item.product.name}/60/60.jpg`}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{item.product.name}</h3>
                    <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
              </div>

              {/* Coupon Discount */}
              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-${appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}

              {calculateRewardDiscount() > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Reward Points</span>
                  <span>-{formatCurrency(calculateRewardDiscount())}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{calculateShipping() === 0 ? 'FREE' : `$${calculateShipping().toFixed(2)}`}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-lg text-gray-900">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CustomerCheckoutPage;
