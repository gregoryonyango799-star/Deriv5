
import React from 'react';

interface MarketTileProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  type: string;
  isActive?: boolean;
  onSelect?: (symbol: string) => void;
}

const MarketTile: React.FC<MarketTileProps> = ({ symbol, name, price, change, type, isActive, onSelect }) => {
  const isUp = change.startsWith('+');
  return (
    <div 
      onClick={() => onSelect?.(symbol)}
      className={`glass-panel p-3 rounded-xl border-l-2 transition-all cursor-pointer group flex flex-col justify-between h-28 relative overflow-hidden ${
        isActive 
        ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
        : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/5'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 w-6 h-6 bg-cyan-500/10 rounded-bl-lg flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
        </div>
      )}
      <div className="flex justify-between items-start">
        <div className="overflow-hidden">
          <p className="text-[8px] text-cyan-400 font-mono uppercase tracking-[0.2em] mb-0.5 truncate">{type}</p>
          <h4 className="text-[11px] font-black group-hover:text-cyan-400 transition-colors text-white uppercase truncate">{name}</h4>
        </div>
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {change}
        </span>
      </div>
      <div className="mt-auto">
        <p className="text-base font-mono font-black tracking-tighter text-white truncate">{price}</p>
      </div>
    </div>
  );
};

interface MarketWatchProps {
  onSelect?: (symbol: string) => void;
  activeSymbol?: string;
}

export const MarketWatch: React.FC<MarketWatchProps> = ({ onSelect, activeSymbol }) => {
  const markets = [
    { symbol: 'frxEURUSD', name: 'EUR/USD', price: '1.0842', change: '+0.12%', type: 'Forex' },
    { symbol: 'R_100', name: 'Vol 100', price: '4521.8', change: '-2.45%', type: 'Indices' },
    { symbol: '1HZ100V', name: 'Vol 100 (1s)', price: '821.4', change: '+0.85%', type: 'Synthetics' },
    { symbol: '1HZ500V', name: 'Boom 500', price: '9842.1', change: '+3.15%', type: 'Boom/Crash' },
    { symbol: '1HZ1000V', name: 'Crash 1000', price: '1242.4', change: '-5.10%', type: 'Boom/Crash' },
    { symbol: 'cryBTCUSD', name: 'Bitcoin', price: '64230', change: '+1.50%', type: 'Crypto' },
    { symbol: 'R_STP', name: 'Step Index', price: '342.12', change: '-0.05%', type: 'Indices' },
    { symbol: 'accu_10', name: 'Accumulator 10', price: '10.42', change: '+12.0%', type: 'Deriv Only' },
    { symbol: 'frxGBPUSD', name: 'GBP/USD', price: '1.2654', change: '+0.05%', type: 'Forex' },
    { symbol: 'JD10', name: 'Jump 10', price: '151.24', change: '-0.10%', type: 'Synthetics' },
    { symbol: 'frxUSDJPY', name: 'USD/JPY', price: '151.24', change: '-0.10%', type: 'Forex' },
    { symbol: 'R_10', name: 'Vol 10', price: '45.12', change: '+1.02%', type: 'Indices' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Neural Scanner</h3>
          <div className="flex gap-1">
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        <button className="text-[9px] text-cyan-400 font-black uppercase hover:underline tracking-widest">Global Asset List</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {markets.map((m, i) => (
          <MarketTile 
            key={i} 
            {...m} 
            isActive={activeSymbol === m.symbol} 
            onSelect={onSelect} 
          />
        ))}
      </div>
    </div>
  );
};
