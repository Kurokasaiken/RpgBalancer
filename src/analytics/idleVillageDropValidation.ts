/**
 * Idle Village Drop Validation Telemetry Analytics
 * 
 * Analytics module for drop validation telemetry with export capabilities.
 * Provides event tracking, aggregation, and export functionality for
 * Phase E drop validation outcomes and performance monitoring.
 * 
 * @since NP-067 – Idle Village Drop Validation Telemetry Export
 * @author Signal-Idle – Drop Telemetry
 */

import { z } from 'zod';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * Drop validation event types
 */
export type DropValidationEventType = 
  | 'drop_feedback_shown'
  | 'drop_validation_failed'
  | 'drop_validation_passed'
  | 'drop_validation_exported';

/**
 * Drop validation severity levels
 */
export type DropValidationSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Drop validation rule types
 */
export type DropValidationRuleType = 
  | 'fatigue_threshold'
  | 'crew_capacity'
  | 'stat_tags'
  | 'activity_requirements'
  | 'resident_compatibility'
  | 'slot_availability';

/**
 * Drop validation outcome
 */
export interface DropValidationOutcome {
  /** Validation result */
  isValid: boolean;
  /** Validation rule that triggered */
  ruleType: DropValidationRuleType;
  /** Rule identifier */
  ruleId: string;
  /** Severity level */
  severity: DropValidationSeverity;
  /** Validation message */
  message: string;
  /** Resident ID if applicable */
  residentId?: string;
  /** Activity ID if applicable */
  activityId?: string;
  /** Slot ID if applicable */
  slotId?: string;
  /** Validation metadata */
  metadata: {
    /** Current fatigue value */
    fatigue?: number;
    /** Current crew count */
    crewCount?: number;
    /** Required stat tags */
    requiredStats?: string[];
    /** Available stat tags */
    availableStats?: string[];
    /** Activity requirements */
    requirements?: {
      minFatigue?: number;
      maxCrew?: number;
      requiredStats?: string[];
    };
    /** Timestamp */
    timestamp: number;
    /** Session ID */
    sessionId: string;
  };
}

/**
 * Drop validation telemetry event
 */
export interface DropValidationTelemetryEvent {
  /** Event type */
  eventType: DropValidationEventType;
  /** Event timestamp */
  timestamp: number;
  /** Event data payload */
  data: {
    /** Validation outcome */
    outcome?: DropValidationOutcome;
    /** Multiple outcomes for batch validation */
    outcomes?: DropValidationOutcome[];
    /** Export metadata */
    exportMetadata?: {
      format: 'json' | 'csv' | 'markdown';
      recordCount: number;
      filename: string;
    };
    /** Performance metrics */
    performance?: {
      validationLatencyMs: number;
      ruleProcessingTimeMs: number;
      totalProcessingTimeMs: number;
    };
    /** UI context */
    context: {
      /** Current interaction mode */
      interactionMode: 'desktop' | 'mobile';
      /** Screen dimensions */
      screenDimensions?: { width: number; height: number };
      /** User agent */
      userAgent?: string;
      /** Page context */
      pageContext?: string;
    };
  };
}

/**
 * Drop validation analytics configuration
 */
export interface DropValidationAnalyticsConfig {
  /** Configuration identifier */
  id: string;
  /** Configuration version */
  version: string;
  /** Analytics settings */
  analytics: {
    /** Enable analytics tracking */
    enabled: boolean;
    /** Event throttle rate (milliseconds) */
    throttleMs: number;
    /** Maximum events per session */
    maxEventsPerSession: number;
    /** Event retention period (milliseconds) */
    retentionMs: number;
    /** Batch size for event processing */
    batchSize: number;
  };
  /** Export settings */
  export: {
    /** Enable export functionality */
    enabled: boolean;
    /** Export formats */
    formats: ('json' | 'csv' | 'markdown')[];
    /** Maximum records per export */
    maxRecordsPerExport: number;
    /** Include sensitive data in exports */
    includeSensitiveData: boolean;
    /** Export file naming pattern */
    filenamePattern: string;
    /** Export directory */
    exportDirectory: string;
  };
  /** Performance settings */
  performance: {
    /** Maximum validation latency (milliseconds) */
    maxValidationLatencyMs: number;
    /** Alert threshold for slow validations */
    slowValidationThresholdMs: number;
    /** Enable performance monitoring */
    enableMonitoring: boolean;
  };
  /** Filter settings */
  filters: {
    /** Available date ranges */
    dateRanges: Array<{
      id: string;
      label: string;
      value: number; // hours back from now
    }>;
    /** Available severities */
    severities: DropValidationSeverity[];
    /** Available rule types */
    ruleTypes: DropValidationRuleType[];
    /** Event types to include */
    eventTypes: DropValidationEventType[];
  };
}

