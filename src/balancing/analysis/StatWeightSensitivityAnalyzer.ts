/**
 * Stat Weight Sensitivity Analyzer
 * 
 * Config-first analyzer for calculating sensitivity of balance outcomes
 * with respect to stat weight changes. Identifies critical weights and
 * provides recommendations for weight adjustments.
 * 
 * @since NP-144 – Config Balancer: Stat Weight Sensitivity Analyzer
 */

import { runMonteCarloSimulation } from '../monteCarlo/MonteCarloEngine';
import type { ScenarioConfig, ScenarioResult } from '../monteCarlo/ScenarioConfig';
import type { BalancerConfig } from '../config/types';
import type {
  SensitivityConfig,
  SensitivityResult,
  SensitivityMetric,
  PerturbationRange,
  AnalysisScope,
  SensitivityThreshold,
} from '../config/analysis/sensitivityConfig';
import {
  DEFAULT_SENSITIVITY_CONFIG,
  createSafeSensitivityConfig,
  generatePerturbations,
  calculateSensitivityScore,
  calculateImpactScore,
  identifyCriticalWeights,
  generateRecommendations,
  getSensitivityThreshold,
  SENSITIVITY_METRICS,
  PERTURBATION_RANGES,
} from '../config/analysis/sensitivityConfig';

/**
 * Sensitivity analysis options
 */
export interface SensitivityAnalysisOptions {
  /** Configuration for the analysis */
  config?: Partial<SensitivityConfig>;
  /** Override balancer config for analysis */
  balancerConfig?: BalancerConfig;
  /** Progress callback for long-running analyses */
  onProgress?: (progress: number, currentStat?: string) => void;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Sensitivity analysis result
 */
export interface SensitivityAnalysisResult {
  /** Overall analysis results */
  results: SensitivityResult[];
  /** Critical weights identified */
  criticalWeights: string[];
  /** Analysis statistics */
  statistics: {
    totalStats: number;
    totalPerturbations: number;
    averageSensitivity: number;
    highestSensitivity: number;
    lowestSensitivity: number;
    analysisTime: number;
  };
  /** Heatmap data for visualization */
  heatmap: Array<{
    statId: string;
    statName: string;
    sensitivity: number;
    threshold: SensitivityThreshold;
    color: string;
  }>;
  /** Recommendations */
  recommendations: string[];
  /** Analysis metadata */
  metadata: {
    config: SensitivityConfig;
    analysisDate: string;
    iterations: number;
    scope: AnalysisScope;
  };
}

/**
 * Stat Weight Sensitivity Analyzer
 */
export class StatWeightSensitivityAnalyzer {
  private config: SensitivityConfig;
  private balancerConfig: BalancerConfig;
  private abortController: AbortController | null = null;

  constructor(options: SensitivityAnalysisOptions = {}) {
    this.config = createSafeSensitivityConfig(options.config || {});
    this.balancerConfig = options.balancerConfig || this.getDefaultBalancerConfig();
  }

