import { useState } from 'react';
import PriceChart from './PriceChart.jsx';
import { PAIRS } from '../utils/config.js';

const IND_EXPLANATIONS = {
  rsi:   { name: 'RSI (Relative Strength Index)', desc: 'Measures momentum on a 0–100 scale. Below 30 = oversold (potential buy), above 70 = overbought (potential sell). Most reliable when diverging from price.' },
  macd:  { name: 'MACD', desc: 'Moving Average Convergence Divergence. Bullish when the MACD line crosses above the signal line. One of the most widely followed trend-following indicators.' },
  bb:    { name: 'Bollinger Band Width', desc: 'Measures market volatility. Wide bands = high volatility, narrow bands = low volatility (squeeze). A squeeze often precedes a big breakout move.' },
  atr:   { name: 'ATR (Average True Range)', desc: 'Measures how many pips the pair moves on average. Useful for setting stop losses and take profits — wider stops in high ATR environments.' },
  stoch: { name: 'Stochastic %K', desc: 'Compares closing price to the recent range. Below 20 = oversold, above 80 = overbought. Works best in ranging markets, less reliable in strong trends.' },
  trend: { name: 'Trend Direction', desc: 'Calculated from the slope of two price halves over the last 24 bars. Uptrend/Downtrend signals directional bias. Sideways means price is consolidating.' },
};

const IND_CELLS = [
  { key: 'rsi',   label: 'RSI (14)' },
  { key: 'macd',  label: 'MACD'     },
  { key: 'bb',    label: 'BB Width' },
  { key: 'atr',   label: 'ATR (14)' },
  { key: 'stoch', label: 'Stoch %K' },
  { key: 'trend', label: 'Trend'    },
];

function indProps(analysis) {
  if (!analysis) return {};
  const { rsiV, macdD, bbD, atrV, stochV, trendD, pipMul } = analysis;
  return {
    rsi:   { val: rsiV.toFixed(1),                   sig: rsiV < 30 ? 'Oversold' : rsiV > 70 ? 'Overbought' : 'Neutral',                                    type: rsiV < 30 ? 'b' : rsiV > 70 ? 's' : 'n' },
    macd:  { val: macdD.sig,                          sig: macdD.sig === 'Bullish' ? 'Buy Signal' : 'Sell Signal',                                            type: macdD.sig === 'Bullish' ? 'b' : 's' },
    bb:    { val: bbD.width.toFixed(2) + '%',         sig: bbD.width > 0.3 ? 'High Vol' : 'Low Vol',                                                          type: bbD.width > 0.3 ? 's' : 'n' },
    atr:   { val: (atrV * pipMul).toFixed(1) + ' p', sig: atrV * pipMul > 30 ? 'Volatile' : 'Stable',                                                        type: atrV * pipMul > 30 ? 's' : 'n' },
    stoch: { val: stochV.toFixed(1),                  sig: stochV < 20 ? 'Oversold' : stochV > 80 ? 'Overbought' : 'Neutral',                                 type: stochV < 20 ? 'b' : stochV > 80 ? 's' : 'n' },
    trend: { val: trendD.label,                       sig: trendD.label === 'Uptrend' ? 'Bullish' : trendD.label === 'Downtrend' ? 'Bearish' : 'Watch',        type: trendD.label === 'Uptrend' ? 'b' : trendD.label === 'Downtrend' ? 's' : 'n' },
  };
}