/**
 * Drop validation analytics data
 */
export interface DropValidationAnalytics {
  /** Current session metrics */
  sessionMetrics: {
    sessionId: string;
    startTime: number;
    endTime?: number;
    totalEvents: number;
    validationCount: number;
    failureCount: number;
    averageLatencyMs: number;
    dominantFailureRule: DropValidationRuleType;
  };
  /** Aggregated metrics */
  aggregatedMetrics: {
    totalValidations: number;
    successRate: number;
    failureRate: number;
    averageLatencyMs: number;
    ruleFailureRates: Record<DropValidationRuleType, number>;
    severityDistribution: Record<DropValidationSeverity, number>;
  };
  /** Recent events */
  recentEvents: DropValidationTelemetryEvent[];
  /** Export history */
  exportHistory: Array<{
    timestamp: number;
    format: 'json' | 'csv' | 'markdown';
    recordCount: number;
    filename: string;
  }>;
}

/**
 * Zod schema for DropValidationOutcome
 */
const DropValidationOutcomeSchema = z.object({
  isValid: z.boolean(),
  ruleType: z.enum(['fatigue_threshold', 'crew_capacity', 'stat_tags', 'activity_requirements', 'resident_compatibility', 'slot_availability']),
  ruleId: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  residentId: z.string().optional(),
  activityId: z.string().optional(),
  slotId: z.string().optional(),
  metadata: z.object({
    fatigue: z.number().optional(),
    crewCount: z.number().optional(),
    requiredStats: z.array(z.string()).optional(),
    availableStats: z.array(z.string()).optional(),
    requirements: z.object({
      minFatigue: z.number().optional(),
      maxCrew: z.number().optional(),
      requiredStats: z.array(z.string()).optional(),
    }).optional(),
    timestamp: z.number(),
    sessionId: z.string(),
  }),
});

/**
 * Zod schema for DropValidationTelemetryEvent
 */
const DropValidationTelemetryEventSchema = z.object({
  eventType: z.enum(['drop_feedback_shown', 'drop_validation_failed', 'drop_validation_passed', 'drop_validation_exported']),
  timestamp: z.number(),
  data: z.object({
    outcome: DropValidationOutcomeSchema.optional(),
    outcomes: z.array(DropValidationOutcomeSchema).optional(),
    exportMetadata: z.object({
      format: z.enum(['json', 'csv', 'markdown']),
      recordCount: z.number(),
      filename: z.string(),
    }).optional(),
    performance: z.object({
      validationLatencyMs: z.number(),
      ruleProcessingTimeMs: z.number(),
      totalProcessingTimeMs: z.number(),
    }).optional(),
    context: z.object({
      interactionMode: z.enum(['desktop', 'mobile']),
      screenDimensions: z.object({
        width: z.number(),
        height: z.number(),
      }).optional(),
      userAgent: z.string().optional(),
      pageContext: z.string().optional(),
    }),
  }),
});

/**
 * Zod schema for DropValidationAnalyticsConfig
 */
