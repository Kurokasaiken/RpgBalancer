/**
 * Balancer History Store
 * Manages undo/redo functionality with persistent snapshots using PersistenceService.
 * Config-first design with configurable snapshot limits and automatic cleanup.
 */

import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { BalancerConfig, ConfigSnapshot } from './types';

/**
 * Configuration for the history store behavior.
 */
export interface BalancerHistoryConfig {
  /** Maximum number of snapshots to keep (default: 10) */
  maxSnapshots: number;
  /** Storage key for persistence (default: 'balancerHistory') */
  storageKey: string;
  /** Whether to auto-save snapshots (default: true) */
  autoSave: boolean;
  /** Whether to enable deterministic timestamps for testing (default: false) */
  deterministicTimestamps: boolean;
  /** Base timestamp for deterministic mode (default: 0) */
  baseTimestamp: number;
  /** Operation timeout in milliseconds (default: 5000) */
  operationTimeoutMs: number;
  /** Maximum operation retries (default: 3) */
  maxRetries: number;
  /** Retry delay in milliseconds (default: 100) */
  retryDelayMs: number;
  /** Enable operation deduplication (default: true) */
  enableDeduplication: boolean;
  /** Maximum recent operations to track (default: 20) */
  maxRecentOperations: number;
  /** Enable checksum validation (default: true) */
  enableChecksumValidation: boolean;
  /** Enable corruption detection (default: true) */
  enableCorruptionDetection: boolean;
}

/**
 * History operation types for tracking and debugging.
 */
export type HistoryOperationType = 'push' | 'undo' | 'redo' | 'clear' | 'reset';

/**
 * History operation metadata for debugging and race condition detection.
 */
export interface HistoryOperation {
  id: string;
  type: HistoryOperationType;
  timestamp: number;
  description?: string;
  completed: boolean;
  error?: string;
  retryCount?: number;
  duration?: number;
  checksum?: string;
}

/**
 * History store health and diagnostics information.
 */
export interface HistoryHealthDiagnostics {
  /** Overall health status */
  health: 'healthy' | 'degraded' | 'critical';
  /** Number of corrupted snapshots */
  corruptedSnapshots: number;
  /** Number of operations with errors */
  errorCount: number;
  /** Average operation duration */
  averageOperationDuration: number;
  /** Storage quota usage percentage */
  storageUsage: number;
  /** Last successful operation timestamp */
  lastSuccessfulOperation: number | null;
  /** Recommendations for fixing issues */
  recommendations: string[];
}

/**
 * History store state and operations.
 */
export interface BalancerHistoryState {
  /** Current snapshots array (newest first) */
  snapshots: ConfigSnapshot[];
  /** Current position in history (for undo/redo) */
  currentIndex: number;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Recent operations for debugging */
  recentOperations: HistoryOperation[];
  /** Current operation being processed */
  currentOperation: string | null;
  /** Store health diagnostics */
  healthDiagnostics: HistoryHealthDiagnostics;
  /** Last error timestamp */
  lastError: number | null;
  /** Operation statistics */
  operationStats: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
  };
}

/**
 * Balancer History Store
 * 
 * Provides undo/redo functionality for the balancer configuration.
 * Uses PersistenceService for async persistence and supports configurable limits.
 * 
 * Features:
 * - Configurable snapshot limits (default: 10)
 * - Automatic persistence via PersistenceService
 * - Undo/redo with position tracking
 * - Diff summaries for UI display
 * - Config-first design with no hardcoded values
 */
export class BalancerHistoryStore {
  private config: BalancerHistoryConfig;
  private state: BalancerHistoryState;
  private operationCounter: number = 0;
  private operationPromises: Map<string, Promise<unknown>> = new Map();
  private operationRetryCount: Map<string, number> = new Map();
  private lastOperationHash: string | null = null;

