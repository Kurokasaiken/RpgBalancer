/**
 * useResidentDropAdvisor Hook
 *
 * React hook that provides AI-powered suggestions for resident drop operations.
 * Integrates with the drop suggestion engine to provide intelligent hints during drag-and-drop.
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { createDropSuggestionEngine } from '@/ui/idleVillage/utils/dropSuggestionEngine';
import type { DropAnalysisResult } from '@/ui/idleVillage/utils/dropSuggestionEngine';
import type {
  DropSuggestion,
  DropAdvisorConfig,
  SuggestionContext
} from '@/balancing/config/idleVillage/dropAdvisorConfig';
import { DEFAULT_DROP_ADVISOR_CONFIG } from '@/balancing/config/idleVillage/dropAdvisorConfig';
import type { AssignmentFailureReason, ValidationFailureDetails } from '@/ui/idleVillage/slots/residentSlotValidators';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';

/**
 * Hook return type for resident drop advisor
 */
export interface UseResidentDropAdvisorReturn {
  /** Current suggestions for the active drop operation */
  suggestions: DropSuggestion[];
  /** Analysis result for the current drop context */
  analysis: DropAnalysisResult | null;
  /** Whether AI suggestions are enabled */
  isEnabled: boolean;
  /** Analyze a potential drop and get suggestions */
  analyzeDrop: (
    residentId: string,
    activity: ActivityDefinition,
    failureReason?: AssignmentFailureReason,
    validationDetails?: ValidationFailureDetails
  ) => DropAnalysisResult;
  /** Clear current suggestions */
  clearSuggestions: () => void;
  /** Update advisor configuration */
  updateConfig: (config: Partial<DropAdvisorConfig>) => void;
}

/**
 * Hook configuration options
 */
export interface UseResidentDropAdvisorOptions {
  /** Custom configuration for the advisor */
  config?: Partial<DropAdvisorConfig>;
}

/**
 * useResidentDropAdvisor Hook
 *
 * Provides AI-powered suggestions for optimizing resident assignments during drag-and-drop operations.
 * Integrates with the validation system to provide contextual hints for better decision making.
 *
 * @param options - Configuration options for the advisor
 * @returns Hook interface for accessing AI suggestions
 */
export function useResidentDropAdvisor(
  options: UseResidentDropAdvisorOptions = {}
): UseResidentDropAdvisorReturn {
  const {
    config: userConfig = {},
  } = options;

  // Advisor state
  const [currentAnalysis, setCurrentAnalysis] = useState<DropAnalysisResult | null>(null);

  // Village state for resident and activity data
  const villageState = useVillageStateStore();

  // Memoized engine creation
  const engine = useMemo(() => {
    const newConfig = { ...DEFAULT_DROP_ADVISOR_CONFIG, ...userConfig };
    return createDropSuggestionEngine(newConfig);
  }, [userConfig]);

  // Memoized suggestions from current analysis
  const suggestions = useMemo(() => {
    return currentAnalysis?.suggestions || [];
  }, [currentAnalysis]);

  // Check if suggestions are enabled
  const isEnabled = useMemo(() => {
    return engine && (engine as { config?: { enabled?: boolean } }).config?.enabled !== false;
  }, [engine]);

  /**
   * Analyzes a potential drop operation and generates suggestions
   */
  const analyzeDrop = useCallback((
    residentId: string,
    activity: ActivityDefinition,
    failureReason?: AssignmentFailureReason,
    validationDetails?: ValidationFailureDetails
  ): DropAnalysisResult => {
    if (!isEnabled) {
      return {
        isValid: !failureReason || failureReason === 'RESIDENT_NOT_FOUND',
        failureReason,
        validationDetails,
        suggestions: [],
        analysisScore: 0.5,
      };
    }

    // Get resident data
    const resident = villageState.state.residents[residentId];
    if (!resident) {
      return {
        isValid: false,
        failureReason: 'RESIDENT_NOT_FOUND',
        suggestions: [],
        analysisScore: 0,
      };
    }

    // Build suggestion context
    const context: SuggestionContext = {
      residentId,
      activityId: activity.id,
      failureReason: failureReason || 'RESIDENT_NOT_FOUND',
      validationDetails,
      residentStats: resident.statSnapshot || {},
      activityRequirement: {
        allOf: activity.statRequirement?.allOf,
        anyOf: activity.statRequirement?.anyOf,
        noneOf: activity.statRequirement?.noneOf,
      },
      availableActivities: Object.values(villageState.state.activities).map(act => ({
        id: act.activityId,
        name: act.activityId, // Use activityId as name fallback
        statRequirement: undefined, // Activities don't have stat requirements in this context
      })),
    };

    // Analyze with the engine
    const analysis = engine.analyzeDrop(context);

    // Update state immediately (debouncing removed to avoid setTimeout)
    setCurrentAnalysis(analysis);

    return analysis;
  }, [engine, isEnabled, villageState.state]);

  /**
   * Clears current suggestions
   */
  const clearSuggestions = useCallback(() => {
    setCurrentAnalysis(null);
  }, []);

  /**
   * Updates the advisor configuration
   */
  const updateConfig = useCallback((_config: Partial<DropAdvisorConfig>) => {
    // This would trigger engine recreation through useMemo
    console.warn('Configuration update not implemented in this version');
  }, []);

  // Auto-clear functionality removed for now to avoid React hooks issues
  // Could be implemented later with proper effect handling

  return {
    suggestions,
    analysis: currentAnalysis,
    isEnabled,
    analyzeDrop,
    clearSuggestions,
    updateConfig,
  };
}
