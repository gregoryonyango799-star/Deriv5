
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'Mon', pnl: 400 },
  { name: 'Tue', pnl: 300 },
  { name: 'Wed', pnl: -200 },
  { name: 'Thu', pnl: 278 },
  { name: 'Fri', pnl: 189 },
  { name: 'Sat', pnl: 239 },
  { name: 'Sun', pnl: 349 },
];

export const Profile: React.FC = () => {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile Card */}
        <div className="glass-panel p-8 rounded-[40px] lg:w-[400px] border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-transparent relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="relative group">
               <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
               <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 p-1 relative z-10 group-hover:border-cyan-500 transition-all duration-500">
                 <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-4xl text-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.5)]">
                    TS
                 </div>
               </div>
               <div className="absolute -bottom-2 right-4 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#0a0a16] shadow-lg"></div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Sir Tony Stark</h2>
              <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.4em] mt-1">Institutional Neural Trader</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Efficiency</p>
                <p className="text-xl font-mono font-black text-emerald-400">84.2%</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Rank</p>
                <p className="text-xl font-mono font-black text-indigo-400">Elite</p>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
                 <span>Neural Link Stability</span>
                 <span className="text-cyan-400">100%</span>
               </div>
               <div className="h-2 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden p-0.5">
                  <div className="h-full w-full bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               </div>
            </div>
          </div>
        </div>

        {/* Tactical Performance */}
        <div className="flex-1 space-y-8">
           <div className="glass-panel p-8 rounded-[40px] border border-white/5 h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-lg font-black uppercase tracking-widest text-white leading-none">Neural Equity Projection</h3>
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2">7-Day Aggregated Performance</p>
                </div>
                <div className="flex gap-2">
                   {['Week', 'Month', 'Year'].map(t => (
                     <button key={t} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${t === 'Week' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/5 text-gray-500 hover:text-white'}`}>{t}</button>
                   ))}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#334155" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#334155" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }} 
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="pnl" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Pips Cleared', val: '12,450', col: 'emerald' },
                { label: 'Avg Holding Time', val: '4h 12m', col: 'indigo' },
                { label: 'Max Drawdown', val: '2.14%', col: 'rose' }
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors group">
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 group-hover:text-cyan-400 transition-colors">{stat.label}</p>
                   <h4 className={`text-2xl font-black font-mono tracking-tighter text-${stat.col}-400`}>{stat.val}</h4>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
