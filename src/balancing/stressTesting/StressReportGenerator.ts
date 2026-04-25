/**
 * NP-097 – Balancer Stress Report Generator Schema
 * 
 * Schema definitions and types for Phase 10.5 stress testing and marginal utility
 * analysis with comprehensive reporting, heatmap generation, and KPI tracking.
 * 
 * @since 2026-01-21
 * @author Oracle-Balancer – Stress Reports
 */

import { z } from 'zod';

// === Core Stress Testing Types ===

/**
 * Stat pair combination for synergy analysis.
 */
export const StatPairSchema = z.object({
  /** First stat in the pair */
  stat1: z.string(),
  /** Second stat in the pair */
  stat2: z.string(),
  /** Combined weight for the pair */
  combinedWeight: z.number(),
  /** Individual stat weights */
  individualWeights: z.object({
    stat1: z.number(),
    stat2: z.number(),
  }),
  /** Synergy classification */
  synergyType: z.enum(['op', 'weak', 'neutral']),
  /** Synergy multiplier (pairScore / expectedScore) */
  synergyMultiplier: z.number(),
  /** Pair win rate vs baseline */
  pairScore: z.number(),
  /** Expected score (average of individual stat win rates) */
  expectedScore: z.number(),
  /** Sample size for the pair */
  sampleSize: z.number(),
  /** Confidence level (0-1) */
  confidence: z.number(),
  /** Standard deviation of results */
  standardDeviation: z.number(),
});

export type StatPair = z.infer<typeof StatPairSchema>;

/**
 * Single stat stress test result.
 */
export const SingleStatResultSchema = z.object({
  /** Stat name */
  stat: z.string(),
  /** Stat weight in current configuration */
  weight: z.number(),
  /** Win rate vs baseline */
  winRate: z.number(),
  /** Sample size */
  sampleSize: z.number(),
  /** Standard deviation */
  standardDeviation: z.number(),
  /** Performance classification */
  performance: z.enum(['excellent', 'good', 'average', 'poor', 'terrible']),
  /** Marginal utility score */
  marginalUtility: z.number(),
  /** Efficiency score (win rate per weight point) */
  efficiency: z.number(),
  /** Recommended weight adjustment */
  recommendedAdjustment: z.number(),
  /** Confidence in recommendation */
  recommendationConfidence: z.number(),
});

export type SingleStatResult = z.infer<typeof SingleStatResultSchema>;

/**
 * Complete stress test run results.
 */
export const StressTestRunSchema = z.object({
  /** Unique run identifier */
  runId: z.string(),
  /** Run timestamp */
  timestamp: z.number(),
  /** Configuration used */
  configuration: z.object({
    /** Baseline weights */
    baselineWeights: z.record(z.string(), z.number()),
    /** Test parameters */
    parameters: z.object({
      /** Points added per stat */
      pointsPerStat: z.number(),
      /** Total simulations per test */
      simulationsPerTest: z.number(),
      /** Random seed for reproducibility */
      seed: z.number(),
      /** Target win rate threshold */
      targetWinRate: z.number(),
      /** Synergy thresholds */
      synergyThresholds: z.object({
        op: z.number(),
        weak: z.number(),
      }),
    }),
  }),
  /** Single stat results */
  singleStatResults: SingleStatResultSchema.array(),
  /** Stat pair results */
  statPairResults: StatPairSchema.array(),
  /** Global statistics */
  globalStats: z.object({
    /** Total simulations run */
    totalSimulations: z.number(),
    /** Average win rate across all tests */
    averageWinRate: z.number(),
    /** Standard deviation of win rates */
    winRateStdDev: z.number(),
    /** Number of OP synergies found */
    opSynergies: z.number(),
    /** Number of weak synergies found */
    weakSynergies: z.number(),
    /** Number of neutral pairs */
    neutralPairs: z.number(),
    /** Overall system efficiency */
    systemEfficiency: z.number(),
  }),
  /** Performance metrics */
  performanceMetrics: z.object({
    /** Total execution time in milliseconds */
    executionTimeMs: z.number(),
    /** Average time per simulation */
    avgTimePerSimulation: z.number(),
    /** Memory usage in MB */
    memoryUsageMB: z.number(),
    /** CPU usage percentage */
    cpuUsagePercent: z.number(),
  }),
});

