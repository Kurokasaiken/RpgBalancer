import { vi } from 'vitest';
import type { TestHarnessConfig } from '@/balancing/config/idleVillage/testHarnessConfig';

const slotLabConfigMock: TestHarnessConfig = {
  defaultSlotId: 'test-harness-slot',
  activity: {
    label: 'Test Activity Harness',
    helperText: 'Drag a resident here to test the ActionDetailHarness component',
    icon: '⚙️',
  },
  timer: {
    totalDurationSeconds: 60,
    elapsedSeconds: 18,
    progressFraction: 0.3,
  },
  labels: {
    elapsed: '0:18',
    remaining: '0:42',
  },
  residentDefaults: {
    startingFatigue: 0,
  },
};

vi.mock('@/balancing/config/idleVillage/testHarnessConfig', () => ({
  DEFAULT_TEST_HARNESS_CONFIG: slotLabConfigMock,
}));

const createLocalStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
};

const globalTarget = globalThis as typeof globalThis & { localStorage?: Storage };
const sharedLocalStorageMock = createLocalStorageMock();

Object.defineProperty(globalTarget, 'localStorage', {
  configurable: true,
  value: sharedLocalStorageMock,
});
