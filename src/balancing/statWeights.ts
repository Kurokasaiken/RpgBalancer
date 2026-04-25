import { DEFAULT_CONFIG } from './config/defaultConfig';
/**
 * Stat Weights Database - Phase 2
 * Generated from Monte Carlo simulations (batch mode)
 * 
 * Each weight represents how many HP points are equivalent to 1 point of that stat
 * 
 * Example: If damage weight = 3.5, then +1 damage is worth +3.5 HP
 * 
 * Generation Method:
 * - Binary search for HP equilibrium
 * - 1000 simulations per data point
 * - Multiple stat values tested (1, 2, 3, 4, 5, 10, 20)
 * - Average ratio calculated
 */

export interface StatWeight {
    stat: string;
    avgRatio: number; // HP per 1 point of stat
    confidence: number; // 0-1, based on variance
    dataPoints: number; // How many values tested
    testDate: string;
    linearityScore?: number; // 0-1, how linear the curve is
}

/**
 * Core stat weights (Phase 2.2 - Tested manually)
 * These are the fundamental stats that affect combat directly
 */
export const CORE_STAT_WEIGHTS: Record<string, StatWeight> = {
    // Offensive Stats
    damage: {
        stat: 'damage',
        avgRatio: 1.0, // 1 damage ≈ 1.0 HP (EMPIRICAL: Auto-calibrated via 5k simulations)
        confidence: 0.98,
        dataPoints: 5000,
        testDate: '2025-11-25',
        linearityScore: 0.99 // Very linear
    },

    txc: {
        stat: 'txc',
        avgRatio: 2.0, // 1 TxC ≈ 2 HP (+1% hit chance)
        confidence: 0.92,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.95
    },

    critChance: {
        stat: 'critChance',
        avgRatio: 4.0, // 1% crit ≈ 4 HP (with 2x mult)
        confidence: 0.90,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.93
    },

    // Defensive Stats
    evasion: {
        stat: 'evasion',
        avgRatio: 4.0, // Simmetrico a TxC
        confidence: 0.92,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.95
    },

    armor: {
        stat: 'armor',
        avgRatio: 2.8, // ~2.8 HP (Tuned Week 5)
        confidence: 0.95,
        dataPoints: 5000,
        testDate: '2025-11-25',
        linearityScore: 0.82 // Non-linear due to PoE formula
    },

    resistance: {
        stat: 'resistance',
        avgRatio: 100, // 1% resistance ≈ 100 HP (very strong!)
        confidence: 0.90,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.88
    },

    armorPen: {
        stat: 'armorPen',
        avgRatio: 1.5, // Flat armor pen
        confidence: 0.85,
        dataPoints: 5,
        testDate: '2025-11-23',
        linearityScore: 0.88
    },

    penPercent: {
        stat: 'penPercent',
        avgRatio: 80, // % pen is very strong
        confidence: 0.87,
        dataPoints: 5,
        testDate: '2025-11-23',
        linearityScore: 0.80
    },

    // Sustain Stats (EMPIRICAL 2025-11-25 - Auto-Calibrated)
    lifesteal: {
        stat: 'lifesteal',
        avgRatio: 800, // 1% lifesteal ≈ 800 HP (EMPIRICAL: Auto-calibrated via binary search)
        confidence: 0.98,
        dataPoints: 5000,
        testDate: '2025-11-25',
        linearityScore: 0.87 // Scales with combat length and damage dealt
    },

    regen: {
        stat: 'regen',
        avgRatio: 2000, // 1 HP/turn regen ≈ 2000 HP (EMPIRICAL: Extremely valuable in current combat)
        confidence: 0.97,
        dataPoints: 5000,
        testDate: '2025-11-25',
        linearityScore: 0.91 // Very consistent - triggers every turn
    },

    ward: {
        stat: 'ward',
        avgRatio: 1.5, // 1 ward ≈ 1.5 HP (one-time shield)
        confidence: 0.93,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.97
    },

    block: {
        stat: 'block',
        avgRatio: 80, // 1% block ≈ 80 HP (all-or-nothing)
        confidence: 0.82,
        dataPoints: 7,
        testDate: '2025-11-23',
        linearityScore: 0.75 // Non-linear due to probabilistic nature
    }
};

/**
 * Normalized weights (HP = 1.0 reference)
 * Useful for item/gear stat comparison
 */
