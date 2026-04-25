/**
 * Drag & Drop configuration for Idle Village components.
 * Centralizes all drag-related thresholds, timeouts, and visual settings.
 * Follows config-first principles - no magic numbers in components.
 */

/**
 * Visual feedback configuration for drag states.
 */
export interface DragVisualConfig {
  /** Background color for valid drop zones */
  validDropColor: string;
  /** Background color for invalid drop zones */
  invalidDropColor: string;
  /** Background color for locked/unavailable drop zones */
  lockedDropColor: string;
  /** Border color for active drag states */
  activeDragBorderColor: string;
  /** Opacity for dragged items */
  draggedOpacity: number;
  /** Scale factor for bloom effects */
  bloomScale: number;
}

/**
 * Timing configuration for drag interactions.
 */
export interface DragTimingConfig {
  /** Delay before showing drag feedback (ms) */
  feedbackDelayMs: number;
  /** Timeout for drag operations (ms) */
  dragTimeoutMs: number;
  /** Debounce delay for drop state updates (ms) */
  dropStateDebounceMs: number;
  /** Animation duration for state transitions (ms) */
  transitionDurationMs: number;
}

/**
 * Threshold configuration for drag validation.
 */
export interface DragThresholdConfig {
  /** Minimum HP required for dragging */
  minHpThreshold: number;
  /** Maximum fatigue allowed for dragging */
  maxFatigueThreshold: number;
  /** Minimum distance for drag gesture (px) */
  minDragDistance: number;
  /** Maximum residents for virtualization */
  virtualizationThreshold: number;
}

/**
 * Complete drag configuration.
 */
export interface DragConfig {
  visual: DragVisualConfig;
  timing: DragTimingConfig;
  thresholds: DragThresholdConfig;
}

/**
 * Default drag configuration.
 */
export const DEFAULT_DRAG_CONFIG: DragConfig = {
  visual: {
    validDropColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
    invalidDropColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
    lockedDropColor: 'rgba(107, 114, 128, 0.1)', // slate-500/10
    activeDragBorderColor: 'rgba(251, 191, 36, 0.5)', // amber-400/50
    draggedOpacity: 0.7,
    bloomScale: 1.05,
  },
  timing: {
    feedbackDelayMs: 100,
    dragTimeoutMs: 10000,
    dropStateDebounceMs: 50,
    transitionDurationMs: 200,
  },
  thresholds: {
    minHpThreshold: 1,
    maxFatigueThreshold: 100,
    minDragDistance: 5,
    virtualizationThreshold: 30,
  },
};

/**
 * Current drag configuration (can be overridden for testing).
 */
let currentDragConfig: DragConfig = { ...DEFAULT_DRAG_CONFIG };

/**
 * Returns the current drag configuration.
 */
export function getDragConfig(): DragConfig {
  return currentDragConfig;
}

/**
 * Overrides the drag configuration. Intended for testing scenarios.
 */
export function overrideDragConfig(overrides: Partial<DragConfig>): void {
  currentDragConfig = {
    visual: { ...currentDragConfig.visual, ...overrides.visual },
    timing: { ...currentDragConfig.timing, ...overrides.timing },
    thresholds: { ...currentDragConfig.thresholds, ...overrides.thresholds },
  };
}

/**
 * Restores the drag configuration to default values.
 */
export function resetDragConfig(): void {
  currentDragConfig = { ...DEFAULT_DRAG_CONFIG };
}
