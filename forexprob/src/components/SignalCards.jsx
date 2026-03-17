import { PAIRS } from '../utils/config.js';

export default function SignalCards({ currentPair, pairData, analysis }) {
  const cfg  = PAIRS[currentPair];
  const pd   = pairData[currentPair];
  const prob = analysis?.prob;
  const price = pd?.price;
  const dec   = cfg?.dec ?? 5;
  const pip   = cfg?.pip ?? 0.0001;

  const lEntry = price;
  const lTP    = price ? price + pip * 35 : null;
  const lSL    = price ? price - pip * 18 : null;
  const lRR    = lTP && lSL ? ((lTP - lEntry) / (lEntry - lSL)).toFixed(1) : null;

  const sEntry = price;
  const sTP    = price ? price - pip * 32 : null;
  const sSL    = price ? price + pip * 16 : null;
  const sRR    = sTP && sSL ? ((sEntry - sTP) / (sSL - sEntry)).toFixed(1) : null;

  return (
    <>
      <div className="section-head">Entry Signals</div>
      <div className="sig-cards-wrap">
        {/* LONG */}
        <div className="sig-card long">
          <div className="sc-header">
            <div className="sc-dir long">▲ LONG</div>
            <div className="sc-prob">{prob ? `${prob.bull}%` : '—'}</div>
          </div>
          <div className="sc-row"><span className="sc-lbl">Entry</span> <span className="sc-val">{lEntry?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">Target</span><span className="sc-val up-c">{lTP?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">Stop</span>  <span className="sc-val dn-c">{lSL?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">R:R</span>   <span className="sc-val">{lRR ? `1:${lRR}` : '—'}</span></div>
          <div className="sc-bar"><div className="sc-fill-l" style={{ width: `${prob?.bull ?? 0}%` }} /></div>
        </div>

        {/* SHORT */}
        <div className="sig-card short">
          <div className="sc-header">
            <div className="sc-dir short">▼ SHORT</div>
            <div className="sc-prob">{prob ? `${prob.bear}%` : '—'}</div>
          </div>
          <div className="sc-row"><span className="sc-lbl">Entry</span> <span className="sc-val">{sEntry?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">Target</span><span className="sc-val up-c">{sTP?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">Stop</span>  <span className="sc-val dn-c">{sSL?.toFixed(dec) ?? '—'}</span></div>
          <div className="sc-row"><span className="sc-lbl">R:R</span>   <span className="sc-val">{sRR ? `1:${sRR}` : '—'}</span></div>
          <div className="sc-bar"><div className="sc-fill-s" style={{ width: `${prob?.bear ?? 0}%` }} /></div>
        </div>
      </div>
    </>
  );
}
