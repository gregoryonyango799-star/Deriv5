
// Deriv API Configuration
const APP_ID = 86454; // Your specific app ID for account switching
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export interface DerivAccount {
  loginid: string;
  balance: number;
  currency: string;
  account_type: string;
  is_virtual: number;
  token?: string;
  landing_company_name?: string;
}

export interface ActiveSymbol {
  symbol: string;
  display_name: string;
  market: string;
  market_display_name: string;
  submarket: string;
  submarket_display_name: string;
  pip: number;
  spot: number;
  spot_age: string;
  quote_suspended?: number;
  exchange_is_open: number;
}

export interface TickData {
  symbol: string;
  quote: number;
  epoch: number;
}

export interface ContractInfo {
  contract_id: number;
  contract_type: string;
  currency: string;
  buy_price: number;
  payout: number;
  profit: number;
  profit_percentage: number;
  status: string;
  is_sold: number;
  symbol: string;
  date_start: number;
  date_expiry: number;
  entry_spot: number;
  current_spot?: number;
}

export interface TradeResult {
  contract_id: number;
  balance_after: number;
  buy_price: number;
  payout: number;
  start_time: number;
  transaction_id: number;
}

// Bot Trading Settings
export interface BotSettings {
  id: string;
  symbol: string;
  contractType: 'CALL' | 'PUT' | 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF';
  amount: number;
  duration: number;
  durationUnit: 'm' | 't' | 's' | 'h' | 'd';
  martingale: boolean;
  martingaleMultiplier: number;
  maxMartingaleSteps: number;
  takeProfit: number;
  stopLoss: number;
  maxTrades: number;
  // Enhanced technical analysis settings
  useAI?: boolean;
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
  bbPeriod?: number;
  bbStdDev?: number;
  emaPeriod?: number;
  smaPeriod?: number;
  stochPeriod?: number;
  stochOverbought?: number;
  stochOversold?: number;
  atrPeriod?: number;
  multiTimeframe?: boolean;
  minSignalStrength?: number;
}

// Technical indicator calculation helpers
export class TechnicalIndicators {
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
        continue;
      }
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(firstSMA);
    
    for (let i = 1; i < data.length; i++) {
      if (i < period) {
        ema.push(NaN);
        continue;
      }
      const value = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(value);
    }
    return ema;
  }

  static calculateRSI(data: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(NaN);
        continue;
      }
      
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  }

  static calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    const macdLine: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
        macdLine.push(NaN);
      } else {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      }
    }
    
    const signalLine = this.calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
    const histogram: number[] = [];
    
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i]) || i >= signalLine.length || isNaN(signalLine[i])) {
        histogram.push(NaN);
      } else {
        histogram.push(macdLine[i] - signalLine[i]);
      }
    }
    
    return { macdLine, signalLine, histogram };
  }

  static calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(data, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1 || isNaN(sma[i])) {
        upperBand.push(NaN);
        lowerBand.push(NaN);
        continue;
      }
      
      const slice = data.slice(i - period + 1, i + 1);
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma[i], 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upperBand.push(sma[i] + stdDev * std);
      lowerBand.push(sma[i] - stdDev * std);
    }
    
    return { middleBand: sma, upperBand, lowerBand };
  }

  static calculateStochastic(high: number[], low: number[], close: number[], period: number = 14) {
    const k: number[] = [];
    
    for (let i = 0; i < close.length; i++) {
      if (i < period - 1) {
        k.push(NaN);
        continue;
      }
      
      const highSlice = high.slice(i - period + 1, i + 1);
      const lowSlice = low.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...highSlice);
      const lowestLow = Math.min(...lowSlice);
      
      if (highestHigh === lowestLow) {
        k.push(50);
      } else {
        k.push(((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100);
      }
    }
    
    const d = this.calculateSMA(k.filter(v => !isNaN(v)), 3);
    return { k, d };
  }

  static calculateATR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    const tr: number[] = [];
    
    for (let i = 0; i < close.length; i++) {
      if (i === 0) {
        tr.push(high[i] - low[i]);
        continue;
      }
      
      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
    
    return this.calculateSMA(tr, period);
  }
}

export class DerivService {
  private socket: WebSocket | null = null;
  private listeners: Set<(data: any) => void> = new Set();
  private apiKey: string = ''; // API key set at runtime via login/settings; do NOT hardcode secrets
  private messageQueue: string[] = [];
  private isAuthorized: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  
  private authResolvers: ((value: void | PromiseLike<void>) => void)[] = [];
  private authRejecters: ((reason?: any) => void)[] = [];
  private connectionPromise: Promise<void> | null = null;
  
  public accounts: DerivAccount[] = [];
  public currentAccount: DerivAccount | null = null;
  public activeSymbols: ActiveSymbol[] = [];
  public openContracts: ContractInfo[] = [];
  
  private tickSubscriptions: Map<string, number> = new Map();
  private proposalSubscriptions: Map<string, string> = new Map();
  
  // Bot state
  private activeBots: Map<string, { 
    settings: BotSettings; 
    running: boolean; 
    trades: number;
    openTrades: number;
    profit: number;
    currentStep: number;
    currentAmount: number;
  }> = new Map();
  
  // Track which contracts belong to which bot
  private botContracts: Map<number, string> = new Map(); // contract_id -> bot_id
  
  // Current dashboard symbol (for bots to trade)
  private currentDashboardSymbol: string = 'R_100';
  private chartData: any[] = [];

