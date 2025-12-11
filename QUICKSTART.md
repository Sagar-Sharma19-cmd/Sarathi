# Quick Start Guide - Sarathi MVP

Get Sarathi running locally in 5 minutes!

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for databases)

## 1. Clone & Install (1 min)

```bash
cd Sarathi2.0
pnpm install
```

## 2. Start Databases (1 min)

```bash
cd infra
docker-compose -f docker-compose.dev.yml up -d
cd ..
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

## 3. Create Environment File (30 seconds)

```bash
cp env.sample .env
```

The defaults work for local development! The `.env` file is already configured with:
- Local MongoDB and Redis URLs
- DEV_SMS_CONSOLE (logs OTP to console)
- Development JWT secret

## 4. Start Dev Servers (30 seconds)

```bash
pnpm dev:all
```

This starts:
- **API** on http://localhost:3000
- **Web** on http://localhost:5173

## 5. Try It Out! (2 min)

1. Open http://localhost:5173
2. Enter any Indian phone number: `+919876543210`
3. Click "Send OTP"
4. Check your terminal console for the OTP (6-digit code)
5. Enter OTP and login
6. You're in! 🎉

### Demo Flow

**A. Seed Historical Data**
1. Go to tile #6 (Help/Admin)
2. Click "Seed Transactions"
3. This creates 6 months of ₹2,500 remittances

**B. Check Your Credit Score**
1. Go to tile #2 (Credit Score)
2. You should see **Band A** with score **≥680**
3. View score factors and history

**C. Request a Loan**
1. Go to tile #3 (Loan)
2. Enter amount: `5000`
3. Click "Check Eligibility"
4. Get instant approval! (60-day term)
5. Click "Accept Offer"
6. Loan disbursed! 💰

**D. Send Money**
1. Go to tile #1 (Send Money)
2. Enter amount and recipient phone
3. Send money
4. Check console for SMS receipt

**E. Change State (Test Portability)**
1. Go to tile #5 (Settings)
2. Change state from Delhi to Maharashtra
3. Go back to Credit Score
4. Score remains the same! ✅

## Architecture Overview

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │─────▶│   Express   │─────▶│  MongoDB    │
│   (Vite)    │ HTTP │   + JWT     │      │  + Redis    │
└─────────────┘      └─────────────┘      └─────────────┘
     5173                 3000                27017/6379

  Frontend            Backend API          Databases
```

## Key Endpoints

- **Health**: `GET http://localhost:3000/health`
- **Send OTP**: `POST http://localhost:3000/auth/otp/send`
- **Get Profile**: `GET http://localhost:3000/profile/me`

## File Structure

```
Sarathi2.0/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Types, schemas, scoring
├── infra/            # Docker configs
└── README.md         # Full documentation
```

## Common Commands

```bash
# Development
pnpm dev:all          # Start everything
pnpm dev:api          # API only
pnpm dev:web          # Web only

# Build
pnpm build            # Build for production

# Test
pnpm test             # Run all tests

# Stop databases
cd infra
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
```

### "Cannot connect to MongoDB"
```bash
docker ps  # Check if mongo is running
docker restart sarathi-mongo-dev
```

### "OTP not appearing"
- Check the terminal where `pnpm dev:api` is running
- OTP logs look like: `📱 SMS to +919876543210` followed by the code

### "CORS error"
- Ensure both API and Web are running
- Web should proxy `/api` requests to the API server

## What's Next?

- Read the full [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute

## Features Implemented

✅ Phone OTP authentication  
✅ Portable Sarathi ID (UUID)  
✅ Mock remittance system with SMS  
✅ Credit scoring engine (Base 580 → Band A/B/C)  
✅ Instant micro-loans (₹1,000-5,000)  
✅ State portability (score persists)  
✅ Bilingual UI (English/Hindi)  
✅ Admin panel with data seeding  
✅ Transaction history  
✅ Loan repayment system  

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, TanStack Query, i18next
- **Backend**: Node.js 20, Express, TypeScript, Zod, JWT, Pino
- **Database**: MongoDB, Redis
- **DevOps**: Docker, docker-compose, pnpm workspaces

---

**Built in 24 hours** for demonstrating financial inclusion for migrant workers 🚀

Need help? Check the main README or open an issue!

