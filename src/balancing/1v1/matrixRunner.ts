/**
 * Matrix Runner for 1v1 Balancing System
 * 
 * Executes NxN matchup matrix with full metrics:
 * - Monte Carlo simulations for each cell
 * - SWI calculation for each cell
 * - Progress tracking
 * - Result aggregation
 * 
 * Can run in fast mode (nSimFast) or full mode (nSimFull).
 * 
 * @see src/balancing/1v1/montecarlo.ts
 * @see src/balancing/1v1/swi.ts
 */

import type { StatBlock } from '../types';
import type { BalancerConfig1v1 } from './mathEngine';
import { DEFAULT_1V1_CONFIG } from './mathEngine';
import { runMonteCarlo } from './montecarlo';
import { computeAllSWIForMatchup } from './swi';
import type { Archetype, MatrixRunResult, MatchupResult } from './types';
import { loadArchetypes } from './io';

/**
 * Options for running a matrix
 */
export interface MatrixOptions {
    fast?: boolean; // Use nSimFast instead of nSimFull
    seed?: number; // Base seed for reproducibility
    onProgress?: (current: number, total: number, cellInfo?: string) => void;
    config?: BalancerConfig1v1;
}

/**
 * Run NxN matchup matrix
 * 
 * @param archetypeIds Array of archetype IDs to test
 * @param options Matrix options
 * @returns Complete matrix run result
 */
export async function runMatrix(
    archetypeIds: string[],
    options: MatrixOptions = {}
): Promise<MatrixRunResult> {
    const {
        fast = false,
        seed = Date.now(),
        onProgress,
        config = DEFAULT_1V1_CONFIG,
    } = options;

    const startTime = Date.now();

    // Load archetypes
    const archetypes: Archetype[] = [];
    const archetypesById: Map<string, Archetype> = new Map();

    for (const id of archetypeIds) {
        // For now, we'll create dummy archetypes
        // In production, these would be loaded from IO
        const archetype: Archetype = {
            id,
            name: id,
            role: 'Unknown',
            description: `Archetype ${id}`,
            stats: { ...config } as any, // TODO: Load real stats
            meta: {
                createdBy: 'system',
                createdAt: new Date().toISOString(),
            },
        };
        archetypes.push(archetype);
        archetypesById.set(id, archetype);
    }

    // Determine simulation count
    const nSim = fast ? config.nSimFast : config.nSimFull;

    // Calculate total cells
    const n = archetypeIds.length;
    const totalCells = n * n;
    let currentCell = 0;

    // Results array
    const matrix: MatchupResult[] = [];

    // Run each matchup
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const rowId = archetypeIds[i];
            const colId = archetypeIds[j];

            currentCell++;

            // Report progress
            if (onProgress) {
                onProgress(currentCell, totalCells, `${rowId} vs ${colId}`);
            }

            const rowArchetype = archetypesById.get(rowId)!;
            const colArchetype = archetypesById.get(colId)!;

            // Generate cell seed (deterministic based on base seed + cell position)
            const cellSeed = seed + (i * n + j);

            // Run Monte Carlo simulation
            const mcResult = runMonteCarlo(
                rowArchetype.stats,
                colArchetype.stats,
                nSim,
                cellSeed,
                config
            );

            // Compute SWI for this matchup
            const swiResults = computeAllSWIForMatchup(
                rowArchetype.stats,
                colArchetype.stats,
                config.SWI_DELTA,
                config,
                'attacker'
            );

            // Convert SWI array to object
            const swiMap: Record<string, number> = {};
            swiResults.forEach(swi => {
                swiMap[swi.statKey] = swi.value;
            });

            // Create matchup result
            const matchupResult: MatchupResult = {
                row: rowId,
                col: colId,
                total: mcResult.totalSimulations,
                wins_row: mcResult.wins_row,
                wins_col: mcResult.wins_col,
                draws: mcResult.draws,
                win_rate_row: mcResult.win_rate_row,

                avg_TTK_row_win: mcResult.avg_TTK_row_win,
                avg_TTK_col_win: mcResult.avg_TTK_col_win,
                median_TTK: mcResult.median_TTK,
                std_TTK: mcResult.std_TTK,

                avg_hp_remaining_row_wins: mcResult.avg_hp_remaining_row_wins,
                avg_hp_remaining_col_wins: mcResult.avg_hp_remaining_col_wins,
                avg_overkill: mcResult.avg_overkill,

                earlyImpact_row: mcResult.earlyImpact_row,
                earlyImpact_col: mcResult.earlyImpact_col,

                damage_time_series: mcResult.damage_time_series,

                SWI: swiMap,

                runtimeMs: mcResult.runtimeMs,
                seed: cellSeed,
            };

            matrix.push(matchupResult);
        }
    }

    const totalRuntime = Date.now() - startTime;

    // Create run metadata
    const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const runResult: MatrixRunResult = {
        runMeta: {
            runId,
            presetName: 'default', // TODO: Get from config
            createdAt: new Date().toISOString(),
            nSim,
            seed,
            balancerSnapshot: {
                id: 'default',
                name: 'Default',
                description: 'Default balance preset',
                weights: {}, // TODO: Get from config
            },
        },
        archetypes: archetypeIds,
        matrix,
    };

    console.log(`Matrix run complete: ${totalCells} cells in ${totalRuntime}ms`);

    return runResult;
}

/**
 * Get a specific cell from matrix result
 * 
 * @param matrix Matrix result
 * @param rowId Row archetype ID
 * @param colId Column archetype ID
 * @returns Matchup result or undefined
 */
export function getMatrixCell(
    matrix: MatrixRunResult,
    rowId: string,
    colId: string
): MatchupResult | undefined {
    return matrix.matrix.find(cell => cell.row === rowId && cell.col === colId);
}

/**
 * Calculate overall balance score for matrix
 * Lower is better (closer to 50% win rates)
 * 
 * @param matrix Matrix result
 * @returns Balance score (0 = perfect, higher = more imbalanced)
 */
export function calculateBalanceScore(matrix: MatrixRunResult): number {
    let totalDeviation = 0;
    let count = 0;

    for (const cell of matrix.matrix) {
        // Skip mirror matches
        if (cell.row === cell.col) continue;

        // Calculate deviation from 50%
        const deviation = Math.abs(cell.win_rate_row - 0.5);
        totalDeviation += deviation;
        count++;
    }

    return count > 0 ? totalDeviation / count : 0;
}

/**
 * Find most imbalanced matchups
 * 
 * @param matrix Matrix result  
 * @param topN Number of results to return
 * @returns Array of most imbalanced matchups
 */
export function findMostImbalanced(
    matrix: MatrixRunResult,
    topN: number = 5
): MatchupResult[] {
    // Filter out mirror matches and sort by deviation from 50%
    const nonMirror = matrix.matrix.filter(cell => cell.row !== cell.col);
    const sorted = nonMirror.sort((a, b) => {
        const devA = Math.abs(a.win_rate_row - 0.5);
        const devB = Math.abs(b.win_rate_row - 0.5);
        return devB - devA; // Descending
    });

    return sorted.slice(0, topN);
}
