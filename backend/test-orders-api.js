import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testOrdersAPI() {
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

    console.log('\n🔍 Testing Admin Orders API...');
    const ordersResponse = await fetch(`${BASE_URL}/admin/orders?page=1&limit=2`, {
      headers
    });
    const ordersData = await ordersResponse.json();
    console.log('Orders API - Success:', ordersData.success);
    console.log('Orders API - Message:', ordersData.message);
    if (ordersData.success) {
      console.log('Orders API - Items count:', ordersData.data?.items?.length);
      if (ordersData.data?.items?.length > 0) {
        const order = ordersData.data.items[0];
        console.log('Sample order structure:');
        console.log('- id:', order.id);
        console.log('- totalAmount:', typeof order.totalAmount, order.totalAmount);
        console.log('- status:', order.status);
        console.log('- user:', order.user ? 'PRESENT' : 'MISSING');
        console.log('- user.name:', order.user?.name || 'MISSING');
        console.log('- createdAt:', order.createdAt);
        console.log('- items:', order.items ? order.items.length : 'MISSING');
      }
    }

  } catch (error) {
    console.error('❌ Error testing Orders API:', error);
  }
}

testOrdersAPI();
