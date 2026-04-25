/**
 * Minimal Loop Telemetry Buffer
 *
 * Config-first telemetry buffer for Minimal Gameplay loop events (tick/pause/resume)
 * with automatic batching, persistence, and CLI flush capabilities.
 */

import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { traceMinimalGameplay } from '@/shared/telemetry/telemetryProvider';

/**
 * Telemetry event payload for loop events.
 */
export interface MinimalLoopTelemetryPayload {
  eventType: 'tick' | 'pause' | 'resume' | 'speed_change';
  timestamp: number;
  data: {
    day?: number;
    gold?: number;
    food?: number;
    speedMultiplier?: number;
    source?: string;
    deltaMs?: number;
  };
}

/**
 * Configuration for LoopTelemetryBuffer.
 */
export interface LoopTelemetryBufferConfig {
  /** Maximum number of events to buffer before automatic flush. */
  batchSize: number;
  /** Maximum age in milliseconds before automatic flush. */
  maxAgeMs: number;
  /** Whether to enable persistence. */
  enablePersistence: boolean;
  /** Persistence key for buffer storage. */
  persistenceKey: string;
}

/**
 * Loop Telemetry Buffer for batching and persisting telemetry events.
 */
export class LoopTelemetryBuffer {
  private buffer: MinimalLoopTelemetryPayload[] = [];
  private config: LoopTelemetryBufferConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoopTelemetryBufferConfig> = {}) {
    this.config = {
      batchSize: 10,
      maxAgeMs: 5000,
      enablePersistence: true,
      persistenceKey: 'minimal-loop-telemetry-buffer',
      ...config,
    };

    // Load persisted buffer on initialization
    if (this.config.enablePersistence) {
      this.loadPersistedBuffer().catch((error) => {
        console.warn('[LoopTelemetryBuffer] Failed to load persisted buffer:', error);
      });
    }

    // Start age-based flush timer
    this.scheduleFlushTimer();
  }

  /**
   * Add a telemetry event to the buffer.
   */
  async enqueue(event: MinimalLoopTelemetryPayload): Promise<void> {
    this.buffer.push(event);

    // Check if we should flush based on batch size
    if (this.buffer.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Flush all buffered events and persist if enabled.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const eventsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      // Send events to telemetry system
      for (const event of eventsToFlush) {
        await this.sendToTelemetry(event);
      }

      // Log successful flush
      traceMinimalGameplay?.('minimal_loop_telemetry_flush', {
        eventCount: eventsToFlush.length,
        batchSize: this.config.batchSize,
        bufferSize: this.buffer.length,
      });

      // Clear persisted buffer
      if (this.config.enablePersistence) {
        await this.clearPersistedBuffer();
      }

      // Reset flush timer
      this.scheduleFlushTimer();
    } catch (error) {
      console.error('[LoopTelemetryBuffer] Flush failed:', error);

      // Restore buffer on failure
      this.buffer.unshift(...eventsToFlush);

      // Retry after delay
      setTimeout(() => {
        this.flush().catch((retryError) => {
          console.error('[LoopTelemetryBuffer] Retry flush failed:', retryError);
        });
      }, 1000);
    }
  }

  /**
   * Force flush if buffer is older than specified age.
   */
  async flushIfOlderThan(maxAgeMs: number = this.config.maxAgeMs): Promise<void> {
    const now = Date.now();
    const oldestEvent = this.buffer[0];

    if (oldestEvent && (now - oldestEvent.timestamp) > maxAgeMs) {
      await this.flush();
    }
  }

  /**
   * Update batch size configuration.
   */
  setBatchSize(batchSize: number): void {
    this.config.batchSize = Math.max(1, batchSize);
  }

  /**
   * Get current buffer size.
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Get buffer statistics.
   */
  getStats(): {
    bufferSize: number;
    batchSize: number;
    maxAgeMs: number;
    oldestEventAge?: number;
  } {
    const now = Date.now();
    const oldestEvent = this.buffer[0];

    return {
      bufferSize: this.buffer.length,
      batchSize: this.config.batchSize,
      maxAgeMs: this.config.maxAgeMs,
      oldestEventAge: oldestEvent ? now - oldestEvent.timestamp : undefined,
    };
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Send event to telemetry system.
   */
  private async sendToTelemetry(event: MinimalLoopTelemetryPayload): Promise<void> {
    // Send to telemetry provider
    traceMinimalGameplay?.(`minimal_loop_${event.eventType}`, {
      timestamp: event.timestamp,
      ...event.data,
    });
  }

  /**
   * Load persisted buffer from storage.
   */
  private async loadPersistedBuffer(): Promise<void> {
    try {
      const persisted = await loadData(this.config.persistenceKey, null);
      if (persisted && Array.isArray(persisted)) {
        // Filter out events older than max age to prevent stale data
        const now = Date.now();
        const maxAgeMs = this.config.maxAgeMs;
        const validEvents = persisted.filter((event: MinimalLoopTelemetryPayload) =>
          (now - event.timestamp) < maxAgeMs
        );

        this.buffer = validEvents;
      }
    } catch (error) {
      console.warn('[LoopTelemetryBuffer] Failed to load persisted buffer:', error);
    }
  }

  /**
   * Persist current buffer to storage.
   */
  private async persistBuffer(): Promise<void> {
    if (!this.config.enablePersistence || this.buffer.length === 0) return;

    try {
      await saveData(this.config.persistenceKey, this.buffer);
    } catch (error) {
      console.warn('[LoopTelemetryBuffer] Failed to persist buffer:', error);
    }
  }

  /**
   * Clear persisted buffer from storage.
   */
  private async clearPersistedBuffer(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      await saveData(this.config.persistenceKey, null);
    } catch (error) {
      console.warn('[LoopTelemetryBuffer] Failed to clear persisted buffer:', error);
    }
  }

  /**
   * Schedule automatic flush based on age.
   */
  private scheduleFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Check every second for events older than max age
    this.flushTimer = setInterval(() => {
      this.flushIfOlderThan().catch((error) => {
        console.error('[LoopTelemetryBuffer] Age-based flush failed:', error);
      });
    }, 1000);
  }
}

/**
 * Default buffer instance for global use.
 */
export const defaultLoopTelemetryBuffer = new LoopTelemetryBuffer();

/**
 * Convenience function to enqueue events on the default buffer.
 */
export function enqueueLoopTelemetry(event: MinimalLoopTelemetryPayload): Promise<void> {
  return defaultLoopTelemetryBuffer.enqueue(event);
}

/**
 * Convenience function to flush the default buffer.
 */
export function flushLoopTelemetry(): Promise<void> {
  return defaultLoopTelemetryBuffer.flush();
}
