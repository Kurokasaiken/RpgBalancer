/**
 * Archetype Seeds Configuration
 * 
 * Configuration for stress testing archetype generation including
 * incompatible stat pairs and generation parameters.
 */

/**
 * Incompatible stat combinations that should not be paired
 * in stress testing due to gameplay or balance considerations
 */
export const INCOMPATIBLE_STAT_PAIRS: Array<[string, string]> = [
  // Defensive + offensive combinations (direct conflicts)
  ['hp', 'damage'],
  ['armor', 'damage'],
  ['hp', 'crit'],
  ['armor', 'crit'],
  
  // Speed + defensive (gameplay balance - speed vs tankiness)
  ['speed', 'armor'],
  ['speed', 'hp'],
  ['speed', 'resistance'],
  
  // Accuracy + evasion (redundancy)
  ['hit_chance', 'dodge'],
  ['crit_chance', 'dodge'],
  ['accuracy', 'evasion'],
  
  // Resource management conflicts
  ['mana_regen', 'mana_cost'],
  ['stamina_regen', 'stamina_cost'],
  
  // Crowd control combinations (redundancy)
  ['stun_duration', 'slow_duration'],
  ['freeze_duration', 'slow_duration'],
  
  // Healing + damage (mixed roles)
  ['healing_power', 'damage'],
  ['healing_power', 'crit'],
];

/**
 * Synergy multiplier configurations for stat combinations
 * Values > 1.0 indicate positive synergy, < 1.0 indicate negative synergy
 */
export const SYNERGY_MULTIPLIERS: Record<string, Record<string, number>> = {
  // Positive synergies (multiplicative bonuses)
  'damage': {
    'crit': 1.15,      // Crit damage boosts raw damage
    'accuracy': 1.08,  // Accuracy improves damage reliability
  },
  'armor': {
    'resistance': 1.12, // Armor + resistance for tank builds
    'hp': 1.10,         // HP scales with armor
  },
  'speed': {
    'dodge': 1.20,     // Speed enables dodge
    'hit_chance': 1.15, // Speed improves accuracy
  },
  
  // Negative synergies (diminishing returns)
  'dodge': {
    'armor': 0.85,     // Dodge vs armor tradeoff
    'resistance': 0.90, // Dodge vs resistance tradeoff
  },
};

/**
 * Stat category groupings for balanced archetype generation
 */
export const STAT_CATEGORIES = {
  offensive: ['damage', 'crit', 'accuracy', 'attack_speed'],
  defensive: ['hp', 'armor', 'resistance', 'dodge'],
  utility: ['speed', 'mana_regen', 'stamina_regen', 'healing_power'],
  precision: ['hit_chance', 'crit_chance', 'accuracy', 'evasion'],
};

/**
 * Stress testing generation configuration
 */
export interface ArchetypeSeedConfig {
  /** Base points multiplier for stat adjustments */
  pointsPerWeight: number;
  /** Default random seed for deterministic generation */
  defaultSeed: number;
  /** Include pair-stat combinations */
  includePairs: boolean;
  /** Filter out derived stats */
  excludeDerived: boolean;
  /** Minimum weight threshold for inclusion */
  minWeight: number;
  /** Maximum number of pair combinations (to limit combinatorial explosion) */
  maxPairs?: number;
  /** Use synergy multipliers for pair generation */
  useSynergyMultipliers: boolean;
  /** Minimum synergy threshold for pair inclusion */
  minSynergyThreshold: number;
  /** Exclude incompatible stat pairs */
  excludeIncompatiblePairs: boolean;
}

/**
 * Default configuration for archetype seed generation
 */
export const DEFAULT_ARCHETYPE_CONFIG: ArchetypeSeedConfig = {
  pointsPerWeight: 25,
  defaultSeed: 12345,
  includePairs: true,
  excludeDerived: true,
  minWeight: 0.1,
  maxPairs: 50, // Limit to prevent too many combinations
  useSynergyMultipliers: true,
  minSynergyThreshold: 0.95, // Include pairs with neutral or positive synergy
  excludeIncompatiblePairs: true,
};

/**
 * Export configuration for generated archetypes
 */
export interface ArchetypeExportConfig {
  /** Export file path */
  path: string;
  /** Export format */
  format: 'json' | 'csv';
  /** Include metadata */
  includeMetadata: boolean;
  /** Include baseline archetype */
  includeBaseline: boolean;
  /** Include synergy analysis */
  includeSynergyAnalysis: boolean;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ArchetypeExportConfig = {
  path: '/data/exports/stressTesting/archetypes.json',
  format: 'json',
  includeMetadata: true,
  includeBaseline: true,
  includeSynergyAnalysis: true,
};

/**
 * Complete stress testing configuration
 */
export interface StressTestConfig {
  /** Archetype generation settings */
  archetype: ArchetypeSeedConfig;
  /** Export settings */
  export: ArchetypeExportConfig;
  /** Logging configuration */
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeStats: boolean;
  };
}

/**
 * Default complete configuration
 */
export const DEFAULT_STRESS_TEST_CONFIG: StressTestConfig = {
  archetype: DEFAULT_ARCHETYPE_CONFIG,
  export: DEFAULT_EXPORT_CONFIG,
  logging: {
    enabled: true,
    level: 'info',
    includeStats: true,
  },
};

/**
 * Helper functions for synergy analysis
 */
export function getSynergyMultiplier(stat1: string, stat2: string): number {
  return SYNERGY_MULTIPLIERS[stat1]?.[stat2] ?? 
         SYNERGY_MULTIPLIERS[stat2]?.[stat1] ?? 
         1.0; // Neutral synergy
}

export function areStatsIncompatible(stat1: string, stat2: string): boolean {
  return INCOMPATIBLE_STAT_PAIRS.some(([a, b]) => 
    (a === stat1 && b === stat2) || (a === stat2 && b === stat1)
  );
}

export function getStatCategory(statId: string): string | null {
  for (const [category, stats] of Object.entries(STAT_CATEGORIES)) {
    if (stats.includes(statId)) {
      return category;
    }
  }
  return null;
}
