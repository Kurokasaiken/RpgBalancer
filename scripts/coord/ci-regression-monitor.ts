/**
 * CI Pipeline Regression Monitor
 * 
 * Monitors CI pipeline performance, detects regressions, and provides alerts.
 * Tracks build times, test performance, and quality metrics over time.
 * Enhanced with stress testing pipeline support.
 */

import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as https from 'node:https';
import { execSync } from 'node:child_process';

// Export types for external use
export type { CIPipelineMetrics, StressTestMetrics, RegressionAlert, MonitorConfig };

/**
 * CI Pipeline Metrics
 */
interface CIPipelineMetrics {
  id: string;
  timestamp: number;
  commit: string;
  branch: string;
  buildDuration: number;
  testDuration: number;
  lintDuration: number;
  totalDuration: number;
  status: 'success' | 'failure' | 'cancelled';
  testResults: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
  };
  lintResults: {
    errors: number;
    warnings: number;
  };
  buildResults: {
    errors: number;
    warnings: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
  };
  artifacts: {
    count: number;
    size: number;
  };
  stressTestResults?: StressTestMetrics;
}

/**
 * Stress Test Metrics for CI Regression Monitoring
 */
interface StressTestMetrics {
  /** Stress test execution duration */
  duration: number;
  /** Number of archetypes generated */
  archetypesGenerated: number;
  /** Total simulations run */
  simulationsRun: number;
  /** Stat pairs analyzed */
  pairsAnalyzed: number;
  /** OP synergies found */
  opSynergies: number;
  /** Weak synergies found */
  weakSynergies: number;
  /** Significant synergies */
  significantSynergies: number;
  /** Average win rate across all pairs */
  avgWinRate: number;
  /** Average synergy multiplier */
  avgSynergyMultiplier: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Memory usage during stress test */
  memoryUsage: number;
  /** CPU usage during stress test */
  cpuUsage: number;
  /** Test configuration */
  config: {
    iterations: number;
    seed: number;
    parallelJobs: number;
    opThreshold: number;
    weakThreshold: number;
  };
  /** Performance metrics */
  performance: {
    simulationsPerSecond: number;
    avgTurnTime: number;
    throughput: number;
  };
  /** Error information */
  errors?: {
    count: number;
    types: string[];
    details: string[];
  };
}

/**
 * Regression Alert
 */
interface RegressionAlert {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'performance' | 'quality' | 'reliability' | 'security' | 'stress_regression';
  metric: string;
  currentValue: number;
  baselineValue: number;
  threshold: number;
  description: string;
  recommendation: string;
  commit: string;
  branch: string;
}

/**
 * Regression Monitor Configuration
 */
interface MonitorConfig {
  baselineWindow: number; // Number of builds to use for baseline
  alertThresholds: {
    buildDuration: number; // percentage increase
    testDuration: number; // percentage increase
    testFailureRate: number; // percentage increase
    lintErrors: number; // absolute increase
    coverageDrop: number; // percentage drop
    memoryUsage: number; // percentage increase
    stressTestDuration: number; // percentage increase
    stressTestSimulationsPerSecond: number; // percentage decrease
    stressTestMemoryUsage: number; // percentage increase
    stressTestErrorRate: number; // absolute increase
    stressTestCacheHitRate: number; // percentage drop
    stressTestSynergyDrift: number; // percentage change in avg synergy multiplier
  };
  retentionDays: number;
  exportPath: string;
  enableRealTimeMonitoring: boolean;
  webhookUrl?: string;
  stressTestConfig?: {
    enableStressTestMonitoring: boolean;
    stressTestResultsPath: string;
    stressTestCachePath: string;
    baselineStressTestRuns: number;
  };
};

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: MonitorConfig = {
  baselineWindow: 30,
  alertThresholds: {
    buildDuration: 25, // 25% increase
    testDuration: 30, // 30% increase
    testFailureRate: 10, // 10% increase
    lintErrors: 5, // 5 new errors
    coverageDrop: 5, // 5% drop
    memoryUsage: 20, // 20% increase
    stressTestDuration: 30, // 30% increase
    stressTestSimulationsPerSecond: 15, // 15% decrease
    stressTestMemoryUsage: 25, // 25% increase
    stressTestErrorRate: 3, // 3 new errors
    stressTestCacheHitRate: 10, // 10% drop
    stressTestSynergyDrift: 20, // 20% change in avg synergy multiplier
  },
  retentionDays: 90,
  exportPath: 'test-results/ci-regression-monitor',
  enableRealTimeMonitoring: true,
  stressTestConfig: {
    enableStressTestMonitoring: true,
    stressTestResultsPath: 'data/stressTesting/ci',
    stressTestCachePath: 'data/stressTesting/cache',
    baselineStressTestRuns: 10,
  },
};

/**
 * CI Regression Monitor Class
 */
class CIRegressionMonitor {
  private config: MonitorConfig;
  private metrics: CIPipelineMetrics[] = [];
  private alerts: RegressionAlert[] = [];

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Monitor current CI run
   */
  async monitorCurrentRun(): Promise<CIPipelineMetrics> {
    console.log('🔍 Monitoring current CI run...');
    
    const startTime = Date.now();
    const commit = this.getCurrentCommit();
    const branch = this.getCurrentBranch();
    
    // Monitor build phase
    const buildStart = Date.now();
    const buildResults = await this.runBuild();
    const buildDuration = Date.now() - buildStart;
    
    // Monitor lint phase
    const lintStart = Date.now();
    const lintResults = await this.runLint();
    const lintDuration = Date.now() - lintStart;
    
    // Monitor test phase
    const testStart = Date.now();
    const testResults = await this.runTests();
    const testDuration = Date.now() - testStart;
    
    // Monitor stress test phase if enabled
    let stressTestResults: StressTestMetrics | undefined;
    if (this.config.stressTestConfig?.enableStressTestMonitoring) {
      stressTestResults = await this.monitorStressTests();
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Get performance metrics
    const performance = await this.getPerformanceMetrics();
    
    // Get artifacts info
    const artifacts = await this.getArtifactsInfo();
    
    const metrics: CIPipelineMetrics = {
      id: `ci-${Date.now()}`,
      timestamp: startTime,
      commit,
      branch,
      buildDuration,
      testDuration,
      lintDuration,
      totalDuration,
      status: this.determineStatus(buildResults, lintResults, testResults),
      testResults,
      lintResults,
      buildResults,
      performance,
      artifacts,
      stressTestResults,
    };
    
    // Store metrics
    await this.storeMetrics(metrics);
    
    // Check for regressions
    await this.checkRegressions(metrics);
    
    return metrics;
  }

  /**
   * Analyze historical trends
   */
  async analyzeTrends(days: number = 30): Promise<void> {
    console.log(`📈 Analyzing trends for the last ${days} days...`);
    
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) {
      console.log('No recent metrics found for trend analysis.');
      return;
    }
    
    // Calculate trends
    const trends = this.calculateTrends(recentMetrics);
    
    // Display trends
    this.displayTrends(trends);
    
    // Export trend analysis
    await this.exportTrendAnalysis(trends, days);
  }

