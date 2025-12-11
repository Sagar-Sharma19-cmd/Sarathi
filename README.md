# Sarathi - Cross-State Financial Identity & Micro-Loan MVP

**Sarathi** is a production-ready MVP for Indian migrant workers, providing cross-state financial identity, portable credit scoring, and instant micro-loans without assuming smartphone banking infrastructure. Built for a 24-hour hackathon with the MERN stack.

## 🎯 Key Features

- **OTP-Based Authentication**: Phone OTP login with Redis-backed rate limiting
- **Sarathi ID**: Portable financial identity (UUID) that persists across state migrations
- **Mock Remittance System**: Simulate money transfers with SMS receipts
- **Portable Credit Score**: Deterministic scoring engine based on remittance behavior
  - Base score: 580
  - Bands: A (≥680), B (630-679), C (<630)
  - Score factors: remittance history, stability, counterparty patterns, loan repayment
- **Instant Micro-Loans**: Rule-based loan approval (₹1,000-5,000) based on credit band
- **SafeSend Escrow**: Purpose-locked remittances with merchant proof-of-use verification
  - Lock funds for specific goals (school fees, groceries, rent, medical, utilities)
  - Merchant submits proof (receipt/photo) → Admin reviews → Funds released or refunded
  - SMS notifications at every stage via Twilio/Exotel/Gupshup
- **State Portability**: Change states without losing credit history
- **Bilingual UI**: English and Hindi (i18next)
- **Low-Literacy Design**: Seven-tile home screen with numeric badges

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express + TypeScript
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (rate limiting, OTP storage)
- **Validation**: Zod
- **Auth**: JWT (HS256)
- **Logging**: Pino (JSON logs)

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: TailwindCSS
- **Data Fetching**: TanStack Query
- **Forms**: react-hook-form
- **Routing**: react-router-dom
- **i18n**: i18next (EN/HI)

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Containerization**: Docker + docker-compose
- **Deployment**: Render/Railway ready

## 📂 Project Structure

```
Sarathi2.0/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── src/
│   │   │   ├── config/       # Database, Redis, logger, env
│   │   │   ├── models/       # Mongoose models
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic (OTP, scoring, SMS)
│   │   │   ├── middleware/   # Auth, rate limit, validation
│   │   │   ├── utils/        # JWT, errors
│   │   │   └── index.ts      # Server entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                  # React frontend
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── contexts/     # Auth context
│       │   ├── lib/          # API client
│       │   ├── locales/      # i18n translations (en.json, hi.json)
│       │   ├── pages/        # Screen components
│       │   └── App.tsx       # Router setup
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
├── packages/
│   └── shared/               # Shared types, Zod schemas, scoring logic
│       ├── src/
│       │   ├── constants.ts
│       │   ├── types.ts
│       │   ├── schemas.ts
│       │   ├── scoring.ts    # Pure scoring function
│       │   └── index.ts
│       └── package.json
├── infra/
│   ├── docker-compose.yml    # Production setup
│   └── docker-compose.dev.yml # Dev databases only
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20+ (v23.11.0 works great!)
- **pnpm**: v8+
- **Docker Desktop** (for MongoDB and Redis)
- **Git** (for cloning the repository)

> **👥 New to the project?** See [SETUP.md](./SETUP.md) for detailed setup instructions including what to install!

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy the sample env file and configure:

```bash
cp env.sample .env
```

Edit `.env`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/sarathi

# JWT
JWT_SECRET=your-secure-secret-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# SMS Provider: DEV_SMS_CONSOLE|EXOTEL|GUPSHUP|TWILIO
SMS_PROVIDER=DEV_SMS_CONSOLE
SMS_API_KEY=
SMS_API_SECRET=
SMS_SENDER_ID=SARATHI

# Web Origin (for CORS)
WEB_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development

# Server
PORT=3000
```

### 3. Run Development Environment

**Option A: With Docker (Recommended)**

Start MongoDB and Redis only:

```bash
cd infra
docker-compose -f docker-compose.dev.yml up -d
cd ..
```

Then run the apps locally:

```bash
# Terminal 1: API
pnpm dev:api

# Terminal 2: Web
pnpm dev:web

# Or run both concurrently
pnpm dev:all
```

**Option B: Full Docker Stack**

```bash
cd infra
docker-compose up
```

