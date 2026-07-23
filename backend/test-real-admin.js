import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testRealAdminAPIs() {
  try {
    // 1. Login as existing admin
    console.log('🔍 Logging in as existing admin...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password' // Try common password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.log('❌ Login failed, trying different password...');
      // Try with admin123
      const loginResponse2 = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });

      const loginData2 = await loginResponse2.json();
      console.log('Second login response:', JSON.stringify(loginData2, null, 2));

      if (!loginData2.success) {
        console.error('❌ Could not login as admin');
        return;
      }

      var token = loginData2.data?.token;
    } else {
      var token = loginData.data?.token;
    }

    if (!token) {
      console.error('❌ No token received');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n✅ Successfully logged in as admin!');

    // 2. Test Products API
    console.log('\n🔍 Testing Products API...');
    const productsResponse = await fetch(`${BASE_URL}/products?page=1&limit=2`, {
      headers
    });
    const productsData = await productsResponse.json();
    console.log('Products API - Success:', productsData.success);
    console.log('Products API - Items count:', productsData.data?.items?.length);
    if (productsData.data?.items?.length > 0) {
      const product = productsData.data.items[0];
      console.log('Sample product structure:');
      console.log('- id:', product.id);
      console.log('- name:', product.name);
      console.log('- category:', product.category?.name || 'MISSING');
      console.log('- inventory:', product.inventory ? 'PRESENT' : 'MISSING');
      console.log('- price:', typeof product.price, product.price);
    }

    // 3. Test Inventory API
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
        const item = inventoryData.data.items[0];
        console.log('Sample inventory structure:');
        console.log('- id:', item.id);
        console.log('- productId:', item.productId);
        console.log('- quantity:', item.quantity);
        console.log('- product.name:', item.product?.name || 'MISSING');
        console.log('- product.category:', item.product?.category?.name || 'MISSING');
        console.log('- product.price:', typeof item.product?.price, item.product?.price);
      }
    }

    // 4. Test Users API
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
        const user = usersData.data.items[0];
        console.log('Sample user structure:');
        console.log('- id:', user.id);
        console.log('- name:', user.name);
        console.log('- email:', user.email);
        console.log('- role:', user.role);
        console.log('- mobileNumber:', user.mobileNumber || 'NULL');
      }
    }

    // 5. Test Alerts API
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
        const alert = alertsData.data.items[0];
        console.log('Sample alert structure:');
        console.log('- id:', alert.id);
        console.log('- inventoryId:', alert.inventoryId);
        console.log('- productName:', alert.productName);
        console.log('- category:', alert.category || 'MISSING');
        console.log('- quantity:', alert.quantity);
        console.log('- threshold:', alert.threshold);
      }
    }

  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  }
}

testRealAdminAPIs();
