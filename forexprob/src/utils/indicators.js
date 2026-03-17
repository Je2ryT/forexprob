/** Generate synthetic price history around a base price */
export function genHistory(basePrice, n = 80, tf = '1H', isJPY = false) {
  const vols = { '1H': 0.00006, '4H': 0.00015, '1D': 0.0004, '1W': 0.0012 };
  const vol = (isJPY ? 10 : 1) * (vols[tf] || 0.00006);
  const trend = (Math.random() - 0.48) * 0.0001 * (isJPY ? 100 : 1);
  let p = basePrice * 0.997;
  const arr = [];
  for (let i = 0; i < n; i++) {
    p = p * (1 + (Math.random() - 0.5) * vol * 2) + trend;
    arr.push(+(p.toFixed(isJPY ? 3 : 5)));
  }
  arr.push(basePrice);
  return arr;
}

/** Build OHLC bars from flat price array (4 prices per bar) */
export function genOHLC(history) {
  const bars = [];
  for (let i = 4; i < history.length; i += 4) {
    const chunk = history.slice(i - 4, i + 1);
    bars.push({
      o: chunk[0],
      h: Math.max(...chunk),
      l: Math.min(...chunk),
      c: chunk[chunk.length - 1],
    });
  }
  return bars;
}

/** RSI (Wilder) */
export function rsi(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    d > 0 ? (gains += d) : (losses += Math.abs(d));
  }
  if (!losses) return 100;
  return 100 - 100 / (1 + gains / losses);
}

/** EMA */
export function ema(arr, period) {
  const k = 2 / (period + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

/** MACD line (12 - 26 EMA) */
export function macd(prices) {
  if (prices.length < 26) return { val: 0, sig: 'Neutral' };
  const line = ema(prices.slice(-26), 12) - ema(prices.slice(-26), 26);
  return { val: line, sig: line > 0 ? 'Bullish' : 'Bearish' };
}

/** Bollinger Bands */
export function bb(prices, period = 20) {
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  return { upper: mean + 2 * std, lower: mean - 2 * std, width: (4 * std / mean) * 100 };
}

/** ATR */
export function atr(ohlc, period = 14) {
  if (ohlc.length < 2) return 0;
  const trs = ohlc.slice(-period).map((b, i, a) => {
    if (!i) return b.h - b.l;
    return Math.max(b.h - b.l, Math.abs(b.h - a[i - 1].c), Math.abs(b.l - a[i - 1].c));
  });
  return trs.reduce((a, b) => a + b, 0) / trs.length;
}

/** Stochastic %K */
export function stoch(prices, period = 14) {
  const slice = prices.slice(-period);
  const hi = Math.max(...slice), lo = Math.min(...slice);
  if (hi === lo) return 50;
  return ((prices[prices.length - 1] - lo) / (hi - lo)) * 100;
}

/** Simple trend via slope of two halves */
export function trendDir(prices) {
  const n = Math.min(24, prices.length);
  const s = prices.slice(-n);
  const half = Math.floor(n / 2);
  const avg1 = s.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const avg2 = s.slice(half).reduce((a, b) => a + b, 0) / (n - half);
  const slope = ((avg2 - avg1) / avg1) * 100;
  return {
    slope,
    label: slope > 0.008 ? 'Uptrend' : slope < -0.008 ? 'Downtrend' : 'Sideways',
  };
}

/** Weighted probability from all indicators */
export function computeProb(rsiV, macdD, trendD, stochV) {
  let s = 0;
  if (rsiV < 30)      s += 35;
  else if (rsiV < 45) s += 15;
  else if (rsiV > 70) s -= 35;
  else if (rsiV > 55) s -= 15;

  s += macdD.sig === 'Bullish' ? 28 : -28;

  if (trendD.label === 'Uptrend')   s += 30;
  else if (trendD.label === 'Downtrend') s -= 30;

  if (stochV < 20)      s += 15;
  else if (stochV > 80) s -= 15;

  const bull = Math.round(Math.max(10, Math.min(90, 50 + s / 2)));
  const conf = Math.min(95, 55 + Math.abs(s) / 4);
  return { bull, bear: 100 - bull, score: Math.round(s), conf: Math.round(conf) };
}

/** EMA series for chart overlay */
export function emaSeries(closes, period) {
  return closes.map((_, i) =>
    i < period - 1 ? null : ema(closes.slice(0, i + 1), period)
  );
}
