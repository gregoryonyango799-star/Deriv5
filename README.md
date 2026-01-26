# 🚀 AITE - Adaptive Intelligence Trading Ecosystem

AI-powered trading platform with neural analysis, automated bots, and real-time market intelligence.

## ✨ Features

- 🤖 **AI Trading Bots** - Multiple automated strategies with technical analysis
- 📊 **Live Charts** - Real-time market data with TradingView-style charts
- 🧠 **Neural Analysis** - AI-powered market predictions using Google Gemini
- 📱 **Mobile Responsive** - Optimized for all devices
- 🎯 **Risk Management** - Stop loss, take profit, martingale strategies
- 📈 **Position Tracking** - Real-time P&L and open positions
- 🌐 **Multi-Symbol** - Trade Forex, Volatility Indices, Crash/Boom

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Deriv API Key (get from https://app.deriv.com/account/api-token)
- Google Gemini API Key (get from https://makersuite.google.com/app/apikey)

### Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys in `constants.tsx`:**
   ```typescript
   derivApiKey: 'YOUR_DERIV_API_KEY',
   geminiApiKey: 'YOUR_GEMINI_API_KEY'
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:5173**

## 🌐 Deploy to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deploy
```bash
npm i -g vercel
vercel login
vercel --prod
```

The app will be live at: `https://your-project.vercel.app`

### Vercel Configuration
Already configured in `vercel.json`:
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite (auto-detected)

## 📱 Mobile Optimization

✅ Fully responsive design
✅ Touch-optimized controls (44px minimum touch targets)
✅ Bottom navigation on mobile devices
✅ Safe area insets for notched phones
✅ PWA support (install as app)
✅ Optimized performance
✅ Works on iOS, Android, tablets, desktop

## 🤖 Bot Features

- Configure multiple bots with different strategies
- Trade different symbols simultaneously
- AI-powered market analysis (RSI, MACD, Bollinger Bands, etc.)
- Automatic position tracking and closing
- Martingale support with risk management
- Persistent configuration across sessions

## 📊 Supported Markets

- **Volatility Indices**: R_10, R_25, R_50, R_75, R_100, 1HZ variants
- **Forex**: EUR/USD, GBP/USD, USD/JPY, AUD/USD, EUR/GBP
- **Crash/Boom**: CRASH300N, CRASH500N, BOOM300N, etc.

## 🛠️ Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Lightweight Charts (TradingView)
- Deriv WebSocket API
- Google Gemini AI

## 📦 Build for Production

```bash
npm run build
```

Output in `dist/` folder ready for deployment.

## 🔧 Project Structure

```
├── components/          # React components
│   ├── Dashboard.tsx    # Main trading terminal
│   ├── BotManagement.tsx # Bot configuration
│   ├── Positions.tsx    # Position tracking
│   └── ...
├── services/
│   ├── derivService.ts  # Deriv API integration
│   └── geminiService.ts # AI analysis
├── public/             # Static assets
│   └── manifest.json   # PWA manifest
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies
```

## ⚠️ Disclaimer

This is a trading application. Trading involves risk. Only trade with money you can afford to lose. This software is provided "as is" without warranty of any kind.

## 📄 License

MIT License - See LICENSE file for details

---

**Made with ⚡ by AITE Core Systems**
