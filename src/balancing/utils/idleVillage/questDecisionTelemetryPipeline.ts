/**
 * Idle Village Quest Decision Telemetry Pipeline
 * 
 * Comprehensive telemetry pipeline for quest decisions with batch processing,
 * validation, storage, and fallback mechanisms.
 * 
 * @module questDecisionTelemetryPipeline
 * @since 2026-01-13
 * @author Cascade
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  QuestDecisionTelemetryEvent,
  QuestDecisionTelemetryPipelineConfig,
  QuestDecisionTelemetryEventSchema,
  DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG,
  shouldSampleEvent,
  sanitizeTelemetryEvent,
  createQuestDecisionEventId,
} from '@/balancing/config/idleVillage/questDecisionTelemetryConfig';

const diagnostics = createHeadlessDiagnostics('QuestDecisionTelemetryPipeline', 'telemetry');

/**
 * Pipeline status
 */
export enum PipelineStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  BATCHING = 'batching',
  UPLOADING = 'uploading',
  ERROR = 'error',
  STOPPED = 'stopped',
}

/**
 * Pipeline metrics
 */
export interface PipelineMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  queuedEvents: number;
  averageProcessingTime: number;
  averageUploadTime: number;
  errorRate: number;
  lastError?: string;
  lastProcessedTimestamp?: number;
  lastUploadedTimestamp?: number;
  uptime: number;
  memoryUsage: number;
  storageUsage: number;
}

/**
 * Batch event
 */
interface BatchEvent {
  events: QuestDecisionTelemetryEvent[];
  timestamp: number;
  retryCount: number;
  id: string;
}

/**
 * Storage interface
 */
interface TelemetryStorage {
  save(event: QuestDecisionTelemetryEvent): Promise<void>;
  saveBatch(events: QuestDecisionTelemetryEvent[]): Promise<void>;
  load(limit?: number): Promise<QuestDecisionTelemetryEvent[]>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getCount(): Promise<number>;
}

/**
 * Remote storage implementation
 */
class RemoteTelemetryStorage implements TelemetryStorage {
  private config: QuestDecisionTelemetryPipelineConfig['storage']['remote'];
  private endpoint: string;
  private apiKey: string;

  constructor(config: QuestDecisionTelemetryPipelineConfig['storage']['remote']) {
    this.config = config;
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
  }

  async save(event: QuestDecisionTelemetryEvent): Promise<void> {
    await this.saveBatch([event]);
  }

