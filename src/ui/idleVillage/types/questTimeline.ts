/**
 * NP-030 – Idle Village Quest Timeline Renderer
 * 
 * Quest timeline data types and interfaces for Gantt-like
 * timeline visualization with zoom/pan, risk overlay, and export.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

// Core timeline types
export interface QuestTimelineEvent {
  id: string;
  questId: string;
  residentId: string;
  type: 'quest_start' | 'quest_progress' | 'quest_complete' | 'quest_fail' | 'injury' | 'death' | 'near_miss' | 'recovery';
  timestamp: number;
  duration?: number; // in milliseconds
  title: string;
  description?: string;
  location?: string;
  coordinates?: { x: number; y: number };
  metadata: {
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    tags: string[];
    dependencies: string[]; // event IDs this event depends on
    assignees: string[]; // resident IDs
  };
  risk: {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    probability: number; // 0-1
    impact: number; // 0-1
    mitigation?: string;
  };
  resources: {
    required: Array<{
      type: 'resident' | 'equipment' | 'material' | 'time';
      name: string;
      quantity: number;
      unit: string;
    }>;
    allocated: Array<{
      type: 'resident' | 'equipment' | 'material' | 'time';
      name: string;
      quantity: number;
      unit: string;
    }>;
  };
  progress: {
    percentage: number; // 0-100
    milestones: Array<{
      id: string;
      name: string;
      completed: boolean;
      timestamp: number;
    }>;
  };
}

export interface QuestTimeline {
  id: string;
  name: string;
  description?: string;
  startTime: number;
  endTime: number;
  events: QuestTimelineEvent[];
  residents: Array<{
    id: string;
    name: string;
    level: number;
    role: string;
    availability: Array<{
      start: number;
      end: number;
      available: boolean;
    }>;
  }>;
  locations: Array<{
    id: string;
    name: string;
    type: 'settlement' | 'dungeon' | 'wilderness' | 'special';
    coordinates?: { x: number; y: number };
    riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  }>;
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    tags: string[];
    category: string;
  };
}

// Timeline visualization types
export interface TimelineViewConfig {
  timeRange: {
    start: number;
    end: number;
  };
  zoom: {
    level: number; // 0.1 to 10
    center: number; // timestamp
  };
  pan: {
    x: number;
    y: number;
  };
  layout: {
    type: 'gantt' | 'calendar' | 'timeline' | 'network';
    groupBy: 'resident' | 'location' | 'quest' | 'type' | 'risk' | 'none';
    sortBy: 'timestamp' | 'duration' | 'priority' | 'risk' | 'name';
    sortOrder: 'asc' | 'desc';
  };
  display: {
    showGrid: boolean;
    showDependencies: boolean;
    showRiskOverlay: boolean;
    showProgress: boolean;
    showResources: boolean;
    showAnnotations: boolean;
    compactMode: boolean;
    colorScheme: 'default' | 'risk' | 'priority' | 'status' | 'resident';
  };
  filters: {
    eventTypes: QuestTimelineEvent['type'][];
    residents: string[];
    locations: string[];
    riskLevels: QuestTimelineEvent['risk']['level'][];
    statuses: QuestTimelineEvent['metadata']['status'][];
    priorities: QuestTimelineEvent['metadata']['priority'][];
    dateRange?: { start: number; end: number };
    searchText?: string;
  };
  annotations: Array<{
    id: string;
    type: 'marker' | 'note' | 'milestone' | 'deadline';
    timestamp: number;
    title: string;
    description?: string;
    color: string;
    icon?: string;
  }>;
}

export interface TimelineRenderContext {
  canvas: {
    width: number;
    height: number;
    scale: number; // pixels per millisecond
    offset: { x: number; y: number };
  };
  time: {
    start: number;
    end: number;
    duration: number;
  };
  viewport: {
    start: number;
    end: number;
    visibleEvents: QuestTimelineEvent[];
  };
  groups: Array<{
    id: string;
    name: string;
    type: string;
    events: QuestTimelineEvent[];
    y: number;
    height: number;
  }>;
}

// Risk overlay types
export interface RiskOverlayConfig {
  enabled: boolean;
  type: 'heatmap' | 'gradient' | 'markers' | 'zones';
  opacity: number; // 0-1
  colors: {
    none: string;
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  aggregation: {
    method: 'max' | 'average' | 'weighted' | 'cumulative';
    window: number; // in milliseconds
  };
}

// Export types
export interface TimelineExportConfig {
  format: 'png' | 'svg' | 'pdf' | 'json' | 'csv' | 'excel';
  quality: 'low' | 'medium' | 'high';
  options: {
    includeAnnotations: boolean;
    includeRiskOverlay: boolean;
    includeGrid: boolean;
    includeLegend: boolean;
    includeMetadata: boolean;
    backgroundColor?: string;
    watermark?: string;
  };
  dimensions: {
    width: number;
    height: number;
    scale: number;
  };
}

// Interaction types
export interface TimelineInteraction {
  type: 'click' | 'hover' | 'select' | 'drag' | 'resize' | 'context-menu';
  target: 'event' | 'annotation' | 'grid' | 'timeline' | 'group';
  position: { x: number; y: number };
  timestamp?: number;
  event?: QuestTimelineEvent;
  annotation?: TimelineViewConfig['annotations'][0];
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

export interface TimelineSelection {
  events: QuestTimelineEvent[];
  annotations: TimelineViewConfig['annotations'][0];
  timeRange: { start: number; end: number };
  groups: string[];
}

// Performance metrics
export interface TimelinePerformanceMetrics {
  renderTime: number;
  eventCount: number;
  fps: number;
  memoryUsage: number;
  zoomLevel: number;
  viewportSize: { width: number; height: number };
  lastUpdate: number;
}

// Validation types
export interface TimelineValidationError {
  type: 'event_overlap' | 'dependency_cycle' | 'resource_conflict' | 'time_paradox' | 'invalid_data';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  eventIds: string[];
  suggestion?: string;
}

// Configuration schema
export interface TimelineConfigSchema {
  version: string;
  defaultView: TimelineViewConfig;
  riskOverlay: RiskOverlayConfig;
  export: TimelineExportConfig;
  validation: {
    enabled: boolean;
    rules: Array<{
      name: string;
      enabled: boolean;
      severity: 'warning' | 'error' | 'critical';
      condition: string;
      message: string;
    }>;
  };
  performance: {
    maxEvents: number;
    renderTimeout: number;
    enableVirtualization: boolean;
    cacheSize: number;
  };
  accessibility: {
    enableKeyboardNavigation: boolean;
    enableScreenReader: boolean;
    highContrastMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Utility types
export type TimelineEventGroup = {
  [key: string]: QuestTimelineEvent[];
};

export type TimelineColorScheme = {
  [key: string]: string;
};

export type TimelineLegendItem = {
  type: 'event' | 'status' | 'risk' | 'priority' | 'resident';
  label: string;
  color: string;
  count?: number;
};

// Default configurations
export const DEFAULT_TIMELINE_VIEW_CONFIG: TimelineViewConfig = {
  timeRange: {
    start: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: Date.now() + (7 * 24 * 60 * 60 * 1000),   // 7 days from now
  },
  zoom: {
    level: 1,
    center: Date.now(),
  },
  pan: {
    x: 0,
    y: 0,
  },
  layout: {
    type: 'gantt',
    groupBy: 'resident',
    sortBy: 'timestamp',
    sortOrder: 'asc',
  },
  display: {
    showGrid: true,
    showDependencies: true,
    showRiskOverlay: true,
    showProgress: true,
    showResources: false,
    showAnnotations: true,
    compactMode: false,
    colorScheme: 'default',
  },
  filters: {
    eventTypes: [],
    residents: [],
    locations: [],
    riskLevels: [],
    statuses: [],
    priorities: [],
  },
  annotations: [],
};

export const DEFAULT_RISK_OVERLAY_CONFIG: RiskOverlayConfig = {
  enabled: true,
  type: 'heatmap',
  opacity: 0.3,
  colors: {
    none: '#10b981',
    low: '#f59e0b',
    medium: '#ef4444',
    high: '#991b1b',
    critical: '#450a0a',
  },
  thresholds: {
    low: 0.2,
    medium: 0.4,
    high: 0.7,
    critical: 0.9,
  },
  aggregation: {
    method: 'max',
    window: 60 * 60 * 1000, // 1 hour
  },
};

export const DEFAULT_EXPORT_CONFIG: TimelineExportConfig = {
  format: 'png',
  quality: 'high',
  options: {
    includeAnnotations: true,
    includeRiskOverlay: true,
    includeGrid: true,
    includeLegend: true,
    includeMetadata: true,
  },
  dimensions: {
    width: 1920,
    height: 1080,
    scale: 2,
  },
};

export const DEFAULT_TIMELINE_CONFIG_SCHEMA: TimelineConfigSchema = {
  version: '1.0.0',
  defaultView: DEFAULT_TIMELINE_VIEW_CONFIG,
  riskOverlay: DEFAULT_RISK_OVERLAY_CONFIG,
  export: DEFAULT_EXPORT_CONFIG,
  validation: {
    enabled: true,
    rules: [
      {
        name: 'no_overlapping_events',
        enabled: true,
        severity: 'warning',
        condition: 'events.overlap',
        message: 'Events are overlapping in time',
      },
      {
        name: 'no_dependency_cycles',
        enabled: true,
        severity: 'error',
        condition: 'dependencies.cycle',
        message: 'Circular dependency detected',
      },
      {
        name: 'resource_availability',
        enabled: true,
        severity: 'warning',
        condition: 'resources.unavailable',
        message: 'Resource not available at requested time',
      },
    ],
  },
  performance: {
    maxEvents: 10000,
    renderTimeout: 5000,
    enableVirtualization: true,
    cacheSize: 1000,
  },
  accessibility: {
    enableKeyboardNavigation: true,
    enableScreenReader: true,
    highContrastMode: false,
    fontSize: 'medium',
  },
};

// Color schemes
export const TIMELINE_COLOR_SCHEMES: Record<string, TimelineColorScheme> = {
  default: {
    'quest_start': '#3b82f6',
    'quest_progress': '#f59e0b',
    'quest_complete': '#10b981',
    'quest_fail': '#ef4444',
    'injury': '#f97316',
    'death': '#991b1b',
    'near_miss': '#fbbf24',
    'recovery': '#06b6d4',
    'grid': '#e5e7eb',
    'text': '#374151',
    'background': '#ffffff',
    'selection': '#dbeafe',
    'highlight': '#fef3c7',
  },
  risk: {
    'none': '#10b981',
    'low': '#f59e0b',
    'medium': '#ef4444',
    'high': '#991b1b',
    'critical': '#450a0a',
    'grid': '#e5e7eb',
    'text': '#374151',
    'background': '#ffffff',
    'selection': '#dbeafe',
    'highlight': '#fef3c7',
  },
  priority: {
    'low': '#6b7280',
    'medium': '#f59e0b',
    'high': '#ef4444',
    'critical': '#991b1b',
    'grid': '#e5e7eb',
    'text': '#374151',
    'background': '#ffffff',
    'selection': '#dbeafe',
    'highlight': '#fef3c7',
  },
  status: {
    'pending': '#6b7280',
    'in_progress': '#3b82f6',
    'completed': '#10b981',
    'failed': '#ef4444',
    'cancelled': '#991b1b',
    'grid': '#e5e7eb',
    'text': '#374151',
    'background': '#ffffff',
    'selection': '#dbeafe',
    'highlight': '#fef3c7',
  },
  resident: {
    'resident_1': '#3b82f6',
    'resident_2': '#10b981',
    'resident_3': '#f59e0b',
    'resident_4': '#ef4444',
    'resident_5': '#8b5cf6',
    'resident_6': '#06b6d4',
    'resident_7': '#f97316',
    'resident_8': '#84cc16',
    'grid': '#e5e7eb',
    'text': '#374151',
    'background': '#ffffff',
    'selection': '#dbeafe',
    'highlight': '#fef3c7',
  },
};

// Utility functions
export function getEventColor(event: QuestTimelineEvent, colorScheme: string = 'default'): string {
  const colors = TIMELINE_COLOR_SCHEMES[colorScheme] || TIMELINE_COLOR_SCHEMES.default;
  
  switch (colorScheme) {
    case 'risk':
      return colors[event.risk.level] || colors.default;
    case 'priority':
      return colors[event.metadata.priority] || colors.default;
    case 'status':
      return colors[event.metadata.status] || colors.default;
    case 'resident':
      return colors[`resident_${event.residentId}`] || colors.default;
    default:
      return colors[event.type] || colors.default;
  }
}

export function getEventDuration(event: QuestTimelineEvent): number {
  return event.duration || 0;
}

export function getEventProgress(event: QuestTimelineEvent): number {
  return event.progress.percentage || 0;
}

export function getEventRisk(event: QuestTimelineEvent): number {
  return event.risk.probability * event.risk.impact;
}

export function isEventInRange(event: QuestTimelineEvent, start: number, end: number): boolean {
  const eventStart = event.timestamp;
  const eventEnd = event.timestamp + getEventDuration(event);
  return eventStart < end && eventEnd > start;
}

export function sortEvents(events: QuestTimelineEvent[], sortBy: string, sortOrder: 'asc' | 'desc'): QuestTimelineEvent[] {
  return [...events].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'timestamp':
        aValue = a.timestamp;
        bValue = b.timestamp;
        break;
      case 'duration':
        aValue = getEventDuration(a);
        bValue = getEventDuration(b);
        break;
      case 'priority':
        aValue = a.metadata.priority;
        bValue = b.metadata.priority;
        break;
      case 'risk':
        aValue = getEventRisk(a);
        bValue = getEventRisk(b);
        break;
      case 'name':
        aValue = a.title;
        bValue = b.title;
        break;
      default:
        aValue = a.timestamp;
        bValue = b.timestamp;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupEvents(events: QuestTimelineEvent[], groupBy: string): TimelineEventGroup {
  const groups: TimelineEventGroup = {};
  
  events.forEach(event => {
    let key: string;
    
    switch (groupBy) {
      case 'resident':
        key = event.residentId;
        break;
      case 'location':
        key = event.location || 'unknown';
        break;
      case 'quest':
        key = event.questId;
        break;
      case 'type':
        key = event.type;
        break;
      case 'risk':
        key = event.risk.level;
        break;
      default:
        key = 'all';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
  });
  
  return groups;
}

export function validateTimeline(timeline: QuestTimeline): TimelineValidationError[] {
  const errors: TimelineValidationError[] = [];
  
  // Check for overlapping events
  const events = timeline.events;
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const eventA = events[i];
      const eventB = events[j];
      
      if (eventA.residentId === eventB.residentId) {
        const aStart = eventA.timestamp;
        const aEnd = eventA.timestamp + getEventDuration(eventA);
        const bStart = eventB.timestamp;
        const bEnd = eventB.timestamp + getEventDuration(eventB);
        
        if (aStart < bEnd && bStart < aEnd) {
          errors.push({
            type: 'event_overlap',
            severity: 'warning',
            message: `Events ${eventA.title} and ${eventB.title} overlap for resident ${eventA.residentId}`,
            eventIds: [eventA.id, eventB.id],
            suggestion: 'Consider rescheduling one of the events',
          });
        }
      }
    }
  }
  
  // Check for dependency cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(eventId: string): boolean {
    if (recursionStack.has(eventId)) return true;
    if (visited.has(eventId)) return false;
    
    visited.add(eventId);
    recursionStack.add(eventId);
    
    const event = events.find(e => e.id === eventId);
    if (event) {
      for (const depId of event.metadata.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    recursionStack.delete(eventId);
    return false;
  }
  
  for (const event of events) {
    if (hasCycle(event.id)) {
      errors.push({
        type: 'dependency_cycle',
        severity: 'error',
        message: `Circular dependency detected involving event ${event.title}`,
        eventIds: [event.id],
        suggestion: 'Remove or restructure dependencies',
      });
    }
  }
  
  return errors;
}
