export default function SentimentGauge({ bull = 50, pairLabel = '' }) {
  const angle = -90 + bull * 1.8; // -90 (full bear) → +90 (full bull)
  const color = bull > 55 ? '#22c77a' : bull < 45 ? '#f5473a' : '#e8a93c';
  const label =
    bull > 65 ? 'Strong Bullish' :
    bull > 55 ? 'Bullish' :
    bull > 45 ? 'Neutral Bias' :
    bull > 35 ? 'Bearish' : 'Strong Bearish';

  return (
    <div className="sent-block">
      <div className="sent-title">{pairLabel || 'Sentiment'}</div>
      <div className="gauge-container">
        <svg width="200" height="82" viewBox="0 0 200 82" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="ggrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#f5473a" />
              <stop offset="50%"  stopColor="#e8a93c" />
              <stop offset="100%" stopColor="#22c77a" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path d="M10,80 A90,90 0 0,1 190,80" fill="none" stroke="#1a1d26" strokeWidth="12" strokeLinecap="round" />
          {/* Gradient arc */}
          <path d="M10,80 A90,90 0 0,1 190,80" fill="none" stroke="url(#ggrad)" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
          {/* Needle */}
          <line
            x1="100" y1="80" x2="100" y2="10"
            stroke="#e8a93c" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${angle},100,80)`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <circle cx="100" cy="80" r="4" fill="#e8a93c" />
        </svg>
        <div className="gauge-val" style={{ color }}>{bull}%</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
}
