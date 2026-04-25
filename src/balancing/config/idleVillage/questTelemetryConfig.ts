/**
 * Quest Telemetry Configuration
 *
 * Config-first design for quest telemetry heatmap visualization and decision feed.
 * Defines bucket ranges, color schemes, thresholds, and display parameters.
 * 
 * @fileoverview Configuration for quest telemetry visualization components
 * @module idleVillage/questTelemetryConfig
 * @since 2026-01-12
 * @author Cascade
 */

import type { QuestTypeDefinition } from './types';

/**
 * Risk bucket definition for categorizing quest outcomes
 */
export interface QuestRiskBucket {
  /** Bucket identifier */
  id: string;
  /** Display label for the bucket */
  label: string;
  /** Minimum percentage threshold (inclusive) */
  minThreshold: number;
  /** Maximum percentage threshold (exclusive) */
  maxThreshold: number;
  /** Color for visualization (hex or rgb) */
  color: string;
  /** Background color for cells */
  backgroundColor: string;
  /** Border color for cells */
  borderColor: string;
  /** Description for tooltips */
  description: string;
  /** Priority for sorting (lower = higher priority) */
  priority: number;
}

/**
 * Heatmap display configuration
 */
export interface HeatmapDisplayConfig {
  /** Grid dimensions */
  grid: {
    /** Number of rows in the heatmap */
    rows: number;
    /** Number of columns in the heatmap */
    columns: number;
    /** Cell size in pixels */
    cellSize: number;
    /** Gap between cells in pixels */
    gap: number;
    /** Border radius for cells */
    borderRadius: number;
  };
  /** Color scheme for the heatmap */
  colors: {
    /** Default cell background */
    defaultBackground: string;
    /** Default cell border */
    defaultBorder: string;
    /** Hover state background */
    hoverBackground: string;
    /** Focus state border */
    focusBorder: string;
    /** Selected state background */
    selectedBackground: string;
  };
  /** Animation settings */
  animation: {
    /** Enable animations */
    enabled: boolean;
    /** Animation duration in milliseconds */
    duration: number;
    /** Animation easing function */
    easing: string;
    /** Stagger delay between cells in milliseconds */
    staggerDelay: number;
  };
  /** Tooltip configuration */
  tooltip: {
    /** Show tooltips on hover */
    enabled: boolean;
    /** Tooltip background color */
    backgroundColor: string;
    /** Tooltip text color */
    textColor: string;
    /** Tooltip border color */
    borderColor: string;
    /** Tooltip border radius */
    borderRadius: number;
    /** Tooltip padding in pixels */
    padding: number;
    /** Tooltip font size */
    fontSize: string;
    /** Tooltip delay in milliseconds */
    delay: number;
  };
}

/**
 * Decision feed configuration
 */
export interface DecisionFeedConfig {
  /** Feed display settings */
  display: {
    /** Maximum number of decisions to show */
    maxDecisions: number;
    /** Show decision timestamps */
    showTimestamps: boolean;
    /** Show decision outcomes */
    showOutcomes: boolean;
    /** Show decision confidence scores */
    showConfidence: boolean;
    /** Compact mode for mobile */
    compactMode: boolean;
  };
  /** Color scheme for decision feed */
  colors: {
    /** Accepted decision color */
    acceptedColor: string;
    /** Rejected decision color */
    rejectedColor: string;
    /** Pending decision color */
    pendingColor: string;
    /** High confidence color */
    highConfidenceColor: string;
    /** Medium confidence color */
    mediumConfidenceColor: string;
    /** Low confidence color */
    lowConfidenceColor: string;
    /** Default text color */
    textColor: string;
    /** Timestamp color */
    timestampColor: string;
  };
  /** Animation settings */
  animation: {
    /** Enable feed animations */
    enabled: boolean;
    /** Slide in animation duration */
    slideInDuration: number;
    /** Fade animation duration */
    fadeDuration: number;
    /** Animation easing */
    easing: string;
  };
}

/**
 * Telemetry thresholds configuration
 */
