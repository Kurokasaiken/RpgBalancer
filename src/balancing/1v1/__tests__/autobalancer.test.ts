/**
 * Unit tests for Auto-Balancer
 */

import { describe, it, expect } from 'vitest';
import {
    proposeAdjustments,
    applyAdjustments,
    createIteration,
    startSession,
    isTargetAchieved,
    DEFAULT_AUTO_BALANCE_CONFIG,
} from '../autobalancer';
import type { Archetype, MatrixRunResult, MatchupResult } from '../types';
import { BASELINE_STATS } from '../../baseline';

describe('Auto-Balancer', () => {
    // Helper to create mock archetype
    const createMockArchetype = (id: string, damageMultiplier: number = 1): Archetype => ({
        id,
        name: id,
        role: 'Test',
        description: 'Test archetype',
        stats: {
            ...BASELINE_STATS,
            damage: BASELINE_STATS.damage * damageMultiplier,
        },
        meta: {
            createdBy: 'test',
            createdAt: new Date().toISOString(),
        },
    });

    // Helper to create mock matchup cell
    const createMockCell = (
        row: string,
        col: string,
        winRateRow: number
    ): MatchupResult => ({
        row,
        col,
        total: 1000,
        wins_row: winRateRow * 1000,
        wins_col: (1 - winRateRow) * 1000,
        draws: 0,
        win_rate_row: winRateRow,
        avg_TTK_row_win: 5,
        avg_TTK_col_win: 5,
        median_TTK: 5,
        std_TTK: 1,
        avg_hp_remaining_row_wins: 50,
        avg_hp_remaining_col_wins: 50,
        avg_overkill: 10,
        earlyImpact_row: [10, 10, 10],
        earlyImpact_col: [10, 10, 10],
        damage_time_series: {},
        SWI: {
            damage: 0.5,
            hp: 0.3,
            armor: -0.2,
        },
        runtimeMs: 100,
        seed: 123,
    });

    describe('proposeAdjustments', () => {
        it('should propose nerfs for overpowered archetypes', () => {
            const archetypes = [
                createMockArchetype('strong', 2.0),
                createMockArchetype('weak', 0.5),
            ];

            const matrix: MatrixRunResult = {
                runMeta: {
                    runId: 'test',
                    presetName: 'test',
                    createdAt: new Date().toISOString(),
                    nSim: 1000,
                    seed: 123,
                    balancerSnapshot: {
                        id: 'test',
                        name: 'Test',
                        description: 'Test',
                        weights: {},
                    },
                },
                archetypes: ['strong', 'weak'],
                matrix: [
                    createMockCell('strong', 'strong', 0.5),
                    createMockCell('strong', 'weak', 0.75), // 75% win rate - too high
                    createMockCell('weak', 'strong', 0.25),
                    createMockCell('weak', 'weak', 0.5),
                ],
            };

            const adjustments = proposeAdjustments(matrix, archetypes, DEFAULT_AUTO_BALANCE_CONFIG);

            expect(adjustments.length).toBeGreaterThan(0);

            // Should propose nerfs to "strong" archetype
            const strongAdjustments = adjustments.filter(a => a.archetypeId === 'strong');
            expect(strongAdjustments.length).toBeGreaterThan(0);

            // Adjustments should reduce stats (negative change)
            for (const adj of strongAdjustments) {
                expect(adj.proposedValue).toBeLessThan(adj.currentValue);
                expect(adj.changePercent).toBeLessThan(0);
            }
        });

        it('should propose buffs for underpowered archetypes', () => {
            const archetypes = [
                createMockArchetype('strong', 2.0),
                createMockArchetype('weak', 0.5),
            ];

            const matrix: MatrixRunResult = {
                runMeta: {
                    runId: 'test',
                    presetName: 'test',
                    createdAt: new Date().toISOString(),
                    nSim: 1000,
                    seed: 123,
                    balancerSnapshot: {
                        id: 'test',
                        name: 'Test',
                        description: 'Test',
                        weights: {},
                    },
                },
                archetypes: ['strong', 'weak'],
                matrix: [
                    createMockCell('strong', 'strong', 0.5),
                    createMockCell('strong', 'weak', 0.75),
                    createMockCell('weak', 'strong', 0.25), // 25% win rate - too low
                    createMockCell('weak', 'weak', 0.5),
                ],
            };

            const adjustments = proposeAdjustments(matrix, archetypes, DEFAULT_AUTO_BALANCE_CONFIG);

            // Should propose buffs to "weak" archetype
            const weakAdjustments = adjustments.filter(a => a.archetypeId === 'weak');
            expect(weakAdjustments.length).toBeGreaterThan(0);

            // Adjustments should increase stats (positive change)
            for (const adj of weakAdjustments) {
                expect(adj.proposedValue).toBeGreaterThan(adj.currentValue);
                expect(adj.changePercent).toBeGreaterThan(0);
            }
        });

        it('should not propose adjustments for balanced archetypes', () => {
            const archetypes = [
                createMockArchetype('balanced1'),
                createMockArchetype('balanced2'),
            ];

            const matrix: MatrixRunResult = {
                runMeta: {
                    runId: 'test',
                    presetName: 'test',
                    createdAt: new Date().toISOString(),
                    nSim: 1000,
                    seed: 123,
                    balancerSnapshot: {
                        id: 'test',
                        name: 'Test',
                        description: 'Test',
                        weights: {},
                    },
                },
                archetypes: ['balanced1', 'balanced2'],
                matrix: [
                    createMockCell('balanced1', 'balanced1', 0.5),
                    createMockCell('balanced1', 'balanced2', 0.50), // Perfectly balanced
                    createMockCell('balanced2', 'balanced1', 0.50),
                    createMockCell('balanced2', 'balanced2', 0.5),
                ],
            };

            const adjustments = proposeAdjustments(matrix, archetypes, DEFAULT_AUTO_BALANCE_CONFIG);

            // Should propose no adjustments for perfectly balanced archetypes
            expect(adjustments.length).toBe(0);
        });
    });

    describe('applyAdjustments', () => {
        it('should apply proposed adjustments to archetypes', () => {
            const archetypes = [createMockArchetype('test', 1)];
            const adjustments = [{
                archetypeId: 'test',
                statKey: 'damage',
                currentValue: 50,
                proposedValue: 45,
                changePercent: -10,
                reason: 'Test nerf',
            }];

            const modified = applyAdjustments(archetypes, adjustments);

            expect(modified[0].stats.damage).toBe(45);
        });

        it('should not modify original archetypes', () => {
            const archetypes = [createMockArchetype('test', 1)];
            const originalDamage = archetypes[0].stats.damage;

            const adjustments = [{
                archetypeId: 'test',
                statKey: 'damage',
                currentValue: originalDamage,
                proposedValue: originalDamage * 0.9,
                changePercent: -10,
                reason: 'Test',
            }];

            applyAdjustments(archetypes, adjustments);

            // Original should be unchanged
            expect(archetypes[0].stats.damage).toBe(originalDamage);
        });
    });

    describe('Session Management', () => {
        it('should create valid iteration', () => {
            const iteration = createIteration(1, 'run-123', 0.15, []);

            expect(iteration.iteration).toBe(1);
            expect(iteration.previousRunId).toBe('run-123');
            expect(iteration.balanceScoreBefore).toBe(0.15);
            expect(iteration.timestamp).toBeDefined();
        });

        it('should start new session', () => {
            const session = startSession(0.20);

            expect(session.sessionId).toBeDefined();
            expect(session.startTime).toBeDefined();
            expect(session.initialBalanceScore).toBe(0.20);
            expect(session.iterations).toEqual([]);
            expect(session.targetAchieved).toBe(false);
        });

        it('should check target achievement', () => {
            // Low deviation = good balance
            expect(isTargetAchieved(0.03, DEFAULT_AUTO_BALANCE_CONFIG)).toBe(true);

            // High deviation = poor balance
            expect(isTargetAchieved(0.15, DEFAULT_AUTO_BALANCE_CONFIG)).toBe(false);
        });
    });
});
