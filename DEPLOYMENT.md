# Deployment Guide

This guide covers deploying Sarathi to various platforms.

## Render Deployment

### 1. Database Setup

**MongoDB Atlas** (Recommended):
1. Create a free cluster at https://cloud.mongodb.com
2. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/sarathi`

**Upstash Redis**:
1. Create free database at https://upstash.com
2. Get Redis URL: `rediss://...`

### 2. Deploy API

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `sarathi-api`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm build:api`
   - **Start Command**: `cd apps/api && node dist/index.js`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3000
     MONGO_URI=<your-mongodb-atlas-uri>
     JWT_SECRET=<generate-secure-random-string>
     REDIS_URL=<your-upstash-redis-url>
     SMS_PROVIDER=DEV_SMS_CONSOLE
     WEB_ORIGIN=https://sarathi-web.onrender.com
     ```

### 3. Deploy Web

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `sarathi-web`
   - **Build Command**: `pnpm install && pnpm build:web`
   - **Publish Directory**: `apps/web/dist`

4. Update API's `WEB_ORIGIN` to your web URL

## Railway Deployment

### 1. Setup Project

1. Create new project at https://railway.app
2. Add services from marketplace:
   - MongoDB
   - Redis

### 2. Deploy API

1. Click "New" → "GitHub Repo"
2. Select your repo
3. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `cd ../.. && pnpm install && pnpm build:api`
   - **Start Command**: `cd apps/api && node dist/index.js`
4. Add environment variables (Railway auto-injects MongoDB/Redis URLs)

### 3. Deploy Web

1. Add new service from same repo
2. Configure:
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm build:web`
3. Use Nginx buildpack or static hosting

## Docker Production

### Single Server Deployment

1. Set up environment variables:
```bash
cp env.sample .env
# Edit .env with production values
```

2. Build and start:
```bash
cd infra
docker-compose up -d
```

3. Access:
   - Web: http://your-server:5173
   - API: http://your-server:3000

### Scaling

For production, use:
- **MongoDB Atlas** or managed MongoDB
- **Redis Cloud** or managed Redis
- **CDN** for static assets (CloudFront, Cloudflare)
- **Load Balancer** for API (Nginx, HAProxy)

## SMS Provider Configuration

### Production Setup

For production, use a real SMS provider:

**Exotel** (India):
```env
SMS_PROVIDER=EXOTEL
SMS_API_KEY=your_exotel_api_key
SMS_API_SECRET=your_exotel_api_token
SMS_SENDER_ID=your_exotel_sender_id
```

**Gupshup** (India):
```env
SMS_PROVIDER=GUPSHUP
SMS_API_KEY=your_gupshup_userid
SMS_API_SECRET=your_gupshup_password
SMS_SENDER_ID=your_gupshup_sender
```

**Twilio**:
```env
SMS_PROVIDER=TWILIO
SMS_API_KEY=your_twilio_account_sid
SMS_API_SECRET=your_twilio_auth_token
SMS_SENDER_ID=your_twilio_phone_number
```

## Environment Variables

### Required
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Strong random secret (256+ bits)
- `REDIS_URL`: Redis connection string

### Optional
- `SMS_PROVIDER`: SMS service to use
- `SMS_API_KEY`: Provider API key
- `SMS_API_SECRET`: Provider secret
- `SMS_SENDER_ID`: Sender ID/phone
- `WEB_ORIGIN`: Frontend URL for CORS
- `NODE_ENV`: `production` or `development`

## Security Checklist

- [ ] Change default `JWT_SECRET`
- [ ] Use strong database passwords
- [ ] Enable MongoDB authentication
- [ ] Use Redis password protection
- [ ] Enable HTTPS (use Render/Railway SSL or Cloudflare)
- [ ] Set up firewall rules
- [ ] Enable rate limiting in production
- [ ] Configure CORS for production domain only
- [ ] Use real SMS provider (not DEV_SMS_CONSOLE)
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Enable database backups
- [ ] Set up logging aggregation

## Monitoring

### Health Checks

- **API**: `GET /health` → Should return 200 with `{"status":"ok"}`
- **MongoDB**: Check connection in logs
- **Redis**: Check connection in logs

### Logs

Access logs:
```bash
# Render
render logs -s sarathi-api

# Railway
railway logs

# Docker
docker logs sarathi-api
```

## Troubleshooting

### API Not Starting
- Check MongoDB connection string
- Verify Redis URL
- Check logs for errors

### CORS Errors
- Verify `WEB_ORIGIN` matches frontend URL
- Include protocol (http/https)

### OTP Not Sending
- Check SMS provider credentials
- Verify SMS_PROVIDER is set correctly
- Check API logs for errors

## Performance Optimization

### Frontend
- Enable CDN for static assets
- Implement service worker for offline support
- Add image optimization

### Backend
- Use MongoDB indexes (already configured)
- Enable Redis persistence
- Implement request caching
- Use horizontal scaling for API

## Backup Strategy

### MongoDB
- Enable automated backups in Atlas
- Or set up cron job for mongodump

### Redis
- Enable RDB persistence
- Consider AOF for critical data

---

For questions or issues, check the main README or create an issue on GitHub.

