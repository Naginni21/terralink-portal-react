#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * Checks your Google OAuth setup and identifies common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 OAuth Configuration Verifier\n');
console.log('=' .repeat(50));

// Check for .env.local file
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');
const envProdPath = path.join(projectRoot, '.env.production');

let clientId = null;
let clientSecret = null;

// Read environment variables
if (fs.existsSync(envPath)) {
  console.log('✅ Found .env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const clientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
  const clientSecretMatch = envContent.match(/GOOGLE_CLIENT_SECRET=(.+)/);
  
  if (clientIdMatch) {
    clientId = clientIdMatch[1].trim();
    console.log(`✅ Client ID found: ${clientId.substring(0, 20)}...`);
  } else {
    console.log('❌ VITE_GOOGLE_CLIENT_ID not found in .env.local');
  }
  
  if (clientSecretMatch) {
    clientSecret = clientSecretMatch[1].trim();
    console.log(`✅ Client Secret found: ${clientSecret.substring(0, 10)}...`);
  } else {
    console.log('❌ GOOGLE_CLIENT_SECRET not found in .env.local');
  }
} else {
  console.log('❌ .env.local not found!');
}

console.log('\n' + '=' .repeat(50));
console.log('📋 OAuth Client ID Analysis\n');

if (clientId) {
  // Validate client ID format
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Client ID format is valid');
    
    const parts = clientId.split('-');
    if (parts.length === 2) {
      console.log(`   Project Number: ${parts[0]}`);
      console.log(`   Random String: ${parts[1].substring(0, 10)}...`);
    }
  } else {
    console.log('❌ Client ID format is invalid!');
    console.log('   Expected format: XXXXXX-YYYY.apps.googleusercontent.com');
  }
}

console.log('\n' + '=' .repeat(50));
console.log('🌐 Required Google Cloud Console Settings\n');

console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
console.log(`2. Find OAuth client with ID starting with: ${clientId ? clientId.split('-')[0] : 'YOUR_CLIENT_ID'}`);
console.log('3. Ensure these settings are configured:\n');

console.log('📍 Authorized JavaScript Origins:');
console.log('   Production:');
console.log('   - https://terralink-portal.vercel.app');
console.log('   - https://terralink-portal-react.vercel.app');
console.log('   Development:');
console.log('   - http://localhost:6001');
console.log('   - http://localhost:5173');
console.log('   - http://localhost:3000');

console.log('\n🔄 Authorized Redirect URIs:');
console.log('   Production:');
console.log('   - https://terralink-portal.vercel.app/signin');
console.log('   - https://terralink-portal-react.vercel.app/signin');
console.log('   Development:');
console.log('   - http://localhost:6001/signin');
console.log('   - http://localhost:5173/signin');
console.log('   - http://localhost:3000/signin');

console.log('\n' + '=' .repeat(50));
console.log('🔧 Quick Fixes\n');

console.log('1. If "Client ID not found" error:');
console.log('   - The OAuth client was deleted from Google Cloud Console');
console.log('   - Create a new OAuth 2.0 Client ID');
console.log('   - Update .env.local with new credentials');

console.log('\n2. If "redirect_uri_mismatch" error:');
console.log('   - Add missing URLs to Authorized JavaScript origins');
console.log('   - Add missing URLs to Authorized redirect URIs');
console.log('   - Wait 5 minutes for changes to propagate');

console.log('\n3. If "Access blocked" error:');
console.log('   - Configure OAuth consent screen');
console.log('   - Set publishing status to "In production"');
console.log('   - Or add test users if in "Testing" mode');

console.log('\n' + '=' .repeat(50));
console.log('🧪 Test Your Setup\n');
console.log('1. Local test: npm run dev');
console.log('   Then visit: http://localhost:6001/oauth-debug');
console.log('\n2. Production test:');
console.log('   Visit: https://terralink-portal.vercel.app/oauth-debug');

console.log('\n✨ Done!\n');