export default function MiniSparkline({ history, isUp }) {
  if (!history || history.length < 2) return <svg style={{ width: '100%', height: 20 }} />;

  const W = 200, H = 20, pad = 2;
  const mn = Math.min(...history), mx = Math.max(...history);
  const rng = mx - mn || 0.001;
  const pts = history.map((p, i) => {
    const x = pad + (i / (history.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((p - mn) / rng) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const color = isUp ? '#22c77a' : '#f5473a';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 20, display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}
