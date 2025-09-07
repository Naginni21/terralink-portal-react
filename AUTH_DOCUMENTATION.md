# Terralink Portal - Centralized Authentication System

## Overview

This is a **production-ready centralized authentication system** that ensures sub-applications can ONLY be accessed through the main portal. It implements enterprise-grade security with smart validation while keeping the implementation simple and maintainable.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Portal    │────▶│   Auth API   │◀────│  Sub-Apps   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Vercel KV   │
                    │  (Sessions)  │
                    └─────────────┘
```

## How It Works

### 1. Portal Login Flow
1. User logs in with Google OAuth (@terralink.cl only)
2. Portal sends Google token to `/api/auth/login`
3. API validates domain and creates 30-day session
4. Session stored in Vercel KV (Redis)
5. JWT token returned to Portal

### 2. Sub-App Access Flow
1. User clicks app in Portal
2. Portal requests 5-minute token from `/api/auth/validate`
3. Token passed to sub-app via URL parameter
4. Sub-app validates token with API
5. Sub-app creates local session (sessionStorage)
6. Smart validation: re-checks every 10 minutes

### 3. Session Management
- **Portal Sessions**: 30 days (no daily login required)
- **Google Sync**: Hourly validation with Google
- **Sub-App Tokens**: 5 minutes (one-time use)
- **Admin Revocation**: Immediate blacklisting
- **Smart Checks**: Every 10 minutes in sub-apps

## Setup Guide

### Prerequisites
1. Vercel account
2. Google OAuth credentials
3. Node.js 18+

### Step 1: Environment Setup

Create `.env.local`:
```env
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-here

# From Vercel Dashboard > Storage > Create KV Database
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized origins:
   - `http://localhost:6001` (development)
   - `https://apps.terralink.cl` (production)

### Step 4: Deploy to Vercel
```bash
vercel --prod
```

### Step 5: Configure Domain
In Vercel Dashboard:
1. Settings → Domains
2. Add `apps.terralink.cl`
3. Configure DNS CNAME

## API Endpoints

### POST `/api/auth/login`
Authenticates users with Google OAuth.

**Request:**
```json
{
  "googleToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "sessionToken": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@terralink.cl",
    "name": "User Name",
    "role": "admin",
    "image": "https://..."
  }
}
```

### POST `/api/auth/validate`
Universal validation endpoint.

**Request Options:**

1. **Portal Session Validation:**
```json
{
  "token": "sessionToken"
}
```

2. **Generate App Token:**
```json
{
  "token": "sessionToken",
  "generateAppToken": true,
  "appId": "bess"
}
```

3. **Sub-App Token Validation:**
```json
{
  "token": "appToken"
}
```

4. **Periodic Session Check:**
```json
{
  "sessionCheck": true,
  "email": "user@terralink.cl"
}
```

### POST `/api/auth/revoke`
Admin endpoint to revoke user access.

**Request:**
```json
{
  "emailToRevoke": "user@terralink.cl",
  "reason": "Employee terminated"
}
```

**Headers:**
```
Authorization: Bearer <adminToken>
```

## Sub-App Integration

### Basic Integration (React)

```tsx
// App.tsx in your sub-application
import { PortalGuard } from './PortalGuard';

function App() {
  return (
    <PortalGuard portalUrl="https://apps.terralink.cl">
      <YourApplication />
    </PortalGuard>
  );
}
```

### Files to Copy to Sub-Apps

1. **src/lib/auth-api.ts** - API client
2. **src/components/Auth/PortalGuard.tsx** - Protection component

### Manual Integration (Any Framework)

