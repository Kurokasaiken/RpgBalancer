/**
 * Resident Undo Configuration - NP-020
 * 
 * Configuration for resident assignment undo/redo functionality.
 * Defines timeline settings, keyboard shortcuts, visual badges, and storage policies.
 * Follows config-first design with Zod schema validation.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Undo/Redo action types
 */
export const UNDO_ACTION_TYPES = {
  ASSIGN: 'assign',
  UNASSIGN: 'unassign',
  PRIORITY_CHANGE: 'priority_change',
  STATUS_CHANGE: 'status_change',
  BATCH_ASSIGN: 'batch_assign',
  BATCH_UNASSIGN: 'batch_unassign',
} as const;

export type UndoActionType = typeof UNDO_ACTION_TYPES[keyof typeof UNDO_ACTION_TYPES];

/**
 * Keyboard shortcut combinations
 */
export const UNDO_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  BATCH_UNDO: 'ctrl+shift+z',
  CLEAR_HISTORY: 'ctrl+shift+delete',
  TOGGLE_PANEL: 'ctrl+shift+u',
} as const;

export type UndoShortcut = typeof UNDO_SHORTCUTS[keyof typeof UNDO_SHORTCUTS];

/**
 * Visual badge types for timeline items
 */
export const UNDO_BADGE_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  NEUTRAL: 'neutral',
} as const;

export type UndoBadgeType = typeof UNDO_BADGE_TYPES[keyof typeof UNDO_BADGE_TYPES];

/**
 * Timeline configuration schema
 */
export const UndoTimelineConfigSchema = z.object({
  /** Maximum number of items to keep in timeline */
  maxItems: z.number().min(10).max(1000),
  /** Timeline item height in pixels */
  itemHeight: z.number().min(20).max(100),
  /** Timeline width in pixels */
  timelineWidth: z.number().min(200).max(800),
  /** Animation duration in milliseconds */
  animationDuration: z.number().min(100).max(1000),
  /** Show timestamps on timeline items */
  showTimestamps: z.boolean(),
  /** Show action type badges */
  showBadges: z.boolean(),
  /** Compact mode for small screens */
  compactMode: z.boolean(),
  /** Auto-collapse timeline after inactivity */
  autoCollapse: z.boolean(),
  /** Inactivity timeout in milliseconds */
  collapseTimeout: z.number().min(1000).max(30000),
});

export type UndoTimelineConfig = z.infer<typeof UndoTimelineConfigSchema>;

/**
 * Keyboard shortcuts configuration schema
 */
export const UndoShortcutsConfigSchema = z.object({
  /** Enable keyboard shortcuts */
  enabled: z.boolean(),
  /** Custom shortcut mappings */
  customMappings: z.record(z.string(), z.string()),
  /** Show shortcut hints in tooltips */
  showHints: z.boolean(),
  /** Shortcut debounce time in milliseconds */
  debounceTime: z.number().min(50).max(500),
  /** Prevent shortcuts in input fields */
  preventInInputs: z.boolean(),
});

export type UndoShortcutsConfig = z.infer<typeof UndoShortcutsConfigSchema>;

/**
 * Visual badges configuration schema
 */
export const UndoBadgesConfigSchema = z.object({
  /** Badge colors by type */
  colors: z.record(z.enum(Object.values(UNDO_BADGE_TYPES) as [UndoBadgeType, ...UndoBadgeType[]]), z.string()),
  /** Badge size in pixels */
  size: z.number().min(8).max(24),
  /** Badge border radius in pixels */
  borderRadius: z.number().min(0).max(12),
  /** Show icons on badges */
  showIcons: z.boolean(),
  /** Badge icons by type */
  icons: z.record(z.enum(Object.values(UNDO_BADGE_TYPES) as [UndoBadgeType, ...UndoBadgeType[]]), z.string()),
});

export type UndoBadgesConfig = z.infer<typeof UndoBadgesConfigSchema>;

