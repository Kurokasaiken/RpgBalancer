import { useState, useCallback, useEffect, useRef } from 'react';
import type { RiskCalibrationConfig, RiskCalibrationPreset, RiskSmoothingCurve, RiskKPITarget } from '@/ui/idleVillage/config/riskCalibrationConfig';
import { DEFAULT_RISK_CALIBRATION_CONFIG, getCalibrationPreset, createCalibrationPreset, exportPresetAsRiskDisplayConfig } from '@/ui/idleVillage/config/riskCalibrationConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Risk calibration state interface
 */
export interface RiskCalibrationState {
  activePreset: RiskCalibrationPreset;
  presets: RiskCalibrationPreset[];
  undoStack: RiskCalibrationPreset[];
  redoStack: RiskCalibrationPreset[];
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSavedAt: number | null;
}

/**
 * Risk calibration hook options
 */
export interface UseRiskCalibrationOptions {
  config?: Partial<RiskCalibrationConfig>;
  enableTelemetry?: boolean;
  enableAutoSave?: boolean;
}

/**
 * Risk calibration hook return interface
 */
export interface UseRiskCalibrationReturn {
  state: RiskCalibrationState;
  
  // Preset management
  setActivePreset: (presetId: string) => void;
  createPreset: (overrides: Partial<RiskCalibrationPreset>) => RiskCalibrationPreset;
  updatePreset: (updates: Partial<RiskCalibrationPreset>) => void;
  deletePreset: (presetId: string) => void;
  
  // Undo/redo functionality
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Persistence
  savePreset: () => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  exportPreset: (presetId: string) => string;
  
  // Calibration utilities
  calculateRiskWithSmoothing: (baseRisk: number, curve: RiskSmoothingCurve) => number;
  validateKPIs: (injuryRate: number, deathRate: number) => boolean;
  compareWithBaseline: (current: RiskCalibrationPreset, baseline: RiskCalibrationPreset) => {
    injuryDiff: number;
    deathDiff: number;
    overallDiff: number;
  };
}

/**
 * Risk calibration hook
 */
