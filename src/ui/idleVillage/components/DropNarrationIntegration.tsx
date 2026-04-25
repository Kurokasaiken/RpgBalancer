/**
 * Drop Narration Integration Component
 * 
 * Integrates the VoiceOver narration system with existing drop feedback UI.
 * Provides seamless audio-visual feedback for drag/drop interactions.
 * 
 * @since NP-086 – Idle Village Drop VoiceOver Narration
 */

import React, { useEffect, useCallback } from 'react';
import { useDropNarration } from '../hooks/useDropNarration';
import type { DropFeedbackEvent, DropOutcomeType, NarrationContext } from '../hooks/useDropNarration';

/**
 * Drop Narration Integration Props
 */
export interface DropNarrationIntegrationProps {
  /** Enable/disable narration integration */
  enabled?: boolean;
  /** Custom locale override */
  locale?: string;
  /** Custom voice settings */
  voice?: {
    gender?: 'male' | 'female' | 'neutral';
    age?: 'young' | 'adult' | 'elder';
    pitch?: 'low' | 'medium' | 'high';
    rate?: 'slow' | 'normal' | 'fast';
    volume?: number;
  };
  /** Callback when narration starts */
  onNarrationStart?: (text: string) => void;
  /** Callback when narration ends */
  onNarrationEnd?: (text: string) => void;
  /** Callback when narration errors */
  onNarrationError?: (error: Error) => void;
  /** Children components */
  children?: React.ReactNode;
}

/**
 * Map drop validation results to narration outcomes
 */
function mapValidationToOutcome(validationResult: any): DropOutcomeType {
  if (validationResult.valid) return 'valid';
  if (validationResult.blocked) return 'blocked';
  if (validationResult.warning) return 'warning';
  return 'invalid';
}

/**
 * Map interaction context to narration context
 */
function mapContextToNarration(context: string): NarrationContext {
  switch (context) {
    case 'resident_to_activity':
      return 'resident_to_activity';
    case 'resident_to_location':
      return 'resident_to_location';
    case 'activity_swap':
      return 'activity_swap';
    case 'resident_rest':
      return 'resident_rest';
    case 'equipment_transfer':
      return 'equipment_transfer';
    default:
      return 'resident_to_activity';
  }
}

/**
 * Main Drop Narration Integration Component
 */
export const DropNarrationIntegration: React.FC<DropNarrationIntegrationProps> = ({
  enabled = true,
  locale,
  voice,
  onNarrationStart,
  onNarrationEnd,
  onNarrationError,
  children,
}) => {
  const { processDropFeedback, setLocale, setVoice, setEnabled } = useDropNarration({
    enabled,
    locale,
    voice,
    onNarrationStart: onNarrationStart ? (request) => onNarrationStart(request.text) : undefined,
    onNarrationEnd: onNarrationEnd ? (request) => onNarrationEnd(request.text) : undefined,
    onNarrationError,
  });

  // Apply configuration changes
  useEffect(() => {
    if (locale) setLocale(locale);
  }, [locale, setLocale]);

  useEffect(() => {
    if (voice) setVoice(voice);
  }, [voice, setVoice]);

  useEffect(() => {
    setEnabled(enabled);
  }, [enabled, setEnabled]);

  // Listen for drop feedback events
  const handleDropFeedback = useCallback((event: CustomEvent<DropFeedbackEvent>) => {
    if (!enabled) return;

    const dropEvent = event.detail;
    processDropFeedback(dropEvent);
  }, [enabled, processDropFeedback]);

  // Listen for resident drop events (existing system)
  const handleResidentDrop = useCallback((event: CustomEvent) => {
    if (!enabled) return;

    const { resident, activity, location, validationResult, context } = event.detail;
    
    const dropEvent: DropFeedbackEvent = {
      outcome: mapValidationToOutcome(validationResult),
      context: mapContextToNarration(context || 'resident_to_activity'),
      resident: resident ? {
        id: resident.id,
        name: resident.name,
        fatigue: resident.fatigue,
        stats: resident.stats,
      } : undefined,
      activity: activity ? {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        capacity: activity.capacity,
        currentOccupancy: activity.currentOccupancy,
      } : undefined,
      location: location ? {
        id: location.id,
        name: location.name,
        type: location.type,
        description: location.description,
      } : undefined,
      reason: validationResult?.reason,
      suggestion: validationResult?.suggestion,
      timestamp: Date.now(),
    };

    processDropFeedback(dropEvent);
  }, [enabled, processDropFeedback]);

  // Set up event listeners
  useEffect(() => {
    // Listen for custom drop feedback events
    window.addEventListener('drop_feedback', handleDropFeedback as EventListener);
    
    // Listen for resident drop events (existing system)
    window.addEventListener('resident_drop', handleResidentDrop as EventListener);

    return () => {
      window.removeEventListener('drop_feedback', handleDropFeedback as EventListener);
      window.removeEventListener('resident_drop', handleResidentDrop as EventListener);
    };
  }, [handleDropFeedback, handleResidentDrop]);

  return <>{children}</>;
};

