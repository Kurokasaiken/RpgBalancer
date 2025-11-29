/**
 * Character System - Type Definitions
 * 
 * Defines the structure for player-created characters with:
 * - Archetype-based stat allocation
 * - Equipped spells management
 * - Point budget tracking
 * - Variant system (main archetype or named variant)
 */

import type { StatBlock } from '../types';
import type { Spell } from '../spellTypes';

/**
 * Character - A player-created character with stats and equipped spells
 */
export interface Character {
    /** Unique identifier */
    id: string;

    /** Character name */
    name: string;

    /** Base archetype (e.g., "tank", "dps", "balanced") */
    archetype: string;

    /** Optional variant name. If empty/undefined, this is the main archetype */
    variantName?: string;

    /** Character stats (HP, damage, armor, etc.) */
    stats: StatBlock;

    /** Spells equipped by this character */
    equippedSpells: Spell[];

    /** Total point budget used to create this character */
    pointBudget: number;

    /** Stat point allocations (how many points allocated to each stat) */
    statAllocations: Partial<Record<keyof StatBlock, number>>;

    /** Custom stat weights (if different from defaults) */
    customWeights?: Partial<Record<keyof StatBlock, number>>;

    /** Creation timestamp */
    createdAt: Date;

    /** Last modification timestamp */
    modifiedAt: Date;

    /** Optional description/notes */
    description?: string;

    /** Optional tags for categorization */
    tags?: string[];
}

/**
 * Character creation parameters
 */
export interface CharacterCreationParams {
    name: string;
    archetype: string;
    variantName?: string;
    pointBudget: number;
    statAllocations: Partial<Record<keyof StatBlock, number>>;
    customWeights?: Partial<Record<keyof StatBlock, number>>;
    equippedSpells?: Spell[];
    description?: string;
    tags?: string[];
}

/**
 * Character summary for display in lists
 */
export interface CharacterSummary {
    id: string;
    name: string;
    archetype: string;
    variantName?: string;
    pointBudget: number;
    /** Derived combat metrics */
    dpr: number; // Damage per round
    ehp: number; // Effective HP
    ttk: number; // Time to kill (vs baseline enemy)
    survivability: number; // Survivability index
}

/**
 * Character validation result
 */
export interface CharacterValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
