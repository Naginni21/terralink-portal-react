# Terralink Portal - Deployment Guide

## Architecture Overview

The Terralink Portal is a monolithic application designed for Vercel deployment with:
- **Frontend**: React + Vite application
- **Backend API**: Serverless functions in `/api` folder
- **Authentication**: Google OAuth with JWT tokens
- **Storage**: In-memory (development) / Database (production)

## Why Monolithic Architecture?

We chose to keep frontend and backend together for several reasons:

1. **Simplified Deployment**: Single repository, single deployment
2. **Shared Domain**: Sub-apps can access the API at the same domain
3. **Vercel Optimization**: Automatic serverless function deployment from `/api`
4. **CORS Simplification**: No cross-origin issues for sub-apps
5. **Cost Efficiency**: Single hosting solution

## Deployment to Vercel

### Prerequisites

1. Vercel account
2. Google OAuth credentials
3. Domain configured in Vercel

### Environment Variables

Set these in Vercel Dashboard > Settings > Environment Variables:

```env
# Required
VITE_GOOGLE_CLIENT_ID=your-google-client-id
JWT_SECRET=generate-strong-random-string-minimum-32-chars

# Optional but recommended
ALLOWED_DOMAINS=terralink.com.br,partner.com
ADMIN_EMAILS=admin@terralink.com.br
```

### Deployment Steps

1. **Connect Repository**
   ```bash
   vercel
   ```

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Sub-App Integration

Sub-applications can access the portal API using the same domain:

### Authentication Flow for Sub-Apps

1. **Get App Token**
   ```javascript
   const response = await fetch('https://portal.terralink.com.br/api/auth/app-token', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${sessionToken}`
     },
     body: JSON.stringify({ appId: 'your-app-id' })
   });
   ```

2. **Validate App Token**
   ```javascript
   const response = await fetch('https://portal.terralink.com.br/api/auth/validate-app-token', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${appToken}`
     },
     body: JSON.stringify({ appId: 'your-app-id' })
   });
   ```

### CORS Configuration

The API automatically handles CORS for all origins. For production, you may want to restrict this:

```javascript
// In api endpoints
const allowedOrigins = [
  'https://portal.terralink.com.br',
  'https://app1.terralink.com.br',
  'https://app2.terralink.com.br'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

## Database Migration (Future)

Currently using in-memory storage. To migrate to a database:

1. **Install Database Client**
   ```bash
   npm install @prisma/client prisma
   ```

2. **Create Schema**
   ```prisma
   // prisma/schema.prisma
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     role      String
     domain    String
     createdAt DateTime @default(now())
     sessions  Session[]
     activities Activity[]
   }
   ```

3. **Update Storage Layer**
   - Implement database methods in `/api/lib/storage.ts`
   - Switch from InMemoryStorage to DatabaseStorage

## Monitoring

### Health Check Endpoint

Add a health check for monitoring:

```typescript
// api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
```

### Recommended Services

- **Error Tracking**: Sentry
- **Analytics**: Google Analytics or Plausible
- **Uptime Monitoring**: Vercel Analytics or UptimeRobot

## Security Checklist

- [ ] Strong JWT_SECRET (minimum 32 characters)
- [ ] HTTPS only (automatic with Vercel)
- [ ] Domain whitelist configured
- [ ] Admin emails restricted
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints
- [ ] XSS protection (React handles this)
- [ ] SQL injection protection (when using database)

## Performance Optimization

1. **Enable Caching**
   ```typescript
   res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
   ```

2. **Use CDN for Assets**
   - Vercel automatically serves static assets via CDN

3. **Optimize Images**
   - Use next-gen formats (WebP, AVIF)
   - Implement lazy loading

## Backup and Recovery

1. **Data Backup** (when using database)
   - Daily automated backups
   - Point-in-time recovery

2. **Code Backup**
   - Git repository
   - Tagged releases

## Support

For deployment issues:
- Check Vercel logs: `vercel logs`
- Review function logs in Vercel dashboard
- Contact: devops@terralink.com.br