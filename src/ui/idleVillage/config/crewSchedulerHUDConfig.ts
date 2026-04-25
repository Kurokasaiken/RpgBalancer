/**
 * Crew Scheduler HUD Configuration - NP-017
 * 
 * Configuration schema for the Idle Village Crew Scheduler HUD Integration.
 * Defines card layouts, quick controls, telemetry settings, and visual styling
 * for crew status monitoring and management.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

/**
 * Crew member status levels for HUD display
 */
export enum CrewStatusLevel {
  AVAILABLE = 'available',
  BUSY = 'busy',
  FATIGUED = 'fatigued',
  OFFLINE = 'offline',
  SPECIALIZING = 'specializing',
}

/**
 * Quick control types for crew management
 */
export enum CrewQuickControlType {
  ASSIGN_ACTIVITY = 'assign_activity',
  REST_RESIDENT = 'rest_resident',
  SPECIALIZE = 'specialize',
  EMERGENCY_RECALL = 'emergency_recall',
  PRIORITY_BOOST = 'priority_boost',
  FATIGUE_MANAGE = 'fatigue_manage',
}

/**
 * Card display modes for crew HUD
 */
export enum CrewCardDisplayMode {
  COMPACT = 'compact',
  DETAILED = 'detailed',
  MINIMAL = 'minimal',
  OVERLAY = 'overlay',
}

/**
 * Telemetry event types for crew scheduler
 */
export enum CrewTelemetryEventType {
  CREW_STATUS_CHANGE = 'crew_status_change',
  ASSIGNMENT_REQUEST = 'assignment_request',
  ASSIGNMENT_COMPLETE = 'assignment_complete',
  PRIORITY_ADJUSTMENT = 'priority_adjustment',
  FATIGUE_WARNING = 'fatigue_warning',
  SPECIALIZATION_CHANGE = 'specialization_change',
  EMERGENCY_RECALL = 'emergency_recall',
  HUD_INTERACTION = 'hud_interaction',
}

/**
 * Individual crew member card configuration
 */
export interface CrewCardConfig {
  /** Unique identifier for the crew member */
  id: string;
  /** Crew member display name */
  name: string;
  /** Current status level */
  status: CrewStatusLevel;
  /** Current activity assignment (if any) */
  currentActivity?: string;
  /** Fatigue level (0-1) */
  fatigueLevel: number;
  /** Specialization tags */
  specializations: string[];
  /** Priority score in queue */
  priorityScore: number;
  /** Estimated time until available */
  timeUntilAvailable?: number;
  /** Performance metrics */
  performance: {
    assignmentsCompleted: number;
    averageCompletionTime: number;
    successRate: number;
  };
  /** Visual display configuration */
  display: {
    avatar?: string;
    color: string;
    icon: string;
    badges: string[];
  };
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Quick control configuration
 */
export interface CrewQuickControlConfig {
  /** Control type identifier */
  type: CrewQuickControlType;
  /** Display label */
  label: string;
  /** Icon identifier */
  icon: string;
  /** Whether control is enabled */
  enabled: boolean;
  /** Required permissions */
  permissions: string[];
  /** Action payload */
  action: {
    type: string;
    payload: Record<string, any>;
  };
  /** Visual configuration */
  visual: {
    color: string;
    variant: 'primary' | 'secondary' | 'warning' | 'danger';
    size: 'small' | 'medium' | 'large';
  };
}

/**
 * Telemetry configuration for crew scheduler
 */
export interface CrewTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Event types to track */
  trackedEvents: CrewTelemetryEventType[];
  /** Sampling rate for events (0-1) */
  samplingRate: number;
  /** Batch size for event transmission */
  batchSize: number;
  /** Transmission interval in milliseconds */
  transmissionInterval: number;
  /** Whether to include detailed diagnostics */
  includeDiagnostics: boolean;
  /** Privacy settings */
  privacy: {
    anonymizeNames: boolean;
    excludePersonalData: boolean;
    maxHistoryRetention: number; // in hours
  };
}

