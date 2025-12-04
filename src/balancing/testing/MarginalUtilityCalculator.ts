import type { StatBlock } from '../types';
import { BASELINE_STATS } from '../baseline';
import type { StatsArchetype } from './StressTestArchetypeGenerator';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from './metrics';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type { SimulationConfig } from '../simulation/types';

/**
 * MarginalUtilityCalculator
 *
 * Given a statsArchetype (single or pair) and a CombatSimulator,
 * runs deterministic simulations vs BASELINE_STATS and derives
 * marginal utility and synergy metrics.
 */
export class MarginalUtilityCalculator {
  constructor(private readonly baseline: StatBlock = BASELINE_STATS) {}

  /**
   * Calculate marginal utility for a single-stat statsArchetype.
   *
   * NOTE: Implementation will be wired to the existing CombatSimulator
   * in Phase 2 of the plan. For now we only define the contract.
   */
  async calculateStatUtility(
    statsArchetype: StatsArchetype,
    iterations: number,
  ): Promise<MarginalUtilityMetrics> {
    if (statsArchetype.type !== 'single-stat') {
      throw new Error('calculateStatUtility expects a single-stat StatsArchetype');
    }

    const [statId] = statsArchetype.testedStats;

    const simConfig: SimulationConfig = {
      iterations,
      combat: {
        entity1: { name: 'baseline', hp: this.baseline.hp, damage: this.baseline.damage, ...this.baseline },
        entity2: { name: 'statsArchetype', hp: statsArchetype.stats.hp, damage: statsArchetype.stats.damage, ...statsArchetype.stats },
        turnLimit: 100,
      },
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
  ): Promise<PairSynergyMetrics> {
    if (pairArchetype.type !== 'pair-stat') {
      throw new Error('calculatePairSynergy expects a pair-stat StatsArchetype');
    }

    const [statA, statB] = pairArchetype.testedStats;

    const simConfig: SimulationConfig = {
      iterations,
      combat: {
        entity1: { name: 'baseline', hp: this.baseline.hp, damage: this.baseline.damage, ...this.baseline },
        entity2: { name: 'pairStats', hp: pairArchetype.stats.hp, damage: pairArchetype.stats.damage, ...pairArchetype.stats },
        turnLimit: 100,
      },
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
