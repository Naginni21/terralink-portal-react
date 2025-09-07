# API Structure & Sub-App Integration

## API Endpoints Overview

All API endpoints are deployed as Vercel Serverless Functions from the `/api` directory.

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://portal.terralink.com.br/api`

### Available Endpoints

#### Authentication
- `POST /api/auth/login` - Google OAuth login
- `POST /api/auth/validate` - Validate session token
- `POST /api/auth/revoke` - Revoke session
- `GET /api/auth/check/:email` - Check user existence

#### Activity Tracking
- `POST /api/activity/track` - Track user activity
- `GET /api/activity/track` - Get activity logs

#### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users` - Update user role
- `DELETE /api/admin/users` - Revoke user access
- `GET /api/admin/domains` - List allowed domains
- `POST /api/admin/domains` - Add domain
- `DELETE /api/admin/domains` - Remove domain

## Sub-App Integration Guide

### 1. Authentication from Sub-Apps

Sub-apps should receive a token parameter when launched from the portal:

```javascript
// In your sub-app
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Validate the token
const response = await fetch('https://portal.terralink.com.br/api/auth/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const userData = await response.json();
```

### 2. Tracking Activity from Sub-Apps

```javascript
// Track user actions in your sub-app
await fetch('https://portal.terralink.com.br/api/activity/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    appId: 'your-app-id',
    appName: 'Your App Name',
    action: 'feature_used',
    metadata: {
      feature: 'report_generation',
      details: 'Monthly sales report'
    }
  })
});
```

### 3. CORS Configuration

All API endpoints include CORS headers that allow requests from any origin by default.

For production, set the `ALLOWED_ORIGINS` environment variable:

```env
ALLOWED_ORIGINS=https://portal.terralink.com.br,https://app1.terralink.com.br,https://app2.terralink.com.br
```

### 4. Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 5. Rate Limiting

Currently not implemented. For production, consider adding rate limiting:

```javascript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Security Considerations

1. **Always validate tokens** before processing requests
2. **Use HTTPS** in production (automatic with Vercel)
3. **Sanitize user input** to prevent XSS/injection attacks
4. **Implement rate limiting** for production
5. **Log suspicious activities** for security monitoring

## Development Tips

### Local Testing with Sub-Apps

1. Run the portal locally:
   ```bash
   npm run dev
   ```

2. In your sub-app, point to local API:
   ```javascript
   const API_BASE = process.env.NODE_ENV === 'development' 
     ? 'http://localhost:3000/api'
     : 'https://portal.terralink.com.br/api';
   ```

### Mock Authentication for Development

Create a development token:
```javascript
import jwt from 'jsonwebtoken';

const devToken = jwt.sign({
  email: 'dev@terralink.com.br',
  role: 'admin',
  domain: 'terralink.com.br'
}, 'your-jwt-secret-key-change-in-production', { expiresIn: '30d' });

console.log('Dev Token:', devToken);
```

## API Client Example

Here's a complete example of a sub-app API client:

```javascript
class PortalAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'https://portal.terralink.com.br/api';
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async validateSession() {
    return this.request('/auth/validate', { method: 'POST' });
  }

  async trackActivity(appId, appName, action, metadata = {}) {
    return this.request('/activity/track', {
      method: 'POST',
      body: JSON.stringify({ appId, appName, action, metadata })
    });
  }
}

// Usage
const api = new PortalAPI(token);
const user = await api.validateSession();
await api.trackActivity('app1', 'My App', 'page_view', { page: 'dashboard' });
```