export type StressTestRun = z.infer<typeof StressTestRunSchema>;

// === Report Schema ===

/**
 * Complete stress report with analysis and recommendations.
 */
export const StressReportSchema = z.object({
  /** Report metadata */
  metadata: z.object({
    /** Report generation timestamp */
    generatedAt: z.number(),
    /** Report version */
    version: z.string(),
    /** Report source (manual/scheduled/triggered) */
    source: z.string(),
    /** Report format */
    format: z.string(),
    /** Number of stress runs analyzed */
    runsAnalyzed: z.number(),
  }),
  /** Executive summary */
  executiveSummary: z.object({
    /** Overall system health */
    systemHealth: z.enum(['excellent', 'good', 'needs_attention', 'critical']),
    /** Key findings summary */
    keyFindings: z.string().array(),
    /** Top recommendations */
    topRecommendations: z.string().array(),
    /** Risk assessment */
    riskAssessment: z.enum(['low', 'medium', 'high', 'critical']),
  }),
  /** KPI metrics */
  kpiMetrics: z.object({
    /** Number of OP synergies (> 1.15 multiplier) */
    opSynergyCount: z.number(),
    /** Number of weak synergies (< 0.95 multiplier) */
    weakSynergyCount: z.number(),
    /** Average synergy multiplier */
    avgSynergyMultiplier: z.number(),
    /** System efficiency score (0-100) */
    systemEfficiencyScore: z.number(),
    /** Balance score (0-100) */
    balanceScore: z.number(),
    /** Predictive accuracy (0-100) */
    predictiveAccuracy: z.number(),
    /** Performance score (0-100) */
    performanceScore: z.number(),
  }),
  /** Detailed analysis */
  detailedAnalysis: z.object({
    /** Single stat analysis */
    singleStatAnalysis: z.object({
      /** Best performing stats */
      topPerformers: SingleStatResultSchema.array(),
      /** Worst performing stats */
      underperformers: SingleStatResultSchema.array(),
      /** Stats with highest marginal utility */
      highestMarginalUtility: SingleStatResultSchema.array(),
      /** Stats needing adjustment */
      needsAdjustment: SingleStatResultSchema.array(),
    }),
    /** Pair synergy analysis */
    pairSynergyAnalysis: z.object({
      /** Most powerful synergies */
      powerfulSynergies: StatPairSchema.array(),
      /** Weak synergies to avoid */
      weakSynergies: StatPairSchema.array(),
      /** Unexpected neutral pairs */
      unexpectedNeutrals: StatPairSchema.array(),
      /** High confidence pairs */
      highConfidencePairs: StatPairSchema.array(),
    }),
    /** Balance recommendations */
    balanceRecommendations: z.object({
      /** Suggested weight adjustments */
      weightAdjustments: z.object({
        stat: z.string(),
        currentWeight: z.number(),
        recommendedWeight: z.number(),
        reason: z.string(),
        confidence: z.number(),
      }).array(),
      /** Synergy optimizations */
      synergyOptimizations: z.object({
        stat1: z.string(),
        stat2: z.string(),
        currentMultiplier: z.number(),
        potentialMultiplier: z.number(),
        recommendation: z.string(),
      }).array(),
    }),
  }),
  /** Heatmap data */
  heatmapData: z.object({
    /** Synergy heatmap matrix */
    synergyMatrix: z.array(z.array(z.number())),
    /** Performance heatmap matrix */
    performanceMatrix: z.array(z.array(z.number())),
    /** Stat labels for matrix axes */
    statLabels: z.string().array(),
    /** Color scale ranges */
    colorScales: z.object({
      synergy: z.object({
        min: z.number(),
        max: z.number(),
        neutral: z.number(),
      }),
      performance: z.object({
        min: z.number(),
        max: z.number(),
        average: z.number(),
      }),
    }),
  }),
  /** Historical comparison */
  historicalComparison: z.object({
    /** Previous run comparison */
    previousRunComparison: z.object({
      /** Date of previous run */
      previousRunDate: z.string(),
      /** Changes in KPI */
      kpiChanges: z.record(z.string(), z.number()),
      /** Significant changes */
      significantChanges: z.string().array(),
    }).optional(),
    /** Trend analysis */
    trendAnalysis: z.object({
      /** Overall trend direction */
      overallTrend: z.enum(['improving', 'stable', 'declining']),
      /** Trend confidence */
      trendConfidence: z.number(),
      /** Areas of improvement */
      improvementAreas: z.string().array(),
      /** Areas of concern */
      concernAreas: z.string().array(),
    }),
  }),
  /** Appendices */
  appendices: z.object({
    /** Raw stress test runs */
    rawStressRuns: StressTestRunSchema.array(),
    /** Configuration details */
    configurationDetails: z.object({
      /** Test parameters used */
      testParameters: z.any(),
      /** Weight configurations tested */
      weightConfigurations: z.any(),
    }),
    /** Statistical methodology */
    methodology: z.object({
      /** Statistical tests used */
      statisticalTests: z.string().array(),
      /** Confidence intervals */
      confidenceIntervals: z.record(z.string(), z.number()),
      /** Sample size justification */
      sampleSizeJustification: z.string(),
    }),
  }),
});

