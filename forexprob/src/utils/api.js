/** Fetch live exchange rate via ExchangeRate-API (free tier, no key needed) */
export async function fetchRate(base, quote) {
  try {
    const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!r.ok) throw new Error('rate fail');
    const d = await r.json();
    return d.rates[quote] ?? null;
  } catch {
    return null;
  }
}

/** Call Claude Sonnet for market analysis */
export async function callClaude(messages) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages,
    }),
  });
  if (!resp.ok) throw new Error('Claude API error');
  const data = await resp.json();
  return data.content?.[0]?.text ?? 'Analysis unavailable.';
}

/** Build the auto-analysis prompt */
export function buildAnalysisPrompt(cfg, price, rsiV, macdD, trendD, stochV, prob) {
  return `You are an expert FX analyst. Give a sharp, 3-sentence analysis for ${cfg.full} (${cfg.label}).

Live data:
- Price: ${price.toFixed(cfg.dec)}
- RSI (14): ${rsiV.toFixed(1)}
- MACD: ${macdD.sig}
- Trend: ${trendD.label}
- Stochastic %K: ${stochV.toFixed(1)}
- Bull Probability: ${prob.bull}%
- Bear Probability: ${prob.bear}%

State the directional bias, the key signal driving it, and a brief near-term outlook. Plain text only, no markdown, no bullet points.`;
}

/** Build a follow-up question prompt */
export function buildQuestionPrompt(cfg, price, question) {
  return `For ${cfg.label} currently at ${price.toFixed(cfg.dec)}: ${question} Be concise (2–3 sentences), professional. Plain text only.`;
}