export interface TelemetryThresholds {
  /** Risk thresholds for quest outcomes */
  risk: {
    /** Low risk threshold (percentage) */
    lowRisk: number;
    /** Medium risk threshold (percentage) */
    mediumRisk: number;
    /** High risk threshold (percentage) */
    highRisk: number;
    /** Critical risk threshold (percentage) */
    criticalRisk: number;
  };
  /** Performance thresholds */
  performance: {
    /** Minimum quest success rate */
    minSuccessRate: number;
    /** Target quest success rate */
    targetSuccessRate: number;
    /** Maximum acceptable failure rate */
    maxFailureRate: number;
    /** Minimum data points for reliable analysis */
    minDataPoints: number;
  };
  /** Display thresholds */
  display: {
    /** Minimum percentage to show in heatmap */
    minDisplayPercentage: number;
    /** Maximum percentage for color scaling */
    maxDisplayPercentage: number;
    /** Minimum cell opacity */
    minCellOpacity: number;
    /** Maximum cell opacity */
    maxCellOpacity: number;
  };
}

/**
 * Complete quest telemetry configuration
 */
export interface QuestTelemetryConfig {
  /** Risk buckets for categorization */
  riskBuckets: QuestRiskBucket[];
  /** Heatmap display configuration */
  heatmap: HeatmapDisplayConfig;
  /** Decision feed configuration */
  decisionFeed: DecisionFeedConfig;
  /** Telemetry thresholds */
  thresholds: TelemetryThresholds;
  /** General settings */
  settings: {
    /** Enable telemetry collection */
    enabled: boolean;
    /** Data refresh interval in milliseconds */
    refreshInterval: number;
    /** Maximum data points to retain */
    maxDataPoints: number;
    /** Enable debug mode */
    debugMode: boolean;
    /** Enable mobile optimizations */
    mobileOptimized: boolean;
  };
}

/**
 * Time bucket configuration for telemetry aggregation
 */
export interface TimeBucketConfig {
  /** Bucket size in minutes */
  sizeMinutes: number;
  /** Maximum number of buckets to display */
  maxBuckets: number;
  /** Whether to show empty buckets */
  showEmpty: boolean;
  /** Bucket labels format */
  labelFormat: 'short' | 'full' | 'relative';
}

/**
 * Default risk buckets configuration
 */
export const DEFAULT_RISK_BUCKETS: QuestRiskBucket[] = [
  {
    id: 'very_low',
    label: 'Very Low Risk',
    minThreshold: 0,
    maxThreshold: 10,
    color: 'rgb(34, 197, 94)', // green-500
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgb(34, 197, 94)',
    description: 'Minimal risk of injury or death',
    priority: 1,
  },
  {
    id: 'low',
    label: 'Low Risk',
    minThreshold: 10,
    maxThreshold: 25,
    color: 'rgb(132, 204, 22)', // lime-500
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderColor: 'rgb(132, 204, 22)',
    description: 'Low risk of injury, minimal risk of death',
    priority: 2,
  },
  {
    id: 'medium',
    label: 'Medium Risk',
    minThreshold: 25,
    maxThreshold: 50,
    color: 'rgb(251, 191, 36)', // amber-400
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgb(251, 191, 36)',
    description: 'Moderate risk of injury and death',
    priority: 3,
  },
  {
    id: 'high',
    label: 'High Risk',
    minThreshold: 50,
    maxThreshold: 75,
    color: 'rgb(249, 115, 22)', // orange-500
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgb(249, 115, 22)',
    description: 'High risk of injury, significant risk of death',
    priority: 4,
  },
  {
    id: 'very_high',
    label: 'Very High Risk',
    minThreshold: 75,
    maxThreshold: 90,
    color: 'rgb(239, 68, 68)', // red-500
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgb(239, 68, 68)',
    description: 'Very high risk of injury and death',
    priority: 5,
  },
  {
    id: 'critical',
    label: 'Critical Risk',
    minThreshold: 90,
    maxThreshold: 100,
    color: 'rgb(127, 29, 29)', // red-900
    backgroundColor: 'rgba(127, 29, 29, 0.1)',
    borderColor: 'rgb(127, 29, 29)',
    description: 'Critical risk - likely injury or death',
    priority: 6,
  },
];

/**
 * Default heatmap display configuration
 */
export const DEFAULT_HEATMAP_CONFIG: HeatmapDisplayConfig = {
  grid: {
    rows: 8,
    columns: 12,
    cellSize: 24,
    gap: 2,
    borderRadius: 4,
  },
  colors: {
    defaultBackground: 'rgb(30, 41, 59)', // slate-800
    defaultBorder: 'rgb(71, 85, 105)', // slate-600
    hoverBackground: 'rgb(51, 65, 85)', // slate-700
    focusBorder: 'rgb(59, 130, 246)', // blue-500
    selectedBackground: 'rgb(99, 102, 241)', // indigo-500
  },
  animation: {
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    staggerDelay: 20,
  },
  tooltip: {
    enabled: true,
    backgroundColor: 'rgb(15, 23, 42)', // slate-900
    textColor: 'rgb(241, 245, 249)', // slate-100
    borderColor: 'rgb(71, 85, 105)', // slate-600
    borderRadius: 6,
    padding: 8,
    fontSize: '12px',
    delay: 100,
  },
};

