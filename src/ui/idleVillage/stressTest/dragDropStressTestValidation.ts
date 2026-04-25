/**
 * Drag & Drop Stress Test Result Validation and Analysis
 * 
 * Comprehensive validation and analysis system for stress test results
 * with performance analysis, error classification, and reporting capabilities.
 * 
 * @since NP-014
 */

import type { StressTestResult, StressTestMetrics, DragDropOperation } from './dragDropStressTestHarness';

/**
 * Validation analysis result
 */
export interface ValidationAnalysis {
  /** Overall validation score (0-1) */
  validationScore: number;
  /** Accuracy of expected vs actual results */
  resultAccuracy: number;
  /** Performance score based on metrics */
  performanceScore: number;
  /** Error analysis */
  errorAnalysis: ErrorAnalysis;
  /** Performance analysis */
  performanceAnalysis: PerformanceAnalysis;
  /** Recommendations */
  recommendations: string[];
  /** Validation status */
  status: 'passed' | 'failed' | 'warning';
}

/**
 * Error analysis details
 */
export interface ErrorAnalysis {
  /** Total error count */
  totalErrors: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Errors by type */
  errorsByType: Record<string, number>;
  /** Errors by scenario */
  errorsByScenario: Record<string, number>;
  /** Critical errors */
  criticalErrors: CriticalError[];
  /** Error patterns */
  patterns: ErrorPattern[];
}

/**
 * Critical error information
 */
export interface CriticalError {
  /** Error type */
  type: string;
  /** Error count */
  count: number;
  /** Error percentage */
  percentage: number;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description */
  description: string;
}

/**
 * Error pattern detection
 */
export interface ErrorPattern {
  /** Pattern type */
  type: string;
  /** Pattern description */
  description: string;
  /** Affected operations */
  affectedOperations: number;
  /** Pattern confidence (0-1) */
  confidence: number;
}

/**
 * Performance analysis details
 */
export interface PerformanceAnalysis {
  /** Overall performance rating */
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  /** Performance score (0-1) */
  score: number;
  /** Bottlenecks identified */
  bottlenecks: PerformanceBottleneck[];
  /** Resource utilization */
  resourceUtilization: ResourceUtilization;
  /** Performance trends */
  trends: PerformanceTrend[];
}

/**
 * Performance bottleneck information
 */
export interface PerformanceBottleneck {
  /** Bottleneck type */
  type: 'memory' | 'cpu' | 'validation' | 'generation' | 'io';
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
  /** Description */
  description: string;
  /** Impact on performance */
  impact: number;
  /** Recommendation */
  recommendation: string;
}

/**
 * Resource utilization metrics
 */
export interface ResourceUtilization {
  /** Memory usage efficiency (0-1) */
  memoryEfficiency: number;
  /** CPU usage efficiency (0-1) */
  cpuEfficiency: number;
  /** Validation throughput */
  validationThroughput: number;
  /** Generation throughput */
  generationThroughput: number;
}

/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  /** Trend type */
  type: 'improving' | 'degrading' | 'stable';
  /** Metric affected */
  metric: string;
  /** Trend strength (-1 to 1) */
  strength: number;
  /** Description */
  description: string;
}

/**
 * Validation thresholds
 */
export interface ValidationThresholds {
  /** Minimum validation score to pass */
  minValidationScore: number;
  /** Maximum acceptable error rate */
  maxErrorRate: number;
  /** Minimum operations per second */
  minOpsPerSecond: number;
  /** Maximum memory usage increase (MB) */
  maxMemoryIncrease: number;
  /** Maximum operation duration (ms) */
  maxOperationDuration: number;
}

/**
 * Default validation thresholds
 */
export const DEFAULT_VALIDATION_THRESHOLDS: ValidationThresholds = {
  minValidationScore: 0.8,
  maxErrorRate: 0.1, // 10% error rate
  minOpsPerSecond: 100,
  maxMemoryIncrease: 100, // 100MB
  maxOperationDuration: 100, // 100ms
};

/**
 * Analyzes stress test results and provides comprehensive validation
 */
export function analyzeStressTestResults(
  result: StressTestResult,
  thresholds: ValidationThresholds = DEFAULT_VALIDATION_THRESHOLDS
): ValidationAnalysis {
  const errorAnalysis = analyzeErrors(result);
  const performanceAnalysis = analyzePerformance(result, thresholds);
  const resultAccuracy = calculateResultAccuracy(result);
  const validationScore = calculateValidationScore(errorAnalysis, performanceAnalysis, resultAccuracy);
  
  const recommendations = generateRecommendations(errorAnalysis, performanceAnalysis, thresholds);
  const status = determineValidationStatus(validationScore, thresholds);
  
  return {
    validationScore,
    resultAccuracy,
    performanceScore: performanceAnalysis.score,
    errorAnalysis,
    performanceAnalysis,
    recommendations,
    status,
  };
}

