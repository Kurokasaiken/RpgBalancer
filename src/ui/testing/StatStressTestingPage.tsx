import React, { useMemo } from 'react';
import { useRoundRobinTesting } from './useRoundRobinTesting';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { StatEfficiencyTable } from './StatEfficiencyTable';
import { MatchupHeatmap } from './MatchupHeatmap';
import { MarginalUtilityTable } from './MarginalUtilityTable';
import { SynergyHeatmap } from './SynergyHeatmap';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from '../../balancing/testing/metrics';
import type { StatEfficiency, MatchupResult } from '../../balancing/testing/RoundRobinRunner';

const TIERS = [25, 50, 75, 100] as const;

/**
 * Convert StatEfficiency (from Round-Robin) to MarginalUtilityMetrics (legacy format)
 */
function convertToMarginalUtility(efficiencies: StatEfficiency[]): MarginalUtilityMetrics[] {
  return efficiencies.map((eff) => ({
    statId: eff.statId,
    pointsPerStat: eff.pointsPerStat,
    type: 'single-stat' as const,
    winRate: eff.efficiency,
    avgTurns: 0, // Not available in StatEfficiency
    hpTradeEfficiency: 0, // Not available
    utilityScore: eff.efficiency,
    confidence: 0.8, // Default confidence
  }));
}

/**
 * Convert MatchupResult (from Round-Robin) to PairSynergyMetrics (legacy format)
 */
function convertToSynergy(matchups: MatchupResult[]): PairSynergyMetrics[] {
  return matchups.map((m) => {
    const expected = 0.5; // Neutral 50% win rate expectation
    const ratio = expected > 0 ? m.winRateA / expected : 1;

    let assessment: PairSynergyMetrics['assessment'];
    if (ratio > 1.15) assessment = 'OP';
    else if (ratio > 1.05) assessment = 'synergistic';
    else if (ratio > 0.95) assessment = 'neutral';
    else assessment = 'weak';

    return {
      statA: m.statA,
      statB: m.statB,
      pointsPerStat: m.pointsPerStat,
      combinedWinRate: m.winRateA,
      expectedWinRate: expected,
      synergyRatio: ratio,
      assessment,
    };
  });
}

