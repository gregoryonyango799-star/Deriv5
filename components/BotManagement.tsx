
import React, { useState, useEffect } from 'react';
import { INITIAL_BOTS, CONTRACT_TYPES, DURATION_UNITS } from '../constants';
import { deriv, BotSettings } from '../services/derivService';
import { BotStrategy } from '../types';
import { jarvis } from '../services/geminiService';

interface BotCardProps {
  bot: BotStrategy;
  isRunning: boolean;
  liveStats: { trades: number; openTrades: number; profit: number; currentAmount: number } | null;
  onToggle: () => void;
  onEdit: () => void;
  onStart: () => void;
  onStop: () => void;
  symbols: { symbol: string; display_name: string }[];
}

const BotCard: React.FC<BotCardProps> = ({ 
  bot, 
  isRunning, 
  liveStats,
  onToggle, 
  onEdit, 
  onStart, 
  onStop,
  symbols 
}) => {
  const displayStats = liveStats || { trades: bot.totalTrades, openTrades: 0, profit: bot.pnl, currentAmount: bot.amount || 1 };
  
  return (
    <div className={`glass-panel p-5 rounded-2xl border transition-all duration-300 ${
      isRunning 
        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
        : bot.active 
          ? 'border-cyan-500/30 bg-cyan-500/5' 
          : 'border-white/5 opacity-80'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-black ${isRunning ? 'text-emerald-400' : bot.active ? 'text-white' : 'text-gray-500'}`}>
              {bot.name}
            </h3>
            {isRunning && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase">Live</span>
              </div>
            )}
            {isRunning && displayStats.openTrades > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 rounded-full">
                <span className="text-[9px] font-black text-amber-400 uppercase">{displayStats.openTrades} Open</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">{bot.symbol || 'R_100'}</p>
        </div>
        <button 
          onClick={onToggle}
          className={`w-14 h-7 sm:w-12 sm:h-6 rounded-full relative transition-all flex-shrink-0 ${
            bot.active 
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 sm:w-5 sm:h-5 sm:top-0.5 rounded-full bg-white transition-all shadow-lg ${
            bot.active ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'
          }`} />
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{bot.description}</p>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-black/30 rounded-lg border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Total</p>
          <p className="text-sm font-black text-white">{displayStats.trades}</p>
        </div>
        <div className="text-center p-2 bg-black/30 rounded-lg border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Open</p>
          <p className="text-sm font-black text-amber-400">{displayStats.openTrades || 0}</p>
        </div>
        <div className="text-center p-2 bg-black/30 rounded-lg border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-bold">PNL</p>
          <p className={`text-sm font-black ${displayStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            ${displayStats.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bot Settings Preview */}
      <div className="space-y-2 mb-4 p-3 bg-black/20 rounded-xl border border-white/5">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Contract:</span>
          <span className="text-cyan-400 font-mono">{bot.contractType || 'CALL'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Duration:</span>
          <span className="text-white font-mono">{bot.duration || 1} {bot.durationUnit || 'm'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Stake:</span>
          <span className="text-amber-400 font-mono">${displayStats.currentAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Martingale:</span>
          <span className={`font-mono ${bot.martingale ? 'text-amber-400' : 'text-gray-600'}`}>
            {bot.martingale ? `${bot.martingaleMultiplier}x` : 'OFF'}
          </span>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-500">Capital Allocation</span>
          <span className="text-cyan-400 font-bold">{bot.allocation}%</span>
        </div>
        <div className="w-full bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isRunning ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
            style={{ width: `${bot.allocation}%` }} 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 sm:gap-2 w-full">
        <button
          onClick={onEdit}
          className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
        >
          ⚙️ Configure
        </button>
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-400 transition-all"
          >
            ⏹️ Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!bot.active}
            className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              bot.active 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400' 
                : 'bg-gray-800 border border-gray-700 text-gray-600 cursor-not-allowed'
            }`}
          >
            ▶️ Start
          </button>
        )}
      </div>
    </div>
  );
};

