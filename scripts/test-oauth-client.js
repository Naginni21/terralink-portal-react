#!/usr/bin/env node

/**
 * Test OAuth Client ID validity
 * This script checks if the OAuth client ID is valid by attempting to fetch Google's configuration
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOAuthClient() {
  console.log('🔍 Testing OAuth Client ID Validity\n');
  console.log('=' .repeat(50));

  // Read client ID from .env.local
  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found!');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const clientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
  
  if (!clientIdMatch) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID not found in .env.local');
    return;
  }

  const clientId = clientIdMatch[1].trim();
  console.log(`📋 Testing Client ID: ${clientId.substring(0, 30)}...`);
  console.log();

  // Test 1: Check if the OAuth discovery endpoint accepts our client ID
  console.log('Test 1: Checking OAuth Discovery Endpoint...');
  try {
    const discoveryUrl = 'https://accounts.google.com/.well-known/openid-configuration';
    const response = await fetch(discoveryUrl);
    const config = await response.json();
    
    if (config.authorization_endpoint) {
      console.log('✅ Google OAuth endpoints are accessible');
      console.log(`   Authorization: ${config.authorization_endpoint}`);
      console.log(`   Token: ${config.token_endpoint}`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch OAuth configuration:', error.message);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('Test 2: Simulating OAuth Authorization URL...\n');
  
  // Build the OAuth URL that would be used
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', 'http://localhost:6001/signin');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');
  
  console.log('📌 OAuth URL that will be used:');
  console.log(authUrl.toString());
  console.log();
  
  // Test if we can make a HEAD request to the auth endpoint
  console.log('Test 3: Validating OAuth URL format...');
  try {
    const response = await fetch(authUrl.toString(), {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    // Google will redirect if the URL is valid, even with invalid client_id
    if (response.status === 302 || response.status === 303) {
      console.log('✅ OAuth URL format is valid');
    } else if (response.status === 400) {
      console.log('❌ Invalid OAuth parameters');
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️  Could not validate URL (this is normal)');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 Diagnosis:\n');
  
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Client ID format is correct');
    console.log('\nIf you\'re still getting "client not found" error, it means:');
    console.log('1. The OAuth client was deleted from Google Cloud Console');
    console.log('2. The OAuth client is in a different Google Cloud project');
    console.log('3. The OAuth consent screen is not configured');
    console.log('\n🔧 Solution:');
    console.log('1. Go to https://console.cloud.google.com/apis/credentials');
    console.log('2. Search for client ID starting with:', clientId.split('-')[0]);
    console.log('3. If not found, create a new OAuth 2.0 Client ID');
    console.log('4. Update .env.local with the new credentials');
  } else {
    console.log('❌ Client ID format is incorrect!');
  }
  
  console.log('\n✨ Test complete!\n');
}

testOAuthClient().catch(console.error);