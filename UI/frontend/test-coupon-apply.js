import api from '../lib/api.js';

async function testCouponApply() {
  try {
    console.log('🔍 Testing coupon apply from frontend...');
    
    const response = await api.post('/coupons/apply', {
      code: 'SAVE10',
      cartTotal: 100
    });

    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error URL:', error.config?.url);
    console.error('Full error:', error);
  }
}

testCouponApply();
