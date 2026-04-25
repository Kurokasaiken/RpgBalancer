/**
 * Data Quality Rules for Stress Testing Results
 * 
 * Config-first validation rules for detecting anomalies in MU (Marginal Utility) output
 * including NaN, ±inf, synergyMultiplier ranges, and other quality metrics.
 */

import { z } from 'zod';
import type { 
  MarginalUtilityAnalysis, 
  SynergyAnalysis, 
  MarginalUtilityMetrics,
  ExportData 
} from './MarginalUtilityTypes';

/**
 * Configuration schema for data quality validation rules
 */
export const DataQualityRulesSchema = z.object({
  /** Thresholds for synergy multiplier validation */
  synergyThresholds: z.object({
    /** Minimum allowed synergy multiplier */
    minMultiplier: z.number().min(0).max(10).default(0.1),
    /** Maximum allowed synergy multiplier */
    maxMultiplier: z.number().min(1).max(100).default(10.0),
    /** Threshold for flagging extreme multipliers */
    extremeThreshold: z.number().min(2).max(50).default(5.0),
  }),
  /** Validation rules for numerical values */
  numericalRules: z.object({
    /** Allow NaN values (usually should be false) */
    allowNaN: z.boolean().default(false),
    /** Allow infinite values */
    allowInfinity: z.boolean().default(false),
    /** Minimum value for win rates */
    minWinRate: z.number().min(0).max(1).default(0.0),
    /** Maximum value for win rates */
    maxWinRate: z.number().min(0).max(1).default(1.0),
    /** Minimum value for percentages */
    minPercentage: z.number().min(0).max(100).default(0.0),
    /** Maximum value for percentages */
    maxPercentage: z.number().min(0).max(100).default(100.0),
  }),
  /** Statistical validation rules */
  statisticalRules: z.object({
    /** Minimum required matchup count for reliable statistics */
    minMatchupCount: z.number().min(1).max(1000).default(5),
    /** Maximum allowed standard deviation for win rates */
    maxStdDeviation: z.number().min(0).max(2).default(1.0),
    /** Minimum confidence interval coverage */
    minConfidenceCoverage: z.number().min(0.5).max(1).default(0.8),
  }),
  /** Performance and completeness rules */
  completenessRules: z.object({
    /** Minimum required number of stats */
    minStatCount: z.number().min(1).max(100).default(3),
    /** Minimum required number of synergy pairs */
    minSynergyCount: z.number().min(1).max(1000).default(1),
    /** Maximum allowed runtime in milliseconds */
    maxRuntimeMs: z.number().min(1000).max(3600000).default(300000), // 5 minutes
  }),
});

export type DataQualityRules = z.infer<typeof DataQualityRulesSchema>;

/**
 * Default quality rules configuration
 */
export const DEFAULT_DATA_QUALITY_RULES: DataQualityRules = {
  synergyThresholds: {
    minMultiplier: 0.1,
    maxMultiplier: 10.0,
    extremeThreshold: 5.0,
  },
  numericalRules: {
    allowNaN: false,
    allowInfinity: false,
    minWinRate: 0.0,
    maxWinRate: 1.0,
    minPercentage: 0.0,
    maxPercentage: 100.0,
  },
  statisticalRules: {
    minMatchupCount: 5,
    maxStdDeviation: 1.0,
    minConfidenceCoverage: 0.8,
  },
  completenessRules: {
    minStatCount: 3,
    minSynergyCount: 1,
    maxRuntimeMs: 300000,
  },
};

/**
 * Types of quality issues that can be detected
 */
export type QualityIssueType = 
  | 'nan_value'
  | 'infinite_value'
  | 'out_of_range'
  | 'extreme_value'
  | 'invalid_percentage'
  | 'invalid_win_rate'
  | 'insufficient_data'
  | 'statistical_anomaly'
  | 'missing_data'
  | 'performance_issue';

/**
 * Individual quality issue detected
 */
export interface QualityIssue {
  /** Type of issue */
  type: QualityIssueType;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Description of the issue */
  description: string;
  /** Location where the issue was found */
  location: {
    /** Path to the data element */
    path: string;
    /** Additional context */
    context?: string;
  };
  /** Actual value that caused the issue */
  actualValue: any;
  /** Expected value or range */
  expectedValue: any;
  /** Rule that was violated */
  rule: string;
}

/**
 * Complete data quality report
 */
