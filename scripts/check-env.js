#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Environment Variable Checker\n');
console.log('=' .repeat(60));

// Expected client ID
const EXPECTED_CLIENT_ID = '655900320406-5gtpn7qdeit1umai8jt3qvvkagedgsio.apps.googleusercontent.com';

// Check .env.local
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Find VITE_GOOGLE_CLIENT_ID line
let viteClientId = null;
let googleClientId = null;
let googleClientSecret = null;

for (const line of lines) {
  if (line.startsWith('VITE_GOOGLE_CLIENT_ID=')) {
    viteClientId = line.substring('VITE_GOOGLE_CLIENT_ID='.length);
  }
  if (line.startsWith('GOOGLE_CLIENT_ID=')) {
    googleClientId = line.substring('GOOGLE_CLIENT_ID='.length);
  }
  if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
    googleClientSecret = line.substring('GOOGLE_CLIENT_SECRET='.length);
  }
}

console.log('📋 VITE_GOOGLE_CLIENT_ID Analysis:\n');
if (viteClientId) {
  console.log(`  Raw value: "${viteClientId}"`);
  console.log(`  Length: ${viteClientId.length} characters`);
  console.log(`  Expected length: ${EXPECTED_CLIENT_ID.length} characters`);
  console.log(`  Starts with: "${viteClientId.substring(0, 20)}..."`);
  console.log(`  Ends with: "...${viteClientId.substring(viteClientId.length - 20)}"`);
  
  // Check for hidden characters
  const hasWhitespace = viteClientId !== viteClientId.trim();
  const hasNewline = viteClientId.includes('\n') || viteClientId.includes('\r');
  const hasQuotes = viteClientId.includes('"') || viteClientId.includes("'");
  
  console.log(`  Has whitespace: ${hasWhitespace ? '❌ YES' : '✅ NO'}`);
  console.log(`  Has newlines: ${hasNewline ? '❌ YES' : '✅ NO'}`);
  console.log(`  Has quotes: ${hasQuotes ? '❌ YES' : '✅ NO'}`);
  
  // Check if matches expected
  if (viteClientId.trim() === EXPECTED_CLIENT_ID) {
    console.log('  ✅ MATCHES expected client ID');
  } else {
    console.log('  ❌ DOES NOT MATCH expected client ID');
    console.log(`\n  Expected: "${EXPECTED_CLIENT_ID}"`);
    console.log(`  Got:      "${viteClientId.trim()}"`);
    
    // Character by character comparison
    const trimmed = viteClientId.trim();
    if (trimmed.length === EXPECTED_CLIENT_ID.length) {
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] !== EXPECTED_CLIENT_ID[i]) {
          console.log(`  First difference at position ${i}:`);
          console.log(`    Expected: "${EXPECTED_CLIENT_ID[i]}" (char code: ${EXPECTED_CLIENT_ID.charCodeAt(i)})`);
          console.log(`    Got:      "${trimmed[i]}" (char code: ${trimmed.charCodeAt(i)})`);
          break;
        }
      }
    }
  }
} else {
  console.log('  ❌ NOT FOUND in .env.local');
}

console.log('\n' + '=' .repeat(60));
console.log('📋 GOOGLE_CLIENT_ID Analysis:\n');
if (googleClientId) {
  const matches = googleClientId.trim() === viteClientId?.trim();
  console.log(`  Matches VITE_GOOGLE_CLIENT_ID: ${matches ? '✅ YES' : '❌ NO'}`);
  if (!matches) {
    console.log(`  Value: "${googleClientId}"`);
  }
} else {
  console.log('  ❌ NOT FOUND in .env.local');
}

console.log('\n' + '=' .repeat(60));
console.log('📋 GOOGLE_CLIENT_SECRET Analysis:\n');
if (googleClientSecret) {
  console.log(`  Present: ✅ YES`);
  console.log(`  Starts with: ${googleClientSecret.substring(0, 10)}...`);
  console.log(`  Length: ${googleClientSecret.length} characters`);
  console.log(`  Format valid: ${googleClientSecret.startsWith('GOCSPX-') ? '✅ YES' : '❌ NO'}`);
} else {
  console.log('  ❌ NOT FOUND in .env.local');
}

console.log('\n' + '=' .repeat(60));
console.log('📊 Summary:\n');

const issues = [];
if (viteClientId?.trim() !== EXPECTED_CLIENT_ID) {
  issues.push('VITE_GOOGLE_CLIENT_ID does not match expected value');
}
if (googleClientId?.trim() !== viteClientId?.trim()) {
  issues.push('GOOGLE_CLIENT_ID does not match VITE_GOOGLE_CLIENT_ID');
}
if (!googleClientSecret || !googleClientSecret.startsWith('GOCSPX-')) {
  issues.push('GOOGLE_CLIENT_SECRET is missing or invalid');
}

if (issues.length === 0) {
  console.log('✅ All environment variables look correct!');
} else {
  console.log('❌ Issues found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
}

console.log('\n✨ Check complete!\n');