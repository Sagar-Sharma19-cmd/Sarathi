# 🚀 Sarathi - Setup Guide for Contributors

This guide will help you set up the Sarathi project on your local machine.

## 📋 Prerequisites (Must Install)

### 1. **Node.js 20 or higher**

**Check if installed:**
```bash
node --version
# Should show v20.x.x or higher (v23.11.0 works great!)
```

**If not installed:**
- **Mac:** Download from https://nodejs.org/ or use Homebrew:
  ```bash
  brew install node@20
  ```
- **Windows:** Download from https://nodejs.org/
- **Linux:**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

---

### 2. **pnpm 8 or higher**

**Check if installed:**
```bash
pnpm --version
# Should show 8.x.x or higher
```

**Install pnpm:**
```bash
npm install -g pnpm
```

**Verify installation:**
```bash
pnpm --version
```

---

### 3. **Docker Desktop**

**Check if installed:**
```bash
docker --version
docker-compose --version
```

**If not installed:**

**Mac:**
1. Download from https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Launch Docker Desktop (whale icon in menu bar)

**Windows:**
1. Download from https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Launch Docker Desktop

**Linux:**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

### 4. **Git**

**Check if installed:**
```bash
git --version
```

**If not installed:**
- **Mac:** `brew install git` or download from https://git-scm.com/
- **Windows:** Download from https://git-scm.com/
- **Linux:** `sudo apt-get install git`

---

## 📥 Clone and Setup

### Step 1: Fork the Repository (on GitHub)

1. Go to the repository: `https://github.com/YOUR_USERNAME/Sarathi`
2. Click **"Fork"** button (top right)
3. This creates a copy in your GitHub account

---

### Step 2: Clone Your Fork

```bash
# Clone your forked repository
git clone https://github.com/YOUR_GITHUB_USERNAME/Sarathi.git

# Navigate into the project
cd Sarathi
```

---

### Step 3: Install Dependencies

```bash
# Install all dependencies (takes 2-3 minutes)
pnpm install
```

**What this does:**
- Installs packages for API, Web, and Shared packages
- Sets up the monorepo workspace
- Links local packages together

---

### Step 4: Setup Environment Variables

```bash
# Copy the sample environment file
cp env.sample .env
```

**The default `.env` works for local development!** You don't need to change anything initially.

**Optional: Review the `.env` file:**
```bash
cat .env
```

Default values:
- `MONGO_URI=mongodb://localhost:27017/sarathi` (local MongoDB)
- `REDIS_URL=redis://localhost:6379` (local Redis)
- `SMS_PROVIDER=DEV_SMS_CONSOLE` (logs OTP to console)

---

### Step 5: Build Shared Package

```bash
# Build the shared package first (required!)
pnpm --filter @sarathi/shared build
```

**Why?** The API and Web apps depend on compiled code from the shared package.

---

### Step 6: Start Docker Containers

```bash
# Navigate to infra directory
cd infra

# Start MongoDB and Redis
docker-compose -f docker-compose.dev.yml up -d

# Go back to root
cd ..

# Verify containers are running
docker ps
```

**You should see:**
- `sarathi-mongo-dev` (MongoDB on port 27017)
- `sarathi-redis-dev` (Redis on port 6379)

---

### Step 7: Start the Application

**Option A: Start both API and Web together (recommended)**
```bash
pnpm dev:all
```

**Option B: Start separately in different terminals**

Terminal 1 (API):
```bash
pnpm dev:api
```

Terminal 2 (Web):
```bash
pnpm dev:web
```

---

### Step 8: Open in Browser

Open http://localhost:5173

You should see the Sarathi login page! 🎉

---

## ✅ Verify Everything Works

### 1. Check API Health
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

---

### 2. Test Login Flow

1. Go to http://localhost:5173
2. Enter phone: `+919876543210`
3. Click "Send OTP"
4. Check your API terminal for the OTP:
```
===========================================
📱 SMS to +919876543210
📄 Message: Your Sarathi OTP is: 123456...
===========================================
```
5. Enter the OTP and login!

---

### 3. Seed Demo Data

