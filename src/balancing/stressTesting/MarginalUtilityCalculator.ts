/**
 * Marginal Utility Calculator
 * 
 * Core engine for Phase 10.5 marginal utility analysis.
 * Executes deterministic Monte Carlo simulations to calculate
 * pairScore, expectedScore, and synergyMultiplier for stat combinations.
 */

import type { StressTestArchetype } from './types';
import type { 
  MarginalUtilityAnalysis, 
  SimulationBatch, 
  SimulationResult,
  MarginalUtilityMetrics,
  SynergyAnalysis,
  AnalysisProgress,
  ExportData,
  ExportFormat
} from './MarginalUtilityTypes';
import type { MarginalUtilityConfig } from '../config/stressTesting/marginalUtilityConfig';
import { DEFAULT_MARGINAL_UTILITY_CONFIG } from '../config/stressTesting/marginalUtilityConfig';
import { TestRNG } from '../utils/TestRNG';
import { saveData } from '@/shared/persistence/PersistenceService';
import { 
  emitStressRunCompleted, 
  emitStressRunFailed,
  emitStressBatchCompleted,
  createStressTestPayload,
  createStressTestRunId,
  type StressTestBatchTelemetry
} from './StressTelemetry';
import type { BalancerConfig } from '@/balancing/config/types';

/**
 * Monte Carlo simulation engine for archetype matchups
 */
export class MarginalUtilityCalculator {
  private config: MarginalUtilityConfig;
  private progressCallback?: (progress: AnalysisProgress) => void;

  constructor(config: Partial<MarginalUtilityConfig> = {}) {
    this.config = { ...DEFAULT_MARGINAL_UTILITY_CONFIG, ...config };
  }

