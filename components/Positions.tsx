import React, { useState, useEffect } from 'react';
import { deriv, ContractInfo } from '../services/derivService';

export const Positions: React.FC = () => {
  const [positions, setPositions] = useState<ContractInfo[]>([]);
  const [closingIds, setClosingIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    deriv.connect();
    
    // Check authorization immediately and on interval
    const checkAuth = () => {
      setIsConnected(deriv.getIsAuthorized());
    };
    
    checkAuth();
    const authInterval = setInterval(checkAuth, 500);

    const unsub = deriv.addListener((data) => {
      if (data.msg_type === 'authorize' && !data.error) {
        setIsConnected(true);
      }
      
      if (data.msg_type === 'portfolio') {
        const contracts = (data.portfolio?.contracts || []).map((c: any) => ({
          contract_id: c.contract_id,
          contract_type: c.contract_type,
          currency: c.currency,
          buy_price: c.buy_price,
          payout: c.payout,
          profit: c.sell_price ? c.sell_price - c.buy_price : 0,
          profit_percentage: c.sell_price ? ((c.sell_price - c.buy_price) / c.buy_price) * 100 : 0,
          status: c.is_sold ? 'sold' : 'open',
          is_sold: c.is_sold,
          symbol: c.symbol,
          date_start: c.date_start,
          date_expiry: c.expiry_time,
          entry_spot: c.entry_spot,
          current_spot: c.current_spot
        }));
        setPositions(contracts);
      }

      if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract) {
        const poc = data.proposal_open_contract;
        setPositions(prev => {
          const index = prev.findIndex(p => p.contract_id === poc.contract_id);
          const updated: ContractInfo = {
            contract_id: poc.contract_id,
            contract_type: poc.contract_type,
            currency: poc.currency,
            buy_price: poc.buy_price,
            payout: poc.payout,
            profit: poc.profit,
            profit_percentage: (poc.profit / poc.buy_price) * 100,
            status: poc.is_sold ? 'sold' : 'open',
            is_sold: poc.is_sold,
            symbol: poc.underlying,
            date_start: poc.date_start,
            date_expiry: poc.date_expiry,
            entry_spot: poc.entry_spot,
            current_spot: poc.current_spot
          };
          
          if (index >= 0) {
            const newPositions = [...prev];
            newPositions[index] = updated;
            return newPositions;
          } else {
            return [updated, ...prev];
          }
        });
      }

      if (data.msg_type === 'sell' && !data.error) {
        setClosingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.sell.contract_id);
          return newSet;
        });
      }
    });

    // Request portfolio immediately
    const checkAndFetch = () => {
      if (deriv.getIsAuthorized()) {
        deriv.getOpenContracts();
      }
    };
    
    checkAndFetch();

    // Poll for updates
    const interval = setInterval(() => {
      checkAndFetch();
      positions.forEach(pos => {
        if (!pos.is_sold) {
          deriv.subscribeToContract(pos.contract_id);
        }
      });
    }, 2000);

    return () => {
      unsub();
      clearInterval(interval);
      clearInterval(authInterval);
    };
  }, []);

  const closePosition = async (contractId: number) => {
    setClosingIds(prev => new Set([...prev, contractId]));
    try {
      console.log('Closing position:', contractId);
      const result = await deriv.sellContract(contractId);
      console.log('Position closed successfully:', result);
      
      // Remove from local state immediately
      setPositions(prev => prev.filter(p => p.contract_id !== contractId));
      
      // Refresh portfolio after a short delay
      setTimeout(() => {
        if (deriv.getIsAuthorized()) {
          deriv.getOpenContracts();
        }
      }, 1000);
      
    } catch (e: any) {
      console.error('Failed to close position:', e);
      alert(`Failed to close position: ${e.message || 'Unknown error'}`);
    } finally {
      setClosingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contractId);
        return newSet;
      });
    }
  };

  const filteredPositions = positions.filter(p => {
    if (filter === 'open') return !p.is_sold;
    if (filter === 'closed') return p.is_sold;
    return true;
  });

  const openPositions = positions.filter(p => !p.is_sold);
  const totalPL = positions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const openPL = openPositions.reduce((sum, p) => sum + (p.profit || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            Open Positions
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-mono">Neural Trade Monitor</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-xl border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Open</p>
            <p className="text-2xl font-black text-cyan-400">{openPositions.length}</p>
          </div>
          <div className="glass-panel px-6 py-3 rounded-xl border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Open P/L</p>
            <p className={`text-2xl font-black ${openPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {openPL >= 0 ? '+' : ''}{openPL.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel px-6 py-3 rounded-xl border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Total P/L</p>
            <p className={`text-2xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        {(['all', 'open', 'closed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              filter === f
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
        
        {/* Connection Status */}
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></div>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* No positions message */}
      {!isConnected && positions.length === 0 && (
        <div className="glass-panel rounded-2xl border border-white/5 p-8 text-center">
          <div className="text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Please connect and authorize your account in Settings</p>
        </div>
      )}
      
      {isConnected && positions.length === 0 && (
        <div className="glass-panel rounded-2xl border border-white/5 p-8 text-center">
          <div className="text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">No positions found. Start trading to see your positions here.</p>
        </div>
      )}

      {/* Positions Table */}
      {filteredPositions.length > 0 && (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Symbol</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Entry</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Current</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Buy Price</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Payout</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">P/L</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No positions found
                  </td>
                </tr>
              ) : (
                filteredPositions.map(pos => (
                  <tr key={pos.contract_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-cyan-400">{pos.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        pos.contract_type.includes('CALL') || pos.contract_type.includes('UP') 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {pos.contract_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white">
                      {pos.entry_spot?.toFixed(5) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white">
                      {pos.current_spot?.toFixed(5) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white">
                      {pos.buy_price.toFixed(2)} {pos.currency}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white">
                      {pos.payout.toFixed(2)} {pos.currency}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold">
                      <span className={pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                        <span className="text-[10px] ml-1">
                          ({pos.profit_percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        pos.is_sold 
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {pos.is_sold ? 'CLOSED' : 'OPEN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!pos.is_sold && (
                        <button
                          onClick={() => closePosition(pos.contract_id)}
                          disabled={closingIds.has(pos.contract_id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {closingIds.has(pos.contract_id) ? 'Closing...' : 'Close'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
