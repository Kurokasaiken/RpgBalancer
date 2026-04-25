import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import type { SkinPresetConfig, SkinPreferences, SkinStyleLabOverrides, StyleLabPillar } from '../skins/skinSchemas';
import {
  SkinPreferencesSchema,
  SkinStyleLabOverridesSchema,
} from '../skins/skinSchemas';
import {
  DEFAULT_SKIN_PRESET_ID,
  SKIN_CONFIG_REGISTRY,
  type SkinPresetId,
  getSkinPresetConfig,
  getSupportedPillars,
  isPillarSupported,
} from '../skins/skinConfigRegistry';
import { resolveSlotRackPresetId } from '../skins/slotRackSkinConfig';

const STORAGE_KEY = 'style-lab-skin-preset';

const diagnostics = createSandboxDiagnostics('useSkinPreferences', 'hook');

const DEFAULT_PREFERENCES: SkinPreferences = {
  presetId: DEFAULT_SKIN_PRESET_ID,
  pillar: getSkinPresetConfig(DEFAULT_SKIN_PRESET_ID).defaultPillar,
};

export interface UseSkinPreferencesResult {
  presetId: SkinPresetId;
  pillar: StyleLabPillar;
  overrides?: SkinStyleLabOverrides;
  skinConfig: SkinPresetConfig;
  supportedPillars: StyleLabPillar[];
  availablePresets: SkinPresetConfig[];
  isLoading: boolean;
  error?: string;
  setPreset: (presetId: SkinPresetId, pillar?: StyleLabPillar, overrides?: SkinStyleLabOverrides) => void;
  setPillar: (pillar: StyleLabPillar) => void;
  updateOverrides: (overrides: Partial<SkinStyleLabOverrides>) => void;
  resetOverrides: () => void;
  refresh: () => void;
}

interface TelemetryPayload {
  presetId: SkinPresetId;
  pillar: StyleLabPillar;
  previousPresetId: SkinPresetId;
  previousPillar: StyleLabPillar;
  overridesApplied: boolean;
  overrides?: SkinStyleLabOverrides;
}

function sanitizePreferences(preferences: SkinPreferences): SkinPreferences {
  const config = getSkinPresetConfig(preferences.presetId);
  const nextPillar = isPillarSupported(config.id, preferences.pillar)
    ? preferences.pillar
    : config.defaultPillar;

  return {
    presetId: config.id,
    pillar: nextPillar,
    overrides: preferences.overrides,
  };
}

function emitSkinTelemetry(config: SkinPresetConfig, payload: TelemetryPayload): void {
  trackTelemetryEvent(config.telemetry.presetChangedEvent, {
    ...payload,
    context: config.telemetry.context,
  });
}

export function useSkinPreferences(): UseSkinPreferencesResult {
  const [preferences, setPreferences] = useState<SkinPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const pendingTelemetry = useRef<TelemetryPayload | null>(null);

  const skinConfig = useMemo(() => getSkinPresetConfig(preferences.presetId), [preferences.presetId]);
  const supportedPillars = useMemo(
    () => getSupportedPillars(preferences.presetId),
    [preferences.presetId]
  );
  const availablePresets = useMemo(
    () => Object.values(SKIN_CONFIG_REGISTRY).filter((preset) => preset.exposure !== 'internal'),
    []
  );

  const persistPreferences = useCallback(async (nextPreferences: SkinPreferences) => {
    try {
      await saveData(STORAGE_KEY, nextPreferences);
      diagnostics.info('Saved skin preferences', { presetId: nextPreferences.presetId });
    } catch (saveError) {
      diagnostics.warn('Failed to save skin preferences', { error: saveError });
    }
  }, []);

  const handleTelemetryFlush = useCallback(() => {
    if (!pendingTelemetry.current) {
      return;
    }
    emitSkinTelemetry(skinConfig, pendingTelemetry.current);
    pendingTelemetry.current = null;
  }, [skinConfig]);

  const applyPreferences = useCallback(
    (updater: (current: SkinPreferences) => SkinPreferences, emitTelemetry: boolean) => {
      setPreferences(current => {
        const next = sanitizePreferences(updater(current));
        if (emitTelemetry) {
          pendingTelemetry.current = {
            presetId: next.presetId,
            pillar: next.pillar,
            previousPresetId: current.presetId as SkinPresetId,
            previousPillar: current.pillar,
            overridesApplied: Boolean(next.overrides),
            overrides: next.overrides,
          };
        }
        void persistPreferences(next);
        return next;
      });
    },
    [persistPreferences]
  );

  const loadPreferencesFromStorage = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadData<SkinPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
      const parsed = SkinPreferencesSchema.safeParse(loaded);
      const validated = parsed.success ? sanitizePreferences(parsed.data) : DEFAULT_PREFERENCES;
      setPreferences(validated);
      setError(undefined);
      diagnostics.info('Loaded skin preferences', { presetId: validated.presetId });
    } catch (loadError) {
      diagnostics.warn('Failed to load skin preferences', { error: loadError });
      setError('Unable to load skin preferences');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferencesFromStorage();
  }, [loadPreferencesFromStorage]);

  useEffect(() => {
    if (!isLoading) {
      handleTelemetryFlush();
    }
  }, [preferences, isLoading, handleTelemetryFlush]);

  const setPreset = useCallback(
    (presetId: SkinPresetId, pillar?: StyleLabPillar, overrides?: SkinStyleLabOverrides) => {
      applyPreferences(
        current => ({
          presetId,
          pillar: pillar && isPillarSupported(presetId, pillar)
            ? pillar
            : getSkinPresetConfig(presetId).defaultPillar,
          overrides: overrides ?? current.overrides,
        }),
        true
      );
    },
    [applyPreferences]
  );

  const setPillar = useCallback(
    (pillar: StyleLabPillar) => {
      applyPreferences(
        current => ({
          ...current,
          pillar: isPillarSupported(current.presetId as SkinPresetId, pillar)
            ? pillar
            : getSkinPresetConfig(current.presetId).defaultPillar,
        }),
        true
      );
    },
    [applyPreferences]
  );

  const updateOverrides = useCallback(
    (overrides: Partial<SkinStyleLabOverrides>) => {
      const parsed = SkinStyleLabOverridesSchema.partial().safeParse(overrides);
      const sanitizedOverrides = parsed.success ? { ...preferences.overrides, ...parsed.data } : preferences.overrides;
      applyPreferences(
        current => ({
          ...current,
          overrides: sanitizedOverrides,
        }),
        false
      );
    },
    [applyPreferences, preferences.overrides]
  );

  const resetOverrides = useCallback(() => {
    applyPreferences(
      current => ({
        ...current,
        overrides: undefined,
      }),
      false
    );
  }, [applyPreferences]);

  const refresh = useCallback(() => {
    void loadPreferencesFromStorage();
  }, [loadPreferencesFromStorage]);

  return {
    presetId: preferences.presetId as SkinPresetId,
    pillar: preferences.pillar,
    overrides: preferences.overrides,
    skinConfig,
    supportedPillars,
    availablePresets,
    isLoading,
    error,
    setPreset,
    setPillar,
    updateOverrides,
    resetOverrides,
    refresh,
  };
}
