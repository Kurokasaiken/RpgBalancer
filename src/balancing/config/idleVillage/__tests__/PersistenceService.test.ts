import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runtimeMock = vi.hoisted(() => ({
  isTauriRuntime: vi.fn(() => true),
}));

vi.mock('@/shared/persistence/runtime', () => runtimeMock);
vi.mock('@tauri-apps/plugin-fs', () => import('@/test/mocks/tauriFsMock'));

import { loadFinalConfigFromDisk, persistConfigToDisk, isTauriRuntime } from '../PersistenceService';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../defaultConfig';
import { applyIdleVillageConfigDefaults } from '../configNormalizer';
import type { AppNavTabId } from '@/shared/navigation/navConfig';
import { __mockFsStore } from '@/test/mocks/tauriFsMock';

vi.mock('@tauri-apps/api/path', () => import('@/test/mocks/tauriPathMock'));

const DYNAMIC_CONFIG_RELATIVE_PATH = '../src/data/dynamicConfig.json';
const dynamicConfigFixturePath = resolve(process.cwd(), 'src/data/dynamicConfig.json');
const dynamicConfigFixture = readFileSync(dynamicConfigFixturePath, 'utf8');

beforeEach(async () => {
  vi.clearAllMocks();
  __mockFsStore.clear();
  const pathModule = await import('@tauri-apps/api/path');
  const resolvedDynamicPath = await pathModule.resolveResource(DYNAMIC_CONFIG_RELATIVE_PATH);
  __mockFsStore.set(resolvedDynamicPath, dynamicConfigFixture);
  runtimeMock.isTauriRuntime.mockReturnValue(true);
});

describe('PersistenceService', () => {
  it('loads real dynamicConfig.json and merges overrides', async () => {
    const config = await loadFinalConfigFromDisk();
    expect(config.version).toBe('1.0.1');
    expect(config.resources.gold.label).toBe('Guild Ducats');
    expect(config.activities.job_city_rats.dangerRating).toBe(2);
    expect(config.activities.job_city_rats.metadata?.mapSlotId).toBe('village_gate');
    expect(config.globalRules.baseFoodPriceInGold).toBe(3);
  });

  it('persists config snapshots via writeTextFile mock store', async () => {
    const defaultTab: AppNavTabId = 'map';
    const nextConfig = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      version: 'persisted',
      uiPreferences: { defaultAppTabId: defaultTab },
    };
    const pathModule = await import('@tauri-apps/api/path');
    const targetPath = await pathModule.resolveResource('../src/data/dynamicConfig.json');

    await persistConfigToDisk(nextConfig);
    expect(__mockFsStore.get(targetPath)).toEqual(JSON.stringify(nextConfig, null, 2));
  });

  it('falls back to defaults when disk read fails validation', async () => {
    const fsModule = await import('@tauri-apps/plugin-fs');
    const readSpy = vi.spyOn(fsModule, 'readTextFile').mockRejectedValueOnce(new Error('fs failure'));
    const config = await loadFinalConfigFromDisk();
    expect(readSpy).toHaveBeenCalled();
    const defaults = applyIdleVillageConfigDefaults(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(config.version).toBe(defaults.version);
    expect(config.resources.gold.label).toBe(defaults.resources.gold.label);
    expect(config.activities.job_city_rats.dangerRating).toBe(defaults.activities.job_city_rats.dangerRating);
  });

  it('detects non-tauri runtime and returns defaults without writing', async () => {
    runtimeMock.isTauriRuntime.mockReturnValue(false);
    const fsModule = await import('@tauri-apps/plugin-fs');
    const writeSpy = vi.spyOn(fsModule, 'writeTextFile');

    const config = await loadFinalConfigFromDisk();
    expect(isTauriRuntime()).toBe(false);
    const defaults = applyIdleVillageConfigDefaults(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(config.version).toBe(defaults.version);
    expect(config.resources.gold.label).toBe(defaults.resources.gold.label);
    expect(config.activities.job_city_rats.metadata?.mapSlotId).toBe(
      defaults.activities.job_city_rats.metadata?.mapSlotId,
    );
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
