/**
 * NP-036 – Idle Village Audio Cue Configurator
 *
 * React hook for managing audio cue configuration, playback,
 * telemetry, and state management.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { saveData, loadData } from '../../../shared/persistence/PersistenceService';
import { setSafeInterval, clearSafeInterval } from '../../../shared/utils/TimerUtils';
import { AudioCueEngine } from '../audio/audioCueEngine';
import type {
  AudioCueConfig,
  AudioCue,
  AudioCueEventType,
  AudioCueTelemetry,
  AudioCueAnalysisResult,
} from '../types/audioCue';
import { DEFAULT_AUDIO_CUE_CONFIG, validateAudioCueConfig, createAudioCue, createAudioCueConfig } from '../types/audioCue';

/**
 * Hook state
 */
interface UseAudioCueConfigState {
  config: AudioCueConfig;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  telemetry: AudioCueTelemetry | null;
  analysis: AudioCueAnalysisResult | null;
}

/**
 * Hook return type
 */
interface UseAudioCueConfigReturn extends UseAudioCueConfigState {
  // Engine methods
  playCue: (
    cueId: string,
    eventType: AudioCueEventType,
    options?: {
      volume?: number;
      pitch?: number;
      pan?: number;
      position?: { x: number; y: number; z: number };
      loop?: boolean;
      fadeIn?: number;
      fadeOut?: number;
      delay?: number;
    }
  ) => Promise<string | null>;
  stopCue: (instanceId: string) => void;
  pauseCue: (instanceId: string) => void;
  resumeCue: (instanceId: string) => void;

  // Configuration methods
  updateConfig: (updates: Partial<AudioCueConfig>) => void;
  addCue: (cue: Omit<AudioCue, 'id' | 'metadata'>) => string;
  updateCue: (cueId: string, updates: Partial<AudioCue>) => void;
  removeCue: (cueId: string) => void;
  duplicateCue: (cueId: string) => string;

  // Control methods
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: string, volume: number) => void;
  toggleMasterMute: () => void;

  // Analysis methods
  analyzeConfig: () => AudioCueAnalysisResult;
  getActiveInstancesCount: () => number;

  // Export/Import methods
  exportConfig: () => AudioCueConfig;
  importConfig: (config: AudioCueConfig) => boolean;
  resetToDefaults: () => void;

  // Utility methods
  validateConfig: () => boolean;
  getCuesByEventType: (eventType: AudioCueEventType) => AudioCue[];
  getCuesByCategory: (category: string) => AudioCue[];
}

/**
 * Audio cue configuration hook
 */
