# 🚀 Deploy Now - Step by Step

## Prerequisites ✅
- ✅ Vercel CLI installed (`npm i -g vercel`)
- ✅ Code pushed to GitHub
- ✅ Google OAuth credentials ready

---

## 📦 Part 1: Deploy Backend to Render

### Option A: Via Dashboard (Easiest)
1. **Open**: https://dashboard.render.com
2. **Click**: "New +" → "Blueprint"
3. **Connect**: GitHub repo `Naginni21/terralink-portal-react`
4. **Wait**: Render detects `render.yaml`
5. **Add Secrets** (before clicking Apply):
   ```
   GOOGLE_CLIENT_ID = [your-actual-client-id]
   GOOGLE_CLIENT_SECRET = [your-actual-secret]
   ```
6. **Click**: "Apply"
7. **Wait**: 5-10 minutes for deployment
8. **Save**: Your backend URL (e.g., `https://terralink-api.onrender.com`)

### Option B: Manual Service Creation
1. Go to https://dashboard.render.com
2. New + → Web Service
3. Connect GitHub repo
4. Configure:
   - Name: `terralink-api`
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
5. Add all environment variables from render.yaml manually

---

## 📦 Part 2: Deploy Frontend to Vercel

### Step 1: Login to Vercel
```bash
vercel login
```
- It will open browser or show a link
- Authenticate with your account

### Step 2: Deploy
```bash
# From project root
vercel

# When prompted:
# ? Set up and deploy "~/Software/terralink-portal-react"? [Y/n] Y
# ? Which scope do you want to deploy to? [Select your account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? terralink-portal
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### Step 3: Set Environment Variables
```bash
# After first deployment, set production env vars:
vercel env add VITE_API_URL production
# Enter: https://terralink-api.onrender.com (your Render URL)

vercel env add VITE_GOOGLE_CLIENT_ID production
# Enter: your-google-client-id

vercel env add VITE_APP_DOMAIN production
# Enter: terralink.cl
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## 🔧 Part 3: Configure Google OAuth

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Edit**: Your OAuth 2.0 Client
3. **Add Authorized JavaScript origins**:
   ```
   https://terralink-portal.vercel.app
   https://your-custom-domain.com (if using)
   https://terralink-api.onrender.com
   ```
4. **Add Authorized redirect URIs**:
   ```
   https://terralink-api.onrender.com/api/auth/google-callback
   ```
5. **Save** and wait 5 minutes

---

## ✅ Part 4: Verify Everything Works

### Test URLs:
- Frontend: `https://terralink-portal.vercel.app`
- Backend Health: `https://terralink-api.onrender.com/health`
- API Docs: `https://terralink-api.onrender.com/docs`

### Quick Checks:
```bash
# Check frontend deployment
vercel ls

# Check backend health
curl https://terralink-api.onrender.com/health

# Test login flow
# 1. Go to frontend URL
# 2. Click Google Sign In
# 3. Should redirect and authenticate
```

---

## 🐛 Troubleshooting

### "Origin not allowed" on Google Sign-In
- Add your Vercel URL to Google OAuth origins
- Wait 5 minutes for propagation

### "Not authenticated" after login
- Check COOKIE_DOMAIN in Render env vars (leave empty for .onrender.com)
- Ensure ALLOWED_ORIGINS includes your Vercel URL

### CORS errors
- Update ALLOWED_ORIGINS in Render to include frontend URL
- Format: `["https://terralink-portal.vercel.app"]`

### Backend not responding
- Check Render logs: Dashboard → Service → Logs
- Ensure database migrations ran
- Verify all env vars are set

---

## 🎯 Quick Deploy Commands

```bash
# Backend (push to trigger Render)
git add . && git commit -m "Update" && git push origin main

# Frontend (Vercel CLI)
vercel --prod

# Or use the deploy script
./deploy.sh
```

---

## 📝 Environment Variables Reference

### Render (Backend)
```
GOOGLE_CLIENT_ID = your-client-id
GOOGLE_CLIENT_SECRET = your-secret
COOKIE_DOMAIN = (leave empty)
ALLOWED_ORIGINS = ["https://terralink-portal.vercel.app"]
```

### Vercel (Frontend)
```
VITE_API_URL = https://terralink-api.onrender.com
VITE_GOOGLE_CLIENT_ID = your-client-id
VITE_APP_DOMAIN = terralink.cl
```

---

## 🚦 Status Check

After deployment:
- [ ] Render backend deployed and healthy
- [ ] Vercel frontend deployed
- [ ] Google OAuth configured
- [ ] Environment variables set
- [ ] Test login works
- [ ] Session persists

Need help? The error messages usually tell you exactly what's wrong!