import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCouponAPIs() {
  try {
    // Login as admin
    console.log('🔍 Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginData.data?.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🔍 Testing GET /coupons...');
    const getCouponsResponse = await fetch(`${BASE_URL}/coupons`, {
      headers
    });
    const getCouponsData = await getCouponsResponse.json();
    console.log('GET coupons - Success:', getCouponsData.success);
    console.log('Coupons count:', getCouponsData.data?.items?.length);
    
    if (getCouponsData.data?.items?.length > 0) {
      console.log('Sample coupon:');
      console.log(JSON.stringify(getCouponsData.data.items[0], null, 2));
    }

    console.log('\n🔍 Testing POST /coupons...');
    const newCoupon = {
      code: 'TEST25',
      type: 'PERCENTAGE',
      value: 25,
      minOrderValue: 75,
      usageLimit: 100,
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true
    };

    const createResponse = await fetch(`${BASE_URL}/coupons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newCoupon)
    });
    const createData = await createResponse.json();
    console.log('Create coupon - Success:', createData.success);
    console.log('Create coupon - Message:', createData.message);
    console.log('Create coupon - Error:', createData.error);
    console.log('Created coupon:', createData.data?.code);

    // Test the created coupon
    if (createData.success && createData.data?.id) {
      const couponId = createData.data.id;
      
      console.log('\n🔍 Testing PUT /coupons/:id...');
      const updateResponse = await fetch(`${BASE_URL}/coupons/${couponId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          value: 30,
          minOrderValue: 80
        })
      });
      const updateData = await updateResponse.json();
      console.log('Update coupon - Success:', updateData.success);
      
      console.log('\n🔍 Testing PATCH /coupons/:id/status...');
      const statusResponse = await fetch(`${BASE_URL}/coupons/${couponId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: false })
      });
      const statusData = await statusResponse.json();
      console.log('Update status - Success:', statusData.success);
    }

  } catch (error) {
    console.error('❌ Error testing coupon APIs:', error);
  }
}

testCouponAPIs();
