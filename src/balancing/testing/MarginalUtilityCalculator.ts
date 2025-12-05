import type { StatBlock } from '../types';
import { BASELINE_STATS } from '../baseline';
import type { StatsArchetype } from './StressTestArchetypeGenerator';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from './metrics';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type { SimulationConfig, RNG } from '../simulation/types';

/**
 * MarginalUtilityCalculator
 *
 * Given a statsArchetype (single or pair) and a CombatSimulator,
 * runs deterministic simulations vs BASELINE_STATS and derives
 * marginal utility and synergy metrics.
 */
export class MarginalUtilityCalculator {
  private readonly baseline: StatBlock;

  constructor(baseline: StatBlock = BASELINE_STATS) {
    this.baseline = baseline;
  }

  /**
   * Calculate marginal utility for a single-stat statsArchetype.
   *
   * NOTE: Implementation will be wired to the existing CombatSimulator
   * in Phase 2 of the plan. For now we only define the contract.
   */
  async calculateStatUtility(
    statsArchetype: StatsArchetype,
    iterations: number,
    rng?: RNG,
  ): Promise<MarginalUtilityMetrics> {
    if (statsArchetype.type !== 'single-stat') {
      throw new Error('calculateStatUtility expects a single-stat StatsArchetype');
    }

    const [statId] = statsArchetype.testedStats;

    const simConfig: SimulationConfig = {
      iterations,
      combat: {
        entity1: {
          name: 'baseline',
          ...this.baseline,
          attack: this.baseline.damage,
          defense: (this.baseline as any).armor ?? 0,
        },
        entity2: {
          name: 'statsArchetype',
          ...statsArchetype.stats,
          attack: statsArchetype.stats.damage,
          defense: (statsArchetype.stats as any).armor ?? 0,
        },
        turnLimit: 100,
      },
      rng,
    };

    const results = MonteCarloSimulation.run(simConfig);

    const winRate = results.summary.winRates.entity2;
    const avgTurns = results.combatStatistics.averageTurns;

    // hpEfficiency.entityX = average(damageDealt / hpLost)
    // We can approximate HP trade by comparing these two efficiencies.
    const eff1 = results.hpEfficiency.entity1;
    const eff2 = results.hpEfficiency.entity2;
    const hpTradeEfficiency = eff2 - eff1; // positive => better trading for statsArchetype

    // Normalize winRate around 1.0 (0.5 = 1.0)
    const normalizedWinRate = winRate / 0.5; // 0.5 => 1.0, 0.6 => 1.2, 0.4 => 0.8

    // Normalize hpTrade around 1.0 with a soft scale
    // Assume |hpTradeEfficiency| ~ 0.5 is already quite big
    const normalizedHpTrade = 1 + Math.max(-0.5, Math.min(0.5, hpTradeEfficiency)) * 0.5;

    const utilityScore = 0.7 * normalizedWinRate + 0.3 * normalizedHpTrade;

    // Simple confidence proxy: narrower CI => higher confidence
    const [ciLow, ciHigh] = results.summary.confidenceIntervals.entity2;
    const ciWidth = ciHigh - ciLow;
    const confidence = Math.max(0, 1 - ciWidth * 10); // heuristic

    return {
      statId,
      pointsPerStat: statsArchetype.pointsPerStat,
      type: statsArchetype.type,
      winRate,
      avgTurns,
      hpTradeEfficiency,
      utilityScore,
      confidence,
    };
  }

  /**
   * Calculate synergy metrics for a pair-stat statsArchetype,
   * using the already-computed single-stat metrics.
   */
  async calculatePairSynergy(
    pairArchetype: StatsArchetype,
    singleMetrics: Map<string, MarginalUtilityMetrics>,
    iterations: number,
    rng?: RNG,
  ): Promise<PairSynergyMetrics> {
    if (pairArchetype.type !== 'pair-stat') {
      throw new Error('calculatePairSynergy expects a pair-stat StatsArchetype');
    }

    const [statA, statB] = pairArchetype.testedStats;

    const simConfig: SimulationConfig = {
      iterations,
      combat: {
        entity1: {
          name: 'baseline',
          ...this.baseline,
          attack: this.baseline.damage,
          defense: (this.baseline as any).armor ?? 0,
        },
        entity2: {
          name: 'pairStats',
          ...pairArchetype.stats,
          attack: pairArchetype.stats.damage,
          defense: (pairArchetype.stats as any).armor ?? 0,
        },
        turnLimit: 100,
      },
      rng,
    };

    const results = MonteCarloSimulation.run(simConfig);
    const combinedWinRate = results.summary.winRates.entity2;

    const mA = singleMetrics.get(statA);
    const mB = singleMetrics.get(statB);
    if (!mA || !mB) {
      throw new Error(`Missing single-stat metrics for ${statA} or ${statB}`);
    }

    const expectedWinRate = (mA.winRate + mB.winRate) / 2;
    const synergyRatio = expectedWinRate > 0 ? combinedWinRate / expectedWinRate : 1;

    let assessment: 'OP' | 'synergistic' | 'neutral' | 'weak';
    if (synergyRatio > 1.15) assessment = 'OP';
    else if (synergyRatio > 1.05) assessment = 'synergistic';
    else if (synergyRatio > 0.95) assessment = 'neutral';
    else assessment = 'weak';

    return {
      statA,
      statB,
      pointsPerStat: pairArchetype.pointsPerStat,
      combinedWinRate,
      expectedWinRate,
      synergyRatio,
      assessment,
    };
  }
}