export default function CenterPanel({ currentPair, pairData, analysis, tf, onTfChange, isDark, onToggleTheme }) {
  const [activeInd, setActiveInd] = useState(null);

  const cfg  = PAIRS[currentPair];
  const pd   = pairData[currentPair];
  const dec  = cfg?.dec ?? 5;
  const inds = indProps(analysis);
  const prob = analysis?.prob;

  const priceColor = pd ? (pd.isUp ? '#22c77a' : '#f5473a') : 'var(--t1)';
  const sigClass = t => t === 'b' ? 'sig-b' : t === 's' ? 'sig-s' : 'sig-n';

  return (
    <div className="center">
      {/* Price hero */}
      <div className="price-hero">
        <div className="price-left">
          <div className="pair-headline">{cfg?.full ?? '–'}</div>
          <div className="price-big price-flash" key={pd?.price} style={{ color: priceColor }}>
            {pd ? pd.price.toFixed(dec) : '—'}
          </div>
          <div className="price-meta">
            <span className="pm-item">
              <span className="pm-label">CHG</span>
              <span style={{ color: priceColor }}>
                {pd ? `${pd.isUp ? '+' : ''}${pd.change.toFixed(dec)} (${pd.isUp ? '+' : ''}${pd.changePct.toFixed(3)}%)` : '–'}
              </span>
            </span>
            <span className="pm-item"><span className="pm-label">HI</span>{analysis ? analysis.hi.toFixed(dec) : '–'}</span>
            <span className="pm-item"><span className="pm-label">LO</span>{analysis ? analysis.lo.toFixed(dec) : '–'}</span>
            <span className="pm-item"><span className="pm-label">SPREAD</span>{analysis ? `${analysis.spread} pip` : '–'}</span>
            <span className="pm-item"><span className="pm-label">VOL</span>{analysis ? `${analysis.vol}%` : '–'}</span>
          </div>
        </div>

        <div className="price-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'var(--bg4)', border: '1px solid var(--border2)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                fontSize: 13, lineHeight: 1, color: 'var(--t2)', transition: 'all .15s',
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="tf-tabs">
              {['1H', '4H', '1D', '1W'].map(t => (
                <button key={t} className={`tf-tab${tf === t ? ' active' : ''}`} onClick={() => onTfChange(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)' }}>
            <span style={{ width: 12, height: 2, background: '#e8a93c', display: 'inline-block', borderRadius: 1 }} /> EMA20
            <span style={{ width: 12, height: 2, background: '#4d9cf8', display: 'inline-block', borderRadius: 1 }} /> EMA50
          </div>
        </div>
      </div>

      {/* Chart */}
      <PriceChart history={pd?.history} pairKey={currentPair} tf={tf} />

      {/* Indicator explanation */}
      {activeInd && IND_EXPLANATIONS[activeInd] && (
        <div style={{
          margin: '0 12px', padding: '10px 14px',
          background: 'var(--bg4)', border: '1px solid var(--accbdr)',
          borderRadius: 8, animation: 'fadein 0.2s ease', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--acc)', fontWeight: 600 }}>
              {IND_EXPLANATIONS[activeInd].name}
            </span>
            <button onClick={() => setActiveInd(null)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
            {IND_EXPLANATIONS[activeInd].desc}
          </p>
        </div>
      )}

      {/* Indicator row */}
      <div className="ind-row">
        {IND_CELLS.map(({ key, label }) => {
          const d = inds[key];
          const isActive = activeInd === key;
          return (
            <div
              key={key}
              className="ind-cell"
              onClick={() => setActiveInd(activeInd === key ? null : key)}
              style={{ cursor: 'pointer', background: isActive ? 'var(--bg4)' : 'transparent', transition: 'background .15s' }}
            >
              <div className="ind-name" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {label} <span style={{ color: 'var(--t4)', fontSize: 9 }}>?</span>
              </div>
              <div className="ind-val">{d?.val ?? '—'}</div>
              {d && <div className={`ind-sig ${sigClass(d.type)}`}>{d.sig}</div>}
            </div>
          );
        })}
      </div>

      {/* Probability banner */}
      <div className="prob-banner">
        <div className="prob-label">Probability</div>
        <div className="prob-track">
          <div className="prob-fill-b" style={{ width: `${prob?.bull ?? 50}%` }} />
          <div className="prob-fill-s" style={{ width: `${prob?.bear ?? 50}%` }} />
          <div className="prob-inner">
            <span className="prob-num-b">{prob ? `${prob.bull}% Bull` : '—'}</span>
            <span className="prob-mid">BULL ⟷ BEAR</span>
            <span className="prob-num-s">{prob ? `${prob.bear}% Bear` : '—'}</span>
          </div>
        </div>
        <div className="prob-score-box">
          <div className="psb-label">Score</div>
          <div className="psb-val" style={{ color: prob ? (prob.score > 0 ? '#22c77a' : prob.score < 0 ? '#f5473a' : '#e8a93c') : 'var(--t2)' }}>
            {prob ? `${prob.score > 0 ? '+' : ''}${prob.score}` : '—'}
          </div>
        </div>
        <div className="prob-score-box">
          <div className="psb-label">Conf</div>
          <div className="psb-val">{prob ? `${prob.conf}%` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
