import { PAIRS } from '../utils/config.js';

export default function TickerTape({ pairData }) {
  const items = Object.entries(PAIRS);
  const all = [...items, ...items];

  return (
    <div style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: 28,
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        gap: 0,
        animation: 'tickerScroll 40s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {all.map(([key, cfg], i) => {
          const pd = pairData[key];
          const isUp = pd?.isUp ?? true;
          const price = pd ? pd.price.toFixed(cfg.dec) : '—';
          const chg = pd ? `${pd.isUp ? '+' : ''}${pd.change.toFixed(cfg.dec)}` : '';
          return (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 20px',
              borderRight: '1px solid var(--border)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
            }}>
              <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{cfg.label}</span>
              <span style={{ color: isUp ? 'var(--up)' : 'var(--dn)', fontWeight: 700 }}>{price}</span>
              {pd && (
                <span style={{ color: isUp ? 'var(--up)' : 'var(--dn)', fontSize: 10 }}>
                  {isUp ? '▲' : '▼'} {chg}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
