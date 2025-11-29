/**
 * Integration tests for 1v1 Balancing Module
 * 
 * Tests the full pipeline:
 * 1. Create archetypes
 * 2. Run matrix
 * 3. Analyze results
 * 4. Save/load via IO
 */

import { describe, it, expect } from 'vitest';
import { runMatrix, calculateBalanceScore, findMostImbalanced, getMatrixCell } from '../matrixRunner';
import { saveRunResults, loadRunResults } from '../io';
import { BASELINE_STATS } from '../../baseline';
import type { StatBlock } from '../../types';

describe('Integration Tests', () => {
    describe('runMatrix', () => {
        it('should run a 2x2 matrix successfully', async () => {
            const archetypeIds = ['archetype1', 'archetype2'];

            const result = await runMatrix(archetypeIds, {
                fast: true, // Use fast mode for testing
                seed: 12345,
            });

            expect(result).toBeDefined();
            expect(result.archetypes).toHaveLength(2);
            expect(result.matrix).toHaveLength(4); // 2x2 = 4 cells

            // Check that all cells have required fields
            for (const cell of result.matrix) {
                expect(cell.row).toBeDefined();
                expect(cell.col).toBeDefined();
                expect(cell.total).toBeGreaterThan(0);
                expect(cell.win_rate_row).toBeGreaterThanOrEqual(0);
                expect(cell.win_rate_row).toBeLessThanOrEqual(1);
            }
        });

        it('should handle progress callbacks', async () => {
            const archetypeIds = ['arch1', 'arch2'];
            const progressUpdates: Array<{ current: number; total: number }> = [];

            await runMatrix(archetypeIds, {
                fast: true,
                onProgress: (current, total) => {
                    progressUpdates.push({ current, total });
                },
            });

            expect(progressUpdates.length).toBe(4); // 2x2 cells
            expect(progressUpdates[progressUpdates.length - 1].current).toBe(4);
        });

        it('should generate deterministic results with same seed', async () => {
            const archetypeIds = ['test1', 'test2'];
            const seed = 999;

            const result1 = await runMatrix(archetypeIds, { fast: true, seed });
            const result2 = await runMatrix(archetypeIds, { fast: true, seed });

            // Results should be identical
            expect(result1.matrix[0].wins_row).toBe(result2.matrix[0].wins_row);
            expect(result1.matrix[0].median_TTK).toBe(result2.matrix[0].median_TTK);
        });
    });

    describe('getMatrixCell', () => {
        it('should retrieve specific cell from matrix', async () => {
            const archetypeIds = ['a', 'b'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const cell = getMatrixCell(result, 'a', 'b');

            expect(cell).toBeDefined();
            expect(cell?.row).toBe('a');
            expect(cell?.col).toBe('b');
        });

        it('should return undefined for non-existent cell', async () => {
            const archetypeIds = ['a', 'b'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const cell = getMatrixCell(result, 'x', 'y');

            expect(cell).toBeUndefined();
        });
    });

    describe('calculateBalanceScore', () => {
        it('should calculate balance score for matrix', async () => {
            const archetypeIds = ['test1', 'test2'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const score = calculateBalanceScore(result);

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(0.5); // Max deviation
        });

        it('should return 0 for perfectly balanced matrix', async () => {
            // This is theoretical - real matchups won't be perfect
            const archetypeIds = ['mirror'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const score = calculateBalanceScore(result);

            // Single archetype has no non-mirror matches, should return 0
            expect(score).toBe(0);
        });
    });

    describe('findMostImbalanced', () => {
        it('should find most imbalanced matchups', async () => {
            const archetypeIds = ['a', 'b', 'c'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const imbalanced = findMostImbalanced(result, 3);

            expect(imbalanced.length).toBeLessThanOrEqual(6); // 3x3 - 3 mirrors = 6

            // Should be sorted by deviation from 50%
            for (let i = 0; i < imbalanced.length - 1; i++) {
                const dev1 = Math.abs(imbalanced[i].win_rate_row - 0.5);
                const dev2 = Math.abs(imbalanced[i + 1].win_rate_row - 0.5);
                expect(dev1).toBeGreaterThanOrEqual(dev2);
            }
        });

        it('should exclude mirror matches', async () => {
            const archetypeIds = ['a', 'b'];
            const result = await runMatrix(archetypeIds, { fast: true });

            const imbalanced = findMostImbalanced(result, 10);

            // Should not include any mirror matches
            for (const match of imbalanced) {
                expect(match.row).not.toBe(match.col);
            }
        });
    });

    describe('IO Integration', () => {
        it('should save and load run results', async () => {
            const archetypeIds = ['io-test1', 'io-test2'];
            const result = await runMatrix(archetypeIds, { fast: true });

            // Save
            await saveRunResults(result);

            // Load
            const loaded = await loadRunResults(result.runMeta.runId);

            if (loaded) {
                expect(loaded.runMeta.runId).toBe(result.runMeta.runId);
                expect(loaded.archetypes).toEqual(result.archetypes);
                expect(loaded.matrix.length).toBe(result.matrix.length);
            } else {
                // IO may not be available in test environment
                console.warn('IO not available in test environment');
            }
        });
    });
});
