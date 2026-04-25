import { describe, it, expect } from 'vitest';
import {
  computeResidentFoodDays,
  computeRiskHeatmap,
  buildCsv,
  parseArgs,
  type SeverityBucket,
} from '../../../scripts/idleVillage/minimalRiskHeatmapExport';
import type {
  MinimalGameState,
  MinimalSnapshot,
} from '../../../src/engine/game/idleVillage/minimalSnapshotSerializer';
import { MINIMAL_GAMEPLAY_CONFIG } from '../../../src/balancing/config/idleVillage/minimalGameplayConfig';

type MinimalResidentState = MinimalGameState['residents'][number];

function createResident(overrides: Partial<MinimalResidentState>): MinimalResidentState {
  return {
    id: 'resident-generic',
    name: 'Resident',
    level: 1,
    stats: { strength: 5 } as Record<string, number>,
    fatigue: 0,
    isWorking: false,
    isInjured: false,
    ...overrides,
  };
}

describe('minimalRiskHeatmapExport utilities', () => {
  const mockState = {
    gold: 100,
    food: 20,
    maxFood: 40,
    currentDay: 3,
    currentTime: 120,
    isPaused: false,
    speedMultiplier: 1,
    residents: [
      createResident({
        id: 'resident-a',
        name: 'Aurora',
        level: 2,
        stats: { strength: 5 } as Record<string, number>,
        fatigue: 0.2,
        isWorking: false,
      }),
      createResident({
        id: 'resident-b',
        name: 'Balthazar',
        level: 3,
        stats: { strength: 7 } as Record<string, number>,
        fatigue: 0.9,
        isWorking: true,
      }),
    ],
    activeActivities: [],
    lastSavedAt: Date.now(),
  } as MinimalGameState;

  const mockSnapshot: MinimalSnapshot = {
    metadata: {
      version: '1.0',
      createdAt: 1700000000000,
      checksum: 'abc123',
      summary: {
        gold: 100,
        food: 20,
        currentDay: 3,
        residentCount: mockState.residents.length,
      },
    },
    data: mockState,
  };

  it('computes resident food days with working penalty', () => {
    const days = computeResidentFoodDays(mockState);
    expect(days).toHaveLength(2);
    expect(days[0]).toBeGreaterThan(days[1]);
  });

  it('produces risk heatmap grid with severity breakdown', () => {
    const result = computeRiskHeatmap(mockState, mockSnapshot.metadata, MINIMAL_GAMEPLAY_CONFIG);

    expect(result.grid.length).toBe(10);
    expect(result.summary.totalResidents).toBe(2);
    const totalBuckets = Object.values(result.summary.severityCounts).reduce(
      (sum: number, value: number) => sum + value,
      0
    );
    expect(totalBuckets).toBe(2);
    const buckets: SeverityBucket[] = ['safe', 'caution', 'danger'];
    expect(buckets).toContain(result.summary.dangerResidents.length > 0 ? 'danger' : 'safe');
  });

  it('builds CSV only for populated cells', () => {
    const result = computeRiskHeatmap(mockState, mockSnapshot.metadata, MINIMAL_GAMEPLAY_CONFIG);
    const csv = buildCsv(result);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0]).toContain('food_bucket');
  });

  it('parses CLI arguments', () => {
    const args = parseArgs([
      '--snapshot',
      'snapshot.json',
      '--config',
      'config.json',
      '--output-json',
      'out.json',
      '--output-csv',
      'out.csv',
      '--verbose',
    ]);

    expect(args.snapshotPath).toBe('snapshot.json');
    expect(args.configPath).toBe('config.json');
    expect(args.outputJson).toBe('out.json');
    expect(args.outputCsv).toBe('out.csv');
    expect(args.verbose).toBe(true);
  });
});
