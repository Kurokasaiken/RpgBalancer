/**
 * Configuration for Idle Village Activity Analytics and Telemetry.
 * Config-first design with Style Laboratory tokens for dashboard theming.
 */

// Activity type definition matching existing codebase
export type ActivityType = 'job' | 'quest' | 'maintenance';

/**
 * Activity analytics event types for telemetry collection.
 */
export type ActivityAnalyticsEventType = 
  | 'jobStarted'
  | 'jobCompleted' 
  | 'jobFailed'
  | 'questAccepted'
  | 'questCompleted'
  | 'questFailed'
  | 'maintenanceTriggered'
  | 'maintenanceCompleted'
  | 'maintenanceFailed'
  | 'activityPaused'
  | 'activityResumed';

/**
 * Activity analytics event payload structure.
 */
export interface ActivityAnalyticsEvent {
  /** Unique event identifier */
  id: string;
  /** Event type from analytics taxonomy */
  type: ActivityAnalyticsEventType;
  /** Timestamp when event occurred (Unix ms) */
  timestamp: number;
  /** Activity definition ID */
  activityId: string;
  /** Scheduled activity instance ID */
  scheduledId: string;
  /** Resident ID who performed/triggered the activity */
  residentId: string;
  /** Activity type for categorization */
  activityType: ActivityType;
  /** Event duration in seconds (for completion events) */
  duration?: number;
  /** Additional event-specific metadata */
  metadata: Record<string, unknown>;
  /** Session identifier for correlation */
  sessionId: string;
}

/**
 * Aggregated analytics metrics for dashboard display.
 */
export interface ActivityAnalyticsMetrics {
  /** Total events by type */
  eventsByType: Record<ActivityAnalyticsEventType, number>;
  /** Completion rates by activity type */
  completionRates: Record<ActivityType, number>;
  /** Average completion times by activity type */
  averageCompletionTimes: Record<ActivityType, number>;
  /** Failure rates by activity type */
  failureRates: Record<ActivityType, number>;
  /** Resident performance metrics */
  residentPerformance: Record<string, {
    totalActivities: number;
    completionRate: number;
    averageCompletionTime: number;
    preferredActivities: ActivityType[];
  }>;
  /** Time-based activity patterns (hourly distribution) */
  hourlyActivityPattern: number[];
  /** Risk assessment metrics */
  riskMetrics: {
    highRiskActivities: number;
    averageRiskScore: number;
    riskByActivityType: Record<ActivityType, number>;
  };
  /** Fatigue impact metrics */
  fatigueMetrics: {
    fatigueRelatedFailures: number;
    averageFatigueOnFailure: number;
    fatigueImpactByActivityType: Record<ActivityType, number>;
  };
}

/**
 * Retention policies for analytics data storage.
 */
export interface AnalyticsRetentionConfig {
  /** Maximum age for events in milliseconds */
  maxEventAge: number;
  /** Maximum number of events to retain */
  maxEventCount: number;
  /** Aggregation window for metrics calculation */
  aggregationWindowMs: number;
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs: number;
  /** Whether to enable automatic cleanup */
  enableAutoCleanup: boolean;
}

/**
 * Dashboard configuration with Style Laboratory tokens.
 */
export interface ActivityAnalyticsDashboardConfig {
  /** Visual theme configuration */
  theme: {
    /** Primary color palette from Style Laboratory */
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
    };
    /** Typography configuration */
    typography: {
      fontFamily: string;
      fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
      };
      fontWeight: {
        normal: string;
        medium: string;
        semibold: string;
        bold: string;
      };
    };
    /** Spacing configuration */
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    /** Border radius configuration */
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  /** Chart configuration */
  charts: {
    /** Default chart height */
    defaultHeight: string;
    /** Animation duration in milliseconds */
    animationDuration: number;
    /** Grid configuration */
    grid: {
      show: boolean;
      color: string;
      strokeWidth: number;
    };
    /** Tooltip configuration */
    tooltip: {
      show: boolean;
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      borderWidth: number;
    };
  };
  /** Dashboard layout configuration */
  layout: {
    /** Maximum number of metrics cards per row */
    maxCardsPerRow: number;
    /** Chart aspect ratio */
    chartAspectRatio: string;
    /** Refresh interval in milliseconds */
    refreshIntervalMs: number;
    /** Enable real-time updates */
    enableRealTimeUpdates: boolean;
  };
  /** Performance configuration */
  performance: {
    /** Maximum number of data points for charts */
    maxDataPoints: number;
    /** Debounce delay for updates in milliseconds */
    updateDebounceMs: number;
    /** Enable virtual scrolling for large datasets */
    enableVirtualScrolling: boolean;
  };
}

/**
 * Default analytics retention configuration.
 */
export const DEFAULT_ANALYTICS_RETENTION: AnalyticsRetentionConfig = {
  maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEventCount: 10000,
  aggregationWindowMs: 60 * 60 * 1000, // 1 hour
  cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
  enableAutoCleanup: true,
};

/**
 * Default dashboard configuration with Gilded Observatory theme.
 */
export const DEFAULT_ANALYTICS_DASHBOARD_CONFIG: ActivityAnalyticsDashboardConfig = {
  theme: {
    colors: {
      primary: 'rgb(139, 179, 165)', // slate-300
      secondary: 'rgb(71, 85, 105)', // slate-600
      accent: 'rgb(201, 162, 39)', // amber-500
      success: 'rgb(34, 197, 94)', // green-500
      warning: 'rgb(251, 191, 36)', // amber-400
      error: 'rgb(239, 68, 68)', // red-500
      background: 'rgb(5, 5, 9)', // obsidian-950
      surface: 'rgb(15, 26, 29)', // obsidian-900
      text: 'rgb(240, 239, 228)', // ivory-100
      textSecondary: 'rgb(139, 179, 165)', // slate-300
      border: 'rgb(59, 75, 77)', // slate-700
    },
    typography: {
      fontFamily: '"Crimson Text", serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
  },
  charts: {
    defaultHeight: '12rem',
    animationDuration: 300,
    grid: {
      show: true,
      color: 'rgb(59, 75, 77)',
      strokeWidth: 1,
    },
    tooltip: {
      show: true,
      backgroundColor: 'rgb(15, 26, 29)',
      textColor: 'rgb(240, 239, 228)',
      borderColor: 'rgb(71, 85, 105)',
      borderWidth: 1,
    },
  },
  layout: {
    maxCardsPerRow: 4,
    chartAspectRatio: '16/9',
    refreshIntervalMs: 5000,
    enableRealTimeUpdates: true,
  },
  performance: {
    maxDataPoints: 100,
    updateDebounceMs: 300,
    enableVirtualScrolling: true,
  },
};

/**
 * Analytics thresholds for alerts and notifications.
 */
export interface AnalyticsThresholds {
  /** Minimum completion rate threshold */
  minCompletionRate: number;
  /** Maximum failure rate threshold */
  maxFailureRate: number;
  /** Maximum average completion time threshold (seconds) */
  maxAverageCompletionTime: number;
  /** High risk activity threshold */
  highRiskThreshold: number;
  /** Fatigue impact threshold */
  fatigueImpactThreshold: number;
}

/**
 * Default analytics thresholds.
 */
export const DEFAULT_ANALYTICS_THRESHOLDS: AnalyticsThresholds = {
  minCompletionRate: 0.8,
  maxFailureRate: 0.2,
  maxAverageCompletionTime: 300, // 5 minutes
  highRiskThreshold: 0.7,
  fatigueImpactThreshold: 0.5,
};