export function useRiskCalibration(options: UseRiskCalibrationOptions = {}): UseRiskCalibrationReturn {
  const { config: userConfig, enableTelemetry = true, enableAutoSave = true } = options;
  const config = { ...DEFAULT_RISK_CALIBRATION_CONFIG, ...userConfig };
  
  const diagnostics = useRef(createSandboxDiagnostics('useRiskCalibration', 'risk-calibration'));
  
  const [state, setState] = useState<RiskCalibrationState>(() => {
    const activePreset = getCalibrationPreset(config.activePresetId) || config.presets[0];
    return {
      activePreset,
      presets: config.presets,
      undoStack: [],
      redoStack: [],
      isDirty: false,
      isAutoSaving: enableAutoSave,
      lastSavedAt: null,
    };
  });

  // Load saved state from persistence
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const saved = await loadData('idleVillage.riskCalibration.state', null);
        if (saved && typeof saved === 'object') {
          setState(prev => ({
            ...prev,
            ...saved,
            presets: config.presets, // Always use latest presets from config
            activePreset: saved.activePresetId ? 
              (getCalibrationPreset(saved.activePresetId) || config.presets[0]) : 
              config.presets[0],
          }));
        }
      } catch (error) {
        diagnostics.current.warn('loadSavedState', 'Failed to load saved calibration state', { error });
      }
    };
    
    loadSavedState();
  }, [config.presets, config.activePresetId]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !state.isDirty) return;
    
    const autoSaveTimeout = setTimeout(async () => {
      try {
        await saveData('idleVillage.riskCalibration.state', {
          activePresetId: state.activePreset.id,
          undoStack: state.undoStack.slice(-config.maxUndoStack),
          redoStack: state.redoStack.slice(-config.maxUndoStack),
        });
        
        setState(prev => ({
          ...prev,
          isDirty: false,
          lastSavedAt: Date.now(),
        }));
        
        if (enableTelemetry) {
          // Emit telemetry event
          diagnostics.current.info('autoSave', 'Risk calibration auto-saved', {
            presetId: state.activePreset.id,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        diagnostics.current.error('autoSave', 'Failed to auto-save calibration state', { error });
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(autoSaveTimeout);
  }, [enableAutoSave, state.isDirty, state.activePreset.id, state.undoStack, state.redoStack, config.maxUndoStack, enableTelemetry]);

  /**
   * Set active preset
   */
  const setActivePreset = useCallback((presetId: string) => {
    const preset = getCalibrationPreset(presetId);
    if (!preset) {
      diagnostics.current.warn('setActivePreset', 'Preset not found', { presetId });
      return;
    }
    
    setState(prev => {
      if (prev.activePreset.id === presetId) return prev;
      
      // Push current state to undo stack before changing
      const newUndoStack = [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        activePreset: preset,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new selection
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('setActivePreset', 'Active preset changed', {
        from: state.activePreset.id,
        to: presetId,
        timestamp: Date.now(),
      });
    }
  }, [state.activePreset.id, state.undoStack, config.maxUndoStack, enableTelemetry]);

  /**
   * Create new preset
   */
  const createPreset = useCallback((overrides: Partial<RiskCalibrationPreset>) => {
    const newPreset = createCalibrationPreset(overrides);
    
    setState(prev => {
      const newPresets = [...prev.presets, newPreset];
      const newUndoStack = [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        presets: newPresets,
        activePreset: newPreset,
        undoStack: newUndoStack,
        redoStack: [],
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('createPreset', 'New preset created', {
        presetId: newPreset.id,
        name: newPreset.name,
        timestamp: Date.now(),
      });
    }
    
    return newPreset;
  }, [config.maxUndoStack, enableTelemetry]);

  /**
   * Update current preset
   */
  const updatePreset = useCallback((updates: Partial<RiskCalibrationPreset>) => {
    setState(prev => {
      const updatedPreset = { ...prev.activePreset, ...updates };
      const newUndoStack = [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        activePreset: updatedPreset,
        presets: prev.presets.map(p => p.id === updatedPreset.id ? updatedPreset : p),
        undoStack: newUndoStack,
        redoStack: [],
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('updatePreset', 'Preset updated', {
        presetId: state.activePreset.id,
        updates: Object.keys(updates),
        timestamp: Date.now(),
      });
    }
  }, [state.activePreset.id, state.undoStack, state.presets, config.maxUndoStack, enableTelemetry]);

  /**
   * Delete preset
   */
  const deletePreset = useCallback((presetId: string) => {
    if (state.presets.length <= 1) {
      diagnostics.current.warn('deletePreset', 'Cannot delete last preset');
      return;
    }
    
    setState(prev => {
      const newPresets = prev.presets.filter(p => p.id !== presetId);
      const newActivePreset = newPresets[0]; // Fall back to first preset
      const newUndoStack = [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        presets: newPresets,
        activePreset: newActivePreset,
        undoStack: newUndoStack,
        redoStack: [],
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('deletePreset', 'Preset deleted', {
        presetId,
        timestamp: Date.now(),
      });
    }
  }, [state.presets, state.activePreset, state.undoStack, config.maxUndoStack, enableTelemetry]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (!state.undoStack.length) return;
    
    setState(prev => {
      const newUndoStack = [...prev.undoStack];
      const previousPreset = newUndoStack.pop()!;
      const newRedoStack = [...prev.redoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        activePreset: previousPreset,
        presets: prev.presets.map(p => p.id === previousPreset.id ? previousPreset : p),
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('undo', 'Calibration change undone', {
        presetId: state.undoStack[state.undoStack.length - 1]?.id,
        timestamp: Date.now(),
      });
    }
  }, [state.undoStack, state.redoStack, state.activePreset, state.presets, config.maxUndoStack, enableTelemetry]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (!state.redoStack.length) return;
    
    setState(prev => {
      const newRedoStack = [...prev.redoStack];
      const nextPreset = newRedoStack.pop()!;
      const newUndoStack = [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack);
      
      return {
        ...prev,
        activePreset: nextPreset,
        presets: prev.presets.map(p => p.id === nextPreset.id ? nextPreset : p),
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: true,
      };
    });
    
    if (enableTelemetry) {
      diagnostics.current.info('redo', 'Calibration change redone', {
        presetId: state.redoStack[state.redoStack.length - 1]?.id,
        timestamp: Date.now(),
      });
    }
  }, [state.redoStack, state.undoStack, state.activePreset, state.presets, config.maxUndoStack, enableTelemetry]);

  /**
   * Save preset to persistence
   */
  const savePreset = useCallback(async () => {
    try {
      await saveData(`idleVillage.riskCalibration.preset.${state.activePreset.id}`, state.activePreset);
      
      setState(prev => ({
        ...prev,
        isDirty: false,
        lastSavedAt: Date.now(),
      }));
      
      if (enableTelemetry) {
        diagnostics.current.info('savePreset', 'Preset saved', {
          presetId: state.activePreset.id,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      diagnostics.current.error('savePreset', 'Failed to save preset', { error });
      throw error;
    }
  }, [state.activePreset, enableTelemetry]);

  /**
   * Load preset from persistence
   */
  const loadPreset = useCallback(async (presetId: string) => {
    try {
      const saved = await loadData(`idleVillage.riskCalibration.preset.${presetId}`, null);
      if (!saved) {
        throw new Error(`Preset ${presetId} not found in storage`);
      }
      
      const preset = getCalibrationPreset(presetId);
      if (!preset) {
        throw new Error(`Preset ${presetId} not found in config`);
      }
      
      const mergedPreset = { ...preset, ...saved };
      
      setState(prev => ({
        ...prev,
        activePreset: mergedPreset,
        presets: prev.presets.map(p => p.id === presetId ? mergedPreset : p),
        undoStack: [...prev.undoStack, prev.activePreset].slice(-config.maxUndoStack),
        redoStack: [],
        isDirty: false,
        lastSavedAt: Date.now(),
      }));
      
      if (enableTelemetry) {
        diagnostics.current.info('loadPreset', 'Preset loaded', {
          presetId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      diagnostics.current.error('loadPreset', 'Failed to load preset', { error, presetId });
      throw error;
    }
  }, [config.maxUndoStack, enableTelemetry]);

  /**
   * Export preset as JSON
   */
  const exportPreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId) || state.activePreset;
    return exportPresetAsRiskDisplayConfig(preset);
  }, [state.presets, state.activePreset]);

  /**
   * Calculate risk with smoothing curve
   */
  const calculateRiskWithSmoothing = useCallback((baseRisk: number, curve: RiskSmoothingCurve): number => {
    if (baseRisk < curve.threshold) return baseRisk;
    
    switch (curve.type) {
      case 'linear':
        return baseRisk * curve.factor;
      
      case 'ease-in':
        const easeInFactor = Math.pow(baseRisk, 1.5);
        return Math.min(1, easeInFactor * curve.factor);
      
      case 'ease-out':
        const easeOutFactor = 1 - Math.pow(1 - baseRisk, 1.5);
        return Math.min(1, easeOutFactor * curve.factor);
      
      case 'ease-in-out':
        if (baseRisk < 0.5) {
          const easeInFactor = 2 * Math.pow(baseRisk, 1.5);
          return Math.min(1, easeInFactor * curve.factor);
        } else {
          const easeOutFactor = 1 - 2 * Math.pow(1 - baseRisk, 1.5);
          return Math.min(1, easeOutFactor * curve.factor);
        }
      
      case 'cubic-bezier':
        // Simplified cubic-bezier implementation
        const t = baseRisk;
        const p0 = 0;
        const p1 = 0.25;
        const p2 = 0.75;
        const p3 = 1;
        
        const cubicBezier = (t: number) => {
          const u = 1 - t;
          return 3 * u * u * t * p0 + 3 * u * t * t * p1 + 3 * u * t * u * p2 + t * t * t * p3;
        };
        
        return Math.min(1, cubicBezier(t) * curve.factor);
      
      default:
        return baseRisk;
    }
  }, []);

  /**
   * Validate KPIs against targets
   */
  const validateKPIs = useCallback((injuryRate: number, deathRate: number): boolean => {
    const targets = state.activePreset.kpiTargets;
    return injuryRate <= targets.maxInjuryRate && deathRate <= targets.maxDeathRate;
  }, [state.activePreset.kpiTargets]);

  /**
   * Compare current preset with baseline
   */
  const compareWithBaseline = useCallback((current: RiskCalibrationPreset, baseline: RiskCalibrationPreset) => {
    const injuryDiff = current.kpiTargets.maxInjuryRate - baseline.kpiTargets.maxInjuryRate;
    const deathDiff = current.kpiTargets.maxDeathRate - baseline.kpiTargets.maxDeathRate;
    const overallDiff = current.kpiTargets.targetOverallRisk - baseline.kpiTargets.targetOverallRisk;
    
    return { injuryDiff, deathDiff, overallDiff };
  }, []);

  return {
    state,
    
    // Preset management
    setActivePreset,
    createPreset,
    updatePreset,
    deletePreset,
    
    // Undo/redo
    undo,
    redo,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    
    // Persistence
    savePreset,
    loadPreset,
    exportPreset,
    
    // Utilities
    calculateRiskWithSmoothing,
    validateKPIs,
    compareWithBaseline,
  };
}
