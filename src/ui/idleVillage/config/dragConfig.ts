/**
 * Centralized drag configuration for Idle Village drag-and-drop system.
 * Provides visual, timing, and threshold parameters for deterministic drag behavior.
 * All values are config-first to ensure consistency across components and test environments.
 *
 * @returns Complete drag configuration object
 */
export const getDragConfig = () => ({
    /** Visual feedback parameters for drag states */
    visual: {
        // TODO(style-lab-flexibility): read interactionPhysics (mass, bloomIntensity, shadowDepth)
        // from Style Lab tokens once the new preset schema lands, instead of hardcoding
        // these fallback values. The overshoot + Framer Motion spring preset will live here.
        /** Background color for valid drop zones (green with transparency) */
        validDropColor: 'rgba(34, 197, 94, 0.1)',
        /** Background color for invalid drop zones (red with transparency) */
        invalidDropColor: 'rgba(239, 68, 68, 0.1)',
        /** Background color for locked zones (gray with transparency) */
        lockedDropColor: 'rgba(107, 114, 128, 0.1)',
        /** Border color for actively dragged elements (yellow with transparency) */
        activeDragBorderColor: 'rgba(251, 191, 36, 0.5)',
        /** Opacity applied to dragged elements */
        draggedOpacity: 0.7,
        /** Scale factor for bloom effect on valid drops */
        bloomScale: 1.05,
    },
    /** Timing parameters for drag interactions and feedback */
    timing: {
        // TODO(style-lab-flexibility): expose transitionDurations per theme so that
        // heavier presets can slow down drag start/landing animations.
        /** Delay before showing visual feedback (ms) */
        feedbackDelayMs: 100,
        /** Maximum duration for drag operations (ms) */
        dragTimeoutMs: 10000,
        /** Debounce delay for drop state updates (ms) */
        dropStateDebounceMs: 50,
        /** Duration for CSS transitions (ms) */
        transitionDurationMs: 200,
    },
    /** Drag overlay (drag preview) aesthetics – single source of truth */
    overlay: {
        /** Diameter in pixels of the PgCard medal overlay */
        medalSizePx: 64,
        /** Default skin variant rendered during drag */
        skinVariant: 'wanderlust' as const,
        /** Default pillar for the wanderlust skin */
        defaultPillar: 'wilderness' as const,
    },
    /** Magnetism helpers for near-slot snapping */
    magnetism: {
        /** Radius (px) in which a slot starts attracting the token */
        radiusPx: 120,
        /** Amount of cursor-to-slot lerp (0-1) */
        lerpStrength: 0.35,
        /** Audio cue throttling in ms to avoid spam */
        cueCooldownMs: 250,
    },
    /** Threshold values for drag validation and performance */
    thresholds: {
        // TODO(style-lab-flexibility): consider moving fatigue/HP thresholds into
        // Style Lab tokens if we need theme-dependent affordances.
        /** Minimum HP required for resident to be draggable */
        minHpThreshold: 1,
        /** Maximum fatigue before resident becomes undraggable */
        maxFatigueThreshold: 100,
        /** Minimum drag distance to initiate drag operation */
        minDragDistance: 5,
        /** Minimum resident count to enable virtualization */
        virtualizationThreshold: 30,
    },
});

/**
 * Type definition for drag configuration object.
 */
export type DragConfig = ReturnType<typeof getDragConfig>;

/**
 * Override global drag configuration for testing purposes.
 * Merges provided config with default values and stores in window scope.
 *
 * @param config - Partial configuration to override
 */
export const overrideDragConfig = (config: Partial<DragConfig>) => {
    // For testing: override global config
    if (typeof window !== 'undefined') {
        (window as Window & { __dragConfig?: DragConfig }).__dragConfig = { ...getDragConfig(), ...config };
    }
};

/**
 * Reset global drag configuration to defaults.
 * Removes any test overrides from window scope.
 */
export const resetDragConfig = () => {
    // For testing: reset global config
    if (typeof window !== 'undefined') {
        delete (window as Window & { __dragConfig?: DragConfig }).__dragConfig;
    }
};

/**
 * Get current drag configuration with test overrides applied.
 * Returns overridden config if available, otherwise default config.
 *
 * @returns Current drag configuration
 */
export const getCurrentDragConfig = (): DragConfig => {
    if (typeof window !== 'undefined' && (window as Window & { __dragConfig?: DragConfig }).__dragConfig) {
        return (window as Window & { __dragConfig?: DragConfig }).__dragConfig!;
    }
    return getDragConfig();
};