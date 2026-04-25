import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

/**
 * Configuration for theater timing and behavior.
 * 
 * This interface defines the configurable aspects of the theater overlay system,
 * allowing for customization of hover delays, preview limits, and slot priorities
 * through the idle village configuration.
 */
export interface TheaterUiConfig {
    /** Delay in milliseconds before theater opens on hover. */
    hoverOpenMs?: number;
    /** Delay in milliseconds before theater closes after hover ends. */
    hoverCloseMs?: number;
    /** Maximum number of slots to show in theater preview. */
    maxPreviewCount?: number;
    /** Optional seed for random number generation (for deterministic testing). */
    rngSeed?: number;
    /** Priority mapping for slot tags (lower numbers = higher priority). */
    slotPriorities?: Record<string, number>;
    /** Array of slot IDs to exclude from theater preview. */
    excludedSlots?: string[];
}

/**
 * Extension interface for IdleVillageConfig to include theater UI settings.
 * 
 * This allows the theater system to read configuration from the standard
 * idle village config without modifying the core config interface.
 */
export type IdleVillageUiExtensions = {
    ui?: {
        theater?: TheaterUiConfig;
    };
};

/**
 * Normalized theater timing configuration.
 * 
 * This interface represents the resolved timing values used by the theater
 * controller, with defaults applied for any missing configuration.
 */
export interface TheaterTimers {
    /** Delay before theater opens on hover (ms). */
    hoverOpenMs: number;
    /** Delay before theater closes after hover ends (ms). */
    hoverCloseMs: number;
    /** Maximum number of preview slots to display. */
    maxPreviewCount: number;
}

/** Default timing values for theater behavior. */
const DEFAULT_TIMERS: TheaterTimers = {
    hoverOpenMs: 600,
    hoverCloseMs: 200,
    maxPreviewCount: 3,
};

/**
 * Resolves the Theater hover timers from IdleVillageConfig, ensuring defaults when the UI
 * extensions are missing so that hover behavior stays consistent across sandboxes.
 *
 * @param config - The active IdleVillage configuration snapshot.
 * @returns normalized hover timers and preview limit for Theater overlays.
 */
export function ensureTheaterTimers(config: IdleVillageConfig): TheaterTimers {
    const theaterUiConfig = (config as IdleVillageUiExtensions).ui?.theater;
    return {
        hoverOpenMs: theaterUiConfig?.hoverOpenMs ?? DEFAULT_TIMERS.hoverOpenMs,
        hoverCloseMs: theaterUiConfig?.hoverCloseMs ?? DEFAULT_TIMERS.hoverCloseMs,
        maxPreviewCount: theaterUiConfig?.maxPreviewCount ?? DEFAULT_TIMERS.maxPreviewCount,
    };
}
