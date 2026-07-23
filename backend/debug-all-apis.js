import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function debugAllAPIs() {
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
      console.error('❌ Login failed:', loginData);
      return;
    }

    const token = loginData.data?.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n✅ Successfully logged in!');

    // Test all APIs
    const apiTests = [
      { name: 'PRODUCTS', url: '/products?page=1&limit=2' },
      { name: 'INVENTORY', url: '/inventory?page=1&limit=2' },
      { name: 'USERS', url: '/users?page=1&limit=2' },
      { name: 'ORDERS', url: '/admin/orders?page=1&limit=2' },
      { name: 'CATEGORIES', url: '/categories?page=1&limit=2' },
      { name: 'ALERTS', url: '/alerts?page=1&limit=2' }
    ];

    for (const test of apiTests) {
      console.log(`\n🔍 Testing ${test.name} API...`);
      try {
        const response = await fetch(`${BASE_URL}${test.url}`, { headers });
        const data = await response.json();
        
        console.log(`${test.name} API - Success:`, data.success);
        console.log(`${test.name} API - Message:`, data.message);
        
        if (data.success && data.data?.items?.length > 0) {
          console.log(`${test.name} API - Sample item:`);
          console.log(JSON.stringify(data.data.items[0], null, 2));
        } else if (data.success) {
          console.log(`${test.name} API - No items found`);
        } else {
          console.log(`${test.name} API - Error:`, data);
        }
      } catch (error) {
        console.error(`${test.name} API - Request failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugAllAPIs();