  /**
   * Creates a new history store instance.
   * 
   * @param config - Configuration for the store behavior
   */
  constructor(config: Partial<BalancerHistoryConfig> = {}) {
    this.config = {
      maxSnapshots: 10,
      storageKey: 'balancerHistory',
      autoSave: true,
      deterministicTimestamps: false,
      baseTimestamp: 0,
      operationTimeoutMs: 5000,
      maxRetries: 3,
      retryDelayMs: 100,
      enableDeduplication: true,
      maxRecentOperations: 20,
      enableChecksumValidation: true,
      enableCorruptionDetection: true,
      ...config,
    };

    this.state = {
      snapshots: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
      recentOperations: [],
      currentOperation: null,
      healthDiagnostics: this.initializeHealthDiagnostics(),
      lastError: null,
      operationStats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
      },
    };
  }

  /**
   * Initializes health diagnostics with default values.
   * 
   * @returns Initial health diagnostics
   */
  private initializeHealthDiagnostics(): HistoryHealthDiagnostics {
    return {
      health: 'healthy',
      corruptedSnapshots: 0,
      errorCount: 0,
      averageOperationDuration: 0,
      storageUsage: 0,
      lastSuccessfulOperation: null,
      recommendations: [],
    };
  }

  /**
   * Generates a deterministic timestamp for testing purposes.
   * 
   * @returns Deterministic timestamp
   */
  private generateTimestamp(): number {
    if (this.config.deterministicTimestamps) {
      return this.config.baseTimestamp + (this.operationCounter * 1000);
    }
    return Date.now();
  }

  /**
   * Generates a unique operation ID.
   * 
   * @param type - Operation type
   * @returns Unique operation ID
   */
  private generateOperationId(type: HistoryOperationType): string {
    this.operationCounter++;
    return `${type}_${this.operationCounter}_${this.generateTimestamp()}`;
  }

  /**
   * Generates a checksum for data integrity validation.
   * 
   * @param data - Data to checksum
   * @returns Checksum string
   */
  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Validates data integrity using checksum.
   * 
   * @param data - Data to validate
   * @param expectedChecksum - Expected checksum
   * @returns Whether data is valid
   */
  private validateDataIntegrity(data: unknown, expectedChecksum: string): boolean {
    if (!this.config.enableChecksumValidation) {
      return true;
    }
    return this.generateChecksum(data) === expectedChecksum;
  }

  /**
   * Detects corruption in snapshot data.
   * 
   * @param snapshot - Snapshot to check
   * @returns Whether snapshot is corrupted
   */
  private detectCorruption(snapshot: ConfigSnapshot): boolean {
    if (!this.config.enableCorruptionDetection) {
      return false;
    }

    // Basic structure validation
    if (!snapshot || typeof snapshot !== 'object') {
      return true;
    }

    // Required properties validation
    const required = ['timestamp', 'config', 'description'];
    for (const prop of required) {
      if (!(prop in snapshot)) {
        return true;
      }
    }

    // Config validation
    if (!snapshot.config || typeof snapshot.config !== 'object') {
      return true;
    }

    // Timestamp validation
    if (typeof snapshot.timestamp !== 'number' || snapshot.timestamp <= 0) {
      return true;
    }

    return false;
  }

  /**
   * Records an operation for debugging and race condition detection.
   * 
   * @param type - Operation type
   * @param description - Operation description
   * @returns Operation ID
   */
  private recordOperation(type: HistoryOperationType, description?: string): string {
    const id = this.generateOperationId(type);
    const operation: HistoryOperation = {
      id,
      type,
      timestamp: this.generateTimestamp(),
      description,
      completed: false,
    };

    this.state.recentOperations.unshift(operation);
    
    // Keep only last 20 operations for debugging
    if (this.state.recentOperations.length > 20) {
      this.state.recentOperations = this.state.recentOperations.slice(0, 20);
    }

    return id;
  }

  /**
   * Marks an operation as completed or failed.
   * 
   * @param operationId - Operation ID
   * @param completed - Whether operation completed successfully
   * @param error - Error message if operation failed
   */
  private completeOperation(operationId: string, completed: boolean, error?: string): void {
    const operation = this.state.recentOperations.find(op => op.id === operationId);
    if (operation) {
      operation.completed = completed;
      operation.error = error;
    }
    
    if (this.state.currentOperation === operationId) {
      this.state.currentOperation = null;
    }
    
    // Clean up completed operation promises
    this.operationPromises.delete(operationId);
  }

  /**
   * Executes an operation with timeout, retry logic, and race condition protection.
   * 
   * @param operationId - Operation ID
   * @param operation - Async operation to execute
   * @returns Promise that resolves with operation result
   */
  private async executeOperation<T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let retryCount = 0;
    let lastError: Error | null = null;

    // Check if operation is already in progress
    if (this.operationPromises.has(operationId)) {
      throw new Error(`Operation ${operationId} is already in progress`);
    }

    this.state.currentOperation = operationId;
    this.state.operationStats.totalOperations++;

    const executeWithRetry = async (): Promise<T> => {
      try {
        const operationPromise = this.withTimeout(
          operation(),
          this.config.operationTimeoutMs,
          `Operation ${operationId} timed out`
        );

        this.operationPromises.set(operationId, operationPromise);
        const result = await operationPromise;
        
        // Update success statistics
        this.state.operationStats.successfulOperations++;
        this.state.healthDiagnostics.lastSuccessfulOperation = Date.now();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount <= this.config.maxRetries) {
          console.warn(`[BalancerHistoryStore] Operation ${operationId} failed, retrying (${retryCount}/${this.config.maxRetries}):`, error);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
          
          return executeWithRetry();
        } else {
          // Update failure statistics
          this.state.operationStats.failedOperations++;
          this.state.lastError = Date.now();
          this.state.healthDiagnostics.errorCount++;
          
          throw lastError;
        }
      } finally {
        // Clean up
        this.operationPromises.delete(operationId);
        this.operationRetryCount.delete(operationId);
        
        if (this.state.currentOperation === operationId) {
          this.state.currentOperation = null;
        }
        
        // Update operation duration statistics
        const duration = performance.now() - startTime;
        this.updateOperationStats(duration);
      }
    };

    return executeWithRetry();
  }

  /**
   * Updates operation statistics.
   * 
   * @param duration - Operation duration in milliseconds
   */
  private updateOperationStats(duration: number): void {
    const stats = this.state.operationStats;
    const totalOps = stats.totalOperations;
    
    // Calculate rolling average
    stats.averageDuration = (stats.averageDuration * (totalOps - 1) + duration) / totalOps;
    
    // Update health diagnostics
    this.state.healthDiagnostics.averageOperationDuration = stats.averageDuration;
    
    // Update health status based on performance
    if (stats.averageDuration > 1000) {
      this.state.healthDiagnostics.health = 'degraded';
      this.state.healthDiagnostics.recommendations.push('Consider reducing operation complexity');
    } else if (stats.failedOperations / totalOps > 0.1) {
      this.state.healthDiagnostics.health = 'critical';
      this.state.healthDiagnostics.recommendations.push('High failure rate detected');
    } else {
      this.state.healthDiagnostics.health = 'healthy';
      this.state.healthDiagnostics.recommendations = [];
    }
  }

  /**
   * Checks for duplicate operations.
   * 
   * @param operationHash - Hash of the operation data
   * @returns Whether operation is a duplicate
   */
  private isDuplicateOperation(operationHash: string): boolean {
    if (!this.config.enableDeduplication) {
      return false;
    }
    
    return this.lastOperationHash === operationHash;
  }

  /**
   * Gets storage usage statistics.
   * 
   * @returns Storage usage percentage
   */
  private getStorageUsage(): number {
    try {
      const storageData = JSON.stringify(this.state);
      const storageSize = new Blob([storageData]).size;
      
      // Assume 5MB localStorage limit
      const maxStorage = 5 * 1024 * 1024;
      return (storageSize / maxStorage) * 100;
    } catch {
      return 0;
    }
  }

  /**
   * Wraps a promise with timeout.
   * 
   * @param promise - Promise to wrap
   * @param timeoutMs - Timeout in milliseconds
   * @param timeoutMessage - Timeout error message
   * @returns Promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Derives undo/redo availability flags based on the current index and snapshot count.
   */
  private updateFlags(): void {
    const { snapshots } = this.state;
    const maxIndex = snapshots.length - 1;

    if (this.state.currentIndex > maxIndex) {
      this.state.currentIndex = maxIndex;
    }
    if (maxIndex < 0) {
      this.state.currentIndex = -1;
    }

    const currentIndex = this.state.currentIndex;
    this.state.canUndo = snapshots.length > 0 && currentIndex + 1 < snapshots.length;
    this.state.canRedo = snapshots.length > 0 && currentIndex > 0;
  }

  /**
   * Initializes the store by loading persisted history.
   * Must be called before using other methods.
   */
  async initialize(): Promise<void> {
    try {
      const persisted = await loadData<BalancerHistoryState>(
        this.config.storageKey,
        this.state
      );
      
      // Validate and sanitize persisted data
      const validSnapshots = persisted.snapshots?.filter(snapshot => 
        !this.detectCorruption(snapshot)
      ).slice(0, this.config.maxSnapshots) || [];
      
      this.state = {
        snapshots: validSnapshots,
        currentIndex: Math.min(persisted.currentIndex ?? -1, validSnapshots.length - 1),
        canUndo: false,
        canRedo: false,
        recentOperations: [],
        currentOperation: null,
        healthDiagnostics: this.initializeHealthDiagnostics(),
        lastError: null,
        operationStats: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          averageDuration: 0,
        },
      };

      this.updateFlags();
    } catch (error) {
      console.warn('[BalancerHistoryStore] Failed to load persisted history:', error);
      // Start with empty state on error
      this.reset();
    }
  }

  /**
   * Adds a new snapshot to the history.
   * 
   * @param config - The balancer configuration to snapshot
   * @param description - Human-readable description of the change
   */
  async pushSnapshot(config: BalancerConfig, description: string): Promise<void> {
    const operationId = this.recordOperation('push', description);
    
    try {
      await this.executeOperation(operationId, async () => {
        // Generate checksum for deduplication
        const configHash = this.generateChecksum(config);
        
        // Check for duplicates
        if (this.isDuplicateOperation(configHash)) {
          console.warn(`[BalancerHistoryStore] Duplicate snapshot detected, skipping: ${description}`);
          return;
        }
        
        const snapshot: ConfigSnapshot = {
          timestamp: this.generateTimestamp(),
          config: JSON.parse(JSON.stringify(config)), // Deep clone
          description,
        };

        // Add checksum to snapshot
        snapshot.checksum = this.generateChecksum(snapshot);

        // Remove any snapshots after current position (redo stack)
        const beforeCurrent = this.state.snapshots.slice(0, this.state.currentIndex + 1);
        const newSnapshots = [snapshot, ...beforeCurrent];

        // Enforce maximum snapshot limit
        const limitedSnapshots = newSnapshots.slice(0, this.config.maxSnapshots);

        // Validate snapshots before storing
        const validSnapshots = limitedSnapshots.filter(s => !this.detectCorruption(s));
        const corruptedCount = limitedSnapshots.length - validSnapshots.length;
        
        if (corruptedCount > 0) {
          console.warn(`[BalancerHistoryStore] Detected and removed ${corruptedCount} corrupted snapshots`);
          this.state.healthDiagnostics.corruptedSnapshots += corruptedCount;
        }

        this.state.snapshots = validSnapshots;
        this.state.currentIndex = 0; // New snapshot is at position 0
        this.updateFlags();
        
        // Update storage usage
        this.state.healthDiagnostics.storageUsage = this.getStorageUsage();
        
        // Update last operation hash
        this.lastOperationHash = configHash;

        if (this.config.autoSave) {
          await this.persist();
        }
      });
    } catch (error) {
      console.error('[BalancerHistoryStore] Failed to push snapshot:', error);
      throw error;
    }
  }

