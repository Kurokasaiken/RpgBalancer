/**
 * Idle Village Quest Decision Telemetry Fallback Mechanisms
 * 
 * Comprehensive fallback system for telemetry failures with local backup,
 * retry logic, and graceful degradation.
 * 
 * @module questDecisionTelemetryFallback
 * @since 2026-01-13
 * @author Cascade
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import type { QuestDecisionTelemetryEvent } from '@/balancing/config/idleVillage/questDecisionTelemetryConfig';

const diagnostics = createHeadlessDiagnostics('QuestDecisionTelemetryFallback', 'telemetry');

/**
 * Fallback strategy types
 */
export enum FallbackStrategy {
  LOCAL_STORAGE = 'local_storage',
  MEMORY_CACHE = 'memory_cache',
  INDEXED_DB = 'indexed_db',
  FILE_SYSTEM = 'file_system',
  REMOTE_BACKUP = 'remote_backup',
}

/**
 * Fallback event status
 */
export enum FallbackEventStatus {
  PENDING = 'pending',
  RETRYING = 'retrying',
  FAILED = 'failed',
  SUCCESS = 'success',
  EXPIRED = 'expired',
}

/**
 * Fallback event with metadata
 */
export interface FallbackEvent {
  event: QuestDecisionTelemetryEvent;
  status: FallbackEventStatus;
  retryCount: number;
  lastRetryTime: number;
  nextRetryTime: number;
  errorMessage?: string;
  strategy: FallbackStrategy;
  createdAt: number;
  expiresAt: number;
}

/**
 * Fallback configuration
 */
export interface QuestDecisionTelemetryFallbackConfig {
  enabled: boolean;
  strategies: {
    primary: FallbackStrategy;
    secondary: FallbackStrategy[];
    tertiary: FallbackStrategy[];
  };
  retry: {
    maxRetries: number;
    baseDelay: number; // ms
    maxDelay: number; // ms
    exponentialBackoff: boolean;
    jitter: boolean;
  };
  storage: {
    memory: {
      maxEvents: number;
      maxSize: number; // bytes
    };
    localStorage: {
      maxSize: number; // bytes
      maxEvents: number;
      ttl: number; // ms
    };
    indexedDB: {
      dbName: string;
      storeName: string;
      version: number;
      maxSize: number; // bytes
    };
    fileSystem: {
      enabled: boolean;
      maxFileSize: number; // bytes
      maxFiles: number;
      directory: string;
    };
  };
  cleanup: {
    enabled: boolean;
    interval: number; // ms
    maxAge: number; // ms
    maxRetries: number;
  };
  monitoring: {
    enabled: boolean;
    alertThreshold: number;
    healthCheckInterval: number; // ms
  };
}

/**
 * Default fallback configuration
 */
