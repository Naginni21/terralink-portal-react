#!/usr/bin/env node

/**
 * Test Authentication Flow
 * This script helps diagnose issues with the OAuth flow
 */

import { spawn } from 'child_process';

console.log('\n=== Testing Authentication Flow ===\n');

// Test 1: Check if dev server is running
console.log('1. Checking if dev server is accessible...');
try {
  const response = await fetch('http://localhost:6001');
  console.log('✅ Dev server is running on port 6001');
} catch (error) {
  console.log('❌ Dev server is not running. Start it with: npm run dev');
  process.exit(1);
}

// Test 2: Check if API endpoint is accessible
console.log('\n2. Checking API endpoint accessibility...');
try {
  const response = await fetch('http://localhost:6001/api/auth/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'test' })
  });
  
  if (response.status === 200 || response.status === 401 || response.status === 403) {
    console.log('✅ API endpoint is accessible');
  } else {
    console.log(`⚠️ API endpoint returned unexpected status: ${response.status}`);
  }
} catch (error) {
  console.log('❌ API endpoint is not accessible:', error.message);
  console.log('   This might be because the API is deployed on Vercel');
}

// Test 3: Check environment variables
console.log('\n3. Checking environment variables...');
const requiredEnvVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET'
];

const envFile = '.env.local';
import { readFileSync } from 'fs';
try {
  const envContent = readFileSync(envFile, 'utf8');
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} is defined`);
    } else {
      console.log(`❌ ${varName} is missing in ${envFile}`);
    }
  });
} catch (error) {
  console.log(`❌ Could not read ${envFile}`);
}

console.log('\n=== Authentication Flow Issues Found ===\n');

console.log('The main issue was in vercel.json:');
console.log('- The rewrite rule was catching ALL routes including /api/*');
console.log('- This prevented API calls from reaching the serverless functions');
console.log('- Fixed by updating the rewrite pattern to exclude /api/* routes');

console.log('\n=== Next Steps ===\n');
console.log('1. Commit and push the vercel.json fix');
console.log('2. The deployment will automatically update on Vercel');
console.log('3. Test the login flow on https://terralink-portal.vercel.app/signin');

console.log('\n=== Testing Locally ===\n');
console.log('To test locally with Vercel functions:');
console.log('1. Install Vercel CLI: npm i -g vercel');
console.log('2. Run: vercel dev');
console.log('3. This will run both the frontend and API functions locally');

process.exit(0);