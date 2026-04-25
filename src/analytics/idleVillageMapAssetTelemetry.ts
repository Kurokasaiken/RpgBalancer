/**
 * Idle Village Map Asset Consistency Telemetry
 * 
 * Handles telemetry events for map asset consistency checks including
 * execution metrics, validation results, and performance data.
 */

import type { ConsistencyReport, AssetReport } from '@/scripts/idleVillage/mapAssetConsistency';

/** Telemetry event data for map asset consistency runs */
export interface MapAssetConsistencyTelemetry {
  /** Event type identifier */
  eventType: 'map_asset_consistency_run';
  /** Timestamp when the event occurred */
  timestamp: string;
  /** Execution context information */
  context: {
n    /** CLI options used */
    options: {
n      autoOpenReport?: boolean;
n      outputPath?: string;
n      severity?: 'error' | 'warning' | 'info';
n      verbose?: boolean;
n    };
n    /** Node.js version */
n    nodeVersion: string;
n    /** Platform information */
n    platform: string;
n    /** Project root directory */
n    projectRoot: string;
n  };
n  /** Performance metrics */
n  performance: {
n    /** Total execution time in milliseconds */
n    totalDurationMs: number;
n    /** Time per asset in milliseconds */
n    avgTimePerAssetMs: number;
n    /** Registry loading time in milliseconds */
n    registryLoadTimeMs: number;
n    /** Report generation time in milliseconds */
n    reportGenerationTimeMs: number;
n  };
n  /** Summary of validation results */
n  summary: {
n    /** Total number of assets checked */
n    totalAssets: number;
n    /** Number of valid assets */
n    validAssets: number;
n    /** Number of errors found */
n    errorCount: number;
n    /** Number of warnings found */
n    warningCount: number;
n    /** Number of info messages found */
n    infoCount: number;
n    /** Overall consistency score (0-100) */
n    consistencyScore: number;
n  };
n  /** Asset-level details */
n  assets: Array<{
n    id: string;
n    type: string;
n    status: 'valid' | 'error' | 'warning' | 'info';
n    issueCount: number;
n    severityScore: number;
n  }>;
n  /** Most common issues */
n  topIssues: Array<{
n    code: string;
n    count: number;
n    severity: 'error' | 'warning' | 'info';
n    exampleMessage: string;
n  }>;
n}

/** Performance timer for measuring execution phases */
class PerformanceTimer {
  private startTime: number;
  private phases: Map<string, number> = new Map();

  constructor() {
n    this.startTime = Date.now();
n  }

  /** Mark the end of a phase */
n  markPhase(phaseName: string): void {
n    const now = Date.now();
n    this.phases.set(phaseName, now - this.startTime);
n    this.startTime = now;
n  }

  /** Get the duration of a specific phase */
n  getPhaseDuration(phaseName: string): number {
n    return this.phases.get(phaseName) || 0;
n  }

  /** Get total duration since timer creation */
n  getTotalDuration(): number {
n    return Array.from(this.phases.values()).reduce((sum, duration) => sum + duration, 0);
n  }
}

/** Calculate consistency score based on validation results */
function calculateConsistencyScore(report: ConsistencyReport): number {
n  const { totalAssets, errorCount, warningCount, infoCount } = report.summary;
n  if (totalAssets === 0) return 100;

n  // Weight different issue types
n  const errorWeight = 10;
n  const warningWeight = 3;
n  const infoWeight = 1;
n  
n  const totalDeductions = (errorCount * errorWeight) + (warningCount * warningWeight) + (infoCount * infoWeight);
n  const maxPossibleDeductions = totalAssets * errorWeight;
n  
n  const score = Math.max(0, 100 - (totalDeductions / maxPossibleDeductions * 100));
n  return Math.round(score);
n}

