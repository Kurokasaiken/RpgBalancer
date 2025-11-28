/**
 * Archetype System - Constants and Default Templates
 * 
 * This file contains the 16 base archetype templates and default configurations.
 */

import type { ArchetypeTemplate, BudgetTier, TTKTarget, BalanceConfiguration } from './types';

/**
 * Default Budget Tiers
 */
export const BUDGET_TIERS: BudgetTier[] = [
    {
        name: 'Basic',
        points: 10,
        description: 'Minimal stats for testing',
        color: '#9CA3AF', // gray-400
        icon: '⚪'
    },
    {
        name: 'Common',
        points: 20,
        description: 'Standard low-level character',
        color: '#60A5FA', // blue-400
        icon: '🔵'
    },
    {
        name: 'Balanced',
        points: 50,
        description: 'Mid-level balanced character',
        color: '#34D399', // green-400
        icon: '🟢'
    },
    {
        name: 'Enhanced',
        points: 75,
        description: 'High-level character',
        color: '#A78BFA', // purple-400
        icon: '🟣'
    },
    {
        name: 'Legendary',
        points: 100,
        description: 'Maximum power character',
        color: '#FBBF24', // yellow-400
        icon: '🟡'
    }
];

/**
 * 16 Base Archetype Templates
 */

// === TANK ARCHETYPES (5) ===

export const TANK_JUGGERNAUT: ArchetypeTemplate = {
    id: 'tank_juggernaut',
    name: 'Juggernaut',
    description: 'Pure tank - maximizes HP and Armor. Low damage but nearly unkillable.',
    category: 'Tank',
    allocation: {
        hp: 40,
        armor: 30,
        resistance: 10,
        damage: 10,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 3,
        regen: 2,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'physical', 'sustain'],
    version: '1.0.0'
};

export const TANK_WARDEN: ArchetypeTemplate = {
    id: 'tank_warden',
    name: 'Warden',
    description: 'Balanced tank with high HP and modest armor. More versatile than Juggernaut.',
    category: 'Tank',
    allocation: {
        hp: 50,
        armor: 20,
        resistance: 5,
        damage: 15,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 0,
        regen: 5,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'balanced'],
    version: '1.0.0'
};

export const TANK_FORTRESS: ArchetypeTemplate = {
    id: 'tank_fortress',
    name: 'Fortress',
    description: 'Extreme defense with block chance. Relies on RNG mitigation.',
    category: 'Tank',
    allocation: {
        hp: 30,
        armor: 25,
        resistance: 10,
        damage: 10,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 20,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'rng', 'block'],
    version: '1.0.0'
};

export const TANK_REGENERATOR: ArchetypeTemplate = {
    id: 'tank_regenerator',
    name: 'Regenerator',
    description: 'Sustain tank with high regen and lifesteal. Outlasts enemies.',
    category: 'Tank',
    allocation: {
        hp: 35,
        armor: 15,
        resistance: 5,
        damage: 15,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 10,
        regen: 15,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'sustain', 'heal'],
    version: '1.0.0'
};

export const TANK_SHIELDBEARER: ArchetypeTemplate = {
    id: 'tank_shieldbearer',
    name: 'Shieldbearer',
    description: 'Ward-focused tank. Relies on temporary shields.',
    category: 'Tank',
    allocation: {
        hp: 30,
        armor: 15,
        resistance: 5,
        damage: 10,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 0,
        regen: 5,
        ward: 30,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'shield', 'ward'],
    version: '1.0.0'
};

// === DPS ARCHETYPES (4) ===

export const DPS_BERSERKER: ArchetypeTemplate = {
    id: 'dps_berserker',
    name: 'Berserker',
    description: 'Pure damage - maximizes raw damage output. Glass cannon.',
    category: 'DPS',
    allocation: {
        hp: 20,
        armor: 0,
        resistance: 0,
        damage: 50,
        txc: 20,
        evasion: 0,
        critChance: 5,
        critMult: 5,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'glass-cannon'],
    version: '1.0.0'
};

