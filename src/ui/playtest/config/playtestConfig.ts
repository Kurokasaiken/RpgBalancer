/**
 * Mobile Playtest Logger Configuration - NP-225
 * 
 * Config-first playtest logging system with heatmaps and bug reports.
 * 
 * @since 2026-01-24
 */

import { z } from 'zod';

/**
 * Playtest event types
 */
export const PlaytestEventTypeSchema = z.enum([
  'tap',
  'swipe',
  'pinch',
  'scroll',
  'navigation',
  'error',
  'crash',
  'performance',
  'interaction',
  'session_start',
  'session_end',
]);

export type PlaytestEventType = z.infer<typeof PlaytestEventTypeSchema>;

/**
 * Device information
 */
export const DeviceInfoSchema = z.object({
  userAgent: z.string(),
  platform: z.string(),
  vendor: z.string(),
  deviceMemory: z.number().optional(),
  hardwareConcurrency: z.number().optional(),
  screenResolution: z.string(),
  colorDepth: z.number(),
  pixelRatio: z.number(),
  touchSupport: z.boolean(),
  maxTouchPoints: z.number(),
  connectionType: z.string().optional(),
  effectiveType: z.string().optional(),
  downlink: z.number().optional(),
  rtt: z.number().optional(),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

/**
 * Playtest event
 */
export const PlaytestEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: PlaytestEventTypeSchema,
  element: z.string().optional(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  duration: z.number().optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  pressure: z.number().optional(),
  velocity: z.number().optional(),
  target: z.string().optional(),
  value: z.unknown().optional(),
  stackTrace: z.string().optional(),
  performanceMetrics: z.object({
    fps: z.number().optional(),
    memory: z.number().optional(),
    timing: z.number().optional(),
  }).optional(),
  sessionId: z.string(),
  userId: z.string().optional(),
});

export type PlaytestEvent = z.infer<typeof PlaytestEventSchema>;

/**
 * Playtest session
 */
export const PlaytestSessionSchema = z.object({
  id: z.string(),
  startTime: z.number(),
  endTime: z.number().optional(),
  duration: z.number().optional(),
  deviceInfo: DeviceInfoSchema,
  events: z.array(PlaytestEventSchema),
  metadata: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  buildVersion: z.string(),
  platform: z.string(),
  completed: z.boolean().default(false),
  crashDetected: z.boolean().default(false),
  errorCount: z.number().default(0),
  interactionCount: z.number().default(0),
});

export type PlaytestSession = z.infer<typeof PlaytestSessionSchema>;

/**
 * Heatmap data point
 */
export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  type: PlaytestEventType;
  timestamp: number;
}

/**
 * Bug report
 */
