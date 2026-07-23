// Debug the API configuration
console.log('=== API Configuration Debug ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Base URL:', import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1");

// Test the API directly
import api from './lib/api.js';

window.testCouponAPI = async function() {
  try {
    console.log('Testing coupon API...');
    const response = await api.post('/coupons/apply', {
      code: 'SAVE10',
      cartTotal: 100
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error config:', error.config);
    console.error('Error response:', error.response);
  }
};

console.log('Test function available: window.testCouponAPI()');
