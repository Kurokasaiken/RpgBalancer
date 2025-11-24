// Load and manage spell balancing configuration

import spellConfigData from './spellBalancingConfig.json';
import type { Spell } from './spellTypes';

export interface SpellBalancingConfig {
    baseline: Partial<Spell>;
    weights: Record<string, number>;
    ranges: Record<string, { min: number; max: number; step: number }>;
    descriptions: Record<string, string>;
}

// Load config from JSON
export const SPELL_CONFIG: SpellBalancingConfig = spellConfigData as SpellBalancingConfig;

// Get baseline spell (reference for 0 budget)
export function getBaselineSpell(): Partial<Spell> {
    return { ...SPELL_CONFIG.baseline };
}

// Get weight for a stat
export function getStatWeight(stat: string): number {
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
export function calculateSpellBudget(spell: Spell, customWeights?: Record<string, number>): number {
    const baseline = getBaselineSpell();
    const weights = customWeights || SPELL_CONFIG.weights;
    let budget = 0;

    // Iterate over all numeric fields that affect balance
    const balanceableFields = [
        'effect', 'scale', 'eco', 'aoe', 'dangerous', 'pierce',
        'castTime', 'cooldown', 'range', 'priority', 'manaCost',
        'duration', 'charges', 'channel', 'reflection', 'maxStacks'
    ];

    for (const field of balanceableFields) {
        const spellValue = (spell as any)[field] || 0;
        const baselineValue = (baseline as any)[field] || 0;
        const weight = weights[field] || 0;

        const delta = spellValue - baselineValue;
        budget += delta * weight;
    }

    // Additional fields cost adjustments
    if (spell.doubleSpell) {
        budget -= 1; // double spell reduces cost by 1
    }
    if (spell.ccEffect) {
        budget += 2; // cc effect adds fixed cost of 2
    }

    return budget;
}

// Update config (for balancing the balancer)
export function updateConfig(newConfig: Partial<SpellBalancingConfig>): void {
    // In a real app, this would save to file or server
    // For now, update in-memory (would need state management in React)
    Object.assign(SPELL_CONFIG, newConfig);
}

// Export stat fields that are balanceable
export const BALANCEABLE_STAT_FIELDS = [
    'effect', 'scale', 'eco', 'aoe', 'dangerous', 'pierce',
    'castTime', 'cooldown', 'range', 'priority', 'manaCost',
    'duration', 'charges', 'channel', 'reflection', 'maxStacks'
] as const;

// Check if a field is a MALUS (negative weight = higher value gives budget)
export function isMalus(field: string): boolean {
    return getStatWeight(field) < 0;
}
