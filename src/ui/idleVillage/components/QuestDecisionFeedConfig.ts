/**
 * Quest Decision Feed Configuration
 * 
 * Configuration constants and types for the Quest Decision Feed component.
 * Separated to avoid react-refresh/only-export-components issues.
 */

/**
 * Decision feed configuration interface
 */
export interface QuestDecisionFeedConfig {
  maxItems: number;
  autoRefresh: boolean;
  refreshInterval: number;
  showTimestamps: boolean;
  showQuestTypes: boolean;
  showChoiceTimes: boolean;
  showOutcomes: boolean;
  enableFiltering: boolean;
  enableSorting: boolean;
  enableSearch: boolean;
  groupByQuest: boolean;
  highlightHeroic: boolean;
  compactMode: boolean;
}

/**
 * Default decision feed configuration
 */
export const DEFAULT_DECISION_FEED_CONFIG: QuestDecisionFeedConfig = {
  maxItems: 50,
  autoRefresh: true,
  refreshInterval: 5000,
  showTimestamps: true,
  showQuestTypes: true,
  showChoiceTimes: true,
  showOutcomes: true,
  enableFiltering: true,
  enableSorting: true,
  enableSearch: true,
  groupByQuest: false,
  highlightHeroic: true,
  compactMode: false,
};

/**
 * Decision analytics interface
 */
export interface DecisionAnalytics {
  totalDecisions: number;
  averageChoiceTime: number;
  quickDecisions: number; // < 2 seconds
  slowDecisions: number; // > 10 seconds
  heroicDecisions: number;
  successRate: number;
  questTypeDistribution: Record<string, number>;
  hourlyActivity: Record<number, number>;
}

/**
 * Decision item interface
 */
export interface QuestDecisionItem {
  id: string;
  questId: string;
  questName: string;
  questType: string;
  decision: string;
  outcome: 'success' | 'failure' | 'partial';
  choiceTime: number;
  timestamp: number;
  residentId?: string;
  isHeroic?: boolean;
  metadata?: Record<string, any>;
}
