import { useState, useCallback, useRef } from 'react';
import { PAIRS } from '../utils/config.js';
import { genHistory, genOHLC, rsi, macd, bb, atr, stoch, trendDir, computeProb } from '../utils/indicators.js';
import { fetchRate, fetchCandles, callClaudeStream, buildAnalysisPrompt, buildQuestionPrompt } from '../utils/api.js';

export function useForex() {
  const [currentPair, setCurrentPair] = useState('EURUSD');
  const [tf, setTf] = useState('1H');
  const [pairData, setPairData] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const aiHistoryRef  = useRef([]);
  const analyzingRef  = useRef(false);

  const TF_MAP = { '1H': '1min', '4H': '5min', '1D': '15min', '1W': '1h' };

  const loadPair = useCallback(async (pairKey, timeframe) => {
    const useTf = timeframe || tf;
    const cfg = PAIRS[pairKey];
    if (!cfg) return;
    const isJPY = pairKey.includes('JPY');

    const liveCandles = await fetchCandles(cfg.base, cfg.quote, TF_MAP[useTf] || '1min', 80);
    const hasLive = liveCandles && liveCandles.length > 5;

    let price, history, ohlcData;

    if (hasLive) {
      setIsLive(true);
      ohlcData = liveCandles;
      price    = liveCandles[liveCandles.length - 1].c;
      history  = liveCandles.map(c => c.c);
    } else {
      setIsLive(false);
      const rate = await fetchRate(cfg.base, cfg.quote);
      price   = rate ?? (isJPY ? 130 + Math.random() * 5 : 1 + Math.random() * 0.3);
      history = genHistory(price, 80, useTf, isJPY);
      ohlcData = genOHLC(history);
    }

    const prev      = history[history.length - 2];
    const change    = price - prev;
    const changePct = (change / prev) * 100;

    setPairData(pd => ({
      ...pd,
      [pairKey]: { price, history, ohlcData, change, changePct, isUp: change >= 0, isLive: hasLive },
    }));

    if (pairKey !== currentPair) return;

    const rsiV   = rsi(history);
    const macdD  = macd(history);
    const bbD    = bb(history);
    const atrV   = atr(ohlcData);
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
      setAiMessages([{ type: 'streaming', text: '', prob }]);
      try {
        const prompt = buildAnalysisPrompt(cfg, price, rsiV, macdD, trendD, stochV, prob);
        const msgs = [{ role: 'user', content: prompt }];
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

  const tickPrice = useCallback(async (pairKey) => {
    const cfg = PAIRS[pairKey];
    if (!cfg) return;
    const rate = await fetchRate(cfg.base, cfg.quote);
    setPairData(pd => {
      const d = pd[pairKey];
      if (!d) return pd;
      const isJPY = pairKey.includes('JPY');
      const newPrice = rate
        ? parseFloat(rate.toFixed(isJPY ? 3 : 5))
        : +(d.price * (1 + (Math.random() - 0.499) * 0.000015)).toFixed(isJPY ? 3 : 5);
      const isUp = newPrice >= d.price;
      return { ...pd, [pairKey]: { ...d, price: newPrice, isUp, change: newPrice - d.price } };
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
    setAiMessages(m => [...m, { type: 'question', text: question }]);
    setAiMessages(m => [...m, { type: 'streaming', text: '' }]);
    try {
      const prompt = buildQuestionPrompt(cfg, pd.price, question);
      const history = [...aiHistoryRef.current, { role: 'user', content: prompt }];
      if (history.length > 12) history.splice(0, history.length - 12);
      const full = await callClaudeStream(history, (partial) => {
        setAiMessages(m => {
          const without = m.filter(x => x.type !== 'streaming');
          return [...without, { type: 'streaming', text: partial }];
        });
      });
      aiHistoryRef.current = [...history, { role: 'assistant', content: full }];
      setAiMessages(m => {
        const without = m.filter(x => x.type !== 'streaming');
        return [...without, { type: 'answer', text: full }];
      });
    } catch {
      setAiMessages(m => m.filter(x => x.type !== 'streaming').concat([{ type: 'error' }]));
    }
  }, [currentPair, pairData]);

  return { currentPair, tf, pairData, analysis, aiMessages, isLive, loadPair, selectPair, changeTf, askAI, tickPrice };
}