  /**
   * Run sensitivity analysis on stat weights
   */
  async analyze(options: SensitivityAnalysisOptions = {}): Promise<SensitivityAnalysisResult> {
    const config = options.config ? createSafeSensitivityConfig(options.config) : this.config;
    const balancerConfig = options.balancerConfig || this.balancerConfig;
    
    // Create abort controller for cancellation
    this.abortController = new AbortController();
    
    const startTime = Date.now();
    
    try {
      // Get stats to analyze based on scope
      const statsToAnalyze = this.getStatsToAnalyze(config.analysis.scope, balancerConfig);
      
      // Initialize results
      const results: SensitivityResult[] = [];
      const totalStats = statsToAnalyze.length;
      
      // Analyze each stat
      for (let i = 0; i < totalStats; i++) {
        const stat = statsToAnalyze[i];
        
        // Check for abort signal
        if (this.abortController.signal.aborted) {
          throw new Error('Analysis aborted');
        }
        
        // Report progress
        if (options.onProgress) {
          options.onProgress(i / totalStats, stat.id);
        }
        
        // Analyze single stat
        const statResult = await this.analyzeStat(
          stat.id,
          stat.weight,
          config,
          balancerConfig,
          this.abortController.signal
        );
        
        results.push(statResult);
      }
      
      // Calculate overall statistics
      const statistics = this.calculateStatistics(results);
      
      // Identify critical weights
      const criticalWeights = identifyCriticalWeights(results, config.thresholds);
      
      // Generate heatmap data
      const heatmap = this.generateHeatmapData(results, config.thresholds);
      
      // Generate recommendations
      const recommendations = this.generateOverallRecommendations(results, criticalWeights, config);
      
      const analysisTime = Date.now() - startTime;
      
      return {
        results,
        criticalWeights,
        statistics,
        heatmap,
        recommendations,
        metadata: {
          config,
          analysisDate: new Date().toISOString(),
          iterations: config.analysis.iterations,
          scope: config.analysis.scope,
        },
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Analyze sensitivity of a single stat
   */
  private async analyzeStat(
    statId: string,
    originalWeight: number,
    config: SensitivityConfig,
    balancerConfig: BalancerConfig,
    abortSignal: AbortSignal
  ): Promise<SensitivityResult> {
    const perturbations = this.getPerturbationsForAnalysis(config);
    const statPerturbations: SensitivityResult['perturbations'] = [];
    
    // Get stat definition
    const statDef = balancerConfig.stats.find(s => s.id === statId);
    const statName = statDef?.label || statId;
    
    // Run perturbation analysis
    for (const perturbation of perturbations) {
      // Check for abort signal
      if (abortSignal.aborted) {
        throw new Error('Analysis aborted');
      }
      
      // Calculate new weight
      const newWeight = originalWeight * (1 + perturbation);
      
      // Create perturbed balancer config
      const perturbedConfig = this.createPerturbedBalancerConfig(
        balancerConfig,
        statId,
        newWeight
      );
      
      // Run Monte Carlo simulation with perturbed weights
      const scenarioConfig = this.createScenarioConfig(config, perturbedConfig);
      const result = await runMonteCarloSimulation(
        scenarioConfig,
        perturbedConfig,
        false // verbose
      );
      
      // Calculate metrics from simulation result
      const metrics = this.calculateMetricsFromResult(result, config);
      
      // Calculate sensitivity and impact for each metric
      const metricSensitivities: Record<string, number> = {};
      const metricImpacts: Record<string, number> = {};
      
      for (const metric of config.metrics) {
        const originalMetric = this.getBaselineMetric(metric.id, balancerConfig);
        const perturbedMetric = metrics[metric.id] || 0;
        
        metricSensitivities[metric.id] = this.calculateMetricSensitivity(
          originalMetric,
          perturbedMetric,
          perturbation,
          metric
        );
        
        metricImpacts[metric.id] = calculateImpactScore(originalMetric, perturbedMetric, metric.higherIsBetter);
      }
      
      // Calculate overall sensitivity
      const overallSensitivity = this.calculateOverallSensitivity(metricSensitivities, config);
      
      // Calculate confidence based on simulation consistency
      const confidence = this.calculateConfidence(result, config);
      
      statPerturbations.push({
        perturbation,
        newWeight,
        metrics,
        sensitivity: overallSensitivity,
        impact: metricImpacts['balance-score'] || 0,
        confidence,
      });
    }
    
    // Calculate overall sensitivity score
    const overallSensitivity = calculateSensitivityScore(statPerturbations, 'balance-score');
    
    // Determine critical threshold
    const criticalThreshold = config.thresholds.critical;
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      statId,
      statName,
      originalWeight,
      perturbations: statPerturbations,
      overallSensitivity,
      criticalThreshold,
      recommendations: [],
      analysisDate: new Date().toISOString(),
      iterations: config.analysis.iterations,
    }, config.thresholds);
    
    return {
      statId,
      statName,
      originalWeight,
      perturbations: statPerturbations,
      overallSensitivity,
      criticalThreshold,
      recommendations,
      analysisDate: new Date().toISOString(),
      iterations: config.analysis.iterations,
    };
  }

  /**
   * Get perturbations for analysis based on configuration
   */
  private getPerturbationsForAnalysis(config: SensitivityConfig): number[] {
    const allPerturbations: number[] = [];
    
    // Generate perturbations for each range
    for (const range of PERTURBATION_RANGES) {
      const rangePerturbations = generatePerturbations(range);
      allPerturbations.push(...rangePerturbations);
    }
    
    // Limit to max perturbations
    return allPerturbations.slice(0, config.analysis.maxPerturbations);
  }

  /**
   * Create perturbed balancer configuration
   */
  private createPerturbedBalancerConfig(
    originalConfig: BalancerConfig,
    statId: string,
    newWeight: number
  ): BalancerConfig {
    const perturbedStats = originalConfig.stats.map(stat => 
      stat.id === statId ? { ...stat, weight: newWeight } : stat
    );
    
    return {
      ...originalConfig,
      stats: perturbedStats,
    };
  }

  /**
   * Create scenario configuration for Monte Carlo simulation
   */
  private createScenarioConfig(
    config: SensitivityConfig,
    balancerConfig: BalancerConfig
  ): ScenarioConfig {
    return {
      id: `sensitivity-analysis-${Date.now()}`,
      name: 'Sensitivity Analysis Scenario',
      description: 'Monte Carlo simulation for stat weight sensitivity analysis',
      type: config.monteCarlo.scenarioType,
      targetTurns: config.monteCarlo.targetTurns,
      simulationParams: {
        iterations: config.analysis.iterations,
        seed: config.analysis.seed,
        parallelRuns: config.analysis.parallelRuns,
      },
      statWeights: this.createStatWeightsMap(balancerConfig),
      selectedStats: balancerConfig.stats.map(s => s.id),
      scenarioBudget: {
        archetypeSlots: config.monteCarlo.archetypes,
        budgetPoints: config.monteCarlo.budgetPoints,
      },
    };
  }

  /**
   * Create stat weights map from balancer config
   */
  private createStatWeightsMap(balancerConfig: BalancerConfig): Record<string, number> {
    const weights: Record<string, number> = {};
    
    for (const stat of balancerConfig.stats) {
      weights[stat.id] = stat.weight;
    }
    
    return weights;
  }

  /**
   * Calculate metrics from Monte Carlo simulation result
   */
  private calculateMetricsFromResult(
    result: ScenarioResult,
    config: SensitivityConfig
  ): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Calculate metrics from simulation runs
    if (result.runs && result.runs.length > 0) {
      const wins = result.runs.filter(run => run.result === 'victory').length;
      const totalTurns = result.runs.reduce((sum, run) => sum + run.turns, 0);
      const totalDamage = result.runs.reduce((sum, run) => sum + run.damageDealt, 0);
      const totalDamageTaken = result.runs.reduce((sum, run) => sum + run.damageTaken, 0);
      const totalHpRemaining = result.runs.reduce((sum, run) => sum + run.hpRemaining, 0);
      
      // Calculate metrics
      metrics['win-rate'] = wins / result.runs.length;
      metrics['average-turns'] = totalTurns / result.runs.length;
      metrics['damage-output'] = totalDamage / result.runs.length;
      metrics['survivability'] = totalHpRemaining / result.runs.length;
      metrics['efficiency'] = (totalDamage - totalDamageTaken) / result.runs.length;
      
      // Calculate derived metrics
      metrics['balance-score'] = this.calculateBalanceScore(metrics, config);
      metrics['power-level'] = this.calculatePowerLevel(metrics, config);
      metrics['synergy-score'] = this.calculateSynergyScore(metrics, config);
    }
    
    return metrics;
  }

