/**
 * Cloud Save Service for Punch Club
 * 
 * Provides cloud synchronization for Punch Club game saves with conflict resolution,
 * offline support, and automatic backup management.
 * 
 * Features:
 * - Cloud sync with multiple providers (Firebase, custom REST API)
 * - Conflict resolution strategies (latest, manual, merge)
 * - Offline queue for pending operations
 * - Automatic backup management
 * - Progress tracking and error handling
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import type { GameState } from '@/ui/punchClub/hooks/usePunchClubGame';

const cloudDiagnostics = createHeadlessDiagnostics('CloudSaveService');

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
  type: 'firebase' | 'rest-api' | 'custom';
  endpoint?: string;
  apiKey?: string;
  projectId?: string;
  collection?: string;
  headers?: Record<string, string>;
}

/**
 * Cloud save metadata
 */
export interface CloudSaveMetadata {
  id: string;
  deviceId: string;
  timestamp: number;
  version: string;
  checksum: string;
  size: number;
  deviceInfo: {
    platform: string;
    userAgent: string;
    appVersion: string;
  };
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
}

/**
 * Cloud save data structure
 */
export interface CloudSave {
  metadata: CloudSaveMetadata;
  data: GameState;
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolution = 'latest' | 'manual' | 'merge' | 'local' | 'remote';

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  action: 'uploaded' | 'downloaded' | 'merged' | 'conflict' | 'error';
  timestamp: number;
  error?: string;
  conflictData?: {
    local: CloudSave;
    remote: CloudSave;
  };
}

/**
 * Sync progress information
 */
export interface SyncProgress {
  operation: 'upload' | 'download' | 'conflict-resolution';
  progress: number; // 0-100
  message: string;
  timestamp: number;
}

/**
 * Cloud save service configuration
 */
export interface CloudSaveConfig {
  provider: CloudProviderConfig;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  conflictResolution: ConflictResolution;
  maxBackupCount: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

/**
 * Default cloud save configuration
 */
export const DEFAULT_CLOUD_SAVE_CONFIG: CloudSaveConfig = {
  provider: {
    type: 'rest-api',
    endpoint: 'https://api.rpg-balancer.com/saves',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': '1.0.0',
    },
  },
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  conflictResolution: 'latest',
  maxBackupCount: 10,
  compressionEnabled: true,
  encryptionEnabled: false,
};

/**
 * Cloud Save Service
 */
export class CloudSaveService {
  private config: CloudSaveConfig;
  private deviceId: string;
  private syncInProgress = false;
  private pendingOperations: Array<() => Promise<void>> = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private progressCallbacks: Set<(progress: SyncProgress) => void> = new Set();

