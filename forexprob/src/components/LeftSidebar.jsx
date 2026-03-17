import { PAIRS, ECON_EVENTS } from '../utils/config.js';
import MiniSparkline from './MiniSparkline.jsx';
import SentimentGauge from './SentimentGauge.jsx';

export default function LeftSidebar({ currentPair, pairData, analysis, onSelect }) {
  const bull = analysis?.prob?.bull ?? 50;

  return (
    <div className="sidebar-left">
      <div className="section-head">Watchlist</div>

      {Object.entries(PAIRS).map(([key, cfg]) => {
        const pd = pairData[key];
        return (
          <div
            key={key}
            className={`wl-item${key === currentPair ? ' active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <div className="wl-pair">{cfg.label}</div>
            <div className="wl-price">{pd ? pd.price.toFixed(cfg.dec) : '–'}</div>
            <div className={`wl-change${pd ? (pd.isUp ? ' up-c' : ' dn-c') : ''}`}>
              {pd ? `${pd.isUp ? '+' : ''}${pd.change.toFixed(cfg.dec)}` : '–'}
            </div>
            <div className="wl-spark">
              {pd && <MiniSparkline history={pd.history} isUp={pd.isUp} />}
            </div>
          </div>
        );
      })}

      <div className="section-head" style={{ marginTop: 4 }}>Sentiment Gauge</div>
      <SentimentGauge bull={bull} pairLabel={PAIRS[currentPair]?.label} />

      <div className="section-head">Economic Calendar</div>
      {ECON_EVENTS.map((e, i) => (
        <div key={i} className="cal-item">
          <div className="cal-time">{e.time}</div>
          <div className="cal-content">
            <div className="cal-event">{e.event}</div>
            <div className="cal-currency">{e.currency}</div>
          </div>
          <div className={`cal-impact imp-${e.impact === 'high' ? 'high' : e.impact === 'med' ? 'med' : 'low'}`} />
        </div>
      ))}
    </div>
  );
}
