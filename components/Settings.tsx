
import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top-10 duration-700">
      <section className="space-y-4">
        <h3 className="text-xl font-bold border-b border-cyan-500/30 pb-2 text-cyan-400">Risk Matrix Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Max Risk Per Trade</label>
            <input type="range" className="w-full accent-cyan-500" min="0.1" max="5" step="0.1" />
            <div className="flex justify-between text-xs font-mono text-cyan-400"><span>0.1%</span><span>1.5%</span><span>5.0%</span></div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Daily Loss Limit</label>
            <div className="flex gap-2">
              <input type="text" defaultValue="5.0" className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none" />
              <span className="flex items-center text-gray-500">%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold border-b border-cyan-500/30 pb-2 text-cyan-400">Neural Interface Uplink</h3>
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <div className="space-y-2">
             <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Deriv API Uplink</label>
             <input type="password" value="YpvqfDXnUSo7gF1" readOnly className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-3 text-sm font-mono text-cyan-400 focus:outline-none" />
             <p className="text-[10px] text-gray-600 italic">Neural connection verified. 12ms latency detected.</p>
          </div>
          <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-sm font-bold">Automatic Execution Protocol</span>
             </div>
             <button className="px-4 py-1.5 bg-emerald-600 rounded-lg text-xs font-bold">Enabled</button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold border-b border-cyan-500/30 pb-2 text-cyan-400">JARVIS Personalization</h3>
        <div className="grid grid-cols-3 gap-4">
           {['Sophisticated', 'Military', 'Concise'].map(v => (
             <button key={v} className={`p-4 rounded-xl border text-sm font-bold transition-all ${v === 'Sophisticated' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}>
               {v}
             </button>
           ))}
        </div>
      </section>

      <div className="pt-10">
         <button className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-transform">COMMIT PROTOCOLS</button>
      </div>
    </div>
  );
};
