import { PAIRS, CORR_PAIRS, CORRELATIONS } from '../utils/config.js';

export default function CorrelationMatrix({ currentPair }) {
  const row = CORRELATIONS[currentPair] ?? CORRELATIONS['EURUSD'];

  return (
    <div className="corr-wrap">
      <div className="corr-title">Pair Correlation (30d)</div>
      <div className="corr-grid">
        {CORR_PAIRS.map(p => {
          const v = row[p] ?? 0;
          const abs = Math.abs(v);
          const isPos = v > 0;
          const isSelf = p === currentPair;
          const alpha = 0.12 + abs * 0.55;
          const bg = isSelf
            ? 'rgba(232,169,60,0.14)'
            : isPos
              ? `rgba(34,199,122,${alpha})`
              : `rgba(245,71,58,${alpha})`;
          const color = isSelf ? '#e8a93c' : isPos ? '#22c77a' : '#f5473a';

          return (
            <div
              key={p}
              className="corr-cell"
              style={{ background: bg, color }}
              title={`${PAIRS[p]?.label ?? p}: ${v.toFixed(2)}`}
            >
              {PAIRS[p]?.label ?? p}
              <br />
              {v === 1 ? '—' : v.toFixed(2)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
