/**
 * Quest Telemetry System
 *
 * Dedicated telemetry system for quest data with event emission,
 * real-time analytics, and comprehensive tracking capabilities.
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { setSafeTimeout, clearSafeTimeout } from '@/shared/utils/TimerUtils';
import type { QuestResult, BranchDecision } from '@/engine/quest/types';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Quest telemetry event types
 */
export type QuestTelemetryEventType = 
  | 'quest_started'
  | 'quest_completed'
  | 'quest_failed'
  | 'branch_decision_made'
  | 'heroic_moment'
  | 'choice_time_recorded'
  | 'quest_type_analyzed'
  | 'performance_metric_calculated'
  | 'heatmap_data_generated'
  | 'decision_pattern_detected'
  | 'telemetry_exported'
  | 'system_error';

/**
 * Base telemetry event interface
 */
export interface QuestTelemetryEvent<T = unknown> {
  id: string;
  type: QuestTelemetryEventType;
  timestamp: number;
  sessionId: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Quest-specific telemetry events
 */
export interface QuestStartedEventData {
  questId: string;
  questType: string;
  difficulty: number;
  estimatedDuration: number;
  participantCount: number;
}

export interface QuestCompletedEventData {
  questId: string;
  questType: string;
  success: boolean;
  durationSeconds: number;
  branchCount: number;
  heroicMoments: number;
  finalState: Record<string, unknown>;
}

export interface BranchDecisionEventData {
  questId: string;
  phaseId: string;
  choiceMade: string;
  choiceTimeSeconds: number;
  success: boolean;
  outcome: string;
  isHeroic: boolean;
  context: Record<string, unknown>;
}

export interface HeroicMomentEventData {
  questId: string;
  phaseId: string;
  momentType: string;
  description: string;
  impact: 'minor' | 'major' | 'critical';
  participantActions: string[];
}

export interface ChoiceTimeRecordedEventData {
  questId: string;
  phaseId: string;
  choiceTimeSeconds: number;
  complexity: number;
  availableOptions: number;
  contextFactors: string[];
}

export interface QuestTypeAnalyzedEventData {
  questTypeId: string;
  totalQuests: number;
  successRate: number;
  averageDuration: number;
  difficultyScore: number;
  engagementScore: number;
  commonPatterns: string[];
}

export interface PerformanceMetricCalculatedEventData {
  metricName: string;
  value: number;
  unit: string;
  trend: 'improving' | 'declining' | 'stable';
  context: Record<string, unknown>;
}

export interface HeatmapDataGeneratedEventData {
  visualizationType: string;
  dataPoints: number;
  colorScheme: string;
  intensityRange: [number, number];
  filters: Record<string, unknown>;
}

export interface DecisionPatternDetectedEventData {
  patternName: string;
  frequency: number;
  confidence: number;
  associatedQuestTypes: string[];
  impactOnSuccess: number;
  recommendations: string[];
}

export interface TelemetryExportedEventData {
  exportFormat: string;
  recordCount: number;
  dateRange: [string, string];
  fileSize: number;
  compressionUsed: boolean;
}

export interface SystemErrorEventData {
  errorType: string;
  errorMessage: string;
  stack?: string;
  context: Record<string, unknown>;
  recovered: boolean;
}

/**
 * Telemetry system configuration
 */
export interface QuestTelemetrySystemConfig {
  enablePersistence: boolean;
  enableRealTimeEvents: boolean;
  maxEventsInMemory: number;
  persistenceKey: string;
  enableCompression: boolean;
  enableAnalytics: boolean;
  enableExport: boolean;
  debugMode: boolean;
  sessionTimeout: number;
  batchSize: number;
  flushInterval: number;
}

/**
 * Default telemetry system configuration
 */
export const DEFAULT_TELEMETRY_SYSTEM_CONFIG: QuestTelemetrySystemConfig = {
  enablePersistence: true,
  enableRealTimeEvents: true,
  maxEventsInMemory: 1000,
  persistenceKey: 'quest-telemetry-system',
  enableCompression: false,
  enableAnalytics: true,
  enableExport: true,
  debugMode: false,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  batchSize: 50,
  flushInterval: 5000, // 5 seconds
};

/**
 * Quest telemetry system interface
 */
export interface IQuestTelemetrySystem {
  // Event emission
  emitEvent<T>(type: QuestTelemetryEventType, data: T, metadata?: Record<string, unknown>): void;
  
