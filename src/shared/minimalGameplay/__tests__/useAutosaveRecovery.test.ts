import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutosaveRecovery, createAutosaveSnapshot } from '../useAutosaveRecovery';

// Mock dependencies
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

vi.mock('@/shared/telemetry/telemetryProvider', () => ({
  traceMinimalGameplay: vi.fn(),
}));

const mockSaveData = vi.mocked(require('@/shared/persistence/PersistenceService').saveData);
const mockLoadData = vi.mocked(require('@/shared/persistence/PersistenceService').loadData);
const mockTraceMinimalGameplay = vi.mocked(require('@/shared/telemetry/telemetryProvider').traceMinimalGameplay);

describe('useAutosaveRecovery', () => {
  const mockGameState = {
    gold: 500,
    food: 25,
    maxFood: 50,
    currentDay: 7,
    currentTime: 604800,
    isPaused: false,
    speedMultiplier: 1,
    residents: [
      {
        id: 'resident-1',
        name: 'Aurora Calder',
        level: 2,
        stats: { strength: 6, endurance: 6, agility: 5, intelligence: 4, perception: 5 },
        fatigue: 0.3,
        isWorking: false,
        isInjured: false,
      },
    ],
    activeActivities: [],
  };

  const mockSnapshot = {
    metadata: {
      version: '1.0',
      createdAt: Date.now(),
      checksum: expect.any(String),
      summary: {
        gold: 500,
        food: 25,
        currentDay: 7,
        residentCount: 1,
      },
    },
    data: mockGameState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveData.mockResolvedValue(undefined);
    mockLoadData.mockResolvedValue(null);
    mockTraceMinimalGameplay.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useAutosaveRecovery());

      expect(result.current.isRecovering).toBe(false);
      expect(result.current.lastResult).toBe(null);
      expect(typeof result.current.recoverLastSnapshot).toBe('function');
      expect(typeof result.current.hasConflicts).toBe('function');
      expect(typeof result.current.getConflictDetails).toBe('function');
    });

    it('should accept custom options', () => {
      const options = {
        maxRetries: 5,
        conflictPolicy: 'first-wins' as const,
        enableLogging: true,
      };

      const { result } = renderHook(() => useAutosaveRecovery(options));

      expect(result.current.isRecovering).toBe(false);
    });
  });

  describe('recoverLastSnapshot', () => {
    it('should successfully recover a valid snapshot', async () => {
      mockLoadData.mockResolvedValue(mockSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery());

      const recoveryResult = await result.current.recoverLastSnapshot();

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.data).toEqual(mockGameState);
      expect(recoveryResult.retriesUsed).toBe(0);
      expect(result.current.lastResult).toEqual(recoveryResult);
    });

    it('should handle no snapshot found', async () => {
      mockLoadData.mockResolvedValue(null);

      const { result } = renderHook(() => useAutosaveRecovery());

      const recoveryResult = await result.current.recoverLastSnapshot();

      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.error).toBe('No autosave snapshot found');
      expect(recoveryResult.data).toBeUndefined();
    });

    it('should validate snapshot integrity', async () => {
      const corruptedSnapshot = {
        ...mockSnapshot,
        metadata: {
          ...mockSnapshot.metadata,
          checksum: 'invalid-checksum',
        },
      };

      mockLoadData.mockResolvedValue(corruptedSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery());

      const recoveryResult = await result.current.recoverLastSnapshot();

      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.error).toBe('Snapshot integrity check failed');
    });

    it('should retry on load failure', async () => {
      mockLoadData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery({ maxRetries: 2 }));

      const recoveryResult = await result.current.recoverLastSnapshot();

      expect(mockLoadData).toHaveBeenCalledTimes(3);
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.retriesUsed).toBe(2);
    });

    it('should fail after max retries', async () => {
      mockLoadData.mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useAutosaveRecovery({ maxRetries: 2 }));

      const recoveryResult = await result.current.recoverLastSnapshot();

      expect(mockLoadData).toHaveBeenCalledTimes(3);
      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.error).toContain('Persistent error');
    });

    it('should enable logging when configured', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockLoadData.mockResolvedValue(mockSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery({ enableLogging: true }));

      await result.current.recoverLastSnapshot();

      expect(consoleSpy).toHaveBeenCalledWith('[AutosaveRecovery]', 'Starting autosave recovery');
      expect(mockTraceMinimalGameplay).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should set recovering state during operation', async () => {
      let resolveLoad: (value: any) => void;
      const loadPromise = new Promise(resolve => {
        resolveLoad = resolve;
      });
      mockLoadData.mockReturnValue(loadPromise);

      const { result } = renderHook(() => useAutosaveRecovery());

      const recoveryPromise = result.current.recoverLastSnapshot();

      expect(result.current.isRecovering).toBe(true);

      resolveLoad!(mockSnapshot);
      await recoveryPromise;

      await waitFor(() => {
        expect(result.current.isRecovering).toBe(false);
      });
    });
  });

  describe('hasConflicts', () => {
    it('should return true when snapshot exists', async () => {
      mockLoadData.mockResolvedValue(mockSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery());

      const hasConflicts = await result.current.hasConflicts();

      expect(hasConflicts).toBe(true);
    });

    it('should return false when no snapshot exists', async () => {
      mockLoadData.mockResolvedValue(null);

      const { result } = renderHook(() => useAutosaveRecovery());

      const hasConflicts = await result.current.hasConflicts();

      expect(hasConflicts).toBe(false);
    });

    it('should handle load errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useAutosaveRecovery());

      const hasConflicts = await result.current.hasConflicts();

      expect(hasConflicts).toBe(false);
    });
  });

  describe('getConflictDetails', () => {
    it('should return conflict details for existing snapshot', async () => {
      mockLoadData.mockResolvedValue(mockSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery());

      const details = await result.current.getConflictDetails();

      expect(details.existing).toEqual(mockSnapshot);
      expect(details.incoming).toBeNull();
      expect(details.canResolve).toBe(true);
    });

    it('should handle corrupted snapshots', async () => {
      const corruptedSnapshot = {
        ...mockSnapshot,
        metadata: {
          ...mockSnapshot.metadata,
          checksum: 'invalid',
        },
      };

      mockLoadData.mockResolvedValue(corruptedSnapshot);

      const { result } = renderHook(() => useAutosaveRecovery());

      const details = await result.current.getConflictDetails();

      expect(details.canResolve).toBe(false);
    });

    it('should handle load errors', async () => {
      mockLoadData.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useAutosaveRecovery());

      const details = await result.current.getConflictDetails();

      expect(details.existing).toBeNull();
      expect(details.incoming).toBeNull();
      expect(details.canResolve).toBe(false);
    });
  });
});

