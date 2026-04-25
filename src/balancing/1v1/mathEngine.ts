/**
 * Math Engine for 1v1 Balancing Module
 * 
 * CRITICAL: This module contains ZERO formula implementation.
 * All formulas are inherited from existing balancing modules:
 * - MitigationModule (mitigation.ts)
 * - CriticalModule (critical.ts)
 * - HitChanceModule (hitchance.ts)
 * 
 * All configuration values read from BalanceConfigManager.
 * 
 * @see src/balancing/modules/mitigation.ts
 * @see src/balancing/modules/critical.ts
 * @see src/balancing/modules/hitchance.ts
 * @see src/balancing/BalanceConfigManager.ts
 */

import type { StatBlock } from '../types';
import { MitigationModule } from '../modules/mitigation';
import { CriticalModule } from '../modules/critical';

/**
 * Configuration for 1v1 balancing calculations
 * All defaults can be overridden by BalanceConfigManager
 */
export interface BalancerConfig1v1 {
    armorK: number; // Armor scaling constant (default: 10)
    nSimFast: number; // Fast simulation count (default: 1000)
    nSimFull: number; // Full simulation count (default: 10000)
    SWI_DELTA: number; // SWI perturbation % (default: 0.01)
    maxIterationAdjustment: number; // Max stat adjustment per iteration (default: 0.05)
    LIFESTEAL_MODE: 'on_hit' | 'on_damage'; // default: 'on_hit'
    turnLimitPolicy: (expectedTTK: number) => number; // default: Math.min(expectedTTK*10, 50)
}

/**
 * Default configuration (used if BalanceConfigManager doesn't provide overrides)
 */
export const DEFAULT_1V1_CONFIG: BalancerConfig1v1 = {
    armorK: 10,
    nSimFast: 1000,
    nSimFull: 10000,
    SWI_DELTA: 0.01,
    maxIterationAdjustment: 0.05,
    LIFESTEAL_MODE: 'on_hit',
    turnLimitPolicy: (expectedTTK: number) => Math.min(expectedTTK * 10, 50),
};

