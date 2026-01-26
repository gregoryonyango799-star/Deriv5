import React, { useState, useEffect } from 'react';
import { deriv, DerivAccount } from '../services/derivService';
import { DEFAULT_SETTINGS } from '../constants';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState<DerivAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<DerivAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('accounts');

  useEffect(() => {
    const savedSettings = localStorage.getItem('aite_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings');
      }
    }

    // Initial fetch from service
    const updateFromService = () => {
      if (deriv.accounts.length > 0) {
        console.log('Settings: Loading', deriv.accounts.length, 'accounts from service');
        setAccounts(deriv.accounts);
      }
      if (deriv.currentAccount) {
        setCurrentAccount(deriv.currentAccount);
      }
      setIsConnected(deriv.getIsAuthorized());
    };
    
    updateFromService();
    
    const unsub = deriv.addListener((data) => {
      if (data.msg_type === 'authorize' && !data.error) {
        console.log('Settings: Received authorize, updating accounts');
        setIsConnected(true);
        setAccounts([...deriv.accounts]);
        setCurrentAccount(deriv.currentAccount ? {...deriv.currentAccount} : null);
      }
      
      if (data.msg_type === 'accounts_updated' && data.accounts) {
        console.log('Settings: Accounts updated, refreshing display');
        setAccounts([...data.accounts]);
      }
      
      if (data.msg_type === 'account_switched' && data.account) {
        setCurrentAccount({ ...data.account });
        setAccounts([...deriv.accounts]);
      }
      
      if (data.msg_type === 'current_account_balance') {
        if (currentAccount && currentAccount.loginid === data.loginid) {
          setCurrentAccount(prev => prev ? { ...prev, balance: data.balance } : null);
        }
        setAccounts([...deriv.accounts]);
      }
      
      if (data.msg_type === 'balance' && !data.error) {
        setAccounts([...deriv.accounts]);
        if (currentAccount && currentAccount.loginid === data.balance.loginid) {
          setCurrentAccount(deriv.currentAccount ? { ...deriv.currentAccount } : null);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('aite_settings', JSON.stringify(settings));
      
      // Update Deriv API key
      if (settings.derivApiKey) {
        deriv.setApiKey(settings.derivApiKey);
      }
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    }
    setIsSaving(false);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      await deriv.connect();
      setTimeout(() => {
        if (deriv.getIsAuthorized()) {
          setSaveMessage({ type: 'success', text: 'Connection successful!' });
          setIsConnected(true);
        } else {
          setSaveMessage({ type: 'error', text: 'Connection failed. Check API key.' });
          setIsConnected(false);
        }
        setTestingConnection(false);
      }, 2000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Connection failed' });
      setTestingConnection(false);
    }
  };

  const switchAccount = async (loginid: string) => {
    if (currentAccount?.loginid === loginid) return;
    
    // Ensure accounts are loaded
    if (accounts.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please wait for accounts to load...' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    
    // Check if account exists
    const targetAccount = accounts.find(acc => acc.loginid === loginid);
    if (!targetAccount) {
      setSaveMessage({ type: 'error', text: `Account ${loginid} not found. Available: ${accounts.map(a => a.loginid).join(', ')}` });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }
    
    setSaveMessage({ type: 'success', text: `Switching to ${loginid}...` });
    
    try {
      await deriv.switchAccount(loginid);
      setCurrentAccount(deriv.currentAccount);
      setAccounts([...deriv.accounts]);
      setSaveMessage({ type: 'success', text: `Switched to ${loginid}` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || `Failed to switch account.` });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? This will clear all stored tokens.')) {
      deriv.clearTokens();
      deriv.disconnect();
      window.location.reload();
    }
  };

  const handleDerivLogin = () => {
    window.location.href = deriv.getOAuthUrl();
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('aite_settings');
      setSaveMessage({ type: 'success', text: 'Settings reset to default' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const demoAccounts = accounts.filter(acc => acc.is_virtual === 1);
  const realAccounts = accounts.filter(acc => acc.is_virtual === 0);

  const sections = [
    { id: 'accounts', label: 'Accounts', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )},
    { id: 'api', label: 'API Keys', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    )},
    { id: 'risk', label: 'Risk', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"/><path d="M12 16v.01"/><path d="M12 8v4"/></svg>
    )}
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        {saveMessage && (
          <div className={`px-4 py-2 rounded text-sm ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Account Management Section */}
        <section className="p-6 rounded-xl border border-cyan-500/20 bg-black/20">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Account Management</h3>
          
          {/* Connection Status & Auth Buttons */}
          <div className="mb-4 p-4 bg-black/30 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <div>
                  <p className="text-sm font-bold">{isConnected ? 'Connected to Deriv' : 'Disconnected'}</p>
                  <p className="text-xs text-gray-500">{accounts.length} accounts • {Object.keys(deriv.getStoredTokens()).length} tokens stored</p>
                </div>
              </div>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDerivLogin}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Login with Deriv
              </button>
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-400 transition-all disabled:opacity-50"
              >
                {testingConnection ? 'Connecting...' : 'Reconnect'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-400 transition-all hover:bg-rose-500/30"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Current Active Account */}
          {currentAccount && (
            <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-xl border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-cyan-400 font-bold">Active Account</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  currentAccount.is_virtual ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {currentAccount.is_virtual ? 'DEMO' : 'REAL'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black font-mono">{currentAccount.loginid}</span>
                <span className="text-xl font-mono font-bold text-cyan-400">
                  {(currentAccount.balance ?? 0).toLocaleString()} {currentAccount.currency}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demo Accounts */}
            <div className="space-y-3">
              <p className="text-xs text-amber-400 uppercase font-bold">Demo Accounts ({demoAccounts.length})</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {demoAccounts.length > 0 ? demoAccounts.map(acc => (
                  <button
                    key={acc.loginid}
                    onClick={() => switchAccount(acc.loginid)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      currentAccount?.loginid === acc.loginid
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-sm font-bold">{acc.loginid}</span>
                      <div className="flex items-center gap-1">
                        {currentAccount?.loginid === acc.loginid && (
                          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{acc.currency}</span>
                      <span className="text-sm font-mono text-amber-400 font-bold">
                        {(acc.balance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-6 text-gray-500 text-sm">No demo accounts</div>
                )}
              </div>
            </div>

            {/* Real Accounts */}
            <div className="space-y-3">
              <p className="text-xs text-emerald-400 uppercase font-bold">Real Accounts ({realAccounts.length})</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {realAccounts.length > 0 ? realAccounts.map(acc => (
                  <button
                    key={acc.loginid}
                    onClick={() => switchAccount(acc.loginid)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      currentAccount?.loginid === acc.loginid
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-sm font-bold">{acc.loginid}</span>
                      <div className="flex items-center gap-1">
                        {currentAccount?.loginid === acc.loginid && (
                          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{acc.currency}</span>
                      <span className="text-sm font-mono text-emerald-400 font-bold">
                        {(acc.balance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-6 text-gray-500 text-sm">No real accounts</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Info about OAuth */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400">
              <strong>💡 Tip:</strong> To switch between demo and real accounts, click "Login with Deriv" above. 
              This will grant tokens for all your accounts, enabling seamless switching.
            </p>
          </div>
        </section>

        {/* API Configuration */}
        <section className="p-6 rounded-xl border border-indigo-500/20 bg-black/20">
          <h3 className="text-lg font-bold mb-4 text-indigo-400">API Configuration</h3>
          
          <div className="space-y-4">
            {/* Deriv API Token */}
            <div className="space-y-2">
              <label className="text-xs text-cyan-400 uppercase font-bold">Deriv API Token (Manual Entry)</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.derivApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, derivApiKey: e.target.value })}
                    className="w-full bg-black/30 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none font-mono"
                    placeholder="Enter Deriv API Token (mGcPVj7dP04873c)"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600">Master API token works for both demo and real accounts</p>
            </div>

            {/* Gemini API Key */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase font-bold">Gemini Neural API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={settings.geminiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500/50 focus:outline-none font-mono"
                    placeholder="Enter Google Gemini API Key"
                  />
                  <button
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showGeminiKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600">Powers JARVIS intelligence and market predictions</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={resetSettings}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'SAVE CONFIGURATION'}
          </button>
        </div>
      </div>
    </div>
  );
};