/**
 * Auto-Balancer for 1v1 System
 * 
 * Analyzes matrix results and proposes stat adjustments to improve overall balance.
 * 
 * Features:
 * - Automatic nerf/buff proposals based on win rate deviation
 * - Versioning system for tracking iterations
 * - Rollback support
 * - Configurable thresholds and strategies
 * 
 * Strategy:
 * - Identify archetypes with consistently high win rates (>55%)
 * - Propose nerfs to dominant stats (based on SWI)
 * - Limit adjustment magnitude per iteration (safety)
 * - Track versions for comparison
 * 
 * @see src/balancing/1v1/matrixRunner.ts
 * @see src/balancing/1v1/swi.ts
 */

import type { Archetype, MatrixRunResult } from './types';

/**
 * Auto-balance configuration
 */
export interface AutoBalanceConfig {
    winRateTargetMin: number; // Target minimum win rate (default: 0.45)
    winRateTargetMax: number; // Target maximum win rate (default: 0.55)
    maxAdjustmentPerIteration: number; // Max stat change % per iteration (default: 0.05 = 5%)
    topNImbalanced: number; // Number of imbalanced matchups to analyze (default: 5)
    strategy: 'conservative' | 'aggressive'; // Adjustment strategy
}

export const DEFAULT_AUTO_BALANCE_CONFIG: AutoBalanceConfig = {
    winRateTargetMin: 0.45,
    winRateTargetMax: 0.55,
    maxAdjustmentPerIteration: 0.05,
    topNImbalanced: 5,
    strategy: 'conservative',
};

/**
 * Proposed stat adjustment for an archetype
 */
export interface StatAdjustment {
    archetypeId: string;
    statKey: string;
    currentValue: number;
    proposedValue: number;
    changePercent: number;
    reason: string; // Explanation for the adjustment
}

/**
 * Balance iteration result
 */
export interface BalanceIteration {
    iteration: number;
    timestamp: string;
    previousRunId: string;
    balanceScoreBefore: number;
    balanceScoreAfter?: number; // Set after re-running matrix
    adjustments: StatAdjustment[];
    archetypesModified: string[];
}

/**
 * Auto-balance session
 */
export interface AutoBalanceSession {
    sessionId: string;
    startTime: string;
    endTime?: string;
    iterations: BalanceIteration[];
    initialBalanceScore: number;
    finalBalanceScore?: number;
    targetAchieved: boolean;
}

/**
 * Analyze matrix and propose stat adjustments
 * 
 * @param matrix Matrix results to analyze
 * @param archetypes Archetype definitions
 * @param config Auto-balance configuration
 * @returns Proposed adjustments
 */
export function proposeAdjustments(
    matrix: MatrixRunResult,
    archetypes: Archetype[],
    config: AutoBalanceConfig = DEFAULT_AUTO_BALANCE_CONFIG
): StatAdjustment[] {
    const adjustments: StatAdjustment[] = [];
    const archetypeMap = new Map(archetypes.map(a => [a.id, a]));

    // Calculate average win rate for each archetype
    const winRates: Map<string, number[]> = new Map();

    for (const cell of matrix.matrix) {
        // Skip mirror matches
        if (cell.row === cell.col) continue;

        // Track row archetype wins
        if (!winRates.has(cell.row)) {
            winRates.set(cell.row, []);
        }
        winRates.get(cell.row)!.push(cell.win_rate_row);

        // Track col archetype wins (inverse)
        if (!winRates.has(cell.col)) {
            winRates.set(cell.col, []);
        }
        winRates.get(cell.col)!.push(1 - cell.win_rate_row);
    }

    // Calculate average win rate for each archetype
    const avgWinRates: Map<string, number> = new Map();
    for (const [archetypeId, rates] of winRates.entries()) {
        const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;
        avgWinRates.set(archetypeId, avg);
    }

    // Find archetypes that need adjustment
    for (const [archetypeId, avgWinRate] of avgWinRates.entries()) {
        const archetype = archetypeMap.get(archetypeId);
        if (!archetype) continue;

        // Check if archetype is too strong
        if (avgWinRate > config.winRateTargetMax) {
            // Propose nerfs
            const deviation = avgWinRate - config.winRateTargetMax;
            const adjustment = proposeNerfs(
                archetype,
                deviation,
                matrix,
                config
            );
            adjustments.push(...adjustment);
        }
        // Check if archetype is too weak
        else if (avgWinRate < config.winRateTargetMin) {
            // Propose buffs
            const deviation = config.winRateTargetMin - avgWinRate;
            const adjustment = proposeBuffs(
                archetype,
                deviation,
                matrix,
                config
            );
            adjustments.push(...adjustment);
        }
    }

    return adjustments;
}

