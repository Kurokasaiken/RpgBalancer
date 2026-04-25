import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FoodChainAlertAnalyzer,
  formatFoodChainReport,
  snapshotsFromSchedulerKpis,
  type FoodChainSnapshot,
} from '../../../src/analytics/idleVillageFoodChain';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../../src/balancing/config/idleVillage/defaultConfig';
import type { VillageState } from '../../../src/engine/game/idleVillage/TimeEngine';

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    isEnabled: vi.fn(() => false),
  })),
}));

describe('FoodChainAlertAnalyzer', () => {
  let analyzer: FoodChainAlertAnalyzer;

  beforeEach(() => {
    analyzer = new FoodChainAlertAnalyzer();
  });

  it('flags critical when days-of-food are below threshold', () => {
    const snapshots: FoodChainSnapshot[] = [
      {
        timestamp: Date.now(),
        foodStock: 20,
        foodProductionPerDay: 5,
        foodConsumptionPerDay: 40,
      },
    ];

    const result = analyzer.analyzeSnapshots(snapshots);

    expect(result.status).toBe('critical');
    expect(result.alerts.some((alert) => alert.type === 'stock')).toBe(true);
    expect(result.metrics.daysOfFoodAvailable).toBeCloseTo(0.5, 2);
  });

  it('detects sustained production deficit warnings before stock depletion', () => {
    const baseTimestamp = Date.now();
    const snapshots: FoodChainSnapshot[] = Array.from({ length: 3 }).map((_, index) => ({
      timestamp: baseTimestamp + index * 60_000,
      foodStock: 250 - index * 10,
      foodProductionPerDay: 20,
      foodConsumptionPerDay: 40,
    }));

    const result = analyzer.analyzeSnapshots(snapshots);

    expect(result.status).toBe('warning');
    expect(result.alerts.some((alert) => alert.type === 'production_deficit')).toBe(true);
    expect(result.metrics.netProductionPerDay).toBeLessThan(0);
  });

  it('marks scheduler underallocation when farming utilization is low', () => {
    const snapshots: FoodChainSnapshot[] = [
      {
        timestamp: Date.now(),
        foodStock: 180,
        foodProductionPerDay: 0,
        foodConsumptionPerDay: 35,
        metadata: {
          schedulerVillageId: 'alpha',
          farmingUtilization: 0.05,
        },
      },
    ];

    const result = analyzer.analyzeSnapshots(snapshots);

    expect(result.alerts.some((alert) => alert.type === 'scheduler_underallocation')).toBe(true);
    expect(result.metrics.schedulerUnderAllocation).toBe(true);
  });

  it('formats reports in markdown containing headline sections', () => {
    const snapshots: FoodChainSnapshot[] = [
      {
        timestamp: Date.now(),
        foodStock: 50,
        foodProductionPerDay: 15,
        foodConsumptionPerDay: 40,
      },
    ];
    const analysis = analyzer.analyzeSnapshots(snapshots);
    const report = formatFoodChainReport(analysis, 'markdown');

    expect(report).toContain('# 🍞 Idle Village Food Chain Report');
    expect(report).toContain('## Metrics');
    expect(report).toContain('###');
  });
});

describe('snapshotsFromSchedulerKpis', () => {
  it('converts scheduler KPIs into snapshots using config-first values', () => {
    const dummyState: VillageState = {
      currentTime: 0,
      resources: { food: 120 },
      residents: {
        hero: {
          id: 'hero',
          status: 'available',
          fatigue: 0,
          currentHp: 100,
          maxHp: 100,
          isHero: true,
          isInjured: false,
          survivalCount: 0,
          stats: undefined as never,
        },
      } as unknown as VillageState['residents'],
      activities: {},
      eventLog: [],
      questOffers: {},
    };

    const snapshots = snapshotsFromSchedulerKpis({
      kpis: [
        {
          villageId: 'alpha',
          productionActivitiesPerDay: 3,
          farmingUtilization: 0.4,
          description: 'sample',
        },
      ],
      state: dummyState,
      config: DEFAULT_IDLE_VILLAGE_CONFIG,
      unitsPerActivity: 10,
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].foodProductionPerDay).toBe(30);
    expect(snapshots[0].foodConsumptionPerDay).toBeGreaterThan(0);
  });
});
