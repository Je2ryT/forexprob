import { useState, useEffect } from 'react';

function getSession(h) {
  if (h >= 0  && h < 7)  return { label: 'Tokyo',        active: true };
  if (h >= 7  && h < 12) return { label: 'London',       active: true };
  if (h >= 12 && h < 16) return { label: 'L/NY Overlap', active: true };
  if (h >= 16 && h < 21) return { label: 'New York',     active: true };
  return { label: 'Off-Hours', active: false };
}

export function useClock() {
  const [state, setState] = useState(() => {
    const now = new Date();
    return { time: now.toUTCString().slice(17, 25) + ' UTC', session: getSession(now.getUTCHours()) };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setState({ time: now.toUTCString().slice(17, 25) + ' UTC', session: getSession(now.getUTCHours()) });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
