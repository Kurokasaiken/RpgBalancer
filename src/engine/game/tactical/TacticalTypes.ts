export type TacticalActionKind =
  | 'move'
  | 'attack'
  | 'overwatch'
  | 'hunker'
  | 'interact'
  | 'ability';

export interface TacticalActionDefinition {
  id: string;
  kind: TacticalActionKind;
  label: string;
  description?: string;
  baseApCost: number;
  minRange?: number;
  maxRange?: number;
  requiresLineOfSight?: boolean;
  endsTurn?: boolean;
}

export type CoverType = 'none' | 'half' | 'full';

export type TileTerrainType = 'normal' | 'highGround' | 'lowGround' | 'difficult' | 'hazard';

export type VisibilityState = 'unknown' | 'fogged' | 'visible';

export type TacticalMissionKind =
  | 'engagement'
  | 'assassination'
  | 'defense'
  | 'escort'
  | 'survival';

export type TacticalObjectiveType =
  | 'eliminateAllEnemies'
  | 'extractUnit'
  | 'survive'
  | 'reachArea';

export interface TacticalObjectiveConfig {
  id: string;
  type: TacticalObjectiveType;
  description: string;
  isPrimary: boolean;
}

export interface TacticalSquadMemberRef {
  id: string; // Archetype ID, character ID, o simile
  spawnX?: number;
  spawnY?: number;
  roleHint?: string;
}

export interface TacticalSquadConfig {
  id: string;
  label: string;
  team: 'player' | 'enemy';
  members: TacticalSquadMemberRef[];
}

export interface TacticalMissionConfig {
  id: string;
  name: string;
  kind: TacticalMissionKind;
  description?: string;
  mapId: string;
  squads: TacticalSquadConfig[];
  objectives: TacticalObjectiveConfig[];
  turnLimit?: number;
  allowReinforcements?: boolean;
}

export type TacticalMissionOutcome = 'victory' | 'defeat' | 'draw' | 'aborted';

export interface TacticalMissionResult {
  missionId: string;
  outcome: TacticalMissionOutcome;
  turnsTaken: number;
  // Aggregated metrics utili al balancer
  totalDamageDealtByPlayer: number;
  totalDamageTakenByPlayer: number;
}
