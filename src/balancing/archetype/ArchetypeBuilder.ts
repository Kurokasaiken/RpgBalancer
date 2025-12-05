/**
 * Archetype Builder Service
 * 
 * Converts archetype templates into concrete StatBlocks by:
 * 1. Taking an allocation (percentages)
 * 2. Distributing a budget across stats according to allocation
 * 3. Using stat weights to convert HP_eq into stat values
 */

import type { StatBlock } from '../types';
import type { ArchetypeTemplate, StatAllocation, ArchetypeInstance } from './types';
import { BalanceConfigManager } from '../BalanceConfigManager';

// Validation error class
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const ArchetypeBuilder = {
    /**
     * Build a StatBlock from an archetype template at a given budget
     */
    buildArchetype: (template: ArchetypeTemplate, budget: number): StatBlock => {
        // Validate inputs
        ArchetypeBuilder.validateTemplate(template);
        ArchetypeBuilder.validateBudget(budget, template);

        // Calculate stat values using ACTIVE preset weights
        return ArchetypeBuilder.calculateStatValues(
            template.allocation,
            budget,
            BalanceConfigManager.getWeights()
        );
    },

    /**
     * Validate that an allocation is valid
     */
    validateAllocation: (allocation: StatAllocation): boolean => {
        // Check all values are non-negative
        const allPositive = Object.values(allocation).every(val => val >= 0);
        if (!allPositive) {
            throw new ValidationError('Allocation values must be non-negative');
        }

        // Check sum is exactly 100%
        const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 100) > 0.01) { // Allow tiny floating point errors
            throw new ValidationError(`Allocation must sum to 100%, got ${sum.toFixed(2)}%`);
        }

        return true;
    },

    /**
     * Validate that a template is well-formed
     */
    validateTemplate: (template: ArchetypeTemplate): boolean => {
        if (!template.id || !template.name) {
            throw new ValidationError('Template must have id and name');
        }

        if (template.minBudget <= 0) {
            throw new ValidationError('minBudget must be positive');
        }

        if (template.maxBudget <= template.minBudget) {
            throw new ValidationError('maxBudget must be greater than minBudget');
        }

        ArchetypeBuilder.validateAllocation(template.allocation);

        return true;
    },

    /**
     * Validate that budget is within template constraints
     */
    validateBudget: (budget: number, template: ArchetypeTemplate): boolean => {
        if (budget < template.minBudget) {
            throw new ValidationError(
                `Budget ${budget} is below template minimum ${template.minBudget}`
            );
        }

        if (budget > template.maxBudget) {
            throw new ValidationError(
                `Budget ${budget} exceeds template maximum ${template.maxBudget}`
            );
        }

        return true;
    },

    /**
     * Calculate actual stat values from allocation and budget
     * 
     * Algorithm:
     * 1. For each stat, allocate HP_eq = budget * (allocation% / 100)
     * 2. Convert HP_eq to stat value using weight: value = HP_eq / weight
     */
    calculateStatValues: (
        allocation: StatAllocation,
        budget: number,
        weights: Record<string, number | { avgRatio: number }>
    ): StatBlock => {
        const statBlock: Partial<StatBlock> = {};

        // Iterate through allocation
        (Object.keys(allocation) as (keyof StatAllocation)[]).forEach(statName => {
            const allocPercent = allocation[statName];

            // Skip if not allocated
            if (allocPercent === 0) {
                (statBlock as any)[statName] = 0;
                return;
            }

            // Calculate HP equivalency for this stat
            const hpEq = budget * (allocPercent / 100);

            // Get weight for this stat
            const entry = weights[statName];
            const weight = typeof entry === 'number' ? entry : entry?.avgRatio;

            if (!weight) {
                console.warn(`No weight found for stat: ${statName}, defaulting to 1.0`);
                (statBlock as any)[statName] = hpEq; // Fallback: 1:1 conversion
                return;
            }

            // Convert HP_eq to stat value
            // Formula: stat_value = HP_eq / weight
            const statValue = hpEq / weight;
            (statBlock as any)[statName] = Math.round(statValue * 100) / 100; // Round to 2 decimals
        });

        return statBlock as StatBlock;
    },

    /**
     * Optimize allocation to distribute unallocated budget
     * 
     * If allocation sums to < 100%, distribute remainder proportionally
     * to existing non-zero allocations
     */
    optimizeAllocation: (allocation: StatAllocation): StatAllocation => {
        const sum = Object.values(allocation).reduce((a, b) => a + b, 0);

        // If already at 100%, no optimization needed
        if (Math.abs(sum - 100) < 0.01) {
            return { ...allocation };
        }

        // If over 100%, throw error
        if (sum > 100) {
            throw new ValidationError(`Allocation exceeds 100%: ${sum.toFixed(2)}%`);
        }

        // Calculate unallocated percentage
        const unallocated = 100 - sum;

        // Find stats with non-zero allocation
        const nonZeroStats = (Object.keys(allocation) as (keyof StatAllocation)[])
            .filter(key => allocation[key] > 0);

        if (nonZeroStats.length === 0) {
            throw new ValidationError('Cannot optimize: all allocations are zero');
        }

        // Distribute unallocated proportionally
        const optimized = { ...allocation };
        const totalAllocated = sum;

        nonZeroStats.forEach(statName => {
            const proportion = allocation[statName] / totalAllocated;
            const bonus = unallocated * proportion;
            optimized[statName] = allocation[statName] + bonus;
        });

        return optimized;
    },

    /**
     * Create an ArchetypeInstance from a template
     */
    createInstance: (template: ArchetypeTemplate, budget: number): ArchetypeInstance => {
        const statBlock = ArchetypeBuilder.buildArchetype(template, budget);

        return {
            templateId: template.id,
            budget,
            statBlock,
            metadata: {
                createdAt: new Date()
            }
        };
    }
};
