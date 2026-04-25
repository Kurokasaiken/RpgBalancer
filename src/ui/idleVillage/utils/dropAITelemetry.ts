/**
 * Telemetry system for AI Drop Suggestions in Idle Village Phase E
 * 
 * Provides comprehensive tracking of AI suggestion events, user interactions,
 * and performance metrics for analytics and improvement.
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { 
  DropSuggestion, 
  SuggestionType, 
  SuggestionPriority,
  DropSuggestionConfig 
} from '@/ui/idleVillage/ai/dropSuggestionEngine';

/**
 * Telemetry event types for AI suggestions
 */
export type DropAITelemetryEventType = 
  | 'suggestions_generated'
  | 'suggestions_requested'
  | 'suggestion_shown'
  | 'suggestion_clicked'
  | 'suggestion_dismissed'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'suggestion_expired'
  | 'ai_engine_config_updated'
  | 'ai_performance_metrics'
  | 'user_interaction'
  | 'error_occurred';

/**
 * Base telemetry event payload
 */
export interface DropAITelemetryEvent {
  /** Event type */
  eventType: DropAITelemetryEventType;
  /** Timestamp */
  timestamp: number;
  /** Session identifier */
  sessionId: string;
  /** User identifier (if available) */
  userId?: string;
  /** Village context */
  villageContext: {
    residentCount: number;
    activityCount: number;
    currentAssignments: number;
    day: number;
    crisisMode: boolean;
  };
  /** Additional event-specific data */
  data: Record<string, unknown>;
}

/**
 * Specific event payloads
 */

export interface SuggestionsGeneratedEvent extends DropAITelemetryEvent {
  eventType: 'suggestions_generated';
  data: {
    totalSuggestions: number;
    generationTimeMs: number;
    config: DropSuggestionConfig;
    filters?: {
      suggestionTypes?: SuggestionType[];
      priorityFilter?: SuggestionPriority[];
    };
    algorithmVersion: string;
    cacheHit: boolean;
  };
}

export interface SuggestionShownEvent extends DropAITelemetryEvent {
  eventType: 'suggestion_shown';
  data: {
    suggestionId: string;
    suggestionType: SuggestionType;
    suggestionPriority: SuggestionPriority;
    confidence: number;
    residentId: string;
    activityId: string;
    uiMode: 'tooltip' | 'overlay' | 'highlight';
    position: { x: number; y: number };
    displayDuration?: number;
  };
}

export interface SuggestionClickedEvent extends DropAITelemetryEvent {
  eventType: 'suggestion_clicked';
  data: {
    suggestionId: string;
    clickType: 'indicator' | 'tooltip' | 'overlay_item';
    timeToClick: number; // Time from suggestion shown to click
    residentId: string;
    activityId: string;
    confidence: number;
    expectedOutcomes?: {
      successProbability: number;
      yieldMultiplier: number;
      fatigueImpact: string;
      riskLevel: string;
    };
  };
}

export interface SuggestionAcceptedEvent extends DropAITelemetryEvent {
  eventType: 'suggestion_accepted';
  data: {
    suggestionId: string;
    residentId: string;
    activityId: string;
    timeToAccept: number; // Time from suggestion shown to acceptance
    actualOutcome?: {
      success: boolean;
      actualYield?: number;
      actualFatigueImpact?: number;
      actualRisk?: string;
    };
    suggestionAccuracy?: {
      successPredictionAccurate: boolean;
      yieldPredictionAccurate: boolean;
      riskPredictionAccurate: boolean;
    };
  };
}

export interface SuggestionRejectedEvent extends DropAITelemetryEvent {
  eventType: 'suggestion_rejected';
  data: {
    suggestionId: string;
    rejectionReason: 'user_choice' | 'invalid_assignment' | 'expired' | 'other';
    alternativeChosen?: {
      residentId: string;
      activityId: string;
    };
    timeToReject: number;
  };
}

