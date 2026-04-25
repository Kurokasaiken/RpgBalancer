/**
 * STS Scenario Serializer
 * 
 * Serializes STS scenario configurations for external tactics tools.
 * Converts tick {value, weight} system to CLI-compatible payloads.
 */

import { z } from 'zod';
import type { ScenarioConfig, ScenarioResult } from './ScenarioConfig';

/**
 * Serialized scenario format for external tools
 */
export interface SerializedScenario {
  id: string;
  name: string;
  description: string;
  version: string;
  archetype: string;
  enemyProfile: {
    name: string;
    hp: number;
    damage: number;
    defense: number;
    speed: number;
    special: string[];
  };
  budget: {
    hpEq: number;
    damageEq: number;
    total: number;
  };
  targetTurns: number;
  ticks: SerializedTick[];
  metadata: {
    exportedAt: string;
    exportedBy: 'sts-scenario-exporter';
    formatVersion: string;
    sourceConfig: string;
  };
}

/**
 * Serialized tick format
 */
export interface SerializedTick {
  turn: number;
  value: number;
  weight: number;
  type: 'damage' | 'defense' | 'utility' | 'special';
  description: string;
}

/**
 * Export bundle containing multiple scenarios
 */
export interface ScenarioExportBundle {
  bundleInfo: {
    name: string;
    description: string;
    version: string;
    exportedAt: string;
    totalScenarios: number;
    filters: ExportFilters;
  };
  scenarios: SerializedScenario[];
  summary: {
    archetypes: string[];
    averageTargetTurns: number;
    totalBudget: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

/**
 * Export filters
 */
export interface ExportFilters {
  archetypes: string[];
  minTargetTurns?: number;
  maxTargetTurns?: number;
  minBudget?: number;
  maxBudget?: number;
  enemyTypes: string[];
  includeResults: boolean;
}

/**
 * Zod schemas for validation
 */
export const SerializedTickSchema = z.object({
  turn: z.number().min(1).max(999),
  value: z.number().min(0).max(1000),
  weight: z.number().min(0.1).max(10),
  type: z.enum(['damage', 'defense', 'utility', 'special']),
  description: z.string().min(1).max(200),
});

export const SerializedScenarioSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  archetype: z.string().min(1).max(50),
  enemyProfile: z.object({
    name: z.string().min(1).max(100),
    hp: z.number().min(1).max(9999),
    damage: z.number().min(0).max(999),
    defense: z.number().min(0).max(999),
    speed: z.number().min(1).max(999),
    special: z.array(z.string().min(1).max(50)).max(10),
  }),
  budget: z.object({
    hpEq: z.number().min(0),
    damageEq: z.number().min(0),
    total: z.number().min(0),
  }),
  targetTurns: z.number().min(1).max(999),
  ticks: z.array(SerializedTickSchema).min(1).max(100),
  metadata: z.object({
    exportedAt: z.string().datetime(),
    exportedBy: z.literal('sts-scenario-exporter'),
    formatVersion: z.string(),
    sourceConfig: z.string(),
  }),
});

export const ScenarioExportBundleSchema = z.object({
  bundleInfo: z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    exportedAt: z.string().datetime(),
    totalScenarios: z.number().min(1).max(1000),
    filters: z.object({
      archetypes: z.array(z.string()).max(20),
      minTargetTurns: z.number().min(1).max(999).optional(),
      maxTargetTurns: z.number().min(1).max(999).optional(),
      minBudget: z.number().min(0).optional(),
      maxBudget: z.number().min(0).optional(),
      enemyTypes: z.array(z.string()).max(20),
      includeResults: z.boolean(),
    }),
  }),
  scenarios: z.array(SerializedScenarioSchema).min(1).max(1000),
  summary: z.object({
    archetypes: z.array(z.string()).max(20),
    averageTargetTurns: z.number().min(1).max(999),
    totalBudget: z.number().min(0),
    complexity: z.enum(['low', 'medium', 'high']),
  }),
});

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportFilters = {
  archetypes: ['basic-1v1', 'boss-fight', 'group-combat', 'swarm-horde'],
  enemyTypes: ['guard', 'cultist', 'louse', 'slime'],
  includeResults: true,
};

/**
 * STS Scenario Serializer
 * 
 * Converts internal scenario configurations to CLI-compatible payloads
 * for external tactics tools.
 */
export class ScenarioSerializer {
  private formatVersion: string;

