/**
 * Sustain Module - Lifesteal & Regeneration Formulas
 * 
 * PHILOSOPHY:
 * This module defines the RULES (regolamento) for sustain mechanics.
 * The combat engine MUST inherit and apply these formulas exactly.
 * 
 * BALANCING PRINCIPLE:
 * Sustain value increases with combat duration.
 * Weights are calibrated for ~10-turn average combat.
 */

export const SustainModule = {
    /**
     * Calculate Lifesteal Healing
     * 
     * Formula: heal = damage_dealt * (lifesteal% / 100)
     * 
     * @param damageDealt Actual damage dealt to target (after mitigation)
     * @param lifestealPercent Lifesteal stat (0-100)
     * @returns HP healed to attacker
     * 
     * Example: 50 damage dealt, 10% lifesteal → 5 HP healed
     */
    calculateLifestealHeal: (
        damageDealt: number,
        lifestealPercent: number
    ): number => {
        if (damageDealt <= 0 || lifestealPercent <= 0) return 0;

        const heal = damageDealt * (lifestealPercent / 100);
        return Math.max(0, heal); // No negative healing
    },

    /**
     * Calculate Per-Turn Regeneration
     * 
     * Formula: heal = regen_stat (simple flat value per turn)
     * 
     * @param regenStat Regen stat (HP per turn)
     * @returns HP healed this turn
     * 
     * Example: 5 regen → 5 HP healed every turn
     */
    calculateRegenHeal: (
        regenStat: number
    ): number => {
        return Math.max(0, regenStat); // No negative regen
    },

    /**
     * Calculate Total Sustain Value Over Combat Duration
     * Used for balancing and weight calculation
     * 
     * Formula: 
     *   lifesteal_value = avg_damage_per_turn * lifesteal% * combat_turns
     *   regen_value = regen * combat_turns
     * 
     * @param avgDamagePerTurn Average damage dealt per turn
     * @param lifestealPercent Lifesteal stat
     * @param regenStat Regen stat
     * @param combatTurns Expected combat duration
     * @returns Total HP value over combat
     */
    calculateSustainValue: (
        avgDamagePerTurn: number,
        lifestealPercent: number,
        regenStat: number,
        combatTurns: number = 10 // Default calibration point
    ): { lifestealValue: number; regenValue: number; totalValue: number } => {
        const lifestealPerTurn = SustainModule.calculateLifestealHeal(
            avgDamagePerTurn,
            lifestealPercent
        );
        const regenPerTurn = SustainModule.calculateRegenHeal(regenStat);

        const lifestealValue = lifestealPerTurn * combatTurns;
        const regenValue = regenPerTurn * combatTurns;
        const totalValue = lifestealValue + regenValue;

        return { lifestealValue, regenValue, totalValue };
    },

    /**
     * Calculate HP Cap (prevent infinite healing loops)
     * Healing cannot exceed maxHp
     * 
     * @param currentHp Current HP
     * @param healAmount Proposed heal
     * @param maxHp Maximum HP
     * @returns Actual heal applied (capped)
     */
    applyHealingCap: (
        currentHp: number,
        healAmount: number,
        maxHp: number
    ): number => {
        if (currentHp >= maxHp) return 0; // Already at max

        const actualHeal = Math.min(healAmount, maxHp - currentHp);
        return Math.max(0, actualHeal);
    }
};

/**
 * WEIGHT CALIBRATION (from statWeights.ts)
 * 
 * These values are calculated assuming:
 * - Average combat duration: 10 turns
 * - Average damage per turn: 25-30
 * 
 * Lifesteal: 55 HP per 1%
 *   → 1% lifesteal on 25 dmg/turn = 2.5 HP/turn * 10 turns = 25 HP
 *   → Weight multiplier accounts for variance in combat length
 * 
 * Regen: 75 HP per 1 HP/turn
 *   → 1 regen = 1 HP/turn * 10 turns = 10 HP base
 *   → Weight multiplier accounts for consistent value regardless of damage
 * 
 * IMPORTANT: Combat engine MUST implement these formulas
 * for weights to be accurate!
 */
