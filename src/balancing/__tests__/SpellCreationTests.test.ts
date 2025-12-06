import { describe, it, expect } from 'vitest';
import { createEmptySpell } from '../spellTypes';
import { calculateSpellBudget, SPELL_CONFIG, getStatWeight } from '../spellBalancingConfig';


describe('Spell Creation Module', () => {
    it('should have initial cost of 0', () => {
        const spell = createEmptySpell();
        const cost = calculateSpellBudget(spell);
        expect(cost).toBe(0);
    });

    it('should not have deleted fields in default spell', () => {
        const spell = createEmptySpell();
        // Check that deleted fields are undefined or not present in a meaningful way
        // Note: Typescript interface might still have them as optional, but factory shouldn't set them
        expect((spell as any).castTime).toBeUndefined();
        expect((spell as any).charges).toBeUndefined();
        expect((spell as any).channel).toBeUndefined();
        expect((spell as any).reflection).toBeUndefined();
        expect((spell as any).legendary).toBeUndefined();
        expect((spell as any).doubleSpell).toBeUndefined();
        expect((spell as any).maxStacks).toBeUndefined();
    });

    it('should have disabled fields set to baseline', () => {
        const spell = createEmptySpell();
        expect(spell.cooldown).toBe(0);
        expect(spell.range).toBe(0);
        expect(spell.manaCost).toBe(0);
    });

    it('should calculate cost correctly for modified fields', () => {
        const spell = createEmptySpell();
        // Modify effect from baseline (0) by +200
        spell.effect = 200;
        const cost = calculateSpellBudget(spell);
        // 200 * weight
        const expectedCost = 200 * getStatWeight('effect');
        expect(cost).toBeCloseTo(expectedCost);
    });


    it('should have correct stat weights configuration', () => {
        // Disabled fields should have 0 weight
        expect(SPELL_CONFIG.weights.cooldown).toBe(0);
        expect(SPELL_CONFIG.weights.range).toBe(0);
        expect(SPELL_CONFIG.weights.manaCost).toBe(0);

        // Deleted fields should not be in weights (or ignored)
        expect(SPELL_CONFIG.weights.castTime).toBeUndefined();
        expect(SPELL_CONFIG.weights.reflection).toBeUndefined();
    });
});
