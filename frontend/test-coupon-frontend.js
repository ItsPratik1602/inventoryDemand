// Test coupon application from frontend
import api from '../lib/api.js';

async function testCouponFromFrontend() {
  try {
    console.log('=== Testing Coupon from Frontend ===');
    
    // Test below minimum
    console.log('\n--- Test: Below minimum order ---');
    try {
      const response = await api.post('/coupons/apply', {
        code: 'FLAT15',
        cartTotal: 19.99
      });
      console.log('❌ Should have failed but got success:', response.data);
    } catch (error) {
      console.log('✅ Correctly caught error:');
      console.log('Error message:', error.response?.data?.message);
      console.log('Error status:', error.response?.status);
    }
    
    // Test above minimum
    console.log('\n--- Test: Above minimum order ---');
    try {
      const response = await api.post('/coupons/apply', {
        code: 'FLAT15',
        cartTotal: 50.00
      });
      console.log('✅ Success response:');
      console.log('Discount amount:', response.data.data.discountAmount);
      console.log('Final total:', response.data.data.finalTotal);
    } catch (error) {
      console.log('❌ Should have succeeded but got error:', error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

window.testCouponFromFrontend = testCouponFromFrontend;
console.log('Run: window.testCouponFromFrontend()');