export const DPS_MARKSMAN: ArchetypeTemplate = {
    id: 'dps_marksman',
    name: 'Marksman',
    description: 'High accuracy DPS. Focuses on consistent hits.',
    category: 'DPS',
    allocation: {
        hp: 25,
        armor: 0,
        resistance: 0,
        damage: 40,
        txc: 30,
        evasion: 0,
        critChance: 3,
        critMult: 2,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'accuracy'],
    version: '1.0.0'
};

export const DPS_DUELIST: ArchetypeTemplate = {
    id: 'dps_duelist',
    name: 'Duelist',
    description: 'Balanced offense/defense. Moderate damage with some survivability.',
    category: 'DPS',
    allocation: {
        hp: 30,
        armor: 10,
        resistance: 0,
        damage: 35,
        txc: 15,
        evasion: 5,
        critChance: 3,
        critMult: 2,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'balanced'],
    version: '1.0.0'
};

export const DPS_ARMORBREAKER: ArchetypeTemplate = {
    id: 'dps_armorbreaker',
    name: 'Armorbreaker',
    description: 'Anti-tank DPS. High armor penetration.',
    category: 'DPS',
    allocation: {
        hp: 25,
        armor: 0,
        resistance: 0,
        damage: 40,
        txc: 15,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 15,
        penPercent: 5,
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'anti-tank', 'penetration'],
    version: '1.0.0'
};

// === ASSASSIN ARCHETYPES (2) ===

export const ASSASSIN_SHADOW: ArchetypeTemplate = {
    id: 'assassin_shadow',
    name: 'Shadow',
    description: 'High crit DPS with evasion. Burst damage from stealth.',
    category: 'Assassin',
    allocation: {
        hp: 20,
        armor: 0,
        resistance: 0,
        damage: 30,
        txc: 15,
        evasion: 10,
        critChance: 15,
        critMult: 10,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'crit', 'evasion'],
    version: '1.0.0'
};

export const ASSASSIN_PHANTOM: ArchetypeTemplate = {
    id: 'assassin_phantom',
    name: 'Phantom',
    description: 'Extreme evasion with moderate crit. Hard to hit.',
    category: 'Assassin',
    allocation: {
        hp: 25,
        armor: 0,
        resistance: 0,
        damage: 25,
        txc: 10,
        evasion: 20,
        critChance: 10,
        critMult: 10,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['offensive', 'evasion', 'dodge'],
    version: '1.0.0'
};

// === BRUISER ARCHETYPES (2) ===

export const BRUISER_WARRIOR: ArchetypeTemplate = {
    id: 'bruiser_warrior',
    name: 'Warrior',
    description: 'Balanced fighter. Good offense and defense.',
    category: 'Bruiser',
    allocation: {
        hp: 30,
        armor: 15,
        resistance: 5,
        damage: 30,
        txc: 10,
        evasion: 0,
        critChance: 5,
        critMult: 5,
        lifesteal: 0,
        regen: 0,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'versatile'],
    version: '1.0.0'
};

export const BRUISER_BRAWLER: ArchetypeTemplate = {
    id: 'bruiser_brawler',
    name: 'Brawler',
    description: 'Sustain fighter with lifesteal. Heal through damage.',
    category: 'Bruiser',
    allocation: {
        hp: 30,
        armor: 10,
        resistance: 0,
        damage: 30,
        txc: 10,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 15,
        regen: 5,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'sustain', 'lifesteal'],
    version: '1.0.0'
};

// === SUPPORT ARCHETYPES (2) ===

export const SUPPORT_HEALER: ArchetypeTemplate = {
    id: 'support_healer',
    name: 'Healer',
    description: 'Maximum regen and HP. Passive healing focus.',
    category: 'Support',
    allocation: {
        hp: 40,
        armor: 10,
        resistance: 5,
        damage: 10,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 5,
        regen: 25,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'heal', 'sustain'],
    version: '1.0.0'
};

export const SUPPORT_BULWARK: ArchetypeTemplate = {
    id: 'support_bulwark',
    name: 'Bulwark',
    description: 'Shield-focused support. Protects with ward.',
    category: 'Support',
    allocation: {
        hp: 35,
        armor: 10,
        resistance: 10,
        damage: 10,
        txc: 5,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 0,
        regen: 5,
        ward: 25,
        block: 0,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'shield', 'ward'],
    version: '1.0.0'
};

// === HYBRID ARCHETYPE (1) ===

export const HYBRID_ALLROUNDER: ArchetypeTemplate = {
    id: 'hybrid_allrounder',
    name: 'Allrounder',
    description: 'Jack of all trades. Even distribution across all stats.',
    category: 'Hybrid',
    allocation: {
        hp: 20,
        armor: 10,
        resistance: 5,
        damage: 20,
        txc: 10,
        evasion: 5,
        critChance: 5,
        critMult: 5,
        lifesteal: 5,
        regen: 5,
        ward: 5,
        block: 5,
        armorPen: 0,
        penPercent: 0
    },
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'versatile', 'hybrid'],
    version: '1.0.0'
};

