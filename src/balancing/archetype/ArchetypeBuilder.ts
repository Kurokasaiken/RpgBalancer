/**
 * Archetype Builder - Generate StatBlock from archetype template
 * 
 * Converts percentage-based stat allocations into concrete StatBlock values
 */

import type { ArchetypeTemplate, ArchetypeInstance } from './types';
import type { StatBlock } from '../types';
import { STAT_WEIGHTS } from '../statWeights';
import { DEFAULT_STATS } from '../types';

/**
 * Build a StatBlock from archetype template and budget
 * 
 * Formula: For each stat, value = (allocation% * budget) / weight
 * 
 * Example:
 *   Template: { hp: 70%, damage: 30% }
 *   Budget: 50 points
 *   Weights: { hp: 1.0, damage: 5.0 }
 *   
 *   HP = (0.70 * 50) / 1.0 = 35
 *   Damage = (0.30 * 50) / 5.0 = 3
 */
export function buildArchetype(
    template: ArchetypeTemplate,
    budget: number
): ArchetypeInstance {
    // Validate budget
    if (budget < template.minBudget || budget > template.maxBudget) {
        throw new Error(
            `Budget ${budget} outside template bounds [${template.minBudget}, ${template.maxBudget}]`
        );
    }

    // Validate allocation
    const validation = validateAllocation(template.statAllocation);
    if (!validation.valid) {
        throw new Error(`Invalid stat allocation: ${validation.errors.join(', ')}`);
    }

    // Calculate stat values
    const statBlock = calculateStatValues(template.statAllocation, budget);

    return {
        templateId: template.id,
        template,
        budget,
        statBlock,
        createdAt: new Date(),
    };
}

/**
 * Validate stat allocation percentages
 * 
 * Rules:
 * - Sum must equal 100% (±0.1% tolerance for floating point)
 * - All values must be >= 0
 * - No allocation > 100%
 */
export function validateAllocation(
    allocation: Partial<Record<keyof StatBlock, number>>
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for negative values
    Object.entries(allocation).forEach(([stat, value]) => {
        if (value < 0) {
            errors.push(`${stat} has negative allocation: ${value}%`);
        }
        if (value > 100) {
            errors.push(`${stat} allocation exceeds 100%: ${value}%`);
        }
    });

    // Check sum
    const sum = Object.values(allocation).reduce((acc, val) => acc + val, 0);
    const tolerance = 0.1;

    if (Math.abs(sum - 100) > tolerance) {
        errors.push(`Allocation sum is ${sum}%, expected 100% (±${tolerance}%)`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calculate concrete stat values from allocation percentages
 * 
 * @param allocation - Percentage allocation per stat
 * @param budget - Total HP-equivalent budget
 * @returns Complete StatBlock with calculated values
 */
export function calculateStatValues(
    allocation: Partial<Record<keyof StatBlock, number>>,
    budget: number
): StatBlock {
    // Start with default stats
    const stats: StatBlock = { ...DEFAULT_STATS };

    // Apply allocations
    Object.entries(allocation).forEach(([statName, percentage]) => {
        const stat = statName as keyof StatBlock;
        const weight = STAT_WEIGHTS[stat];

        if (weight === undefined) {
            console.warn(`No weight defined for stat: ${stat}, skipping`);
            return;
        }

        // Formula: value = (percentage * budget) / weight
        const points = (percentage / 100) * budget;
        const value = points / weight;

        // Round to appropriate precision
        stats[stat] = roundStat(stat, value);
    });

    // Derived stats will be recalculated by Balancer
    // We don't need to manually set htk, hitChance, etc.

    return stats;
}

/**
 * Round stat to appropriate precision
 * 
 * - Percentages (resistance, critChance, etc.): 1 decimal
 * - Flat values (hp, damage, armor): integer
 * - Multipliers (critMult, failMult): 2 decimals
 */
function roundStat(stat: keyof StatBlock, value: number): number {
    // Percentage stats
    const percentageStats: Array<keyof StatBlock> = [
        'resistance', 'critChance', 'failChance', 'lifesteal', 'block',
        'penPercent', 'cooldownReduction', 'castSpeed', 'movementSpeed'
    ];

    // Multiplier stats
    const multiplierStats: Array<keyof StatBlock> = [
        'critMult', 'failMult'
    ];

    if (percentageStats.includes(stat)) {
        return Math.round(value * 10) / 10; // 1 decimal
    } else if (multiplierStats.includes(stat)) {
        return Math.round(value * 100) / 100; // 2 decimals
    } else {
        return Math.round(value); // integer
    }
}

/**
 * Optimize allocation by redistributing unallocated percentage
 * 
 * If allocation sum < 100%, distribute remaining % proportionally
 * If locked stats are provided, don't touch those
 */
export function optimizeAllocation(
    allocation: Partial<Record<keyof StatBlock, number>>,
    lockedStats: Array<keyof StatBlock> = []
): Partial<Record<keyof StatBlock, number>> {
    const sum = Object.values(allocation).reduce((acc, val) => acc + val, 0);

    if (sum >= 100) {
        return allocation; // Already at or over 100%
    }

    const remaining = 100 - sum;

    // Get non-locked stats with allocation
    const adjustableStats = Object.entries(allocation).filter(
        ([stat]) => !lockedStats.includes(stat as keyof StatBlock) && allocation[stat as keyof StatBlock]! > 0
    );

    if (adjustableStats.length === 0) {
        console.warn('No adjustable stats to optimize');
        return allocation;
    }

    // Distribute remaining percentage proportionally
    const adjustableSum = adjustableStats.reduce((acc, [, val]) => acc + val, 0);
    const optimized = { ...allocation };

    adjustableStats.forEach(([stat, value]) => {
        const proportion = value / adjustableSum;
        const bonus = proportion * remaining;
        optimized[stat as keyof StatBlock] = value + bonus;
    });

    return optimized;
}

/**
 * Compare two archetypes and show stat differences
 */
export function compareArchetypes(
    archetypeA: ArchetypeInstance,
    archetypeB: ArchetypeInstance
): Record<keyof StatBlock, { a: number; b: number; diff: number; diffPercent: number } | null> {
    const comparison: any = {};

    const allStats = new Set([
        ...Object.keys(archetypeA.statBlock),
        ...Object.keys(archetypeB.statBlock),
    ]) as Set<keyof StatBlock>;

    allStats.forEach(stat => {
        const valA = archetypeA.statBlock[stat] as number;
        const valB = archetypeB.statBlock[stat] as number;

        if (typeof valA === 'number' && typeof valB === 'number') {
            const diff = valA - valB;
            const diffPercent = valB !== 0 ? (diff / valB) * 100 : 0;

            comparison[stat] = {
                a: valA,
                b: valB,
                diff,
                diffPercent,
            };
        } else {
            comparison[stat] = null; // Non-numeric stat (e.g., config flags)
        }
    });

    return comparison;
}

/**
 * Calculate "power score" - total HP-equivalent budget used
 */
export function calculatePowerScore(instance: ArchetypeInstance): number {
    let total = 0;

    Object.entries(instance.statBlock).forEach(([stat, value]) => {
        if (typeof value !== 'number') return;

        const weight = STAT_WEIGHTS[stat as keyof StatBlock];
        if (weight) {
            total += value * weight;
        }
    });

    return total;
}
