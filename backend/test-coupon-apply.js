import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCouponApply() {
  try {
    console.log('🔍 Testing coupon apply endpoint...');
    
    // Test the public coupon apply endpoint
    const response = await fetch(`${BASE_URL}/coupons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'SAVE10',
        cartTotal: 100
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      console.log('✅ Coupon apply endpoint working');
    } else {
      console.log('❌ Coupon apply endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing coupon apply:', error.message);
  }
}

testCouponApply();
