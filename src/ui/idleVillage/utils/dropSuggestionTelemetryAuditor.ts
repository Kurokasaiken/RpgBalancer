/**
 * Idle Village Drop Suggestion Telemetry Auditor
 *
 * Comprehensive telemetry auditing system for Idle Village drop suggestions.
 * Tracks suggestion events, user interactions, effectiveness metrics, and provides
 * analytics for optimizing the drop suggestion system.
 *
 * @since NP-106
 */

import { useCallback, useRef, useMemo } from 'react';
import type { Resident, ActivitySlot, Location } from '../types';

/**
 * Drop suggestion event types for telemetry tracking
 */
export type DropSuggestionEventType =
  | 'suggestion_generated'
  | 'suggestion_displayed'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'suggestion_dismissed'
  | 'suggestion_timeout'
  | 'drop_validation_success'
  | 'drop_validation_failure'
  | 'resident_assigned'
  | 'assignment_reverted';

/**
 * Drop suggestion context information
 */
export interface DropSuggestionContext {
  /** Unique suggestion identifier */
  suggestionId: string;
  /** Resident being suggested for drop */
  residentId: string;
  /** Target slot for the drop */
  slotId: string;
  /** Location where drop is happening */
  locationId: string;
  /** Suggestion confidence score (0-1) */
  confidence: number;
  /** Reason for the suggestion */
  reason: 'optimal_fit' | 'emergency_coverage' | 'skill_match' | 'load_balancing';
  /** Alternative suggestions available */
  alternativesCount: number;
  /** Current fatigue level of resident */
  residentFatigue: number;
  /** Current slot utilization */
  slotUtilization: number;
}

/**
 * User interaction metrics
 */
export interface SuggestionInteractionMetrics {
  /** Time to first interaction (ms) */
  timeToInteract?: number;
  /** Whether user hesitated before accepting */
  hesitationDetected: boolean;
  /** Number of times suggestion was viewed */
  viewCount: number;
  /** Whether suggestion was acted upon */
  actedUpon: boolean;
  /** User feedback rating (1-5, if collected) */
  userRating?: number;
}

/**
 * Drop suggestion telemetry event
 */
