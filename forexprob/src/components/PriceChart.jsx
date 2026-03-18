import { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { genOHLC, emaSeries } from '../utils/indicators.js';
import OHLCPopup from './OHLCPopup.jsx';

export default function PriceChart({ history, pairKey, tf }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const ohlcRef   = useRef([]);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (!history || history.length < 5) return;
    const ohlc   = genOHLC(history);
    ohlcRef.current = ohlc;
    const closes = ohlc.map(b => b.c);
    const isJPY  = pairKey?.includes('JPY');
    const dec    = isJPY ? 3 : 5;

    const ema20 = emaSeries(closes, 20);
    const ema50 = emaSeries(closes, 50);

    const barColors    = ohlc.map(b => b.c >= b.o ? 'rgba(34,199,122,0.30)' : 'rgba(245,71,58,0.30)');
    const borderColors = ohlc.map(b => b.c >= b.o ? '#22c77a' : '#f5473a');

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ohlc.map(() => ''),
        datasets: [
          {
            label: 'Price', type: 'bar',
            data: ohlc.map(b => b.c),
            backgroundColor: barColors,
            borderColor: borderColors,
            borderWidth: 1,
            order: 2,
          },
          {
            label: 'EMA20', type: 'line',
            data: ema20,
            borderColor: '#e8a93c', borderWidth: 1.5,
            pointRadius: 0, tension: 0.3, fill: false, order: 1,
          },
          {
            label: 'EMA50', type: 'line',
            data: ema50,
            borderColor: '#4d9cf8', borderWidth: 1.5,
            pointRadius: 0, tension: 0.3, fill: false, order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        onClick: (evt, elements) => {
          if (!elements.length) { setPopup(null); return; }
          const idx = elements[0].index;
          const bar = ohlcRef.current[idx];
          if (!bar) return;
          setPopup({ bar: { ...bar, dec }, x: evt.native.clientX, y: evt.native.clientY });
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false, grid: { display: false } },
          y: {
            position: 'right',
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: {
              color: '#4a4845',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: v => v.toFixed(dec),
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [history, pairKey, tf]);

  return (
    <div className="chart-area" style={{ cursor: 'crosshair' }}>
      <canvas ref={canvasRef} />
      {popup && (
        <OHLCPopup
          bar={popup.bar}
          position={{ x: popup.x, y: popup.y }}
          onClose={() => setPopup(null)}
        />
      )}
      <div style={{
        position: 'absolute', bottom: 8, left: 12,
        fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', pointerEvents: 'none',
      }}>
        click any bar for OHLC details
      </div>
    </div>
  );
}
