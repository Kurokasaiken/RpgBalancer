/**
 * Evidence Log Analyzer - NP-147
 * 
 * Analyzes Coordinator evidence logs and verifies consistency with KS-005 mandate.
 * 
 * @since 2026-01-24
 * @author Trace-Coordinator
 */

import { z } from 'zod';

export const ConsistencyThresholdSchema = z.object({
  minCompletionRate: z.number().min(0).max(1),
  maxErrorRate: z.number().min(0).max(1),
  minEvidenceQuality: z.number().min(0).max(100),
  maxResponseTime: z.number().min(0),
});

export const TimeWindowSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  durationMs: z.number(),
});

export const EvidenceLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  promptId: z.string(),
  agentName: z.string(),
  status: z.enum(['completed', 'failed', 'pending', 'cancelled']),
  duration: z.number(),
  evidenceFile: z.string().optional(),
  errorMessage: z.string().optional(),
  qualityScore: z.number().optional(),
});

export const ConsistencyCheckResultSchema = z.object({
  checkId: z.string(),
  checkName: z.string(),
  passed: z.boolean(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const AnalysisReportSchema = z.object({
  timestamp: z.number(),
  window: TimeWindowSchema,
  totalEntries: z.number(),
  completedEntries: z.number(),
  failedEntries: z.number(),
  completionRate: z.number(),
  errorRate: z.number(),
  averageQualityScore: z.number(),
  averageResponseTime: z.number(),
  checks: z.array(ConsistencyCheckResultSchema),
  summary: z.object({
    isConsistent: z.boolean(),
    consistencyScore: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
  }),
});

export type ConsistencyThreshold = z.infer<typeof ConsistencyThresholdSchema>;
export type TimeWindow = z.infer<typeof TimeWindowSchema>;
export type EvidenceLogEntry = z.infer<typeof EvidenceLogEntrySchema>;
export type ConsistencyCheckResult = z.infer<typeof ConsistencyCheckResultSchema>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const DEFAULT_CONSISTENCY_THRESHOLD: ConsistencyThreshold = {
  minCompletionRate: 0.9,
  maxErrorRate: 0.1,
  minEvidenceQuality: 80,
  maxResponseTime: 300000,
};

export class EvidenceLogAnalyzer {
  private threshold: ConsistencyThreshold;

  constructor(threshold: ConsistencyThreshold = DEFAULT_CONSISTENCY_THRESHOLD) {
    this.threshold = threshold;
  }

  public analyze(entries: EvidenceLogEntry[], window: TimeWindow): AnalysisReport {
    const filteredEntries = this.filterByWindow(entries, window);
    const checks: ConsistencyCheckResult[] = [];

    const totalEntries = filteredEntries.length;
    const completedEntries = filteredEntries.filter(e => e.status === 'completed').length;
    const failedEntries = filteredEntries.filter(e => e.status === 'failed').length;
    const completionRate = totalEntries > 0 ? completedEntries / totalEntries : 0;
    const errorRate = totalEntries > 0 ? failedEntries / totalEntries : 0;

    const qualityScores = filteredEntries
      .filter(e => e.qualityScore !== undefined)
      .map(e => e.qualityScore!);
    const averageQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    const responseTimes = filteredEntries.map(e => e.duration);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    checks.push(this.checkCompletionRate(completionRate));
    checks.push(this.checkErrorRate(errorRate));
    checks.push(this.checkEvidenceQuality(averageQualityScore));
    checks.push(this.checkResponseTime(averageResponseTime));
    checks.push(this.checkEvidenceFiles(filteredEntries));

    const passedChecks = checks.filter(c => c.passed).length;
    const consistencyScore = (passedChecks / checks.length) * 100;
    const isConsistent = checks.filter(c => c.severity === 'error' && !c.passed).length === 0;

    const recommendations = this.generateRecommendations(checks, {
      completionRate,
      errorRate,
      averageQualityScore,
      averageResponseTime,
    });

    return {
      timestamp: Date.now(),
      window,
      totalEntries,
      completedEntries,
      failedEntries,
      completionRate,
      errorRate,
      averageQualityScore,
      averageResponseTime,
      checks,
      summary: {
        isConsistent,
        consistencyScore,
        recommendations,
      },
    };
  }

  private filterByWindow(entries: EvidenceLogEntry[], window: TimeWindow): EvidenceLogEntry[] {
    return entries.filter(e => e.timestamp >= window.startTime && e.timestamp <= window.endTime);
  }

  private checkCompletionRate(rate: number): ConsistencyCheckResult {
    const passed = rate >= this.threshold.minCompletionRate;
    return {
      checkId: 'completion-rate',
      checkName: 'Completion Rate',
      passed,
      severity: 'error',
      message: passed
        ? `Completion rate (${(rate * 100).toFixed(1)}%) meets threshold (${(this.threshold.minCompletionRate * 100).toFixed(1)}%)`
        : `Completion rate (${(rate * 100).toFixed(1)}%) below threshold (${(this.threshold.minCompletionRate * 100).toFixed(1)}%)`,
      details: { rate, threshold: this.threshold.minCompletionRate },
    };
  }

  private checkErrorRate(rate: number): ConsistencyCheckResult {
    const passed = rate <= this.threshold.maxErrorRate;
    return {
      checkId: 'error-rate',
      checkName: 'Error Rate',
      passed,
      severity: 'warning',
      message: passed
        ? `Error rate (${(rate * 100).toFixed(1)}%) within threshold (${(this.threshold.maxErrorRate * 100).toFixed(1)}%)`
        : `Error rate (${(rate * 100).toFixed(1)}%) exceeds threshold (${(this.threshold.maxErrorRate * 100).toFixed(1)}%)`,
      details: { rate, threshold: this.threshold.maxErrorRate },
    };
  }

  private checkEvidenceQuality(score: number): ConsistencyCheckResult {
    const passed = score >= this.threshold.minEvidenceQuality;
    return {
      checkId: 'evidence-quality',
      checkName: 'Evidence Quality',
      passed,
      severity: 'warning',
      message: passed
        ? `Average quality score (${score.toFixed(1)}) meets threshold (${this.threshold.minEvidenceQuality})`
        : `Average quality score (${score.toFixed(1)}) below threshold (${this.threshold.minEvidenceQuality})`,
      details: { score, threshold: this.threshold.minEvidenceQuality },
    };
  }

  private checkResponseTime(time: number): ConsistencyCheckResult {
    const passed = time <= this.threshold.maxResponseTime;
    return {
      checkId: 'response-time',
      checkName: 'Response Time',
      passed,
      severity: 'info',
      message: passed
        ? `Average response time (${(time / 1000).toFixed(1)}s) within threshold (${(this.threshold.maxResponseTime / 1000).toFixed(1)}s)`
        : `Average response time (${(time / 1000).toFixed(1)}s) exceeds threshold (${(this.threshold.maxResponseTime / 1000).toFixed(1)}s)`,
      details: { time, threshold: this.threshold.maxResponseTime },
    };
  }

  private checkEvidenceFiles(entries: EvidenceLogEntry[]): ConsistencyCheckResult {
    const completedEntries = entries.filter(e => e.status === 'completed');
    const entriesWithEvidence = completedEntries.filter(e => e.evidenceFile);
    const evidenceRate = completedEntries.length > 0
      ? entriesWithEvidence.length / completedEntries.length
      : 0;
    const passed = evidenceRate >= 0.95;

    return {
      checkId: 'evidence-files',
      checkName: 'Evidence Files',
      passed,
      severity: 'warning',
      message: passed
        ? `Evidence file rate (${(evidenceRate * 100).toFixed(1)}%) is adequate`
        : `Evidence file rate (${(evidenceRate * 100).toFixed(1)}%) is below 95%`,
      details: { evidenceRate, completedEntries: completedEntries.length, entriesWithEvidence: entriesWithEvidence.length },
    };
  }

  private generateRecommendations(
    checks: ConsistencyCheckResult[],
    metrics: {
      completionRate: number;
      errorRate: number;
      averageQualityScore: number;
      averageResponseTime: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => !c.passed);

    if (failedChecks.length === 0) {
      recommendations.push('✅ All consistency checks passed');
      return recommendations;
    }

    for (const check of failedChecks) {
      if (check.severity === 'error') {
        recommendations.push(`❌ CRITICAL: ${check.message}`);
      } else if (check.severity === 'warning') {
        recommendations.push(`⚠️ WARNING: ${check.message}`);
      }
    }

    if (metrics.completionRate < 0.9) {
      recommendations.push('💡 Review failed prompts and identify common issues');
    }

    if (metrics.errorRate > 0.1) {
      recommendations.push('💡 Investigate error patterns and implement preventive measures');
    }

    if (metrics.averageQualityScore < 80) {
      recommendations.push('💡 Improve evidence documentation quality and completeness');
    }

    if (metrics.averageResponseTime > 300000) {
      recommendations.push('💡 Optimize prompt execution time and reduce bottlenecks');
    }

    return recommendations;
  }

  public generateMarkdownReport(report: AnalysisReport): string {
    const lines: string[] = [];

    lines.push('# Coordinator Evidence Log Consistency Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date(report.timestamp).toISOString()}`);
    lines.push(`**Window:** ${new Date(report.window.startTime).toISOString()} - ${new Date(report.window.endTime).toISOString()}`);
    lines.push(`**Duration:** ${(report.window.durationMs / 1000 / 60).toFixed(1)} minutes`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Entries:** ${report.totalEntries}`);
    lines.push(`- **Completed:** ${report.completedEntries}`);
    lines.push(`- **Failed:** ${report.failedEntries}`);
    lines.push(`- **Completion Rate:** ${(report.completionRate * 100).toFixed(1)}%`);
    lines.push(`- **Error Rate:** ${(report.errorRate * 100).toFixed(1)}%`);
    lines.push(`- **Average Quality:** ${report.averageQualityScore.toFixed(1)}`);
    lines.push(`- **Average Response Time:** ${(report.averageResponseTime / 1000).toFixed(1)}s`);
    lines.push(`- **Consistency Score:** ${report.summary.consistencyScore.toFixed(1)}%`);
    lines.push(`- **Consistent:** ${report.summary.isConsistent ? '✅ Yes' : '❌ No'}`);
    lines.push('');

    if (report.summary.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of report.summary.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    lines.push('## Consistency Checks');
    lines.push('');
    lines.push('| Check | Status | Severity | Message |');
    lines.push('|-------|--------|----------|---------|');

    for (const check of report.checks) {
      const status = check.passed ? '✅ Pass' : '❌ Fail';
      lines.push(`| ${check.checkName} | ${status} | ${check.severity} | ${check.message} |`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Generated by Trace-Coordinator Evidence QA (NP-147)*');

    return lines.join('\n');
  }
}

export function createAnalyzer(threshold?: ConsistencyThreshold): EvidenceLogAnalyzer {
  return new EvidenceLogAnalyzer(threshold);
}
