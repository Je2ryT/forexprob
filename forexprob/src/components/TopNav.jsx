import { useClock } from '../hooks/useClock.js';
import { PAIRS } from '../utils/config.js';

export default function TopNav({ currentPair, pairData, onSelect, onRefresh, isLive }) {
  const { time, session } = useClock();

  return (
    <div className="topnav">
      <div className="logo-mark">FXPROB</div>

      <div className="nav-pair-tabs">
        {Object.entries(PAIRS).map(([key, cfg]) => {
          const pd = pairData[key];
          const isActive = key === currentPair;
          const cls = `pair-tab${isActive ? ' active' : ''}${pd ? (pd.isUp ? ' up' : ' dn') : ''}`;
          return (
            <div key={key} className={cls} onClick={() => onSelect(key)}>
              <span>{cfg.label}</span>
              <span className="tab-price">
                {pd ? pd.price.toFixed(cfg.dec) : '–'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="nav-right">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 4,
          border: `1px solid ${isLive ? 'var(--upbdr)' : 'var(--border2)'}`,
          background: isLive ? 'var(--upbg)' : 'transparent',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isLive ? 'var(--up)' : 'var(--t3)',
            animation: isLive ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10,
            color: isLive ? 'var(--up)' : 'var(--t3)',
          }}>
            {isLive ? 'LIVE' : 'SIM'}
          </span>
        </div>
        <span className={`session-badge${session.active ? ' active-sess' : ''}`}>
          {session.label}
        </span>
        <span className="clock">{time}</span>
        <button className="btn-sm" onClick={onRefresh}>↻</button>
      </div>
    </div>
  );
}