const DropValidationAnalyticsConfigSchema = z.object({
  id: z.string(),
  version: z.string(),
  analytics: z.object({
    enabled: z.boolean(),
    throttleMs: z.number().min(100),
    maxEventsPerSession: z.number().min(100),
    retentionMs: z.number().min(86400000), // 24 hours
    batchSize: z.number().min(1),
  }),
  export: z.object({
    enabled: z.boolean(),
    formats: z.array(z.enum(['json', 'csv', 'markdown'])),
    maxRecordsPerExport: z.number().min(1),
    includeSensitiveData: z.boolean(),
    filenamePattern: z.string(),
    exportDirectory: z.string(),
  }),
  performance: z.object({
    maxValidationLatencyMs: z.number().min(50),
    slowValidationThresholdMs: z.number().min(100),
    enableMonitoring: z.boolean(),
  }),
  filters: z.object({
    dateRanges: z.array(z.object({
      id: z.string(),
      label: z.string(),
      value: z.number().min(1),
    })),
    severities: z.array(z.enum(['low', 'medium', 'high', 'critical'])),
    ruleTypes: z.array(z.enum(['fatigue_threshold', 'crew_capacity', 'stat_tags', 'activity_requirements', 'resident_compatibility', 'slot_availability'])),
    eventTypes: z.array(z.enum(['drop_feedback_shown', 'drop_validation_failed', 'drop_validation_passed', 'drop_validation_exported'])),
  }),
});

/**
 * Default drop validation analytics configuration
 */
export const DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG: DropValidationAnalyticsConfig = {
  id: 'idle-village-drop-validation-analytics',
  version: '1.0.0',
  analytics: {
    enabled: true,
    throttleMs: 100,               // 100ms debounce
    maxEventsPerSession: 1000,
    retentionMs: 86400000,          // 24 hours
    batchSize: 50,
  },
  export: {
    enabled: true,
    formats: ['json', 'csv', 'markdown'],
    maxRecordsPerExport: 10000,
    includeSensitiveData: false,
    filenamePattern: 'drop-validation-telemetry-{date}',
    exportDirectory: 'test-results/idleVillage',
  },
  performance: {
    maxValidationLatencyMs: 50,   // 50ms target
    slowValidationThresholdMs: 100, // 100ms alert threshold
    enableMonitoring: true,
  },
  filters: {
    dateRanges: [
      { id: 'last-hour', label: 'Last Hour', value: 1 },
      { id: 'last-6-hours', label: 'Last 6 Hours', value: 6 },
      { id: 'last-24-hours', label: 'Last 24 Hours', value: 24 },
      { id: 'last-week', label: 'Last Week', value: 168 },
      { id: 'last-month', label: 'Last Month', value: 720 },
    ],
    severities: ['low', 'medium', 'high', 'critical'],
    ruleTypes: ['fatigue_threshold', 'crew_capacity', 'stat_tags', 'activity_requirements', 'resident_compatibility', 'slot_availability'],
    eventTypes: ['drop_feedback_shown', 'drop_validation_failed', 'drop_validation_passed', 'drop_validation_exported'],
  },
};

/**
 * Create safe drop validation analytics configuration
 */