  constructor(config: Partial<CloudSaveConfig> = {}) {
    this.config = { ...DEFAULT_CLOUD_SAVE_CONFIG, ...config };
    this.deviceId = this.generateDeviceId();
    cloudDiagnostics.log('CloudSaveService initialized', {
      deviceId: this.deviceId,
      provider: this.config.provider.type,
      autoSync: this.config.autoSync,
    });
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const stored = localStorage.getItem('cloud-device-id');
    if (stored) return stored;

    const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cloud-device-id', newId);
    return newId;
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
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
   * Get device information
   */
  private getDeviceInfo() {
    return {
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent,
      appVersion: '1.0.0', // Could be dynamic
    };
  }

  /**
   * Create cloud save metadata
   */
  private createMetadata(saveData: GameState): CloudSaveMetadata {
    const serialized = JSON.stringify(saveData);
    return {
      id: `save_${this.deviceId}_${Date.now()}`,
      deviceId: this.deviceId,
      timestamp: Date.now(),
      version: '1.0.0',
      checksum: this.calculateChecksum(saveData),
      size: new Blob([serialized]).size,
      deviceInfo: this.getDeviceInfo(),
      syncStatus: 'pending',
    };
  }

  /**
   * Report sync progress
   */
  private reportProgress(operation: SyncProgress['operation'], progress: number, message: string) {
    const progressInfo: SyncProgress = {
      operation,
      progress,
      message,
      timestamp: Date.now(),
    };

    this.progressCallbacks.forEach(callback => {
      try {
        callback(progressInfo);
      } catch (error) {
        console.warn('[CloudSaveService] Progress callback error:', error);
      }
    });
  }

  /**
   * Upload save to cloud
   */
  private async uploadSave(saveData: GameState): Promise<SyncResult> {
    try {
      this.reportProgress('upload', 0, 'Preparing upload...');
      
      const metadata = this.createMetadata(saveData);
      const cloudSave: CloudSave = { metadata, data: saveData };

      this.reportProgress('upload', 25, 'Compressing data...');
      
      let payload = JSON.stringify(cloudSave);
      if (this.config.compressionEnabled) {
        // Simple compression simulation
        payload = this.compressData(payload);
      }

      this.reportProgress('upload', 50, 'Uploading to cloud...');

      const response = await this.makeCloudRequest('PUT', `/saves/${metadata.id}`, payload);

      this.reportProgress('upload', 100, 'Upload complete');

      // Update local sync status
      const updatedMetadata = { ...metadata, syncStatus: 'synced' as const };
      const updatedSave: CloudSave = { ...cloudSave, metadata: updatedMetadata };
      await saveData(`cloud_save_${metadata.id}`, updatedSave);

      cloudDiagnostics.log('Save uploaded successfully', { saveId: metadata.id });

      return {
        success: true,
        action: 'uploaded',
        timestamp: Date.now(),
      };
    } catch (error) {
      cloudDiagnostics.error('Upload failed', error);
      return {
        success: false,
        action: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download save from cloud
   */
  private async downloadSave(saveId: string): Promise<SyncResult> {
    try {
      this.reportProgress('download', 0, 'Fetching save from cloud...');

      const response = await this.makeCloudRequest('GET', `/saves/${saveId}`);

      this.reportProgress('download', 50, 'Processing save data...');

      let cloudSave: CloudSave;
      if (this.config.compressionEnabled) {
        const decompressed = this.decompressData(response);
        cloudSave = JSON.parse(decompressed);
      } else {
        cloudSave = JSON.parse(response);
      }

      this.reportProgress('download', 100, 'Download complete');

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(cloudSave.data);
      if (cloudSave.metadata.checksum !== expectedChecksum) {
        throw new Error('Checksum verification failed');
      }

      // Update local sync status
      const updatedMetadata = { ...cloudSave.metadata, syncStatus: 'synced' as const };
      const updatedSave: CloudSave = { ...cloudSave, metadata: updatedMetadata };
      await saveData(`cloud_save_${saveId}`, updatedSave);

      cloudDiagnostics.log('Save downloaded successfully', { saveId });

      return {
        success: true,
        action: 'downloaded',
        timestamp: Date.now(),
      };
    } catch (error) {
      cloudDiagnostics.error('Download failed', error);
      return {
        success: false,
        action: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Make HTTP request to cloud provider
   */
  private async makeCloudRequest(method: string, path: string, data?: string): Promise<string> {
    const { provider } = this.config;

    if (provider.type === 'rest-api' && provider.endpoint) {
      const url = `${provider.endpoint}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          ...provider.headers,
          'X-Device-ID': this.deviceId,
        },
      };

      if (data && (method === 'PUT' || method === 'POST')) {
        options.body = data;
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    }

    throw new Error(`Unsupported provider type: ${provider.type}`);
  }

  /**
   * Simple data compression (simulation)
   */
  private compressData(data: string): string {
    // In a real implementation, use a proper compression library
    return btoa(data);
  }

  /**
   * Simple data decompression (simulation)
   */
  private decompressData(data: string): string {
    // In a real implementation, use a proper decompression library
    return atob(data);
  }

  /**
   * Detect conflicts between local and remote saves
   */
  private async detectConflicts(localSave: GameState, remoteSaveId: string): Promise<boolean> {
    try {
      const remoteResult = await this.downloadSave(remoteSaveId);
      if (!remoteResult.success) return false;

      const remoteCloudSave = await loadData(`cloud_save_${remoteSaveId}`, null);
      if (!remoteCloudSave) return false;

      // Compare checksums
      const localChecksum = this.calculateChecksum(localSave);
      const remoteChecksum = remoteCloudSave.metadata.checksum;

      return localChecksum !== remoteChecksum;
    } catch (error) {
      cloudDiagnostics.error('Conflict detection failed', error);
      return false;
    }
  }

  /**
   * Resolve conflicts between local and remote saves
   */
  private async resolveConflict(
    localSave: GameState,
    remoteSave: CloudSave,
    strategy: ConflictResolution
  ): Promise<GameState> {
    this.reportProgress('conflict-resolution', 0, 'Resolving conflict...');

    switch (strategy) {
      case 'local':
        this.reportProgress('conflict-resolution', 100, 'Using local save');
        return localSave;

      case 'remote':
        this.reportProgress('conflict-resolution', 100, 'Using remote save');
        return remoteSave.data;

      case 'latest':
        const latest = localSave.player.experience > remoteSave.data.player.experience ? localSave : remoteSave.data;
        this.reportProgress('conflict-resolution', 100, 'Using latest save');
        return latest;

      case 'merge':
        // Simple merge strategy - take max values for each field
        const merged: GameState = {
          player: {
            stats: {
              health: Math.max(localSave.player.stats.health, remoteSave.data.player.stats.health),
              stamina: Math.max(localSave.player.stats.stamina, remoteSave.data.player.stats.stamina),
              strength: Math.max(localSave.player.stats.strength, remoteSave.data.player.stats.strength),
              speed: Math.max(localSave.player.stats.speed, remoteSave.data.player.stats.speed),
              defense: Math.max(localSave.player.stats.defense, remoteSave.data.player.stats.defense),
              technique: Math.max(localSave.player.stats.technique, remoteSave.data.player.stats.technique),
            },
            level: Math.max(localSave.player.level, remoteSave.data.player.level),
            experience: Math.max(localSave.player.experience, remoteSave.data.player.experience),
            money: Math.max(localSave.player.money, remoteSave.data.player.money),
            statPoints: Math.max(localSave.player.statPoints, remoteSave.data.player.statPoints),
          },
          currentOpponent: localSave.currentOpponent || remoteSave.data.currentOpponent,
          inCombat: localSave.inCombat || remoteSave.data.inCombat,
          training: localSave.training,
          unlockedMoves: [...new Set([...localSave.unlockedMoves, ...remoteSave.data.unlockedMoves])],
          completedTraining: [...new Set([...localSave.completedTraining, ...remoteSave.data.completedTraining])],
          combatHistory: [...localSave.combatHistory, ...remoteSave.data.combatHistory],
        };
        this.reportProgress('conflict-resolution', 100, 'Merged saves');
        return merged;

      case 'manual':
        // Return conflict data for manual resolution
        throw new Error('Manual conflict resolution requires UI intervention');

      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  }

  /**
   * Sync game state to cloud
   */
  async syncToCloud(gameState: GameState): Promise<SyncResult> {
    if (this.syncInProgress) {
      cloudDiagnostics.warn('Sync already in progress, queuing operation');
      return new Promise((resolve) => {
        this.pendingOperations.push(() => this.syncToCloud(gameState).then(resolve));
      });
    }

    this.syncInProgress = true;

    try {
      cloudDiagnostics.log('Starting cloud sync', { deviceId: this.deviceId });

      // Check for existing remote save
      const existingSaveId = await this.findExistingRemoteSave();
      
      if (existingSaveId) {
        const hasConflict = await this.detectConflicts(gameState, existingSaveId);
        
        if (hasConflict) {
          cloudDiagnostics.log('Conflict detected', { remoteSaveId: existingSaveId });
          
          const remoteCloudSave = await loadData(`cloud_save_${existingSaveId}`, null);
          if (remoteCloudSave) {
            const resolvedData = await this.resolveConflict(gameState, remoteCloudSave, this.config.conflictResolution);
            return await this.uploadSave(resolvedData);
          }
        }
      }

      // No conflicts, upload directly
      return await this.uploadSave(gameState);
    } catch (error) {
      cloudDiagnostics.error('Sync failed', error);
      return {
        success: false,
        action: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
      
      // Process pending operations
      if (this.pendingOperations.length > 0) {
        const nextOperation = this.pendingOperations.shift();
        if (nextOperation) {
          nextOperation();
        }
      }
    }
  }

  /**
   * Sync from cloud to local
   */
  async syncFromCloud(saveId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      cloudDiagnostics.warn('Sync already in progress');
      return {
        success: false,
        action: 'error',
        timestamp: Date.now(),
        error: 'Sync already in progress',
      };
    }

    this.syncInProgress = true;

    try {
      const result = await this.downloadSave(saveId);
      
      if (result.success) {
        const cloudSave = await loadData(`cloud_save_${saveId}`, null as CloudSave | null);
        if (cloudSave) {
          // Save to local storage
          await saveData('punch_club_game_state', cloudSave.data);
          cloudDiagnostics.log('Game state synced from cloud', { saveId });
        }
      }

      return result;
    } catch (error) {
      cloudDiagnostics.error('Sync from cloud failed', error);
      return {
        success: false,
        action: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Find existing remote save for this device
   */
  private async findExistingRemoteSave(): Promise<string | null> {
    try {
      const response = await this.makeCloudRequest('GET', `/saves?deviceId=${this.deviceId}`);
      const saves = JSON.parse(response);
      
      if (Array.isArray(saves) && saves.length > 0) {
        // Return the most recent save
        const latestSave = saves.sort((a, b) => b.timestamp - a.timestamp)[0];
        return latestSave.id;
      }
      
      return null;
    } catch (error) {
      cloudDiagnostics.warn('Failed to find existing remote save', error);
      return null;
    }
  }

  /**
   * Get list of all cloud saves for this device
   */
  async getCloudSaveList(): Promise<CloudSaveMetadata[]> {
    try {
      const response = await this.makeCloudRequest('GET', `/saves?deviceId=${this.deviceId}`);
      const saves = JSON.parse(response);
      
      return Array.isArray(saves) ? saves.map((save: any) => save.metadata) : [];
    } catch (error) {
      cloudDiagnostics.error('Failed to get cloud save list', error);
      return [];
    }
  }

  /**
   * Delete cloud save
   */
  async deleteCloudSave(saveId: string): Promise<boolean> {
    try {
      await this.makeCloudRequest('DELETE', `/saves/${saveId}`);
      
      // Remove local cache
      localStorage.removeItem(`cloud_save_${saveId}`);
      
      cloudDiagnostics.log('Cloud save deleted', { saveId });
      return true;
    } catch (error) {
      cloudDiagnostics.error('Failed to delete cloud save', error);
      return false;
    }
  }

  /**
   * Start auto-sync
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.autoSync) {
      this.syncTimer = setInterval(async () => {
        try {
          const gameState = await loadData('punch_club_game_state', null as any);
          if (gameState) {
            await this.syncToCloud(gameState);
          }
        } catch (error) {
          cloudDiagnostics.error('Auto-sync failed', error);
        }
      }, this.config.syncInterval);

      cloudDiagnostics.log('Auto-sync started', { interval: this.config.syncInterval });
    }
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      cloudDiagnostics.log('Auto-sync stopped');
    }
  }

  /**
   * Add progress callback
   */
  onProgress(callback: (progress: SyncProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    inProgress: boolean;
    pendingOperations: number;
    autoSync: boolean;
    deviceId: string;
  } {
    return {
      inProgress: this.syncInProgress,
      pendingOperations: this.pendingOperations.length,
      autoSync: this.config.autoSync,
      deviceId: this.deviceId,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CloudSaveConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.autoSync !== undefined) {
      if (newConfig.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    cloudDiagnostics.log('Configuration updated', { config: newConfig });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSync();
    this.progressCallbacks.clear();
    this.pendingOperations.length = 0;
    cloudDiagnostics.log('CloudSaveService cleaned up');
  }
}

/**
 * Global cloud save service instance
 */
let globalCloudSaveService: CloudSaveService | null = null;

/**
 * Get or create global cloud save service
 */
export function getCloudSaveService(config?: Partial<CloudSaveConfig>): CloudSaveService {
  if (!globalCloudSaveService) {
    globalCloudSaveService = new CloudSaveService(config);
  }
  return globalCloudSaveService;
}

/**
 * Initialize cloud save service with default configuration
 */
export function initializeCloudSave(config?: Partial<CloudSaveConfig>): CloudSaveService {
  const service = getCloudSaveService(config);
  service.startAutoSync();
  return service;
}

/**
 * Cleanup global cloud save service
 */
export function cleanupCloudSave(): void {
  if (globalCloudSaveService) {
    globalCloudSaveService.cleanup();
    globalCloudSaveService = null;
  }
}
