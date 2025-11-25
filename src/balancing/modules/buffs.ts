/**
 * Buff/Debuff Module - Temporary Stat Modifiers
 * 
 * ARCHITECTURE: Defines canonical formulas for buffs/debuffs (regolamento)
 * Combat engine MUST inherit and apply these formulas exactly
 * 
 * Used for: Stat boosts, shields, status effects, etc.
 */

export type BuffType = 'stat_modifier' | 'shield' | 'status';
export type ModifierMode = 'additive' | 'multiplicative';

export interface Buff {
    id: string;                    // Unique identifier
    source: string;                // Ability/spell name
    type: BuffType;

    // For stat_modifier type
    stat?: string;                 // Which stat to modify
    value?: number;                // Modifier amount
    mode?: ModifierMode;           // How to apply (+ or *)

    // For shield type
    shieldAmount?: number;         // Shield HP
    currentShield?: number;        // Remaining shield

    // For status type
    statusName?: string;           // e.g., 'stunned', 'silenced'

    duration: number;              // Turns remaining
    stackable: boolean;            // Can stack?
    currentStacks?: number;        // If stackable
}

export const BuffModule = {
    /**
     * Apply all buffs to a base stat value
     * 
     * Order of operations:
     * 1. Sum all additive modifiers
     * 2. Multiply by all multiplicative modifiers
     * 
     * Formula: finalStat = (baseStat + sumAdditive) * productMultiplicative
     */
    applyStatModifiers: (
        baseStat: number,
        buffs: Buff[],
        statName: string
    ): number => {
        let additive = 0;
        let multiplicative = 1.0;

        buffs
            .filter(b => b.type === 'stat_modifier' && b.stat === statName)
            .forEach(buff => {
                const stacks = buff.currentStacks || 1;
                const value = (buff.value || 0) * stacks;

                if (buff.mode === 'multiplicative') {
                    // Multiplicative: value is %
                    // e.g., +20% = value of 20 → mult by 1.20
                    multiplicative *= (1 + value / 100);
                } else {
                    // Additive: flat bonus
                    additive += value;
                }
            });

        return (baseStat + additive) * multiplicative;
    },

    /**
     * Tick down all buff durations
     * Removes expired buffs (duration <= 0)
     */
    tickDurations: (buffs: Buff[]): Buff[] => {
        return buffs
            .map(b => ({ ...b, duration: b.duration - 1 }))
            .filter(b => b.duration > 0);
    },

    /**
     * Add or stack a buff
     * If stackable and same buff exists, increases stacks
     */
    addBuff: (
        buffs: Buff[],
        newBuff: Buff
    ): Buff[] => {
        if (!newBuff.stackable) {
            // Non-stackable: check if same buff exists (by id)
            const existingIndex = buffs.findIndex(b => b.id === newBuff.id);

            if (existingIndex !== -1) {
                // Refresh duration instead of stacking
                const updated = [...buffs];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    duration: newBuff.duration
                };
                return updated;
            }

            return [...buffs, newBuff];
        }

        // Stackable: increment stacks
        const existingIndex = buffs.findIndex(
            b => b.source === newBuff.source && b.id === newBuff.id
        );

        if (existingIndex !== -1) {
            const updated = [...buffs];
            updated[existingIndex] = {
                ...updated[existingIndex],
                currentStacks: (updated[existingIndex].currentStacks || 1) + 1,
                duration: Math.max(updated[existingIndex].duration, newBuff.duration)
            };
            return updated;
        }

        return [...buffs, { ...newBuff, currentStacks: 1 }];
    },

    /**
     * Get total shield value from all shield buffs
     */
    getTotalShield: (buffs: Buff[]): number => {
        return buffs
            .filter(b => b.type === 'shield')
            .reduce((sum, buff) => sum + (buff.currentShield || 0), 0);
    },

    /**
     * Apply damage to shields first, then to HP
     * Shields absorb damage fully before HP is touched
     * 
     * @returns Updated buffs (shields consumed) and remaining damage
     */
    applyDamageToShields: (
        damage: number,
        buffs: Buff[]
    ): { updatedBuffs: Buff[]; remainingDamage: number } => {
        let remainingDamage = damage;
        const updated = buffs.map(buff => {
            if (buff.type !== 'shield' || remainingDamage <= 0) {
                return buff;
            }

            const currentShield = buff.currentShield || 0;
            const absorbed = Math.min(currentShield, remainingDamage);

            remainingDamage -= absorbed;

            return {
                ...buff,
                currentShield: currentShield - absorbed
            };
        });

        // Remove depleted shields
        const filtered = updated.filter(b =>
            b.type !== 'shield' || (b.currentShield || 0) > 0
        );

        return {
            updatedBuffs: filtered,
            remainingDamage
        };
    },

    /**
     * Check if entity has a specific status effect
     */
    hasStatus: (buffs: Buff[], statusName: string): boolean => {
        return buffs.some(
            b => b.type === 'status' && b.statusName === statusName
        );
    },

    /**
     * Calculate power value of a buff for balancing
     * Converts buff effect to HP-equivalent value
     */
    calculateBuffPower: (
        buff: Buff,
        statWeights: Record<string, number>
    ): number => {
        if (buff.type === 'shield') {
            // Shield HP worth 1:1 with regular HP
            return (buff.shieldAmount || 0) * buff.duration;
        }

        if (buff.type === 'stat_modifier' && buff.stat) {
            const statWeight = statWeights[buff.stat] || 1.0;
            const value = (buff.value || 0) * (buff.currentStacks || 1);

            // Buff is temporary, worth ~60% of permanent stat
            const temporaryFactor = 0.6;

            return value * statWeight * buff.duration * temporaryFactor;
        }

        // Status effects harder to quantify - placeholder
        return 10 * buff.duration;
    }
};

/**
 * WEIGHT CALIBRATION NOTES
 * 
 * Buff value calculation:
 * buffValue = statValue * statWeight * duration * temporaryFactor
 * 
 * temporaryFactor accounts for buffs being limited-time:
 * - Permanent stat: 100% value
 * - Temporary buff: ~60% value (can be dispelled, timing matters)
 * 
 * Example:
 * +10 damage buff for 3 turns
 * = 10 * 1.0 (damage weight) * 3 * 0.6
 * = 18 HP equivalent
 * 
 * Shield special case:
 * Shields are worth MORE than temporary HP because:
 * - Block all damage (no overkill waste)
 * - Applied pre-combat
 * shieldValue = shieldAmount * 1.0 (no duration factor)
 */
