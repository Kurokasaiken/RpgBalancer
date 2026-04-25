/**
 * Minimal Snapshot Serializer
 *
 * Config-first snapshot serialization system for Minimal Gameplay with versioning,
 * migration support, and diff capabilities. Uses Zod for schema validation.
 */

import { z } from 'zod';
import { MinimalActivityEntrySchema } from '@/ui/idleVillage/config/activityLogPanelConfig';

/**
 * Snapshot metadata schema for versioning and integrity.
 */
const SnapshotMetadataSchema = z.object({
  /** Snapshot format version for migration support. */
  version: z.string().default('1.0'),
  /** Timestamp when snapshot was created. */
  createdAt: z.number(),
  /** Checksum for data integrity validation. */
  checksum: z.string(),
  /** Summary of snapshot contents. */
  summary: z.object({
    gold: z.number(),
    food: z.number(),
    currentDay: z.number(),
    residentCount: z.number(),
  }),
});

/**
 * Minimal gameplay state snapshot schema.
 */
const MinimalRngStateSchema = z.object({
  seed: z.number(),
  cursor: z.number(),
});

const MinimalSnapshotSchema = z.object({
  /** Snapshot metadata. */
  metadata: SnapshotMetadataSchema,
  /** Full game state data. */
  data: z.object({
    gold: z.number(),
    food: z.number(),
    maxFood: z.number(),
    currentDay: z.number(),
    currentTime: z.number(),
    isPaused: z.boolean(),
    speedMultiplier: z.number(),
    residents: z.array(z.object({
      id: z.string(),
      name: z.string(),
      level: z.number(),
      stats: z.record(z.string(), z.number()),
      fatigue: z.number(),
      isWorking: z.boolean(),
      isInjured: z.boolean(),
    })),
    activeActivities: z.array(z.object({
      activityId: z.string(),
      residentId: z.string(),
      ticksRemaining: z.number(),
    })),
    eventLog: z.array(MinimalActivityEntrySchema),
    lastSavedAt: z.number().optional(),
    rngState: MinimalRngStateSchema.optional(),
  }),
});

/**
 * Type definitions inferred from schemas.
 */
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
export type MinimalSnapshot = z.infer<typeof MinimalSnapshotSchema>;
export type MinimalGameState = MinimalSnapshot['data'];

/**
 * Generate a simple checksum for data integrity.
 */
function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return hash.toString(16);
}

/**
 * Create snapshot metadata from game state.
 */
function createSnapshotMetadata(gameState: MinimalGameState): SnapshotMetadata {
  return {
    version: '1.0',
    createdAt: Date.now(),
    checksum: generateChecksum(gameState),
    summary: {
      gold: gameState.gold,
      food: gameState.food,
      currentDay: gameState.currentDay,
      residentCount: gameState.residents.length,
    },
  };
}

/**
 * Serialize a minimal gameplay state into a snapshot.
 *
 * @param gameState - The game state to serialize
 * @returns Serialized snapshot with metadata
 */