export const StatStressTestingPage: React.FC = () => {
  const {
    aggregatedResults,
    currentResults,
    selectedTier,
    isRunning,
    error,
    runAllTiers,
    setSelectedTier,
  } = useRoundRobinTesting();
  const { config } = useBalancerConfig();

  const visibleStats = useMemo(() => {
    return Object.values(config.stats)
      .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [config.stats]);

  const statIds = useMemo(() => {
    return currentResults?.efficiencies.map((e) => e.statId) ?? [];
  }, [currentResults]);

  const hasResults = aggregatedResults !== null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#000000_100%)] text-slate-200 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-4 relative">
        {/* Arcane glow background */}
        <div className="pointer-events-none absolute inset-0 opacity-40 -z-10">
          <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.35)_0,transparent_60%)] blur-3xl animate-pulse" />
          <div className="absolute bottom-[-6rem] right-[-4rem] w-80 h-80 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.3)_0,transparent_65%)] blur-3xl animate-[ping_12s_linear_infinite]" />
        </div>

        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[0.35em] uppercase text-indigo-200 drop-shadow-[0_0_18px_rgba(129,140,248,0.9)]">
              Stat Efficiency Testing
            </h1>
            <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-[0.26em]">
              Round-Robin · All Tiers (25, 50, 75, 100) · Live from Balancer
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 min-w-[200px]">
            {/* Run All Tiers button */}
            <button
              type="button"
              onClick={() => runAllTiers()}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/70 text-cyan-200 text-[10px] tracking-[0.32em] uppercase bg-slate-900/60 transition-colors transition-transform disabled:cursor-not-allowed disabled:opacity-60 ${
                isRunning
                  ? 'shadow-[0_0_22px_rgba(34,211,238,0.8)] animate-pulse'
                  : 'hover:bg-cyan-500/10 hover:-translate-y-[1px]'
              }`}
            >
              {isRunning && (
                <span className="inline-block w-4 h-4 border-[2px] border-cyan-300/80 border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isRunning ? 'Running All Tiers…' : 'Run All Tiers'}</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Live view of stats from current BalancerConfig (shown only before first run) */}
        {!hasResults && (
          <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="uppercase tracking-[0.22em] text-slate-400/90">
                Current Balancer Stats
              </span>
              <span className="text-[9px] text-slate-500">
                {visibleStats.length} fields (live from Balancer)
              </span>
            </div>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
              <span className="text-slate-500">Label</span>
              <span className="text-slate-500">Weight</span>
              {visibleStats.map((s) => (
                <React.Fragment key={s.id}>
                  <span className="truncate">{s.label}</span>
                  <span className="font-mono text-[10px] text-slate-300/90">
                    {s.weight.toFixed(2)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Tier Tabs */}
        {hasResults && (
          <div className="flex gap-1 border-b border-slate-700/60 pb-1">
            <button
              type="button"
              onClick={() => setSelectedTier(null)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded-t transition-colors ${
                selectedTier === null
                  ? 'bg-indigo-600/80 text-white border-b-2 border-indigo-400'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
              }`}
            >
              Aggregated
            </button>
            {TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded-t transition-colors ${
                  selectedTier === tier
                    ? 'bg-cyan-600/80 text-white border-b-2 border-cyan-400'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                }`}
              >
                +{tier} pts
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {currentResults && (
          <>
            <div className="grid gap-4 lg:grid-cols-2 items-start">
              <section className="space-y-2">
                <h2
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80"
                  title="Ranking di ogni stat in base alla winrate media nei match-up Round-Robin contro tutte le altre stat (0.5 = bilanciato, >0.5 forte, <0.5 debole)."
                >
                  Stat Efficiency Ranking{' '}
                  {selectedTier === null ? '(Aggregated)' : `(Tier +${selectedTier})`}
                </h2>
                <StatEfficiencyTable efficiencies={currentResults.efficiencies} />
              </section>

              <section className="space-y-2">
                <h2
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80"
                  title="Matrice NxN: ogni cella mostra la winrate del row-stat contro il column-stat. Verde = il row-stat vince spesso, rosso = perde spesso, grigio = ~50%."
                >
                  NxN Matchup Heatmap
                  {selectedTier === null && (
                    <span className="text-slate-500 ml-2">(select a tier to view)</span>
                  )}
                </h2>
                {selectedTier !== null && currentResults.matchups.length > 0 ? (
                  <MatchupHeatmap matchups={currentResults.matchups} statIds={statIds} />
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-700/40 rounded-lg p-4 text-center">
                    {selectedTier === null
                      ? 'Select a specific tier tab to view the NxN matchup heatmap.'
                      : 'No matchup data available.'}
                  </div>
                )}
              </section>
            </div>

            {/* Legacy Views */}
            <div className="grid gap-4 lg:grid-cols-2 items-start mt-6 pt-6 border-t border-slate-700/40">
              <section className="space-y-2">
                <h2
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80"
                  title="Vista legacy: usa le stesse efficienze Round-Robin per dare un punteggio sintetico di utilit e0 per stat e tier (valori >1 = sopra baseline, <1 = sotto)."
                >
                  Marginal Utility Analysis{' '}
                  {selectedTier === null ? '(Aggregated)' : `(Tier +${selectedTier})`}
                </h2>
                {currentResults.efficiencies.length > 0 ? (
                  <MarginalUtilityTable metrics={convertToMarginalUtility(currentResults.efficiencies)} />
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-700/40 rounded-lg p-4 text-center">
                    No efficiency data available.
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h2
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80"
                  title="Per ogni coppia (riga, colonna) mostra quanto il row-stat performa sopra o sotto il 50% contro il column-stat: rosso = molto sopra, ambra = sopra, grigio = quasi pari, blu = sotto."
                >
                  Synergy Heatmap
                  {selectedTier === null && (
                    <span className="text-slate-500 ml-2">(select a tier to view)</span>
                  )}
                </h2>
                {selectedTier !== null && currentResults.matchups.length > 0 ? (
                  <SynergyHeatmap synergies={convertToSynergy(currentResults.matchups)} />
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-700/40 rounded-lg p-4 text-center">
                    {selectedTier === null
                      ? 'Select a specific tier tab to view the synergy heatmap.'
                      : 'No synergy data available.'}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {aggregatedResults && (
          <div className="text-[9px] text-slate-500 text-center">
            {aggregatedResults.tiers.length} tiers · {aggregatedResults.iterations} iterations
            each · {new Date(aggregatedResults.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
