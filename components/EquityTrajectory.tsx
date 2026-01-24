
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { deriv } from '../services/derivService';
import { jarvis } from '../services/geminiService';
import { ICONS } from '../constants';

export const EquityTrajectory: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [symbol, setSymbol] = useState('frxEURUSD');
  const [prediction, setPrediction] = useState<string>('Engagement required. Engage the neural core for market projection...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.15)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.15)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
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
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    deriv.connect();
    deriv.fetchHistory(symbol);

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
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      unsub();
    };
  }, [symbol]);

  const runAIAnalysis = async () => {
    if (chartData.length === 0) return;
    setIsAnalyzing(true);
    
    // Concurrent execution for speed and efficiency
    const [predictionText, structuralAnnotations] = await Promise.all([
      jarvis.predictMarketMovement(symbol, chartData),
      jarvis.analyzeChartData(chartData.slice(-60))
    ]);

    setPrediction(predictionText);

    if (seriesRef.current && structuralAnnotations && Array.isArray(structuralAnnotations)) {
      const markers = structuralAnnotations.map((ann: any) => {
        const isBearish = ann.label.toLowerCase().includes('sell') || ann.label.toLowerCase().includes('resistance');
        return {
          time: chartData[Math.max(0, chartData.length - 1 - (59 - ann.index))]?.time || chartData[chartData.length - 1].time,
          position: isBearish ? 'aboveBar' : 'belowBar',
          color: isBearish ? '#f43f5e' : '#10b981',
          shape: isBearish ? 'arrowDown' : 'arrowUp',
          text: ann.label,
          size: 2
        };
      });
      
      seriesRef.current.setMarkers(markers);
    }
    
    setIsAnalyzing(false);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Advanced Analysis Terminal</h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Deep Neural Market Inspection</p>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black text-gray-500 uppercase">Pair:</label>
            <div className="relative">
              <select 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-6 py-1.5 text-xs font-bold text-cyan-400 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer pr-10"
              >
                  <option value="frxEURUSD">EUR/USD</option>
                  <option value="frxGBPUSD">GBP/USD</option>
                  <option value="R_100">Volatility 100</option>
                  <option value="1HZ500V">Boom 500</option>
                  <option value="1HZ1000V">Crash 1000</option>
                  <option value="cryBTCUSD">Bitcoin</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500/50">▼</div>
            </div>
          </div>
        </div>
        <button 
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:scale-[1.02] active:scale-95 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Synchronizing JARVIS...
              </>
          ) : 'engage neural prediction'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-2 rounded-3xl relative overflow-hidden h-[550px] border border-white/5">
            <div className="absolute top-4 left-6 z-10 flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-[#0a0a16]/90 rounded-full border border-emerald-500/30 backdrop-blur-md flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Feed: Syncing</span>
                </div>
                <div className="px-3 py-1 bg-[#0a0a16]/90 rounded-full border border-cyan-500/30 backdrop-blur-md flex items-center gap-2">
                    <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest">Neuro-Overlay Ready</span>
                </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-full" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">Deep Learning Market Synthesis...</span>
                  </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-b-2 border-cyan-500/30 hover:bg-white/5 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Market Liquidity</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-black font-mono">92.4%</h4>
                <span className="text-[10px] text-emerald-400 mb-1 font-bold">+1.2%</span>
              </div>
              <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[92%]" />
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-b-2 border-indigo-500/30 hover:bg-white/5 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Neural Signal Quality</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-black font-mono">Tier A</h4>
                <span className="text-[10px] text-cyan-400 mb-1 font-bold">Stable</span>
              </div>
              <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[85%]" />
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border-b-2 border-rose-500/30 hover:bg-white/5 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Volatility Index</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-black font-mono">14.2</h4>
                <span className="text-[10px] text-rose-400 mb-1 font-bold">V-Cluster</span>
              </div>
              <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full w-[14%]" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Sidebar Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl flex-1 border border-cyan-500/10 flex flex-col relative overflow-hidden min-h-[400px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <ICONS.Jarvis className="w-16 h-16 text-cyan-400" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                Neural Intelligence Output
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
              <p className="text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                {prediction}
              </p>
              {isAnalyzing && (
                  <div className="mt-8 space-y-4">
                      <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-white/5 animate-pulse rounded" />
                      <div className="h-3 w-5/6 bg-white/5 animate-pulse rounded" />
                  </div>
              )}
            </div>
            {!isAnalyzing && prediction.includes('Engagement required') && (
              <div className="mt-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
                 <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-2">sir, initialization pending</p>
                 <p className="text-[11px] text-gray-500 leading-tight">Engage the JARVIS neural core to analyze current market structures for SMC patterns and future trajectories.</p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">
                   <span>Pattern confidence</span>
                   <span className="text-cyan-400">78%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 transition-all duration-1000" style={{ width: '78%' }} />
                </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
              <h5 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest">Key Structural Levels</h5>
              <div className="space-y-2">
                  <div className="flex justify-between items-center px-3 py-2 bg-black/40 rounded-xl border border-white/5 group hover:border-rose-500/30 transition-all">
                      <span className="text-[9px] font-mono text-gray-500 group-hover:text-rose-400 uppercase">Resistance</span>
                      <span className="text-[10px] font-mono text-rose-500 font-bold">CALCULATING...</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-black/40 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                      <span className="text-[9px] font-mono text-gray-500 group-hover:text-emerald-400 uppercase">Support</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">CALCULATING...</span>
                  </div>
              </div>
              <p className="mt-3 text-[8px] text-gray-600 font-bold uppercase text-center tracking-tighter">Sir, engage analysis for precise levels.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
