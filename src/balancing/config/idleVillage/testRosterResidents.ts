import type { SavedCharacter } from '@/engine/idle/characterTypes';
import type { StatBlock } from '@/balancing/types';
import { DEFAULT_STATS } from '@/balancing/types';

const createStatBlock = (overrides: Partial<StatBlock>): StatBlock => ({
  ...DEFAULT_STATS,
  ...overrides,
});

const DEFAULT_TIMESTAMP = 1769160000000; // 2026-01-24T00:00:00.000Z

export const TEST_ROSTER_HEROES: SavedCharacter[] = [
  {
    id: 'hero-sir-spaccaculi',
    name: 'Sir Spaccaculi',
    aiBehavior: 'tank',
    statBlock: createStatBlock({
      hp: 280,
      damage: 24,
      txc: 22,
      evasion: 6,
      agility: 42,
      armor: 35,
      resistance: 18,
      block: 28,
    }),
    equippedSpellIds: [],
    visualProfileId: 'hero-tank',
    status: 'available',
    fatigue: 0,
    currentHp: 280,
    maxHp: 280,
    isInjured: false,
    statProfileId: 'hero-tank',
    statSnapshot: { hp: 280 },
    statTags: ['fortitude', 'warden'],
    isHero: true,
    survivalCount: 7,
    survivalScore: 540,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
  {
    id: 'hero-salvatrice',
    name: 'Salvatrice',
    aiBehavior: 'support',
    statBlock: createStatBlock({
      hp: 210,
      damage: 18,
      txc: 28,
      evasion: 8,
      agility: 60,
      ward: 24,
      regen: 9,
      resistance: 20,
    }),
    equippedSpellIds: [],
    visualProfileId: 'hero-support',
    status: 'available',
    fatigue: 0,
    currentHp: 210,
    maxHp: 210,
    isInjured: false,
    statProfileId: 'hero-support',
    statSnapshot: { hp: 210 },
    statTags: ['ward', 'clarity'],
    isHero: true,
    survivalCount: 6,
    survivalScore: 420,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
  {
    id: 'hero-giggiolillo',
    name: 'Giggiolillo',
    aiBehavior: 'dps',
    statBlock: createStatBlock({
      hp: 195,
      damage: 34,
      txc: 30,
      evasion: 12,
      agility: 72,
      critChance: 12,
      critMult: 2.1,
      movementSpeed: 125,
    }),
    equippedSpellIds: [],
    visualProfileId: 'hero-assassin',
    status: 'available',
    fatigue: 0,
    currentHp: 195,
    maxHp: 195,
    isInjured: false,
    statProfileId: 'hero-assassin',
    statSnapshot: { hp: 195 },
    statTags: ['edge', 'precision'],
    isHero: true,
    survivalCount: 5,
    survivalScore: 360,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
];

/**
 * TEST_ROSTER_VILLAGERS — three popolani (non-hero) records in the same
 * `SavedCharacter` shape the Character Manager writes. They flow through
 * `savedCharacterToResident` exactly like a hand-created resident
 * (character_resident_trusted.md). Popolani, non eroi: hp 50 base e ogni
 * stat al massimo DEFAULT+10 (R-139). Tagged to cover the goblin OPTIONAL
 * slots:
 *   member-1  (edge | fortitude | warden)  → villager-mastro-beppe 'fortitude'
 *   member-2  (precision | clarity)        → villager-lisetta      'precision'
 *   bodyguard (warden | fortitude)         → villager-baldassarre  'warden'
 * `aiBehavior: 'random'` keeps them out of the hero stat profiles.
 *
 * R-268 (Director): display names are medieval-Italian popolani names —
 * Bertoldo (carpenter), Lisetta (seamstress), Manno (butcher). The resident
 * ids keep the historical slugs so persisted consequences merge by id;
 * `visualProfileId` points at the trade-portrait profiles in
 * `residentVisuals.ts` (full art + generated medal square).
 */
export const TEST_ROSTER_VILLAGERS: SavedCharacter[] = [
  {
    id: 'villager-mastro-beppe',
    name: 'Bertoldo',
    aiBehavior: 'random',
    statBlock: createStatBlock({
      hp: 50,
      damage: 30,
      txc: 30,
      evasion: 5,
      armor: 10,
    }),
    equippedSpellIds: [],
    visualProfileId: 'villager-bertoldo',
    status: 'available',
    fatigue: 0,
    currentHp: 50,
    maxHp: 50,
    isInjured: false,
    statSnapshot: { hp: 50 },
    statTags: ['fortitude'],
    isHero: false,
    survivalCount: 1,
    survivalScore: 40,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
  {
    id: 'villager-lisetta',
    name: 'Lisetta',
    aiBehavior: 'random',
    statBlock: createStatBlock({
      hp: 50,
      damage: 20,
      txc: 35,
      evasion: 10,
      critChance: 10,
    }),
    equippedSpellIds: [],
    visualProfileId: 'villager-lisetta',
    status: 'available',
    fatigue: 0,
    currentHp: 50,
    maxHp: 50,
    isInjured: false,
    statSnapshot: { hp: 50 },
    statTags: ['precision'],
    isHero: false,
    survivalCount: 1,
    survivalScore: 30,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
  {
    id: 'villager-baldassarre',
    name: 'Manno',
    aiBehavior: 'random',
    statBlock: createStatBlock({
      hp: 50,
      damage: 22,
      txc: 20,
      armor: 10,
      block: 10,
    }),
    equippedSpellIds: [],
    visualProfileId: 'villager-manno',
    status: 'available',
    fatigue: 0,
    currentHp: 50,
    maxHp: 50,
    isInjured: false,
    statSnapshot: { hp: 50 },
    statTags: ['warden'],
    isHero: false,
    survivalCount: 1,
    survivalScore: 45,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
];

/** The full test roster: heroes first, villagers after — the list every
 *  consumer (`canonicalResidentData`, the minimal store bootstrap) reads. */
export const TEST_ROSTER_RESIDENTS: SavedCharacter[] = [
  ...TEST_ROSTER_HEROES,
  ...TEST_ROSTER_VILLAGERS,
];