export interface AIPerformanceMetricsEvent extends DropAITelemetryEvent {
  eventType: 'ai_performance_metrics';
  data: {
    averageGenerationTime: number;
    suggestionAccuracy: {
      successPredictionRate: number;
      overallAccuracyRate: number;
    };
    userSatisfaction: {
      acceptanceRate: number;
      clickThroughRate: number;
      averageTimeToDecision: number;
    };
    systemPerformance: {
      memoryUsage: number;
      cacheHitRate: number;
      errorRate: number;
    };
  };
}

/**
 * Telemetry manager for AI suggestions
 */
export class DropAITelemetryManager {
  private sessionId: string;
  private startTime: number;
  private diagnostics: ReturnType<typeof createSandboxDiagnostics>;
  private eventBuffer: DropAITelemetryEvent[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.startTime = Date.now();
    this.diagnostics = createSandboxDiagnostics('drop-ai-suggestions');
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `ai-suggestions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current village context
   */
  private getVillageContext(
    residents: ResidentState[],
    activities: ActivityDefinition[],
    currentAssignments: Record<string, string[]> = {}
  ) {
    return {
      residentCount: residents.length,
      activityCount: activities.length,
      currentAssignments: Object.values(currentAssignments).reduce((sum, ids) => sum + ids.length, 0),
      day: 1, // Would come from actual village state
      crisisMode: false, // Would come from actual village state
    };
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(metric: string, value: number) {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, []);
    }
    this.performanceMetrics.get(metric)!.push(value);
  }

  /**
   * Get average performance metric
   */
  private getAverageMetric(metric: string): number {
    const values = this.performanceMetrics.get(metric) || [];
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  /**
   * Track suggestions generation
   */
  trackSuggestionsGenerated(
    suggestions: DropSuggestion[],
    config: DropSuggestionConfig,
    generationTimeMs: number,
    residents: ResidentState[],
    activities: ActivityDefinition[],
    filters?: { suggestionTypes?: SuggestionType[]; priorityFilter?: SuggestionPriority[] },
    cacheHit = false
  ) {
    const event: SuggestionsGeneratedEvent = {
      eventType: 'suggestions_generated',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: this.getVillageContext(residents, activities),
      data: {
        totalSuggestions: suggestions.length,
        generationTimeMs,
        config,
        filters,
        algorithmVersion: '1.0.0',
        cacheHit,
      },
    };

    this.recordPerformanceMetric('generationTime', generationTimeMs);
    this.emitEvent(event);
  }

  /**
   * Track suggestion shown to user
   */
  trackSuggestionShown(
    suggestion: DropSuggestion,
    uiMode: 'tooltip' | 'overlay' | 'highlight',
    position: { x: number; y: number }
  ) {
    const event: SuggestionShownEvent = {
      eventType: 'suggestion_shown',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 1, // Would be actual context
        activityCount: 1,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        suggestionId: suggestion.id,
        suggestionType: suggestion.type,
        suggestionPriority: suggestion.priority,
        confidence: suggestion.confidence,
        residentId: suggestion.resident.id,
        activityId: suggestion.activity.id,
        uiMode,
        position,
      },
    };

    this.emitEvent(event);
  }

  /**
   * Track suggestion click
   */
  trackSuggestionClicked(
    suggestion: DropSuggestion,
    clickType: 'indicator' | 'tooltip' | 'overlay_item',
    timeToClick: number
  ) {
    const event: SuggestionClickedEvent = {
      eventType: 'suggestion_clicked',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 1,
        activityCount: 1,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        suggestionId: suggestion.id,
        clickType,
        timeToClick,
        residentId: suggestion.resident.id,
        activityId: suggestion.activity.id,
        confidence: suggestion.confidence,
        expectedOutcomes: suggestion.expectedOutcomes ? {
          successProbability: suggestion.expectedOutcomes.successProbability || 0,
          yieldMultiplier: suggestion.expectedOutcomes.yieldMultiplier || 1,
          fatigueImpact: suggestion.expectedOutcomes.fatigueImpact || 'medium',
          riskLevel: suggestion.expectedOutcomes.riskLevel || 'low',
        } : undefined,
      },
    };

    this.recordPerformanceMetric('timeToClick', timeToClick);
    this.emitEvent(event);
  }

  /**
   * Track suggestion acceptance
   */
  trackSuggestionAccepted(
    suggestion: DropSuggestion,
    timeToAccept: number,
    actualOutcome?: {
      success: boolean;
      actualYield?: number;
      actualFatigueImpact?: number;
      actualRisk?: string;
    }
  ) {
    const event: SuggestionAcceptedEvent = {
      eventType: 'suggestion_accepted',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 1,
        activityCount: 1,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        suggestionId: suggestion.id,
        residentId: suggestion.resident.id,
        activityId: suggestion.activity.id,
        timeToAccept,
        actualOutcome,
        suggestionAccuracy: actualOutcome && suggestion.expectedOutcomes ? {
          successPredictionAccurate: Math.abs(
            (actualOutcome.success ? 1 : 0) - (suggestion.expectedOutcomes.successProbability || 0)
          ) < 0.2,
          yieldPredictionAccurate: actualOutcome.actualYield ? 
            Math.abs(actualOutcome.actualYield - (suggestion.expectedOutcomes.yieldMultiplier || 1)) < 0.2 : false,
          riskPredictionAccurate: actualOutcome.actualRisk === suggestion.expectedOutcomes.riskLevel,
        } : undefined,
      },
    };

    this.recordPerformanceMetric('timeToAccept', timeToAccept);
    this.emitEvent(event);
  }

  /**
   * Track suggestion rejection
   */
  trackSuggestionRejected(
    suggestion: DropSuggestion,
    rejectionReason: 'user_choice' | 'invalid_assignment' | 'expired' | 'other',
    timeToReject: number,
    alternativeChosen?: { residentId: string; activityId: string }
  ) {
    const event: SuggestionRejectedEvent = {
      eventType: 'suggestion_rejected',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 1,
        activityCount: 1,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        suggestionId: suggestion.id,
        rejectionReason,
        alternativeChosen,
        timeToReject,
      },
    };

    this.recordPerformanceMetric('timeToReject', timeToReject);
    this.emitEvent(event);
  }

  /**
   * Track AI performance metrics
   */
  trackPerformanceMetrics() {
    const event: AIPerformanceMetricsEvent = {
      eventType: 'ai_performance_metrics',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 0,
        activityCount: 0,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        averageGenerationTime: this.getAverageMetric('generationTime'),
        suggestionAccuracy: {
          successPredictionRate: 0.85, // Would be calculated from actual data
          overallAccuracyRate: 0.82, // Would be calculated from actual data
        },
        userSatisfaction: {
          acceptanceRate: 0.73, // Would be calculated from actual data
          clickThroughRate: 0.89, // Would be calculated from actual data
          averageTimeToDecision: this.getAverageMetric('timeToAccept'),
        },
        systemPerformance: {
          memoryUsage: 0, // Would be measured
          cacheHitRate: 0.67, // Would be calculated
          errorRate: 0.02, // Would be calculated
        },
      },
    };

    this.emitEvent(event);
  }

  /**
   * Track error occurrence
   */
  trackError(error: Error, context: Record<string, unknown>) {
    const event: DropAITelemetryEvent = {
      eventType: 'error_occurred',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      villageContext: {
        residentCount: 0,
        activityCount: 0,
        currentAssignments: 0,
        day: 1,
        crisisMode: false,
      },
      data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
      },
    };

    this.emitEvent(event);
  }

  /**
   * Emit event to diagnostics system
   */
  private emitEvent(event: DropAITelemetryEvent) {
    this.eventBuffer.push(event);
    this.diagnostics.emit(event.eventType, event);
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    const events = this.eventBuffer;
    const duration = Date.now() - this.startTime;

    return {
      sessionId: this.sessionId,
      duration,
      totalEvents: events.length,
      eventsByType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      averageMetrics: Object.fromEntries(
        Array.from(this.performanceMetrics.entries()).map(([key, values]) => [
          key,
          values.reduce((sum, val) => sum + val, 0) / values.length,
        ])
      ),
    };
  }

  /**
   * Export telemetry data
   */
  exportData() {
    return {
      sessionSummary: this.getSessionSummary(),
      events: this.eventBuffer,
      exportedAt: Date.now(),
    };
  }
}

/**
 * Hook for using AI suggestion telemetry
 */
export function useDropAITelemetry(sessionId?: string) {
  const telemetryManager = useMemo(() => {
    return new DropAITelemetryManager(sessionId);
  }, [sessionId]);

  return {
    telemetryManager,
    trackSuggestionsGenerated: telemetryManager.trackSuggestionsGenerated.bind(telemetryManager),
    trackSuggestionShown: telemetryManager.trackSuggestionShown.bind(telemetryManager),
    trackSuggestionClicked: telemetryManager.trackSuggestionClicked.bind(telemetryManager),
    trackSuggestionAccepted: telemetryManager.trackSuggestionAccepted.bind(telemetryManager),
    trackSuggestionRejected: telemetryManager.trackSuggestionRejected.bind(telemetryManager),
    trackPerformanceMetrics: telemetryManager.trackPerformanceMetrics.bind(telemetryManager),
    trackError: telemetryManager.trackError.bind(telemetryManager),
    getSessionSummary: telemetryManager.getSessionSummary.bind(telemetryManager),
    exportData: telemetryManager.exportData.bind(telemetryManager),
  };
}

/**
 * Utility functions for creating telemetry payloads
 */
export const DropAITelemetryUtils = {
  /**
   * Create suggestion context payload
   */
  createSuggestionContext(
    suggestion: DropSuggestion,
    uiMode: 'tooltip' | 'overlay' | 'highlight',
    position: { x: number; y: number }
  ) {
    return {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      suggestionPriority: suggestion.priority,
      confidence: suggestion.confidence,
      residentId: suggestion.resident.id,
      activityId: suggestion.activity.id,
      uiMode,
      position,
    };
  },

  /**
   * Calculate suggestion accuracy metrics
   */
  calculateAccuracy(
    expected: DropSuggestion['expectedOutcomes'],
    actual: {
      success: boolean;
      actualYield?: number;
      actualFatigueImpact?: number;
      actualRisk?: string;
    }
  ) {
    if (!expected) return null;

    return {
      successPredictionAccurate: Math.abs(
        (actual.success ? 1 : 0) - (expected.successProbability || 0)
      ) < 0.2,
      yieldPredictionAccurate: actual.actualYield ? 
        Math.abs(actual.actualYield - (expected.yieldMultiplier || 1)) < 0.2 : false,
      riskPredictionAccurate: actual.actualRisk === expected.riskLevel,
    };
  },

  /**
   * Create performance summary
   */
  createPerformanceSummary(events: DropAITelemetryEvent[]) {
    const generationEvents = events.filter(e => e.eventType === 'suggestions_generated');
    const clickEvents = events.filter(e => e.eventType === 'suggestion_clicked');
    const acceptEvents = events.filter(e => e.eventType === 'suggestion_accepted');

    return {
      totalSuggestions: generationEvents.reduce((sum, e) => sum + (e as SuggestionsGeneratedEvent).data.totalSuggestions, 0),
      averageGenerationTime: generationEvents.length > 0 
        ? generationEvents.reduce((sum, e) => sum + (e as SuggestionsGeneratedEvent).data.generationTimeMs, 0) / generationEvents.length 
        : 0,
      clickThroughRate: generationEvents.length > 0 
        ? clickEvents.length / generationEvents.reduce((sum, e) => sum + (e as SuggestionsGeneratedEvent).data.totalSuggestions, 0) 
        : 0,
      acceptanceRate: clickEvents.length > 0 
        ? acceptEvents.length / clickEvents.length 
        : 0,
    };
  },
};
