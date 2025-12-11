# ⚡ Sarathi - Quick Commands Cheat Sheet

## 📤 Push to GitHub (First Time)

```bash
# 1. Create repo on GitHub first: https://github.com/new

# 2. Then run these commands:
cd /Users/apurvasharan/Documents/Sarathi2.0
git init
git add .
git commit -m "Initial commit: Sarathi MVP"
git remote add origin https://github.com/YOUR_USERNAME/Sarathi.git
git push -u origin main
```

**Don't forget to replace `YOUR_USERNAME` with your GitHub username!**

---

## 👥 What Friends Need to Install

```bash
# 1. Node.js 20+ → https://nodejs.org/
node --version

# 2. pnpm 8+
npm install -g pnpm

# 3. Docker Desktop → https://docker.com/
docker --version

# 4. Git → https://git-scm.com/
git --version
```

---

## 🚀 Setup for Friends (After Fork)

```bash
# Clone
git clone https://github.com/THEIR_USERNAME/Sarathi.git
cd Sarathi

# Install
pnpm install

# Setup
cp env.sample .env
pnpm --filter @sarathi/shared build

# Start databases
cd infra && docker-compose -f docker-compose.dev.yml up -d && cd ..

# Run app
pnpm dev:all

# Open: http://localhost:5173
```

---

## 🔄 Daily Workflow

### Start Everything:
```bash
./restart.sh
```

### Or Manually:
```bash
# Start databases
cd infra && docker-compose -f docker-compose.dev.yml up -d && cd ..

# Start app
pnpm dev:all
```

### Stop Everything:
```bash
# Press Ctrl+C in terminal

# Stop databases
cd infra && docker-compose -f docker-compose.dev.yml down && cd ..
```

---

## 🛠️ Common Commands

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm --filter @sarathi/shared build

# Build everything
pnpm build

# Run tests
pnpm test

# Check API health
curl http://localhost:3000/health

# Check Docker containers
docker ps

# View Docker logs
docker logs sarathi-mongo-dev
docker logs sarathi-redis-dev

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Kill port 5173
lsof -ti:5173 | xargs kill -9
```

---

## 🧪 Testing & Development

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter @sarathi/api test

# Run in watch mode
pnpm --filter @sarathi/shared test:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

---

## 🐛 Quick Fixes

### "Cannot connect to MongoDB"
```bash
docker ps  # Check if running
cd infra && docker-compose -f docker-compose.dev.yml restart && cd ..
```

### "Port already in use"
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "Module not found @sarathi/shared"
```bash
pnpm --filter @sarathi/shared build
```

### "Docker not running"
```bash
# Open Docker Desktop app and wait for it to start
```

---

## 📚 Documentation Quick Links

- **Full Setup**: [SETUP.md](./SETUP.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **GitHub Guide**: [GITHUB_SETUP.md](./GITHUB_SETUP.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Full Docs**: [README.md](./README.md)

---

## 🎯 Login Flow (for testing)

1. Open http://localhost:5173
2. Phone: `+919876543210`
3. Send OTP
4. Check API terminal for OTP
5. Enter OTP → Login! ✅

---

## 💡 Demo Data

```bash
# After login:
1. Go to Admin Panel (tile #6)
2. Click "Seed Transactions"
3. Check Credit Score (tile #2) → Band A! 🎉
```

---

**Save this file for quick reference!** 📌

