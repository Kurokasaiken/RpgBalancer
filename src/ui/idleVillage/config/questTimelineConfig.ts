/**
 * Quest Timeline Heatmap Configuration for Idle Village
 * 
 * Config-first settings for timeline visualization of quest decisions,
 * risk indicators, and outcome markers. Follows Gilded Observatory theme.
 * 
 * @since NP-032 – Idle Village Quest Timeline Heatmap
 */

import { z } from 'zod';

/**
 * Quest decision outcome types
 */
export type QuestOutcome = 
  | 'success'
  | 'failure'
  | 'partial_success'
  | 'abandoned'
  | 'pending';

/**
 * Risk level categories for quest decisions
 */
export type QuestRiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Quest decision data structure
 */
export interface QuestDecision {
  /** Unique identifier for the decision */
  id: string;
  /** Quest identifier */
  questId: string;
  /** Turn number when decision was made */
  turn: number;
  /** Timestamp of decision */
  timestamp: number;
  /** Decision description or choice made */
  decision: string;
  /** Outcome of the decision */
  outcome: QuestOutcome;
  /** Risk level at time of decision */
  riskLevel: QuestRiskLevel;
  /** Resident who made the decision (optional) */
  residentId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Timeline scale configuration
 */
export interface TimelineScale {
  /** Minimum turn number to display */
  minTurn: number;
  /** Maximum turn number to display */
  maxTurn: number;
  /** Number of turns per heatmap column */
  turnsPerColumn: number;
  /** Timeline zoom level (0.5 = zoomed out, 2.0 = zoomed in) */
  zoomLevel: number;
  /** Whether to show turn numbers on axis */
  showTurnNumbers: boolean;
  /** Format for turn labels */
  turnLabelFormat: 'numeric' | 'abbreviated' | 'full';
}

/**
 * Heatmap color configuration
 */
export interface HeatmapColors {
  /** Color scheme for risk levels */
  risk: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  /** Color scheme for outcomes */
  outcome: {
    success: string;
    failure: string;
    partial_success: string;
    abandoned: string;
    pending: string;
  };
  /** Background and border colors */
  background: string;
  border: string;
  grid: string;
  text: string;
  /** Hover overlay colors */
  hover: {
    overlay: string;
    text: string;
  };
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  /** Whether tooltips are enabled */
  enabled: boolean;
  /** Tooltip show delay in milliseconds */
  showDelay: number;
  /** Tooltip hide delay in milliseconds */
  hideDelay: number;
  /** Maximum tooltip width in pixels */
  maxWidth: number;
  /** Fields to display in tooltip */
  fields: {
    turn: boolean;
    quest: boolean;
    decision: boolean;
    outcome: boolean;
    risk: boolean;
    resident: boolean;
    timestamp: boolean;
  };
  /** Tooltip positioning */
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/**
 * Performance and interaction settings
 */
export interface InteractionConfig {
  /** Whether zoom/pan is enabled */
  enableZoomPan: boolean;
  /** Maximum zoom level */
  maxZoomLevel: number;
  /** Minimum zoom level */
  minZoomLevel: number;
  /** Animation duration in milliseconds */
  animationDuration: number;
  /** Whether to show loading indicator */
  showLoadingIndicator: boolean;
  /** Debounce delay for interactions in milliseconds */
  interactionDebounce: number;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Whether export is enabled */
  enabled: boolean;
  /** Supported export formats */
  formats: ('png' | 'svg' | 'json' | 'csv')[];
  /** Default export format */
  defaultFormat: 'png' | 'svg' | 'json' | 'csv';
  /** Export quality for image formats */
  imageQuality: number;
  /** Whether to include metadata in exports */
  includeMetadata: boolean;
}

/**
 * Complete quest timeline heatmap configuration
 */
export interface QuestTimelineConfig {
  /** Timeline scale and display settings */
  timeline: TimelineScale;
  /** Color scheme configuration */
  colors: HeatmapColors;
  /** Tooltip behavior and content */
  tooltip: TooltipConfig;
  /** User interaction settings */
  interaction: InteractionConfig;
  /** Export functionality */
  export: ExportConfig;
  /** Risk threshold values */
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  /** Performance settings */
  performance: {
    maxDecisionsPerColumn: number;
    enableVirtualization: boolean;
    debounceDelay: number;
  };
}

/**
 * Zod schema for quest timeline configuration validation
 */
export const QuestTimelineConfigSchema = z.object({
  timeline: z.object({
    minTurn: z.number().min(0),
    maxTurn: z.number().min(1),
    turnsPerColumn: z.number().min(1).max(100),
    zoomLevel: z.number().min(0.1).max(5.0),
    showTurnNumbers: z.boolean(),
    turnLabelFormat: z.enum(['numeric', 'abbreviated', 'full']),
  }),
  colors: z.object({
    risk: z.object({
      low: z.string(),
      medium: z.string(),
      high: z.string(),
      critical: z.string(),
    }),
    outcome: z.object({
      success: z.string(),
      failure: z.string(),
      partial_success: z.string(),
      abandoned: z.string(),
      pending: z.string(),
    }),
    background: z.string(),
    border: z.string(),
    grid: z.string(),
    text: z.string(),
    hover: z.object({
      overlay: z.string(),
      text: z.string(),
    }),
  }),
  tooltip: z.object({
    enabled: z.boolean(),
    showDelay: z.number().min(0),
    hideDelay: z.number().min(0),
    maxWidth: z.number().min(100),
    fields: z.object({
      turn: z.boolean(),
      quest: z.boolean(),
      decision: z.boolean(),
      outcome: z.boolean(),
      risk: z.boolean(),
      resident: z.boolean(),
      timestamp: z.boolean(),
    }),
    position: z.enum(['top', 'bottom', 'left', 'right', 'auto']),
  }),
  interaction: z.object({
    enableZoomPan: z.boolean(),
    maxZoomLevel: z.number().min(1.0),
    minZoomLevel: z.number().min(0.1),
    animationDuration: z.number().min(0),
    showLoadingIndicator: z.boolean(),
    interactionDebounce: z.number().min(0),
  }),
  export: z.object({
    enabled: z.boolean(),
    formats: z.array(z.enum(['png', 'svg', 'json', 'csv'])),
    defaultFormat: z.enum(['png', 'svg', 'json', 'csv']),
    imageQuality: z.number().min(0.1).max(1.0),
    includeMetadata: z.boolean(),
  }),
  riskThresholds: z.object({
    low: z.number().min(0),
    medium: z.number().min(0),
    high: z.number().min(0),
    critical: z.number().min(0),
  }),
  performance: z.object({
    maxDecisionsPerColumn: z.number().min(1),
    enableVirtualization: z.boolean(),
    debounceDelay: z.number().min(0),
  }),
});

/**
 * Default quest timeline heatmap configuration
 * Follows Gilded Observatory theme with gold/bronze color palette
 */
export const DEFAULT_QUEST_TIMELINE_CONFIG: QuestTimelineConfig = {
  timeline: {
    minTurn: 1,
    maxTurn: 100,
    turnsPerColumn: 5,
    zoomLevel: 1.0,
    showTurnNumbers: true,
    turnLabelFormat: 'numeric',
  },
  colors: {
    risk: {
      low: 'rgb(34, 197, 94)',      // green-500
      medium: 'rgb(251, 191, 36)',  // amber-400  
      high: 'rgb(249, 115, 22)',    // orange-500
      critical: 'rgb(239, 68, 68)', // red-500
    },
    outcome: {
      success: 'rgb(34, 197, 94)',        // green-500
      failure: 'rgb(239, 68, 68)',        // red-500
      partial_success: 'rgb(251, 191, 36)', // amber-400
      abandoned: 'rgb(107, 114, 128)',     // gray-500
      pending: 'rgb(156, 163, 175)',       // gray-400
    },
    background: 'rgb(30, 41, 59)',      // slate-800
    border: 'rgb(71, 85, 105)',         // slate-600
    grid: 'rgba(71, 85, 105, 0.3)',     // slate-600 with opacity
    text: 'rgb(241, 245, 249)',         // slate-50
    hover: {
      overlay: 'rgba(251, 191, 36, 0.2)', // amber-400 with opacity
      text: 'rgb(30, 41, 59)',             // slate-800
    },
  },
  tooltip: {
    enabled: true,
    showDelay: 300,
    hideDelay: 200,
    maxWidth: 300,
    fields: {
      turn: true,
      quest: true,
      decision: true,
      outcome: true,
      risk: true,
      resident: true,
      timestamp: false,
    },
    position: 'auto',
  },
  interaction: {
    enableZoomPan: true,
    maxZoomLevel: 3.0,
    minZoomLevel: 0.5,
    animationDuration: 200,
    showLoadingIndicator: true,
    interactionDebounce: 100,
  },
  export: {
    enabled: true,
    formats: ['png', 'svg', 'json', 'csv'],
    defaultFormat: 'png',
    imageQuality: 0.9,
    includeMetadata: true,
  },
  riskThresholds: {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
  },
  performance: {
    maxDecisionsPerColumn: 50,
    enableVirtualization: true,
    debounceDelay: 50,
  },
};

/**
 * Configuration storage key
 */
export const QUEST_TIMELINE_CONFIG_KEY = 'idle_village_quest_timeline_config';

/**
 * Helper function to get risk color based on level and config
 */
export function getRiskColor(riskLevel: QuestRiskLevel, config: QuestTimelineConfig): string {
  return config.colors.risk[riskLevel];
}

/**
 * Helper function to get outcome color based on outcome and config
 */
export function getOutcomeColor(outcome: QuestOutcome, config: QuestTimelineConfig): string {
  return config.colors.outcome[outcome];
}

/**
 * Helper function to calculate risk level from numerical risk value
 */
export function calculateRiskLevel(riskValue: number, config: QuestTimelineConfig): QuestRiskLevel {
  if (riskValue >= config.riskThresholds.critical) return 'critical';
  if (riskValue >= config.riskThresholds.high) return 'high';
  if (riskValue >= config.riskThresholds.medium) return 'medium';
  return 'low';
}

/**
 * Helper function to format turn label based on configuration
 */
export function formatTurnLabel(turn: number, format: TimelineScale['turnLabelFormat']): string {
  switch (format) {
    case 'abbreviated':
      return `T${turn}`;
    case 'full':
      return `Turn ${turn}`;
    case 'numeric':
    default:
      return turn.toString();
  }
}
