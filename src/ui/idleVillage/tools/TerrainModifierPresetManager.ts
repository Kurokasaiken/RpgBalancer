/**
 * NP-092 – Terrain Modifier Preset Manager
 *
 * Specialized preset management system for terrain modifier configurations.
 * Provides categorized presets, template management, and batch operations.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { TerrainModifierConfigTool, type TerrainModifierPreset } from './TerrainModifierConfigTool';
import {
  DEFAULT_TERRAIN_MODIFIERS,
  DEFAULT_TERRAIN_LAYERS,
  type TerrainModifierDefinition,
  type TerrainModifierLayerConfig,
} from '@/ui/idleVillage/config/terrainModifierConfig';

/**
 * Preset category for organization
 */
export enum PresetCategory {
  ENVIRONMENT = 'environment',
  STRUCTURES = 'structures',
  EVENTS = 'events',
  BALANCED = 'balanced',
  CHALLENGING = 'challenging',
  CUSTOM = 'custom',
}

/**
 * Preset template for common configurations
 */
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  baseModifiers: TerrainModifierDefinition[];
  layerOverrides?: Partial<TerrainModifierLayerConfig>[];
  tags: string[];
}

/**
 * Preset collection metadata
 */
export interface PresetCollection {
  id: string;
  name: string;
  description: string;
  presets: string[]; // Preset IDs
  category: PresetCategory;
  createdAt: string;
  updatedAt: string;
}

/**
 * Terrain Modifier Preset Manager
 */
export class TerrainModifierPresetManager {
  private configTool: TerrainModifierConfigTool;
  private collections: Map<string, PresetCollection> = new Map();

  constructor(configTool: TerrainModifierConfigTool) {
    this.configTool = configTool;
    this.initializeDefaultCollections();
  }

  /**
   * Initialize default preset collections
   */
  private initializeDefaultCollections(): void {
    // Environment presets
    this.createCollection('environment-basics', 'Environment Basics', 'Basic environmental terrain modifiers', [
      this.createEnvironmentPreset('forest-dense', 'Dense Forest', 'Heavy forest with movement penalties but safety bonuses'),
      this.createEnvironmentPreset('swamp-hazardous', 'Hazardous Swamp', 'Dangerous swamp with high risk but production penalties'),
      this.createEnvironmentPreset('mountain-peaks', 'Mountain Peaks', 'High altitude with mobility challenges'),
    ], PresetCategory.ENVIRONMENT);

    // Structure presets
    this.createCollection('structures-economic', 'Economic Structures', 'Structures focused on economic benefits', [
      this.createStructurePreset('market-district', 'Market District', 'Multiple markets for production bonuses'),
      this.createStructurePreset('warehouse-complex', 'Warehouse Complex', 'Storage facilities with risk reduction'),
      this.createStructurePreset('guard-towers', 'Guard Towers', 'Security structures reducing risk'),
    ], PresetCategory.STRUCTURES);

    // Event presets
    this.createCollection('events-seasonal', 'Seasonal Events', 'Time-limited seasonal modifiers', [
      this.createEventPreset('winter-storm', 'Winter Storm', 'Cold weather with mobility and risk penalties'),
      this.createEventPreset('festival-celebration', 'Festival Celebration', 'Festive events with production bonuses'),
      this.createEventPreset('drought-season', 'Drought Season', 'Dry conditions affecting production'),
    ], PresetCategory.EVENTS);

    // Balanced presets
    this.createCollection('balanced-mixed', 'Balanced Mixed', 'Well-balanced modifier combinations', [
      this.createBalancedPreset('village-standard', 'Village Standard', 'Standard village setup with balanced modifiers'),
      this.createBalancedPreset('outpost-remote', 'Remote Outpost', 'Isolated location with survival challenges'),
      this.createBalancedPreset('trading-hub', 'Trading Hub', 'Commercial center with economic focus'),
    ], PresetCategory.BALANCED);
  }

