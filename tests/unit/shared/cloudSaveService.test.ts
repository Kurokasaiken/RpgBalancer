/**
 * Cloud Save Service Tests
 * 
 * Comprehensive test suite for cloud synchronization functionality
 * including upload, download, conflict resolution, and offline support.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudSaveService, getCloudSaveService, initializeCloudSave, cleanupCloudSave } from '@/shared/cloud/cloudSaveService';
import type { GameState } from '@/ui/punchClub/hooks/usePunchClubGame';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock fetch for HTTP requests
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(navigator, 'platform', {
  value: 'test-platform',
  writable: true,
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'test-user-agent',
  writable: true,
});

describe('CloudSaveService', () => {
  let cloudSaveService: CloudSaveService;
  let mockSaveData: vi.MockedFunction<typeof saveData>;
  let mockLoadData: vi.MockedFunction<typeof loadData>;
  let mockFetch: vi.MockedFunction<typeof fetch>;

  // Sample game state for testing
  const sampleGameState: GameState = {
    player: {
      stats: {
        health: 100,
        stamina: 50,
        strength: 25,
        speed: 30,
        defense: 20,
        technique: 15,
      },
      level: 5,
      experience: 1250,
      money: 500,
      statPoints: 3,
    },
    currentOpponent: {
      stats: {
        health: 80,
        stamina: 40,
        strength: 20,
        speed: 25,
        defense: 18,
        technique: 12,
      },
      level: 4,
    },
    inCombat: false,
    training: {
      isTraining: false,
      currentExercise: null,
      remainingTime: 0,
    },
    unlockedMoves: ['punch', 'kick'],
    completedTraining: ['cardio', 'strength'],
    combatHistory: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSaveData = vi.mocked(saveData);
    mockLoadData = vi.mocked(loadData);
    mockFetch = vi.mocked(fetch);

    // Setup default localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Initialize service with test configuration
    cloudSaveService = new CloudSaveService({
      provider: {
        type: 'rest-api',
        endpoint: 'https://test-api.com',
        headers: { 'X-Test': 'true' },
      },
      autoSync: false, // Disable auto-sync for tests
      syncInterval: 1000,
      maxRetries: 2,
      retryDelay: 100,
      conflictResolution: 'latest',
      maxBackupCount: 5,
      compressionEnabled: false, // Disable for easier testing
      encryptionEnabled: false,
    });
  });

  afterEach(() => {
    cloudSaveService.cleanup();
    cleanupCloudSave();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new CloudSaveService();
      const status = service.getSyncStatus();
      
      expect(status.deviceId).toBeDefined();
      expect(status.deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
      expect(status.autoSync).toBe(true);
      expect(status.inProgress).toBe(false);
      expect(status.pendingOperations).toBe(0);
    });

    it('should use custom configuration', () => {
      const customConfig = {
        autoSync: false,
        syncInterval: 5000,
        conflictResolution: 'merge' as const,
      };
      
      const service = new CloudSaveService(customConfig);
      const status = service.getSyncStatus();
      
      expect(status.autoSync).toBe(false);
    });

    it('should generate and store device ID', () => {
      const service1 = new CloudSaveService();
      const service2 = new CloudSaveService();
      
      // Different instances should have different device IDs
      expect(service1.getSyncStatus().deviceId).not.toBe(service2.getSyncStatus().deviceId);
    });
  });

  describe('Device ID Management', () => {
    it('should reuse existing device ID from localStorage', () => {
      const existingDeviceId = 'existing_device_id_123';
      vi.mocked(localStorage.getItem).mockReturnValue(existingDeviceId);
      
      const service = new CloudSaveService();
      expect(service.getSyncStatus().deviceId).toBe(existingDeviceId);
    });

    it('should generate new device ID if none exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      
      const service = new CloudSaveService();
      const deviceId = service.getSyncStatus().deviceId;
      
      expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
      expect(localStorage.setItem).toHaveBeenCalledWith('cloud-device-id', deviceId);
    });
  });

  describe('Checksum Calculation', () => {
    it('should generate consistent checksums for same data', () => {
      const checksum1 = (cloudSaveService as any).calculateChecksum(sampleGameState);
      const checksum2 = (cloudSaveService as any).calculateChecksum(sampleGameState);
      
      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different data', () => {
      const modifiedState = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          level: 10,
        },
      };
      
      const checksum1 = (cloudSaveService as any).calculateChecksum(sampleGameState);
      const checksum2 = (cloudSaveService as any).calculateChecksum(modifiedState);
      
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('Cloud Upload', () => {
    it('should successfully upload save to cloud', async () => {
      // Mock successful HTTP response
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Upload successful'),
      } as Response);

      mockSaveData.mockResolvedValue();

      const result = await cloudSaveService.syncToCloud(sampleGameState);

      expect(result.success).toBe(true);
      expect(result.action).toBe('uploaded');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/saves/save_device_',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Device-ID': expect.any(String),
            'X-Test': 'true',
          }),
          body: expect.any(String),
        })
      );
    });

    it('should handle upload failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await cloudSaveService.syncToCloud(sampleGameState);

      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should include metadata in upload payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Success'),
      } as Response);

      mockSaveData.mockResolvedValue();

      await cloudSaveService.syncToCloud(sampleGameState);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]!.body as string);

      expect(requestBody).toHaveProperty('metadata');
      expect(requestBody.metadata).toHaveProperty('deviceId');
      expect(requestBody.metadata).toHaveProperty('timestamp');
      expect(requestBody.metadata).toHaveProperty('checksum');
      expect(requestBody.metadata).toHaveProperty('deviceInfo');
      expect(requestBody).toHaveProperty('data');
    });
  });

  describe('Cloud Download', () => {
    it('should successfully download save from cloud', async () => {
      const cloudSaveData = {
        metadata: {
          id: 'test-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: (cloudSaveService as any).calculateChecksum(sampleGameState),
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: sampleGameState,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(cloudSaveData)),
      } as Response);

      mockLoadData.mockResolvedValue(cloudSaveData);
      mockSaveData.mockResolvedValue();

      const result = await cloudSaveService.syncFromCloud('test-save-id');

      expect(result.success).toBe(true);
      expect(result.action).toBe('downloaded');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/saves/test-save-id',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Device-ID': expect.any(String),
          }),
        })
      );
    });

    it('should verify checksum during download', async () => {
      const corruptedData = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          level: 999, // Corrupted data
        },
      };

      const cloudSaveData = {
        metadata: {
          id: 'test-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: (cloudSaveService as any).calculateChecksum(sampleGameState), // Original checksum
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: corruptedData,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(cloudSaveData)),
      } as Response);

      const result = await cloudSaveService.syncFromCloud('test-save-id');

      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toBe('Checksum verification failed');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts between local and remote saves', async () => {
      const remoteSaveData = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'different-checksum',
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: {
          ...sampleGameState,
          player: {
            ...sampleGameState.player,
            level: 10, // Different data
          },
        },
      };

      // Mock successful download
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(remoteSaveData)),
      } as Response);

      mockLoadData.mockResolvedValue(remoteSaveData);

      const hasConflict = await (cloudSaveService as any).detectConflicts(
        sampleGameState,
        'remote-save-id'
      );

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflicts when data is identical', async () => {
      const remoteSaveData = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: (cloudSaveService as any).calculateChecksum(sampleGameState),
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: sampleGameState,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(remoteSaveData)),
      } as Response);

      mockLoadData.mockResolvedValue(remoteSaveData);

      const hasConflict = await (cloudSaveService as any).detectConflicts(
        sampleGameState,
        'remote-save-id'
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts using latest strategy', async () => {
      const localState = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          experience: 1000,
        },
      };

      const remoteSave = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'remote-checksum',
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: {
          ...sampleGameState,
          player: {
            ...sampleGameState.player,
            experience: 2000, // Higher experience
          },
        },
      };

      const resolved = await (cloudSaveService as any).resolveConflict(
        localState,
        remoteSave,
        'latest'
      );

      expect(resolved.player.experience).toBe(2000); // Should pick the latest (higher experience)
    });

    it('should resolve conflicts using merge strategy', async () => {
      const localState = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          experience: 1000,
          money: 500,
        },
        unlockedMoves: ['punch'],
      };

      const remoteSave = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'remote-checksum',
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: {
          ...sampleGameState,
          player: {
            ...sampleGameState.player,
            experience: 2000,
            money: 300,
          },
          unlockedMoves: ['kick'],
        },
      };

      const resolved = await (cloudSaveService as any).resolveConflict(
        localState,
        remoteSave,
        'merge'
      );

      // Should take max values for each field
      expect(resolved.player.experience).toBe(2000); // Max of 1000 and 2000
      expect(resolved.player.money).toBe(500); // Max of 500 and 300
      expect(resolved.unlockedMoves).toEqual(['punch', 'kick']); // Union of both arrays
    });

    it('should resolve conflicts using local strategy', async () => {
      const localState = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          experience: 1000,
        },
      };

      const remoteSave = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'remote-checksum',
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: {
          ...sampleGameState,
          player: {
            ...sampleGameState.player,
            experience: 2000,
          },
        },
      };

      const resolved = await (cloudSaveService as any).resolveConflict(
        localState,
        remoteSave,
        'local'
      );

      expect(resolved.player.experience).toBe(1000); // Should use local
    });

    it('should resolve conflicts using remote strategy', async () => {
      const localState = {
        ...sampleGameState,
        player: {
          ...sampleGameState.player,
          experience: 1000,
        },
      };

      const remoteSave = {
        metadata: {
          id: 'remote-save-id',
          deviceId: 'test-device',
          timestamp: Date.now(),
          version: '1.0.0',
          checksum: 'remote-checksum',
          size: 1000,
          deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
          syncStatus: 'synced' as const,
        },
        data: {
          ...sampleGameState,
          player: {
            ...sampleGameState.player,
            experience: 2000,
          },
        },
      };

      const resolved = await (cloudSaveService as any).resolveConflict(
        localState,
        remoteSave,
        'remote'
      );

      expect(resolved.player.experience).toBe(2000); // Should use remote
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during operations', async () => {
      const progressCallback = vi.fn();
      const unsubscribe = cloudSaveService.onProgress(progressCallback);

      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve('Success'),
            } as Response);
          }, 100);
        });
      });

      mockSaveData.mockResolvedValue();

      await cloudSaveService.syncToCloud(sampleGameState);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'upload',
          progress: expect.any(Number),
          message: expect.any(String),
          timestamp: expect.any(Number),
        })
      );

      unsubscribe();
    });

    it('should allow unsubscribing from progress updates', async () => {
      const progressCallback = vi.fn();
      const unsubscribe = cloudSaveService.onProgress(progressCallback);

      unsubscribe();

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Success'),
      } as Response);

      mockSaveData.mockResolvedValue();

      await cloudSaveService.syncToCloud(sampleGameState);

      expect(progressCallback).not.toHaveBeenCalled();
    });
  });

  describe('Save List Management', () => {
    it('should retrieve cloud save list', async () => {
      const mockSaves = [
        {
          metadata: {
            id: 'save-1',
            deviceId: 'test-device',
            timestamp: Date.now(),
            version: '1.0.0',
            checksum: 'checksum1',
            size: 1000,
            deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
            syncStatus: 'synced' as const,
          },
        },
        {
          metadata: {
            id: 'save-2',
            deviceId: 'test-device',
            timestamp: Date.now(),
            version: '1.0.0',
            checksum: 'checksum2',
            size: 1500,
            deviceInfo: { platform: 'test', userAgent: 'test', appVersion: '1.0.0' },
            syncStatus: 'synced' as const,
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockSaves)),
      } as Response);

      const saveList = await cloudSaveService.getCloudSaveList();

      expect(saveList).toHaveLength(2);
      expect(saveList[0].id).toBe('save-1');
      expect(saveList[1].id).toBe('save-2');
    });

    it('should handle empty save list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('[]'),
      } as Response);

      const saveList = await cloudSaveService.getCloudSaveList();

      expect(saveList).toHaveLength(0);
    });
  });

  describe('Save Deletion', () => {
    it('should delete cloud save successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Deleted'),
      } as Response);

      const result = await cloudSaveService.deleteCloudSave('test-save-id');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/saves/test-save-id',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deletion failure', async () => {
      mockFetch.mockRejectedValue(new Error('Delete failed'));

      const result = await cloudSaveService.deleteCloudSave('test-save-id');

      expect(result).toBe(false);
    });
  });

  describe('Auto Sync', () => {
    it('should start auto sync when enabled', () => {
      const service = new CloudSaveService({ autoSync: true, syncInterval: 100 });
      
      const status = service.getSyncStatus();
      expect(status.autoSync).toBe(true);
    });

    it('should stop auto sync when disabled', () => {
      const service = new CloudSaveService({ autoSync: false });
      
      const status = service.getSyncStatus();
      expect(status.autoSync).toBe(false);
    });

    it('should update auto sync configuration', () => {
      cloudSaveService.updateConfig({ autoSync: false });
      
      const status = cloudSaveService.getSyncStatus();
      expect(status.autoSync).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        autoSync: false,
        syncInterval: 5000,
        conflictResolution: 'merge' as const,
      };

      cloudSaveService.updateConfig(newConfig);

      const status = cloudSaveService.getSyncStatus();
      expect(status.autoSync).toBe(false);
    });
  });

  describe('Global Instance Management', () => {
    it('should return same global instance', () => {
      const service1 = getCloudSaveService();
      const service2 = getCloudSaveService();

      expect(service1).toBe(service2);
    });

    it('should initialize global service with auto sync', () => {
      const service = initializeCloudSave({ autoSync: false });
      
      const status = service.getSyncStatus();
      expect(status.autoSync).toBe(false);
    });

    it('should cleanup global service', () => {
      const service = getCloudSaveService();
      expect(service).toBeDefined();

      cleanupCloudSave();

      const serviceAfterCleanup = getCloudSaveService();
      expect(serviceAfterCleanup).not.toBe(service); // Should create new instance
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network unavailable'));

      const result = await cloudSaveService.syncToCloud(sampleGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network unavailable');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await cloudSaveService.syncToCloud(sampleGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('invalid json'),
      } as Response);

      const result = await cloudSaveService.syncFromCloud('test-save-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });
  });

  describe('Sync Status', () => {
    it('should report correct sync status', () => {
      const status = cloudSaveService.getSyncStatus();

      expect(status).toHaveProperty('inProgress');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('autoSync');
      expect(status).toHaveProperty('deviceId');
      expect(typeof status.inProgress).toBe('boolean');
      expect(typeof status.pendingOperations).toBe('number');
      expect(typeof status.autoSync).toBe('boolean');
      expect(typeof status.deviceId).toBe('string');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const progressCallback = vi.fn();
      cloudSaveService.onProgress(progressCallback);

      cloudSaveService.cleanup();

      // After cleanup, progress callbacks should be cleared
      const status = cloudSaveService.getSyncStatus();
      expect(status.autoSync).toBe(false);
    });
  });
});