Access:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. Demo & Seed Data

1. **Login**: Use any Indian phone number (e.g., `+919876543210`)
2. **OTP**: Check server console for OTP (with `DEV_SMS_CONSOLE`)
3. **Seed Data**: Navigate to Admin Panel (tile 7) and seed 6 months of ₹2,500 remittances
4. **Check Score**: Go to Credit Score (tile 2) – you should see Band A (≥680)
5. **Request Loan**: Go to Loan (tile 3), request ₹5,000, get instant approval
6. **Create Merchants** (for SafeSend): In Admin Panel, create and verify merchants:
   - Example: "ABC School", +919876543210, "School", DL
   - Example: "XYZ Grocery", +919876543211, "Grocery", DL
7. **Try SafeSend**: Go to SafeSend (tile 4), create escrow with verified merchant
8. **Change State**: Go to Settings (tile 6), change state – score remains unchanged

## 📡 API Endpoints

### Auth
- `POST /auth/otp/send` - Send OTP
- `POST /auth/otp/verify` - Verify OTP and login

### Profile
- `GET /profile/me` - Get user profile, score, active loan
- `POST /profile/state` - Update state code
- `POST /profile/language` - Update language preference

### Consent
- `POST /consent` - Issue consent artifact (signed JWT)
- `GET /consent` - List all consents

### Transactions
- `GET /transactions?page=1&limit=20` - List transactions (paginated)
- `POST /transactions/remit` - Send money (mock)

### Score
- `GET /score` - Get current score and history

### Loan
- `POST /loan/request` - Request loan with instant decision
- `POST /loan/accept` - Accept loan offer (disbursement)
- `POST /loan/repay` - Repay loan
- `GET /loan/active` - Get active loan details

### SafeSend
- `GET /safesend/merchants?stateCode=DL&verified=true` - List merchants
- `POST /safesend/merchants` - Create merchant (admin only)
- `POST /safesend/merchants/:id/verify` - Verify merchant (admin only)
- `POST /safesend/escrow` - Create SafeSend escrow
- `GET /safesend/escrow/my?page=1&limit=20` - List user's escrows
- `GET /safesend/escrow/merchant/:merchantId` - List merchant's escrows
- `GET /safesend/escrow/:escrowId` - Get escrow details with proofs
- `POST /safesend/proof` - Submit proof (merchant)
- `GET /safesend/proof/pending` - List pending proofs (admin only)
- `POST /safesend/proof/review` - Approve/reject proof (admin only)
- `POST /safesend/escrow/refund` - Refund escrow (admin only)

### Admin
- `GET /admin/seed?months=6&amount=2500&counterparty=+919999999999` - Seed historic remittances
- `POST /admin/poor-network-toggle` - Toggle poor network mode

## 💰 SafeSend Feature

**SafeSend** is a purpose-locked escrow remittance system that ensures funds sent for specific purposes (like school fees or groceries) are only released when the merchant provides proof of purchase.

### How It Works

1. **Sender Creates SafeSend**
   - Select verified merchant from list
   - Choose amount and purpose (school fees, groceries, rent, medical, utilities, other)
   - Add optional notes about the payment
   - Funds move into escrow with status `awaiting_proof`

2. **Merchant Receives Notification**
   - SMS alert with escrow details and reference ID
   - Merchant fulfills the service/purchase
   - Merchant uploads proof (receipt photo URL, invoice link, etc.) with optional description

3. **Admin Reviews Proof**
   - Admin panel shows pending proof queue
   - View proof URL and merchant description
   - Approve → funds released to merchant, status becomes `released`
   - Reject → merchant must resubmit with corrections, status returns to `awaiting_proof`

4. **SMS Updates Throughout**
   - Sender notified when proof submitted, approved/rejected, released
   - Merchant notified when proof approved/rejected, funds released

5. **Refund Option**
   - Admin can refund escrow if proof is never submitted or repeatedly rejected
   - Status becomes `refunded`, funds return to sender

### Data Models

**Merchant**
```typescript
{
  name: string;
  phoneE164: string;
  category: string; // e.g., "School", "Grocery Store"
  verified: boolean; // Only verified merchants appear in SafeSend
  stateCode: string;
}
```