/**
 * Analyzes errors in stress test results
 */
export function analyzeErrors(result: StressTestResult): ErrorAnalysis {
  const errors = result.validationResults.filter(r => !r.isValid);
  const totalErrors = errors.length;
  const errorRate = totalErrors / result.validationResults.length;
  
  // Group errors by type
  const errorsByType: Record<string, number> = {};
  errors.forEach(error => {
    const errorType = error.failedRule || 'unknown';
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
  });
  
  // Group errors by scenario
  const errorsByScenario: Record<string, number> = {};
  result.operations.forEach((op, index) => {
    const validationResult = result.validationResults[index];
    if (!validationResult.isValid) {
      const scenario = op.metadata.scenario;
      errorsByScenario[scenario] = (errorsByScenario[scenario] || 0) + 1;
    }
  });
  
  // Identify critical errors
  const criticalErrors = identifyCriticalErrors(errorsByType, totalErrors);
  
  // Detect error patterns
  const patterns = detectErrorPatterns(result);
  
  return {
    totalErrors,
    errorRate,
    errorsByType,
    errorsByScenario,
    criticalErrors,
    patterns,
  };
}

/**
 * Analyzes performance metrics
 */
export function analyzePerformance(
  result: StressTestResult,
  thresholds: ValidationThresholds
): PerformanceAnalysis {
  const metrics = result.metrics;
  
  // Calculate performance score
  const opsPerSecondScore = Math.min(metrics.operationsPerSecond / thresholds.minOpsPerSecond, 1);
  const memoryScore = Math.max(0, 1 - (metrics.memoryUsage.delta / (thresholds.maxMemoryIncrease * 1024 * 1024)));
  const durationScore = Math.max(0, 1 - (metrics.slowestOperationDuration / thresholds.maxOperationDuration));
  
  const score = (opsPerSecondScore + memoryScore + durationScore) / 3;
  
  // Determine rating
  let rating: PerformanceAnalysis['rating'];
  if (score >= 0.9) rating = 'excellent';
  else if (score >= 0.7) rating = 'good';
  else if (score >= 0.5) rating = 'fair';
  else rating = 'poor';
  
  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(metrics, thresholds);
  
  // Calculate resource utilization
  const resourceUtilization = calculateResourceUtilization(metrics);
  
  // Analyze trends
  const trends = analyzePerformanceTrends(metrics);
  
  return {
    rating,
    score,
    bottlenecks,
    resourceUtilization,
    trends,
  };
}

/**
 * Calculates result accuracy
 */
export function calculateResultAccuracy(result: StressTestResult): number {
  let correctPredictions = 0;
  
  result.operations.forEach((operation, index) => {
    const validationResult = result.validationResults[index];
    const expectedValid = operation.expectedResult;
    const actualValid = validationResult.isValid;
    
    if (expectedValid === actualValid) {
      correctPredictions++;
    }
  });
  
  return correctPredictions / result.operations.length;
}

/**
 * Calculates overall validation score
 */
export function calculateValidationScore(
  errorAnalysis: ErrorAnalysis,
  performanceAnalysis: PerformanceAnalysis,
  resultAccuracy: number
): number {
  const errorScore = Math.max(0, 1 - errorAnalysis.errorRate * 2); // Penalize errors heavily
  const performanceScore = performanceAnalysis.score;
  
  // Weighted average: accuracy (40%), performance (30%), error rate (30%)
  return (resultAccuracy * 0.4) + (performanceScore * 0.3) + (errorScore * 0.3);
}

/**
 * Identifies critical errors
 */
