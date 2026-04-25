/**
 * @fileoverview Stat Profile Radar component.
 * Displays stat profiles in a radar chart format (placeholder implementation).
 */

import React from 'react';
import { useStressTesting } from './useStressTesting';

export const StatProfileRadar: React.FC = () => {
  const { results } = useStressTesting();

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No radar data available</p>
      </div>
    );
  }

  // Get baseline and a few example archetypes for comparison
  const baseline = results.baseline;
  const examples = results.singleStats.slice(0, 3); // Show first 3 single stat boosts

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-300 uppercase tracking-[0.2em]">
        Stat Profile Comparison
      </h3>

      <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-6">
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm">
            Radar chart visualization would show here with stat profiles for different archetypes.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            (Placeholder - implement with charting library like Chart.js or D3.js)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Baseline */}
          <div className="rounded-lg border border-cyan-500/50 bg-cyan-950/20 p-4">
            <h4 className="text-sm font-semibold text-cyan-300 uppercase tracking-[0.15em] mb-2">
              Baseline
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Power:</span>
                <span className="text-cyan-300 font-mono">{baseline.powerMetric.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Utility:</span>
                <span className="text-cyan-300 font-mono">{baseline.marginalUtility.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Example boosted archetypes */}
          {examples.map((example, index) => (
            <div key={example.archetypeId} className="rounded-lg border border-amber-500/50 bg-amber-950/20 p-4">
              <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-[0.15em] mb-2">
                +{example.archetypeId.replace('single_', '')}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Power:</span>
                  <span className="text-amber-300 font-mono">{example.powerMetric.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Utility:</span>
                  <span className="text-amber-300 font-mono">{example.marginalUtility.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gain:</span>
                  <span className="text-emerald-300 font-mono">
                    +{((example.marginalUtility - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            Full radar chart would visualize stat distributions across archetypes,
            showing how different boosts affect the overall stat profile.
          </p>
        </div>
      </div>
    </div>
  );
};
