const TWELVE_KEY = import.meta.env.VITE_TWELVE_KEY;

export async function fetchRate(base, quote) {
  if (TWELVE_KEY) {
    try {
      const symbol = `${base}/${quote}`;
      const r = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_KEY}`);
      if (r.ok) {
        const d = await r.json();
        if (d.price) return parseFloat(d.price);
      }
    } catch { }
  }
  try {
    const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!r.ok) throw new Error('rate fail');
    const d = await r.json();
    return d.rates[quote] ?? null;
  } catch {
    return null;
  }
}

export async function fetchCandles(base, quote, interval = '1min', outputsize = 80) {
  if (!TWELVE_KEY) return null;
  try {
    const symbol = `${base}/${quote}`;
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.values || d.status === 'error') return null;
    return d.values.reverse().map(v => ({
      o: parseFloat(v.open),
      h: parseFloat(v.high),
      l: parseFloat(v.low),
      c: parseFloat(v.close),
    }));
  } catch {
    return null;
  }
}

export async function callClaudeStream(messages, onChunk) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) throw new Error('No API key found');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      messages,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    console.error('Claude error:', err);
    throw new Error(err?.error?.message ?? 'Claude API error');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const raw = decoder.decode(value, { stream: true });
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const evt = JSON.parse(json);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          full += evt.delta.text;
          onChunk(full);
        }
      } catch { }
    }
  }
  return full;
}

export async function callClaude(messages) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) throw new Error('No API key found');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    console.error('Claude error:', err);
    throw new Error(err?.error?.message ?? 'Claude API error');
  }
  const data = await resp.json();
  return data.content?.[0]?.text ?? 'Analysis unavailable.';
}

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

export function buildQuestionPrompt(cfg, price, question) {
  return `For ${cfg.label} currently at ${price.toFixed(cfg.dec)}: ${question} Be concise (2-3 sentences), professional. Plain text only.`;
}