/**
 * Storage and persistence configuration schema
 */
export const UndoStorageConfigSchema = z.object({
  /** Storage key prefix */
  keyPrefix: z.string(),
  /** Maximum storage size in bytes */
  maxStorageSize: z.number().min(1024).max(10485760), // 1KB to 10MB
  /** Storage retention policy in days */
  retentionDays: z.number().min(1).max(365),
  /** Compress stored data */
  compressData: z.boolean(),
  /** Auto-cleanup expired entries */
  autoCleanup: z.boolean(),
  /** Cleanup interval in hours */
  cleanupInterval: z.number().min(1).max(168), // 1 hour to 1 week
});

export type UndoStorageConfig = z.infer<typeof UndoStorageConfigSchema>;

/**
 * UI panel configuration schema
 */
export const UndoPanelConfigSchema = z.object({
  /** Panel width in pixels */
  panelWidth: z.number().min(200).max(600),
  /** Panel height in pixels */
  panelHeight: z.number().min(300).max(800),
  /** Panel position on screen */
  position: z.enum(['left', 'right', 'top', 'bottom', 'center']),
  /** Show panel header */
  showHeader: z.boolean(),
  /** Show panel footer with stats */
  showFooter: z.boolean(),
  /** Enable panel resizing */
  resizable: z.boolean(),
  /** Enable panel dragging */
  draggable: z.boolean(),
  /** Show close button */
  showCloseButton: z.boolean(),
  /** Auto-hide panel after action */
  autoHide: z.boolean(),
  /** Auto-hide timeout in milliseconds */
  autoHideTimeout: z.number().min(1000).max(10000),
});

export type UndoPanelConfig = z.infer<typeof UndoPanelConfigSchema>;

/**
 * Main resident undo configuration schema
 */
export const ResidentUndoConfigSchema = z.object({
  /** Timeline configuration */
  timeline: UndoTimelineConfigSchema,
  /** Keyboard shortcuts configuration */
  shortcuts: UndoShortcutsConfigSchema,
  /** Visual badges configuration */
  badges: UndoBadgesConfigSchema,
  /** Storage and persistence configuration */
  storage: UndoStorageConfigSchema,
  /** UI panel configuration */
  panel: UndoPanelConfigSchema,
  /** Enable telemetry tracking */
  enableTelemetry: z.boolean(),
  /** Debug mode for development */
  debugMode: z.boolean(),
});

export type ResidentUndoConfig = z.infer<typeof ResidentUndoConfigSchema>;

/**
 * Default configuration for resident undo functionality
 */
export const DEFAULT_RESIDENT_UNDO_CONFIG: ResidentUndoConfig = {
  timeline: {
    maxItems: 50,
    itemHeight: 40,
    timelineWidth: 400,
    animationDuration: 300,
    showTimestamps: true,
    showBadges: true,
    compactMode: false,
    autoCollapse: false,
    collapseTimeout: 5000,
  },

  shortcuts: {
    enabled: true,
    customMappings: {},
    showHints: true,
    debounceTime: 100,
    preventInInputs: true,
  },

  badges: {
    colors: {
      [UNDO_BADGE_TYPES.SUCCESS]: 'rgb(34, 197, 94)',   // green-500
      [UNDO_BADGE_TYPES.WARNING]: 'rgb(251, 191, 36)', // amber-400
      [UNDO_BADGE_TYPES.ERROR]: 'rgb(239, 68, 68)',     // red-500
      [UNDO_BADGE_TYPES.INFO]: 'rgb(59, 130, 246)',    // blue-500
      [UNDO_BADGE_TYPES.NEUTRAL]: 'rgb(107, 114, 128)', // gray-500
    },
    size: 16,
    borderRadius: 4,
    showIcons: true,
    icons: {
      [UNDO_BADGE_TYPES.SUCCESS]: '✓',
      [UNDO_BADGE_TYPES.WARNING]: '⚠',
      [UNDO_BADGE_TYPES.ERROR]: '✕',
      [UNDO_BADGE_TYPES.INFO]: 'ℹ',
      [UNDO_BADGE_TYPES.NEUTRAL]: '•',
    },
  },

  storage: {
    keyPrefix: 'idle-village-resident-undo',
    maxStorageSize: 1048576, // 1MB
    retentionDays: 7,
    compressData: true,
    autoCleanup: true,
    cleanupInterval: 24, // 24 hours
  },

  panel: {
    panelWidth: 450,
    panelHeight: 500,
    position: 'right',
    showHeader: true,
    showFooter: true,
    resizable: true,
    draggable: true,
    showCloseButton: true,
    autoHide: false,
    autoHideTimeout: 3000,
  },

  enableTelemetry: true,
  debugMode: false,
};

