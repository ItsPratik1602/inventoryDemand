import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAPIs() {
  try {
    // 1. Register a test user
    console.log('🔍 Registering test user...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'ADMIN'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Register response:', JSON.stringify(registerData, null, 2));

    // 2. Login to get token
    console.log('\n🔍 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    const token = loginData.data?.token;
    if (!token) {
      console.error('❌ No token received');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. Test Products API
    console.log('\n🔍 Testing Products API...');
    const productsResponse = await fetch(`${BASE_URL}/products?page=1&limit=3`, {
      headers
    });
    const productsData = await productsResponse.json();
    console.log('Products API response:', JSON.stringify(productsData, null, 2));

    // 4. Test Inventory API
    console.log('\n🔍 Testing Inventory API...');
    const inventoryResponse = await fetch(`${BASE_URL}/inventory?page=1&limit=3`, {
      headers
    });
    const inventoryData = await inventoryResponse.json();
    console.log('Inventory API response:', JSON.stringify(inventoryData, null, 2));

    // 5. Test Users API
    console.log('\n🔍 Testing Users API...');
    const usersResponse = await fetch(`${BASE_URL}/users?page=1&limit=3`, {
      headers
    });
    const usersData = await usersResponse.json();
    console.log('Users API response:', JSON.stringify(usersData, null, 2));

    // 6. Test Alerts API
    console.log('\n🔍 Testing Alerts API...');
    const alertsResponse = await fetch(`${BASE_URL}/alerts?page=1&limit=3`, {
      headers
    });
    const alertsData = await alertsResponse.json();
    console.log('Alerts API response:', JSON.stringify(alertsData, null, 2));

  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  }
}

testAPIs();
