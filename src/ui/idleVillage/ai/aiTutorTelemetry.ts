/**
 * AI Tutor Telemetry
 *
 * Dedicated telemetry system for AI Tutor Mode interactions in Idle Village,
 * tracking user engagement, learning effectiveness, and suggestion performance.
 *
 * @module aiTutorTelemetry
 * @since 2026-01-13
 * @author Cascade
 */

import { useMemo } from 'react';
import type { DropSuggestion } from '../ai/dropSuggestionEngine';
import type { TutorExplanation, TutorStep } from '../ai/aiTutorMode';
import type { AITutorState } from '../hooks/useAITutor';

export interface TutorInteractionEvent {
  /** Event type */
  type: 'tutor_opened' | 'tutor_closed' | 'step_viewed' | 'suggestion_accepted' | 'suggestion_rejected' | 'alternative_viewed' | 'learning_tip_viewed';
  /** Timestamp */
  timestamp: number;
  /** Session ID for tracking user sessions */
  sessionId: string;
  /** Suggestion being analyzed */
  suggestionId: string;
  /** Current step number (for step_viewed events) */
  stepNumber?: number;
  /** Time spent on interaction (for tutor_closed events) */
  timeSpent?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface TutorAnalyticsEvent {
  /** Event type */
  type: 'analytics_update';
  /** Timestamp */
  timestamp: number;
  /** Analytics data */
  data: {
    totalInteractions: number;
    averageTimeSpent: number;
    acceptanceRate: number;
    rejectionRate: number;
    mostViewedSteps: Record<number, number>;
    learningEffectiveness: number;
    userSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface TutorFeedbackEvent {
  /** Event type */
  type: 'user_feedback';
  /** Timestamp */
  timestamp: number;
  /** Suggestion ID */
  suggestionId: string;
  /** Feedback type */
  feedbackType: 'helpful' | 'confusing' | 'too_detailed' | 'not_detailed_enough' | 'other';
  /** User feedback text */
  feedback: string;
  /** Rating (1-5) */
  rating?: number;
  /** Session ID */
  sessionId: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export type AITutorTelemetryEvent = TutorInteractionEvent | TutorAnalyticsEvent | TutorFeedbackEvent;

/**
 * AI Tutor Telemetry Manager
 */
export class AITutorTelemetry {
  private sessionId: string;
  private eventQueue: AITutorTelemetryEvent[] = [];
  private isEnabled: boolean = true;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * Track tutor opening
   */
  trackTutorOpened(suggestion: DropSuggestion, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'tutor_opened',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId: suggestion.id,
      metadata: {
        suggestionType: suggestion.type,
        priority: suggestion.priority,
        confidence: suggestion.confidence,
        residentId: suggestion.resident.id,
        activityId: suggestion.activity.id,
        ...metadata,
      },
    });
  }

  /**
   * Track tutor closing
   */
  trackTutorClosed(suggestionId: string, timeSpent: number, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'tutor_closed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId,
      timeSpent,
      metadata,
    });
  }

