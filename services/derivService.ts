
// Deriv API Key: YpvqfDXnUSo7gF1
const APP_ID = 1089;
const DERIV_WS_URL = `wss://re.derivws.com/websockets/v3?app_id=${APP_ID}`;

export interface DerivAccount {
  loginid: string;
  balance: number;
  currency: string;
  account_type: string;
  is_virtual: number;
}

export class DerivService {
  private socket: WebSocket | null = null;
  private listeners: Set<(data: any) => void> = new Set();
  private apiKey: string = 'YpvqfDXnUSo7gF1';
  private messageQueue: string[] = [];
  private isAuthorized: boolean = false;
  public accounts: DerivAccount[] = [];
  public currentAccount: DerivAccount | null = null;

  connect() {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) return;
      if (this.socket.readyState === WebSocket.CONNECTING) return;
    }
    
    console.log('AITE Core: Initializing Deriv Neural Uplink...');
    const ws = new WebSocket(DERIV_WS_URL);
    this.socket = ws;

    ws.onopen = () => {
      console.log('AITE Core: Uplink Physical Layer Active. Authorizing...');
      this.authorize();
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        
        if (data.msg_type === 'authorize' && !data.error) {
          this.isAuthorized = true;
          this.accounts = data.authorize.account_list || [];
          this.currentAccount = {
            loginid: data.authorize.loginid,
            balance: data.authorize.balance,
            currency: data.authorize.currency,
            account_type: data.authorize.account_type,
            is_virtual: data.authorize.is_virtual
          };
          console.log('AITE Core: Authorized successfully. Account List Syncing...');
          this.subscribeToBalance();
          this.processQueue();
        }

        if (data.msg_type === 'balance' && !data.error) {
          const balanceData = data.balance;
          if (this.currentAccount && balanceData.loginid === this.currentAccount.loginid) {
            this.currentAccount.balance = balanceData.balance;
          }
          
          this.accounts = this.accounts.map(acc => 
            acc.loginid === balanceData.loginid 
              ? { ...acc, balance: balanceData.balance } 
              : acc
          );
        }

        this.listeners.forEach(cb => cb(data));
      } catch (e) {
        console.error('AITE Core: Message Parsing Error', e);
      }
    };

    ws.onclose = () => {
      console.log('AITE Core: Uplink Severed. Attempting Re-sync in 5s...');
      this.socket = null;
      this.isAuthorized = false;
      setTimeout(() => this.connect(), 5000);
    };
  }

  private authorize() {
    this.socket?.send(JSON.stringify({
      authorize: this.apiKey
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

  subscribeToBalance() {
    this.safeSend(JSON.stringify({
      balance: 1,
      subscribe: 1
    }));
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
    
    // Also subscribe to raw ticks for depth simulation
    this.safeSend(JSON.stringify({
      ticks: symbol,
      subscribe: 1
    }));
  }

  // Simulated trade execution (Deriv API uses contracts for Buy/Sell)
  async placeTrade(symbol: string, amount: number, type: 'CALL' | 'PUT') {
    return new Promise((resolve, reject) => {
        const handler = (data: any) => {
            if (data.msg_type === 'buy') {
                this.listeners.delete(handler);
                if (data.error) reject(data.error);
                else resolve(data.buy);
            }
        };
        this.addListener(handler);
        
        // For actual trading, one first gets a proposal, then buys. 
        // We'll simulate a rise/fall contract for the demo.
        this.safeSend(JSON.stringify({
            buy: 1,
            price: amount,
            subscribe: 1,
            parameters: {
                amount: amount,
                basis: 'stake',
                contract_type: type,
                currency: 'USD',
                duration: 1,
                duration_unit: 'm',
                symbol: symbol
            }
        }));
    });
  }

  getIsAuthorized() {
    return this.isAuthorized;
  }

  addListener(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const deriv = new DerivService();