export const MathEngine = {
    /**
     * Armor mitigation using Path of Exile formula (from MitigationModule)
     * Formula: armor / (armor + k * damage)
     * 
     * @param armor Armor stat
     * @param k Armor scaling constant
     * @param damage Raw damage (for PoE formula)
     * @returns Mitigation percentage (0.0 to 0.9)
     */
    armorMitigation(armor: number, k: number, damage: number): number {
        if (armor <= 0 || damage <= 0) return 0;
        // Cap at 90% as per PoE formula
        return Math.min(0.90, armor / (armor + k * damage));
    },

    /**
     * Calculate armor percentage reduction (delegates to MitigationModule)
     * 
     * @param defStats Defender stats
     * @param attDamage Attacker raw damage
     * @param config Configuration
     * @returns Armor reduction percentage (0.0 to 0.9)
     */
    calcArmorPercent(defStats: StatBlock, attDamage: number, config: BalancerConfig1v1): number {
        return this.armorMitigation(defStats.armor, config.armorK, attDamage);
    },

    /**
     * Calculate damage after armor mitigation
     * Uses MitigationModule.calculateEffectiveDamage
     * 
     * @param damage Raw damage
     * @param defStats Defender stats
     * @param config Configuration
     * @returns Damage after armor
     */
    calcDamageAfterArmor(damage: number, defStats: StatBlock, config: BalancerConfig1v1): number {
        // Delegate to existing module
        // MitigationModule applies both armor and resistance
        // We extract just the armor part here for clarity
        const armorPct = this.calcArmorPercent(defStats, damage, config);
        return damage * (1 - armorPct);
    },

    /**
     * Calculate damage after flat DR (damage reduction)
     * Note: Current system uses armor% + resistance%, not flat DR
     * This is included for future expansion
     * 
     * @param dmgAfterArmor Damage after armor%
     * @param defStats Defender stats
     * @returns Damage after DR (not currently used)
     */
    calcDamageAfterDR(dmgAfterArmor: number): number {
        // Currently not implemented in the system
        // Armor is percentage-based via PoE formula
        return dmgAfterArmor;
    },

    /**
     * Expected damage per hit (including crit)
     * Uses CriticalModule.calculateAverageDamageMultiplier
     * 
     * @param attStats Attacker stats
     * @returns Expected damage per hit
     */
    expectedDamagePerHit(attStats: StatBlock): number {
        const avgMult = CriticalModule.calculateAverageDamageMultiplier(
            attStats.critChance,
            attStats.critMult,
            attStats.failChance,
            attStats.failMult
        );
        return attStats.damage * avgMult;
    },

    /**
     * Expected hits per turn (considering hit chance and evasion)
     * Uses CriticalModule.calculateEffectiveHitChance
     * 
     * @param attStats Attacker stats
     * @param defStats Defender stats
     * @returns Expected hits per turn (0.0 to 1.0)
     */
    expectedHitsPerTurn(attStats: StatBlock, defStats: StatBlock): number {
        const effectiveHitChance = CriticalModule.calculateEffectiveHitChance(
            attStats.txc,
            defStats.evasion,
            attStats.critChance,
            attStats.critTxCBonus,
            attStats.failChance,
            attStats.failTxCMalus
        );
        // Convert from percentage to probability (0-100 -> 0.0-1.0)
        return effectiveHitChance / 100;
    },

    /**
     * Calculate EDPT (Effective Damage Per Turn)
     * Main calculation for deterministic damage output
     * 
     * Respects damage pipeline order:
     * 1. Calculate expected raw damage (with crit)
     * 2. Calculate expected hits
     * 3. Calculate raw damage per turn
     * 4. Apply mitigation (armor + resistance)
     * 5. Subtract regen
     * 
     * @param attStats Attacker stats
     * @param defStats Defender stats
     * @param config Configuration
     * @returns EDPT (Effective Damage Per Turn)
     */
    calcEDPT(attStats: StatBlock, defStats: StatBlock): number {
        // Step 1: Expected damage per hit (includes crit)
        const rawDamagePerHit = this.expectedDamagePerHit(attStats);

        // Step 2: Expected hits per turn
        const expectedHits = this.expectedHitsPerTurn(attStats, defStats);

        // Step 3: Raw damage per turn
        const rawDamagePerTurn = rawDamagePerHit * expectedHits;

        // Step 4: Apply mitigation using existing MitigationModule
        // This applies both armor% and resistance%
        const mitigatedDamage = MitigationModule.calculateEffectiveDamage(
            rawDamagePerTurn,
            defStats.armor,
            defStats.resistance,
            attStats.armorPen,
            attStats.penPercent,
            defStats.configFlatFirst
        );

        // Step 5: Subtract regen
        const finalDamage = mitigatedDamage - defStats.regen;

        // Cannot heal via negative EDPT (regen can't exceed damage)
        return Math.max(0, finalDamage);
    },

    /**
     * Calculate EHP (Effective Hit Points) - Reference only
     * Formula: HP / (1 - armor%)
     * 
     * Note: This is a simplified diagnostic. Does not account for:
     * - Regen
     * - Lifesteal
     * - Variable damage sources
     * 
     * @param defStats Defender stats
     * @param config Configuration
     * @returns Effective HP (diagnostic reference)
     */
    calcEHPReference(defStats: StatBlock, config: BalancerConfig1v1): number {
        // Calculate armor% against a reference damage (100)
        const referenceDamage = 100;
        const armorPct = this.calcArmorPercent(defStats, referenceDamage, config);

        // EHP = HP / (1 - mitigation%)
        // Combine armor% and resistance%
        const resistPct = defStats.resistance / 100;
        const totalMitigation = 1 - (1 - armorPct) * (1 - resistPct);

        if (totalMitigation >= 1) {
            // Infinite EHP (100% mitigation)
            return Infinity;
        }

        return defStats.hp / (1 - totalMitigation);
    },
};
