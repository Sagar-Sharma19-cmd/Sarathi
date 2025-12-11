# 🚀 Quick Gemini AI Setup (5 Minutes)

## Why Gemini? 🎉
- ✅ **100% FREE** (no credit card needed!)
- ✅ **Better Hindi support** than OpenAI
- ✅ **60 requests/minute** on free tier
- ✅ **1,500 requests/day**
- ✅ **No cost** even in production!

## Setup Steps

### Step 1: Get FREE Gemini API Key (2 minutes)

1. **Go to:** https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. Click **"Create API key"**
4. **Copy** the key (starts with `AIza...`)

### Step 2: Add to Environment (1 minute)

```bash
cd /Users/apurvasharan/Documents/Sarathi2.0

# Add Gemini key to .env
echo "GEMINI_API_KEY=AIzaYourActualKeyHere" >> .env
```

Or manually edit `.env` file and add:
```
GEMINI_API_KEY=AIzaYourActualKeyHere
```

### Step 3: Restart API Server (1 minute)

```bash
# Stop API server (Ctrl+C)

# Restart
pnpm dev:api
```

### Step 4: Test! (1 minute)

1. Go to `http://localhost:5173/` (or whatever port your web is on)
2. Login
3. Click **tile #8**: "AI Assistant 🤖"
4. Ask: **"मेरा क्रेडिट स्कोर क्या है?"** or **"What is my credit score?"**
5. 🎉 You should get a response!

## Voice Features 🎤

- **Click mic button** (🎤) to speak your question
- **AI responds with voice** automatically
- Works in **Hindi and English**

## Example Questions

### Hindi 🇮🇳
- "मेरा क्रेडिट स्कोर कैसे बढ़ेगा?"
- "मुझे कितना लोन मिल सकता है?"
- "SafeSend कैसे काम करता है?"
- "मेरे बच्चे की पढ़ाई के लिए कितना बचाना चाहिए?"

### English 🇬🇧
- "How can I improve my credit score?"
- "How much loan can I get?"
- "How does SafeSend work?"
- "How much should I save for my child's education?"

## Troubleshooting 🔧

### Error: "AI Assistant is not configured"
- ❌ Gemini key not set in `.env`
- ✅ Add `GEMINI_API_KEY` to `.env` file
- ✅ Restart API server

### Error: 503 Service Unavailable
- ❌ API key missing or invalid
- ✅ Verify key at https://makersuite.google.com/app/apikey
- ✅ Make sure it starts with `AIza`

### Error: 400 Bad Request
- ❌ Invalid API key
- ✅ Generate new key from Google AI Studio
- ✅ Check for typos in `.env`

## Cost Comparison 💰

| Provider | Cost | Free Tier |
|----------|------|-----------|
| **Gemini Pro** | **FREE** | **60 req/min, 1,500/day** |
| OpenAI GPT-4 | $0.03/1K tokens | $5 credit (expires) |
| OpenAI GPT-3.5 | $0.002/1K tokens | $5 credit (expires) |

**Gemini = Unlimited FREE usage for your MVP!** 🎉

## What's Different from OpenAI?

1. **API Package**: `@google/generative-ai` instead of `openai`
2. **Model**: `gemini-pro` instead of `gpt-4`
3. **API Key**: `GEMINI_API_KEY` instead of `OPENAI_API_KEY`
4. **Free!**: No credit card, no costs!

## Next Steps

After setup, you can:
- Test voice commands in Hindi and English
- Ask financial questions
- Get personalized advice based on your credit score
- Learn about loans, SafeSend, and more!

Need help? Check the full guide: `AI_ASSISTANT_GUIDE.md`

