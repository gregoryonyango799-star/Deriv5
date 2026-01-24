
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Intelligence } from './components/Intelligence';
import { Psychology } from './components/Psychology';
import { BotManagement } from './components/BotManagement';
import { TradeJournal } from './components/TradeJournal';
import { Settings } from './components/Settings';
import { EquityTrajectory } from './components/EquityTrajectory';
import { JarvisAssistant } from './components/JarvisAssistant';
import { Profile } from './components/Profile';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Terminal', icon: '📊' },
    { id: 'trajectory', label: 'Analysis', icon: '📈' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
    { id: 'psychology', label: 'Neuro', icon: '⚡' },
    { id: 'bots', label: 'Bots', icon: '🤖' },
    { id: 'journal', label: 'Logs', icon: '📓' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'intelligence': return <Intelligence />;
      case 'psychology': return <Psychology />;
      case 'bots': return <BotManagement />;
      case 'journal': return <TradeJournal />;
      case 'settings': return <Settings />;
      case 'trajectory': return <EquityTrajectory />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-slate-200 flex flex-col md:flex-row overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <nav 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`hidden md:flex flex-col items-center lg:items-start bg-[#0a0a16] border-r border-white/5 p-4 gap-8 z-40 relative sidebar-transition ${isSidebarHovered ? 'sidebar-expanded' : 'w-20'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3 py-4 relative">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] flex-shrink-0">
            A
          </div>
          {isSidebarHovered && (
            <span className="font-bold text-xl tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent uppercase whitespace-nowrap overflow-hidden">
              AITE Core
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-2 relative">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className={`text-xl transition-transform group-hover:scale-125 ${activeTab === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
              {isSidebarHovered && (
                <span className="font-bold text-xs tracking-widest uppercase whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="w-full border-t border-white/5 pt-4 relative">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border transition-all hover:bg-white/10 ${activeTab === 'profile' ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/5'} ${isSidebarHovered ? '' : 'justify-center'}`}
           >
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center font-black text-black text-xs shadow-lg shadow-cyan-500/20">TS</div>
              {isSidebarHovered && (
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-black truncate text-white">Sir Stark</p>
                  <p className="text-[9px] text-cyan-500 font-mono animate-pulse uppercase tracking-tighter">Identity Sync</p>
                </div>
              )}
           </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)] flex flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 md:p-6 glass-panel border-b border-white/5 backdrop-blur-3xl">
          <div className="flex items-center gap-3 md:gap-4">
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-white via-cyan-400 to-gray-500 bg-clip-text text-transparent truncate max-w-[150px] md:max-w-none">
              {activeTab === 'dashboard' ? 'Neural Terminal' : activeTab}
            </h1>
            <div className="flex gap-2 items-center px-2 md:px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[7px] md:text-[9px] text-cyan-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">Uplink Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Protocol Feed</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Deriv Live
              </span>
            </div>
            <button className="relative p-2 bg-white/5 rounded-lg border border-white/10">
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0a16]" />
            </button>
            <button onClick={() => setActiveTab('profile')} className="md:hidden w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-black text-black text-xs shadow-lg">TS</button>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto w-full flex-1">
          {renderContent()}
        </div>

        <Footer />
        <JarvisAssistant />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a16]/95 border-t border-white/10 backdrop-blur-3xl z-50 flex justify-around items-center px-2">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-cyan-400' : 'text-gray-500'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeTab === item.id && <div className="w-1 h-1 bg-cyan-400 rounded-full mt-0.5" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