  constructor(formatVersion: string = '1.0.0') {
    this.formatVersion = formatVersion;
  }

  /**
   * Serialize a single scenario
   */
  serializeScenario(
    scenario: ScenarioConfig,
    result?: ScenarioResult
  ): SerializedScenario {
    const now = new Date().toISOString();

    // Convert scenario ticks to serialized format
    const ticks = this.convertTicks(scenario);

    const serialized: SerializedScenario = {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      version: '1.0.0',
      archetype: scenario.archetype,
      enemyProfile: {
        name: scenario.enemyProfile.name,
        hp: scenario.enemyProfile.hp,
        damage: scenario.enemyProfile.damage,
        defense: scenario.enemyProfile.defense,
        speed: scenario.enemyProfile.speed,
        special: scenario.enemyProfile.special || [],
      },
      budget: {
        hpEq: scenario.budget.hpEq,
        damageEq: scenario.budget.damageEq,
        total: scenario.budget.hpEq + scenario.budget.damageEq,
      },
      targetTurns: scenario.targetTurns || 20,
      ticks,
      metadata: {
        exportedAt: now,
        exportedBy: 'sts-scenario-exporter',
        formatVersion: this.formatVersion,
        sourceConfig: scenario.id,
      },
    };

    // Add result data if available
    if (result && DEFAULT_EXPORT_CONFIG.includeResults) {
      // Add result metadata to ticks
      result.damageCurve?.forEach((damage, index) => {
        if (ticks[index]) {
          ticks[index].value = damage;
        }
      });
    }

    return serialized;
  }

  /**
   * Serialize multiple scenarios into a bundle
   */
  serializeBundle(
    scenarios: Array<{ scenario: ScenarioConfig; result?: ScenarioResult }>,
    filters: ExportFilters = DEFAULT_EXPORT_CONFIG,
    bundleName: string = 'sts-scenarios'
  ): ScenarioExportBundle {
    const now = new Date().toISOString();
    
    // Apply filters
    const filteredScenarios = this.applyFilters(scenarios, filters);
    
    // Serialize each scenario
    const serializedScenarios = filteredScenarios.map(({ scenario, result }) =>
      this.serializeScenario(scenario, result)
    );

    // Calculate summary statistics
    const archetypes = [...new Set(serializedScenarios.map(s => s.archetype))];
    const averageTargetTurns = serializedScenarios.reduce(
      (sum, s) => sum + s.targetTurns, 0
    ) / serializedScenarios.length;
    const totalBudget = serializedScenarios.reduce(
      (sum, s) => sum + s.budget.total, 0
    );

    // Determine complexity
    const complexity = this.calculateComplexity(serializedScenarios);

    const bundle: ScenarioExportBundle = {
      bundleInfo: {
        name: bundleName,
        description: `STS scenario export bundle with ${serializedScenarios.length} scenarios`,
        version: '1.0.0',
        exportedAt: now,
        totalScenarios: serializedScenarios.length,
        filters,
      },
      scenarios: serializedScenarios,
      summary: {
        archetypes,
        averageTargetTurns: Math.round(averageTargetTurns * 100) / 100,
        totalBudget,
        complexity,
      },
    };

    return bundle;
  }

  /**
   * Convert scenario ticks to serialized format
   */
  private convertTicks(scenario: ScenarioConfig): SerializedTick[] {
    const ticks: SerializedTick[] = [];

    // Generate ticks based on scenario duration and complexity
    const duration = scenario.targetTurns || 20;
    const complexity = this.getScenarioComplexity(scenario);

    for (let turn = 1; turn <= duration; turn++) {
      const tick = this.generateTick(turn, scenario, complexity);
      ticks.push(tick);
    }

    return ticks;
  }

  /**
   * Generate a single tick
   */
  private generateTick(
    turn: number,
    scenario: ScenarioConfig,
    complexity: 'low' | 'medium' | 'high'
  ): SerializedTick {
    const baseValue = this.calculateBaseValue(scenario, turn);
    const weight = this.calculateWeight(scenario, turn, complexity);
    const type = this.determineTickType(scenario, turn);
    const description = this.generateTickDescription(scenario, turn, type);

    return {
      turn,
      value: Math.round(baseValue * 100) / 100,
      weight: Math.round(weight * 100) / 100,
      type,
      description,
    };
  }