```javascript
// On app load
const token = new URLSearchParams(location.search).get('token');

if (!token) {
  window.location.href = 'https://apps.terralink.cl';
}

// Validate token
fetch('https://apps.terralink.cl/api/auth/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
})
.then(res => res.json())
.then(data => {
  if (data.valid) {
    // Store user and continue
    sessionStorage.setItem('user', JSON.stringify(data.user));
  } else {
    window.location.href = 'https://apps.terralink.cl';
  }
});

// Periodic check (every 10 minutes)
setInterval(() => {
  fetch('https://apps.terralink.cl/api/auth/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sessionCheck: true,
      email: JSON.parse(sessionStorage.getItem('user')).email
    })
  }).then(res => {
    if (!res.ok) {
      window.location.href = 'https://apps.terralink.cl';
    }
  });
}, 10 * 60 * 1000);
```

## Admin Operations

### Revoking Access

```javascript
// In admin panel
async function revokeUserAccess(email) {
  const adminToken = localStorage.getItem('sessionToken');
  
  await fetch('/api/auth/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      emailToRevoke: email,
      reason: 'Access revoked by admin'
    })
  });
}
```

### Viewing Audit Logs

Audit logs are stored in Vercel KV. Access via Vercel Dashboard or:

```bash
# Using Vercel CLI
vercel env pull
node -e "
const { createClient } = require('@vercel/kv');
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
kv.lrange('audit:logins', 0, 100).then(console.log);
"
```

## Security Features

### ✅ Implemented
- **JWT Signed Tokens**: HMAC-SHA256
- **Domain Restriction**: @terralink.cl only
- **Session Management**: 30-day portal, 5-min apps
- **Google Sync**: Hourly validation
- **Admin Blacklist**: Immediate revocation
- **Rate Limiting**: 30 requests/minute per IP
- **Audit Logging**: All auth events tracked
- **Smart Validation**: Initial + periodic checks
- **One-time Tokens**: Prevent replay attacks

### 🔒 Security Best Practices
1. **Never** expose JWT_SECRET
2. **Always** use HTTPS in production
3. **Regularly** rotate JWT secret
4. **Monitor** audit logs for suspicious activity
5. **Test** revocation process regularly

## Troubleshooting

### Issue: "Session expired" in Portal
- **Cause**: 30-day session expired or user blacklisted
- **Solution**: User needs to login again

### Issue: Sub-app redirects to portal immediately
- **Cause**: No token or invalid token
- **Solution**: Ensure Portal is passing token correctly

### Issue: "Too many requests" error
- **Cause**: Rate limiting triggered
- **Solution**: Wait 1 minute, reduce request frequency

### Issue: Google validation fails
- **Cause**: Google token expired or account disabled
- **Solution**: User needs to re-authenticate

## Testing

### Local Development
```bash
# Terminal 1: Run Portal
npm run dev

# Terminal 2: Run a sub-app
cd ../sub-app
npm run dev
```

### Test Scenarios
1. **Direct Access**: Go to sub-app URL directly → Should redirect to portal
2. **Portal Access**: Click app in portal → Should open with token
3. **Session Expiry**: Wait 5+ minutes in sub-app → Should continue working
4. **Revocation**: Admin revokes user → User kicked out within 10 minutes
5. **Network Loss**: Disconnect internet → Sub-app continues working

## Deployment Checklist

- [ ] Set JWT_SECRET environment variable
- [ ] Configure Vercel KV database
- [ ] Update Google OAuth authorized origins
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Test all sub-app integrations
- [ ] Verify admin can revoke access
- [ ] Check audit logs are recording

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs for errors
3. Contact: felipe.silva@terralink.cl

---

## Quick Reference

### Portal Login
```javascript
await authApi.login(googleToken)
```

### Get App Token
```javascript
await authApi.getAppToken(sessionToken, appId)
```

### Validate in Sub-App
```javascript
await authApi.validateAppToken(token)
```

### Periodic Check
```javascript
await authApi.checkSession(email)
```

### Revoke Access
```javascript
await authApi.revokeAccess(adminToken, email, reason)
```

---

*Last updated: 2025-01-09*  
*Version: 1.0.0 - Smart Hybrid Authentication*