export default function OHLCPopup({ bar, position, onClose }) {
  if (!bar) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y - 10, window.innerHeight - 180),
          background: 'var(--bg3)',
          border: '1px solid var(--border3)',
          borderRadius: 8,
          padding: '12px 16px',
          zIndex: 1001,
          minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: 'fadein 0.15s ease',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 8,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', letterSpacing: '.06em' }}>
            OHLC
          </span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            color: bar.c >= bar.o ? 'var(--up)' : 'var(--dn)',
          }}>
            {bar.c >= bar.o ? '▲ Bullish' : '▼ Bearish'}
          </span>
        </div>
        {[
          { label: 'Open',  val: bar.o, color: 'var(--t1)' },
          { label: 'High',  val: bar.h, color: 'var(--up)' },
          { label: 'Low',   val: bar.l, color: 'var(--dn)' },
          { label: 'Close', val: bar.c, color: bar.c >= bar.o ? 'var(--up)' : 'var(--dn)' },
          { label: 'Range', val: (bar.h - bar.l).toFixed(bar.dec ?? 5), color: 'var(--acc)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 5, fontSize: 12,
          }}>
            <span style={{ color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: 10 }}>{label}</span>
            <span style={{ color, fontFamily: 'var(--mono)', fontWeight: 600 }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>
          click anywhere to close
        </div>
      </div>
    </div>
  );
}
