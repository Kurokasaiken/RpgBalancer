/**
 * Preset Manager Configuration
 * 
 * Defines the structure for custom user presets including both style and physics settings.
 * Uses the generic PersistenceService for saving/loading.
 */

import { z } from 'zod';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { PresetId } from '../presets';
import type { StyleLabPreset } from '../tokens/defaultStyleLabPreset';
import { PRESET_PILLARS, type StyleLabPillar, isBuiltInPresetId } from '../presets/presetBridge';
import { schema as DemoConfigSchema, type DemoConfig } from './demoConfig';
import { PhysicsConfigSchema, type PhysicsConfig } from './physicsDefaults';

export type StyleLabPresetSnapshot = Partial<StyleLabPreset>;

const StylePresetSnapshotSchema: z.ZodType<StyleLabPresetSnapshot> = z.any();

/**
 * Custom preset structure combining style, physics, and demo configurations
 */
export const CustomPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['style', 'physics', 'combined']),
  createdAt: z.number(),
  updatedAt: z.number(),
  basePresetId: z.string().optional(),
  pillar: z.enum(['frontier', 'empire', 'wilderness']).default('frontier'),
  
  // Style configuration (optional for physics-only presets)
  styleConfig: StylePresetSnapshotSchema.optional(),
  
  // Physics configuration (optional for style-only presets)
  physicsConfig: PhysicsConfigSchema.optional(),
  
  // Demo configuration
  demoConfig: DemoConfigSchema.optional(),
});

export type CustomPreset = z.infer<typeof CustomPresetSchema>;

/**
 * Preset metadata for UI display
 */
export interface PresetMetadata {
  id: string;
  name: string;
  description?: string;
  type: 'style' | 'physics' | 'combined';
  pillar?: StyleLabPillar;
  basePresetId?: PresetId;
  createdAt: number;
  updatedAt: number;
  isBuiltIn: boolean;
}

/**
 * Storage keys
 */
export const PRESET_MANAGER_STORAGE_KEYS = {
  CUSTOM_PRESETS: 'stylelab_custom_presets',
  ACTIVE_PRESET: 'stylelab_active_preset',
} as const;

/**
 * Preset Manager Class
 * 
 * Handles CRUD operations for custom presets using PersistenceService
 */
export class PresetManager {
  /**
   * Save a custom preset
   */
  static async savePreset(preset: CustomPreset): Promise<void> {
    const presets = await this.loadPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    const updatedPreset = {
      ...preset,
      updatedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      presets[existingIndex] = updatedPreset;
    } else {
      presets.push(updatedPreset);
    }
    
    await saveData(PRESET_MANAGER_STORAGE_KEYS.CUSTOM_PRESETS, presets);
  }
  
  /**
   * Load all custom presets
   */
  static async loadPresets(): Promise<CustomPreset[]> {
    try {
      return await loadData<CustomPreset[]>(PRESET_MANAGER_STORAGE_KEYS.CUSTOM_PRESETS, []);
    } catch (error) {
      console.warn('[PresetManager] Failed to load presets:', error);
      return [];
    }
  }
  
