# CLAUDE.md — ForexProb Codebase Guide

This file provides context for AI assistants working on the ForexProb codebase.

---

## Project Overview

ForexProb is a **client-side forex trading platform** built with React 18 and Vite. It provides real-time price tracking, technical analysis, directional probability scoring, and AI-powered market commentary via Claude Sonnet. There is no backend — all logic runs in the browser.

**Live deployment:** Vercel (SPA with client-side routing)

---

## Repository Structure

```
forexprob/                   ← npm project root (run commands from here)
├── index.html               ← HTML shell (fonts, #root element)
├── package.json
├── vite.config.js
├── vercel.json              ← Vercel deployment config
├── README.md
└── src/
    ├── main.jsx             ← React entry point (renders App into #root)
    ├── App.jsx              ← Root component: layout, theme, keyboard shortcuts
    ├── hooks/
    │   ├── useForex.js      ← Core state: pairs, prices, indicators, AI chat
    │   └── useClock.js      ← UTC clock + trading session detection
    ├── utils/
    │   ├── config.js        ← Pair configs, correlations, economic calendar
    │   ├── indicators.js    ← Technical analysis (RSI, MACD, BB, ATR, Stoch)
    │   └── api.js           ← Price fetching + Claude API calls
    ├── components/
    │   ├── TopNav.jsx
    │   ├── TickerTape.jsx
    │   ├── LeftSidebar.jsx
    │   ├── CenterPanel.jsx
    │   ├── RightSidebar.jsx
    │   ├── PriceChart.jsx   ← Candlestick chart (Chart.js + Canvas)
    │   ├── SignalCards.jsx
    │   ├── CorrelationMatrix.jsx
    │   ├── AIPanel.jsx      ← Claude chat interface
    │   ├── SentimentGauge.jsx
    │   ├── MiniSparkline.jsx
    │   └── OHLCPopup.jsx
    └── styles/
        └── main.css         ← Complete design system (496 lines, CSS variables)
```

**All development work happens inside `forexprob/`.** The repo root only contains this CLAUDE.md and git config.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18.2.0 (functional components + hooks) |
| Build Tool | Vite 5.0.8 |
| Charts | Chart.js 4.4.1 (candlesticks) |
| AI | Claude Sonnet (`claude-sonnet-4-6`) via browser-direct API |
| Forex Data | TwelveData API (optional) → ExchangeRate-API (fallback) → synthetic |
| Styling | Plain CSS with CSS custom properties |
| Language | JavaScript (ESM modules, no TypeScript) |
| Deployment | Vercel |

---

## Development Workflow

```bash
# All commands run from forexprob/ directory
cd forexprob

npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:5173 (HMR enabled)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

**No tests exist.** There is no Jest, Vitest, or any test runner configured. Development relies on Vite HMR for rapid iteration.

---

## Environment Variables

Set in `forexprob/.env` (not committed):

```
VITE_ANTHROPIC_KEY=sk-ant-...   # Required — Claude AI integration
VITE_TWELVE_KEY=...             # Optional — TwelveData real-time candles
```

- If `VITE_ANTHROPIC_KEY` is missing, the AI panel will fail silently.
- If `VITE_TWELVE_KEY` is absent, the app falls back to ExchangeRate-API for live prices and generates synthetic OHLC candles.
- The Claude API call uses the special header `anthropic-dangerous-direct-browser-access: true` to allow browser-side CORS.

---

## Core Data Flow

```
App.jsx
  └── useForex()                    ← all data + AI state
        ├── loadPair(pair, tf)       ← fetch candles → calc indicators → trigger AI
        ├── tickPrice(pair)          ← refresh price every 15s
        ├── selectPair(pair)         ← switch pair, clear AI messages
        ├── changeTf(tf)             ← switch timeframe
        └── askAI(question)          ← send to Claude, stream response
