/**
 * useSkinHarness Hook
 * 
 * Centralized hook for TestRosterPage skin management
 * Extracts and centralizes skin preferences, pillar switching, motion controls, and telemetry capture
 * Reusable across all skin-ready components in the test harness
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { getSkinPresetConfig } from '@/ui/idleVillage/skins/skinConfigRegistry';

/**
 * Motion level options for skin testing
 */
export type MotionLevel = 'full' | 'reduced' | 'minimal';

export interface MotionLevelConfig {
  value: MotionLevel;
  label: string;
  description: string;
}

export const MOTION_LEVELS: MotionLevelConfig[] = [
  { value: 'full', label: 'Full Motion', description: 'All animations and effects' },
  { value: 'reduced', label: 'Reduced Motion', description: 'Limited animations' },
  { value: 'minimal', label: 'Minimal Motion', description: 'Essential animations only' },
] as const;

/**
 * Telemetry event captured by the harness
 */
export interface SkinHarnessTelemetryEvent {
  timestamp: number;
  event: string;
  data: any;
}

/**
 * Skin harness state and controls
 */
export interface SkinHarnessState {
  // Current skin configuration
  presetId: SkinPresetId;
  pillar: StyleLabPillar;
  motionLevel: MotionLevel;
  
  // Control flags
  showTelemetry: boolean;
  telemetryEvents: SkinHarnessTelemetryEvent[];
  
  // Loading states
  isLoading: boolean;
}

/**
 * Skin harness actions
 */
export interface SkinHarnessActions {
  // Skin management
  setPreset: (presetId: SkinPresetId) => void;
  setPillar: (pillar: StyleLabPillar) => void;
  setMotionLevel: (level: MotionLevel) => void;
  
  // Telemetry management
  toggleTelemetry: () => void;
  clearTelemetry: () => void;
  
  // Override management
  updateOverrides: (overrides: Record<string, any>) => void;
}

/**
 * Hook return type
 */
export interface UseSkinHarnessReturn extends SkinHarnessState, SkinHarnessActions {
  // Computed values
  availablePresets: any[];
  supportedPillars: StyleLabPillar[];
  currentPresetConfig: any;
  
  // Data attributes for components
  getDataAttributes: () => Record<string, string>;
}

/**
 * Main skin harness hook
 */
