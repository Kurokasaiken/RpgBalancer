/**
 * Phase 10 Telemetry Router - NP-057
 * 
 * Centralized routing service for Phase 10 Balancer telemetry events.
 * Normalizes payloads and routes events to existing collectors with
 * proper validation, typing, and fallback mechanisms.
 * 
 * @since 2026-01-20
 * @author Vector-Balancer
 */

import { z } from 'zod';
import { saveData } from '@/shared/persistence/PersistenceService';

/**
 * Formula Safety Event Schema
 */
export const FormulaSafetyEventSchema = z.object({
  eventType: z.literal('formula_safety'),
  timestamp: z.string(),
  sessionId: z.string(),
  formulaId: z.string(),
  formula: z.string(),
  validation: z.object({
    valid: z.boolean(),
    error: z.string().optional(),
    usedStats: z.array(z.string()),
    warnings: z.array(z.object({
      type: z.enum(['range', 'division', 'complexity', 'performance']),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error']),
      position: z.object({
        start: z.number(),
        end: z.number(),
      }).optional(),
    })),
    safety: z.object({
      hasCycles: z.boolean(),
      complexity: z.enum(['low', 'medium', 'high']),
      estimatedOperations: z.number(),
      divisionRisk: z.boolean(),
      rangeIssues: z.array(z.object({
        stat: z.string(),
        issue: z.enum(['negative_input', 'zero_division', 'overflow_risk']),
        message: z.string(),
      })),
    }),
  }),
  context: z.object({
    stats: z.record(z.object({
      min: z.number(),
      max: z.number(),
      current: z.number(),
    })),
    maxOperations: z.number().optional(),
    allowNegative: z.boolean().optional(),
  }),
  metadata: z.record(z.any()).optional(),
});

export type FormulaSafetyEvent = z.infer<typeof FormulaSafetyEventSchema>;

/**
 * Undo/Redo Event Schema
 */