export function identifyCriticalErrors(
  errorsByType: Record<string, number>,
  totalErrors: number
): CriticalError[] {
  const criticalErrors: CriticalError[] = [];
  
  Object.entries(errorsByType).forEach(([type, count]) => {
    const percentage = (count / totalErrors) * 100;
    
    let severity: CriticalError['severity'];
    let description: string;
    
    if (percentage > 50) {
      severity = 'critical';
      description = `${type} errors affect ${percentage.toFixed(1)}% of all operations`;
    } else if (percentage > 25) {
      severity = 'high';
      description = `${type} errors affect ${percentage.toFixed(1)}% of all operations`;
    } else if (percentage > 10) {
      severity = 'medium';
      description = `${type} errors affect ${percentage.toFixed(1)}% of all operations`;
    } else {
      severity = 'low';
      description = `${type} errors affect ${percentage.toFixed(1)}% of all operations`;
    }
    
    criticalErrors.push({
      type,
      count,
      percentage,
      severity,
      description,
    });
  });
  
  return criticalErrors.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Detects error patterns
 */
export function detectErrorPatterns(result: StressTestResult): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  
  // Pattern 1: Sequential errors
  const sequentialErrors = detectSequentialErrors(result);
  if (sequentialErrors > 0) {
    patterns.push({
      type: 'sequential_errors',
      description: `Found ${sequentialErrors} sequences of consecutive errors`,
      affectedOperations: sequentialErrors * 2,
      confidence: 0.8,
    });
  }
  
  // Pattern 2: Time-based clustering
  const timeClusters = detectTimeBasedErrorClusters(result);
  if (timeClusters.length > 0) {
    patterns.push({
      type: 'time_clustering',
      description: `Errors cluster in ${timeClusters.length} time periods`,
      affectedOperations: timeClusters.reduce((sum, cluster) => sum + cluster.count, 0),
      confidence: 0.7,
    });
  }
  
  // Pattern 3: Scenario-specific errors
  const scenarioErrors = detectScenarioSpecificErrors(result);
  if (scenarioErrors.length > 0) {
    patterns.push({
      type: 'scenario_specific',
      description: `High error rates in specific scenarios`,
      affectedOperations: scenarioErrors.reduce((sum, scenario) => sum + scenario.count, 0),
      confidence: 0.9,
    });
  }
  
  return patterns;
}

/**
 * Identifies performance bottlenecks
 */
export function identifyBottlenecks(
  metrics: StressTestMetrics,
  thresholds: ValidationThresholds
): PerformanceBottleneck[] {
  const bottlenecks: PerformanceBottleneck[] = [];
  
  // Memory bottleneck
  if (metrics.memoryUsage.delta > thresholds.maxMemoryIncrease * 1024 * 1024) {
    bottlenecks.push({
      type: 'memory',
      severity: 'high',
      description: `Memory usage increased by ${(metrics.memoryUsage.delta / 1024 / 1024).toFixed(1)}MB`,
      impact: metrics.memoryUsage.delta / (thresholds.maxMemoryIncrease * 1024 * 1024),
      recommendation: 'Consider implementing memory pooling or reducing operation batch size',
    });
  }
  
  // Performance bottleneck
  if (metrics.operationsPerSecond < thresholds.minOpsPerSecond) {
    bottlenecks.push({
      type: 'validation',
      severity: 'medium',
      description: `Operations per second (${metrics.operationsPerSecond.toFixed(1)}) below threshold (${thresholds.minOpsPerSecond})`,
      impact: 1 - (metrics.operationsPerSecond / thresholds.minOpsPerSecond),
      recommendation: 'Optimize validation logic or increase parallel processing',
    });
  }
  
  // Slow operations bottleneck
  if (metrics.slowestOperationDuration > thresholds.maxOperationDuration) {
    bottlenecks.push({
      type: 'validation',
      severity: 'medium',
      description: `Slowest operation took ${metrics.slowestOperationDuration.toFixed(1)}ms`,
      impact: metrics.slowestOperationDuration / thresholds.maxOperationDuration,
      recommendation: 'Investigate specific operations causing delays',
    });
  }
  
  return bottlenecks;
}

/**
 * Calculates resource utilization
 */
export function calculateResourceUtilization(metrics: StressTestMetrics): ResourceUtilization {
  const memoryEfficiency = Math.max(0, 1 - (metrics.memoryUsage.delta / (50 * 1024 * 1024))); // 50MB baseline
  const cpuEfficiency = Math.min(metrics.operationsPerSecond / 1000, 1); // 1000 ops/sec baseline
  const validationThroughput = metrics.operationsPerSecond;
  const generationThroughput = metrics.operationsPerSecond; // Assuming similar throughput
  
  return {
    memoryEfficiency,
    cpuEfficiency,
    validationThroughput,
    generationThroughput,
  };
}

/**
 * Analyzes performance trends
 */