  /**
   * Create environment preset
   */
  private createEnvironmentPreset(id: string, name: string, description: string): TerrainModifierPreset {
    const modifiers: TerrainModifierDefinition[] = [
      {
        id: `${id}-barrier`,
        label: `${name} Barrier`,
        description: `Movement barrier from ${name.toLowerCase()}`,
        slotIds: ['village_gate', 'forest_path'],
        effectType: 'mobility',
        magnitude: -0.2,
        color: 'rgba(34, 197, 94, 0.6)',
        intensity: 0.7,
        layerId: 'environment',
        pattern: 'diagonal',
        isEnabled: true,
      },
      {
        id: `${id}-cover`,
        label: `${name} Cover`,
        description: `Protective cover from ${name.toLowerCase()}`,
        slotIds: ['village_square', 'guard_post'],
        effectType: 'risk',
        magnitude: -0.15,
        color: 'rgba(34, 197, 94, 0.5)',
        intensity: 0.6,
        layerId: 'environment',
        pattern: 'solid',
        isEnabled: true,
      },
    ];

    return this.configTool.createPreset(
      id,
      name,
      description,
      modifiers,
      DEFAULT_TERRAIN_LAYERS,
      ['environment', id.split('-')[0]]
    );
  }

  /**
   * Create structure preset
   */
  private createStructurePreset(id: string, name: string, description: string): TerrainModifierPreset {
    const modifiers: TerrainModifierDefinition[] = [
      {
        id: `${id}-boost`,
        label: `${name} Boost`,
        description: `Production boost from ${name.toLowerCase()}`,
        slotIds: ['village_market', 'workshop'],
        effectType: 'production',
        magnitude: 0.25,
        color: 'rgba(201, 162, 39, 0.7)',
        intensity: 0.8,
        layerId: 'structures',
        pattern: 'dots',
        isEnabled: true,
      },
      {
        id: `${id}-stability`,
        label: `${name} Stability`,
        description: `Risk reduction from ${name.toLowerCase()}`,
        slotIds: ['village_square', 'storage_barn'],
        effectType: 'risk',
        magnitude: -0.2,
        color: 'rgba(201, 162, 39, 0.6)',
        intensity: 0.7,
        layerId: 'structures',
        pattern: 'grid',
        isEnabled: true,
      },
    ];

    return this.configTool.createPreset(
      id,
      name,
      description,
      modifiers,
      DEFAULT_TERRAIN_LAYERS,
      ['structures', id.split('-')[0]]
    );
  }

  /**
   * Create event preset
   */
  private createEventPreset(id: string, name: string, description: string): TerrainModifierPreset {
    const modifiers: TerrainModifierDefinition[] = [
      {
        id: `${id}-effect`,
        label: `${name} Effect`,
        description: `Temporary effect from ${name.toLowerCase()}`,
        slotIds: ['village_square', 'village_gate'],
        effectType: 'production', // Varies by event
        magnitude: Math.random() > 0.5 ? 0.15 : -0.15, // Random positive/negative
        color: 'rgba(231, 111, 81, 0.65)',
        intensity: 0.75,
        layerId: 'events',
        pattern: 'solid',
        isEnabled: true,
      },
    ];

    return this.configTool.createPreset(
      id,
      name,
      description,
      modifiers,
      DEFAULT_TERRAIN_LAYERS,
      ['events', 'temporary', id.split('-')[0]]
    );
  }

