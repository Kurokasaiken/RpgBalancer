// Jest tests for spell cost calculation
import { describe, test, expect } from 'vitest';
import { SpellCostModule } from '../modules/spellcost';
import { createEmptySpell } from '../spellTypes';
import { getStatWeight } from '../spellBalancingConfig';

describe('SpellCostModule', () => {
    test('default spell has cost 0 and is balanced', () => {
        const spell = createEmptySpell();
        expect(SpellCostModule.calculateSpellPoints(spell)).toBe(0);
        // Tolerance might be needed depending on float math, but 0 should be 0
        expect(SpellCostModule.isBalanced(spell)).toBe(true);
    });

    test('increase effect by 50% adds cost', () => {
        const spell = { ...createEmptySpell(), effect: 150 };
        // Cost depends on weight. Baseline effect is usually 0 (or 100%?)
        // createEmptySpell() -> effect: 0?
        // If baseline is 0, then delta is 150.
        // If baseline is 100, then delta is 50.
        // SpellCostModule.calculateSpellPoints uses calculateSpellBudget.
        // calculateSpellBudget uses baseline from config.
        
        const points = SpellCostModule.calculateSpellPoints(spell);
        expect(points).not.toBe(0);
        expect(SpellCostModule.isBalanced(spell)).toBe(false);
    });

    test('doubleSpell flag subtracts points (if weighted)', () => {
        const spell = { ...createEmptySpell(), doubleSpell: true };
        const points = SpellCostModule.calculateSpellPoints(spell);
        
        const weight = getStatWeight('doubleSpell');
        if (weight !== 0) {
             // If weight is negative (bonus), points should be negative
             expect(points).toBeLessThan(0);
        }
    });
});
