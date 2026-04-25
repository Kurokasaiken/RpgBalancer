import type { Archetype } from './StressTestArchetypeGenerator';
import { runMonteCarlo } from '../1v1/montecarlo';
import type { BalancerConfig1v1 } from '../1v1/mathEngine';
import { DEFAULT_1V1_CONFIG } from '../1v1/mathEngine';
import type { StatBlock } from '../types';

/**
 * Result of a single matchup between two archetypes.
 */
export interface MatchupResult {
  statA: string;
  statB: string;
  pointsPerStat: number;
  winRateA: number;      // Win rate of statA archetype
  winRateB: number;      // = 1 - winRateA (approximately)
  avgTurns: number;
  iterations: number;
  runtimeMs: number;     // Time taken for this matchup
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
 * Result of a single matchup between two archetypes.
 *
 * Runs every mono-stat archetype against every other mono-stat archetype
 * to produce an NxN matchup matrix and per-stat efficiency scores.
 */
export class RoundRobinRunner {
  private config: BalancerConfig1v1;

  constructor(config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG) {
    this.config = config;
  }

  /**
   * Run full round-robin for a set of archetypes (all same tier).
   */
  async runRoundRobin(
    archetypes: Archetype[],
    iterations: number = 1000,
    tier: number = 25,
    seed?: number
  ): Promise<RoundRobinResults> {
    const matchups: MatchupResult[] = [];

    console.log(`[RoundRobinRunner] Starting round-robin for ${archetypes.length} archetypes, tier ${tier}, ${iterations} iterations each`);

    // Filter to single-stat archetypes
    const singleStatArchetypes = archetypes.filter(a =>
      a.id.startsWith('single_') &&
      a.stats &&
      Object.keys(a.stats).length > 0
    );

    console.log(`[RoundRobinRunner] Using ${singleStatArchetypes.length} single-stat archetypes`);

    if (singleStatArchetypes.length < 2) {
      throw new Error('Need at least 2 single-stat archetypes for round-robin');
    }

    const baseSeed = (seed ?? Date.now()) >>> 0;

    // For each unique pair (i, j) where i < j
    for (let i = 0; i < singleStatArchetypes.length; i++) {
      for (let j = i + 1; j < singleStatArchetypes.length; j++) {
        const archA = singleStatArchetypes[i];
        const archB = singleStatArchetypes[j];

        const statA = archA.id.replace('single_', '');
        const statB = archB.id.replace('single_', '');

        console.log(`[RoundRobinRunner] Running matchup: ${statA} vs ${statB}`);

        // Generate unique seed for this matchup
        const matchupSeed = baseSeed + archA.seed + archB.seed + i * 1000 + j * 100;

        try {
          const result = runMonteCarlo(
            this.mapToStatBlock(archA.stats as unknown as Record<string, number>),
            this.mapToStatBlock(archB.stats as unknown as Record<string, number>),
            iterations,
            matchupSeed,
            this.config
          );

          const matchup: MatchupResult = {
            statA,
            statB,
            pointsPerStat: tier,
            winRateA: result.win_rate_row,
            winRateB: 1 - result.win_rate_row,
            avgTurns: result.median_TTK,
            iterations,
            runtimeMs: result.runtimeMs,
          };

          matchups.push(matchup);
          console.log(`[RoundRobinRunner] Matchup ${statA} vs ${statB}: ${matchup.winRateA.toFixed(3)} win rate for ${statA}`);

        } catch (error) {
          console.error(`[RoundRobinRunner] Failed matchup ${statA} vs ${statB}:`, error);
          // Add failed matchup with neutral results
          matchups.push({
            statA,
            statB,
            pointsPerStat: tier,
            winRateA: 0.5,
            winRateB: 0.5,
            avgTurns: 0,
            iterations,
            runtimeMs: 0,
          });
        }

        // Yield control every few matchups to prevent UI blocking
        if ((i * singleStatArchetypes.length + j) % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    }

    // Calculate efficiency for each stat
    const efficiencies = this.calculateEfficiencies(singleStatArchetypes, matchups, tier);

    console.log(`[RoundRobinRunner] Completed round-robin for tier ${tier}`);

    return {
      matchups,
      efficiencies,
      tier,
      iterations,
      timestamp: Date.now(),
    };
  }

  /**
   * Map archetype stats to StatBlock expected by Monte Carlo
   */
  private mapToStatBlock(stats: Record<string, number>): StatBlock {
    // Map common stat names to StatBlock format
    return {
      hp: stats.hp || stats.health || 100,
      damage: stats.damage || stats.attack || 10,
      armor: stats.armor || stats.defense || 0,
      speed: stats.speed || 1,
      // Add other stats as needed
      ...stats,
    } as unknown as StatBlock;
  }

  /**
   * Calculate per-stat efficiency from matchup results.
   *
   * efficiency(X) = mean(winRate of X vs Y for all Y ≠ X)
   */
  private calculateEfficiencies(
    archetypes: Archetype[],
    matchups: MatchupResult[],
    tier: number
  ): StatEfficiency[] {
    const statIds = archetypes.map((a) => a.id.replace('single_', ''));

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
    generator: unknown,
    tiers: number[] = [25, 50, 75, 100],
    iterations: number = 1000,
    seed?: number
  ): Promise<AggregatedRoundRobinResults> {
    const byTier: Record<number, RoundRobinResults> = {};
    const tiersTested: number[] = [];

    for (const tier of tiers) {
      const archetypes = (generator as { generateSingleStatArchetypes: (tiers: number[]) => Archetype[] }).generateSingleStatArchetypes([tier]);
      const results = await this.runRoundRobin(archetypes, iterations, tier, seed);
      byTier[tier] = results;
      tiersTested.push(tier);
    }

    // Aggregate efficiencies
    const allEfficiencies = Object.values(byTier).flatMap(r => r.efficiencies);
    const statIds = Array.from(new Set(allEfficiencies.map(e => e.statId)));

    const aggregatedEfficiencies = statIds.map(statId => {
      const perTier = allEfficiencies.filter(e => e.statId === statId);
      const meanEfficiency = perTier.reduce((sum, e) => sum + e.efficiency, 0) / perTier.length;
      
      return {
        statId,
        pointsPerStat: 0, // Indicated aggregate
        efficiency: meanEfficiency,
        wins: perTier.reduce((sum, e) => sum + e.wins, 0),
        losses: perTier.reduce((sum, e) => sum + e.losses, 0),
        draws: perTier.reduce((sum, e) => sum + e.draws, 0),
        rank: 0,
        assessment: this.getAssessment(meanEfficiency)
      };
    });

    aggregatedEfficiencies.sort((a, b) => b.efficiency - a.efficiency);
    aggregatedEfficiencies.forEach((e, idx) => e.rank = idx + 1);

    return {
      byTier,
      aggregatedEfficiencies,
      tiers: tiersTested,
      iterations,
      timestamp: Date.now()
    };
  }
}
