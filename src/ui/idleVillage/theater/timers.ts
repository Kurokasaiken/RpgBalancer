import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

export interface TheaterUiConfig {
    hoverOpenMs?: number;
    hoverCloseMs?: number;
    maxPreviewCount?: number;
    rngSeed?: number;
    slotPriorities?: Record<string, number>;
    excludedSlots?: string[];
}

export type IdleVillageUiExtensions = {
    ui?: {
        theater?: TheaterUiConfig;
    };
};

export interface TheaterTimers {
    hoverOpenMs: number;
    hoverCloseMs: number;
    maxPreviewCount: number;
}

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