export type StressReport = z.infer<typeof StressReportSchema>;

// === Configuration Schema ===

/**
 * Stress report generator configuration.
 */
export const StressReportConfigSchema = z.object({
  /** Report generation settings */
  reportSettings: z.object({
    /** Report format (json/markdown/csv) */
    format: z.enum(['json', 'markdown', 'csv']).default('json'),
    /** Include raw data */
    includeRawData: z.boolean().default(false),
    /** Include appendices */
    includeAppendices: z.boolean().default(true),
    /** Include historical comparison */
    includeHistoricalComparison: z.boolean().default(true),
    /** Compression level for output */
    compressionLevel: z.number().min(0).max(9).default(0),
  }),
  /** Analysis settings */
  analysisSettings: z.object({
    /** Synergy thresholds */
    synergyThresholds: z.object({
      op: z.number().default(1.15),
      weak: z.number().default(0.95),
    }),
    /** Performance thresholds */
    performanceThresholds: z.object({
      excellent: z.number().default(0.8),
      good: z.number().default(0.6),
      average: z.number().default(0.4),
      poor: z.number().default(0.2),
    }),
    /** Confidence threshold */
    confidenceThreshold: z.number().min(0).max(1).default(0.8),
    /** Sample size minimum */
    minSampleSize: z.number().min(100).default(1000),
  }),
  /** Output settings */
  outputSettings: z.object({
    /** Output directory */
    outputDirectory: z.string().default('test-results'),
    /** File naming pattern */
    fileNamePattern: z.string().default('stress-report-{timestamp}'),
    /** Generate ASCII heatmap */
    generateASCIIHeatmap: z.boolean().default(true),
    /** Generate visual heatmap */
    generateVisualHeatmap: z.boolean().default(false),
    /** Include CSV exports */
    includeCSVExports: z.boolean().default(true),
  }),
  /** Telemetry settings */
  telemetrySettings: z.object({
    /** Enable telemetry */
    enableTelemetry: z.boolean().default(true),
    /** Telemetry event name */
    eventName: z.string().default('balancer_stress_report_generated'),
    /** Include performance metrics */
    includePerformanceMetrics: z.boolean().default(true),
    /** Include KPI metrics */
    includeKPIMetrics: z.boolean().default(true),
  }),
});

export type StressReportConfig = z.infer<typeof StressReportConfigSchema>;

// === Telemetry Schema ===

/**
 * Telemetry event for stress report generation.
 */
