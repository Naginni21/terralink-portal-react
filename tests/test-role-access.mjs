#!/usr/bin/env node

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:4500/api/auth';
const JWT_SECRET = 'dev-secret-key-for-local-testing';

// Test users with different roles
const testUsers = [
  { email: 'admin@terralink.cl', role: 'admin', name: 'Admin User' },
  { email: 'ops@terralink.cl', role: 'operaciones', name: 'Ops User' },
  { email: 'sales@terralink.cl', role: 'ventas', name: 'Sales User' },
  { email: 'user@terralink.cl', role: 'usuario', name: 'Regular User' }
];

// Applications and their allowed roles
const applications = [
  { id: 'geotruck', name: 'GeoTruck', roles: ['admin', 'operaciones'] },
  { id: 'geocal', name: 'GeoCal', roles: ['admin', 'operaciones'] },
  { id: 'terralink360', name: 'Terralink 360', roles: ['admin', 'ventas'] },
  { id: 'ctpanel', name: 'Panel CT', roles: ['admin', 'operaciones', 'ventas'] }
];

// Create a valid session by first "logging in" with a mock Google token
async function createValidSession(user) {
  // For testing, we'll directly create a JWT session token
  const sessionToken = jwt.sign(
    {
      userId: `test-${user.email}`,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  // We need to register this session on the server
  // Since we can't mock Google auth, we'll create the session directly
  return sessionToken;
}

async function testRoleAccess() {
  console.log('🔐 Testing Role-Based Access Control\n');
  console.log('=' .repeat(50));

  for (const user of testUsers) {
    console.log(`\n👤 Testing ${user.name} (${user.role})`);
    console.log('-'.repeat(40));

    // Create a valid session token
    const sessionToken = await createValidSession(user);

    // Test each application
    for (const app of applications) {
      const canAccess = app.roles.includes(user.role);
      
      try {
        // Request app token
        const response = await fetch(`${API_BASE}/app-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionToken: sessionToken,
            appId: app.id
          })
        });

        const data = await response.json();
        
        // Check if access matches expectations
        if (canAccess) {
          if (data.appToken) {
            console.log(`  ✅ ${app.name}: Access GRANTED (token generated)`);
          } else {
            console.log(`  ❌ ${app.name}: UNEXPECTED - Should have access but denied`);
          }
        } else {
          if (!data.appToken) {
            console.log(`  ✅ ${app.name}: Access DENIED (as expected)`);
          } else {
            console.log(`  ❌ ${app.name}: UNEXPECTED - Should NOT have access but granted`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  ${app.name}: Error testing - ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Role-based access control test complete\n');
}

// Test app token validation
async function testAppTokenValidation() {
  console.log('🎫 Testing App Token Validation\n');
  console.log('=' .repeat(50));

  // Generate a valid session token first
  const sessionToken = jwt.sign(
    {
      userId: 'test-admin',
      email: 'admin@terralink.cl',
      role: 'admin',
      name: 'Admin User'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  try {
    // Get app token
    console.log('1️⃣  Requesting app token for GeoTruck...');
    const tokenResponse = await fetch(`${API_BASE}/app-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: sessionToken,
        appId: 'geotruck'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.appToken) {
      console.log('   ✅ App token generated successfully');
      console.log(`   Token: ${tokenData.appToken.substring(0, 20)}...`);

      // Validate the token
      console.log('\n2️⃣  Validating app token...');
      const validateResponse = await fetch(`${API_BASE}/validate-app-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appToken: tokenData.appToken
        })
      });

      const validateData = await validateResponse.json();
      
      if (validateData.valid) {
        console.log('   ✅ Token validation successful');
        console.log(`   User: ${validateData.user.email}`);
        console.log(`   App: ${validateData.appId}`);
        console.log(`   Expires: ${new Date(validateData.expiresAt).toLocaleString()}`);
      } else {
        console.log('   ❌ Token validation failed');
      }

      // Test with invalid token
      console.log('\n3️⃣  Testing with invalid token...');
      const invalidResponse = await fetch(`${API_BASE}/validate-app-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appToken: 'invalid_token_12345'
        })
      });

      const invalidData = await invalidResponse.json();
      
      if (!invalidData.valid) {
        console.log('   ✅ Invalid token correctly rejected');
      } else {
        console.log('   ❌ Invalid token was unexpectedly accepted');
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ App token validation test complete\n');
}

// Run tests
console.log('🚀 Starting Role & Token Tests\n');

testRoleAccess()
  .then(() => testAppTokenValidation())
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });