
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, LineStyle, CrosshairMode } from 'lightweight-charts';
import { deriv } from '../services/derivService';
import { jarvis } from '../services/geminiService';

interface PriceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
}

const TIMEFRAMES = [
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '1H', value: 3600 },
  { label: '4H', value: 14400 },
  { label: '1D', value: 86400 },
];

const calculateSMA = (data: CandlestickData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += (data[i - j] as any).close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
};

const calculateEMA = (data: CandlestickData[], period: number) => {
  const result: { time: any; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  let ema = 0;
  
  for (let i = 0; i < data.length; i++) {
    const close = (data[i] as any).close;
    if (i === 0) {
      ema = close;
    } else {
      ema = (close - ema) * multiplier + ema;
    }
    if (i >= period - 1) {
      result.push({ time: data[i].time, value: ema });
    }
  }
  return result;
};

const calculateBollingerBands = (data: CandlestickData[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(data, period);
  const upper: { time: any; value: number }[] = [];
  const lower: { time: any; value: number }[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sumSquares = 0;
    for (let j = 0; j < period; j++) {
      const diff = (data[i - j] as any).close - sma[i - period + 1].value;
      sumSquares += diff * diff;
    }
    const std = Math.sqrt(sumSquares / period);
    const smaValue = sma[i - period + 1].value;
    upper.push({ time: data[i].time, value: smaValue + stdDev * std });
    lower.push({ time: data[i].time, value: smaValue - stdDev * std });
  }
  
  return { upper, lower, middle: sma };
};

const calculateRSI = (data: CandlestickData[], period: number = 14) => {
  const result: { time: any; value: number }[] = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < data.length; i++) {
    const change = (data[i] as any).close - (data[i - 1] as any).close;
    
    if (i <= period) {
      if (change > 0) gains += change;
      else losses -= change;
      
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
      }
    } else {
      const avgGain = ((result.length > 0 ? gains / period : 0) * (period - 1) + (change > 0 ? change : 0)) / period;
      const avgLoss = ((result.length > 0 ? losses / period : 0) * (period - 1) + (change < 0 ? -change : 0)) / period;
      gains = avgGain * period;
      losses = avgLoss * period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
    }
  }
  return result;
};

const calculateMACD = (data: CandlestickData[]) => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine: { time: any; value: number }[] = [];
  
  const offset = 26 - 12;
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push({
      time: ema26[i].time,
      value: ema12[i + offset].value - ema26[i].value
    });
  }
  
  const signalLine: { time: any; value: number }[] = [];
  const multiplier = 2 / 10;
  let ema = macdLine[0]?.value || 0;
  
  for (let i = 0; i < macdLine.length; i++) {
    ema = (macdLine[i].value - ema) * multiplier + ema;
    if (i >= 8) {
      signalLine.push({ time: macdLine[i].time, value: ema });
    }
  }
  
  const histogram: { time: any; value: number; color: string }[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdVal = macdLine[i + 8].value;
    const signalVal = signalLine[i].value;
    const diff = macdVal - signalVal;
    histogram.push({
      time: signalLine[i].time,
      value: diff,
      color: diff >= 0 ? '#10b981' : '#f43f5e'
    });
  }
  
  return { macdLine: macdLine.slice(8), signalLine, histogram };
};

const findSupportResistance = (data: CandlestickData[]): PriceLevel[] => {
  const levels: PriceLevel[] = [];
  const lookback = 15;
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const currentHigh = (data[i] as any).high;
    const currentLow = (data[i] as any).low;
    
    let isResistance = true;
    let isSupport = true;
    
    for (let j = i - lookback; j < i + lookback; j++) {
      if (j === i) continue;
      if ((data[j] as any).high > currentHigh) isResistance = false;
      if ((data[j] as any).low < currentLow) isSupport = false;
    }
    
    if (isResistance) {
      levels.push({ price: currentHigh, type: 'resistance', strength: 1 });
    }
    if (isSupport) {
      levels.push({ price: currentLow, type: 'support', strength: 1 });
    }
  }
  
  const merged: PriceLevel[] = [];
  const tolerance = 0.001;
  
  for (const level of levels) {
    const existing = merged.find(m => Math.abs(m.price - level.price) / level.price < tolerance && m.type === level.type);
    if (existing) {
      existing.strength++;
    } else {
      merged.push({ ...level });
    }
  }
  
  return merged.sort((a, b) => b.strength - a.strength).slice(0, 6);
};