  setCurrentSymbol(symbol: string, chartData: any[]) {
    this.currentDashboardSymbol = symbol;
    this.chartData = chartData;
    console.log('AITE Core: Dashboard symbol set to', symbol, 'with', chartData.length, 'candles');
    
    // Save to localStorage
    try {
      localStorage.setItem('aite_current_symbol', symbol);
    } catch (e) {
      console.error('Failed to save symbol to storage', e);
    }
  }

  getCurrentSymbol(): string {
    return this.currentDashboardSymbol;
  }
  
  getChartData(): any[] {
    return this.chartData;
  }
  
  // Restore symbol from localStorage
  restoreSymbol(): string {
    try {
      const saved = localStorage.getItem('aite_current_symbol');
      if (saved) {
        this.currentDashboardSymbol = saved;
        console.log('AITE Core: Restored symbol', saved);
        return saved;
      }
    } catch (e) {
      console.error('Failed to restore symbol', e);
    }
    return this.currentDashboardSymbol;
  }

  connect(token?: string): Promise<void> {
    if (token) this.apiKey = token;
    
    // If already authorized and no new token provided, resolve immediately
    if (this.isAuthorized && !token && this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // If already connecting, return the existing promise
    if (this.connectionPromise && !token) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      // If we have an existing socket and we're providing a new token, close it
      if (this.socket && token) {
        this.socket.close();
        this.socket = null;
        this.isAuthorized = false;
      }
      
      if (this.socket) {
        if (this.socket.readyState === WebSocket.OPEN) {
           // We are open but not authorized (since we checked isAuthorized above)
           // Or we have a new token but didn't close (shouldn't happen with logic above)
        } else if (this.socket.readyState === WebSocket.CONNECTING) {
           this.authResolvers.push(resolve);
           this.authRejecters.push(reject);
           return;
        }
      }
      
      // Store resolvers for the authorization response
      this.authResolvers.push(resolve);
      this.authRejecters.push(reject);
      
      console.log('AITE Core: Initializing Deriv Neural Uplink...');
      const ws = new WebSocket(DERIV_WS_URL);
      this.socket = ws;

      ws.onopen = () => {
        console.log('AITE Core: Uplink Physical Layer Active. Authorizing...');
        this.reconnectAttempts = 0;
        this.authorize();
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('AITE Core: Message Parsing Error', e);
        }
      };

      ws.onerror = (err) => {
        console.error('AITE Core: WebSocket Error', err);
        this.authRejecters.forEach(rejecter => rejecter(err));
        this.authResolvers = [];
        this.authRejecters = [];
        this.connectionPromise = null;
        reject(err);
      };

      ws.onclose = () => {
        console.log('AITE Core: Uplink Severed.');
        this.socket = null;
        this.isAuthorized = false;
        this.connectionPromise = null;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`AITE Core: Attempting Re-sync in ${delay/1000}s... (Attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        } else {
          this.authRejecters.forEach(rejecter => rejecter(new Error('Connection closed and max retries reached')));
          this.authResolvers = [];
          this.authRejecters = [];
        }
      };
    });

    return this.connectionPromise;
  }

  private handleMessage(data: any) {
    // Notify all listeners first (important for switchAccount)
    this.notifyListeners(data);
    
    // Authorization response
    if (data.msg_type === 'authorize') {
      if (data.error) {
        console.error('AITE Core: Authorization Failed', data.error.message);
        this.authRejecters.forEach(rejecter => rejecter(new Error(data.error.message)));
        this.authResolvers = [];
        this.authRejecters = [];
        this.connectionPromise = null;
        return;
      }
      
      this.isAuthorized = true;
      
      console.log('AITE Core: Authorization successful, processing response...');
      console.log('Raw authorize data:', JSON.stringify(data.authorize, null, 2));
      
      // Process account list with full details
      const accountList = data.authorize.account_list || [];
      console.log('AITE Core: Found', accountList.length, 'accounts in authorize response');
      
      if (accountList.length === 0) {
        console.warn('AITE Core: WARNING - No accounts in account_list! This API token may not have access to account list.');
        // Add at least the current authorized account
        this.accounts = [{
          loginid: data.authorize.loginid,
          balance: data.authorize.balance ?? 0,
          currency: data.authorize.currency || 'USD',
          account_type: data.authorize.account_type || 'trading',
          is_virtual: data.authorize.is_virtual ?? 0,
          landing_company_name: data.authorize.landing_company_name || '',
          token: undefined
        }];
      } else {
        this.accounts = accountList.map((acc: any) => {
          const account = {
            loginid: acc.loginid,
            balance: acc.balance ?? 0,
            currency: acc.currency || 'USD',
            account_type: acc.account_type || 'trading',
            is_virtual: acc.is_virtual ?? 0,
            landing_company_name: acc.landing_company_name || '',
            token: acc.token
          };
          console.log('AITE Core: Loaded account:', account.loginid, '| Balance:', account.balance, account.currency, '| Type:', account.is_virtual ? 'DEMO' : 'REAL', '| Raw acc.balance:', acc.balance);
          return account;
        });
      }

      const accountTokens = this.accounts
        .filter(acc => acc.token)
        .map(acc => ({ loginid: acc.loginid, token: acc.token as string }));
      if (accountTokens.length > 0) {
        console.log('AITE Core: Storing tokens for', accountTokens.length, 'accounts');
        this.storeTokens(accountTokens);
      }
      
      this.currentAccount = {
        loginid: data.authorize.loginid,
        balance: data.authorize.balance ?? 0,
        currency: data.authorize.currency || 'USD',
        account_type: data.authorize.account_type || 'trading',
        is_virtual: data.authorize.is_virtual ?? 0,
        landing_company_name: data.authorize.landing_company_name || ''
      };
      
      console.log('AITE Core: Authorized successfully.');
      console.log('Current Account:', this.currentAccount.loginid, '(', this.currentAccount.is_virtual ? 'DEMO' : 'REAL', ')');
      console.log('Total Accounts Available:', this.accounts.length);
      this.accounts.forEach(acc => {
        console.log('  -', acc.loginid, ':', acc.balance, acc.currency, '(', acc.is_virtual ? 'DEMO' : 'REAL', ')');
      });
      
      // Resolve all authorization promises
      this.authResolvers.forEach(resolver => resolver());
      this.authResolvers = [];
      this.authRejecters = [];
      this.connectionPromise = null;
      console.log('Account:', this.currentAccount.loginid);
      console.log('Type:', this.currentAccount.is_virtual ? 'DEMO' : 'REAL');
      console.log('Balance:', this.currentAccount.balance, this.currentAccount.currency);
      console.log('Total Accounts:', this.accounts.length);
      
      // Subscribe to all account balances and fetch individual balances
      this.subscribeToBalance();
      this.fetchAllAccountBalances();
      this.fetchActiveSymbols();
      this.getOpenContracts();
      this.processQueue();
    }

    // Active symbols response
    if (data.msg_type === 'active_symbols' && !data.error) {
      this.activeSymbols = data.active_symbols || [];
      console.log('AITE Core: Loaded', this.activeSymbols.length, 'active symbols');
    }

    // Balance update
    if (data.msg_type === 'balance' && !data.error) {
      const balanceData = data.balance;
      
      console.log('AITE Core: Balance update -', balanceData.loginid, ':', balanceData.balance, balanceData.currency);
      
      // Update the account in the accounts array
      const accountIndex = this.accounts.findIndex(acc => acc.loginid === balanceData.loginid);
      if (accountIndex !== -1) {
        this.accounts[accountIndex] = {
          ...this.accounts[accountIndex],
          balance: balanceData.balance
        };
      }
      
      // If this balance update is for the current account, update it
      if (this.currentAccount && balanceData.loginid === this.currentAccount.loginid) {
        this.currentAccount.balance = balanceData.balance;
        console.log('AITE Core: Updated current account balance:', this.currentAccount.loginid, '=', this.currentAccount.balance, this.currentAccount.currency);
        
        // Notify listeners
        this.notifyListeners({
          msg_type: 'current_account_balance',
          balance: balanceData.balance,
          currency: balanceData.currency,
          loginid: balanceData.loginid
        });
      }
      
      // Notify listeners about the balance update for all accounts
      this.notifyListeners({
        msg_type: 'accounts_updated',
        accounts: this.accounts
      });
    }

    // Portfolio (open contracts)
    if (data.msg_type === 'portfolio' && !data.error) {
      this.openContracts = (data.portfolio.contracts || []).map((c: any) => ({
        contract_id: c.contract_id,
        contract_type: c.contract_type,
        currency: c.currency,
        buy_price: c.buy_price,
        payout: c.payout,
        profit: c.profit || 0,
        profit_percentage: c.profit_percentage || 0,
        status: c.status,
        is_sold: c.is_sold,
        symbol: c.symbol,
        date_start: c.date_start,
        date_expiry: c.date_expiry,
        entry_spot: c.entry_spot
      }));
    }

    // Buy response (trade executed)
    if (data.msg_type === 'buy' && !data.error) {
      console.log('AITE Core: Trade Executed', data.buy);
    }

    // Proposal open contract updates
    if (data.msg_type === 'proposal_open_contract' && !data.error) {
      const contract = data.proposal_open_contract;
      if (contract.is_sold) {
        // Contract closed, update bot stats
        this.handleContractClose(contract);
      }
    }

    // Notify all listeners
    this.listeners.forEach(cb => cb(data));
  }

  private handleContractClose(contract: any) {
    const contractId = contract.contract_id;
    const botId = this.botContracts.get(contractId);
    
    if (!botId) {
      // Contract doesn't belong to any bot, ignore
      return;
    }
    
    const bot = this.activeBots.get(botId);
    if (!bot) {
      // Bot no longer exists, cleanup
      this.botContracts.delete(contractId);
      return;
    }
    
    // Update bot stats with actual closed contract data
    const profit = contract.profit || 0;
    bot.profit += profit;
    bot.trades++;
    bot.openTrades = Math.max(0, bot.openTrades - 1);
    
    // Remove contract from tracking
    this.botContracts.delete(contractId);
    
    console.log(`AITE Core: Bot ${botId} - Contract ${contractId} closed. Profit: ${profit.toFixed(2)}, Total P&L: ${bot.profit.toFixed(2)}, Total Trades: ${bot.trades}, Open: ${bot.openTrades}`);
    
    // Save updated state
    this.saveBotState();
    
    // Martingale logic (only if bot is still running)
    if (bot.running && bot.settings.martingale) {
      if (profit < 0 && bot.currentStep < bot.settings.maxMartingaleSteps) {
        bot.currentStep++;
        bot.currentAmount *= bot.settings.martingaleMultiplier;
      } else {
        bot.currentStep = 0;
        bot.currentAmount = bot.settings.amount;
      }
    }
    
    // Check stop conditions (only if bot is still running)
    if (bot.running) {
      if (bot.profit >= bot.settings.takeProfit || 
          bot.profit <= -bot.settings.stopLoss ||
          bot.trades >= bot.settings.maxTrades) {
        console.log('AITE Core: Bot stopped - conditions met', botId);
        this.stopBot(botId);
        return;
      }
      
      // Add delay before next trade to prevent immediate execution
      console.log('AITE Core: Bot scheduling next trade in 3 seconds...', botId);
      setTimeout(() => {
        // Check if bot is still running before executing next trade
        const currentBot = this.activeBots.get(botId);
        if (currentBot && currentBot.running) {
          this.runBotTrade(botId);
        }
      }, 3000);
    }
  }

  private authorize() {
    if (!this.apiKey) {
      console.warn('AITE Core: No API key provided for authorization');
      this.authRejecters.forEach(rejecter => rejecter(new Error('No API key provided')));
      this.authResolvers = [];
      this.authRejecters = [];
      this.connectionPromise = null;
      return;
    }
    console.log('AITE Core: Authorizing with API key...');
    this.socket?.send(JSON.stringify({
      authorize: this.apiKey,
      req_id: Date.now()
    }));
  }

  private processQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.safeSend(msg);
    }
  }

  private safeSend(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isAuthorized) {
      this.socket.send(message);
    } else {
      this.messageQueue.push(message);
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }
  }

  // Update API key
  setApiKey(key: string) {
    this.apiKey = key;
    console.log('AITE Core: API key updated');
  }

  getApiKey(): string {
    return this.apiKey;
  }
  
  // Disconnect from Deriv
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isAuthorized = false;
    this.currentAccount = null;
    this.accounts = [];
    console.log('AITE Core: Disconnected');
  }
  
  // Validate and adjust trading parameters for symbol
  validateSymbolParameters(symbol: string, duration: number, durationUnit: string): { 
    duration: number; 
    durationUnit: string; 
    valid: boolean; 
    message?: string 
  } {
    if (symbol.startsWith('frx')) {
      // Forex pairs - require minimum 15 minutes for intraday trading
      // Forex doesn't support tick-based durations well
      if (durationUnit === 't') {
        return { 
          duration: 15, 
          durationUnit: 'm', 
          valid: true, 
          message: 'Forex requires time-based duration. Adjusted to 15 minutes for intraday trading.' 
        };
      } else if (durationUnit === 'm' && duration < 15) {
        return { 
          duration: 15, 
          durationUnit: 'm', 
          valid: true, 
          message: 'Forex requires minimum 15 minutes for intraday trading. Duration adjusted to 15m.' 
        };
      } else if (durationUnit === 's') {
        return { 
          duration: 15, 
          durationUnit: 'm', 
          valid: true, 
          message: 'Forex does not support seconds. Duration adjusted to 15m.' 
        };
      }
    } else if (symbol.includes('CRASH') || symbol.includes('BOOM')) {
      // Crash/Boom indices work best with ticks
      if (durationUnit === 'm') {
        return { 
          duration: 5, 
          durationUnit: 't', 
          valid: true, 
          message: 'Crash/Boom indices work best with ticks. Duration adjusted to 5t.' 
        };
      } else if (durationUnit === 't' && duration < 5) {
        return { 
          duration: 5, 
          durationUnit: 't', 
          valid: true, 
          message: 'Crash/Boom requires minimum 5 ticks. Duration adjusted to 5t.' 
        };
      }
    }
    // Volatility indices support most durations
    return { duration, durationUnit, valid: true };
  }
  
  // Get minimum stake for a symbol
  getMinimumStake(symbol: string): number {
    const symbolInfo = this.activeSymbols.find(s => s.symbol === symbol);
    
    // Default minimums based on symbol type
    if (symbol.startsWith('R_')) {
      return 0.35; // Volatility indices minimum
    } else if (symbol.includes('CRASH') || symbol.includes('BOOM')) {
      return 0.35;
    } else if (symbol.startsWith('frx')) {
      return 1; // Forex minimum
    }
    
    // Default fallback
    return 1;
  }

  // Switch between accounts (demo/real) - uses account list from admin token
  async switchAccount(loginid: string): Promise<boolean> {
    console.log('AITE Core: Attempting to switch to', loginid);
    console.log('AITE Core: Total accounts available:', this.accounts.length);
    console.log('AITE Core: Available account IDs:', this.accounts.map(a => a.loginid).join(', '));
    
    const account = this.accounts.find(acc => acc.loginid === loginid);
    if (!account) {
      const availableAccounts = this.accounts.map(a => `${a.loginid} (${a.is_virtual ? 'DEMO' : 'REAL'})`).join(', ');
      console.error('AITE Core: Account', loginid, 'not found in loaded accounts');
      console.error('AITE Core: Available accounts:', availableAccounts);
      throw new Error(`Account ${loginid} not found. Available: ${availableAccounts}`);
    }

    if (this.currentAccount?.loginid === loginid) {
      console.log('AITE Core: Already on account', loginid);
      return true;
    }
    
    console.log('AITE Core: Switching to account', loginid);
    
    // Update the current account reference - no need to re-authorize with admin token
    this.currentAccount = {
      loginid: account.loginid,
      balance: account.balance,
      currency: account.currency,
      account_type: account.account_type,
      is_virtual: account.is_virtual,
      landing_company_name: account.landing_company_name
    };
    
    console.log('AITE Core: Successfully switched to', this.currentAccount.loginid);
    console.log('Balance:', this.currentAccount.balance, this.currentAccount.currency);
    console.log('Account Type:', this.currentAccount.is_virtual ? 'DEMO' : 'REAL');
    
    // Notify listeners about the switch
    this.notifyListeners({ 
      msg_type: 'account_switched', 
      account: this.currentAccount 
    });
    
    return true;
  }
  
  // Get stored OAuth tokens from localStorage
  getStoredTokens(): Record<string, string> {
    try {
      const tokens = localStorage.getItem('deriv_account_tokens');
      return tokens ? JSON.parse(tokens) : {};
    } catch {
      return {};
    }
  }
  
  // Store token for an account
  storeToken(loginid: string, token: string) {
    const tokens = this.getStoredTokens();
    tokens[loginid] = token;
    localStorage.setItem('deriv_account_tokens', JSON.stringify(tokens));
    console.log('AITE Core: Stored token for account', loginid);
  }
  
  // Store multiple tokens (from OAuth callback)
  storeTokens(accountTokens: Array<{ loginid: string; token: string }>) {
    const tokens = this.getStoredTokens();
    accountTokens.forEach(({ loginid, token }) => {
      tokens[loginid] = token;
    });
    localStorage.setItem('deriv_account_tokens', JSON.stringify(tokens));
    console.log('AITE Core: Stored tokens for', accountTokens.length, 'accounts');
  }
  
  // Clear all stored tokens (logout)
  clearTokens() {
    localStorage.removeItem('deriv_account_tokens');
    console.log('AITE Core: Cleared all stored tokens');
  }
  
  // Get OAuth URL for Deriv login
  getOAuthUrl(): string {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    return `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN&brand=deriv&redirect_uri=${redirectUri}`;
  }
  
  // Process OAuth callback - call this when page loads with OAuth tokens in URL
  processOAuthCallback(): Promise<boolean> | boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const accounts: Array<{ loginid: string; token: string }> = [];
    
    // Deriv OAuth returns tokens as: acct1=XXX&token1=YYY&acct2=AAA&token2=BBB...
    let i = 1;
    while (urlParams.has(`acct${i}`) && urlParams.has(`token${i}`)) {
      const loginid = urlParams.get(`acct${i}`)!;
      const token = urlParams.get(`token${i}`)!;
      accounts.push({ loginid, token });
      i++;
    }
    
    if (accounts.length > 0) {
      console.log('AITE Core: OAuth callback detected with', accounts.length, 'accounts');
      this.storeTokens(accounts);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Connect with the first account's token
      return this.connect(accounts[0].token).then(() => true).catch(() => false);
    }
    
    return false;
  }

  // Get demo accounts only
  getDemoAccounts(): DerivAccount[] {
    return this.accounts.filter(acc => acc.is_virtual === 1);
  }

  // Get real accounts only
  getRealAccounts(): DerivAccount[] {
    return this.accounts.filter(acc => acc.is_virtual === 0);
  }

  fetchActiveSymbols() {
    this.safeSend(JSON.stringify({
      active_symbols: 'brief',
      product_type: 'basic'
    }));
  }

  getActiveSymbols(): any[] {
    return this.activeSymbols;
  }

  subscribeToBalance() {
    this.safeSend(JSON.stringify({
      balance: 1,
      subscribe: 1,
      account: 'all'
    }));
  }

  fetchAllAccountBalances() {
    console.log('AITE Core: Fetching balances for', this.accounts.length, 'accounts');
    
    // For accounts with individual tokens, authorize and get balance
    this.accounts.forEach(account => {
      if (account.token) {
        // Use individual account token to get accurate balance
        const reqId = `balance_${account.loginid}_${Date.now()}`;
        this.safeSend(JSON.stringify({
          authorize: account.token,
          req_id: reqId
        }));
      }
    });
    
    // If no individual tokens, the balance from account_list should be used
    // which was already loaded during initial authorization
    if (!this.accounts.some(acc => acc.token)) {
      console.log('AITE Core: No individual tokens found, using balances from account_list');
    }
  }

  fetchHistory(symbol: string, granularity: number = 60) {
    this.safeSend(JSON.stringify({ forget_all: "ticks" }));
    this.safeSend(JSON.stringify({ forget_all: "candles" }));

    this.safeSend(JSON.stringify({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 1000,
      end: "latest",
      granularity: granularity,
      style: "candles",
      subscribe: 1
    }));
    
    this.safeSend(JSON.stringify({
      ticks: symbol,
      subscribe: 1
    }));
  }

  subscribeToTicks(symbols: string[]) {
    symbols.forEach(symbol => {
      if (!this.tickSubscriptions.has(symbol)) {
        this.safeSend(JSON.stringify({
          ticks: symbol,
          subscribe: 1
        }));
        this.tickSubscriptions.set(symbol, Date.now());
      }
    });
  }

  unsubscribeFromTicks(symbol: string) {
    this.safeSend(JSON.stringify({
      forget_all: 'ticks'
    }));
    this.tickSubscriptions.delete(symbol);
  }

  // Get price proposal before trading
  async getProposal(
    symbol: string, 
    amount: number, 
    contractType: string, 
    duration: number = 1, 
    durationUnit: string = 'm'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      const handler = (data: any) => {
        if (data.msg_type === 'proposal' && data.req_id === reqId) {
          this.listeners.delete(handler);
          if (data.error) reject(data.error);
          else resolve(data.proposal);
        }
      };
      this.addListener(handler);
      
      this.safeSend(JSON.stringify({
        proposal: 1,
        req_id: reqId,
        amount: amount,
        basis: 'stake',
        contract_type: contractType,
        currency: this.currentAccount?.currency || 'USD',
        duration: duration,
        duration_unit: durationUnit,
        symbol: symbol
      }));

      // Timeout after 10 seconds
      setTimeout(() => {
        this.listeners.delete(handler);
        reject(new Error('Proposal request timeout'));
      }, 10000);
    });
  }

  // Place a trade
  async placeTrade(
    symbol: string, 
    amount: number, 
    contractType: 'CALL' | 'PUT' | 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF',
    duration: number = 1,
    durationUnit: string = 'm',
    barrier?: number
  ): Promise<TradeResult> {
    // Check if authorized and account is available
    if (!this.isAuthorized || !this.currentAccount) {
      throw new Error('Please authorize your account first');
    }

    console.log('AITE Core: Requesting proposal for trade...', {
      symbol,
      amount,
      contractType,
      duration,
      durationUnit,
      balance: this.currentAccount.balance,
      currency: this.currentAccount.currency
    });

    // Step 1: Get proposal
    return new Promise(async (resolve, reject) => {
      try {
        const proposalReqId = Date.now();
        let proposalId: string | null = null;

        const proposalHandler = (data: any) => {
          if (data.msg_type === 'proposal' && data.req_id === proposalReqId) {
            this.listeners.delete(proposalHandler);
            
            if (data.error) {
              console.error('AITE Core: Proposal error', data.error);
              reject(data.error);
              return;
            }

            proposalId = data.proposal.id;
            console.log('AITE Core: Proposal received', proposalId, 'Ask price:', data.proposal.ask_price);

            // Step 2: Buy the proposal
            const buyReqId = Date.now() + 1;
            
            const buyHandler = (buyData: any) => {
              if (buyData.msg_type === 'buy' && buyData.req_id === buyReqId) {
                this.listeners.delete(buyHandler);
                
                if (buyData.error) {
                  console.error('AITE Core: Buy error', buyData.error);
                  reject(buyData.error);
                } else {
                  console.log('AITE Core: Trade executed successfully', buyData.buy);
                  resolve({
                    contract_id: buyData.buy.contract_id,
                    balance_after: buyData.buy.balance_after,
                    buy_price: buyData.buy.buy_price,
                    payout: buyData.buy.payout,
                    start_time: buyData.buy.start_time,
                    transaction_id: buyData.buy.transaction_id
                  });
                }
              }
            };
            
            this.addListener(buyHandler);
            
            // Send buy request
            this.safeSend(JSON.stringify({
              buy: proposalId,
              price: data.proposal.ask_price,
              req_id: buyReqId,
              loginid: this.currentAccount.loginid
            }));

            // Buy timeout
            setTimeout(() => {
              this.listeners.delete(buyHandler);
              reject(new Error('Buy execution timeout'));
            }, 30000);
          }
        };

        this.addListener(proposalHandler);

        // Send proposal request
        const proposalParams: any = {
          proposal: 1,
          req_id: proposalReqId,
          amount: amount,
          basis: 'stake',
          contract_type: contractType,
          currency: this.currentAccount.currency,
          duration: duration,
          duration_unit: durationUnit,
          symbol: symbol,
          loginid: this.currentAccount.loginid
        };

        if (barrier !== undefined) {
          proposalParams.barrier = barrier;
        }

        this.safeSend(JSON.stringify(proposalParams));

        // Proposal timeout
        setTimeout(() => {
          if (!proposalId) {
            this.listeners.delete(proposalHandler);
            reject(new Error('Proposal request timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Sell an open contract
  async sellContract(contractId: number, price?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const reqId = Date.now();
      let resolved = false;
      
      const handler = (data: any) => {
        // Check for sell response with matching req_id or contract_id
        if (data.msg_type === 'sell' && data.req_id === reqId) {
          this.listeners.delete(handler);
          resolved = true;
          
          if (data.error) {
            console.error('AITE Core: Sell error', data.error);
            reject(data.error);
          } else {
            console.log('AITE Core: Contract sold successfully', contractId, 'Sold for:', data.sell?.sold_for);
            resolve(data.sell);
          }
        }
      };
      
      this.addListener(handler);
      
      console.log('AITE Core: Selling contract', contractId);
      this.safeSend(JSON.stringify({
        sell: contractId,
        price: price || 0,
        req_id: reqId
      }));

      setTimeout(() => {
        if (!resolved) {
          this.listeners.delete(handler);
          reject(new Error('Sell request timeout'));
        }
      }, 15000);
    });
  }

  getOpenContracts() {
    this.safeSend(JSON.stringify({
      portfolio: 1
    }));
  }

  subscribeToContract(contractId: number) {
    this.safeSend(JSON.stringify({
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1
    }));
  }

  getProfitTable(limit: number = 50) {
    this.safeSend(JSON.stringify({
      profit_table: 1,
      description: 1,
      limit: limit,
      sort: 'DESC'
    }));
  }

  getStatement(limit: number = 100) {
    this.safeSend(JSON.stringify({
      statement: 1,
      description: 1,
      limit: limit
    }));
  }

  // ============ BOT MANAGEMENT ============

  startBot(botId: string, settings: BotSettings): boolean {
    if (this.activeBots.has(botId) && this.activeBots.get(botId)?.running) {
      console.log('Bot already running:', botId);
      return false;
    }

    this.activeBots.set(botId, {
      settings,
      running: true,
      trades: 0,
      openTrades: 0,
      profit: 0,
      currentStep: 0,
      currentAmount: settings.amount
    });

    console.log('AITE Core: Bot Started -', botId);
    this.saveBotState();
    this.runBotTrade(botId);
    return true;
  }

  async stopBot(botId: string): Promise<boolean> {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.running = false;
      console.log('AITE Core: Bot Stopped -', botId, 'Profit:', bot.profit);
      
      // Get fresh portfolio data before closing
      this.getOpenContracts();
      
      // Wait a moment for portfolio to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Close all open positions for this bot
      const botContractIds: number[] = [];
      this.botContracts.forEach((bid, contractId) => {
        if (bid === botId) {
          botContractIds.push(contractId);
        }
      });
      
      if (botContractIds.length > 0) {
        console.log(`AITE Core: Bot ${botId} has ${botContractIds.length} tracked contracts. Attempting to close...`);
        
        // Notify user
        this.notifyListeners({
          msg_type: 'bot_info',
          bot_id: botId,
          message: `Closing ${botContractIds.length} open positions...`
        });
        
        let closedCount = 0;
        let expiredCount = 0;
        
        for (const contractId of botContractIds) {
          try {
            // Try to sell the contract
            await this.sellContract(contractId);
            closedCount++;
            console.log(`AITE Core: Successfully closed position ${contractId}`);
          } catch (e: any) {
            const errorMsg = e.message || e.error?.message || String(e);
            
            if (errorMsg.includes('Resale') || errorMsg.includes('not offered')) {
              // Contract expired or can't be sold
              expiredCount++;
              console.log(`AITE Core: Position ${contractId} already expired or can't be sold`);
            } else {
              console.error(`AITE Core: Failed to close position ${contractId}:`, errorMsg);
            }
          } finally {
            // Remove from tracking regardless
            this.botContracts.delete(contractId);
          }
        }
        
        console.log(`AITE Core: Bot ${botId} cleanup complete. Closed: ${closedCount}, Expired: ${expiredCount}`);
        
        // Notify completion
        this.notifyListeners({
          msg_type: 'bot_info',
          bot_id: botId,
          message: `Closed ${closedCount} positions, ${expiredCount} already expired`
        });
      } else {
        console.log(`AITE Core: Bot ${botId} has no open positions to close`);
      }
      
      // Reset open trades count
      bot.openTrades = 0;
      
      this.saveBotState();
      
      // Refresh portfolio after closing
      setTimeout(() => this.getOpenContracts(), 1000);
      
      return true;
    }
    return false;
  }

  // Save bot state to localStorage
  private saveBotState() {
    try {
      const botData: any[] = [];
      this.activeBots.forEach((bot, id) => {
        if (bot.running) {
          botData.push({
            id,
            settings: bot.settings,
            trades: bot.trades,
            profit: bot.profit,
            currentStep: bot.currentStep,
            currentAmount: bot.currentAmount
          });
        }
      });
      localStorage.setItem('aite_running_bots', JSON.stringify(botData));
      console.log('AITE Core: Saved', botData.length, 'running bots to storage');
    } catch (e) {
      console.error('AITE Core: Failed to save bot state', e);
    }
  }

  // Restore bot state from localStorage
  restoreBots() {
    try {
      const saved = localStorage.getItem('aite_running_bots');
      if (!saved) return;
      
      const botData = JSON.parse(saved);
      console.log('AITE Core: Restoring', botData.length, 'bots from storage');
      
      botData.forEach((bot: any) => {
        this.activeBots.set(bot.id, {
          settings: bot.settings,
          running: true,
          trades: bot.trades || 0,
          openTrades: 0, // Reset open trades on restore
          profit: bot.profit || 0,
          currentStep: bot.currentStep || 0,
          currentAmount: bot.currentAmount || bot.settings.amount
        });
        
        // Restart the bot trading
        console.log('AITE Core: Restarting bot', bot.id);
        this.runBotTrade(bot.id);
      });
    } catch (e) {
      console.error('AITE Core: Failed to restore bots', e);
    }
  }

  // Get total stats across all bots
  getTotalBotStats() {
    let totalTrades = 0;
    let totalProfit = 0;
    
    this.activeBots.forEach(bot => {
      totalTrades += bot.trades;
      totalProfit += bot.profit;
    });
    
    return { totalTrades, totalProfit };
  }

  getBotStatus(botId: string) {
    return this.activeBots.get(botId);
  }

  getAllBotsStatus() {
    const status: Record<string, any> = {};
    this.activeBots.forEach((bot, id) => {
      status[id] = {
        running: bot.running,
        trades: bot.trades,
        openTrades: bot.openTrades,
        profit: bot.profit,
        currentStep: bot.currentStep,
        currentAmount: bot.currentAmount
      };
    });
    return status;
  }

  private async runBotTrade(botId: string) {
    const bot = this.activeBots.get(botId);
    if (!bot || !bot.running) return;

    // Check authorization and account balance
    if (!this.isAuthorized || !this.currentAccount) {
      console.error('AITE Core: Bot cannot trade - Not authorized');
      bot.running = false;
      this.notifyListeners({
        msg_type: 'bot_error',
        bot_id: botId,
        error: { message: 'Please authorize your account first' }
      });
      return;
    }

    const currentBalance = this.currentAccount.balance;
    if (currentBalance < bot.currentAmount) {
      console.error('AITE Core: Insufficient balance -', currentBalance, 'needed', bot.currentAmount);
      bot.running = false;
      this.notifyListeners({
        msg_type: 'bot_error',
        bot_id: botId,
        error: { message: `Insufficient balance (${currentBalance} ${this.currentAccount.currency})` }
      });
      return;
    }

    try {
      // Use bot's configured symbol (fallback to dashboard symbol if not set)
      const tradeSymbol = bot.settings.symbol || this.currentDashboardSymbol;
      const chartData = this.chartData;
      
      console.log('AITE Core: Bot analyzing market -', botId, 'Symbol:', tradeSymbol);
      
      // Get minimum stake for the selected symbol
      const minStake = this.getMinimumStake(tradeSymbol);
      if (bot.currentAmount < minStake) {
        bot.currentAmount = minStake;
        console.log('AITE Core: Amount adjusted to minimum stake:', minStake, 'for', tradeSymbol);
      }
      
      // Validate and adjust parameters for the symbol
      const validation = this.validateSymbolParameters(
        tradeSymbol, 
        bot.settings.duration, 
        bot.settings.durationUnit
      );
      
      if (!validation.valid) {
        console.error('AITE Core: Invalid parameters for symbol', tradeSymbol);
        this.notifyListeners({
          msg_type: 'bot_error',
          bot_id: botId,
          error: { message: `Cannot trade ${tradeSymbol}: ${validation.message}` }
        });
        setTimeout(() => this.runBotTrade(botId), 30000);
        return;
      }
      
      if (validation.message) {
        console.log('AITE Core:', validation.message);
        this.notifyListeners({
          msg_type: 'bot_info',
          bot_id: botId,
          message: validation.message
        });
      }
      
      let contractType = bot.settings.contractType;
      let duration = validation.duration;
      let durationUnit = validation.durationUnit;
      
      // If AI mode is enabled, perform technical analysis
      if (bot.settings.useAI && chartData.length >= 50) {
        console.log('AITE Core: AI mode enabled, running technical analysis...');
        
        // Calculate technical indicators
        const closes = chartData.map(c => c.close);
        const highs = chartData.map(c => c.high);
        const lows = chartData.map(c => c.low);
        
        const rsi = TechnicalIndicators.calculateRSI(closes, bot.settings.rsiPeriod || 14);
        const macd = TechnicalIndicators.calculateMACD(
          closes,
          bot.settings.macdFast || 12,
          bot.settings.macdSlow || 26,
          bot.settings.macdSignal || 9
        );
        const bb = TechnicalIndicators.calculateBollingerBands(
          closes,
          bot.settings.bbPeriod || 20,
          bot.settings.bbStdDev || 2
        );
        const stochastic = TechnicalIndicators.calculateStochastic(
          highs,
          lows,
          closes,
          bot.settings.stochPeriod || 14
        );
        const ema = TechnicalIndicators.calculateEMA(closes, bot.settings.emaPeriod || 20);
        const sma = TechnicalIndicators.calculateSMA(closes, bot.settings.smaPeriod || 50);
        
        // Import jarvis dynamically
        const { jarvis } = await import('./geminiService');
        
        // Get AI signal
        const signal = await jarvis.scanMarketOpportunities(chartData, {
          rsi, macd, bb, stochastic, ema, sma
        });
        
        console.log('AITE Core: AI Signal -', signal.action, 'Strength:', signal.strength, 'Confidence:', signal.confidence);
        console.log('AITE Core: Reasons:', signal.reasons.join(', '));
        
        // Check if signal meets minimum requirements
        const minStrength = bot.settings.minSignalStrength || 60;
        if (signal.strength < minStrength) {
          console.log(`AITE Core: Signal strength ${signal.strength} below threshold ${minStrength}, waiting...`);
          setTimeout(() => this.runBotTrade(botId), 30000); // Check again in 30 seconds
          return;
        }
        
        if (signal.action === 'WAIT') {
          console.log('AITE Core: AI recommends waiting, no clear opportunity');
          setTimeout(() => this.runBotTrade(botId), 15000); // Check again in 15 seconds
          return;
        }
        
        // Use AI-recommended action
        contractType = signal.action;
        
        // Notify listeners of signal
        this.notifyListeners({
          msg_type: 'bot_signal',
          bot_id: botId,
          signal: signal,
          symbol: tradeSymbol
        });
      }
      
      console.log('AITE Core: Bot placing trade -', botId, 'Symbol:', tradeSymbol, 'Type:', contractType, 'Amount:', bot.currentAmount, 'Duration:', duration, durationUnit, 'Balance:', currentBalance, this.currentAccount.currency, 'Account:', this.currentAccount.loginid);
      
      const result = await this.placeTrade(
        tradeSymbol,
        bot.currentAmount,
        contractType,
        duration,
        durationUnit
      );

      console.log('AITE Core: Bot Trade Executed -', botId, result);
      
      // Track this contract as belonging to this bot
      this.botContracts.set(result.contract_id, botId);
      bot.openTrades++;
      
      console.log(`AITE Core: Bot ${botId} now has ${bot.openTrades} open trades`);
      
      // Reset retry count on successful trade
      (bot as any).retryCount = 0;
      
      // Subscribe to contract updates
      this.subscribeToContract(result.contract_id);

    } catch (error: any) {
      console.error('AITE Core: Bot Trade Error -', botId, error);
      
      // Notify about the error
      this.notifyListeners({
        msg_type: 'bot_error',
        bot_id: botId,
        error: error
      });
      
      // Stop bot on critical errors
      if (error && (
        error.code === 'InsufficientBalance' ||
        error.code === 'AuthorizationRequired' ||
        error.message?.includes('insufficient') ||
        error.message?.includes('not authorized')
      )) {
        console.error('AITE Core: Bot stopped due to critical error -', botId);
        bot.running = false;
        return;
      }
      
      // Retry after delay if still running (max 3 retries)
      if (bot.running) {
        const retryCount = (bot as any).retryCount || 0;
        if (retryCount < 3) {
          (bot as any).retryCount = retryCount + 1;
          setTimeout(() => this.runBotTrade(botId), 5000);
        } else {
          console.error('AITE Core: Bot stopped after max retries -', botId);
          bot.running = false;
        }
      }
    }
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  getIsAuthorized() {
    return this.isAuthorized;
  }

  addListener(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback: (data: any) => void) {
    this.listeners.delete(callback);
  }
}

export const deriv = new DerivService();
