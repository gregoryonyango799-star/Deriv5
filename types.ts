
export type MarketRegime = 'Trending' | 'Ranging' | 'Volatile' | 'Transitional';

export interface Trade {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  strategy: string;
  timestamp: number;
}

export interface BotStrategy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  allocation: number;
  winRate: number;
  totalTrades: number;
  pnl: number;
}

export interface PsychologyMetrics {
  overallScore: number;
  discipline: number;
  emotionalControl: number;
  riskManagement: number;
}

export interface JarvisMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
