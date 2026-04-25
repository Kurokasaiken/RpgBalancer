/**
 * Archetype System - Constants and Default Templates
 * 
 * This file contains the 16 base archetype templates and default configurations.
 */

import type {
    ArchetypeTemplate,
    BudgetTier,
    TTKTarget,
    BalanceConfiguration,
} from './types';
import { withAllocationDefaults } from './allocationDefaults';

export { createBalancedAllocation } from './allocationDefaults';

// NOTE: Keep archetype `tags` arrays sorted alphabetically for clean diffs.

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

/**
 * Juggernaut tank. Allocation uses withAllocationDefaults to keep every stat key tracked by the helper.
 */
export const TANK_JUGGERNAUT: ArchetypeTemplate = {
    id: 'tank_juggernaut',
    name: 'Juggernaut',
    description: 'Pure tank - maximizes HP and Armor. Low damage but nearly unkillable.',
    category: 'Tank',
    allocation: withAllocationDefaults({
        hp: 45,
        armor: 30,
        resistance: 10,
        damage: 7,
        txc: 4,
        evasion: 0,
        critChance: 0,
        critMult: 0,
        lifesteal: 2,
        regen: 2,
        ward: 0,
        block: 0,
        armorPen: 0,
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'physical', 'sustain'],
    version: '1.0.0'
};

/**
 * Warden tank. Keep allocations wrapped with withAllocationDefaults for config-first completeness.
 */
export const TANK_WARDEN: ArchetypeTemplate = {
    id: 'tank_warden',
    name: 'Warden',
    description: 'Balanced tank with high HP and modest armor. More versatile than Juggernaut.',
    category: 'Tank',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'defensive'],
    version: '1.0.0'
};

/**
 * Fortress tank leveraging block chance. Remember to pass partial stats through withAllocationDefaults.
 */
export const TANK_FORTRESS: ArchetypeTemplate = {
    id: 'tank_fortress',
    name: 'Fortress',
    description: 'Extreme defense with block chance. Relies on RNG mitigation.',
    category: 'Tank',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['block', 'defensive', 'rng'],
    version: '1.0.0'
};

/**
 * Regenerator tank focused on sustain—the helper withAllocationDefaults maintains zeroes for unused stats.
 */
export const TANK_REGENERATOR: ArchetypeTemplate = {
    id: 'tank_regenerator',
    name: 'Regenerator',
    description: 'Sustain tank with high regen and lifesteal. Outlasts enemies.',
    category: 'Tank',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'heal', 'sustain'],
    version: '1.0.0'
};

/**
 * Shieldbearer tank. Always rely on withAllocationDefaults to inherit untouched stat fields.
 */
export const TANK_SHIELDBEARER: ArchetypeTemplate = {
    id: 'tank_shieldbearer',
    name: 'Shieldbearer',
    description: 'Ward-focused tank. Relies on temporary shields.',
    category: 'Tank',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'shield', 'ward'],
    version: '1.0.0'
};

// === DPS ARCHETYPES (4) ===

/**
 * Berserker DPS glass cannon. Allocation stays consistent by routing through withAllocationDefaults.
 */
export const DPS_BERSERKER: ArchetypeTemplate = {
    id: 'dps_berserker',
    name: 'Berserker',
    description: 'Pure damage - maximizes raw damage output. Glass cannon.',
    category: 'DPS',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['glass-cannon', 'offensive'],
    version: '1.0.0'
};

/**
 * Marksman DPS. Use withAllocationDefaults so accuracy-focused stats keep config parity.
 */
export const DPS_MARKSMAN: ArchetypeTemplate = {
    id: 'dps_marksman',
    name: 'Marksman',
    description: 'High accuracy DPS. Focuses on consistent hits.',
    category: 'DPS',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['accuracy', 'offensive'],
    version: '1.0.0'
};

/**
 * Duelist DPS with moderate defenses; allocation is wrapped with withAllocationDefaults for completeness.
 */
export const DPS_DUELIST: ArchetypeTemplate = {
    id: 'dps_duelist',
    name: 'Duelist',
    description: 'Balanced offense/defense. Moderate damage with some survivability.',
    category: 'DPS',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'offensive'],
    version: '1.0.0'
};

