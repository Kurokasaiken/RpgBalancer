/**
 * Idle Village Interaction Mode Configuration
 * 
 * Configuration for interaction mode diagnostics, KPI tracking,
 * and telemetry events for UX audit capabilities.
 * 
 * @since NP-063 – Idle Village Interaction Mode Diagnostics
 */

import { z } from 'zod';

/**
 * Interaction mode types supported by the sandbox
 */
export type InteractionMode = 'desktop' | 'mobile';

/**
 * Interaction source types for tracking
 */
export type InteractionSource = 'keyboard' | 'touch' | 'click' | null;

/**
 * KPI metrics to track for interaction mode analysis
 */
export interface InteractionModeKPI {
  /** Number of mode switches per session */
  switchRate: number;
  /** Total tap/click count per mode */
  tapCount: {
    desktop: number;
    mobile: number;
  };
  /** Error count per mode */
  errorCount: {
    desktop: number;
    mobile: number;
  };
  /** Average session duration per mode (seconds) */
  averageSessionDuration: {
    desktop: number;
    mobile: number;
  };
  /** Mode preference ratio */
  modePreference: {
    desktop: number; // percentage
    mobile: number;  // percentage
  };
  /** User satisfaction score (1-5) */
  satisfactionScore: number;
  /** Task completion rate per mode */
  taskCompletionRate: {
    desktop: number;
    mobile: number;
  };
}

/**
 * Interaction mode event data structure
 */
export interface InteractionModeEvent {
  /** Event timestamp */
  timestamp: number;
  /** Event type */
  type: 'mode_switch' | 'interaction' | 'error' | 'session_start' | 'session_end';
  /** Current interaction mode */
  mode: InteractionMode;
  /** Interaction source */
  source: InteractionSource;
  /** Event data payload */
  data: {
    /** Previous mode (for mode_switch events) */
    previousMode?: InteractionMode;
    /** Target element or action */
    target?: string;
    /** Error message (for error events) */
    error?: string;
    /** Session duration (for session_end events) */
    duration?: number;
    /** Tap coordinates (for interaction events) */
    coordinates?: { x: number; y: number };
    /** User agent info */
    userAgent?: string;
    /** Screen dimensions */
    screenDimensions?: { width: number; height: number };
  };
}

/**
 * Interaction mode diagnostics configuration
 */
