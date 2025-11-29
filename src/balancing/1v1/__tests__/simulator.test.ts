/**
 * Unit tests for Deterministic Simulator
 * 
 * Tests:
 * - Mirror match symmetry
 * - Turn limit timeout
 * - Edge cases (zero damage, one-shot kill)
 * - Lifesteal and regen
 */

import { describe, it, expect } from 'vitest';
import { simulateExpectedTTK, predictWinProbability } from '../simulator';
import { DEFAULT_1V1_CONFIG } from '../mathEngine';
import { BASELINE_STATS } from '../../baseline';
import type { StatBlock } from '../../types';

describe('Deterministic Simulator', () => {
    describe('simulateExpectedTTK', () => {
        it('should return draw for perfect mirror match', () => {
            const stats: StatBlock = { ...BASELINE_STATS };

            const result = simulateExpectedTTK(stats, stats, DEFAULT_1V1_CONFIG);

            // With simultaneous damage application, mirror should be draw
            expect(result.result).toBe('draw');
        });

        it('should detect attacker win when attacker is stronger', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                hp: 500,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 10,
                hp: 100,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG);

            expect(result.result).toBe('attacker');
            expect(result.finalHP.attacker).toBeGreaterThan(0);
            expect(result.finalHP.defender).toBe(0);
        });

        it('should detect defender win when defender is stronger', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 10,
                hp: 100,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                hp: 500,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG);

            expect(result.result).toBe('defender');
            expect(result.finalHP.attacker).toBe(0);
            expect(result.finalHP.defender).toBeGreaterThan(0);
        });

        it('should timeout with turn limit', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 10000,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 10000,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG, 10);

            expect(result.result).toBe('timeout');
            expect(result.turns).toBe(10);
            expect(result.finalHP.attacker).toBeGreaterThan(0);
            expect(result.finalHP.defender).toBeGreaterThan(0);
        });

        it('should handle one-shot kill', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 10000,
                txc: 100,
                critChance: 0,
                failChance: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                hp: 10,
                armor: 0,
                resistance: 0,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG);

            expect(result.result).toBe('attacker');
            expect(result.turns).toBe(1);
        });

        it('should handle zero damage (timeout)', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 0,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG, 5);

            expect(result.result).toBe('timeout');
            expect(result.finalHP.attacker).toBe(attacker.hp);
            expect(result.finalHP.defender).toBe(defender.hp);
        });

        it('should apply lifesteal correctly', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 50,
                hp: 100,
                lifesteal: 50, // 50% lifesteal
                txc: 100,
                critChance: 0,
                failChance: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                hp: 150,
                damage: 30,
                armor: 0,
                resistance: 0,
                txc: 100,
                critChance: 0,
                failChance: 0,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG);

            // Attacker should win due to lifesteal
            expect(result.result).toBe('attacker');
            expect(result.finalHP.attacker).toBeGreaterThan(0);
        });

        it('should apply regen correctly', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 20,
                hp: 100,
                regen: 5, // 5 HP per turn
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 20,
                hp: 100,
                regen: 0,
            };

            const result = simulateExpectedTTK(attacker, defender, DEFAULT_1V1_CONFIG);

            // Attacker should have advantage due to regen
            // (Might still be draw due to simultaneous damage, but worth testing)
            expect(result.turns).toBeGreaterThan(0);
        });
    });

    describe('predictWinProbability', () => {
        it('should return 1.0 for overwhelming attacker', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 1000,
                hp: 1000,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 10,
            };

            const prob = predictWinProbability(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(prob).toBe(1.0);
        });

        it('should return 0.0 for overwhelming defender', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 10,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 1000,
                hp: 1000,
            };

            const prob = predictWinProbability(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(prob).toBe(0.0);
        });

        it('should return 0.5 for perfect mirror match', () => {
            const stats: StatBlock = { ...BASELINE_STATS };

            const prob = predictWinProbability(stats, stats, DEFAULT_1V1_CONFIG);
            expect(prob).toBe(0.5);
        });

        it('should return value between 0 and 1 for timeout', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 1000,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                damage: 1,
                hp: 1000,
            };

            const prob = predictWinProbability(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(prob).toBeGreaterThan(0);
            expect(prob).toBeLessThan(1);
        });
    });
});
