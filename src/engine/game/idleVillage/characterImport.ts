import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { getStartingResidentFatigue, type ResidentState } from './TimeEngine';
import { resolveResidentPortrait } from './residentVisualResolver';
import type { SavedCharacter } from '@/engine/idle/characterStorage';
import { loadCharacters } from '@/engine/idle/characterStorage';
import type { MinimalResident } from '@/ui/idleVillage/types/gameplayTypes';

const FALLBACK_MAX_HP = 100;

/**
 * Maps legacy character data to visual profile IDs for proper portrait resolution.
 * This ensures distinct portraits for characters without explicit visualProfileId.
 */
function mapCharacterToVisualProfile(character: SavedCharacter): string {
  // Map specific character IDs to character-specific visual profiles
  switch (character.id) {
    case 'sir-spaccaculi':
      return 'sir-spaccaculi';
    case 'salvatrice':
      return 'salvatrice';
    case 'giggiolillo':
      return 'giggiolillo';
    default:
      // Fallback to aiBehavior-based mapping
      if (character.aiBehavior === 'tank') return 'hero-tank';
      if (character.aiBehavior === 'support') return 'hero-support';
      if (character.aiBehavior === 'dps') return 'hero-assassin';
      return 'fallback_placeholder_profile';
  }
}

/**
 * Maps character to their specific portrait URL for identity preservation.
 * This ensures characters show their intended portrait instead of generic class portraits.
 */
function mapCharacterToPortraitUrl(character: SavedCharacter): string | null {
  // Use character-specific portrait URL if available
  if (character.portraitUrl && character.portraitUrl.trim().length > 0) {
    return character.portraitUrl;
  }
  
  // Fallback to visual profile-based portrait if no character-specific portrait
  return null;
}

/**
 * Maps legacy character data to stat profile IDs for proper stat processing.
 */
function mapCharacterToStatProfile(character: SavedCharacter): string {
  // Map specific character IDs to appropriate stat profiles
  switch (character.id) {
    case 'sir-spaccaculi':
      return 'hero-tank';
    case 'salvatrice':
      return 'hero-support';
    case 'giggiolillo':
      return 'hero-assassin';
    default:
      // Fallback to aiBehavior
      return character.aiBehavior ?? 'fallback_placeholder_profile';
  }
}

function deriveStatTagsFromStats(character: SavedCharacter): string[] {
  const tags = new Set<string>();
  if (character.aiBehavior) {
    tags.add(character.aiBehavior);
  }
  const statBlock = character.statBlock ?? {};
  const numericEntries = Object.entries(statBlock).filter(
    ([, value]) => typeof value === 'number' && Number.isFinite(value as number),
  );
  numericEntries
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .forEach(([key]) => tags.add(key));
  return Array.from(tags);
}

function normalizeExplicitStatTags(candidates?: string[]): string[] {
  if (!Array.isArray(candidates)) {
    return [];
  }
  return candidates
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter((tag) => tag.length > 0);
}

function mergeStatTags(character: SavedCharacter): string[] {
  const explicit = normalizeExplicitStatTags(character.statTags);
  const derived = deriveStatTagsFromStats(character);
  const merged: string[] = [];
  for (const tag of [...explicit, ...derived]) {
    if (!merged.includes(tag)) {
      merged.push(tag);
    }
  }
  return merged;
}

interface SavedCharacterToResidentOptions {
  defaultFatigue?: number;
}

