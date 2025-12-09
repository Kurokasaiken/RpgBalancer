import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRoundRobinTesting } from './useRoundRobinTesting';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { StatEfficiencyTable } from './StatEfficiencyTable';
import { MatchupHeatmap } from './MatchupHeatmap';
import { EfficiencyRadar } from './EfficiencyRadar';
import { MarginalUtilityTable } from './MarginalUtilityTable';
import { SynergyHeatmap } from './SynergyHeatmap';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from '../../balancing/testing/metrics';
import type { StatEfficiency, MatchupResult } from '../../balancing/testing/RoundRobinRunner';
import { computeStatWeightSuggestions } from '../../balancing/stats/StatWeightAdvisor';
import { runAndStoreAutoBalanceSession } from '../../balancing/stats/AutoStatBalanceService';
import { StatBalanceHistoryStore } from '../../balancing/stats/StatBalanceHistoryStore';
import type { StatBalanceRun, StatBalanceSession } from '../../balancing/stats/StatBalanceTypes';

const TIERS = [25, 50, 75, 100] as const;
const FAST_ITERATIONS = 2000;
const FULL_ITERATIONS = 10000;

type IterationMode = 'fast' | 'full';

/**
 * Convert StatEfficiency (from Round-Robin) to MarginalUtilityMetrics (legacy format).
 *
 * We do not have full combat metrics here, so some fields are derived with
 * sane defaults:
 * - deltaWinRate: deviation from 0.5 baseline
 * - dptRatio: fixed to 1.0 (not available from StatEfficiency)
 * - drawRate: estimated from draws / totalMatchups
 */
