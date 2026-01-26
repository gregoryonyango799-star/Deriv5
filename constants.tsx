
import React from 'react';

export const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  alert: '#e94560',
  jarvis: '#00f3ff'
};

export const INITIAL_BOTS = [
  {
    id: 'smc-bot',
    name: 'SMC Bot',
    description: 'Smart Money Concepts - Order Blocks & FVG',
    active: false,
    allocation: 30,
    winRate: 64,
    totalTrades: 142,
    pnl: 2450.50,
    symbol: 'R_100',
    contractType: 'CALL' as const,
    duration: 1,
    durationUnit: 'm' as const,
    amount: 1,
    martingale: false,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 3,
    takeProfit: 50,
    stopLoss: 25,
    maxTrades: 100
  },
  {
    id: 'sd-sniper',
    name: 'S&D Sniper',
    description: 'Supply & Demand Zone Detection',
    active: false,
    allocation: 20,
    winRate: 58,
    totalTrades: 89,
    pnl: -120.40,
    symbol: 'R_50',
    contractType: 'PUT' as const,
    duration: 5,
    durationUnit: 't' as const,
    amount: 0.5,
    martingale: true,
    martingaleMultiplier: 2.2,
    maxMartingaleSteps: 4,
    takeProfit: 30,
    stopLoss: 15,
    maxTrades: 50
  },
  {
    id: 'breakout-bot',
    name: 'Breakout Confirm',
    description: 'Volume-Confirmed Range Breakouts',
    active: false,
    allocation: 25,
    winRate: 61,
    totalTrades: 210,
    pnl: 1890.00,
    symbol: 'R_75',
    contractType: 'CALL' as const,
    duration: 2,
    durationUnit: 'm' as const,
    amount: 2,
    martingale: false,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 3,
    takeProfit: 100,
    stopLoss: 50,
    maxTrades: 200
  },
  {
    id: 'div-hunter',
    name: 'Divergence Hunter',
    description: 'RSI & MACD Multi-Timeframe Divergence',
    active: false,
    allocation: 15,
    winRate: 72,
    totalTrades: 56,
    pnl: 3400.20,
    symbol: '1HZ100V',
    contractType: 'DIGITEVEN' as const,
    duration: 5,
    durationUnit: 't' as const,
    amount: 1,
    martingale: true,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 5,
    takeProfit: 80,
    stopLoss: 40,
    maxTrades: 75
  },
  {
    id: 'session-bot',
    name: 'Session Breakout',
    description: 'London/NY Opening Range Strategies',
    active: false,
    allocation: 10,
    winRate: 45,
    totalTrades: 34,
    pnl: 450.00,
    symbol: 'frxEURUSD',
    contractType: 'CALL' as const,
    duration: 15,
    durationUnit: 'm' as const,
    amount: 5,
    martingale: false,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 3,
    takeProfit: 200,
    stopLoss: 100,
    maxTrades: 20
  }
];

export const DEFAULT_SETTINGS = {
  maxRiskPerTrade: 2,
  dailyLossLimit: 5,
  maxOpenTrades: 5,
  enableStopLoss: true,
  enableTakeProfit: true,
  derivApiKey: '', // Will be set via login
  geminiApiKey: '', // Will be set in Settings - get from https://makersuite.google.com/app/apikey
  defaultSymbol: 'R_100',
  defaultAmount: 1,
  defaultDuration: 1,
  defaultDurationUnit: 'm' as const,
  autoExecution: true,
  soundAlerts: true,
  jarvisVoice: 'Sophisticated' as const,
  jarvisAutoAnalysis: false,
  theme: 'dark' as const,
  chartType: 'candles' as const,
  showVolume: true
};

export const CONTRACT_TYPES = [
  { value: 'CALL', label: 'Rise/Call', description: 'Price goes up' },
  { value: 'PUT', label: 'Fall/Put', description: 'Price goes down' },
  { value: 'DIGITEVEN', label: 'Even', description: 'Last digit is even' },
  { value: 'DIGITODD', label: 'Odd', description: 'Last digit is odd' },
  { value: 'DIGITMATCH', label: 'Matches', description: 'Last digit matches' },
  { value: 'DIGITDIFF', label: 'Differs', description: 'Last digit differs' },
];

export const DURATION_UNITS = [
  { value: 't', label: 'Ticks' },
  { value: 's', label: 'Seconds' },
  { value: 'm', label: 'Minutes' },
  { value: 'h', label: 'Hours' },
  { value: 'd', label: 'Days' },
];


export const ICONS = {
  Terminal: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  ),
  Analysis: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
  Intelligence: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  Neuro: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2.1 12.1"/></svg>
  ),
  Logs: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  Settings: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  Bot: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  ),
  Pulse: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Jarvis: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
};
