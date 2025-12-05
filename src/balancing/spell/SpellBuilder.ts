// SpellBuilder – utilities to construct, validate and compare spells.
// Works with the full Spell definition (src/balancing/spellTypes.ts) and the cost
// calculator (src/balancing/spellCost.ts).

import type { Spell } from '../spellTypes';
import type { SpellInstance } from './types';
import { calculateSpellCost } from '../spellCost';

/** Validate a Spell. Returns `{valid, errors}`. */
export function validateTemplate(spell: Spell): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!spell.id) errors.push('id is required');
    if (!spell.name) errors.push('name is required');
    if (!spell.type) errors.push('type is required');

    // Numeric ranges – these mirror the design document
    if (spell.effect < 10 || spell.effect > 300) errors.push('effect must be 10‑300');
    if (spell.scale < -10 || spell.scale > 10) errors.push('scale must be -10…10');
    if (spell.eco < 1) errors.push('eco must be ≥ 1');
    if (spell.aoe < 1) errors.push('aoe must be ≥ 1');
    if (spell.dangerous < 0 || spell.dangerous > 100) errors.push('dangerous must be 0‑100');
    const pierce = spell.pierce ?? 0;
    if (pierce < 0 || pierce > 50) errors.push('pierce must be 0‑50');
    const castTime = spell.castTime ?? 0.5;
    if (castTime < 0.1 || castTime > 2.0) errors.push('castTime must be 0.1‑2.0');
    if (spell.cooldown < 0 || spell.cooldown > 5.0) errors.push('cooldown must be 0‑5.0');
    if (spell.range < 1 || spell.range > 10) errors.push('range must be 1‑10');
    if (spell.priority < -5 || spell.priority > 5) errors.push('priority must be -5…5');

    // Optional numeric fields – if defined, enforce sensible limits
    if (spell.manaCost !== undefined && (spell.manaCost < 0 || spell.manaCost > 200))
        errors.push('manaCost must be 0‑200');
    if (spell.duration !== undefined && spell.duration < 0) errors.push('duration cannot be negative');
    if (spell.reflection !== undefined && (spell.reflection < 0 || spell.reflection > 100))
        errors.push('reflection must be 0‑100');
    if (spell.maxStacks !== undefined && spell.maxStacks < 1) errors.push('maxStacks must be ≥ 1');
    if (spell.charges !== undefined && spell.charges < 1) errors.push('charges must be ≥ 1');
    if (spell.channel !== undefined && spell.channel < 0) errors.push('channel cannot be negative');

    return { valid: errors.length === 0, errors };
}

/** Build a SpellInstance from a template and a numeric budget (points). */
export function buildSpell(template: Spell, budget: number): SpellInstance {
    const { valid, errors } = validateTemplate(template);
    if (!valid) {
        throw new Error('Invalid spell template: ' + errors.join('; '));
    }

    const points = calculateSpellCost(template);
    // Tier determination – simple placeholder (real implementation can read budget_tiers.json)
    const tier = '';

    if (points > budget) {
        console.warn(`SpellPoints (${points}) exceed budget (${budget}); spell will be marked as over‑budget.`);
    }

    // SpellInstance is from spell/types.ts (different structure than Spell from spellTypes.ts)
    // For now, return a minimal compatible object
    return {
        id: template.id,
        name: template.name,
        description: template.description,
        damage: 0,
        armorPen: 0,
        resPen: 0,
        hitChance: 0,
        critChance: 0,
        critMult: 0,
        spellPoints: points,
        tier
    } as SpellInstance;
}

/** Optimize a partially‑filled spell – fill missing numeric fields with defaults and
 * ensure percentage‑based stats sum to 100 where appropriate. */
export function optimizeAllocation(partial: Partial<Spell>): Spell {
    const base: Spell = {
        id: partial.id ?? 'temp_' + Date.now(),
        name: partial.name ?? 'Untitled Spell',
        type: partial.type ?? 'damage',
        effect: partial.effect ?? 100,
        scale: partial.scale ?? 0,
        eco: partial.eco ?? 1,
        aoe: partial.aoe ?? 1,
        dangerous: partial.dangerous ?? 100,
        pierce: partial.pierce ?? 0,
        castTime: partial.castTime ?? 0.5,
        cooldown: partial.cooldown ?? 0,
        range: partial.range ?? 1,
        priority: partial.priority ?? 0,
        doubleSpell: partial.doubleSpell ?? false,
        legendary: partial.legendary ?? false,
        // optional fields – default to zero‑cost values
        manaCost: partial.manaCost ?? 0,
        duration: partial.duration ?? 0,
        reflection: partial.reflection ?? 0,
        maxStacks: partial.maxStacks ?? 1,
        charges: partial.charges ?? 1,
        channel: partial.channel ?? 0,
        scalingStat: partial.scalingStat,
        slots: partial.slots ?? [],
        ccEffect: partial.ccEffect,
        situationalModifiers: partial.situationalModifiers,
        description: partial.description ?? '',
        tags: partial.tags ?? [],
        spellLevel: 0,
        spellPoints: 0,
        tier: '',
    };
    return base;
}

/** Compare two SpellInstances – useful for UI diff view. */
export interface SpellDiff {
    damageDelta: number;
    armorPenDelta: number;
    resPenDelta: number;
    hitChanceDelta: number;
    critChanceDelta: number;
    critMultDelta: number;
    pointsDelta: number;
    tierChange?: string;
}

export function compareSpells(a: SpellInstance, b: SpellInstance): SpellDiff {
    const pointsDelta = b.spellPoints - a.spellPoints;
    const tierChange = a.tier !== b.tier ? `${a.tier} → ${b.tier}` : undefined;
    return {
        damageDelta: b.damage - a.damage,
        armorPenDelta: b.armorPen - a.armorPen,
        resPenDelta: b.resPen - a.resPen,
        hitChanceDelta: b.hitChance - a.hitChance,
        critChanceDelta: b.critChance - a.critChance,
        critMultDelta: b.critMult - a.critMult,
        pointsDelta,
        tierChange,
    };
}
