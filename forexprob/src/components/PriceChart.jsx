import { useEffect, useRef, useState, useCallback } from 'react';
import { genOHLC } from '../utils/indicators.js';

function getSR(visible) {
  const highs = visible.map(b => b.h), lows = visible.map(b => b.l);
  const range = Math.max(...highs) - Math.min(...lows);
  const bucket = range / 10;
  const hb = {}, lb = {};
  highs.forEach(h => { const k = Math.round(h / bucket); hb[k] = (hb[k] || 0) + 1; });
  lows.forEach(l  => { const k = Math.round(l / bucket); lb[k] = (lb[k] || 0) + 1; });
  const last = visible[visible.length - 1].c;
  const res = Object.entries(hb).sort((a,b) => b[1]-a[1]).slice(0,2).map(([k]) => +k * bucket).filter(v => v > last);
  const sup = Object.entries(lb).sort((a,b) => b[1]-a[1]).slice(0,2).map(([k]) => +k * bucket).filter(v => v < last);
  return { res, sup };
}

function getSignals(visible) {
  const sigs = [];
  for (let i = 1; i < visible.length; i++) {
    const p = visible[i-1], c = visible[i];
    if (p.c < p.o && c.c > c.o && c.o < p.c && c.c > p.o) sigs.push({ i, type: 'buy' });
    if (p.c > p.o && c.c < c.o && c.o > p.c && c.c < p.o) sigs.push({ i, type: 'sell' });
    const body = Math.abs(c.c - c.o), wick = Math.min(c.c, c.o) - c.l;
    if (wick > body * 2.2 && c.c > c.o) sigs.push({ i, type: 'buy' });
  }
  return sigs.filter((s, idx, arr) => !arr.slice(0, idx).some(x => x.i === s.i && x.type === s.type));
}

function emaSeries(closes, period) {
  const k = 2 / (period + 1);
  let e = closes[0];
  return closes.map((v, i) => {
    if (i === 0) return null;
    e = v * k + e * (1 - k);
    return i < period - 1 ? null : e;
  });
}

