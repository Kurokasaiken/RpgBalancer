import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@/types/tauri';
import { loadFinalConfigFromDisk, persistConfigToDisk, isTauriRuntime } from '../PersistenceService';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../defaultConfig';

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
  it('falls back to defaults and writes file when JSON is missing', async () => {
    const fsModule = await import('@tauri-apps/api/fs');
    const writeSpy = vi.spyOn(fsModule, 'writeTextFile');

    const config = await loadFinalConfigFromDisk();

    expect(config).toEqual(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const serialized = writeSpy.mock.calls[0][1] as string;
    expect(JSON.parse(serialized)).toEqual(DEFAULT_IDLE_VILLAGE_CONFIG);
  });

  it('merges defaults with dynamic overrides', async () => {
    const { writeTextFile } = await import('@tauri-apps/api/fs');
    const pathModule = await import('@tauri-apps/api/path');
    const targetPath = await pathModule.resolveResource('../src/data/dynamicConfig.json');
    const merged = {
      version: 'custom-version',
      activities: {
        job_city_rats: {
          label: 'Rat Party',
        },
      },
    };
    await writeTextFile(targetPath, JSON.stringify(merged));

    const config = await loadFinalConfigFromDisk();

    expect(config.version).toBe('custom-version');
    expect(config.activities.job_city_rats.label).toBe('Rat Party');
    expect(config.activities.job_city_rats.slotTags).toEqual(
      DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_city_rats.slotTags,
    );
  });

  it('persistConfigToDisk writes the provided config', async () => {
    const { writeTextFile, readTextFile } = await import('@tauri-apps/api/fs');
    const nextConfig = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      version: 'persisted',
    };

    await persistConfigToDisk(nextConfig);

    expect(writeTextFile).toHaveBeenCalledTimes(1);
    const pathModule = await import('@tauri-apps/api/path');
    const targetPath = await pathModule.resolveResource('../src/data/dynamicConfig.json');
    const raw = await readTextFile(targetPath);
    expect(JSON.parse(raw)).toEqual(nextConfig);
  });

  it('detects non-tauri runtime and returns defaults without writing', async () => {
    disableTauriRuntime();

    const { writeTextFile } = await import('@tauri-apps/api/fs');
    const config = await loadFinalConfigFromDisk();

    expect(isTauriRuntime()).toBe(false);
    expect(config).toEqual(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(writeTextFile).not.toHaveBeenCalled();
  });
});
