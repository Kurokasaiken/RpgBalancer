/**
 * Quest Telemetry Events
 * 
 * Telemetry event system for quest heatmap and decision feed interactions.
 * Provides event emission and subscription utilities following RPG Balancer
 * telemetry patterns.
 * 
 * @fileoverview Quest telemetry event system
 * @module idleVillage/questTelemetryEvents
 * @since 2026-01-12
 * @author Cascade
 */

import type { HeatmapCell } from '@/ui/idleVillage/utils/questTelemetryTransforms';
import type { DecisionFeedItem } from '@/ui/idleVillage/utils/questTelemetryTransforms';
import type { QuestTelemetryConfig } from '@/balancing/config/idleVillage/questTelemetryConfig';

/**
 * Base telemetry event structure
 */
export interface QuestTelemetryEvent {
  /** Event type identifier */
  eventType: string;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Session identifier */
  sessionId: string;
  /** Additional event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Heatmap rendered telemetry event
 */
export interface QuestHeatmapRenderedEvent extends QuestTelemetryEvent {
  eventType: 'quest_heatmap_rendered';
  /** Heatmap matrix dimensions */
  matrixDimensions: {
    rows: number;
    columns: number;
  };
  /** Number of populated cells */
  populatedCells: number;
  /** Risk distribution across buckets */
  riskDistribution: Record<string, number>;
  /** Configuration source */
  configSource: string;
  /** Render duration in milliseconds */
  renderDuration?: number;
}

/**
 * Decision selected telemetry event
 */
export interface QuestDecisionSelectedEvent extends QuestTelemetryEvent {
  eventType: 'quest_decision_selected';
  /** Decision identifier */
  decisionId: string;
  /** Quest identifier */
  questId: string;
  /** Decision type */
  decisionType: 'accept' | 'reject' | 'defer';
  /** Decision outcome */
  outcome: 'success' | 'failure' | 'pending';
  /** Risk percentage at time of decision */
  riskPercentage: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Quest type */
  questType: string;
  /** Decision timestamp */
  decisionTimestamp: number;
}

/**
 * Heatmap cell clicked telemetry event
 */
export interface QuestHeatmapCellClickedEvent extends QuestTelemetryEvent {
  eventType: 'quest_heatmap_cell_clicked';
  /** Cell position */
  cellPosition: {
    row: number;
    column: number;
  };
  /** Cell value (risk percentage) */
  cellValue: number;
  /** Risk bucket */
  riskBucket: string;
  /** Associated quest data */
  questData?: {
    questId: string;
    questType: string;
    success: boolean;
    confidence: number;
  };
}

/**
 * Quest telemetry event subscription
 */
export interface QuestTelemetrySubscription {
  /** Subscription identifier */
  id: string;
  /** Event types to subscribe to */
  eventTypes: string[];
  /** Event handler function */
  handler: (event: QuestTelemetryEvent) => void;
  /** Subscription timestamp */
  subscribedAt: number;
}

/**
 * Quest telemetry event emitter configuration
 */
export interface QuestTelemetryConfig {
  /** Enable event emission */
  enabled: boolean;
  /** Session identifier */
  sessionId: string;
  /** Event buffer size */
  bufferSize: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Quest telemetry event emitter
 */
export class QuestTelemetryEmitter {
  private config: QuestTelemetryConfig;
  private subscriptions: Map<string, QuestTelemetrySubscription> = new Map();
  private eventBuffer: QuestTelemetryEvent[] = [];

  constructor(config: Partial<QuestTelemetryConfig> = {}) {
    this.config = {
      enabled: true,
      sessionId: this.generateSessionId(),
      bufferSize: 100,
      debug: false,
      ...config,
    };
  }

