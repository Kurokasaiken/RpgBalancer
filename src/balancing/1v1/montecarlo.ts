/**
 * Monte Carlo Simulation for 1v1 Balancing Module
 * 
 * Extends the existing MonteCarloSimulation with:
 * - Seedable RNG for reproducibility
 * - Additional metrics (earlyImpact, damage_time_series)
 * - Integration with 1v1 types (MatchupResult)
 * 
 * Note: This wraps the existing CombatSimulator but adds 1v1-specific tracking.
 * 
 * @see src/balancing/simulation/MonteCarloSimulation.ts (existing implementation)
 * @see src/balancing/simulation/CombatSimulator.ts (underlying simulator)
 */

import { mean, median, standardDeviation } from 'simple-statistics';
import { CombatSimulator } from '../simulation/CombatSimulator';
import type { StatBlock } from '../types';
import type { BalancerConfig1v1 } from './mathEngine';
import { DEFAULT_1V1_CONFIG } from './mathEngine';

/**
 * Result of a single Monte Carlo match
 */
export interface MonteCarloMatchResult {
    winner: 'row' | 'col' | 'draw';
    turns: number;
    damageDealt: {
        row: number;
        col: number;
    };
    hpRemaining: {
        row: number;
        col: number;
    };
    overkill: {
        row: number;
        col: number;
    };
    // Per-turn damage tracking (for early impact and time series)
    damagePerTurn?: {
        row: number[];
        col: number[];
    };
}

/**
 * Aggregated results from Monte Carlo simulation
 */
export interface MonteCarloResult {
    // Win statistics
    wins_row: number;
    wins_col: number;
    draws: number;
    win_rate_row: number;

    // TTK statistics
    avg_TTK_row_win: number;
    avg_TTK_col_win: number;
    median_TTK: number;
    std_TTK: number;

    // HP statistics
    avg_hp_remaining_row_wins: number;
    avg_hp_remaining_col_wins: number;
    avg_overkill: number;

    // Early impact (first N turns, default 3)
    earlyImpact_row: number[];
    earlyImpact_col: number[];

    // Damage time series (per-turn mean/median)
    damage_time_series: Record<string, { mean: number; median: number }>;

    // Metadata
    totalSimulations: number;
    seed: number;
    runtimeMs: number;
}

/**
 * Simple seedable RNG (Linear Congruential Generator)
 * Used for reproducibility in Monte Carlo simulations
 */
class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Generate next random number in range [0, 1)
     */
    next(): number {
        // LCG parameters (Numerical Recipes)
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }

    /**
     * Generate random integer in range [min, max]
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Random boolean with given probability
     */
    nextBool(probability: number): boolean {
        return this.next() < probability;
    }
}

/**
 * Run Monte Carlo simulation for a single matchup
 * 
 * @param rowStats Row archetype stats
 * @param colStats Column archetype stats
 * @param nSim Number of simulations to run
 * @param seed Random seed for reproducibility
 * @param config Configuration
 * @param earlyImpactTurns Number of turns to track for early impact (default: 3)
 * @returns Aggregated Monte Carlo results
 */