/**
 * HUD layout and positioning configuration
 */
export interface CrewHUDLayoutConfig {
  /** HUD position on screen */
  position: {
    x: number;
    y: number;
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  /** HUD dimensions */
  dimensions: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };
  /** Card arrangement */
  cardLayout: {
    mode: 'grid' | 'list' | 'carousel';
    columns: number;
    rows: number;
    spacing: number;
    scrollable: boolean;
  };
  /** Responsive breakpoints */
  responsive: {
    mobile: {
      columns: number;
      cardSize: 'compact' | 'minimal';
    };
    tablet: {
      columns: number;
      cardSize: 'compact' | 'detailed';
    };
    desktop: {
      columns: number;
      cardSize: 'detailed' | 'overlay';
    };
  };
}

/**
 * Visual styling configuration
 */
export interface CrewHUDVisualConfig {
  /** Theme colors */
  colors: {
    background: string;
    foreground: string;
    border: string;
    shadow: string;
    accent: string;
    warning: string;
    danger: string;
    success: string;
  };
  /** Status level colors */
  statusColors: {
    [CrewStatusLevel.AVAILABLE]: string;
    [CrewStatusLevel.BUSY]: string;
    [CrewStatusLevel.FATIGUED]: string;
    [CrewStatusLevel.OFFLINE]: string;
    [CrewStatusLevel.SPECIALIZING]: string;
  };
  /** Typography */
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
    fontWeight: {
      normal: number;
      bold: number;
    };
  };
  /** Animation settings */
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    stagger: number;
  };
  /** Border radius */
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Performance and optimization settings
 */
export interface CrewHUDPerformanceConfig {
  /** Maximum number of crew cards to display */
  maxCrewCards: number;
  /** Update interval for crew status (milliseconds) */
  statusUpdateInterval: number;
  /** Debounce time for quick controls (milliseconds) */
  controlDebounceMs: number;
  /** Whether to enable virtual scrolling */
  enableVirtualScrolling: boolean;
  /** Cache settings */
  cache: {
    enabled: boolean;
    ttl: number; // time to live in milliseconds
    maxSize: number;
  };
  /** Lazy loading settings */
  lazyLoading: {
    enabled: boolean;
    threshold: number; // pixels from viewport
    batchSize: number;
  };
}

/**
 * Complete crew scheduler HUD configuration
 */
export interface CrewSchedulerHUDConfig {
  /** Layout and positioning */
  layout: CrewHUDLayoutConfig;
  /** Visual styling */
  visual: CrewHUDVisualConfig;
  /** Performance settings */
  performance: CrewHUDPerformanceConfig;
  /** Telemetry configuration */
  telemetry: CrewTelemetryConfig;
  /** Quick controls configuration */
  quickControls: CrewQuickControlConfig[];
  /** Card display settings */
  cardDisplay: {
    defaultMode: CrewCardDisplayMode;
    showPerformance: boolean;
    showSpecializations: boolean;
    showFatigueBar: boolean;
    showPriorityScore: boolean;
    showTimeUntilAvailable: boolean;
  };
  /** Filter and sorting options */
  filters: {
    status: CrewStatusLevel[];
    specializations: string[];
    activities: string[];
    fatigueRange: [number, number];
  };
  /** Sorting options */
  sorting: {
    defaultField: 'name' | 'status' | 'priority' | 'fatigue' | 'performance';
    defaultDirection: 'asc' | 'desc';
    availableFields: string[];
  };
}

/**
 * Default crew scheduler HUD configuration
 */
