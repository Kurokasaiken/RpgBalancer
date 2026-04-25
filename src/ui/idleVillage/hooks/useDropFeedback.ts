/**
 * Drop Feedback Hook for Idle Village Phase E
 * 
 * Integrates useResidentDropValidation with visual feedback system to provide
 * real-time UI feedback during drag-and-drop operations. Handles telemetry,
 * animations, and modular feedback components.
 * 
 * @since IV-PhaseE-drop-feedback
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type {
  DropFeedbackConfig,
  DropFeedbackType,
  DropFeedbackTelemetryEvent,
} from '@/ui/idleVillage/config/dropFeedbackConfig';
export type { DropFeedbackConfig } from '@/ui/idleVillage/config/dropFeedbackConfig';
import {
  DEFAULT_DROP_FEEDBACK_CONFIG,
  TEST_DROP_FEEDBACK_CONFIG,
  getFeedbackType,
  getFeedbackMessage,
  getFeedbackVisuals,
  validateDropFeedbackConfig,
} from '@/ui/idleVillage/config/dropFeedbackConfig';

/**
 * Parameters for the useDropFeedback hook.
 */
export interface UseDropFeedbackParams {
  /** Configuration for drop feedback */
  config?: Partial<DropFeedbackConfig>;
  /** Whether to run in test mode */
  testMode?: boolean;
  /** Whether to enable telemetry logging */
  enableTelemetry?: boolean;
  /** Optional custom validation context */
  context?: string;
}

/**
 * Return value for the useDropFeedback hook.
 */
export interface UseDropFeedbackReturn {
  /** Validates a drop and returns feedback */
  validateDropWithFeedback: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
  }) => DropFeedbackResult;
  
  /** Gets visual styling for a specific feedback type */
  getVisualFeedback: (feedbackType: DropFeedbackType) => DropFeedbackVisuals;
  
  /** Gets feedback message for a validation result */
  getFeedbackMessage: (validationRule?: string, customMessage?: string) => string;
  
  /** Current feedback configuration */
  config: DropFeedbackConfig;
  
  /** Shows temporary feedback for a slot */
  showSlotFeedback: (params: {
    slotId: string;
    feedbackType: DropFeedbackType;
    message?: string;
    validationRule?: string;
    residentId?: string;
    activityId?: string;
  }) => void;
  
  /** Clears feedback for a slot */
  clearSlotFeedback: (slotId: string) => void;
  
  /** Current feedback state for all slots */
  slotFeedbackState: Record<string, DropFeedbackState>;
}

/**
 * Visual feedback properties for a drop operation.
 */
export interface DropFeedbackVisuals {
  /** Border color */
  borderColor: string;
  /** Background color */
  backgroundColor: string;
  /** Box shadow */
  boxShadow: string;
  /** Animation class */
  animation: string;
}

/**
 * Complete result of a drop validation with feedback.
 */
