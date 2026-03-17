# ForexProb — Market Probability Platform

A Bloomberg-style forex probability terminal built with React + Vite.

## Features

- **Live exchange rates** via ExchangeRate-API (free, no key needed)
- **8 currency pairs**: EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/JPY
- **Candlestick chart** with EMA 20 & EMA 50 overlays, 4 timeframes (1H / 4H / 1D / 1W)
- **6 technical indicators**: RSI, MACD, Bollinger Band Width, ATR, Stochastic %K, Trend
- **Directional probability engine** — weighted bull/bear score + confidence rating
- **Animated sentiment gauge** — needle rotates based on probability
- **Entry/exit signal cards** — long & short with TP, SL, R:R ratio
- **Correlation matrix** — 30-day correlation across 4 major pairs
- **Economic calendar** — upcoming high-impact events with color-coded severity
- **AI Market Analyst** — powered by Claude Sonnet, multi-turn conversation with memory
- **Live watchlist** — all pairs load in background with mini sparklines
- **Session badge** — Tokyo / London / New York / L-NY Overlap (UTC clock)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Vercel auto-detects Vite — just click **Deploy**
4. The `vercel.json` file handles routing and build settings automatically

No environment variables needed — the app uses public APIs only.

---

## Project Structure

```
forexprob/
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root component + data orchestration
    ├── styles/
    │   └── main.css          # All design tokens + styles
    ├── hooks/
    │   ├── useClock.js       # UTC clock + session detection
    │   └── useForex.js       # Main data, indicators, AI state
    ├── utils/
    │   ├── config.js         # Pair config, correlations, calendar events
    │   ├── indicators.js     # RSI, MACD, BB, ATR, Stochastic, trend, probability
    │   └── api.js            # fetchRate(), callClaude(), prompt builders
    └── components/
        ├── TopNav.jsx        # Pair tabs + clock + session
        ├── LeftSidebar.jsx   # Watchlist + gauge + calendar
        ├── CenterPanel.jsx   # Price hero + chart + indicators + prob bar
        ├── RightSidebar.jsx  # Wrapper for right column
        ├── PriceChart.jsx    # Chart.js candlestick + EMA overlays
        ├── SignalCards.jsx   # Long/short entry signal cards
        ├── CorrelationMatrix.jsx
        ├── AIPanel.jsx       # Claude chat with message history
        ├── SentimentGauge.jsx
        └── MiniSparkline.jsx
```

---

## Tech Stack

- **React 18** + **Vite 5**
- **Chart.js 4** — candlestick chart with EMA overlays
- **Claude Sonnet** (via Anthropic API) — AI analyst
- **ExchangeRate-API** — free live FX rates (no key required)
- **JetBrains Mono** + **Instrument Serif** + **DM Sans** — typography

---

Built by ForexProb · Powered by Claude