  /**
   * Set progress callback for long-running analysis
   */
  setProgressCallback(callback: (progress: AnalysisProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Run complete marginal utility analysis on archetypes
   */
  async runAnalysis(
    archetypes: StressTestArchetype[],
    _baseline: StressTestArchetype,
    balancerConfig: BalancerConfig
  ): Promise<MarginalUtilityAnalysis> {
    const startTime = Date.now();
    
    // Separate single and pair archetypes
    const singleStats = archetypes.filter(a => a.type === 'single');
    const pairStats = archetypes.filter(a => a.type === 'pair');
    
    // Calculate individual stat metrics
    const statMetrics = await this.calculateStatMetrics(singleStats, pairStats);
    
    // Calculate synergy analyses
    const synergyAnalyses = await this.calculateSynergyAnalyses(pairStats, statMetrics);
    
    // Compile summary statistics
    const totalSimulations = pairStats.reduce((sum: number, _pair: StressTestArchetype) => sum + this.config.simulation.simulationCount, 0);
    const runtimeMs = Date.now() - startTime;
    
    const analysis: MarginalUtilityAnalysis = {
      id: `mu-analysis-${this.config.seed}-${Date.now()}`,
      config: {
        simulationCount: this.config.simulationCount,
        seed: this.config.seed,
        thresholds: {
          opThreshold: this.config.opThreshold,
          weakThreshold: this.config.weakThreshold,
        },
      },
      statMetrics,
      synergyAnalyses,
      summary: {
        totalSimulations,
        totalRuntimeMs: runtimeMs,
        avgSimulationsPerSecond: Math.round(totalSimulations / (runtimeMs / 1000)),
        opSynergiesCount: synergyAnalyses.filter(s => s.isOpSynergy).length,
        weakSynergiesCount: synergyAnalyses.filter(s => s.isWeakSynergy).length,
        significantSynergiesCount: synergyAnalyses.filter(s => s.isSignificant).length,
      },
      timestamp: Date.now(),
    };

    // Save results if configured
    if (this.config.enableCaching) {
      await this.saveAnalysisResults(analysis);
    }

    return analysis;
  }

  /**
   * Calculate individual stat performance metrics
   */
  private async calculateStatMetrics(
    singleStats: StressTestArchetype[],
    pairStats: StressTestArchetype[]
  ): Promise<MarginalUtilityMetrics[]> {
    const metrics: MarginalUtilityMetrics[] = [];
    
    for (const singleStat of singleStats) {
      const statId = singleStat.testedStats[0];
      
      // Find all matchups involving this stat
      const matchups = pairStats.filter(pair => 
        pair.testedStats.includes(statId)
      );
      
      if (matchups.length === 0) continue;
      
      // Calculate win rates
      const winRates: number[] = [];
      const turns: number[] = [];
      const hpRemaining: number[] = [];
      const damageDealt: number[] = [];
      
      for (const matchup of matchups) {
        const batch = await this.runSimulationBatch(matchup);
        const isStatA = matchup.testedStats[0] === statId;
        const winRate = isStatA ? batch.winRateA : 1 - batch.winRateA;
        
        winRates.push(winRate);
        turns.push(batch.avgTurns);
        hpRemaining.push(batch.avgHpRemaining);
        damageDealt.push(batch.avgDamageDealt);
      }
      
      // Calculate statistics
      const avgWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
      const stdDeviation = this.calculateStandardDeviation(winRates);
      
      // Find best and worst matchups
      const bestMatchupIndex = winRates.indexOf(Math.max(...winRates));
      const worstMatchupIndex = winRates.indexOf(Math.min(...winRates));
      
      const bestMatchup = {
        opponentStat: matchups[bestMatchupIndex].testedStats.find(s => s !== statId)!,
        winRate: winRates[bestMatchupIndex],
      };
      
      const worstMatchup = {
        opponentStat: matchups[worstMatchupIndex].testedStats.find(s => s !== statId)!,
        winRate: winRates[worstMatchupIndex],
      };
      
      // Calculate confidence interval (95%)
      const margin = 1.96 * (stdDeviation / Math.sqrt(winRates.length));
      const confidenceInterval = {
        lower: Math.max(0, avgWinRate - margin),
        upper: Math.min(1, avgWinRate + margin),
      };
      
      // Calculate ranking
      const allAvgWinRates = await Promise.all(
        singleStats.map(async (stat) => {
          const statMatchups = pairStats.filter(pair => 
            pair.testedStats.includes(stat.testedStats[0])
          );
          const statWinRates = await Promise.all(
            statMatchups.map(async (matchup) => {
              const batch = await this.runSimulationBatch(matchup);
              const isStatA = matchup.testedStats[0] === stat.testedStats[0];
              return isStatA ? batch.winRateA : 1 - batch.winRateA;
            })
          );
          return statWinRates.reduce((sum, rate) => sum + rate, 0) / statWinRates.length;
        })
      );
      
      const ranking = allAvgWinRates
        .map((rate, index) => ({ rate, index }))
        .sort((a, b) => b.rate - a.rate)
        .findIndex(item => item.index === singleStats.indexOf(singleStat))! + 1;
      
      metrics.push({
        statId,
        avgWinRate,
        stdDeviation,
        matchupCount: matchups.length,
        bestMatchup,
        worstMatchup,
        ranking,
        confidenceInterval,
      });
    }
    
    // Sort by ranking
    return metrics.sort((a, b) => a.ranking - b.ranking);
  }

  /**
   * Calculate synergy analyses for stat pairs
   */
  private async calculateSynergyAnalyses(
    pairStats: StressTestArchetype[],
    statMetrics: MarginalUtilityMetrics[]
  ): Promise<SynergyAnalysis[]> {
    const analyses: SynergyAnalysis[] = [];
    
    for (const pairStat of pairStats) {
      const [statA, statB] = pairStat.testedStats;
      
      // Get individual stat performance
      const metricA = statMetrics.find(m => m.statId === statA);
      const metricB = statMetrics.find(m => m.statId === statB);
      
      if (!metricA || !metricB) continue;
      
      // Run simulation batch
      const batch = await this.runSimulationBatch(pairStat);
      const observedWinRate = batch.winRateA;
      
      // Calculate expected win rate (average of individual performances)
      const expectedWinRate = (metricA.avgWinRate + metricB.avgWinRate) / 2;
      
      // Calculate synergy multiplier
      const synergyMultiplier = observedWinRate / expectedWinRate;
      
      // Determine synergy classification
      const isOpSynergy = synergyMultiplier > this.config.thresholds.opThreshold;
      const isWeakSynergy = synergyMultiplier < this.config.thresholds.weakThreshold;
      
      // Calculate statistical significance
      const pValue = this.calculatePValue(observedWinRate, expectedWinRate, batch.totalSimulations);
      const isSignificant = pValue < 0.05;
      
      // Calculate effect size
      const effectSize = Math.abs(synergyMultiplier - 1.0);
      
      analyses.push({
        pairId: pairStat.id,
        statIds: [statA, statB],
        observedWinRate,
        expectedWinRate,
        synergyMultiplier,
        isOpSynergy,
        isWeakSynergy,
        isSignificant,
        pValue,
        effectSize,
      });
    }
    
    return analyses;
  }

  /**
   * Run simulation batch for a single archetype pair
   */
  private async runSimulationBatch(pairArchetype: StressTestArchetype): Promise<SimulationBatch> {
    const startTime = Date.now();
    const results: SimulationResult[] = [];
    
    // Create telemetry context for this run
    const statPair = pairArchetype.testedStats.join('+');
    const runId = createStressTestRunId(pairArchetype.id, statPair, this.config.simulation.seed);
    
    try {
      // Use seeded RNG for deterministic results
      const rng = new TestRNG(this.config.simulation.seed);
      
      for (let i = 0; i < this.config.simulation.simulationCount; i++) {
        const result = await this.runSingleSimulation(pairArchetype, rng.next());
        results.push(result);
        
        // Report progress
        if (this.progressCallback && i % 1000 === 0) {
          this.progressCallback({
            totalPairs: 1,
            completedPairs: 0,
            currentPair: pairArchetype.id,
            estimatedTimeRemaining: 0,
            progressPercentage: (i / this.config.simulation.simulationCount) * 100,
          });
        }
      }
      
      // Calculate batch statistics
      const winsA = results.filter(r => r.winnerA).length;
      const winRateA = winsA / results.length;
      const turns = results.map(r => r.turns);
      const hpRemaining = results.filter(r => r.winnerA).map(r => r.hpRemaining);
      const damageDealt = results.filter(r => r.winnerA).map(r => r.damageDealt);
      
      const batch: SimulationBatch = {
        pairId: pairArchetype.id,
        statIds: pairArchetype.testedStats as [string, string],
        results,
        totalSimulations: results.length,
        winRateA,
        avgTurns: turns.reduce((sum, t) => sum + t, 0) / turns.length,
        avgHpRemaining: hpRemaining.length > 0 ? hpRemaining.reduce((sum, hp) => sum + hp, 0) / hpRemaining.length : 0,
        avgDamageDealt: damageDealt.length > 0 ? damageDealt.reduce((sum, dmg) => sum + dmg, 0) / damageDealt.length : 0,
        winRateStdDev: this.calculateStandardDeviation(results.map(r => r.winnerA ? 1 : 0)),
        runtimeMs: Date.now() - startTime,
      };
      
      // Emit telemetry for completed run
      const payload = createStressTestPayload(
        runId,
        pairArchetype.id,
        statPair,
        winRateA,
        1.0, // synergy multiplier (will be calculated later)
        results.length,
        this.config.simulation.seed,
        batch.runtimeMs,
        {
          pointsPerWeight: 25, // Default from archetype generator
          simulationCount: this.config.simulation.simulationCount,
          baselineStats: pairArchetype.stats,
        }
      );
      
      emitStressRunCompleted(payload);
      
      return batch;
    } catch (error) {
      // Emit telemetry for failed run
      emitStressRunFailed(
        createStressTestPayload(
          runId,
          pairArchetype.id,
          statPair,
          0,
          0,
          0,
          this.config.simulation.seed,
          Date.now() - startTime
        ),
        error instanceof Error ? error : new Error('Unknown error in simulation batch')
      );
      
      throw error;
    }
  }

  /**
   * Run a single simulation between two archetypes
   */
  private async runSingleSimulation(
    pairArchetype: StressTestArchetype,
    seed: number
  ): Promise<SimulationResult> {
    // This is a simplified simulation - in a real implementation,
    // this would call the actual combat simulator
    // For now, we'll use a simple deterministic calculation based on stats
    
    const [statA, statB] = pairArchetype.testedStats;
    const valueA = pairArchetype.stats[statA] || 0;
    const valueB = pairArchetype.stats[statB] || 0;
    
    // Simple deterministic outcome based on stat values and seed
    const randomFactor = (seed % 100) / 100;
    const outcomeA = (valueA + randomFactor * 10) > (valueB + randomFactor * 5);
    
    return {
      id: `${pairArchetype.id}-${seed}`,
      archetypeA: statA,
      archetypeB: statB,
      winnerA: outcomeA,
      turns: Math.max(5, Math.floor(10 + randomFactor * 10)),
      hpRemaining: Math.max(0, 100 - randomFactor * 20),
      damageDealt: Math.max(0, 50 + randomFactor * 30),
      seed,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate p-value for statistical significance
   */
  private calculatePValue(observed: number, expected: number, n: number): number {
    // Simplified p-value calculation
    // In a real implementation, this would use proper statistical tests
    const standardError = Math.sqrt((expected * (1 - expected)) / n);
    const zScore = Math.abs(observed - expected) / standardError;
    
    // Approximate p-value from z-score (two-tailed test)
    if (zScore < 0.5) return 1.0;
    if (zScore < 1.0) return 0.3173;
    if (zScore < 1.5) return 0.1336;
    if (zScore < 2.0) return 0.0455;
    if (zScore < 2.5) return 0.0124;
    if (zScore < 3.0) return 0.0027;
    
    return 0.001;
  }

  /**
   * Save analysis results to storage
   */
  private async saveAnalysisResults(analysis: MarginalUtilityAnalysis): Promise<void> {
    try {
      const exportPath = `${this.config.export.exportPath}/${analysis.id}.json`;
      await saveData(exportPath, analysis);
      
      if (this.config.enableLogging) {
        console.log(`[MarginalUtilityCalculator] Saved analysis to ${exportPath}`);
      }
    } catch (error) {
      console.error('[MarginalUtilityCalculator] Failed to save analysis:', error);
    }
  }

  /**
   * Export analysis results in specified format
   */
  async exportResults(
    analysis: MarginalUtilityAnalysis,
    format: ExportFormat = 'json'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    
    const exportData: ExportData = {
      format,
      exportedAt: timestamp,
      analysis,
      metadata: {
        version: '1.0.0',
        config: this.config,
        exportPath: this.config.export.exportPath,
      },
    };
    
    let filename: string;
    let content: string;
    
    switch (format) {
      case 'json':
        filename = `${analysis.id}-${timestamp}.json`;
        content = JSON.stringify(exportData, null, 2);
        break;
        
      case 'csv':
        filename = `${analysis.id}-${timestamp}.csv`;
        content = this.convertToCSV(analysis);
        break;
        
      case 'markdown':
        filename = `${analysis.id}-${timestamp}.md`;
        content = this.convertToMarkdown(analysis);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    const exportPath = `${this.config.export.exportPath}/${filename}`;
    await saveData(exportPath, content);
    
    if (this.config.enableLogging) {
      console.log(`[MarginalUtilityCalculator] Exported ${format} to ${exportPath}`);
    }
  }

  /**
   * Convert analysis to CSV format
   */
  private convertToCSV(analysis: MarginalUtilityAnalysis): string {
    const headers = [
      'Stat ID',
      'Avg Win Rate',
      'Std Deviation',
      'Ranking',
      'Best Matchup',
      'Best Win Rate',
      'Worst Matchup',
      'Worst Win Rate',
    ];
    
    const rows = analysis.statMetrics.map(metric => [
      metric.statId,
      metric.avgWinRate.toFixed(4),
      metric.stdDeviation.toFixed(4),
      metric.ranking.toString(),
      metric.bestMatchup.opponentStat,
      metric.bestMatchup.winRate.toFixed(4),
      metric.worstMatchup.opponentStat,
      metric.worstMatchup.winRate.toFixed(4),
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert analysis to Markdown format
   */
  private convertToMarkdown(analysis: MarginalUtilityAnalysis): string {
    const lines: string[] = [];
    
    lines.push(`# Marginal Utility Analysis`);
    lines.push(`**ID:** ${analysis.id}`);
    lines.push(`**Date:** ${new Date(analysis.timestamp).toISOString()}`);
    lines.push(`**Simulations:** ${analysis.summary.totalSimulations.toLocaleString()}`);
    lines.push(`**Runtime:** ${analysis.summary.totalRuntimeMs}ms`);
    lines.push('');
    
    // Summary
    lines.push('## Summary');
    lines.push(`- **OP Synergies:** ${analysis.summary.opSynergiesCount}`);
    lines.push(`- **Weak Synergies:** ${analysis.summary.weakSynergiesCount}`);
    lines.push(`- **Significant:** ${analysis.summary.significantSynergiesCount}`);
    lines.push(`- **Avg Simulations/Second:** ${analysis.summary.avgSimulationsPerSecond}`);
    lines.push('');
    
    // Stat Rankings
    lines.push('## Stat Rankings');
    lines.push('| Rank | Stat | Win Rate | Std Dev | Best vs | Worst vs |');
    lines.push('|------|------|----------|----------|---------|----------|');
    
    for (const metric of analysis.statMetrics) {
      lines.push(`| ${metric.ranking} | ${metric.statId} | ${metric.avgWinRate.toFixed(3)} | ${metric.stdDeviation.toFixed(3)} | ${metric.bestMatchup.opponentStat} (${metric.bestMatchup.winRate.toFixed(3)}) | ${metric.worstMatchup.opponentStat} (${metric.worstMatchup.winRate.toFixed(3)}) |`);
    }
    lines.push('');
    
    // Synergies
    lines.push('## Synergy Analyses');
    lines.push('| Pair | Observed | Expected | Multiplier | Type | Significant |');
    lines.push('|------|----------|----------|-----------|------|------------|');
    
    for (const synergy of analysis.synergyAnalyses) {
      const type = synergy.isOpSynergy ? 'OP' : synergy.isWeakSynergy ? 'Weak' : 'Normal';
      const significant = synergy.isSignificant ? 'Yes' : 'No';
      
      lines.push(`| ${synergy.statIds.join(' + ')} | ${synergy.observedWinRate.toFixed(3)} | ${synergy.expectedWinRate.toFixed(3)} | ${synergy.synergyMultiplier.toFixed(3)} | ${type} | ${significant} |`);
    }
    
    return lines.join('\n');
  }
}

/**
 * Convenience function to create and run marginal utility analysis
 */
export async function runMarginalUtilityAnalysis(
  archetypes: StressTestArchetype[],
  baseline: StressTestArchetype,
  config: Partial<MarginalUtilityConfig> = {}
): Promise<MarginalUtilityAnalysis> {
  const calculator = new MarginalUtilityCalculator(config);
  return calculator.runAnalysis(archetypes, baseline);
}