/**
 * Armorbreaker DPS. The withAllocationDefaults helper ensures penetration stats co-exist with zeroed fields.
 */
export const DPS_ARMORBREAKER: ArchetypeTemplate = {
    id: 'dps_armorbreaker',
    name: 'Armorbreaker',
    description: 'Anti-tank DPS. High armor penetration.',
    category: 'DPS',
    allocation: withAllocationDefaults({
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
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['anti-tank', 'offensive', 'penetration'],
    version: '1.0.0'
};

// === ASSASSIN ARCHETYPES (2) ===

/**
 * Shadow assassin. Always call withAllocationDefaults so crit/evasion deltas merge with base stat map.
 */
export const ASSASSIN_SHADOW: ArchetypeTemplate = {
    id: 'assassin_shadow',
    name: 'Shadow',
    description: 'High crit DPS with evasion. Burst damage from stealth.',
    category: 'Assassin',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['crit', 'evasion', 'offensive'],
    version: '1.0.0'
};

/**
 * Phantom assassin relying on evasion; helper withAllocationDefaults keeps defensive stats explicit.
 */
export const ASSASSIN_PHANTOM: ArchetypeTemplate = {
    id: 'assassin_phantom',
    name: 'Phantom',
    description: 'Extreme evasion with moderate crit. Hard to hit.',
    category: 'Assassin',
    allocation: withAllocationDefaults({
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
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['dodge', 'evasion', 'offensive'],
    version: '1.0.0'
};

// === BRUISER ARCHETYPES (2) ===

/**
 * Warrior bruiser archetype. Allocation uses withAllocationDefaults to stay aligned with baseline weights.
 */
export const BRUISER_WARRIOR: ArchetypeTemplate = {
    id: 'bruiser_warrior',
    name: 'Warrior',
    description: 'Balanced fighter. Good offense and defense.',
    category: 'Bruiser',
    allocation: withAllocationDefaults({
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
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'versatile'],
    version: '1.0.0'
};

/**
 * Brawler bruiser with lifesteal; withAllocationDefaults guarantees the helper fills omitted stats.
 */
export const BRUISER_BRAWLER: ArchetypeTemplate = {
    id: 'bruiser_brawler',
    name: 'Brawler',
    description: 'Sustain fighter with lifesteal. Heal through damage.',
    category: 'Bruiser',
    allocation: withAllocationDefaults({
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
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'lifesteal', 'sustain'],
    version: '1.0.0'
};

// === SUPPORT ARCHETYPES (2) ===

/**
 * Support Healer template. The helper withAllocationDefaults ensures regen-heavy allocations remain typed.
 */
export const SUPPORT_HEALER: ArchetypeTemplate = {
    id: 'support_healer',
    name: 'Healer',
    description: 'Maximum regen and HP. Passive healing focus.',
    category: 'Support',
    allocation: withAllocationDefaults({
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
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'heal', 'sustain'],
    version: '1.0.0'
};

/**
 * Support Bulwark shield specialist—wrap allocation with withAllocationDefaults for zeroed residual stats.
 */
export const SUPPORT_BULWARK: ArchetypeTemplate = {
    id: 'support_bulwark',
    name: 'Bulwark',
    description: 'Shield-focused support. Protects with ward.',
    category: 'Support',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['defensive', 'shield', 'ward'],
    version: '1.0.0'
};

// === HYBRID ARCHETYPE (1) ===

/**
 * Hybrid Allrounder generalist. withAllocationDefaults keeps the stat grid balanced even when values shift.
 */
export const HYBRID_ALLROUNDER: ArchetypeTemplate = {
    id: 'hybrid_allrounder',
    name: 'Allrounder',
    description: 'Jack of all trades. Even distribution across all stats.',
    category: 'Hybrid',
    allocation: withAllocationDefaults({
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
        penPercent: 0,
    }),
    minBudget: 20,
    maxBudget: 100,
    tags: ['balanced', 'hybrid', 'versatile'],
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
    DPS_ARMORBREAKER,
    DPS_BERSERKER,
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
