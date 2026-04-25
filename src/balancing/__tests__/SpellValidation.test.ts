/**
 * Spell Validation Test
 * 
 * Validates that all spells are properly balanced after rebalancing
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_SPELLS } from '../defaultSpells';
import { SpellCostModule } from '../modules/spellcost';

describe('Spell Validation', () => {
    // Use DEFAULT_SPELLS from spells.json (loadSpells requires browser localStorage)
    const spells = DEFAULT_SPELLS;

    it('should have spells loaded', () => {
        expect(spells.length).toBeGreaterThan(0);
    });

    it('all spells should be balanced within tolerance', () => {
        const unbalanced: string[] = [];
        const tolerance = 0.25; // ±25% is acceptable

        for (const spell of spells) {
            if (!spell.manaCost || spell.manaCost === 0) continue;

            const isBalanced = SpellCostModule.isBalanced(spell, tolerance);
            if (!isBalanced) {
                const power = SpellCostModule.calculateSpellPower(spell).totalPower;
                const recommended = SpellCostModule.calculateManaCost(spell);
                unbalanced.push(
                    `${spell.name} (${spell.type}): ` +
                    `current=${spell.manaCost} recommended=${recommended} power=${power.toFixed(1)}`
                );
            }
        }

        if (unbalanced.length > 0) {
            console.log('\nUnbalanced spells:');
            unbalanced.forEach(s => console.log(`  - ${s}`));
        }

        expect(unbalanced.length).toBe(0);
    });

    it('no spell should have legendary field', () => {
        const hasLegendary = spells.filter(s => s.legendary === true);
        expect(hasLegendary.length).toBe(0);
    });

    it('all spell powers should be positive', () => {
        for (const spell of spells) {
            const power = SpellCostModule.calculateSpellPower(spell).totalPower;
            expect(power).toBeGreaterThan(0);
        }
    });

    it('mana costs should be reasonable (1-200)', () => {
        for (const spell of spells) {
            if (spell.manaCost) {
                expect(spell.manaCost).toBeGreaterThanOrEqual(1);
                expect(spell.manaCost).toBeLessThanOrEqual(200);
            }
        }
    });

    describe('Spell Type Distribution', () => {
        it('should have variety of spell types', () => {
            const types = new Set(spells.map(s => s.type));
            expect(types.size).toBeGreaterThanOrEqual(3);
        });

        it('CC spells should have higher mana costs', () => {
            const ccSpells = spells.filter(s => s.type === 'cc' && s.manaCost);
            const avgCC = ccSpells.reduce((sum, s) => sum + (s.manaCost || 0), 0) / ccSpells.length;

            const damageSpells = spells.filter(s => s.type === 'damage' && s.manaCost);
            const avgDamage = damageSpells.reduce((sum, s) => sum + (s.manaCost || 0), 0) / damageSpells.length;

            if (ccSpells.length > 0 && damageSpells.length > 0) {
                expect(avgCC).toBeGreaterThan(avgDamage);
            }
        });
    });
});