export interface DataQualityReport {
  /** Report metadata */
  metadata: {
    /** Report generation timestamp */
    timestamp: number;
    /** Input file path */
    inputFile: string;
    /** Rules used for validation */
    rules: DataQualityRules;
    /** Analysis ID from the input data */
    analysisId?: string;
  };
  /** Summary statistics */
  summary: {
    /** Total issues found */
    totalIssues: number;
    /** Issues by severity */
    issuesBySeverity: Record<'error' | 'warning' | 'info', number>;
    /** Issues by type */
    issuesByType: Record<QualityIssueType, number>;
    /** Overall quality score (0-100) */
    qualityScore: number;
    /** Pass/fail status */
    status: 'pass' | 'fail' | 'warning';
  };
  /** All detected issues */
  issues: QualityIssue[];
  /** Data statistics */
  dataStats: {
    /** Number of stats analyzed */
    statCount: number;
    /** Number of synergy pairs analyzed */
    synergyCount: number;
    /** Total simulations */
    totalSimulations: number;
    /** Runtime in milliseconds */
    runtimeMs: number;
    /** Data completeness percentage */
    completenessPercentage: number;
  };
}

/**
 * Data quality validator class
 */
export class DataQualityValidator {
  private rules: DataQualityRules;

  constructor(rules: DataQualityRules = DEFAULT_DATA_QUALITY_RULES) {
    this.rules = rules;
  }

  /**
   * Validate complete export data
   */
  validateExportData(exportData: ExportData): DataQualityReport {
    const issues: QualityIssue[] = [];
    const analysis = exportData.analysis;

    // Validate analysis structure
    this.validateAnalysisStructure(analysis, issues);

    // Validate stat metrics
    if (analysis.statMetrics) {
      this.validateStatMetrics(analysis.statMetrics, issues);
    }

    // Validate synergy analyses
    if (analysis.synergyAnalyses) {
      this.validateSynergyAnalyses(analysis.synergyAnalyses, issues);
    }

    // Validate summary statistics
    if (analysis.summary) {
      this.validateSummary(analysis.summary, issues);
    }

    // Generate report
    return this.generateReport(exportData, issues);
  }

  /**
   * Validate analysis structure and basic properties
   */
  private validateAnalysisStructure(analysis: MarginalUtilityAnalysis, issues: QualityIssue[]): void {
    // Check for required fields
    if (!analysis.id) {
      issues.push({
        type: 'missing_data',
        severity: 'error',
        description: 'Missing analysis ID',
        location: { path: 'analysis.id' },
        actualValue: undefined,
        expectedValue: 'string',
        rule: 'required_field',
      });
    }

    if (!analysis.config) {
      issues.push({
        type: 'missing_data',
        severity: 'error',
        description: 'Missing analysis configuration',
        location: { path: 'analysis.config' },
        actualValue: undefined,
        expectedValue: 'object',
        rule: 'required_field',
      });
    }

    // Validate timestamp
    if (analysis.timestamp && !Number.isFinite(analysis.timestamp)) {
      issues.push({
        type: 'nan_value',
        severity: 'error',
        description: 'Invalid timestamp',
        location: { path: 'analysis.timestamp' },
        actualValue: analysis.timestamp,
        expectedValue: 'finite number',
        rule: 'finite_timestamp',
      });
    }
  }

  /**
   * Validate individual stat metrics
   */
  private validateStatMetrics(metrics: MarginalUtilityMetrics[], issues: QualityIssue[]): void {
    // Check minimum stat count
    if (metrics.length < this.rules.completenessRules.minStatCount) {
      issues.push({
        type: 'insufficient_data',
        severity: 'warning',
        description: `Insufficient number of stats: ${metrics.length} < ${this.rules.completenessRules.minStatCount}`,
        location: { path: 'analysis.statMetrics' },
        actualValue: metrics.length,
        expectedValue: `>= ${this.rules.completenessRules.minStatCount}`,
        rule: 'min_stat_count',
      });
    }

    metrics.forEach((metric, index) => {
      const basePath = `analysis.statMetrics[${index}]`;

      // Validate win rate
      if (!this.rules.numericalRules.allowNaN && Number.isNaN(metric.avgWinRate)) {
        issues.push({
          type: 'nan_value',
          severity: 'error',
          description: 'NaN win rate detected',
          location: { path: `${basePath}.avgWinRate`, context: `stat: ${metric.statId}` },
          actualValue: metric.avgWinRate,
          expectedValue: 'finite number',
          rule: 'no_nan_win_rate',
        });
      }

      if (metric.avgWinRate !== undefined && 
          (metric.avgWinRate < this.rules.numericalRules.minWinRate || 
           metric.avgWinRate > this.rules.numericalRules.maxWinRate)) {
        issues.push({
          type: 'invalid_win_rate',
          severity: 'error',
          description: `Win rate out of range: ${metric.avgWinRate}`,
          location: { path: `${basePath}.avgWinRate`, context: `stat: ${metric.statId}` },
          actualValue: metric.avgWinRate,
          expectedValue: `${this.rules.numericalRules.minWinRate} - ${this.rules.numericalRules.maxWinRate}`,
          rule: 'win_rate_range',
        });
      }

      // Validate standard deviation
      if (metric.stdDeviation !== undefined && metric.stdDeviation > this.rules.statisticalRules.maxStdDeviation) {
        issues.push({
          type: 'statistical_anomaly',
          severity: 'warning',
          description: `High standard deviation: ${metric.stdDeviation}`,
          location: { path: `${basePath}.stdDeviation`, context: `stat: ${metric.statId}` },
          actualValue: metric.stdDeviation,
          expectedValue: `<= ${this.rules.statisticalRules.maxStdDeviation}`,
          rule: 'max_std_deviation',
        });
      }

      // Validate matchup count
      if (metric.matchupCount < this.rules.statisticalRules.minMatchupCount) {
        issues.push({
          type: 'insufficient_data',
          severity: 'warning',
          description: `Insufficient matchup count: ${metric.matchupCount}`,
          location: { path: `${basePath}.matchupCount`, context: `stat: ${metric.statId}` },
          actualValue: metric.matchupCount,
          expectedValue: `>= ${this.rules.statisticalRules.minMatchupCount}`,
          rule: 'min_matchup_count',
        });
      }

      // Check for infinite values
      if (!this.rules.numericalRules.allowInfinity) {
        if (!Number.isFinite(metric.avgWinRate)) {
          issues.push({
            type: 'infinite_value',
            severity: 'error',
            description: 'Infinite win rate detected',
            location: { path: `${basePath}.avgWinRate`, context: `stat: ${metric.statId}` },
            actualValue: metric.avgWinRate,
            expectedValue: 'finite number',
            rule: 'no_infinite_values',
          });
        }
      }
    });
  }

