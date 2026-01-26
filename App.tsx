import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Intelligence } from './components/Intelligence';
import { Psychology } from './components/Psychology';
import { BotManagement } from './components/BotManagement';
import { TradeJournal } from './components/TradeJournal';
import { Settings } from './components/Settings';
import { EquityTrajectory } from './components/EquityTrajectory';
import { JarvisAssistant } from './components/JarvisAssistant';
import { Profile } from './components/Profile';
import { Positions } from './components/Positions';
import { Footer } from './components/Footer';
import { Login } from './components/Login';
import { deriv } from './services/derivService';
import { jarvis } from './services/geminiService';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Initialize Gemini service with stored API key
    try {
      const settings = localStorage.getItem('aite_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.geminiApiKey) {
          jarvis.setApiKey(parsed.geminiApiKey);
          console.log('App: Gemini API key loaded from settings');
        }
      }
    } catch (e) {
      console.error('App: Failed to load Gemini API key:', e);
    }

    // Check if user has stored tokens or API key
    const tokens = deriv.getStoredTokens();
    
    if (Object.keys(tokens).length > 0) {
      // Try to connect with stored token
      const firstToken = Object.values(tokens)[0];
      deriv.connect(firstToken).then(() => {
        setIsLoggedIn(true);
        setIsCheckingAuth(false);
        
        // Restore running bots after connection is established
        console.log('App: Restoring bots...');
        deriv.restoreBots();
      }).catch((err) => {
        console.error('App init auth error:', err);
        setIsCheckingAuth(false);
        setIsLoggedIn(false);
      });
    } else {
      // No stored tokens, require login
      setIsCheckingAuth(false);
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // Restore bots after successful login
    setTimeout(() => {
      deriv.restoreBots();
    }, 1000);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white">AITE</h2>
          <p className="text-cyan-400 mt-2">Initializing Neural Uplink...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Terminal', icon: <ICONS.Terminal className="w-5 h-5"/> },
    { id: 'trajectory', label: 'Analysis', icon: <ICONS.Analysis className="w-5 h-5"/> },
    { id: 'positions', label: 'Positions', icon: <ICONS.Intelligence className="w-5 h-5"/> },
    { id: 'intelligence', label: 'Intelligence', icon: <ICONS.Intelligence className="w-5 h-5"/> },
    { id: 'psychology', label: 'Neuro', icon: <ICONS.Neuro className="w-5 h-5"/> },
    { id: 'bots', label: 'Bots', icon: <ICONS.Bot className="w-5 h-5"/> },
    { id: 'journal', label: 'Logs', icon: <ICONS.Logs className="w-5 h-5"/> },
    { id: 'settings', label: 'Config', icon: <ICONS.Settings className="w-5 h-5"/> },
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
      case 'positions': return <Positions />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-slate-200 flex flex-col md:flex-row overflow-x-hidden w-full max-w-full">
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
              <span className={`transition-transform group-hover:scale-125 ${activeTab === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
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
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar relative bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)] flex flex-col pb-16 md:pb-0 w-full max-w-full">
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 md:p-6 glass-panel border-b border-white/5 backdrop-blur-3xl w-full max-w-full">
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

        <div className="max-w-[1600px] mx-auto w-full flex-1 px-2 md:px-4">
          {renderContent()}
        </div>

        <Footer />
        <JarvisAssistant />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a16]/95 border-t border-white/10 backdrop-blur-3xl z-50 flex justify-around items-center px-1 safe-area-inset-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-lg transition-all ${activeTab === item.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500'}`}
          >
            <span>{item.icon}</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">{item.label}</span>
            {activeTab === item.id && <div className="w-1 h-1 bg-cyan-400 rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