  // Quest lifecycle
  recordQuestStart(questId: string, questType: string, difficulty?: number): void;
  recordQuestCompletion(result: QuestResult): void;
  recordBranchDecision(decision: BranchDecision, context?: Record<string, unknown>): void;
  recordHeroicMoment(questId: string, phaseId: string, momentType: string, description: string): void;
  recordChoiceTime(questId: string, phaseId: string, choiceTime: number, complexity?: number): void;
  
  // Analytics
  calculateQuestTypeMetrics(questTypeId: string, questTypeDefinition: QuestTypeDefinition): void;
  generateHeatmapData(visualizationType: string, config: Record<string, unknown>): void;
  detectDecisionPatterns(): void;
  
  // Data management
  getEvents(type?: QuestTelemetryEventType, limit?: number): QuestTelemetryEvent[];
  getEventsByTimeRange(start: Date, end: Date): QuestTelemetryEvent[];
  clearEvents(type?: QuestTelemetryEventType): void;
  
  // Export and persistence
  exportData(format: 'json' | 'csv' | 'markdown'): Promise<string>;
  flushEvents(): Promise<void>;
  
  // Session management
  startSession(sessionId?: string): string;
  endSession(): void;
  getSessionInfo(): { sessionId: string; startTime: number; eventCount: number };
  
  // System control
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  getConfig(): QuestTelemetrySystemConfig;
  updateConfig(config: Partial<QuestTelemetrySystemConfig>): void;
}

/**
 * Quest telemetry system implementation
 */
export class QuestTelemetrySystem {
  private enabled: boolean = false;
  private sessionId: string;
  private events: QuestTelemetryEvent[] = [];
  private listeners: Array<(event: QuestTelemetryEvent) => void> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private config: QuestTelemetrySystemConfig;
  private sessionStartTime: number;
  private eventListeners: Map<string, Array<(event: QuestTelemetryEvent) => void>> = new Map();

