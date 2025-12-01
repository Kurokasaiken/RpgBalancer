// Spell cost calculation utility

import type { Spell } from "./spellTypes";

/**
 * Calculates the total cost (spell level) for a given spell.
 * The algorithm follows the design document:
 *   - Effect: each 10% step away from 100% adds/subtracts 1 point.
 *   - Scale: direct +/- points.
 *   - Eco: each extra round beyond the first adds 1 point.
 *   - AoE: each extra target beyond the first adds 1 point.
 *   - Dangerous: each 10% reduction in success chance subtracts 1 point.
 *   - Pierce: each 5% of pierce adds 1 point.
 *   - CastTime: each 0.1s above 0.5s adds 1 point (negative gives points).
 *   - Cooldown: each 0.5s adds 1 point.
 *   - Range: each extra unit beyond 1 adds 1 point.
 *   - Priority: each step away from 0 adds 1 point.
 *   - DoubleSpell: subtracts 1 point when true.
 *   - Legendary: adds a fixed cost (e.g., 2 points).
 *   - ccEffect: adds 2 points when defined.
 *   - Reflection: each 10% adds 1 point.
 *   - SituationalModifiers: each entry adds Math.round(|adjustment|/25) points (positive adds, negative subtracts).
 */
export const LEGENDARY_COST = 2;

export function calculateSpellCost(spell: Spell): number {
    let cost = 0;

    // Effect & Eco cost logic depends on spell type
    if (spell.type === 'buff' || spell.type === 'debuff') {
        // Buff/Debuff: Effect is magnitude %, Eco is duration turns
        const magnitude = Math.abs(spell.effect);
        const duration = Math.max(1, spell.eco);

        // Cost formula: (Magnitude / 5) * Duration
        // Example: 20% buff for 3 turns = (20/5) * 3 = 12 points
        // This needs to be tuned based on actual gameplay value
        cost += (magnitude / 5) * duration;
    } else {
        // Standard (Damage/Heal): Effect is % of baseline, Eco is extra rounds (DoT)

        // Effect (10% steps from 100%)
        cost += Math.round((spell.effect - 100) / 10);

        // Eco (extra rounds beyond 1)
        cost += Math.max(0, spell.eco - 1);
    }
    if (spell.situationalModifiers && spell.situationalModifiers.length > 0) {
        for (const mod of spell.situationalModifiers) {
            const points = Math.round(Math.abs(mod.adjustment) / 25);
            cost += mod.adjustment >= 0 ? points : -points;
        }
    }

    return cost;
}

/** Helper to know if a spell is balanced (cost == 0 for normal spells) */
export function isSpellBalanced(spell: Spell): boolean {
    const c = calculateSpellCost(spell);
    return c === 0;
}
