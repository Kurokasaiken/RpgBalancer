import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadFinalConfigFromDisk, persistConfigToDisk, isTauriRuntime } from '../PersistenceService';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../defaultConfig';
import { __mockFsStore } from '../../../test/mocks/tauriFsMock';

type TauriFlags = {
  __TAURI__?: Record<string, unknown>;
  __TAURI_IPC__?: unknown;
};

const ensureWindow = (): Window & typeof globalThis & TauriFlags => {
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: globalThis as Window & typeof globalThis,
    });
  }
  return globalThis.window as Window & typeof globalThis & TauriFlags;
};

const setTestWindow = (flags: TauriFlags | null) => {
  const win = ensureWindow();
  if (!flags) {
    Reflect.deleteProperty(win, '__TAURI__');
    Reflect.deleteProperty(win, '__TAURI_IPC__');
    return;
  }
  if (flags.__TAURI__) {
    Reflect.set(win, '__TAURI__', flags.__TAURI__);
  } else {
    Reflect.deleteProperty(win, '__TAURI__');
  }
  if (flags.__TAURI_IPC__) {
    Reflect.set(win, '__TAURI_IPC__', flags.__TAURI_IPC__);
  } else {
    Reflect.deleteProperty(win, '__TAURI_IPC__');
  }
};

const disableTauriRuntime = () => {
  setTestWindow(null);
};

const enableTauriRuntime = () => {
  setTestWindow({ __TAURI__: {} });
};

const mockFsStore = new Map<string, string>();

vi.mock('@tauri-apps/api/path', () => ({
  resolveResource: vi.fn(async (path: string) => path),
}));

vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(async (path: string) => {
    if (!mockFsStore.has(path)) {
      throw new Error(`missing file: ${path}`);
    }
    return mockFsStore.get(path)!;
  }),
  writeTextFile: vi.fn(async (path: string, contents: string | Uint8Array) => {
    mockFsStore.set(path, typeof contents === 'string' ? contents : Buffer.from(contents).toString('utf8'));
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFsStore.clear();
  enableTauriRuntime();
});

afterEach(() => {
  disableTauriRuntime();
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
    const nextConfig = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      version: 'persisted',
      uiPreferences: { defaultAppTabId: 'idleVillageConfig' },
    };
    const pathModule = await import('@tauri-apps/api/path');
    const targetPath = await pathModule.resolveResource('../src/data/dynamicConfig.json');

    await persistConfigToDisk(nextConfig);
    expect(__mockFsStore.get(targetPath)).toEqual(JSON.stringify(nextConfig, null, 2));
  });

  it('falls back to defaults when disk read fails validation', async () => {
    const fsModule = await import('@tauri-apps/api/fs');
    const readSpy = vi.spyOn(fsModule, 'readTextFile').mockRejectedValueOnce(new Error('fs failure'));
    const config = await loadFinalConfigFromDisk();
    expect(readSpy).toHaveBeenCalled();
    expect(config).toEqual(DEFAULT_IDLE_VILLAGE_CONFIG);
  });

  it('detects non-tauri runtime and returns defaults without writing', async () => {
    disableTauriRuntime();
    const fsModule = await import('@tauri-apps/api/fs');
    const writeSpy = vi.spyOn(fsModule, 'writeTextFile');

    const config = await loadFinalConfigFromDisk();
    expect(isTauriRuntime()).toBe(false);
    expect(config).toEqual(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