/** Extract top issues from validation results */
function extractTopIssues(assets: AssetReport[]): MapAssetConsistencyTelemetry['topIssues'] {
n  const issueCounts = new Map<string, { count: number; severity: 'error' | 'warning' | 'info'; example: string }>();

n  for (const asset of assets) {
n    for (const issue of asset.issues) {
n      const existing = issueCounts.get(issue.code);
n      if (existing) {
n        existing.count++;
n      } else {
n        issueCounts.set(issue.code, {
n          count: 1,
n          severity: issue.severity,
n          example: issue.message,
n        });
n      }
n    }
n  }

n  return Array.from(issueCounts.entries())
n    .map(([code, data]) => ({
n      code,
n      count: data.count,
n      severity: data.severity,
n      exampleMessage: data.example,
n    }))
n    .sort((a, b) => b.count - a.count)
n    .slice(0, 5); // Top 5 issues
}

/** Emit telemetry event for map asset consistency check */
export async function emitMapAssetConsistencyTelemetry(
n  report: ConsistencyReport,
n  options: MapAssetConsistencyTelemetry['context']['options'],
n  performance: PerformanceTimer
n): Promise<void> {
n  try {
n    const telemetry: MapAssetConsistencyTelemetry = {
n      eventType: 'map_asset_consistency_run',
n      timestamp: report.timestamp,
n      context: {
n        options,
n        nodeVersion: process.version,
n        platform: process.platform,
n        projectRoot: process.cwd(),
n      },
n      performance: {
n        totalDurationMs: performance.getTotalDuration(),
n        avgTimePerAssetMs: performance.getTotalDuration() / report.assets.length,
n        registryLoadTimeMs: performance.getPhaseDuration('registry-load'),
n        reportGenerationTimeMs: performance.getPhaseDuration('report-generation'),
n      },
n      summary: {
n        totalAssets: report.summary.totalAssets,
n        validAssets: report.summary.validAssets,
n        errorCount: report.summary.errorCount,
n        warningCount: report.summary.warningCount,
n        infoCount: report.summary.infoCount,
n        consistencyScore: calculateConsistencyScore(report),
n      },
n      assets: report.assets.map(asset => ({
n        id: asset.id,
n        type: asset.type,
n        status: asset.status,
n        issueCount: asset.issues.length,
n        severityScore: asset.issues.reduce((score, issue) => {
n          return score + (issue.severity === 'error' ? 10 : issue.severity === 'warning' ? 3 : 1);
n        }, 0),
n      })),
n      topIssues: extractTopIssues(report.assets),
n    };

n    // Log telemetry to console for now (in production would send to analytics service)
n    console.log('📊 Telemetry Event:', JSON.stringify(telemetry, null, 2));

n    // TODO: Send to analytics service when available
n    // await analyticsService.track('map_asset_consistency_run', telemetry);

n  } catch (error) {
n    console.error('❌ Failed to emit telemetry:', error);
n    // Don't throw - telemetry failures shouldn't break the main functionality
n  }
}

/** Create performance timer for consistency check */
export function createPerformanceTimer(): PerformanceTimer {
n  return new PerformanceTimer();
}

/** Validate telemetry data structure */
export function validateTelemetryData(telemetry: MapAssetConsistencyTelemetry): boolean {
n  try {
n    // Check required fields
n    const requiredFields = ['eventType', 'timestamp', 'context', 'performance', 'summary', 'assets', 'topIssues'];
n    for (const field of requiredFields) {
n      if (!(field in telemetry)) {
n        return false;
n      }
n    }

n    // Validate event type
n    if (telemetry.eventType !== 'map_asset_consistency_run') {
n      return false;
n    }

n    // Validate timestamp format
n    const timestamp = new Date(telemetry.timestamp);
n    if (isNaN(timestamp.getTime())) {
n      return false;
n    }

n    // Validate summary ranges
n    if (telemetry.summary.consistencyScore < 0 || telemetry.summary.consistencyScore > 100) {
n      return false;
n    }

n    return true;
n  } catch {
n    return false;
n  }
}

/** Export telemetry data to file for debugging */
export async function exportTelemetryData(
n  telemetry: MapAssetConsistencyTelemetry,
n  outputPath: string
n): Promise<void> {
n  try {
n    const { writeFileSync } = await import('fs');
n    const { join } = await import('path');
n    \n    const telemetryPath = join(outputPath.replace('.md', '-telemetry.json'));
n    writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2), 'utf-8');
n    console.log(`📈 Telemetry data exported: ${telemetryPath}`);
n  } catch (error) {
n    console.error('❌ Failed to export telemetry data:', error);
n  }
}