export function analyzePerformanceTrends(metrics: StressTestMetrics): PerformanceTrend[] {
  const trends: PerformanceTrend[] = [];
  
  // Memory trend
  if (metrics.memoryUsage.delta > 0) {
    trends.push({
      type: 'degrading',
      metric: 'memory_usage',
      strength: Math.min(metrics.memoryUsage.delta / (10 * 1024 * 1024), 1), // Normalize to 10MB
      description: 'Memory usage increasing over time',
    });
  }
  
  // Performance trend
  if (metrics.averageOperationDuration > 50) {
    trends.push({
      type: 'degrading',
      metric: 'operation_duration',
      strength: Math.min(metrics.averageOperationDuration / 100, 1), // Normalize to 100ms
      description: 'Operation duration increasing',
    });
  }
  
  return trends;
}

/**
 * Generates recommendations based on analysis
 */
export function generateRecommendations(
  errorAnalysis: ErrorAnalysis,
  performanceAnalysis: PerformanceAnalysis,
  thresholds: ValidationThresholds
): string[] {
  const recommendations: string[] = [];
  
  // Error-based recommendations
  if (errorAnalysis.errorRate > thresholds.maxErrorRate) {
    recommendations.push('Reduce error rate by improving validation logic and data quality');
  }
  
  errorAnalysis.criticalErrors.forEach(error => {
    if (error.severity === 'critical' || error.severity === 'high') {
      recommendations.push(`Address ${error.type} errors: ${error.description}`);
    }
  });
  
  // Performance-based recommendations
  performanceAnalysis.bottlenecks.forEach(bottleneck => {
    recommendations.push(bottleneck.recommendation);
  });
  
  if (performanceAnalysis.rating === 'poor') {
    recommendations.push('Consider optimizing the entire stress test pipeline');
  } else if (performanceAnalysis.rating === 'fair') {
    recommendations.push('Performance is acceptable but could be improved');
  }
  
  // Memory recommendations
  if (performanceAnalysis.resourceUtilization.memoryEfficiency < 0.7) {
    recommendations.push('Implement memory optimization strategies');
  }
  
  return recommendations;
}

/**
 * Determines validation status
 */
export function determineValidationStatus(
  validationScore: number,
  thresholds: ValidationThresholds
): ValidationAnalysis['status'] {
  if (validationScore >= thresholds.minValidationScore) {
    return 'passed';
  } else if (validationScore >= thresholds.minValidationScore * 0.8) {
    return 'warning';
  } else {
    return 'failed';
  }
}

// Helper functions for pattern detection

function detectSequentialErrors(result: StressTestResult): number {
  let sequentialCount = 0;
  let currentSequence = 0;
  
  result.validationResults.forEach(validation => {
    if (!validation.isValid) {
      currentSequence++;
    } else {
      if (currentSequence >= 3) {
        sequentialCount++;
      }
      currentSequence = 0;
    }
  });
  
  return sequentialCount;
}

function detectTimeBasedErrorClusters(result: StressTestResult): Array<{ start: number; end: number; count: number }> {
  const clusters: Array<{ start: number; end: number; count: number }> = [];
  const windowSize = 100; // 100ms window
  const errorThreshold = 5; // 5 errors in window
  
  for (let i = 0; i < result.operations.length - errorThreshold; i++) {
    const windowStart = result.operations[i].timestamp;
    const windowEnd = windowStart + windowSize;
    
    const errorsInWindow = result.operations.slice(i, i + errorThreshold)
      .filter((_, index) => !result.validationResults[i + index].isValid)
      .length;
    
    if (errorsInWindow >= errorThreshold) {
      clusters.push({
        start: windowStart,
        end: windowEnd,
        count: errorsInWindow,
      });
    }
  }
  
  return clusters;
}

function detectScenarioSpecificErrors(result: StressTestResult): Array<{ scenario: string; count: number; rate: number }> {
  const scenarioStats: Record<string, { total: number; errors: number }> = {};
  
  result.operations.forEach((operation, index) => {
    const scenario = operation.metadata.scenario;
    if (!scenarioStats[scenario]) {
      scenarioStats[scenario] = { total: 0, errors: 0 };
    }
    
    scenarioStats[scenario].total++;
    if (!result.validationResults[index].isValid) {
      scenarioStats[scenario].errors++;
    }
  });
  
  return Object.entries(scenarioStats)
    .filter(([, stats]) => stats.errors / stats.total > 0.2) // 20% error rate threshold
    .map(([scenario, stats]) => ({
      scenario,
      count: stats.errors,
      rate: stats.errors / stats.total,
    }));
}
