import { useEffect, useState, useRef } from 'react';
import { PAIRS } from './utils/config.js';
import { useForex } from './hooks/useForex.js';
import TopNav from './components/TopNav.jsx';
import TickerTape from './components/TickerTape.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import CenterPanel from './components/CenterPanel.jsx';
import RightSidebar from './components/RightSidebar.jsx';
import './styles/main.css';

export default function App() {
  const {
    currentPair, tf, pairData, analysis, aiMessages, isLive,
    loadPair, selectPair, changeTf, askAI, tickPrice,
  } = useForex();

  const [isDark, setIsDark] = useState(true);
  const tickRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--bg',     '#0a0b0e');
      root.style.setProperty('--bg2',    '#0f1117');
      root.style.setProperty('--bg3',    '#14161d');
      root.style.setProperty('--bg4',    '#1a1d26');
      root.style.setProperty('--bg5',    '#1f2230');
      root.style.setProperty('--t1',     '#e8e6e0');
      root.style.setProperty('--t2',     '#8a8880');
      root.style.setProperty('--t3',     '#4a4845');
      root.style.setProperty('--t4',     '#2a2825');
      root.style.setProperty('--border',  'rgba(255,255,255,0.06)');
      root.style.setProperty('--border2', 'rgba(255,255,255,0.10)');
      root.style.setProperty('--border3', 'rgba(255,255,255,0.16)');
    } else {
      root.style.setProperty('--bg',     '#f4f3ef');
      root.style.setProperty('--bg2',    '#eceae4');
      root.style.setProperty('--bg3',    '#e4e2db');
      root.style.setProperty('--bg4',    '#d8d6ce');
      root.style.setProperty('--bg5',    '#cccac2');
      root.style.setProperty('--t1',     '#1a1816');
      root.style.setProperty('--t2',     '#4a4845');
      root.style.setProperty('--t3',     '#8a8880');
      root.style.setProperty('--t4',     '#b0aea8');
      root.style.setProperty('--border',  'rgba(0,0,0,0.08)');
      root.style.setProperty('--border2', 'rgba(0,0,0,0.12)');
      root.style.setProperty('--border3', 'rgba(0,0,0,0.20)');
    }
  }, [isDark]);

  useEffect(() => {
    loadPair(currentPair);
    const others = Object.keys(PAIRS).filter(k => k !== currentPair);
    others.forEach((k, i) => setTimeout(() => loadPair(k), 300 + i * 200));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      Object.keys(PAIRS).forEach(k => tickPrice(k));
    }, 15000);
    return () => clearInterval(tickRef.current);
  }, [tickPrice]);

  useEffect(() => {
    const MAP = {
      e: 'EURUSD', g: 'GBPUSD', j: 'USDJPY', a: 'AUDUSD',
      c: 'USDCAD', f: 'USDCHF', n: 'NZDUSD', r: 'EURJPY',
    };
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (MAP[key]) selectPair(MAP[key]);
      if (key === 'd') setIsDark(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectPair]);

  return (
    <div className="terminal">
      <TopNav
        currentPair={currentPair}
        pairData={pairData}
        onSelect={selectPair}
        onRefresh={() => loadPair(currentPair)}
        isLive={isLive}
      />
      <TickerTape pairData={pairData} />
      <div className="grid-main">
        <LeftSidebar
          currentPair={currentPair}
          pairData={pairData}
          analysis={analysis}
          onSelect={selectPair}
        />
        <CenterPanel
          currentPair={currentPair}
          pairData={pairData}
          analysis={analysis}
          tf={tf}
          onTfChange={changeTf}
          isDark={isDark}
          onToggleTheme={() => setIsDark(v => !v)}
        />
        <RightSidebar
          currentPair={currentPair}
          pairData={pairData}
          analysis={analysis}
          aiMessages={aiMessages}
          onAsk={askAI}
        />
      </div>
    </div>
  );
}