  /**
   * Calculate balance score from metrics
   */
  private calculateBalanceScore(
    metrics: Record<string, number>,
    config: SensitivityConfig
  ): number {
    let score = 0;
    let totalWeight = 0;
    
    for (const metric of config.metrics) {
      const value = metrics[metric.id] || 0;
      const normalizedValue = this.normalizeMetricValue(value, metric);
      const weightedValue = metric.higherIsBetter ? normalizedValue : (1 - normalizedValue);
      
      score += weightedValue * metric.weight;
      totalWeight += metric.weight;
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate power level from metrics
   */
  private calculatePowerLevel(
    metrics: Record<string, number>,
    config: SensitivityConfig
  ): number {
    const damage = metrics['damage-output'] || 0;
    const survivability = metrics['survivability'] || 0;
    
    // Simple power level calculation
    const powerScore = (damage * 0.6 + survivability * 0.4) / 100; // Normalize to 0-1 scale
    return Math.min(powerScore * 10, 10); // Scale to 1-10
  }

  /**
   * Calculate synergy score from metrics
   */
  private calculateSynergyScore(
    metrics: Record<string, number>,
    config: SensitivityConfig
  ): number {
    const winRate = metrics['win-rate'] || 0;
    const efficiency = metrics['efficiency'] || 0;
    
    // Simple synergy calculation
    return (winRate * 0.7 + efficiency * 0.3);
  }

  /**
   * Normalize metric value to 0-1 scale
   */
  private normalizeMetricValue(value: number, metric: SensitivityConfig['metrics'][0]): number {
    switch (metric.format) {
      case 'percentage':
        return Math.max(0, Math.min(1, value / 100));
      case 'score':
        return Math.max(0, Math.min(1, value / 10));
      case 'number':
      default:
        // For raw numbers, use a simple scaling
        return Math.max(0, Math.min(1, value / 100));
    }
  }

  /**
   * Calculate metric sensitivity for perturbation
   */
  private calculateMetricSensitivity(
    originalValue: number,
    perturbedValue: number,
    perturbation: number,
    metric: SensitivityConfig['metrics'][0]
  ): number {
    const change = perturbedValue - originalValue;
    const relativeChange = Math.abs(perturbation);
    
    // Sensitivity is proportional to change relative to perturbation
    return relativeChange > 0 ? Math.abs(change / perturbation) : 0;
  }

  /**
   * Calculate overall sensitivity from metric sensitivities
   */
  private calculateOverallSensitivity(
    metricSensitivities: Record<string, number>,
    config: SensitivityConfig
  ): number {
    let weightedSensitivity = 0;
    let totalWeight = 0;
    
    for (const metric of config.metrics) {
      const sensitivity = metricSensitivities[metric.id] || 0;
      weightedSensitivity += sensitivity * metric.weight;
      totalWeight += metric.weight;
    }
    
    return totalWeight > 0 ? weightedSensitivity / totalWeight : 0;
  }

  /**
   * Calculate confidence in simulation results
   */
  private calculateConfidence(result: ScenarioResult, config: SensitivityConfig): number {
    if (!result.runs || result.runs.length === 0) return 0;
    
    // Simple confidence based on result consistency
    const winRate = result.runs.filter(run => run.result === 'victory').length / result.runs.length;
    const variance = winRate * (1 - winRate) / result.runs.length;
    
    // Higher confidence with more iterations and lower variance
    const iterationFactor = Math.min(config.analysis.iterations / 1000, 1);
    const varianceFactor = Math.max(0, 1 - variance);
    
    return iterationFactor * varianceFactor;
  }

  /**
   * Get baseline metric value
   */
  private getBaselineMetric(metricId: SensitivityMetric, balancerConfig: BalancerConfig): number {
    // For now, return 0 as baseline - in a real implementation,
    // this would calculate the baseline metric with current weights
    return 0;
  }

  /**
   * Get stats to analyze based on scope
   */
  private getStatsToAnalyze(scope: AnalysisScope, balancerConfig: BalancerConfig) {
    switch (scope) {
      case 'single-stat':
        // Return first few stats for quick analysis
        return balancerConfig.stats.slice(0, 3);
      case 'pairwise':
        // Return stats for pairwise analysis
        return balancerConfig.stats.slice(0, 6);
      case 'full-system':
        // Return all stats for comprehensive analysis
        return balancerConfig.stats;
      case 'custom':
        // Return all stats (user can filter later)
        return balancerConfig.stats;
      default:
        return balancerConfig.stats;
    }
  }

  /**
   * Calculate analysis statistics
   */
  private calculateStatistics(results: SensitivityResult[]): SensitivityAnalysisResult['statistics'] {
    if (results.length === 0) {
      return {
        totalStats: 0,
        totalPerturbations: 0,
        averageSensitivity: 0,
        highestSensitivity: 0,
        lowestSensitivity: 0,
        analysisTime: 0,
      };
    }
    
    const totalPerturbations = results.reduce((sum, result) => sum + result.perturbations.length, 0);
    const sensitivities = results.map(r => r.overallSensitivity);
    
    return {
      totalStats: results.length,
      totalPerturbations,
      averageSensitivity: sensitivities.reduce((sum, s) => sum + s, 0) / sensitivities.length,
      highestSensitivity: Math.max(...sensitivities),
      lowestSensitivity: Math.min(...sensitivities),
      analysisTime: 0, // Will be set by caller
    };
  }

  /**
   * Generate heatmap data for visualization
   */
  private generateHeatmapData(
    results: SensitivityResult[],
    thresholds: SensitivityConfig['thresholds']
  ): SensitivityAnalysisResult['heatmap'] {
    return results.map(result => ({
      statId: result.statId,
      statName: result.statName,
      sensitivity: result.overallSensitivity,
      threshold: getSensitivityThreshold(result.overallSensitivity, thresholds),
      color: this.getHeatmapColor(result.overallSensitivity, thresholds),
    }));
  }

  /**
   * Get color for heatmap based on sensitivity
   */
  private getHeatmapColor(sensitivity: number, thresholds: SensitivityConfig['thresholds']): string {
    const threshold = getSensitivityThreshold(sensitivity, thresholds);
    
    const colorMap: Record<SensitivityThreshold, string> = {
      insensitive: '#10b981',
      low: '#84cc16',
      moderate: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    };
    
    return colorMap[threshold] || '#6b7280';
  }

  /**
   * Generate overall recommendations
   */
  private generateOverallRecommendations(
    results: SensitivityResult[],
    criticalWeights: string[],
    config: SensitivityConfig
  ): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on critical weights
    if (criticalWeights.length > 0) {
      recommendations.push(
        `Critical weights identified: ${criticalWeights.join(', ')}. These weights require careful consideration for any changes.`
      );
    }
    
    // Add recommendations based on overall sensitivity patterns
    const highSensitivityStats = results.filter(r => r.overallSensitivity >= config.thresholds.high);
    if (highSensitivityStats.length > 0) {
      recommendations.push(
        `${highSensitivityStats.length} stats show high sensitivity. Consider reviewing these weights before making changes.`
      );
    }
    
    // Add recommendations based on analysis scope
    if (config.analysis.scope === 'full-system') {
      recommendations.push(
        'Full system analysis completed. Review heatmap for detailed sensitivity patterns.'
      );
    }
    
    return recommendations;
  }

  /**
   * Get default balancer configuration
   */
  private getDefaultBalancerConfig(): BalancerConfig {
    // Return a basic default configuration
    return {
      stats: [
        { id: 'damage', label: 'Damage', weight: 1.0, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 10 },
        { id: 'health', label: 'Health', weight: 1.2, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 200, step: 5, defaultValue: 50 },
        { id: 'speed', label: 'Speed', weight: 0.8, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'defense', label: 'Defense', weight: 0.9, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 15 },
        { id: 'critChance', label: 'Crit Chance', weight: 0.5, isCore: false, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 5 },
        { id: 'critDamage', label: 'Crit Damage', weight: 2.0, isCore: false, isDerived: false, isPenalty: false, min: 0, max: 500, step: 10, defaultValue: 50 },
      ],
      cards: [],
      presets: [],
    };
  }

  /**
   * Cancel ongoing analysis
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SensitivityConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SensitivityConfig>): void {
    this.config = createSafeSensitivityConfig(config);
  }

  /**
   * Get current balancer configuration
   */
  getBalancerConfig(): BalancerConfig {
    return this.balancerConfig;
  }

  /**
   * Update balancer configuration
   */
  updateBalancerConfig(config: BalancerConfig): void {
    this.balancerConfig = config;
  }
}

/**
 * Convenience function to run sensitivity analysis
 */
export async function runSensitivityAnalysis(
  options: SensitivityAnalysisOptions = {}
): Promise<SensitivityAnalysisResult> {
  const analyzer = new StatWeightSensitivityAnalyzer(options);
  return await analyzer.analyze(options);
}

/**
 * Convenience function to analyze single stat sensitivity
 */
export async function analyzeStatSensitivity(
  statId: string,
  options: SensitivityAnalysisOptions = {}
): Promise<SensitivityResult> {
  const analyzer = new StatWeightSensitivityAnalyzer(options);
  const balancerConfig = options.balancerConfig || analyzer.getBalancerConfig();
  const stat = balancerConfig.stats.find(s => s.id === statId);
  
  if (!stat) {
    throw new Error(`Stat '${statId}' not found in balancer configuration`);
  }
  
  return await analyzer.analyzeStat(
    statId,
    stat.weight,
    options.config || analyzer.getConfig(),
    balancerConfig,
    options.abortSignal
  );
}