interface BotEditorProps {
  bot: BotStrategy | null;
  symbols: { symbol: string; display_name: string }[];
  onSave: (bot: BotStrategy) => void;
  onClose: () => void;
}

const BotEditor: React.FC<BotEditorProps> = ({ bot, symbols, onSave, onClose }) => {
  const [formData, setFormData] = useState<BotStrategy>(bot || {
    id: `bot-${Date.now()}`,
    name: 'New Strategy',
    description: 'Custom trading strategy',
    active: false,
    allocation: 10,
    winRate: 0,
    totalTrades: 0,
    pnl: 0,
    symbol: 'R_100',
    contractType: 'CALL',
    duration: 1,
    durationUnit: 'm',
    amount: 1,
    martingale: false,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 3,
    takeProfit: 50,
    stopLoss: 25,
    maxTrades: 100
  });

  const [isRefining, setIsRefining] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const refineStrategy = async () => {
    setIsRefining(true);
    try {
      const refined = await jarvis.refineBotStrategy(formData);
      setAiSuggestions(refined);
      
      // Auto-apply some suggestions
      if (refined.optimizedStake) {
        setFormData(prev => ({
          ...prev,
          amount: refined.optimizedStake,
          duration: refined.optimizedDuration || prev.duration,
          durationUnit: refined.optimizedDurationUnit || prev.durationUnit,
          contractType: refined.recommendedContractType || prev.contractType,
          stopLoss: refined.stopLoss || prev.stopLoss,
          takeProfit: refined.takeProfit || prev.takeProfit,
          martingale: refined.martingaleAdvice === 'enable' ? true : 
                      refined.martingaleAdvice === 'disable' ? false : prev.martingale
        }));
      }
      
      alert(`AI Refinement Complete!\n\nExpected Win Rate: ${refined.expectedWinRate}%\nRisk Level: ${refined.riskLevel.toUpperCase()}\n\n${refined.reasoning}`);
    } catch (e: any) {
      alert('AI refinement failed: ' + e.message);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">
              {bot ? 'Edit Strategy' : 'Create New Strategy'}
            </h2>
            {aiSuggestions && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">
                  Win Rate: {aiSuggestions.expectedWinRate}%
                </span>
                <span className={`text-[9px] px-2 py-1 rounded font-bold ${
                  aiSuggestions.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                  aiSuggestions.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  Risk: {aiSuggestions.riskLevel.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={refineStrategy}
            disabled={isRefining}
            className="mx-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            {isRefining ? '⚡ AI Refining...' : '⚡ AI Refine'}
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl ml-2">×</button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Strategy Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Symbol</label>
              <select
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              >
                {symbols.length > 0 ? (
                  symbols.map(s => (
                    <option key={s.symbol} value={s.symbol}>{s.display_name}</option>
                  ))
                ) : (
                  <>
                    <option value="R_10">Volatility 10 Index</option>
                    <option value="R_25">Volatility 25 Index</option>
                    <option value="R_50">Volatility 50 Index</option>
                    <option value="R_75">Volatility 75 Index</option>
                    <option value="R_100">Volatility 100 Index</option>
                    <option value="1HZ10V">Volatility 10 (1s) Index</option>
                    <option value="1HZ25V">Volatility 25 (1s) Index</option>
                    <option value="1HZ50V">Volatility 50 (1s) Index</option>
                    <option value="1HZ75V">Volatility 75 (1s) Index</option>
                    <option value="1HZ100V">Volatility 100 (1s) Index</option>
                    <option value="CRASH300N">Crash 300 Index</option>
                    <option value="CRASH500N">Crash 500 Index</option>
                    <option value="CRASH1000N">Crash 1000 Index</option>
                    <option value="BOOM300N">Boom 300 Index</option>
                    <option value="BOOM500N">Boom 500 Index</option>
                    <option value="BOOM1000N">Boom 1000 Index</option>
                    <option value="frxEURUSD">EUR/USD</option>
                    <option value="frxGBPUSD">GBP/USD</option>
                    <option value="frxUSDJPY">USD/JPY</option>
                    <option value="frxAUDUSD">AUD/USD</option>
                    <option value="frxEURGBP">EUR/GBP</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none resize-none h-20"
            />
          </div>

          {/* Trading Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Contract Type</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              >
                {CONTRACT_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Duration</label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Unit</label>
              <select
                value={formData.durationUnit}
                onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              >
                {DURATION_UNITS.map(du => (
                  <option key={du.value} value={du.value}>{du.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Stake Amount ($)</label>
              <input
                type="number"
                min="0.35"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 1 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Allocation (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.allocation}
                onChange={(e) => setFormData({ ...formData, allocation: parseInt(e.target.value) || 10 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
          </div>

          {/* Martingale Settings */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-amber-400">Martingale System</h4>
                <p className="text-[10px] text-gray-500">Increase stake after losses</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, martingale: !formData.martingale })}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.martingale ? 'bg-amber-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.martingale ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            {formData.martingale && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Multiplier</label>
                  <input
                    type="number"
                    min="1.1"
                    max="5"
                    step="0.1"
                    value={formData.martingaleMultiplier}
                    onChange={(e) => setFormData({ ...formData, martingaleMultiplier: parseFloat(e.target.value) || 2 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Max Steps</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxMartingaleSteps}
                    onChange={(e) => setFormData({ ...formData, maxMartingaleSteps: parseInt(e.target.value) || 3 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Take Profit ($)</label>
              <input
                type="number"
                min="1"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) || 50 })}
                className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none text-emerald-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Stop Loss ($)</label>
              <input
                type="number"
                min="1"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || 25 })}
                className="w-full bg-black/40 border border-rose-500/20 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none text-rose-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Max Trades</label>
              <input
                type="number"
                min="1"
                value={formData.maxTrades}
                onChange={(e) => setFormData({ ...formData, maxTrades: parseInt(e.target.value) || 100 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
              />
            </div>
          </div>

          {/* AI & Technical Analysis Settings */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">AI & Technical Analysis</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.useAI || false}
                  onChange={(e) => setFormData({ ...formData, useAI: e.target.checked })}
                  className="w-4 h-4 rounded accent-purple-500"
                />
                <span className="text-xs text-gray-400">Enable AI Mode</span>
              </label>
            </div>
            
            {formData.useAI && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">Min Signal Strength</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minSignalStrength || 60}
                      onChange={(e) => setFormData({ ...formData, minSignalStrength: parseInt(e.target.value) || 60 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">RSI Period</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.rsiPeriod || 14}
                      onChange={(e) => setFormData({ ...formData, rsiPeriod: parseInt(e.target.value) || 14 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">RSI Overbought</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={formData.rsiOverbought || 70}
                      onChange={(e) => setFormData({ ...formData, rsiOverbought: parseInt(e.target.value) || 70 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">RSI Oversold</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.rsiOversold || 30}
                      onChange={(e) => setFormData({ ...formData, rsiOversold: parseInt(e.target.value) || 30 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">MACD Fast</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.macdFast || 12}
                      onChange={(e) => setFormData({ ...formData, macdFast: parseInt(e.target.value) || 12 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">MACD Slow</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.macdSlow || 26}
                      onChange={(e) => setFormData({ ...formData, macdSlow: parseInt(e.target.value) || 26 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">MACD Signal</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.macdSignal || 9}
                      onChange={(e) => setFormData({ ...formData, macdSignal: parseInt(e.target.value) || 9 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">BB Period</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.bbPeriod || 20}
                      onChange={(e) => setFormData({ ...formData, bbPeriod: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">EMA Period</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.emaPeriod || 20}
                      onChange={(e) => setFormData({ ...formData, emaPeriod: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase font-bold">SMA Period</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.smaPeriod || 50}
                      onChange={(e) => setFormData({ ...formData, smaPeriod: parseInt(e.target.value) || 50 })}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs focus:border-purple-500/50 outline-none"
                    />
                  </div>
                </div>
                
                <div className="text-xs text-purple-300 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                  💡 AI Mode: Bot uses advanced technical analysis (RSI, MACD, Bollinger Bands, Stochastic, EMA, SMA) combined with AI to identify high-probability trading opportunities. Trades only when signal strength meets minimum threshold.
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all"
            >
              Save Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BotManagement: React.FC = () => {
  // Load bots from localStorage or use INITIAL_BOTS as fallback
  const [bots, setBots] = useState<BotStrategy[]>(() => {
    try {
      const saved = localStorage.getItem('aite_bot_configs');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('AITE Core: Loaded', parsed.length, 'saved bot configurations');
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load bot configs from storage', e);
    }
    return INITIAL_BOTS;
  });
  const [runningBots, setRunningBots] = useState<Set<string>>(new Set());
  const [botStats, setBotStats] = useState<Map<string, { trades: number; openTrades: number; profit: number; currentAmount: number }>>(new Map());
  const [editingBot, setEditingBot] = useState<BotStrategy | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCreatingAI, setIsCreatingAI] = useState(false);
  const [symbols, setSymbols] = useState<{ symbol: string; display_name: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<any>(null);

  useEffect(() => {
    // Check initial connection state
    const checkConnection = () => {
      const authorized = deriv.getIsAuthorized();
      setIsConnected(authorized);
      if (authorized && deriv.currentAccount) {
        setCurrentAccount(deriv.currentAccount);
      }
      
      // Load symbols directly from deriv.activeSymbols
      if (deriv.activeSymbols && deriv.activeSymbols.length > 0) {
        const filtered = deriv.activeSymbols
          .filter((s: any) => s.exchange_is_open === 1)
          .map((s: any) => ({
            symbol: s.symbol,
            display_name: s.display_name
          }));
        setSymbols(filtered);
        console.log('AITE Core: Loaded', filtered.length, 'symbols for bot configuration');
      } else if (authorized) {
        // Request symbols if not loaded
        deriv.fetchActiveSymbols();
      }
      
      // Sync running bots state on mount
      const allStats = deriv.getAllBotsStatus();
      const newRunning = new Set<string>();
      Object.entries(allStats).forEach(([id, stats]: [string, any]) => {
        if (stats.running) {
          newRunning.add(id);
        }
      });
      setRunningBots(newRunning);
    };
    
    // Check immediately and after a short delay
    checkConnection();
    const initialCheck = setTimeout(checkConnection, 1000);
    
    const unsub = deriv.addListener((data) => {
      if (data.msg_type === 'authorize' && !data.error) {
        setIsConnected(true);
        setCurrentAccount(deriv.currentAccount);
        // Fetch symbols after authorization
        setTimeout(() => deriv.fetchActiveSymbols(), 500);
      }
      
      if (data.msg_type === 'active_symbols' && !data.error) {
        const filtered = (data.active_symbols || [])
          .filter((s: any) => s.exchange_is_open === 1)
          .map((s: any) => ({
            symbol: s.symbol,
            display_name: s.display_name
          }));
        setSymbols(filtered);
        console.log('AITE Core: Received', filtered.length, 'active symbols for bots');
      }

      if (data.msg_type === 'buy' && !data.error) {
        // Update bot stats when trade is placed
        const allStats = deriv.getAllBotsStatus();
        const newBotStats = new Map<string, { trades: number; openTrades: number; profit: number; currentAmount: number }>();
        Object.entries(allStats).forEach(([id, stats]: [string, any]) => {
          newBotStats.set(id, {
            trades: stats.trades,
            openTrades: stats.openTrades || 0,
            profit: stats.profit,
            currentAmount: stats.currentAmount
          });
        });
        setBotStats(newBotStats);
      }
    });

    // Poll for bot stats and connection state
    const interval = setInterval(() => {
      // Check connection state
      const authorized = deriv.getIsAuthorized();
      setIsConnected(authorized);
      if (authorized && deriv.currentAccount) {
        setCurrentAccount(deriv.currentAccount);
      }
      
      const allStats = deriv.getAllBotsStatus();
      const newBotStats = new Map<string, { trades: number; openTrades: number; profit: number; currentAmount: number }>();
      const newRunning = new Set<string>();
      
      Object.entries(allStats).forEach(([id, stats]: [string, any]) => {
        newBotStats.set(id, {
          trades: stats.trades,
          openTrades: stats.openTrades || 0,
          profit: stats.profit,
          currentAmount: stats.currentAmount
        });
        if (stats.running) {
          newRunning.add(id);
        }
      });
      
      setBotStats(newBotStats);
      setRunningBots(newRunning);
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
      clearTimeout(initialCheck);
    };
  }, []);

  const toggleBot = (id: string) => {
    setBots(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, active: !b.active } : b);
      
      // Save to localStorage
      try {
        localStorage.setItem('aite_bot_configs', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save bot configs to storage', e);
      }
      
      return updated;
    });
  };

  const startBot = (bot: BotStrategy) => {
    if (!isConnected || !deriv.getIsAuthorized()) {
      alert('⚠️ Not Connected\n\nPlease wait for Deriv API connection to establish.\n\nCheck the top right for your account balance to confirm connection.');
      return;
    }

    if (!deriv.currentAccount) {
      alert('⚠️ No Account Selected\n\nPlease select a trading account first.');
      return;
    }

    const settings: BotSettings = {
      id: bot.id,
      symbol: bot.symbol || 'R_100',
      contractType: (bot.contractType || 'CALL') as any,
      amount: bot.amount || 1,
      duration: bot.duration || 1,
      durationUnit: (bot.durationUnit || 'm') as any,
      martingale: bot.martingale || false,
      martingaleMultiplier: bot.martingaleMultiplier || 2,
      maxMartingaleSteps: bot.maxMartingaleSteps || 3,
      takeProfit: bot.takeProfit || 50,
      stopLoss: bot.stopLoss || 25,
      maxTrades: bot.maxTrades || 100
    };

    deriv.startBot(bot.id, settings);
    setRunningBots(prev => new Set([...prev, bot.id]));
  };

  const stopBot = async (botId: string) => {
    try {
      await deriv.stopBot(botId);
      setRunningBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(botId);
        return newSet;
      });
    } catch (e) {
      console.error('Failed to stop bot:', e);
    }
  };

  const saveBot = (bot: BotStrategy) => {
    setBots(prev => {
      const exists = prev.find(b => b.id === bot.id);
      let updated;
      if (exists) {
        updated = prev.map(b => b.id === bot.id ? bot : b);
      } else {
        updated = [...prev, bot];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('aite_bot_configs', JSON.stringify(updated));
        console.log('AITE Core: Saved bot configuration for', bot.name);
      } catch (e) {
        console.error('Failed to save bot configs to storage', e);
      }
      
      return updated;
    });
    setShowEditor(false);
    setEditingBot(null);
  };

  const createBotFromAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please describe the trading strategy you want');
      return;
    }

    setIsCreatingAI(true);
    try {
      const newBot = await jarvis.createBotFromDescription(aiPrompt);
      setBots(prev => [...prev, newBot]);
      setShowAICreator(false);
      setAiPrompt('');
      alert(`✅ Bot "${newBot.name}" created successfully!\n\nStrategy: ${newBot.description}`);
    } catch (e: any) {
      alert('Failed to create bot: ' + e.message);
    } finally {
      setIsCreatingAI(false);
    }
  };

  const totalPnl = bots.reduce((sum, bot) => {
    const liveStats = botStats.get(bot.id);
    return sum + (liveStats?.profit || bot.pnl);
  }, 0);

  const activeCount = runningBots.size;

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-700 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
        <div className="w-full lg:w-auto">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-white">Bot Management</h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Automated Trading Strategies</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full lg:w-auto">{/* Connection Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            isConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`text-[10px] font-black uppercase ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? `Connected: ${currentAccount?.loginid || ''}` : 'Disconnected'}
            </span>
            {currentAccount?.is_virtual === 1 && (
              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">DEMO</span>
            )}
          </div>

          <button
            onClick={() => setShowAICreator(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all"
          >
            ✨ AI Creator
          </button>

          <button
            onClick={() => {
              setEditingBot(null);
              setShowEditor(true);
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all"
          >
            + New Strategy
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-cyan-500">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Total Strategies</p>
          <p className="text-2xl font-black text-white">{bots.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border-l-4 border-emerald-500">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Active Bots</p>
          <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border-l-4 border-amber-500">
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Total Trades</p>
          <p className="text-2xl font-black text-white">
            {bots.reduce((sum, b) => sum + (botStats.get(b.id)?.trades || b.totalTrades), 0)}
          </p>
        </div>
        <div className={`glass-panel p-4 rounded-xl border-l-4 ${totalPnl >= 0 ? 'border-emerald-500' : 'border-rose-500'}`}>
          <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Total PNL</p>
          <p className={`text-2xl font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 w-full">
        {bots.map((bot) => (
          <BotCard
            key={bot.id}
            bot={bot}
            isRunning={runningBots.has(bot.id)}
            liveStats={botStats.get(bot.id) || null}
            onToggle={() => toggleBot(bot.id)}
            onEdit={() => {
              setEditingBot(bot);
              setShowEditor(true);
            }}
            onStart={() => startBot(bot)}
            onStop={() => stopBot(bot.id)}
            symbols={symbols}
          />
        ))}
        
        {/* Add New Bot Card */}
        <div 
          onClick={() => {
            setEditingBot(null);
            setShowEditor(true);
          }}
          className="glass-panel p-6 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-pointer group min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            +
          </div>
          <span className="font-black text-sm tracking-widest uppercase">Add Strategy</span>
        </div>
      </div>

      {/* Bot Editor Modal */}
      {showEditor && (
        <BotEditor
          bot={editingBot}
          symbols={symbols}
          onSave={saveBot}
          onClose={() => {
            setShowEditor(false);
            setEditingBot(null);
          }}
        />
      )}

      {/* AI Creator Modal */}
      {showAICreator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-purple-500/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  ✨ AI Bot Creator
                </h2>
                <p className="text-xs text-gray-400 mt-1">Describe your strategy in plain English</p>
              </div>
              <button onClick={() => setShowAICreator(false)} className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">What kind of trading bot do you want?</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Create an aggressive scalping bot on R_100 that uses martingale after losses&#10;Example: Build a conservative bot for long-term trading with low risk&#10;Example: Make a bot that trades CALL options on volatility indices with 5-minute duration"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none min-h-[120px] resize-none"
                  disabled={isCreatingAI}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAICreator(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors"
                  disabled={isCreatingAI}
                >
                  Cancel
                </button>
                <button
                  onClick={createBotFromAI}
                  disabled={isCreatingAI || !aiPrompt.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isCreatingAI ? '✨ Creating...' : '✨ Create Bot'}
                </button>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-[10px] text-purple-300 font-bold uppercase mb-2">💡 Tips:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Specify risk level: aggressive, moderate, or conservative</li>
                  <li>• Mention symbols: R_100, R_50, R_25, R_10, or VOLATILITY indices</li>
                  <li>• Include strategy type: scalping, swing trading, martingale</li>
                  <li>• State contract preference: CALL/PUT or DIGIT options</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
