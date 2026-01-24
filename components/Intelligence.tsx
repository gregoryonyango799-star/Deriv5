
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { jarvis } from '../services/geminiService';

export const Intelligence: React.FC = () => {
  const [sentiment, setSentiment] = useState<any>({
    EUR: { score: 45, label: 'Bullish', reason: 'Strong manufacturing data' },
    USD: { score: -20, label: 'Bearish', reason: 'Inflation cooling faster than expected' },
    GBP: { score: 12, label: 'Neutral', reason: 'BOE waiting for fiscal report' },
    JPY: { score: -65, label: 'Strong Bearish', reason: 'YCC adjustment delayed' }
  });

  const [news, setNews] = useState<any[]>([
    { id: 1, source: 'AlphaVantage', time: '2m ago', title: 'NFP Data beats expectations, USD yields spike', summary: 'The labor market remains tighter than analysts predicted, leading to hawkish Fed expectations.', sentiment: 'Bullish USD' },
    { id: 2, source: 'Reuters', time: '15m ago', title: 'ECB Lagarde hints at neutral rate by Summer', summary: 'Markets interpret this as a dovish pivot, putting pressure on EUR crosses.', sentiment: 'Bearish EUR' },
    { id: 3, source: 'ForexLive', time: '1h ago', title: 'Crude Oil slips below $75 on weak China demand', summary: 'Slow recovery in the manufacturing sector dampens energy outlook.', sentiment: 'Bearish CAD' },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshIntelligence = async () => {
    setIsRefreshing(true);
    // Simulate API fetch delay
    await new Promise(r => setTimeout(r, 1500));
    
    const mockHeadlines = news.map(n => n.title);
    const results = await jarvis.getMarketSentiment(mockHeadlines);
    if (Object.keys(results).length > 0) setSentiment(results);
    
    // Shuffle news to simulate new updates
    setNews(prev => [...prev].sort(() => Math.random() - 0.5));
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshIntelligence();
  }, []);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Macro Neural Intelligence</h2>
        <button 
          onClick={refreshIntelligence}
          className={`px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase hover:bg-cyan-600/30 transition-all flex items-center gap-2 ${isRefreshing ? 'animate-pulse opacity-50' : ''}`}
        >
          {isRefreshing ? (
            <>
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Syncing...
            </>
          ) : 'Refresh Feed'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(sentiment).map(([key, val]: [string, any]) => (
          <div key={key} className="glass-panel p-6 rounded-2xl border-t-2 border-cyan-500 relative overflow-hidden group h-48 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-cyan-400 font-black tracking-widest uppercase">{key} Sentiment</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${val.score > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {val.label}
                </span>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <h2 className="text-4xl font-black font-mono">{val.score}</h2>
                <span className="text-[10px] text-gray-500 mb-2">Score</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-tight italic">"{val.reason}"</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time News Feed */}
        <div className="glass-panel p-6 rounded-3xl overflow-y-auto custom-scrollbar flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter">
              <span className="text-cyan-400">01</span> Financial Neural Feed
            </h3>
            <span className="text-[10px] text-emerald-400 animate-pulse font-mono font-black">● LIVE</span>
          </div>
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full font-bold uppercase">{item.source}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${item.sentiment.includes('Bullish') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {item.sentiment}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{item.time}</span>
                </div>
                <h4 className="text-sm font-black mb-1 group-hover:text-cyan-400 transition-colors uppercase leading-tight tracking-tight">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Institional Data */}
        <div className="glass-panel p-6 rounded-3xl h-[500px] flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter">
            <span className="text-cyan-400">02</span> Neural Liquidity Heatmap
          </h3>
          <div className="flex-1 space-y-6 mt-4">
            {['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'NAS100', 'BTC/USD'].map(pair => (
              <div key={pair} className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-white font-bold">{pair}</span>
                  <span className="text-cyan-400">Exposure Index</span>
                </div>
                <div className="flex h-3 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 w-[60%]" />
                  <div className="bg-gradient-to-r from-rose-600 to-rose-400 w-[40%]" />
                </div>
                <div className="flex justify-between text-[8px] text-gray-600 font-black tracking-widest">
                  <span>AGGREGATED LONG (60%)</span>
                  <span>AGGREGATED SHORT (40%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
