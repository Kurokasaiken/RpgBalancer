/**
 * DoT/HoT Module - Damage and Heal over Time
 * 
 * ARCHITECTURE: Defines canonical formulas for periodic effects (regolamento)
 * Combat engine MUST inherit and apply these formulas exactly
 * 
 * Used for: Poison, Bleeding, Regeneration over time, etc.
 */

/**
 * Stack Mode determines how multiple applications of the same effect interact
 */
export type StackMode =
    | 'none'              // Non-stackable: refresh duration only
    | 'separate'          // Darkest Dungeon: separate instances with independent durations
    | 'increment'         // WoW/PoE: increment stacks, NO refresh (balanced)
    | 'increment_refresh' // League: increment stacks + refresh duration (strong)
    | 'increment_capped'; // League: increment + refresh but with max cap

export interface PeriodicEffect {
    id: string;                    // Unique identifier
    type: 'damage' | 'heal';
    source: string;                // Ability/spell name that applied it
    amountPerTurn: number;         // Flat amount per turn
    duration: number;              // Turns remaining

    // Stack configuration
    stackMode: StackMode;          // How this effect stacks
    maxStacks?: number;            // Max stacks (for 'increment_capped' mode)
    currentStacks?: number;        // Current stack count
}

export const DotModule = {
    /**
     * Calculate total value of a DoT/HoT over its lifetime
     * Used for weight calibration and spell balancing
     * 
     * Formula: totalValue = amountPerTurn * duration * stacks
     */
    calculateTotalValue: (
        amountPerTurn: number,
        duration: number,
        stacks: number = 1
    ): number => {
        return Math.abs(amountPerTurn) * duration * stacks;
    },

    /**
     * Apply single tick of damage or healing
     * Respects HP bounds (0 to maxHp)
     * 
     * @returns New HP and actual amount applied (may be less due to caps)
     */
    applyTick: (
        currentHp: number,
        amountPerTurn: number,
        maxHp: number
    ): { newHp: number; actualAmount: number } => {
        if (amountPerTurn > 0) {
            // Healing - cap at maxHp
            const possibleHeal = Math.min(amountPerTurn, maxHp - currentHp);
            const actualHeal = Math.max(0, possibleHeal);

            return {
                newHp: currentHp + actualHeal,
                actualAmount: actualHeal
            };
        } else {
            // Damage - cap at 0 HP
            const possibleDamage = Math.min(Math.abs(amountPerTurn), currentHp);
            const actualDamage = Math.max(0, possibleDamage);

            return {
                newHp: currentHp - actualDamage,
                actualAmount: -actualDamage
            };
        }
    },

    /**
     * Tick down all effect durations
     * Removes expired effects (duration <= 0)
     */
    tickDurations: (effects: PeriodicEffect[]): PeriodicEffect[] => {
        return effects
            .map(e => ({ ...e, duration: e.duration - 1 }))
            .filter(e => e.duration > 0);
    },

    /**
     * Add or stack a periodic effect based on stackMode
     * Supports 5 different stacking behaviors for flexible game design
     */
    addEffect: (
        effects: PeriodicEffect[],
        newEffect: PeriodicEffect
    ): PeriodicEffect[] => {
        const mode = newEffect.stackMode;

        // MODE: 'none' - Non-stackable, refresh duration only
        if (mode === 'none') {
            const existingIndex = effects.findIndex(
                e => e.source === newEffect.source && e.id === newEffect.id
            );

            if (existingIndex !== -1) {
                // Refresh duration
                const updated = [...effects];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    duration: newEffect.duration
                };
                return updated;
            }
            return [...effects, { ...newEffect, currentStacks: 1 }];
        }

        // MODE: 'separate' - Darkest Dungeon style, each instance independent
        if (mode === 'separate') {
            return [...effects, { ...newEffect, currentStacks: 1 }];
        }

        // MODES: 'increment', 'increment_refresh', 'increment_capped'
        // All use single instance with stacking
        const existingIndex = effects.findIndex(
            e => e.source === newEffect.source && e.id === newEffect.id
        );

        if (existingIndex !== -1) {
            const existing = effects[existingIndex];
            const newStacks = (existing.currentStacks || 1) + 1;

            // Check cap for 'increment_capped' mode
            const maxStacks = newEffect.maxStacks || Infinity;
            const cappedStacks = Math.min(newStacks, maxStacks);

            const updated = [...effects];
            updated[existingIndex] = {
                ...existing,
                currentStacks: cappedStacks,
                // Refresh duration only for 'increment_refresh' and 'increment_capped'
                duration: (mode === 'increment_refresh' || mode === 'increment_capped')
                    ? Math.max(existing.duration, newEffect.duration)
                    : existing.duration  // NO refresh for 'increment'
            };
            return updated;
        } else {
            // First application
            return [...effects, { ...newEffect, currentStacks: 1 }];
        }
    },

    /**
     * Calculate total damage/healing per turn from all effects
     * Accounts for stacking
     */
    calculateTotalPerTurn: (effects: PeriodicEffect[]): { damage: number; heal: number } => {
        let totalDamage = 0;
        let totalHeal = 0;

        effects.forEach(effect => {
            const stacks = effect.currentStacks || 1;
            const amount = effect.amountPerTurn * stacks;

            if (effect.type === 'damage') {
                totalDamage += Math.abs(amount);
            } else {
                totalHeal += amount;
            }
        });

        return { damage: totalDamage, heal: totalHeal };
    }
};

/**
 * WEIGHT CALIBRATION NOTES
 * 
 * DoT value depends heavily on combat duration:
 * - Short combat (3-5 turns): DoT undervalued
 * - Medium combat (8-12 turns): DoT at expected value
 * - Long combat (20+ turns): DoT overvalued
 * 
 * Base formula for weight:
 * dotWeight = (amountPerTurn * avgDuration) / damageWeight
 * 
 * Example (8-turn combat):
 * 5 damage/turn DoT for 3 turns = 15 total damage
 * 15 * damageWeight (1.0) = 15 HP equivalent
 * 
 * IMPORTANT: Combat engine must apply ticks at START of turn
 * (before entities act) for consistent value calculation
 */
