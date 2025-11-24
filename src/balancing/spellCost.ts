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

    // Dangerous (success chance). Reducing success subtracts points.
    cost -= Math.round((100 - spell.dangerous) / 10);

    // Pierce (5% steps)
    cost += Math.round(spell.pierce / 5);

    // Cast time (0.1s steps from 0.5s baseline)
    cost += Math.round((spell.castTime - 0.5) / 0.1);

    // Cooldown (0.5s steps)
    cost += Math.round(spell.cooldown / 0.5);

    // Range (extra units)
    cost += spell.range - 1;

    // Priority (steps from 0)
    cost += spell.priority;

    // Double spell flag
    if (spell.doubleSpell) cost -= 1;

    // Legendary fixed cost
    if (spell.legendary) cost += LEGENDARY_COST;

    // New fields
    if (spell.ccEffect) cost += 2; // crowd‑control effect adds fixed cost
    if (spell.reflection) cost += Math.round(spell.reflection / 10);
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
    return spell.legendary ? c >= LEGENDARY_COST : c === 0;
}
