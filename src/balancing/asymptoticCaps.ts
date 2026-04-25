/**
 * Asymptotic Cap Utilities
 * 
 * Implements soft caps for percentage-based stats to prevent extreme values.
 * Uses asymptotic formulas inspired by Path of Exile and other ARPGs.
 */

/**
 * Apply asymptotic cap to a percentage stat
 * 
 * Uses formula: effectiveValue = cap * (1 - e^(-inputValue / scaleFactor))
 * 
 * This creates a soft cap where:
 * - Low values are mostly unaffected
 * - Approaching the cap requires exponentially more input
 * - Cap is never truly reached (asymptotic)
 * 
 * @param value Raw stat value (can exceed cap)
 * @param cap Maximum effective value (e.g., 95 for 95%)
 * @param scaleFactor Controls curve steepness (higher = more lenient)
 * @returns Effective value after cap applied
 */
export function applyAsymptoticCap(
    value: number,
    cap: number,
    scaleFactor: number = cap * 0.6
): number {
    if (value <= 0) return 0;
    if (value >= cap * 3) return cap; // Hard limit at 3x cap

    // Asymptotic formula: y = cap * (1 - e^(-x/k))
    // where k is the scale factor
    const effectiveValue = cap * (1 - Math.exp(-value / scaleFactor));

    return Math.min(effectiveValue, cap);
}

/**
 * Calculate required input value to reach a target effective value
 * (Inverse of applyAsymptoticCap)
 * 
 * @param targetEffective Desired effective value after cap
 * @param cap Maximum effective value
 * @param scaleFactor Curve steepness
 * @returns Required input value
 */
export function inverseAsymptoticCap(
    targetEffective: number,
    cap: number,
    scaleFactor: number = cap * 0.6
): number {
    if (targetEffective <= 0) return 0;
    if (targetEffective >= cap) return Infinity;

    // Inverse formula: x = -k * ln(1 - y/cap)
    const ratio = targetEffective / cap;
    const inputValue = -scaleFactor * Math.log(1 - ratio);

    return inputValue;
}

/**
 * Cap configurations for different stat types
 */
export const CAP_CONFIGS = {
    critChance: {
        cap: 95,
        scaleFactor: 60, // More lenient (easier to reach high values)
        description: "Critical hit chance capped at 95%"
    },
    evasion: {
        cap: 95,
        scaleFactor: 60,
        description: "Evasion capped at 95% (PoE-style)"
    },
    block: {
        cap: 75,
        scaleFactor: 40, // Stricter (harder to reach cap)
        description: "Block chance capped at 75%"
    },
    resistance: {
        cap: 75,
        scaleFactor: 40,
        description: "Resistance capped at 75% (PoE max res)"
    }
} as const;

/**
 * Apply appropriate cap based on stat name
 */
export function applyStatCap(statName: string, value: number): number {
    const config = CAP_CONFIGS[statName as keyof typeof CAP_CONFIGS];
    if (!config) return value; // No cap configured

    return applyAsymptoticCap(value, config.cap, config.scaleFactor);
}

/**
 * Check if a stat has a cap configured
 */
export function hasCap(statName: string): boolean {
    return statName in CAP_CONFIGS;
}

/**
 * Get cap information for a stat
 */
export function getCapInfo(statName: string) {
    return CAP_CONFIGS[statName as keyof typeof CAP_CONFIGS] || null;
}
