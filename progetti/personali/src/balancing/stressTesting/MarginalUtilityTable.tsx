/**
 * @fileoverview Marginal Utility Table component.
 * Displays marginal utility results in a tabular format.
 */

import React from 'react';
import { useStressTesting } from './useStressTesting';

export const MarginalUtilityTable: React.FC = () => {
  const { results } = useStressTesting();

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No analysis results available</p>
      </div>
    );
  }

  const allResults = [
    results.baseline,
    ...results.singleStats,
    ...results.pairStats,
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-300 uppercase tracking-[0.2em]">
        Marginal Utility Results
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-2 px-3 text-slate-300 uppercase tracking-[0.15em] text-xs">
                Archetype
              </th>
              <th className="text-right py-2 px-3 text-slate-300 uppercase tracking-[0.15em] text-xs">
                Power Metric
              </th>
              <th className="text-right py-2 px-3 text-slate-300 uppercase tracking-[0.15em] text-xs">
                Marginal Utility
              </th>
              <th className="text-right py-2 px-3 text-slate-300 uppercase tracking-[0.15em] text-xs">
                Confidence Interval
              </th>
            </tr>
          </thead>
          <tbody>
            {allResults.map((result) => (
              <tr key={result.archetypeId} className="border-b border-slate-700/50">
                <td className="py-2 px-3 text-ivory">
                  {result.archetypeId === 'baseline' ? 'Baseline' :
                   result.archetypeId.startsWith('single_') ?
                     `+${result.archetypeId.replace('single_', '')}` :
                     result.archetypeId.replace('pair_', '').replace('_', ' + ')
                  }
                </td>
                <td className="py-2 px-3 text-right text-cyan-300 font-mono">
                  {result.powerMetric.toFixed(3)}
                </td>
                <td className="py-2 px-3 text-right text-amber-300 font-mono">
                  {result.marginalUtility.toFixed(3)}
                </td>
                <td className="py-2 px-3 text-right text-slate-400 font-mono text-xs">
                  [{result.confidenceInterval[0].toFixed(3)}, {result.confidenceInterval[1].toFixed(3)}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
          <h4 className="text-slate-300 uppercase tracking-[0.15em] text-xs mb-2">
            Summary
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Archetypes:</span>
              <span className="text-ivory font-mono">{results.summary.totalArchetypes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulations per Archetype:</span>
              <span className="text-ivory font-mono">{results.summary.simulationsPerArchetype.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
          <h4 className="text-emerald-300 uppercase tracking-[0.15em] text-xs mb-2">
            OP Synergies
          </h4>
          <div className="text-2xl font-bold text-emerald-400">
            {results.summary.opSynergies}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
          <h4 className="text-red-300 uppercase tracking-[0.15em] text-xs mb-2">
            Weak Synergies
          </h4>
          <div className="text-2xl font-bold text-red-400">
            {results.summary.weakSynergies}
          </div>
        </div>
      </div>
    </div>
  );
};
