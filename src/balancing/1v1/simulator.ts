/**
 * Deterministic Turn Simulator for 1v1 Balancing
 * 
 * Provides fast, predictable TTK calculation using expected values.
 * Used for:
 * - SWI calculation (much faster than Monte Carlo)
 * - Quick previews in UI
 * - Baseline comparisons
 * 
 * For detailed distributions and win rates, use Monte Carlo simulation instead.
 * 
 * @see src/balancer/1v1/montecarlo.ts
 * @see src/balancer/1v1/mathEngine.ts
 */

import type { StatBlock } from '../types';
import type { BalancerConfig1v1 } from './mathEngine';
import { MathEngine, DEFAULT_1V1_CONFIG } from './mathEngine';

export type SimulationResult = {
    result: 'attacker' | 'defender' | 'draw' | 'timeout';
    turns: number;
    finalHP: {
        attacker: number;
        defender: number;
    };
};

/**
 * Simulate expected TTK using deterministic expected-value calculations
 * 
 * Features:
 * - Simultaneous damage application (no first-player bias)
 * - Lifesteal support (on_hit mode)
 * - Regen at end of turn
 * - Turn limit with timeout detection
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param config Configuration (optional, uses defaults if not provided)
 * @param turnLimit Maximum turns before timeout
 * @returns Simulation result
 */
export function simulateExpectedTTK(
    attacker: StatBlock,
    defender: StatBlock,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG,
    turnLimit?: number
): SimulationResult {
    // Calculate turn limit if not provided
    if (turnLimit === undefined) {
        // Estimate expected TTK first
        const estimatedTTK = estimateTTK(attacker, defender, config);
        turnLimit = config.turnLimitPolicy(estimatedTTK);
    }

    // Clone HP to avoid mutating original stats
    let hpAtt = attacker.hp;
    let hpDef = defender.hp;

    // Calculate EDPT for both sides
    const edptAttToDef = MathEngine.calcEDPT(attacker, defender, config);
    const edptDefToAtt = MathEngine.calcEDPT(defender, attacker, config);

    let turns = 0;

    while (turns < turnLimit) {
        turns++;

        // Simultaneous damage application (no first-player bias)
        const dmgToDefender = edptAttToDef;
        const dmgToAttacker = edptDefToAtt;

        // Apply damage
        hpDef -= dmgToDefender;
        hpAtt -= dmgToAttacker;

        // Apply lifesteal (on_hit mode)
        if (config.LIFESTEAL_MODE === 'on_hit' && attacker.lifesteal > 0) {
            const lifestealHeal = dmgToDefender * (attacker.lifesteal / 100);
            hpAtt = Math.min(attacker.hp, hpAtt + lifestealHeal);
        }
        if (config.LIFESTEAL_MODE === 'on_hit' && defender.lifesteal > 0) {
            const lifestealHeal = dmgToAttacker * (defender.lifesteal / 100);
            hpDef = Math.min(defender.hp, hpDef + lifestealHeal);
        }

        // Apply regen at end of turn
        hpAtt = Math.min(attacker.hp, hpAtt + attacker.regen);
        hpDef = Math.min(defender.hp, hpDef + defender.regen);

        // Check for death
        if (hpAtt <= 0 && hpDef <= 0) {
            // Simultaneous death = draw
            return {
                result: 'draw',
                turns,
                finalHP: { attacker: 0, defender: 0 },
            };
        } else if (hpDef <= 0) {
            return {
                result: 'attacker',
                turns,
                finalHP: { attacker: Math.max(0, hpAtt), defender: 0 },
            };
        } else if (hpAtt <= 0) {
            return {
                result: 'defender',
                turns,
                finalHP: { attacker: 0, defender: Math.max(0, hpDef) },
            };
        }
    }

    // Turn limit reached
    return {
        result: 'timeout',
        turns,
        finalHP: {
            attacker: Math.max(0, hpAtt),
            defender: Math.max(0, hpDef),
        },
    };
}

/**
 * Estimate TTK (Time To Kill) without running full simulation
 * Used for turn limit calculation
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param config Configuration
 * @returns Estimated TTK in turns
 */
function estimateTTK(
    attacker: StatBlock,
    defender: StatBlock,
    config: BalancerConfig1v1
): number {
    const edptAttToDef = MathEngine.calcEDPT(attacker, defender, config);
    const edptDefToAtt = MathEngine.calcEDPT(defender, attacker, config);

    if (edptAttToDef <= 0 && edptDefToAtt <= 0) {
        // Neither can damage the other
        return Infinity;
    }

    // Estimate turns to kill for each side
    const turnsToKillDef = edptAttToDef > 0 ? defender.hp / edptAttToDef : Infinity;
    const turnsToKillAtt = edptDefToAtt > 0 ? attacker.hp / edptDefToAtt : Infinity;

    // Return the shorter TTK (winner's TTK)
    return Math.min(turnsToKillDef, turnsToKillAtt);
}

/**
 * Calculate deterministic win prediction (for quick analysis)
 * Returns expected win probability based on EDPT
 * 
 * Note: This is a ROUGH estimate. Use Monte Carlo for accurate win rates.
 * 
 * @param attacker Attacker stats
 * @param defender Defender stats
 * @param config Configuration
 * @returns Estimated attacker win probability (0.0 to 1.0)
 */
export function predictWinProbability(
    attacker: StatBlock,
    defender: StatBlock,
    config: BalancerConfig1v1 = DEFAULT_1V1_CONFIG
): number {
    const result = simulateExpectedTTK(attacker, defender, config);

    if (result.result === 'attacker') {
        return 1.0;
    } else if (result.result === 'defender') {
        return 0.0;
    } else if (result.result === 'draw') {
        return 0.5;
    } else {
        // Timeout - estimate based on remaining HP
        const hpRatio = result.finalHP.attacker / (result.finalHP.attacker + result.finalHP.defender);
        return hpRatio;
    }
}