export interface DropFeedbackResult {
  /** Whether the drop is valid */
  isValid: boolean;
  /** Type of feedback to show */
  feedbackType: DropFeedbackType;
  /** Visual styling for the feedback */
  visuals: DropFeedbackVisuals;
  /** Human-readable message */
  message: string;
  /** Validation rule that failed (if any) */
  validationRule?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * State for a specific slot's feedback.
 */
export interface DropFeedbackState {
  /** Current feedback type */
  feedbackType: DropFeedbackType;
  /** Message to display */
  message?: string;
  /** Validation rule that triggered the feedback */
  validationRule?: string;
  /** Resident ID involved */
  residentId?: string;
  /** Activity ID involved */
  activityId?: string;
  /** Timestamp when feedback was shown */
  timestamp: number;
  /** Whether the feedback is currently visible */
  visible: boolean;
}

/**
 * Hook for providing drop feedback with validation integration.
 * 
 * @param params - Hook parameters
 * @returns Drop feedback utilities and state
 */
export function useDropFeedback(params: UseDropFeedbackParams = {}): UseDropFeedbackReturn {
  const { config: userConfig, testMode = false, enableTelemetry = true, context = 'default' } = params;
  
  // Initialize diagnostics
  const diagnostics = useMemo(() => {
    return enableTelemetry ? createSandboxDiagnostics('drop-feedback') : null;
  }, [enableTelemetry]);
  
  // Merge configuration with appropriate defaults
  const config = useMemo(() => {
    const baseConfig = testMode ? TEST_DROP_FEEDBACK_CONFIG : DEFAULT_DROP_FEEDBACK_CONFIG;
    const merged = { ...baseConfig, ...userConfig };
    
    if (!validateDropFeedbackConfig(merged)) {
      console.warn('[useDropFeedback] Invalid config, falling back to defaults');
      return baseConfig;
    }
    
    return merged;
  }, [userConfig, testMode]);
  
  // Initialize validation hook
  const validationHook = useResidentDropValidation({
    enableTelemetry,
  });
  
  // State for slot feedback using useState to avoid ref access during render
  const [slotFeedbackState, setSlotFeedbackState] = useState<Record<string, DropFeedbackState>>({});
  
  // Timeout references for clearing feedback
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  
  /**
   * Validates a drop and returns complete feedback information.
   */
  const validateDropWithFeedback = useCallback((
    params: {
      resident: ResidentState;
      activity?: ActivityDefinition;
      currentOccupants?: number;
    }
  ): DropFeedbackResult => {
    const validationResult = validationHook.validateDrop({
      ...params,
      context,
    });
    
    // Determine feedback type based on validation result
    const feedbackType = getFeedbackType(validationResult.failedRule);
    
    // Get visual styling
    const visuals = getFeedbackVisuals(config, feedbackType);
    
    // Get formatted message
    const message = getFeedbackMessage(config, validationResult.failedRule, validationResult.message);
    
    // Log telemetry event
    if (diagnostics) {
      const telemetryEvent: DropFeedbackTelemetryEvent = {
        feedbackType,
        validationRule: validationResult.failedRule,
        residentId: params.resident.id,
        activityId: params.activity?.id,
        context,
        timestamp: Date.now(),
        interactive: true,
      };
      
      diagnostics.info('drop_feedback_shown', telemetryEvent);
    }
    
    return {
      isValid: validationResult.isValid,
      feedbackType,
      visuals,
      message,
      validationRule: validationResult.failedRule,
      meta: validationResult.meta,
    };
  }, [validationHook, config, diagnostics, context]);
  
  /**
   * Gets visual feedback for a specific feedback type.
   */
  const getVisualFeedback = useCallback((feedbackType: DropFeedbackType): DropFeedbackVisuals => {
    return getFeedbackVisuals(config, feedbackType);
  }, [config]);
  
  /**
   * Gets formatted feedback message.
   */
  const getFeedbackMessageHook = useCallback((
    validationRule?: string,
    customMessage?: string
  ): string => {
    return getFeedbackMessage(config, validationRule, customMessage);
  }, [config]);
  
  /**
   * Clears feedback for a specific slot.
   */
  const clearSlotFeedback = useCallback((slotId: string) => {
    // Clear timeout if exists
    if (timeoutRefs.current[slotId]) {
      clearTimeout(timeoutRefs.current[slotId]);
      delete timeoutRefs.current[slotId];
    }
    
    // Update feedback state
    setSlotFeedbackState(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        visible: false,
      },
    }));
  }, []);
  
  /**
   * Shows temporary feedback for a specific slot.
   */
  const showSlotFeedback = useCallback((
    params: {
      slotId: string;
      feedbackType: DropFeedbackType;
      message?: string;
      validationRule?: string;
      residentId?: string;
      activityId?: string;
    }
  ) => {
    const { slotId, feedbackType, message, validationRule, residentId, activityId } = params;
    
    // Clear existing timeout for this slot
    if (timeoutRefs.current[slotId]) {
      clearTimeout(timeoutRefs.current[slotId]);
    }
    
    // Update feedback state
    const feedbackState: DropFeedbackState = {
      feedbackType,
      message: message || getFeedbackMessage(config, validationRule),
      validationRule,
      residentId,
      activityId,
      timestamp: Date.now(),
      visible: true,
    };
    
    setSlotFeedbackState(prev => ({
      ...prev,
      [slotId]: feedbackState,
    }));
    
    // Log telemetry event
    if (diagnostics) {
      const telemetryEvent: DropFeedbackTelemetryEvent = {
        feedbackType,
        validationRule,
        residentId,
        activityId,
        context: `slot-${slotId}`,
        timestamp: Date.now(),
        interactive: false,
      };
      
      diagnostics.info('drop_feedback_shown', telemetryEvent);
    }
    
    // Set timeout to clear feedback
    timeoutRefs.current[slotId] = setTimeout(() => {
      clearSlotFeedback(slotId);
    }, config.messages.displayDurationMs);
  }, [config, diagnostics, getFeedbackMessage, clearSlotFeedback]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  return {
    validateDropWithFeedback,
    getVisualFeedback,
    getFeedbackMessage: getFeedbackMessageHook,
    config,
    showSlotFeedback,
    clearSlotFeedback,
    slotFeedbackState,
  };
}

/**
 * Utility function to create CSS styles from feedback visuals.
 * 
 * @param visuals - Visual feedback properties
 * @returns CSS style object
 */
export function createFeedbackStyles(visuals: DropFeedbackVisuals): React.CSSProperties {
  return {
    borderColor: visuals.borderColor,
    backgroundColor: visuals.backgroundColor,
    boxShadow: visuals.boxShadow,
    animation: visuals.animation,
  };
}

/**
 * Utility function to determine if feedback should be shown based on validation result.
 * 
 * @param validationResult - Validation result from drop validation
 * @returns Whether feedback should be shown
 */
export function shouldShowFeedback(validationResult: {
  isValid: boolean;
  failedRule?: string;
}): boolean {
  // Show feedback for invalid drops or specific valid drops
  return !validationResult.isValid || validationResult.failedRule !== undefined;
}
