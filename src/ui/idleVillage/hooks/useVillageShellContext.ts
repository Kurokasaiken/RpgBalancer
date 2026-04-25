import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { useAsyncVillageStateStore, type UseVillageStateStoreReturn } from './useAsyncVillageStateStore';
import { createVillageStateFromConfig } from '@/engine/game/idleVillage/TimeEngine';
import {
  DEFAULT_SHELL_PRESET_ID,
  loadShellPresetId,
  saveShellPresetId,
} from '@/ui/idleVillage/state/PersistenceService';

export interface VillageShellContext {
  theme: ReturnType<typeof useThemeSwitcher>;
  config: IdleVillageConfig;
  villageStateStore: UseVillageStateStoreReturn;
  shellPresetOptions: ShellPresetSummary[];
  activeShellPresetId: string;
  setShellPresetId: (id: string) => void;
}

interface ShellPresetDefinition {
  id: string;
  label: string;
  description: string;
  isEditor?: boolean;
  getConfig: (args: { editorConfig: IdleVillageConfig }) => IdleVillageConfig;
}

export interface ShellPresetSummary {
  id: string;
  label: string;
  description: string;
  isEditor: boolean;
}

declare global {
  interface Window {
    __IDLE_VILLAGE_FORCED_SHELL_PRESET?: string;
  }
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const SHELL_PRESET_DEFINITIONS: ShellPresetDefinition[] = [
  {
    id: DEFAULT_SHELL_PRESET_ID,
    label: 'Config Editor',
    description: 'Uses the currently edited Idle Village config.',
    isEditor: true,
    getConfig: ({ editorConfig }) => editorConfig,
  },
];

/**
 * Encapsulates global Idle Village shell orchestration:
 * - Theme preset management (Gilded Observatory variants)
 * - Config loading via useIdleVillageConfig
 * - Initial VillageState provisioning through the async store
 */
export function useVillageShellContext(): VillageShellContext {
  const theme = useThemeSwitcher();
  const { config: editorConfig } = useIdleVillageConfig();
  const [activeShellPresetId, setActiveShellPresetId] = useState(DEFAULT_SHELL_PRESET_ID);
  const forcedPresetRef = useRef<string | null>(null);
  const presetHydratedRef = useRef(false);

  const shellPresetOptions = useMemo<ShellPresetSummary[]>(
    () =>
      SHELL_PRESET_DEFINITIONS.map((preset) => ({
        id: preset.id,
        label: preset.label,
        description: preset.description,
        isEditor: Boolean(preset.isEditor),
      })),
    [],
  );

  const hydrateActivePreset = useCallback(async () => {
    if (typeof window !== 'undefined' && window.__IDLE_VILLAGE_FORCED_SHELL_PRESET) {
      forcedPresetRef.current = window.__IDLE_VILLAGE_FORCED_SHELL_PRESET;
      setActiveShellPresetId(window.__IDLE_VILLAGE_FORCED_SHELL_PRESET);
      presetHydratedRef.current = true;
      return;
    }

    try {
      const persistedId = await loadShellPresetId(DEFAULT_SHELL_PRESET_ID);
      setActiveShellPresetId(persistedId);
    } catch (error) {
      console.warn('[useVillageShellContext] Failed to hydrate preset id, using default.', error);
      setActiveShellPresetId(DEFAULT_SHELL_PRESET_ID);
    } finally {
      presetHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    void hydrateActivePreset();
  }, [hydrateActivePreset]);

  useEffect(() => {
    if (!presetHydratedRef.current) return;
    if (forcedPresetRef.current) return;
    void saveShellPresetId(activeShellPresetId).catch((error) => {
      console.warn('[useVillageShellContext] Failed to persist shell preset id.', error);
    });
  }, [activeShellPresetId]);

  const resolvedPreset =
    SHELL_PRESET_DEFINITIONS.find((preset) => preset.id === activeShellPresetId) ??
    SHELL_PRESET_DEFINITIONS[0];

  const effectiveConfig = useMemo(
    () => resolvedPreset.getConfig({ editorConfig }),
    [editorConfig, resolvedPreset],
  );

  const initialStateFactory = useCallback(
    () => createVillageStateFromConfig({ config: effectiveConfig }),
    [effectiveConfig],
  );
  const villageStateStore = useAsyncVillageStateStore(initialStateFactory);

  const setShellPresetId = useCallback((nextId: string) => {
    if (forcedPresetRef.current) return;
    if (nextId === activeShellPresetId) return;
    setActiveShellPresetId(nextId);
    void villageStateStore.resetState(
      () => createVillageStateFromConfig({ config: SHELL_PRESET_DEFINITIONS.find((preset) => preset.id === nextId)?.getConfig({ editorConfig }) ?? editorConfig }),
      `Switch shell preset: ${nextId}`,
    );
  }, [activeShellPresetId, editorConfig, villageStateStore]);

  return useMemo(
    () => ({
      theme,
      config: effectiveConfig,
      villageStateStore,
      shellPresetOptions,
      activeShellPresetId: resolvedPreset.id,
      setShellPresetId,
    }),
    [theme, effectiveConfig, villageStateStore, shellPresetOptions, resolvedPreset.id, setShellPresetId],
  );
}

export type UseVillageShellContextReturn = ReturnType<typeof useVillageShellContext>;
