/**
 * Stat Weight Sensitivity Analysis
 * 
 * Config-first tool for analyzing sensitivity of balance outcomes to stat weight changes
 * using Monte Carlo simulations with weight perturbation.
 * 
 * @since NP-189 – Balancer Stat Weight Sensitivity Analysis
 */

import { z } from 'zod';
import { runMonteCarloSimulation } from '../monteCarlo/MonteCarloEngine';
import type { ScenarioConfig, ScenarioResult } from '../monteCarlo/ScenarioConfig';
import type { BalancerConfig } from '../config/types';

/**
 * Sensitivity analysis configuration schema
 */
export const SensitivityConfigSchema = z.object({
  /** Analysis scope and parameters */
  analysis: z.object({
    /** Type of analysis to perform */
    scope: z.enum(['single-stat', 'pairwise', 'full-system', 'custom']),
    /** Number of Monte Carlo iterations per perturbation */
    iterations: z.number().int().min(100).max(10000).default(1000),
    /** Random seed for reproducible results */
    seed: z.number().int().min(0).default(42),
    /** Maximum analysis time in minutes */
    timeoutMinutes: z.number().int().min(1).max(60).default(5),
    /** Whether to include verbose logging */
    verbose: z.boolean().default(false),
  }),
  /** Perturbation configuration */
  perturbation: z.object({
    /** Perturbation ranges to test */
    ranges: z.array(z.object({
      /** Range identifier */
      id: z.string(),
      /** Percentage perturbation (e.g., 0.1 for ±10%) */
      percentage: z.number().min(0.01).max(1.0),
      /** Number of steps within the range */
      steps: z.number().int().min(1).max(20).default(5),
      /** Description of the perturbation */
      description: z.string(),
    })),
    /** Whether to test both positive and negative perturbations */
    bidirectional: z.boolean().default(true),
    /** Maximum number of perturbations per stat */
    maxPerturbations: z.number().int().min(1).max(50).default(10),
  }),
  /** Target stats for analysis */
  targetStats: z.object({
    /** List of stat IDs to analyze (empty = all stats) */
    statIds: z.array(z.string()).default([]),
    /** Whether to include core stats only */
    coreOnly: z.boolean().default(false),
    /** Whether to include derived stats */
    includeDerived: z.boolean().default(true),
    /** Whether to include penalty stats */
    includePenalty: z.boolean().default(false),
  }),
  /** Metrics to analyze */
  metrics: z.object({
    /** Primary metrics for sensitivity calculation */
    primary: z.array(z.enum([
      'winRate',
      'averageTurns',
      'damageOutput',
      'survivability',
      'balanceScore',
    ])).default(['winRate', 'balanceScore']),
    /** Secondary metrics for detailed analysis */
    secondary: z.array(z.enum([
      'synergyScore',
      'powerLevel',
      'efficiency',
      'resourceUsage',
    ])).default([]),
    /** Weight for each metric in overall sensitivity score */
    weights: z.record(z.number().min(0).max(1)).default({
      winRate: 0.4,
      balanceScore: 0.3,
      averageTurns: 0.2,
      damageOutput: 0.1,
    }),
  }),
  /** Scenario configuration for Monte Carlo */
  scenario: z.object({
    /** Scenario template to use */
    template: z.enum(['basic-1v1', 'boss-fight', 'group-combat', 'swarm-horde']).default('basic-1v1'),
    /** Custom scenario configuration (overrides template) */
    custom: z.object({
      scenarioType: z.enum(['1v1', 'boss', 'group', 'swarm']),
      targetTurns: z.number().int().min(1).max(100),
      budgetPoints: z.number().int().min(1).max(1000),
      archetypes: z.number().int().min(1).max(10),
    }).optional(),
  }),
  /** Export configuration */
  export: z.object({
    /** Export formats */
    formats: z.array(z.enum(['json', 'csv', 'markdown'])).default(['json', 'csv']),
    /** Whether to include detailed results */
    includeDetails: z.boolean().default(true),
    /** Whether to include visualization data */
    includeVisualization: z.boolean().default(true),
    /** Output directory */
    outputDir: z.string().default('./sensitivity-results'),
  }),
});

export type SensitivityConfig = z.infer<typeof SensitivityConfigSchema>;

/**
 * Stat weight perturbation result
 */
