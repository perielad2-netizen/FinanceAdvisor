# 🚀 Production Deployment Guide

## ✅ API Keys Required

Your Real-Time Trader Advisor requires the following API integrations:

### 🔑 **Required API Keys:**
- **OpenAI**: For news sentiment analysis with GPT-4o-mini
- **TwelveData**: Real-time stock prices and market data  
- **Finnhub**: Alternative stock data and financial news
- **Telegram**: Bot notifications (optional)

### 📊 **What Works with Real APIs:**
1. **Real Stock Prices**: Live market data from TwelveData/Finnhub
2. **AI News Analysis**: OpenAI processing financial news articles
3. **Fallback System**: TwelveData → Finnhub → Mock data for reliability
4. **News Sources**: Finnhub financial news → OpenAI sentiment analysis

## 🚀 **For Cloudflare Pages Production:**

### Step 1: Set Up Cloudflare API Token
```bash
# First, configure Cloudflare authentication
setup_cloudflare_api_key
```

### Step 2: Create Production Secrets
```bash
# Set all your API keys as Cloudflare secrets (secure)
npx wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted

npx wrangler secret put TWELVEDATA_API_KEY
# Enter your TwelveData API key when prompted

npx wrangler secret put FINNHUB_API_KEY  
# Enter your Finnhub API key when prompted

npx wrangler secret put TELEGRAM_BOT_TOKEN
# Enter your Telegram bot token when prompted (optional)

npx wrangler secret put TELEGRAM_CHAT_ID
# Enter your Telegram chat ID when prompted (optional)

npx wrangler secret put JWT_SECRET
# Enter your JWT secret when prompted
```

### Step 3: Create Production D1 Database
```bash
# Create production database
npx wrangler d1 create trader-advisor-production

# Copy the database_id from output and update wrangler.jsonc:
# "database_id": "your-actual-database-id-here"
```

### Step 4: Deploy to Production
```bash
# Run migrations on production database
npx wrangler d1 migrations apply trader-advisor-production

# Build and deploy to Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name trader-advisor
```

## 💰 **API Usage & Costs:**

### **OpenAI GPT-4o-mini**
- **Cost**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Usage**: News analysis (300 tokens per article)
- **Estimate**: ~$0.0003 per news article analyzed

### **TwelveData**
- **Free Tier**: 800 API calls/day
- **Usage**: Price quotes (1 call per price check)
- **Upgrade**: $8/month for 8,000 calls/day

### **Finnhub**
- **Free Tier**: 60 calls/minute
- **Usage**: News feed, alternative price data
- **Upgrade**: $25/month for unlimited

### **Telegram Bot**
- **Free**: Unlimited notifications
- **Usage**: Trading alerts to your chat (optional)

## 🔧 **Local Development:**

Create a `.dev.vars` file with your API keys for local development:

```
OPENAI_API_KEY=your_openai_key_here
TWELVEDATA_API_KEY=your_twelvedata_key_here
FINNHUB_API_KEY=your_finnhub_key_here
TELEGRAM_BOT_TOKEN=your_telegram_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
JWT_SECRET=your_jwt_secret_here
```

**To develop locally:**
```bash
# Install dependencies
npm install

# Build the app  
npm run build

# Start with PM2 (already configured)
pm2 start ecosystem.config.cjs

# Test endpoints
curl http://localhost:3000/api/market/price/AAPL  # Real prices
curl -X POST http://localhost:3000/api/news/analyze  # Real AI analysis
```

## 🔐 **Security Notes:**

- ✅ API keys should be in `.dev.vars` (gitignored)
- ✅ Production uses Cloudflare secrets (encrypted)
- ✅ No hardcoded keys in source code
- ✅ Fallback systems prevent failures

## 🎯 **Ready for Production:**

Your app has **complete real-world functionality**:
- Real stock prices and market data
- AI-powered news sentiment analysis  
- Telegram notifications ready
- Production-grade API integrations
- Comprehensive fallback systems

**Next step**: Deploy to Cloudflare Pages for global edge distribution! 🌍