  /**
   * Calculate base value for a tick
   */
  private calculateBaseValue(scenario: ScenarioConfig, turn: number): number {
    const { enemyProfile, budget } = scenario;
    
    // Base damage calculation
    const baseDamage = enemyProfile.damage * (1 + turn * 0.1);
    const damageComponent = baseDamage * 0.7; // 70% damage
    
    // Defense component
    const defenseComponent = enemyProfile.defense * 0.2; // 20% defense
    
    // Utility component (buffs, debuffs, etc.)
    const utilityComponent = budget.damageEq * 0.1; // 10% utility
    
    return damageComponent + defenseComponent + utilityComponent;
  }

  /**
   * Calculate weight for a tick
   */
  private calculateWeight(
    scenario: ScenarioConfig,
    turn: number,
    complexity: 'low' | 'medium' | 'high'
  ): number {
    const baseWeight = 1.0;
    
    // Complexity multiplier
    const complexityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
    }[complexity];

    // Turn-based variation (early turns have higher weight)
    const turnMultiplier = Math.max(0.5, 1.5 - (turn - 1) * 0.05);

    // Enemy type modifier
    const enemyModifier = this.getEnemyWeightModifier(scenario.enemyProfile.name);

    return baseWeight * complexityMultiplier * turnMultiplier * enemyModifier;
  }

  /**
   * Determine tick type
   */
  private determineTickType(scenario: ScenarioConfig, turn: number): 'damage' | 'defense' | 'utility' | 'special' {
    const { enemyProfile } = scenario;
    
    // Early turns: more damage
    if (turn <= 5) {
      return 'damage';
    }
    
    // Mid turns: mix of damage and defense
    if (turn <= 15) {
      return turn % 2 === 0 ? 'defense' : 'damage';
    }
    
    // Late turns: more utility and special
    if (enemyProfile.special && enemyProfile.special.length > 0) {
      return turn % 3 === 0 ? 'special' : 'utility';
    }
    
    return 'utility';
  }

  /**
   * Generate tick description
   */
  private generateTickDescription(
    scenario: ScenarioConfig,
    turn: number,
    type: 'damage' | 'defense' | 'utility' | 'special'
  ): string {
    const { enemyProfile } = scenario;
    
    switch (type) {
      case 'damage':
        return `Turn ${turn}: ${enemyProfile.name} deals damage`;
      case 'defense':
        return `Turn ${turn}: ${enemyProfile.name} defensive action`;
      case 'utility':
        return `Turn ${turn}: ${enemyProfile.name} utility action`;
      case 'special': {
        const special = enemyProfile.special?.[0] || 'special ability';
        return `Turn ${turn}: ${enemyProfile.name} uses ${special}`;
      }
      default:
        return `Turn ${turn}: ${enemyProfile.name} action`;
    }
  }

  /**
   * Get scenario complexity
   */
  private getScenarioComplexity(scenario: ScenarioConfig): 'low' | 'medium' | 'high' {
    const { enemyProfile, budget } = scenario;
    
    // Calculate complexity score
    let score = 0;
    
    // Enemy stats contribution
    score += enemyProfile.hp / 100;
    score += enemyProfile.damage / 10;
    score += enemyProfile.defense / 10;
    score += enemyProfile.speed / 10;
    
    // Budget contribution
    score += budget.total / 50;
    
    // Special abilities contribution
    score += (enemyProfile.special?.length || 0) * 2;
    
    // Determine complexity
    if (score < 10) return 'low';
    if (score < 20) return 'medium';
    return 'high';
  }

  /**
   * Get enemy weight modifier
   */
  private getEnemyWeightModifier(enemyName: string): number {
    const modifiers: Record<string, number> = {
      'guard': 1.0,
      'cultist': 1.2,
      'louse': 0.8,
      'slime': 0.9,
      'jaw worm': 1.1,
      'fungus': 0.7,
    };
    
    return modifiers[enemyName] || 1.0;
  }

  /**
   * Apply filters to scenarios
   */
  private applyFilters(
    scenarios: Array<{ scenario: ScenarioConfig; result?: ScenarioResult }>,
    filters: ExportFilters
  ): Array<{ scenario: ScenarioConfig; result?: ScenarioResult }> {
    return scenarios.filter(({ scenario }) => {
      // Archetype filter
      if (filters.archetypes.length > 0 && !filters.archetypes.includes(scenario.archetype)) {
        return false;
      }
      
      // Target turns filter
      const targetTurns = scenario.targetTurns || 20;
      if (filters.minTargetTurns && targetTurns < filters.minTargetTurns) {
        return false;
      }
      if (filters.maxTargetTurns && targetTurns > filters.maxTargetTurns) {
        return false;
      }
      
      // Budget filter
      const totalBudget = scenario.budget.hpEq + scenario.budget.damageEq;
      if (filters.minBudget && totalBudget < filters.minBudget) {
        return false;
      }
      if (filters.maxBudget && totalBudget > filters.maxBudget) {
        return false;
      }
      
      // Enemy type filter
      if (filters.enemyTypes.length > 0 && !filters.enemyTypes.includes(scenario.enemyProfile.name)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate bundle complexity
   */
  private calculateComplexity(scenarios: SerializedScenario[]): 'low' | 'medium' | 'high' {
    const avgTicksPerScenario = scenarios.reduce((sum, s) => sum + s.ticks.length, 0) / scenarios.length;
    const avgBudget = scenarios.reduce((sum, s) => sum + s.budget.total, 0) / scenarios.length;
    
    let score = 0;
    score += avgTicksPerScenario / 10;
    score += avgBudget / 100;
    
    if (score < 3) return 'low';
    if (score < 6) return 'medium';
    return 'high';
  }

  /**
   * Validate serialized scenario
   */
  validateSerializedScenario(scenario: SerializedScenario): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      SerializedScenarioSchema.parse(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Custom validation rules
    if (scenario.ticks.length === 0) {
      errors.push('Scenario must have at least one tick');
    }

    if (scenario.ticks.length > 100) {
      errors.push('Scenario cannot have more than 100 ticks');
    }

    const totalWeight = scenario.ticks.reduce((sum, tick) => sum + tick.weight, 0);
    if (totalWeight > 50) {
      errors.push(`Total weight too high: ${totalWeight} (max 50)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate export bundle
   */
  validateBundle(bundle: ScenarioExportBundle): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      ScenarioExportBundleSchema.parse(bundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Custom validation rules
    if (bundle.scenarios.length === 0) {
      errors.push('Bundle must contain at least one scenario');
    }

    if (bundle.scenarios.length > 1000) {
      errors.push('Bundle cannot contain more than 1000 scenarios');
    }

    // Validate each scenario
    bundle.scenarios.forEach((scenario, index) => {
      const validation = this.validateSerializedScenario(scenario);
      if (!validation.valid) {
        errors.push(`Scenario ${index + 1} (${scenario.id}): ${validation.errors.join(', ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export to JSON string
   */
  exportToJSON(bundle: ScenarioExportBundle): string {
    const validation = this.validateBundle(bundle);
    if (!validation.valid) {
      throw new Error(`Invalid bundle: ${validation.errors.join(', ')}`);
    }

    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Export to CSV string
   */
  exportToCSV(bundle: ScenarioExportBundle): string {
    const headers = [
      'Scenario ID',
      'Name',
      'Archetype',
      'Enemy Name',
      'Enemy HP',
      'Enemy Damage',
      'Enemy Defense',
      'Enemy Speed',
      'Budget HP',
      'Budget Damage',
      'Total Budget',
      'Target Turns',
      'Tick Count',
      'Complexity',
    ];

    const rows = bundle.scenarios.map(scenario => [
      scenario.id,
      scenario.name,
      scenario.archetype,
      scenario.enemyProfile.name,
      scenario.enemyProfile.hp,
      scenario.enemyProfile.damage,
      scenario.enemyProfile.defense,
      scenario.enemyProfile.speed,
      scenario.budget.hpEq,
      scenario.budget.damageEq,
      scenario.budget.total,
      scenario.targetTurns,
      scenario.ticks.length,
      this.getScenarioComplexityFromSerialized(scenario),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get complexity from serialized scenario
   */
  private getScenarioComplexityFromSerialized(scenario: SerializedScenario): 'low' | 'medium' | 'high' {
    const avgWeight = scenario.ticks.reduce((sum, tick) => sum + tick.weight, 0) / scenario.ticks.length;
    const avgValue = scenario.ticks.reduce((sum, tick) => sum + tick.value, 0) / scenario.ticks.length;
    
    let score = 0;
    score += avgWeight / 2;
    score += avgValue / 50;
    
    if (score < 3) return 'low';
    if (score < 6) return 'medium';
    return 'high';
  }

  /**
   * Get format version
   */
  getFormatVersion(): string {
    return this.formatVersion;
  }

  /**
   * Update format version
   */
  updateFormatVersion(version: string): void {
    this.formatVersion = version;
  }
}