  /**
   * Generate a unique session identifier
   */
  private generateSessionId(): string {
    return `quest-telemetry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit a telemetry event
   */
  emit(event: Omit<QuestTelemetryEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) return;

    const fullEvent: QuestTelemetryEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.config.sessionId,
    };

    // Add to buffer
    this.eventBuffer.push(fullEvent);
    if (this.eventBuffer.length > this.config.bufferSize) {
      this.eventBuffer.shift();
    }

    // Debug logging
    if (this.config.debug) {
      console.log('[QuestTelemetryEmitter] Event emitted:', fullEvent);
    }

    // Notify subscribers
    this.notifySubscribers(fullEvent);
  }

  /**
   * Emit heatmap rendered event
   */
  emitHeatmapRendered(params: {
    matrixDimensions: { rows: number; columns: number };
    populatedCells: number;
    riskDistribution: Record<string, number>;
    configSource: string;
    renderDuration?: number;
  }): void {
    this.emit({
      eventType: 'quest_heatmap_rendered',
      metadata: params,
    });
  }

  /**
   * Emit decision selected event
   */
  emitDecisionSelected(decision: DecisionFeedItem): void {
    this.emit({
      eventType: 'quest_decision_selected',
      metadata: {
        decisionId: decision.id,
        questId: decision.questId,
        decisionType: decision.type,
        outcome: decision.outcome,
        riskPercentage: decision.riskPercentage,
        confidence: decision.confidence,
        questType: decision.questType,
        decisionTimestamp: decision.timestamp,
      },
    });
  }

  /**
   * Emit heatmap cell clicked event
   */
  emitHeatmapCellClicked(cell: HeatmapCell): void {
    this.emit({
      eventType: 'quest_heatmap_cell_clicked',
      metadata: {
        cellPosition: { row: cell.row, column: cell.column },
        cellValue: cell.value,
        riskBucket: cell.riskBucket?.id || 'unknown',
        questData: cell.questData ? {
          questId: cell.questData.questId,
          questType: cell.questData.questType,
          success: cell.questData.success,
          confidence: cell.questData.confidence,
        } : undefined,
      },
    });
  }

  /**
   * Subscribe to telemetry events
   */
  subscribe(eventTypes: string[], handler: (event: QuestTelemetryEvent) => void): string {
    const subscription: QuestTelemetrySubscription = {
      id: this.generateSubscriptionId(),
      eventTypes,
      handler,
      subscribedAt: Date.now(),
    };

    this.subscriptions.set(subscription.id, subscription);

    if (this.config.debug) {
      console.log('[QuestTelemetryEmitter] Subscription created:', subscription);
    }

    return subscription.id;
  }

  /**
   * Unsubscribe from telemetry events
   */
  unsubscribe(subscriptionId: string): void {
    const removed = this.subscriptions.delete(subscriptionId);
    
    if (this.config.debug && removed) {
      console.log('[QuestTelemetryEmitter] Subscription removed:', subscriptionId);
    }
  }

  /**
   * Get event buffer
   */
  getEventBuffer(): QuestTelemetryEvent[] {
    return [...this.eventBuffer];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): QuestTelemetryEvent[] {
    return this.eventBuffer.filter(event => event.eventType === eventType);
  }

  /**
   * Clear event buffer
   */
  clearBuffer(): void {
    this.eventBuffer = [];
    if (this.config.debug) {
      console.log('[QuestTelemetryEmitter] Event buffer cleared');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QuestTelemetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debug) {
      console.log('[QuestTelemetryEmitter] Configuration updated:', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): QuestTelemetryConfig {
    return { ...this.config };
  }

  /**
   * Generate subscription identifier
   */
  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify subscribers of event
   */
  private notifySubscribers(event: QuestTelemetryEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.eventTypes.includes(event.eventType)) {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error('[QuestTelemetryEmitter] Subscription handler error:', error);
        }
      }
    }
  }
}

/**
 * Global telemetry emitter instance
 */
export const questTelemetryEmitter = new QuestTelemetryEmitter();

/**
 * Hook for subscribing to quest telemetry events
 */
export function useQuestTelemetryEvents(
  eventTypes: string[],
  handler: (event: QuestTelemetryEvent) => void,
  deps: React.DependencyList = []
): () => void {
  const subscriptionRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Subscribe to events
    const subscriptionId = questTelemetryEmitter.subscribe(eventTypes, handler);
    subscriptionRef.current = subscriptionId;

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        questTelemetryEmitter.unsubscribe(subscriptionRef.current);
      }
    };
  }, deps);

  return () => {
    if (subscriptionRef.current) {
      questTelemetryEmitter.unsubscribe(subscriptionRef.current);
    }
  };
}

/**
 * Hook for heatmap telemetry
 */
export function useQuestHeatmapTelemetry(
  onRendered?: (event: QuestHeatmapRenderedEvent) => void,
  onCellClicked?: (event: QuestHeatmapCellClickedEvent) => void
): {
  emitRendered: (params: QuestHeatmapRenderedEvent['metadata']) => void;
  emitCellClicked: (cell: HeatmapCell) => void;
} {
  const emitRendered = React.useCallback((params: QuestHeatmapRenderedEvent['metadata']) => {
    questTelemetryEmitter.emitHeatmapRendered(params);
  }, []);

  const emitCellClicked = React.useCallback((cell: HeatmapCell) => {
    questTelemetryEmitter.emitHeatmapCellClicked(cell);
  }, []);

  // Subscribe to events if handlers provided
  useQuestTelemetryEvents(
    ['quest_heatmap_rendered', 'quest_heatmap_cell_clicked'],
    (event) => {
      if (event.eventType === 'quest_heatmap_rendered' && onRendered) {
        onRendered(event as QuestHeatmapRenderedEvent);
      } else if (event.eventType === 'quest_heatmap_cell_clicked' && onCellClicked) {
        onCellClicked(event as QuestHeatmapCellClickedEvent);
      }
    },
    [onRendered, onCellClicked]
  );

  return { emitRendered, emitCellClicked };
}

/**
 * Hook for decision feed telemetry
 */
export function useQuestDecisionTelemetry(
  onDecisionSelected?: (event: QuestDecisionSelectedEvent) => void
): {
  emitDecisionSelected: (decision: DecisionFeedItem) => void;
} {
  const emitDecisionSelected = React.useCallback((decision: DecisionFeedItem) => {
    questTelemetryEmitter.emitDecisionSelected(decision);
  }, []);

  // Subscribe to events if handler provided
  useQuestTelemetryEvents(
    ['quest_decision_selected'],
    (event) => {
      if (event.eventType === 'quest_decision_selected' && onDecisionSelected) {
        onDecisionSelected(event as QuestDecisionSelectedEvent);
      }
    },
    [onDecisionSelected]
  );

  return { emitDecisionSelected };
}

/**
 * React import for hooks
 */
import React from 'react';

export default {
  QuestTelemetryEmitter,
  questTelemetryEmitter,
  useQuestTelemetryEvents,
  useQuestHeatmapTelemetry,
  useQuestDecisionTelemetry,
};
