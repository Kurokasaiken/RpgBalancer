import type { BalancerConfig } from '../config/types';
import type { StatsArchetype } from './StressTestArchetypeGenerator';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type { StatBlock } from '../types';

/**
 * Result of a single matchup between two mono-stat archetypes.
 */
export interface MatchupResult {
  statA: string;
  statB: string;
  pointsPerStat: number;
  winRateA: number;      // Win rate of statA archetype
  winRateB: number;      // = 1 - winRateA (approximately)
  avgTurns: number;
  iterations: number;
}

/**
 * Efficiency metrics for a single stat across all matchups.
 */
export interface StatEfficiency {
  statId: string;
  pointsPerStat: number;
  efficiency: number;    // Mean win rate vs all other stats (0–1)
  wins: number;          // Matchups where winRate > 0.5
  losses: number;        // Matchups where winRate < 0.5
  draws: number;         // Matchups where winRate ≈ 0.5
  rank: number;          // 1 = strongest
  assessment: 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered';
}

/**
 * Full results from a round-robin run for a single tier.
 */
export interface RoundRobinResults {
  matchups: MatchupResult[];
  efficiencies: StatEfficiency[];
  tier: number;
  iterations: number;
  timestamp: number;
}

/**
 * Aggregated results across multiple tiers.
 */
export interface AggregatedRoundRobinResults {
  /** Results per tier */
  byTier: Record<number, RoundRobinResults>;
  /** Aggregated efficiency (mean across all tiers) */
  aggregatedEfficiencies: StatEfficiency[];
  /** All tiers tested */
  tiers: number[];
  iterations: number;
  timestamp: number;
}

/**
 * Convert a StatBlock to EntityStats for MonteCarloSimulation.
 */
function toEntityStats(stats: StatBlock, name: string) {
  return {
    ...stats,
    name,
    attack: stats.damage,
    defense: stats.armor,
  };
}

/**
 * Round-Robin Runner
 *
 * Runs every mono-stat archetype against every other mono-stat archetype
 * to produce an NxN matchup matrix and per-stat efficiency scores.
 */
