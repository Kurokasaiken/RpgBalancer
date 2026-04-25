import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StatBlock } from '../src/balancing/types';
import { DEFAULT_STATS } from '../src/balancing/types';
import type { SavedCharacter } from '../src/engine/idle/characterStorage';

/**
 * Slice of the Punch Club preset seed describing a single resident entry.
 */
interface PunchClubResidentSeed {
  id: string;
  displayName: string;
  status: 'available' | 'away' | 'injured' | 'exhausted' | 'dead';
  fatigue: number;
  currentHp: number;
  maxHp: number;
  isHero?: boolean;
  isInjured?: boolean;
  survivalCount?: number;
  survivalScore?: number;
  statTags?: string[];
  statSnapshot?: Record<string, number>;
}

/**
 * JSON payload shape stored under data/presets/punch_club_light.json.
 */
interface PunchClubPresetSeedFile {
  residents: PunchClubResidentSeed[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const presetSeedPath = path.join(repoRoot, 'data/presets/punch_club_light.json');
const outputPath = path.join(repoRoot, 'data/characters.json');

/**
 * Attempts to read/parse a JSON file, returning the provided fallback if it is missing.
 */
const readJsonFile = async <T>(filePath: string, fallbackValue: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallbackValue;
    }
    throw error;
  }
};

/**
 * Serializes JSON with deterministic indentation plus a trailing newline.
 */
const writeJsonFile = async (filePath: string, payload: unknown): Promise<void> => {
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(filePath, serialized, 'utf-8');
};

/**
 * Produces a deep clone of DEFAULT_STATS to avoid shared references.
 */
const cloneDefaultStats = (): StatBlock => JSON.parse(JSON.stringify(DEFAULT_STATS));

/**
 * Best-effort heuristic for mapping stat tags to an AI behavior.
 */
const inferBehavior = (resident: PunchClubResidentSeed): SavedCharacter['aiBehavior'] => {
  const tags = resident.statTags ?? [];
  if (tags.includes('punch_ring') || tags.includes('edge')) {
    return 'dps';
  }
  if (tags.includes('punch_gym') || tags.includes('discipline') || tags.includes('guard') || tags.includes('vanguard')) {
    return 'tank';
  }
  if (tags.includes('reason') || tags.includes('scholar') || tags.includes('lantern')) {
    return 'support';
  }
  return 'random';
};

/**
 * Builds a SavedCharacter-compatible stat block using defaults plus HP overrides.
 */
const buildStatBlock = (resident: PunchClubResidentSeed): StatBlock => {
  const statBlock = cloneDefaultStats();
  const hpOverride = resident.statSnapshot?.hp ?? resident.maxHp ?? statBlock.hp;
  if (typeof hpOverride === 'number' && Number.isFinite(hpOverride)) {
    statBlock.hp = hpOverride;
  }
  return statBlock;
};

/**
 * Converts the Punch Club resident seed object into a SavedCharacter record.
 */
const mapResidentToSavedCharacter = (resident: PunchClubResidentSeed): SavedCharacter => ({
  id: resident.id,
  name: resident.displayName,
  aiBehavior: inferBehavior(resident),
  statBlock: buildStatBlock(resident),
  equippedSpellIds: [],
  visualProfileId: undefined,
  portraitUrl: undefined,
  fullFigureUrl: undefined,
  portraitCrop: undefined,
  status: resident.status,
  fatigue: resident.fatigue,
  currentHp: resident.currentHp,
  maxHp: resident.maxHp,
  isInjured: Boolean(resident.isInjured),
  injuryRecoveryTime: undefined,
  statProfileId: undefined,
  statSnapshot: resident.statSnapshot ? { ...resident.statSnapshot } : undefined,
  statTags: resident.statTags ? [...resident.statTags] : undefined,
  isHero: Boolean(resident.isHero),
  survivalCount: resident.survivalCount ?? 0,
  survivalScore: resident.survivalScore ?? 0,
  lastUpdated: Date.now(),
});

/**
 * Merges converted Punch Club residents with the current SavedCharacter snapshot.
 */
const mergeSavedCharacters = (existing: SavedCharacter[], imported: SavedCharacter[]) => {
  const merged = [...existing];
  let added = 0;
  let updated = 0;

  imported.forEach((character) => {
    const index = merged.findIndex((entry) => entry.id === character.id);
    if (index >= 0) {
      merged[index] = character;
      updated += 1;
    } else {
      merged.push(character);
      added += 1;
    }
  });

  return { merged, added, updated };
};

/**
 * Loads punch_club_light.json, converts the resident list, and merges it into data/characters.json.
 */
async function migratePunchClubResidents(): Promise<void> {
  const parsed = await readJsonFile<PunchClubPresetSeedFile>(presetSeedPath, { residents: [] });
  const residents = parsed.residents ?? [];
  if (residents.length === 0) {
    throw new Error('Punch Club seed file does not contain any residents.');
  }

  const savedCharacters = residents.map(mapResidentToSavedCharacter);
  const existingCharacters = await readJsonFile<SavedCharacter[]>(outputPath, []);
  const { merged, added, updated } = mergeSavedCharacters(existingCharacters, savedCharacters);

  if (added === 0 && updated === 0) {
    console.info('[migratePunchClubResidents] No changes detected; existing roster already includes Punch Club residents.');
    return;
  }

  await writeJsonFile(outputPath, merged);

  console.info(
    `[migratePunchClubResidents] Updated data/characters.json (added ${added}, updated ${updated}, total ${merged.length}).`,
  );
}

migratePunchClubResidents().catch((error) => {
  console.error('[migratePunchClubResidents] Failed:', error);
  process.exitCode = 1;
});