export function runMonteCarlo(
    rowStats: StatBlock,
    colStats: StatBlock,
    nSim: number,
    seed: number,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG,
    earlyImpactTurns: number = 3
): MonteCarloResult {
    const startTime = Date.now();

    // Initialize RNG
    const rng = new SeededRNG(seed);

    // Track results
    let wins_row = 0;
    let wins_col = 0;
    let draws = 0;

    const ttkResults: number[] = [];
    const ttkRowWins: number[] = [];
    const ttkColWins: number[] = [];

    const hpRemainingRowWins: number[] = [];
    const hpRemainingColWins: number[] = [];

    const overkillRow: number[] = [];
    const overkillCol: number[] = [];

    // Early impact tracking (sum across all matches)
    const earlyImpactRowSum: number[] = Array(earlyImpactTurns).fill(0);
    const earlyImpactColSum: number[] = Array(earlyImpactTurns).fill(0);
    let earlyImpactCount = 0;

    // Damage time series (collect all per-turn damages)
    const damageTimeSeriesRow: Map<number, number[]> = new Map();
    const damageTimeSeriesCol: Map<number, number[]> = new Map();

    // Run simulations
    for (let i = 0; i < nSim; i++) {
        // Use existing CombatSimulator (it has RNG internally)
        // CRITICAL: Pass the seeded RNG wrapper to the simulator
        // We bind the next() method to the rng instance to ensure correct 'this' context
        const rngWrapper = () => rng.next();

        const result = CombatSimulator.simulate({
            entity1: { ...rowStats, name: 'Row Entity', attack: rowStats.damage, defense: rowStats.armor },
            entity2: { ...colStats, name: 'Col Entity', attack: colStats.damage, defense: colStats.armor },
            turnLimit: config.turnLimitPolicy(50), // Estimate
            enableDetailedLogging: false, // Disable for performance
        }, rngWrapper);

        // Map result to row/col terminology
        const winner = result.winner === 'entity1' ? 'row' : result.winner === 'entity2' ? 'col' : 'draw';

        // Count wins
        if (winner === 'row') {
            wins_row++;
            ttkRowWins.push(result.turns);
            hpRemainingRowWins.push(result.hpRemaining.entity1);
        } else if (winner === 'col') {
            wins_col++;
            ttkColWins.push(result.turns);
            hpRemainingColWins.push(result.hpRemaining.entity2);
        } else {
            draws++;
        }

        // Track TTK
        ttkResults.push(result.turns);

        // Track overkill
        overkillRow.push(result.overkill.entity1);
        overkillCol.push(result.overkill.entity2);

        // Track early impact (if we have turn-by-turn data)
        // Note: Current implementation doesn't provide per-turn damage tracking
        // This would require enhancing CombatSimulator to return per-turn damages
        // For now, we'll estimate from total damage
        if (result.turns >= earlyImpactTurns) {
            earlyImpactCount++;
            const avgDamagePerTurnRow = result.damageDealt.entity1 / result.turns;
            const avgDamagePerTurnCol = result.damageDealt.entity2 / result.turns;
            for (let t = 0; t < earlyImpactTurns; t++) {
                earlyImpactRowSum[t] += avgDamagePerTurnRow;
                earlyImpactColSum[t] += avgDamagePerTurnCol;
            }
        }

        // Track damage time series (estimate)
        for (let t = 1; t <= result.turns; t++) {
            const avgDmgRow = result.damageDealt.entity1 / result.turns;
            const avgDmgCol = result.damageDealt.entity2 / result.turns;

            if (!damageTimeSeriesRow.has(t)) {
                damageTimeSeriesRow.set(t, []);
                damageTimeSeriesCol.set(t, []);
            }

            damageTimeSeriesRow.get(t)!.push(avgDmgRow);
            damageTimeSeriesCol.get(t)!.push(avgDmgCol);
        }
    }

    // Calculate statistics
    const win_rate_row = wins_row / nSim;

    const avg_TTK_row_win = ttkRowWins.length > 0 ? mean(ttkRowWins) : 0;
    const avg_TTK_col_win = ttkColWins.length > 0 ? mean(ttkColWins) : 0;
    const median_TTK = median(ttkResults);
    const std_TTK = standardDeviation(ttkResults);

    const avg_hp_remaining_row_wins = hpRemainingRowWins.length > 0 ? mean(hpRemainingRowWins) : 0;
    const avg_hp_remaining_col_wins = hpRemainingColWins.length > 0 ? mean(hpRemainingColWins) : 0;

    const avg_overkill_row = mean(overkillRow);
    const avg_overkill_col = mean(overkillCol);
    const avg_overkill = (avg_overkill_row + avg_overkill_col) / 2;

    // Calculate early impact (average across matches)
    const earlyImpact_row = earlyImpactRowSum.map(sum => sum / Math.max(1, earlyImpactCount));
    const earlyImpact_col = earlyImpactColSum.map(sum => sum / Math.max(1, earlyImpactCount));

    // Calculate damage time series
    const damage_time_series: Record<string, { mean: number; median: number }> = {};
    damageTimeSeriesRow.forEach((values, turn) => {
        const valuesCol = damageTimeSeriesCol.get(turn) || [];
        damage_time_series[`turn${turn}`] = {
            mean: (mean(values) + mean(valuesCol)) / 2,
            median: (median(values) + median(valuesCol)) / 2,
        };
    });

    const runtimeMs = Date.now() - startTime;

    return {
        wins_row,
        wins_col,
        draws,
        win_rate_row,

        avg_TTK_row_win,
        avg_TTK_col_win,
        median_TTK,
        std_TTK,

        avg_hp_remaining_row_wins,
        avg_hp_remaining_col_wins,
        avg_overkill,

        earlyImpact_row,
        earlyImpact_col,

        damage_time_series,

        totalSimulations: nSim,
        seed,
        runtimeMs,
    };
}

/**
 * Run Monte Carlo simulation with parallel execution (future enhancement)
 * 
 * Note: This is a placeholder for future parallelization using Node workers.
 * For now, it delegates to the sequential version.
 * 
 * @param rowStats Row archetype stats
 * @param colStats Column archetype stats
 * @param nSim Number of simulations
 * @param seed Random seed
 * @param config Configuration
 * @param concurrency Number of parallel workers (default: # of CPU cores)
 * @returns Monte Carlo results
 */
export async function runMonteCarloParallel(
    rowStats: StatBlock,
    colStats: StatBlock,
    nSim: number,
    seed: number,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG,
    concurrency: number = 4
): Promise<MonteCarloResult> {
    // TODO: Implement worker-based parallelization
    // For now, just run sequentially
    console.warn('Parallel Monte Carlo not yet implemented - running sequentially');
    return runMonteCarlo(rowStats, colStats, nSim, seed, config);
}
