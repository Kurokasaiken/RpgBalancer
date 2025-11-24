// Jest tests for spell cost calculation
import { calculateSpellCost, isSpellBalanced } from '../../balancing/spellCost';
import { createEmptySpell } from '../../balancing/spellTypes';

describe('calculateSpellCost', () => {
    test('default spell has cost 0 and is balanced', () => {
        const spell = createEmptySpell();
        expect(calculateSpellCost(spell)).toBe(0);
        expect(isSpellBalanced(spell)).toBe(true);
    });

    test('increase effect by 50% adds cost', () => {
        const spell = { ...createEmptySpell(), effect: 150 };
        // (150-100)/10 = 5 points
        expect(calculateSpellCost(spell)).toBe(5);
        expect(isSpellBalanced(spell)).toBe(false);
    });

    test('doubleSpell flag subtracts 1 point', () => {
        const spell = { ...createEmptySpell(), doubleSpell: true };
        expect(calculateSpellCost(spell)).toBe(-1);
        expect(isSpellBalanced(spell)).toBe(false);
    });

    test('combined adjustments can reach zero', () => {
        const spell = {
            ...createEmptySpell(),
            effect: 150, // +5
            doubleSpell: true, // -1
            eco: 2, // +1
            aoe: 2, // +1
            dangerous: 80, // -2 (100-80)/10 = 2
        };
        // total: 5 -1 +1 +1 -2 = 4
        expect(calculateSpellCost(spell)).toBe(4);
        // adjust scale to -4 to bring to zero
        const balanced = { ...spell, scale: -4 };
        expect(calculateSpellCost(balanced)).toBe(0);
        expect(isSpellBalanced(balanced)).toBe(true);
    });
});