/**
 * Validates and creates a resident undo configuration
 */
export function createResidentUndoConfig(config: Partial<ResidentUndoConfig> = {}): ResidentUndoConfig {
  const merged = { ...DEFAULT_RESIDENT_UNDO_CONFIG, ...config };
  return ResidentUndoConfigSchema.parse(merged);
}

/**
 * Gets badge type for an undo action
 */
export function getUndoBadgeType(action: {
  type: UndoActionType;
  success: boolean;
  hasWarnings: boolean;
}): UndoBadgeType {
  if (!action.success) {
    return UNDO_BADGE_TYPES.ERROR;
  }
  
  if (action.hasWarnings) {
    return UNDO_BADGE_TYPES.WARNING;
  }
  
  switch (action.type) {
    case UNDO_ACTION_TYPES.ASSIGN:
    case UNDO_ACTION_TYPES.BATCH_ASSIGN:
      return UNDO_BADGE_TYPES.SUCCESS;
    case UNDO_ACTION_TYPES.UNASSIGN:
    case UNDO_ACTION_TYPES.BATCH_UNASSIGN:
      return UNDO_BADGE_TYPES.NEUTRAL;
    case UNDO_ACTION_TYPES.PRIORITY_CHANGE:
    case UNDO_ACTION_TYPES.STATUS_CHANGE:
      return UNDO_BADGE_TYPES.INFO;
    default:
      return UNDO_BADGE_TYPES.NEUTRAL;
  }
}

/**
 * Gets display label for undo action type
 */
export function getUndoActionLabel(type: UndoActionType): string {
  const labels = {
    [UNDO_ACTION_TYPES.ASSIGN]: 'Assignment',
    [UNDO_ACTION_TYPES.UNASSIGN]: 'Unassignment',
    [UNDO_ACTION_TYPES.PRIORITY_CHANGE]: 'Priority Change',
    [UNDO_ACTION_TYPES.STATUS_CHANGE]: 'Status Change',
    [UNDO_ACTION_TYPES.BATCH_ASSIGN]: 'Batch Assignment',
    [UNDO_ACTION_TYPES.BATCH_UNASSIGN]: 'Batch Unassignment',
  };
  
  return labels[type] || 'Unknown Action';
}

/**
 * Parses keyboard shortcut string
 */
export function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
} {
  const parts = shortcut.toLowerCase().split('+');
  const result = {
    ctrl: false,
    shift: false,
    alt: false,
    key: '',
  };
  
  parts.forEach(part => {
    switch (part) {
      case 'ctrl':
        result.ctrl = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
        result.alt = true;
        break;
      default:
        result.key = part;
        break;
    }
  });
  
  return result;
}

/**
 * Formats keyboard shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const parsed = parseShortcut(shortcut);
  const parts: string[] = [];
  
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.shift) parts.push('Shift');
  if (parsed.alt) parts.push('Alt');
  parts.push(parsed.key.charAt(0).toUpperCase() + parsed.key.slice(1));
  
  return parts.join(' + ');
}
