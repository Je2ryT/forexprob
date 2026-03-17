import PriceChart from './PriceChart.jsx';
import { PAIRS } from '../utils/config.js';

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
    rsi:   { val: rsiV.toFixed(1),                   sig: rsiV < 30 ? 'Oversold'   : rsiV > 70 ? 'Overbought' : 'Neutral',    type: rsiV < 30 ? 'b' : rsiV > 70 ? 's' : 'n' },
    macd:  { val: macdD.sig,                          sig: macdD.sig === 'Bullish' ? 'Buy Signal' : 'Sell Signal',              type: macdD.sig === 'Bullish' ? 'b' : 's' },
    bb:    { val: bbD.width.toFixed(2) + '%',         sig: bbD.width > 0.3 ? 'High Vol' : 'Low Vol',                           type: bbD.width > 0.3 ? 's' : 'n' },
    atr:   { val: (atrV * pipMul).toFixed(1) + ' p', sig: atrV * pipMul > 30 ? 'Volatile' : 'Stable',                         type: atrV * pipMul > 30 ? 's' : 'n' },
    stoch: { val: stochV.toFixed(1),                  sig: stochV < 20 ? 'Oversold' : stochV > 80 ? 'Overbought' : 'Neutral',  type: stochV < 20 ? 'b' : stochV > 80 ? 's' : 'n' },
    trend: { val: trendD.label,                       sig: trendD.label === 'Uptrend' ? 'Bullish' : trendD.label === 'Downtrend' ? 'Bearish' : 'Watch', type: trendD.label === 'Uptrend' ? 'b' : trendD.label === 'Downtrend' ? 's' : 'n' },
  };
}

export default function CenterPanel({ currentPair, pairData, analysis, tf, onTfChange }) {
  const cfg = PAIRS[currentPair];
  const pd  = pairData[currentPair];
  const dec = cfg?.dec ?? 5;
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
          <div className="price-big" style={{ color: priceColor }}>
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
          <div className="tf-tabs">
            {['1H', '4H', '1D', '1W'].map(t => (
              <button key={t} className={`tf-tab${tf === t ? ' active' : ''}`} onClick={() => onTfChange(t)}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)' }}>
            <span style={{ width: 12, height: 2, background: '#e8a93c', display: 'inline-block', borderRadius: 1 }} /> EMA20
            <span style={{ width: 12, height: 2, background: '#4d9cf8', display: 'inline-block', borderRadius: 1 }} /> EMA50
          </div>
        </div>
      </div>

      {/* Chart */}
      <PriceChart history={pd?.history} pairKey={currentPair} tf={tf} />

      {/* Indicator row */}
      <div className="ind-row">
        {IND_CELLS.map(({ key, label }) => {
          const d = inds[key];
          return (
            <div key={key} className="ind-cell">
              <div className="ind-name">{label}</div>
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
