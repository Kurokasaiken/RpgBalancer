import type { ResidentState } from './TimeEngine';
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

export function savedCharacterToResident(character: SavedCharacter): ResidentState {
  const statBlock = character.statBlock ?? {};
  const hpValue = typeof statBlock.hp === 'number' && Number.isFinite(statBlock.hp) ? statBlock.hp : FALLBACK_MAX_HP;
  return {
    id: character.id,
    displayName: character.name,
    status: 'available',
    fatigue: 0,
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

export function loadResidentsFromCharacterManager(): ResidentState[] {
  return loadCharacters().map(savedCharacterToResident);
}