export const StressReportGeneratedTelemetrySchema = z.object({
  /** Event type */
  eventType: z.literal('balancer_stress_report_generated'),
  /** Event timestamp */
  timestamp: z.number(),
  /** Report metadata */
  reportMetadata: z.object({
    /** Report format */
    format: z.string(),
    /** Number of runs analyzed */
    runsAnalyzed: z.number(),
    /** Report generation duration in milliseconds */
    generationDurationMs: z.number(),
    /** Output file size in bytes */
    outputFileSizeBytes: z.number(),
    /** Configuration used */
    configuration: StressReportConfigSchema,
  }),
  /** KPI summary */
  kpiSummary: z.object({
    /** OP synergy count */
    opSynergyCount: z.number(),
    /** Weak synergy count */
    weakSynergyCount: z.number(),
    /** Average synergy multiplier */
    avgSynergyMultiplier: z.number(),
    /** System efficiency score */
    systemEfficiencyScore: z.number(),
    /** Balance score */
    balanceScore: z.number(),
    /** Predictive accuracy */
    predictiveAccuracy: z.number(),
  }),
  /** Performance metrics */
  performanceMetrics: z.object({
    /** Data processing time in milliseconds */
    dataProcessingTimeMs: z.number(),
    /** Analysis time in milliseconds */
    analysisTimeMs: z.number(),
    /** Report generation time in milliseconds */
    reportGenerationTimeMs: z.number(),
    /** Total memory usage in MB */
    totalMemoryUsageMB: z.number(),
    /** Peak CPU usage percentage */
    peakCPUUsagePercent: z.number(),
  }),
});

export type StressReportGeneratedTelemetry = z.infer<typeof StressReportGeneratedTelemetrySchema>;

// === Validation Functions ===

/**
 * Validates stress test run data.
 */
export function validateStressTestRun(data: unknown): StressTestRun {
  return StressTestRunSchema.parse(data);
}

/**
 * Validates complete stress report data.
 */
export function validateStressReport(data: unknown): StressReport {
  return StressReportSchema.parse(data);
}

/**
 * Validates stress report configuration.
 */
export function validateStressReportConfig(data: unknown): StressReportConfig {
  return StressReportConfigSchema.parse(data);
}

/**
 * Validates telemetry event data.
 */
export function validateStressReportGeneratedTelemetry(data: unknown): StressReportGeneratedTelemetry {
  return StressReportGeneratedTelemetrySchema.parse(data);
}

// === Utility Functions ===

/**
 * Creates a default stress report configuration.
 */
export function createDefaultStressReportConfig(): StressReportConfig {
  return {
    reportSettings: {
      format: 'json',
      includeRawData: false,
      includeAppendices: true,
      includeHistoricalComparison: true,
      compressionLevel: 0,
    },
    analysisSettings: {
      synergyThresholds: {
        op: 1.15,
        weak: 0.95,
      },
      performanceThresholds: {
        excellent: 0.8,
        good: 0.6,
        average: 0.4,
        poor: 0.2,
      },
      confidenceThreshold: 0.8,
      minSampleSize: 1000,
    },
    outputSettings: {
      outputDirectory: 'test-results',
      fileNamePattern: 'stress-report-{timestamp}',
      generateASCIIHeatmap: true,
      generateVisualHeatmap: false,
      includeCSVExports: true,
    },
    telemetrySettings: {
      enableTelemetry: true,
      eventName: 'balancer_stress_report_generated',
      includePerformanceMetrics: true,
      includeKPIMetrics: true,
    },
  };
}

/**
 * Creates a telemetry event for stress report generation.
 */