  /**
   * Track step viewing
   */
  trackStepViewed(suggestionId: string, stepNumber: number, step: TutorStep, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'step_viewed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId,
      stepNumber,
      metadata: {
        stepTitle: step.title,
        confidence: step.confidence,
        hasHighlights: !!step.highlights,
        hasData: !!step.data,
        ...metadata,
      },
    });
  }

  /**
   * Track suggestion acceptance
   */
  trackSuggestionAccepted(suggestion: DropSuggestion, explanation: TutorExplanation, timeSpent: number, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'suggestion_accepted',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId: suggestion.id,
      timeSpent,
      metadata: {
        stepsViewed: explanation.reasoningSteps.length,
        overallConfidence: explanation.overallConfidence,
        keyInsightsCount: explanation.keyInsights.length,
        alternativesCount: explanation.alternatives.length,
        tipsViewed: explanation.learningTips.length,
        ...metadata,
      },
    });
  }

  /**
   * Track suggestion rejection
   */
  trackSuggestionRejected(suggestion: DropSuggestion, explanation: TutorExplanation, timeSpent: number, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'suggestion_rejected',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId: suggestion.id,
      timeSpent,
      metadata: {
        stepsViewed: explanation.reasoningSteps.length,
        overallConfidence: explanation.overallConfidence,
        rejectionReason: metadata?.reason || 'user_choice',
        ...metadata,
      },
    });
  }

  /**
   * Track alternative scenario viewing
   */
  trackAlternativeViewed(suggestionId: string, alternativeIndex: number, alternative: TutorExplanation['alternatives'][0], metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'alternative_viewed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId,
      metadata: {
        alternativeIndex,
        alternativeScenario: alternative.scenario,
        alternativeImpact: alternative.impact,
        ...metadata,
      },
    });
  }

  /**
   * Track learning tip viewing
   */
  trackLearningTipViewed(suggestionId: string, tipIndex: number, tip: string, metadata?: Record<string, unknown>): void {
    this.emitEvent({
      type: 'learning_tip_viewed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId,
      metadata: {
        tipIndex,
        tipLength: tip.length,
        ...metadata,
      },
    });
  }

  /**
   * Record user feedback
   */
  recordUserFeedback(
    suggestionId: string,
    feedbackType: TutorFeedbackEvent['feedbackType'],
    feedback: string,
    rating?: number,
    metadata?: Record<string, unknown>
  ): void {
    this.emitEvent({
      type: 'user_feedback',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      suggestionId,
      feedbackType,
      feedback,
      rating,
      metadata,
    });
  }

  /**
   * Generate analytics update
   */
  generateAnalyticsUpdate(tutorState: AITutorState): void {
    const interactions = tutorState.interactionHistory;

    if (interactions.length === 0) return;

    const totalInteractions = interactions.length;
    const averageTimeSpent = interactions.reduce((sum, i) => sum + i.timeSpent, 0) / totalInteractions;

    const accepted = interactions.filter(i => i.action === 'accepted').length;
    const rejected = interactions.filter(i => i.action === 'rejected').length;
    const acceptanceRate = accepted / (accepted + rejected) || 0;
    const rejectionRate = rejected / (accepted + rejected) || 0;

    // Calculate most viewed steps (simplified - would need more detailed tracking)
    const mostViewedSteps: Record<number, number> = {};

    // Estimate learning effectiveness based on acceptance patterns
    const learningEffectiveness = Math.min(1, acceptanceRate * 1.2);

    // Determine user skill level based on interaction patterns
    let userSkillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (averageTimeSpent > 30000) { // > 30 seconds average
      userSkillLevel = 'beginner';
    } else if (acceptanceRate > 0.7) {
      userSkillLevel = 'advanced';
    } else {
      userSkillLevel = 'intermediate';
    }

    this.emitEvent({
      type: 'analytics_update',
      timestamp: Date.now(),
      data: {
        totalInteractions,
        averageTimeSpent,
        acceptanceRate,
        rejectionRate,
        mostViewedSteps,
        learningEffectiveness,
        userSkillLevel,
      },
    });
  }

  /**
   * Get all queued events
   */
  getQueuedEvents(): AITutorTelemetryEvent[] {
    return [...this.eventQueue];
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Export events in various formats
   */
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    const events = this.getQueuedEvents();

    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'sessionId', 'suggestionId', 'stepNumber', 'timeSpent', 'metadata'];
      const rows = events.map(event => [
        event.timestamp,
        event.type,
        'sessionId' in event ? event.sessionId : '',
        'suggestionId' in event ? event.suggestionId : '',
        'stepNumber' in event ? event.stepNumber?.toString() || '' : '',
        'timeSpent' in event ? event.timeSpent?.toString() || '' : '',
        JSON.stringify('metadata' in event ? event.metadata : {}),
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(events, null, 2);
  }

  private emitEvent(event: AITutorTelemetryEvent): void {
    if (!this.isEnabled) return;

    this.eventQueue.push(event);

    // Keep queue size manageable (max 100 events)
    if (this.eventQueue.length > 100) {
      this.eventQueue = this.eventQueue.slice(-100);
    }

    // In a real implementation, this would send to analytics service
    console.log('AI Tutor Telemetry:', event);
  }

  private generateSessionId(): string {
    return `tutor_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create telemetry instance
 */
export function createTutorTelemetry(sessionId?: string): AITutorTelemetry {
  return new AITutorTelemetry(sessionId);
}

/**
 * Hook for tutor telemetry integration
 */
export function useTutorTelemetry(sessionId?: string): AITutorTelemetry {
  return useMemo(() => createTutorTelemetry(sessionId), [sessionId]);
}
