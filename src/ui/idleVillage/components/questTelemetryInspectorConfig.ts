/**
 * Quest Telemetry Inspector Configuration
 *
 * Default configuration and constants for the Quest Telemetry Inspector component.
 * Separated to avoid React refresh issues with component exports.
 */

/**
 * Inspector configuration options
 */
export interface QuestTelemetryInspectorConfig {
  showEventTimeline: boolean;
  showPerformanceMetrics: boolean;
  showBranchAnalysis: boolean;
  showQuestTypeBreakdown: boolean;
  enableAdvancedFiltering: boolean;
  enableExport: boolean;
  maxEvents: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

/**
 * Default inspector configuration
 */
export const DEFAULT_INSPECTOR_CONFIG: QuestTelemetryInspectorConfig = {
  showEventTimeline: true,
  showPerformanceMetrics: true,
  showBranchAnalysis: true,
  showQuestTypeBreakdown: true,
  enableAdvancedFiltering: true,
  enableExport: true,
  maxEvents: 1000,
  autoRefresh: false,
  refreshInterval: 5000,
};
