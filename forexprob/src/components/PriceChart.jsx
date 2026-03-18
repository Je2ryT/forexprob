import { useEffect, useRef, useState, useCallback } from 'react';
import { genOHLC } from '../utils/indicators.js';

function computeSupportResistance(ohlc, levels = 3) {
  if (ohlc.length < 10) return { supports: [], resistances: [] };
  const highs = ohlc.map(b => b.h);
  const lows  = ohlc.map(b => b.l);
  const range = Math.max(...highs) - Math.min(...lows);
  const bucket = range / 12;

  const hBuckets = {}, lBuckets = {};
  highs.forEach(h => { const k = Math.round(h / bucket); hBuckets[k] = (hBuckets[k] || 0) + 1; });
  lows.forEach(l  => { const k = Math.round(l / bucket); lBuckets[k] = (lBuckets[k] || 0) + 1; });

  const topH = Object.entries(hBuckets).sort((a,b) => b[1]-a[1]).slice(0, levels).map(([k]) => +k * bucket);
  const topL = Object.entries(lBuckets).sort((a,b) => b[1]-a[1]).slice(0, levels).map(([k]) => +k * bucket);

  const last = ohlc[ohlc.length - 1].c;
  return {
    resistances: topH.filter(v => v > last).slice(0, levels),
    supports:    topL.filter(v => v < last).slice(0, levels),
  };
}

function computeSignals(ohlc) {
  const signals = [];
  for (let i = 2; i < ohlc.length; i++) {
    const prev = ohlc[i-1], cur = ohlc[i];
    // Bullish engulfing
    if (prev.c < prev.o && cur.c > cur.o && cur.o < prev.c && cur.c > prev.o) {
      signals.push({ idx: i, type: 'buy', price: cur.l });
    }
    // Bearish engulfing
    if (prev.c > prev.o && cur.c < cur.o && cur.o > prev.c && cur.c < prev.o) {
      signals.push({ idx: i, type: 'sell', price: cur.h });
    }
    // Hammer (bullish)
    const bodySize = Math.abs(cur.c - cur.o);
    const lowerWick = Math.min(cur.c, cur.o) - cur.l;
    if (lowerWick > bodySize * 2 && cur.c > cur.o) {
      signals.push({ idx: i, type: 'buy', price: cur.l });
    }
  }
  return signals.filter((s, i, arr) =>
    !arr.slice(0, i).some(p => p.idx === s.idx && p.type === s.type)
  );
}

export default function PriceChart({ history, pairKey, tf }) {
  const canvasRef  = useRef(null);
  const ohlcRef    = useRef([]);
  const zoomRef    = useRef({ start: 0, end: 1 });
  const [tooltip, setTooltip] = useState(null);
  const [crosshair, setCrosshair] = useState(null);

  const isJPY = pairKey?.includes('JPY');
  const dec   = isJPY ? 3 : 5;

  const draw = useCallback((cross) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ohlc = ohlcRef.current;
    if (!ohlc.length) return;

    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const PAD_L = 8, PAD_R = 72, PAD_T = 20, PAD_B = 32;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const { start, end } = zoomRef.current;
    const startIdx = Math.floor(start * ohlc.length);
    const endIdx   = Math.ceil(end * ohlc.length);
    const visible  = ohlc.slice(startIdx, endIdx);
    if (!visible.length) return;

    const minL = Math.min(...visible.map(b => b.l));
    const maxH = Math.max(...visible.map(b => b.h));
    const priceRange = maxH - minL || 0.001;
    const pad = priceRange * 0.08;
    const lo = minL - pad, hi = maxH + pad;

    const toX = (i) => PAD_L + ((i - startIdx) / Math.max(endIdx - startIdx - 1, 1)) * chartW;
    const toY = (p) => PAD_T + (1 - (p - lo) / (hi - lo)) * chartH;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      const price = hi - (i / 4) * (hi - lo);
      ctx.fillStyle = '#4a4845';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(dec), W - PAD_R + 6, y + 4);
    }

    // Support & Resistance
    const { supports, resistances } = computeSupportResistance(visible);
    supports.forEach(s => {
      const y = toY(s);
      ctx.strokeStyle = 'rgba(34,199,122,0.5)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(34,199,122,0.8)';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('S ' + s.toFixed(dec), W - PAD_R + 6, y - 2);
    });
    resistances.forEach(r => {
      const y = toY(r);
      ctx.strokeStyle = 'rgba(245,71,58,0.5)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(245,71,58,0.8)';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('R ' + r.toFixed(dec), W - PAD_R + 6, y - 2);
    });

    // Candles
    const candleW = Math.max(1, (chartW / visible.length) * 0.6);
    visible.forEach((b, i) => {
      const x     = toX(startIdx + i);
      const isUp  = b.c >= b.o;
      const color = isUp ? '#22c77a' : '#f5473a';
      const openY = toY(b.o), closeY = toY(b.c);
      const highY = toY(b.h), lowY   = toY(b.l);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, Math.min(openY, closeY));
      ctx.moveTo(x, Math.max(openY, closeY));
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyH = Math.max(1, Math.abs(closeY - openY));
      ctx.fillStyle = isUp ? 'rgba(34,199,122,0.75)' : 'rgba(245,71,58,0.75)';
      ctx.fillRect(x - candleW / 2, Math.min(openY, closeY), candleW, bodyH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x - candleW / 2, Math.min(openY, closeY), candleW, bodyH);
    });

    // Buy/sell signals
    const signals = computeSignals(visible);
    signals.forEach(sig => {
      const b = visible[sig.idx - startIdx];
      if (!b) return;
      const x = toX(startIdx + sig.idx - startIdx);
      const isBuy = sig.type === 'buy';
      const y = isBuy ? toY(b.l) + 14 : toY(b.h) - 14;
      ctx.fillStyle = isBuy ? '#22c77a' : '#f5473a';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(isBuy ? '▲' : '▼', x, y);
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(isBuy ? 'BUY' : 'SELL', x, y + (isBuy ? 10 : -4));
    });

    // Current price line
    const lastPrice = ohlc[ohlc.length - 1].c;
    if (lastPrice >= lo && lastPrice <= hi) {
      const y = toY(lastPrice);
      ctx.strokeStyle = 'rgba(232,169,60,0.6)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e8a93c';
      ctx.fillRect(W - PAD_R + 2, y - 8, PAD_R - 4, 16);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(lastPrice.toFixed(dec), W - PAD_R + 2 + (PAD_R - 4) / 2, y + 3);
    }

    // Crosshair
    if (cross) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cross.x, PAD_T); ctx.lineTo(cross.x, PAD_T + chartH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD_L, cross.y); ctx.lineTo(W - PAD_R, cross.y); ctx.stroke();
      ctx.setLineDash([]);
      const hoverPrice = lo + (1 - (cross
