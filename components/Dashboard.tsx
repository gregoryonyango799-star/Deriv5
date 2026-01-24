
import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { MarketRegime, BotStrategy, PsychologyMetrics } from '../types';
import { INITIAL_BOTS } from '../constants';
import { deriv, DerivAccount } from '../services/derivService';
import { jarvis } from '../services/geminiService';
import { MarketWatch } from './MarketWatch';

interface TickDepth {
    price: number;
    time: number;
    side: 'up' | 'down' | 'neutral';
}

export const Dashboard: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [marketRegime] = useState<MarketRegime>('Trending');
  const [bots] = useState<BotStrategy[]>(INITIAL_BOTS);
  const [psychology] = useState<PsychologyMetrics>({
    overallScore: 82,
    discipline: 75,
    emotionalControl: 90,
    riskManagement: 85
  });
  
  const [accounts, setAccounts] = useState<DerivAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState({
    balance: 0,
    currency: 'USD',
    loginid: 'Neural-Sync'
  });

  const [lastTick, setLastTick] = useState<number>(0);
  const [depth, setDepth] = useState<TickDepth[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [symbol, setSymbol] = useState('frxEURUSD');
  const [granularity, setGranularity] = useState(60); 
  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  const handleMarketSelect = (newSymbol: string) => {
    setSymbol(newSymbol);
    setDepth([]);
  };

  // Immediate sync check
  useEffect(() => {
    deriv.connect();
    if (deriv.accounts.length > 0) {
      setAccounts(deriv.accounts);
      if (deriv.currentAccount) {
        setSelectedAccountId(deriv.currentAccount.loginid);
        setCurrentBalance({
          balance: deriv.currentAccount.balance,
          currency: deriv.currentAccount.currency,
          loginid: deriv.currentAccount.loginid
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.1)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: window.innerWidth < 768 ? 320 : 400,
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: window.innerWidth < 768 ? 320 : 400
        });
      }
    };

    window.addEventListener('resize', handleResize);
    deriv.fetchHistory(symbol, granularity);

    const unsub = deriv.addListener((data) => {
      if ((data.msg_type === 'candles' || data.msg_type === 'history') && (data.candles || data.history)) {
        const sourceData = data.candles || [];
        const formatted: CandlestickData[] = sourceData.map((c: any) => ({
          time: c.epoch,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
        }));
        setChartData(formatted);
        candlestickSeries.setData(formatted);
        chart.timeScale().fitContent();
      }

      if (data.msg_type === 'ohlc' && data.ohlc.symbol === symbol) {
        candlestickSeries.update({
          time: data.ohlc.open_time,
          open: parseFloat(data.ohlc.open),
          high: parseFloat(data.ohlc.high),
          low: parseFloat(data.ohlc.low),
          close: parseFloat(data.ohlc.close),
        });
      }

      if (data.msg_type === 'tick' && data.tick.symbol === symbol) {
        const price = data.tick.quote;
        setLastTick(price);
        setDepth(prev => {
            const side = prev.length > 0 ? (price > prev[0].price ? 'up' : price < prev[0].price ? 'down' : 'neutral') : 'neutral';
            return [{ price, time: data.tick.epoch, side }, ...prev].slice(0, 10);
        });
      }

      if (data.msg_type === 'authorize' && !data.error) {
        setAccounts(data.authorize.account_list || []);
        setSelectedAccountId(data.authorize.loginid);
        setCurrentBalance({
          balance: data.authorize.balance,
          currency: data.authorize.currency,
          loginid: data.authorize.loginid
        });
      }

      if (data.msg_type === 'balance' && !data.error) {
        if (data.balance.loginid === selectedAccountId || !selectedAccountId) {
            setCurrentBalance(prev => ({
              ...prev,
              balance: data.balance.balance,
              loginid: data.balance.loginid
            }));
        }
        setAccounts(prev => prev.map(acc => acc.loginid === data.balance.loginid ? { ...acc, balance: data.balance.balance } : acc));
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      unsub();
    };
  }, [symbol, granularity, selectedAccountId]);

  const handleAccountChange = (loginid: string) => {
    setSelectedAccountId(loginid);
    const acc = accounts.find(a => a.loginid === loginid);
    if (acc) {
      setCurrentBalance({
        balance: acc.balance,
        currency: acc.currency,
        loginid: acc.loginid
      });
    }
  };

  const triggerAIAnalysis = async () => {
    if (chartData.length === 0) return;
    setIsAnnotating(true);
    const annotations = await jarvis.analyzeChartData(chartData.slice(-50));
    if (seriesRef.current) {
      const markers = (annotations || []).map((ann: any) => ({
        time: chartData[chartData.length - 1 - ann.index]?.time || chartData[chartData.length-1].time,
        position: ann.label.toLowerCase().includes('sell') ? 'aboveBar' : 'belowBar',
        color: ann.label.toLowerCase().includes('sell') ? '#f43f5e' : '#10b981',
        shape: ann.label.toLowerCase().includes('sell') ? 'arrowDown' : 'arrowUp',
        text: ann.label,
      }));
      seriesRef.current.setMarkers(markers);
    }
    setIsAnnotating(false);
  };

  const executeTrade = async (type: 'CALL' | 'PUT') => {
    setIsExecuting(true);
    try {
        await deriv.placeTrade(symbol, 10, type);
        alert(`Uplink Confirmed: ${type} order executed successfully.`);
    } catch (e: any) {
        alert(`Neural Failure: ${e.message || 'Execution error.'}`);
    }
    setIsExecuting(false);
  };

  const buyPressure = depth.filter(d => d.side === 'up').length * 10;
  const sellPressure = depth.filter(d => d.side === 'down').length * 10;

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 animate-in fade-in duration-700">
      {/* Account Info Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-full lg:min-w-[300px] bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden group">
           <p className="text-gray-500 text-[9px] uppercase font-black tracking-[0.2em] mb-2">Neural Link Account</p>
           <select 
             value={selectedAccountId}
             onChange={(e) => handleAccountChange(e.target.value)}
             className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-cyan-400 outline-none focus:border-cyan-500/50 appearance-none shadow-xl"
           >
             {accounts.length > 0 ? accounts.map(acc => (
               <option key={acc.loginid} value={acc.loginid} className="bg-[#0a0a16] text-white">
                 {acc.loginid} — {acc.balance.toLocaleString()} {acc.currency}
               </option>
             )) : <option value="">Establishing Sync...</option>}
           </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          {[
            { label: 'Balance', val: `${currentBalance.balance.toLocaleString()} ${currentBalance.currency}`, col: 'cyan' },
            { label: 'Neuro-Health', val: `${psychology.overallScore}/100`, col: 'purple' },
            { label: 'Market State', val: marketRegime, col: 'amber' }
          ].map((stat, i) => (
            <div key={i} className={`glass-panel p-3 px-4 rounded-2xl border-l-4 border-${stat.col}-500 flex flex-col justify-center`}>
              <p className="text-gray-500 text-[8px] uppercase font-black tracking-widest mb-1">{stat.label}</p>
              <h2 className="text-base md:text-lg font-black font-mono tracking-tighter text-white">{stat.val}</h2>
            </div>
          ))}
        </div>
      </div>

      <MarketWatch onSelect={handleMarketSelect} activeSymbol={symbol} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-3xl min-h-[450px] md:h-[580px] relative overflow-hidden flex flex-col border border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 z-10">
            <div className="flex flex-col">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 Terminal <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </h3>
               <span className="text-[8px] text-gray-500 font-mono">{symbol} | SYNCED</span>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              {[60, 300, 3600, 86400].map(val => (
                <button 
                  key={val}
                  onClick={() => setGranularity(val)}
                  className={`text-[9px] font-mono px-3 py-1.5 rounded flex-shrink-0 transition-colors ${granularity === val ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  {val === 60 ? 'M1' : val === 300 ? 'M5' : val === 3600 ? 'H1' : 'D1'}
                </button>
              ))}
              <button 
                onClick={triggerAIAnalysis}
                className="ml-auto sm:ml-2 text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full border border-cyan-500/30 bg-black/40 text-cyan-400"
              >
                {isAnnotating ? '...' : 'Annotate'}
              </button>
            </div>
          </div>

          <div className="flex-1 w-full relative min-h-[250px]">
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-[#0a0a16]/90 px-3 py-2 rounded-xl border border-cyan-500/20 backdrop-blur-xl z-10">
               <span className="text-lg md:text-xl font-mono font-black text-white">{lastTick ? lastTick.toFixed(lastTick > 100 ? 2 : 5) : '---'}</span>
               <span className="text-[9px] font-mono font-bold text-cyan-400">{symbol}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-black/40">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">Neural Depth (DOM)</h3>
              <div className="flex gap-1 h-3 w-full bg-gray-900 rounded-full overflow-hidden mb-3">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${buyPressure || 50}%` }} />
                  <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${sellPressure || 50}%` }} />
              </div>
              <div className="space-y-1">
                  {depth.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-mono p-1">
                          <span className={d.side === 'up' ? 'text-emerald-400' : 'text-rose-400'}>{d.side === 'up' ? '▲ ASK' : '▼ BID'}</span>
                          <span className="text-white font-bold">{d.price.toFixed(5)}</span>
                      </div>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <button 
                disabled={isExecuting}
                onClick={() => executeTrade('CALL')}
                className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 text-white disabled:opacity-50"
            >
              BUY / LONG
            </button>
            <button 
                disabled={isExecuting}
                onClick={() => executeTrade('PUT')}
                className="bg-rose-600 hover:bg-rose-500 py-6 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 text-white disabled:opacity-50"
            >
              SELL / SHORT
            </button>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-950/20 to-transparent">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3">Fleet Monitoring</h3>
               <div className="space-y-3">
                 {bots.slice(0, 2).map(bot => (
                    <div key={bot.id} className="space-y-1">
                       <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                          <span>{bot.name}</span>
                          <span className="text-cyan-400">{bot.allocation}%</span>
                       </div>
                       <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${bot.allocation}%` }} />
                       </div>
                    </div>
                 ))}
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};