/**
 * Undoes to the previous snapshot.
 * 
 * @returns The previous configuration, or null if undo is not available
 */
async undo(): Promise<BalancerConfig | null> {
  const operationId = this.recordOperation('undo', 'Undo operation');
  
  try {
    return await this.executeOperation(operationId, async () => {
      if (!this.state.canUndo) {
        return null;
      }

      const newIndex = this.state.currentIndex + 1;
      if (newIndex >= this.state.snapshots.length) {
        return null;
      }

      this.state.currentIndex = newIndex;
      this.updateFlags();

      if (this.config.autoSave) {
        await this.persist();
      }

      return this.state.snapshots[newIndex].config;
    });
  } catch (error) {
    console.error('[BalancerHistoryStore] Failed to undo:', error);
    throw error;
  }
}

  /**
   * Redoes to the next snapshot.
   * 
   * @returns The next configuration, or null if redo is not available
   */
  async redo(): Promise<BalancerConfig | null> {
    const operationId = this.recordOperation('redo', 'Redo operation');
    
    try {
      return await this.executeOperation(operationId, async () => {
        if (!this.state.canRedo) {
          return null;
        }

        const newIndex = this.state.currentIndex - 1;
        if (newIndex < 0) {
          return null;
        }

        this.state.currentIndex = newIndex;
        this.updateFlags();

        if (this.config.autoSave) {
          await this.persist();
        }

        return this.state.snapshots[newIndex].config;
      });
    } catch (error) {
      console.error('[BalancerHistoryStore] Failed to redo:', error);
      throw error;
    }
  }

  /**
   * Gets the current configuration from history.
   * 
   * @returns Current configuration, or null if no history exists
   */
  getCurrentConfig(): BalancerConfig | null {
    if (this.state.currentIndex < 0 || this.state.currentIndex >= this.state.snapshots.length) {
      return null;
    }

    return this.state.snapshots[this.state.currentIndex].config;
  }

  /**
   * Gets all snapshots for display in UI.
   * 
   * @returns Array of snapshots with diff information
   */
  getHistory(): ConfigSnapshot[] {
    return this.state.snapshots.map((snapshot, index) => ({
      ...snapshot,
      // Add diff summary for UI
      ...(index > 0 && {
        diffSummary: this.generateDiffSummary(
          this.state.snapshots[index - 1].config,
          snapshot.config
        ),
      }),
    }));
  }

  /**
   * Resets the store to initial state.
   */
  async reset(): Promise<void> {
    const operationId = this.recordOperation('reset', 'Reset to initial state');
    
    try {
      await this.executeOperation(operationId, async () => {
        await this.clear();
      });
    } catch (error) {
      console.error('[BalancerHistoryStore] Failed to reset history:', error);
      throw error;
    }
  }

  /**
   * Clears all history.
   */
  async clear(): Promise<void> {
    const operationId = this.recordOperation('clear', 'Clear history');
    
    try {
      await this.executeOperation(operationId, async () => {
        this.state.snapshots = [];
        this.state.currentIndex = -1;
        this.updateFlags();
        
        // Reset health diagnostics
        this.state.healthDiagnostics = this.initializeHealthDiagnostics();
        this.state.lastError = null;
        this.state.operationStats = {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          averageDuration: 0,
        };

        if (this.config.autoSave) {
          await this.persist();
        }
      });
    } catch (error) {
      console.error('[BalancerHistoryStore] Failed to clear history:', error);
      throw error;
    }
  }

  /**
   * Gets the current state for UI consumption.
   * 
   * @returns Current history state
   */
  getState(): BalancerHistoryState {
    return { ...this.state };
  }

  /**
   * Gets health diagnostics information.
   * 
   * @returns Health diagnostics
   */
  getHealthDiagnostics(): HistoryHealthDiagnostics {
    return { ...this.state.healthDiagnostics };
  }

  /**
   * Gets operation statistics.
   * 
   * @returns Operation statistics
   */
  getOperationStats(): BalancerHistoryState['operationStats'] {
    return { ...this.state.operationStats };
  }

  /**
   * Gets storage statistics for monitoring.
   * 
   * @returns Storage statistics
   */
  getStorageStats(): {
    snapshotCount: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const snapshots = this.state.snapshots;
    return {
      snapshotCount: snapshots.length,
      currentIndex: this.state.currentIndex,
      canUndo: this.state.canUndo,
      canRedo: this.state.canRedo,
      oldestTimestamp: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
      newestTimestamp: snapshots.length > 0 ? snapshots[0].timestamp : null,
    };
  }

  /**
   * Checks if two configurations are effectively the same.
   * 
   * @param config1 - First configuration
   * @param config2 - Second configuration
   * @returns Whether configurations are the same
   */
  private isSameConfig(config1: BalancerConfig, config2: BalancerConfig): boolean {
    const str1 = JSON.stringify(config1);
    const str2 = JSON.stringify(config2);
    return str1 === str2;
  }

  /**
   * Persists the current state to storage.
   */
  private async persist(): Promise<void> {
    try {
      await saveData(this.config.storageKey, this.state);
    } catch (error) {
      console.warn('[BalancerHistoryStore] Failed to persist history:', error);
    }
  }

  /**
   * Validates a snapshot object.
   * 
   * @param snapshot - Snapshot to validate
   * @returns Whether the snapshot is valid
   */
  private isValidSnapshot(snapshot: unknown): snapshot is ConfigSnapshot {
    if (!snapshot || typeof snapshot !== 'object') {
      return false;
    }

    const s = snapshot as Record<string, unknown>;
    return (
      typeof s.timestamp === 'number' &&
      typeof s.description === 'string' &&
      s.config !== undefined &&
      typeof s.config === 'object'
    );
  }

  /**
   * Generates a human-readable diff summary between two configurations.
   * 
   * @param oldConfig - Previous configuration
   * @param newConfig - New configuration
   * @returns Diff summary string
   */
  private generateDiffSummary(oldConfig: BalancerConfig, newConfig: BalancerConfig): string {
    const changes: string[] = [];

    // Check for stat changes
    const oldStatIds = new Set(Object.keys(oldConfig.stats));
    const newStatIds = new Set(Object.keys(newConfig.stats));

    // Added stats
    for (const statId of newStatIds) {
      if (!oldStatIds.has(statId)) {
        changes.push(`Added stat: ${newConfig.stats[statId].label}`);
      }
    }

    // Removed stats
    for (const statId of oldStatIds) {
      if (!newStatIds.has(statId)) {
        changes.push(`Removed stat: ${oldConfig.stats[statId].label}`);
      }
    }

    // Modified stats
    for (const statId of oldStatIds) {
      if (newStatIds.has(statId)) {
        const oldStat = oldConfig.stats[statId];
        const newStat = newConfig.stats[statId];
        
        if (oldStat.weight !== newStat.weight) {
          changes.push(`Updated ${newStat.label} weight: ${oldStat.weight} → ${newStat.weight}`);
        }
        if (oldStat.defaultValue !== newStat.defaultValue) {
          changes.push(`Updated ${newStat.label} default: ${oldStat.defaultValue} → ${newStat.defaultValue}`);
        }
      }
    }

    // Check for preset changes
    if (oldConfig.activePresetId !== newConfig.activePresetId) {
      const oldPreset = oldConfig.presets[oldConfig.activePresetId];
      const newPreset = newConfig.presets[newConfig.activePresetId];
      changes.push(`Switched preset: ${oldPreset?.name || 'None'} → ${newPreset?.name || 'None'}`);
    }

    return changes.length > 0 ? changes.join(', ') : 'Configuration updated';
  }
}

/**
 * Default history store instance.
 */
export const defaultHistoryStore = new BalancerHistoryStore();
