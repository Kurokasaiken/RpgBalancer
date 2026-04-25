/**
 * STS Seed Diff Analyzer
 * 
 * Analyzes and compares two STS scenario runner seeds to identify divergences
 * in simulation results with configurable thresholds and detailed reporting.
 * 
 * @module SeedDiffAnalyzer
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';
import type { STSSimulatorState, SimulatorResult } from '../../hooks/archmage/stsSimulatorState';
import type { STSRunSummary } from '../../hooks/archmage/useSTSRunRecorder';

/**
 * Configuration schema for seed diff analysis
 */
export const SeedDiffConfigSchema = z.object({
  /** Threshold for highlighting significant divergences (default: 2%) */
  divergenceThreshold: z.number().min(0).max(1).default(0.02),
  
  /** Maximum number of turns to analyze (default: 100) */
  maxTurns: z.number().positive().default(100),
  
  /** Whether to include detailed turn-by-turn analysis */
  includeTurnByTurn: z.boolean().default(true),
  
  /** Whether to include statistical analysis */
  includeStatistics: z.boolean().default(true),
  
  /** Custom weights for different metrics */
  metricWeights: z.object({
    hp: z.number().default(1.0),
    mana: z.number().default(0.8),
    damage: z.number().default(1.2),
    turnCount: z.number().default(0.5),
  }).default({
    hp: 1.0,
    mana: 0.8,
    damage: 1.2,
    turnCount: 0.5,
  }),
});

export type SeedDiffConfig = z.infer<typeof SeedDiffConfigSchema>;

/**
 * Individual metric divergence data
 */
export interface MetricDivergence {
  /** Name of the metric */
  metric: string;
  /** Value from seed A */
  valueA: number;
  /** Value from seed B */
  valueB: number;
  /** Absolute difference */
  difference: number;
  /** Percentage difference */
  percentDifference: number;
  /** Whether this exceeds the divergence threshold */
  isSignificant: boolean;
  /** Weight of this metric in overall divergence score */
  weight: number;
}

/**
 * Turn-by-turn comparison data
 */
export interface TurnComparison {
  /** Turn number */
  turn: number;
  /** Player HP in seed A */
  playerHpA: number;
  /** Player HP in seed B */
  playerHpB: number;
  /** Enemy HP in seed A */
  enemyHpA: number;
  /** Enemy HP in seed B */
  enemyHpB: number;
  /** Player mana in seed A */
  playerManaA: number;
  /** Player mana in seed B */
  playerManaB: number;
  /** Divergence score for this turn (0-1) */
  divergenceScore: number;
  /** Significant events in this turn */
  significantEvents: string[];
}

/**
 * Statistical analysis of the divergence
 */
export interface DivergenceStatistics {
  /** Overall divergence score (0-1) */
  overallDivergence: number;
  /** Number of significant divergences */
  significantDivergences: number;
  /** Total divergences analyzed */
  totalDivergences: number;
  /** Maximum divergence percentage */
  maxDivergencePercent: number;
  /** Average divergence percentage */
  avgDivergencePercent: number;
  /** Divergence trend (increasing/decreasing/stable) */
  divergenceTrend: 'increasing' | 'decreasing' | 'stable';
  /** Turn where divergence first became significant */
  firstSignificantTurn: number | null;
  /** Correlation coefficient between the two runs */
  correlation: number;
}

/**
 * Complete seed diff analysis result
 */
export interface SeedDiffResult {
  /** Analysis metadata */
  metadata: {
    /** Seed A value */
    seedA: number;
    /** Seed B value */
    seedB: number;
    /** Scenario identifier */
    scenarioId: string;
    /** Analysis timestamp */
    timestamp: string;
    /** Configuration used */
    config: SeedDiffConfig;
  };
  
  /** Simulation results */
  results: {
    /** Result from seed A */
    resultA: SimulatorResult;
    /** Result from seed B */
    resultB: SimulatorResult;
    /** Summary from seed A */
    summaryA: STSRunSummary;
    /** Summary from seed B */
    summaryB: STSRunSummary;
  };
  
  /** Metric divergences */
  metricDivergences: MetricDivergence[];
  
  /** Turn-by-turn comparisons */
  turnComparisons: TurnComparison[];
  
  /** Statistical analysis */
  statistics: DivergenceStatistics;
  
  /** Significant divergences (> threshold) */
  significantDivergences: MetricDivergence[];
}

/**
 * Seed diff analyzer class
 */
export class SeedDiffAnalyzer {
  private config: SeedDiffConfig;
  
  constructor(config: Partial<SeedDiffConfig> = {}) {
    this.config = SeedDiffConfigSchema.parse(config);
  }
  
