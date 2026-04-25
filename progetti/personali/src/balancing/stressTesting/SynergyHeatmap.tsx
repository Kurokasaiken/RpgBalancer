/**
 * @fileoverview Synergy Heatmap component.
 * Displays stat synergies in a visual format.
 */

import React from 'react';
import { useStressTesting } from './useStressTesting';

export const SynergyHeatmap: React.FC = () => {
  const { results } = useStressTesting();

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No synergy data available</p>
      </div>
    );
  }

  const synergies = results.synergies;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-300 uppercase tracking-[0.2em]">
        Stat Synergies
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {synergies.map((synergy, index) => (
          <div
            key={`${synergy.statId1}-${synergy.statId2}`}
            className={`rounded-lg border p-3 ${
              synergy.isOpSynergy
                ? 'border-emerald-500/50 bg-emerald-950/30'
                : synergy.isWeakSynergy
                ? 'border-red-500/50 bg-red-950/30'
                : 'border-slate-600 bg-slate-900/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ivory">
                {synergy.statId1} + {synergy.statId2}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                synergy.isOpSynergy
                  ? 'bg-emerald-600/20 text-emerald-300'
                  : synergy.isWeakSynergy
                  ? 'bg-red-600/20 text-red-300'
                  : 'bg-slate-600/20 text-slate-300'
              }`}>
                {synergy.isOpSynergy ? 'OP' : synergy.isWeakSynergy ? 'Weak' : 'Neutral'}
              </span>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {synergy.synergyMultiplier.toFixed(3)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Synergy Multiplier
              </div>
            </div>
          </div>
        ))}
      </div>

      {synergies.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No synergy data calculated</p>
        </div>
      )}

      <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-4">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-[0.15em] mb-3">
          Legend
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-emerald-500/50 bg-emerald-950/30"></div>
            <span className="text-slate-400">OP Synergy (&gt;1.15x)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-slate-600 bg-slate-900/50"></div>
            <span className="text-slate-400">Neutral Synergy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-red-500/50 bg-red-950/30"></div>
            <span className="text-slate-400">Weak Synergy (&lt;0.95x)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