export function serializeSnapshot(gameState: MinimalGameState): MinimalSnapshot {
  const metadata = createSnapshotMetadata(gameState);

  const snapshot: MinimalSnapshot = {
    metadata,
    data: gameState,
  };

  // Validate the snapshot against the schema
  const result = MinimalSnapshotSchema.safeParse(snapshot);
  if (!result.success) {
    throw new Error(`Snapshot validation failed: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Deserialize a snapshot into minimal gameplay state.
 *
 * @param input - Raw snapshot data (may be from older versions)
 * @returns Deserialized and migrated game state
 */
export function deserializeSnapshot(input: unknown): MinimalGameState {
  // Handle migration from older versions if needed
  const migratedInput = migrateSnapshotIfNeeded(input);

  // Validate and parse the snapshot
  const result = MinimalSnapshotSchema.safeParse(migratedInput);
  if (!result.success) {
    throw new Error(`Snapshot deserialization failed: ${result.error.message}`);
  }

  const snapshot = result.data;

  // Verify integrity using checksum
  const calculatedChecksum = generateChecksum(snapshot.data);
  if (snapshot.metadata.checksum !== calculatedChecksum) {
    throw new Error('Snapshot integrity check failed: checksum mismatch');
  }

  return snapshot.data;
}

/**
 * Migrate snapshot from older versions to current format.
 *
 * @param input - Raw snapshot input
 * @returns Migrated snapshot in current format
 */
function migrateSnapshotIfNeeded(input: unknown): MinimalSnapshot {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Snapshot deserialization failed: invalid input type');
  }

  const typedInput = input as Record<string, unknown> & { metadata?: SnapshotMetadata; data?: MinimalGameState };

  // For now, only version 1.0 is supported
  // Future migrations would be added here
  if (!typedInput.metadata?.version) {
    // Legacy format migration
    return {
      metadata: {
        version: '1.0',
        createdAt: (typedInput as { createdAt?: number }).createdAt || Date.now(),
        checksum: (typedInput as { checksum?: string }).checksum || generateChecksum(typedInput.data || typedInput),
        summary: (typedInput as { summary?: SnapshotMetadata['summary'] }).summary || {
          gold: (typedInput.data || typedInput as MinimalGameState).gold || 0,
          food: (typedInput.data || typedInput as MinimalGameState).food || 0,
          currentDay: (typedInput.data || typedInput as MinimalGameState).currentDay || 0,
          residentCount: (typedInput.data || typedInput as MinimalGameState).residents?.length || 0,
        },
      },
      data: (typedInput.data || typedInput) as MinimalGameState,
    };
  }

  return typedInput as MinimalSnapshot;
}

/**
 * Compare two snapshots and return the differences.
 *
 * @param snapshotA - First snapshot to compare
 * @param snapshotB - Second snapshot to compare
 * @returns Object containing changed fields and their values
 */
export function diffSnapshots(
  snapshotA: MinimalSnapshot,
  snapshotB: MinimalSnapshot
): {
  changedFields: string[];
  differences: Record<string, { from: unknown; to: unknown }>;
  summary: {
    goldChanged: boolean;
    foodChanged: boolean;
    dayChanged: boolean;
    residentCountChanged: boolean;
  };
} {
  const changedFields: string[] = [];
  const differences: Record<string, { from: unknown; to: unknown }> = {};

  // Compare metadata
  if (snapshotA.metadata.version !== snapshotB.metadata.version) {
    changedFields.push('metadata.version');
    differences['metadata.version'] = {
      from: snapshotA.metadata.version,
      to: snapshotB.metadata.version,
    };
  }

  if (snapshotA.metadata.createdAt !== snapshotB.metadata.createdAt) {
    changedFields.push('metadata.createdAt');
    differences['metadata.createdAt'] = {
      from: snapshotA.metadata.createdAt,
      to: snapshotB.metadata.createdAt,
    };
  }

  // Compare game state
  const compareObjects = (objA: Record<string, unknown>, objB: Record<string, unknown>, prefix = ''): void => {
    const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

    for (const key of keys) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const valA = objA[key];
      const valB = objB[key];

      if (Array.isArray(valA) && Array.isArray(valB)) {
        if (JSON.stringify(valA) !== JSON.stringify(valB)) {
          changedFields.push(fullKey);
          differences[fullKey] = { from: valA, to: valB };
        }
      } else if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
        compareObjects(valA as Record<string, unknown>, valB as Record<string, unknown>, fullKey);
      } else if (valA !== valB) {
        changedFields.push(fullKey);
        differences[fullKey] = { from: valA, to: valB };
      }
    }
  };

  compareObjects(snapshotA.data, snapshotB.data);

  // Generate summary
  const summary = {
    goldChanged: changedFields.includes('gold'),
    foodChanged: changedFields.includes('food'),
    dayChanged: changedFields.includes('currentDay'),
    residentCountChanged: changedFields.some(field => field.includes('residents')),
  };

  return {
    changedFields,
    differences,
    summary,
  };
}

/**
 * Validate a snapshot against the current schema.
 *
 * @param snapshot - Snapshot to validate
 * @returns True if snapshot is valid, false otherwise
 */
export function validateSnapshot(snapshot: MinimalSnapshot): boolean {
  const result = MinimalSnapshotSchema.safeParse(snapshot);
  if (!result.success) {
    return false;
  }

  // Additional integrity check
  const calculatedChecksum = generateChecksum(result.data.data);
  return result.data.metadata.checksum === calculatedChecksum;
}

/**
 * Export snapshot schemas for external use.
 */
export const SnapshotSchemas = {
  MinimalSnapshotSchema,
  SnapshotMetadataSchema,
} as const;