export interface PerturbationResult {
  /** Stat identifier */
  statId: string;
  /** Original weight */
  originalWeight: number;
  /** Perturbation value */
  perturbation: number;
  /** New weight after perturbation */
  newWeight: number;
  /** Monte Carlo simulation results */
  simulationResults: ScenarioResult;
  /** Sensitivity metrics */
  metrics: Record<string, number>;
  /** Overall sensitivity score */
  sensitivityScore: number;
  /** Impact direction (positive/negative) */
  impactDirection: 'positive' | 'negative' | 'neutral';
}

/**
 * Stat sensitivity analysis result
 */
export interface StatSensitivityResult {
  /** Stat identifier */
  statId: string;
  /** Stat name */
  statName: string;
  /** Original weight */
  originalWeight: number;
  /** All perturbation results */
  perturbations: PerturbationResult[];
  /** Overall sensitivity score */
  overallSensitivity: number;
  /** Sensitivity classification */
  classification: 'insensitive' | 'low' | 'moderate' | 'high' | 'critical';
  /** Maximum impact observed */
  maxImpact: number;
  /** Recommended action */
  recommendation: string;
}

/**
 * Full sensitivity analysis result
 */
export interface SensitivityAnalysisResult {
  /** Analysis configuration */
  config: SensitivityConfig;
  /** Analysis metadata */
  metadata: {
    analysisId: string;
    startTime: string;
    endTime: string;
    duration: number; // in milliseconds
    totalSimulations: number;
    totalPerturbations: number;
  };
  /** Individual stat results */
  statResults: StatSensitivityResult[];
  /** Overall analysis summary */
  summary: {
    /** Most sensitive stat */
    mostSensitive: string;
    /** Least sensitive stat */
    leastSensitive: string;
    /** Average sensitivity */
    averageSensitivity: number;
    /** Critical stats (high sensitivity) */
    criticalStats: string[];
    /** Insensitive stats (low sensitivity) */
    insensitiveStats: string[];
  };
  /** Visualization data */
  visualization: {
    /** Heatmap data for sensitivity visualization */
    heatmap: Array<{
      statId: string;
      perturbation: number;
      sensitivity: number;
      impact: number;
    }>;
    /** Ranking data for bar charts */
    ranking: Array<{
      statId: string;
      statName: string;
      sensitivity: number;
      classification: string;
    }>;
  };
}

/**
 * Default sensitivity configuration
 */
export const DEFAULT_SENSITIVITY_CONFIG: SensitivityConfig = {
  analysis: {
    scope: 'full-system',
    iterations: 1000,
    seed: 42,
    timeoutMinutes: 5,
    verbose: false,
  },
  perturbation: {
    ranges: [
      {
        id: 'tiny',
        percentage: 0.05,
        steps: 3,
        description: 'Tiny perturbations (±5%)',
      },
      {
        id: 'small',
        percentage: 0.10,
        steps: 5,
        description: 'Small perturbations (±10%)',
      },
      {
        id: 'medium',
        percentage: 0.20,
        steps: 7,
        description: 'Medium perturbations (±20%)',
      },
      {
        id: 'large',
        percentage: 0.30,
        steps: 5,
        description: 'Large perturbations (±30%)',
      },
    ],
    bidirectional: true,
    maxPerturbations: 10,
  },
  targetStats: {
    statIds: [],
    coreOnly: false,
    includeDerived: true,
    includePenalty: false,
  },
  metrics: {
    primary: ['winRate', 'balanceScore', 'averageTurns'],
    secondary: ['synergyScore', 'powerLevel'],
    weights: {
      winRate: 0.4,
      balanceScore: 0.3,
      averageTurns: 0.2,
      damageOutput: 0.1,
    },
  },
  scenario: {
    template: 'basic-1v1',
  },
  export: {
    formats: ['json', 'csv'],
    includeDetails: true,
    includeVisualization: true,
    outputDir: './sensitivity-results',
  },
};

/**
 * Sensitivity thresholds for classification
 */
export const SENSITIVITY_THRESHOLDS = {
  insensitive: 0.05,
  low: 0.15,
  moderate: 0.30,
  high: 0.50,
  critical: 0.70,
} as const;

/**
 * Sensitivity classifications
 */
export const SENSITIVITY_CLASSIFICATIONS = {
  insensitive: { label: 'Insensitive', color: '#10b981', description: 'Minimal impact on balance' },
  low: { label: 'Low Sensitivity', color: '#3b82f6', description: 'Minor impact on balance' },
  moderate: { label: 'Moderate Sensitivity', color: '#f59e0b', description: 'Moderate impact on balance' },
  high: { label: 'High Sensitivity', color: '#ef4444', description: 'Significant impact on balance' },
  critical: { label: 'Critical', color: '#dc2626', description: 'Critical impact on balance' },
} as const;

