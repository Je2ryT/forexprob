import { useEffect } from 'react';
import { PAIRS } from './utils/config.js';
import { useForex } from './hooks/useForex.js';
import TopNav from './components/TopNav.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import CenterPanel from './components/CenterPanel.jsx';
import RightSidebar from './components/RightSidebar.jsx';
import './styles/main.css';

export default function App() {
  const {
    currentPair, tf,
    pairData, analysis, aiMessages,
    loadPair, selectPair, changeTf, askAI,
  } = useForex();

  // On mount: load active pair, then background-load the rest
  useEffect(() => {
    loadPair(currentPair);
    const others = Object.keys(PAIRS).filter(k => k !== currentPair);
    others.forEach((k, i) => {
      setTimeout(() => loadPair(k), 300 + i * 200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="terminal">
      <TopNav
        currentPair={currentPair}
        pairData={pairData}
        onSelect={selectPair}
        onRefresh={() => loadPair(currentPair)}
      />
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