  /**
   * Generate regression report
   */
  async generateReport(format: 'json' | 'markdown' | 'html' = 'markdown'): Promise<void> {
    console.log('📊 Generating regression report...');
    
    const report = {
      timestamp: Date.now(),
      summary: this.generateSummary(),
      alerts: this.alerts,
      trends: this.calculateTrends(this.metrics),
      recommendations: this.generateRecommendations(),
    };
    
    const filename = `ci-regression-report-${new Date().toISOString().split('T')[0]}.${format}`;
    const filepath = path.join(this.config.exportPath, filename);
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(report);
        break;
      case 'html':
        content = this.generateHTMLReport(report);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    await fs.writeFile(filepath, content, 'utf8');
    console.log(`✅ Report generated: ${filepath}`);
  }

  /**
   * Send alerts for detected regressions
   */
  async sendAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      console.log('✅ No regressions detected.');
      return;
    }
    
    console.log(`🚨 Sending ${this.alerts.length} regression alerts...`);
    
    // Send webhook notifications
    if (this.config.webhookUrl) {
      await this.sendWebhookAlerts();
    }
    
    // Create alert summary
    await this.createAlertSummary();
  }

  /**
   * Clean up old metrics
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up old metrics...');
    
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    const originalLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoffTime);
    
    const cleanedCount = originalLength - this.metrics.length;
    console.log(`🗑️  Cleaned up ${cleanedCount} old metrics records.`);
    
    // Save cleaned data
    await this.saveMetrics();
  }

  /**
   * Get current commit hash
   */
  private getCurrentCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get current branch
   */
  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Run build and capture results
   */
  private async runBuild(): Promise<{ errors: number; warnings: number }> {
    try {
      execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
      return { errors: 0, warnings: 0 };
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const errors = (output.match(/error/gi) || []).length;
      const warnings = (output.match(/warning/gi) || []).length;
      return { errors, warnings };
    }
  }

  /**
   * Run lint and capture results
   */
  private async runLint(): Promise<{ errors: number; warnings: number }> {
    try {
      execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
      return { errors: 0, warnings: 0 };
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const errors = (output.match(/error/gi) || []).length;
      const warnings = (output.match(/warning/gi) || []).length;
      return { errors, warnings };
    }
  }

  /**
   * Run tests and capture results
   */
  private async runTests(): Promise<{ total: number; passed: number; failed: number; skipped: number; coverage?: number }> {
    try {
      const output = execSync('npm run test:unit', { encoding: 'utf8', stdio: 'pipe' });
      
      // Parse test results
      const lines = output.split('\n');
      const summaryLine = lines.find(line => line.includes('Test Files') || line.includes('PASS') || line.includes('FAIL'));
      
      let total = 0, passed = 0, failed = 0, skipped = 0;
      
      if (summaryLine) {
        const match = summaryLine.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+skipped/i);
        if (match) {
          passed = parseInt(match[1]);
          failed = parseInt(match[2]);
          skipped = parseInt(match[3]);
          total = passed + failed + skipped;
        }
      }
      
      // Extract coverage if available
      let coverage: number | undefined;
      const coverageMatch = output.match(/Coverage:\s*(\d+\.?\d*)%/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }
      
      return { total, passed, failed, skipped, coverage };
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const failed = (output.match(/FAIL/gi) || []).length;
      return { total: failed, passed: 0, failed, skipped: 0 };
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<{ memoryUsage: number; cpuUsage: number }> {
    const usage = process.memoryUsage();
    return {
      memoryUsage: usage.heapUsed,
      cpuUsage: process.cpuUsage().user,
    };
  }

  /**
   * Monitor stress test execution
   */
  private async monitorStressTests(): Promise<StressTestMetrics | undefined> {
    console.log('🧪 Monitoring stress test execution...');
    
    const startTime = Date.now();
    const stressTestPath = this.config.stressTestConfig?.stressTestResultsPath || 'data/stressTesting/ci';
    
    try {
      // Check if stress test results exist
      const resultsPath = path.join(stressTestPath, 'summary.json');
      
      try {
        await fs.access(resultsPath);
      } catch {
        console.log('⚠️  No stress test results found, skipping stress test monitoring');
        return undefined;
      }
      
      // Read stress test results
      const resultsContent = await fs.readFile(resultsPath, 'utf8');
      const stressTestResults = JSON.parse(resultsContent);
      
      const duration = Date.now() - startTime;
      
      // Extract metrics from stress test results
      const metrics: StressTestMetrics = {
        duration,
        archetypesGenerated: stressTestResults.results?.archetypesGenerated || 0,
        simulationsRun: stressTestResults.results?.simulationsRun || 0,
        pairsAnalyzed: stressTestResults.results?.pairsAnalyzed || 0,
        opSynergies: stressTestResults.results?.topSynergies || 0,
        weakSynergies: stressTestResults.results?.topWeaknesses || 0,
        significantSynergies: stressTestResults.results?.significantSynergies || 0,
        avgWinRate: stressTestResults.results?.avgWinRate || 0,
        avgSynergyMultiplier: stressTestResults.results?.avgSynergyMultiplier || 0,
        cacheHitRate: stressTestResults.cacheHit ? 100 : 0,
        memoryUsage: stressTestResults.performance?.memoryUsage || 0,
        cpuUsage: stressTestResults.performance?.cpuUsage || 0,
        config: {
          iterations: stressTestResults.config?.iterations || 0,
          seed: stressTestResults.config?.seed || 0,
          parallelJobs: stressTestResults.config?.parallelJobs || 0,
          opThreshold: stressTestResults.config?.opThreshold || 0,
          weakThreshold: stressTestResults.config?.weakThreshold || 0,
        },
        performance: {
          simulationsPerSecond: stressTestResults.performance?.simulationsPerSecond || 0,
          avgTurnTime: stressTestResults.performance?.avgTurnTime || 0,
          throughput: stressTestResults.performance?.throughput || 0,
        },
        errors: stressTestResults.errors ? {
          count: stressTestResults.errors.length,
          types: [...new Set(stressTestResults.errors.map((e: { type: string }) => e.type))],
          details: stressTestResults.errors.map((e: { message: string }) => e.message).slice(0, 5),
        } : undefined,
      };
      
      console.log(`✅ Stress test metrics collected: ${metrics.simulationsRun} simulations, ${metrics.duration}ms`);
      return metrics;
      
    } catch (error) {
      console.error('❌ Failed to monitor stress tests:', error);
      return undefined;
    }
  }

  /**
   * Get artifacts information
   */
  private async getArtifactsInfo(): Promise<{ count: number; size: number }> {
    try {
      const artifactsDir = 'test-results';
      const files = await fs.readdir(artifactsDir, { recursive: true });
      
      let totalSize = 0;
      let count = 0;
      
      for (const file of files) {
        if (typeof file === 'string' && file.endsWith('.log')) {
          try {
            const stat = await fs.stat(path.join(artifactsDir, file));
            totalSize += stat.size;
            count++;
          } catch {
            // Ignore files that can't be accessed
          }
        }
      }
      
      return { count, size: totalSize };
    } catch {
      return { count: 0, size: 0 };
    }
  }

  /**
   * Determine overall status
   */
  private determineStatus(build: any, lint: any, tests: any): 'success' | 'failure' | 'cancelled' {
    if (build.errors > 0 || lint.errors > 0 || tests.failed > 0) {
      return 'failure';
    }
    return 'success';
  }

  /**
   * Store metrics to file
   */
  private async storeMetrics(metrics: CIPipelineMetrics): Promise<void> {
    this.metrics.push(metrics);
    await this.saveMetrics();
  }

  /**
   * Save metrics to file
   */
  private async saveMetrics(): Promise<void> {
    const filepath = path.join(this.config.exportPath, 'ci-metrics.json');
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(this.metrics, null, 2), 'utf8');
  }

  /**
   * Load metrics from file
   */
  public async loadMetrics(): Promise<void> {
    const filepath = path.join(this.config.exportPath, 'ci-metrics.json');
    
    try {
      const content = await fs.readFile(filepath, 'utf8');
      this.metrics = JSON.parse(content);
    } catch {
      this.metrics = [];
    }
  }

  /**
   * Check for regressions
   */
  private async checkRegressions(currentMetrics: CIPipelineMetrics): Promise<void> {
    if (this.metrics.length < this.config.baselineWindow) {
      console.log('⚠️  Insufficient data for regression detection (need at least baseline window).');
      return;
    }
    
    const baseline = this.metrics.slice(-this.config.baselineWindow, -1);
    const newAlerts: RegressionAlert[] = [];
    
    // Check build duration regression
    const avgBuildDuration = baseline.reduce((sum, m) => sum + m.buildDuration, 0) / baseline.length;
    const buildIncrease = ((currentMetrics.buildDuration - avgBuildDuration) / avgBuildDuration) * 100;
    
    if (buildIncrease > this.config.alertThresholds.buildDuration) {
      newAlerts.push({
        id: `build-duration-${Date.now()}`,
        timestamp: Date.now(),
        severity: buildIncrease > 50 ? 'critical' : 'high',
        type: 'performance',
        metric: 'buildDuration',
        currentValue: currentMetrics.buildDuration,
        baselineValue: avgBuildDuration,
        threshold: this.config.alertThresholds.buildDuration,
        description: `Build duration increased by ${buildIncrease.toFixed(1)}%`,
        recommendation: 'Check for new dependencies, large files, or inefficient build processes',
        commit: currentMetrics.commit,
        branch: currentMetrics.branch,
      });
    }
    
    // Check test duration regression
    const avgTestDuration = baseline.reduce((sum, m) => sum + m.testDuration, 0) / baseline.length;
    const testIncrease = ((currentMetrics.testDuration - avgTestDuration) / avgTestDuration) * 100;
    
    if (testIncrease > this.config.alertThresholds.testDuration) {
      newAlerts.push({
        id: `test-duration-${Date.now()}`,
        timestamp: Date.now(),
        severity: testIncrease > 50 ? 'critical' : 'high',
        type: 'performance',
        metric: 'testDuration',
        currentValue: currentMetrics.testDuration,
        baselineValue: avgTestDuration,
        threshold: this.config.alertThresholds.testDuration,
        description: `Test duration increased by ${testIncrease.toFixed(1)}%`,
        recommendation: 'Review test changes, check for infinite loops, or optimize test setup',
        commit: currentMetrics.commit,
        branch: currentMetrics.branch,
      });
    }
    
    // Check test failure rate
    const avgFailureRate = baseline.reduce((sum, m) => sum + (m.testResults.failed / m.testResults.total), 0) / baseline.length;
    const currentFailureRate = currentMetrics.testResults.failed / currentMetrics.testResults.total;
    const failureIncrease = ((currentFailureRate - avgFailureRate) / avgFailureRate) * 100;
    
    if (failureIncrease > this.config.alertThresholds.testFailureRate) {
      newAlerts.push({
        id: `test-failure-rate-${Date.now()}`,
        timestamp: Date.now(),
        severity: failureIncrease > 20 ? 'critical' : 'high',
        type: 'reliability',
        metric: 'testFailureRate',
        currentValue: currentFailureRate * 100,
        baselineValue: avgFailureRate * 100,
        threshold: this.config.alertThresholds.testFailureRate,
        description: `Test failure rate increased by ${failureIncrease.toFixed(1)}%`,
        recommendation: 'Review failing tests and fix issues before merging',
        commit: currentMetrics.commit,
        branch: currentMetrics.branch,
      });
    }
    
    // Check lint errors
    const avgLintErrors = baseline.reduce((sum, m) => sum + m.lintResults.errors, 0) / baseline.length;
    const lintErrorIncrease = currentMetrics.lintResults.errors - avgLintErrors;
    
    if (lintErrorIncrease > this.config.alertThresholds.lintErrors) {
      newAlerts.push({
        id: `lint-errors-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'medium',
        type: 'quality',
        metric: 'lintErrors',
        currentValue: currentMetrics.lintResults.errors,
        baselineValue: avgLintErrors,
        threshold: this.config.alertThresholds.lintErrors,
        description: `Lint errors increased by ${lintErrorIncrease}`,
        recommendation: 'Fix lint errors to maintain code quality',
        commit: currentMetrics.commit,
        branch: currentMetrics.branch,
      });
    }
    
    // Check coverage drop
    const baselineWithCoverage = baseline.filter(m => m.testResults.coverage !== undefined);
    if (baselineWithCoverage.length > 0 && currentMetrics.testResults.coverage !== undefined) {
      const avgCoverage = baselineWithCoverage.reduce((sum, m) => sum + (m.testResults.coverage || 0), 0) / baselineWithCoverage.length;
      const coverageDrop = avgCoverage - currentMetrics.testResults.coverage;
      
      if (coverageDrop > this.config.alertThresholds.coverageDrop) {
        newAlerts.push({
          id: `coverage-drop-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'medium',
          type: 'quality',
          metric: 'coverage',
          currentValue: currentMetrics.testResults.coverage!,
          baselineValue: avgCoverage,
          threshold: this.config.alertThresholds.coverageDrop,
          description: `Code coverage dropped by ${coverageDrop.toFixed(1)}%`,
          recommendation: 'Add tests to maintain or improve coverage',
          commit: currentMetrics.commit,
          branch: currentMetrics.branch,
        });
      }
    }
    
    // Check stress test regressions if available
    if (currentMetrics.stressTestResults) {
      const stressTestBaseline = baseline
        .filter(m => m.stressTestResults !== undefined)
        .map(m => m.stressTestResults!);
      
      if (stressTestBaseline.length >= 3) {
        await this.checkStressTestRegressions(currentMetrics.stressTestResults!, stressTestBaseline, newAlerts);
      }
    }
    
    this.alerts.push(...newAlerts);
    
    if (newAlerts.length > 0) {
      console.log(`🚨 Detected ${newAlerts.length} regressions:`);
      newAlerts.forEach(alert => {
        console.log(`  ${alert.severity.toUpperCase()}: ${alert.description}`);
      });
    }
  }

  /**
   * Check stress test specific regressions
   */
  private async checkStressTestRegressions(
    currentStressMetrics: StressTestMetrics,
    baselineStressMetrics: StressTestMetrics[],
    newAlerts: RegressionAlert[]
  ): Promise<void> {
    
    // Check stress test duration regression
    const avgStressDuration = baselineStressMetrics.reduce((sum, m) => sum + m.duration, 0) / baselineStressMetrics.length;
    const stressDurationIncrease = ((currentStressMetrics.duration - avgStressDuration) / avgStressDuration) * 100;
    
    if (stressDurationIncrease > this.config.alertThresholds.stressTestDuration) {
      newAlerts.push({
        id: `stress-test-duration-${Date.now()}`,
        timestamp: Date.now(),
        severity: stressDurationIncrease > 50 ? 'critical' : 'high',
        type: 'performance',
        metric: 'stressTestDuration',
        currentValue: currentStressMetrics.duration,
        baselineValue: avgStressDuration,
        threshold: this.config.alertThresholds.stressTestDuration,
        description: `Stress test duration increased by ${stressDurationIncrease.toFixed(1)}%`,
        recommendation: 'Review stress test configuration, check for inefficient simulations, or optimize parallel processing',
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
      });
    }
    
    // Check simulations per second regression
    const baselineWithPerf = baselineStressMetrics.filter(m => m.performance.simulationsPerSecond > 0);
    if (baselineWithPerf.length > 0 && currentStressMetrics.performance.simulationsPerSecond > 0) {
      const avgSimulationsPerSecond = baselineWithPerf.reduce((sum, m) => sum + m.performance.simulationsPerSecond, 0) / baselineWithPerf.length;
      const simsPerSecondDecrease = ((avgSimulationsPerSecond - currentStressMetrics.performance.simulationsPerSecond) / avgSimulationsPerSecond) * 100;
      
      if (simsPerSecondDecrease > this.config.alertThresholds.stressTestSimulationsPerSecond) {
        newAlerts.push({
          id: `stress-test-sims-per-second-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'high',
          type: 'performance',
          metric: 'stressTestSimulationsPerSecond',
          currentValue: currentStressMetrics.performance.simulationsPerSecond,
          baselineValue: avgSimulationsPerSecond,
          threshold: this.config.alertThresholds.stressTestSimulationsPerSecond,
          description: `Stress test simulations per second decreased by ${simsPerSecondDecrease.toFixed(1)}%`,
          recommendation: 'Check for performance bottlenecks in simulation engine or memory allocation issues',
          commit: this.getCurrentCommit(),
          branch: this.getCurrentBranch(),
        });
      }
    }
    
    // Check stress test memory usage regression
    const avgStressMemory = baselineStressMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / baselineStressMetrics.length;
    const stressMemoryIncrease = ((currentStressMetrics.memoryUsage - avgStressMemory) / avgStressMemory) * 100;
    
    if (stressMemoryIncrease > this.config.alertThresholds.stressTestMemoryUsage) {
      newAlerts.push({
        id: `stress-test-memory-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'medium',
        type: 'performance',
        metric: 'stressTestMemoryUsage',
        currentValue: currentStressMetrics.memoryUsage,
        baselineValue: avgStressMemory,
        threshold: this.config.alertThresholds.stressTestMemoryUsage,
        description: `Stress test memory usage increased by ${stressMemoryIncrease.toFixed(1)}%`,
        recommendation: 'Check for memory leaks in stress test engine or optimize data structures',
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
      });
    }
    
    // Check stress test error rate
    const avgStressErrors = baselineStressMetrics.reduce((sum, m) => sum + (m.errors?.count || 0), 0) / baselineStressMetrics.length;
    const currentStressErrors = currentStressMetrics.errors?.count || 0;
    const stressErrorIncrease = currentStressErrors - avgStressErrors;
    
    if (stressErrorIncrease > this.config.alertThresholds.stressTestErrorRate) {
      newAlerts.push({
        id: `stress-test-errors-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'high',
        type: 'reliability',
        metric: 'stressTestErrorRate',
        currentValue: currentStressErrors,
        baselineValue: avgStressErrors,
        threshold: this.config.alertThresholds.stressTestErrorRate,
        description: `Stress test error count increased by ${stressErrorIncrease}`,
        recommendation: 'Review stress test errors and fix simulation engine issues',
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
      });
    }
    
    // Check cache hit rate regression
    const baselineWithCache = baselineStressMetrics.filter(m => m.cacheHitRate > 0);
    if (baselineWithCache.length > 0 && currentStressMetrics.cacheHitRate > 0) {
      const avgCacheHitRate = baselineWithCache.reduce((sum, m) => sum + m.cacheHitRate, 0) / baselineWithCache.length;
      const cacheHitDrop = avgCacheHitRate - currentStressMetrics.cacheHitRate;
      
      if (cacheHitDrop > this.config.alertThresholds.stressTestCacheHitRate) {
        newAlerts.push({
          id: `stress-test-cache-hit-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'medium',
          type: 'performance',
          metric: 'stressTestCacheHitRate',
          currentValue: currentStressMetrics.cacheHitRate,
          baselineValue: avgCacheHitRate,
          threshold: this.config.alertThresholds.stressTestCacheHitRate,
          description: `Stress test cache hit rate dropped by ${cacheHitDrop.toFixed(1)}%`,
          recommendation: 'Check cache configuration or changes in simulation parameters affecting cache efficiency',
          commit: this.getCurrentCommit(),
          branch: this.getCurrentBranch(),
        });
      }
    }
    
    // Check synergy multiplier drift
    const baselineWithSynergy = baselineStressMetrics.filter(m => m.avgSynergyMultiplier > 0);
    if (baselineWithSynergy.length > 0 && currentStressMetrics.avgSynergyMultiplier > 0) {
      const avgSynergyMultiplier = baselineWithSynergy.reduce((sum, m) => sum + m.avgSynergyMultiplier, 0) / baselineWithSynergy.length;
      const synergyDrift = Math.abs(((currentStressMetrics.avgSynergyMultiplier - avgSynergyMultiplier) / avgSynergyMultiplier) * 100);
      
      if (synergyDrift > this.config.alertThresholds.stressTestSynergyDrift) {
        newAlerts.push({
          id: `stress-test-synergy-drift-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'medium',
          type: 'quality',
          metric: 'stressTestSynergyDrift',
          currentValue: currentStressMetrics.avgSynergyMultiplier,
          baselineValue: avgSynergyMultiplier,
          threshold: this.config.alertThresholds.stressTestSynergyDrift,
          description: `Stress test average synergy multiplier drifted by ${synergyDrift.toFixed(1)}%`,
          recommendation: 'Review balancer configuration changes or simulation algorithm modifications',
          commit: this.getCurrentCommit(),
          branch: this.getCurrentBranch(),
        });
      }
    }
  }

  /**
   * Calculate trends from metrics
   */
  private calculateTrends(metrics: CIPipelineMetrics[]): {
    buildDuration: string;
    testDuration: string;
    testFailureRate: string;
    lintErrors: string;
    coverage: string;
    stressTestDuration?: string;
    stressTestSimulationsPerSecond?: string;
    stressTestMemoryUsage?: string;
    stressTestSynergyMultiplier?: string;
  } {
    if (metrics.length < 2) {
      return {
        buildDuration: 'stable',
        testDuration: 'stable',
        testFailureRate: 'stable',
        lintErrors: 'stable',
        coverage: 'stable',
      };
    }
    
    const sorted = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(Math.floor(sorted.length / 2));
    const older = sorted.slice(0, Math.floor(sorted.length / 2));
    
    const calculateTrend = (recent: number[], older: number[]): string => {
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'improving' : 'degrading';
    };
    
    const trends: any = {
      buildDuration: calculateTrend(recent.map(m => m.buildDuration), older.map(m => m.buildDuration)),
      testDuration: calculateTrend(recent.map(m => m.testDuration), older.map(m => m.testDuration)),
      testFailureRate: calculateTrend(recent.map(m => m.testResults.failed / m.testResults.total), older.map(m => m.testResults.failed / m.testResults.total)),
      lintErrors: calculateTrend(recent.map(m => m.lintResults.errors), older.map(m => m.lintResults.errors)),
      coverage: calculateTrend(recent.map(m => m.testResults.coverage || 0).filter(c => c > 0), older.map(m => m.testResults.coverage || 0).filter(c => c > 0)),
    };
    
    // Add stress test trends if available
    const recentStress = recent.filter(m => m.stressTestResults !== undefined).map(m => m.stressTestResults!);
    const olderStress = older.filter(m => m.stressTestResults !== undefined).map(m => m.stressTestResults!);
    
    if (recentStress.length >= 2 && olderStress.length >= 2) {
      trends.stressTestDuration = calculateTrend(
        recentStress.map(m => m.duration),
        olderStress.map(m => m.duration)
      );
      
      const recentPerf = recentStress.filter(m => m.performance.simulationsPerSecond > 0);
      const olderPerf = olderStress.filter(m => m.performance.simulationsPerSecond > 0);
      
      if (recentPerf.length >= 2 && olderPerf.length >= 2) {
        trends.stressTestSimulationsPerSecond = calculateTrend(
          recentPerf.map(m => m.performance.simulationsPerSecond),
          olderPerf.map(m => m.performance.simulationsPerSecond)
        );
      }
      
      trends.stressTestMemoryUsage = calculateTrend(
        recentStress.map(m => m.memoryUsage),
        olderStress.map(m => m.memoryUsage)
      );
      
      const recentSynergy = recentStress.filter(m => m.avgSynergyMultiplier > 0);
      const olderSynergy = olderStress.filter(m => m.avgSynergyMultiplier > 0);
      
      if (recentSynergy.length >= 2 && olderSynergy.length >= 2) {
        trends.stressTestSynergyMultiplier = calculateTrend(
          recentSynergy.map(m => m.avgSynergyMultiplier),
          olderSynergy.map(m => m.avgSynergyMultiplier)
        );
      }
    }
    
    return trends;
  }

  /**
   * Display trends
   */
  private displayTrends(trends: any): void {
    console.log('\n📈 Performance Trends:');
    Object.entries(trends).forEach(([metric, trend]) => {
      const icon = trend === 'improving' ? '📈' : trend === 'degrading' ? '📉' : '➡️';
      console.log(`  ${icon} ${metric}: ${trend}`);
    });
  }

  /**
   * Export trend analysis
   */
  private async exportTrendAnalysis(trends: any, days: number): Promise<void> {
    const filename = `ci-trends-${days}days-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.config.exportPath, filename);
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(trends, null, 2), 'utf8');
    
    console.log(`📊 Trend analysis exported: ${filepath}`);
  }

  /**
   * Check stress testing regressions
   */
  async checkStressTestingRegressions(stressData: any): Promise<void> {
    console.log('[CI Monitor] 🔍 Checking stress testing regressions...');
    
    // Load baseline for comparison
    const baselinePath = './data/ci/baseline.json';
    let baseline: any = null;
    
    try {
      if (await fs.access(baselinePath).then(() => true).catch(() => false)) {
        const baselineData = await fs.readFile(baselinePath, 'utf8');
        baseline = JSON.parse(baselineData);
        console.log('[CI Monitor] 📊 Baseline loaded for comparison');
      } else {
        console.log('[CI Monitor] ⚠️ No baseline found, creating new baseline...');
        await fs.mkdir(path.dirname(baselinePath), { recursive: true });
        await fs.writeFile(baselinePath, JSON.stringify(stressData, null, 2), 'utf8');
        return;
      }
    } catch (error) {
      console.error('[CI Monitor] ❌ Failed to load baseline:', error);
      return;
    }
    
    // Check for regressions
    const regressions = this.analyzeStressTestingRegressions(stressData, baseline);
    
    if (regressions.length > 0) {
      console.log(`[CI Monitor] 🚨 Detected ${regressions.length} stress testing regressions:`);
      regressions.forEach(regression => {
        console.log(`  ❌ ${regression.type}: ${regression.message}`);
        this.alerts.push({
          id: `stress-${Date.now()}`,
          type: 'stress_regression',
          severity: regression.severity,
          metric: regression.type,
          currentValue: regression.metadata.current,
          baselineValue: regression.metadata.baseline,
          threshold: regression.metadata.increase || regression.metadata.decrease || regression.metadata.drift,
          description: regression.message,
          recommendation: this.generateRecommendation(regression),
          commit: process.env.GITHUB_SHA || 'unknown',
          branch: process.env.GITHUB_REF_NAME || 'unknown',
          timestamp: Date.now(),
        });
      });
      
      // Fail CI if critical regressions detected
      const criticalRegressions = regressions.filter(r => r.severity === 'critical');
      if (criticalRegressions.length > 0) {
        console.error(`[CI Monitor] ❌ Critical regressions detected, failing CI...`);
        process.exit(1);
      }
    } else {
      console.log('[CI Monitor] ✅ No stress testing regressions detected');
    }
  }

  /**
   * Analyze stress testing regressions
   */
  private analyzeStressTestingRegressions(current: any, baseline: any): any[] {
    const regressions: any[] = [];
    
    // Performance regressions
    if (current.duration && baseline.duration) {
      const durationIncrease = ((current.duration - baseline.duration) / baseline.duration) * 100;
      if (durationIncrease > 15) { // 15% threshold
        regressions.push({
          type: 'Performance',
          severity: durationIncrease > 30 ? 'critical' : 'high',
          message: `Duration increased by ${durationIncrease.toFixed(1)}% (${current.duration}ms vs ${baseline.duration}ms)`,
          metadata: { current: current.duration, baseline: baseline.duration, increase: durationIncrease },
        });
      }
    }
    
    // Memory usage regressions
    if (current.memoryUsage && baseline.memoryUsage) {
      const memoryIncrease = ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100;
      if (memoryIncrease > 20) { // 20% threshold
        regressions.push({
          type: 'Memory',
          severity: memoryIncrease > 40 ? 'critical' : 'high',
          message: `Memory usage increased by ${memoryIncrease.toFixed(1)}% (${current.memoryUsage}MB vs ${baseline.memoryUsage}MB)`,
          metadata: { current: current.memoryUsage, baseline: baseline.memoryUsage, increase: memoryIncrease },
        });
      }
    }
    
    // Synergy multiplier regressions
    if (current.avgSynergyMultiplier && baseline.avgSynergyMultiplier) {
      const synergyDrift = Math.abs(current.avgSynergyMultiplier - baseline.avgSynergyMultiplier) / baseline.avgSynergyMultiplier * 100;
      if (synergyDrift > 10) { // 10% threshold
        regressions.push({
          type: 'Synergy',
          severity: synergyDrift > 20 ? 'critical' : 'medium',
          message: `Synergy multiplier drifted by ${synergyDrift.toFixed(1)}% (${current.avgSynergyMultiplier} vs ${baseline.avgSynergyMultiplier})`,
          metadata: { current: current.avgSynergyMultiplier, baseline: baseline.avgSynergyMultiplier, drift: synergyDrift },
        });
      }
    }
    
    // Simulation performance regressions
    if (current.performance?.simulationsPerSecond && baseline.performance?.simulationsPerSecond) {
      const perfDecrease = ((baseline.performance.simulationsPerSecond - current.performance.simulationsPerSecond) / baseline.performance.simulationsPerSecond) * 100;
      if (perfDecrease > 15) { // 15% threshold
        regressions.push({
          type: 'Simulation Performance',
          severity: perfDecrease > 30 ? 'critical' : 'high',
          message: `Simulations per second decreased by ${perfDecrease.toFixed(1)}% (${current.performance.simulationsPerSecond} vs ${baseline.performance.simulationsPerSecond})`,
          metadata: { 
            current: current.performance.simulationsPerSecond, 
            baseline: baseline.performance.simulationsPerSecond, 
            decrease: perfDecrease 
          },
        });
      }
    }
    
    return regressions;
  }

  /**
   * Generate stress testing report
   */
  async generateStressTestingReport(stressData: any): Promise<void> {
    console.log('[CI Monitor] 📋 Generating stress testing report...');
    
    const report = this.createStressTestingReport(stressData);
    const filename = `stress-testing-report-${new Date().toISOString().split('T')[0]}.md`;
    const filepath = path.join(this.config.exportPath, filename);
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, report, 'utf8');
    
    console.log(`[CI Monitor] 📄 Stress testing report generated: ${filepath}`);
  }

  /**
   * Create stress testing report content
   */
  private createStressTestingReport(data: any): string {
    const timestamp = new Date().toISOString();
    
    return `# Stress Testing CI Report

**Generated:** ${timestamp}
**Run ID:** ${data.runId || 'unknown'}
**Status:** ${data.status || 'completed'}

## Performance Summary

| Metric | Value |
|--------|-------|
| Duration | ${data.duration || 'N/A'}ms |
| Memory Usage | ${data.memoryUsage || 'N/A'}MB |
| Simulations | ${data.totalSimulations || 'N/A'} |
| Simulations/Second | ${data.performance?.simulationsPerSecond || 'N/A'} |
| Success Rate | ${data.successRate ? `${(data.successRate * 100).toFixed(1)}%` : 'N/A'} |

## Results Summary

| Metric | Value |
|--------|-------|
| Archetypes Generated | ${data.archetypesGenerated || 'N/A'} |
| Pairs Analyzed | ${data.pairsAnalyzed || 'N/A'} |
| Top Synergies | ${data.topSynergies?.length || 'N/A'} |
| Top Weaknesses | ${data.topWeaknesses?.length || 'N/A'} |
| Average Synergy Multiplier | ${data.avgSynergyMultiplier?.toFixed(3) || 'N/A'} |

## Configuration

| Setting | Value |
|---------|-------|
| Iterations | ${data.config?.iterations || 'N/A'} |
| Seed | ${data.config?.seed || 'N/A'} |
| Environment | ${data.config?.environment || 'N/A'} |
| Parallel Jobs | ${data.config?.parallelJobs || 'N/A'} |

## Quality Metrics

${data.qualityMetrics ? `
| Metric | Value | Status |
|--------|-------|--------|
| Data Quality Score | ${data.qualityMetrics.score || 'N/A'} | ${data.qualityMetrics.score > 90 ? '✅ Good' : data.qualityMetrics.score > 70 ? '⚠️ Fair' : '❌ Poor'} |
| Issues Found | ${data.qualityMetrics.issues?.length || 0} | ${data.qualityMetrics.issues?.length === 0 ? '✅ None' : '⚠️ Review'} |
| NaN Values | ${data.qualityMetrics.nanCount || 0} | ${data.qualityMetrics.nanCount === 0 ? '✅ None' : '❌ Detected'} |
| Infinite Values | ${data.qualityMetrics.infCount || 0} | ${data.qualityMetrics.infCount === 0 ? '✅ None' : '❌ Detected'} |
` : 'Quality metrics not available'}

## Recommendations

${this.generateRecommendations(data)}

---
*Generated by CI Regression Monitor*
`;
  }

  /**
   * Generate recommendation based on stress testing regression
   */
  private generateRecommendation(regression: any): string {
    switch (regression.type) {
      case 'Performance':
        return 'Investigate simulation bottlenecks and optimize performance-critical code paths';
      case 'Memory':
        return 'Review memory allocation patterns and consider implementing memory pooling';
      case 'Synergy':
        return 'Review balancing logic changes that may have affected synergy calculations';
      case 'Simulation Performance':
        return 'Optimize simulation algorithms and consider parallel processing improvements';
      default:
        return 'Review recent changes that may have impacted this metric';
    }
  }

  /**
   * Generate recommendations based on stress testing results
   */
  private generateRecommendations(data: any): string {
    const recommendations: string[] = [];
    
    if (data.duration > 30000) {
      recommendations.push('- ⏱️ Consider optimizing simulation performance (duration > 30s)');
    }
    
    if (data.memoryUsage > 1024) {
      recommendations.push('- 🧠 Memory usage is high (>1GB), consider optimization');
    }
    
    if (data.performance?.simulationsPerSecond < 100) {
      recommendations.push('- 🚀 Low simulation throughput, investigate bottlenecks');
    }
    
    if (data.qualityMetrics?.score < 90) {
      recommendations.push('- 🔍 Data quality issues detected, review input data');
    }
    
    if (data.avgSynergyMultiplier && (data.avgSynergyMultiplier < 0.8 || data.avgSynergyMultiplier > 1.3)) {
      recommendations.push('- ⚖️ Synergy multiplier outside expected range, review balancing logic');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- ✅ All metrics look good, no action needed');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): any {
    if (this.metrics.length === 0) {
      return {};
    }
    
    const recent = this.metrics.slice(-10);
    const total = this.metrics.length;
    
    return {
      totalRuns: total,
      recentRuns: recent.length,
      successRate: (recent.filter(m => m.status === 'success').length / recent.length) * 100,
      avgBuildDuration: recent.reduce((sum, m) => sum + m.buildDuration, 0) / recent.length,
      avgTestDuration: recent.reduce((sum, m) => sum + m.testDuration, 0) / recent.length,
      avgTotalDuration: recent.reduce((sum, m) => sum + m.totalDuration, 0) / recent.length,
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      highAlerts: this.alerts.filter(a => a.severity === 'high').length,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical regressions immediately`);
    }
    
    const performanceAlerts = this.alerts.filter(a => a.type === 'performance');
    if (performanceAlerts.length > 3) {
      recommendations.push('Multiple performance regressions detected - consider performance review');
    }
    
    const qualityAlerts = this.alerts.filter(a => a.type === 'quality');
    if (qualityAlerts.length > 2) {
      recommendations.push('Code quality declining - review coding standards and practices');
    }
    
    const reliabilityAlerts = this.alerts.filter(a => a.type === 'reliability');
    if (reliabilityAlerts.length > 0) {
      recommendations.push('Test reliability issues detected - review test suite');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('No significant regressions detected - continue monitoring');
    }
    
    return recommendations;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: any): string {
    let markdown = '# CI Pipeline Regression Report\n\n';
    
    markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    // Summary
    markdown += '## Summary\n\n';
    markdown += `- Total Runs: ${report.summary.totalRuns}\n`;
    markdown += `- Recent Success Rate: ${report.summary.successRate.toFixed(1)}%\n`;
    markdown += `- Avg Build Duration: ${(report.summary.avgBuildDuration / 1000).toFixed(1)}s\n`;
    markdown += `- Avg Test Duration: ${(report.summary.avgTestDuration / 1000).toFixed(1)}s\n`;
    markdown += `- Total Alerts: ${report.summary.totalAlerts}\n`;
    markdown += `- Critical Alerts: ${report.summary.criticalAlerts}\n\n`;
    
    // Alerts
    if (report.alerts.length > 0) {
      markdown += '## Regression Alerts\n\n';
      report.alerts.forEach((alert: RegressionAlert) => {
        markdown += `### ${alert.severity.toUpperCase()}: ${alert.type}\n`;
        markdown += `- **Metric**: ${alert.metric}\n`;
        markdown += `- **Current**: ${alert.currentValue}\n`;
        markdown += `- **Baseline**: ${alert.baselineValue}\n`;
        markdown += `- **Description**: ${alert.description}\n`;
        markdown += `- **Recommendation**: ${alert.recommendation}\n`;
        markdown += `- **Commit**: ${alert.commit}\n\n`;
      });
    }
    
    // Trends
    markdown += '## Performance Trends\n\n';
    Object.entries(report.trends).forEach(([metric, trend]) => {
      const icon = trend === 'improving' ? '📈' : trend === 'degrading' ? '📉' : '➡️';
      markdown += `- ${icon} **${metric}**: ${trend}\n`;
    });
    
    // Recommendations
    markdown += '\n## Recommendations\n\n';
    report.recommendations.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
    
    return markdown;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>CI Pipeline Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .alert { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .high { background: #fff3e0; border-left: 4px solid #ff9800; }
        .medium { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .low { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .trend { margin: 5px 0; }
        .improving { color: #4caf50; }
        .degrading { color: #f44336; }
        .stable { color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CI Pipeline Regression Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <h2>Summary</h2>
    <ul>
        <li>Total Runs: ${report.summary.totalRuns}</li>
        <li>Recent Success Rate: ${report.summary.successRate.toFixed(1)}%</li>
        <li>Avg Build Duration: ${(report.summary.avgBuildDuration / 1000).toFixed(1)}s</li>
        <li>Avg Test Duration: ${(report.summary.avgTestDuration / 1000).toFixed(1)}s</li>
        <li>Total Alerts: ${report.summary.totalAlerts}</li>
        <li>Critical Alerts: ${report.summary.criticalAlerts}</li>
    </ul>
    
    <h2>Regression Alerts</h2>
    ${report.alerts.map((alert: RegressionAlert) => `
        <div class="alert ${alert.severity}">
            <h3>${alert.severity.toUpperCase()}: ${alert.type}</h3>
            <p><strong>Metric:</strong> ${alert.metric}</p>
            <p><strong>Current:</strong> ${alert.currentValue}</p>
            <p><strong>Baseline:</strong> ${alert.baselineValue}</p>
            <p><strong>Description:</strong> ${alert.description}</p>
            <p><strong>Recommendation:</strong> ${alert.recommendation}</p>
            <p><strong>Commit:</strong> ${alert.commit}</p>
        </div>
    `).join('')}
    
    <h2>Performance Trends</h2>
    ${Object.entries(report.trends).map(([metric, trend]) => `
        <div class="trend ${trend}">
            <strong>${metric}:</strong> ${trend}
        </div>
    `).join('')}
    
    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>`;
  }

  /**
   * Send webhook alerts
   */
  private async sendWebhookAlerts(): Promise<void> {
    if (!this.config.webhookUrl) return;
    
    const payload = {
      text: `🚨 CI Pipeline Regression Alert`,
      attachments: this.alerts.map(alert => ({
        color: alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'good',
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Type', value: alert.type, short: true },
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Description', value: alert.description, short: false },
          { title: 'Recommendation', value: alert.recommendation, short: false },
        ],
      })),
    };
    
    // This would send to webhook - implementation depends on webhook service
    console.log('📡 Webhook alerts would be sent here');
  }

  /**
   * Create alert summary
   */
  private async createAlertSummary(): Promise<void> {
    const summary = {
      timestamp: Date.now(),
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      highAlerts: this.alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: this.alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: this.alerts.filter(a => a.severity === 'low').length,
      alerts: this.alerts,
    };
    
    const filename = `ci-alert-summary-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.config.exportPath, filename);
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(summary, null, 2), 'utf8');
    
    console.log(`📋 Alert summary created: ${filepath}`);
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('ci-regression-monitor')
    .description('CI Pipeline Regression Monitor')
    .version('1.0.0')
    .option('--monitor', 'Monitor current CI run')
    .option('--analyze', 'Analyze historical trends')
    .option('--report', 'Generate regression report')
    .option('--alerts', 'Send regression alerts')
    .option('--cleanup', 'Clean up old metrics')
    .option('--format <format>', 'Report format (json, markdown, html)', 'markdown')
    .option('--days <days>', 'Number of days for trend analysis', '30')
    .option('--config <path>', 'Configuration file path')
    .argument('[command]', 'Command to run');

  try {
    await program.parseAsync(process.argv);
    const options = program.opts();
    
    // Load configuration
    let config: Partial<MonitorConfig> = {};
    if (options.config) {
      try {
        const configContent = await fs.readFile(options.config, 'utf8');
        config = JSON.parse(configContent);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }
    }
    
    const monitor = new CIRegressionMonitor(config);
    await monitor.loadMetrics();
    
    if (options.monitor) {
      await monitor.monitorCurrentRun();
    }
    
    if (options.analyze) {
      await monitor.analyzeTrends(parseInt(options.days));
    }
    
    if (options.report) {
      await monitor.generateReport(options.format as any);
    }
    
    if (options.alerts) {
      await monitor.sendAlerts();
    }
    
    if (options.cleanup) {
      await monitor.cleanup();
    }
    
    // Default behavior if no options specified
    if (!options.monitor && !options.analyze && !options.report && !options.alerts && !options.cleanup) {
      await monitor.monitorCurrentRun();
      await monitor.generateReport();
      await monitor.sendAlerts();
    }
    
    // Handle stress testing CI mode
    if (process.env.CI === 'true' && process.env.STRESS_TESTING === 'true') {
      console.log('[CI Monitor] 🧪 Stress Testing CI Mode detected');
      
      // Load stress testing results
      const stressResultPath = './data/stressTesting/ci/latest.json';
      try {
        const stressResults = await fs.readFile(stressResultPath, 'utf8');
        const stressData = JSON.parse(stressResults);
        
        // Check for stress testing regressions
        await monitor.checkStressTestingRegressions(stressData);
        
        // Generate stress testing report
        await monitor.generateStressTestingReport(stressData);
        
        console.log('[CI Monitor] ✅ Stress testing regression check completed');
      } catch (error) {
        console.error('[CI Monitor] ❌ Failed to process stress testing results:', error);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}
