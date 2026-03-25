export default function SentimentGauge({ bull = 50, pairLabel = '' }) {
  const angle = -90 + bull * 1.8;
  const color = bull > 55 ? 'var(--up)' : bull < 45 ? 'var(--dn)' : 'var(--acc)';
  const label =
    bull > 65 ? 'Strong Bullish' :
    bull > 55 ? 'Bullish' :
    bull > 45 ? 'Neutral Bias' :
    bull > 35 ? 'Bearish' : 'Strong Bearish';

  return (
    <div className="sent-block">
      <div className="sent-title">{pairLabel || 'Sentiment'}</div>
      <div className="gauge-container">
        <svg width="180" height="78" viewBox="0 0 180 78" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="ggrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#e8483a" />
              <stop offset="50%"  stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#1db87a" />
            </linearGradient>
          </defs>
          <path d="M10,76 A80,80 0 0,1 170,76" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
          <path d="M10,76 A80,80 0 0,1 170,76" fill="none" stroke="url(#ggrad)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
          <line
            x1="90" y1="76" x2="90" y2="14"
            stroke="var(--acc)" strokeWidth="1.5" strokeLinecap="round"
            transform={`rotate(${angle},90,76)`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <circle cx="90" cy="76" r="4" fill="var(--acc)" />
        </svg>
        <div className="gauge-val" style={{ color }}>{bull}%</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}