export const DEFAULT_CREW_SCHEDULER_HUD_CONFIG: CrewSchedulerHUDConfig = {
  layout: {
    position: {
      x: 20,
      y: 20,
      anchor: 'top-right',
    },
    dimensions: {
      width: 400,
      height: 600,
      minWidth: 300,
      minHeight: 200,
      maxWidth: 600,
      maxHeight: 800,
    },
    cardLayout: {
      mode: 'list',
      columns: 1,
      rows: 5,
      spacing: 8,
      scrollable: true,
    },
    responsive: {
      mobile: {
        columns: 1,
        cardSize: 'compact',
      },
      tablet: {
        columns: 1,
        cardSize: 'detailed',
      },
      desktop: {
        columns: 1,
        cardSize: 'detailed',
      },
    },
  },
  visual: {
    colors: {
      background: 'rgba(30, 41, 59, 0.95)', // slate-800 with opacity
      foreground: 'rgb(248, 250, 252)', // slate-50
      border: 'rgb(71, 85, 105)', // slate-600
      shadow: 'rgba(0, 0, 0, 0.3)',
      accent: 'rgb(59, 130, 246)', // blue-500
      warning: 'rgb(251, 191, 36)', // amber-400
      danger: 'rgb(239, 68, 68)', // red-500
      success: 'rgb(34, 197, 94)', // green-500
    },
    statusColors: {
      [CrewStatusLevel.AVAILABLE]: 'rgb(34, 197, 94)', // green-500
      [CrewStatusLevel.BUSY]: 'rgb(59, 130, 246)', // blue-500
      [CrewStatusLevel.FATIGUED]: 'rgb(251, 191, 36)', // amber-400
      [CrewStatusLevel.OFFLINE]: 'rgb(107, 114, 128)', // gray-500
      [CrewStatusLevel.SPECIALIZING]: 'rgb(168, 85, 247)', // purple-500
    },
    typography: {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: {
        small: '0.75rem',
        medium: '0.875rem',
        large: '1rem',
      },
      fontWeight: {
        normal: 400,
        bold: 600,
      },
    },
    animations: {
      enabled: true,
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      stagger: 50,
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.5rem',
      large: '0.75rem',
    },
  },
  performance: {
    maxCrewCards: 20,
    statusUpdateInterval: 1000, // 1 second
    controlDebounceMs: 300,
    enableVirtualScrolling: true,
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 100,
    },
    lazyLoading: {
      enabled: true,
      threshold: 200,
      batchSize: 5,
    },
  },
  telemetry: {
    enabled: true,
    trackedEvents: [
      CrewTelemetryEventType.CREW_STATUS_CHANGE,
      CrewTelemetryEventType.ASSIGNMENT_REQUEST,
      CrewTelemetryEventType.ASSIGNMENT_COMPLETE,
      CrewTelemetryEventType.HUD_INTERACTION,
    ],
    samplingRate: 1.0,
    batchSize: 10,
    transmissionInterval: 5000, // 5 seconds
    includeDiagnostics: true,
    privacy: {
      anonymizeNames: false,
      excludePersonalData: false,
      maxHistoryRetention: 24, // 24 hours
    },
  },
  quickControls: [
    {
      type: CrewQuickControlType.ASSIGN_ACTIVITY,
      label: 'Assign',
      icon: 'arrow-right',
      enabled: true,
      permissions: ['crew.assign'],
      action: {
        type: 'assign_activity',
        payload: {},
      },
      visual: {
        color: 'rgb(59, 130, 246)',
        variant: 'primary',
        size: 'small',
      },
    },
    {
      type: CrewQuickControlType.REST_RESIDENT,
      label: 'Rest',
      icon: 'bed',
      enabled: true,
      permissions: ['crew.rest'],
      action: {
        type: 'rest_resident',
        payload: {},
      },
      visual: {
        color: 'rgb(34, 197, 94)',
        variant: 'secondary',
        size: 'small',
      },
    },
    {
      type: CrewQuickControlType.EMERGENCY_RECALL,
      label: 'Recall',
      icon: 'alert',
      enabled: true,
      permissions: ['crew.recall'],
      action: {
        type: 'emergency_recall',
        payload: {},
      },
      visual: {
        color: 'rgb(239, 68, 68)',
        variant: 'danger',
        size: 'medium',
      },
    },
  ],
  cardDisplay: {
    defaultMode: CrewCardDisplayMode.DETAILED,
    showPerformance: true,
    showSpecializations: true,
    showFatigueBar: true,
    showPriorityScore: true,
    showTimeUntilAvailable: true,
  },
  filters: {
    status: Object.values(CrewStatusLevel),
    specializations: [],
    activities: [],
    fatigueRange: [0, 1],
  },
  sorting: {
    defaultField: 'priority',
    defaultDirection: 'desc',
    availableFields: ['name', 'status', 'priority', 'fatigue', 'performance'],
  },
};

