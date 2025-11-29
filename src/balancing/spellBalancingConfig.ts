// Load and manage spell balancing configuration

import spellConfigData from './spellBalancingConfig.json';
import type { Spell } from './spellTypes';
import { BalanceConfigManager } from './BalanceConfigManager';

// Mapping between spell stats and global stats
const STAT_MAPPING: Record<string, string> = {
    'effect': 'damage', // Spell effect (damage) maps to global damage weight
    // Add other mappings if needed
};

export interface SpellBalancingConfig {
    baseline: Partial<Spell>;
    weights: Record<string, number>;
    ranges: Record<string, { min: number; max: number; step: number }>;
    descriptions: Record<string, string>;
}

// Load config from JSON (default)
const DEFAULT_CONFIG: SpellBalancingConfig = spellConfigData as SpellBalancingConfig;

// In-memory config (initialized from localStorage or default)
export let SPELL_CONFIG: SpellBalancingConfig = loadConfig();

// Load config from localStorage or fall back to default
export function loadConfig(): SpellBalancingConfig {
    try {
        const saved = localStorage.getItem('spell_balancing_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with default to ensure structure
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                baseline: { ...DEFAULT_CONFIG.baseline, ...parsed.baseline },
                weights: { ...DEFAULT_CONFIG.weights, ...parsed.weights }
            };
        }
    } catch (e) {
        console.error("Failed to load spell config", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

// Save config to localStorage
export function saveConfig(config: SpellBalancingConfig): void {
    SPELL_CONFIG = config;
    localStorage.setItem('spell_balancing_config', JSON.stringify(config));
}



// Update range for a specific stat
export function updateRange(stat: string, range: { min: number; max: number; step: number }): void {
    const newConfig = {
        ...SPELL_CONFIG,
        ranges: {
            ...SPELL_CONFIG.ranges,
            [stat]: range
        }
    };
    saveConfig(newConfig);
}

// Reset config to defaults
export function resetConfig(): void {
    SPELL_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    localStorage.removeItem('spell_balancing_config');
}

// Get baseline spell (reference for 0 budget)
export function getBaselineSpell(): Partial<Spell> {
    return { ...SPELL_CONFIG.baseline };
}

// Get weight for a stat
export function getStatWeight(stat: string): number {
    // 1. Check if there is a global mapping
    const globalStat = STAT_MAPPING[stat];
    if (globalStat) {
        const globalWeights = BalanceConfigManager.getWeights();
        if (globalWeights[globalStat] !== undefined) {
            return globalWeights[globalStat];
        }
    }

    // 2. Fallback to local spell config
    return SPELL_CONFIG.weights[stat] || 0;
}

// Get range config for a stat
export function getStatRange(stat: string) {
    return SPELL_CONFIG.ranges[stat] || { min: 0, max: 100, step: 1 };
}

// Get description for a stat
export function getStatDescription(stat: string): string {
    return SPELL_CONFIG.descriptions[stat] || '';
}

// Calculate budget based on difference from baseline
export function calculateSpellBudget(
    spell: Spell,
    customWeights?: Record<string, number>,
    customBaselines?: Partial<Spell>
): number {
    const baseline = customBaselines || getBaselineSpell();
    // Use getStatWeight for each field instead of raw weights object
    // to ensure we use the global overrides
    let budget = 0;

    // Iterate over all numeric fields that affect balance
    const balanceableFields = [
        'effect', 'scale', 'eco', 'aoe', 'precision', 'dangerous',
        'cooldown', 'range', 'priority', 'manaCost'
    ];

    for (const field of balanceableFields) {
        const spellValue = (spell as any)[field] || 0;
        const baselineValue = (baseline as any)[field] || 0;

        // Use custom weights if provided, otherwise use the getter (which handles global sync)
        const weight = customWeights ? (customWeights[field] || 0) : getStatWeight(field);

        const delta = spellValue - baselineValue;
        budget += delta * weight;
    }

    // Additional fields cost adjustments
    if (spell.ccEffect) {
        budget += 2; // cc effect adds fixed cost of 2
    }

    return budget;
}

// Update config (for balancing the balancer)
export function updateConfig(newConfig: Partial<SpellBalancingConfig>): void {
    Object.assign(SPELL_CONFIG, newConfig);
    saveConfig(SPELL_CONFIG);
}

// Export stat fields that are balanceable
export const BALANCEABLE_STAT_FIELDS = [
    'effect', 'scale', 'eco', 'aoe', 'precision', 'dangerous',
    'cooldown', 'range', 'priority', 'manaCost'
] as const;

// Check if a field is a MALUS (negative weight = higher value gives budget)
export function isMalus(field: string): boolean {
    return getStatWeight(field) < 0;
}