export const DEFAULT_QUEST_DECISION_TELEMETRY_FALLBACK_CONFIG: QuestDecisionTelemetryFallbackConfig = {
  enabled: true,
  strategies: {
    primary: FallbackStrategy.LOCAL_STORAGE,
    secondary: [FallbackStrategy.MEMORY_CACHE],
    tertiary: [FallbackStrategy.INDEXED_DB, FallbackStrategy.FILE_SYSTEM],
  },
  retry: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBackoff: true,
    jitter: true,
  },
  storage: {
    memory: {
      maxEvents: 1000,
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    localStorage: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEvents: 10000,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    indexedDB: {
      dbName: 'QuestDecisionTelemetry',
      storeName: 'fallbackEvents',
      version: 1,
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    fileSystem: {
      enabled: false,
      maxFileSize: 1024 * 1024, // 1MB
      maxFiles: 100,
      directory: '/telemetry-fallback',
    },
  },
  cleanup: {
    enabled: true,
    interval: 60 * 60 * 1000, // 1 hour
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxRetries: 3,
  },
  monitoring: {
    enabled: true,
    alertThreshold: 100, // events
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Storage interface for fallback strategies
 */
interface FallbackStorage {
  save(event: FallbackEvent): Promise<void>;
  load(limit?: number): Promise<FallbackEvent[]>;
  remove(eventId: string): Promise<void>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getCount(): Promise<number>;
  isAvailable(): Promise<boolean>;
}

class NullFallbackStorage implements FallbackStorage {
  constructor(
    private readonly strategy: FallbackStrategy,
    private readonly reason: string,
  ) {}

  async save(): Promise<void> {
    diagnostics.debug('Skipping save on unavailable storage', {
      strategy: this.strategy,
      reason: this.reason,
    });
  }

  async load(): Promise<FallbackEvent[]> {
    return [];
  }

  async remove(): Promise<void> {}

  async clear(): Promise<void> {}

  async getSize(): Promise<number> {
    return 0;
  }

  async getCount(): Promise<number> {
    return 0;
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}

/**
 * Memory cache storage
 */
class MemoryCacheStorage implements FallbackStorage {
  private events = new Map<string, FallbackEvent>();
  private maxSize: number;
  private maxEvents: number;

  constructor(config: QuestDecisionTelemetryFallbackConfig['storage']['memory']) {
    this.maxSize = config.maxSize;
    this.maxEvents = config.maxEvents;
  }

  async save(event: FallbackEvent): Promise<void> {
    // Check size limits
    if (this.events.size >= this.maxEvents) {
      // Remove oldest events
      const oldestKey = this.events.keys().next().value;
      if (oldestKey) {
        this.events.delete(oldestKey);
      }
    }

    // Estimate size and check memory limit
    const estimatedSize = JSON.stringify(event).length;
    const currentSize = Array.from(this.events.values())
      .reduce((total, e) => total + JSON.stringify(e).length, 0);
    
    if (currentSize + estimatedSize > this.maxSize) {
      // Remove oldest events until under limit
      let removed = 0;
      for (const [key] of this.events) {
        this.events.delete(key);
        removed++;
        if (removed >= 10) break; // Remove in batches
      }
    }

    this.events.set(event.event.eventId, event);
  }

  async load(limit?: number): Promise<FallbackEvent[]> {
    const events = Array.from(this.events.values());
    
    // Sort by creation time (newest first)
    events.sort((a, b) => b.createdAt - a.createdAt);
    
    if (limit && limit > 0) {
      return events.slice(0, limit);
    }
    
    return events;
  }

  async remove(eventId: string): Promise<void> {
    this.events.delete(eventId);
  }

  async clear(): Promise<void> {
    this.events.clear();
  }

  async getSize(): Promise<number> {
    return Array.from(this.events.values())
      .reduce((total, event) => total + JSON.stringify(event).length, 0);
  }

  async getCount(): Promise<number> {
    return this.events.size;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Memory is always available
  }
}

/**
 * Local storage fallback
 */
class LocalStorageStorage implements FallbackStorage {
  private storageKey = 'quest-decision-telemetry-fallback';
  private metadataKey = 'quest-decision-telemetry-fallback-metadata';
  private maxSize: number;
  private maxEvents: number;
  private ttl: number;

  constructor(config: QuestDecisionTelemetryFallbackConfig['storage']['localStorage']) {
    this.maxSize = config.maxSize;
    this.maxEvents = config.maxEvents;
    this.ttl = config.ttl;
  }

  async save(event: FallbackEvent): Promise<void> {
    try {
      const events = await this.load();
      events.push(event);
      
      // Apply limits
      const limitedEvents = this.applyLimits(events);
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(limitedEvents));
      await this.updateMetadata(limitedEvents);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear old events and retry
        await this.clear();
        await this.save(event);
      } else {
        throw error;
      }
    }
  }

  async load(limit?: number): Promise<FallbackEvent[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const events = JSON.parse(data) as FallbackEvent[];
      
      // Filter expired events
      const now = Date.now();
      const validEvents = events.filter(event => 
        now - event.createdAt < this.ttl
      );
      
      // Sort by creation time (newest first)
      validEvents.sort((a, b) => b.createdAt - a.createdAt);
      
      if (limit && limit > 0) {
        return validEvents.slice(0, limit);
      }
      
      return validEvents;
    } catch (error) {
      diagnostics.warn('Failed to load from localStorage', { error });
      return [];
    }
  }

  async remove(eventId: string): Promise<void> {
    const events = await this.load();
    const filtered = events.filter(e => e.event.eventId !== eventId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    await this.updateMetadata(filtered);
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
      return 0;
    }
  }

  async getCount(): Promise<number> {
    try {
      const metadata = localStorage.getItem(this.metadataKey);
      return metadata ? JSON.parse(metadata).count : 0;
    } catch (error) {
      return 0;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = 'test-local-storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  private applyLimits(events: FallbackEvent[]): FallbackEvent[] {
    // Sort by creation time (oldest first)
    events.sort((a, b) => a.createdAt - b.createdAt);
    
    // Apply event count limit
    if (events.length > this.maxEvents) {
      events.splice(0, events.length - this.maxEvents);
    }
    
    // Apply size limit
    let size = JSON.stringify(events).length;
    while (size > this.maxSize && events.length > 0) {
      events.shift();
      size = JSON.stringify(events).length;
    }
    
    return events;
  }

  private async updateMetadata(events: FallbackEvent[]): Promise<void> {
    const metadata = {
      count: events.length,
      size: JSON.stringify(events).length,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
  }
}

/**
 * IndexedDB fallback
 */
class IndexedDBStorage implements FallbackStorage {
  private dbName: string;
  private storeName: string;
  private version: number;
  private maxSize: number;
  private db: IDBDatabase | null = null;
  private isSupported: boolean;

  constructor(config: QuestDecisionTelemetryFallbackConfig['storage']['indexedDB']) {
    this.dbName = config.dbName;
    this.storeName = config.storeName;
    this.version = config.version;
    this.maxSize = config.maxSize;
    this.isSupported = typeof indexedDB !== 'undefined' && typeof indexedDB.open === 'function';
  }

  supportsEnvironment(): boolean {
    return this.isSupported;
  }

  async save(event: FallbackEvent): Promise<void> {
    if (!this.isSupported) {
      diagnostics.debug('IndexedDB unavailable, skipping save');
      return;
    }
    const db = await this.getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(event);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(limit?: number): Promise<FallbackEvent[]> {
    if (!this.isSupported) {
      return [];
    }
    const db = await this.getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        let events = request.result as FallbackEvent[];
        
        // Sort by creation time (newest first)
        events.sort((a, b) => b.createdAt - a.createdAt);
        
        if (limit && limit > 0) {
          events = events.slice(0, limit);
        }
        
        resolve(events);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async remove(eventId: string): Promise<void> {
    if (!this.isSupported) {
      return;
    }
    const db = await this.getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(eventId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.isSupported) {
      return;
    }
    const db = await this.getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSize(): Promise<number> {
    if (!this.isSupported) {
      return 0;
    }
    // IndexedDB doesn't provide direct size information
    // This is an approximation based on event count
    const count = await this.getCount();
    return count * 1000; // Rough estimate
  }

  async getCount(): Promise<number> {
    if (!this.isSupported) {
      return 0;
    }
    const db = await this.getDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }
    try {
      await this.getDatabase();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('IndexedDB API is not available in this environment'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);
      if (!request) {
        this.isSupported = false;
        reject(new Error('IndexedDB open did not return a request object'));
        return;
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'event.eventId' });
          
          // Create indexes for efficient querying
          store.createIndex('status', 'status');
          store.createIndex('strategy', 'strategy');
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('expiresAt', 'expiresAt');
        }
      };
    });
  }
}

/**
 * Fallback manager
 */
export class QuestDecisionTelemetryFallback {
  private config: QuestDecisionTelemetryFallbackConfig;
  private storages: Map<FallbackStrategy, FallbackStorage> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private isHealthy = true;

  constructor(config: Partial<QuestDecisionTelemetryFallbackConfig> = {}) {
    this.config = { ...DEFAULT_QUEST_DECISION_TELEMETRY_FALLBACK_CONFIG, ...config };
    this.initializeStorages();
    
    if (this.config.enabled) {
      this.startCleanupTimer();
      this.startHealthCheckTimer();
    }
  }

  /**
   * Save event to fallback storage
   */
  async saveEvent(event: QuestDecisionTelemetryEvent, error?: Error): Promise<void> {
    if (!this.config.enabled) return;

    const fallbackEvent: FallbackEvent = {
      event,
      status: FallbackEventStatus.PENDING,
      retryCount: 0,
      lastRetryTime: 0,
      nextRetryTime: Date.now() + this.config.retry.baseDelay,
      errorMessage: error?.message,
      strategy: this.config.strategies.primary,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await this.saveToStorage(fallbackEvent, this.config.strategies.primary);
    
    diagnostics.debug('Event saved to fallback', { 
      eventId: event.eventId, 
      strategy: this.config.strategies.primary 
    });
  }

  /**
   * Get pending events for retry
   */
  async getPendingEvents(): Promise<FallbackEvent[]> {
    if (!this.config.enabled) return [];

    const allEvents: FallbackEvent[] = [];
    
    // Load from all available storages
    for (const strategy of [
      this.config.strategies.primary,
      ...this.config.strategies.secondary,
      ...this.config.strategies.tertiary,
    ]) {
      const storage = this.storages.get(strategy);
      if (storage && await storage.isAvailable()) {
        try {
          const events = await storage.load();
          allEvents.push(...events);
        } catch (error) {
          diagnostics.warn('Failed to load from fallback storage', { strategy, error });
        }
      }
    }

    // Filter and sort pending events
    return allEvents
      .filter(event => 
        event.status === FallbackEventStatus.PENDING ||
        (event.status === FallbackEventStatus.RETRYING && event.nextRetryTime <= Date.now())
      )
      .filter(event => event.expiresAt > Date.now())
      .sort((a, b) => a.nextRetryTime - b.nextRetryTime);
  }

  /**
   * Mark event as successful
   */
  async markEventSuccess(eventId: string): Promise<void> {
    await this.updateEventStatus(eventId, FallbackEventStatus.SUCCESS);
  }

  /**
   * Mark event as failed and increment retry count
   */
  async markEventFailed(eventId: string, error?: Error): Promise<void> {
    const events = await this.getEventById(eventId);
    if (events.length === 0) return;

    const event = events[0];
    event.retryCount++;
    event.lastRetryTime = Date.now();
    
    if (error) {
      event.errorMessage = error.message;
    }

    if (event.retryCount >= this.config.retry.maxRetries) {
      event.status = FallbackEventStatus.FAILED;
      diagnostics.warn('Event marked as failed after max retries', { 
        eventId, 
        retryCount: event.retryCount 
      });
    } else {
      event.status = FallbackEventStatus.RETRYING;
      event.nextRetryTime = this.calculateNextRetryTime(event.retryCount);
      diagnostics.debug('Event scheduled for retry', { 
        eventId, 
        retryCount: event.retryCount,
        nextRetryTime: event.nextRetryTime 
      });
    }

    await this.saveToStorage(event, event.strategy);
  }

  /**
   * Get events by ID
   */
  async getEventById(eventId: string): Promise<FallbackEvent[]> {
    const allEvents: FallbackEvent[] = [];
    
    for (const storage of this.storages.values()) {
      if (await storage.isAvailable()) {
        try {
          const events = await storage.load();
          allEvents.push(...events.filter(e => e.event.eventId === eventId));
        } catch (error) {
          diagnostics.warn('Failed to load from storage', { error });
        }
      }
    }

    return allEvents;
  }

  /**
   * Clear all fallback events
   */
  async clear(): Promise<void> {
    for (const storage of this.storages.values()) {
      try {
        await storage.clear();
      } catch (error) {
        diagnostics.warn('Failed to clear storage', { error });
      }
    }
    
    diagnostics.info('Fallback storage cleared');
  }

  /**
   * Get fallback statistics
   */
  async getStats(): Promise<{
    totalEvents: number;
    pendingEvents: number;
    failedEvents: number;
    successfulEvents: number;
    expiredEvents: number;
    storageStats: Array<{
      strategy: FallbackStrategy;
      available: boolean;
      count: number;
      size: number;
    }>;
  }> {
    const stats = {
      totalEvents: 0,
      pendingEvents: 0,
      failedEvents: 0,
      successfulEvents: 0,
      expiredEvents: 0,
      storageStats: [] as Array<{
        strategy: FallbackStrategy;
        available: boolean;
        count: number;
        size: number;
      }>,
    };

    for (const [strategy, storage] of this.storages.entries()) {
      try {
        const available = await storage.isAvailable();
        let count = 0;
        let size = 0;
        let events: FallbackEvent[] = [];

        if (available) {
          count = await storage.getCount();
          size = await storage.getSize();
          events = await storage.load();
        }

        stats.storageStats.push({
          strategy,
          available,
          count,
          size,
        });

        stats.totalEvents += events.length;
        stats.pendingEvents += events.filter(e => e.status === FallbackEventStatus.PENDING).length;
        stats.failedEvents += events.filter(e => e.status === FallbackEventStatus.FAILED).length;
        stats.successfulEvents += events.filter(e => e.status === FallbackEventStatus.SUCCESS).length;
        stats.expiredEvents += events.filter(e => e.expiresAt <= Date.now()).length;
      } catch (error) {
        diagnostics.warn('Failed to get storage stats', { strategy, error });
      }
    }

    return stats;
  }

  /**
   * Check if fallback system is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.config.enabled) return true;

    // Check primary storage
    const primaryStorage = this.storages.get(this.config.strategies.primary);
    if (primaryStorage && await primaryStorage.isAvailable()) {
      return true;
    }

    // Check secondary storages
    for (const strategy of this.config.strategies.secondary) {
      const storage = this.storages.get(strategy);
      if (storage && await storage.isAvailable()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QuestDecisionTelemetryFallbackConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeStorages();
    diagnostics.info('Fallback configuration updated');
  }

  /**
   * Cleanup expired events
   */
  async cleanup(): Promise<void> {
    if (!this.config.cleanup.enabled) return;

    const now = Date.now();
    let cleanedCount = 0;

    for (const storage of this.storages.values()) {
      try {
        const events = await storage.load();
        const expiredEvents = events.filter(e => e.expiresAt <= now);
        
        for (const event of expiredEvents) {
          await storage.remove(event.event.eventId);
          cleanedCount++;
        }
      } catch (error) {
        diagnostics.warn('Failed to cleanup storage', { error });
      }
    }

    if (cleanedCount > 0) {
      diagnostics.info('Cleanup completed', { cleanedCount });
    }
  }

  private initializeStorages(): void {
    this.storages.clear();
    
    // Initialize memory cache
    this.storages.set(
      FallbackStrategy.MEMORY_CACHE,
      new MemoryCacheStorage(this.config.storage.memory)
    );
    
    // Initialize local storage
    const localStorageAvailable = typeof localStorage !== 'undefined';
    this.storages.set(
      FallbackStrategy.LOCAL_STORAGE,
      localStorageAvailable
        ? new LocalStorageStorage(this.config.storage.localStorage)
        : new NullFallbackStorage(FallbackStrategy.LOCAL_STORAGE, 'localStorage unavailable in this runtime'),
    );
    
    // Initialize IndexedDB
    const indexedDbStorage = new IndexedDBStorage(this.config.storage.indexedDB);
    this.storages.set(
      FallbackStrategy.INDEXED_DB,
      indexedDbStorage.supportsEnvironment()
        ? indexedDbStorage
        : new NullFallbackStorage(FallbackStrategy.INDEXED_DB, 'IndexedDB API unavailable in this runtime'),
    );
  }

  private async saveToStorage(event: FallbackEvent, strategy: FallbackStrategy): Promise<void> {
    const storage = this.storages.get(strategy);
    if (!storage) {
      throw new Error(`Storage not available for strategy: ${strategy}`);
    }

    if (!(await storage.isAvailable())) {
      // Try fallback strategies
      for (const fallbackStrategy of this.config.strategies.secondary) {
        const fallbackStorage = this.storages.get(fallbackStrategy);
        if (fallbackStorage && await fallbackStorage.isAvailable()) {
          event.strategy = fallbackStrategy;
          await fallbackStorage.save(event);
          return;
        }
      }
      
      throw new Error('No available storage for fallback event');
    }

    await storage.save(event);
  }

  private async updateEventStatus(eventId: string, status: FallbackEventStatus): Promise<void> {
    const events = await this.getEventById(eventId);
    if (events.length === 0) return;

    const event = events[0];
    event.status = status;
    
    if (status === FallbackEventStatus.SUCCESS) {
      // Remove from storage after successful processing
      const storage = this.storages.get(event.strategy);
      if (storage) {
        await storage.remove(eventId);
      }
    } else {
      // Update event in storage
      await this.saveToStorage(event, event.strategy);
    }
  }

  private calculateNextRetryTime(retryCount: number): number {
    let delay = this.config.retry.baseDelay;
    
    if (this.config.retry.exponentialBackoff) {
      delay = Math.min(delay * Math.pow(2, retryCount), this.config.retry.maxDelay);
    }
    
    if (this.config.retry.jitter) {
      delay += Math.random() * delay * 0.1; // Add 10% jitter
    }
    
    return Date.now() + delay;
  }

  private startCleanupTimer(): void {
    if (this.config.cleanup.enabled) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanup.interval);
    }
  }

  private startHealthCheckTimer(): void {
    if (this.config.monitoring.enabled) {
      this.healthCheckTimer = setInterval(async () => {
        const healthy = await this.isHealthy();
        if (healthy !== this.isHealthy) {
          this.isHealthy = healthy;
          diagnostics.info('Fallback health status changed', { healthy });
        }
      }, this.config.monitoring.healthCheckInterval);
    }
  }
}

/**
 * Global fallback instance
 */
let globalFallback: QuestDecisionTelemetryFallback | null = null;

/**
 * Get or create global fallback instance
 */
export function getQuestDecisionTelemetryFallback(
  config?: Partial<QuestDecisionTelemetryFallbackConfig>
): QuestDecisionTelemetryFallback {
  if (!globalFallback) {
    globalFallback = new QuestDecisionTelemetryFallback(config);
  }
  return globalFallback;
}

/**
 * Reset global fallback instance
 */
export function resetQuestDecisionTelemetryFallback(): void {
  if (globalFallback) {
    globalFallback.clear();
    globalFallback = null;
  }
}
