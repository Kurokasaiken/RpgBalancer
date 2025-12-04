import React from 'react';
import type { StatEfficiency } from '../../balancing/testing/RoundRobinRunner';

interface StatEfficiencyTableProps {
  efficiencies: StatEfficiency[];
}

const assessmentColors: Record<string, string> = {
  OP: 'text-red-400',
  strong: 'text-amber-400',
  balanced: 'text-green-400',
  weak: 'text-blue-400',
  underpowered: 'text-purple-400',
};

export const StatEfficiencyTable: React.FC<StatEfficiencyTableProps> = ({
  efficiencies,
}) => {
  if (efficiencies.length === 0) {
    return (
      <div className="text-center text-slate-500 py-4 text-xs">
        No efficiency data yet. Run tests to see results.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-900/40">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-indigo-500/30 bg-slate-800/50">
            <th className="px-3 py-2 text-left text-slate-400 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-3 py-2 text-left text-indigo-200 uppercase tracking-wider">
              Stat
            </th>
            <th className="px-3 py-2 text-right text-cyan-200 uppercase tracking-wider">
              Efficiency
            </th>
            <th className="px-3 py-2 text-right text-slate-400 uppercase tracking-wider">
              W/L/D
            </th>
            <th className="px-3 py-2 text-center text-slate-400 uppercase tracking-wider">
              Assessment
            </th>
          </tr>
        </thead>
        <tbody>
          {efficiencies.map((eff) => (
            <tr
              key={eff.statId}
              className="border-b border-slate-700/40 hover:bg-slate-800/30 transition-colors"
            >
              <td className="px-3 py-2 text-slate-500 font-mono">#{eff.rank}</td>
              <td className="px-3 py-2 font-semibold text-indigo-300">
                {eff.statId}
              </td>
              <td className="px-3 py-2 text-right font-mono text-cyan-200">
                {(eff.efficiency * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right text-slate-400 font-mono">
                {eff.wins}W / {eff.losses}L / {eff.draws}D
              </td>
              <td
                className={`px-3 py-2 text-center font-semibold ${
                  assessmentColors[eff.assessment] || 'text-slate-300'
                }`}
              >
                {eff.assessment}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
