/**
 * Type definitions for Combat Simulation system
 */

/**
 * Basic entity stats for combat simulation
 * These should match your existing character/spell stat structure
 */
export interface EntityStats {
    name: string;
    hp: number;
    attack: number;
    defense: number;
    // Add other relevant stats as needed
    [key: string]: any; // Allow flexibility for additional stats
}

/**
 * Random Number Generator interface
 * Used for deterministic simulations
 */
export interface RNG {
    (): number; // Returns number between 0 and 1
}

/**
 * Turn data - represents what happened in a single turn
 */
export interface TurnData {
    turnNumber: number;
    attacker: 'entity1' | 'entity2';
    defender: 'entity1' | 'entity2';
    damageDealt: number;
    defenderHPRemaining: number;
}

/**
 * Result of a single combat simulation
 */
export interface CombatResult {
    /** Winner of the combat ('draw' if turn limit reached) */
    winner: 'entity1' | 'entity2' | 'draw';

    /** Number of turns the combat lasted */
    turns: number;

    /** Total damage dealt by each entity */
    damageDealt: {
        entity1: number;
        entity2: number;
    };

    /** HP remaining at end of combat */
    hpRemaining: {
        entity1: number;
        entity2: number;
    };

    /** Overkill damage (damage dealt after opponent reached 0 HP) */
    overkill: {
        entity1: number;
        entity2: number;
    };

    /** Optional: detailed turn-by-turn log */
    turnByTurnLog?: TurnData[];

    /** Enhanced Metrics (Phase 9) */
    initiativeRolls?: {
        entity1: number[];
        entity2: number[];
    };
    hitRate?: {
        entity1: number; // Actual hits / total attacks
        entity2: number;
    };
    critRate?: {
        entity1: number; // Actual crits / total hits
        entity2: number;
    };
    statusEffectsApplied?: {
        entity1: number;
        entity2: number;
    };
    turnsStunned?: {
        entity1: number;
        entity2: number;
    };
}

/**
 * Configuration for a combat simulation
 */
export interface CombatConfig {
    /** First entity stats */
    entity1: EntityStats;

    /** Second entity stats */
    entity2: EntityStats;

    /** Maximum turns before declaring a draw */
    turnLimit: number;

    /** Whether to log detailed turn-by-turn data */
    enableDetailedLogging?: boolean;
}

/**
 * Statistics about damage per turn
 */
export interface DPTStats {
    average: number;
    median: number;
    min: number;
    max: number;
}

/**
 * Configuration for Monte Carlo simulation
 */
export interface SimulationConfig {
    /** Combat configuration */
    combat: CombatConfig;

    /** Number of iterations to run */
    iterations: number;

    /** Number of sample combat logs to save (default: 10) */
    logSampleSize?: number;
}

/**
 * Results from a Monte Carlo simulation batch
 */
export interface SimulationResults {
    /** Summary statistics */
    summary: {
        totalSimulations: number;
        winRates: {
            entity1: number;
            entity2: number;
            draws: number;
        };
        /** 95% Confidence Intervals for win rates */
        confidenceIntervals: {
            entity1: [number, number];
            entity2: [number, number];
        };
    };

    /** Combat duration statistics */
    combatStatistics: {
        averageTurns: number;
        medianTurns: number;
        minTurns: number;
        maxTurns: number;
        /** Histogram data: [turn_count] = number_of_combats */
        turnDistribution: Record<number, number>;
    };

    /** Damage metrics */
    damageMetrics: {
        entity1: DPTStats;
        entity2: DPTStats;
        averageOverkill: {
            entity1: number;
            entity2: number;
        };
    };

    /** HP efficiency: damage dealt / HP lost ratio */
    hpEfficiency: {
        entity1: number;
        entity2: number;
    };

    /** Sample combat logs */
    sampleCombats: CombatResult[];
}

/**
 * Comparison between baseline and modified entity
 * Used for stat value analysis
 */
export interface StatValueComparison {
    /** Baseline entity stats */
    baseline: EntityStats;

    /** Modified entity stats (one stat changed) */
    modified: EntityStats;

    /** Which stat was modified */
    modifiedStat: string;

    /** Amount the stat was changed */
    statDelta: number;

    /** Change in win rate */
    winRateDelta: number;

    /** HP equivalency value (HP per stat point) */
    hpPerStatPoint: number;

    /** Confidence interval for HP equivalency */
    confidence: [number, number];
}