/**
 * All 16 Base Templates
 */
export const DEFAULT_ARCHETYPES: ArchetypeTemplate[] = [
    // Tanks
    TANK_JUGGERNAUT,
    TANK_WARDEN,
    TANK_FORTRESS,
    TANK_REGENERATOR,
    TANK_SHIELDBEARER,
    // DPS
    DPS_BERSERKER,
    DPS_MARKSMAN,
    DPS_DUELIST,
    DPS_ARMORBREAKER,
    // Assassins
    ASSASSIN_SHADOW,
    ASSASSIN_PHANTOM,
    // Bruisers
    BRUISER_WARRIOR,
    BRUISER_BRAWLER,
    // Support
    SUPPORT_HEALER,
    SUPPORT_BULWARK,
    // Hybrid
    HYBRID_ALLROUNDER
];

/**
 * Default TTK Targets Matrix
 * These are example targets - should be tuned based on actual testing
 */
export const DEFAULT_TTK_TARGETS: TTKTarget[] = [
    // Tank vs DPS (Tank should win in extended fight)
    {
        matchup: { archetypeA: 'tank_juggernaut', archetypeB: 'dps_berserker' },
        budget: 50,
        minRounds: 6,
        targetRounds: 8,
        maxRounds: 10,
        tolerance: 1,
        expectedWinner: 'A' // Tank outlasts
    },
    // DPS vs Tank (reverse)
    {
        matchup: { archetypeA: 'dps_berserker', archetypeB: 'tank_juggernaut' },
        budget: 50,
        minRounds: 6,
        targetRounds: 8,
        maxRounds: 10,
        tolerance: 1,
        expectedWinner: 'B' // Tank outlasts
    },
    // Assassin vs DPS (Assassin should win with burst)
    {
        matchup: { archetypeA: 'assassin_shadow', archetypeB: 'dps_berserker' },
        budget: 50,
        minRounds: 3,
        targetRounds: 5,
        maxRounds: 7,
        tolerance: 1,
        expectedWinner: 'Either' // Depends on crits/evasion RNG
    },
    // Balanced matchup (Warrior vs Warrior)
    {
        matchup: { archetypeA: 'bruiser_warrior', archetypeB: 'bruiser_warrior' },
        budget: 50,
        minRounds: 5,
        targetRounds: 7,
        maxRounds: 9,
        tolerance: 1,
        expectedWinner: 'Either' // Mirror match
    }
];

/**
 * Default Balance Configuration
 */
export const DEFAULT_BALANCE_CONFIG: BalanceConfiguration = {
    ttkTargets: DEFAULT_TTK_TARGETS,
    budgetTiers: BUDGET_TIERS
};