1. Login to the app
2. Click tile #6 (Help/Admin)
3. Click "Seed Transactions"
4. Go to tile #2 (Credit Score)
5. You should see Band A with score 680+!

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to MongoDB"

**Check if Docker is running:**
```bash
docker ps
```

**If no containers, start them:**
```bash
cd infra
docker-compose -f docker-compose.dev.yml up -d
cd ..
```

---

### Issue 2: "Port 3000 already in use"

**Kill the process:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Then restart:**
```bash
pnpm dev:api
```

---

### Issue 3: "Failed to resolve entry for package @sarathi/shared"

**Build the shared package:**
```bash
pnpm --filter @sarathi/shared build
```

---

### Issue 4: "pnpm: command not found"

**Install pnpm:**
```bash
npm install -g pnpm
```

---

### Issue 5: Docker Desktop not starting (Mac)

1. Open Docker Desktop app
2. Wait for whale icon in menu bar to show "Docker Desktop is running"
3. Try starting containers again

---

## 🛑 Stopping the Project

### Stop the servers:
Press `Ctrl+C` in each terminal running the app

### Stop Docker containers:
```bash
cd infra
docker-compose -f docker-compose.dev.yml down
cd ..
```

---

## 🔄 Restarting the Project

### Quick restart script:
```bash
# Make restart script executable (first time only)
chmod +x restart.sh

# Restart everything
./restart.sh
```

---

## 📦 System Requirements

**Minimum:**
- **RAM:** 4 GB
- **Disk Space:** 5 GB free
- **OS:** macOS 10.15+, Windows 10+, or Linux

**Recommended:**
- **RAM:** 8 GB or more
- **Disk Space:** 10 GB free
- **CPU:** Multi-core processor

---

## 🧪 Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @sarathi/shared test
pnpm --filter @sarathi/api test

# Run tests in watch mode
pnpm --filter @sarathi/shared test:watch
```

---

## 🏗️ Project Structure

```
Sarathi/
├── apps/
│   ├── api/          # Express backend (TypeScript)
│   └── web/          # React frontend (TypeScript)
├── packages/
│   └── shared/       # Shared types, schemas, scoring logic
├── infra/
│   ├── docker-compose.yml       # Production setup
│   └── docker-compose.dev.yml   # Development databases
├── .env              # Environment variables (create from env.sample)
├── env.sample        # Template for .env
├── package.json      # Root workspace config
├── pnpm-workspace.yaml
└── README.md         # Full documentation
```

---

## 📚 Useful Commands

```bash
# Install dependencies
pnpm install

# Start development (all services)
pnpm dev:all

# Start API only
pnpm dev:api

# Start Web only
pnpm dev:web

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Seed demo data (from Admin panel after login)
# Or via API terminal after starting the server

# Check Docker containers
docker ps

# View Docker logs
docker logs sarathi-mongo-dev
docker logs sarathi-redis-dev

# Stop Docker containers
cd infra && docker-compose -f docker-compose.dev.yml down

# Restart Docker containers
cd infra && docker-compose -f docker-compose.dev.yml restart
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🆘 Getting Help

**If you encounter issues:**

1. Check [QUICKSTART.md](./QUICKSTART.md) for quick troubleshooting
2. Read [README.md](./README.md) for detailed documentation
3. Check existing GitHub Issues
4. Create a new Issue with:
   - What you were trying to do
   - What happened (error messages)
   - Your system info (OS, Node version, etc.)

---

## ✅ Setup Checklist

Before starting development, ensure:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm 8+ installed (`pnpm --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed (`git --version`)
- [ ] Repository cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Shared package built (`pnpm --filter @sarathi/shared build`)
- [ ] `.env` file created from `env.sample`
- [ ] Docker containers running (`docker ps` shows 2 containers)
- [ ] API responding (`curl http://localhost:3000/health`)
- [ ] Web app accessible (http://localhost:5173)

---

## 🎉 You're All Set!

You now have Sarathi running locally. Happy coding! 🚀

**Next steps:**
- Read [README.md](./README.md) for project overview
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Explore the codebase
- Make your first contribution!