/**
 * Propose nerfs for an overpowered archetype
 * 
 * Strategy: Reduce stats with highest SWI (most impactful)
 */
function proposeNerfs(
    archetype: Archetype,
    deviation: number,
    matrix: MatrixRunResult,
    config: AutoBalanceConfig
): StatAdjustment[] {
    const adjustments: StatAdjustment[] = [];

    // Find cells where this archetype is the row
    const relevantCells = matrix.matrix.filter(
        c => c.row === archetype.id && c.col !== archetype.id
    );

    if (relevantCells.length === 0) return adjustments;

    // Get average SWI across all matchups
    const avgSWI: Map<string, number> = new Map();
    const swiCounts: Map<string, number> = new Map();

    for (const cell of relevantCells) {
        for (const [statKey, swiValue] of Object.entries(cell.SWI)) {
            if (!avgSWI.has(statKey)) {
                avgSWI.set(statKey, 0);
                swiCounts.set(statKey, 0);
            }
            avgSWI.set(statKey, avgSWI.get(statKey)! + swiValue);
            swiCounts.set(statKey, swiCounts.get(statKey)! + 1);
        }
    }

    // Calculate averages
    for (const [statKey, sum] of avgSWI.entries()) {
        const count = swiCounts.get(statKey) || 1;
        avgSWI.set(statKey, sum / count);
    }

    // Sort by SWI (highest impact first)
    const sortedStats = Array.from(avgSWI.entries())
        .filter(([_, swi]) => swi > 0) // Only positive SWI (offensive stats)
        .sort((a, b) => b[1] - a[1]);

    // Propose nerfs to top stats
    const numStatsToNerf = config.strategy === 'aggressive' ? 3 : 1;

    for (let i = 0; i < Math.min(numStatsToNerf, sortedStats.length); i++) {
        const [statKey, swi] = sortedStats[i];
        const currentValue = (archetype.stats as any)[statKey];

        if (typeof currentValue !== 'number') continue;

        // Calculate nerf amount (proportional to deviation and SWI)
        const nerfPercent = Math.min(
            deviation * swi * 0.5, // Scale by SWI
            config.maxAdjustmentPerIteration
        );

        const proposedValue = currentValue * (1 - nerfPercent);

        adjustments.push({
            archetypeId: archetype.id,
            statKey,
            currentValue,
            proposedValue,
            changePercent: -nerfPercent * 100,
            reason: `Win rate ${(deviation * 100 + config.winRateTargetMax * 100).toFixed(1)}% (target: ${(config.winRateTargetMax * 100).toFixed(1)}%). Nerfing high-impact stat (SWI: ${swi.toFixed(2)})`,
        });
    }

    return adjustments;
}

/**
 * Propose buffs for an underpowered archetype
 * 
 * Strategy: Increase stats with highest SWI (most impactful)
 */
