
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const psychoData = [
  { subject: 'Discipline', A: 85, fullMark: 100 },
  { subject: 'Risk Management', A: 92, fullMark: 100 },
  { subject: 'Emotional Control', A: 78, fullMark: 100 },
  { subject: 'Strategy Adherence', A: 88, fullMark: 100 },
  { subject: 'Patience', A: 65, fullMark: 100 },
];

export const Psychology: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center">
          <h3 className="text-lg font-bold mb-6 self-start">Psychometric Profile</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Fix: Corrected variable name from 'psycoData' to 'psychoData' */}
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={psychoData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar
                  name="Stark"
                  dataKey="A"
                  stroke="#00f3ff"
                  fill="#00f3ff"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
             <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
               <p className="text-[10px] text-emerald-400 uppercase font-bold">Strongest Asset</p>
               <p className="text-sm">Risk Neutrality</p>
             </div>
             <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
               <p className="text-[10px] text-amber-400 uppercase font-bold">Current Weakness</p>
               <p className="text-sm">Early Exit Bias</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-rose-500">
            <h3 className="text-lg font-bold text-rose-500 mb-2">Guardian Mode Active</h3>
            <p className="text-sm text-gray-400 mb-4">
              Real-time behavior monitoring engaged. System will intervene if deviation exceeds 15% of your baseline neural profile.
            </p>
            <div className="flex items-center gap-4">
              <button className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold transition-all text-sm">Emergency Kill Switch</button>
              <button className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all text-sm border border-white/10">Adjust Thresholds</button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 tracking-tighter uppercase text-cyan-400">AI Neural Insight</h3>
            <div className="space-y-4">
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">⚡</div>
                  <p className="text-sm text-gray-300">"Sir, you exit winners 40% too early. This habit cost approximately <span className="text-cyan-400 font-mono">$1,450</span> in potential profits this cycle."</p>
               </div>
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">🤖</div>
                  <p className="text-sm text-gray-300">"Historical data suggests your win rate drops 68% after 3 consecutive losses. Guardian mode will lock trading for 30m if this occurs."</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
