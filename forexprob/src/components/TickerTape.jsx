import { PAIRS } from '../utils/config.js';

export default function TickerTape({ pairData }) {
  const items = Object.entries(PAIRS);
  const all = [...items, ...items];

  return (
    <div className="ticker-tape-wrap">
      <div className="ticker-track">
        {all.map(([key, cfg], i) => {
          const pd = pairData[key];
          const isUp = pd?.isUp ?? true;
          const price = pd ? pd.price.toFixed(cfg.dec) : '—';
          const chg = pd ? `${pd.isUp ? '+' : ''}${pd.change.toFixed(cfg.dec)}` : '';
          return (
            <span key={i} className="tick-item">
              <span className="tick-pair">{cfg.label}</span>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
                color: isUp ? 'var(--up)' : 'var(--dn)',
              }}>
                {price}
              </span>
              {pd && (
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9,
                  color: isUp ? 'var(--up)' : 'var(--dn)',
                }}>
                  {isUp ? '▲' : '▼'} {chg}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
