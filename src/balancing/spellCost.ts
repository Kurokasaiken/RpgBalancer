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

    // Effect (10% steps)
    cost += Math.round((spell.effect - 100) / 10);

    // Scale
    cost += spell.scale;

    // Eco (extra rounds)
    cost += spell.eco - 1;

    // AoE (extra targets)
    cost += spell.aoe - 1;

    // Precision (success chance modifier).
    cost += Math.round(spell.precision / 5);

    // Dangerous (damage on miss/save).
    cost += Math.round(spell.dangerous / 5);

    // Cooldown (0.5s steps)
    cost += Math.round(spell.cooldown / 0.5);

    // Range (extra units)
    cost += spell.range - 1;

    // Priority (steps from 0)
    cost += spell.priority;

    // New fields
    if (spell.ccEffect) cost += 2; // crowd‑control effect adds fixed cost

    // Buff/Debuff cost (based on magnitude and duration)
    if (spell.type === 'buff' || spell.type === 'debuff') {
        // Effect is magnitude %, Eco is duration turns
        const magnitude = Math.abs(spell.effect);
        const duration = Math.max(1, spell.eco);

        // Base cost: 1 point per 10% magnitude per turn
        // This is a rough heuristic, can be tuned
        cost += (magnitude / 10) * duration * 0.5;
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
