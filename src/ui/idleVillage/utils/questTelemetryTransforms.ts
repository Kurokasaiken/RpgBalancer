/**
 * Quest Telemetry Transforms
 * 
 * Helper utilities for normalizing quest telemetry data and generating NxM matrices
 * for heatmap visualization. Provides data transformation functions following
 * config-first design principles.
 * 
 * @fileoverview Quest telemetry data transformation utilities
 * @module idleVillage/questTelemetryTransforms
 * @since 2026-01-12
 * @author Cascade
 */

import type { AggregatedTelemetry, QuestTelemetryEntry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { 
  QuestTelemetryConfig, 
  QuestRiskBucket
} from '@/balancing/config/idleVillage/questTelemetryConfig';

/**
 * Normalized quest data point for heatmap visualization
 */
export interface NormalizedQuestData {
  /** Quest identifier */
  questId: string;
  /** Quest type */
  questType: string;
  /** Normalized injury percentage (0-100) */
  injuryPercentage: number;
  /** Normalized death percentage (0-100) */
  deathPercentage: number;
  /** Combined risk percentage */
  riskPercentage: number;
  /** Risk bucket */
  riskBucket: QuestRiskBucket | null;
  /** Timestamp */
  timestamp: number;
  /** Success outcome */
  success: boolean;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  column: number;
  /** Cell value (risk percentage) */
  value: number;
  /** Normalized value (0-1) */
  normalizedValue: number;
  /** Risk bucket */
  riskBucket: QuestRiskBucket | null;
  /** Cell color */
  color: string;
  /** Background color */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Tooltip text */
  tooltip: string;
  /** Is cell populated */
  populated: boolean;
  /** Associated quest data */
  questData?: NormalizedQuestData;
}

/**
 * Decision feed item
 */
export interface DecisionFeedItem {
  /** Decision identifier */
  id: string;
  /** Quest identifier */
  questId: string;
  /** Decision type */
  type: 'accept' | 'reject' | 'defer';
  /** Decision outcome */
  outcome: 'success' | 'failure' | 'pending';
  /** Confidence score (0-1) */
  confidence: number;
  /** Risk percentage at time of decision */
  riskPercentage: number;
  /** Decision timestamp */
  timestamp: number;
  /** Decision reason */
  reason: string;
  /** Quest type */
  questType: string;
}

/**
 * Transformed telemetry data for visualization
 */
export interface TransformedTelemetryData {
  /** Normalized quest data points */
  normalizedQuests: NormalizedQuestData[];
  /** Heatmap matrix */
  heatmapMatrix: HeatmapCell[][];
  /** Decision feed items */
  decisionFeed: DecisionFeedItem[];
  /** Statistics */
  statistics: {
    totalQuests: number;
    successRate: number;
    averageRisk: number;
    averageConfidence: number;
    riskDistribution: Record<string, number>;
  };
}

/**
 * Normalize percentage values to 0-100 range
 * 
 * @param value - Raw percentage value
 * @param min - Minimum expected value
 * @param max - Maximum expected value
 * @returns Normalized percentage (0-100)
 */
export function normalizePercentage(
  value: number,
  min: number = 0,
  max: number = 100
): number {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Clamp value to specified range
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate combined risk percentage from injury and death
 * 
 * @param injuryPercentage - Injury percentage (0-100)
 * @param deathPercentage - Death percentage (0-100)
 * @param weights - Weights for combining (default: injury 0.6, death 0.4)
 * @returns Combined risk percentage (0-100)
 */
export function calculateCombinedRisk(
  injuryPercentage: number,
  deathPercentage: number,
  weights: { injury: number; death: number } = { injury: 0.6, death: 0.4 }
): number {
  const totalWeight = weights.injury + weights.death;
  const normalizedWeights = {
    injury: weights.injury / totalWeight,
    death: weights.death / totalWeight,
  };
  
  return (injuryPercentage * normalizedWeights.injury) + 
         (deathPercentage * normalizedWeights.death);
}

/**
 * Normalize quest telemetry entry to standard format
 * 
 * @param entry - Raw quest telemetry entry
 * @param config - Quest telemetry configuration
 * @returns Normalized quest data
 */
export function normalizeQuestEntry(
  entry: QuestTelemetryEntry,
  config: QuestTelemetryConfig
): NormalizedQuestData {
  // Extract telemetry data from quest result
  const telemetry = entry.result.telemetryData;
  
  // Calculate risk percentages based on quest outcome and telemetry
  const successRate = entry.result.success ? 100 : 0;
  const failureRate = 100 - successRate;
  
  // Use telemetry data to estimate risk factors
  const injuryPercentage = normalizePercentage(
    (telemetry?.failurePoints?.length ?? 0) > 0 ? failureRate * 0.7 : failureRate * 0.3
  );
  const deathPercentage = normalizePercentage(
    failureRate * 0.2 // Assume 20% of failures result in death
  );
  
  const riskPercentage = calculateCombinedRisk(injuryPercentage, deathPercentage);
  const riskBucket = config.riskBuckets.find(
    bucket => riskPercentage >= bucket.minThreshold && riskPercentage < bucket.maxThreshold
  ) || null;

  return {
    questId: entry.questId,
    questType: 'standard', // Default quest type since not in QuestResult
    injuryPercentage,
    deathPercentage,
    riskPercentage,
    riskBucket,
    timestamp: entry.timestamp,
    success: entry.result.success,
    confidence: entry.result.success ? 0.8 : 0.3, // Confidence based on success
  };
}

/**
 * Generate heatmap matrix from normalized quest data
 * 
 * @param questData - Array of normalized quest data
 * @param config - Quest telemetry configuration
 * @returns Heatmap matrix (NxM)
 */
export function generateHeatmapMatrix(
  questData: NormalizedQuestData[],
  config: QuestTelemetryConfig
): HeatmapCell[][] {
  const { rows, columns } = config.heatmap.grid;
  const matrix: HeatmapCell[][] = [];

  // Initialize empty matrix
  for (let row = 0; row < rows; row++) {
    matrix[row] = [];
    for (let col = 0; col < columns; col++) {
      matrix[row][col] = {
        row,
        column: col,
        value: 0,
        normalizedValue: 0,
        riskBucket: null,
        color: config.heatmap.colors.defaultBackground,
        backgroundColor: config.heatmap.colors.defaultBackground,
        borderColor: config.heatmap.colors.defaultBorder,
        tooltip: 'No data',
        populated: false,
      };
    }
  }

  // Populate matrix with quest data
  questData.forEach((quest, index) => {
    if (index >= rows * columns) return; // Matrix full

    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const normalizedValue = clampValue(
      quest.riskPercentage / 100,
      config.thresholds.display.minCellOpacity,
      config.thresholds.display.maxCellOpacity
    );

    matrix[row][col] = {
      row,
      column: col,
      value: quest.riskPercentage,
      normalizedValue,
      riskBucket: quest.riskBucket,
      color: quest.riskBucket?.color || config.heatmap.colors.defaultBackground,
      backgroundColor: quest.riskBucket?.backgroundColor || config.heatmap.colors.defaultBackground,
      borderColor: quest.riskBucket?.borderColor || config.heatmap.colors.defaultBorder,
      tooltip: `${quest.questType} - ${quest.riskBucket?.label || 'Unknown'}: ${quest.riskPercentage.toFixed(1)}% risk`,
      populated: true,
      questData: quest,
    };
  });

  return matrix;
}

/**
 * Generate decision feed from quest data
 * 
 * @param questData - Array of normalized quest data
 * @param config - Quest telemetry configuration
 * @returns Decision feed items
 */
export function generateDecisionFeed(
  questData: NormalizedQuestData[],
  config: QuestTelemetryConfig
): DecisionFeedItem[] {
  const maxDecisions = config.decisionFeed.display.maxDecisions;
  
  // Sort by timestamp (most recent first) and take latest decisions
  const recentQuests = questData
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxDecisions);

  return recentQuests.map((quest, index) => ({
    id: `decision-${quest.questId}-${index}`,
    questId: quest.questId,
    type: quest.success ? 'accept' : 'reject',
    outcome: quest.success ? 'success' : 'failure',
    confidence: quest.confidence,
    riskPercentage: quest.riskPercentage,
    timestamp: quest.timestamp,
    reason: quest.success ? 'Quest accepted and completed' : 'Quest rejected or failed',
    questType: quest.questType,
  }));
}

/**
 * Calculate telemetry statistics
 * 
 * @param questData - Array of normalized quest data
 * @param config - Quest telemetry configuration
 * @returns Statistics object
 */
export function calculateStatistics(
  questData: NormalizedQuestData[],
  config: QuestTelemetryConfig
): TransformedTelemetryData['statistics'] {
  if (questData.length === 0) {
    return {
      totalQuests: 0,
      successRate: 0,
      averageRisk: 0,
      averageConfidence: 0,
      riskDistribution: {},
    };
  }

  const totalQuests = questData.length;
  const successfulQuests = questData.filter(q => q.success).length;
  const successRate = successfulQuests / totalQuests;
  const averageRisk = questData.reduce((sum, q) => sum + q.riskPercentage, 0) / totalQuests;
  const averageConfidence = questData.reduce((sum, q) => sum + q.confidence, 0) / totalQuests;

  // Calculate risk distribution
  const riskDistribution: Record<string, number> = {};
  config.riskBuckets.forEach(bucket => {
    riskDistribution[bucket.id] = questData.filter(q => 
      q.riskPercentage >= bucket.minThreshold && q.riskPercentage < bucket.maxThreshold
    ).length;
  });

  return {
    totalQuests,
    successRate,
    averageRisk,
    averageConfidence,
    riskDistribution,
  };
}

/**
 * Transform aggregated telemetry data for visualization
 * 
 * @param telemetry - Aggregated telemetry data
 * @param config - Quest telemetry configuration
 * @returns Transformed telemetry data
 */
export function transformTelemetryData(
  telemetry: AggregatedTelemetry,
  config: QuestTelemetryConfig
): TransformedTelemetryData {
  // Normalize quest entries
  const normalizedQuests = telemetry.recentQuests.map(entry => 
    normalizeQuestEntry(entry, config)
  );

  // Generate heatmap matrix
  const heatmapMatrix = generateHeatmapMatrix(normalizedQuests, config);

  // Generate decision feed
  const decisionFeed = generateDecisionFeed(normalizedQuests, config);

  // Calculate statistics
  const statistics = calculateStatistics(normalizedQuests, config);

  return {
    normalizedQuests,
    heatmapMatrix,
    decisionFeed,
    statistics,
  };
}

/**
 * Get cell color based on value and configuration
 * 
 * @param value - Cell value (0-100)
 * @param config - Quest telemetry configuration
 * @returns Color string
 */
export function getCellColor(value: number, config: QuestTelemetryConfig): string {
  const bucket = config.riskBuckets.find(
    b => value >= b.minThreshold && value < b.maxThreshold
  );
  return bucket?.color || config.heatmap.colors.defaultBackground;
}

/**
 * Format tooltip text for heatmap cell
 * 
 * @param cell - Heatmap cell data
 * @param config - Quest telemetry configuration
 * @returns Formatted tooltip text
 */
export function formatTooltip(cell: HeatmapCell, _config: QuestTelemetryConfig): string {
  if (!cell.populated || !cell.questData) {
    return 'No data available';
  }

  const { questData } = cell;
  const time = new Date(questData.timestamp).toLocaleTimeString();
  
  return [
    `Quest: ${questData.questType}`,
    `Risk: ${questData.riskPercentage.toFixed(1)}%`,
    `Injury: ${questData.injuryPercentage.toFixed(1)}%`,
    `Death: ${questData.deathPercentage.toFixed(1)}%`,
    `Outcome: ${questData.success ? 'Success' : 'Failure'}`,
    `Confidence: ${(questData.confidence * 100).toFixed(0)}%`,
    `Time: ${time}`,
  ].join('\n');
}

/**
 * Validate transformed data integrity
 * 
 * @param data - Transformed telemetry data
 * @returns True if data is valid
 */
export function validateTransformedData(data: TransformedTelemetryData): boolean {
  const { normalizedQuests, heatmapMatrix, decisionFeed, statistics } = data;

  // Check basic structure
  if (!Array.isArray(normalizedQuests) || 
      !Array.isArray(heatmapMatrix) || 
      !Array.isArray(decisionFeed) ||
      !statistics) {
    return false;
  }

  // Check matrix dimensions
  if (heatmapMatrix.length === 0) return true; // Empty matrix is valid
  
  const expectedColumns = heatmapMatrix[0].length;
  for (const row of heatmapMatrix) {
    if (!Array.isArray(row) || row.length !== expectedColumns) {
      return false;
    }
  }

  // Check normalized quest data structure
  for (const quest of normalizedQuests) {
    if (!quest.questId || 
        typeof quest.riskPercentage !== 'number' ||
        typeof quest.timestamp !== 'number') {
      return false;
    }
  }

  return true;
}

export default {
  normalizePercentage,
  clampValue,
  calculateCombinedRisk,
  normalizeQuestEntry,
  generateHeatmapMatrix,
  generateDecisionFeed,
  calculateStatistics,
  transformTelemetryData,
  getCellColor,
  formatTooltip,
  validateTransformedData,
};