export function useSkinHarness(options: {
  initialPresetId?: SkinPresetId;
  initialPillar?: StyleLabPillar;
  initialMotionLevel?: MotionLevel;
  enableTelemetry?: boolean;
} = {}): UseSkinHarnessReturn {
  const {
    initialPresetId,
    initialPillar,
    initialMotionLevel = 'full',
    enableTelemetry = true,
  } = options;

  // Base skin preferences
  const {
    presetId: currentPresetId,
    pillar: currentPillar,
    overrides,
    setPreset: setBasePreset,
    setPillar: setBasePillar,
    updateOverrides: baseUpdateOverrides,
    supportedPillars,
    availablePresets,
    isLoading: skinLoading,
  } = useSkinPreferences();

  // Local state
  const [currentMotionLevel, setCurrentMotionLevel] = useState<MotionLevel>(initialMotionLevel);
  const [showTelemetry, setShowTelemetry] = useState(enableTelemetry);
  const [telemetryEvents, setTelemetryEvents] = useState<SkinHarnessTelemetryEvent[]>([]);

  // Initialize with props if provided
  useEffect(() => {
    if (initialPresetId && initialPresetId !== currentPresetId) {
      const presetConfig = getSkinPresetConfig(initialPresetId);
      setBasePreset(initialPresetId, initialPillar || presetConfig.defaultPillar);
    } else if (initialPillar && initialPillar !== currentPillar) {
      setBasePillar(initialPillar);
    }
  }, [initialPresetId, initialPillar, currentPresetId, currentPillar, setBasePreset, setBasePillar]);

  // Telemetry capture system
  useEffect(() => {
    if (!showTelemetry) return;

    const originalTrackTelemetryEvent = trackTelemetryEvent;
    
    // Override telemetry to capture events
    const captureTelemetry = (event: string, data: any) => {
      originalTrackTelemetryEvent(event, data);
      setTelemetryEvents(prev => [...prev, { timestamp: Date.now(), event, data }]);
    };

    // Store original and restore on cleanup
    (window as any).__originalTrackTelemetryEvent = originalTrackTelemetryEvent;
    (window as any).trackTelemetryEvent = captureTelemetry;

    return () => {
      // Restore original
      if ((window as any).__originalTrackTelemetryEvent) {
        (window as any).trackTelemetryEvent = (window as any).__originalTrackTelemetryEvent;
        delete (window as any).__originalTrackTelemetryEvent;
      }
    };
  }, [showTelemetry]);

  // Actions
  const setPreset = useCallback((presetId: SkinPresetId) => {
    const presetConfig = getSkinPresetConfig(presetId);
    setBasePreset(presetId, presetConfig.defaultPillar);
    
    trackTelemetryEvent('skin_harness_preset_changed', {
      presetId,
      previousPresetId: currentPresetId,
      pillar: presetConfig.defaultPillar,
      timestamp: Date.now(),
    });
  }, [currentPresetId, setBasePreset]);

  const setPillar = useCallback((pillar: StyleLabPillar) => {
    setBasePillar(pillar);
    
    trackTelemetryEvent('skin_harness_pillar_changed', {
      pillar,
      previousPillar: currentPillar,
      presetId: currentPresetId,
      timestamp: Date.now(),
    });
  }, [currentPillar, setBasePillar, currentPresetId]);

  const setMotionLevel = useCallback((level: MotionLevel) => {
    setCurrentMotionLevel(level);
    
    baseUpdateOverrides({
      motionLevel: level,
    });
    
    trackTelemetryEvent('skin_harness_motion_changed', {
      motionLevel: level,
      presetId: currentPresetId,
      pillar: currentPillar,
      timestamp: Date.now(),
    });
  }, [currentPresetId, currentPillar, baseUpdateOverrides]);

  const toggleTelemetry = useCallback(() => {
    setShowTelemetry(prev => !prev);
  }, []);

  const clearTelemetry = useCallback(() => {
    setTelemetryEvents([]);
  }, []);

  const updateOverrides = useCallback((newOverrides: Record<string, any>) => {
    baseUpdateOverrides(newOverrides);
  }, [baseUpdateOverrides]);

  // Computed values
  const currentPresetConfig = useMemo(() => {
    return getSkinPresetConfig(currentPresetId);
  }, [currentPresetId]);

  const getDataAttributes = useCallback(() => ({
    'data-skin-preset': currentPresetId,
    'data-skin-pillar': currentPillar,
    'data-motion-level': currentMotionLevel,
    'data-telemetry-enabled': showTelemetry.toString(),
  }), [currentPresetId, currentPillar, currentMotionLevel, showTelemetry]);

  // Component render telemetry
  useEffect(() => {
    trackTelemetryEvent('skin_harness_rendered', {
      presetId: currentPresetId,
      pillar: currentPillar,
      motionLevel: currentMotionLevel,
      telemetryEnabled: showTelemetry,
      timestamp: Date.now(),
    });
  }, [currentPresetId, currentPillar, currentMotionLevel, showTelemetry]);

  return {
    // State
    presetId: currentPresetId,
    pillar: currentPillar,
    motionLevel: currentMotionLevel,
    showTelemetry,
    telemetryEvents,
    isLoading: skinLoading,
    
    // Actions
    setPreset,
    setPillar,
    setMotionLevel,
    toggleTelemetry,
    clearTelemetry,
    updateOverrides,
    
    // Computed
    availablePresets,
    supportedPillars,
    currentPresetConfig,
    getDataAttributes,
  };
}

/**
 * Helper hook for components that need skin data attributes
 */
export function useSkinDataAttributes(options: {
  initialPresetId?: SkinPresetId;
  initialPillar?: StyleLabPillar;
  initialMotionLevel?: MotionLevel;
} = {}) {
  const harness = useSkinHarness(options);
  return harness.getDataAttributes();
}

/**
 * Helper hook for telemetry capture in skin components
 */
export function useSkinTelemetry(componentName: string) {
  const { showTelemetry, telemetryEvents } = useSkinHarness();
  
  const trackComponentEvent = useCallback((event: string, data: any) => {
    if (showTelemetry) {
      trackTelemetryEvent(`skin_${componentName}_${event}`, {
        component: componentName,
        ...data,
        timestamp: Date.now(),
      });
    }
  }, [showTelemetry, componentName]);

  return {
    trackComponentEvent,
    telemetryEvents,
    showTelemetry,
  };
}