export default function PriceChart({ history, pairKey, tf }) {
  const canvasRef = useRef(null);
  const ohlcRef   = useRef([]);
  const zoomRef   = useRef({ start: 0, end: 1 });
  const crossRef  = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const isJPY = pairKey?.includes('JPY');
  const dec   = isJPY ? 3 : 5;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ohlc = ohlcRef.current;
    if (!ohlc.length) return;

    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const PL = 8, PR = 74, PT = 16, PB = 28;
    const CW = W - PL - PR, CH = H - PT - PB;
    const { start, end } = zoomRef.current;
    const si = Math.floor(start * ohlc.length);
    const ei = Math.ceil(end * ohlc.length);
    const vis = ohlc.slice(si, ei);
    if (!vis.length) return;

    const minL = Math.min(...vis.map(b => b.l));
    const maxH = Math.max(...vis.map(b => b.h));
    const rng = maxH - minL || 0.001;
    const pad = rng * 0.1;
    const lo = minL - pad, hi = maxH + pad;

    const toX = i => PL + ((i - si) / Math.max(ei - si - 1, 1)) * CW;
    const toY = p => PT + (1 - (p - lo) / (hi - lo)) * CH;

    // Background grid
    for (let i = 0; i <= 5; i++) {
      const y = PT + (i / 5) * CH;
      ctx.strokeStyle = 'rgba(56,189,248,0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      const price = hi - (i / 5) * (hi - lo);
      ctx.fillStyle = '#2d4460';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(dec), W - PR + 6, y + 3);
    }

    // Vertical grid
    const step = Math.max(1, Math.floor(vis.length / 8));
    vis.forEach((_, i) => {
      if (i % step !== 0) return;
      const x = toX(si + i);
      ctx.strokeStyle = 'rgba(56,189,248,0.03)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + CH); ctx.stroke();
    });

    // Support & Resistance
    const { res, sup } = getSR(vis);
    [...sup.map(s => ({ v: s, type: 'sup' })), ...res.map(r => ({ v: r, type: 'res' }))].forEach(({ v, type }) => {
      const y = toY(v);
      if (y < PT || y > PT + CH) return;
      const color  = type === 'sup' ? 'rgba(0,217,126,0.4)' : 'rgba(255,77,77,0.4)';
      const lcolor = type === 'sup' ? 'rgba(0,217,126,0.8)' : 'rgba(255,77,77,0.8)';
      ctx.strokeStyle = color; ctx.lineWidth = 0.8;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = lcolor;
      ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left';
      ctx.fillText((type === 'sup' ? 'S ' : 'R ') + v.toFixed(dec), W - PR + 6, y - 2);
    });

    // EMA lines
    const closes = vis.map(b => b.c);
    const e20 = emaSeries(closes, 20);
    const e50 = emaSeries(closes, 50);
    [[e20, '#f0b429'], [e50, '#38bdf8']].forEach(([ser, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([]);
      let started = false;
      ctx.beginPath();
      ser.forEach((v, i) => {
        if (v === null) return;
        const x = toX(si + i), y = toY(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Candles
    const cw = Math.max(1.5, (CW / vis.length) * 0.65);
    vis.forEach((b, i) => {
      const x = toX(si + i);
      const isUp = b.c >= b.o;
      const col = isUp ? '#00d97e' : '#ff4d4d';
      const oy = toY(b.o), cy = toY(b.c), hy = toY(b.h), ly = toY(b.l);

      // Wick with glow
      ctx.shadowColor = col; ctx.shadowBlur = 2;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(x, Math.min(oy, cy)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, Math.max(oy, cy)); ctx.lineTo(x, ly); ctx.stroke();
      ctx.shadowBlur = 0;

      // Body
      const bh = Math.max(1.5, Math.abs(cy - oy));
      const by = Math.min(oy, cy);
      ctx.fillStyle = isUp ? 'rgba(0,217,126,0.7)' : 'rgba(255,77,77,0.7)';
      ctx.fillRect(x - cw / 2, by, cw, bh);
      ctx.strokeStyle = col; ctx.lineWidth = 0.8;
      ctx.strokeRect(x - cw / 2, by, cw, bh);
    });

    // Buy/sell signals
    getSignals(vis).forEach(sig => {
      const b = vis[sig.i];
      if (!b) return;
      const x = toX(si + sig.i);
      const isBuy = sig.type === 'buy';
      const col = isBuy ? '#00d97e' : '#ff4d4d';
      const y = isBuy ? toY(b.l) + 16 : toY(b.h) - 16;
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 6;
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(isBuy ? '▲' : '▼', x, y);
      ctx.shadowBlur = 0;
      ctx.font = '7px JetBrains Mono';
      ctx.fillText(isBuy ? 'BUY' : 'SELL', x, y + (isBuy ? 11 : -5));
    });

    // Current price line
    const last = ohlc[ohlc.length - 1].c;
    if (last >= lo && last <= hi) {
      const y = toY(last);
      ctx.strokeStyle = 'rgba(240,180,41,0.5)';
      ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f0b429';
      ctx.fillRect(W - PR + 2, y - 9, PR - 4, 18);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(last.toFixed(dec), W - PR + 2 + (PR - 4) / 2, y + 3);
    }

    // Crosshair
    const cross = crossRef.current;
    if (cross) {
      ctx.strokeStyle = 'rgba(56,189,248,0.25)';
      ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cross.x, PT); ctx.lineTo(cross.x, PT + CH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PL, cross.y); ctx.lineTo(W - PR, cross.y); ctx.stroke();
      ctx.setLineDash([]);
      const hp = lo + (1 - (cross.y - PT) / CH) * (hi - lo);
      ctx.fillStyle = 'rgba(8,12,20,0.92)';
      ctx.fillRect(W - PR + 2, cross.y - 9, PR - 4, 18);
      ctx.strokeStyle = 'rgba(56,189,248,0.2)';
      ctx.strokeRect(W - PR + 2, cross.y - 9, PR - 4, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(hp.toFixed(dec), W - PR + 2 + (PR - 4) / 2, cross.y + 3);
    }
  }, [dec]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // New data
  useEffect(() => {
    if (!history || history.length < 5) return;
    ohlcRef.current = genOHLC(history);
    zoomRef.current = { start: 0, end: 1 };
    draw();
  }, [history, pairKey, tf, draw]);

  // Wheel zoom — non-passive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = e => {
      e.preventDefault();
      const { start, end } = zoomRef.current;
      const span = end - start;
      const delta = e.deltaY > 0 ? 0.04 : -0.04;
      const newSpan = Math.max(0.1, Math.min(1, span + delta));
      const mid = (start + end) / 2;
      zoomRef.current = { start: Math.max(0, mid - newSpan/2), end: Math.min(1, mid + newSpan/2) };
      draw();
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [draw]);

  const getCanvasPos = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getBarAt = x => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const { start, end } = zoomRef.current;
    const si = Math.floor(start * ohlcRef.current.length);
    const ei = Math.ceil(end * ohlcRef.current.length);
    const ratio = (x - 8) / (canvas.width - 8 - 74);
    const idx = Math.round(si + ratio * (ei - si));
    return ohlcRef.current[Math.max(0, Math.min(ohlcRef.current.length - 1, idx))];
  };

  const handleMouseMove = e => {
    const pos = getCanvasPos(e);
    crossRef.current = pos;
    const bar = getBarAt(pos.x);
    setTooltip(bar ? { bar, x: pos.x, y: pos.y } : null);
    draw();
  };

  const handleMouseLeave = () => {
    crossRef.current = null;
    setTooltip(null);
    draw();
  };

  const zoomIn    = () => { const { start, end } = zoomRef.current; const m=(start+end)/2, s=(end-start)*.7; zoomRef.current={start:Math.max(0,m-s/2),end:Math.min(1,m+s/2)}; draw(); };
  const zoomOut   = () => { const { start, end } = zoomRef.current; const m=(start+end)/2, s=Math.min(1,(end-start)*1.4); zoomRef.current={start:Math.max(0,m-s/2),end:Math.min(1,m+s/2)}; draw(); };
  const zoomReset = () => { zoomRef.current = { start: 0, end: 1 }; draw(); };

  return (
    <div className="chart-area" style={{ position: 'relative', cursor: 'crosshair', background: '#080c14' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 8, right: 82, display: 'flex', gap: 4 }}>
        {[['−', zoomOut], ['+', zoomIn], ['⊡', zoomReset]].map(([label, fn]) => (
          <button key={label} onClick={fn} style={{
            width: 26, height: 26,
            background: 'rgba(8,12,20,0.9)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: 5, color: '#5c7a9a',
            fontFamily: 'var(--mono)', fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {/* OHLC Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x > (canvasRef.current?.width ?? 0) / 2 ? tooltip.x - 172 : tooltip.x + 14,
          top: Math.max(10, tooltip.y - 100),
          background: 'rgba(8,12,20,0.95)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 8, padding: '10px 14px',
          pointerEvents: 'none', zIndex: 10, minWidth: 155,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingBottom:6, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5c7a9a', letterSpacing:'.06em' }}>OHLC</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color: tooltip.bar.c >= tooltip.bar.o ? '#00d97e' : '#ff4d4d' }}>
              {tooltip.bar.c >= tooltip.bar.o ? '▲ Bullish' : '▼ Bearish'}
            </span>
          </div>
          {[['Open', tooltip.bar.o, '#e2eaf5'], ['High', tooltip.bar.h, '#00d97e'], ['Low', tooltip.bar.l, '#ff4d4d'], ['Close', tooltip.bar.c, tooltip.bar.c >= tooltip.bar.o ? '#00d97e' : '#ff4d4d']].map(([label, val, color]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:20, marginBottom:3 }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#2d4460' }}>{label}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:9, color, fontWeight:600 }}>{val?.toFixed(dec)}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', gap:20, marginTop:6, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#2d4460' }}>Range</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#f0b429', fontWeight:600 }}>{(tooltip.bar.h - tooltip.bar.l).toFixed(dec)}</span>
          </div>
        </div>
      )}

      {/* Bottom legend */}
      <div style={{
        position: 'absolute', bottom: 6, left: 10,
        display: 'flex', gap: 12, fontSize: 9,
        fontFamily: 'var(--mono)', color: '#2d4460', pointerEvents: 'none',
      }}>
        <span><span style={{ color:'#00d97e' }}>▲</span> Buy</span>
        <span><span style={{ color:'#ff4d4d' }}>▼</span> Sell</span>
        <span style={{ color:'rgba(0,217,126,.5)' }}>─ ─ Support</span>
        <span style={{ color:'rgba(255,77,77,.5)' }}>─ ─ Resistance</span>
        <span>scroll to zoom</span>
      </div>
    </div>
  );
}
