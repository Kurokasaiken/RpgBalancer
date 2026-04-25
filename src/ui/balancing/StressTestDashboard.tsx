import { useMemo, useState } from 'react';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { useStressTesting } from '@/balancing/hooks/useStressTesting';
import type { StatDefinition } from '@/balancing/config/types';
import { MarginalUtilityTable } from './stressTesting/MarginalUtilityTable';
import { SynergyHeatmap } from './components/SynergyHeatmap';
import { StatProfileRadar } from './StatProfileRadar';

/**
 * Stress Test Dashboard Component
 * Main page for running and viewing stress testing analysis
 */
export function StressTestDashboard() {
  const { config } = useBalancerConfig();
  const {
    archetypes,
    marginalUtilities,
    synergies,
    heatmapData,
    selectedStat,
    selectedPair,
    selectStat,
    selectPair,
    refreshData,
    isLoading,
    error,
    generateArchetypes,
    runAnalysis,
    exportResults,
  } = useStressTesting();

  const [activeTab, setActiveTab] = useState<'utility' | 'synergy' | 'radar'>('utility');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const statList = useMemo<StatDefinition[]>(() => {
    return Object.values(config?.stats ?? {}).sort((a, b) => a.label.localeCompare(b.label));
  }, [config?.stats]);

  const statPairs = useMemo(() => {
    const pairs: Array<{ stat1: StatDefinition; stat2: StatDefinition }> = [];
    for (let i = 0; i < statList.length; i += 1) {
      for (let j = i + 1; j < statList.length; j += 1) {
        pairs.push({ stat1: statList[i], stat2: statList[j] });
      }
    }
    return pairs.slice(0, 12);
  }, [statList]);

  const handleExportJson = () => {
    const json = exportResults('json') as string;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stress-test-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvs = exportResults('csv') as { marginalCsv: string; synergiesCsv: string };
    const blob1 = new Blob([csvs.marginalCsv], { type: 'text/csv' });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.href = url1;
    a1.download = 'marginal-utilities.csv';
    a1.click();
    URL.revokeObjectURL(url1);
    const blob2 = new Blob([csvs.synergiesCsv], { type: 'text/csv' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = 'synergies.csv';
    a2.click();
    URL.revokeObjectURL(url2);
  };

  const renderStatControls = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-amber-200 mb-2">Single Stat Focus</h3>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {statList.map((stat) => (
            <button
              key={stat.id}
              type="button"
              onClick={() => selectStat(stat.id)}
              className={`text-left px-3 py-2 rounded border border-amber-400/30 text-ivory hover:bg-amber-400/10 ${
                selectedStat === stat.id ? 'bg-amber-400/20' : ''
              }`}
            >
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="text-xs text-slate-400">{stat.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amber-200 mb-2">Pair Focus</h3>
        <div className="grid grid-cols-2 gap-2">
          {statPairs.map(({ stat1, stat2 }) => (
            <button
              key={`${stat1.id}-${stat2.id}`}
              type="button"
              onClick={() => selectPair(stat1.id, stat2.id)}
              className={`text-left px-3 py-2 rounded border border-amber-400/30 text-ivory hover:bg-amber-400/10 ${
                selectedPair?.stat1 === stat1.id && selectedPair?.stat2 === stat2.id ? 'bg-amber-400/20' : ''
              }`}
            >
              <div className="text-sm font-medium">
                {stat1.label} + {stat2.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="observatory-page">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-200 uppercase tracking-wide">Phase 10.5</p>
            <h1 className="text-3xl font-semibold text-ivory">Stress Testing Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Analizza marginal utility e sinergie configurate in Balancer per guidare decisioni sui pesi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshData();
                setIsDrawerOpen(false);
              }}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-semibold border border-amber-400/40 text-amber-200 rounded hover:bg-amber-400/10 disabled:opacity-40"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-2 text-xs font-semibold border border-amber-400/40 text-amber-200 rounded hover:bg-amber-400/10"
            >
              Stat Controls
            </button>
          </div>
        </div>

        <div className="default-card flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void generateArchetypes()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 text-amber-200 rounded border border-amber-400/40 disabled:opacity-50"
          >
            Generate Archetypes
          </button>
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={isLoading || archetypes.length === 0}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600/50 text-emerald-100 rounded border border-emerald-400/40 disabled:opacity-50"
          >
            Run Analysis
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={marginalUtilities.length === 0}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 text-amber-200 rounded border border-amber-400/40 disabled:opacity-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={marginalUtilities.length === 0}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 text-amber-200 rounded border border-amber-400/40 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {isLoading && (
          <div className="default-card text-sm text-amber-200">Running stress tests… questa operazione può richiedere qualche secondo.</div>
        )}
        {error && <div className="default-card text-sm text-rose-300 border border-rose-500/40">Errore: {error}</div>}

        {archetypes.length > 0 && (
          <div className="default-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ivory">Archetypes Generated</h2>
                <p className="text-sm text-slate-400">{archetypes.length} archetipi pronti per l’analisi</p>
              </div>
              {selectedStat && (
                <span className="text-xs text-amber-200 uppercase tracking-wide">
                  Focus stat: {config?.stats?.[selectedStat]?.label ?? selectedStat}
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex gap-2 bg-slate-950 border border-amber-400/30 rounded-full p-1 text-amber-200 w-fit">
            {(['utility', 'synergy', 'radar'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  activeTab === tab ? 'bg-amber-400/90 text-slate-950' : ''
                }`}
              >
                {tab === 'utility' && 'Marginal Utility'}
                {tab === 'synergy' && 'Synergy Heatmap'}
                {tab === 'radar' && 'Stat Radar'}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === 'utility' && (
              <>
                {marginalUtilities.length > 0 ? (
                  <MarginalUtilityTable results={marginalUtilities} />
                ) : (
                  <div className="default-card text-slate-400 text-sm">
                    Run analysis to view marginal utility results.
                  </div>
                )}
              </>
            )}

            {activeTab === 'synergy' && (
              <>
                {synergies.length > 0 ? (
                  <SynergyHeatmap synergies={synergies} />
                ) : (
                  <div className="default-card text-slate-400 text-sm">
                    Synergy heatmap inactive finché non sono disponibili dati.
                  </div>
                )}
              </>
            )}

            {activeTab === 'radar' && (
              <>
                {Object.keys(heatmapData).length > 0 ? (
                  <StatProfileRadar profiles={archetypes} />
                ) : (
                  <div className="default-card text-slate-400 text-sm">
                    Radar charts richiedono marginal utility calcolati.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-slate-950 border-l border-amber-400/40 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-400/20">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-300/70">Stress Testing</p>
                <h2 className="text-xl font-semibold text-ivory">Stat Controls</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-amber-200 hover:text-amber-100 text-sm"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">{renderStatControls()}</div>
          </div>
          <button
            type="button"
            aria-label="Close stat drawer"
            className="flex-1"
            onClick={() => setIsDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
