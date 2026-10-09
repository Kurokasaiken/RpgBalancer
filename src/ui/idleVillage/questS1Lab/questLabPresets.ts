/**
 * questLabPresets — lab-only party fixtures for the S1 quest lab.
 *
 * PLAN-019-S2.1: the scenario content of «Sterminio dei goblin» and «Le
 * Rovine sotto il Fiume» moved to the canonical config modules
 * (`src/balancing/config/idleVillage/quests/scenarios/*`, Zod-parsed at
 * import). These presets are NOT production data — the real party comes from
 * the roster via S2.2's `residentToQuestMember`. They exist so the lab pages,
 * the theatre adapter tests and the Monte Carlo harness keep a stable party.
 */

import type { PartyPreset } from './questScenario';

/**
 * Goblin preset — Forza-based, hero + three members (positional slots).
 * Stats mirror the scenario's `offer.referenceParty` calibration party.
 */
export const GOBLIN_PRESETS: PartyPreset[] = [
  {
    id: 'gob-band',
    label: 'Banda — l’eroe e la sua scorta',
    description: 'Eroe davanti, tre compagni dietro: il rischio vive in coda.',
    gold: 0,
    members: [
      { id: 'g1', name: 'Edda', role: 'leader', hp: 100, stats: { str: 70, con: 60, agi: 45, perc: 40, int: 35, cha: 40 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g2', name: 'Milo', role: 'member', hp: 60, stats: { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g3', name: 'Bruna', role: 'member', hp: 60, stats: { str: 65, con: 60, agi: 40, perc: 35, int: 30, cha: 30 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g4', name: 'Kran', role: 'bodyguard', hp: 60, stats: { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
];

/**
 * Rovine presets — the mockup party is Eroe (leader, +25% on the quest's
 * primary stat, baked into the numbers below) plus three ordinary villagers.
 * Second preset = same shape, weaker hero: the delta between party stats and
 * quest requirements IS the difficulty.
 */
export const ROVINE_PRESETS: PartyPreset[] = [
  {
    id: 'rv-eroe',
    label: 'Eroe + Villager — il mockup',
    description: 'Eroe forte in Forza (+25% sulla primaria), tre villager ordinari.',
    gold: 0,
    members: [
      { id: 'r1', name: 'Aldric', role: 'leader', stats: { str: 90, con: 72, agi: 40, perc: 45, int: 35, cha: 50 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'r2', name: 'Pietro', role: 'member', stats: { str: 45, con: 50, agi: 45, perc: 40, int: 35, cha: 40 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'r3', name: 'Sara', role: 'member', stats: { str: 35, con: 45, agi: 60, perc: 55, int: 45, cha: 50 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'r4', name: 'Nando', role: 'member', stats: { str: 50, con: 55, agi: 35, perc: 35, int: 30, cha: 30 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
  {
    id: 'rv-gracile',
    label: 'Party debole — stessa quest, più letale',
    description: 'Nessun muscolo vero: il delta fra requisiti e party decide quanto costa.',
    gold: 0,
    members: [
      { id: 'g1', name: 'Berta', role: 'leader', stats: { str: 45, con: 40, agi: 55, perc: 70, int: 60, cha: 55 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g2', name: 'Ugo', role: 'member', stats: { str: 40, con: 35, agi: 60, perc: 50, int: 55, cha: 45 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g3', name: 'Lia', role: 'member', stats: { str: 30, con: 30, agi: 50, perc: 60, int: 50, cha: 60 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g4', name: 'Doro', role: 'member', stats: { str: 35, con: 45, agi: 40, perc: 45, int: 40, cha: 35 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
];
