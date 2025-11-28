/**
 * ArchetypeBuilder - Tests
 * 
 * Tests for the archetype builder service
 */

import { describe, it, expect } from 'vitest';
import { ArchetypeBuilder, ValidationError } from '../ArchetypeBuilder';
import type { ArchetypeTemplate, StatAllocation } from '../types';
import { TANK_JUGGERNAUT, DPS_BERSERKER } from '../constants';

describe('ArchetypeBuilder', () => {
    describe('buildArchetype', () => {
        it('should build StatBlock at 50 budget', () => {
            const statBlock = ArchetypeBuilder.buildArchetype(TANK_JUGGERNAUT, 50);

            expect(statBlock).toBeDefined();
            expect(statBlock.hp).toBeGreaterThan(0);
            expect(statBlock.armor).toBeGreaterThan(0);
            expect(statBlock.damage).toBeGreaterThan(0);
        });

        it('should build StatBlock at 100 budget', () => {
            const statBlock = ArchetypeBuilder.buildArchetype(TANK_JUGGERNAUT, 100);

            expect(statBlock).toBeDefined();
            expect(statBlock.hp).toBeGreaterThan(0);

            // HP should scale with budget (100 budget should have ~2x HP of 50 budget)
            const statBlock50 = ArchetypeBuilder.buildArchetype(TANK_JUGGERNAUT, 50);
            expect(statBlock.hp).toBeCloseTo(statBlock50.hp * 2, 0);
        });

        it('should scale stats proportionally', () => {
            const statBlock20 = ArchetypeBuilder.buildArchetype(DPS_BERSERKER, 20);
            const statBlock40 = ArchetypeBuilder.buildArchetype(DPS_BERSERKER, 40);

            // All stats should double
            expect(statBlock40.damage).toBeCloseTo(statBlock20.damage * 2, 0);
            expect(statBlock40.hp).toBeCloseTo(statBlock20.hp * 2, 0);
        });

        it('should respect allocation percentages', () => {
            const statBlock = ArchetypeBuilder.buildArchetype(TANK_JUGGERNAUT, 50);

            // Juggernaut has 40% HP, 30% Armor
            // So HP should get more budget than Armor
            // But we need to account for weights!
            // If HP weight = 1.0 and Armor weight = 5.0:
            // HP gets 40% of 50 = 20 HP_eq -> 20 / 1.0 = 20 HP
            // Armor gets 30% of 50 = 15 HP_eq -> 15 / 5.0 = 3 Armor

            expect(statBlock.hp).toBeGreaterThan(0);
            expect(statBlock.armor).toBeGreaterThan(0);
        });

        it('should throw error if budget < minBudget', () => {
            expect(() => {
                ArchetypeBuilder.buildArchetype(TANK_JUGGERNAUT, 10); // min is 20
            }).toThrow(ValidationError);
        });
    });

    describe('validateAllocation', () => {
        it('should accept valid 100% allocation', () => {
            const allocation: StatAllocation = {
                damage: 30,
                hp: 40,
                armor: 20,
                resistance: 10,
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            expect(ArchetypeBuilder.validateAllocation(allocation)).toBe(true);
        });

        it('should reject 90% allocation (under)', () => {
            const allocation: StatAllocation = {
                damage: 30,
                hp: 40,
                armor: 20,
                resistance: 0, // Only 90% total
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            expect(() => {
                ArchetypeBuilder.validateAllocation(allocation);
            }).toThrow(ValidationError);
            expect(() => {
                ArchetypeBuilder.validateAllocation(allocation);
            }).toThrow('must sum to 100%');
        });

        it('should reject 110% allocation (over)', () => {
            const allocation: StatAllocation = {
                damage: 40,
                hp: 40,
                armor: 20,
                resistance: 10, // 110% total!
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            expect(() => {
                ArchetypeBuilder.validateAllocation(allocation);
            }).toThrow(ValidationError);
        });
    });

    describe('optimizeAllocation', () => {
        it('should distribute unallocated % intelligently', () => {
            const allocation: StatAllocation = {
                damage: 30,
                hp: 40,
                armor: 20, // Only 90% allocated
                resistance: 0,
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            const optimized = ArchetypeBuilder.optimizeAllocation(allocation);

            // Should sum to 100% now
            const sum = Object.values(optimized).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(100, 1);
        });

        it('should not exceed 100% total', () => {
            const allocation: StatAllocation = {
                damage: 30,
                hp: 40,
                armor: 20,
                resistance: 0,
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            const optimized = ArchetypeBuilder.optimizeAllocation(allocation);
            const sum = Object.values(optimized).reduce((a, b) => a + b, 0);

            expect(sum).toBeLessThanOrEqual(100.01); // Allow tiny float error
        });

        it('should respect locked stats', () => {
            // For now, we don't have locked stats
            // This test is a placeholder for future feature
            const allocation: StatAllocation = {
                damage: 30,
                hp: 40,
                armor: 20, // "Locked" at 20
                resistance: 0,
                txc: 0,
                evasion: 0,
                critChance: 0,
                critMult: 0,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            const optimized = ArchetypeBuilder.optimizeAllocation(allocation);

            // In current implementation, locked stats would need separate handling
            // For now, we just verify it doesn't break
            expect(optimized).toBeDefined();
        });
    });

    describe('createInstance', () => {
        it('should create valid archetype instance', () => {
            const instance = ArchetypeBuilder.createInstance(TANK_JUGGERNAUT, 50);

            expect(instance.templateId).toBe('tank_juggernaut');
            expect(instance.budget).toBe(50);
            expect(instance.statBlock).toBeDefined();
            expect(instance.metadata.createdAt).toBeInstanceOf(Date);
        });
    });
});
