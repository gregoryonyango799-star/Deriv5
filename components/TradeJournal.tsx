
import React from 'react';

const trades = [
  { id: 'T-1042', pair: 'EUR/USD', type: 'BUY', entry: '1.08420', exit: '1.08550', pnl: '+130.00', status: 'Profit', strategy: 'SMC', time: '2023-10-24 14:20' },
  { id: 'T-1041', pair: 'GBP/USD', type: 'SELL', entry: '1.21400', exit: '1.21550', pnl: '-150.00', status: 'Loss', strategy: 'Breakout', time: '2023-10-24 10:15' },
  { id: 'T-1040', pair: 'USD/JPY', type: 'BUY', entry: '149.20', exit: '149.80', pnl: '+600.00', status: 'Profit', strategy: 'S&D Sniper', time: '2023-10-23 22:00' },
];

export const TradeJournal: React.FC = () => {
  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="font-bold text-lg">Central Trade Repository</h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Search setups..." className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:border-cyan-500 outline-none" />
            <button className="bg-cyan-600 px-4 py-1.5 rounded-lg text-xs font-bold">Export CSV</button>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 uppercase text-[10px] font-bold tracking-widest bg-black/20">
            <tr>
              <th className="px-6 py-4">Trade ID</th>
              <th className="px-6 py-4">Pair</th>
              <th className="px-6 py-4">Strategy</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Entry / Exit</th>
              <th className="px-6 py-4">Result</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trades.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-mono text-cyan-400">{t.id}</td>
                <td className="px-6 py-4 font-bold">{t.pair}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] border border-indigo-500/20">{t.strategy}</span>
                </td>
                <td className="px-6 py-4 font-mono">
                  <span className={t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}>{t.type}</span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-gray-400">
                  {t.entry} → {t.exit}
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${t.pnl.startsWith('+') ? 'text-emerald-400' : 'text-rose-500'}`}>{t.pnl}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