  /**
   * Create balanced preset
   */
  private createBalancedPreset(id: string, name: string, description: string): TerrainModifierPreset {
    const modifiers: TerrainModifierDefinition[] = [
      {
        id: `${id}-production`,
        label: `${name} Production`,
        description: 'Balanced production modifier',
        slotIds: ['village_market', 'workshop'],
        effectType: 'production',
        magnitude: 0.1,
        color: 'rgba(52, 152, 219, 0.6)',
        intensity: 0.6,
        layerId: 'structures',
        pattern: 'dots',
        isEnabled: true,
      },
      {
        id: `${id}-safety`,
        label: `${name} Safety`,
        description: 'Balanced safety modifier',
        slotIds: ['village_square', 'guard_post'],
        effectType: 'risk',
        magnitude: -0.1,
        color: 'rgba(52, 152, 219, 0.5)',
        intensity: 0.5,
        layerId: 'environment',
        pattern: 'diagonal',
        isEnabled: true,
      },
      {
        id: `${id}-mobility`,
        label: `${name} Mobility`,
        description: 'Balanced mobility modifier',
        slotIds: ['village_gate', 'forest_path'],
        effectType: 'mobility',
        magnitude: 0.05,
        color: 'rgba(52, 152, 219, 0.55)',
        intensity: 0.55,
        layerId: 'environment',
        pattern: 'grid',
        isEnabled: true,
      },
    ];

    return this.configTool.createPreset(
      id,
      name,
      description,
      modifiers,
      DEFAULT_TERRAIN_LAYERS,
      ['balanced', id.split('-')[1]]
    );
  }

