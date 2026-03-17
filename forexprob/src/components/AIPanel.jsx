import { useState, useRef, useEffect } from 'react';
import { PAIRS } from '../utils/config.js';

const QUICK_QUESTIONS = [
  { label: 'S/R Levels',  q: 'What are the key support and resistance levels right now?' },
  { label: 'Sentiment',   q: 'What is the current market sentiment and key news drivers?' },
  { label: 'Strategy',    q: 'Recommended entry strategy with risk parameters?' },
  { label: 'Full Plan ↗', q: 'Give me a full analysis: trend, probability breakdown, entry/exit plan with position sizing.', accent: true },
];

export default function AIPanel({ currentPair, aiMessages, onAsk }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const cfg = PAIRS[currentPair];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    onAsk(q);
  };

  return (
    <div className="ai-wrap">
      <div className="ai-head">
        <div className="ai-icon">AI</div>
        <div className="ai-head-title">Market Analyst</div>
        <div className="ai-head-sub">{cfg?.label ?? '—'}</div>
      </div>

      <div className="ai-messages">
        {aiMessages.length === 0 && (
          <div style={{ color: 'var(--t3)', fontSize: 11, fontFamily: 'var(--mono)', padding: '4px 0' }}>
            Waiting for data...
          </div>
        )}

        {aiMessages.map((msg, i) => {
          if (msg.type === 'loading') {
            return (
              <div key={i} className="ai-msg-bubble loading fadein">
                <div className="dots">
                  <span /><span /><span />
                </div>
                <span style={{ fontSize: 11 }}>Analyzing...</span>
              </div>
            );
          }
          if (msg.type === 'question') {
            return (
              <div key={i} style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', padding: '2px 0' }}>
                ↳ {msg.text}
              </div>
            );
          }
          if (msg.type === 'analysis') {
            const bias = msg.prob?.bull > 55 ? 'up' : msg.prob?.bear > 55 ? 'dn' : 'neu';
            const biasLabel = bias === 'up' ? 'Bullish' : bias === 'dn' ? 'Bearish' : 'Neutral';
            return (
              <div key={i} className="ai-msg-bubble fadein">
                <div style={{ marginBottom: 6 }}>
                  <span className={`ai-tag tag-${bias}`}>{biasLabel}</span>
                  <span className="ai-tag tag-acc">{cfg?.label}</span>
                  {msg.prob && (
                    <span className={`ai-tag tag-${msg.prob.bull > 50 ? 'up' : 'dn'}`}>
                      {msg.prob.bull}% Bull
                    </span>
                  )}
                </div>
                {msg.text}
              </div>
            );
          }
          if (msg.type === 'answer') {
            return (
              <div key={i} className="ai-msg-bubble fadein">
                {msg.text}
              </div>
            );
          }
          if (msg.type === 'error') {
            return (
              <div key={i} className="ai-msg-bubble fadein" style={{ color: 'var(--dn)', borderColor: 'var(--dnbdr)' }}>
                AI unavailable — indicators are still live.
              </div>
            );
          }
          return null;
        })}
        <div ref={bottomRef} />
      </div>

      <div className="ai-quick-btns">
        {QUICK_QUESTIONS.map(({ label, q, accent }) => (
          <button
            key={label}
            className={`ai-q-btn${accent ? ' accent' : ''}`}
            onClick={() => onAsk(q)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          value={input}
          placeholder="Ask the analyst..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="ai-send" onClick={handleSend}>→</button>
      </div>
    </div>
  );
}
