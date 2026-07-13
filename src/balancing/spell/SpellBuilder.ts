// SpellBuilder – utilities to construct, validate and compare spells.
// Works with the full Spell definition (src/balancing/spellTypes.ts) and the cost
// calculator (src/balancing/spellCost.ts).

import type { Spell, SpellQuality } from '../spellTypes';
import type { SpellInstance } from './types';
import type { CardDefinition } from '../config/types';
import type { CombatMetrics } from '../modules/combatPredictor';
import { z } from 'zod';
import { SpellCostModule } from '../modules/spellcost';
import { CombatPredictor } from '../modules/combatPredictor';
import { BASELINE_STATS } from '../baseline';
import { ALL_SPELL_STATS } from '../spellStatDefinitions';
import { CardDefinitionSchema } from '../config/schemas';

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

    const points = SpellCostModule.calculateSpellPoints(template);
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

// ============== PROCEDURAL SPELL GENERATION ==============

export type VariantStrategy =
    | 'biggerLessDamage'
    | 'smallerMoreDamage'
    | 'precisionForMana'
    | 'default';

export interface GenerateVariantOptions {
    strategy?: VariantStrategy;
    quality?: SpellQuality;
    /** Target power/mana ratio (default 2.0 HP/mana) */
    targetRatio?: number;
    /** Tolerance around the target ratio (default ±0.2, i.e. 1.6–2.4) */
    tolerance?: number;
    /** Number of attempts before giving up on a balanced variant */
    maxAttempts?: number;
    /** If true, the variant exposes detailed combat metrics */
    isInspected?: boolean;
}

export interface ProceduralSpellVariant extends CardDefinition, Spell {
    quality: SpellQuality;
    isInspected: boolean;
    combatMetrics?: CombatMetrics;
}

function getTierName(tier: number): string {
    return ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][tier - 1] ?? 'Unknown';
}

function getQualityColor(quality: SpellQuality): string {
    switch (quality) {
        case 'Amateur': return 'text-stone-400';
        case 'Masterpiece': return 'text-amber-400';
        default: return 'text-blue-400';
    }
}

function sanitizeId(raw: string): string {
    let clean = raw.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z]/.test(clean)) clean = 'sp_' + clean;
    return clean;
}

function computeSpellCombatMetrics(spell: Spell): CombatMetrics | undefined {
    if (spell.type !== 'damage') return undefined;
    const damage = BASELINE_STATS.damage * (spell.effect / 100);
    const txc = BASELINE_STATS.txc + (spell.precision ?? 0);
    return CombatPredictor.predict({
        hp: BASELINE_STATS.hp,
        damage,
        txc,
        evasion: BASELINE_STATS.evasion,
        critChance: BASELINE_STATS.critChance,
        lifesteal: 0,
        regen: 0,
    });
}

function applyVariantStrategy(spell: Spell, strategy: VariantStrategy, attempt: number): Spell {
    const variant = { ...spell };
    const aoe = variant.aoe;

    switch (strategy) {
        case 'biggerLessDamage': {
            const newAoe = Math.min(6, aoe + 2);
            const oldMultiplier = SpellCostModule.calculateAoeMultiplier(aoe);
            const newMultiplier = SpellCostModule.calculateAoeMultiplier(newAoe);
            variant.aoe = newAoe;
            variant.effect = Math.max(10, Math.min(300, variant.effect * (oldMultiplier / newMultiplier)));
            break;
        }
        case 'smallerMoreDamage': {
            if (aoe > 1) {
                const newAoe = aoe - 1;
                const oldMultiplier = SpellCostModule.calculateAoeMultiplier(aoe);
                const newMultiplier = SpellCostModule.calculateAoeMultiplier(newAoe);
                variant.aoe = newAoe;
                variant.effect = Math.max(10, Math.min(300, variant.effect * (oldMultiplier / newMultiplier)));
            } else {
                // Narrow/focused: keep single-target and push damage up
                variant.effect = Math.min(300, variant.effect * 1.25);
            }
            break;
        }
        case 'precisionForMana': {
            // Precision is a hit-chance modifier in this model; keep effect
            // stable but push precision and rebalance mana later.
            variant.precision = Math.max(-50, Math.min(50, (variant.precision ?? 0) + 10));
            variant.effect = Math.max(10, variant.effect * 0.95);
            break;
        }
        case 'default':
        default:
            break;
    }

    return variant;
}

