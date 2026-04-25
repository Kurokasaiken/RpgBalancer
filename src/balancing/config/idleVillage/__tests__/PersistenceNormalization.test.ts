import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../defaultConfig';
import type { IdleVillageConfig } from '../types';

const mockLoadData = vi.fn();
const mockSaveData = vi.fn();
const mockIsTauriRuntime = vi.fn(() => false);

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: (...args: unknown[]) => mockLoadData(...args),
  saveData: (...args: unknown[]) => mockSaveData(...args),
}));

vi.mock('@/shared/persistence/runtime', () => ({
  isTauriRuntime: () => mockIsTauriRuntime(),
}));

// Import after mocks are declared so the module picks them up.
import { loadFinalConfigFromDisk, IDLE_VILLAGE_CONFIG_STORAGE_KEY } from '../PersistenceService';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe('PersistenceService normalization (web fallback)', () => {
  beforeEach(() => {
    mockLoadData.mockReset();
    mockSaveData.mockReset();
    mockIsTauriRuntime.mockReset();
    mockIsTauriRuntime.mockReturnValue(false);
  });

  it('applies defaults when loading legacy configs from web storage', async () => {
    const legacyConfig: IdleVillageConfig = clone(DEFAULT_IDLE_VILLAGE_CONFIG);
    legacyConfig.activities.legacy_job = {
      id: 'legacy_job',
      label: 'Legacy Job',
      tags: [],
      slotTags: [],
      resolutionEngineId: 'job',
    };
    legacyConfig.globalRules = {
      ...legacyConfig.globalRules,
      fatigueRecoveryPerDay: 120,
    };
    delete (legacyConfig.globalRules as Partial<typeof legacyConfig.globalRules>).ticksPerDay;
    delete (legacyConfig.globalRules as Partial<typeof legacyConfig.globalRules>).ticksPerNight;
    delete (legacyConfig.globalRules as Partial<typeof legacyConfig.globalRules>).fatigueRecoveryPerNightTick;
    delete (legacyConfig.globalRules as Partial<typeof legacyConfig.globalRules>).productionHaltFatigueThreshold;

    mockLoadData.mockResolvedValueOnce(legacyConfig);

    const result = await loadFinalConfigFromDisk();

    expect(mockIsTauriRuntime).toHaveBeenCalled();
    expect(mockLoadData).toHaveBeenCalledWith(IDLE_VILLAGE_CONFIG_STORAGE_KEY, DEFAULT_IDLE_VILLAGE_CONFIG);

    const importedLegacy = result.activities.legacy_job;
    expect(importedLegacy.supportsPartialResolution).toBe(false);
    expect(importedLegacy.dailyRewardProfile).toEqual([]);
    expect(importedLegacy.perTickCostProfile).toEqual([]);

    expect(result.globalRules.ticksPerDay).toBeGreaterThan(0);
    expect(result.globalRules.ticksPerNight).toBeGreaterThan(0);
    expect(result.globalRules.fatigueRecoveryPerNightTick).toBeGreaterThan(0);
    expect(result.globalRules.productionHaltFatigueThreshold).toBe(1);
  });
});
