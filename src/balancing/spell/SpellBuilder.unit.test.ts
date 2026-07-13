import { describe, it, expect } from 'vitest';
import {
    generateProceduralSpellVariant,
    ProceduralSpellVariantSchema,
    SpellQualitySchema,
    SpellSchema,
} from './SpellBuilder';
import { SpellCostModule } from '../modules/spellcost';
import type { Spell } from '../spellTypes';

const fireballBase: Partial<Spell> = {
    id: 'fireball',
    name: 'Fireball',
    type: 'damage',
    effect: 100,
    scale: 0,
    eco: 1,
    aoe: 1,
    precision: 0,
    dangerous: 100,
    cooldown: 0,
    range: 3,
    priority: 0,
};

describe('Procedural Spell Generation', () => {
    it('validates quality affix with Zod', () => {
        expect(SpellQualitySchema.safeParse('Amateur').success).toBe(true);
        expect(SpellQualitySchema.safeParse('Standard').success).toBe(true);
        expect(SpellQualitySchema.safeParse('Masterpiece').success).toBe(true);
        expect(SpellQualitySchema.safeParse('Broken').success).toBe(false);
    });

    it('generates a balanced Standard variant', () => {
        const variant = generateProceduralSpellVariant(fireballBase, { quality: 'Standard' });
        expect(variant).not.toBeNull();
        if (!variant) return;

        const parsed = ProceduralSpellVariantSchema.safeParse(variant);
        expect(parsed.success).toBe(true);

        expect(variant.quality).toBe('Standard');
        expect(variant.isInspected).toBe(false);
        expect(SpellCostModule.isBalanced(variant)).toBe(true);

        expect(variant.spellPoints).toBeGreaterThan(0);
        expect(variant.tier).toBeTruthy();
        expect(variant.title).toBe(variant.name);
        expect(variant.combatMetrics).toBeDefined();
        expect(variant.combatMetrics!.ttk).toBeGreaterThan(0);
    });

    it('generates Amateur variants with a 20% reduced budget', () => {
        const standard = generateProceduralSpellVariant(fireballBase, { quality: 'Standard' })!;
        const amateur = generateProceduralSpellVariant(fireballBase, { quality: 'Amateur' })!;

        expect(SpellCostModule.isBalanced(standard)).toBe(true);
        expect(SpellCostModule.isBalanced(amateur)).toBe(true);

        const amateurRatio = amateur.spellPoints! / standard.spellPoints!;
        expect(amateurRatio).toBeGreaterThanOrEqual(0.75);
        expect(amateurRatio).toBeLessThanOrEqual(0.85);

        expect(amateur.effect).toBeLessThan(standard.effect);
    });

    it('generates Masterpiece variants with increased budget', () => {
        const standard = generateProceduralSpellVariant(fireballBase, { quality: 'Standard' })!;
        const masterpiece = generateProceduralSpellVariant(fireballBase, { quality: 'Masterpiece' })!;

        expect(SpellCostModule.isBalanced(masterpiece)).toBe(true);
        expect(masterpiece.spellPoints!).toBeGreaterThan(standard.spellPoints!);
    });

    it('respects variant strategies', () => {
        const bigger = generateProceduralSpellVariant(fireballBase, {
            strategy: 'biggerLessDamage',
            quality: 'Standard',
        })!;
        const smaller = generateProceduralSpellVariant(fireballBase, {
            strategy: 'smallerMoreDamage',
            quality: 'Standard',
        })!;

        expect(bigger.aoe).toBeGreaterThan(1);
        expect(smaller.aoe).toBe(1);

        expect(SpellCostModule.isBalanced(bigger)).toBe(true);
        expect(SpellCostModule.isBalanced(smaller)).toBe(true);
    });

    it('toggles isInspected and hides combat metrics when false', () => {
        const hidden = generateProceduralSpellVariant(fireballBase, { isInspected: false })!;
        const inspected = generateProceduralSpellVariant(fireballBase, { isInspected: true })!;

        expect(hidden.isInspected).toBe(false);
        expect(inspected.isInspected).toBe(true);
        expect(inspected.combatMetrics).toBeDefined();
    });

    it('rejects malformed Zod payloads', () => {
        const bad = {
            id: '',
            name: 'Bad',
            type: 'damage',
            effect: 1000,
            scale: 0,
            eco: 1,
            aoe: 1,
            dangerous: 100,
            cooldown: 0,
            range: 1,
            priority: 0,
            spellLevel: 0,
            quality: 'Amateur',
            isInspected: false,
        };
        expect(SpellSchema.safeParse(bad).success).toBe(false);
    });
});
