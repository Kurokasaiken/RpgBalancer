import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { createVillageStateFromConfig } from './TimeEngine';
import { VillageStateStore } from './VillageStateStore';
import { loadResidentsFromCharacterManager } from './characterImport';

export interface RegenerateResidentsOptions {
  description?: string;
}

export interface RegenerateResidentsResult {
  residentsCreated: number;
}

/**
 * Rebuilds the Idle Village state from the roster stored in Character Manager.
 * It clears the current resident store and regenerates every draggable token/PG
 * by replaying the character import pipeline.
 */
export function regenerateResidentsFromRoster(
  config: IdleVillageConfig,
  options?: RegenerateResidentsOptions,
): RegenerateResidentsResult {
  const residents = loadResidentsFromCharacterManager({ config });
  const description = options?.description ?? 'Rigenera residenti da Character Manager';

  VillageStateStore.reset(
    () =>
      createVillageStateFromConfig({
        config,
        initialResidents: residents,
      }),
    description,
  );

  return {
    residentsCreated: residents.length,
  };
}