export class RoundRobinRunner {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config: BalancerConfig) {}

  /**
   * Run full round-robin for a set of archetypes (all same tier).
   */
  async runRoundRobin(
    archetypes: StatsArchetype[],
    iterations: number = 1000
  ): Promise<RoundRobinResults> {
    const matchups: MatchupResult[] = [];
    const tier = archetypes[0]?.pointsPerStat ?? 25;

    // For each unique pair (i, j) where i < j
    for (let i = 0; i < archetypes.length; i++) {
      for (let j = i + 1; j < archetypes.length; j++) {
        const archA = archetypes[i];
        const archB = archetypes[j];

        // Run Monte Carlo: archA vs archB
        const result = MonteCarloSimulation.run({
          combat: {
            entity1: toEntityStats(archA.stats, archA.testedStats[0]),
            entity2: toEntityStats(archB.stats, archB.testedStats[0]),
            turnLimit: 100,
          },
          iterations,
        });

        matchups.push({
          statA: archA.testedStats[0],
          statB: archB.testedStats[0],
          pointsPerStat: tier,
          winRateA: result.summary.winRates.entity1,
          winRateB: result.summary.winRates.entity2,
          avgTurns: result.combatStatistics.averageTurns,
          iterations,
        });
        
        // Yield control every few matchups to prevent UI blocking
        if ((i * archetypes.length + j) % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    }

    // Calculate efficiency for each stat
    const efficiencies = this.calculateEfficiencies(archetypes, matchups);

    return {
      matchups,
      efficiencies,
      tier,
      iterations,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate per-stat efficiency from matchup results.
   *
   * efficiency(X) = mean(winRate of X vs Y for all Y ≠ X)
   */
  private calculateEfficiencies(
    archetypes: StatsArchetype[],
    matchups: MatchupResult[]
  ): StatEfficiency[] {
    const statIds = archetypes.map((a) => a.testedStats[0]);
    const tier = archetypes[0]?.pointsPerStat ?? 25;

    const efficiencyList = statIds.map((statId) => {
      // Find all matchups involving this stat
      const relevant = matchups.filter(
        (m) => m.statA === statId || m.statB === statId
      );

      // Calculate win rates from this stat's perspective
      const winRates = relevant.map((m) =>
        m.statA === statId ? m.winRateA : m.winRateB
      );

      const efficiency =
        winRates.length > 0
          ? winRates.reduce((a, b) => a + b, 0) / winRates.length
          : 0.5;

      const wins = winRates.filter((wr) => wr > 0.55).length;
      const losses = winRates.filter((wr) => wr < 0.45).length;
      const draws = winRates.length - wins - losses;

      return {
        statId,
        pointsPerStat: tier,
        efficiency,
        wins,
        losses,
        draws,
        rank: 0, // Will be set after sorting
        assessment: this.getAssessment(efficiency),
      };
    });

    // Sort by efficiency descending and assign ranks
    efficiencyList.sort((a, b) => b.efficiency - a.efficiency);
    efficiencyList.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return efficiencyList;
  }

  /**
   * Get qualitative assessment from efficiency score.
   */
  private getAssessment(
    efficiency: number
  ): 'OP' | 'strong' | 'balanced' | 'weak' | 'underpowered' {
    if (efficiency > 0.65) return 'OP';
    if (efficiency > 0.55) return 'strong';
    if (efficiency > 0.45) return 'balanced';
    if (efficiency > 0.35) return 'weak';
    return 'underpowered';
  }

  /**
   * Run round-robin for ALL tiers and aggregate results.
   */
  async runAllTiers(
    generator: import('./StressTestArchetypeGenerator').StatsArchetypeGenerator,
    tiers: number[] = [25, 50, 75, 100],
    iterations: number = 1000
  ): Promise<AggregatedRoundRobinResults> {
    const byTier: Record<number, RoundRobinResults> = {};

    for (const tier of tiers) {
      const archetypes = generator.generateSingleStatArchetypes([tier]);
      const results = await this.runRoundRobin(archetypes, iterations);
      byTier[tier] = results;
      
      // Yield control to browser to allow UI updates between tiers
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Aggregate efficiencies across all tiers
    const aggregatedEfficiencies = this.aggregateEfficiencies(byTier, tiers);

    return {
      byTier,
      aggregatedEfficiencies,
      tiers,
      iterations,
      timestamp: Date.now(),
    };
  }

  /**
   * Aggregate efficiency scores across multiple tiers.
   * For each stat: mean efficiency across all tiers.
   */
  private aggregateEfficiencies(
    byTier: Record<number, RoundRobinResults>,
    tiers: number[]
  ): StatEfficiency[] {
    // Collect all stat IDs from first tier
    const firstTier = byTier[tiers[0]];
    if (!firstTier) return [];

    const statIds = firstTier.efficiencies.map((e) => e.statId);

    const aggregated = statIds.map((statId) => {
      // Collect efficiency for this stat across all tiers
      const efficiencies = tiers.map((tier) => {
        const tierResult = byTier[tier];
        const statEff = tierResult?.efficiencies.find((e) => e.statId === statId);
        return statEff?.efficiency ?? 0.5;
      });

      const meanEfficiency =
        efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;

      // Sum wins/losses/draws across tiers
      const totalWins = tiers.reduce((sum, tier) => {
        const e = byTier[tier]?.efficiencies.find((x) => x.statId === statId);
        return sum + (e?.wins ?? 0);
      }, 0);
      const totalLosses = tiers.reduce((sum, tier) => {
        const e = byTier[tier]?.efficiencies.find((x) => x.statId === statId);
        return sum + (e?.losses ?? 0);
      }, 0);
      const totalDraws = tiers.reduce((sum, tier) => {
        const e = byTier[tier]?.efficiencies.find((x) => x.statId === statId);
        return sum + (e?.draws ?? 0);
      }, 0);

      return {
        statId,
        pointsPerStat: 0, // Aggregated, not specific to a tier
        efficiency: meanEfficiency,
        wins: totalWins,
        losses: totalLosses,
        draws: totalDraws,
        rank: 0,
        assessment: this.getAssessment(meanEfficiency),
      };
    });

    // Sort and assign ranks
    aggregated.sort((a, b) => b.efficiency - a.efficiency);
    aggregated.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return aggregated;
  }
}
