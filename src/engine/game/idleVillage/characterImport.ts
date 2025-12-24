import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { getStartingResidentFatigue, type ResidentState } from './TimeEngine';
import type { SavedCharacter } from '@/engine/idle/characterStorage';
import { loadCharacters } from '@/engine/idle/characterStorage';

const FALLBACK_MAX_HP = 100;

function deriveStatTags(character: SavedCharacter): string[] {
  const tags = new Set<string>();
  if (character.aiBehavior) {
    tags.add(character.aiBehavior);
  }
  const statBlock = character.statBlock ?? {};
  const numericEntries = Object.entries(statBlock).filter(([, value]) => typeof value === 'number' && Number.isFinite(value as number));
  numericEntries
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .forEach(([key]) => tags.add(key));
  return Array.from(tags);
}

interface SavedCharacterToResidentOptions {
  defaultFatigue?: number;
}

export function savedCharacterToResident(
  character: SavedCharacter,
  options?: SavedCharacterToResidentOptions,
): ResidentState {
  const statBlock = character.statBlock ?? {};
  const hpValue = typeof statBlock.hp === 'number' && Number.isFinite(statBlock.hp) ? statBlock.hp : FALLBACK_MAX_HP;
  const defaultFatigue =
    typeof options?.defaultFatigue === 'number' && Number.isFinite(options.defaultFatigue) ? options.defaultFatigue : 0;
  return {
    id: character.id,
    displayName: character.name,
    status: 'available',
    fatigue: defaultFatigue,
    statProfileId: character.aiBehavior,
    statTags: deriveStatTags(character),
    statSnapshot: { ...statBlock },
    currentHp: hpValue,
    maxHp: hpValue,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  };
}

interface LoadResidentsOptions {
  config?: IdleVillageConfig;
}

export function loadResidentsFromCharacterManager(options?: LoadResidentsOptions): ResidentState[] {
  const defaultFatigue =
    options?.config && options.config.globalRules
      ? getStartingResidentFatigue(options.config)
      : undefined;
  return loadCharacters().map((character) => savedCharacterToResident(character, { defaultFatigue }));
}