/**
 * Higher-order component for drop narration integration
 */
export function withDropNarration<P extends object>(
  Component: React.ComponentType<P>,
  narrationProps?: Partial<DropNarrationIntegrationProps>
) {
  return function WithDropNarrationComponent(props: P) {
    return (
      <DropNarrationIntegration {...narrationProps}>
        <Component {...props} />
      </DropNarrationIntegration>
    );
  };
}

/**
 * Hook for manual drop narration triggering
 */
export function useDropNarrationTrigger() {
  const { processDropFeedback, speak, setLocale, setVoice } = useDropNarration();

  const triggerNarration = useCallback((
    outcome: DropOutcomeType,
    context: NarrationContext,
    data: Partial<DropFeedbackEvent>
  ) => {
    const dropEvent: DropFeedbackEvent = {
      outcome,
      context,
      resident: data.resident,
      activity: data.activity,
      location: data.location,
      equipment: data.equipment,
      recipient: data.recipient,
      reason: data.reason,
      suggestion: data.suggestion,
      previousActivity: data.previousActivity,
      timestamp: Date.now(),
    };

    processDropFeedback(dropEvent);
  }, [processDropFeedback]);

  const speakCustom = useCallback((
    text: string,
    options?: {
      priority?: 'polite' | 'assertive';
      voice?: {
        gender?: 'male' | 'female' | 'neutral';
        age?: 'young' | 'adult' | 'elder';
        pitch?: 'low' | 'medium' | 'high';
        rate?: 'slow' | 'normal' | 'fast';
        volume?: number;
      };
    }
  ) => {
    speak(text, options);
  }, [speak]);

  return {
    triggerNarration,
    speakCustom,
    setLocale,
    setVoice,
  };
}

/**
 * Drop narration event emitter utility
 */
export class DropNarrationEmitter {
  private static instance: DropNarrationEmitter;

  static getInstance(): DropNarrationEmitter {
    if (!DropNarrationEmitter.instance) {
      DropNarrationEmitter.instance = new DropNarrationEmitter();
    }
    return DropNarrationEmitter.instance;
  }

  emitDropFeedback(event: DropFeedbackEvent): void {
    window.dispatchEvent(new CustomEvent('drop_feedback', { detail: event }));
  }

  emitResidentDrop(data: {
    resident?: any;
    activity?: any;
    location?: any;
    validationResult: any;
    context?: string;
  }): void {
    window.dispatchEvent(new CustomEvent('resident_drop', { detail: data }));
  }

  emitValidDrop(
    resident: { id: string; name: string },
    activity: { id: string; name: string; type: string },
    location?: { id: string; name: string; type: string; description?: string }
  ): void {
    this.emitDropFeedback({
      outcome: 'valid',
      context: 'resident_to_activity',
      resident: { id: resident.id, name: resident.name },
      activity: { id: activity.id, name: activity.name, type: activity.type },
      location,
      timestamp: Date.now(),
    });
  }

  emitInvalidDrop(
    resident: { id: string; name: string },
    activity: { id: string; name: string; type: string },
    reason: string,
    suggestion?: string
  ): void {
    this.emitDropFeedback({
      outcome: 'invalid',
      context: 'resident_to_activity',
      resident: { id: resident.id, name: resident.name },
      activity: { id: activity.id, name: activity.name, type: activity.type },
      reason,
      suggestion,
      timestamp: Date.now(),
    });
  }

  emitWarningDrop(
    resident: { id: string; name: string },
    activity: { id: string; name: string; type: string },
    reason?: string
  ): void {
    this.emitDropFeedback({
      outcome: 'warning',
      context: 'resident_to_activity',
      resident: { id: resident.id, name: resident.name },
      activity: { id: activity.id, name: activity.name, type: activity.type },
      reason,
      timestamp: Date.now(),
    });
  }

  emitBlockedDrop(
    resident: { id: string; name: string },
    activity: { id: string; name: string; type: string },
    reason: string
  ): void {
    this.emitDropFeedback({
      outcome: 'blocked',
      context: 'resident_to_activity',
      resident: { id: resident.id, name: resident.name },
      activity: { id: activity.id, name: activity.name, type: activity.type },
      reason,
      timestamp: Date.now(),
    });
  }
}

/**
 * Convenience exports
 */
export const dropNarrationEmitter = DropNarrationEmitter.getInstance();

export default DropNarrationIntegration;
