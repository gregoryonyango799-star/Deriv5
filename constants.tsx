
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
    active: true,
    allocation: 30,
    winRate: 64,
    totalTrades: 142,
    pnl: 2450.50
  },
  {
    id: 'sd-sniper',
    name: 'S&D Sniper',
    description: 'Supply & Demand Zone Detection',
    active: false,
    allocation: 20,
    winRate: 58,
    totalTrades: 89,
    pnl: -120.40
  },
  {
    id: 'breakout-bot',
    name: 'Breakout Confirm',
    description: 'Volume-Confirmed Range Breakouts',
    active: true,
    allocation: 25,
    winRate: 61,
    totalTrades: 210,
    pnl: 1890.00
  },
  {
    id: 'div-hunter',
    name: 'Divergence Hunter',
    description: 'RSI & MACD Multi-Timeframe Divergence',
    active: true,
    allocation: 15,
    winRate: 72,
    totalTrades: 56,
    pnl: 3400.20
  },
  {
    id: 'session-bot',
    name: 'Session Breakout',
    description: 'London/NY Opening Range Strategies',
    active: false,
    allocation: 10,
    winRate: 45,
    totalTrades: 34,
    pnl: 450.00
  }
];

export const ICONS = {
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