export interface BugReport {
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'error' | 'crash' | 'performance' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  environment: {
    device: DeviceInfo;
    buildVersion: string;
    platform: string;
  };
  attachments: {
    screenshot?: string;
    logs: string[];
    performance: Record<string, number>;
  };
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Playtest configuration
 */
export const PlaytestConfigSchema = z.object({
  logging: z.object({
    enabled: z.boolean(),
    maxEventsPerSession: z.number(),
    maxSessionDuration: z.number(),
    autoSave: z.boolean(),
    compressionEnabled: z.boolean(),
    compressionLevel: z.number().min(1).max(9),
  }),
  
  heatmap: z.object({
    enabled: z.boolean(),
    resolution: z.number(),
    maxPoints: z.number(),
    fadeDuration: z.number(),
    colorScheme: z.enum(['heat', 'blue', 'green', 'purple']),
    showGrid: z.boolean(),
    showLabels: z.boolean(),
  }),
  
  bugReporting: z.object({
    enabled: z.boolean(),
    autoDetect: z.boolean(),
    screenshotOnCrash: z.boolean(),
    includePerformance: z.boolean(),
    maxReportsPerSession: z.number(),
    severityThreshold: z.enum(['medium', 'high', 'critical']),
  }),
  
  performance: z.object({
    enabled: z.boolean(),
    sampleInterval: z.number(),
    metrics: z.array(z.enum(['fps', 'memory', 'timing', 'network'])),
    alertThresholds: z.object({
      fps: z.number(),
      memory: z.number(),
      timing: z.number(),
    }),
  }),
  
  privacy: z.object({
    anonymizeData: z.boolean(),
    excludeSensitiveContent: z.boolean(),
    dataRetentionDays: z.number(),
    requireConsent: z.boolean(),
  }),
  
  ui: z.object({
    showOverlay: z.boolean(),
    overlayOpacity: z.number().min(0).max(1),
    showSessionInfo: z.boolean(),
    showEventCounter: z.boolean(),
    allowManualReport: z.boolean(),
  }),
});

export type PlaytestConfig = z.infer<typeof PlaytestConfigSchema>;

/**
 * Default configuration
 */
export const DEFAULT_PLAYTEST_CONFIG: PlaytestConfig = {
  logging: {
    enabled: true,
    maxEventsPerSession: 10000,
    maxSessionDuration: 3600000, // 1 hour
    autoSave: true,
    compressionEnabled: true,
    compressionLevel: 6,
  },
  
  heatmap: {
    enabled: true,
    resolution: 50,
    maxPoints: 1000,
    fadeDuration: 30000, // 30 seconds
    colorScheme: 'heat',
    showGrid: false,
    showLabels: true,
  },
  
  bugReporting: {
    enabled: true,
    autoDetect: true,
    screenshotOnCrash: true,
    includePerformance: true,
    maxReportsPerSession: 50,
    severityThreshold: 'medium',
  },
  
  performance: {
    enabled: true,
    sampleInterval: 1000, // 1 second
    metrics: ['fps', 'memory', 'timing'],
    alertThresholds: {
      fps: 30,
      memory: 100 * 1024 * 1024, // 100MB
      timing: 1000, // 1 second
    },
  },
  
  privacy: {
    anonymizeData: true,
    excludeSensitiveContent: true,
    dataRetentionDays: 30,
    requireConsent: false,
  },
  
  ui: {
    showOverlay: false,
    overlayOpacity: 0.8,
    showSessionInfo: true,
    showEventCounter: true,
    allowManualReport: true,
  },
};

/**
 * Get device information
 */
export function getDeviceInfo(): DeviceInfo {
  const navigator = globalThis.navigator;
  const screen = globalThis.screen;
  const performance = globalThis.performance;
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    touchSupport: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
}

/**
 * Generate unique event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if event type is interaction
 */
export function isInteractionEvent(type: PlaytestEventType): boolean {
  return ['tap', 'swipe', 'pinch', 'scroll', 'interaction'].includes(type);
}

/**
 * Check if event type is error
 */
export function isErrorEvent(type: PlaytestEventType): boolean {
  return ['error', 'crash'].includes(type);
}

/**
 * Get event severity
 */
export function getEventSeverity(event: PlaytestEvent): 'low' | 'medium' | 'high' | 'critical' {
  if (event.type === 'crash') return 'critical';
  if (event.type === 'error') return 'high';
  if (event.type === 'performance') return 'medium';
  return 'low';
}

/**
 * Compress session data
 */
export async function compressSession(session: PlaytestSession): Promise<string> {
  if (!DEFAULT_PLAYTEST_CONFIG.logging.compressionEnabled) {
    return JSON.stringify(session);
  }
  
  // Simple compression - in production, use proper compression library
  const compressed = JSON.stringify(session)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/\s+/g, ' ') // Minify whitespace
    .replace(/,}/g, '}') // Remove trailing commas
    .replace(/,\]/g, ']'); // Remove trailing commas in arrays
  
  return compressed;
}

/**
 * Decompress session data
 */
export async function decompressSession(data: string): Promise<PlaytestSession> {
  try {
    // Simple decompression - reverse of above
    const expanded = data
      .replace(/(\w+):/g, '"$1":') // Add quotes back to keys
      .replace(/}/g, ',}') // Add trailing commas
      .replace(/\]/g, ',]'); // Add trailing commas in arrays
    
    return JSON.parse(expanded);
  } catch (error) {
    // Fallback to normal JSON parsing
    return JSON.parse(data);
  }
}

/**
 * Anonymize sensitive data
 */
export function anonymizeEvent(event: PlaytestEvent): PlaytestEvent {
  if (!DEFAULT_PLAYTEST_CONFIG.privacy.anonymizeData) {
    return event;
  }
  
  const anonymized = { ...event };
  
  // Remove sensitive fields
  if (anonymized.target) {
    anonymized.target = anonymized.target.replace(/[a-zA-Z0-9]/g, '*');
  }
  
  if (anonymized.element) {
    anonymized.element = anonymized.element.replace(/[a-zA-Z0-9]/g, '*');
  }
  
  // Remove stack trace for privacy
  if (anonymized.stackTrace) {
    anonymized.stackTrace = '[REDACTED]';
  }
  
  return anonymized;
}

/**
 * Filter sensitive content
 */
export function filterSensitiveContent(content: string): string {
  if (!DEFAULT_PLAYTEST_CONFIG.privacy.excludeSensitiveContent) {
    return content;
  }
  
  // Remove potential sensitive patterns
  return content
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]') // Credit cards
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]') // IP addresses
    .replace(/\b[A-Za-z0-9+/]{20,}={0,2}\b/g, '[TOKEN]'); // Tokens
}