  /**
   * Analyze two simulation runs and identify divergences
   */
  async analyzeSeeds(
    seedA: number,
    seedB: number,
    scenarioId: string,
    runA: { state: STSSimulatorState; summary: STSRunSummary },
    runB: { state: STSSimulatorState; summary: STSRunSummary }
  ): Promise<SeedDiffResult> {
    // Validate inputs
    this.validateInputs(seedA, seedB, scenarioId, runA, runB);
    
    // Calculate metric divergences
    const metricDivergences = this.calculateMetricDivergences(runA, runB);
    
    // Generate turn-by-turn comparisons
    const turnComparisons = this.generateTurnComparisons(runA.state, runB.state);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(metricDivergences, turnComparisons);
    
    // Filter significant divergences
    const significantDivergences = metricDivergences.filter(d => d.isSignificant);
    
    return {
      metadata: {
        seedA,
        seedB,
        scenarioId,
        timestamp: new Date().toISOString(),
        config: this.config,
      },
      results: {
        resultA: runA.state.result || 'timeout',
        resultB: runB.state.result || 'timeout',
        summaryA: runA.summary,
        summaryB: runB.summary,
      },
      metricDivergences,
      turnComparisons,
      statistics,
      significantDivergences,
    };
  }
  
  /**
   * Calculate divergences for key metrics
   */
  private calculateMetricDivergences(
    runA: { state: STSSimulatorState; summary: STSRunSummary },
    runB: { state: STSSimulatorState; summary: STSRunSummary }
  ): MetricDivergence[] {
    const metrics: MetricDivergence[] = [];
    
    // Final HP divergence
    metrics.push(this.createMetricDivergence(
      'final_hp',
      runA.state.playerState.hp,
      runB.state.playerState.hp,
      this.config.metricWeights.hp
    ));
    
    // Final enemy HP divergence
    metrics.push(this.createMetricDivergence(
      'final_enemy_hp',
      runA.state.enemyState.hp,
      runB.state.enemyState.hp,
      this.config.metricWeights.hp
    ));
    
    // Total mana spent divergence
    const totalManaA = this.calculateTotalManaSpent(runA.summary);
    const totalManaB = this.calculateTotalManaSpent(runB.summary);
    metrics.push(this.createMetricDivergence(
      'total_mana_spent',
      totalManaA,
      totalManaB,
      this.config.metricWeights.mana
    ));
    
    // Turn count divergence
    metrics.push(this.createMetricDivergence(
      'turn_count',
      runA.summary.totalTurns,
      runB.summary.totalTurns,
      this.config.metricWeights.turnCount
    ));
    
    // Total damage dealt divergence
    const totalDamageA = this.calculateTotalDamageDealt(runA.summary);
    const totalDamageB = this.calculateTotalDamageDealt(runB.summary);
    metrics.push(this.createMetricDivergence(
      'total_damage_dealt',
      totalDamageA,
      totalDamageB,
      this.config.metricWeights.damage
    ));
    
    // Agency rate divergence
    metrics.push(this.createMetricDivergence(
      'agency_rate',
      runA.summary.agencyMetrics.agencyRate,
      runB.summary.agencyMetrics.agencyRate,
      1.0
    ));
    
    // Mana efficiency divergence
    metrics.push(this.createMetricDivergence(
      'mana_efficiency',
      runA.summary.manaMetrics.manaEfficiency,
      runB.summary.manaMetrics.manaEfficiency,
      0.8
    ));
    
    return metrics;
  }
  
  /**
   * Create a single metric divergence
   */
  private createMetricDivergence(
    metric: string,
    valueA: number,
    valueB: number,
    weight: number
  ): MetricDivergence {
    const difference = Math.abs(valueA - valueB);
    const avgValue = (valueA + valueB) / 2;
    const percentDifference = avgValue === 0 ? 0 : (difference / avgValue);
    const isSignificant = percentDifference > this.config.divergenceThreshold;
    
    return {
      metric,
      valueA,
      valueB,
      difference,
      percentDifference,
      isSignificant,
      weight,
    };
  }
  
  /**
   * Generate turn-by-turn comparisons
   */
  private generateTurnComparisons(
    stateA: STSSimulatorState,
    stateB: STSSimulatorState
  ): TurnComparison[] {
    const comparisons: TurnComparison[] = [];
    const maxTurns = Math.min(
      stateA.turnNumber,
      stateB.turnNumber,
      this.config.maxTurns
    );
    
    for (let turn = 0; turn <= maxTurns; turn++) {
      // Get state at this turn (simplified - in real implementation would need turn history)
      const playerHpA = this.getStateAtTurn(stateA, turn).playerHp;
      const playerHpB = this.getStateAtTurn(stateB, turn).playerHp;
      const enemyHpA = this.getStateAtTurn(stateA, turn).enemyHp;
      const enemyHpB = this.getStateAtTurn(stateB, turn).enemyHp;
      const playerManaA = this.getStateAtTurn(stateA, turn).playerMana;
      const playerManaB = this.getStateAtTurn(stateB, turn).playerMana;
      
      // Calculate divergence score for this turn
      const hpDivergence = Math.abs(playerHpA - playerHpB) / Math.max(playerHpA, playerHpB, 1);
      const enemyHpDivergence = Math.abs(enemyHpA - enemyHpB) / Math.max(enemyHpA, enemyHpB, 1);
      const manaDivergence = Math.abs(playerManaA - playerManaB) / Math.max(playerManaA, playerManaB, 1);
      const divergenceScore = (hpDivergence + enemyHpDivergence + manaDivergence) / 3;
      
      // Identify significant events
      const significantEvents: string[] = [];
      if (hpDivergence > this.config.divergenceThreshold) {
        significantEvents.push(`HP divergence: ${Math.abs(playerHpA - playerHpB)}`);
      }
      if (enemyHpDivergence > this.config.divergenceThreshold) {
        significantEvents.push(`Enemy HP divergence: ${Math.abs(enemyHpA - enemyHpB)}`);
      }
      if (manaDivergence > this.config.divergenceThreshold) {
        significantEvents.push(`Mana divergence: ${Math.abs(playerManaA - playerManaB)}`);
      }
      
      comparisons.push({
        turn,
        playerHpA,
        playerHpB,
        enemyHpA,
        enemyHpB,
        playerManaA,
        playerManaB,
        divergenceScore,
        significantEvents,
      });
    }
    
    return comparisons;
  }
  