export const UndoRedoEventSchema = z.object({
  eventType: z.literal('undo_redo'),
  timestamp: z.string(),
  sessionId: z.string(),
  operation: z.enum(['undo', 'redo']),
  snapshotId: z.string(),
  beforeState: z.object({
    configId: z.string(),
    version: z.string(),
    checksum: z.string(),
    timestamp: z.string(),
  }),
  afterState: z.object({
    configId: z.string(),
    version: z.string(),
    checksum: z.string(),
    timestamp: z.string(),
  }),
  historySize: z.number(),
  operationDuration: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type UndoRedoEvent = z.infer<typeof UndoRedoEventSchema>;

/**
 * Stress Testing Event Schema
 */
export const StressTestingEventSchema = z.object({
  eventType: z.literal('stress_testing'),
  timestamp: z.string(),
  sessionId: z.string(),
  testType: z.enum(['archetype_generation', 'marginal_utility', 'synergy_analysis', 'performance']),
  testId: z.string(),
  parameters: z.record(z.any()),
  results: z.object({
    success: z.boolean(),
    duration: z.number(),
    iterations: z.number(),
    dataPoints: z.number(),
    metrics: z.record(z.number()),
    errors: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
  }),
  environment: z.object({
    nodeVersion: z.string(),
    platform: z.string(),
    memory: z.number(),
    cpu: z.number(),
  }),
  metadata: z.record(z.any()).optional(),
});

export type StressTestingEvent = z.infer<typeof StressTestingEventSchema>;

/**
 * Generic Phase 10 Event Union
 */
export type Phase10Event = 
  | FormulaSafetyEvent
  | UndoRedoEvent
  | StressTestingEvent;

/**
 * Event Router Configuration
 */
export interface EventRouterConfig {
  enableConsoleLogging: boolean;
  enablePersistence: boolean;
  enableTelemetry: boolean;
  maxQueueSize: number;
  fallbackTimeout: number;
  retryAttempts: number;
}

/**
 * Event Processing Result
 */
export interface EventProcessingResult {
  success: boolean;
  routed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  collector: string;
}

/**
 * Event Collector Interface
 */
export interface EventCollector {
  name: string;
  collect: (event: Phase10Event) => Promise<boolean>;
  validate: (event: Phase10Event) => boolean;
}

/**
 * Phase 10 Telemetry Router
 */
export class Phase10TelemetryRouter {
  private static config: EventRouterConfig = {
    enableConsoleLogging: true,
    enablePersistence: true,
    enableTelemetry: true,
    maxQueueSize: 1000,
    fallbackTimeout: 5000,
    retryAttempts: 3,
  };

  private static collectors: Map<string, EventCollector> = new Map();
  private static eventQueue: Array<{
    event: Phase10Event;
    timestamp: number;
    retries: number;
  }> = [];

  private static isProcessing = false;
  private static processingTimer: NodeJS.Timeout | null = null;

  /**
   * Configure the router
   */
  static configure(config: Partial<EventRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register an event collector
   */
  static registerCollector(collector: EventCollector): void {
    this.collectors.set(collector.name, collector);
    
    if (this.config.enableConsoleLogging) {
      console.debug(`[Phase10TelemetryRouter] Registered collector: ${collector.name}`);
    }
  }

  /**
   * Unregister an event collector
   */
  static unregisterCollector(name: string): void {
    this.collectors.delete(name);
    
    if (this.config.enableConsoleLogging) {
      console.debug(`[Phase10TelemetryRouter] Unregistered collector: ${name}`);
    }
  }

  /**
   * Get registered collectors
   */
  static getCollectors(): string[] {
    return Array.from(this.collectors.keys());
  }

  /**
   * Route a Phase 10 event
   */
  static async routeEvent(event: Phase10Event): Promise<EventProcessingResult> {
    const startTime = Date.now();
    const results: EventProcessingResult[] = [];

    // Validate event
    const validationResult = this.validateEvent(event);
    if (!validationResult.valid) {
      return {
        success: false,
        routed: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        duration: Date.now() - startTime,
        collector: 'validation',
      };
    }

    // Normalize event payload
    const normalizedEvent = this.normalizeEvent(event);

    // Route to appropriate collectors
    const collectors = this.getApplicableCollectors(normalizedEvent);
    
    for (const collectorName of collectors) {
      const collector = this.collectors.get(collectorName);
      if (!collector) {
        continue;
      }

      try {
        const success = await collector.collect(normalizedEvent);
        results.push({
          success,
          routed: true,
          errors: success ? [] : [`Collection failed for ${collectorName}`],
          warnings: [],
          duration: Date.now() - startTime,
          collector: collectorName,
        });
      } catch (error) {
        results.push({
          success: false,
          routed: true,
          errors: [`Error in ${collectorName}: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          duration: Date.now() - startTime,
          collector: collectorName,
        });
      }
    }

    // If no collectors handled the event, queue it for retry
    if (results.length === 0) {
      await this.queueEventForRetry(normalizedEvent);
      
      return {
        success: true,
        routed: false,
        errors: ['No collectors available, event queued for retry'],
        warnings: [],
        duration: Date.now() - startTime,
        collector: 'queue',
      };
    }

    // Emit telemetry event
    if (this.config.enableTelemetry) {
      await this.emitTelemetryEvent(normalizedEvent, results);
    }

    // Return combined result
    const combinedResult = this.combineResults(results);
    
    if (this.config.enableConsoleLogging) {
      this.logEventProcessing(normalizedEvent, combinedResult);
    }

    return combinedResult;
  }

  /**
   * Route event asynchronously (with queueing)
   */
  static async routeEventAsync(event: Phase10Event): Promise<EventProcessingResult> {
    // Add to queue if processing
    if (this.isProcessing || this.eventQueue.length > 0) {
      await this.queueEventForRetry(event);
      return {
        success: true,
        routed: false,
        errors: ['Event queued for async processing'],
        warnings: [],
        duration: 0,
        collector: 'queue',
      };
    }

    return this.routeEvent(event);
  }

  /**
   * Validate event against schema
   */
  private static validateEvent(event: Phase10Event): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (event.eventType) {
        case 'formula_safety':
          FormulaSafetyEventSchema.parse(event);
          break;
        case 'undo_redo':
          UndoRedoEventSchema.parse(event);
          break;
        case 'stress_testing':
          StressTestingEventSchema.parse(event);
          break;
        default:
          errors.push(`Unknown event type: ${(event as any).eventType}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
      } else {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Additional validation
    if (!event.timestamp) {
      errors.push('Missing required field: timestamp');
    }

    if (!event.sessionId) {
      warnings.push('Missing sessionId, using default');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalize event payload
   */
  private static normalizeEvent(event: Phase10Event): Phase10Event {
    const normalized = { ...event };

    // Ensure timestamp is ISO string
    if (typeof normalized.timestamp === 'number') {
      normalized.timestamp = new Date(normalized.timestamp).toISOString();
    }

    // Add session ID if missing
    if (!normalized.sessionId) {
      normalized.sessionId = this.generateSessionId();
    }

    // Add metadata if missing
    if (!normalized.metadata) {
      normalized.metadata = {};
    }

    // Add processing metadata
    normalized.metadata.processedAt = new Date().toISOString();
    normalized.metadata.routerVersion = '1.0.0';

    return normalized;
  }

  /**
   * Get applicable collectors for an event
   */
  private static getApplicableCollectors(event: Phase10Event): string[] {
    const applicable: string[] = [];

    for (const [name, collector] of this.collectors.entries()) {
      if (collector.validate(event)) {
        applicable.push(name);
      }
    }

    return applicable;
  }

  /**
   * Combine multiple processing results
   */
  private static combineResults(results: EventProcessingResult[]): EventProcessingResult {
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const hasSuccess = results.some(r => r.success);
    const hasRouted = results.some(r => r.routed);

    return {
      success: hasSuccess,
      routed: hasRouted,
      errors: allErrors,
      warnings: allWarnings,
      duration: totalDuration,
      collector: results.map(r => r.collector).join(', '),
    };
  }

  /**
   * Queue event for retry
   */
  private static async queueEventForRetry(event: Phase10Event): Promise<void> {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      // Remove oldest event to make room
      const removed = this.eventQueue.shift();
      
      if (this.config.enableConsoleLogging) {
        console.warn(`[Phase10TelemetryRouter] Queue full, dropped oldest event: ${removed.event.eventType}`);
      }
    }

    this.eventQueue.push({
      event,
      timestamp: Date.now(),
      retries: 0,
    });

    // Start processing if not already running
    this.startProcessing();
  }

  /**
   * Start processing queued events
   */
  private static startProcessing(): void {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const processEvents = async () => {
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift();
        
        try {
          await this.routeEvent(queuedEvent.event);
          queuedEvent.retries = 0; // Reset retries on success
        } catch (error) {
          queuedEvent.retries++;
          
          if (queuedEvent.retries < this.config.retryAttempts) {
            // Re-queue for retry
            this.eventQueue.unshift(queuedEvent);
            
            if (this.config.enableConsoleLogging) {
              console.warn(`[Phase10TelemetryRouter] Event retry ${queuedEvent.retries}/${this.config.retryAttempts}: ${queuedEvent.event.eventType}`);
            }
            
            // Add delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * queuedEvent.retries));
          } else {
            // Max retries reached, drop event
            if (this.config.enableConsoleLogging) {
              console.error(`[Phase10TelemetryRouter] Max retries reached, dropping event: ${queuedEvent.event.eventType}`);
            }
          }
        }
      }

      this.isProcessing = false;
      
      // Clear timer if exists
      if (this.processingTimer) {
        clearTimeout(this.processingTimer);
        this.processingTimer = null;
      }
    };

    // Start processing with fallback timeout
    this.processingTimer = setTimeout(() => {
      processEvents().catch(error => {
        console.error('[Phase10TelemetryRouter] Processing error:', error);
        this.isProcessing = false;
      });
    }, 0);
  }

  /**
   * Emit telemetry event for routing
   */
  private static async emitTelemetryEvent(
    event: Phase10Event,
    results: EventProcessingResult[]
  ): Promise<void> {
    if (!this.config.enableTelemetry) {
      return;
    }

    const telemetryEvent = {
      event: 'balancer_phase10_event_routed',
      timestamp: new Date().toISOString(),
      data: {
        originalEvent: event,
        routingResults: results,
        routerConfig: this.config,
        queueSize: this.eventQueue.length,
        isProcessing: this.isProcessing,
      },
    };

    try {
      await saveData(`telemetry_balancer_phase10_${Date.now()}`, telemetryEvent);
    } catch (error) {
      if (this.config.enableConsoleLogging) {
        console.warn('[Phase10TelemetryRouter] Failed to emit telemetry:', error);
      }
    }
  }

  /**
   * Log event processing for debugging
   */
  private static logEventProcessing(
    event: Phase10Event,
    result: EventProcessingResult
  ): void {
    const logLevel = result.success ? 'info' : result.errors.length > 0 ? 'error' : 'warn';
    
    const logMessage = `[Phase10TelemetryRouter] ${event.eventType} -> ${result.collector} (${result.duration}ms)`;
    
    switch (logLevel) {
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        if (result.errors.length > 0) {
          result.errors.forEach(error => console.error(`  Error: ${error}`));
        }
        break;
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.warn(`  Warning: ${warning}`));
    }
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get router statistics
   */
  static getStatistics() {
    return {
      config: this.config,
      collectorsCount: this.collectors.size,
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      registeredCollectors: Array.from(this.collectors.keys()),
    };
  }

  /**
   * Clear event queue
   */
  static clearQueue(): number {
    const cleared = this.eventQueue.length;
    this.eventQueue = [];
    
    if (this.config.enableConsoleLogging) {
      console.info(`[Phase10TelemetryRouter] Cleared ${cleared} events from queue`);
    }
    
    return cleared;
  }

  /**
   * Shutdown router
   */
  static shutdown(): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }
    
    this.isProcessing = false;
    this.eventQueue = [];
    this.collectors.clear();
    
    if (this.config.enableConsoleLogging) {
      console.info('[Phase10TelemetryRouter] Router shutdown complete');
    }
  }

  /**
   * Get router health status
   */
  static getHealthStatus() {
    return {
      status: this.isProcessing ? 'processing' : 'idle',
      queueSize: this.eventQueue.length,
      collectorsCount: this.collectors.size,
      config: this.config,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}

/**
 * Default Formula Safety Collector
 */
export class FormulaSafetyCollector implements EventCollector {
  name = 'formula_safety';

  collect(event: Phase10Event): Promise<boolean> {
    // Route to existing formula safety telemetry
    console.debug('[FormulaSafetyCollector] Collecting formula safety event:', event.eventType);
    
    // Implementation would route to existing formula safety system
    return Promise.resolve(true);
  }

  validate(event: Phase10Event): boolean {
    return event.eventType === 'formula_safety';
  }
}

/**
 * Default Undo/Redo Collector
 */
export class UndoRedoCollector implements EventCollector {
  name = 'undo_redo';

  collect(event: Phase10Event): Promise<boolean> {
    // Route to existing undo/redo telemetry
    console.debug('[UndoRedoCollector] Collecting undo/redo event:', event.eventType);
    
    // Implementation would route to existing undo/redo system
    return Promise.resolve(true);
  }

  validate(event: Phase10Event): boolean {
    return event.eventType === 'undo_redo';
  }
}

/**
 * Default Stress Testing Collector
 */
export class StressTestingCollector implements EventCollector {
  name = 'stress_testing';

  collect(event: Phase10Event): Promise<boolean> {
    // Route to existing stress testing telemetry
    console.debug('[StressTestingCollector] Collecting stress testing event:', event.eventType);
    
    // Implementation would route to existing stress testing system
    return Promise.resolve(true);
  }

  validate(event: Phase10Event): boolean {
    return event.eventType === 'stress_testing';
  }
}

/**
 * Initialize default collectors
 */
export function initializeDefaultCollectors(): void {
  Phase10TelemetryRouter.registerCollector(new FormulaSafetyCollector());
  Phase10TelemetryRouter.registerCollector(new UndoRedoCollector());
  Phase10TelemetryRouter.registerCollector(new StressTestingCollector());
}

/**
 * Get router instance for external use
 */
export function getPhase10TelemetryRouter(): typeof Phase10TelemetryRouter {
  return Phase10TelemetryRouter;
}
