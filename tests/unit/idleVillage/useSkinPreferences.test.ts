import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSkinPreferences } from '../../../src/ui/idleVillage/hooks/useSkinPreferences';
import { loadData, saveData } from '../../../src/shared/persistence/PersistenceService';
import { trackTelemetryEvent } from '../../../src/analytics/telemetry/telemetryProvider';
import { DEFAULT_SKIN_PRESET_ID, SKIN_CONFIG_REGISTRY } from '../../../src/ui/idleVillage/skins/skinConfigRegistry';
import type { SkinPreferences, SkinStyleLabOverrides } from '../../../src/ui/idleVillage/skins/skinSchemas';

vi.mock('../../../src/shared/persistence/PersistenceService');
vi.mock('../../../src/analytics/telemetry/telemetryProvider');

const mockLoadData = vi.mocked(loadData);
const mockSaveData = vi.mocked(saveData);
const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

describe('useSkinPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadData.mockResolvedValue({
      presetId: DEFAULT_SKIN_PRESET_ID,
      pillar: 'frontier',
    });
    mockSaveData.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and validates preferences on mount', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockLoadData).toHaveBeenCalledWith('style-lab-skin-preset', expect.any(Object));
    expect(result.current.presetId).toBe(DEFAULT_SKIN_PRESET_ID);
    expect(result.current.pillar).toBe('frontier');
  });

  it('falls back to default when loading fails', async () => {
    mockLoadData.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load skin preferences');
    expect(result.current.presetId).toBe(DEFAULT_SKIN_PRESET_ID);
  });

  it('sets preset and pillar with validation', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPreset('wanderlust', 'empire');
    });

    expect(result.current.presetId).toBe('wanderlust');
    expect(result.current.pillar).toBe('empire');
    expect(mockSaveData).toHaveBeenCalledWith('style-lab-skin-preset', expect.objectContaining({
      presetId: 'wanderlust',
      pillar: 'empire',
    }));
  });

  it('falls back to default pillar when unsupported', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPreset('minimal_frontier', 'empire');
    });

    expect(result.current.presetId).toBe('minimal_frontier');
    expect(result.current.pillar).toBe('frontier');
  });

  it('updates pillar only', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPillar('wilderness');
    });

    expect(result.current.pillar).toBe('frontier');
    expect(result.current.presetId).toBe('minimal_frontier');
  });

  it('updates overrides with validation', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const overrides: Partial<SkinStyleLabOverrides> = {
      motionLevel: 'minimal',
      densityMode: 'spacious',
    };

    act(() => {
      result.current.updateOverrides(overrides);
    });

    expect(result.current.overrides).toMatchObject(overrides);
  });

  it('resets overrides', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateOverrides({ motionLevel: 'minimal' });
    });

    act(() => {
      result.current.resetOverrides();
    });

    expect(result.current.overrides).toBeUndefined();
  });

  it('emits telemetry on preset/pillar change', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPreset('wanderlust', 'empire');
    });

    await waitFor(() => {
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'skin_preset_changed',
        expect.objectContaining({
          presetId: 'wanderlust',
          pillar: 'empire',
          previousPresetId: DEFAULT_SKIN_PRESET_ID,
          previousPillar: 'frontier',
          overridesApplied: false,
          context: 'idle_village_wanderlust',
        })
      );
    });
  });

  it('refreshes preferences from storage', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockLoadData.mockResolvedValueOnce({
      presetId: 'wanderlust',
      pillar: 'wilderness',
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.presetId).toBe('wanderlust');
      expect(result.current.pillar).toBe('wilderness');
    });
  });

  it('exposes available presets and supported pillars', async () => {
    const { result } = renderHook(() => useSkinPreferences());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availablePresets).toEqual(Object.values(SKIN_CONFIG_REGISTRY));
    expect(result.current.supportedPillars).toContain('frontier');
  });
});