export const NORMALIZED_WEIGHTS = {
    hp: DEFAULT_CONFIG.stats.hp?.weight ?? 1.0,
    // --- OFFENSIVE STATS ---
    // 1 Damage = 5.0 HP (Tuned Week 5 - reduced from 5.5)
    damage: DEFAULT_CONFIG.stats.damage?.weight ?? 5.0,

    // 1% Attack Speed = 3.0 (not yet config-driven)
    attackSpeed: 3.0,

    // 1% Crit Chance = 4.0
    critChance: DEFAULT_CONFIG.stats.critChance?.weight ?? 4.0,
    critMult: DEFAULT_CONFIG.stats.critMult?.weight ?? 10.0,

    // 1 TxC = 2.0 HP
    txc: DEFAULT_CONFIG.stats.txc?.weight ?? 2.0,

    // 1 Armor Pen = 1.5 HP
    armorPen: DEFAULT_CONFIG.stats.armorPen?.weight ?? 1.5,

    // 1% Pen Percent = 80.0 HP
    penPercent: DEFAULT_CONFIG.stats.penPercent?.weight ?? 80.0,

    // --- DEFENSIVE STATS ---
    // 1 Armor = 5.0 HP (Tuned Week 5 - boosted from 4.5)
    armor: DEFAULT_CONFIG.stats.armor?.weight ?? 5.0,

    // 1% Resistance = 5.0
    resistance: DEFAULT_CONFIG.stats.resistance?.weight ?? 5.0,

    // 1 Evasion = 4.0
    evasion: DEFAULT_CONFIG.stats.evasion?.weight ?? 4.0,

    // 1% Block = 80.0 HP (not yet config-driven)
    block: 80.0,

    // --- SUSTAIN STATS ---
    // 1% Lifesteal = 100.0 HP
    lifesteal: DEFAULT_CONFIG.stats.lifesteal?.weight ?? 100.0,

    // 1 Regen/Turn = 20.0 HP (Reverted to 20.0 - optimal for short fights)
    regen: DEFAULT_CONFIG.stats.regen?.weight ?? 20.0, // percentage-based

    // 1 Ward = 1.5 HP
    ward: DEFAULT_CONFIG.stats.ward?.weight ?? 1.5,
};

/**
 * Alias for normalized weights, used for backward compatibility.
 */
export const STAT_WEIGHTS = NORMALIZED_WEIGHTS;

/**
 * Get weight for a stat
 */
export function getStatWeight(stat: string): number {
    const entry = CORE_STAT_WEIGHTS[stat];
    if (entry) return entry.avgRatio;

    // Fallback to normalized weights
    const normalized = (NORMALIZED_WEIGHTS as Record<string, number>)[stat];
    if (normalized) return normalized;

    // For unbalanced stats, use a conservative default
    return 1.0;
}

/**
 * Checks if stat weight is calibrated (has test data)
 */
export function isStatCalibrated(stat: string): boolean {
    const entry = CORE_STAT_WEIGHTS[stat];
    return entry !== undefined && entry.dataPoints > 0;
}

/**
 * Calculate item power budget
 * Example: Item with +10 HP, +5 damage, +3 armor
 * Power = 10*1 + 5*3.5 + 3*1.8 = 10 + 17.5 + 5.4 = 32.9
 */
export function calculateItemPower(stats: Partial<Record<string, number>>): number {
    let totalPower = 0;

    for (const [stat, value] of Object.entries(stats)) {
        if (typeof value !== 'number') continue;
        const weight = getStatWeight(stat);
        totalPower += value * weight;
    }

    return totalPower;
}

/**
 * Compare two items
 */
export function compareItems(
    itemA: Partial<Record<string, number>>,
    itemB: Partial<Record<string, number>>
): { winner: 'A' | 'B' | 'TIE'; powerA: number; powerB: number; diff: number } {
    const powerA = calculateItemPower(itemA);
    const powerB = calculateItemPower(itemB);
    const diff = Math.abs(powerA - powerB);

    let winner: 'A' | 'B' | 'TIE' = 'TIE';
    if (powerA > powerB + 1) winner = 'A';
    else if (powerB > powerA + 1) winner = 'B';

    return { winner, powerA, powerB, diff };
}

/**
 * Validation metadata
 */
export const STAT_WEIGHTS_METADATA = {
    version: '2.0.0',
    phase: 'Phase 2.2 - Core Stats',
    generatedDate: '2025-11-23',
    method: 'Monte Carlo simulations (1000 per point)',
    baseline: 'BASELINE_STATS (50.050% symmetry)',
    statsCount: Object.keys(CORE_STAT_WEIGHTS).length,
    avgConfidence: 0.89,
    notes: [
        'Weights are relative to HP (HP weight = 1.0)',
        'Percentage stats (resistance, crit, etc.) have higher weights',
        'Some stats have diminishing returns (armor, block)',
        'Sustain stats (lifesteal, regen) scale with combat duration'
    ]
};
