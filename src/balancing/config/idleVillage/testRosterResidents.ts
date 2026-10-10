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
 * (character_resident_trusted.md) — weaker than the heroes and tagged to
 * cover the goblin OPTIONAL slots:
 *   member-1  (edge | fortitude | warden)  → mastro-beppe  'fortitude'
 *   member-2  (precision | clarity)        → lisetta       'precision'
 *   bodyguard (warden | fortitude)         → baldassarre   'warden'
 * `aiBehavior: 'random'` keeps them out of the hero visual profiles — the
 * placeholder profile yields the deterministic badge portrait.
 */
export const TEST_ROSTER_VILLAGERS: SavedCharacter[] = [
  {
    id: 'villager-mastro-beppe',
    name: 'Mastro Beppe',
    aiBehavior: 'random',
    statBlock: createStatBlock({
      hp: 200,
      damage: 14,
      txc: 16,
      evasion: 5,
      armor: 12,
    }),
    equippedSpellIds: [],
    visualProfileId: 'fallback_placeholder_profile',
    status: 'available',
    fatigue: 0,
    currentHp: 200,
    maxHp: 200,
    isInjured: false,
    statSnapshot: { hp: 200 },
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
      hp: 160,
      damage: 11,
      txc: 24,
      evasion: 10,
      critChance: 8,
    }),
    equippedSpellIds: [],
    visualProfileId: 'fallback_placeholder_profile',
    status: 'available',
    fatigue: 0,
    currentHp: 160,
    maxHp: 160,
    isInjured: false,
    statSnapshot: { hp: 160 },
    statTags: ['precision'],
    isHero: false,
    survivalCount: 1,
    survivalScore: 30,
    lastUpdated: DEFAULT_TIMESTAMP,
  },
  {
    id: 'villager-baldassarre',
    name: 'Baldassarre',
    aiBehavior: 'random',
    statBlock: createStatBlock({
      hp: 230,
      damage: 13,
      txc: 15,
      evasion: 4,
      armor: 18,
    }),
    equippedSpellIds: [],
    visualProfileId: 'fallback_placeholder_profile',
    status: 'available',
    fatigue: 0,
    currentHp: 230,
    maxHp: 230,
    isInjured: false,
    statSnapshot: { hp: 230 },
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