**SafeSend Escrow**
```typescript
{
  senderId: string;
  merchantId: string;
  amount: number;
  goal: 'school_fees'|'groceries'|'rent'|'medical'|'utilities'|'other';
  status: 'pending'|'awaiting_proof'|'under_review'|'released'|'refunded'|'rejected';
  lockReason?: string; // Optional notes from sender
  releasedAt?: Date;
  refundedAt?: Date;
}
```

**SafeSend Proof**
```typescript
{
  escrowId: string;
  merchantId: string;
  proofUrl: string; // URL to receipt/photo (uploaded to external service)
  description?: string;
  status: 'pending'|'approved'|'rejected';
  reviewedBy?: string; // Admin user ID
  reviewedAt?: Date;
  rejectionReason?: string;
}
```

### Use Cases

- **School Fees**: Parents send money for tuition; school submits fee receipt
- **Groceries**: Family sends money for essentials; shop uploads invoice
- **Rent**: Remit rent payment; landlord provides rent receipt
- **Medical**: Send for healthcare; clinic/pharmacy submits bill

## 🧮 Credit Scoring Algorithm

The scoring engine is a **pure function** (`computeScore`) in `packages/shared/src/scoring.ts`:

```typescript
Base Score: 580

+ 10 per month with remittance ≥ ₹2,000 (last 6 months, cap +60)
+ 15 if std-dev of last 3 months < 25% of mean (stability)
+ 10 if same counterparty in ≥3 different months (loyalty)
+ 20 on first fully repaid loan
- 50 on any defaulted loan

Bands:
  A: ≥680  → Approve up to ₹5,000 (60d term if 5k, else 30d)
  B: 630-679 → Approve up to ₹3,000 (30d)
  C: <630  → Approve ₹1,000 only if score ≥600 and ≥3 monthly remittances
```

**Reason Codes:**
- `R1_REM_HISTORY`: Remittance history bonus
- `R2_STABILITY`: Income stability bonus
- `R3_FIRST_TIMER`: First loan repayment bonus
- `R4_DEFAULT_RISK`: Default penalty
- `R5_COUNTERPARTY_STABILITY`: Repeated counterparty bonus

## 🔐 Security Features

- **Rate Limiting**: 60 req/min per IP, 10 req/min per user
- **OTP Limits**: 5 sends/day, 10 verifies/day, 60s cooldown
- **JWT**: HS256, 24h expiry, signed with secret
- **Input Validation**: Zod schemas on all endpoints
- **CORS**: Restricted to web origin
- **Log Redaction**: Pino redacts OTP, passwords, tokens

## 🧪 Testing

