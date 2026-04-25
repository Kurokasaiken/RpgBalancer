/**
 * AI Tutor Integration Hook
 *
 * React hook that integrates AI tutor mode with the existing drop validation
 * and suggestion system in Idle Village Phase E.
 *
 * @module useAITutor
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { AITutorEngine, createTutorEngine } from '../ai/aiTutorMode';
import type { TutorExplanation } from '../ai/aiTutorMode';
import { DropSuggestionEngine, type DropSuggestion } from '../ai/dropSuggestionEngine';
import { createDropValidator } from '../config/residentDropRules';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageContext } from '../ai/dropSuggestionEngine';

export interface AITutorState {
  /** Whether tutor mode is enabled */
  isEnabled: boolean;
  /** Whether tutor panel is currently open */
  isOpen: boolean;
  /** Current suggestion being explained */
  currentSuggestion: DropSuggestion | null;
  /** Current explanation */
  currentExplanation: TutorExplanation | null;
  /** Tutor interaction history */
  interactionHistory: Array<{
    suggestionId: string;
    timestamp: number;
    action: 'viewed' | 'accepted' | 'rejected' | 'modified';
    timeSpent: number;
  }>;
}

export interface AITutorActions {
  /** Enable/disable tutor mode */
  setEnabled: (enabled: boolean) => void;
  /** Open tutor for a specific suggestion */
  explainSuggestion: (suggestion: DropSuggestion) => void;
  /** Close tutor panel */
  closeTutor: () => void;
  /** Accept current suggestion */
  acceptSuggestion: () => void;
  /** Reject current suggestion */
  rejectSuggestion: () => void;
  /** Get suggestions for a resident */
  getSuggestionsForResident: (resident: ResidentState, context: VillageContext) => DropSuggestion[];
  /** Get suggestions for an activity */
  getSuggestionsForActivity: (activity: ActivityDefinition, context: VillageContext) => DropSuggestion[];
  /** Clear interaction history */
  clearHistory: () => void;
}

export interface UseAITutorReturn extends AITutorState, AITutorActions {
  /** Tutor engine instance */
  tutorEngine: AITutorEngine;
  /** Suggestion engine instance */
  suggestionEngine: DropSuggestionEngine;
}

export interface AITutorConfig {
  /** Enable tutor mode by default */
  defaultEnabled?: boolean;
  /** Tutor configuration */
  tutorConfig?: any;
  /** Suggestion engine configuration */
  suggestionConfig?: any;
  /** Drop validation configuration */
  validationConfig?: any;
  /** Enable telemetry */
  enableTelemetry?: boolean;
}

/**
 * Hook for AI Tutor Mode integration
 *
 * @param config - Tutor configuration
 * @returns Tutor state and actions
 *
 * @example
 * ```typescript
 * const {
 *   isEnabled,
 *   setEnabled,
 *   explainSuggestion,
 *   acceptSuggestion
 * } = useAITutor({
 *   defaultEnabled: true,
 *   enableTelemetry: true
 * });
 *
 * // Enable tutor mode
 * setEnabled(true);
 *
 * // Explain a suggestion
 * explainSuggestion(suggestion);
 * ```
 */