export const EquityTrajectory: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorLinesRef = useRef<any[]>([]);
  
  const [symbol, setSymbol] = useState('frxEURUSD');
  const [timeframe, setTimeframe] = useState(60);
  const [prediction, setPrediction] = useState<string>('Engagement required. Engage the neural core for market projection...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([]);
  const [activeSymbols, setActiveSymbols] = useState<any[]>([]);
  
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  
  const [marketStats, setMarketStats] = useState({
    high24h: 0,
    low24h: 0,
    volatility: 0,
  });

  useEffect(() => {
    deriv.connect();
    const unsub = deriv.addListener((data) => {
      if (data.msg_type === 'active_symbols' && data.active_symbols) {
        setActiveSymbols(data.active_symbols);
      }
    });
    // Small delay to ensure connection is ready
    const timer = setTimeout(() => {
      deriv.fetchActiveSymbols();
    }, 500);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const groupedSymbols = activeSymbols.reduce((acc: any, sym: any) => {
    const market = sym.market_display_name || 'Other';
    if (!acc[market]) acc[market] = [];
    acc[market].push(sym);
    return acc;
  }, {});

  const updateIndicators = useCallback((data: CandlestickData[], chart: any) => {
    indicatorLinesRef.current.forEach(ind => {
      try { chart.removeSeries(ind.series); } catch {}
    });
    indicatorLinesRef.current = [];

    if (data.length < 30) return;

    if (showSMA) {
      const sma20 = calculateSMA(data, 20);
      const sma50 = calculateSMA(data, 50);
      
      const sma20Series = chart.addLineSeries({ color: '#fbbf24', lineWidth: 1 });
      sma20Series.setData(sma20);
      indicatorLinesRef.current.push({ series: sma20Series, name: 'SMA20' });
      
      if (data.length >= 50) {
        const sma50Series = chart.addLineSeries({ color: '#f97316', lineWidth: 1 });
        sma50Series.setData(sma50);
        indicatorLinesRef.current.push({ series: sma50Series, name: 'SMA50' });
      }
    }

    if (showEMA) {
      const ema9 = calculateEMA(data, 9);
      const ema21 = calculateEMA(data, 21);
      
      const ema9Series = chart.addLineSeries({ color: '#a855f7', lineWidth: 1 });
      ema9Series.setData(ema9);
      indicatorLinesRef.current.push({ series: ema9Series, name: 'EMA9' });
      
      const ema21Series = chart.addLineSeries({ color: '#ec4899', lineWidth: 1 });
      ema21Series.setData(ema21);
      indicatorLinesRef.current.push({ series: ema21Series, name: 'EMA21' });
    }

    if (showBB) {
      const bb = calculateBollingerBands(data);
      
      const upperSeries = chart.addLineSeries({ color: 'rgba(100, 116, 139, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      upperSeries.setData(bb.upper);
      indicatorLinesRef.current.push({ series: upperSeries, name: 'BB_Upper' });
      
      const lowerSeries = chart.addLineSeries({ color: 'rgba(100, 116, 139, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      lowerSeries.setData(bb.lower);
      indicatorLinesRef.current.push({ series: lowerSeries, name: 'BB_Lower' });
      
      const middleSeries = chart.addLineSeries({ color: 'rgba(100, 116, 139, 0.8)', lineWidth: 1 });
      middleSeries.setData(bb.middle);
      indicatorLinesRef.current.push({ series: middleSeries, name: 'BB_Middle' });
    }

    const levels = findSupportResistance(data);
    setPriceLevels(levels);

  }, [showSMA, showEMA, showBB]);

  const updateRSIChart = useCallback((data: CandlestickData[]) => {
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }
    
    if (!showRSI || !rsiContainerRef.current || data.length < 20) return;

    const chart = createChart(rsiContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#64748b' },
      grid: { vertLines: { color: 'rgba(30, 41, 59, 0.1)' }, horzLines: { color: 'rgba(30, 41, 59, 0.1)' } },
      width: rsiContainerRef.current.clientWidth,
      height: 100,
      timeScale: { visible: false },
      rightPriceScale: { borderColor: '#1e293b' },
      crosshair: { mode: CrosshairMode.Normal },
    });
    rsiChartRef.current = chart;

    const rsiData = calculateRSI(data);
    const rsiSeries = chart.addLineSeries({ color: '#a855f7', lineWidth: 2 });
    rsiSeries.setData(rsiData);

    const obLine = chart.addLineSeries({ color: 'rgba(239, 68, 68, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
    obLine.setData(rsiData.map(d => ({ time: d.time, value: 70 })));

    const osLine = chart.addLineSeries({ color: 'rgba(34, 197, 94, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
    osLine.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

  }, [showRSI]);

  const updateMACDChart = useCallback((data: CandlestickData[]) => {
    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }
    
    if (!showMACD || !macdContainerRef.current || data.length < 30) return;

    const chart = createChart(macdContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#64748b' },
      grid: { vertLines: { color: 'rgba(30, 41, 59, 0.1)' }, horzLines: { color: 'rgba(30, 41, 59, 0.1)' } },
      width: macdContainerRef.current.clientWidth,
      height: 100,
      timeScale: { visible: false },
      rightPriceScale: { borderColor: '#1e293b' },
      crosshair: { mode: CrosshairMode.Normal },
    });
    macdChartRef.current = chart;

    const macd = calculateMACD(data);
    
    const histogramSeries = chart.addHistogramSeries({});
    histogramSeries.setData(macd.histogram);

    const macdLineSeries = chart.addLineSeries({ color: '#06b6d4', lineWidth: 2 });
    macdLineSeries.setData(macd.macdLine);

    const signalSeries = chart.addLineSeries({ color: '#f97316', lineWidth: 1 });
    signalSeries.setData(macd.signalLine);

  }, [showMACD]);

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
        secondsVisible: timeframe <= 60,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(6, 182, 212, 0.3)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(6, 182, 212, 0.3)', width: 1, style: LineStyle.Dashed },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    seriesRef.current = candlestickSeries;
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: macdContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // Ensure connection is ready before fetching history
    deriv.connect();
    const fetchTimer = setTimeout(() => {
      deriv.fetchHistory(symbol, timeframe);
    }, 300);

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
        
        if (formatted.length > 0) {
          const last = formatted[formatted.length - 1] as any;
          const first = formatted[0] as any;
          setLastPrice(last.close);
          setPriceChange(((last.close - first.close) / first.close) * 100);
          
          const highs = formatted.map((c: any) => c.high);
          const lows = formatted.map((c: any) => c.low);
          setMarketStats({
            high24h: Math.max(...highs),
            low24h: Math.min(...lows),
            volatility: ((Math.max(...highs) - Math.min(...lows)) / last.close) * 100,
          });
        }

        if (volumeSeriesRef.current) {
          const volumeData = sourceData.map((c: any) => ({
            time: c.epoch,
            value: Math.random() * 10000,
            color: parseFloat(c.close) >= parseFloat(c.open) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
          }));
          volumeSeriesRef.current.setData(volumeData);
        }

        updateIndicators(formatted, chart);
        updateRSIChart(formatted);
        updateMACDChart(formatted);
      }

      if (data.msg_type === 'ohlc' && data.ohlc && data.ohlc.symbol === symbol) {
        const candle = {
          time: data.ohlc.open_time,
          open: parseFloat(data.ohlc.open),
          high: parseFloat(data.ohlc.high),
          low: parseFloat(data.ohlc.low),
          close: parseFloat(data.ohlc.close),
        };
        candlestickSeries.update(candle);
        setLastPrice(candle.close);
      }
    });

    return () => {
      clearTimeout(fetchTimer);
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (rsiChartRef.current) rsiChartRef.current.remove();
      if (macdChartRef.current) macdChartRef.current.remove();
      unsub();
    };
  }, [symbol, timeframe, showVolume]);

  // Update indicators when toggles change
  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      updateIndicators(chartData, chartRef.current);
    }
  }, [showSMA, showEMA, showBB, chartData]);

  // Update RSI when toggle changes
  useEffect(() => {
    if (chartData.length > 0) {
      updateRSIChart(chartData);
    }
  }, [showRSI, chartData]);

  // Update MACD when toggle changes
  useEffect(() => {
    if (chartData.length > 0) {
      updateMACDChart(chartData);
    }
  }, [showMACD, chartData]);

  const runAIAnalysis = async () => {
    if (chartData.length === 0) return;
    setIsAnalyzing(true);
    
    try {
      const dataSlice = chartData.slice(-50);
      
      const [predictionText, structuralAnnotations] = await Promise.all([
        jarvis.predictMarketMovement(symbol, chartData),
        jarvis.analyzeChartData(dataSlice)
      ]);

      setPrediction(predictionText);
      console.log("Trajectory annotations:", structuralAnnotations);

      if (seriesRef.current && structuralAnnotations && Array.isArray(structuralAnnotations) && structuralAnnotations.length > 0) {
        const markers = structuralAnnotations.map((ann: any) => {
          const label = (ann.label || '').toLowerCase();
          const type = (ann.type || '').toLowerCase();
          
          const isShort = label.includes('sh') || label.includes('short') || 
                          label.includes('bos↓') || type === 'resistance';
          const isLong = label.includes('sl') || label.includes('long') || 
                         label.includes('bos↑') || type === 'support';
          const isEntry = type === 'entry' || label.includes('long') || label.includes('short');
          const isStructure = type === 'structure' || label.includes('bos') || label.includes('ob') || label.includes('fvg');
          
          let color = '#94a3b8';
          let shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square' = 'circle';
          let position: 'aboveBar' | 'belowBar' = 'aboveBar';
          
          if (isEntry) {
            color = '#fbbf24';
            shape = 'circle';
            position = isShort ? 'aboveBar' : 'belowBar';
          } else if (isStructure) {
            color = '#a855f7';
            shape = 'square';
            position = isShort ? 'aboveBar' : 'belowBar';
          } else if (isShort) {
            color = '#ef4444';
            shape = 'arrowDown';
            position = 'aboveBar';
          } else if (isLong) {
            color = '#22c55e';
            shape = 'arrowUp';
            position = 'belowBar';
          }
          
          const idx = Math.min(Math.max(0, ann.index || 0), dataSlice.length - 1);
          const candleTime = dataSlice[idx]?.time;
          
          return {
            time: candleTime,
            position,
            color,
            shape,
            text: ann.label,
            size: 2
          };
        }).filter(m => m.time);
        
        console.log("Setting trajectory markers:", markers);
        seriesRef.current.setMarkers(markers as any);
      }
    } catch (e) {
      console.error('Analysis error:', e);
      setPrediction('Neural analysis encountered an error. Please try again.');
    }
    
    setIsAnalyzing(false);
  };

  const getSymbolDisplayName = () => {
    const sym = activeSymbols.find(s => s.symbol === symbol);
    return sym?.display_name || symbol;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white">Advanced Analysis</h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Deep Neural Market Inspection</p>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-lg font-black text-white">{getSymbolDisplayName()}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-bold text-cyan-400">{lastPrice.toFixed(5)}</span>
              <span className={`text-xs font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:scale-[1.02] active:scale-95 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : '🧠 Neural Analysis'}
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-3 rounded-xl border border-white/5 flex flex-wrap items-center gap-3">
        {/* Symbol Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-500 uppercase">Symbol:</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-400 outline-none focus:border-cyan-500/50 max-w-[180px]"
          >
            {Object.entries(groupedSymbols).map(([market, symbols]: [string, any]) => (
              <optgroup key={market} label={market}>
                {symbols.slice(0, 20).map((s: any) => (
                  <option key={s.symbol} value={s.symbol}>{s.display_name}</option>
                ))}
              </optgroup>
            ))}
            {activeSymbols.length === 0 && (
              <>
                <option value="frxEURUSD">EUR/USD</option>
                <option value="frxGBPUSD">GBP/USD</option>
                <option value="R_100">Volatility 100</option>
                <option value="1HZ100V">Volatility 100 (1s)</option>
                <option value="cryBTCUSD">BTC/USD</option>
              </>
            )}
          </select>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                timeframe === tf.value 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-gray-500 uppercase">Indicators:</span>
          {[
            { label: 'SMA', active: showSMA, set: setShowSMA },
            { label: 'EMA', active: showEMA, set: setShowEMA },
            { label: 'BB', active: showBB, set: setShowBB },
            { label: 'RSI', active: showRSI, set: setShowRSI },
            { label: 'MACD', active: showMACD, set: setShowMACD },
            { label: 'VOL', active: showVolume, set: setShowVolume },
          ].map(ind => (
            <button
              key={ind.label}
              onClick={() => ind.set(!ind.active)}
              className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${
                ind.active 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-gray-600 hover:text-gray-400 bg-white/5'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main Chart Area */}
        <div className="xl:col-span-3 space-y-2">
          {/* Main Chart */}
          <div className="glass-panel p-2 rounded-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-3 left-4 z-10 flex gap-2">
              <div className="px-2 py-1 bg-[#0a0a16]/90 rounded-full border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] text-emerald-400 font-black uppercase">Live</span>
              </div>
              <div className="px-2 py-1 bg-[#0a0a16]/90 rounded-full border border-cyan-500/30 backdrop-blur-md">
                <span className="text-[8px] text-cyan-400 font-black uppercase">{TIMEFRAMES.find(t => t.value === timeframe)?.label}</span>
              </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[450px]" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">Neural Analysis...</span>
                </div>
              </div>
            )}
          </div>

          {/* RSI Chart */}
          {showRSI && (
            <div className="glass-panel p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 px-2 mb-1">
                <span className="text-[9px] font-black text-purple-400 uppercase">RSI (14)</span>
                <span className="text-[8px] text-gray-500">Overbought: 70 | Oversold: 30</span>
              </div>
              <div ref={rsiContainerRef} className="w-full h-[100px]" />
            </div>
          )}

          {/* MACD Chart */}
          {showMACD && (
            <div className="glass-panel p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 px-2 mb-1">
                <span className="text-[9px] font-black text-orange-400 uppercase">MACD (12, 26, 9)</span>
              </div>
              <div ref={macdContainerRef} className="w-full h-[100px]" />
            </div>
          )}

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: '24h High', value: marketStats.high24h.toFixed(5), color: 'text-emerald-400' },
              { label: '24h Low', value: marketStats.low24h.toFixed(5), color: 'text-rose-400' },
              { label: 'Volatility', value: `${marketStats.volatility.toFixed(2)}%`, color: 'text-amber-400' },
              { label: 'Spread', value: ((marketStats.high24h - marketStats.low24h) * 10000).toFixed(1) + ' pips', color: 'text-cyan-400' },
              { label: 'Signal', value: priceChange >= 0 ? 'BULLISH' : 'BEARISH', color: priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-3 rounded-xl border-l-2 border-white/10">
                <p className="text-[8px] text-gray-500 uppercase font-black tracking-wider">{stat.label}</p>
                <p className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Analysis Panel */}
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/10 min-h-[300px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">🧠 Neural Output</span>
              {isAnalyzing && <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                {prediction}
              </p>
            </div>
            {!isAnalyzing && prediction.includes('Engagement required') && (
              <div className="mt-4 p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
                <p className="text-[9px] text-cyan-500 font-bold uppercase">Click "Neural Analysis" to begin</p>
              </div>
            )}
          </div>

          {/* Support/Resistance Levels */}
          <div className="glass-panel p-4 rounded-2xl border border-indigo-500/10">
            <h5 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest">Key Levels</h5>
            <div className="space-y-2">
              {priceLevels.length > 0 ? (
                priceLevels.slice(0, 6).map((level, i) => (
                  <div 
                    key={i}
                    className={`flex justify-between items-center px-3 py-2 bg-black/40 rounded-lg border ${
                      level.type === 'resistance' ? 'border-rose-500/20' : 'border-emerald-500/20'
                    }`}
                  >
                    <span className={`text-[9px] font-mono uppercase ${
                      level.type === 'resistance' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {level.type}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-white">{level.price.toFixed(5)}</span>
                    <span className="text-[8px] text-gray-500">x{level.strength}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center px-3 py-2 bg-black/40 rounded-lg border border-rose-500/20">
                    <span className="text-[9px] font-mono text-rose-400 uppercase">Resistance</span>
                    <span className="text-[10px] font-mono text-gray-500">Calculating...</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-black/40 rounded-lg border border-emerald-500/20">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase">Support</span>
                    <span className="text-[10px] font-mono text-gray-500">Calculating...</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5">
            <h5 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest">Analysis Summary</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase">Trend</span>
                <span className={`text-[10px] font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {priceChange >= 0 ? '↑ UPTREND' : '↓ DOWNTREND'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase">Momentum</span>
                <span className="text-[10px] font-bold text-amber-400">
                  {Math.abs(priceChange) > 1 ? 'STRONG' : Math.abs(priceChange) > 0.3 ? 'MODERATE' : 'WEAK'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase">Volatility</span>
                <span className={`text-[10px] font-bold ${
                  marketStats.volatility > 2 ? 'text-rose-400' : marketStats.volatility > 1 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {marketStats.volatility > 2 ? 'HIGH' : marketStats.volatility > 1 ? 'MEDIUM' : 'LOW'}
                </span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase">Signal</span>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                  priceChange >= 0.5 ? 'bg-emerald-500/20 text-emerald-400' : 
                  priceChange <= -0.5 ? 'bg-rose-500/20 text-rose-400' : 
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {priceChange >= 0.5 ? 'BUY' : priceChange <= -0.5 ? 'SELL' : 'HOLD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