Run tests:

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @sarathi/shared test
pnpm --filter @sarathi/api test
```

The scoring engine has comprehensive unit tests in `packages/shared/src/scoring.test.ts`.

## 📦 Deployment

### Deploy to Render

1. Create a new **Web Service** for API:
   - Build Command: `pnpm install && pnpm build:api`
   - Start Command: `pnpm --filter @sarathi/api start`
   - Add environment variables from `.env`

2. Create a new **Static Site** for Web:
   - Build Command: `pnpm install && pnpm build:web`
   - Publish Directory: `apps/web/dist`

3. Create MongoDB and Redis instances (or use MongoDB Atlas + Upstash Redis)

### Deploy to Railway

1. Connect your GitHub repo
2. Add MongoDB and Redis services from Railway marketplace
3. Add environment variables
4. Deploy API and Web services

### Docker Production Build

```bash
cd infra
docker-compose up --build
```

## 🎨 Frontend Screens

1. **Login**: Phone OTP + language selector
2. **Home**: 7-tile dashboard with numeric badges
3. **Send Money**: Amount + counterparty form, SMS receipt
4. **Credit Score**: Big number, band, reason codes, timeline
5. **Loan**: Request → instant decision → accept → repay
6. **SafeSend**: Create escrow, list transfers, view details with proof submissions
7. **Transactions**: Paginated list with type/status
8. **Settings**: Language, state, consent receipts, logout
9. **Admin**: Seed data, merchant management, proof review queue

## 📱 SMS Provider Configuration

Sarathi supports multiple SMS providers via an adapter pattern:

- **DEV_SMS_CONSOLE**: Logs to console (default for development)
- **EXOTEL**: Indian SMS provider
- **GUPSHUP**: Indian SMS provider
- **TWILIO**: Global SMS provider

To switch providers, update `.env`:

```env
SMS_PROVIDER=TWILIO
SMS_API_KEY=your_twilio_account_sid
SMS_API_SECRET=your_twilio_auth_token
SMS_SENDER_ID=+1234567890
```

## 🌍 Bilingual Support

All UI text is localized using i18next. Translations in:
- `apps/web/src/locales/en.json` (English)
- `apps/web/src/locales/hi.json` (Hindi)

Users can switch language in Login or Settings.

## 📊 Data Models

### Users
```typescript
{
  phoneE164: string;      // +91XXXXXXXXXX
  sarathiId: string;      // UUID
  preferredLang: 'en'|'hi';
  stateCode: string;      // 2-char (e.g., 'DL', 'MH')
  kycStatus: 'none'|'basic';
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transactions
```typescript
{
  userId: string;
  type: 'remit'|'repay'|'loan_disbursal';
  amount: number;
  counterparty?: string;
  stateCode: string;
  status: 'success'|'failed'|'pending';
  createdAt: Date;
}
```

### Scores
```typescript
{
  userId: string;
  score: number;
  band: 'A'|'B'|'C';
  reasonCodes: string[];
  stateCode: string;
  createdAt: Date;
}
```

### Loans
```typescript
{
  userId: string;
  principal: number;
  apr: number;
  termDays: number;
  status: 'preapproved'|'approved'|'disbursed'|'repaid'|'defaulted'|'rejected';
  approvedAt?: Date;
  disbursedAt?: Date;
  repaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎯 Acceptance Criteria ✅

- [x] Fresh user can login via OTP, create Sarathi ID, set language/state in ≤3 minutes
- [x] Admin seed creates 6 historic remittances; score shows ≥680 (Band A) with reasons
- [x] Changing state leaves score unchanged
- [x] Requesting ₹5,000 with Band A returns 60d term approval
- [x] Accepting loan creates `loan_disbursal` transaction
- [x] Repaying loan increases score by +20 (first loan bonus)
- [x] All SMS events sent via selected provider or logged (DEV adapter)
- [x] All routes Zod-validated, no untyped `any`
- [x] LCP < 2.5s, bundle ≤300KB gzip

## 🛠️ Development Scripts

```bash
# Install dependencies
pnpm install

# Development
pnpm dev:api          # Start API dev server
pnpm dev:web          # Start web dev server
pnpm dev:all          # Start both concurrently

# Build
pnpm build            # Build all packages
pnpm build:api        # Build API only
pnpm build:web        # Build web only

# Test
pnpm test             # Run all tests

# Lint & Format
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier

# Seed
pnpm seed             # Note: Use /admin/seed API endpoint with auth
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:7
```

### Redis Connection Error
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### OTP Not Received
- Check server console for OTP (with `DEV_SMS_CONSOLE`)
- Verify `SMS_PROVIDER` is set correctly in `.env`

### CORS Error
- Ensure `WEB_ORIGIN` in `.env` matches your frontend URL

### SafeSend Merchant Dropdown Empty
- No verified merchants exist yet
- Go to Admin Panel → Create merchants → Click "Verify" for each merchant
- Only verified merchants appear in SafeSend dropdown

### Cannot Create Merchant (Admin Panel)
- **Check you're logged in as admin**: First user to register is automatically admin
- **Verify all fields are filled**:
  - Name: e.g., "ABC School"
  - Phone: Must match format `+919876543210` (Indian number starting with +91, followed by 6-9, then 9 digits)
  - Category: e.g., "School", "Grocery", "Medical"
  - State Code: Exactly 2 uppercase letters (e.g., "DL", "MH", "KA")
- **Check browser console** for detailed error messages (F12 → Console tab)
- **Check API logs** in terminal for backend errors

## 📝 License

MIT License - Built for educational and demonstration purposes.

## 👥 Contributors

Built for a 24-hour hackathon MVP demonstrating financial inclusion for Indian migrant workers.

## 🙏 Acknowledgments

- **Target Users**: Indian migrant workers moving across states
- **Problem**: Loss of financial identity and credit history during migration
- **Solution**: Portable Sarathi ID + credit score based on remittance behavior

---

**Note**: This is an MVP with mocked payment/UPI integrations. For production, integrate real payment rails, KYC, and regulatory compliance.

