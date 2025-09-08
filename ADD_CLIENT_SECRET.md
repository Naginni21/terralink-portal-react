# 🔐 IMMEDIATE ACTION REQUIRED: Add Client Secret

Your OAuth implementation is now SECURE but needs the client secret to work.

## Quick Steps (5 minutes):

### 1. Get Your Client Secret
Go to: https://console.cloud.google.com/apis/credentials

Find your OAuth client:
- **Client ID**: `655900320406-91n0vl0dd1o62p125rlu0msqf47gb03g.apps.googleusercontent.com`
- Click on it
- Copy the **Client secret** (starts with `GOCSPX-`)

### 2. Add to Vercel (Choose One Method):

#### Option A: Command Line
```bash
vercel env add GOOGLE_CLIENT_SECRET production
# Paste your client secret when prompted
# Press Enter
```

#### Option B: Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project: `terralink-portal`
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Name**: `GOOGLE_CLIENT_SECRET`
   - **Value**: [Your client secret from Google]
   - **Environment**: Production ✓

### 3. Redeploy
```bash
vercel --prod
```

## Why This Is Critical

**Without the client secret:**
- ❌ Anyone can copy your Client ID
- ❌ Anyone can create fake login pages
- ❌ Your app is vulnerable to impersonation

**With the client secret:**
- ✅ Only YOUR backend can exchange codes for tokens
- ✅ Google verifies your app's identity
- ✅ Much harder for attackers to impersonate
- ✅ Industry-standard secure OAuth flow

## Verification

After adding the secret and redeploying:
1. Go to https://terralink-portal.vercel.app
2. Click "Sign in with Google"
3. Should work without errors

## Security Note

**NEVER**:
- Commit the client secret to Git
- Share it publicly
- Put it in frontend code

**ALWAYS**:
- Keep it in environment variables
- Use it only on backend/serverless functions

## Need Help?

If you see errors after adding the secret:
- Make sure you copied the entire secret
- Check there are no extra spaces
- Wait 1-2 minutes for Vercel to update
- Try redeploying with `vercel --prod`