/**
 * Default decision feed configuration
 */
export const DEFAULT_DECISION_FEED_CONFIG: DecisionFeedConfig = {
  display: {
    maxDecisions: 5,
    showTimestamps: true,
    showOutcomes: true,
    showConfidence: true,
    compactMode: false,
  },
  colors: {
    acceptedColor: 'rgb(34, 197, 94)', // green-500
    rejectedColor: 'rgb(239, 68, 68)', // red-500
    pendingColor: 'rgb(251, 191, 36)', // amber-400
    highConfidenceColor: 'rgb(34, 197, 94)', // green-500
    mediumConfidenceColor: 'rgb(251, 191, 36)', // amber-400
    lowConfidenceColor: 'rgb(239, 68, 68)', // red-500
    textColor: 'rgb(241, 245, 249)', // slate-100
    timestampColor: 'rgb(148, 163, 184)', // slate-400
  },
  animation: {
    enabled: true,
    slideInDuration: 200,
    fadeDuration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Default telemetry thresholds
 */
export const DEFAULT_TELEMETRY_THRESHOLDS: TelemetryThresholds = {
  risk: {
    lowRisk: 15,
    mediumRisk: 35,
    highRisk: 60,
    criticalRisk: 85,
  },
  performance: {
    minSuccessRate: 0.6,
    targetSuccessRate: 0.8,
    maxFailureRate: 0.4,
    minDataPoints: 10,
  },
  display: {
    minDisplayPercentage: 1,
    maxDisplayPercentage: 95,
    minCellOpacity: 0.1,
    maxCellOpacity: 1.0,
  },
};

/**
 * Default quest telemetry configuration
 */
export const DEFAULT_QUEST_TELEMETRY_CONFIG: QuestTelemetryConfig = {
  riskBuckets: DEFAULT_RISK_BUCKETS,
  heatmap: DEFAULT_HEATMAP_CONFIG,
  decisionFeed: DEFAULT_DECISION_FEED_CONFIG,
  thresholds: DEFAULT_TELEMETRY_THRESHOLDS,
  settings: {
    enabled: true,
    refreshInterval: 5000, // 5 seconds
    maxDataPoints: 1000,
    debugMode: false,
    mobileOptimized: true,
  },
};

/**
 * Get risk bucket for a given percentage
 * 
 * @param percentage - Risk percentage (0-100)
 * @param config - Quest telemetry configuration
 * @returns Risk bucket or null if no match found
 */
export function getRiskBucket(
  percentage: number,
  config: QuestTelemetryConfig = DEFAULT_QUEST_TELEMETRY_CONFIG
): QuestRiskBucket | null {
  return config.riskBuckets.find(
    bucket => percentage >= bucket.minThreshold && percentage < bucket.maxThreshold
  ) || null;
}

/**
 * Get color for risk percentage
 * 
 * @param percentage - Risk percentage (0-100)
 * @param config - Quest telemetry configuration
 * @returns Color string or default color
 */
export function getRiskColor(
  percentage: number,
  config: QuestTelemetryConfig = DEFAULT_QUEST_TELEMETRY_CONFIG
): string {
  const bucket = getRiskBucket(percentage, config);
  return bucket?.color || config.heatmap.colors.defaultBackground;
}

/**
 * Check if percentage exceeds risk threshold
 * 
 * @param percentage - Risk percentage (0-100)
 * @param threshold - Risk threshold level
 * @param config - Quest telemetry configuration
 * @returns True if percentage exceeds threshold
 */
export function exceedsRiskThreshold(
  percentage: number,
  threshold: keyof TelemetryThresholds['risk'],
  config: QuestTelemetryConfig = DEFAULT_QUEST_TELEMETRY_CONFIG
): boolean {
  return percentage >= config.thresholds.risk[threshold];
}

/**
 * Color scale configuration for heatmap visualization
 */
export interface ColorScaleConfig {
  /** Color scheme name */
  scheme: 'gilded' | 'viridis' | 'plasma' | 'warm' | 'cool' | 'monochrome';
  /** Number of color stops */
  stops: number;
  /** Minimum value for color mapping */
  minValue: number;
  /** Maximum value for color mapping */
  maxValue: number;
  /** Whether to use logarithmic scaling */
  logarithmic: boolean;
}

/**
 * Heatmap visualization configuration
 */
export interface HeatmapConfig {
  /** Time bucket settings */
  timeBuckets: TimeBucketConfig;
  /** Color scale settings */
  colorScale: ColorScaleConfig;
  /** Cell dimensions */
  cellSize: {
    width: number;
    height: number;
    gap: number;
    borderRadius: number;
  };
  /** Display options */
  display: {
    showValues: boolean;
    showLabels: boolean;
    showGrid: boolean;
    showTooltips: boolean;
    animateTransitions: boolean;
  };
  /** Interaction settings */
  interaction: {
    enableClick: boolean;
    enableHover: boolean;
    enableSelection: boolean;
    multiSelect: boolean;
  };
}

/**
 * Decision feed configuration
 */
export interface DecisionFeedConfig {
  /** Maximum number of decisions to display */
  maxDecisions: number;
  /** Group decisions by quest */
  groupByQuest: boolean;
  /** Sort options */
  sortBy: 'timestamp' | 'success' | 'duration' | 'choice-time';
  /** Sort direction */
  sortOrder: 'asc' | 'desc';
  /** Filter options */
  filters: {
    showSuccessful: boolean;
    showFailed: boolean;
    showHeroic: boolean;
    timeRange: number | null; // minutes, null = all time
    questTypes: string[];
  };
  /** Display options */
  display: {
    showTimestamps: boolean;
    showQuestTypes: boolean;
    showChoiceTimes: boolean;
    showOutcomes: boolean;
    showBadges: boolean;
    compactMode: boolean;
  };
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Risk assessment settings */
  risk: {
    /** Enable risk calculation */
    enabled: boolean;
    /** Risk thresholds */
    thresholds: {
      low: number;    // 0-0.3
      medium: number; // 0.3-0.7
      high: number;   // 0.7-1.0
    };
    /** Risk factors weights */
    factors: {
      failureRate: number;
      averageDuration: number;
      choiceComplexity: number;
      heroicMoments: number;
    };
  };
  /** Reward assessment settings */
  rewards: {
    /** Enable reward calculation */
    enabled: boolean;
    /** Reward metrics */
    metrics: {
      successRate: number;
      averageDuration: number;
      heroicMoments: number;
      choiceEfficiency: number;
    };
  };
  /** Performance metrics */
  performance: {
    /** Enable performance tracking */
    enabled: boolean;
    /** Metrics to track */
    metrics: [
      'success_rate',
      'average_duration',
      'choice_time',
      'heroic_moments',
      'quest_frequency'
    ];
    /** Rolling window size (number of quests) */
    rollingWindow: number;
  };
}

/**
 * Mobile-specific configuration
 */
export interface MobileConfig {
  /** Enable mobile optimizations */
  enabled: boolean;
  /** Touch interaction settings */
  touch: {
    enableSwipe: boolean;
    enablePinch: boolean;
    tapThreshold: number;
  };
  /** Layout adjustments */
  layout: {
    compactCells: boolean;
    hideLabels: boolean;
    reduceColumns: boolean;
    maxColumns: number;
  };
  /** Performance settings */
  performance: {
    enableVirtualization: boolean;
    maxVisibleBuckets: number;
    throttleUpdates: boolean;
  };
}

/**
 * Complete quest telemetry configuration
 */
export interface QuestTelemetryConfig {
  /** Heatmap settings */
  heatmap: HeatmapConfig;
  /** Decision feed settings */
  decisionFeed: DecisionFeedConfig;
  /** Analytics settings */
  analytics: AnalyticsConfig;
  /** Mobile-specific settings */
  mobile: MobileConfig;
  /** General settings */
  general: {
    /** Enable auto-refresh */
    autoRefresh: boolean;
    /** Refresh interval in milliseconds */
    refreshInterval: number;
    /** Enable persistence */
    persistence: boolean;
    /** Storage key */
    storageKey: string;
    /** Debug mode */
    debug: boolean;
  };
}

/**
 * Default time bucket configuration
 */
export const DEFAULT_TIME_BUCKET_CONFIG: TimeBucketConfig = {
  sizeMinutes: 15,
  maxBuckets: 24, // 6 hours of data
  showEmpty: false,
  labelFormat: 'short',
};

/**
 * Default color scale configuration
 */
export const DEFAULT_COLOR_SCALE_CONFIG: ColorScaleConfig = {
  scheme: 'gilded',
  stops: 5,
  minValue: 0,
  maxValue: 10,
  logarithmic: false,
};


/**
 * Color scheme definitions
 */
export const COLOR_SCHEMES = {
  gilded: {
    name: 'Gilded Observatory',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#fbbf24', '#f59e0b'],
    description: 'Amber gradient on slate background',
  },
  viridis: {
    name: 'Viridis',
    colors: ['#440154', '#31688e', '#35b779', '#8fd744', '#fde725'],
    description: 'Scientific colorblind-safe palette',
  },
  plasma: {
    name: 'Plasma',
    colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'],
    description: 'Purple to yellow gradient',
  },
  warm: {
    name: 'Warm',
    colors: ['#3b0764', '#7c2d12', '#dc2626', '#ea580c', '#facc15', '#fef3c7'],
    description: 'Warm colors from purple to yellow',
  },
  cool: {
    name: 'Cool',
    colors: ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#dbeafe'],
    description: 'Cool blue tones',
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'],
    description: 'Grayscale palette',
  },
} as const;

/**
 * Quest type priority order for display
 */
export const QUEST_TYPE_PRIORITY = [
  'combat',
  'exploration',
  'social',
  'mystery',
  'crafting',
  'trade',
  'diplomacy',
  'research',
  'training',
  'maintenance',
] as const;

/**
 * Helper function to get color for value based on configuration
 */
export function getColorForValue(
  value: number,
  config: ColorScaleConfig,
  colorSchemes: typeof COLOR_SCHEMES = COLOR_SCHEMES
): string {
  const scheme = colorSchemes[config.scheme];
  if (!scheme) return scheme.colors[0];

  const { minValue, maxValue, stops, logarithmic } = config;
  
  // Normalize value
  let normalizedValue: number;
  if (logarithmic && value > 0) {
    const logMin = Math.log10(Math.max(minValue, 0.001));
    const logMax = Math.log10(maxValue);
    const logValue = Math.log10(Math.max(value, 0.001));
    normalizedValue = (logValue - logMin) / (logMax - logMin);
  } else {
    normalizedValue = (value - minValue) / (maxValue - minValue);
  }
  
  // Clamp to [0, 1]
  normalizedValue = Math.max(0, Math.min(1, normalizedValue));
  
  // Map to color index
  const colorIndex = Math.floor(normalizedValue * (stops - 1));
  return scheme.colors[Math.min(colorIndex, scheme.colors.length - 1)];
}

/**
 * Helper function to format bucket labels
 */
export function formatBucketLabel(
  timestamp: number,
  bucketSize: number,
  format: 'short' | 'full' | 'relative'
): string {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'short':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'full':
      return date.toLocaleString();
    case 'relative':
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      return `${Math.floor(diff / 3600000)}h ago`;
    default:
      return date.toLocaleTimeString();
  }
}

/**
 * Helper function to check if configuration is valid
 */
export function validateQuestTelemetryConfig(config: QuestTelemetryConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate heatmap config
  if (config.heatmap.timeBuckets.sizeMinutes <= 0) {
    errors.push('Time bucket size must be positive');
  }
  
  if (config.heatmap.timeBuckets.maxBuckets <= 0) {
    errors.push('Max buckets must be positive');
  }
  
  if (config.heatmap.colorScale.stops < 2) {
    errors.push('Color scale must have at least 2 stops');
  }
  
  if (config.heatmap.colorScale.minValue >= config.heatmap.colorScale.maxValue) {
    errors.push('Color scale min value must be less than max value');
  }
  
  // Validate decision feed config
  if (config.decisionFeed.maxDecisions <= 0) {
    errors.push('Max decisions must be positive');
  }
  
  // Validate analytics config
  if (config.analytics.risk.thresholds.low >= config.analytics.risk.thresholds.medium) {
    errors.push('Risk low threshold must be less than medium');
  }
  
  if (config.analytics.risk.thresholds.medium >= config.analytics.risk.thresholds.high) {
    errors.push('Risk medium threshold must be less than high');
  }
  
  // Validate mobile config
  if (config.mobile.touch.tapThreshold <= 0) {
    errors.push('Mobile tap threshold must be positive');
  }
  
  if (config.mobile.layout.maxColumns <= 0) {
    errors.push('Mobile max columns must be positive');
  }
  
  // Validate general config
  if (config.general.refreshInterval <= 0) {
    errors.push('Refresh interval must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
