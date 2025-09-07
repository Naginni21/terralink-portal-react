import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api/auth';

async function testLocalAuth() {
  console.log('Testing Local Auth API...\n');
  
  // Test 1: Health check - validate endpoint
  console.log('1. Testing validate endpoint (should return invalid for missing token)...');
  try {
    const response = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: null })
    });
    const data = await response.json();
    console.log('   Response:', data);
    console.log('   ✓ Validate endpoint accessible\n');
  } catch (error) {
    console.error('   ✗ Error:', error.message, '\n');
  }
  
  // Test 2: Check session endpoint
  console.log('2. Testing check session endpoint...');
  try {
    const response = await fetch(`${API_BASE}/check/test@terralink.cl`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('   Response:', data);
    console.log('   ✓ Check endpoint accessible\n');
  } catch (error) {
    console.error('   ✗ Error:', error.message, '\n');
  }
  
  // Test 3: Login endpoint (will fail without valid Google token)
  console.log('3. Testing login endpoint (expected to fail without valid Google token)...');
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid-token' })
    });
    const data = await response.json();
    console.log('   Response:', data);
    if (data.error) {
      console.log('   ✓ Login endpoint accessible and validates tokens\n');
    }
  } catch (error) {
    console.error('   ✗ Error:', error.message, '\n');
  }
  
  console.log('API Server Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Add http://localhost:6001 to Google OAuth authorized origins');
  console.log('2. Open http://localhost:6001 in your browser');
  console.log('3. Try logging in with a @terralink.cl Google account');
}

testLocalAuth();