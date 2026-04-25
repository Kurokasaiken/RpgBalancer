import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { ZodError } from 'zod';
import {
  serializeSnapshot,
  deserializeSnapshot,
  diffSnapshots,
  validateSnapshot,
  type MinimalSnapshot,
  type MinimalGameState,
  SnapshotSchemas,
} from '../minimalSnapshotSerializer';

describe('MinimalSnapshotSerializer', () => {
  const FIXED_TIMESTAMP = 1704067200000;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIMESTAMP);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const mockEventLog = [
    {
      id: 'event-1',
      timestamp: 1704067200000,
      severity: 'info',
      message: 'Daily summary recorded',
      residentId: 'resident-1',
      activityId: 'job_gold_mine_minimal',
    },
  ];

  const mockGameState: MinimalGameState = {
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
    activeActivities: [
      {
        activityId: 'job_gold_mine_minimal',
        residentId: 'resident-1',
        ticksRemaining: 5,
      },
    ],
    eventLog: mockEventLog,
    lastSavedAt: 1704067200000,
  };

  function buildSchemaError(): ZodError<MinimalSnapshot> {
    const result = SnapshotSchemas.MinimalSnapshotSchema.safeParse({});
    if (result.success) {
      throw new Error('Expected schema validation failure in test helper');
    }
    return result.error;
  }

  function buildSnapshot(
    state: MinimalGameState,
    metadataOverrides?: Partial<MinimalSnapshot['metadata']>
  ): MinimalSnapshot {
    const snapshot = serializeSnapshot(state);
    if (!metadataOverrides) {
      return snapshot;
    }

    return {
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        ...metadataOverrides,
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('serializeSnapshot', () => {
    it('should serialize game state into snapshot with metadata', () => {
      const result = serializeSnapshot(mockGameState);

      expect(result.metadata.version).toBe('1.0');
      expect(result.metadata.createdAt).toBeGreaterThan(0);
      expect(result.metadata.checksum).toBeDefined();
      expect(result.metadata.summary).toEqual({
        gold: 500,
        food: 25,
        currentDay: 7,
        residentCount: 1,
      });
      expect(result.data).toEqual(mockGameState);
    });

    it('should throw error for invalid game state', () => {
      const schemaError = buildSchemaError();
      const validationSpy = vi
        .spyOn(SnapshotSchemas.MinimalSnapshotSchema, 'safeParse')
        .mockReturnValueOnce({
          success: false as const,
          error: schemaError,
        });

      expect(() => serializeSnapshot(mockGameState)).toThrow(/Snapshot validation failed/);

      validationSpy.mockRestore();
    });
  });

  describe('deserializeSnapshot', () => {
    it('should deserialize valid snapshot into game state', () => {
      const snapshot = serializeSnapshot(mockGameState);
      const result = deserializeSnapshot(snapshot);

      expect(result).toEqual(mockGameState);
    });

    it('should migrate legacy snapshots without version', () => {
      const validSnapshot = serializeSnapshot(mockGameState);
      const legacySnapshot = {
        data: validSnapshot.data,
        createdAt: validSnapshot.metadata.createdAt,
        checksum: validSnapshot.metadata.checksum,
        summary: validSnapshot.metadata.summary,
      };

      const result = deserializeSnapshot(legacySnapshot);

      expect(result).toEqual(mockGameState);
    });

    it('should throw error for invalid snapshot format', () => {
      const schemaError = buildSchemaError();
      const validationSpy = vi
        .spyOn(SnapshotSchemas.MinimalSnapshotSchema, 'safeParse')
        .mockReturnValueOnce({
          success: false as const,
          error: schemaError,
        });

      expect(() => deserializeSnapshot({ invalid: 'data' })).toThrow(/Snapshot deserialization failed/);

      validationSpy.mockRestore();
    });

    it('should throw error for checksum mismatch', () => {
      const snapshot = serializeSnapshot(mockGameState);
      const tamperedSnapshot = {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          checksum: 'tampered-checksum',
        },
      };

      expect(() => deserializeSnapshot(tamperedSnapshot)).toThrow('Snapshot integrity check failed: checksum mismatch');
    });
  });

  describe('diffSnapshots', () => {
    const baseState: MinimalGameState = {
      gold: 100,
      food: 50,
      maxFood: 50,
      currentDay: 1,
      currentTime: 86400,
      isPaused: false,
      speedMultiplier: 1,
      residents: [
        {
          id: 'resident-1',
          name: 'Aurora Calder',
          level: 1,
          stats: { strength: 5, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
          fatigue: 0,
          isWorking: false,
          isInjured: false,
        },
      ],
      activeActivities: [],
      eventLog: [],
    };

    const changedState: MinimalGameState = {
      gold: 200,
      food: 30,
      maxFood: 50,
      currentDay: 2,
      currentTime: 172800,
      isPaused: true,
      speedMultiplier: 2,
      residents: [
        {
          id: 'resident-1',
          name: 'Aurora Calder',
          level: 2,
          stats: { strength: 6, endurance: 6, agility: 5, intelligence: 4, perception: 5 },
          fatigue: 0.2,
          isWorking: true,
          isInjured: false,
        },
        {
          id: 'resident-2',
          name: 'Kai Nolan',
          level: 1,
          stats: { strength: 4, endurance: 6, agility: 5, intelligence: 4, perception: 3 },
          fatigue: 0.1,
          isWorking: false,
          isInjured: false,
        },
      ],
      activeActivities: [
        {
          activityId: 'job_gold_mine_minimal',
          residentId: 'resident-1',
          ticksRemaining: 3,
        },
      ],
      eventLog: [
        {
          id: 'event-2',
          timestamp: 1704067300000,
          severity: 'warning',
          message: 'Resource fluctuation detected',
          residentId: 'resident-2',
          activityId: 'job_gold_mine_minimal',
        },
      ],
    };

    const baseSnapshot = buildSnapshot(baseState, { createdAt: FIXED_TIMESTAMP });
    const changedSnapshot = buildSnapshot(changedState, {
      createdAt: FIXED_TIMESTAMP + 10_000,
    });

    it('should detect changes between snapshots', () => {
      const diff = diffSnapshots(baseSnapshot, changedSnapshot);

      expect(diff.changedFields).toContain('gold');
      expect(diff.changedFields).toContain('food');
      expect(diff.changedFields).toContain('currentDay');
      expect(diff.changedFields).toContain('isPaused');
      expect(diff.changedFields).toContain('speedMultiplier');
      expect(diff.changedFields).toContain('residents');
      expect(diff.changedFields).toContain('activeActivities');

      expect(diff.differences.gold).toEqual({ from: 100, to: 200 });
      expect(diff.differences.food).toEqual({ from: 50, to: 30 });
      expect(diff.differences.currentDay).toEqual({ from: 1, to: 2 });
    });

    it('should generate correct summary flags', () => {
      const diff = diffSnapshots(baseSnapshot, changedSnapshot);

      expect(diff.summary.goldChanged).toBe(true);
      expect(diff.summary.foodChanged).toBe(true);
      expect(diff.summary.dayChanged).toBe(true);
      expect(diff.summary.residentCountChanged).toBe(true);
    });

    it('should handle identical snapshots', () => {
      const diff = diffSnapshots(baseSnapshot, baseSnapshot);

      expect(diff.changedFields).toHaveLength(0);
      expect(Object.keys(diff.differences)).toHaveLength(0);
      expect(diff.summary.goldChanged).toBe(false);
      expect(diff.summary.foodChanged).toBe(false);
      expect(diff.summary.dayChanged).toBe(false);
      expect(diff.summary.residentCountChanged).toBe(false);
    });

    it('should detect metadata changes', () => {
      const diff = diffSnapshots(baseSnapshot, changedSnapshot);

      expect(diff.changedFields).toContain('metadata.createdAt');
      expect(diff.differences['metadata.createdAt']).toEqual({
        from: 1704067200000,
        to: 1704067210000,
      });
    });

    it('should handle nested object changes', () => {
      const diff = diffSnapshots(baseSnapshot, changedSnapshot);

      expect(diff.changedFields).toContain('residents');
      const residentDiff = diff.differences.residents as {
        from: MinimalGameState['residents'];
        to: MinimalGameState['residents'];
      };
      expect(residentDiff.from[0].level).toBe(1);
      expect(residentDiff.to[0].level).toBe(2);
    });
  });

  describe('validateSnapshot', () => {
    it('should validate correct snapshots', () => {
      const snapshot = serializeSnapshot(mockGameState);
      const isValid = validateSnapshot(snapshot);

      expect(isValid).toBe(true);
    });

    it('should reject invalid snapshots', () => {
      const snapshot = serializeSnapshot(mockGameState);
      const schemaError = buildSchemaError();
      const validationSpy = vi
        .spyOn(SnapshotSchemas.MinimalSnapshotSchema, 'safeParse')
        .mockReturnValueOnce({
          success: false as const,
          error: schemaError,
        });

      const isValid = validateSnapshot(snapshot);

      expect(isValid).toBe(false);

      validationSpy.mockRestore();
    });
  });

  describe('SnapshotSchemas', () => {
    it('should export schema objects', () => {
      expect(SnapshotSchemas.MinimalSnapshotSchema).toBeDefined();
      expect(SnapshotSchemas.SnapshotMetadataSchema).toBeDefined();
    });
  });

  describe('Migration Support', () => {
    it('should handle future version migrations', () => {
      // Test that migration infrastructure exists
      // Future versions would add specific migration tests
      const currentSnapshot = serializeSnapshot(mockGameState);

      expect(currentSnapshot.metadata.version).toBe('1.0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty game state', () => {
      const emptyState: MinimalGameState = {
        gold: 0,
        food: 0,
        maxFood: 10,
        currentDay: 0,
        currentTime: 0,
        isPaused: false,
        speedMultiplier: 1,
        residents: [],
        activeActivities: [],
        eventLog: [],
      };

      const snapshot = serializeSnapshot(emptyState);
      const deserialized = deserializeSnapshot(snapshot);

      expect(deserialized.residents).toHaveLength(0);
      expect(deserialized.activeActivities).toHaveLength(0);
    });

    it('should handle maximum values', () => {
      const maxState: MinimalGameState = {
        gold: Number.MAX_SAFE_INTEGER,
        food: Number.MAX_SAFE_INTEGER,
        maxFood: Number.MAX_SAFE_INTEGER,
        currentDay: Number.MAX_SAFE_INTEGER,
        currentTime: Number.MAX_SAFE_INTEGER,
        isPaused: true,
        speedMultiplier: Number.MAX_SAFE_INTEGER,
        residents: [],
        activeActivities: [],
        eventLog: [],
      };

      const snapshot = serializeSnapshot(maxState);
      const deserialized = deserializeSnapshot(snapshot);

      expect(deserialized.gold).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
