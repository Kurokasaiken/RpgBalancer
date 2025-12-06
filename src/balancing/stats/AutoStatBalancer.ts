import type { BalancerConfig, StatDefinition } from '../config/types';
import { runAllTiersRoundRobin } from '../testing/runRoundRobinTests';
import type { AggregatedRoundRobinResults } from '../testing/RoundRobinRunner';
import type { StatEfficiency } from '../testing/RoundRobinRunner';
import {
  computeStatWeightSuggestions,
  DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS,
  type StatWeightAdvisorOptions,
} from './StatWeightAdvisor';
import type { StatBalanceRun, StatBalanceSession } from './StatBalanceTypes';

export interface AutoStatBalancerOptions {
  maxIterations: number;
  iterationsPerTier: number;
  seed?: number;
  sessionId?: string;
  advisorOptions?: Partial<StatWeightAdvisorOptions>;
}

export interface AutoStatBalancerResult {
  finalConfig: BalancerConfig;
  session: StatBalanceSession;
}

const DEFAULT_AUTO_BALANCER_OPTIONS: AutoStatBalancerOptions = {
  maxIterations: 5,
  iterationsPerTier: 1000,
  seed: 123456,
  sessionId: undefined,
  advisorOptions: {},
};

function cloneConfig(config: BalancerConfig): BalancerConfig {
  return JSON.parse(JSON.stringify(config)) as BalancerConfig;
}

function isStatEligible(stat: StatDefinition): boolean {
  if (stat.isDerived) return false;
  if (typeof stat.formula === 'string') return false;
  if (stat.isHidden) return false;
  return true;
}

function computeBalanceScore(efficiencies: StatEfficiency[]): number {
  if (efficiencies.length === 0) return 0;
  const total = efficiencies.reduce((acc, eff) => acc + Math.abs(eff.efficiency - 0.5), 0);
  return total / efficiencies.length;
}

function buildRun(
  id: string,
  aggregated: AggregatedRoundRobinResults,
  config: BalancerConfig,
  advisorOpts: StatWeightAdvisorOptions,
): StatBalanceRun {
  const efficiencies = aggregated.aggregatedEfficiencies;
  const balanceScore = computeBalanceScore(efficiencies);

  const overpowered = efficiencies
    .filter((e) => e.efficiency > advisorOpts.targetMax)
    .map((e) => e.statId);

  const underpowered = efficiencies
    .filter((e) => e.efficiency < advisorOpts.targetMin)
    .map((e) => e.statId);

  const weights: Record<string, number> = {};
  Object.values(config.stats)
    .filter(isStatEligible)
    .forEach((stat) => {
      weights[stat.id] = stat.weight;
    });

  return {
    id,
    timestamp: aggregated.timestamp,
    configVersion: config.version,
    weights,
    tiers: aggregated.tiers,
    iterationsPerTier: aggregated.iterations,
    efficiencies: efficiencies.map((eff) => ({ ...eff })),
    balanceScore,
    summary: {
      overpowered,
      underpowered,
    },
  };
}

export async function runAutoBalanceSession(
  initialConfig: BalancerConfig,
  options?: Partial<AutoStatBalancerOptions>,
): Promise<AutoStatBalancerResult> {
  const resolved: AutoStatBalancerOptions = {
    ...DEFAULT_AUTO_BALANCER_OPTIONS,
    ...options,
  };

  const advisorOpts: StatWeightAdvisorOptions = {
    ...DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS,
    ...(resolved.advisorOptions ?? {}),
  };

  const baseSeed = resolved.seed ?? 123456;
  const sessionId = resolved.sessionId ?? `auto-${Date.now()}`;

  let currentConfig = cloneConfig(initialConfig);
  const runs: StatBalanceRun[] = [];

  for (let iteration = 0; iteration < resolved.maxIterations; iteration++) {
    const seed = baseSeed + iteration * 1000;

    const aggregated = await runAllTiersRoundRobin(
      currentConfig,
      resolved.iterationsPerTier,
      seed,
    );

    const efficiencies = aggregated.aggregatedEfficiencies;

    const suggestions = computeStatWeightSuggestions(currentConfig, efficiencies, advisorOpts);

    const allZeroDelta = suggestions.every((s) => s.delta === 0);

    const runId = `${sessionId}-iter-${iteration + 1}`;
    const run = buildRun(runId, aggregated, currentConfig, advisorOpts);
    runs.push(run);

    if (allZeroDelta) {
      break;
    }

    const nextConfig: BalancerConfig = {
      ...currentConfig,
      stats: { ...currentConfig.stats },
    };

    suggestions.forEach((s) => {
      if (s.suggestedWeight === s.currentWeight) return;
      const stat = nextConfig.stats[s.statId];
      if (!stat) return;
      nextConfig.stats[s.statId] = {
        ...stat,
        weight: s.suggestedWeight,
      };
    });

    currentConfig = nextConfig;
  }

  const startTime = runs[0]?.timestamp ?? Date.now();
  const endTime = runs[runs.length - 1]?.timestamp ?? startTime;

  const session: StatBalanceSession = {
    sessionId,
    startTime,
    endTime,
    runs,
    strategy: 'auto',
  };

  return {
    finalConfig: currentConfig,
    session,
  };
}
