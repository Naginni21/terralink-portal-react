# 🚀 Quick Start: Production Setup (30 Minutes)

## Immediate Actions for Today

### 1️⃣ Enable Data Persistence (5 min)

**Vercel KV Storage:**
1. Go to [Vercel Dashboard](https://vercel.com/felipes-projects-93e2c2ce/terralink-portal)
2. Click **Storage** tab
3. Click **Create Database** → **KV**
4. Select your project
5. Copy the environment variables shown
6. Your sessions will now persist!

### 2️⃣ Set Up Custom Domain (10 min)

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add domain: `portal.terralink.cl` or `apps.terralink.cl`
3. Update your DNS:
   ```
   Type: CNAME
   Name: portal (or apps)
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
4. Update Google OAuth:
   - Add `https://portal.terralink.cl` to authorized origins
   - Add `https://portal.terralink.cl` to redirect URIs

### 3️⃣ Add Error Monitoring (15 min)

**Quick Sentry Setup:**

1. Create free account at [sentry.io](https://sentry.io)
2. Create new project (React)
3. Install Sentry:
   ```bash
   npm install @sentry/react
   ```

4. Add to `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: import.meta.env.MODE,
   });
   ```

5. Add DSN to Vercel env vars:
   - Name: `VITE_SENTRY_DSN`
   - Value: Your Sentry DSN

6. Deploy:
   ```bash
   vercel --prod
   ```

### 4️⃣ Enable Vercel Analytics (2 min)

1. Go to Vercel Dashboard → **Analytics**
2. Click **Enable Analytics**
3. That's it! Automatic tracking starts

### 5️⃣ Set Up Monitoring (5 min)

**Free Uptime Monitoring:**

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add monitor:
   - URL: `https://portal.terralink.cl`
   - Check every: 5 minutes
   - Alert to: your email

## Today's Checklist

- [ ] Enable Vercel KV Storage
- [ ] Configure custom domain
- [ ] Add Sentry error tracking
- [ ] Enable Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Test login with new domain
- [ ] Share new URL with team

## After Setup

Your production portal will have:
- ✅ Persistent sessions (survives restarts)
- ✅ Custom domain (portal.terralink.cl)
- ✅ Error tracking (know when things break)
- ✅ Analytics (see usage patterns)
- ✅ Uptime monitoring (get alerts if down)

## Test Everything

1. Visit: `https://portal.terralink.cl`
2. Login with Google
3. Check admin panel works
4. Create test error (F12 → Console → `throw new Error('test')`)
5. Check Sentry captured it
6. Check Analytics showing visits

## Share with Team

Send this to your team:
```
Portal Terralink is now live!

🔗 URL: https://portal.terralink.cl
📧 Access: Use your @terralink.cl Google account
👤 Admin: felipe.silva@terralink.cl

Features:
- Single sign-on with Google
- Role-based access to applications
- Activity tracking
- Admin dashboard (admins only)

Need help? Contact: felipe.silva@terralink.cl
```

---

**Total Time: ~30 minutes**
**Cost: Free tier covers everything initially**

Ready to implement? Start with Step 1! 🚀