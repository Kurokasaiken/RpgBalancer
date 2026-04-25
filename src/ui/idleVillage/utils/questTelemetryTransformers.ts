/**
 * Quest Telemetry Data Transformation Helpers
 *
 * Utilities for transforming quest telemetry data into various formats
 * suitable for visualization, analysis, and export.
 */

import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { BranchOutcome } from '@/engine/quest/types';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Transformed quest data interfaces
 */

export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
  intensity: number;
  metadata?: Record<string, unknown>;
}

export interface TimelineDataPoint {
  timestamp: number;
  value: number;
  label: string;
  category: string;
  success: boolean;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface DecisionPattern {
  choice: string;
  count: number;
  successRate: number;
  averageChoiceTime: number;
  frequency: number;
  questTypes: string[];
  outcomes: Array<{
    success: boolean;
    count: number;
    description?: string;
  }>;
}

export interface QuestTypeMetrics {
  questTypeId: string;
  questTypeLabel: string;
  totalQuests: number;
  successfulQuests: number;
  successRate: number;
  averageDuration: number;
  averageChoiceTime: number;
  heroicMoments: number;
  totalBranches: number;
  commonChoices: Array<{ choice: string; count: number }>;
  difficultyScore: number;
  engagementScore: number;
}

export interface TimeSeriesData {
  timestamp: number;
  period: string;
  totalQuests: number;
  successRate: number;
  averageDuration: number;
  uniquePlayers: number;
  heroicMoments: number;
}

export interface ExportFormat {
  format: 'json' | 'csv' | 'markdown' | 'excel';
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

function isSuccessfulOutcome(outcome: BranchOutcome): boolean {
  const resultFlag = outcome.metadata?.result || outcome.metadata?.branchResult;
  return resultFlag === 'success';
}

/**
 * Configuration for transformation operations
 */
export interface TransformationConfig {
  normalizeValues?: boolean;
  smoothingWindow?: number;
  aggregationPeriod?: 'hour' | 'day' | 'week' | 'month';
  includeMetadata?: boolean;
  roundValues?: number;
  filterThreshold?: number;
  sortResults?: boolean;
}

/**
 * Default transformation configuration
 */
export const DEFAULT_TRANSFORMATION_CONFIG: TransformationConfig = {
  normalizeValues: true,
  smoothingWindow: 3,
  aggregationPeriod: 'hour',
  includeMetadata: true,
  roundValues: 2,
  filterThreshold: 0.01,
  sortResults: true,
};

/**
 * Transform telemetry data for heatmap visualization
 */
export function transformToHeatmapData(
  telemetry: AggregatedTelemetry,
  questTypeDefinitions: Record<string, QuestTypeDefinition>,
  config: TransformationConfig = {}
): HeatmapDataPoint[] {
  const finalConfig = { ...DEFAULT_TRANSFORMATION_CONFIG, ...config };
  const dataPoints: HeatmapDataPoint[] = [];

  // Create grid data for quest types vs success rates
  Object.entries(telemetry.questTypeBreakdown).forEach(([questTypeId, count]) => {
    const definition = questTypeDefinitions[questTypeId];
    if (!definition) return;

    // Calculate success rate for this quest type
    const typeEntries = telemetry.recentQuests.filter(entry => {
      const entryDefinition = Object.values(questTypeDefinitions).find(def =>
        def.matchers?.some(matcher =>
          matcher.includes?.some(needle => entry.questId.includes(needle.toLowerCase()))
        )
      );
      return entryDefinition?.id === questTypeId;
    });

    const successful = typeEntries.filter(entry => entry.result.success).length;
    const successRate = typeEntries.length > 0 ? successful / typeEntries.length : 0;
    const averageDuration = typeEntries.length > 0
      ? typeEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0) / typeEntries.length
      : 0;

    // Normalize values if requested
    const normalizedCount = finalConfig.normalizeValues
      ? count / Math.max(...Object.values(telemetry.questTypeBreakdown))
      : count;

    const roundedCount = finalConfig.roundValues
      ? Math.round(normalizedCount * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : normalizedCount;

    if (roundedCount >= finalConfig.filterThreshold) {
      dataPoints.push({
        x: definition.label,
        y: 'Count',
        value: count,
        intensity: roundedCount,
        metadata: {
          questTypeId,
          successRate,
          averageDuration,
          totalEntries: typeEntries.length,
        },
      });

      dataPoints.push({
        x: definition.label,
        y: 'Success Rate',
        value: successRate,
        intensity: successRate,
        metadata: {
          questTypeId,
          count,
          averageDuration,
          totalEntries: typeEntries.length,
        },
      });

      dataPoints.push({
        x: definition.label,
        y: 'Avg Duration',
        value: averageDuration,
        intensity: Math.min(averageDuration / 300, 1), // Normalize to 5 minutes max
        metadata: {
          questTypeId,
          count,
          successRate,
          totalEntries: typeEntries.length,
        },
      });
    }
  });

  return finalConfig.sortResults
    ? dataPoints.sort((a, b) => b.intensity - a.intensity)
    : dataPoints;
}

/**
 * Transform telemetry data for timeline visualization
 */
export function transformToTimelineData(
  telemetry: AggregatedTelemetry,
  config: TransformationConfig = {}
): TimelineDataPoint[] {
  const finalConfig = { ...DEFAULT_TRANSFORMATION_CONFIG, ...config };
  const timelineData: TimelineDataPoint[] = [];

  telemetry.recentQuests.forEach((entry) => {
    const value = entry.result.success ? 1 : 0;
    const normalizedValue = finalConfig.normalizeValues ? value : value;

    timelineData.push({
      timestamp: entry.timestamp,
      value: normalizedValue,
      label: entry.questId,
      category: entry.result.success ? 'Success' : 'Failure',
      success: entry.result.success,
      duration: entry.result.durationSeconds,
      metadata: finalConfig.includeMetadata ? {
        sessionId: entry.sessionId,
        branchCount: entry.result.branchDecisions.length,
        heroicMoments: entry.result.telemetryData?.heroicMoments,
      } : undefined,
    });
  });

  return finalConfig.sortResults
    ? timelineData.sort((a, b) => b.timestamp - a.timestamp)
    : timelineData;
}

/**
 * Analyze decision patterns from telemetry data
 */
export function analyzeDecisionPatterns(
  telemetry: AggregatedTelemetry,
  questTypeDefinitions: Record<string, QuestTypeDefinition>,
  config: TransformationConfig = {}
): DecisionPattern[] {
  const finalConfig = { ...DEFAULT_TRANSFORMATION_CONFIG, ...config };
  const patterns: Record<string, DecisionPattern> = {};

  // Group decisions by choice
  telemetry.branchDecisions.forEach((decision) => {
    const choice = decision.outcome.metadata?.choiceMade || 'Unknown';
    const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
    const success = isSuccessfulOutcome(decision.outcome);

    if (!patterns[choice]) {
      patterns[choice] = {
        choice,
        count: 0,
        successRate: 0,
        averageChoiceTime: 0,
        frequency: 0,
        questTypes: [],
        outcomes: [],
      };
    }

    const pattern = patterns[choice];
    pattern.count++;
    pattern.averageChoiceTime = (pattern.averageChoiceTime * (pattern.count - 1) + choiceTime) / pattern.count;

    // Track quest types
    const definition = Object.values(questTypeDefinitions).find(def =>
      def.matchers?.some(matcher =>
        matcher.includes?.some(needle => decision.phaseId.includes(needle.toLowerCase()))
      )
    );
    if (definition && !pattern.questTypes.includes(definition.id)) {
      pattern.questTypes.push(definition.id);
    }

    // Track outcomes
    const existingOutcome = pattern.outcomes.find(o => o.success === success);
    if (existingOutcome) {
      existingOutcome.count++;
    } else {
      pattern.outcomes.push({
        success,
        count: 1,
        description: decision.outcome.metadata?.narrativeSummary,
      });
    }
  });

  // Calculate final metrics
  const totalDecisions = telemetry.branchDecisions.length;
  Object.values(patterns).forEach((pattern) => {
    const successfulOutcomes = pattern.outcomes.find(o => o.success)?.count || 0;
    pattern.successRate = pattern.count > 0 ? successfulOutcomes / pattern.count : 0;
    pattern.frequency = totalDecisions > 0 ? pattern.count / totalDecisions : 0;
  });

  const result = Object.values(patterns);

  // Apply filtering and rounding
  const filteredResult = result
    .filter(pattern => pattern.frequency >= finalConfig.filterThreshold)
    .map(pattern => ({
      ...pattern,
      successRate: finalConfig.roundValues
        ? Math.round(pattern.successRate * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
        : pattern.successRate,
      averageChoiceTime: finalConfig.roundValues
        ? Math.round(pattern.averageChoiceTime * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
        : pattern.averageChoiceTime,
      frequency: finalConfig.roundValues
        ? Math.round(pattern.frequency * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
        : pattern.frequency,
    }));

  return finalConfig.sortResults
    ? filteredResult.sort((a, b) => b.frequency - a.frequency)
    : filteredResult;
}

/**
 * Calculate comprehensive metrics for each quest type
 */
export function calculateQuestTypeMetrics(
  telemetry: AggregatedTelemetry,
  questTypeDefinitions: Record<string, QuestTypeDefinition>,
  config: TransformationConfig = {}
): QuestTypeMetrics[] {
  const finalConfig = { ...DEFAULT_TRANSFORMATION_CONFIG, ...config };
  const metrics: QuestTypeMetrics[] = [];

  Object.entries(telemetry.questTypeBreakdown).forEach(([questTypeId, count]) => {
    const definition = questTypeDefinitions[questTypeId];
    if (!definition) return;

    // Filter entries for this quest type
    const typeEntries = telemetry.recentQuests.filter(entry => {
      const entryDefinition = Object.values(questTypeDefinitions).find(def =>
        def.matchers?.some(matcher =>
          matcher.includes?.some(needle => entry.questId.includes(needle.toLowerCase()))
        )
      );
      return entryDefinition?.id === questTypeId;
    });

    const successfulQuests = typeEntries.filter(entry => entry.result.success).length;
    const successRate = typeEntries.length > 0 ? successfulQuests / typeEntries.length : 0;
    const averageDuration = typeEntries.length > 0
      ? typeEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0) / typeEntries.length
      : 0;

    // Calculate average choice time
    const typeDecisions = telemetry.branchDecisions.filter(decision => {
      const decisionDefinition = Object.values(questTypeDefinitions).find(def =>
        def.matchers?.some(matcher =>
          matcher.includes?.some(needle => decision.phaseId.includes(needle.toLowerCase()))
        )
      );
      return decisionDefinition?.id === questTypeId;
    });

    const choiceTimes = typeDecisions
      .map(d => (d.outcome.metadata?.lastChoiceTime as number) || 0)
      .filter(t => t > 0);
    const averageChoiceTime = choiceTimes.length > 0
      ? choiceTimes.reduce((a, b) => a + b, 0) / choiceTimes.length
      : 0;

    const heroicMoments = typeEntries.reduce(
      (sum, entry) => sum + (entry.result.telemetryData?.heroicMoments ?? 0),
      0
    );

    // Calculate common choices
    const choiceCounts: Record<string, number> = {};
    typeDecisions.forEach(decision => {
      const choice = decision.outcome.metadata?.choiceMade || 'Unknown';
      choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
    });
    const commonChoices = Object.entries(choiceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([choice, count]) => ({ choice, count }));

    // Calculate difficulty and engagement scores
    const difficultyScore = calculateDifficultyScore(successRate, averageDuration, heroicMoments);
    const engagementScore = calculateEngagementScore(count, averageChoiceTime, heroicMoments);

    metrics.push({
      questTypeId,
      questTypeLabel: definition.label,
      totalQuests: count,
      successfulQuests,
      successRate,
      averageDuration,
      averageChoiceTime,
      heroicMoments,
      totalBranches: typeDecisions.length,
      commonChoices,
      difficultyScore,
      engagementScore,
    });
  });

  const roundedMetrics = metrics.map(metric => ({
    ...metric,
    successRate: finalConfig.roundValues
      ? Math.round(metric.successRate * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : metric.successRate,
    averageDuration: finalConfig.roundValues
      ? Math.round(metric.averageDuration * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : metric.averageDuration,
    averageChoiceTime: finalConfig.roundValues
      ? Math.round(metric.averageChoiceTime * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : metric.averageChoiceTime,
    difficultyScore: finalConfig.roundValues
      ? Math.round(metric.difficultyScore * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : metric.difficultyScore,
    engagementScore: finalConfig.roundValues
      ? Math.round(metric.engagementScore * Math.pow(10, finalConfig.roundValues)) / Math.pow(10, finalConfig.roundValues)
      : metric.engagementScore,
  }));

  return finalConfig.sortResults
    ? roundedMetrics.sort((a, b) => b.totalQuests - a.totalQuests)
    : roundedMetrics;
}

/**
 * Transform telemetry data into time series format
 */
export function transformToTimeSeries(
  telemetry: AggregatedTelemetry,
  config: TransformationConfig = {}
): TimeSeriesData[] {
  const finalConfig = { ...DEFAULT_TRANSFORMATION_CONFIG, ...config };
  const timeSeriesData: Record<string, TimeSeriesData> = {};

  telemetry.recentQuests.forEach((entry) => {
    const date = new Date(entry.timestamp);
    let period: string;

    switch (finalConfig.aggregationPeriod) {
      case 'hour':
        period = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        period = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().slice(0, 10);
        break;
      }
      case 'month': {
        period = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      }
      default:
        period = date.toISOString().slice(0, 10);
    }

    if (!timeSeriesData[period]) {
      timeSeriesData[period] = {
        timestamp: date.getTime(),
        period,
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        uniquePlayers: new Set<string>().size,
        heroicMoments: 0,
      };
    }

    const data = timeSeriesData[period];
    data.totalQuests++;
    data.heroicMoments += entry.result.telemetryData?.heroicMoments ?? 0;
    
    // Track unique players (using session ID as proxy)
    if (entry.sessionId) {
      const uniquePlayers = new Set(Object.keys(timeSeriesData).flatMap(p => 
        telemetry.recentQuests
          .filter(e => new Date(e.timestamp).toISOString().slice(0, finalConfig.aggregationPeriod === 'hour' ? 13 : 10) === p)
          .map(e => e.sessionId)
      ));
      data.uniquePlayers = uniquePlayers.size;
    }
  });

  // Calculate derived metrics
  Object.values(timeSeriesData).forEach((data) => {
    const periodEntries = telemetry.recentQuests.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      let entryPeriod: string;

      switch (finalConfig.aggregationPeriod) {
        case 'hour': {
          entryPeriod = entryDate.toISOString().slice(0, 13);
          break;
        }
        case 'day': {
          entryPeriod = entryDate.toISOString().slice(0, 10);
          break;
        }
        case 'week': {
          const weekStart = new Date(entryDate);
          weekStart.setDate(entryDate.getDate() - entryDate.getDay());
          entryPeriod = weekStart.toISOString().slice(0, 10);
          break;
        }
        case 'month': {
          entryPeriod = entryDate.toISOString().slice(0, 7);
          break;
        }
        default: {
          entryPeriod = entryDate.toISOString().slice(0, 10);
          break;
        }
      }

      return entryPeriod === data.period;
    });

    const successful = periodEntries.filter(entry => entry.result.success).length;
    data.successRate = periodEntries.length > 0 ? successful / periodEntries.length : 0;
    data.averageDuration = periodEntries.length > 0
      ? periodEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0) / periodEntries.length
      : 0;
  });

  const result = Object.values(timeSeriesData);

  return finalConfig.sortResults
    ? result.sort((a, b) => a.timestamp - b.timestamp)
    : result;
}

/**
 * Export telemetry data in various formats
 */
export function exportTelemetryData(
  telemetry: AggregatedTelemetry,
  format: ExportFormat['format'],
  questTypeDefinitions?: Record<string, QuestTypeDefinition>
): ExportFormat {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `quest-telemetry-${timestamp}`;

  switch (format) {
    case 'json': {
      return {
        format: 'json',
        data: JSON.stringify({
          exportTimestamp: new Date().toISOString(),
          telemetry,
          questTypeDefinitions,
        }, null, 2),
        filename: `${filename}.json`,
        mimeType: 'application/json',
      };
    }

    case 'csv': {
      const csvData = convertToCSV(telemetry, questTypeDefinitions);
      return {
        format: 'csv',
        data: csvData,
        filename: `${filename}.csv`,
        mimeType: 'text/csv',
      };
    }

    case 'markdown': {
      const markdownData = convertToMarkdown(telemetry, questTypeDefinitions);
      return {
        format: 'markdown',
        data: markdownData,
        filename: `${filename}.md`,
        mimeType: 'text/markdown',
      };
    }

    case 'excel': {
      // This would require a library like xlsx
      // For now, return CSV as fallback
      const excelData = convertToCSV(telemetry, questTypeDefinitions);
      return {
        format: 'excel',
        data: excelData,
        filename: `${filename}.csv`,
        mimeType: 'application/vnd.ms-excel',
      };
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Helper functions
 */

function calculateDifficultyScore(successRate: number, averageDuration: number, heroicMoments: number): number {
  // Lower success rate = higher difficulty
  // Longer duration = higher difficulty
  // More heroic moments = higher difficulty (indicates challenging situations)
  const successFactor = 1 - successRate;
  const durationFactor = Math.min(averageDuration / 300, 1); // Normalize to 5 minutes
  const heroicFactor = Math.min(heroicMoments / 10, 1); // Normalize to 10 heroic moments
  
  return (successFactor * 0.4 + durationFactor * 0.3 + heroicFactor * 0.3) * 10;
}

function calculateEngagementScore(totalQuests: number, averageChoiceTime: number, heroicMoments: number): number {
  // More quests = higher engagement
  // Faster choices = higher engagement (more decisive)
  // More heroic moments = higher engagement
  const questFactor = Math.min(totalQuests / 50, 1); // Normalize to 50 quests
  const choiceFactor = averageChoiceTime > 0 ? Math.max(0, 1 - averageChoiceTime / 10) : 0; // Faster is better
  const heroicFactor = Math.min(heroicMoments / 20, 1); // Normalize to 20 heroic moments
  
  return (questFactor * 0.5 + choiceFactor * 0.3 + heroicFactor * 0.2) * 10;
}

function convertToCSV(
  telemetry: AggregatedTelemetry,
  _questTypeDefinitions?: Record<string, QuestTypeDefinition>
): string {
  const headers = [
    'Timestamp',
    'Quest ID',
    'Success',
    'Duration (s)',
    'Branch Count',
    'Heroic Moments',
    'Session ID',
  ];

  const rows = telemetry.recentQuests.map(entry => [
    new Date(entry.timestamp).toISOString(),
    entry.questId,
    entry.result.success.toString(),
    entry.result.durationSeconds.toString(),
    entry.result.branchDecisions.length.toString(),
    (entry.result.telemetryData?.heroicMoments ?? 0).toString(),
    entry.sessionId,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertToMarkdown(
  telemetry: AggregatedTelemetry,
  questTypeDefinitions?: Record<string, QuestTypeDefinition>
): string {
  let markdown = `# Quest Telemetry Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Total Quests**: ${telemetry.totalQuests}\n`;
  markdown += `- **Success Rate**: ${(telemetry.successRate * 100).toFixed(1)}%\n`;
  markdown += `- **Average Duration**: ${telemetry.averageDuration.toFixed(1)}s\n`;
  markdown += `- **Total Branches**: ${telemetry.totalBranches}\n`;
  markdown += `- **Heroic Moments**: ${telemetry.heroicMoments}\n\n`;

  // Quest type breakdown
  if (questTypeDefinitions && Object.keys(telemetry.questTypeBreakdown).length > 0) {
    markdown += `## Quest Type Breakdown\n\n`;
    markdown += `| Quest Type | Count | Percentage |\n`;
    markdown += `|------------|-------|------------|\n`;

    Object.entries(telemetry.questTypeBreakdown).forEach(([questTypeId, count]) => {
      const definition = questTypeDefinitions[questTypeId];
      const percentage = (count / telemetry.totalQuests) * 100;
      markdown += `| ${definition?.label || questTypeId} | ${count} | ${percentage.toFixed(1)}% |\n`;
    });
    markdown += `\n`;
  }

  // Recent decisions
  if (telemetry.branchDecisions.length > 0) {
    markdown += `## Recent Decisions\n\n`;
    markdown += `| Timestamp | Phase | Choice | Success | Duration |\n`;
    markdown += `|----------|-------|--------|---------|----------|\n`;

    telemetry.branchDecisions.slice(0, 10).forEach(decision => {
      const timestamp = new Date(decision.timestamp).toLocaleString();
      const choice = decision.outcome.metadata?.choiceMade || 'Unknown';
      const success = isSuccessfulOutcome(decision.outcome) ? '✅' : '❌';
      const duration = ((decision.outcome.metadata?.lastChoiceTime as number) || 0).toFixed(1);
      markdown += `| ${timestamp} | ${decision.phaseId} | ${choice} | ${success} | ${duration}s |\n`;
    });
  }

  return markdown;
}

/**
 * Apply smoothing to data series
 */
export function applySmoothing(data: number[], windowSize: number): number[] {
  if (windowSize <= 1 || data.length === 0) return data;

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length, i + halfWindow + 1);
    const window = data.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothed.push(average);
  }

  return smoothed;
}

/**
 * Normalize values to 0-1 range
 */
export function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (max === min) return values.map(() => 0.5);
  
  return values.map(value => (value - min) / (max - min));
}

/**
 * Calculate percentiles for data series
 */
export function calculatePercentiles(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const percentiles = [0, 25, 50, 75, 100];
  
  return percentiles.map(p => {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  });
}
