import type {
  TacticalActionDefinition,
  TacticalMissionConfig,
  TacticalObjectiveConfig,
  TacticalSquadConfig,
} from '../../engine/game/tactical/TacticalTypes';

// Config centrale per le azioni tattiche di base.
// In fasi successive questa config potrà essere resa editabile da UI.

export const TACTICAL_ACTIONS: Record<string, TacticalActionDefinition> = {
  move: {
    id: 'move',
    kind: 'move',
    label: 'Move',
    description: 'Move to a different tile',
    baseApCost: 1,
    maxRange: 5,
  },
  attack: {
    id: 'attack',
    kind: 'attack',
    label: 'Attack',
    description: 'Make a standard attack against a visible enemy',
    baseApCost: 2,
    minRange: 1,
    maxRange: 8,
    requiresLineOfSight: true,
    endsTurn: false,
  },
  overwatch: {
    id: 'overwatch',
    kind: 'overwatch',
    label: 'Overwatch',
    description: 'Guard an area and react to enemy movement',
    baseApCost: 2,
    maxRange: 8,
    requiresLineOfSight: true,
    endsTurn: true,
  },
  hunker: {
    id: 'hunker',
    kind: 'hunker',
    label: 'Hunker Down',
    description: 'Take a defensive stance, improving survivability this turn',
    baseApCost: 1,
    endsTurn: true,
  },
};

// Missioni tattiche di esempio. In questa fase restano poche e hard-coded
// qui, ma sempre centralizzate in config (non dentro engine o UI).

const ENGAGEMENT_OBJECTIVES: TacticalObjectiveConfig[] = [
  {
    id: 'engage_eliminate_all',
    type: 'eliminateAllEnemies',
    description: 'Eliminate all enemy units on the map.',
    isPrimary: true,
  },
];

const ENGAGEMENT_SQUADS: TacticalSquadConfig[] = [
  {
    id: 'player_squad_default',
    label: 'Player Strike Team',
    team: 'player',
    members: [
      { id: 'archetype_tank', spawnX: 1, spawnY: 3, roleHint: 'frontline' },
      { id: 'archetype_dps', spawnX: 1, spawnY: 4, roleHint: 'damage' },
    ],
  },
  {
    id: 'enemy_squad_patrol',
    label: 'Enemy Patrol',
    team: 'enemy',
    members: [
      { id: 'archetype_brute', spawnX: 6, spawnY: 3, roleHint: 'bruiser' },
      { id: 'archetype_support', spawnX: 6, spawnY: 4, roleHint: 'support' },
    ],
  },
];

export const TACTICAL_MISSIONS: Record<string, TacticalMissionConfig> = {
  test_engagement: {
    id: 'test_engagement',
    name: 'Test Engagement - Small Skirmish',
    kind: 'engagement',
    description: 'Small test skirmish between a player strike team and an enemy patrol.',
    mapId: 'test-urban-engagement',
    squads: ENGAGEMENT_SQUADS,
    objectives: ENGAGEMENT_OBJECTIVES,
    turnLimit: 20,
    allowReinforcements: false,
  },
};
