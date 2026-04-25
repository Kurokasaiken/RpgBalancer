/**
 * STS Preset Manager Hook
 * 
 * Manages STS simulator presets with load/save/reset functionality,
 * error handling, and telemetry integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  STSPreset, 
  STSPresetManagerState, 
  STSPresetManagerActions,
  STSPresetManager 
} from '@/balancing/config/sts/presetTypes';
import { PersistenceService } from '@/shared/persistence/PersistenceService';
import type { STSTelemetryEventType } from '@/analytics/telemetry/telemetryProvider';

// Import preset configuration
import presetConfig from '@/balancing/config/sts/presets.json';

/**
 * Storage keys for STS presets
 */
const STORAGE_KEYS = {
  CUSTOM_PRESETS: 'sts_custom_presets',
  CURRENT_PRESET: 'sts_current_preset',
  USAGE_STATS: 'sts_usage_stats'
} as const;

/**
 * Default state for the preset manager
 */
const DEFAULT_STATE: STSPresetManagerState = {
  currentPreset: null,
  availablePresets: [],
  isLoading: false,
  error: null,
  lastOperation: null,
  lastOperationTimestamp: null
};

/**
 * Hook for managing STS simulator presets
 * 
 * @param options - Optional configuration options
 * @returns Preset manager state and actions
 */