  async saveBatch(events: QuestDecisionTelemetryEvent[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Batch-Size': events.length.toString(),
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
        source: 'idle-village-quest-decisions',
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Remote storage failed: ${response.status} ${response.statusText}`);
    }
  }

  async load(_limit?: number): Promise<QuestDecisionTelemetryEvent[]> {
    // Remote storage is write-only for telemetry
    return [];
  }

  async clear(): Promise<void> {
    // Remote storage doesn't support clearing
    throw new Error('Remote storage does not support clearing');
  }

  async getSize(): Promise<number> {
    // Remote storage size is not tracked
    return 0;
  }

  async getCount(): Promise<number> {
    // Remote storage count is not tracked
    return 0;
  }
}

/**
 * Local storage implementation
 */
class LocalTelemetryStorage implements TelemetryStorage {
  private config: QuestDecisionTelemetryPipelineConfig['storage']['local'];
  private storageKey = 'quest-decision-telemetry';
  private metadataKey = 'quest-decision-telemetry-metadata';

  constructor(config: QuestDecisionTelemetryPipelineConfig['storage']['local']) {
    this.config = config;
  }

  async save(event: QuestDecisionTelemetryEvent): Promise<void> {
    const events = await this.load();
    events.push(event);
    
    // Check size and count limits
    if (events.length > this.config.maxEvents) {
      // Remove oldest events
      events.splice(0, events.length - this.config.maxEvents);
    }
    
    // Check memory limit
    const size = await this.calculateSize(events);
    if (size > this.config.maxSize) {
      // Remove oldest events until under limit
      const trimmedEvents = [...events];
      while (trimmedEvents.length > 0 && await this.calculateSize(trimmedEvents) > this.config.maxSize) {
        trimmedEvents.shift();
      }
      events.splice(0, events.length - trimmedEvents.length);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(events));
      await this.updateMetadata(events.length, size);
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear old events and retry
        await this.clear();
        await this.save(event);
      } else {
        throw error;
      }
    }
  }

  async saveBatch(events: QuestDecisionTelemetryEvent[]): Promise<void> {
    for (const event of events) {
      await this.save(event);
    }
  }

  async load(limit?: number): Promise<QuestDecisionTelemetryEvent[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const events = JSON.parse(data) as QuestDecisionTelemetryEvent[];
      
      // Filter expired events
      const now = Date.now();
      const validEvents = events.filter(event => 
        now - event.outcome.timestamp < this.config.ttl
      );
      
      // Apply limit
      if (limit && limit > 0) {
        return validEvents.slice(-limit);
      }
      
      return validEvents;
    } catch (error) {
      diagnostics.warn('Failed to load events from local storage', { error });
      return [];
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.metadataKey);
  }

  async getSize(): Promise<number> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? data.length : 0;
    } catch (error) {
      diagnostics.warn('Failed to get storage size', { error });
      return 0;
    }
  }

  async getCount(): Promise<number> {
    try {
      const metadata = localStorage.getItem(this.metadataKey);
      return metadata ? JSON.parse(metadata).count : 0;
    } catch (error) {
      diagnostics.warn('Failed to get event count', { error });
      return 0;
    }
  }

  private async calculateSize(events: QuestDecisionTelemetryEvent[]): Promise<number> {
    return JSON.stringify(events).length;
  }

  private async updateMetadata(count: number, size: number): Promise<void> {
    const metadata = {
      count,
      size,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
  }
}

/**
 * Hybrid storage implementation
 */
class HybridTelemetryStorage implements TelemetryStorage {
  private local: LocalTelemetryStorage;
  private remote: RemoteTelemetryStorage;
  private config: QuestDecisionTelemetryPipelineConfig['storage'];

  constructor(config: QuestDecisionTelemetryPipelineConfig['storage']) {
    this.local = new LocalTelemetryStorage(config.local);
    this.remote = new RemoteTelemetryStorage(config.remote);
    this.config = config;
  }

  async save(event: QuestDecisionTelemetryEvent): Promise<void> {
    // Always save to local first
    await this.local.save(event);
    
    // Try to save to remote if enabled
    if (this.config.type === 'hybrid' || this.config.type === 'remote') {
      try {
        await this.remote.save(event);
        // Remove from local after successful remote save
        await this.removeFromLocal(event.eventId);
      } catch (error) {
        diagnostics.warn('Failed to save to remote storage, keeping in local', { error });
      }
    }
  }

  async saveBatch(events: QuestDecisionTelemetryEvent[]): Promise<void> {
    // Always save to local first
    await this.local.saveBatch(events);
    
    // Try to save to remote if enabled
    if (this.config.type === 'hybrid' || this.config.type === 'remote') {
      try {
        await this.remote.saveBatch(events);
        // Remove from local after successful remote save
        const eventIds = events.map(e => e.eventId);
        await this.removeFromLocalBatch(eventIds);
      } catch (error) {
        diagnostics.warn('Failed to save batch to remote storage, keeping in local', { error });
      }
    }
  }

  async load(limit?: number): Promise<QuestDecisionTelemetryEvent[]> {
    return this.local.load(limit);
  }

  async clear(): Promise<void> {
    await this.local.clear();
    // Remote storage doesn't support clearing
  }

  async getSize(): Promise<number> {
    return this.local.getSize();
  }

  async getCount(): Promise<number> {
    return this.local.getCount();
  }

  private async removeFromLocal(eventId: string): Promise<void> {
    const events = await this.local.load();
    const filtered = events.filter(e => e.eventId !== eventId);
    await this.local.clear();
    await this.local.saveBatch(filtered);
  }

  private async removeFromLocalBatch(eventIds: string[]): Promise<void> {
    const events = await this.local.load();
    const filtered = events.filter(e => !eventIds.includes(e.eventId));
    await this.local.clear();
    await this.local.saveBatch(filtered);
  }
}

/**
 * Quest Decision Telemetry Pipeline
 */
export class QuestDecisionTelemetryPipeline {
  private config: QuestDecisionTelemetryPipelineConfig;
  private storage: TelemetryStorage;
  private status: PipelineStatus = PipelineStatus.IDLE;
  private eventQueue: QuestDecisionTelemetryEvent[] = [];
  private batchQueue: BatchEvent[] = [];
  private metrics: PipelineMetrics;
  private processingTimer?: NodeJS.Timeout;
  private uploadTimer?: NodeJS.Timeout;
  private startTime: number;

  constructor(config: Partial<QuestDecisionTelemetryPipelineConfig> = {}) {
    this.config = { ...DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG, ...config };
    this.storage = this.createStorage();
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
    
    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start the pipeline
   */
  start(): void {
    if (this.status !== PipelineStatus.STOPPED) {
      diagnostics.warn('Pipeline already running', { status: this.status });
      return;
    }

    this.status = PipelineStatus.IDLE;
    this.startProcessingTimer();
    this.startUploadTimer();
    
    diagnostics.info('Quest decision telemetry pipeline started');
  }

  /**
   * Stop the pipeline
   */
  stop(): void {
    this.status = PipelineStatus.STOPPED;
    
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
    
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = undefined;
    }
    
    diagnostics.info('Quest decision telemetry pipeline stopped');
  }

  /**
   * Add event to pipeline
   */
  async addEvent(event: QuestDecisionTelemetryEvent): Promise<void> {
    if (!this.config.enabled) {
      diagnostics.debug('Pipeline disabled, event ignored');
      return;
    }

    try {
      // Validate event
      if (this.config.validation.validateSchema) {
        const result = QuestDecisionTelemetryEventSchema.safeParse(event);
        if (!result.success) {
          throw new Error(`Event validation failed: ${result.error.message}`);
        }
      }

      // Apply sampling
      if (!shouldSampleEvent(this.config.sampling, event)) {
        diagnostics.debug('Event filtered by sampling');
        return;
      }

      // Sanitize event
      const sanitizedEvent = sanitizeTelemetryEvent(event, this.config.privacy);
      
      // Add to queue
      this.eventQueue.push(sanitizedEvent);
      this.metrics.queuedEvents = this.eventQueue.length;
      
      diagnostics.debug('Event added to queue', { eventId: event.eventId });
    } catch (error) {
      this.metrics.failedEvents++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.error('Failed to add event to pipeline', { error, eventId: event.eventId });
      
      if (this.config.fallback.localBackup) {
        try {
          await this.storage.save(event);
          diagnostics.debug('Event saved to fallback storage', { eventId: event.eventId });
        } catch (fallbackError) {
          diagnostics.error('Fallback storage failed', { error: fallbackError });
        }
      }
    }
  }

  /**
   * Get pipeline status
   */
  getStatus(): PipelineStatus {
    return this.status;
  }

  /**
   * Get pipeline metrics
   */
  getMetrics(): PipelineMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Force process queued events
   */
  async processEvents(): Promise<void> {
    if (this.status === PipelineStatus.PROCESSING) {
      diagnostics.warn('Pipeline already processing');
      return;
    }

    this.status = PipelineStatus.PROCESSING;
    
    try {
      const startTime = performance.now();
      
      // Process events in batches
      while (this.eventQueue.length > 0) {
        const batch = this.eventQueue.splice(0, this.config.batchProcessing.batchSize);
        await this.processBatch(batch);
      }
      
      const processingTime = performance.now() - startTime;
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + processingTime) / 2;
      
      this.status = PipelineStatus.IDLE;
      diagnostics.info('Events processed successfully', { 
        processingTime,
        eventsProcessed: this.metrics.processedEvents 
      });
    } catch (error) {
      this.status = PipelineStatus.ERROR;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.error('Failed to process events', { error });
    }
  }

  /**
   * Force upload batches
   */
  async uploadBatches(): Promise<void> {
    if (this.status === PipelineStatus.UPLOADING) {
      diagnostics.warn('Pipeline already uploading');
      return;
    }

    this.status = PipelineStatus.UPLOADING;
    
    try {
      const startTime = performance.now();
      
      // Upload all batches
      for (const batch of this.batchQueue) {
        await this.uploadBatch(batch);
      }
      
      const uploadTime = performance.now() - startTime;
      this.metrics.averageUploadTime = 
        (this.metrics.averageUploadTime + uploadTime) / 2;
      
      this.status = PipelineStatus.IDLE;
      diagnostics.info('Batches uploaded successfully', { 
        uploadTime,
        batchesUploaded: this.batchQueue.length 
      });
    } catch (error) {
      this.status = PipelineStatus.ERROR;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.error('Failed to upload batches', { error });
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.eventQueue = [];
    this.batchQueue = [];
    await this.storage.clear();
    this.metrics = this.initializeMetrics();
    diagnostics.info('Pipeline data cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QuestDecisionTelemetryPipelineConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate storage if storage config changed
    if (config.storage) {
      this.storage = this.createStorage();
    }
    
    diagnostics.info('Pipeline configuration updated');
  }

  private createStorage(): TelemetryStorage {
    switch (this.config.storage.type) {
      case 'local':
        return new LocalTelemetryStorage(this.config.storage.local);
      case 'remote':
        return new RemoteTelemetryStorage(this.config.storage.remote);
      case 'hybrid':
        return new HybridTelemetryStorage(this.config.storage);
      default:
        return new LocalTelemetryStorage(this.config.storage.local);
    }
  }

  private initializeMetrics(): PipelineMetrics {
    return {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      queuedEvents: 0,
      averageProcessingTime: 0,
      averageUploadTime: 0,
      errorRate: 0,
      uptime: 0,
      memoryUsage: 0,
      storageUsage: 0,
    };
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.queuedEvents = this.eventQueue.length;
    this.metrics.errorRate = this.metrics.totalEvents > 0 
      ? this.metrics.failedEvents / this.metrics.totalEvents 
      : 0;
    
    // Update memory usage (approximation)
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    // Update storage usage
    this.storage.getSize().then(size => {
      this.metrics.storageUsage = size;
    });
  }

  private startProcessingTimer(): void {
    if (this.config.batchProcessing.enabled) {
      this.processingTimer = setInterval(() => {
        if (this.eventQueue.length > 0) {
          this.processEvents();
        }
      }, this.config.batchProcessing.batchTimeout);
    }
  }

  private startUploadTimer(): void {
    if (this.config.batchProcessing.enabled && this.batchQueue.length > 0) {
      this.uploadTimer = setInterval(() => {
        if (this.batchQueue.length > 0) {
          this.uploadBatches();
        }
      }, this.config.batchProcessing.batchTimeout);
    }
  }

  private async processBatch(events: QuestDecisionTelemetryEvent[]): Promise<void> {
    const batch: BatchEvent = {
      events,
      timestamp: Date.now(),
      retryCount: 0,
      id: createQuestDecisionEventId(),
    };

    try {
      await this.storage.saveBatch(events);
      this.batchQueue.push(batch);
      this.metrics.processedEvents += events.length;
      this.metrics.lastProcessedTimestamp = Date.now();
    } catch (error) {
      this.metrics.failedEvents += events.length;
      throw error;
    }
  }

  private async uploadBatch(batch: BatchEvent): Promise<void> {
    try {
      await this.storage.saveBatch(batch.events);
      
      // Remove from queue
      const index = this.batchQueue.indexOf(batch);
      if (index > -1) {
        this.batchQueue.splice(index, 1);
      }
      
      this.metrics.lastUploadedTimestamp = Date.now();
    } catch (error) {
      batch.retryCount++;
      
      if (batch.retryCount < this.config.batchProcessing.maxRetries) {
        // Retry with exponential backoff
        const delay = this.config.fallback.exponentialBackoff 
          ? this.config.fallback.retryDelay * Math.pow(2, batch.retryCount)
          : this.config.fallback.retryDelay;
        
        setTimeout(() => {
          this.uploadBatch(batch);
        }, delay);
      } else {
        // Max retries exceeded, remove from queue
        const index = this.batchQueue.indexOf(batch);
        if (index > -1) {
          this.batchQueue.splice(index, 1);
        }
        
        this.metrics.failedEvents += batch.events.length;
        throw error;
      }
    }
  }
}

/**
 * Global pipeline instance
 */
let globalPipeline: QuestDecisionTelemetryPipeline | null = null;

/**
 * Get or create global pipeline instance
 */
export function getQuestDecisionTelemetryPipeline(
  config?: Partial<QuestDecisionTelemetryPipelineConfig>
): QuestDecisionTelemetryPipeline {
  if (!globalPipeline) {
    globalPipeline = new QuestDecisionTelemetryPipeline(config);
  }
  return globalPipeline;
}

/**
 * Reset global pipeline instance
 */
export function resetQuestDecisionTelemetryPipeline(): void {
  if (globalPipeline) {
    globalPipeline.stop();
    globalPipeline = null;
  }
}
