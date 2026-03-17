export const PAIRS = {
  EURUSD: { label: 'EUR/USD', base: 'EUR', quote: 'USD', dec: 5, full: 'Euro / US Dollar',             pip: 0.0001 },
  GBPUSD: { label: 'GBP/USD', base: 'GBP', quote: 'USD', dec: 5, full: 'Pound Sterling / US Dollar',  pip: 0.0001 },
  USDJPY: { label: 'USD/JPY', base: 'USD', quote: 'JPY', dec: 3, full: 'US Dollar / Japanese Yen',     pip: 0.01   },
  AUDUSD: { label: 'AUD/USD', base: 'AUD', quote: 'USD', dec: 5, full: 'Australian Dollar / US Dollar',pip: 0.0001 },
  USDCAD: { label: 'USD/CAD', base: 'USD', quote: 'CAD', dec: 5, full: 'US Dollar / Canadian Dollar',  pip: 0.0001 },
  USDCHF: { label: 'USD/CHF', base: 'USD', quote: 'CHF', dec: 5, full: 'US Dollar / Swiss Franc',      pip: 0.0001 },
  NZDUSD: { label: 'NZD/USD', base: 'NZD', quote: 'USD', dec: 5, full: 'New Zealand Dollar / US Dollar',pip:0.0001 },
  EURJPY: { label: 'EUR/JPY', base: 'EUR', quote: 'JPY', dec: 3, full: 'Euro / Japanese Yen',          pip: 0.01   },
};

export const CORR_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];

// Realistic synthetic correlation table
export const CORRELATIONS = {
  EURUSD: { EURUSD: 1,    GBPUSD: 0.72, USDJPY: -0.65, AUDUSD: 0.58 },
  GBPUSD: { EURUSD: 0.72, GBPUSD: 1,    USDJPY: -0.48, AUDUSD: 0.62 },
  USDJPY: { EURUSD:-0.65, GBPUSD:-0.48, USDJPY: 1,     AUDUSD:-0.42 },
  AUDUSD: { EURUSD: 0.58, GBPUSD: 0.62, USDJPY: -0.42, AUDUSD: 1    },
};

export const ECON_EVENTS = [
  { time: '08:30', event: 'US CPI (MoM)',       currency: 'USD', impact: 'high' },
  { time: '10:00', event: 'EUR PMI Flash',       currency: 'EUR', impact: 'high' },
  { time: '12:30', event: 'GBP Trade Balance',   currency: 'GBP', impact: 'med'  },
  { time: '14:00', event: 'Fed Chair Speaks',    currency: 'USD', impact: 'high' },
  { time: '15:30', event: 'CAD Retail Sales',    currency: 'CAD', impact: 'med'  },
  { time: '18:00', event: 'JPY BOJ Minutes',     currency: 'JPY', impact: 'med'  },
  { time: '20:00', event: 'NZD Business Conf.',  currency: 'NZD', impact: 'low'  },
];

export const TF_VOLS = {
  '1H': 0.00006,
  '4H': 0.00015,
  '1D': 0.0004,
  '1W': 0.0012,
};