  /**
   * Get preset metadata for UI display
   */
  static async getPresetMetadata(): Promise<PresetMetadata[]> {
    const customPresets = await this.loadPresets();
    
    // Built-in presets
    const builtInPresets: PresetMetadata[] = [
      {
        id: 'minimalFrontier',
        name: 'Minimal Frontier',
        description: 'Clean, balanced feel with subtle animations',
        type: 'combined',
        pillar: PRESET_PILLARS.minimalFrontier,
        basePresetId: 'minimalFrontier',
        createdAt: 0,
        updatedAt: 0,
        isBuiltIn: true,
      },
      {
        id: 'obsidianVault',
        name: 'Obsidian Vault',
        description: 'Heavy, dense feel with deep visual effects',
        type: 'combined',
        pillar: PRESET_PILLARS.obsidianVault,
        basePresetId: 'obsidianVault',
        createdAt: 0,
        updatedAt: 0,
        isBuiltIn: true,
      },
      {
        id: 'blizzardRift',
        name: 'Blizzard Rift',
        description: 'Ultra-responsive, light feel with fast animations',
        type: 'combined',
        pillar: PRESET_PILLARS.blizzardRift,
        basePresetId: 'blizzardRift',
        createdAt: 0,
        updatedAt: 0,
        isBuiltIn: true,
      },
      {
        id: 'wanderlust',
        name: 'Wanderlust',
        description: 'Warm-black bronze aesthetic with weighted physics',
        type: 'combined',
        pillar: PRESET_PILLARS.wanderlust,
        basePresetId: 'wanderlust',
        createdAt: 0,
        updatedAt: 0,
        isBuiltIn: true,
      },
    ];
    
    // Custom presets metadata
    const customMetadata: PresetMetadata[] = customPresets.map(preset => {
      const basePresetId = preset.basePresetId && isBuiltInPresetId(preset.basePresetId)
        ? preset.basePresetId
        : undefined;

      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        type: preset.type,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
        pillar: preset.pillar,
        basePresetId,
        isBuiltIn: false,
      };
    });
    
    return [...builtInPresets, ...customMetadata];
  }
  
  /**
   * Delete a custom preset
   */
  static async deletePreset(presetId: string): Promise<boolean> {
    const presets = await this.loadPresets();
    const filteredPresets = presets.filter(p => p.id !== presetId);
    
    if (filteredPresets.length === presets.length) {
      return false; // Preset not found
    }
    
    await saveData(PRESET_MANAGER_STORAGE_KEYS.CUSTOM_PRESETS, filteredPresets);
    return true;
  }
  
  /**
   * Load a specific preset by ID
   */
  static async loadPreset(presetId: string): Promise<CustomPreset | null> {
    const presets = await this.loadPresets();
    return presets.find(p => p.id === presetId) || null;
  }
  
  /**
   * Create a new preset from current configuration
   */
  static async createPreset(
    id: string,
    name: string,
    description: string,
    type: 'style' | 'physics' | 'combined',
    currentConfig: {
      styleConfig?: StyleLabPresetSnapshot;
      physicsConfig?: PhysicsConfig;
      demoConfig?: DemoConfig;
      basePresetId?: PresetId;
      pillar?: StyleLabPillar;
    }
  ): Promise<CustomPreset> {
    const now = Date.now();
    
    const preset: CustomPreset = {
      id,
      name,
      description,
      type,
      createdAt: now,
      updatedAt: now,
      basePresetId: currentConfig.basePresetId,
      pillar: currentConfig.pillar ?? PRESET_PILLARS[currentConfig.basePresetId ?? 'minimalFrontier'],
      styleConfig: type === 'physics' ? undefined : currentConfig.styleConfig,
      physicsConfig: type === 'style' ? undefined : currentConfig.physicsConfig,
      demoConfig: currentConfig.demoConfig,
    };
    
    await this.savePreset(preset);
    return preset;
  }

  private static normalizePreset(preset: unknown): CustomPreset | null {
    try {
      return CustomPresetSchema.parse(preset);
    } catch (error) {
      console.warn('[PresetManager] Failed to normalize preset:', error);
      return null;
    }
  }
  
  /**
   * Save the active preset ID
   */
  static async saveActivePreset(presetId: string): Promise<void> {
    await saveData(PRESET_MANAGER_STORAGE_KEYS.ACTIVE_PRESET, presetId);
  }
  
  /**
   * Load the active preset ID
   */
  static async loadActivePreset(): Promise<string | null> {
    try {
      return await loadData<string>(PRESET_MANAGER_STORAGE_KEYS.ACTIVE_PRESET, null);
    } catch (error) {
      console.warn('[PresetManager] Failed to load active preset:', error);
      return null;
    }
  }
}
