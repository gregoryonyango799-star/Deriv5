
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-full overflow-hidden bg-[#0a0a16] border-t border-white/5 p-4 md:p-8 mt-auto z-40 mb-16 md:mb-0">
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 w-full">
        <div className="space-y-3 md:space-y-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-cyan-500 rounded flex items-center justify-center text-black font-black text-sm">A</div>
            <span className="font-bold text-base md:text-lg tracking-tighter uppercase text-white">AITE Ecosystem</span>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed max-w-xs">
            Next-gen algorithmic trading powered by neural architecture and emotional intelligence.
          </p>
          <div className="flex gap-4">
            <span className="text-gray-600 hover:text-cyan-400 cursor-pointer transition-colors text-xs">Twitter</span>
            <span className="text-gray-600 hover:text-cyan-400 cursor-pointer transition-colors text-xs">Discord</span>
            <span className="text-gray-600 hover:text-cyan-400 cursor-pointer transition-colors text-xs">Github</span>
          </div>
        </div>

        <div className="hidden md:block">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">Neural Infrastructure</h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="hover:text-white cursor-pointer transition-colors">Core Telemetry</li>
            <li className="hover:text-white cursor-pointer transition-colors">Bot Ensembles</li>
            <li className="hover:text-white cursor-pointer transition-colors">Psychology Engine</li>
            <li className="hover:text-white cursor-pointer transition-colors">Guardian Mode</li>
          </ul>
        </div>

        <div className="hidden md:block">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">Ecosystem</h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="hover:text-white cursor-pointer transition-colors">Deriv Integration</li>
            <li className="hover:text-white cursor-pointer transition-colors">Macro Feed</li>
            <li className="hover:text-white cursor-pointer transition-colors">API Uplink</li>
            <li className="hover:text-white cursor-pointer transition-colors">Neural Assets</li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3 md:mb-4">Protocol Status</h4>
          <div className="space-y-2 md:space-y-3">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] md:text-[10px] text-emerald-500 font-black uppercase tracking-widest">All Systems Operational</span>
             </div>
             <p className="text-[9px] md:text-[10px] text-gray-600 leading-normal">
               AITE protocols are for educational purposes. Trading involves risk.
             </p>
             <p className="text-[9px] md:text-[10px] text-gray-700 mt-2">© 2024 AITE NEURAL LABS.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
