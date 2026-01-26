
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
  symbol?: string;
  contractType?: 'CALL' | 'PUT' | 'DIGITEVEN' | 'DIGITODD';
  duration?: number;
  durationUnit?: 'm' | 't' | 's' | 'h' | 'd';
  amount?: number;
  martingale?: boolean;
  martingaleMultiplier?: number;
  maxMartingaleSteps?: number;
  takeProfit?: number;
  stopLoss?: number;
  maxTrades?: number;
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

export interface AppSettings {
  // Risk Settings
  maxRiskPerTrade: number;
  dailyLossLimit: number;
  maxOpenTrades: number;
  enableStopLoss: boolean;
  enableTakeProfit: boolean;
  
  // API Settings
  derivApiKey: string;
  geminiApiKey: string;
  
  // Trading Settings
  defaultSymbol: string;
  defaultAmount: number;
  defaultDuration: number;
  defaultDurationUnit: 'm' | 't' | 's' | 'h' | 'd';
  autoExecution: boolean;
  soundAlerts: boolean;
  
  // JARVIS Settings
  jarvisVoice: 'Sophisticated' | 'Military' | 'Concise';
  jarvisAutoAnalysis: boolean;
  
  // Display Settings
  theme: 'dark' | 'light' | 'cyber';
  chartType: 'candles' | 'line' | 'area';
  showVolume: boolean;
}