export function useAITutor(config: AITutorConfig = {}): UseAITutorReturn {
  const {
    defaultEnabled = false,
    tutorConfig = {},
    suggestionConfig = {},
    validationConfig = {},
    enableTelemetry = true,
  } = config;

  // Initialize engines
  const tutorEngine = useMemo(() => createTutorEngine(tutorConfig), [tutorConfig]);
  const suggestionEngine = useMemo(() => new DropSuggestionEngine(suggestionConfig, validationConfig), [suggestionConfig, validationConfig]);

  // State
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [isOpen, setIsOpen] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<DropSuggestion | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<TutorExplanation | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<AITutorState['interactionHistory']>([]);

  // Session start time for time tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  // Enable/disable tutor mode
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);

    if (enableTelemetry) {
      // Emit telemetry event
      console.log('Tutor mode', enabled ? 'enabled' : 'disabled');
    }
  }, [enableTelemetry]);

  // Open tutor for suggestion
  const explainSuggestion = useCallback((suggestion: DropSuggestion) => {
    if (!isEnabled) return;

    setCurrentSuggestion(suggestion);
    setSessionStartTime(Date.now());

    // Generate explanation
    const explanation = tutorEngine.explainSuggestion(suggestion);
    setCurrentExplanation(explanation);
    setIsOpen(true);

    // Record interaction
    setInteractionHistory(prev => [...prev, {
      suggestionId: suggestion.id,
      timestamp: Date.now(),
      action: 'viewed',
      timeSpent: 0,
    }]);

    if (enableTelemetry) {
      console.log('Tutor opened for suggestion:', suggestion.id);
    }
  }, [isEnabled, tutorEngine, enableTelemetry]);

  // Close tutor
  const closeTutor = useCallback(() => {
    if (sessionStartTime > 0 && currentSuggestion) {
      const timeSpent = Date.now() - sessionStartTime;

      // Update last interaction with time spent
      setInteractionHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex].timeSpent = timeSpent;
        }
        return updated;
      });

      setSessionStartTime(0);
    }

    setIsOpen(false);
    setCurrentSuggestion(null);
    setCurrentExplanation(null);

    if (enableTelemetry) {
      console.log('Tutor closed');
    }
  }, [sessionStartTime, currentSuggestion, enableTelemetry]);

  // Accept suggestion
  const acceptSuggestion = useCallback(() => {
    if (!currentSuggestion) return;

    // Record acceptance
    setInteractionHistory(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0) {
        updated[lastIndex].action = 'accepted';
        updated[lastIndex].timeSpent = Date.now() - sessionStartTime;
      }
      return updated;
    });

    if (enableTelemetry) {
      console.log('Suggestion accepted:', currentSuggestion.id);
    }

    // Close tutor
    closeTutor();
  }, [currentSuggestion, sessionStartTime, enableTelemetry, closeTutor]);

  // Reject suggestion
  const rejectSuggestion = useCallback(() => {
    if (!currentSuggestion) return;

    // Record rejection
    setInteractionHistory(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0) {
        updated[lastIndex].action = 'rejected';
        updated[lastIndex].timeSpent = Date.now() - sessionStartTime;
      }
      return updated;
    });

    if (enableTelemetry) {
      console.log('Suggestion rejected:', currentSuggestion.id);
    }

    // Close tutor
    closeTutor();
  }, [currentSuggestion, sessionStartTime, enableTelemetry, closeTutor]);

  // Get suggestions for resident
  const getSuggestionsForResident = useCallback((resident: ResidentState, context: VillageContext): DropSuggestion[] => {
    return suggestionEngine.generateSuggestionsForResident(resident, context);
  }, [suggestionEngine]);

  // Get suggestions for activity
  const getSuggestionsForActivity = useCallback((activity: ActivityDefinition, context: VillageContext): DropSuggestion[] => {
    return suggestionEngine.generateSuggestionsForActivity(activity, context);
  }, [suggestionEngine]);

  // Clear history
  const clearHistory = useCallback(() => {
    setInteractionHistory([]);
  }, []);

  // Auto-cleanup old interactions (keep last 50)
  useEffect(() => {
    if (interactionHistory.length > 50) {
      setInteractionHistory(prev => prev.slice(-50));
    }
  }, [interactionHistory.length]);

  return {
    // State
    isEnabled,
    isOpen,
    currentSuggestion,
    currentExplanation,
    interactionHistory,

    // Actions
    setEnabled,
    explainSuggestion,
    closeTutor,
    acceptSuggestion,
    rejectSuggestion,
    getSuggestionsForResident,
    getSuggestionsForActivity,
    clearHistory,

    // Engines
    tutorEngine,
    suggestionEngine,
  };
}
