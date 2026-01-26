
import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const [open, setOpen] = useState<{ about: boolean; links: boolean }>(() => ({ about: false, links: false }));

  return (
    <footer className="w-full max-w-full overflow-hidden bg-[#0a0a16]/95 backdrop-blur-xl border-t border-white/5 p-3 sm:p-4 md:p-8 mt-auto z-40 mb-2 md:mb-0 pb-6 md:pb-0">
      <div className="max-w-[1600px] mx-auto w-full">
        {/* Mobile condensed header */}
        <div className="flex items-center justify-between md:hidden mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center text-black font-black">A</div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">AITE</div>
              <div className="text-[10px] text-gray-400">Neural Trading</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(s => ({ ...s, about: !s.about }))} className="text-xs text-gray-400 px-3 py-2 bg-white/3 rounded-lg">About</button>
            <button onClick={() => setOpen(s => ({ ...s, links: !s.links }))} className="text-xs text-gray-400 px-3 py-2 bg-white/3 rounded-lg">Links</button>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center text-black font-black">A</div>
              <div>
                <div className="text-base md:text-lg font-black text-white">AITE Ecosystem</div>
                <div className="text-xs text-gray-400">Adaptive Intelligence Trading Engine</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 max-w-sm">Next-gen algorithmic trading powered by neural architecture and emotional intelligence.</p>
            <div className="flex gap-3 items-center">
              <a href="#" className="text-gray-400 hover:text-cyan-400 text-sm">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 text-sm">Discord</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 text-sm">Github</a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">Neural Infrastructure</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-white cursor-pointer transition-colors">Core Telemetry</li>
              <li className="hover:text-white cursor-pointer transition-colors">Bot Ensembles</li>
              <li className="hover:text-white cursor-pointer transition-colors">Psychology Engine</li>
              <li className="hover:text-white cursor-pointer transition-colors">Guardian Mode</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">Ecosystem</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-white cursor-pointer transition-colors">Deriv Integration</li>
              <li className="hover:text-white cursor-pointer transition-colors">Macro Feed</li>
              <li className="hover:text-white cursor-pointer transition-colors">API Uplink</li>
              <li className="hover:text-white cursor-pointer transition-colors">Neural Assets</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3">Protocol Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">All Systems Operational</span>
              </div>
              <p className="text-xs text-gray-500">AITE protocols are for educational purposes. Trading involves risk.</p>
              <p className="text-xs text-gray-400 mt-2">© {new Date().getFullYear()} AITE NEURAL LABS • v{process.env.npm_package_version || '0.0.0'}</p>
            </div>
          </div>
        </div>

        {/* Mobile expandable sections */}
        <div className={`md:hidden space-y-3 transition-all ${open.about ? 'max-h-[400px]' : 'max-h-0 overflow-hidden'}`}>
          <div className="bg-white/3 rounded-xl p-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center text-black font-black">A</div>
              <div>
                <div className="text-sm font-black text-white">About AITE</div>
                <div className="text-xs text-gray-400">Next-gen algorithmic trading powered by neural architecture.</div>
                <p className="text-[11px] text-gray-300 mt-2">Use responsibly. Trading carries substantial risks.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`md:hidden space-y-3 transition-all ${open.links ? 'max-h-[360px]' : 'max-h-0 overflow-hidden'}`}>
          <div className="bg-white/3 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-black text-white">Quick Links</div>
              <div className="text-xs text-gray-400">v{process.env.npm_package_version || '0.0.0'}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">Deriv</a>
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">Docs</a>
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">Support</a>
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">GitHub</a>
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">Privacy</a>
              <a className="text-xs text-gray-300 bg-black/20 py-2 rounded-lg text-center hover:bg-cyan-500/10">Terms</a>
            </div>
          </div>
        </div>

        {/* Bottom skinny bar */}
        <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Made with ❤️ in AITE Labs</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="text-gray-400 hover:text-cyan-400">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400">Discord</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400">GitHub</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="hidden sm:inline text-[11px] text-emerald-400 font-black">Operational</span>
            </div>
            <div className="text-gray-500">v{process.env.npm_package_version || '0.0.0'}</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
