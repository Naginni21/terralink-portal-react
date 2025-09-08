# Secure Google OAuth Setup with Client Secret

## Why This is More Secure

### ❌ Previous Implementation (Insecure):
- Used implicit flow with ID tokens only
- Client ID was public (anyone could use it)
- No client secret validation
- Anyone could create a fake login page

### ✅ New Implementation (Secure):
- Authorization code flow
- Frontend gets authorization code
- Backend exchanges code for tokens using CLIENT SECRET
- Client secret NEVER exposed to frontend
- Much harder to impersonate your app

## Step 1: Get Your Client Secret from Google

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID: `655900320406-91n0vl0dd1o62p125rlu0msqf47gb03g.apps.googleusercontent.com`
3. Find the **Client secret** field
4. Copy the secret (looks like: `GOCSPX-xxxxxxxxxxxxx`)
5. **NEVER commit this to git or expose it publicly**

## Step 2: Add Client Secret to Vercel

Run this command (replace with your actual client secret):

```bash
vercel env add GOOGLE_CLIENT_SECRET production
# When prompted, paste your client secret
```

Or via Vercel Dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `GOOGLE_CLIENT_SECRET` with your secret value
4. Set it for Production environment

## Step 3: Update Google Cloud Console

Add these redirect URIs if not already present:

### Authorized JavaScript origins:
```
https://terralink-portal.vercel.app
http://localhost:5173
http://localhost:3000
```

### Authorized redirect URIs:
```
https://terralink-portal.vercel.app/signin
http://localhost:5173/signin
http://localhost:3000/signin
```

## Step 4: Deploy

```bash
git add .
git commit -m "Implement secure OAuth with authorization code flow"
git push origin main
vercel --prod
```

## How the Secure Flow Works

1. **User clicks "Sign in with Google"**
   - Frontend opens Google OAuth page
   
2. **User authenticates with Google**
   - Google validates credentials
   - User consents to share profile info
   
3. **Google redirects with authorization code**
   - Code sent to frontend (safe to expose)
   - Code is one-time use only
   
4. **Frontend sends code to YOUR backend**
   - POST to `/api/auth/google-callback`
   
5. **Backend exchanges code for tokens**
   - Uses CLIENT SECRET (never exposed)
   - Validates with Google servers
   - Gets ID token, access token, refresh token
   
6. **Backend creates session**
   - Validates email domain (@terralink.cl)
   - Creates JWT session token
   - Returns to frontend
   
7. **Frontend stores session**
   - Stores JWT in localStorage
   - Redirects to portal

## Security Benefits

✅ **Client Secret Protection**: Never exposed to browser/frontend
✅ **Server-side Validation**: All token exchange happens on backend
✅ **Domain Restriction**: Only @terralink.cl emails allowed
✅ **Audit Logging**: All login attempts logged
✅ **Rate Limiting**: Prevents brute force attacks
✅ **Session Management**: 30-day JWT sessions with validation

## Testing

After deployment, test the flow:

1. Clear browser cookies/cache
2. Go to https://terralink-portal.vercel.app
3. Click "Sign in with Google"
4. Should see Google's account picker
5. Select your @terralink.cl account
6. Should redirect to portal after successful auth

## Troubleshooting

### "redirect_uri_mismatch" error:
- Check redirect URIs in Google Console match exactly
- No trailing slashes
- Wait 5-10 minutes for changes to propagate

### "Server configuration error":
- Ensure GOOGLE_CLIENT_SECRET is set in Vercel
- Check JWT_SECRET is also set
- Verify GOOGLE_CLIENT_ID matches

### "Authentication failed":
- Check client secret is correct
- Verify domain restrictions
- Check Vercel logs for details

## Environment Variables Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID (public) | Google Cloud Console |
| `GOOGLE_CLIENT_ID` | Same as above (for serverless) | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | Google Cloud Console |
| `JWT_SECRET` | For signing sessions | Generate with `openssl rand -base64 32` |
| `ALLOWED_DOMAINS` | Allowed email domains | Set to `terralink.cl` |

## Security Checklist

- [ ] Client secret ONLY in environment variables
- [ ] Client secret NEVER in frontend code
- [ ] Authorization code flow implemented
- [ ] Backend validates all tokens
- [ ] Domain restrictions enforced
- [ ] Rate limiting enabled
- [ ] Audit logging working
- [ ] HTTPS only in production