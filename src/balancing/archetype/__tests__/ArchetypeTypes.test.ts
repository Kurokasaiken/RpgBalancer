/**
 * Archetype Types - Validation Tests
 * 
 * Tests for archetype type definitions and validation rules
 */

import { describe, it, expect } from 'vitest';
import type { ArchetypeTemplate, StatAllocation, TTKTarget, BalanceConfiguration } from '../types';
import { DEFAULT_ARCHETYPES, BUDGET_TIERS, DEFAULT_TTK_TARGETS } from '../constants';

describe('ArchetypeTypes', () => {
    describe('ArchetypeTemplate', () => {
        it('should create valid template', () => {
            const template: ArchetypeTemplate = {
                id: 'test_template',
                name: 'Test Template',
                description: 'A test archetype',
                category: 'Tank',
                allocation: {
                    damage: 10,
                    hp: 50,
                    armor: 20,
                    resistance: 10,
                    txc: 5,
                    evasion: 0,
                    critChance: 0,
                    critMult: 0,
                    lifesteal: 0,
                    regen: 5,
                    ward: 0,
                    block: 0,
                    armorPen: 0,
                    penPercent: 0
                },
                minBudget: 20,
                maxBudget: 100,
                tags: ['test'],
                version: '1.0.0'
            };

            expect(template.id).toBe('test_template');
            expect(template.category).toBe('Tank');
            expect(template.minBudget).toBe(20);
            expect(template.maxBudget).toBe(100);
        });

        it('should validate stat allocation sums to 100%', () => {
            const allocation: StatAllocation = {
                damage: 20,
                hp: 30,
                armor: 20,
                resistance: 10,
                txc: 10,
                evasion: 5,
                critChance: 3,
                critMult: 2,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
            expect(sum).toBe(100);
        });

        it('should reject negative allocations', () => {
            const validateAllocation = (allocation: StatAllocation): boolean => {
                return Object.values(allocation).every(val => val >= 0);
            };

            const invalidAllocation: StatAllocation = {
                damage: 20,
                hp: 30,
                armor: -10, // Invalid!
                resistance: 10,
                txc: 10,
                evasion: 5,
                critChance: 3,
                critMult: 2,
                lifesteal: 0,
                regen: 0,
                ward: 0,
                block: 0,
                armorPen: 0,
                penPercent: 0
            };

            expect(validateAllocation(invalidAllocation)).toBe(false);
        });

        it('should enforce minBudget < maxBudget', () => {
            const validateBudgetRange = (minBudget: number, maxBudget: number): boolean => {
                return minBudget > 0 && maxBudget > minBudget;
            };

            expect(validateBudgetRange(20, 100)).toBe(true);
            expect(validateBudgetRange(100, 20)).toBe(false);
            expect(validateBudgetRange(50, 50)).toBe(false);
        });
    });

    describe('TTKTarget', () => {
        it('should create valid TTK target', () => {
            const target: TTKTarget = {
                matchup: {
                    archetypeA: 'tank_juggernaut',
                    archetypeB: 'dps_berserker'
                },
                budget: 50,
                minRounds: 5,
                targetRounds: 7,
                maxRounds: 9,
                tolerance: 1,
                expectedWinner: 'A'
            };

            expect(target.matchup.archetypeA).toBe('tank_juggernaut');
            expect(target.matchup.archetypeB).toBe('dps_berserker');
            expect(target.budget).toBe(50);
            expect(target.expectedWinner).toBe('A');
        });

        it('should enforce round constraints', () => {
            const validateRoundConstraints = (min: number, target: number, max: number): boolean => {
                return min > 0 && min <= target && target <= max;
            };

            expect(validateRoundConstraints(5, 7, 9)).toBe(true);
            expect(validateRoundConstraints(7, 5, 9)).toBe(false); // target < min
            expect(validateRoundConstraints(5, 10, 9)).toBe(false); // target > max
        });
    });

    describe('SpellCost', () => {
        it('should calculate spell points from HP', () => {
            // Example conversion: HP -> Spell Points
            const calculateSpellPoints = (hpCost: number): number => {
                // Simple 1:1 conversion for now
                return hpCost;
            };

            expect(calculateSpellPoints(50)).toBe(50);
            expect(calculateSpellPoints(100)).toBe(100);
        });

        it('should assign correct tier', () => {
            const assignTier = (spellPoints: number): 1 | 2 | 3 | 4 | 5 => {
                if (spellPoints <= 20) return 1;
                if (spellPoints <= 40) return 2;
                if (spellPoints <= 60) return 3;
                if (spellPoints <= 80) return 4;
                return 5;
            };

            expect(assignTier(10)).toBe(1);
            expect(assignTier(30)).toBe(2);
            expect(assignTier(50)).toBe(3);
            expect(assignTier(70)).toBe(4);
            expect(assignTier(90)).toBe(5);
        });
    });

    describe('Default Constants', () => {
        it('should have 16 default archetypes', () => {
            expect(DEFAULT_ARCHETYPES).toHaveLength(16);
        });

        it('should have 5 budget tiers', () => {
            expect(BUDGET_TIERS).toHaveLength(5);
        });

        it('should have default TTK targets', () => {
            expect(DEFAULT_TTK_TARGETS.length).toBeGreaterThan(0);
        });

        it('should validate all default archetypes have valid allocations', () => {
            DEFAULT_ARCHETYPES.forEach(archetype => {
                const sum = Object.values(archetype.allocation).reduce((a, b) => a + b, 0);
                expect(sum).toBe(100); // All allocations must sum to 100%

                // All values must be non-negative
                Object.values(archetype.allocation).forEach(val => {
                    expect(val).toBeGreaterThanOrEqual(0);
                });

                // Budget constraints must be valid
                expect(archetype.minBudget).toBeGreaterThan(0);
                expect(archetype.maxBudget).toBeGreaterThan(archetype.minBudget);
            });
        });

        it('should have unique archetype IDs', () => {
            const ids = DEFAULT_ARCHETYPES.map(a => a.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have all archetypes categorized', () => {
            const categories = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Support', 'Hybrid'];
            DEFAULT_ARCHETYPES.forEach(archetype => {
                expect(categories).toContain(archetype.category);
            });
        });
    });
});
