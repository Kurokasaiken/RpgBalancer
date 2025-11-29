/**
 * Character Builder - Character creation logic
 * 
 * Handles:
 * - Converting point allocations to stat values using weights
 * - Calculating total point cost
 * - Validating characters
 * - Building characters from archetypes
 */

import type { StatBlock } from '../types';
import type { Character, CharacterCreationParams, CharacterValidation } from './types';
import { BalanceConfigManager } from '../BalanceConfigManager';
import { BalancingSolver } from '../solver';
import { DEFAULT_STATS } from '../types';
import { GlobalStateHelper } from '../GlobalStateHelper';

export const CharacterBuilder = {
    /**
     * Build a character from creation parameters
     */
    buildCharacter: (params: CharacterCreationParams): Character => {
        // Start with default stats
        let stats: StatBlock = { ...DEFAULT_STATS };

        // Apply stat allocations
        if (params.statAllocations) {
            stats = CharacterBuilder.applyStatAllocations(
                stats,
                params.statAllocations
            );
        }

        // Create character object
        const character: Character = {
            id: crypto.randomUUID(),
            name: params.name,
            archetype: params.archetype,
            variantName: params.variantName,
            stats,
            equippedSpells: params.equippedSpells || [],
            pointBudget: params.pointBudget,
            statAllocations: params.statAllocations || {},
            customWeights: params.customWeights,
            createdAt: new Date(),
            modifiedAt: new Date(),
            description: params.description,
            tags: params.tags
        };

        return character;
    },

    /**
     * Apply stat allocations to a stat block
     * 
     * @param baseStats - Starting stats
     * @param allocations - How many points to allocate to each stat
     */
    applyStatAllocations: (
        baseStats: StatBlock,
        allocations: Partial<Record<keyof StatBlock, number>>
    ): StatBlock => {
        let stats = { ...baseStats };

        // Get weights from config
        const weights = BalanceConfigManager.getWeights();

        // Apply each allocation
        Object.entries(allocations).forEach(([statName, points]) => {
            if (points && points > 0) {
                const weight = typeof weights[statName] === 'number'
                    ? weights[statName] as number
                    : (weights[statName] as any)?.avgRatio || 1;

                // Convert points to stat value
                // Formula: stat_value = points / weight
                const statValue = points / weight;

                // Update stat (use solver to maintain consistency if possible)
                stats = BalancingSolver.solve(
                    stats,
                    statName as keyof StatBlock,
                    (baseStats as any)[statName] + statValue,
                    'none'
                );
            }
        });

        return stats;
    },

    /**
     * Calculate the total point cost of current stat allocations
     */
    calculatePointCost: (allocations: Partial<Record<keyof StatBlock, number>>): number => {
        return Object.values(allocations).reduce((sum, points) => sum + (points || 0), 0);
    },

    /**
     * Calculate how many points are remaining from budget
     */
    calculateRemainingPoints: (
        allocations: Partial<Record<keyof StatBlock, number>>,
        budget: number
    ): number => {
        const used = CharacterBuilder.calculatePointCost(allocations);
        return budget - used;
    },

    /**
     * Validate a character
     */
    validateCharacter: (character: Character): CharacterValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (!character.name || character.name.trim() === '') {
            errors.push('Character name is required');
        }

        if (!character.archetype || character.archetype.trim() === '') {
            errors.push('Archetype is required');
        }

        if (!character.stats) {
            errors.push('Stats are required');
        }

        // Check point budget
        if (character.pointBudget < 0) {
            errors.push('Point budget cannot be negative');
        }

        const allocatedPoints = CharacterBuilder.calculatePointCost(character.statAllocations);
        if (allocatedPoints > character.pointBudget) {
            errors.push(`Allocated points (${allocatedPoints}) exceed budget (${character.pointBudget})`);
        }

        // Check stat values
        if (character.stats) {
            if (character.stats.hp <= 0) {
                warnings.push('HP should be greater than 0');
            }

            if (character.stats.damage < 0) {
                warnings.push('Damage should not be negative');
            }
        }

        // Check equipped spells
        if (character.equippedSpells && character.equippedSpells.length > 10) {
            warnings.push('More than 10 equipped spells may cause performance issues');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Create an empty character template
     */
    createEmpty: (archetype: string = 'balanced'): Character => {
        return {
            id: crypto.randomUUID(),
            name: 'New Character',
            archetype,
            stats: { ...DEFAULT_STATS },
            equippedSpells: [],
            pointBudget: 0,
            statAllocations: {},
            createdAt: new Date(),
            modifiedAt: new Date()
        };
    },

    /**
     * Clone a character with a new ID
     */
    cloneCharacter: (character: Character, newName?: string): Character => {
        return {
            ...character,
            id: crypto.randomUUID(),
            name: newName || `${character.name} (Copy)`,
            createdAt: new Date(),
            modifiedAt: new Date()
        };
    },

    /**
     * Calculate combat metrics for a character
     */
    calculateCombatMetrics: (character: Character) => {
        const stats = character.stats;

        // DPR (Damage Per Round)
        const hitChance = stats.hitChance / 100;
        const critBonus = (stats.critChance / 100) * (stats.critMult - 1);
        const dpr = stats.damage * hitChance * (1 + critBonus);

        // EHP (Effective HP)
        const armorK = 10; // Armor constant from config
        const baseDamage = GlobalStateHelper.getBaseDamage(); // Dynamic base damage from global state
        const armorMult = 1 + (stats.armor / (stats.armor + armorK * baseDamage));
        const ehp = stats.hp * armorMult;

        // TTK (Time To Kill) - vs baseline enemy with 100 HP
        const baselineHP = 100;
        const ttk = dpr > 0 ? Math.ceil(baselineHP / dpr) : Infinity;

        // Survivability Index (combination of EHP, regen, lifesteal)
        const regenValue = stats.regen || 0;
        const lifestealValue = (stats.lifesteal || 0) / 100 * dpr;
        const sustainPerRound = regenValue + lifestealValue;
        const survivability = ehp + (sustainPerRound * 10); // 10 rounds of sustain

        return {
            dpr: Math.round(dpr * 10) / 10,
            ehp: Math.round(ehp),
            ttk,
            survivability: Math.round(survivability)
        };
    }
};
