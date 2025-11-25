/**
 * Archetype Balancing System - Type Definitions
 * 
 * Core interfaces for archetype-based balancing:
 * - ArchetypeTemplate: Blueprint for character archetypes
 * - TTKTarget: Time-To-Kill validation targets
 * - BalanceConfiguration: Global balance settings
 * - SpellCost: SpellPoints currency system
 */

import type { StatBlock } from '../types';

/**
 * Archetype Template - Blueprint for creating archetype instances
 * 
 * Defines how stat points should be allocated for a specific archetype variant
 */
export interface ArchetypeTemplate {
    // Identity
    id: string;
    name: string;
    category: 'tank' | 'dps' | 'assassin' | 'bruiser' | 'support';
    variant: string; // e.g., "HighHP", "Crit", "Evasive"
    description: string;

    // Stat Allocation Strategy (percentage-based)
    // Must sum to 100%
    statAllocation: Partial<Record<keyof StatBlock, number>>;

    // Budget Constraints
    minBudget: number;  // Minimum viable budget (e.g., 10 points)
    maxBudget: number;  // Maximum recommended budget (e.g., 100 points)

    // Metadata
    createdBy: 'system' | 'user';
    tags: string[]; // For search/filtering

    // Test Results (populated after testing)
    testResults?: ArchetypeTestResults;
}

/**
 * Test results for an archetype across all matchups
 */
export interface ArchetypeTestResults {
    avgWinRate: number;           // Average winrate vs all other archetypes
    avgTTK: number;               // Average rounds to kill
    counters: string[];           // Archetype IDs this archetype beats (>60% WR)
    counteredBy: string[];        // Archetype IDs that beat this archetype (>60% WR)
    lastTested: Date;
    budgetLevel: number;          // Budget level used for testing
}

/**
 * Archetype Instance - Generated StatBlock from template + budget
 */
export interface ArchetypeInstance {
    templateId: string;
    template: ArchetypeTemplate;
    budget: number;
    statBlock: StatBlock;
    createdAt: Date;
}

/**
 * TTK Target - Expected Time-To-Kill for a matchup
 * 
 * Defines expected combat duration and winner for balance validation
 */
export interface TTKTarget {
    // Matchup
    archetypeA: string;  // Archetype ID or category
    archetypeB: string;  // Archetype ID or category

    // Expected Winner
    expectedWinner: 'A' | 'B' | 'even';  // 'even' = 45-55% winrate

    // Expected Rounds to Kill
    minRounds: number;       // Minimum acceptable combat duration
    maxRounds: number;       // Maximum acceptable (timeout threshold)
    targetRounds: number;    // Ideal average
    tolerance: number;       // ±X rounds acceptable

    // Metadata
    description?: string;
    budgetLevel?: number;    // If target is budget-specific
}

/**
 * TTK Validation Result
 */
export interface TTKValidation {
    valid: boolean;
    actualRounds: number;
    targetRounds: number;
    deviation: number;          // actualRounds - targetRounds
    deviationPercent: number;   // (deviation / targetRounds) * 100
    winnerCorrect: boolean;
    severity: 'ok' | 'minor' | 'major' | 'critical';
    message: string;
}

/**
 * Balance Configuration - Global balance settings
 */
export interface BalanceConfiguration {
    // TTK Targets
    ttkTargets: TTKTarget[];

    // Counter Relationships
    // Maps archetype ID to its expected relationships
    counters: Record<string, {
        strongAgainst: string[];  // Should win 60%+ against these
        weakAgainst: string[];    // Should lose 40%- against these
        evenWith: string[];       // Should be 50% ±10% against these
    }>;

    // Budget Tiers
    budgetTiers: BudgetTier[];

    // Global Settings
    winRateTolerance: number;      // ±X% for "even" matchups (default: 10)
    roundsTolerancePercent: number; // ±X% for TTK validation (default: 20)
    maxSimulationRounds: number;    // Prevent infinite loops (default: 50)
}

/**
 * Budget Tier - Predefined budget levels
 */
export interface BudgetTier {
    name: string;           // "Early Game", "Mid Game", etc.
    points: number;         // 10, 20, 50, etc.
    description: string;
}

/**
 * Spell Cost - SpellPoints currency system
 * 
 * Replaces mana-based costing with HP-equivalent budget
 */
export interface SpellCost {
    spellPoints: number;    // HP-equivalent / 5.0 (granular cost)
    tier: 1 | 2 | 3 | 4 | 5; // Tier categorization (Common → Legendary)
    description: string;    // "Common", "Rare", etc.
}

/**
 * Spell Tier Definition
 */
export interface SpellTier {
    tier: 1 | 2 | 3 | 4 | 5;
    name: string;           // "Common", "Uncommon", "Rare", "Epic", "Legendary"
    minPoints: number;      // Minimum spell points for this tier
    maxPoints: number;      // Maximum spell points for this tier
    color: string;          // Visual color code
    icon: string;           // Emoji or icon
}

/**
 * TTK Test Result - Single matchup result
 */
export interface TTKResult {
    archetypeA: string;
    archetypeB: string;
    budget: number;

    // Simulation Results
    simulations: number;
    winsA: number;
    winsB: number;
    draws: number;

    // Calculated Metrics
    winRateA: number;       // winsA / simulations
    winRateB: number;       // winsB / simulations
    avgRoundsToKill: number;

    // Validation
    target?: TTKTarget;
    validation?: TTKValidation;

    // Timestamp
    testedAt: Date;
}

/**
 * Batch Test Result - Full matrix results
 */
export interface BatchTestResult {
    archetypes: string[];   // List of tested archetype IDs
    budgetLevel: number;
    results: TTKResult[];   // N × N results
    summary: {
        totalMatchups: number;
        balancedMatchups: number;  // Within tolerance
        imbalancedMatchups: number;
        balanceScore: number;      // balancedMatchups / totalMatchups
    };
    testedAt: Date;
}

/**
 * Imbalance Report - Analysis of balance issues
 */
export interface ImbalanceReport {
    imbalances: Array<{
        matchup: string;        // "Tank_HighHP vs DPS_Pure"
        severity: 'minor' | 'major' | 'critical';
        issue: string;          // Description
        actualWinRate: number;
        expectedWinRate: number;
        deviation: number;
    }>;
    affectedStats: Record<string, number>;  // Stat → impact score
    recommendedAdjustments: Record<string, number>;  // Stat → suggested weight change
}
