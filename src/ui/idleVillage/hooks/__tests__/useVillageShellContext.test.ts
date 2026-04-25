import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ThemePreset } from '@/data/themePresets';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { useVillageShellContext } from '../useVillageShellContext';

const testHelpers = vi.hoisted(() => ({
  cloneConfig: (): IdleVillageConfig => structuredClone(DEFAULT_IDLE_VILLAGE_CONFIG),
}));

const persistenceMocks = vi.hoisted(() => ({
  loadShellPresetId: vi.fn<() => Promise<string>>(),
  saveShellPresetId: vi.fn<() => Promise<void>>(),
}));

vi.mock('@/hooks/useThemeSwitcher', () => {
  const preset: ThemePreset = {
    id: 'epicFrontier',
    label: 'Epic Frontier',
    description: 'Test preset',
    tokens: {},
  };

  return {
    useThemeSwitcher: vi.fn(() => ({
      activePreset: preset,
      activePresetId: preset.id,
      presets: [preset],
      isRandomized: false,
      setPreset: vi.fn(),
      randomizeTheme: vi.fn(),
      resetRandomization: vi.fn(),
    })),
  };
});

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => {
  const config = testHelpers.cloneConfig();
  return {
    useIdleVillageConfig: vi.fn(() => ({ config })),
  };
});

vi.mock('@/engine/game/idleVillage/TimeEngine', () => ({
  createVillageStateFromConfig: vi.fn(() => ({ residents: {} })),
}));

vi.mock('@/balancing/config/idleVillage/presets/punchClubLight', () => ({
  PUNCH_CLUB_LIGHT_CONFIG: testHelpers.cloneConfig(),
}));

vi.mock('../useAsyncVillageStateStore', () => ({
  useAsyncVillageStateStore: vi.fn(() => ({
    state: { residents: {} },
    history: [],
    isLoading: false,
    error: null,
    saveState: vi.fn(),
    updateState: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    exportState: vi.fn(),
    importState: vi.fn(),
    resetState: vi.fn(),
    clearState: vi.fn(),
  })),
}));

vi.mock('@/ui/idleVillage/state/PersistenceService', () => ({
  DEFAULT_SHELL_PRESET_ID: 'live_config',
  loadShellPresetId: (...args: Parameters<typeof persistenceMocks.loadShellPresetId>) =>
    persistenceMocks.loadShellPresetId(...args),
  saveShellPresetId: (...args: Parameters<typeof persistenceMocks.saveShellPresetId>) =>
    persistenceMocks.saveShellPresetId(...args),
}));

describe('useVillageShellContext persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistenceMocks.loadShellPresetId.mockResolvedValue('live_config');
    persistenceMocks.saveShellPresetId.mockResolvedValue(undefined);
  });

  it('hydrates shell preset id from PersistenceService', async () => {
    persistenceMocks.loadShellPresetId.mockResolvedValueOnce('punch_club_light');

    const { result } = renderHook(() => useVillageShellContext());

    await waitFor(() => {
      expect(result.current.activeShellPresetId).toBe('punch_club_light');
    });
  });

  it('persists preset changes only after hydration', async () => {
    const { result } = renderHook(() => useVillageShellContext());

    await waitFor(() => {
      expect(persistenceMocks.loadShellPresetId).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setShellPresetId('punch_club_light');
    });

    await waitFor(() => {
      expect(persistenceMocks.saveShellPresetId).toHaveBeenCalledWith('punch_club_light');
    });
  });
});
