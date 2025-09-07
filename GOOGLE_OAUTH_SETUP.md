# Google OAuth Configuration Instructions

## Local Development Setup

To fix the Google OAuth origin error for localhost:6001, follow these steps:

### 1. Access Google Cloud Console
1. Go to https://console.cloud.google.com
2. Select your project (or create one if needed)
3. Navigate to "APIs & Services" → "Credentials"

### 2. Configure OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID (ID: `406021397309-vq08cbkv8kahf5pml9d10l1lc3ru0ot5.apps.googleusercontent.com`)
2. Click on it to edit

### 3. Add Authorized JavaScript Origins
Add these origins:
- `http://localhost:6001` (for Vite dev server)
- `http://localhost:5173` (backup port)
- `http://localhost:3001` (API server)

### 4. Add Authorized Redirect URIs (if needed)
- `http://localhost:6001/auth/callback`
- `http://localhost:5173/auth/callback`

### 5. Save Changes
Click "Save" at the bottom of the page

## Running the Development Environment

### Install Dependencies
```bash
npm install
```

### Start Both Servers
```bash
# Option 1: Run both servers together
npm run dev:all

# Option 2: Run servers separately (in different terminals)
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Vite Dev Server
npm run dev
```

### Access the Application
- Open http://localhost:6001 in your browser
- The API server runs on http://localhost:3001

## Production Deployment

For production deployment on Vercel:

### 1. Authorized JavaScript Origins
Add:
- `https://apps.terralink.cl`
- `https://terralink-portal.vercel.app` (if using Vercel subdomain)

### 2. Environment Variables
Set these in Vercel dashboard:
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `JWT_SECRET` - Strong secret for JWT signing (generate with `openssl rand -base64 32`)
- `KV_URL` - Vercel KV Redis URL
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV API Token
- `KV_REST_API_READ_ONLY_TOKEN` - Vercel KV Read-only Token

## Troubleshooting

### "The given origin is not allowed" Error
- Ensure you've added the exact origin URL including protocol and port
- Changes may take 5-10 minutes to propagate
- Try clearing browser cache and cookies

### API Connection Errors
- Ensure the API server is running on port 3001
- Check that CORS is configured correctly in api-server.mjs
- Verify the auth-api.ts file is using the correct port

### Session Issues
- Clear localStorage and sessionStorage
- Check browser console for JWT decode errors
- Verify the JWT_SECRET matches between API and validation