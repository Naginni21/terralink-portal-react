#!/usr/bin/env node

/**
 * Check if Vercel deployment is complete and routes are working
 */

console.log('\n=== Checking Vercel Deployment Status ===\n');

const baseUrl = 'https://terralink-portal.vercel.app';

async function checkRoute(path, description) {
  const url = `${baseUrl}${path}`;
  console.log(`\nChecking ${path}...`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      console.log(`  ⚠️  Redirects to: ${location}`);
      
      if (location === '/signin' || location === baseUrl + '/signin') {
        console.log(`  ❌ ${description} is redirecting to /signin`);
        console.log(`     This means the route might not be recognized`);
      }
    } else if (response.status === 200) {
      console.log(`  ✅ ${description} is accessible`);
    } else if (response.status === 404) {
      console.log(`  ❌ ${description} returns 404 - route not found`);
    } else {
      console.log(`  ⚠️  Unexpected status for ${description}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      console.log(`  Content-Type: ${contentType}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error accessing ${path}:`, error.message);
  }
}

async function checkAPI(path, description) {
  const url = `${baseUrl}${path}`;
  console.log(`\nChecking API ${path}...`);
  
  try {
    const response = await fetch(url, {
      method: 'GET'
    });
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`  ✅ ${description} is working`);
      console.log(`     Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else if (response.status === 404) {
      console.log(`  ❌ ${description} returns 404`);
      console.log(`     This might mean API routes are still being blocked`);
    } else {
      console.log(`  ⚠️  ${description} returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Error accessing API:`, error.message);
  }
}

// Run checks
console.log('Starting deployment checks...\n');

await checkRoute('/', 'Home page');
await checkRoute('/signin', 'Sign-in page');
await checkRoute('/auth-test', 'Auth test page');
await checkAPI('/api/test', 'Test API endpoint');

console.log('\n=== Deployment Check Summary ===\n');

console.log('If /auth-test is redirecting to /signin, possible causes:');
console.log('1. The deployment might still be building on Vercel');
console.log('2. There might be a build error - check Vercel dashboard');
console.log('3. The route might not be properly exported from AuthTest.tsx');
console.log('');
console.log('Next steps:');
console.log('1. Check Vercel dashboard for deployment status');
console.log('2. Look for any build errors in Vercel logs');
console.log('3. Wait 1-2 minutes and try again if deployment is in progress');
console.log('');
console.log('Vercel Dashboard: https://vercel.com/dashboard');

process.exit(0);