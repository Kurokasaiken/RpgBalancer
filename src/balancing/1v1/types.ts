/**
 * Type definitions for 1v1 Balancing Module
 */

import type { StatBlock } from '../types';
import type { BalancePreset } from '../BalanceConfigManager';
import type { Spell } from '../spellTypes';

/**
 * Archetype definition for 1v1 balancing
 * Uses StatBlock from existing types (Single Source of Truth)
 */
export interface Archetype {
    id: string;
    name: string;
    role: string; // "Tank", "DPS", "Assassin", etc.
    description: string;
    stats: StatBlock; // Inherits from balancing/types.ts
    /** Optional equipped spells used in combat simulations */
    spells?: Spell[];
    /** Optional list of spell IDs to resolve from spell storage/config */
    spellIds?: string[];
    meta: {
        createdBy: string;
        createdAt: string;
    };
    costModelRef?: string; // Reference to cost model used
}

/**
 * Matchup result for a single cell in the NxN matrix
 */
export interface MatchupResult {
    row: string; // Row archetype ID
    col: string; // Column archetype ID
    total: number; // Total simulations run
    wins_row: number; // Wins for row archetype
    wins_col: number; // Wins for column archetype
    draws: number; // Draw count
    win_rate_row: number; // Win rate for row (0.0 to 1.0)

    // TTK statistics
    avg_TTK_row_win: number; // Average TTK when row wins
    avg_TTK_col_win: number; // Average TTK when col wins
    median_TTK: number; // Median TTK across all matches
    std_TTK: number; // Standard deviation of TTK

    // HP statistics
    avg_hp_remaining_row_wins: number; // Avg HP remaining when row wins
    avg_hp_remaining_col_wins: number; // Avg HP remaining when col wins
    avg_overkill: number; // Average overkill damage

    // Early impact (first N turns, typically 3)
    earlyImpact_row: number[]; // Damage per turn for first N turns
    earlyImpact_col: number[];

    // Damage time series (per-turn statistics)
    damage_time_series: Record<string, { mean: number; median: number }>;

    // SWI (Stat Weight Index) for this matchup
    SWI: Record<string, number>; // stat name -> SWI value

    // Metadata
    runtimeMs: number; // Time taken to compute this cell
    seed: number; // Random seed used
}

/**
 * Full matrix run result (NxN)
 */
export interface MatrixRunResult {
    runMeta: {
        runId: string; // Unique run identifier
        presetName: string; // Preset used for this run
        createdAt: string; // ISO timestamp
        nSim: number; // Number of simulations per cell
        seed: number; // Base random seed
        balancerSnapshot: BalancePreset; // Copy of balancer config used
    };
    archetypes: string[]; // Array of archetype IDs (in order)
    matrix: MatchupResult[]; // Flattened NxN matrix (row-major order)
}

/**
 * SWI calculation result
 */
export interface SWIResult {
    statKey: string;
    value: number; // SWI value (dimensionless)
    percentChange: number; // % change applied to stat
    ttkBaseline: number; // Baseline TTK
    ttkPerturbed: number; // TTK after perturbation
}
