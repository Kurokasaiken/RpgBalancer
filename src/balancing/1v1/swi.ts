/**
 * SWI (Stat Weight Index) Engine for 1v1 Balancing
 * 
 * Calculates the sensitivity of TTK to stat changes via perturbation analysis.
 * Used to identify which stats are most impactful in each matchup.
 * 
 * SWI Formula:
 * SWI = ((TTK_baseline - TTK_perturbed) / TTK_baseline) / deltaPercent
 * 
 * - Positive SWI: Increasing stat helps attacker (reduces TTK)
 * - Negative SWI: Increasing stat helps defender (increases TTK)
 * - High absolute SWI: Stat is highly impactful
 * - Low absolute SWI: Stat has little effect
 * 
 * Uses deterministic simulator for speed (10-100x faster than Monte Carlo).
 * 
 * @see src/balancing/1v1/simulator.ts
 */

import type { StatBlock } from '../types';
import type { BalancerConfig1v1 } from './mathEngine';
import { DEFAULT_1V1_CONFIG } from './mathEngine';
import { simulateExpectedTTK } from './simulator';
import type { SWIResult } from './types';

/**
 * List of stats to analyze for SWI calculation
 * Excludes derived stats and config flags
 */
const ANALYZABLE_STATS: (keyof StatBlock)[] = [
    'hp',
    'damage',
    'txc',
    'evasion',
    'critChance',
    'critMult',
    'critTxCBonus',
    'failChance',
    'failMult',
    'failTxCMalus',
    'armor',
    'resistance',
    'armorPen',
    'penPercent',
    'lifesteal',
    'regen',
];

/**
 * Compute SWI for a single stat in a matchup
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param statKey Stat to perturb
 * @param deltaPercent Perturbation percentage (default: 0.01 = 1%)
 * @param config Configuration
 * @param perspective 'attacker' or 'defender' - whose stat to perturb
 * @returns SWI result
 */
export function computeSWIForMatchup(
    attacker: StatBlock,
    defender: StatBlock,
    statKey: keyof StatBlock,
    deltaPercent: number = 0.01,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG,
    perspective: 'attacker' | 'defender' = 'attacker'
): SWIResult | null {
    // Get baseline TTK
    const baselineResult = simulateExpectedTTK(attacker, defender, config);

    // Skip if timeout or draw (can't measure TTK change)
    if (baselineResult.result === 'timeout' || baselineResult.result === 'draw') {
        return null;
    }

    const ttkBaseline = baselineResult.turns;

    // Clone stats and perturb
    const perturbedAttacker = { ...attacker };
    const perturbedDefender = { ...defender };

    const targetStats = perspective === 'attacker' ? perturbedAttacker : perturbedDefender;
    const currentValue = targetStats[statKey];

    // Skip non-numeric stats
    if (typeof currentValue !== 'number') {
        return null;
    }

    // Apply perturbation (+deltaPercent)
    // @ts-ignore - we know it's a number
    targetStats[statKey] = currentValue * (1 + deltaPercent);

    // Simulate with perturbed stats
    const perturbedResult = simulateExpectedTTK(perturbedAttacker, perturbedDefender, config);

    // Skip if result changed type (e.g., baseline was win, perturbed is timeout)
    if (perturbedResult.result === 'timeout' || perturbedResult.result === 'draw') {
        return null;
    }

    const ttkPerturbed = perturbedResult.turns;

    // Calculate SWI
    // SWI = ((TTK_base - TTK_pert) / TTK_base) / delta
    // Positive = stat helps attacker (reduces TTK)
    const ttkChange = ttkBaseline - ttkPerturbed;
    const ttkChangePercent = ttkChange / ttkBaseline;
    const swi = ttkChangePercent / deltaPercent;

    return {
        statKey: String(statKey),
        value: swi,
        percentChange: deltaPercent * 100,
        ttkBaseline,
        ttkPerturbed,
    };
}

/**
 * Compute SWI for all analyzable stats in a matchup
 * Returns results sorted by absolute SWI (most impactful first)
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param deltaPercent Perturbation percentage (default from config)
 * @param config Configuration
 * @param perspective 'attacker' or 'defender' - whose stats to analyze
 * @returns Sorted array of SWI results (highest impact first)
 */
export function computeAllSWIForMatchup(
    attacker: StatBlock,
    defender: StatBlock,
    deltaPercent?: number,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG,
    perspective: 'attacker' | 'defender' = 'attacker'
): SWIResult[] {
    const delta = deltaPercent ?? config.SWI_DELTA;
    const results: SWIResult[] = [];

    for (const statKey of ANALYZABLE_STATS) {
        const swi = computeSWIForMatchup(attacker, defender, statKey, delta, config, perspective);
        if (swi !== null) {
            results.push(swi);
        }
    }

    // Sort by absolute SWI (most impactful first)
    results.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return results;
}

/**
 * Compute SWI matrix for both attacker and defender perspectives
 * Useful for understanding which stats matter most for each side
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param config Configuration
 * @returns Object with attacker and defender SWI arrays
 */
export function computeBidirectionalSWI(
    attacker: StatBlock,
    defender: StatBlock,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG
): {
    attacker: SWIResult[];
    defender: SWIResult[];
} {
    return {
        attacker: computeAllSWIForMatchup(attacker, defender, undefined, config, 'attacker'),
        defender: computeAllSWIForMatchup(attacker, defender, undefined, config, 'defender'),
    };
}

/**
 * Format SWI value as percentage for display
 * Example: 0.15 -> "15.0% TTK reduction per 1% stat increase"
 * 
 * @param swi SWI value
 * @param deltaPercent Perturbation percentage
 * @returns Formatted string
 */
export function formatSWI(swi: number, deltaPercent: number = 1): string {
    const ttkChangePerDelta = swi * deltaPercent;
    const ttkChangePercent = (ttkChangePerDelta * 100).toFixed(1);

    if (swi > 0) {
        return `${ttkChangePercent}% TTK reduction per ${deltaPercent}% stat increase`;
    } else if (swi < 0) {
        return `${Math.abs(parseFloat(ttkChangePercent))}% TTK increase per ${deltaPercent}% stat increase`;
    } else {
        return 'No significant impact';
    }
}
