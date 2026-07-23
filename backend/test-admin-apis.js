import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAdminAPIs() {
  try {
    // 1. Register an admin user
    console.log('🔍 Registering admin user...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'ADMIN'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Register response:', JSON.stringify(registerData, null, 2));

    // 2. Login to get token
    console.log('\n🔍 Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
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
    const productsResponse = await fetch(`${BASE_URL}/products?page=1&limit=2`, {
      headers
    });
    const productsData = await productsResponse.json();
    console.log('Products API - Success:', productsData.success);
    console.log('Products API - Items count:', productsData.data?.items?.length);
    if (productsData.data?.items?.length > 0) {
      console.log('Sample product:', JSON.stringify(productsData.data.items[0], null, 2));
    }

    // 4. Test Inventory API
    console.log('\n🔍 Testing Inventory API...');
    const inventoryResponse = await fetch(`${BASE_URL}/inventory?page=1&limit=2`, {
      headers
    });
    const inventoryData = await inventoryResponse.json();
    console.log('Inventory API - Success:', inventoryData.success);
    console.log('Inventory API - Message:', inventoryData.message);
    if (inventoryData.success) {
      console.log('Inventory API - Items count:', inventoryData.data?.items?.length);
      if (inventoryData.data?.items?.length > 0) {
        console.log('Sample inventory item:', JSON.stringify(inventoryData.data.items[0], null, 2));
      }
    }

    // 5. Test Users API
    console.log('\n🔍 Testing Users API...');
    const usersResponse = await fetch(`${BASE_URL}/users?page=1&limit=2`, {
      headers
    });
    const usersData = await usersResponse.json();
    console.log('Users API - Success:', usersData.success);
    console.log('Users API - Message:', usersData.message);
    if (usersData.success) {
      console.log('Users API - Items count:', usersData.data?.items?.length);
      if (usersData.data?.items?.length > 0) {
        console.log('Sample user:', JSON.stringify(usersData.data.items[0], null, 2));
      }
    }

    // 6. Test Alerts API
    console.log('\n🔍 Testing Alerts API...');
    const alertsResponse = await fetch(`${BASE_URL}/alerts?page=1&limit=2`, {
      headers
    });
    const alertsData = await alertsResponse.json();
    console.log('Alerts API - Success:', alertsData.success);
    console.log('Alerts API - Message:', alertsData.message);
    if (alertsData.success) {
      console.log('Alerts API - Items count:', alertsData.data?.items?.length);
      if (alertsData.data?.items?.length > 0) {
        console.log('Sample alert:', JSON.stringify(alertsData.data.items[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  }
}

testAdminAPIs();
