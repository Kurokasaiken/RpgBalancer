/**
 * Frozen Mock Residents
 *
 * Centralized mock resident data for frozen component kits.
 * Extracted from TestRosterPage.tsx and minimal-* pages.
 *
 * Version: 1.0.0
 * Frozen At: 2026-05-21
 * Source: TestRosterPage.tsx, minimal-pgcard.tsx
 */

import type { ResidentState, ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Mock residents for testing frozen components.
 * These residents cover all visual states and levels.
 */
export const FROZEN_MOCK_RESIDENTS: ResidentState[] = [
  {
    id: 'res_001',
    displayName: 'Elara the Scout',
    portraitUrl: 'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=Elara',
    status: 'available' as ResidentStatus,
    fatigue: 20,
    statProfileId: 'scout_profile',
    visualProfileId: 'elara_visual',
    currentHp: 45,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 8,
  },
  {
    id: 'res_002',
    displayName: 'Ragnar Strongarm',
    portraitUrl: 'https://via.placeholder.com/100/4ECDC4/FFFFFF?text=Ragnar',
    status: 'available' as ResidentStatus,
    fatigue: 45,
    injuryRecoveryTime: 100,
    statProfileId: 'warrior_profile',
    visualProfileId: 'ragnar_visual',
    currentHp: 75,
    maxHp: 120,
    isHero: true,
    isInjured: true,
    survivalCount: 5,
    survivalScore: 15,
  },
  {
    id: 'res_003',
    displayName: 'Lyra the Sage',
    portraitUrl: 'https://via.placeholder.com/100/45B7D1/FFFFFF?text=Lyra',
    status: 'away' as ResidentStatus,
    fatigue: 85,
    statProfileId: 'mage_profile',
    visualProfileId: 'lyra_visual',
    currentHp: 90,
    maxHp: 150,
    isHero: true,
    isInjured: false,
    survivalCount: 10,
    survivalScore: 22,
  },
  {
    id: 'res_004',
    displayName: 'Thorne the Guardian',
    portraitUrl: 'https://via.placeholder.com/100/96CEB4/FFFFFF?text=Thorne',
    status: 'exhausted' as ResidentStatus,
    fatigue: 95,
    statProfileId: 'guardian_profile',
    visualProfileId: 'thorne_visual',
    currentHp: 30,
    maxHp: 110,
    isHero: false,
    isInjured: false,
    survivalCount: 2,
    survivalScore: 12,
  },
  {
    id: 'res_005',
    displayName: 'Seraphina the Healer',
    portraitUrl: 'https://via.placeholder.com/100/FFEAA7/FFFFFF?text=Seraphina',
    status: 'available' as ResidentStatus,
    fatigue: 10,
    statProfileId: 'healer_profile',
    visualProfileId: 'seraphina_visual',
    currentHp: 120,
    maxHp: 140,
    isHero: true,
    isInjured: false,
    survivalCount: 15,
    survivalScore: 25,
  },
];

/**
 * Single resident for isolated testing.
 */
export const FROZEN_SINGLE_RESIDENT: ResidentState = FROZEN_MOCK_RESIDENTS[0];
