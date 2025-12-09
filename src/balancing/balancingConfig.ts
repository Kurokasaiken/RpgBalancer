/**
 * Global Balancing Configuration
 * Single source of truth for combat constants and baselines.
 */
import { DEFAULT_CONFIG } from './config/defaultConfig';

const BASE_HIT_CHANCE_DEFAULT = DEFAULT_CONFIG.stats.baseHitChance?.defaultValue ?? 50;

export const BALANCING_CONFIG = {
    // Combat Mechanics
    BASE_HIT_CHANCE: BASE_HIT_CHANCE_DEFAULT, // Base chance when TxC == Evasion
    MIN_HIT_CHANCE: 1,   // Always 1% chance to hit
    MAX_HIT_CHANCE: 100, // Always 100% chance to hit (unless capped elsewhere)

    // Baselines for UI Calculations (Smart Formulas)
    BASELINE_HTK: 4,     // Standard Hits To Kill for consistency calc
    TARGET_EVASION: 0,   // Standard enemy evasion for efficiency calc

    // Damage Mitigation
    ARMOR_CONSTANT: 10,  // PoE Formula: Armor / (Armor + K * Damage)
    MAX_MITIGATION: 0.90, // Cap at 90% reduction

    // Crit Defaults
    BASE_CRIT_MULT: 2.0, // Standard crit multiplier (x2)

    // Baseline Entity Stats (for context)
    BASELINE_HP: 100,
    BASELINE_DAMAGE: 25,
    BASELINE_ARMOR: 0,
    BASELINE_TXC: 25,
} as const;