export interface DropSuggestionTelemetryEvent {
  /** Unique event ID */
  id: string;
  /** Event type */
  type: DropSuggestionEventType;
  /** Timestamp */
  timestamp: number;
  /** Session ID for grouping */
  sessionId: string;
  /** Suggestion context */
  context: DropSuggestionContext;
  /** Interaction metrics */
  metrics?: SuggestionInteractionMetrics;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Suggestion effectiveness metrics
 */
export interface SuggestionEffectivenessMetrics {
  /** Total suggestions generated */
  totalSuggestions: number;
  /** Suggestions accepted by user */
  acceptedSuggestions: number;
  /** Suggestions rejected by user */
  rejectedSuggestions: number;
  /** Suggestions dismissed/ignored */
  dismissedSuggestions: number;
  /** Acceptance rate percentage */
  acceptanceRate: number;
  /** Average time to accept suggestion */
  averageAcceptanceTime: number;
  /** Average confidence of accepted suggestions */
  averageAcceptedConfidence: number;
  /** Most common rejection reasons */
  commonRejectionReasons: Record<string, number>;
  /** Suggestions by reason type */
  suggestionsByReason: Record<string, number>;
}

/**
 * Drop suggestion telemetry configuration
 */
export interface DropSuggestionTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Whether to track detailed interactions */
  trackInteractions: boolean;
  /** Whether to collect user feedback */
  collectUserFeedback: boolean;
  /** Session identifier */
  sessionId?: string;
  /** Maximum events to keep in memory */
  maxEventsInMemory: number;
  /** Whether to enable effectiveness analytics */
  enableAnalytics: boolean;
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_DROP_SUGGESTION_TELEMETRY_CONFIG: DropSuggestionTelemetryConfig = {
  enabled: true,
  trackInteractions: true,
  collectUserFeedback: false,
  maxEventsInMemory: 200,
  enableAnalytics: true,
  sessionId: `idle_drop_suggestions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

/**
 * Drop suggestion telemetry auditor hook
 */
export function useDropSuggestionTelemetryAuditor(
  config: Partial<DropSuggestionTelemetryConfig> = {}
) {
  const fullConfig = useMemo(
    () => ({ ...DEFAULT_DROP_SUGGESTION_TELEMETRY_CONFIG, ...config }),
    [config]
  );

  const eventsRef = useRef<DropSuggestionTelemetryEvent[]>([]);
  const suggestionTimersRef = useRef<Map<string, number>>(new Map());

  /**
   * Record a suggestion generation event
   */
  const recordSuggestionGenerated = useCallback(
    (
      context: DropSuggestionContext,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const event: DropSuggestionTelemetryEvent = {
        id: `suggestion_${context.suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'suggestion_generated',
        timestamp: Date.now(),
        sessionId: fullConfig.sessionId!,
        context,
        metadata,
      };

      eventsRef.current.push(event);

      // Start timing for this suggestion
      if (fullConfig.trackInteractions) {
        suggestionTimersRef.current.set(context.suggestionId, Date.now());
      }

      // Keep only recent events
      if (eventsRef.current.length > fullConfig.maxEventsInMemory) {
        eventsRef.current = eventsRef.current.slice(-fullConfig.maxEventsInMemory);
      }
    },
    [fullConfig]
  );

  /**
   * Record a suggestion display event
   */
  const recordSuggestionDisplayed = useCallback(
    (
      suggestionId: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const existingEvent = eventsRef.current.find(
        e => e.context.suggestionId === suggestionId && e.type === 'suggestion_generated'
      );

      if (existingEvent) {
        const event: DropSuggestionTelemetryEvent = {
          id: `display_${suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion_displayed',
          timestamp: Date.now(),
          sessionId: fullConfig.sessionId!,
          context: existingEvent.context,
          metadata,
        };

        eventsRef.current.push(event);
      }
    },
    [fullConfig]
  );

  /**
   * Record suggestion acceptance
   */
  const recordSuggestionAccepted = useCallback(
    (
      suggestionId: string,
      userRating?: number,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const existingEvent = eventsRef.current.find(
        e => e.context.suggestionId === suggestionId
      );

      if (existingEvent) {
        const startTime = suggestionTimersRef.current.get(suggestionId);
        const timeToAccept = startTime ? Date.now() - startTime : undefined;

        const event: DropSuggestionTelemetryEvent = {
          id: `accept_${suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion_accepted',
          timestamp: Date.now(),
          sessionId: fullConfig.sessionId!,
          context: existingEvent.context,
          metrics: {
            timeToInteract: timeToAccept,
            hesitationDetected: timeToAccept ? timeToAccept > 5000 : false, // 5s hesitation threshold
            viewCount: 1, // Simplified - could be enhanced
            actedUpon: true,
            userRating,
          },
          metadata,
        };

        eventsRef.current.push(event);
        suggestionTimersRef.current.delete(suggestionId);
      }
    },
    [fullConfig]
  );

  /**
   * Record suggestion rejection
   */
  const recordSuggestionRejected = useCallback(
    (
      suggestionId: string,
      reason: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const existingEvent = eventsRef.current.find(
        e => e.context.suggestionId === suggestionId
      );

      if (existingEvent) {
        const startTime = suggestionTimersRef.current.get(suggestionId);
        const timeToReject = startTime ? Date.now() - startTime : undefined;

        const event: DropSuggestionTelemetryEvent = {
          id: `reject_${suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion_rejected',
          timestamp: Date.now(),
          sessionId: fullConfig.sessionId!,
          context: existingEvent.context,
          metrics: {
            timeToInteract: timeToReject,
            hesitationDetected: false,
            viewCount: 1,
            actedUpon: true,
          },
          metadata: {
            rejectionReason: reason,
            ...metadata,
          },
        };

        eventsRef.current.push(event);
        suggestionTimersRef.current.delete(suggestionId);
      }
    },
    [fullConfig]
  );

  /**
   * Record suggestion dismissal
   */
  const recordSuggestionDismissed = useCallback(
    (
      suggestionId: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const existingEvent = eventsRef.current.find(
        e => e.context.suggestionId === suggestionId
      );

      if (existingEvent) {
        const event: DropSuggestionTelemetryEvent = {
          id: `dismiss_${suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion_dismissed',
          timestamp: Date.now(),
          sessionId: fullConfig.sessionId!,
          context: existingEvent.context,
          metrics: {
            hesitationDetected: false,
            viewCount: 1,
            actedUpon: false,
          },
          metadata,
        };

        eventsRef.current.push(event);
        suggestionTimersRef.current.delete(suggestionId);
      }
    },
    [fullConfig]
  );

  /**
   * Record drop validation result
   */
  const recordDropValidation = useCallback(
    (
      suggestionId: string,
      success: boolean,
      validationErrors?: string[],
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const existingEvent = eventsRef.current.find(
        e => e.context.suggestionId === suggestionId
      );

      if (existingEvent) {
        const event: DropSuggestionTelemetryEvent = {
          id: `validation_${suggestionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: success ? 'drop_validation_success' : 'drop_validation_failure',
          timestamp: Date.now(),
          sessionId: fullConfig.sessionId!,
          context: existingEvent.context,
          metadata: {
            validationErrors,
            ...metadata,
          },
        };

        eventsRef.current.push(event);
      }
    },
    [fullConfig]
  );

  /**
   * Calculate effectiveness metrics
   */
  const calculateEffectivenessMetrics = useCallback((): SuggestionEffectivenessMetrics => {
    const events = eventsRef.current;

    const generated = events.filter(e => e.type === 'suggestion_generated').length;
    const accepted = events.filter(e => e.type === 'suggestion_accepted').length;
    const rejected = events.filter(e => e.type === 'suggestion_rejected').length;
    const dismissed = events.filter(e => e.type === 'suggestion_dismissed').length;

    const acceptanceRate = generated > 0 ? (accepted / generated) * 100 : 0;

    // Calculate average acceptance time
    const acceptanceEvents = events.filter(e => e.type === 'suggestion_accepted' && e.metrics?.timeToInteract);
    const averageAcceptanceTime = acceptanceEvents.length > 0
      ? acceptanceEvents.reduce((sum, e) => sum + (e.metrics!.timeToInteract || 0), 0) / acceptanceEvents.length
      : 0;

    // Calculate average confidence of accepted suggestions
    const acceptedEvents = events.filter(e => e.type === 'suggestion_accepted');
    const averageAcceptedConfidence = acceptedEvents.length > 0
      ? acceptedEvents.reduce((sum, e) => sum + e.context.confidence, 0) / acceptedEvents.length
      : 0;

    // Common rejection reasons
    const rejectionReasons: Record<string, number> = {};
    events
      .filter(e => e.type === 'suggestion_rejected')
      .forEach(e => {
        const reason = (e.metadata?.rejectionReason as string) || 'unknown';
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      });

    // Suggestions by reason
    const suggestionsByReason: Record<string, number> = {};
    events
      .filter(e => e.type === 'suggestion_generated')
      .forEach(e => {
        const reason = e.context.reason;
        suggestionsByReason[reason] = (suggestionsByReason[reason] || 0) + 1;
      });

    return {
      totalSuggestions: generated,
      acceptedSuggestions: accepted,
      rejectedSuggestions: rejected,
      dismissedSuggestions: dismissed,
      acceptanceRate,
      averageAcceptanceTime,
      averageAcceptedConfidence,
      commonRejectionReasons: rejectionReasons,
      suggestionsByReason,
    };
  }, [eventsRef]);

  /**
   * Get suggestions by effectiveness ranking
   */
  const getTopSuggestionsByEffectiveness = useCallback(() => {
    const events = eventsRef.current;
    const suggestionStats: Record<string, {
      suggestionId: string;
      accepted: number;
      rejected: number;
      dismissed: number;
      acceptanceRate: number;
      averageConfidence: number;
    }> = {};

    // Group events by suggestion ID
    events.forEach(event => {
      const id = event.context.suggestionId;
      if (!suggestionStats[id]) {
        suggestionStats[id] = {
          suggestionId: id,
          accepted: 0,
          rejected: 0,
          dismissed: 0,
          acceptanceRate: 0,
          averageConfidence: event.context.confidence,
        };
      }

      switch (event.type) {
        case 'suggestion_accepted':
          suggestionStats[id].accepted++;
          break;
        case 'suggestion_rejected':
          suggestionStats[id].rejected++;
          break;
        case 'suggestion_dismissed':
          suggestionStats[id].dismissed++;
          break;
      }
    });

    // Calculate acceptance rates
    Object.values(suggestionStats).forEach(stat => {
      const total = stat.accepted + stat.rejected + stat.dismissed;
      stat.acceptanceRate = total > 0 ? (stat.accepted / total) * 100 : 0;
    });

    // Sort by acceptance rate (descending)
    return Object.values(suggestionStats)
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 10); // Top 10
  }, []);

  /**
   * Export telemetry data
   */
  const exportTelemetryData = useCallback(() => {
    return {
      config: fullConfig,
      events: eventsRef.current,
      effectivenessMetrics: calculateEffectivenessMetrics(),
      topSuggestions: getTopSuggestionsByEffectiveness(),
      exportTimestamp: Date.now(),
    };
  }, [fullConfig, calculateEffectivenessMetrics, getTopSuggestionsByEffectiveness]);

  /**
   * Clear telemetry data
   */
  const clearTelemetryData = useCallback(() => {
    eventsRef.current = [];
    suggestionTimersRef.current.clear();
  }, []);

  return {
    config: fullConfig,

    // Event recording methods
    recordSuggestionGenerated,
    recordSuggestionDisplayed,
    recordSuggestionAccepted,
    recordSuggestionRejected,
    recordSuggestionDismissed,
    recordDropValidation,

    // Analytics methods
    calculateEffectivenessMetrics,
    getTopSuggestionsByEffectiveness,

    // Data management
    exportTelemetryData,
    clearTelemetryData,

    // Raw data access
    get events() {
      return eventsRef.current;
    },
  };
}

/**
 * Drop suggestion telemetry utilities
 */
export class DropSuggestionTelemetryUtils {
  /**
   * Generate unique suggestion ID
   */
  static generateSuggestionId(): string {
    return `drop_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate suggestion confidence score
   */
  static calculateSuggestionConfidence(
    resident: Resident,
    slot: ActivitySlot,
    location: Location
  ): number {
    // Simplified confidence calculation
    // In real implementation, this would consider multiple factors
    let confidence = 0.5; // Base confidence

    // Factor in skill match
    if (resident.skills && slot.requiredSkills) {
      const skillMatch = resident.skills.filter(skill =>
        slot.requiredSkills?.includes(skill)
      ).length;
      confidence += (skillMatch / (slot.requiredSkills?.length || 1)) * 0.3;
    }

    // Factor in fatigue (lower fatigue = higher confidence)
    confidence += (1 - resident.fatigue / 100) * 0.2;

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Determine suggestion reason
   */
  static determineSuggestionReason(
    resident: Resident,
    slot: ActivitySlot,
    location: Location
  ): DropSuggestionContext['reason'] {
    // Emergency coverage (high priority slots)
    if (slot.priority === 'high') {
      return 'emergency_coverage';
    }

    // Skill match
    if (resident.skills && slot.requiredSkills) {
      const skillMatch = resident.skills.filter(skill =>
        slot.requiredSkills?.includes(skill)
      ).length;
      if (skillMatch > 0) {
        return 'skill_match';
      }
    }

    // Load balancing (low utilization slots)
    if (slot.utilization < 50) {
      return 'load_balancing';
    }

    return 'optimal_fit';
  }

  /**
   * Generate effectiveness report
   */
  static generateEffectivenessReport(metrics: SuggestionEffectivenessMetrics): string {
    return `
Drop Suggestion Effectiveness Report
===================================

Overview:
- Total Suggestions: ${metrics.totalSuggestions}
- Acceptance Rate: ${metrics.acceptanceRate.toFixed(1)}%
- Average Acceptance Time: ${metrics.averageAcceptanceTime.toFixed(0)}ms
- Average Accepted Confidence: ${(metrics.averageAcceptedConfidence * 100).toFixed(1)}%

Breakdown:
- Accepted: ${metrics.acceptedSuggestions}
- Rejected: ${metrics.rejectedSuggestions}
- Dismissed: ${metrics.dismissedSuggestions}

Suggestions by Reason:
${Object.entries(metrics.suggestionsByReason)
  .map(([reason, count]) => `- ${reason}: ${count}`)
  .join('\n')}

Common Rejection Reasons:
${Object.entries(metrics.commonRejectionReasons)
  .slice(0, 5)
  .map(([reason, count]) => `- ${reason}: ${count}`)
  .join('\n')}
    `.trim();
  }
}
