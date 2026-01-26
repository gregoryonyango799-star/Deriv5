import React, { useState, useEffect } from 'react';
import { deriv } from '../services/derivService';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    // Check if we have OAuth tokens in URL
    const oauthPromise = deriv.processOAuthCallback();
    if (oauthPromise && typeof oauthPromise !== 'boolean') {
      setIsConnecting(true);
      oauthPromise.then((success) => {
        if (success) {
          onLoginSuccess();
        } else {
          setError('OAuth authorization failed');
          setIsConnecting(false);
        }
      });
      return;
    } else if (oauthPromise === true) {
      // Should not happen with new API but for safety
      onLoginSuccess();
      return;
    }
    
    // Check for existing stored tokens
    const tokens = deriv.getStoredTokens();
    if (Object.keys(tokens).length > 0) {
      // Try to connect with first available token
      const firstToken = Object.values(tokens)[0];
      setIsConnecting(true);
      deriv.connect(firstToken).then(() => {
        onLoginSuccess();
      }).catch((err) => {
        console.error('Login error:', err);
        setIsConnecting(false);
        setError('Stored token expired or connection failed. Please login again.');
      });
    }
  }, [onLoginSuccess]);

  const handleDerivLogin = () => {
    window.location.href = deriv.getOAuthUrl();
  };

  const handleApiKeyLogin = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await deriv.connect(apiKey.trim());
      
      if (deriv.getIsAuthorized() && deriv.currentAccount) {
        // Store the token for this account
        deriv.storeToken(deriv.currentAccount.loginid, apiKey.trim());
        onLoginSuccess();
      } else {
        setError('Authorization failed');
        setIsConnecting(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Connection failed. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>
      
      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AITE</h1>
          <p className="text-gray-500 text-sm mt-1">AI Trading Engine</p>
        </div>

        {/* Main Card */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-6">Connect your Deriv account to start trading</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          {isConnecting ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Connecting to Deriv...</p>
            </div>
          ) : (
            <>
              {/* Deriv OAuth Button */}
              <button
                onClick={handleDerivLogin}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-bold text-white transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3 mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Login with Deriv
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black/40 text-gray-500">or</span>
                </div>
              </div>

              {/* API Key Option */}
              {!showApiKeyInput ? (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-gray-300 transition-all"
                >
                  Use API Token
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Deriv API Token</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApiKeyLogin()}
                      placeholder="Enter your API token"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-gray-600 mt-2">
                      Get your API token from{' '}
                      <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
                        Deriv API Settings
                      </a>
                    </p>
                  </div>
                  
                  <button
                    onClick={handleApiKeyLogin}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold text-white transition-all hover:scale-[1.02] shadow-lg"
                  >
                    Connect
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowApiKeyInput(false);
                      setApiKey('');
                      setError(null);
                    }}
                    className="w-full py-2 text-gray-500 hover:text-white text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-600">
          <p>By logging in, you agree to the terms of service</p>
          <p className="mt-1">Powered by Deriv API</p>
        </div>
      </div>
    </div>
  );
};
