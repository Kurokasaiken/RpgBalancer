import React, { useCallback, useMemo } from 'react';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from '../../balancing/testing/metrics';
import { MarginalUtilityTable } from './MarginalUtilityTable';
import { SynergyHeatmap } from './SynergyHeatmap';
import { StatProfileRadar } from './StatProfileRadar';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';

interface StressTestDashboardProps {
  singleStats: MarginalUtilityMetrics[];
  pairStats: PairSynergyMetrics[];
  onRunTests?: () => void;
  isRunning?: boolean;
}

export const StressTestDashboard: React.FC<StressTestDashboardProps> = ({
  singleStats,
  pairStats,
  onRunTests,
  isRunning = false,
}) => {
  const { config } = useBalancerConfig();

  const visibleStats = useMemo(() => {
    return Object.values(config.stats)
      .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [config.stats]);

  const getStatLabel = useCallback(
    (statId: string) => {
      const stat = visibleStats.find((s) => s.id === statId);
      return stat?.label ?? statId;
    },
    [visibleStats],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#000000_100%)] text-slate-200 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-4 relative">
        {/* Arcane glow background */}
        <div className="pointer-events-none absolute inset-0 opacity-40 -z-10">
          <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.35)_0,transparent_60%)] blur-3xl animate-pulse" />
          <div className="absolute bottom-[-6rem] right-[-4rem] w-80 h-80 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.3)_0,transparent_65%)] blur-3xl animate-[ping_12s_linear_infinite]" />
        </div>

        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[0.35em] uppercase text-indigo-200 drop-shadow-[0_0_18px_rgba(129,140,248,0.9)]">
              Stat Stress Testing
            </h1>
            <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-[0.26em]">
              Arcane Tech Glass · Marginal Utility & Synergy Map
            </p>
          </div>
          {onRunTests && (
            <button
              type="button"
              onClick={onRunTests}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/70 text-cyan-200 text-[10px] tracking-[0.32em] uppercase bg-slate-900/60 hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning && (
                <span className="inline-block w-3 h-3 border-[2px] border-cyan-300/70 border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isRunning ? 'Running…' : 'Run Tests'}</span>
            </button>
          )}
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr] items-start">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
              Single-Stat Marginal Utility
            </h2>
            <MarginalUtilityTable metrics={singleStats} />
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
              Stat Utility Profile
            </h2>
            <StatProfileRadar metrics={singleStats} />
          </section>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
            Pair Synergy Heatmap (Top Tier)
          </h2>
          <SynergyHeatmap synergies={pairStats} getLabel={getStatLabel} />
          <div className="mt-1 text-[9px] text-slate-500">
            Red = pair performs far above neutral expectation (&gt;115%), amber = moderately above
            (~105–115%), grey ≈ neutral (~95–105%), blue = below expectation (&lt;95%).
          </div>
        </section>
      </div>
    </div>
  );
};