/**
 * Utility functions for crew scheduler HUD configuration
 */

/**
 * Get status color for a crew member
 */
export function getCrewStatusColor(status: CrewStatusLevel, config: CrewSchedulerHUDConfig): string {
  return config.visual.statusColors[status];
}

/**
 * Check if a quick control is enabled for a crew member
 */
export function isQuickControlEnabled(
  control: CrewQuickControlConfig,
  crewCard: CrewCardConfig,
  userPermissions: string[]
): boolean {
  if (!control.enabled) return false;
  
  const hasPermission = control.permissions.some(permission => 
    userPermissions.includes(permission)
  );
  
  if (!hasPermission) return false;
  
  // Additional logic based on crew status
  switch (control.type) {
    case CrewQuickControlType.ASSIGN_ACTIVITY:
      return crewCard.status === CrewStatusLevel.AVAILABLE;
    case CrewQuickControlType.REST_RESIDENT:
      return crewCard.fatigueLevel > 0.5;
    case CrewQuickControlType.EMERGENCY_RECALL:
      return crewCard.status !== CrewStatusLevel.OFFLINE;
    default:
      return true;
  }
}

/**
 * Sort crew cards based on configuration
 */
export function sortCrewCards(
  cards: CrewCardConfig[],
  field: string,
  direction: 'asc' | 'desc'
): CrewCardConfig[] {
  return [...cards].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        comparison = a.priorityScore - b.priorityScore;
        break;
      case 'fatigue':
        comparison = a.fatigueLevel - b.fatigueLevel;
        break;
      case 'performance':
        comparison = a.performance.successRate - b.performance.successRate;
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Filter crew cards based on configuration
 */
export function filterCrewCards(
  cards: CrewCardConfig[],
  filters: CrewSchedulerHUDConfig['filters']
): CrewCardConfig[] {
  return cards.filter(card => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(card.status)) {
      return false;
    }
    
    // Specialization filter
    if (filters.specializations.length > 0) {
      const hasSpecialization = filters.specializations.some(spec =>
        card.specializations.includes(spec)
      );
      if (!hasSpecialization) return false;
    }
    
    // Activity filter
    if (filters.activities.length > 0 && card.currentActivity) {
      if (!filters.activities.includes(card.currentActivity)) {
        return false;
      }
    }
    
    // Fatigue range filter
    if (card.fatigueLevel < filters.fatigueRange[0] || 
        card.fatigueLevel > filters.fatigueRange[1]) {
      return false;
    }
    
    return true;
  });
}

/**
 * Create a crew card configuration from resident state
 */
export function createCrewCardConfig(
  residentId: string,
  residentState: any,
  currentConfig?: Partial<CrewCardConfig>
): CrewCardConfig {
  const baseConfig: CrewCardConfig = {
    id: residentId,
    name: residentState.name || `Crew ${residentId}`,
    status: CrewStatusLevel.AVAILABLE,
    fatigueLevel: residentState.fatigue || 0,
    specializations: residentState.specializations || [],
    priorityScore: 0,
    performance: {
      assignmentsCompleted: 0,
      averageCompletionTime: 0,
      successRate: 1.0,
    },
    display: {
      color: 'rgb(59, 130, 246)',
      icon: 'user',
      badges: [],
    },
    lastUpdated: Date.now(),
  };
  
  return { ...baseConfig, ...currentConfig };
}
