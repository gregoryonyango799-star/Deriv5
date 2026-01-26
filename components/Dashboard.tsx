
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, IChartApi, LineStyle, CrosshairMode } from 'lightweight-charts';
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

type ChartType = 'candles' | 'line' | 'area';
type IndicatorType = 'none' | 'sma' | 'ema' | 'bollinger' | 'volume';

export const Dashboard: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  
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
  const [symbol, setSymbol] = useState(() => {
    // Restore saved symbol on mount
    return deriv.restoreSymbol();
  });
  const [symbolName, setSymbolName] = useState('Volatility 100 Index');
  const [granularity, setGranularity] = useState(60); 
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [activeIndicator, setActiveIndicator] = useState<IndicatorType>('none');
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [minStake, setMinStake] = useState<number>(0.35);
  const [tradeAmount, setTradeAmount] = useState<number>(0.35);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Bot signals and notifications
  const [botSignals, setBotSignals] = useState<Array<{
    id: string;
    botId: string;
    signal: any;
    symbol: string;
    timestamp: number;
  }>>([]);
  const [showSignals, setShowSignals] = useState(true);

  const performAiAnalysis = async () => {
    setIsAnalyzing(true);
    setIsModalOpen(true);
    try {
      const result = await jarvis.predictMarketMovement(symbolName, chartData);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("Neural interface disruption. Please try again.");
    }
    setIsAnalyzing(false);
  };

  const handleMarketSelect = (newSymbol: string) => {
    setSymbol(newSymbol);
    setDepth([]);
    // Find symbol name from active symbols
    const sym = deriv.activeSymbols.find(s => s.symbol === newSymbol);
    if (sym) {
      setSymbolName(sym.display_name);
    }
    // Get minimum stake for this symbol
    const minimumStake = deriv.getMinimumStake(newSymbol);
    setMinStake(minimumStake);
    setTradeAmount(minimumStake);
    
    // Update deriv service with current symbol for bots
    deriv.setCurrentSymbol(newSymbol, chartData);
  };

  // Calculate SMA
  const calculateSMA = useCallback((data: CandlestickData[], period: number) => {
    const sma: { time: any; value: number }[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push({ time: data[i].time, value: sum / period });
    }
    return sma;
  }, []);

  // Calculate EMA
  const calculateEMA = useCallback((data: CandlestickData[], period: number) => {
    const ema: { time: any; value: number }[] = [];
    const multiplier = 2 / (period + 1);
    let prevEma = data[0].close;
    
    for (let i = 0; i < data.length; i++) {
      const currentEma = (data[i].close - prevEma) * multiplier + prevEma;
      ema.push({ time: data[i].time, value: currentEma });
      prevEma = currentEma;
    }
    return ema;
  }, []);

  // Calculate Bollinger Bands
  const calculateBollinger = useCallback((data: CandlestickData[], period: number = 20, stdDev: number = 2) => {
    const upper: { time: any; value: number }[] = [];
    const middle: { time: any; value: number }[] = [];
    const lower: { time: any; value: number }[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      const sma = sum / period;
      
      let squaredSum = 0;
      for (let j = 0; j < period; j++) {
        squaredSum += Math.pow(data[i - j].close - sma, 2);
      }
      const std = Math.sqrt(squaredSum / period);
      
      middle.push({ time: data[i].time, value: sma });
      upper.push({ time: data[i].time, value: sma + stdDev * std });
      lower.push({ time: data[i].time, value: sma - stdDev * std });
    }
    return { upper, middle, lower };
  }, []);

  useEffect(() => {
    if (deriv.getIsAuthorized()) {
      setAccounts(deriv.accounts);
      if (deriv.currentAccount) {
        setSelectedAccountId(deriv.currentAccount.loginid);
        setCurrentBalance({
          balance: deriv.currentAccount.balance ?? 0,
          currency: deriv.currentAccount.currency || 'USD',
          loginid: deriv.currentAccount.loginid
        });
      }
    }
    
    // Initialize minimum stake for default symbol
    const initialMinStake = deriv.getMinimumStake(symbol);
    setMinStake(initialMinStake);
    setTradeAmount(initialMinStake);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous indicators
    indicatorSeriesRef.current = [];

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(6, 182, 212, 0.05)' },
        horzLines: { color: 'rgba(6, 182, 212, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : (window.innerWidth < 768 ? 320 : 450),
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(6, 182, 212, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0d1117',
        },
        horzLine: {
          color: 'rgba(6, 182, 212, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0d1117',
        },
      },
      timeScale: {
        borderColor: 'rgba(30, 41, 59, 0.3)',
        timeVisible: true,
        secondsVisible: granularity <= 60,
      },
      rightPriceScale: {
        borderColor: 'rgba(30, 41, 59, 0.3)',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      watermark: {
        visible: true,
        text: symbolName,
        color: 'rgba(6, 182, 212, 0.07)',
        fontSize: 48,
        fontFamily: "'Inter', sans-serif",
        fontStyle: 'bold',
      },
    });

    chartRef.current = chart;

    // Add main series based on chart type
    let mainSeries: any;
    if (chartType === 'candles') {
      mainSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });
    } else if (chartType === 'line') {
      mainSeries = chart.addLineSeries({
        color: '#06b6d4',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
    } else {
      mainSeries = chart.addAreaSeries({
        topColor: 'rgba(6, 182, 212, 0.4)',
        bottomColor: 'rgba(6, 182, 212, 0.0)',
        lineColor: '#06b6d4',
        lineWidth: 2,
      });
    }

    seriesRef.current = mainSeries;

    // Add volume histogram
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : (window.innerWidth < 768 ? 320 : 450)
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
        
        // Update deriv service with current chart data for bots
        deriv.setCurrentSymbol(symbol, formatted);
        
        if (chartType === 'candles') {
          mainSeries.setData(formatted);
        } else {
          mainSeries.setData(formatted.map((c: CandlestickData) => ({ time: c.time, value: c.close })));
        }

        // Add volume data (simulated based on price movement)
        if (showVolume && volumeSeriesRef.current) {
          const volumeData = formatted.map((c: CandlestickData, i: number) => ({
            time: c.time,
            value: Math.abs(c.close - c.open) * 100000 + Math.random() * 50000,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)',
          }));
          volumeSeriesRef.current.setData(volumeData);
        }

        // Add indicators
        if (activeIndicator === 'sma' && formatted.length > 20) {
          const sma20 = calculateSMA(formatted, 20);
          const sma50 = calculateSMA(formatted, 50);
          
          const sma20Series = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, title: 'SMA 20' });
          const sma50Series = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1, title: 'SMA 50' });
          sma20Series.setData(sma20);
          sma50Series.setData(sma50);
          indicatorSeriesRef.current.push(sma20Series, sma50Series);
        }

        if (activeIndicator === 'ema' && formatted.length > 20) {
          const ema12 = calculateEMA(formatted, 12);
          const ema26 = calculateEMA(formatted, 26);
          
          const ema12Series = chart.addLineSeries({ color: '#22c55e', lineWidth: 1, title: 'EMA 12' });
          const ema26Series = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, title: 'EMA 26' });
          ema12Series.setData(ema12);
          ema26Series.setData(ema26);
          indicatorSeriesRef.current.push(ema12Series, ema26Series);
        }

        if (activeIndicator === 'bollinger' && formatted.length > 20) {
          const { upper, middle, lower } = calculateBollinger(formatted);
          
          const upperSeries = chart.addLineSeries({ color: 'rgba(168, 85, 247, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
          const middleSeries = chart.addLineSeries({ color: '#a855f7', lineWidth: 1 });
          const lowerSeries = chart.addLineSeries({ color: 'rgba(168, 85, 247, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
          upperSeries.setData(upper);
          middleSeries.setData(middle);
          lowerSeries.setData(lower);
          indicatorSeriesRef.current.push(upperSeries, middleSeries, lowerSeries);
        }

        chart.timeScale().fitContent();
      }

      if (data.msg_type === 'ohlc' && data.ohlc && data.ohlc.symbol === symbol) {
        const update = {
          time: data.ohlc.open_time,
          open: parseFloat(data.ohlc.open),
          high: parseFloat(data.ohlc.high),
          low: parseFloat(data.ohlc.low),
          close: parseFloat(data.ohlc.close),
        };
        if (chartType === 'candles') {
          mainSeries.update(update);
        } else {
          mainSeries.update({ time: update.time, value: update.close });
        }
      }

      if (data.msg_type === 'tick' && data.tick && data.tick.symbol === symbol) {
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
          balance: data.authorize.balance ?? 0,
          currency: data.authorize.currency || 'USD',
          loginid: data.authorize.loginid
        });
      }

      if (data.msg_type === 'account_switched' && data.account) {
        setSelectedAccountId(data.account.loginid);
        setCurrentBalance({
          balance: data.account.balance ?? 0,
          currency: data.account.currency || 'USD',
          loginid: data.account.loginid
        });
      }

      if (data.msg_type === 'current_account_balance') {
        setCurrentBalance({
          balance: data.balance,
          currency: data.currency,
          loginid: data.loginid
        });
      }

      if (data.msg_type === 'balance' && !data.error) {
        // Update the account in the list
        setAccounts(prev => prev.map(acc => 
          acc.loginid === data.balance.loginid 
            ? { ...acc, balance: data.balance.balance } 
            : acc
        ));
        
        // If this is the current account, update balance display
        if (data.balance.loginid === selectedAccountId) {
          setCurrentBalance(prev => ({
            ...prev,
            balance: data.balance.balance,
            loginid: data.balance.loginid
          }));
        }
      }
      
      // Bot signal notification
      if (data.msg_type === 'bot_signal') {
        const newSignal = {
          id: `signal-${Date.now()}`,
          botId: data.bot_id,
          signal: data.signal,
          symbol: data.symbol,
          timestamp: Date.now()
        };
        setBotSignals(prev => [newSignal, ...prev].slice(0, 5)); // Keep last 5 signals
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setBotSignals(prev => prev.filter(s => s.id !== newSignal.id));
        }, 10000);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      unsub();
    };
  }, [symbol, granularity, selectedAccountId, chartType, activeIndicator, showVolume, isFullscreen, calculateSMA, calculateEMA, calculateBollinger, symbolName]);

  const handleAccountChange = async (loginid: string) => {
    const acc = accounts.find(a => a.loginid === loginid);
    if (!acc) return;
    
    // Update UI immediately for responsive feel
    setSelectedAccountId(loginid);
    setCurrentBalance({
      balance: acc.balance ?? 0,
      currency: acc.currency || 'USD',
      loginid: acc.loginid
    });
    
    // Actually switch the account in the service
    try {
      await deriv.switchAccount(loginid);
      console.log('Dashboard: Successfully switched to', loginid);
    } catch (error) {
      console.error('Dashboard: Failed to switch account', error);
      alert('Failed to switch account: ' + (error as any).message);
    }
  };

  const triggerAIAnalysis = async () => {
    if (chartData.length === 0) {
      console.log("No chart data available");
      alert("Please wait for chart data to load");
      return;
    }
    
    if (!seriesRef.current) {
      console.log("Chart series not available");
      alert("Chart not ready, please try again");
      return;
    }
    
    setIsAnnotating(true);
    try {
      console.log("Starting annotation analysis with", chartData.length, "candles");
      const dataSlice = chartData.slice(-50);
      const annotations = await jarvis.analyzeChartData(dataSlice);
      console.log("Received annotations:", annotations);
      
      if (annotations && Array.isArray(annotations) && annotations.length > 0) {
        const markers = annotations.map((ann: any) => {
          const label = (ann.label || '').toUpperCase();
          const type = (ann.type || '').toLowerCase();
          
          const isShort = label.includes('SH') || label.includes('SHORT') || 
                          label.includes('↓') || type === 'resistance';
          const isLong = label.includes('SL') || label.includes('LONG') || 
                         label.includes('↑') || type === 'support';
          const isEntry = type === 'entry';
          
          // Calculate the correct time from index
          const idx = Math.min(Math.max(0, ann.index || 0), dataSlice.length - 1);
          const candleTime = dataSlice[idx]?.time;
          
          console.log(`Marker: ${label} at index ${idx}, time ${candleTime}`);
          
          return {
            time: candleTime,
            position: isShort ? 'aboveBar' as const : 'belowBar' as const,
            color: isEntry ? '#fbbf24' : (isShort ? '#ef4444' : '#22c55e'),
            shape: isEntry ? 'circle' as const : (isShort ? 'arrowDown' as const : 'arrowUp' as const),
            text: label,
            size: 2,
          };
        }).filter(m => m.time !== undefined);
        
        console.log("Setting markers:", markers);
        
        if (seriesRef.current && markers.length > 0) {
          seriesRef.current.setMarkers(markers);
          console.log("Markers set successfully");
          alert(`AI Analysis: Found ${markers.length} patterns and levels on the chart!`);
        } else {
          console.log("No markers to set or series unavailable");
        }
      } else {
        console.log("No valid annotations received from AI");
        alert("AI is analyzing... Try again in a moment or check if you have sufficient chart data (minimum 20 candles recommended)");
      }
    } catch (e) {
      console.error('Annotation error:', e);
      alert("Annotation failed: " + (e as any).message);
    }
    setIsAnnotating(false);
  };

  const executeTrade = async (type: 'CALL' | 'PUT') => {
    if (tradeAmount < minStake) {
      alert(`Minimum stake for ${symbolName} is ${minStake} ${currentBalance.currency}`);
      return;
    }
    
    setIsExecuting(true);
    try {
        await deriv.placeTrade(symbol, tradeAmount, type);
        alert(`✅ ${type} order executed successfully!\nAmount: ${tradeAmount} ${currentBalance.currency}`);
    } catch (e: any) {
        alert(`❌ Trade failed: ${e.message || 'Execution error.'}`);
    }
    setIsExecuting(false);
  };

  const buyPressure = depth.filter(d => d.side === 'up').length * 10;
  const sellPressure = depth.filter(d => d.side === 'down').length * 10;

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 animate-in fade-in duration-700">
      {/* Bot Signal Notifications */}
      {showSignals && botSignals.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
          {botSignals.map(signal => (
            <div 
              key={signal.id}
              className="glass-panel p-4 rounded-xl border-l-4 border-purple-500 bg-gradient-to-r from-purple-500/20 to-transparent animate-in slide-in-from-right duration-300"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <p className="text-xs font-black text-white">AI Signal Detected</p>
                    <p className="text-[9px] text-gray-400">{signal.symbol}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBotSignals(prev => prev.filter(s => s.id !== signal.id))}
                  className="text-gray-500 hover:text-white text-lg"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 uppercase">Action</span>
                  <span className={`text-xs font-black ${
                    signal.signal.action === 'CALL' ? 'text-emerald-400' : 
                    signal.signal.action === 'PUT' ? 'text-rose-400' : 'text-gray-400'
                  }`}>
                    {signal.signal.action}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 uppercase">Strength</span>
                  <span className="text-xs font-black text-purple-400">{signal.signal.strength}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 uppercase">Confidence</span>
                  <span className="text-xs font-black text-cyan-400">{signal.signal.confidence}%</span>
                </div>
                {signal.signal.reasons && signal.signal.reasons.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">Reasons</p>
                    <ul className="text-[10px] text-gray-300 space-y-0.5">
                      {signal.signal.reasons.slice(0, 2).map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-purple-400">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Account Info Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-full lg:min-w-[350px] bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden group">
           <div className="flex items-center justify-between mb-2">
             <p className="text-gray-500 text-[9px] uppercase font-black tracking-[0.2em]">Neural Link Account</p>
             {accounts.find(a => a.loginid === selectedAccountId)?.is_virtual === 1 && (
               <span className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-black uppercase">Demo</span>
             )}
             {accounts.find(a => a.loginid === selectedAccountId)?.is_virtual === 0 && (
               <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase">Real</span>
             )}
           </div>
           <select 
             value={selectedAccountId}
             onChange={(e) => handleAccountChange(e.target.value)}
             className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-cyan-400 outline-none focus:border-cyan-500/50 appearance-none shadow-xl"
           >
             {accounts.length > 0 ? accounts.map(acc => (
               <option key={acc.loginid} value={acc.loginid} className="bg-[#0a0a16] text-white">
                 {acc.is_virtual === 1 ? '🎮 ' : '💰 '}{acc.loginid} — {(acc.balance ?? 0).toLocaleString()} {acc.currency || 'USD'}
               </option>
             )) : <option value="">Establishing Sync...</option>}
           </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          {[
            { label: 'Balance', val: `${(currentBalance.balance ?? 0).toLocaleString()} ${currentBalance.currency || 'USD'}`, col: 'cyan' },
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
        <div className={`lg:col-span-2 glass-panel p-4 md:p-6 rounded-3xl min-h-[450px] ${isFullscreen ? 'fixed inset-4 z-50 h-auto' : 'md:h-[580px]'} relative overflow-hidden flex flex-col border border-white/5`}>
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 z-10">
            <div className="flex flex-col">
               <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                 {symbolName} <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </h3>
               <span className="text-[8px] text-gray-500 font-mono">{symbol} | LIVE</span>
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <div className="flex bg-black/40 rounded-lg p-0.5">
                {(['candles', 'line', 'area'] as ChartType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded transition-all ${
                      chartType === type 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {type === 'candles' ? '📊' : type === 'line' ? '📈' : '🌊'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mb-4 z-10">
            {/* Timeframes */}
            <div className="flex gap-1 bg-black/30 rounded-lg p-1">
              {[
                { val: 60, label: 'M1' },
                { val: 300, label: 'M5' },
                { val: 900, label: 'M15' },
                { val: 3600, label: 'H1' },
                { val: 14400, label: 'H4' },
                { val: 86400, label: 'D1' },
              ].map(({ val, label }) => (
                <button 
                  key={val}
                  onClick={() => setGranularity(val)}
                  className={`text-[9px] font-mono px-2.5 py-1.5 rounded transition-colors ${
                    granularity === val 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Indicators */}
            <div className="flex gap-1 bg-black/30 rounded-lg p-1">
              {[
                { id: 'none' as IndicatorType, label: 'None', icon: '⊘' },
                { id: 'sma' as IndicatorType, label: 'SMA', icon: '〰️' },
                { id: 'ema' as IndicatorType, label: 'EMA', icon: '📊' },
                { id: 'bollinger' as IndicatorType, label: 'BB', icon: '🎯' },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveIndicator(id)}
                  className={`text-[9px] font-mono px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 ${
                    activeIndicator === id 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Volume Toggle */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`text-[9px] font-mono px-3 py-1.5 rounded transition-colors ${
                showVolume 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-black/30 text-gray-500 hover:bg-white/5'
              }`}
            >
              📊 Vol
            </button>

            {/* Fullscreen & AI Controls */}
            <div className="ml-auto flex items-center gap-2">
               <button
                 onClick={() => setIsFullscreen(!isFullscreen)}
                 className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                 title="Toggle Fullscreen"
               >
                 {isFullscreen ? '🔽' : '⛶'}
               </button>
               
               <button
                 onClick={triggerAIAnalysis}
                 disabled={isAnnotating || chartData.length === 0}
                 className="px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isAnnotating ? (
                   <>
                     <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     Scanning...
                   </>
                 ) : (
                   <>
                     <span>📊</span> Annotate
                   </>
                 )}
               </button>
               
               <button
                 onClick={performAiAnalysis}
                 className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-white"
               >
                 <span>✨</span> Ask JARVIS
               </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 w-full relative min-h-[250px]">
            <div ref={chartContainerRef} className="w-full h-full" />
            
            {/* Price Display Overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-[#0a0a16]/90 px-4 py-3 rounded-xl border border-cyan-500/20 backdrop-blur-xl z-10">
               <div className="flex flex-col">
                 <span className="text-[8px] text-gray-500 uppercase tracking-wider">Last Price</span>
                 <span className={`text-xl md:text-2xl font-mono font-black ${
                   depth.length > 0 && depth[0].side === 'up' ? 'text-emerald-400' : 
                   depth.length > 0 && depth[0].side === 'down' ? 'text-rose-400' : 'text-white'
                 }`}>
                   {lastTick ? lastTick.toFixed(lastTick > 100 ? 2 : 5) : '---'}
                 </span>
               </div>
               <div className="flex flex-col border-l border-white/10 pl-3">
                 <span className="text-[8px] text-gray-500 uppercase tracking-wider">Symbol</span>
                 <span className="text-xs font-mono font-bold text-cyan-400">{symbol}</span>
               </div>
            </div>

            {/* OHLC Display */}
            {chartData.length > 0 && (
              <div className="absolute top-2 left-2 flex gap-4 text-[9px] font-mono bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-gray-400">O: <span className="text-white">{chartData[chartData.length-1]?.open?.toFixed(5)}</span></span>
                <span className="text-gray-400">H: <span className="text-emerald-400">{chartData[chartData.length-1]?.high?.toFixed(5)}</span></span>
                <span className="text-gray-400">L: <span className="text-rose-400">{chartData[chartData.length-1]?.low?.toFixed(5)}</span></span>
                <span className="text-gray-400">C: <span className="text-cyan-400">{chartData[chartData.length-1]?.close?.toFixed(5)}</span></span>
              </div>
            )}

             {/* AI Analysis Modal Overlay */}
            {isModalOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-3xl">
                <div className="bg-[#101024] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90%]">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-cyan-900/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <h3 className="font-bold text-cyan-400 uppercase tracking-widest text-sm">Neural Analysis</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                         <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                         <p className="text-xs font-mono text-cyan-400 animate-pulse">Consulting Neural Uplink...</p>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="whitespace-pre-line font-mono text-sm leading-relaxed text-gray-300">
                          {aiAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          {/* Trade Amount Control */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-black/40">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">Trade Setup</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-2">Stake Amount ({currentBalance.currency})</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= minStake) {
                        setTradeAmount(val);
                      }
                    }}
                    min={minStake}
                    step={minStake}
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-amber-500/50 outline-none"
                  />
                  <button
                    onClick={() => setTradeAmount(minStake)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors"
                  >
                    MIN
                  </button>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                  <span>Min: {minStake}</span>
                  <span>Balance: {currentBalance.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTradeAmount(minStake)}
                  className="py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors"
                >
                  {minStake}
                </button>
                <button
                  onClick={() => setTradeAmount(1)}
                  className="py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors"
                >
                  1.00
                </button>
                <button
                  onClick={() => setTradeAmount(5)}
                  className="py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors"
                >
                  5.00
                </button>
              </div>
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