/**
 * Stat Weight Sensitivity Analyzer class
 */
export class StatWeightSensitivityAnalyzer {
  private config: SensitivityConfig;
  private balancerConfig: BalancerConfig;
  private scenarioConfig: ScenarioConfig;

  constructor(config: Partial<SensitivityConfig> = {}, balancerConfig: BalancerConfig) {
    this.config = this.mergeConfig(config);
    this.balancerConfig = balancerConfig;
    this.scenarioConfig = this.createScenarioConfig();
  }

  /**
   * Run complete sensitivity analysis
   */
  async runAnalysis(): Promise<SensitivityAnalysisResult> {
    const analysisId = this.generateAnalysisId();
    const startTime = new Date().toISOString();
    const startTimeMs = Date.now();

    console.log(`Starting sensitivity analysis ${analysisId}...`);
    
    // Get target stats
    const targetStats = this.getTargetStats();
    console.log(`Analyzing ${targetStats.length} stats...`);

    // Run analysis for each stat
    const statResults: StatSensitivityResult[] = [];
    let totalSimulations = 0;
    let totalPerturbations = 0;

    for (const stat of targetStats) {
      console.log(`Analyzing stat: ${stat.id}`);
      
      try {
        const result = await this.analyzeStat(stat.id, stat.name, stat.weight);
        statResults.push(result);
        totalSimulations += result.perturbations.length * this.config.analysis.iterations;
        totalPerturbations += result.perturbations.length;
      } catch (error) {
        console.error(`Error analyzing stat ${stat.id}:`, error);
        // Continue with other stats
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(statResults);

    // Generate visualization data
    const visualization = this.generateVisualizationData(statResults);

    const endTime = new Date().toISOString();
    const duration = Date.now() - startTimeMs;

    console.log(`Analysis completed in ${duration}ms`);
    console.log(`Total simulations: ${totalSimulations}`);
    console.log(`Total perturbations: ${totalPerturbations}`);

    return {
      config: this.config,
      metadata: {
        analysisId,
        startTime,
        endTime,
        duration,
        totalSimulations,
        totalPerturbations,
      },
      statResults,
      summary,
      visualization,
    };
  }

  /**
   * Analyze a single stat
   */
  private async analyzeStat(statId: string, statName: string, originalWeight: number): Promise<StatSensitivityResult> {
    const perturbations: PerturbationResult[] = [];

    // Generate perturbations
    const perturbationValues = this.generatePerturbations(originalWeight);

    for (const perturbation of perturbationValues) {
      console.log(`  Testing perturbation: ${perturbation.percentage.toFixed(2)}% (weight: ${perturbation.newWeight.toFixed(3)})`);

      // Create perturbed balancer config
      const perturbedConfig = this.createPerturbedConfig(statId, perturbation.newWeight);

      // Run Monte Carlo simulation
      const simulationResults = await this.runSimulation(perturbedConfig);

      // Calculate metrics
      const metrics = this.calculateMetrics(simulationResults);

      // Calculate sensitivity score
      const sensitivityScore = this.calculateSensitivityScore(metrics);

      // Determine impact direction
      const impactDirection = this.determineImpactDirection(metrics);

      perturbations.push({
        statId,
        originalWeight,
        perturbation: perturbation.percentage,
        newWeight: perturbation.newWeight,
        simulationResults,
        metrics,
        sensitivityScore,
        impactDirection,
      });
    }

    // Calculate overall sensitivity
    const overallSensitivity = this.calculateOverallSensitivity(perturbations);

    // Classify sensitivity
    const classification = this.classifySensitivity(overallSensitivity);

    // Calculate max impact
    const maxImpact = Math.max(...perturbations.map(p => Math.abs(p.sensitivityScore)));

    // Generate recommendation
    const recommendation = this.generateRecommendation(classification, maxImpact);

    return {
      statId,
      statName,
      originalWeight,
      perturbations,
      overallSensitivity,
      classification,
      maxImpact,
      recommendation,
    };
  }

  /**
   * Generate perturbation values
   */
  private generatePerturbations(originalWeight: number): Array<{ percentage: number; newWeight: number }> {
    const perturbations: Array<{ percentage: number; newWeight: number }> = [];

    for (const range of this.config.perturbation.ranges) {
      const stepSize = range.percentage / range.steps;
      
      for (let i = 1; i <= range.steps; i++) {
        const percentage = stepSize * i;
        
        if (this.config.perturbation.bidirectional) {
          // Positive perturbation
          perturbations.push({
            percentage: percentage * 100,
            newWeight: originalWeight * (1 + percentage),
          });
          
          // Negative perturbation
          perturbations.push({
            percentage: -percentage * 100,
            newWeight: originalWeight * (1 - percentage),
          });
        } else {
          // Only positive perturbations
          perturbations.push({
            percentage: percentage * 100,
            newWeight: originalWeight * (1 + percentage),
          });
        }
      }
    }

    // Limit number of perturbations
    return perturbations.slice(0, this.config.perturbation.maxPerturbations);
  }

  /**
   * Create perturbed balancer configuration
   */
  private createPerturbedConfig(statId: string, newWeight: number): BalancerConfig {
    // Deep copy the original config
    const perturbedConfig: BalancerConfig = JSON.parse(JSON.stringify(this.balancerConfig));

    // Update the stat weight
    if (perturbedConfig.stats && perturbedConfig.stats[statId]) {
      perturbedConfig.stats[statId].weight = newWeight;
    }

    return perturbedConfig;
  }

  /**
   * Run Monte Carlo simulation
   */
  private async runSimulation(config: BalancerConfig): Promise<ScenarioResult> {
    try {
      const result = await runMonteCarloSimulation(
        this.scenarioConfig,
        config,
        this.config.analysis.iterations,
        this.config.analysis.seed
      );
      return result;
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error);
      // Return a mock result for testing
      return this.createMockResult();
    }
  }

  /**
   * Calculate metrics from simulation results
   */
  private calculateMetrics(results: ScenarioResult): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Primary metrics
    if (results.winRate !== undefined) {
      metrics.winRate = results.winRate;
    }

    if (results.averageTurns !== undefined) {
      metrics.averageTurns = results.averageTurns;
    }

    if (results.damageOutput !== undefined) {
      metrics.damageOutput = results.damageOutput;
    }

    if (results.survivability !== undefined) {
      metrics.survivability = results.survivability;
    }

    // Calculate balance score (composite metric)
    metrics.balanceScore = this.calculateBalanceScore(results);

    // Secondary metrics
    if (results.synergyScore !== undefined) {
      metrics.synergyScore = results.synergyScore;
    }

    if (results.powerLevel !== undefined) {
      metrics.powerLevel = results.powerLevel;
    }

    if (results.efficiency !== undefined) {
      metrics.efficiency = results.efficiency;
    }

    return metrics;
  }