  constructor(config: Partial<QuestTelemetrySystemConfig> = {}) {
    this.config = { ...DEFAULT_TELEMETRY_SYSTEM_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.initializeSystem();
  }

  /**
   * Initialize the telemetry system
   */
  private async initializeSystem(): Promise<void> {
    if (this.config.enablePersistence) {
      try {
        const savedEvents = await loadData(this.config.persistenceKey, []);
        this.events = Array.isArray(savedEvents) ? savedEvents.slice(-this.config.maxEventsInMemory) : [];
      } catch (error) {
        this.emitEvent('system_error', {
          errorType: 'initialization_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          context: { operation: 'load_persisted_events' },
          recovered: true,
        } as SystemErrorEventData);
      }
    }

    if (this.config.enableRealTimeEvents) {
      this.setupEventListeners();
    }

    if (this.config.flushInterval > 0) {
      this.startFlushTimer();
    }

    this.emitEvent('system_error', {
      errorType: 'system_initialized',
      errorMessage: 'Quest telemetry system initialized successfully',
      context: { sessionId: this.sessionId, config: this.config },
      recovered: true,
    } as SystemErrorEventData);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `quest_session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Listen for quest-related events from other parts of the system
    if (typeof window !== 'undefined') {
      window.addEventListener('quest-telemetry', this.handleExternalEvent.bind(this));
    }
  }

  /**
   * Handle external quest telemetry events
   */
  private handleExternalEvent(event: CustomEvent): void {
    if (!this.enabled) return;

    try {
      const eventData = event.detail;
      this.emitEvent(eventData.type as QuestTelemetryEventType, eventData.data, eventData.metadata);
    } catch (error) {
      this.emitEvent('system_error', {
        errorType: 'external_event_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        context: { originalEvent: eventData } as Record<string, unknown>,
        recovered: false,
      } as SystemErrorEventData);
    }
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearSafeTimeout(this.flushTimer);
    }

    // Use TimerUtils for safe timer management
    const scheduleNextFlush = () => {
      this.flushTimer = setSafeTimeout(() => {
        this.flushEvents().catch(error => {
          if (this.config.debugMode) {
            console.error('[QuestTelemetrySystem] Flush error:', error);
          }
        }).finally(() => {
          if (this.enabled) {
            scheduleNextFlush();
          }
        });
      }, this.config.flushInterval);
    };

    scheduleNextFlush();
  }

  /**
   * Emit a telemetry event
   */
  public emitEvent<T>(type: QuestTelemetryEventType, data: T, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const event: QuestTelemetryEvent<T> = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data,
      metadata,
    };

    this.addEvent(event);
    this.notifyListeners(event);

    if (this.config.debugMode) {
      console.log(`[QuestTelemetrySystem] Event emitted: ${type}`, event);
    }
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Add an event to the internal storage
   */
  private addEvent(event: QuestTelemetryEvent): void {
    this.events.push(event);

    // Maintain memory limit
    if (this.events.length > this.config.maxEventsInMemory) {
      this.events = this.events.slice(-this.config.maxEventsInMemory);
    }

    // Trigger batch processing if needed
    if (this.events.length % this.config.batchSize === 0) {
      this.processBatch().catch(error => {
        if (this.config.debugMode) {
          console.error('[QuestTelemetrySystem] Batch processing error:', error);
        }
      });
    }
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(event: QuestTelemetryEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        if (this.config.debugMode) {
          console.error('[QuestTelemetrySystem] Listener error:', error);
        }
      }
    });
  }

  /**
   * Process a batch of events
   */
  private async processBatch(): Promise<void> {
    if (!this.config.enableAnalytics) return;

    // Analyze recent events for patterns
    const recentEvents = this.events.slice(-this.config.batchSize);
    
    // Detect decision patterns
    const decisionEvents = recentEvents.filter(e => e.type === 'branch_decision_made');
    if (decisionEvents.length > 0) {
      this.detectDecisionPatterns();
    }

    // Calculate performance metrics
    const completionEvents = recentEvents.filter(e => e.type === 'quest_completed');
    if (completionEvents.length > 0) {
      this.calculatePerformanceMetrics(completionEvents);
    }
  }

  /**
   * Calculate performance metrics from completion events
   */
  private calculatePerformanceMetrics(completionEvents: QuestTelemetryEvent[]): void {
    const successRate = completionEvents.filter(e => (e.data as QuestCompletedEventData).success).length / completionEvents.length;
    const avgDuration = completionEvents.reduce((sum, e) => sum + (e.data as QuestCompletedEventData).durationSeconds, 0) / completionEvents.length;

    this.emitEvent('performance_metric_calculated', {
      metricName: 'success_rate',
      value: successRate,
      unit: 'percentage',
      trend: 'stable', // Would need historical data to determine trend
      context: { sampleSize: completionEvents.length, timeWindow: 'batch' },
    } as PerformanceMetricCalculatedEventData);

    this.emitEvent('performance_metric_calculated', {
      metricName: 'average_duration',
      value: avgDuration,
      unit: 'seconds',
      trend: 'stable',
      context: { sampleSize: completionEvents.length, timeWindow: 'batch' },
    } as PerformanceMetricCalculatedEventData);
  }

  /**
   * Record quest start
   */
  public recordQuestStart(questId: string, questType: string, difficulty: number = 1): void {
    this.emitEvent('quest_started', {
      questId,
      questType,
      difficulty,
      estimatedDuration: this.estimateQuestDuration(difficulty),
      participantCount: 1, // Would be determined from context
    } as QuestStartedEventData);
  }

  /**
   * Record quest completion
   */
  public recordQuestCompletion(result: QuestResult): void {
    this.emitEvent('quest_completed', {
      questId: result.questId,
      questType: this.inferQuestType(result.questId),
      success: result.success,
      durationSeconds: result.durationSeconds,
      branchCount: result.branchDecisions.length,
      heroicMoments: result.telemetryData?.heroicMoments ?? 0,
      finalState: result.telemetryData || {},
    } as QuestCompletedEventData);

    // Also record individual branch decisions
    result.branchDecisions.forEach(decision => {
      this.recordBranchDecision(decision, { questResult: result });
    });
  }

  /**
   * Record branch decision
   */
  public recordBranchDecision(decision: BranchDecision, context?: Record<string, unknown>): void {
    const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
    
    this.emitEvent('branch_decision_made', {
      questId: decision.outcome.metadata?.questId || 'unknown',
      phaseId: decision.phaseId,
      choiceMade: decision.outcome.metadata?.choiceMade || 'unknown',
      choiceTimeSeconds: choiceTime,
      success: decision.outcome.success,
      outcome: decision.outcome.description || 'No description',
      isHeroic: decision.outcome.metadata?.isHeroicMoment === true,
      context: context || {},
    } as BranchDecisionEventData);

    // Record choice time separately for analytics
    if (choiceTime > 0) {
      this.recordChoiceTime(
        decision.outcome.metadata?.questId || 'unknown',
        decision.phaseId,
        choiceTime,
        this.calculateComplexity(decision)
      );
    }

    // Record heroic moments
    if (decision.outcome.metadata?.isHeroicMoment === true) {
      this.recordHeroicMoment(
        decision.outcome.metadata?.questId || 'unknown',
        decision.phaseId,
        'decision_heroic',
        decision.outcome.description || 'Heroic decision made'
      );
    }
  }

  /**
   * Record heroic moment
   */
  public recordHeroicMoment(questId: string, phaseId: string, momentType: string, description: string): void {
    this.emitEvent('heroic_moment', {
      questId,
      phaseId,
      momentType,
      description,
      impact: 'major', // Would be determined from context
      participantActions: [], // Would be populated from context
    } as HeroicMomentEventData);
  }

  /**
   * Record choice time
   */
  public recordChoiceTime(questId: string, phaseId: string, choiceTime: number, complexity: number = 1): void {
    this.emitEvent('choice_time_recorded', {
      questId,
      phaseId,
      choiceTimeSeconds: choiceTime,
      complexity,
      availableOptions: 3, // Would be determined from context
      contextFactors: [], // Would be determined from context
    } as ChoiceTimeRecordedEventData);
  }

  /**
   * Calculate quest type metrics
   */
  public calculateQuestTypeMetrics(questTypeId: string, _questTypeDefinition: QuestTypeDefinition): void {
    const questEvents = this.events.filter(e => 
      e.type === 'quest_completed' && 
      (e.data as QuestCompletedEventData).questType === questTypeId
    );

    if (questEvents.length === 0) return;

    const successRate = questEvents.filter(e => (e.data as QuestCompletedEventData).success).length / questEvents.length;
    const avgDuration = questEvents.reduce((sum, e) => sum + (e.data as QuestCompletedEventData).durationSeconds, 0) / questEvents.length;
    const difficultyScore = this.calculateDifficultyScore(successRate, avgDuration);
    const engagementScore = this.calculateEngagementScore(questEvents.length, avgDuration);

    this.emitEvent('quest_type_analyzed', {
      questTypeId,
      totalQuests: questEvents.length,
      successRate,
      averageDuration: avgDuration,
      difficultyScore,
      engagementScore,
      commonPatterns: this.extractCommonPatterns(questEvents),
    } as QuestTypeAnalyzedEventData);
  }

  /**
   * Generate heatmap data
   */
  public generateHeatmapData(visualizationType: string, config: Record<string, unknown>): void {
    const dataPoints = this.events.length;
    const intensityRange: [number, number] = [0, 1]; // Would be calculated from actual data

    this.emitEvent('heatmap_data_generated', {
      visualizationType,
      dataPoints,
      colorScheme: config.colorScheme as string || 'default',
      intensityRange,
      filters: config,
    } as HeatmapDataGeneratedEventData);
  }

  /**
   * Detect decision patterns
   */
  public detectDecisionPatterns(): void {
    const decisionEvents = this.events.filter(e => e.type === 'branch_decision_made');
    
    // Simple pattern detection - would be more sophisticated in production
    const patterns = this.analyzeDecisionPatterns(decisionEvents);
    
    patterns.forEach(pattern => {
      this.emitEvent('decision_pattern_detected', {
        patternName: pattern.name,
        frequency: pattern.frequency,
        confidence: pattern.confidence,
        associatedQuestTypes: pattern.questTypes,
        impactOnSuccess: pattern.impact,
        recommendations: pattern.recommendations,
      } as DecisionPatternDetectedEventData);
    });
  }

  /**
   * Get events by type or all events
   */
  public getEvents(type?: QuestTelemetryEventType, limit?: number): QuestTelemetryEvent[] {
    const events = type ? this.events.filter(e => e.type === type) : this.events;
    return limit ? events.slice(-limit) : events;
  }

  /**
   * Get events by time range
   */
  public getEventsByTimeRange(start: Date, end: Date): QuestTelemetryEvent[] {
    return this.events.filter(e => 
      e.timestamp >= start.getTime() && e.timestamp <= end.getTime()
    );
  }

  /**
   * Clear events
   */
  public clearEvents(type?: QuestTelemetryEventType): void {
    if (type) {
      this.events = this.events.filter(e => e.type !== type);
    } else {
      this.events = [];
    }
  }

  /**
   * Export data
   */
  public async exportData(format: 'json' | 'csv' | 'markdown'): Promise<string> {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      totalEvents: this.events.length,
      events: this.events,
    };

    let result: string;

    switch (format) {
      case 'json':
        result = JSON.stringify(exportData, null, 2);
        break;
      case 'csv':
        result = this.convertToCSV(this.events);
        break;
      case 'markdown':
        result = this.convertToMarkdown(exportData);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    this.emitEvent('telemetry_exported', {
      exportFormat: format,
      recordCount: this.events.length,
      dateRange: [
        new Date(this.events[0]?.timestamp || Date.now()).toISOString(),
        new Date(this.events[this.events.length - 1]?.timestamp || Date.now()).toISOString(),
      ],
      fileSize: result.length,
      compressionUsed: false,
    } as TelemetryExportedEventData);

    return result;
  }

  /**
   * Flush events to persistence
   */
  public async flushEvents(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      await saveData(this.config.persistenceKey, this.events);
    } catch (error) {
      this.emitEvent('system_error', {
        errorType: 'flush_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        context: { eventCount: this.events.length },
        recovered: false,
      } as SystemErrorEventData);
    }
  }

  /**
   * Start a new session
   */
  public startSession(sessionId?: string): string {
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.emitEvent('system_error', {
      errorType: 'session_started',
      errorMessage: `Session started: ${this.sessionId}`,
      context: { previousSessionId: sessionId },
      recovered: true,
    } as SystemErrorEventData);

    return this.sessionId;
  }

  /**
   * End current session
   */
  public endSession(): void {
    this.emitEvent('system_error', {
      errorType: 'session_ended',
      errorMessage: `Session ended: ${this.sessionId}`,
      context: { sessionDuration: Date.now() - this.sessionStartTime },
      recovered: true,
    } as SystemErrorEventData);

    // Flush events before ending session
    this.flushEvents().catch(() => {
      // Ignore errors during session end
    });
  }

  /**
   * Get session information
   */
  public getSessionInfo(): { sessionId: string; startTime: number; eventCount: number } {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      eventCount: this.events.length,
    };
  }

  /**
   * Enable the telemetry system
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the telemetry system
   */
  public disable(): void {
    this.enabled = false;
  }

  /**
   * Check if system is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): QuestTelemetrySystemConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<QuestTelemetrySystemConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart timer if interval changed
    if (config.flushInterval !== undefined) {
      this.startFlushTimer();
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(type: QuestTelemetryEventType, listener: (event: QuestTelemetryEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: QuestTelemetryEventType, listener: (event: QuestTelemetryEvent) => void): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('quest-telemetry', this.handleExternalEvent.bind(this));
    }

    this.flushEvents().catch(() => {
      // Ignore errors during cleanup
    });
  }

  // Helper methods

  private estimateQuestDuration(difficulty: number): number {
    return 60 + (difficulty * 30); // Base 60 seconds + 30s per difficulty level
  }

  private inferQuestType(questId: string): string {
    // Simple inference - would use quest type definitions in production
    if (questId.includes('combat')) return 'combat';
    if (questId.includes('explore')) return 'exploration';
    if (questId.includes('social')) return 'social';
    return 'unknown';
  }

  private calculateComplexity(_decision: BranchDecision): number {
    // Simple complexity calculation based on available options
    return 1; // Would be calculated from decision context
  }

  private calculateDifficultyScore(successRate: number, avgDuration: number): number {
    const successFactor = 1 - successRate;
    const durationFactor = Math.min(avgDuration / 300, 1);
    return (successFactor * 0.6 + durationFactor * 0.4) * 10;
  }

  private calculateEngagementScore(questCount: number, avgDuration: number): number {
    const countFactor = Math.min(questCount / 50, 1);
    const durationFactor = Math.max(0, 1 - avgDuration / 600);
    return (countFactor * 0.7 + durationFactor * 0.3) * 10;
  }

  private extractCommonPatterns(_events: QuestTelemetryEvent[]): string[] {
    // Simple pattern extraction - would be more sophisticated
    return ['frequent_combat_choices', 'quick_decisions', 'heroic_moments'];
  }

  private analyzeDecisionPatterns(_decisionEvents: QuestTelemetryEvent[]): Array<{
    name: string;
    frequency: number;
    confidence: number;
    questTypes: string[];
    impact: number;
    recommendations: string[];
  }> {
    // Simple pattern analysis - would be more sophisticated
    return [
      {
        name: 'quick_successful_decisions',
        frequency: 0.3,
        confidence: 0.8,
        questTypes: ['combat', 'exploration'],
        impact: 0.15,
        recommendations: ['Maintain decision speed', 'Provide clear options'],
      },
    ];
  }

  private convertToCSV(events: QuestTelemetryEvent[]): string {
    const headers = ['id', 'type', 'timestamp', 'sessionId', 'data'];
    const rows = events.map(event => [
      event.id,
      event.type,
      event.timestamp,
      event.sessionId,
      JSON.stringify(event.data),
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertToMarkdown(data: unknown): string {
    return `# Quest Telemetry Export

Generated: ${data.exportTimestamp}
Session: ${data.sessionId}
Duration: ${data.sessionDuration}ms
Total Events: ${data.totalEvents}

## Event Summary

${(data as { events: QuestTelemetryEvent[] }).events.reduce((summary: Record<string, number>, event: QuestTelemetryEvent) => {
  summary[event.type] = (summary[event.type] || 0) + 1;
  return summary;
}, {})}`;
  }
}

/**
 * Global telemetry system instance
 */
export const questTelemetrySystem = new QuestTelemetrySystem();

/**
 * Convenience hook for using the telemetry system
 */
export function useQuestTelemetrySystem(): IQuestTelemetrySystem {
  return questTelemetrySystem;
}