describe('createAutosaveSnapshot', () => {
  const mockGameState = {
    gold: 1000,
    food: 30,
    currentDay: 10,
    residents: [
      { id: '1', name: 'Test Resident', level: 3, stats: {}, fatigue: 0.1, isWorking: false, isInjured: false },
    ],
    activeActivities: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveData.mockResolvedValue(undefined);
    mockTraceMinimalGameplay.mockImplementation(() => {});
  });

  it('should create and save a valid snapshot', async () => {
    const success = await createAutosaveSnapshot(mockGameState);

    expect(success).toBe(true);
    expect(mockSaveData).toHaveBeenCalledWith(
      'minimal_gameplay_autosave',
      expect.objectContaining({
        metadata: expect.objectContaining({
          version: '1.0',
          checksum: expect.any(String),
          summary: expect.objectContaining({
            gold: 1000,
            food: 30,
            currentDay: 10,
            residentCount: 1,
          }),
        }),
        data: mockGameState,
      })
    );
  });

  it('should enable logging when configured', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await createAutosaveSnapshot(mockGameState, { enableLogging: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[AutosaveRecovery]',
      'Created snapshot',
      expect.any(Object)
    );
    expect(mockTraceMinimalGameplay).toHaveBeenCalledWith(
      'autosave_snapshot_created',
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('should handle save errors gracefully', async () => {
    mockSaveData.mockRejectedValue(new Error('Save failed'));

    const success = await createAutosaveSnapshot(mockGameState);

    expect(success).toBe(false);
  });
});

describe('Utility Functions', () => {
  describe('generateChecksum', () => {
    // Import the private function for testing
    const { generateChecksum } = require('../useAutosaveRecovery');

    it('should generate consistent checksums', () => {
      const data = { test: 'value', number: 42 };
      const checksum1 = generateChecksum(data);
      const checksum2 = generateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(checksum1.length).toBeGreaterThan(0);
    });

    it('should generate different checksums for different data', () => {
      const data1 = { test: 'value1' };
      const data2 = { test: 'value2' };

      const checksum1 = generateChecksum(data1);
      const checksum2 = generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('validateSnapshot', () => {
    const { validateSnapshot } = require('../useAutosaveRecovery');

    it('should validate correct snapshots', () => {
      const data = { test: 'data' };
      const snapshot = {
        metadata: {
          version: '1.0',
          createdAt: Date.now(),
          checksum: generateChecksum(data),
          summary: { gold: 0, food: 0, currentDay: 0, residentCount: 0 },
        },
        data,
      };

      const isValid = validateSnapshot(snapshot);
      expect(isValid).toBe(true);
    });

    it('should reject corrupted snapshots', () => {
      const data = { test: 'data' };
      const snapshot = {
        metadata: {
          version: '1.0',
          createdAt: Date.now(),
          checksum: 'invalid-checksum',
          summary: { gold: 0, food: 0, currentDay: 0, residentCount: 0 },
        },
        data,
      };

      const isValid = validateSnapshot(snapshot);
      expect(isValid).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    const { resolveConflict } = require('../useAutosaveRecovery');

    const oldSnapshot = {
      metadata: {
        version: '1.0',
        createdAt: Date.now() - 1000,
        checksum: 'old-checksum',
        summary: { gold: 0, food: 0, currentDay: 0, residentCount: 0 },
      },
      data: { gold: 100 },
    };

    const newSnapshot = {
      metadata: {
        version: '1.0',
        createdAt: Date.now(),
        checksum: 'new-checksum',
        summary: { gold: 0, food: 0, currentDay: 0, residentCount: 0 },
      },
      data: { gold: 200 },
    };

    it('should prefer newer snapshot with last-wins policy', () => {
      const resolved = resolveConflict(oldSnapshot, newSnapshot, 'last-wins');

      expect(resolved).toBe(newSnapshot);
    });

    it('should prefer older snapshot with first-wins policy', () => {
      const resolved = resolveConflict(oldSnapshot, newSnapshot, 'first-wins');

      expect(resolved).toBe(oldSnapshot);
    });

    it('should use custom resolver when provided', () => {
      const customResolver = vi.fn().mockReturnValue({ gold: 300 });
      const resolved = resolveConflict(oldSnapshot, newSnapshot, 'last-wins', customResolver);

      expect(customResolver).toHaveBeenCalledWith(oldSnapshot.data, newSnapshot.data);
      expect(resolved.data).toEqual({ gold: 300 });
    });
  });
});
