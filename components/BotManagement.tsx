
import React, { useState } from 'react';
import { INITIAL_BOTS } from '../constants';

export const BotManagement: React.FC = () => {
  const [bots, setBots] = useState(INITIAL_BOTS);

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-10 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <div key={bot.id} className={`glass-panel p-6 rounded-2xl border ${bot.active ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 opacity-70'} transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-xl font-bold ${bot.active ? 'text-white' : 'text-gray-500'}`}>{bot.name}</h3>
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Institutional Neural Core</p>
              </div>
              <button 
                onClick={() => toggleBot(bot.id)}
                className={`w-12 h-6 rounded-full relative transition-colors ${bot.active ? 'bg-cyan-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${bot.active ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 min-h-[40px]">{bot.description}</p>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-[10px] text-gray-500 uppercase">Win Rate</p>
                <p className="text-sm font-bold text-emerald-400">{bot.winRate}%</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-[10px] text-gray-500 uppercase">Trades</p>
                <p className="text-sm font-bold">{bot.totalTrades}</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-[10px] text-gray-500 uppercase">PNL</p>
                <p className={`text-sm font-bold ${bot.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  ${bot.pnl.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Capital Allocation</span>
                <span className="text-cyan-400">{bot.allocation}%</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${bot.allocation}%` }} />
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty state for adding new bot */}
        <div className="glass-panel p-6 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-full border border-dashed border-current flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">+</div>
          <span className="font-bold text-sm tracking-widest uppercase">Inject New Strategy</span>
        </div>
      </div>
    </div>
  );
};
