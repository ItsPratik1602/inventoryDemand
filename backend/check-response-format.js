import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function checkResponseFormat() {
  try {
    // Login
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data?.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Check one API response format
    const response = await fetch(`${BASE_URL}/products?page=1&limit=1`, { headers });
    const data = await response.json();
    
    console.log('=== FULL RESPONSE STRUCTURE ===');
    console.log('Type of data:', typeof data);
    console.log('Keys in data:', Object.keys(data || {}));
    console.log('data.success:', data?.success);
    console.log('data.message:', data?.message);
    console.log('data.data type:', typeof data?.data);
    console.log('Keys in data.data:', Object.keys(data?.data || {}));
    console.log('data.data.items type:', typeof data?.data?.items);
    console.log('data.data.items length:', data?.data?.items?.length);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkResponseFormat();
