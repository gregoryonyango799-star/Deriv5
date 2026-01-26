
import React, { useState, useEffect, useMemo } from 'react';
import { deriv, ActiveSymbol } from '../services/derivService';

interface MarketTileProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  type: string;
  isActive?: boolean;
  onSelect?: (symbol: string) => void;
  isOpen?: boolean;
}

const MarketTile: React.FC<MarketTileProps> = ({ symbol, name, price, change, type, isActive, onSelect, isOpen = true }) => {
  const isUp = change.startsWith('+');
  return (
    <div 
      onClick={() => isOpen && onSelect?.(symbol)}
      className={`glass-panel p-3 rounded-xl border-l-2 transition-all cursor-pointer group flex flex-col justify-between h-28 relative overflow-hidden ${
        !isOpen ? 'opacity-50 cursor-not-allowed' :
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
      {!isOpen && (
        <div className="absolute top-1 right-1 text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
          CLOSED
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
        <p className="text-[8px] text-gray-500 font-mono truncate">{symbol}</p>
      </div>
    </div>
  );
};

interface MarketWatchProps {
  onSelect?: (symbol: string) => void;
  activeSymbol?: string;
}

type MarketCategory = 'all' | 'forex' | 'synthetic_index' | 'indices' | 'commodities' | 'cryptocurrency' | 'stocks';

const MARKET_CATEGORIES: { id: MarketCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'synthetic_index', label: 'Synthetics', icon: '⚡' },
  { id: 'forex', label: 'Forex', icon: '💱' },
  { id: 'indices', label: 'Indices', icon: '📊' },
  { id: 'commodities', label: 'Commodities', icon: '🛢️' },
  { id: 'cryptocurrency', label: 'Crypto', icon: '₿' },
  { id: 'stocks', label: 'Stocks', icon: '📈' },
];

export const MarketWatch: React.FC<MarketWatchProps> = ({ onSelect, activeSymbol }) => {
  const [activeSymbols, setActiveSymbols] = useState<ActiveSymbol[]>([]);
  const [tickPrices, setTickPrices] = useState<Map<string, { price: number; prevPrice: number }>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('synthetic_index');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = deriv.addListener((data) => {
      if (data.msg_type === 'active_symbols' && !data.error) {
        setActiveSymbols(data.active_symbols || []);
        setIsLoading(false);
        
        // Subscribe to ticks for initial symbols
        const symbols = (data.active_symbols || []).slice(0, 30).map((s: ActiveSymbol) => s.symbol);
        deriv.subscribeToTicks(symbols);
      }

      if (data.msg_type === 'tick' && data.tick) {
        setTickPrices(prev => {
          const newMap = new Map(prev);
          const currentPrice = data.tick.quote;
          const existing = prev.get(data.tick.symbol);
          newMap.set(data.tick.symbol, {
            price: currentPrice,
            prevPrice: existing?.price || currentPrice
          });
          return newMap;
        });
      }
    });

    // Fetch active symbols if not already loaded
    if (deriv.activeSymbols.length > 0) {
      setActiveSymbols(deriv.activeSymbols);
      setIsLoading(false);
    }

    return unsub;
  }, []);

  const filteredSymbols = useMemo(() => {
    let filtered = activeSymbols;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.market === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.display_name.toLowerCase().includes(query) ||
        s.symbol.toLowerCase().includes(query)
      );
    }
    
    // Sort: open markets first, then by display name
    filtered = [...filtered].sort((a, b) => {
      if (a.exchange_is_open !== b.exchange_is_open) {
        return b.exchange_is_open - a.exchange_is_open;
      }
      return a.display_name.localeCompare(b.display_name);
    });
    
    return filtered.slice(0, 24); // Limit to 24 for performance
  }, [activeSymbols, selectedCategory, searchQuery]);

  // Subscribe to new symbols when category changes
  useEffect(() => {
    const symbols = filteredSymbols.map(s => s.symbol);
    deriv.subscribeToTicks(symbols);
  }, [filteredSymbols]);

  const getMarketDisplayData = (sym: ActiveSymbol) => {
    const tickData = tickPrices.get(sym.symbol);
    const price = tickData?.price || sym.spot || 0;
    const prevPrice = tickData?.prevPrice || sym.spot || 0;
    const change = prevPrice ? ((price - prevPrice) / prevPrice * 100) : 0;
    
    return {
      symbol: sym.symbol,
      name: sym.display_name,
      price: price > 100 ? price.toFixed(2) : price.toFixed(5),
      change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
      type: sym.submarket_display_name || sym.market_display_name,
      isOpen: sym.exchange_is_open === 1
    };
  };

  const marketCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeSymbols.length };
    activeSymbols.forEach(s => {
      counts[s.market] = (counts[s.market] || 0) + 1;
    });
    return counts;
  }, [activeSymbols]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Neural Scanner</h3>
          <div className="flex gap-1">
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">{activeSymbols.length} assets</span>
        </div>
        
        {/* Search */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {MARKET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-black/20 text-gray-500 border border-white/5 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className="bg-black/40 px-1.5 py-0.5 rounded text-[8px]">
              {marketCounts[cat.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Market Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-panel p-3 rounded-xl h-28 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : filteredSymbols.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No markets found. Try a different category or search term.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredSymbols.map((sym) => {
            const data = getMarketDisplayData(sym);
            return (
              <MarketTile 
                key={sym.symbol} 
                {...data}
                isActive={activeSymbol === sym.symbol} 
                onSelect={onSelect} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