export interface InteractionModeConfig {
  /** Configuration identifier */
  id: string;
  /** Configuration version */
  version: string;
  /** KPI tracking settings */
  kpi: {
    /** Enable KPI tracking */
    enabled: boolean;
    /** KPI calculation interval (milliseconds) */
    calculationIntervalMs: number;
    /** Session timeout (milliseconds) */
    sessionTimeoutMs: number;
    /** Minimum interactions for reliable KPI */
    minInteractionsForKPI: number;
    /** KPI aggregation window (milliseconds) */
    aggregationWindowMs: number;
  };
  /** Telemetry settings */
  telemetry: {
    /** Enable telemetry events */
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
  /** Filter settings */
  filters: {
    /** Available date ranges */
    dateRanges: Array<{
      id: string;
      label: string;
      value: number; // hours back from now
    }>;
    /** Available interaction modes */
    modes: InteractionMode[];
    /** Available interaction sources */
    sources: InteractionSource[];
    /** Event types to include */
    eventTypes: InteractionModeEvent['type'][];
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
  };
  /** UI settings */
  ui: {
    /** Enable real-time updates */
    enableRealTimeUpdates: boolean;
    /** Update interval (milliseconds) */
    updateIntervalMs: number;
    /** Maximum timeline points to display */
    maxTimelinePoints: number;
    /** Chart animation duration (milliseconds) */
    chartAnimationMs: number;
    /** Enable micro charts */
    enableMicroCharts: boolean;
  };
}

/**
 * Zod schema for InteractionModeKPI
 */
const InteractionModeKPISchema = z.object({
  switchRate: z.number().min(0),
  tapCount: z.object({
    desktop: z.number().min(0),
    mobile: z.number().min(0),
  }),
  errorCount: z.object({
    desktop: z.number().min(0),
    mobile: z.number().min(0),
  }),
  averageSessionDuration: z.object({
    desktop: z.number().min(0),
    mobile: z.number().min(0),
  }),
  modePreference: z.object({
    desktop: z.number().min(0).max(100),
    mobile: z.number().min(0).max(100),
  }),
  satisfactionScore: z.number().min(1).max(5),
  taskCompletionRate: z.object({
    desktop: z.number().min(0).max(1),
    mobile: z.number().min(0).max(1),
  }),
});

/**
 * Zod schema for InteractionModeEvent
 */
const InteractionModeEventSchema = z.object({
  timestamp: z.number(),
  type: z.enum(['mode_switch', 'interaction', 'error', 'session_start', 'session_end']),
  mode: z.enum(['desktop', 'mobile']),
  source: z.enum(['keyboard', 'touch', 'click', 'null']).transform(val => val === 'null' ? null : val),
  data: z.object({
    previousMode: z.enum(['desktop', 'mobile']).optional(),
    target: z.string().optional(),
    error: z.string().optional(),
    duration: z.number().min(0).optional(),
    coordinates: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    userAgent: z.string().optional(),
    screenDimensions: z.object({
      width: z.number().min(0),
      height: z.number().min(0),
    }).optional(),
  }),
});

/**
 * Zod schema for InteractionModeConfig
 */
const InteractionModeConfigSchema = z.object({
  id: z.string(),
  version: z.string(),
  kpi: z.object({
    enabled: z.boolean(),
    calculationIntervalMs: z.number().min(1000),
    sessionTimeoutMs: z.number().min(60000),
    minInteractionsForKPI: z.number().min(1),
    aggregationWindowMs: z.number().min(300000),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    throttleMs: z.number().min(100),
    maxEventsPerSession: z.number().min(100),
    retentionMs: z.number().min(86400000), // 24 hours
    batchSize: z.number().min(1),
  }),
  filters: z.object({
    dateRanges: z.array(z.object({
      id: z.string(),
      label: z.string(),
      value: z.number().min(1),
    })),
    modes: z.array(z.enum(['desktop', 'mobile'])),
    sources: z.array(z.enum(['keyboard', 'touch', 'click', 'null']).transform(val => val === 'null' ? null : val)),
    eventTypes: z.array(z.enum(['mode_switch', 'interaction', 'error', 'session_start', 'session_end'])),
  }),
  export: z.object({
    enabled: z.boolean(),
    formats: z.array(z.enum(['json', 'csv', 'markdown'])),
    maxRecordsPerExport: z.number().min(1),
    includeSensitiveData: z.boolean(),
    filenamePattern: z.string(),
  }),
  ui: z.object({
    enableRealTimeUpdates: z.boolean(),
    updateIntervalMs: z.number().min(1000),
    maxTimelinePoints: z.number().min(10),
    chartAnimationMs: z.number().min(0),
    enableMicroCharts: z.boolean(),
  }),
});

/**
 * Default interaction mode configuration
 */
export const DEFAULT_INTERACTION_MODE_CONFIG: InteractionModeConfig = {
  id: 'idle-village-interaction-mode-config',
  version: '1.0.0',
  kpi: {
    enabled: true,
    calculationIntervalMs: 30000, // 30 seconds
    sessionTimeoutMs: 1800000,      // 30 minutes
    minInteractionsForKPI: 10,
    aggregationWindowMs: 3600000,   // 1 hour
  },
  telemetry: {
    enabled: true,
    throttleMs: 1000,               // 1 second
    maxEventsPerSession: 1000,
    retentionMs: 86400000,          // 24 hours
    batchSize: 50,
  },
  filters: {
    dateRanges: [
      { id: 'last-hour', label: 'Last Hour', value: 1 },
      { id: 'last-6-hours', label: 'Last 6 Hours', value: 6 },
      { id: 'last-24-hours', label: 'Last 24 Hours', value: 24 },
      { id: 'last-week', label: 'Last Week', value: 168 },
      { id: 'last-month', label: 'Last Month', value: 720 },
    ],
    modes: ['desktop', 'mobile'],
    sources: ['keyboard', 'touch', 'click', null],
    eventTypes: ['mode_switch', 'interaction', 'error', 'session_start', 'session_end'],
  },
  export: {
    enabled: true,
    formats: ['json', 'csv', 'markdown'],
    maxRecordsPerExport: 10000,
    includeSensitiveData: false,
    filenamePattern: 'interaction-mode-diagnostics-{date}',
  },
  ui: {
    enableRealTimeUpdates: true,
    updateIntervalMs: 5000,         // 5 seconds
    maxTimelinePoints: 100,
    chartAnimationMs: 300,
    enableMicroCharts: true,
  },
};

/**
 * Create safe interaction mode configuration
 */
export function createSafeInteractionModeConfig(
  config?: Partial<InteractionModeConfig>
): InteractionModeConfig {
  const merged = { ...DEFAULT_INTERACTION_MODE_CONFIG, ...config };
  
  // Validate with Zod
  const result = InteractionModeConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid interaction mode config:', result.error);
    return DEFAULT_INTERACTION_MODE_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate interaction mode configuration
 */
export function isValidInteractionModeConfig(
  config: unknown
): config is InteractionModeConfig {
  return InteractionModeConfigSchema.safeParse(config).success;
}

/**
 * Validate interaction mode KPI
 */
export function isValidInteractionModeKPI(kpi: unknown): kpi is InteractionModeKPI {
  return InteractionModeKPISchema.safeParse(kpi).success;
}

/**
 * Validate interaction mode event
 */
export function isValidInteractionModeEvent(event: unknown): event is InteractionModeEvent {
  return InteractionModeEventSchema.safeParse(event).success;
}

/**
 * Calculate KPI from interaction events
 */
export function calculateKPIFromEvents(events: InteractionModeEvent[]): InteractionModeKPI {
  const now = Date.now();
  const sessionStart = events.find(e => e.type === 'session_start')?.timestamp || now;
  const sessionEnd = events.find(e => e.type === 'session_end')?.timestamp || now;
  
  // Calculate switch rate
  const modeSwitches = events.filter(e => e.type === 'mode_switch').length;
  const sessionDuration = (sessionEnd - sessionStart) / 1000; // seconds
  const switchRate = sessionDuration > 0 ? (modeSwitches / sessionDuration) * 60 : 0; // per minute
  
  // Calculate tap counts
  const tapCounts = events.reduce((acc, event) => {
    if (event.type === 'interaction') {
      acc[event.mode]++;
    }
    return acc;
  }, { desktop: 0, mobile: 0 });
  
  // Calculate error counts
  const errorCounts = events.reduce((acc, event) => {
    if (event.type === 'error') {
      acc[event.mode]++;
    }
    return acc;
  }, { desktop: 0, mobile: 0 });
  
  // Calculate average session duration per mode
  const modeSessions = events.reduce((acc, event) => {
    if (event.type === 'session_start' || event.type === 'session_end') {
      const key = event.mode;
      if (!acc[key]) {
        acc[key] = { start: 0, end: 0, count: 0 };
      }
      
      if (event.type === 'session_start') {
        acc[key].start = event.timestamp;
        acc[key].count++;
      } else if (event.type === 'session_end' && acc[key].start > 0) {
        acc[key].end = event.timestamp;
        acc[key].duration = (acc[key].end - acc[key].start) / 1000;
      }
    }
    return acc;
  }, {} as Record<InteractionMode, { start: number; end: number; count: number; duration?: number }>);
  
  const averageSessionDuration = {
    desktop: modeSessions.desktop?.duration || 0,
    mobile: modeSessions.mobile?.duration || 0,
  };
  
  // Calculate mode preference
  const totalInteractions = tapCounts.desktop + tapCounts.mobile;
  const modePreference = {
    desktop: totalInteractions > 0 ? (tapCounts.desktop / totalInteractions) * 100 : 50,
    mobile: totalInteractions > 0 ? (tapCounts.mobile / totalInteractions) * 100 : 50,
  };
  
  // Placeholder values for satisfaction and completion rate
  // These would be calculated from user feedback or task completion tracking
  const satisfactionScore = 4.0; // Default value
  const taskCompletionRate = {
    desktop: 0.85,
    mobile: 0.78,
  };
  
  return {
    switchRate,
    tapCount: tapCounts,
    errorCount: errorCounts,
    averageSessionDuration,
    modePreference,
    satisfactionScore,
    taskCompletionRate,
  };
}

/**
 * Filter interaction events based on criteria
 */
export function filterInteractionEvents(
  events: InteractionModeEvent[],
  filters: {
    dateRange?: number; // hours back from now
    modes?: InteractionMode[];
    sources?: InteractionSource[];
    eventTypes?: InteractionModeEvent['type'][];
  }
): InteractionModeEvent[] {
  const now = Date.now();
  const cutoffTime = filters.dateRange ? now - (filters.dateRange * 60 * 60 * 1000) : 0;
  
  return events.filter(event => {
    // Date range filter
    if (event.timestamp < cutoffTime) return false;
    
    // Mode filter
    if (filters.modes && !filters.modes.includes(event.mode)) return false;
    
    // Source filter
    if (filters.sources && !filters.sources.includes(event.source)) return false;
    
    // Event type filter
    if (filters.eventTypes && !filters.eventTypes.includes(event.type)) return false;
    
    return true;
  });
}

/**
 * Export interaction events to JSON
 */
export function exportEventsToJSON(events: InteractionModeEvent[]): string {
  return JSON.stringify({
    events,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    totalEvents: events.length,
  }, null, 2);
}

/**
 * Export interaction events to CSV
 */
export function exportEventsToCSV(events: InteractionModeEvent[]): string {
  const headers = [
    'timestamp',
    'type',
    'mode',
    'source',
    'target',
    'error',
    'duration',
    'coordinates_x',
    'coordinates_y',
    'userAgent',
    'screen_width',
    'screen_height',
  ];

  const rows = events.map(event => [
    new Date(event.timestamp).toISOString(),
    event.type,
    event.mode,
    event.source || '',
    event.data.target || '',
    event.data.error || '',
    event.data.duration || '',
    event.data.coordinates?.x || '',
    event.data.coordinates?.y || '',
    event.data.userAgent || '',
    event.data.screenDimensions?.width || '',
    event.data.screenDimensions?.height || '',
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Export interaction events to Markdown
 */
export function exportEventsToMarkdown(events: InteractionModeEvent[]): string {
  const header = `# Interaction Mode Diagnostics

**Exported:** ${new Date().toLocaleString()}  
**Total Events:** ${events.length}

## Event Summary

| Type | Count | Desktop | Mobile |
|------|-------|---------|--------|
`;

  const eventTypes = [...new Set(events.map(e => e.type))];
  const summaryRows = eventTypes.map(type => {
    const typeEvents = events.filter(e => e.type === type);
    const desktopCount = typeEvents.filter(e => e.mode === 'desktop').length;
    const mobileCount = typeEvents.filter(e => e.mode === 'mobile').length;
    
    return `| ${type} | ${typeEvents.length} | ${desktopCount} | ${mobileCount} |`;
  }).join('\n');

  const recentEvents = events.slice(-10).map(event => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    const data = event.data;
    
    return `### ${time} - ${event.type} (${event.mode})
- **Source:** ${event.source || 'N/A'}
- **Target:** ${data.target || 'N/A'}
${data.error ? `- **Error:** ${data.error}` : ''}
${data.duration ? `- **Duration:** ${data.duration}s` : ''}
`;
  }).join('\n\n---\n\n');

  return header + summaryRows + '\n\n## Recent Events\n\n' + recentEvents;
}