// TODO(style-lab-materials): allow injection of materialAudio preset from Style Lab (obsidian/vellum)
// so hover/press/open cues are derived from materials config instead of DEFAULT_AUDIO_CUE_CONFIG.
export function useAudioCueConfig(
  initialConfig?: AudioCueConfig
): UseAudioCueConfigReturn {
  const engineRef = useRef<AudioCueEngine | null>(null);
  const [state, setState] = useState<UseAudioCueConfigState>({
    config: initialConfig || DEFAULT_AUDIO_CUE_CONFIG,
    isInitialized: false,
    isLoading: false,
    error: null,
    telemetry: null,
    analysis: null,
  });

  // Initialize engine and load persisted config
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Load persisted config
        const persistedConfig = await loadData<AudioCueConfig>('audio-cue-config', DEFAULT_AUDIO_CUE_CONFIG);
        
        // Validate loaded config
        const validConfig = validateAudioCueConfig(persistedConfig) ? persistedConfig : DEFAULT_AUDIO_CUE_CONFIG;

        setState(prev => ({ ...prev, config: validConfig }));

        if (!engineRef.current) {
          engineRef.current = new AudioCueEngine(validConfig);
        }

        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          telemetry: engineRef.current?.getTelemetry() || null,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize audio engine',
        }));
      }
    };

    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Update engine when config changes
  useEffect(() => {
    if (engineRef.current && state.isInitialized) {
      engineRef.current.updateConfig(state.config);
    }
  }, [state.config, state.isInitialized]);

  // Update telemetry periodically
  useEffect(() => {
    if (!state.isInitialized || !engineRef.current) return;

    const updateTelemetry = () => {
      const telemetry = engineRef.current!.getTelemetry();
      setState(prev => ({ ...prev, telemetry }));
    };

    const interval = setSafeInterval(updateTelemetry, 5000); // Update every 5 seconds
    return () => clearSafeInterval(interval);
  }, [state.isInitialized]);

  // Auto-save config changes
  useEffect(() => {
    if (!state.isInitialized || state.isLoading) return;

    const saveConfig = async () => {
      try {
        await saveData('audio-cue-config', state.config);
      } catch (error) {
        console.warn('[useAudioCueConfig] Failed to save config:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? `Save failed: ${error.message}` : 'Failed to save configuration',
        }));
      }
    };

    saveConfig();
  }, [state.config, state.isInitialized, state.isLoading]);

  /**
   * Play audio cue
   */
  const playCue = useCallback(async (
    cueId: string,
    eventType: AudioCueEventType,
    options?: Parameters<UseAudioCueConfigReturn['playCue']>[2]
  ): Promise<string | null> => {
    if (!engineRef.current) {
      setState(prev => ({ ...prev, error: 'Audio engine not initialized' }));
      return null;
    }

    try {
      const instanceId = await engineRef.current.playCue(cueId, eventType, options);
      return instanceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to play audio cue';
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  /**
   * Stop audio cue
   */
  const stopCue = useCallback((instanceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.stopInstance(instanceId);
  }, []);

  /**
   * Pause audio cue
   */
  const pauseCue = useCallback((instanceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.pauseInstance(instanceId);
  }, []);

  /**
   * Resume audio cue
   */
  const resumeCue = useCallback((instanceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.resumeInstance(instanceId);
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<AudioCueConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates, metadata: { ...prev.config.metadata, updatedAt: Date.now() } },
    }));
  }, []);

  /**
   * Add new cue
   */
  const addCue = useCallback((cueData: Omit<AudioCue, 'id' | 'metadata'>): string => {
    const newCue = createAudioCue(cueData);
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        cues: [...prev.config.cues, newCue],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
    return newCue.id;
  }, []);

  /**
   * Update existing cue
   */
  const updateCue = useCallback((cueId: string, updates: Partial<AudioCue>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        cues: prev.config.cues.map(cue =>
          cue.id === cueId
            ? { ...cue, ...updates, metadata: { ...cue.metadata, updatedAt: Date.now() } }
            : cue
        ),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Remove cue
   */
  const removeCue = useCallback((cueId: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        cues: prev.config.cues.filter(cue => cue.id !== cueId),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Duplicate cue
   */
  const duplicateCue = useCallback((cueId: string): string => {
    const originalCue = state.config.cues.find(cue => cue.id === cueId);
    if (!originalCue) return '';

    const duplicatedCue = createAudioCue({
      ...originalCue,
      name: `${originalCue.name} (Copy)`,
      metadata: {
        ...originalCue.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        cues: [...prev.config.cues, duplicatedCue],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));

    return duplicatedCue.id;
  }, [state.config.cues]);

  /**
   * Set master volume
   */
  const setMasterVolume = useCallback((volume: number) => {
    if (!engineRef.current) return;
    engineRef.current.setMasterVolume(volume);
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        settings: { ...prev.config.settings, masterVolume: volume },
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Set category volume
   */
  const setCategoryVolume = useCallback((category: string, volume: number) => {
    if (!engineRef.current) return;
    engineRef.current.setCategoryVolume(category, volume);
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        categorySettings: {
          ...prev.config.categorySettings,
          [category]: {
            ...prev.config.categorySettings[category as keyof typeof prev.config.categorySettings],
            volume,
          },
        },
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Toggle master mute
   */
  const toggleMasterMute = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.toggleMasterMute();
    const newMuteState = !state.config.settings.masterMute;
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        settings: { ...prev.config.settings, masterMute: newMuteState },
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, [state.config.settings.masterMute]);

  /**
   * Analyze configuration
   */
  const analyzeConfig = useCallback((): AudioCueAnalysisResult => {
    const config = state.config;
    const analysis: AudioCueAnalysisResult = {
      id: `analysis-${Date.now()}`,
      timestamp: Date.now(),
      config,
      metrics: {
        totalCues: config.cues.length,
        enabledCues: config.cues.filter(cue => cue.validation.isValid).length,
        disabledCues: config.cues.filter(cue => !cue.validation.isValid).length,
        averageVolume: config.cues.reduce((sum, cue) => sum + cue.playback.volume, 0) / config.cues.length || 0,
        averageDuration: config.cues.reduce((sum, cue) => sum + (cue.source.duration || 0), 0) / config.cues.length || 0,
        totalFileSize: config.cues.reduce((sum, cue) => sum + (cue.source.size || 0), 0),
        categoryDistribution: config.cues.reduce((dist, cue) => {
          dist[cue.category] = (dist[cue.category] || 0) + 1;
          return dist;
        }, {} as Record<string, number>),
        eventTypeDistribution: config.cues.reduce((dist, cue) => {
          dist[cue.eventType] = (dist[cue.eventType] || 0) + 1;
          return dist;
        }, {} as Record<string, number>),
        priorityDistribution: config.cues.reduce((dist, cue) => {
          dist[cue.priority] = (dist[cue.priority] || 0) + 1;
          return dist;
        }, {} as Record<string, number>),
      },
      performance: {
        estimatedMemoryUsage: config.cues.reduce((sum, cue) => sum + (cue.source.size || 0), 0) * 2, // Rough estimate
        estimatedCpuUsage: config.cues.length * 0.01, // Rough estimate
        recommendedBufferSize: config.settings.bufferSize,
        recommendedSampleRate: config.settings.sampleRate,
        potentialBottlenecks: [],
        optimizationSuggestions: [],
      },
      validation: {
        totalErrors: config.cues.reduce((sum, cue) => sum + cue.validation.errors.length, 0),
        totalWarnings: config.cues.reduce((sum, cue) => sum + cue.validation.warnings.length, 0),
        issues: config.cues.flatMap(cue =>
          [
            ...cue.validation.errors.map(error => ({
              cueId: cue.id,
              type: 'error' as const,
              message: error,
              severity: 'high' as const,
              autoFixable: false,
            })),
            ...cue.validation.warnings.map(warning => ({
              cueId: cue.id,
              type: 'warning' as const,
              message: warning,
              severity: 'medium' as const,
              autoFixable: true,
            }))
          ]
        ),
        score: config.cues.reduce((sum, cue) => sum + cue.validation.score, 0) / config.cues.length || 0,
      },
      analytics: {
        mostPlayedCues: [], // Would need actual play data
        leastPlayedCues: [], // Would need actual play data
        categoryUsage: Object.keys(config.categorySettings).reduce((usage, category) => {
          usage[category] = {
            plays: 0, // Would need actual data
            averageVolume: config.categorySettings[category as keyof typeof config.categorySettings].volume,
            totalDuration: 0, // Would need actual data
          };
          return usage;
        }, {} as Record<string, { plays: number; averageVolume: number; totalDuration: number }>),
        eventTypeUsage: Object.values(config.eventMappings).reduce((usage, mapping) => {
          usage[mapping.cueIds[0]] = {
            plays: 0, // Would need actual data
            successRate: 1, // Would need actual data
            averageResponseTime: 0, // Would need actual data
          };
          return usage;
        }, {} as Record<string, { plays: number; successRate: number; averageResponseTime: number }>),
      },
      recommendations: [],
      metadata: {
        version: '1.0.0',
        algorithm: 'basic_analysis',
        processingTime: 0,
        confidence: 0.8,
      },
    };

    setState(prev => ({ ...prev, analysis }));
    return analysis;
  }, [state.config]);

  /**
   * Get active instances count
   */
  const getActiveInstancesCount = useCallback((): number => {
    return engineRef.current?.getActiveInstancesCount() || 0;
  }, []);

  /**
   * Export configuration
   */
  const exportConfig = useCallback((): AudioCueConfig => {
    return { ...state.config };
  }, [state.config]);

  /**
   * Import configuration
   */
  const importConfig = useCallback((config: AudioCueConfig): boolean => {
    if (!validateAudioCueConfig(config)) {
      setState(prev => ({ ...prev, error: 'Invalid configuration' }));
      return false;
    }

    setState(prev => ({ ...prev, config, error: null }));
    return true;
  }, []);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    const defaultConfig = createAudioCueConfig();
    setState(prev => ({ ...prev, config: defaultConfig, error: null }));
  }, []);

  /**
   * Validate configuration
   */
  const validateConfig = useCallback((): boolean => {
    return validateAudioCueConfig(state.config);
  }, [state.config]);

  /**
   * Get cues by event type
   */
  const getCuesByEventType = useCallback((eventType: AudioCueEventType): AudioCue[] => {
    return state.config.cues.filter(cue => cue.eventType === eventType);
  }, [state.config.cues]);

  /**
   * Get cues by category
   */
  const getCuesByCategory = useCallback((category: string): AudioCue[] => {
    return state.config.cues.filter(cue => cue.category === category);
  }, [state.config.cues]);

  return {
    ...state,
    playCue,
    stopCue,
    pauseCue,
    resumeCue,
    updateConfig,
    addCue,
    updateCue,
    removeCue,
    duplicateCue,
    setMasterVolume,
    setCategoryVolume,
    toggleMasterMute,
    analyzeConfig,
    getActiveInstancesCount,
    exportConfig,
    importConfig,
    resetToDefaults,
    validateConfig,
    getCuesByEventType,
    getCuesByCategory,
  };
}