export function createSafeDropValidationAnalyticsConfig(
  config?: Partial<DropValidationAnalyticsConfig>
): DropValidationAnalyticsConfig {
  const merged = { ...DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG, ...config };
  
  // Validate with Zod
  const result = DropValidationAnalyticsConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid drop validation analytics config:', result.error);
    return DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate drop validation outcome
 */
export function isValidDropValidationOutcome(outcome: unknown): outcome is DropValidationOutcome {
  return DropValidationOutcomeSchema.safeParse(outcome).success;
}

/**
 * Validate drop validation telemetry event
 */
export function isValidDropValidationTelemetryEvent(event: unknown): event is DropValidationTelemetryEvent {
  return DropValidationTelemetryEventSchema.safeParse(event).success;
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate aggregated metrics from events
 */
export function calculateAggregatedMetrics(events: DropValidationTelemetryEvent[]) {
  const validationEvents = events.filter(e => 
    e.eventType === 'drop_validation_failed' || e.eventType === 'drop_validation_passed'
  );
  
  const totalValidations = validationEvents.length;
  const failureCount = validationEvents.filter(e => e.eventType === 'drop_validation_failed').length;
  const successCount = totalValidations - failureCount;
  
  // Calculate rule failure rates
  const ruleFailureRates: Record<DropValidationRuleType, number> = validationEvents.reduce((acc, event) => {
    if (event.data.outcome) {
      const ruleType = event.data.outcome.ruleType;
      acc[ruleType] = (acc[ruleType] || 0) + 1;
    }
    return acc;
  }, {
    fatigue_threshold: 0,
    crew_capacity: 0,
    stat_tags: 0,
    activity_requirements: 0,
    resident_compatibility: 0,
    slot_availability: 0,
  });
  
  // Calculate severity distribution
  const severityDistribution: Record<DropValidationSeverity, number> = validationEvents.reduce((acc, event) => {
    if (event.data.outcome) {
      const severity = event.data.outcome.severity;
      acc[severity] = (acc[severity] || 0) + 1;
    }
    return acc;
  }, {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  });
  
  // Calculate average latency
  const latencies = validationEvents
    .map(e => e.data.performance?.validationLatencyMs)
    .filter((latency): latency is number => latency !== undefined);
  
  const averageLatencyMs = latencies.length > 0 
    ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
    : 0;
  
  return {
    totalValidations,
    successRate: totalValidations > 0 ? successCount / totalValidations : 0,
    failureRate: totalValidations > 0 ? failureCount / totalValidations : 0,
    averageLatencyMs,
    ruleFailureRates,
    severityDistribution,
  };
}

/**
 * Filter validation events based on criteria
 */
export function filterValidationEvents(
  events: DropValidationTelemetryEvent[],
  filters: {
    dateRange?: number; // hours back from now
    severities?: DropValidationSeverity[];
    ruleTypes?: DropValidationRuleType[];
    eventTypes?: DropValidationEventType[];
  }
): DropValidationTelemetryEvent[] {
  const now = Date.now();
  const cutoffTime = filters.dateRange ? now - (filters.dateRange * 60 * 60 * 1000) : 0;
  
  return events.filter(event => {
    // Date range filter
    if (event.timestamp < cutoffTime) return false;
    
    // Event type filter
    if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) return false;
    
    // Severity filter
    if (filters.severities && event.data.outcome) {
      if (!filters.severities.includes(event.data.outcome.severity)) return false;
    }
    
    // Rule type filter
    if (filters.ruleTypes && event.data.outcome) {
      if (!filters.ruleTypes.includes(event.data.outcome.ruleType)) return false;
    }
    
    return true;
  });
}

/**
 * Export validation events to JSON
 */
export function exportValidationEventsToJSON(events: DropValidationTelemetryEvent[]): string {
  return JSON.stringify({
    events,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    totalEvents: events.length,
    aggregatedMetrics: calculateAggregatedMetrics(events),
  }, null, 2);
}

/**
 * Export validation events to CSV
 */
export function exportValidationEventsToCSV(events: DropValidationTelemetryEvent[]): string {
  const headers = [
    'timestamp',
    'event_type',
    'is_valid',
    'rule_type',
    'rule_id',
    'severity',
    'message',
    'resident_id',
    'activity_id',
    'slot_id',
    'fatigue',
    'crew_count',
    'validation_latency_ms',
    'interaction_mode',
    'screen_width',
    'screen_height',
  ];

  const rows = events.map(event => {
    const outcome = event.data.outcome;
    const performance = event.data.performance;
    const context = event.data.context;
    
    return [
      new Date(event.timestamp).toISOString(),
      event.eventType,
      outcome?.isValid?.toString() || '',
      outcome?.ruleType || '',
      outcome?.ruleId || '',
      outcome?.severity || '',
      outcome?.message || '',
      outcome?.residentId || '',
      outcome?.activityId || '',
      outcome?.slotId || '',
      outcome?.metadata.fatigue?.toString() || '',
      outcome?.metadata.crewCount?.toString() || '',
      performance?.validationLatencyMs?.toString() || '',
      context?.interactionMode || '',
      context?.screenDimensions?.width?.toString() || '',
      context?.screenDimensions?.height?.toString() || '',
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Export validation events to Markdown
 */
export function exportValidationEventsToMarkdown(events: DropValidationTelemetryEvent[]): string {
  const aggregated = calculateAggregatedMetrics(events);
  
  return `# Drop Validation Telemetry Export

**Exported:** ${new Date().toLocaleString()}  
**Total Events:** ${events.length}

## Summary Metrics

| Metric | Value |
|--------|-------|
| Total Validations | ${aggregated.totalValidations} |
| Success Rate | ${(aggregated.successRate * 100).toFixed(2)}% |
| Failure Rate | ${(aggregated.failureRate * 100).toFixed(2)}% |
| Average Latency | ${aggregated.averageLatencyMs.toFixed(2)}ms |

## Rule Failure Rates

| Rule Type | Failures | Percentage |
|-----------|---------|------------|
${Object.entries(aggregated.ruleFailureRates)
  .map(([ruleType, count]) => `| ${ruleType} | ${count} | ${((count / aggregated.totalValidations) * 100).toFixed(2)}% |`)
  .join('\n')}

## Severity Distribution

| Severity | Count | Percentage |
|----------|-------|------------|
${Object.entries(aggregated.severityDistribution)
  .map(([severity, count]) => `| ${severity} | ${count} | ${((count / aggregated.totalValidations) * 100).toFixed(2)}% |`)
  .join('\n')}

## Recent Events

${events.slice(-10).map(event => {
  const outcome = event.data.outcome;
  const time = new Date(event.timestamp).toLocaleString();
  
  return `### ${time} - ${event.eventType}
- **Rule:** ${outcome?.ruleType || 'N/A'}
- **Severity:** ${outcome?.severity || 'N/A'}
- **Message:** ${outcome?.message || 'N/A'}
- **Latency:** ${event.data.performance?.validationLatencyMs || 'N/A'}ms
${outcome?.residentId ? `- **Resident ID:** ${outcome.residentId}` : ''}
${outcome?.activityId ? `- **Activity ID:** ${outcome.activityId}` : ''}
${outcome?.slotId ? `- **Slot ID:** ${outcome.slotId}` : ''}

---`;
}).join('\n')}
`;
}

/**
 * Hook for drop validation analytics
 */
export function useDropValidationAnalytics(config?: Partial<DropValidationAnalyticsConfig>) {
  const analyticsConfig = createSafeDropValidationAnalyticsConfig(config);
  
  const storageKey = 'idle_village_drop_validation_analytics';
  const eventsStorageKey = 'idle_village_drop_validation_events';
  
  /**
   * Load analytics data from storage
   */
  async function loadAnalytics(): Promise<DropValidationAnalytics> {
    try {
      const stored = await loadData(storageKey, {} as DropValidationAnalytics);
      if (stored) {
        return stored as DropValidationAnalytics;
      }
    } catch (error) {
      console.warn('Failed to load drop validation analytics:', error);
    }
    
    // Return default analytics
    return createDefaultAnalytics();
  }

  /**
   * Save analytics data to storage
   */
  async function saveAnalytics(analytics: DropValidationAnalytics): Promise<void> {
    try {
      await saveData(storageKey, analytics);
    } catch (error) {
      console.error('Failed to save drop validation analytics:', error);
    }
  }

  /**
   * Load events from storage
   */
  async function loadEvents(): Promise<DropValidationTelemetryEvent[]> {
    try {
      const stored = await loadData(eventsStorageKey, [] as DropValidationTelemetryEvent[]);
      if (stored && Array.isArray(stored)) {
        return stored.filter(isValidDropValidationTelemetryEvent);
      }
    } catch (error) {
      console.warn('Failed to load drop validation events:', error);
    }
    
    return [];
  }

  /**
   * Save events to storage
   */
  async function saveEvents(events: DropValidationTelemetryEvent[]): Promise<void> {
    try {
      // Apply retention policy
      const cutoffTime = Date.now() - analyticsConfig.analytics.retentionMs;
      const filteredEvents = events.filter(event => event.timestamp > cutoffTime);
      
      // Apply max events limit
      const limitedEvents = filteredEvents.slice(-analyticsConfig.analytics.maxEventsPerSession);
      
      await saveData(eventsStorageKey, limitedEvents);
    } catch (error) {
      console.error('Failed to save drop validation events:', error);
    }
  }

  /**
   * Create default analytics structure
   */
  function createDefaultAnalytics(): DropValidationAnalytics {
    return {
      sessionMetrics: {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        totalEvents: 0,
        validationCount: 0,
        failureCount: 0,
        averageLatencyMs: 0,
        dominantFailureRule: 'fatigue_threshold',
      },
      aggregatedMetrics: {
        totalValidations: 0,
        successRate: 0,
        failureRate: 0,
        averageLatencyMs: 0,
        ruleFailureRates: {},
        severityDistribution: {},
      },
      recentEvents: [],
      exportHistory: [],
    };
  }

  /**
   * Record validation event
   */
  async function recordEvent(event: Omit<DropValidationTelemetryEvent, 'timestamp'>): Promise<void> {
    const fullEvent: DropValidationTelemetryEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Validate event
    if (!isValidDropValidationTelemetryEvent(fullEvent)) {
      console.warn('Invalid drop validation event:', event);
      return;
    }

    // Load existing events
    const events = await loadEvents();
    
    // Add new event
    events.push(fullEvent);
    
    // Save events
    await saveEvents(events);

    // Update analytics
    await updateAnalytics();

    // Emit telemetry event
    if (analyticsConfig.analytics.enabled) {
      emitTelemetryEvent(fullEvent);
    }
  }

  /**
   * Record validation outcome
   */
  async function recordValidationOutcome(outcome: DropValidationOutcome, performance?: {
    validationLatencyMs: number;
    ruleProcessingTimeMs: number;
    totalProcessingTimeMs: number;
  }): Promise<void> {
    await recordEvent({
      eventType: outcome.isValid ? 'drop_validation_passed' : 'drop_validation_failed',
      data: {
        outcome,
        performance,
        context: {
          interactionMode: 'desktop', // Default, should be passed from UI
          screenDimensions: typeof window !== 'undefined' 
            ? { width: window.innerWidth, height: window.innerHeight }
            : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      },
    });
  }

  /**
   * Record drop feedback shown
   */
  async function recordDropFeedbackShown(outcome: DropValidationOutcome): Promise<void> {
    await recordEvent({
      eventType: 'drop_feedback_shown',
      data: {
        outcome,
        context: {
          interactionMode: 'desktop', // Default, should be passed from UI
          screenDimensions: typeof window !== 'undefined' 
            ? { width: window.innerWidth, height: window.innerHeight }
            : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      },
    });
  }

  /**
   * Update analytics calculations
   */
  async function updateAnalytics(): Promise<void> {
    const events = await loadEvents();
    const analytics = await loadAnalytics();

    // Calculate aggregated metrics
    analytics.aggregatedMetrics = calculateAggregatedMetrics(events);

    // Update session metrics
    const validationEvents = events.filter(e => 
      e.eventType === 'drop_validation_failed' || e.eventType === 'drop_validation_passed'
    );
    
    analytics.sessionMetrics.validationCount = validationEvents.length;
    analytics.sessionMetrics.failureCount = validationEvents.filter(e => e.eventType === 'drop_validation_failed').length;
    analytics.sessionMetrics.totalEvents = events.length;

    // Calculate average latency
    const latencies = validationEvents
      .map(e => e.data.performance?.validationLatencyMs)
      .filter((latency): latency is number => latency !== undefined);
    
    analytics.sessionMetrics.averageLatencyMs = latencies.length > 0 
      ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
      : 0;

    // Determine dominant failure rule
    const ruleFailureRates = validationEvents.reduce((acc, event) => {
      if (event.data.outcome && !event.data.outcome.isValid) {
        const ruleType = event.data.outcome.ruleType;
        acc[ruleType] = (acc[ruleType] || 0) + 1;
      }
      return acc;
    }, {} as Record<DropValidationRuleType, number>);

    analytics.sessionMetrics.dominantFailureRule = Object.entries(ruleFailureRates)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'fatigue_threshold';

    // Update recent events (keep last 100)
    analytics.recentEvents = events.slice(-100);

    // Save updated analytics
    await saveAnalytics(analytics);
  }

  /**
   * Get filtered events
   */
  async function getFilteredEvents(filters: {
    dateRange?: number;
    severities?: DropValidationSeverity[];
    ruleTypes?: DropValidationRuleType[];
    eventTypes?: DropValidationEventType[];
  }): Promise<DropValidationTelemetryEvent[]> {
    const events = await loadEvents();
    return filterValidationEvents(events, filters);
  }

  /**
   * Export events
   */
  async function exportEvents(
    format: 'json' | 'csv' | 'markdown',
    filters?: {
      dateRange?: number;
      severities?: DropValidationSeverity[];
      ruleTypes?: DropValidationRuleType[];
      eventTypes?: DropValidationEventType[];
    }
  ): Promise<string> {
    const events = await getFilteredEvents(filters || {});
    
    let exportData: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportData = exportValidationEventsToJSON(events);
        filename = `drop-validation-telemetry-${Date.now()}.json`;
        break;
      case 'csv':
        exportData = exportValidationEventsToCSV(events);
        filename = `drop-validation-telemetry-${Date.now()}.csv`;
        break;
      case 'markdown':
        exportData = exportValidationEventsToMarkdown(events);
        filename = `drop-validation-telemetry-${Date.now()}.md`;
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Record export event
    await recordEvent({
      eventType: 'drop_validation_exported',
      data: {
        exportMetadata: {
          format,
          recordCount: events.length,
          filename,
        },
        context: {
          interactionMode: 'desktop', // Default, should be passed from UI
          screenDimensions: typeof window !== 'undefined' 
            ? { width: window.innerWidth, height: window.innerHeight }
            : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      },
    });

    // Update export history
    const analytics = await loadAnalytics();
    analytics.exportHistory.push({
      timestamp: Date.now(),
      format,
      recordCount: events.length,
      filename,
    });
    
    // Keep only last 50 exports
    analytics.exportHistory = analytics.exportHistory.slice(-50);
    await saveAnalytics(analytics);

    return exportData;
  }

  /**
   * Get current analytics
   */
  async function getCurrentAnalytics(): Promise<DropValidationAnalytics> {
    return await loadAnalytics();
  }

  /**
   * Reset analytics
   */
  async function resetAnalytics(): Promise<void> {
    const defaultAnalytics = createDefaultAnalytics();
    await saveAnalytics(defaultAnalytics);
    
    // Clear events
    await saveEvents([]);
  }

  /**
   * Emit telemetry event
   */
  function emitTelemetryEvent(event: DropValidationTelemetryEvent): void {
    if (!analyticsConfig.analytics.enabled) return;

    // Emit to global analytics system
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.eventType, {
        event_category: 'idle_village',
        event_label: event.data.outcome?.ruleType || 'validation',
        value: event.data.outcome?.isValid ? 1 : 0,
        custom_parameters: {
          severity: event.data.outcome?.severity,
          latency: event.data.performance?.validationLatencyMs,
          interactionMode: event.data.context.interactionMode,
        },
      });
    }

    // Emit to local analytics system
    console.debug('Drop Validation Telemetry:', event);
  }

  return {
    recordEvent,
    recordValidationOutcome,
    recordDropFeedbackShown,
    updateAnalytics,
    getFilteredEvents,
    exportEvents,
    getCurrentAnalytics,
    resetAnalytics,
    loadAnalytics,
    saveAnalytics,
  };
}

/**
 * Create drop validation analytics instance
 */
export function getDropValidationAnalytics(config?: Partial<DropValidationAnalyticsConfig>) {
  return useDropValidationAnalytics(config);
}

/**
 * Export validation data for external consumption
 */
export async function exportDropValidationAnalytics(
  format: 'json' | 'csv' | 'markdown' = 'json',
  filters?: {
    dateRange?: number;
    severities?: DropValidationSeverity[];
    ruleTypes?: DropValidationRuleType[];
    eventTypes?: DropValidationEventType[];
  }
): Promise<string> {
  const analytics = getDropValidationAnalytics();
  return await analytics.exportEvents(format, filters);
}

/**
 * Get current aggregated metrics
 */
export async function getCurrentAggregatedMetrics() {
  const analytics = getDropValidationAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.aggregatedMetrics;
}

/**
 * Get session metrics
 */
export async function getSessionMetrics() {
  const analytics = getDropValidationAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.sessionMetrics;
}

/**
 * Get export history
 */
export async function getExportHistory() {
  const analytics = getDropValidationAnalytics();
  const analyticsData = await analytics.getCurrentAnalytics();
  return analyticsData.exportHistory;
}