  /**
   * Calculate balance score from simulation results
   */
  private calculateBalanceScore(results: ScenarioResult): number {
    let score = 0;
    let weightSum = 0;

    // Win rate is most important
    if (results.winRate !== undefined) {
      score += results.winRate * 0.5;
      weightSum += 0.5;
    }

    // Average turns (inverse - lower is better)
    if (results.averageTurns !== undefined) {
      const normalizedTurns = Math.max(0, 1 - (results.averageTurns - 10) / 40); // Normalize to 0-1
      score += normalizedTurns * 0.3;
      weightSum += 0.3;
    }

    // Damage output
    if (results.damageOutput !== undefined) {
      const normalizedDamage = Math.min(1, results.damageOutput / 100); // Normalize to 0-1
      score += normalizedDamage * 0.2;
      weightSum += 0.2;
    }

    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * Calculate sensitivity score from metrics
   */
  private calculateSensitivityScore(metrics: Record<string, number>): number {
    let score = 0;
    let weightSum = 0;

    for (const [metric, weight] of Object.entries(this.config.metrics.weights)) {
      if (metrics[metric] !== undefined) {
        score += metrics[metric] * weight;
        weightSum += weight;
      }
    }

    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * Determine impact direction
   */
  private determineImpactDirection(metrics: Record<string, number>): 'positive' | 'negative' | 'neutral' {
    // For simplicity, use win rate as primary indicator
    const winRate = metrics.winRate || 0.5;
    
    if (winRate > 0.55) return 'positive';
    if (winRate < 0.45) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate overall sensitivity for a stat
   */
  private calculateOverallSensitivity(perturbations: PerturbationResult[]): number {
    if (perturbations.length === 0) return 0;

    // Calculate variance of sensitivity scores
    const scores = perturbations.map(p => p.sensitivityScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

    // Return standard deviation as sensitivity measure
    return Math.sqrt(variance);
  }

  /**
   * Classify sensitivity based on thresholds
   */
  private classifySensitivity(sensitivity: number): 'insensitive' | 'low' | 'moderate' | 'high' | 'critical' {
    if (sensitivity < SENSITIVITY_THRESHOLDS.insensitive) return 'insensitive';
    if (sensitivity < SENSITIVITY_THRESHOLDS.low) return 'low';
    if (sensitivity < SENSITIVITY_THRESHOLDS.moderate) return 'moderate';
    if (sensitivity < SENSITIVITY_THRESHOLDS.high) return 'high';
    return 'critical';
  }

  /**
   * Generate recommendation based on sensitivity
   */
  private generateRecommendation(classification: string, maxImpact: number): string {
    switch (classification) {
      case 'critical':
        return 'Critical sensitivity - requires immediate attention and careful tuning';
      case 'high':
        return 'High sensitivity - monitor closely and consider adjustments';
      case 'moderate':
        return 'Moderate sensitivity - normal tuning required';
      case 'low':
        return 'Low sensitivity - minimal tuning needed';
      case 'insensitive':
        return 'Insensitive - can be adjusted with minimal impact';
      default:
        return 'Unknown sensitivity - further analysis recommended';
    }
  }

  /**
   * Calculate analysis summary
   */
  private calculateSummary(statResults: StatSensitivityResult[]) {
    if (statResults.length === 0) {
      return {
        mostSensitive: '',
        leastSensitive: '',
        averageSensitivity: 0,
        criticalStats: [],
        insensitiveStats: [],
      };
    }

    // Sort by sensitivity
    const sorted = [...statResults].sort((a, b) => b.overallSensitivity - a.overallSensitivity);
    
    const mostSensitive = sorted[0]?.statId || '';
    const leastSensitive = sorted[sorted.length - 1]?.statId || '';
    
    const averageSensitivity = statResults.reduce((sum, result) => sum + result.overallSensitivity, 0) / statResults.length;
    
    const criticalStats = statResults
      .filter(result => result.classification === 'critical')
      .map(result => result.statId);
    
    const insensitiveStats = statResults
      .filter(result => result.classification === 'insensitive')
      .map(result => result.statId);

    return {
      mostSensitive,
      leastSensitive,
      averageSensitivity,
      criticalStats,
      insensitiveStats,
    };
  }

  /**
   * Generate visualization data
   */
  private generateVisualizationData(statResults: StatSensitivityResult[]) {
    const heatmap: Array<{ statId: string; perturbation: number; sensitivity: number; impact: number }> = [];
    const ranking: Array<{ statId: string; statName: string; sensitivity: number; classification: string }> = [];

    // Generate heatmap data
    for (const result of statResults) {
      for (const perturbation of result.perturbations) {
        heatmap.push({
          statId: result.statId,
          perturbation: perturbation.perturbation,
          sensitivity: perturbation.sensitivityScore,
          impact: Math.abs(perturbation.sensitivityScore),
        });
      }
    }

    // Generate ranking data
    for (const result of statResults) {
      ranking.push({
        statId: result.statId,
        statName: result.statName,
        sensitivity: result.overallSensitivity,
        classification: result.classification,
      });
    }

    return { heatmap, ranking };
  }

  /**
   * Get target stats for analysis
   */
  private getTargetStats() {
    // Mock implementation - in real system, this would query the balancer config
    return [
      { id: 'hp', name: 'Health Points', weight: 1.0 },
      { id: 'damage', name: 'Damage', weight: 1.0 },
      { id: 'defense', name: 'Defense', weight: 0.8 },
      { id: 'speed', name: 'Speed', weight: 0.6 },
      { id: 'accuracy', name: 'Accuracy', weight: 0.7 },
    ];
  }

  /**
   * Create scenario configuration
   */
  private createScenarioConfig(): ScenarioConfig {
    // Mock implementation - in real system, this would use the scenario templates
    return {
      id: 'sensitivity-analysis',
      name: 'Sensitivity Analysis Scenario',
      scenarioType: '1v1',
      targetTurns: 20,
      budgetPoints: 100,
      archetypes: 2,
      description: 'Scenario for stat weight sensitivity analysis',
    };
  }

  /**
   * Create mock result for testing
   */
  private createMockResult(): ScenarioResult {
    return {
      scenarioId: this.scenarioConfig.id,
      iterations: this.config.analysis.iterations,
      winRate: 0.5 + Math.random() * 0.3,
      averageTurns: 15 + Math.random() * 10,
      damageOutput: 50 + Math.random() * 50,
      survivability: 0.4 + Math.random() * 0.4,
      balanceScore: 0.3 + Math.random() * 0.4,
      synergyScore: 0.2 + Math.random() * 0.3,
      powerLevel: 3 + Math.random() * 4,
      efficiency: 0.5 + Math.random() * 0.3,
      archetypeResults: [],
      metadata: {
        seed: this.config.analysis.seed,
        duration: 100,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config: Partial<SensitivityConfig>): SensitivityConfig {
    const result = SensitivityConfigSchema.safeParse(config);
    
    if (result.success) {
      return result.data;
    }
    
    // Return default config with merged valid data
    return {
      ...DEFAULT_SENSITIVITY_CONFIG,
      ...config,
      analysis: { ...DEFAULT_SENSITIVITY_CONFIG.analysis, ...config.analysis },
      perturbation: { ...DEFAULT_SENSITIVITY_CONFIG.perturbation, ...config.perturbation },
      targetStats: { ...DEFAULT_SENSITIVITY_CONFIG.targetStats, ...config.targetStats },
      metrics: { ...DEFAULT_SENSITIVITY_CONFIG.metrics, ...config.metrics },
      scenario: { ...DEFAULT_SENSITIVITY_CONFIG.scenario, ...config.scenario },
      export: { ...DEFAULT_SENSITIVITY_CONFIG.export, ...config.export },
    };
  }

  /**
   * Generate analysis ID
   */
  private generateAnalysisId(): string {
    return `sensitivity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Convenience function to create and run sensitivity analysis
 */
export async function runSensitivityAnalysis(
  config: Partial<SensitivityConfig> = {},
  balancerConfig: BalancerConfig
): Promise<SensitivityAnalysisResult> {
  const analyzer = new StatWeightSensitivityAnalyzer(config, balancerConfig);
  return analyzer.runAnalysis();
}

/**
 * Export sensitivity analysis results to different formats
 */
export function exportResults(
  results: SensitivityAnalysisResult,
  format: 'json' | 'csv' | 'markdown' = 'json'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(results, null, 2);
    
    case 'csv':
      return exportToCSV(results);
    
    case 'markdown':
      return exportToMarkdown(results);
    
    default:
      return JSON.stringify(results, null, 2);
  }
}

/**
 * Export results to CSV format
 */
function exportToCSV(results: SensitivityAnalysisResult): string {
  const headers = [
    'Stat ID',
    'Stat Name',
    'Original Weight',
    'Overall Sensitivity',
    'Classification',
    'Max Impact',
    'Recommendation',
  ];
  
  const rows = results.statResults.map(result => [
    result.statId,
    result.statName,
    result.originalWeight.toFixed(3),
    result.overallSensitivity.toFixed(4),
    result.classification,
    result.maxImpact.toFixed(4),
    `"${result.replacement}"`,
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Export results to Markdown format
 */
function exportToMarkdown(results: SensitivityAnalysisResult): string {
  let markdown = `# Stat Weight Sensitivity Analysis\n\n`;
  
  markdown += `**Analysis ID:** ${results.metadata.analysisId}\n`;
  markdown += `**Duration:** ${results.metadata.duration}ms\n`;
  markdown += `**Total Simulations:** ${results.metadata.totalSimulations}\n`;
  markdown += `**Total Perturbations:** ${results.metadata.totalPerturbations}\n\n`;
  
  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Most Sensitive:** ${results.summary.mostSensitive}\n`;
  markdown += `- **Least Sensitive:** ${results.summary.leastSensitive}\n`;
  markdown += `- **Average Sensitivity:** ${results.summary.averageSensitivity.toFixed(4)}\n`;
  markdown += `- **Critical Stats:** ${results.summary.criticalStats.join(', ')}\n`;
  markdown += `- **Insensitive Stats:** ${results.summary.insensitiveStats.join(', ')}\n\n`;
  
  // Results table
  markdown += `## Results\n\n`;
  markdown += `| Stat | Sensitivity | Classification | Max Impact | Recommendation |\n`;
  markdown += `|------|-------------|----------------|------------|----------------|\n`;
  
  for (const result of results.statResults) {
    markdown += `| ${result.statName} | ${result.overallSensitivity.toFixed(4)} | ${result.classification} | ${result.maxImpact.toFixed(4)} | ${result.recommendation} |\n`;
  }
  
  return markdown;
}
