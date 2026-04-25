import type { STSDeckPreset } from '../types';

export const RESONANT_INITIATE_DECK: STSDeckPreset = {
  id: 'resonant_initiate',
  label: 'Resonant Initiate',
  handSize: 5,
  drawPerTurn: 2,
  basePlayerHp: 70,
  baseEnemyHp: 80,
  inspirationPerTurn: 1,
  inspirationDecay: 0.5,
  maxTurns: 20,
  manaGrowth: {
    alteration: 2,
    bio: 1,
    wave: 1,
    entropy: 1,
  },
  cards: [
    {
      id: 'fracture_biotica',
      name: 'Frattura Biotica',
      summary: '12 dmg + Poison if Inspiration ≥ 2',
      manaCost: { alteration: 2, bio: 1 },
      effect: {
        type: 'attack',
        value: 12,
        statusEffect: 'poison',
        inspirationScaling: true,
      },
      rebellionTimer: 3,
      tags: ['strike'],
    },
    {
      id: 'aegis_loop',
      name: 'Aegis Loop',
      summary: 'Gain 10 block',
      manaCost: { wave: 1 },
      effect: {
        type: 'block',
        value: 10,
      },
      rebellionTimer: 4,
      tags: ['block'],
    },
    {
      id: 'pulse_of_suns',
      name: 'Pulse of Suns',
      summary: '+2 Inspiration',
      manaCost: { entropy: 1 },
      effect: {
        type: 'inspiration',
        value: 2,
      },
      rebellionTimer: 2,
      tags: ['buff'],
    },
    {
      id: 'flux_channel',
      name: 'Flux Channel',
      summary: 'Draw 1 card & +1 Inspiration',
      manaCost: { alteration: 1 },
      effect: {
        type: 'draw',
        value: 1,
        inspirationScaling: true,
      },
      rebellionTimer: 2,
      tags: ['utility'],
    },
    {
      id: 'mind_spike',
      name: 'Mind Spike',
      summary: 'Deal 8 damage',
      manaCost: { bio: 1 },
      effect: {
        type: 'attack',
        value: 8,
      },
      rebellionTimer: 3,
      tags: ['strike'],
    },
  ],
};
