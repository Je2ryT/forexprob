import SignalCards from './SignalCards.jsx';
import CorrelationMatrix from './CorrelationMatrix.jsx';
import AIPanel from './AIPanel.jsx';

export default function RightSidebar({ currentPair, pairData, analysis, aiMessages, onAsk }) {
  return (
    <div className="sidebar-right">
      <SignalCards currentPair={currentPair} pairData={pairData} analysis={analysis} />
      <CorrelationMatrix currentPair={currentPair} />
      <AIPanel currentPair={currentPair} aiMessages={aiMessages} onAsk={onAsk} />
    </div>
  );
}
