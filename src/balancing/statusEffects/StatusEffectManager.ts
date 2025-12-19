/**
 * Status Effect System - Modular and Extensible
 * 
 * This module provides a framework for status effects (buffs, debuffs, stuns, etc.)
 * that can be easily extended with new effect types.
 * 
 * @module StatusEffects
 */

import type { StatBlock } from '../types';

/**
 * Base interface for all status effects
 */
export interface StatusEffect {
    id: string;
    name: string;
    type: StatusEffectType;
    duration: number; // Turns remaining
    stackable: boolean; // Can multiple instances exist?
    source?: string; // Which spell/ability applied this
}

/**
 * Status effect categories
 */
export type StatusEffectType =
    | 'stun'      // Disables actions
    | 'buff'      // Positive stat modification
    | 'debuff'    // Negative stat modification
    | 'dot'       // Damage over time
    | 'hot'       // Healing over time
    | 'shield'    // Temporary HP
    | 'root'      // Prevents movement (grid combat)
    | 'silence'   // Prevents casting (future)
    | 'slow'      // Reduces initiative (future)
    | 'custom';   // For custom implementations

/**
 * Stun effect - prevents character from acting
 */
export interface StunEffect extends StatusEffect {
    type: 'stun';
}

/**
 * Buff/Debuff - modifies stats temporarily
 */
export interface StatModifierEffect extends StatusEffect {
    type: 'buff' | 'debuff';
    statChanges: Partial<StatBlock>; // Stats to modify
}

/**
 * Damage/Healing Over Time
 */
export interface OverTimeEffect extends StatusEffect {
    type: 'dot' | 'hot';
    tickDamage: number; // Damage/healing per turn
}

/**
 * Temporary shield
 */
export interface ShieldEffect extends StatusEffect {
    type: 'shield';
    shieldAmount: number; // Current shield HP
}

/**
 * Root effect - prevents movement
 */
export interface RootEffect extends StatusEffect {
    type: 'root';
}

/**
 * Union type for all effect types
 */
export type AnyStatusEffect =
    | StunEffect
    | StatModifierEffect
    | OverTimeEffect
    | ShieldEffect
    | RootEffect
    | StatusEffect; // Generic fallback

/**
 * Result of processing effects at start of turn
 */
export interface EffectProcessResult {
    canAct: boolean;         // Can the character perform actions?
    canMove: boolean;        // Can the character move? (grid combat)
    canCast: boolean;        // Can the character cast spells? (future)
    damageReceived: number;  // Total DoT damage
    healingReceived: number; // Total HoT healing
    modifiedStats?: Partial<StatBlock>; // Effective stat changes
}

/**
 * Character entity with status effects
 * (This will be used by combat simulator)
 */
export interface EffectedCharacter {
    id: string;
    name: string;
    baseStats: StatBlock;
    statusEffects: AnyStatusEffect[];
}

/**
 * Status Effect Manager - Handles application and processing of effects
 */
export class StatusEffectManager {
    /**
     * Apply a status effect to a character
     * 
     * @param character - Target character
     * @param effect - Effect to apply
     * @returns true if applied, false if blocked/replaced
     */
    applyEffect(character: EffectedCharacter, effect: AnyStatusEffect): boolean {
        // For non-stackable effects, find existing effect of same type and name
        if (!effect.stackable) {
            const existing = character.statusEffects.find(e =>
                e.type === effect.type && e.name === effect.name
            );

            if (existing) {
                // Refresh duration (take the longer one)
                existing.duration = Math.max(existing.duration, effect.duration);
                return true;
            }
        }

        // New effect (or stackable effect)
        character.statusEffects.push({ ...effect });
        return true;
    }

    /**
     * Process all effects at start of turn
     * 
     * Call this BEFORE checking if character can act
     * 
     * @param character - Character to process
     * @returns Result indicating what the character can do
     */
    processEffects(character: EffectedCharacter): EffectProcessResult {
        const result: EffectProcessResult = {
            canAct: true,
            canMove: true,
            canCast: true,
            damageReceived: 0,
            healingReceived: 0,
            modifiedStats: {}
        };

        for (const effect of character.statusEffects) {
            switch (effect.type) {
                case 'stun':
                    result.canAct = false;
                    result.canMove = false;
                    result.canCast = false;
                    break;

                case 'root':
                    result.canMove = false;
                    break;

                case 'buff':
                case 'debuff': {
                    const modEffect = effect as StatModifierEffect;
                    // Accumulate stat changes
                    Object.entries(modEffect.statChanges).forEach(([stat, value]) => {
                        if (value !== undefined && typeof value === 'number') {
                            const key = stat as keyof StatBlock;
                            const current = result.modifiedStats![key];
                            // Use any cast here since we're only dealing with numeric stats in buffs
                            (result.modifiedStats as any)[key] =
                                (typeof current === 'number' ? current : 0) + value;
                        }
                    });
                    break;
                }

                case 'dot': {
                    const dotEffect = effect as OverTimeEffect;
                    result.damageReceived += dotEffect.tickDamage;
                    break;
                }

                case 'hot': {
                    const hotEffect = effect as OverTimeEffect;
                    result.healingReceived += hotEffect.tickDamage;
                    break;
                }

                case 'shield':
                    // Shield handled separately (absorbed damage)
                    break;

                default:
                    // Custom effects can be handled by combat engine
                    break;
            }
        }

        return result;
    }