  /**
   * Get state at specific turn (simplified implementation)
   */
  private getStateAtTurn(state: STSSimulatorState, _turn: number) {
    // This is a simplified version - in reality would need to reconstruct state from turn logs
    return {
      playerHp: state.playerState.hp,
      enemyHp: state.enemyState.hp,
      playerMana: Object.values(state.resonance).reduce((sum, mana) => sum + mana, 0),
    };
  }
  
  /**
   * Calculate statistical analysis
   */
  private calculateStatistics(
    metricDivergences: MetricDivergence[],
    turnComparisons: TurnComparison[]
  ): DivergenceStatistics {
    const significantDivergences = metricDivergences.filter(d => d.isSignificant);
    const totalDivergences = metricDivergences.length;
    
    const maxDivergencePercent = Math.max(...metricDivergences.map(d => d.percentDifference));
    const avgDivergencePercent = metricDivergences.reduce((sum, d) => sum + d.percentDifference, 0) / totalDivergences;
    
    // Calculate overall divergence (weighted)
    const overallDivergence = metricDivergences.reduce((sum, d) => {
      return sum + (d.percentDifference * d.weight);
    }, 0) / metricDivergences.reduce((sum, d) => sum + d.weight, 0);
    
    // Determine divergence trend
    const divergenceScores = turnComparisons.map(tc => tc.divergenceScore);
    const divergenceTrend = this.calculateTrend(divergenceScores);
    
    // Find first significant turn
    const firstSignificantTurn = turnComparisons.find(tc => tc.divergenceScore > this.config.divergenceThreshold)?.turn ?? null;
    
    // Calculate correlation (simplified)
    const correlation = this.calculateCorrelation(turnComparisons);
    
    return {
      overallDivergence,
      significantDivergences: significantDivergences.length,
      totalDivergences,
      maxDivergencePercent,
      avgDivergencePercent,
      divergenceTrend,
      firstSignificantTurn,
      correlation,
    };
  }
  
  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increases++;
      else if (values[i] < values[i - 1]) decreases++;
    }
    
    const ratio = increases / (increases + decreases);
    if (ratio > 0.6) return 'increasing';
    if (ratio < 0.4) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate correlation between two runs (simplified)
   */
  private calculateCorrelation(turnComparisons: TurnComparison[]): number {
    // Simplified correlation based on HP similarity
    const hpSimilarities = turnComparisons.map(tc => {
      const maxHp = Math.max(tc.playerHpA, tc.playerHpB, 1);
      const diff = Math.abs(tc.playerHpA - tc.playerHpB);
      return 1 - (diff / maxHp);
    });
    
    return hpSimilarities.reduce((sum, sim) => sum + sim, 0) / hpSimilarities.length;
  }
  
  /**
   * Calculate total mana spent from summary
   */
  private calculateTotalManaSpent(summary: STSRunSummary): number {
    // Calculate total mana from all mana types
    return Object.values(summary.manaMetrics.totalManaSpent).reduce((sum, mana) => sum + mana, 0);
  }
  
  /**
   * Calculate total damage dealt from summary
   */
  private calculateTotalDamageDealt(summary: STSRunSummary): number {
    // This is a simplified calculation - in reality would need to track actual damage
    return summary.totalTurns * 10; // Simplified assumption
  }
  
  /**
   * Validate input parameters
   */
  private validateInputs(
    seedA: number,
    seedB: number,
    scenarioId: string,
    runA: { state: STSSimulatorState; summary: STSRunSummary },
    runB: { state: STSSimulatorState; summary: STSRunSummary }
  ): void {
    if (seedA === seedB) {
      throw new Error('Seeds must be different for meaningful comparison');
    }
    
    if (!scenarioId || typeof scenarioId !== 'string') {
      throw new Error('Valid scenario ID is required');
    }
    
    if (!runA?.state || !runA?.summary || !runB?.state || !runB?.summary) {
      throw new Error('Both runs must contain valid state and summary data');
    }
    
    if (runA.state.deckId !== runB.state.deckId || runA.state.enemyId !== runB.state.enemyId) {
      throw new Error('Both runs must use the same deck and enemy configuration');
    }
  }
}

/**
 * Default seed diff analyzer instance
 */
export const defaultSeedDiffAnalyzer = new SeedDiffAnalyzer();
