import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testLowStockAPI() {
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

    console.log('\n🔍 Testing /inventory/low-stock API...');
    const lowStockResponse = await fetch(`${BASE_URL}/inventory/low-stock?threshold=5`, {
      headers
    });
    const lowStockData = await lowStockResponse.json();
    console.log('Low Stock API - Success:', lowStockData.success);
    console.log('Low Stock API - Items count:', lowStockData.data?.length);
    if (lowStockData.data?.length > 0) {
      console.log('Sample low stock item:');
      console.log(JSON.stringify(lowStockData.data[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing Low Stock API:', error);
  }
}

testLowStockAPI();