```

Data flows top-down via props. No Context API or state management library is used. Refs (`useRef`) are used for mutable non-render data: AI conversation history, animation flags, canvas references.

---

## Currency Pairs

8 major pairs configured in `src/utils/config.js`:

`EURUSD`, `GBPUSD`, `USDJPY`, `AUDUSD`, `USDCAD`, `USDCHF`, `NZDUSD`, `EURJPY`

Each pair config includes: `label`, `base`, `quote`, `dec` (decimal places), `pip` value, and `full` name.

**Keyboard shortcuts for pair selection:** `e` (EUR/USD), `g` (GBP/USD), `j` (USD/JPY), `a` (AUD/USD), `c` (USD/CAD), `f` (USD/CHF), `n` (NZD/USD), `r` (EUR/JPY). Press `d` to toggle dark/light theme.

---

## Technical Indicators

All calculated in `src/utils/indicators.js` as pure functions operating on 80-candle price history:

| Indicator | Parameters |
|-----------|-----------|
| RSI | 14-period Wilder's |
| MACD | 12/26 EMA + signal line |
| Bollinger Bands | 20-period, ±2σ |
| ATR | 14-period Average True Range |
| Stochastic %K | (Close - Low) / (High - Low) * 100 |
| Trend Direction | Slope of two price half-means |

**Probability Score** (`prob` field in analysis): Weighted combination of RSI (±35/15pts), MACD (±28pts), Trend (±30pts), Stochastic (±15pts). Outputs `bull`/`bear` percentages and a confidence value (0–95%).

---

## Claude AI Integration

Located in `src/utils/api.js`:

- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 1024 per response
- **Streaming:** Uses `getReader()` + `TextDecoder()` on SSE stream, parsing `text_delta` events
- **Context window:** Last 12 messages retained in `aiHistoryRef` (ref, not state, so it persists across pair switches)
- **System prompt:** Positions Claude as a forex market analyst with current pair data, all 6 indicators, probability score, and session context injected into the initial message

When adding new analysis data, update the system prompt construction in `useForex.js` `loadPair()` and the `askAI()` function.

---

## Styling Conventions

- **CSS custom properties** are the design token system. All colors, spacing, and typography reference variables defined at `:root` and overridden for light mode.
- Key variables: `--bg`, `--bg2`, `--bg3`, `--t1`, `--t2`, `--t3`, `--acc` (accent), `--up` (green), `--dn` (red), `--bd` (border).
- **No CSS-in-JS.** Styles live in `src/styles/main.css` (global) or inline `style={{}}` objects in JSX for dynamic values.
- Layout: 3-column flex — `260px` left sidebar, `flex: 1` center, `280px` right sidebar.
- Animations defined in CSS: `fadein`, `dotbounce`, `pulse`, `tickerScroll`.
- Class naming is BEM-inspired: `.sig-card`, `.wl-item`, `.ai-msg-bubble`, `.section-head`.

---

## Synthetic Data

When real API data is unavailable, the app generates data locally:

- **Prices:** Random walk: `price * (1 + (Math.random() - 0.5) * volatility * 2) + trend`
- **OHLC:** Each candle derived from a 4-sample chunk of the price walk (open = first, high = max, low = min, close = last)
- **Volatility:** Per-timeframe constants in `config.js` `TF_VOLS` (`1H: 0.00006`, `4H: 0.00015`, `1D: 0.0004`, `1W: 0.0012`)

---

## Key Conventions

1. **Functional components only** — no class components.
2. **`useCallback` for all handler functions** passed as props to prevent unnecessary re-renders.
3. **`useRef` for non-UI state** (AI conversation history, tick timer, analyzing flag).
4. **Error handling is silent** — all API failures fall back gracefully (synthetic data, no error UI). Use `console.error` in catch blocks.
5. **ESLint disable comments** are acceptable for intentional hook dependency omissions.
6. **No TypeScript** — plain `.js`/`.jsx` throughout.
7. **Staggered loading** — pairs are loaded with 200–300ms delays to avoid API rate limits.
8. **JPY pairs** use `dec: 3` and `pip: 0.01`; all others use `dec: 5` and `pip: 0.0001`. The `pipMul` in analysis output reflects this (`100` for JPY, `10000` for others).

---

## Deployment

Vercel reads `forexprob/vercel.json`:
- Build: `npm install && npm run build`
- Output: `dist/`
- All routes rewrite to `index.html` (SPA)

Set `VITE_ANTHROPIC_KEY` (and optionally `VITE_TWELVE_KEY`) in Vercel's environment variable settings before deploying.

---

## What Does Not Exist

- No backend / server
- No database
- No authentication
- No tests
- No TypeScript
- No Redux / Zustand / Context API
- No Docker / CI-CD pipelines
- No WebSocket (prices polled via `setInterval`)
