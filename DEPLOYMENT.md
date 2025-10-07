# Deploy TerraLink Portal - Render (Backend) + Vercel (Frontend)

## Overview
- **Frontend**: Vercel (React SPA)
- **Backend**: Render (FastAPI with PostgreSQL + Redis)
- **Cost**: ~$14/month (Render Starter) or Free tier available

## Step 1: Deploy Backend to Render

### 1.1 Prepare Repository
```bash
# Ensure render.yaml is in your repo root
git add render.yaml backend/
git commit -m "Add Render configuration"
git push
```

### 1.2 Deploy on Render

1. **Sign up/Login** to [Render](https://render.com)

2. **New Blueprint Instance**
   - Go to Dashboard → Blueprints → New Blueprint Instance
   - Connect your GitHub repository
   - Select the branch (main/master)
   - Render will detect `render.yaml` automatically

3. **Configure Environment Variables**
   In Render Dashboard, add these secrets:

   ```env
   # Google OAuth (REQUIRED)
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here

   # Cookie Domain (REQUIRED)
   COOKIE_DOMAIN=                    # Leave empty for Render subdomain
   # OR
   COOKIE_DOMAIN=.terralink.cl       # If using custom domain

   # Update ALLOWED_ORIGINS with your Vercel URL
   ALLOWED_ORIGINS=["https://terralink-portal.vercel.app","https://portal.terralink.cl"]
   ```

4. **Deploy**
   - Click "Apply" to deploy
   - Wait for services to build (~5-10 minutes first time)
   - Note your API URL: `https://terralink-api.onrender.com`

### 1.3 Run Database Migrations

After deployment completes:

1. Go to your Web Service → Shell tab
2. Run:
   ```bash
   alembic upgrade head
   ```

## Step 2: Deploy Frontend to Vercel

### 2.1 Configure Environment

Create `.env.production.local` (for Vercel):
```env
# Your Render backend URL
VITE_API_URL=https://terralink-api.onrender.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here

# Domain
VITE_APP_DOMAIN=terralink.cl
```

### 2.2 Deploy to Vercel

Option A: **Via CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# When prompted:
# - Link to existing project? No (first time)
# - What's your project name? terralink-portal
# - In which directory? ./
# - Override settings? No
```

Option B: **Via Dashboard**
1. Go to [Vercel](https://vercel.com)
2. Import Git Repository
3. Select your repo
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.3 Set Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL = https://terralink-api.onrender.com
   VITE_GOOGLE_CLIENT_ID = your-google-client-id-here
   VITE_APP_DOMAIN = terralink.cl
   ```
3. Redeploy to apply changes

## Step 3: Configure Google OAuth

### Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client

4. **Add Authorized JavaScript origins**:
   ```
   https://terralink-portal.vercel.app
   https://portal.terralink.cl (if using custom domain)
   https://terralink-api.onrender.com
   ```

5. **Add Authorized redirect URIs**:
   ```
   https://terralink-api.onrender.com/api/auth/google-callback
   ```

6. Save changes (may take 5 minutes to propagate)

## Step 4: Custom Domains (Optional)

### Vercel - Frontend Domain
1. Project Settings → Domains
2. Add `portal.terralink.cl`
3. Configure DNS:
   ```
   Type: CNAME
   Name: portal
   Value: cname.vercel-dns.com
   ```

### Render - Backend Domain
1. Web Service → Settings → Custom Domains
2. Add `api.terralink.cl`
3. Configure DNS:
   ```
   Type: A
   Name: api
   Value: [Render provides IP]
   ```

### Update Environment After Custom Domains

**Render Dashboard**:
```env
COOKIE_DOMAIN=.terralink.cl
ALLOWED_ORIGINS=["https://portal.terralink.cl"]
```

**Vercel Dashboard**:
```env
VITE_API_URL=https://api.terralink.cl
```

## Step 5: Verify Deployment

### Check Services
- Frontend: https://terralink-portal.vercel.app
- Backend Health: https://terralink-api.onrender.com/health
- API Docs: https://terralink-api.onrender.com/docs

### Test Authentication
1. Visit frontend URL
2. Click Google Sign-In
3. Should redirect back after authentication
4. Check session: Open DevTools → Application → Cookies

## Monitoring

### Render Dashboard
- View logs: Web Service → Logs
- Monitor metrics: Metrics tab
- Database backups: Database → Backups

### Vercel Dashboard
- View logs: Functions → Logs
- Analytics: Analytics tab
- Build logs: Deployments → View Build Logs

## Troubleshooting

### "The given origin is not allowed"
- Ensure Google OAuth has correct origins
- Wait 5 minutes for Google changes to propagate

### "Not authenticated" after login
- Check COOKIE_DOMAIN matches your domain
- Verify ALLOWED_ORIGINS includes frontend URL
- Check Render logs for errors

### CORS errors
- Update ALLOWED_ORIGINS in Render
- Include full URL with https://

### Database connection issues
- Check DATABASE_URL is set correctly
- Ensure migrations ran: `alembic upgrade head`
- View Render logs for specific errors

## Cost Optimization

### Free Tier Option
- **Render Free**: Web service spins down after 15 min inactivity
- **Vercel Free**: 100GB bandwidth/month
- **PostgreSQL Free**: 1GB storage on Render

### Paid Recommendations
- **Render Starter**: $7/month (no spin-down)
- **Redis Starter**: $7/month (persistent sessions)
- **Vercel Pro**: $20/month (team features)

## Maintenance

### Update Backend
```bash
git push origin main
# Render auto-deploys
```

### Update Frontend
```bash
git push origin main
# Vercel auto-deploys
# OR
vercel --prod
```

### Database Migrations
```bash
# In Render Shell
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Security Checklist

- [x] HTTPS enforced (automatic)
- [x] Environment variables secured
- [ ] Enable Render DDoS protection
- [ ] Set up alerting (Render notifications)
- [ ] Configure backup schedule
- [ ] Review access logs regularly

## Support

- Render Status: https://status.render.com
- Vercel Status: https://vercel-status.com
- Your Backend Logs: Render Dashboard → Services → Logs
- Your Frontend Logs: Vercel Dashboard → Functions → Logs