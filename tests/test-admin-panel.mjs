import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-jwt-secret-key-change-in-production';
const API_BASE = 'http://localhost:4500/api';

// Create admin token
const adminToken = jwt.sign({
  email: 'admin@terralink.com.br',
  name: 'Admin User',
  picture: 'https://example.com/pic.jpg',
  role: 'admin',
  domain: 'terralink.com.br'
}, JWT_SECRET, { expiresIn: '30d' });

// Create regular user token
const userToken = jwt.sign({
  email: 'user@terralink.com.br',
  name: 'Regular User',
  picture: 'https://example.com/pic.jpg',
  role: 'customer',
  domain: 'terralink.com.br'
}, JWT_SECRET, { expiresIn: '30d' });

async function testAdminEndpoints() {
  console.log('Testing Admin Panel Endpoints...\n');

  // Test 1: Track activity as regular user
  console.log('1. Testing activity tracking (regular user)...');
  try {
    const response = await fetch(`${API_BASE}/activity/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        appId: 'app1',
        appName: 'Test Application',
        action: 'click',
        metadata: { test: true }
      })
    });
    const result = await response.json();
    console.log('✓ Activity tracked:', result.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('✗ Activity tracking failed:', error.message);
  }

  // Test 2: Get users list (admin only)
  console.log('\n2. Testing user management (admin)...');
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const result = await response.json();
    console.log('✓ Users retrieved:', result.users ? `${result.users.length} users` : 'Failed');
  } catch (error) {
    console.log('✗ User retrieval failed:', error.message);
  }

  // Test 3: Update user role (admin only)
  console.log('\n3. Testing role update (admin)...');
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: 'user@terralink.com.br',
        role: 'customer'
      })
    });
    const result = await response.json();
    console.log('✓ Role updated:', result.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('✗ Role update failed:', error.message);
  }

  // Test 4: Get activity logs (admin)
  console.log('\n4. Testing activity logs retrieval (admin)...');
  try {
    const response = await fetch(`${API_BASE}/activity/track`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const result = await response.json();
    console.log('✓ Activities retrieved:', result.activities ? `${result.activities.length} activities` : 'Failed');
  } catch (error) {
    console.log('✗ Activity retrieval failed:', error.message);
  }

  // Test 5: Domain management (admin only)
  console.log('\n5. Testing domain management (admin)...');
  try {
    // Get domains
    let response = await fetch(`${API_BASE}/admin/domains`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    let result = await response.json();
    console.log('✓ Domains retrieved:', result.domains ? `${result.domains.length} domains` : 'Failed');

    // Add new domain
    response = await fetch(`${API_BASE}/admin/domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        domain: 'test.com'
      })
    });
    result = await response.json();
    console.log('✓ Domain added:', result.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('✗ Domain management failed:', error.message);
  }

  // Test 6: Non-admin access (should fail)
  console.log('\n6. Testing non-admin access (should fail)...');
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    const result = await response.json();
    console.log(response.status === 403 ? '✓ Access correctly denied for non-admin' : '✗ Security issue: non-admin accessed admin endpoint');
  } catch (error) {
    console.log('✗ Test failed:', error.message);
  }

  console.log('\n✅ Admin panel tests completed!');
  console.log('\nTo access the admin panel:');
  console.log('1. Login as an admin user');
  console.log('2. Click the "Admin" button in the navbar');
  console.log('3. Navigate through Users, Activity Logs, and Domains tabs');
}

testAdminEndpoints().catch(console.error);