function convertToMarginalUtility(efficiencies: StatEfficiency[]): MarginalUtilityMetrics[] {
  return efficiencies.map((eff) => {
    const totalMatchups = eff.wins + eff.losses + eff.draws;
    const drawRate = totalMatchups > 0 ? eff.draws / totalMatchups : 0;
    const deltaWinRate = eff.efficiency - 0.5;

    return {
      statId: eff.statId,
      pointsPerStat: eff.pointsPerStat,
      type: 'single-stat',
      winRate: eff.efficiency,
      avgTurns: 0, // Not available in StatEfficiency
      deltaWinRate,
      dptRatio: 1, // Not available at this layer
      drawRate,
      hpTradeEfficiency: 0, // Not available
      utilityScore: eff.efficiency,
      confidence: 0.8, // Default confidence
    };
  });
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
  const { config, updateStat, activePreset } = useBalancerConfig();
  const {
    aggregatedResults,
    currentResults,
    selectedTier,
    isRunning,
    error,
    runAllTiers,
    setSelectedTier,
  } = useRoundRobinTesting(config);

  const [iterationMode, setIterationMode] = useState<IterationMode>('full');
  const iterations = iterationMode === 'fast' ? FAST_ITERATIONS : FULL_ITERATIONS;
  const [autoMaxIterations, setAutoMaxIterations] = useState<number>(5);
  const [autoIterationsPerTier, setAutoIterationsPerTier] = useState<number>(iterations);
  const [advisorTargetMin, setAdvisorTargetMin] = useState<number>(0.45);
  const [advisorTargetMax, setAdvisorTargetMax] = useState<number>(0.55);
  const [advisorMaxRelativeDelta, setAdvisorMaxRelativeDelta] = useState<number>(0.15);
  const [advisorMinEfficiencyDeviation, setAdvisorMinEfficiencyDeviation] = useState<number>(0.02);
  const [isAutoBalancing, setIsAutoBalancing] = useState<boolean>(false);
  const [autoBalanceError, setAutoBalanceError] = useState<string | undefined>();
  const [autoBalanceIterationsDone, setAutoBalanceIterationsDone] = useState<number>(0);
  const [autoBalanceLastRunId, setAutoBalanceLastRunId] = useState<string | null>(null);
  const [historyRuns, setHistoryRuns] = useState<StatBalanceRun[]>([]);
  const [historySessions, setHistorySessions] = useState<StatBalanceSession[]>([]);
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null);
  const [selectedSessionFilterId, setSelectedSessionFilterId] = useState<string | 'all'>('all');
  const [selectedComparisonRunIds, setSelectedComparisonRunIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  useEffect(() => {
    const runs = StatBalanceHistoryStore.listRuns();
    const sessions = StatBalanceHistoryStore.listSessions();
    setHistoryRuns(runs);
    setHistorySessions(sessions);
  }, []);

  useEffect(() => {
    if (!isAutoBalancing) {
      const runs = StatBalanceHistoryStore.listRuns();
      const sessions = StatBalanceHistoryStore.listSessions();
      setHistoryRuns(runs);
      setHistorySessions(sessions);
    }
  }, [isAutoBalancing]);

  const filteredHistoryRuns = useMemo(() => {
    if (selectedSessionFilterId === 'all') return historyRuns;
    const session = historySessions.find((s) => s.sessionId === selectedSessionFilterId);
    if (!session) return historyRuns;
    const allowed = new Set(session.runs.map((r) => r.id));
    return historyRuns.filter((r) => allowed.has(r.id));
  }, [historyRuns, historySessions, selectedSessionFilterId]);

  const selectedHistoryRun = useMemo(
    () => historyRuns.find((r) => r.id === selectedHistoryRunId) ?? null,
    [historyRuns, selectedHistoryRunId],
  );

  const comparisonRuns = useMemo(
    () => filteredHistoryRuns.filter((r) => selectedComparisonRunIds.includes(r.id)),
    [filteredHistoryRuns, selectedComparisonRunIds],
  );

  const toggleCompareRun = useCallback(
    (runId: string) => {
      setSelectedComparisonRunIds((prev) => {
        if (prev.includes(runId)) {
          return prev.filter((id) => id !== runId);
        }
        if (prev.length >= 3) {
          return [...prev.slice(1), runId];
        }
        return [...prev, runId];
      });
    },
    [setSelectedComparisonRunIds],
  );

  const handleClearHistory = useCallback(() => {
    StatBalanceHistoryStore.clear();
    setHistoryRuns([]);
    setHistorySessions([]);
    setSelectedHistoryRunId(null);
    setSelectedSessionFilterId('all');
    setSelectedComparisonRunIds([]);
  }, []);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      StatBalanceHistoryStore.deleteSession(sessionId);
      const runs = StatBalanceHistoryStore.listRuns();
      const sessions = StatBalanceHistoryStore.listSessions();
      setHistoryRuns(runs);
      setHistorySessions(sessions);

      if (selectedSessionFilterId === sessionId) {
        setSelectedSessionFilterId('all');
      }

      setSelectedComparisonRunIds((prev) => prev.filter((id) => runs.some((r) => r.id === id)));

      if (selectedHistoryRunId && !runs.some((r) => r.id === selectedHistoryRunId)) {
        setSelectedHistoryRunId(null);
      }
    },
    [selectedHistoryRunId, selectedSessionFilterId],
  );

  const handleDeleteRun = useCallback(
    (runId: string) => {
      StatBalanceHistoryStore.deleteRun(runId);
      const runs = StatBalanceHistoryStore.listRuns();
      const sessions = StatBalanceHistoryStore.listSessions();
      setHistoryRuns(runs);
      setHistorySessions(sessions);

      if (selectedHistoryRunId === runId) {
        setSelectedHistoryRunId(null);
      }

      setSelectedComparisonRunIds((prev) => prev.filter((id) => id !== runId));
    },
    [selectedHistoryRunId],
  );

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
    [visibleStats]
  );

  const statIds = useMemo(() => {
    return currentResults?.efficiencies.map((e) => e.statId) ?? [];
  }, [currentResults]);

  const weightSuggestions = useMemo(
    () =>
      currentResults
        ? computeStatWeightSuggestions(config, currentResults.efficiencies, {
            targetMin: advisorTargetMin,
            targetMax: advisorTargetMax,
            maxRelativeDelta: advisorMaxRelativeDelta,
            minEfficiencyDeviation: advisorMinEfficiencyDeviation,
          })
        : [],
    [
      config,
      currentResults,
      advisorTargetMin,
      advisorTargetMax,
      advisorMaxRelativeDelta,
      advisorMinEfficiencyDeviation,
    ],
  );

  const applySuggestion = useCallback(
    (statId: string) => {
      const suggestion = weightSuggestions.find((s) => s.statId === statId);
      if (!suggestion) return;
      if (!Number.isFinite(suggestion.suggestedWeight)) return;
      if (suggestion.suggestedWeight === suggestion.currentWeight) return;
      updateStat(statId, { weight: suggestion.suggestedWeight });
    },
    [updateStat, weightSuggestions],
  );

  const applyAllSuggestions = useCallback(() => {
    weightSuggestions.forEach((s) => {
      if (s.suggestedWeight === s.currentWeight) return;
      updateStat(s.statId, { weight: s.suggestedWeight });
    });
  }, [updateStat, weightSuggestions]);

  const handleResetWeightsToPreset = useCallback(() => {
    if (!activePreset) return;

    Object.values(config.stats)
      .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
      .forEach((stat) => {
        const presetWeight = activePreset.weights[stat.id];
        if (typeof presetWeight !== 'number') return;
        if (presetWeight === stat.weight) return;
        updateStat(stat.id, { weight: presetWeight });
      });
  }, [activePreset, config.stats, updateStat]);

  const handleRunAutoBalance = useCallback(async () => {
    if (isAutoBalancing) return;
    setAutoBalanceError(undefined);
    setAutoBalanceIterationsDone(0);
    setAutoBalanceLastRunId(null);
    setIsAutoBalancing(true);
    try {
      const { finalConfig } = await runAndStoreAutoBalanceSession(config, {
        iterationsPerTier: autoIterationsPerTier,
        maxIterations: autoMaxIterations,
        advisorOptions: {
          targetMin: advisorTargetMin,
          targetMax: advisorTargetMax,
          maxRelativeDelta: advisorMaxRelativeDelta,
          minEfficiencyDeviation: advisorMinEfficiencyDeviation,
        },
        onIterationProgress: (run, iteration) => {
          setAutoBalanceIterationsDone(iteration);
          setAutoBalanceLastRunId(run.id);
        },
      });

      // Apply final weights to live BalancerConfig via updateStat (config-driven, no direct store usage)
      Object.values(finalConfig.stats)
        .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
        .forEach((stat) => {
          const live = config.stats[stat.id];
          if (!live) return;
          if (live.weight === stat.weight) return;
          updateStat(stat.id, { weight: stat.weight });
        });

      // Re-run round-robin to show the new balanced state
      await runAllTiers(iterations);
    } catch (e) {
      setAutoBalanceError((e as Error).message ?? 'Auto-balance session failed');
    } finally {
      setIsAutoBalancing(false);
    }
  }, [
    config,
    iterations,
    runAllTiers,
    updateStat,
    isAutoBalancing,
    autoIterationsPerTier,
    autoMaxIterations,
    advisorTargetMin,
    advisorTargetMax,
    advisorMaxRelativeDelta,
    advisorMinEfficiencyDeviation,
  ]);

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

          <div className="flex flex-col items-end gap-2 min-w-[260px]">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="uppercase tracking-[0.24em]">Mode</span>
              <div className="inline-flex rounded-full bg-slate-900/80 border border-slate-700/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIterationMode('fast')}
                  className={`px-3 py-0.5 text-[9px] uppercase tracking-[0.22em] ${
                    iterationMode === 'fast'
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fast
                  <span className="ml-1 text-[8px] text-slate-500">(2k)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIterationMode('full')}
                  className={`px-3 py-0.5 text-[9px] uppercase tracking-[0.22em] border-l border-slate-700/70 ${
                    iterationMode === 'full'
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full
                  <span className="ml-1 text-[8px] text-slate-500">(10k)</span>
                </button>
              </div>
            </div>

            <div className="w-full text-[9px] text-slate-300 bg-slate-950/70 border border-slate-700/70 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center justify-between mb-1">
                <span className="uppercase tracking-[0.22em] text-slate-400/90">Auto-Balance Params</span>
                <span className="text-[8px] text-slate-500">Iter, band, aggressiveness</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-x-3 gap-y-1">
                <span className="text-slate-500">Max iterations</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={autoMaxIterations}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setAutoMaxIterations(Math.max(1, Math.floor(next)));
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                />
                <span className="text-slate-500">Iterations / tier</span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={autoIterationsPerTier}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setAutoIterationsPerTier(Math.max(1, Math.floor(next)));
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                />
                <span className="text-slate-500">Target band (min / max)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={advisorTargetMin}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next)) return;
                      setAdvisorTargetMin(next);
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                  />
                  <span className="text-slate-500">–</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={advisorTargetMax}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next)) return;
                      setAdvisorTargetMax(next);
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                  />
                </div>
                <span className="text-slate-500">Max  weight (rel.)</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={advisorMaxRelativeDelta}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setAdvisorMaxRelativeDelta(Math.max(0, next));
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                />
                <span className="text-slate-500">Min eff. deviation</span>
                <input
                  type="number"
                  min={0}
                  max={0.5}
                  step={0.005}
                  value={advisorMinEfficiencyDeviation}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    setAdvisorMinEfficiencyDeviation(Math.max(0, next));
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400/80"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetWeightsToPreset}
                disabled={isRunning || isAutoBalancing || !activePreset}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-500/70 text-slate-200 text-[10px] tracking-[0.32em] uppercase bg-slate-900/60 hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset Weights
              </button>

              {/* Run All Tiers button */}
              <button
                type="button"
                onClick={() => runAllTiers(iterations)}
                disabled={isRunning || isAutoBalancing}
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

              {/* Auto-Balance Session trigger */}
              <button
                type="button"
                onClick={handleRunAutoBalance}
                disabled={isRunning || isAutoBalancing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/80 text-amber-200 text-[10px] tracking-[0.32em] uppercase bg-slate-900/60 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAutoBalancing && (
                  <span className="inline-block w-4 h-4 border-[2px] border-amber-300/80 border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isAutoBalancing ? 'Auto-Balancing…' : 'Run Auto-Balance'}</span>
              </button>
            </div>

            {(isAutoBalancing || autoBalanceIterationsDone > 0) && (
              <div className="w-full mt-1 text-[9px] text-slate-400">
                <div className="flex items-center justify-between mb-0.5">
                  <span>
                    Auto-balance {isAutoBalancing ? 'running' : 'last run'}: {autoBalanceIterationsDone}
                    /{autoMaxIterations} iterations
                  </span>
                  <span className="font-mono text-slate-300">
                    {Math.min(
                      100,
                      Math.round(
                        (autoBalanceIterationsDone / Math.max(1, autoMaxIterations)) * 100,
                      ),
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isAutoBalancing ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (autoBalanceIterationsDone / Math.max(1, autoMaxIterations)) * 100,
                      )}%`,
                    }}
                  />
                </div>
                {autoBalanceLastRunId && !isAutoBalancing && (
                  <div className="mt-0.5 text-[8px] text-slate-500">
                    Last session: {autoBalanceLastRunId.length > 18
                      ? `${autoBalanceLastRunId.slice(0, 10)}…${autoBalanceLastRunId.slice(-4)}`
                      : autoBalanceLastRunId}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {(error || autoBalanceError) && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
            {error || autoBalanceError}
          </div>
        )}

        {/* Local tabs: Live testing vs History */}
        <div className="mt-4 flex gap-2 border-b border-slate-800/60 text-[10px] uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-t transition-colors ${
              activeTab === 'live'
                ? 'bg-slate-900 text-indigo-200 border-b-2 border-indigo-400'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Testing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-t transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-900 text-indigo-200 border-b-2 border-indigo-400'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            History
          </button>
        </div>

        {/* Live view of stats from current BalancerConfig (shown only before first run) */}
        {activeTab === 'live' && !hasResults && (
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
        {activeTab === 'live' && hasResults && (
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
        {activeTab === 'live' && currentResults && (
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

                {/* Live, editable view of stat weights from BalancerConfig */}
                <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="uppercase tracking-[0.22em] text-slate-400/90">
                      Stat Weights (Live)
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Editable · updates Balancer config
                    </span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                    <span className="text-slate-500">Label</span>
                    <span className="text-slate-500">Weight</span>
                    {visibleStats.map((s) => (
                      <React.Fragment key={s.id}>
                        <span className="truncate">{s.label}</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={s.weight}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (Number.isNaN(next)) return;
                            updateStat(s.id, { weight: next });
                          }}
                          className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {currentResults && weightSuggestions.length > 0 && (
                  <div className="mt-3 text-[10px] text-slate-300/80 bg-slate-950/60 border border-cyan-700/60 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="uppercase tracking-[0.22em] text-cyan-300/90">
                        Stat Weight Suggestions
                      </span>
                      <button
                        type="button"
                        onClick={applyAllSuggestions}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-cyan-400/70 text-cyan-200 text-[9px] tracking-[0.26em] uppercase bg-slate-900/60 hover:bg-cyan-500/10"
                      >
                        Apply All
                      </button>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_auto] gap-x-3 gap-y-0.5 items-center">
                      <span className="text-slate-500">Stat</span>
                      <span className="text-slate-500">Current</span>
                      <span className="text-slate-500">Suggested</span>
                      <span className="text-slate-500">Δ%</span>
                      <span className="text-slate-500">Reason</span>
                      <span className="text-slate-500 text-center">Action</span>
                      {weightSuggestions.map((s) => (
                        <React.Fragment key={s.statId}>
                          <span className="truncate text-indigo-200 uppercase tracking-[0.18em]">
                            {getStatLabel(s.statId)}
                          </span>
                          <span className="font-mono text-slate-300/90">
                            {s.currentWeight.toFixed(2)}
                          </span>
                          <span className="font-mono text-slate-100">
                            {s.suggestedWeight.toFixed(2)}
                          </span>
                          <span
                            className={`font-mono ${
                              s.deltaPercent > 0
                                ? 'text-emerald-300'
                                : s.deltaPercent < 0
                                ? 'text-rose-300'
                                : 'text-slate-300'
                            }`}
                          >
                            {s.deltaPercent === 0 ? '0.0' : s.deltaPercent.toFixed(1)}%
                          </span>
                          <span className="truncate text-slate-400" title={s.reason}>
                            {s.reason}
                          </span>
                          <button
                            type="button"
                            disabled={s.suggestedWeight === s.currentWeight}
                            onClick={() => applySuggestion(s.statId)}
                            className="ml-1 px-2 py-0.5 rounded-full border border-slate-600/80 text-[9px] uppercase tracking-[0.18em] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/70"
                          >
                            Apply
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                <StatEfficiencyTable
                  efficiencies={currentResults.efficiencies}
                  getLabel={getStatLabel}
                />
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
                  <>
                    <MatchupHeatmap
                      matchups={currentResults.matchups}
                      statIds={statIds}
                      getLabel={getStatLabel}
                    />
                    <div className="mt-2 text-[9px] text-slate-500">
                      Green = row stat wins often (&gt;55%), grey ≈ balanced (~50%), red = loses often (&lt;45%).
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-700/40 rounded-lg p-4 text-center">
                    {selectedTier === null
                      ? 'Select a specific tier tab to view the NxN matchup heatmap.'
                      : 'No matchup data available.'}
                  </div>
                )}
              </section>
            </div>

            <section className="mt-6">
              <h2
                className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80 mb-2"
                title="Profilo visivo della forza relativa delle stat: il poligono mostra quanto ogni stat si discosta dal picco del tier selezionato (o dal profilo aggregato)."
              >
                Efficiency Radar{' '}
                {selectedTier === null ? '(Aggregated)' : `(Tier +${selectedTier})`}
              </h2>
              <EfficiencyRadar
                efficiencies={currentResults.efficiencies}
                getLabel={getStatLabel}
              />
            </section>

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
                  <>
                    <SynergyHeatmap
                      synergies={convertToSynergy(currentResults.matchups)}
                      getLabel={getStatLabel}
                    />
                    <div className="mt-2 text-[9px] text-slate-500">
                      Red = pair performs far above neutral expectation (&gt;115%), amber = moderately
                      above (~105–115%), grey ≈ neutral (~95–105%), blue = below expectation (&lt;95%).
                    </div>
                  </>
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

        {activeTab === 'history' && (historySessions.length > 0 || historyRuns.length > 0) && (
          <section className="mt-6 pt-4 border-t border-slate-700/40 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
                Balance History
              </h2>
              <div className="flex items-center gap-2">
                {historySessions.length > 0 && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="uppercase tracking-[0.2em]">Session</span>
                    <select
                      value={selectedSessionFilterId}
                      onChange={(e) =>
                        setSelectedSessionFilterId((e.target.value || 'all') as string | 'all')
                      }
                      className="bg-slate-900/70 border border-slate-700/70 rounded px-2 py-0.5 text-[9px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                    >
                      <option value="all">All</option>
                      {historySessions.map((s) => {
                        const label =
                          s.sessionId.length > 18
                            ? `${s.sessionId.slice(0, 10)}…${s.sessionId.slice(-4)}`
                            : s.sessionId;
                        return (
                          <option key={s.sessionId} value={s.sessionId}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-2 py-1 rounded-full border border-rose-500/70 text-[9px] uppercase tracking-[0.2em] text-rose-200 bg-rose-950/40 hover:bg-rose-600/20"
                >
                  Clear All
                </button>
              </div>
            </div>

            {historySessions.length > 0 && (
              <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="uppercase tracking-[0.2em] text-slate-400/90">
                    Recent Sessions
                  </span>
                  <span className="text-[9px] text-slate-500">{historySessions.length} stored</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] gap-x-3 gap-y-0.5">
                  <span className="text-slate-500">Session</span>
                  <span className="text-slate-500">Time</span>
                  <span className="text-slate-500">Runs</span>
                  <span className="text-slate-500">Last Score</span>
                  <span className="text-slate-500 text-center">Delete</span>
                  {historySessions.slice(0, 5).map((s) => {
                    const lastRun = s.runs[s.runs.length - 1];
                    const label =
                      s.sessionId.length > 18
                        ? `${s.sessionId.slice(0, 10)}…${s.sessionId.slice(-4)}`
                        : s.sessionId;
                    return (
                      <React.Fragment key={s.sessionId}>
                        <span className="truncate text-slate-200">{label}</span>
                        <span className="text-slate-400">
                          {new Date(s.startTime).toLocaleString()}
                        </span>
                        <span className="text-slate-300 font-mono">{s.runs.length}</span>
                        <span className="text-slate-300 font-mono">
                          {lastRun ? lastRun.balanceScore.toFixed(3) : '—'}
                        </span>
                        <span className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(s.sessionId)}
                            className="px-1.5 py-0.5 rounded-full border border-slate-700/80 text-[9px] text-slate-300 hover:border-rose-400/80 hover:text-rose-200"
                            title="Delete session and its runs"
                          >
                            ✕
                          </button>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {historyRuns.length > 0 && (
              <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="uppercase tracking-[0.2em] text-slate-400/90">
                    Recent Runs
                  </span>
                  <span className="text-[9px] text-slate-500">{filteredHistoryRuns.length} stored</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto_auto] gap-x-3 gap-y-0.5">
                  <span className="text-slate-500">Run</span>
                  <span className="text-slate-500">Time</span>
                  <span className="text-slate-500">Score</span>
                  <span className="text-slate-500">OP / Weak</span>
                  <span className="text-slate-500 text-center">Compare</span>
                  <span className="text-slate-500 text-center">Delete</span>
                  {filteredHistoryRuns.slice(0, 8).map((r) => {
                    const label =
                      r.id.length > 18 ? `${r.id.slice(0, 10)}…${r.id.slice(-4)}` : r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryRunId(r.id)}
                          className={`truncate text-left ${
                            selectedHistoryRunId === r.id ? 'text-cyan-200' : 'text-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                        <span className="text-slate-400">
                          {new Date(r.timestamp).toLocaleString()}
                        </span>
                        <span className="font-mono text-slate-300">
                          {r.balanceScore.toFixed(3)}
                        </span>
                        <span className="font-mono text-slate-300">
                          {r.summary.overpowered.length}/{r.summary.underpowered.length}
                        </span>
                        <span className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedComparisonRunIds.includes(r.id)}
                            onChange={() => toggleCompareRun(r.id)}
                            className="h-3 w-3 accent-cyan-400"
                          />
                        </span>
                        <span className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRun(r.id)}
                            className="px-1.5 py-0.5 rounded-full border border-slate-700/80 text-[9px] text-slate-300 hover:border-rose-400/80 hover:text-rose-200"
                            title="Delete this run"
                          >
                            ✕
                          </button>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && selectedHistoryRun && (
          <section className="mt-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
              Run Snapshot
            </h2>
            <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="uppercase tracking-[0.2em] text-slate-400/90">
                  {selectedHistoryRun.id.length > 18
                    ? `${selectedHistoryRun.id.slice(0, 10)}…${selectedHistoryRun.id.slice(-4)}`
                    : selectedHistoryRun.id}
                </span>
                <span className="text-[9px] text-slate-500">
                  {new Date(selectedHistoryRun.timestamp).toLocaleString()} · v
                  {selectedHistoryRun.configVersion}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)] gap-x-3 gap-y-0.5">
                <span className="text-slate-500">Balance Score</span>
                <span className="text-slate-500">Iterations</span>
                <span className="text-slate-500">Runs in Session</span>
                <span className="text-slate-500">Tiers</span>
                <span className="font-mono text-slate-300">
                  {selectedHistoryRun.balanceScore.toFixed(3)}
                </span>
                <span className="font-mono text-slate-300">
                  {selectedHistoryRun.iterationsPerTier}
                </span>
                <span className="font-mono text-slate-300">
                  {
                    historySessions.find((s) =>
                      s.runs.some((r) => r.id === selectedHistoryRun.id),
                    )?.runs.length ?? 1
                  }
                </span>
                <span className="text-slate-300">
                  {selectedHistoryRun.tiers.join(', ')}
                </span>
              </div>
            </div>

            {selectedHistoryRun.efficiencies && selectedHistoryRun.efficiencies.length > 0 ? (
              <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
                <StatEfficiencyTable
                  efficiencies={selectedHistoryRun.efficiencies}
                  getLabel={getStatLabel}
                />
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-700/40 rounded-lg p-3 text-center">
                No stored efficiency snapshot for this run.
              </div>
            )}

            {selectedHistoryRun.efficiencies && selectedHistoryRun.efficiencies.length > 0 && (
              <div className="mt-3">
                <EfficiencyRadar
                  efficiencies={selectedHistoryRun.efficiencies}
                  getLabel={getStatLabel}
                />
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && comparisonRuns.length >= 2 && (
          <section className="mt-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">
              Run Comparison
            </h2>
            <div className="text-[10px] text-slate-300/80 bg-slate-950/60 border border-slate-700/60 rounded-lg px-3 py-2">
              <div className="text-[9px] text-slate-500 mb-1">
                Showing {comparisonRuns.length} runs (max 3) side-by-side.
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {comparisonRuns.map((run) => (
                  <div
                    key={run.id}
                    className="bg-slate-950/80 border border-slate-700/70 rounded-lg px-2 py-2 space-y-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="uppercase tracking-[0.18em] text-slate-300 truncate">
                        {run.id.length > 18
                          ? `${run.id.slice(0, 10)}…${run.id.slice(-4)}`
                          : run.id}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(run.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-slate-500">Score</span>
                      <span className="text-slate-500">Iterations</span>
                      <span className="text-slate-500">Tiers</span>
                      <span className="font-mono text-slate-300">{run.balanceScore.toFixed(3)}</span>
                      <span className="font-mono text-slate-300">{run.iterationsPerTier}</span>
                      <span className="text-slate-300">{run.tiers.join(', ')}</span>
                    </div>
                    {run.efficiencies && run.efficiencies.length > 0 ? (
                      <StatEfficiencyTable
                        efficiencies={run.efficiencies}
                        getLabel={getStatLabel}
                      />
                    ) : (
                      <div className="text-[9px] text-slate-500 text-center py-2">
                        No efficiency snapshot stored for this run.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'live' && aggregatedResults && (
          <div className="text-[9px] text-slate-500 text-center">
            {aggregatedResults.tiers.length} tiers · {aggregatedResults.iterations} iterations
            each · {new Date(aggregatedResults.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