/** Recompute mana cost so the spell falls inside the configured balance range. */
function rebalanceToTarget(spell: Spell, targetRatio: number): Spell {
    const { totalPower } = SpellCostModule.calculateSpellPower(spell);
    if (totalPower <= 0) return spell;
    return { ...spell, manaCost: totalPower / targetRatio };
}

/**
 * Generate a procedural variant of a base spell.
 * Returns a ProceduralSpellVariant that extends CardDefinition (and Spell) so it can be
 * treated as a regular balancer card, or `null` if a balanced variant could not be produced.
 */
export function generateProceduralSpellVariant(
    baseSpell: Partial<Spell>,
    options: GenerateVariantOptions = {}
): ProceduralSpellVariant | null {
    const opts: Required<GenerateVariantOptions> = {
        strategy: 'default',
        quality: 'Standard',
        targetRatio: 2.0,
        tolerance: 0.2,
        maxAttempts: 20,
        isInspected: false,
        ...options,
    };

    const template = optimizeAllocation(baseSpell);

    for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
        let variant = applyVariantStrategy({ ...template }, opts.strategy, attempt);
        variant = SpellCostModule.applyQualityModifier(variant, opts.quality);
        variant = rebalanceToTarget(variant, opts.targetRatio);

        const points = SpellCostModule.calculateSpellPoints(variant);
        variant.spellPoints = points;
        variant.tier = getTierName(SpellCostModule.calculateTier(points));

        const { valid, errors } = validateTemplate(variant);
        if (!valid) {
            if (process.env.NODE_ENV !== 'production') console.warn('Variant validation failed:', errors);
            continue;
        }

        if (!SpellCostModule.isBalanced(variant, opts.tolerance)) {
            // Try a second recalculation pass before discarding
            variant = rebalanceToTarget(variant, opts.targetRatio);
            if (!SpellCostModule.isBalanced(variant, opts.tolerance)) continue;
        }

        const combatMetrics = computeSpellCombatMetrics(variant);

        const cardPart: CardDefinition = {
            id: sanitizeId(`${variant.id}_${opts.quality.toLowerCase()}_${attempt}`),
            title: variant.name.slice(0, 50),
            color: getQualityColor(opts.quality),
            statIds: ALL_SPELL_STATS,
            isCore: false,
            order: 0,
            isLocked: false,
            isHidden: false,
        };

        const result: ProceduralSpellVariant = {
            ...variant,
            ...cardPart,
            quality: opts.quality,
            isInspected: opts.isInspected,
            combatMetrics,
        };

        return result;
    }

    return null;
}

// ============== ZOD VALIDATION ==============

export const SpellQualitySchema = z.enum(['Amateur', 'Standard', 'Masterpiece']);

export const SpellSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['damage', 'heal', 'shield', 'buff', 'debuff', 'cc']),
    effect: z.number().min(10).max(300),
    scale: z.number().min(-10).max(10),
    eco: z.number().min(1),
    aoe: z.number().min(1),
    precision: z.number().min(-50).max(50).optional(),
    dangerous: z.number().min(0).max(100),
    cooldown: z.number().min(0).max(5.0),
    range: z.number().min(1).max(10),
    priority: z.number().min(-5).max(5),
    spellLevel: z.number().min(0).max(9),
    manaCost: z.number().min(0).max(200).optional(),
    spellPoints: z.number().optional(),
    tier: z.string().optional(),
    quality: SpellQualitySchema.optional(),
    isInspected: z.boolean().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    targetStat: z.string().optional(),
    ccEffect: z.enum(['stun', 'slow', 'knockback', 'silence']).optional(),
    castTime: z.number().min(0.1).max(2.0).optional(),
    pierce: z.number().min(0).max(50).optional(),
    duration: z.number().min(0).optional(),
    reflection: z.number().min(0).max(100).optional(),
    maxStacks: z.number().min(1).optional(),
    charges: z.number().min(1).optional(),
    channel: z.number().min(0).optional(),
});

export const ProceduralSpellVariantSchema = SpellSchema.merge(CardDefinitionSchema)
    .extend({
        quality: SpellQualitySchema,
        isInspected: z.boolean(),
        combatMetrics: z.object({
            ttk: z.number(),
            ttd: z.number(),
            winProb: z.number(),
            dps: z.number(),
            dtps: z.number(),
        }).optional(),
    });