    /**
     * Tick down all effect durations and remove expired ones
     * 
     * Call this at END of turn
     * 
     * @param character - Character to update
     */
    tickDuration(character: EffectedCharacter): void {
        character.statusEffects = character.statusEffects
            .map(effect => ({ ...effect, duration: effect.duration - 1 }))
            .filter(effect => effect.duration > 0);
    }

    /**
     * Remove all effects of a specific type
     * 
     * @param character - Character to cleanse
     * @param type - Effect type to remove
     */
    removeEffectsByType(character: EffectedCharacter, type: StatusEffectType): void {
        character.statusEffects = character.statusEffects.filter(e => e.type !== type);
    }

    /**
     * Remove a specific effect by ID
     * 
     * @param character - Character to update
     * @param effectId - Effect ID to remove
     */
    removeEffectById(character: EffectedCharacter, effectId: string): void {
        character.statusEffects = character.statusEffects.filter(e => e.id !== effectId);
    }

    /**
     * Get effective stats with all buffs/debuffs applied
     * 
     * @param character - Character to calculate for
     * @returns Modified stats
     */
    getEffectiveStats(character: EffectedCharacter): StatBlock {
        const stats = { ...character.baseStats };

        for (const effect of character.statusEffects) {
            if (effect.type === 'buff' || effect.type === 'debuff') {
                const modEffect = effect as StatModifierEffect;
                Object.entries(modEffect.statChanges).forEach(([stat, value]) => {
                    if (value !== undefined) {
                        (stats as any)[stat] += value;
                    }
                });
            }
        }

        return stats;
    }

    /**
     * Check if character has a specific effect type
     * 
     * @param character - Character to check
     * @param type - Effect type to look for
     * @returns true if effect is active
     */
    hasEffect(character: EffectedCharacter, type: StatusEffectType): boolean {
        return character.statusEffects.some(e => e.type === type);
    }

    /**
     * Get all effects of a specific type
     * 
     * @param character - Character to check  
     * @param type - Effect type to filter
     * @returns Array of matching effects
     */
    getEffectsByType(character: EffectedCharacter, type: StatusEffectType): AnyStatusEffect[] {
        return character.statusEffects.filter(e => e.type === type);
    }
}

/**
 * Factory functions for creating common status effects
 */
export const StatusEffectFactory = {
    _idCounter: 0, // Unique ID generator

    /**
     * Create a Stun effect
     * 
     * @param duration - Number of turns to stun
     * @param source - What applied this effect
     * @returns Stun effect
     */
    createStun(duration: number, source?: string): StunEffect {
        return {
            id: `stun_${++this._idCounter}`,
            name: 'Stunned',
            type: 'stun',
            duration,
            stackable: false, // Stuns don't stack, they refresh
            source
        };
    },

    /**
     * Create a stat buff
     * 
     * @param statChanges - Stats to increase
     * @param duration - Number of turns
     * @param name - Display name
     * @param source - What applied this
     * @returns Buff effect
     */
    createBuff(
        statChanges: Partial<StatBlock>,
        duration: number,
        name: string = 'Buff',
        source?: string
    ): StatModifierEffect {
        return {
            id: `buff_${++this._idCounter}`,
            name,
            type: 'buff',
            duration,
            stackable: false,
            statChanges,
            source
        };
    },

    /**
     * Create a stat debuff
     * 
     * @param statChanges - Stats to decrease (use negative values)
     * @param duration - Number of turns
     * @param name - Display name
     * @param source - What applied this
     * @returns Debuff effect
     */
    createDebuff(
        statChanges: Partial<StatBlock>,
        duration: number,
        name: string = 'Debuff',
        source?: string
    ): StatModifierEffect {
        return {
            id: `debuff_${++this._idCounter}`,
            name,
            type: 'debuff',
            duration,
            stackable: false,
            statChanges,
            source
        };
    },

    /**
     * Create a Damage Over Time effect
     * 
     * @param tickDamage - Damage per turn
     * @param duration - Number of turns
     * @param name - Display name (e.g., "Poison", "Bleed")
     * @param source - What applied this
     * @returns DoT effect
     */
    createDoT(
        tickDamage: number,
        duration: number,
        name: string = 'DoT',
        source?: string
    ): OverTimeEffect {
        return {
            id: `dot_${++this._idCounter}`,
            name,
            type: 'dot',
            duration,
            stackable: true, // DoTs can stack
            tickDamage,
            source
        };
    },

    /**
     * Create a Healing Over Time effect
     * 
     * @param tickHealing - Healing per turn
     * @param duration - Number of turns
     * @param name - Display name (e.g., "Regeneration")
     * @param source - What applied this
     * @returns HoT effect
     */
    createHoT(
        tickDamage: number,
        duration: number,
        name: string = 'HoT',
        source?: string
    ): OverTimeEffect {
        return {
            id: `hot_${++this._idCounter}`,
            name,
            type: 'hot',
            duration,
            stackable: true,
            tickDamage,
            source
        };
    },

    /**
     * Create a Root effect (prevents movement)
     * 
     * @param duration - Number of turns
     * @param source - What applied this
     * @returns Root effect
     */
    createRoot(duration: number, source?: string): RootEffect {
        return {
            id: `root_${++this._idCounter}`,
            name: 'Rooted',
            type: 'root',
            duration,
            stackable: false,
            source
        };
    }
};
