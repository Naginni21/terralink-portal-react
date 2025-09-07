# 🚀 Vercel Deployment Checklist

## Quick Deploy (3 Steps)

### 1️⃣ Run the deployment script:
```bash
./deploy-to-vercel.sh
```

### 2️⃣ Add environment variables in Vercel Dashboard:

Go to: **[Vercel Dashboard](https://vercel.com/dashboard)** → **Your Project** → **Settings** → **Environment Variables**

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `JWT_SECRET` | `WxgPREAY5vPONdCrjBMvAqvsFEAqYhLXD5LJMee+Na0=` |
| `ALLOWED_DOMAINS` | `terralink.com.br` |
| `ADMIN_EMAILS` | `admin@terralink.com.br` |

### 3️⃣ Deploy to production:
```bash
vercel --prod
```

---

## Manual Steps (if script doesn't work)

### Step 1: Login to Vercel
```bash
vercel login
```
Choose **Continue with GitHub** (recommended)

### Step 2: Deploy
```bash
vercel
```

**Answer the prompts:**
- Set up and deploy? → **Y**
- Which scope? → **Your username**
- Link to existing project? → **N**
- Project name? → **terralink-portal** (or press Enter)
- In which directory? → **.** (press Enter)
- Override settings? → **N**

### Step 3: Add Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add the variables from the table above

### Step 4: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## ✅ Deployment Verification

After deployment, verify:

1. **Preview URL works**: `https://[your-project].vercel.app`
2. **Google OAuth works**: Try logging in
3. **Admin panel accessible**: Login with admin email
4. **API endpoints work**: Check `/api/health` (if exists)

---

## 🔧 Troubleshooting

### Build fails?
- Check `npm run build` works locally
- Review build logs in Vercel dashboard

### OAuth not working?
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Update Google OAuth redirect URIs with your Vercel URLs

### Admin access not working?
- Check `ADMIN_EMAILS` includes your email
- Ensure email domain is in `ALLOWED_DOMAINS`

---

## 📝 Post-Deployment

1. **Update Google OAuth**:
   - Add Vercel URLs to authorized redirect URIs
   - `https://[your-project].vercel.app`
   - Your custom domain (if any)

2. **Test all features**:
   - Login/logout
   - Admin panel (if admin)
   - Activity tracking
   - App launches

3. **Monitor**:
   - Check Vercel Analytics
   - Review Function logs
   - Monitor error rates