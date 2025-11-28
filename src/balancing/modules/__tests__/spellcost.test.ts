/**
 * SpellCost Module - Tests
 */

import { describe, it, expect } from 'vitest';
import { SpellCostModule, SPELL_TIERS } from '../spellcost';
import type { Spell } from '../../spellTypes';

describe('SpellCost Module - Currency System', () => {
    describe('calculateSpellPoints', () => {
        it('should calculate spell points from HP cost', () => {
            const spell: Spell = {
                id: 'test_spell',
                name: 'Test Spell',
                type: 'damage',
                effect: 100, // 100% damage
                eco: 1,
                dangerous: 100,
                scale: 1,
                precision: 100,
                aoe: 1,
                cooldown: 0,
                range: 1,
                priority: 0,
                manaCost: 0
            };

            const points = SpellCostModule.calculateSpellPoints(spell);

            expect(points).toBeGreaterThan(0);
            expect(Number.isInteger(points)).toBe(true);
        });
    });

    describe('calculateTier', () => {
        it('should assign tier 1 (Common) for low points', () => {
            expect(SpellCostModule.calculateTier(10)).toBe(1);
            expect(SpellCostModule.calculateTier(20)).toBe(1);
        });

        it('should assign tier 2 (Uncommon) for mid-low points', () => {
            expect(SpellCostModule.calculateTier(30)).toBe(2);
            expect(SpellCostModule.calculateTier(40)).toBe(2);
        });

        it('should assign tier 3 (Rare) for mid points', () => {
            expect(SpellCostModule.calculateTier(50)).toBe(3);
            expect(SpellCostModule.calculateTier(60)).toBe(3);
        });

        it('should assign tier 4 (Epic) for high points', () => {
            expect(SpellCostModule.calculateTier(70)).toBe(4);
            expect(SpellCostModule.calculateTier(80)).toBe(4);
        });

        it('should assign tier 5 (Legendary) for very high points', () => {
            expect(SpellCostModule.calculateTier(90)).toBe(5);
            expect(SpellCostModule.calculateTier(150)).toBe(5);
        });
    });

    describe('getSpellCost', () => {
        it('should return complete SpellCost object', () => {
            const spell: Spell = {
                id: 'fire_ball',
                name: 'Fireball',
                type: 'damage',
                effect: 150, // High damage
                eco: 1,
                dangerous: 100,
                scale: 1,
                precision: 100,
                aoe: 1,
                cooldown: 0,
                range: 1,
                priority: 0,
                manaCost: 0
            };

            const cost = SpellCostModule.getSpellCost(spell);

            expect(cost).toBeDefined();
            expect(cost.spellPoints).toBeGreaterThan(0);
            expect(cost.tier).toBeGreaterThanOrEqual(1);
            expect(cost.tier).toBeLessThanOrEqual(5);
        });
    });

    describe('SPELL_TIERS', () => {
        it('should have 5 tier definitions', () => {
            const tiers = Object.keys(SPELL_TIERS);
            expect(tiers).toHaveLength(5);
        });

        it('should have correct tier boundaries', () => {
            expect(SPELL_TIERS.COMMON.max).toBe(20);
            expect(SPELL_TIERS.UNCOMMON.min).toBe(21);
            expect(SPELL_TIERS.UNCOMMON.max).toBe(40);
            expect(SPELL_TIERS.RARE.min).toBe(41);
            expect(SPELL_TIERS.RARE.max).toBe(60);
            expect(SPELL_TIERS.EPIC.min).toBe(61);
            expect(SPELL_TIERS.EPIC.max).toBe(80);
            expect(SPELL_TIERS.LEGENDARY.min).toBe(81);
        });

        it('should have visual metadata for each tier', () => {
            Object.values(SPELL_TIERS).forEach(tier => {
                expect(tier.name).toBeDefined();
                expect(tier.color).toBeDefined();
                expect(tier.icon).toBeDefined();
            });
        });
    });
});