  /**
   * Create a new preset collection
   */
  createCollection(
    id: string,
    name: string,
    description: string,
    presets: TerrainModifierPreset[],
    category: PresetCategory
  ): PresetCollection {
    const collection: PresetCollection = {
      id,
      name,
      description,
      presets: presets.map(p => p.id),
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.collections.set(id, collection);

    // Create the presets in the config tool
    for (const preset of presets) {
      this.configTool.createPreset(preset.id, preset.name, preset.description, preset.modifiers, preset.layers, preset.tags);
    }

    return collection;
  }

  /**
   * Get collection by ID
   */
  getCollection(id: string): PresetCollection | undefined {
    return this.collections.get(id);
  }

  /**
   * Get all collections
   */
  getAllCollections(): PresetCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Get collections by category
   */
  getCollectionsByCategory(category: PresetCategory): PresetCollection[] {
    return Array.from(this.collections.values()).filter(c => c.category === category);
  }

  /**
   * Get presets in a collection
   */
  getPresetsInCollection(collectionId: string): TerrainModifierPreset[] {
    const collection = this.collections.get(collectionId);
    if (!collection) return [];

    return collection.presets
      .map(id => this.configTool.getPreset(id))
      .filter(Boolean) as TerrainModifierPreset[];
  }

  /**
   * Apply preset to configuration
   */
  applyPreset(presetId: string, targetConfig?: any): any {
    const preset = this.configTool.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    // If no target config provided, create from defaults
    if (!targetConfig) {
      targetConfig = {
        modifiers: [...DEFAULT_TERRAIN_MODIFIERS],
        layers: [...DEFAULT_TERRAIN_LAYERS],
      };
    }

    // Apply preset modifiers (merge with existing)
    const existingModifierIds = new Set(targetConfig.modifiers.map((m: any) => m.id));
    for (const modifier of preset.modifiers) {
      if (!existingModifierIds.has(modifier.id)) {
        targetConfig.modifiers.push(modifier);
      }
    }

    // Apply preset layers (override existing)
    const layerMap = new Map(targetConfig.layers.map((l: any) => [l.id, l]));
    for (const layer of preset.layers) {
      layerMap.set(layer.id, layer);
    }
    targetConfig.layers = Array.from(layerMap.values());

    return targetConfig;
  }

  /**
   * Create custom preset from existing configuration
   */
  createCustomPreset(
    config: any,
    id: string,
    name: string,
    description: string,
    tags: string[] = []
  ): TerrainModifierPreset {
    return this.configTool.createPreset(
      id,
      name,
      description,
      config.modifiers || [],
      config.layers || DEFAULT_TERRAIN_LAYERS,
      ['custom', ...tags]
    );
  }

  /**
   * Generate preset variations
   */
  generatePresetVariations(basePresetId: string, variations: Array<{
    id: string;
    name: string;
    modifications: Array<{
      modifierId: string;
      updates: Partial<TerrainModifierDefinition>;
    }>;
  }>): TerrainModifierPreset[] {
    const basePreset = this.configTool.getPreset(basePresetId);
    if (!basePreset) {
      throw new Error(`Base preset not found: ${basePresetId}`);
    }

    const variationsCreated: TerrainModifierPreset[] = [];

    for (const variation of variations) {
      const modifiedModifiers = basePreset.modifiers.map(modifier => {
        const modification = variation.modifications.find(m => m.modifierId === modifier.id);
        if (modification) {
          return { ...modifier, ...modification.updates };
        }
        return modifier;
      });

      const variationPreset = this.configTool.createPreset(
        variation.id,
        variation.name,
        `${basePreset.description} - ${variation.name}`,
        modifiedModifiers,
        basePreset.layers,
        [...basePreset.tags, 'variation']
      );

      variationsCreated.push(variationPreset);
    }

    return variationsCreated;
  }

  /**
   * Optimize preset for specific use case
   */
  optimizePreset(
    presetId: string,
    optimization: {
      type: 'performance' | 'balance' | 'challenge';
      targetSlots?: string[];
      intensity?: number;
    }
  ): TerrainModifierPreset | null {
    const preset = this.configTool.getPreset(presetId);
    if (!preset) return null;

    const optimizedModifiers = preset.modifiers.map(modifier => {
      const optimized = { ...modifier };

      // Filter by target slots if specified
      if (optimization.targetSlots && optimization.targetSlots.length > 0) {
        optimized.slotIds = optimized.slotIds.filter(slotId =>
          optimization.targetSlots!.includes(slotId)
        );
        if (optimized.slotIds.length === 0) return null; // Remove modifier if no slots match
      }

      // Adjust intensity
      if (optimization.intensity !== undefined) {
        optimized.intensity = Math.max(0, Math.min(1,
          optimized.intensity * optimization.intensity
        ));
        optimized.magnitude = Math.max(-1, Math.min(1,
          optimized.magnitude * optimization.intensity
        ));
      }

      // Type-specific optimizations
      switch (optimization.type) {
        case 'performance':
          if (optimized.effectType === 'production') {
            optimized.magnitude = Math.min(1, optimized.magnitude * 1.2);
          }
          break;
        case 'balance':
          optimized.magnitude = Math.max(-0.5, Math.min(0.5, optimized.magnitude));
          break;
        case 'challenge':
          if (optimized.effectType === 'risk') {
            optimized.magnitude = Math.max(-1, optimized.magnitude * 1.5);
          }
          break;
      }

      return optimized;
    }).filter(Boolean) as TerrainModifierDefinition[];

    return this.configTool.createPreset(
      `${presetId}-optimized-${optimization.type}`,
      `${preset.name} (${optimization.type})`,
      `${preset.description} - Optimized for ${optimization.type}`,
      optimizedModifiers,
      preset.layers,
      [...preset.tags, 'optimized', optimization.type]
    );
  }

  /**
   * Export collection as template
   */
  exportCollectionAsTemplate(collectionId: string): PresetTemplate[] {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection not found: ${collectionId}`);
    }

    const templates: PresetTemplate[] = [];

    for (const presetId of collection.presets) {
      const preset = this.configTool.getPreset(presetId);
      if (preset) {
        templates.push({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          category: collection.category,
          baseModifiers: preset.modifiers,
          layerOverrides: preset.layers,
          tags: preset.tags,
        });
      }
    }

    return templates;
  }

  /**
   * Analyze preset compatibility
   */
  analyzePresetCompatibility(presetIds: string[]): {
    compatible: boolean;
    conflicts: Array<{
      type: 'slot_conflict' | 'effect_conflict' | 'layer_conflict';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  } {
    const presets = presetIds.map(id => this.configTool.getPreset(id)).filter(Boolean) as TerrainModifierPreset[];
    const conflicts: Array<{
      type: 'slot_conflict' | 'effect_conflict' | 'layer_conflict';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];
    const recommendations: string[] = [];

    // Check for slot conflicts (multiple modifiers on same slot with same effect type)
    const slotEffectMap = new Map<string, Set<string>>();
    for (const preset of presets) {
      for (const modifier of preset.modifiers) {
        for (const slotId of modifier.slotIds) {
          const key = `${slotId}-${modifier.effectType}`;
          if (!slotEffectMap.has(key)) {
            slotEffectMap.set(key, new Set());
          }
          slotEffectMap.get(key)!.add(preset.id);
        }
      }
    }

    for (const [key, presetSet] of slotEffectMap) {
      if (presetSet.size > 1) {
        const [slotId, effectType] = key.split('-');
        conflicts.push({
          type: 'slot_conflict',
          description: `Multiple presets affect ${slotId} with ${effectType} effects: ${Array.from(presetSet).join(', ')}`,
          severity: 'medium',
        });
      }
    }

    // Check for extreme magnitude combinations
    const slotMagnitudes = new Map<string, number>();
    for (const preset of presets) {
      for (const modifier of preset.modifiers) {
        for (const slotId of modifier.slotIds) {
          const key = `${slotId}-${modifier.effectType}`;
          slotMagnitudes.set(key, (slotMagnitudes.get(key) || 0) + modifier.magnitude);
        }
      }
    }

    for (const [key, totalMagnitude] of slotMagnitudes) {
      if (Math.abs(totalMagnitude) > 1.5) {
        conflicts.push({
          type: 'effect_conflict',
          description: `Extreme combined effect on ${key}: ${totalMagnitude.toFixed(2)}`,
          severity: totalMagnitude > 2 ? 'high' : 'medium',
        });
      }
    }

    // Generate recommendations
    if (conflicts.length === 0) {
      recommendations.push('All presets are compatible');
    } else {
      recommendations.push('Consider adjusting modifier magnitudes to avoid extreme effects');
      recommendations.push('Review slot assignments to prevent overcrowding');
    }

    return {
      compatible: conflicts.filter(c => c.severity === 'high').length === 0,
      conflicts,
      recommendations,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics(): {
    totalCollections: number;
    totalPresets: number;
    presetsByCategory: Record<PresetCategory, number>;
    mostUsedTags: Array<{ tag: string; count: number }>;
    averageModifiersPerPreset: number;
  } {
    const allPresets = this.configTool.getAllPresets();
    const presetsByCategory: Record<PresetCategory, number> = {
      [PresetCategory.ENVIRONMENT]: 0,
      [PresetCategory.STRUCTURES]: 0,
      [PresetCategory.EVENTS]: 0,
      [PresetCategory.BALANCED]: 0,
      [PresetCategory.CHALLENGING]: 0,
      [PresetCategory.CUSTOM]: 0,
    };

    const tagCounts = new Map<string, number>();
    let totalModifiers = 0;

    for (const preset of allPresets) {
      // Count by category
      const category = this.getPresetCategory(preset);
      presetsByCategory[category]++;

      // Count tags
      for (const tag of preset.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }

      totalModifiers += preset.modifiers.length;
    }

    const mostUsedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalCollections: this.collections.size,
      totalPresets: allPresets.length,
      presetsByCategory,
      mostUsedTags,
      averageModifiersPerPreset: allPresets.length > 0 ? totalModifiers / allPresets.length : 0,
    };
  }

  /**
   * Get preset category based on tags
   */
  private getPresetCategory(preset: TerrainModifierPreset): PresetCategory {
    for (const tag of preset.tags) {
      switch (tag) {
        case 'environment': return PresetCategory.ENVIRONMENT;
        case 'structures': return PresetCategory.STRUCTURES;
        case 'events': return PresetCategory.EVENTS;
        case 'balanced': return PresetCategory.BALANCED;
        case 'challenging': return PresetCategory.CHALLENGING;
      }
    }
    return PresetCategory.CUSTOM;
  }
}
