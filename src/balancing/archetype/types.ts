/**
 * Archetype System - Type Definitions
 * 
 * These types define the structure of the archetype system, which allows
 * creating characters/builds by distributing a budget across stats according to templates.
 */

/**
 * Archetype Category - The role/playstyle of the archetype
 */
/**
 * Archetype Category Definition
 */
export interface ArchetypeCategoryDef {
    id: string;
    name: string;
    description: string;
    color: string;
}

// Legacy type for backward compatibility during migration, eventually replace with string
export type ArchetypeCategory = string;

/**
 * Stat Allocation - percentage of budget assigned to each core stat
 * Sum of all fields should be approximately 100.
 */
export interface StatAllocation {
    hp: number;
    damage: number;
    armor: number;
    resistance: number;
    txc: number;
    evasion: number;
    critChance: number;
    critMult: number;
    lifesteal: number;
    regen: number;
    ward: number;
    block: number;
    armorPen: number;
    penPercent: number;
}

/**
 * Archetype Template - The "blueprint" for creating instances
 */
export interface ArchetypeTemplate {
    id: string;
    name: string;
    description: string;
    category: string; // Archetype category/role label (e.g., "Tank")
    isSystem?: boolean; // If true, cannot be deleted


    // Stat Distribution (percentages, sum must be ≤ 100)
    allocation: StatAllocation;

    // Budget Constraints
    minBudget: number;  // Minimum HP cost to build
    maxBudget: number;  // Maximum HP cost to build

    // Metadata
    tags: string[];     // e.g., ['melee', 'aggressive', 'defensive']
    author?: string;
    version: string;    // Semantic versioning for templates
}

/**
 * Archetype Instance - A specific build created from a template at a budget
 */
export interface ArchetypeInstance {
    templateId: string;
    budget: number;      // HP cost used
    statBlock: import('../types').StatBlock; // Resulting stats
    metadata: {
        createdAt: Date;
        createdBy?: string;
    };
}

/**
 * TTK Target - Expected Time-To-Kill for matchups
 */
export interface TTKTarget {
    matchup: {
        archetypeA: string; // Archetype ID
        archetypeB: string; // Archetype ID
    };
    budget: number;         // Budget level (10, 20, 50, etc.)

    // Expected Rounds
    minRounds: number;
    targetRounds: number;
    maxRounds: number;
    tolerance: number;      // ±tolerance for passing validation

    // Expected Winner
    expectedWinner: 'A' | 'B' | 'Either'; // 'Either' for balanced matchups
}

/**
 * TTK Test Result - Outcome of running a matchup simulation
 */
export interface TTKResult {
    matchup: {
        archetypeA: string;
        archetypeB: string;
    };
    budget: number;

    // Simulation Results
    totalSimulations: number;
    winnerCounts: {
        A: number;
        B: number;
    };

    // Round Statistics
    roundsToKill: {
        avg: number;
        median: number;
        stdDev: number;
        min: number;
        max: number;
    };

    // Derived Metrics
    winRate: {
        A: number; // 0-1
        B: number; // 0-1
    };
}

/**
 * TTK Validation Result - Comparison of result vs target
 */
export interface TTKValidation {
    result: TTKResult;
    target: TTKTarget;

    // Validation Status
    isValid: boolean;
    deviations: {
        roundsDeviation: number;  // How far from target rounds
        roundsDeviationPercent: number;
        winnerMismatch: boolean;  // Is the winner wrong?
    };

    // Messages
    warnings: string[];
    errors: string[];
}

/**
 * Balance Configuration - Global settings for the archetype system
 */
export interface BalanceConfiguration {
    // TTK Targets
    ttkTargets: TTKTarget[];

    // Budget Tiers
    budgetTiers: BudgetTier[];

    // Counter Matrix (optional - defines strength relationships)
    counterMatrix?: Record<string, Record<string, 'Strong' | 'Weak' | 'Even'>>;

    // Global tolerance settings (percent values, e.g. 10 = 10%)
    winRateTolerance?: number;
    roundsTolerancePercent?: number;
    maxSimulationRounds?: number;
}

/**
 * Budget Tier - Pre-defined budget levels for testing
 */
export interface BudgetTier {
    name: string;           // e.g., "Common", "Rare", "Legendary"
    points: number;         // HP cost
    description: string;
    color?: string;         // For UI
    icon?: string;          // For UI
}

/**
 * Spell Cost (using Spell Points currency)
 */
export interface SpellCost {
    spellPoints: number;    // Cost in spell points (derived from HP)
    tier: 1 | 2 | 3 | 4 | 5; // Tier classification
}