function proposeBuffs(
    archetype: Archetype,
    deviation: number,
    matrix: MatrixRunResult,
    config: AutoBalanceConfig
): StatAdjustment[] {
    const adjustments: StatAdjustment[] = [];

    // Similar logic to nerfs, but increase instead of decrease
    const relevantCells = matrix.matrix.filter(
        c => c.row === archetype.id && c.col !== archetype.id
    );

    if (relevantCells.length === 0) return adjustments;

    // Get average SWI
    const avgSWI: Map<string, number> = new Map();
    const swiCounts: Map<string, number> = new Map();

    for (const cell of relevantCells) {
        for (const [statKey, swiValue] of Object.entries(cell.SWI)) {
            if (!avgSWI.has(statKey)) {
                avgSWI.set(statKey, 0);
                swiCounts.set(statKey, 0);
            }
            avgSWI.set(statKey, avgSWI.get(statKey)! + swiValue);
            swiCounts.set(statKey, swiCounts.get(statKey)! + 1);
        }
    }

    for (const [statKey, sum] of avgSWI.entries()) {
        const count = swiCounts.get(statKey) || 1;
        avgSWI.set(statKey, sum / count);
    }

    // Sort by SWI (highest impact first)
    const sortedStats = Array.from(avgSWI.entries())
        .filter(([_, swi]) => swi > 0)
        .sort((a, b) => b[1] - a[1]);

    // Propose buffs to top stats
    const numStatsToBuff = config.strategy === 'aggressive' ? 3 : 1;

    for (let i = 0; i < Math.min(numStatsToBuff, sortedStats.length); i++) {
        const [statKey, swi] = sortedStats[i];
        const currentValue = (archetype.stats as any)[statKey];

        if (typeof currentValue !== 'number') continue;

        // Calculate buff amount
        const buffPercent = Math.min(
            deviation * swi * 0.5,
            config.maxAdjustmentPerIteration
        );

        const proposedValue = currentValue * (1 + buffPercent);

        adjustments.push({
            archetypeId: archetype.id,
            statKey,
            currentValue,
            proposedValue,
            changePercent: buffPercent * 100,
            reason: `Win rate ${((config.winRateTargetMin - deviation) * 100).toFixed(1)}% (target: ${(config.winRateTargetMin * 100).toFixed(1)}%). Buffing high-impact stat (SWI: ${swi.toFixed(2)})`,
        });
    }

    return adjustments;
}

/**
 * Apply proposed adjustments to archetypes
 * 
 * @param archetypes Original archetypes
 * @param adjustments Proposed adjustments
 * @returns Modified archetypes
 */
export function applyAdjustments(
    archetypes: Archetype[],
    adjustments: StatAdjustment[]
): Archetype[] {
    const modified = archetypes.map(a => ({ ...a, stats: { ...a.stats } }));
    const archetypeMap = new Map(modified.map(a => [a.id, a]));

    for (const adj of adjustments) {
        const archetype = archetypeMap.get(adj.archetypeId);
        if (!archetype) continue;

        // Apply adjustment
        (archetype.stats as any)[adj.statKey] = adj.proposedValue;
    }

    return modified;
}

/**
 * Create a new balance iteration
 */
export function createIteration(
    iterationNumber: number,
    previousRunId: string,
    balanceScore: number,
    adjustments: StatAdjustment[]
): BalanceIteration {
    return {
        iteration: iterationNumber,
        timestamp: new Date().toISOString(),
        previousRunId,
        balanceScoreBefore: balanceScore,
        adjustments,
        archetypesModified: Array.from(new Set(adjustments.map(a => a.archetypeId))),
    };
}

/**
 * Start a new auto-balance session
 */
export function startSession(initialBalanceScore: number): AutoBalanceSession {
    return {
        sessionId: `session-${new Date().toISOString().replace(/[:.]/g, '-')}`,
        startTime: new Date().toISOString(),
        iterations: [],
        initialBalanceScore,
        targetAchieved: false,
    };
}

/**
 * Check if balance target is achieved
 */
export function isTargetAchieved(
    balanceScore: number,
    config: AutoBalanceConfig
): boolean {
    // Target: all matchups within [45%, 55%] range
    // Balance score is average deviation, so target is low deviation
    const maxAcceptableDeviation = (config.winRateTargetMax - 0.5);
    return balanceScore <= maxAcceptableDeviation;
}