export function createStressReportGeneratedTelemetry(
  report: StressReport,
  generationDurationMs: number,
  fileSizeBytes: number,
  config: StressReportConfig,
  performanceMetrics?: Partial<StressReportGeneratedTelemetry['performanceMetrics']>
): StressReportGeneratedTelemetry {
  return {
    eventType: 'balancer_stress_report_generated',
    timestamp: Date.now(),
    reportMetadata: {
      format: report.metadata.format,
      runsAnalyzed: report.metadata.runsAnalyzed,
      generationDurationMs,
      outputFileSizeBytes: fileSizeBytes,
      configuration: config,
    },
    kpiSummary: {
      opSynergyCount: report.kpiMetrics.opSynergyCount,
      weakSynergyCount: report.kpiMetrics.weakSynergyCount,
      avgSynergyMultiplier: report.kpiMetrics.avgSynergyMultiplier,
      systemEfficiencyScore: report.kpiMetrics.systemEfficiencyScore,
      balanceScore: report.kpiMetrics.balanceScore,
      predictiveAccuracy: report.kpiMetrics.predictiveAccuracy,
    },
    performanceMetrics: {
      dataProcessingTimeMs: generationDurationMs * 0.3,
      analysisTimeMs: generationDurationMs * 0.4,
      reportGenerationTimeMs: generationDurationMs * 0.3,
      totalMemoryUsageMB: 50.5, // Placeholder
      peakCPUUsagePercent: 25.8, // Placeholder
      ...performanceMetrics,
    },
  };
}

/**
 * Calculates system efficiency score from stress test results.
 */
export function calculateSystemEfficiency(stressRun: StressTestRun): number {
  const { globalStats } = stressRun;
  
  // Factors: average win rate, low standard deviation, good synergy balance
  const winRateScore = Math.min(globalStats.averageWinRate * 100, 100);
  const consistencyScore = Math.max(0, 100 - (globalStats.winRateStdDev * 100));
  const synergyBalanceScore = Math.max(0, 100 - Math.abs(globalStats.opSynergies - globalStats.weakSynergies));
  
  return (winRateScore * 0.4 + consistencyScore * 0.3 + synergyBalanceScore * 0.3);
}

/**
 * Calculates balance score from stress test results.
 */
export function calculateBalanceScore(stressRun: StressTestRun): number {
  const { singleStatResults, statPairResults } = stressRun;
  
  // Calculate variance in single stat performance
  const winRates = singleStatResults.map(r => r.winRate);
  const meanWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
  const variance = winRates.reduce((sum, rate) => sum + Math.pow(rate - meanWinRate, 2), 0) / winRates.length;
  const balanceScore = Math.max(0, 100 - (Math.sqrt(variance) * 100));
  
  return balanceScore;
}

/**
 * Generates ASCII heatmap from matrix data.
 */
export function generateASCIIHeatmap(
  matrix: number[][],
  labels: string[],
  title: string,
  colorScale: { min: number; max: number; neutral: number }
): string {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  let ascii = `\n${title}\n`;
  ascii += '+'.repeat(cols * 4 + 1) + '\n';
  
  // Header row
  ascii += '|    ';
  for (let i = 0; i < Math.min(cols, labels.length); i++) {
    ascii += labels[i].padEnd(3) + '|';
  }
  ascii += '\n';
  ascii += '+'.repeat(cols * 4 + 1) + '\n';
  
  // Data rows
  for (let i = 0; i < Math.min(rows, labels.length); i++) {
    ascii += '|' + labels[i].padEnd(3) + '|';
    for (let j = 0; j < cols; j++) {
      const value = matrix[i][j];
      let symbol = ' ';
      
      if (value > colorScale.neutral) {
        symbol = value > colorScale.max ? '█' : value > (colorScale.neutral + colorScale.max) / 2 ? '▓' : '▒';
      } else if (value < colorScale.neutral) {
        symbol = value < colorScale.min ? '░' : value < (colorScale.min + colorScale.neutral) / 2 ? '▒' : '▓';
      }
      
      ascii += symbol + ' |';
    }
    ascii += '\n';
  }
  
  ascii += '+'.repeat(cols * 4 + 1) + '\n';
  
  // Legend
  ascii += '\nLegend:\n';
  ascii += '█ = High (> ' + colorScale.max.toFixed(2) + ')\n';
  ascii += '▓ = Above neutral\n';
  ascii += '▒ = Neutral (' + colorScale.neutral.toFixed(2) + ')\n';
  ascii += '░ = Below neutral\n';
  ascii += '  = Low (< ' + colorScale.min.toFixed(2) + ')\n';
  
  return ascii;
}
