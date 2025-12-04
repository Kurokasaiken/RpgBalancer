import React from 'react';
import type { MarginalUtilityMetrics } from '../../balancing/testing/metrics';

interface MarginalUtilityTableProps {
  metrics: MarginalUtilityMetrics[];
}

export const MarginalUtilityTable: React.FC<MarginalUtilityTableProps> = ({ metrics }) => {
  const sorted = [...metrics].sort((a, b) => b.utilityScore - a.utilityScore);

  return (
    <div className="overflow-x-auto rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
      <table className="min-w-full text-xs text-slate-200">
        <thead className="bg-slate-900/80 border-b border-indigo-500/40">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-indigo-200">Stat</th>
            <th className="px-2 py-2 text-right font-semibold text-indigo-200">Tier</th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">Win%</th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">Turns</th>
            <th className="px-2 py-2 text-right font-semibold text-cyan-200">HP Trade</th>
            <th className="px-2 py-2 text-right font-semibold text-amber-200">Utility</th>
            <th className="px-4 py-2 text-center font-semibold text-slate-400">Conf.</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const winPct = (m.winRate * 100).toFixed(1);
            const tradePct = (m.hpTradeEfficiency * 100).toFixed(1);
            const utility = m.utilityScore.toFixed(2);

            const winClass = m.winRate > 0.55 ? 'text-emerald-300' : m.winRate < 0.45 ? 'text-rose-300' : 'text-slate-200';
            const utilityClass = m.utilityScore > 1.1 ? 'text-amber-300' : m.utilityScore < 0.9 ? 'text-rose-300' : 'text-slate-200';

            return (
              <tr key={`${m.statId}-${m.pointsPerStat}`} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                <td className="px-4 py-1.5 font-semibold text-indigo-200 uppercase tracking-[0.18em]">
                  {m.statId}
                </td>
                <td className="px-2 py-1.5 text-right text-slate-300">+{m.pointsPerStat}</td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={winClass}>{winPct}%</span>
                </td>
                <td className="px-2 py-1.5 text-right text-slate-300">{m.avgTurns.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-right text-slate-300">{tradePct}%</td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  <span className={utilityClass}>{utility}</span>
                </td>
                <td className="px-4 py-1.5">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400"
                      style={{ width: `${Math.max(0, Math.min(1, m.confidence)) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
