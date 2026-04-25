/**
 * @fileoverview Stress Test Dashboard component.
 * Main UI for stress testing and marginal utility analysis.
 */

import React, { useState } from 'react';
import { useStressTesting } from './useStressTesting';
import { MarginalUtilityTable } from './MarginalUtilityTable';
import { SynergyHeatmap } from './SynergyHeatmap';
import { StatProfileRadar } from './StatProfileRadar';
import { Sparkles, Zap, Target } from 'lucide-react';

/**
 * Main dashboard component for stress testing analysis.
 */
export const StressTestDashboard: React.FC = () => {
  const {
    isRunning,
    error,
    config,
    hasArchetypes,
    hasResults,
    totalArchetypes,
    singleStatsCount,
    pairStatsCount,
    generateArchetypes,
    runAnalysis,
    updateConfig,
    reset,
    exportResults,
  } = useStressTesting();

  const [activeView, setActiveView] = useState<'table' | 'heatmap' | 'radar'>('table');

  const handleExport = () => {
    const data = exportResults();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stress-test-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="observatory-page">
      <div className="observatory-bg-orbits">
        <div className="observatory-bg-orbit-left" />
        <div className="observatory-bg-orbit-right" />
      </div>

      <div className="observatory-shell space-y-4">
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col">
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-semibold tracking-[0.22em] md:tracking-[0.3em] uppercase text-indigo-200 drop-shadow-[0_0_14px_rgba(129,140,248,0.9)]">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              <span>Stress Testing</span>
            </h1>
            <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.26em]">
              Marginal Utility Analysis · Config-Driven
            </p>
          </div>
        </header>

        {/* Configuration Section */}
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 md:px-6 py-4 md:py-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 mb-3">
            Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Simulations per Archetype
              </label>
              <input
                type="number"
                value={config.simulationsPerArchetype}
                onChange={(e) => updateConfig({ simulationsPerArchetype: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-black/50 border border-amber-200/30 rounded-md text-ivory text-sm"
                min="100"
                max="100000"
                step="100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                OP Synergy Threshold
              </label>
              <input
                type="number"
                value={config.opSynergyThreshold}
                onChange={(e) => updateConfig({ opSynergyThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-black/50 border border-amber-200/30 rounded-md text-ivory text-sm"
                min="1.0"
                max="2.0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Random Seed
              </label>
              <input
                type="number"
                value={config.randomSeed}
                onChange={(e) => updateConfig({ randomSeed: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-black/50 border border-amber-200/30 rounded-md text-ivory text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateArchetypes}
            disabled={isRunning}
            className="px-4 py-2 rounded-full border border-cyan-400/60 text-cyan-200 text-sm tracking-[0.2em] uppercase hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Generate Archetypes
          </button>

          <button
            onClick={runAnalysis}
            disabled={isRunning || !hasArchetypes}
            className="px-4 py-2 rounded-full border border-amber-400/60 text-amber-200 text-sm tracking-[0.2em] uppercase hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Run Analysis
          </button>

          <button
            onClick={reset}
            disabled={isRunning}
            className="px-4 py-2 rounded-full border border-red-400/60 text-red-200 text-sm tracking-[0.2em] uppercase hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>

          {hasResults && (
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-full border border-green-400/60 text-green-200 text-sm tracking-[0.2em] uppercase hover:bg-green-500/10"
            >
              Export Results
            </button>
          )}
        </div>

        {/* Status and Error Display */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isRunning && (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 py-3">
            <p className="text-cyan-300 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              Running analysis...
            </p>
          </div>
        )}

        {/* Results Summary */}
        {hasArchetypes && (
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 mb-2">
              Generated Archetypes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Total:</span>
                <span className="ml-2 text-ivory font-mono">{totalArchetypes}</span>
              </div>
              <div>
                <span className="text-slate-400">Single Stats:</span>
                <span className="ml-2 text-ivory font-mono">{singleStatsCount}</span>
              </div>
              <div>
                <span className="text-slate-400">Stat Pairs:</span>
                <span className="ml-2 text-ivory font-mono">{pairStatsCount}</span>
              </div>
              <div>
                <span className="text-slate-400">Analysis:</span>
                <span className="ml-2 text-ivory font-mono">
                  {hasResults ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {hasResults && (
          <div className="space-y-4">
            {/* View Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-2 rounded-lg border text-sm tracking-[0.2em] uppercase ${
                  activeView === 'table'
                    ? 'border-amber-400/60 text-amber-200 bg-amber-500/10'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setActiveView('heatmap')}
                className={`px-3 py-2 rounded-lg border text-sm tracking-[0.2em] uppercase ${
                  activeView === 'heatmap'
                    ? 'border-amber-400/60 text-amber-200 bg-amber-500/10'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                Synergy Heatmap
              </button>
              <button
                onClick={() => setActiveView('radar')}
                className={`px-3 py-2 rounded-lg border text-sm tracking-[0.2em] uppercase ${
                  activeView === 'radar'
                    ? 'border-amber-400/60 text-amber-200 bg-amber-500/10'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                Radar Chart
              </button>
            </div>

            {/* View Content */}
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-4">
              {activeView === 'table' && <MarginalUtilityTable />}
              {activeView === 'heatmap' && <SynergyHeatmap />}
              {activeView === 'radar' && <StatProfileRadar />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
