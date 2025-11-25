/**
 * DoT/HoT Global Configuration
 * 
 * This file defines the global default behavior for DoT/HoT stacking.
 * Individual spells can override this default.
 */

import type { StackMode } from './modules/dot';

export interface DotGlobalConfig {
    /**
     * Default stack mode for all DoTs/HoTs
     * Can be overridden per-spell
     */
    defaultStackMode: StackMode;

    /**
     * Whether spells can override the global default
     */
    allowPerSpellOverride: boolean;

    /**
     * Global max stacks (applies to all capped modes)
     * Can be overridden per-spell
     */
    globalMaxStacks: number;
}

/**
 * Default configuration (can be modified in Balancer UI)
 */
export const DOT_GLOBAL_CONFIG: DotGlobalConfig = {
    defaultStackMode: 'separate',     // Safe default: Darkest Dungeon style
    allowPerSpellOverride: true,      // Allow per-spell customization
    globalMaxStacks: 5                // Reasonable cap for all stacking effects
};

/**
 * Helper: Get effective stack mode for an effect
 * Respects global config and per-spell overrides
 */
export function getEffectiveStackMode(
    spellStackMode: StackMode | undefined
): StackMode {
    if (!DOT_GLOBAL_CONFIG.allowPerSpellOverride || !spellStackMode) {
        return DOT_GLOBAL_CONFIG.defaultStackMode;
    }
    return spellStackMode;
}

/**
 * Helper: Get effective max stacks
 */
export function getEffectiveMaxStacks(
    spellMaxStacks: number | undefined
): number {
    return spellMaxStacks ?? DOT_GLOBAL_CONFIG.globalMaxStacks;
}
