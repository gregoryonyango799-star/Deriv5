
import React, { useState, useRef, useEffect } from 'react';
import { jarvis } from '../services/geminiService';
import { JarvisMessage } from '../types';

export const JarvisAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<JarvisMessage[]>([
    { role: 'assistant', content: 'Neural link established. Good morning, Sir. I have calibrated the SMC algorithms and am monitoring real-time liquidity clusters. How shall we proceed?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: JarvisMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const context = "Equity: Active, Mode: Automated, Regime: Trending, Market Status: Volatile Expansion.";
    const response = await jarvis.getJarvisResponse(inputValue, context);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-16 h-16 md:w-20 md:h-20 group z-[60] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl group-hover:bg-cyan-400/40 animate-pulse"></div>
        <div className="relative w-12 h-12 md:w-16 md:h-16 bg-black rounded-full border-4 border-[#1a1a2e] shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="15 10" className="animate-[spin_40s_linear_infinite]" />
              <circle cx="50" cy="50" r="10" fill="currentColor" className="animate-pulse" />
           </svg>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 md:bottom-24 md:right-6 md:left-auto md:w-[380px] h-[70vh] md:h-[550px] glass-panel rounded-[32px] border border-cyan-500/40 flex flex-col z-[60] shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-white/10 flex justify-between items-center bg-[#0a0a16]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                 <span className="font-black text-[10px] tracking-[0.2em] text-cyan-400 uppercase leading-none">JARVIS CORE</span>
                 <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">UPLINK ESTABLISHED</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-gray-500">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03),transparent_70%)]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                  m.role === 'user' 
                  ? 'bg-cyan-600 text-white rounded-tr-none' 
                  : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none font-mono text-[11px] leading-relaxed'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-2xl text-cyan-400 text-[10px] font-mono animate-pulse">
                   Synthesizing...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-5 border-t border-white/10 bg-black/60">
            <div className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Direct Command..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 pr-12 text-xs font-mono text-cyan-100 placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/50"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg bg-cyan-500 text-black shadow-lg">
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
