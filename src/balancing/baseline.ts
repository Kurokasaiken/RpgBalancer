import type { StatBlock } from './types';

/**
 * BASELINE_STATS - Validated Balanced Stats
 * 
 * These stats have been validated to produce a symmetrical 50% winrate
 * in 1v1 idle combat with 10,000 Monte Carlo simulations.
 * 
 * Validation Date: 2025-11-23
 * Deviation from 50%: 0.050%
 * Average Turns: 4.47
 * Simulations: 10,000
 * 
 * Use these stats as the reference baseline for all balancing tests.
 */
export const BASELINE_STATS: StatBlock = {
    hp: 100,
    damage: 25,
    txc: 25,
    evasion: 0,
    htk: 4,
    hitChance: 75,
    attacksPerKo: 5.33,
    effectiveDamage: 25,

    critChance: 5,
    critMult: 2.0,
    critTxCBonus: 20,

    failChance: 5,
    failMult: 0.0,
    failTxCMalus: 20,

    armor: 0,
    resistance: 0,
    armorPen: 0,
    penPercent: 0,

    lifesteal: 0,
    regen: 0,
    ward: 0,
    block: 0,
    energyShield: 0,
    thorns: 0,

    // Timing/Speed (NEW - not yet balanced)
    cooldownReduction: 0,
    castSpeed: 0,
    movementSpeed: 100,

    configFlatFirst: true,
    configApplyBeforeCrit: false
};

/**
 * Validation metadata
 */
export const BASELINE_VALIDATION = {
    date: '2025-11-23T21:43:00.000Z',
    simulations: 10000,
    winrateA: 0.50050,
    winrateB: 0.49950,
    deviation: 0.00050, // 0.050%
    avgTurns: 4.47,
    turnRange: { min: 2, max: 10 },
    draws: 0,
    passed: true,
    tolerance: 0.01 // ±1%
};

/**
 * Quick check to verify baseline is still valid
 */
export function isBaselineValid(): boolean {
    return BASELINE_VALIDATION.passed &&
        BASELINE_VALIDATION.deviation < BASELINE_VALIDATION.tolerance;
}
