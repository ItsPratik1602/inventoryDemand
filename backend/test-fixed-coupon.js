import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testFixedCoupon() {
  try {
    console.log('🔍 Testing fixed coupon logic...');
    
    // Test with cart total below minimum
    console.log('\n--- Test 1: Below minimum order ---');
    const response1 = await fetch(`${BASE_URL}/coupons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'FLAT15',
        cartTotal: 19.99
      })
    });

    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', data1);

    // Test with cart total above minimum
    console.log('\n--- Test 2: Above minimum order ---');
    const response2 = await fetch(`${BASE_URL}/coupons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'FLAT15',
        cartTotal: 50.00
      })
    });

    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', data2);

    // Test percentage coupon
    console.log('\n--- Test 3: Percentage coupon ---');
    const response3 = await fetch(`${BASE_URL}/coupons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'SAVE10',
        cartTotal: 100.00
      })
    });

    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', data3);
    
  } catch (error) {
    console.error('❌ Error testing coupon:', error.message);
  }
}

testFixedCoupon();