export function useSTSPresetManager(options: {
  enableTelemetry?: boolean;
  autoSave?: boolean;
} = {}): STSPresetManager {
  const { enableTelemetry = true, autoSave = true } = options;
  
  // State management
  const [state, setState] = useState<STSPresetManagerState>(DEFAULT_STATE);

  /**
   * Load all available presets (built-in + custom)
   */
  const loadPresets = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Load built-in presets from config
      const builtInPresets = presetConfig.presets.map(preset => ({
        ...preset,
        isBuiltIn: true
      }));

      // Load custom presets from storage
      const customPresetsData = await PersistenceService.loadData(
        STORAGE_KEYS.CUSTOM_PRESETS,
        []
      );
      
      const customPresets = (customPresetsData || []).map((preset: any) => ({
        ...preset,
        isBuiltIn: false
      }));

      // Combine all presets
      const allPresets = [...builtInPresets, ...customPresets];

      // Load current preset
      const currentPresetData = await PersistenceService.loadData(
        STORAGE_KEYS.CURRENT_PRESET,
        null
      );
      
      const currentPreset = currentPresetData 
        ? allPresets.find(p => p.id === currentPresetData.id) || null
        : null;

      setState(prev => ({
        ...prev,
        availablePresets: allPresets,
        currentPreset,
        isLoading: false,
        lastOperation: 'load',
        lastOperationTimestamp: new Date().toISOString()
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load presets';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        lastOperation: 'load',
        lastOperationTimestamp: new Date().toISOString()
      }));
    }
  }, []);

  /**
   * Load a specific preset by ID
   */
  const loadPreset = useCallback(async (presetId: string): Promise<STSPreset> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const preset = state.availablePresets.find(p => p.id === presetId);
      
      if (!preset) {
        throw new Error(`Preset with ID "${presetId}" not found`);
      }

      // Update current preset
      setState(prev => ({
        ...prev,
        currentPreset: preset,
        isLoading: false,
        lastOperation: 'load',
        lastOperationTimestamp: new Date().toISOString()
      }));

      // Save current preset to storage
      if (autoSave) {
        await PersistenceService.saveData(STORAGE_KEYS.CURRENT_PRESET, {
          id: preset.id,
          loadedAt: new Date().toISOString()
        });
      }

      // Update usage stats
      if (enableTelemetry) {
        await updateUsageStats(preset.id, 'load');
      }

      return preset;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preset';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        lastOperation: 'load',
        lastOperationTimestamp: new Date().toISOString()
      }));
      throw error;
    }
  }, [state.availablePresets, autoSave, enableTelemetry]);

  /**
   * Save a new preset or update existing one
   */
  const savePreset = useCallback(async (
    presetData: Omit<STSPreset, 'id' | 'createdAt' | 'modifiedAt'>
  ): Promise<STSPreset> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const now = new Date().toISOString();
      const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newPreset: STSPreset = {
        ...presetData,
        id,
        createdAt: now,
        modifiedAt: now,
        isBuiltIn: false,
        metadata: {
          ...presetData.metadata,
          usage: {
            loadCount: 0,
            saveCount: 1,
            lastUsed: null
          }
        }
      };

      // Load existing custom presets
      const customPresetsData = await PersistenceService.loadData(
        STORAGE_KEYS.CUSTOM_PRESETS,
        []
      );
      
      const customPresets = Array.isArray(customPresetsData) ? customPresetsData : [];
      
      // Add new preset
      const updatedCustomPresets = [...customPresets, newPreset];
      
      // Save to storage
      await PersistenceService.saveData(STORAGE_KEYS.CUSTOM_PRESETS, updatedCustomPresets);

      // Update state
      setState(prev => ({
        ...prev,
        availablePresets: [...prev.availablePresets, newPreset],
        currentPreset: newPreset,
        isLoading: false,
        lastOperation: 'save',
        lastOperationTimestamp: now
      }));

      // Emit telemetry event
      if (enableTelemetry) {
        await emitPresetTelemetry('sts_preset_saved', {
          presetId: newPreset.id,
          presetName: newPreset.name,
          deckId: newPreset.deck.deckId,
          enemyId: newPreset.enemy.id,
          difficulty: newPreset.metadata.difficulty,
          timestamp: now
        });
        
        await updateUsageStats(newPreset.id, 'save');
      }

      return newPreset;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preset';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        lastOperation: 'save',
        lastOperationTimestamp: new Date().toISOString()
      }));
      throw error;
    }
  }, [enableTelemetry]);

  /**
   * Delete a custom preset
   */
  const deletePreset = useCallback(async (presetId: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const preset = state.availablePresets.find(p => p.id === presetId);
      
      if (!preset) {
        throw new Error(`Preset with ID "${presetId}" not found`);
      }

      if (preset.isBuiltIn) {
        throw new Error('Cannot delete built-in presets');
      }

      // Load custom presets
      const customPresetsData = await PersistenceService.loadData(
        STORAGE_KEYS.CUSTOM_PRESETS,
        []
      );
      
      const customPresets = Array.isArray(customPresetsData) ? customPresetsData : [];
      
      // Remove preset
      const updatedCustomPresets = customPresets.filter((p: any) => p.id !== presetId);
      
      // Save to storage
      await PersistenceService.saveData(STORAGE_KEYS.CUSTOM_PRESETS, updatedCustomPresets);

      // Update state
      const updatedAvailablePresets = state.availablePresets.filter(p => p.id !== presetId);
      const updatedCurrentPreset = state.currentPreset?.id === presetId ? null : state.currentPreset;

      setState(prev => ({
        ...prev,
        availablePresets: updatedAvailablePresets,
        currentPreset: updatedCurrentPreset,
        isLoading: false,
        lastOperation: 'delete',
        lastOperationTimestamp: new Date().toISOString()
      }));

      // Emit telemetry event
      if (enableTelemetry) {
        await emitPresetTelemetry('sts_preset_deleted', {
          presetId,
          presetName: preset.name,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete preset';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        lastOperation: 'delete',
        lastOperationTimestamp: new Date().toISOString()
      }));
      throw error;
    }
  }, [state.availablePresets, state.currentPreset, enableTelemetry]);

  /**
   * Reset to default preset
   */
  const resetToDefault = useCallback(async (): Promise<STSPreset> => {
    const defaultPreset = state.availablePresets.find(p => p.id === presetConfig.defaultPresetId);
    
    if (!defaultPreset) {
      throw new Error('Default preset not found');
    }

    return await loadPreset(defaultPreset.id);
  }, [state.availablePresets, loadPreset]);

  /**
   * Reload all presets from storage
   */
  const reloadPresets = useCallback(async (): Promise<void> => {
    await loadPresets();
  }, [loadPresets]);

  /**
   * Export preset to JSON string
   */
  const exportPreset = useCallback(async (presetId: string): Promise<string> => {
    const preset = state.availablePresets.find(p => p.id === presetId);
    
    if (!preset) {
      throw new Error(`Preset with ID "${presetId}" not found`);
    }

    return JSON.stringify(preset, null, 2);
  }, [state.availablePresets]);

  /**
   * Import preset from JSON string
   */
  const importPreset = useCallback(async (json: string): Promise<STSPreset> => {
    try {
      const presetData = JSON.parse(json);
      
      // Validate basic structure
      if (!presetData.name || !presetData.deck || !presetData.enemy) {
        throw new Error('Invalid preset format');
      }

      // Import as custom preset
      return await savePreset({
        ...presetData,
        version: presetData.version || '1.0.0',
        tags: presetData.tags || [],
        metadata: {
          ...presetData.metadata,
          author: presetData.metadata?.author || 'Imported',
          notes: `${presetData.metadata?.notes || ''} (Imported)`
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import preset';
      throw new Error(`Import failed: ${errorMessage}`);
    }
  }, [savePreset]);

  /**
   * Emit telemetry event
   */
  const emitPresetTelemetry = useCallback(async (
    eventType: STSTelemetryEventType,
    payload: Record<string, unknown>
  ): Promise<void> => {
    try {
      // Import dynamically to avoid circular dependencies
      const { trackSTSTelemetry } = await import('@/analytics/telemetry/telemetryProvider');
      
      trackSTSTelemetry(eventType, payload);
    } catch (error) {
      // Silently fail telemetry to not interrupt main functionality
      console.warn('Failed to emit telemetry:', error);
    }
  }, []);

  /**
   * Update usage statistics
   */
  const updateUsageStats = useCallback(async (
    presetId: string,
    operation: 'load' | 'save'
  ): Promise<void> => {
    try {
      const statsData = await PersistenceService.loadData(
        STORAGE_KEYS.USAGE_STATS,
        {}
      );
      
      const stats = typeof statsData === 'object' ? statsData : {};
      const presetStats = stats[presetId] || { loadCount: 0, saveCount: 0 };
      
      if (operation === 'load') {
        presetStats.loadCount = (presetStats.loadCount || 0) + 1;
        presetStats.lastUsed = new Date().toISOString();
      } else {
        presetStats.saveCount = (presetStats.saveCount || 0) + 1;
      }
      
      stats[presetId] = presetStats;
      
      await PersistenceService.saveData(STORAGE_KEYS.USAGE_STATS, stats);
    } catch (error) {
      // Silently fail stats update
      console.warn('Failed to update usage stats:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Combine state and actions
  return {
    ...state,
    loadPreset,
    savePreset,
    deletePreset,
    resetToDefault,
    reloadPresets,
    exportPreset,
    importPreset
  };
}
