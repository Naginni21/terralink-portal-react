# Google OAuth Configuration Fix

## Required Google Cloud Console Settings

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth 2.0 Client
- Look for client ID: `655900320406-91n0vl0dd1o62p125rlu0msqf47gb03g.apps.googleusercontent.com`
- Click on it to edit

### 3. Add These Authorized JavaScript Origins
```
https://terralink-portal.vercel.app
https://terralink-portal-felipes-projects-93e2c2ce.vercel.app
http://localhost:5173
http://localhost:3000
```

### 4. Add These Authorized Redirect URIs
```
https://terralink-portal.vercel.app
https://terralink-portal.vercel.app/signin
https://terralink-portal-felipes-projects-93e2c2ce.vercel.app
https://terralink-portal-felipes-projects-93e2c2ce.vercel.app/signin
http://localhost:5173
http://localhost:5173/signin
http://localhost:3000
http://localhost:3000/signin
```

### 5. Save Changes
Click "SAVE" at the bottom of the page

## Environment Variables in Vercel

### Current Required Variables:
- ✅ `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (for frontend)
- ✅ `GOOGLE_CLIENT_ID` - Same Client ID (for serverless functions)
- ✅ `JWT_SECRET` - For signing JWT tokens
- ✅ `ALLOWED_DOMAINS` - Allowed email domains

### About GOOGLE_SECRET:
- **NOT NEEDED** for the current implementation
- The `@react-oauth/google` library uses implicit flow (ID tokens only)
- Client secret should NEVER be exposed to frontend
- If you have `GOOGLE_SECRET` in Vercel, you can remove it for security

## Testing After Configuration

1. **Clear browser cache and cookies**
2. **Try signing in at**: https://terralink-portal.vercel.app
3. **If still failing**, wait 5-10 minutes for Google's changes to propagate

## Common Issues

### If you see "redirect_uri_mismatch":
- Double-check all URLs are added exactly as shown above
- Ensure no trailing slashes
- Check you're editing the correct OAuth client

### If you see "invalid_client":
- Verify the Client ID matches in both Google Console and Vercel env vars
- Check `VITE_GOOGLE_CLIENT_ID` in Vercel matches the client ID

### If login works but API fails:
- Ensure `JWT_SECRET` is set in Vercel
- Check `ALLOWED_DOMAINS` includes your email domain

## Security Notes

1. **Never expose client secret**: The client secret should never be in frontend code
2. **Use HTTPS only**: Google OAuth requires HTTPS in production
3. **Domain restriction**: Your app correctly restricts to @terralink.cl emails

## Current Implementation Details

- **Library**: `@react-oauth/google` v0.12.2
- **Flow**: Implicit flow with ID tokens
- **Token Validation**: Server-side validation using Google's tokeninfo endpoint
- **Session**: 30-day JWT sessions stored in localStorage