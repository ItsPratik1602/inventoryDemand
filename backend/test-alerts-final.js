import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAlertsFinal() {
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

    console.log('\n🔍 Testing final Alerts API...');
    const alertsResponse = await fetch(`${BASE_URL}/alerts?page=1&limit=10`, {
      headers
    });
    const alertsData = await alertsResponse.json();
    
    console.log('Alerts API - Success:', alertsData.success);
    console.log('Alerts API - Total items:', alertsData.data?.total);
    console.log('Alerts API - Items returned:', alertsData.data?.items?.length);
    
    if (alertsData.data?.items?.length > 0) {
      console.log('\n📊 Active Alerts:');
      alertsData.data.items.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.productName}`);
        console.log(`   Category: ${alert.category}`);
        console.log(`   Current Stock: ${alert.quantity}`);
        console.log(`   Threshold: ${alert.threshold}`);
        console.log(`   Status: ${alert.quantity === 0 ? 'OUT OF STOCK' : alert.quantity < 5 ? 'CRITICAL' : 'LOW STOCK'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error testing Alerts API:', error);
  }
}

testAlertsFinal();
