import { useState, useCallback, useRef } from 'react';
import { PAIRS } from '../utils/config.js';
import { genHistory, genOHLC, rsi, macd, bb, atr, stoch, trendDir, computeProb } from '../utils/indicators.js';
import { fetchRate, callClaudeStream, buildAnalysisPrompt, buildQuestionPrompt } from '../utils/api.js';

export function useForex() {
  const [currentPair, setCurrentPair] = useState('EURUSD');
  const [tf, setTf] = useState('1H');
  const [pairData, setPairData] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const aiHistoryRef = useRef([]);
  const analyzingRef = useRef(false);

  const loadPair = useCallback(async (pairKey, timeframe) => {
    const useTf = timeframe || tf;
    const cfg = PAIRS[pairKey];
    if (!cfg) return;
    const isJPY = pairKey.includes('JPY');

    const rate = await fetchRate(cfg.base, cfg.quote);
    const price = rate ?? (isJPY ? 130 + Math.random() * 5 : 1 + Math.random() * 0.3);
    const history = genHistory(price, 80, useTf, isJPY);

    const prev = history[history.length - 2];
    const change = price - prev;
    const changePct = (change / prev) * 100;

    setPairData(pd => ({
      ...pd,
      [pairKey]: { price, history, change, changePct, isUp: change >= 0 },
    }));

    if (pairKey !== currentPair) return;

    const rsiV   = rsi(history);
    const macdD  = macd(history);
    const bbD    = bb(history);
    const ohlc   = genOHLC(history);
    const atrV   = atr(ohlc);
    const stochV = stoch(history);
    const trendD = trendDir(history);
    const prob   = computeProb(rsiV, macdD, trendD, stochV);
    const hi     = Math.max(...history);
    const lo     = Math.min(...history);
    const spread = +(0.8 + Math.random() * 0.8).toFixed(1);
    const vol    = +((hi - lo) / lo * 100).toFixed(3);
    const pipMul = isJPY ? 100 : 10000;

    setAnalysis({ rsiV, macdD, bbD, atrV, stochV, trendD, prob, hi, lo, spread, vol, pipMul, change, changePct });

    if (!analyzingRef.current) {
      analyzingRef.current = true;
      setAiMessages([{ type: 'loading' }]);
      try {
        const prompt = buildAnalysisPrompt(cfg, price, rsiV, macdD, trendD, stochV, prob);
        const msgs = [{ role: 'user', content: prompt }];
        setAiMessages([{ type: 'streaming', text: '', prob }]);
        const full = await callClaudeStream(msgs, (partial) => {
          setAiMessages([{ type: 'streaming', text: partial, prob }]);
        });
        aiHistoryRef.current = [{ role: 'user', content: prompt }, { role: 'assistant', content: full }];
        setAiMessages([{ type: 'analysis', text: full, prob }]);
      } catch {
        setAiMessages([{ type: 'error' }]);
      }
      analyzingRef.current = false;
    }
  }, [currentPair, tf]);

  const tickPrice = useCallback((pairKey) => {
    setPairData(pd => {
      const d = pd[pairKey];
      if (!d) return pd;
      const isJPY = pairKey.includes('JPY');
      const nudge = d.price * (Math.random() - 0.499) * (isJPY ? 0.00015 : 0.000015);
      const newPrice = +(d.price + nudge).toFixed(isJPY ? 3 : 5);
      const newHistory = [...d.history.slice(1), newPrice];
      return {
        ...pd,
        [pairKey]: { ...d, price: newPrice, history: newHistory, isUp: nudge >= 0 },
      };
    });
  }, []);

  const selectPair = useCallback((pairKey) => {
    setCurrentPair(pairKey);
    aiHistoryRef.current = [];
    setAiMessages([]);
    analyzingRef.current = false;
    loadPair(pairKey, tf);
  }, [loadPair, tf]);

  const changeTf = useCallback((newTf) => {
    setTf(newTf);
    loadPair(currentPair, newTf);
  }, [currentPair, loadPair]);

  const askAI = useCallback(async (question) => {
    const cfg = PAIRS[currentPair];
    const pd = pairData[currentPair];
    if (!cfg || !pd) return;
    setAiMessages(m => [...m, { type: 'question', text: question }, { type: 'loading' }]);
    try {
      const prompt = buildQuestionPrompt(cfg, pd.price, question);
      const history = [...aiHistoryRef.current, { role: 'user', content: prompt }];
      if (history.length > 12) history.splice(0, history.length - 12);

      setAiMessages(m => {
        const withoutLoading = m.filter(x => x.type !== 'loading');
        return [...withoutLoading, { type: 'streaming', text: '' }];
      });

      const full = await callClaudeStream(history, (partial) => {
        setAiMessages(m => {
          const withoutStreaming = m.filter(x => x.type !== 'streaming');
          return [...withoutStreaming, { type: 'streaming', text: partial }];
        });
      });

      aiHistoryRef.current = [...history, { role: 'assistant', content: full }];
      setAiMessages(m => {
        const withoutStreaming = m.filter(x => x.type !== 'streaming');
        return [...withoutStreaming, { type: 'answer', text: full }];
      });
    } catch {
      setAiMessages(m => m.filter(x => x.type !== 'loading' && x.type !== 'streaming').concat([{ type: 'error' }]));
    }
  }, [currentPair, pairData]);

  return { currentPair, tf, pairData, analysis, aiMessages, loadPair, selectPair, changeTf, askAI, tickPrice };
}