  /**
   * Validate synergy analyses
   */
  private validateSynergyAnalyses(synergies: SynergyAnalysis[], issues: QualityIssue[]): void {
    // Check minimum synergy count
    if (synergies.length < this.rules.completenessRules.minSynergyCount) {
      issues.push({
        type: 'insufficient_data',
        severity: 'warning',
        description: `Insufficient number of synergies: ${synergies.length} < ${this.rules.completenessRules.minSynergyCount}`,
        location: { path: 'analysis.synergyAnalyses' },
        actualValue: synergies.length,
        expectedValue: `>= ${this.rules.completenessRules.minSynergyCount}`,
        rule: 'min_synergy_count',
      });
    }

    synergies.forEach((synergy, index) => {
      const basePath = `analysis.synergyAnalyses[${index}]`;

      // Validate synergy multiplier
      if (!this.rules.numericalRules.allowNaN && Number.isNaN(synergy.synergyMultiplier)) {
        issues.push({
          type: 'nan_value',
          severity: 'error',
          description: 'NaN synergy multiplier detected',
          location: { path: `${basePath}.synergyMultiplier`, context: `pair: ${synergy.pairId}` },
          actualValue: synergy.synergyMultiplier,
          expectedValue: 'finite number',
          rule: 'no_nan_synergy_multiplier',
        });
      }

      if (synergy.synergyMultiplier !== undefined) {
        if (synergy.synergyMultiplier < this.rules.synergyThresholds.minMultiplier || 
            synergy.synergyMultiplier > this.rules.synergyThresholds.maxMultiplier) {
          issues.push({
            type: 'out_of_range',
            severity: 'error',
            description: `Synergy multiplier out of range: ${synergy.synergyMultiplier}`,
            location: { path: `${basePath}.synergyMultiplier`, context: `pair: ${synergy.pairId}` },
            actualValue: synergy.synergyMultiplier,
            expectedValue: `${this.rules.synergyThresholds.minMultiplier} - ${this.rules.synergyThresholds.maxMultiplier}`,
            rule: 'synergy_multiplier_range',
          });
        }

        // Check for extreme values
        if (Math.abs(synergy.synergyMultiplier) > this.rules.synergyThresholds.extremeThreshold) {
          issues.push({
            type: 'extreme_value',
            severity: 'warning',
            description: `Extreme synergy multiplier: ${synergy.synergyMultiplier}`,
            location: { path: `${basePath}.synergyMultiplier`, context: `pair: ${synergy.pairId}` },
            actualValue: synergy.synergyMultiplier,
            expectedValue: `<= ${this.rules.synergyThresholds.extremeThreshold}`,
            rule: 'extreme_synergy_multiplier',
          });
        }
      }

      // Validate win rates
      ['observedWinRate', 'expectedWinRate'].forEach(rateField => {
        const rate = synergy[rateField as keyof SynergyAnalysis] as number;
        if (rate !== undefined && 
            (rate < this.rules.numericalRules.minWinRate || 
             rate > this.rules.numericalRules.maxWinRate)) {
          issues.push({
            type: 'invalid_win_rate',
            severity: 'error',
            description: `Invalid ${rateField}: ${rate}`,
            location: { path: `${basePath}.${rateField}`, context: `pair: ${synergy.pairId}` },
            actualValue: rate,
            expectedValue: `${this.rules.numericalRules.minWinRate} - ${this.rules.numericalRules.maxWinRate}`,
            rule: 'win_rate_range',
          });
        }
      });

      // Check for infinite values
      if (!this.rules.numericalRules.allowInfinity) {
        ['observedWinRate', 'expectedWinRate', 'synergyMultiplier'].forEach(field => {
          const value = synergy[field as keyof SynergyAnalysis] as number;
          if (value !== undefined && !Number.isFinite(value)) {
            issues.push({
              type: 'infinite_value',
              severity: 'error',
              description: `Infinite ${field} detected`,
              location: { path: `${basePath}.${field}`, context: `pair: ${synergy.pairId}` },
              actualValue: value,
              expectedValue: 'finite number',
              rule: 'no_infinite_values',
            });
          }
        });
      }
    });
  }

