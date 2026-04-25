/**
 * Test Residents - Shared test data for roster testing
 * 
 * These are the same hardcoded residents used by TestRosterPage
 * when localStorage is empty. Extracted for reuse in minimal-gameplay.
 */

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export const TEST_RESIDENTS: ResidentState[] = [
  {
    id: 'test-resident-1',
    displayName: 'Sir Spaccaculi',
    status: 'available',
    fatigue: 0,
    currentHp: 280,
    maxHp: 280,
    statSnapshot: { hp: 280, damage: 24, txc: 22, evasion: 6, agility: 42, armor: 35, resistance: 18, block: 28 },
    isHero: true,
    isInjured: false,
    survivalCount: 7,
    survivalScore: 540,
    statProfileId: 'tank',
    visualProfileId: 'hero-tank',
    portraitUrl: undefined,
    injuryRecoveryTime: undefined,
    fullFigureUrl: undefined,
    portraitCrop: undefined,
    statTags: ['fortitude', 'warden'],
  },
  {
    id: 'test-resident-2',
    displayName: 'Salvatrice',
    status: 'available',
    fatigue: 0,
    currentHp: 210,
    maxHp: 210,
    statSnapshot: { hp: 210, damage: 18, txc: 28, evasion: 8, agility: 60, ward: 24, regen: 9, resistance: 20 },
    isHero: true,
    isInjured: false,
    survivalCount: 6,
    survivalScore: 420,
    statProfileId: 'support',
    visualProfileId: 'hero-support',
    portraitUrl: undefined,
    injuryRecoveryTime: undefined,
    fullFigureUrl: undefined,
    portraitCrop: undefined,
    statTags: ['ward', 'clarity'],
  },
  {
    id: 'test-resident-3',
    displayName: 'Giggiolillo',
    status: 'available',
    fatigue: 0,
    currentHp: 195,
    maxHp: 195,
    statSnapshot: { hp: 195, damage: 34, txc: 30, evasion: 12, agility: 72, critChance: 12, critMult: 2.1, movementSpeed: 125 },
    isHero: true,
    isInjured: false,
    survivalCount: 5,
    survivalScore: 360,
    statProfileId: 'dps',
    visualProfileId: 'hero-assassin',
    portraitUrl: undefined,
    injuryRecoveryTime: undefined,
    fullFigureUrl: undefined,
    portraitCrop: undefined,
    statTags: ['edge', 'precision'],
  },
];