const normalizeUrl = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function savedCharacterToResident(
  character: SavedCharacter,
  options?: SavedCharacterToResidentOptions,
): ResidentState {
  const statBlock = character.statBlock ?? {} as Record<string, number>;
  const hpValue = typeof statBlock.hp === 'number' && Number.isFinite(statBlock.hp) ? statBlock.hp : FALLBACK_MAX_HP;
  const defaultFatigue =
    typeof options?.defaultFatigue === 'number' && Number.isFinite(options.defaultFatigue) ? options.defaultFatigue : 0;
  const resolvedStatSnapshot =
    character.statSnapshot && Object.keys(character.statSnapshot).length > 0
      ? { ...character.statSnapshot }
      : { ...statBlock };
  const resolvedStatTags = mergeStatTags(character);
  const resolvedFatigue =
    typeof character.fatigue === 'number' && Number.isFinite(character.fatigue) ? character.fatigue : defaultFatigue;
  const resolvedCurrentHp =
    typeof character.currentHp === 'number' && Number.isFinite(character.currentHp) ? character.currentHp : hpValue;
  const resolvedMaxHp =
    typeof character.maxHp === 'number' && Number.isFinite(character.maxHp) ? character.maxHp : hpValue;
  // Map legacy character data to visual profiles for proper portrait resolution
  const mappedVisualProfileId = character.visualProfileId ?? mapCharacterToVisualProfile(character);
  const mappedStatProfileId = character.statProfileId ?? character.aiBehavior ?? mapCharacterToStatProfile(character);

  const baseResident: ResidentState = {
    id: character.id,
    displayName: character.name,
    status: character.status ?? 'available',
    fatigue: resolvedFatigue,
    statProfileId: mappedStatProfileId,
    visualProfileId: mappedVisualProfileId,
    portraitUrl: character.portraitUrl,
    fullFigureUrl: character.fullFigureUrl,
    portraitCrop: character.portraitCrop,
    statTags: resolvedStatTags.length ? resolvedStatTags : undefined,
    statSnapshot: resolvedStatSnapshot,
    currentHp: resolvedCurrentHp,
    maxHp: resolvedMaxHp,
    isHero: character.isHero ?? false,
    isInjured: character.isInjured ?? false,
    injuryRecoveryTime: character.injuryRecoveryTime,
    survivalCount: character.survivalCount ?? 0,
    survivalScore: character.survivalScore ?? 0,
  };

  const resolvedPortrait = resolveResidentPortrait(baseResident);

  // Generate a unique placeholder only when no explicit/profile portrait exists.
  const hash = baseResident.id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'lime', 'magenta'];
  const color = colors[Math.abs(hash) % colors.length];
  const uniquePortraitUrl = `data:image/svg+xml,${encodeURIComponent(
    `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="${color}"/></svg>`,
  )}`;
  const resolvedPortraitUrl =
    normalizeUrl(resolvedPortrait.portraitUrl) ?? uniquePortraitUrl;

  // Return resident with resolved portrait URL instead of stale raw URL
  return {
    ...baseResident,
    portraitUrl: resolvedPortraitUrl,
    fullFigureUrl: baseResident.fullFigureUrl ?? resolvedPortrait.fullFigureUrl,
    portraitCrop: baseResident.portraitCrop ?? resolvedPortrait.crop,
  };
}

interface LoadResidentsOptions {
  config?: IdleVillageConfig;
}

/**
 * Transform ResidentState to MinimalResident for store compatibility.
 * This bridges the canonical resident source with the minimal gameplay store.
 */
export function residentStateToMinimalResident(resident: ResidentState): MinimalResident {
  return {
    id: resident.id,
    name: resident.displayName,
    stats: resident.statSnapshot ? Object.fromEntries(
      Object.entries(resident.statSnapshot).filter(([, value]) => typeof value === 'number')
    ) as Record<string, number> : {},
    fatigue: resident.fatigue,
    isWorking: false, // Determined by store state
    isInjured: resident.isInjured,
    isHero: resident.isHero,
    level: 1, // Default level for minimal gameplay
  };
}

export function loadResidentsFromCharacterManager(options?: LoadResidentsOptions): ResidentState[] {
  const defaultFatigue =
    options?.config && options.config.globalRules
      ? getStartingResidentFatigue(options.config)
      : undefined;
  return loadCharacters().map((character) => savedCharacterToResident(character, { defaultFatigue }));
}