  /**
   * Validate summary statistics
   */
  private validateSummary(summary: MarginalUtilityAnalysis['summary'], issues: QualityIssue[]): void {
    if (!summary) return;

    // Check runtime
    if (summary.totalRuntimeMs > this.rules.completenessRules.maxRuntimeMs) {
      issues.push({
        type: 'performance_issue',
        severity: 'warning',
        description: `Excessive runtime: ${summary.totalRuntimeMs}ms`,
        location: { path: 'analysis.summary.totalRuntimeMs' },
        actualValue: summary.totalRuntimeMs,
        expectedValue: `<= ${this.rules.completenessRules.maxRuntimeMs}ms`,
        rule: 'max_runtime',
      });
    }

    // Validate simulation counts
    if (summary.totalSimulations <= 0) {
      issues.push({
        type: 'insufficient_data',
        severity: 'error',
        description: `Invalid total simulations: ${summary.totalSimulations}`,
        location: { path: 'analysis.summary.totalSimulations' },
        actualValue: summary.totalSimulations,
        expectedValue: '> 0',
        rule: 'positive_simulations',
      });
    }
  }

  /**
   * Generate comprehensive quality report
   */
  private generateReport(exportData: ExportData, issues: QualityIssue[]): DataQualityReport {
    // Count issues by severity and type
    const issuesBySeverity = { error: 0, warning: 0, info: 0 };
    const issuesByType: Record<QualityIssueType, number> = {
      nan_value: 0,
      infinite_value: 0,
      out_of_range: 0,
      extreme_value: 0,
      invalid_percentage: 0,
      invalid_win_rate: 0,
      insufficient_data: 0,
      statistical_anomaly: 0,
      missing_data: 0,
      performance_issue: 0,
    };

    issues.forEach(issue => {
      issuesBySeverity[issue.severity]++;
      issuesByType[issue.type]++;
    });

    // Calculate quality score (0-100)
    const errorWeight = 10;
    const warningWeight = 3;
    const infoWeight = 1;
    const totalDeductions = (issuesBySeverity.error * errorWeight) + 
                          (issuesBySeverity.warning * warningWeight) + 
                          (issuesBySeverity.info * infoWeight);
    const qualityScore = Math.max(0, 100 - totalDeductions);

    // Determine status
    let status: 'pass' | 'fail' | 'warning' = 'pass';
    if (issuesBySeverity.error > 0) {
      status = 'fail';
    } else if (issuesBySeverity.warning > 0) {
      status = 'warning';
    }

    // Calculate data statistics
    const analysis = exportData.analysis;
    const dataStats = {
      statCount: analysis.statMetrics?.length || 0,
      synergyCount: analysis.synergyAnalyses?.length || 0,
      totalSimulations: analysis.summary?.totalSimulations || 0,
      runtimeMs: analysis.summary?.totalRuntimeMs || 0,
      completenessPercentage: this.calculateCompleteness(analysis),
    };

    return {
      metadata: {
        timestamp: Date.now(),
        inputFile: exportData.metadata?.exportPath || 'unknown',
        rules: this.rules,
        analysisId: analysis.id,
      },
      summary: {
        totalIssues: issues.length,
        issuesBySeverity,
        issuesByType,
        qualityScore,
        status,
      },
      issues,
      dataStats,
    };
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateCompleteness(analysis: MarginalUtilityAnalysis): number {
    let completenessScore = 0;
    let totalChecks = 0;

    // Check for required fields
    if (analysis.id) completenessScore++;
    totalChecks++;
    if (analysis.config) completenessScore++;
    totalChecks++;
    if (analysis.statMetrics) completenessScore++;
    totalChecks++;
    if (analysis.synergyAnalyses) completenessScore++;
    totalChecks++;
    if (analysis.summary) completenessScore++;
    totalChecks++;

    return totalChecks > 0 ? (completenessScore / totalChecks) * 100 : 0;
  }
}
