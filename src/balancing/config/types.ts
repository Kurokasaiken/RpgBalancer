export interface StatDefinition {
  id: string;
  label: string;
  description?: string;
  type: 'number' | 'percentage';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  weight: number;
  isCore: boolean;
  isDerived: boolean;
  formula?: string;
  bgColor?: string;
  isLocked?: boolean;
  isHidden?: boolean;
  icon?: string;
  isPenalty?: boolean;
  /** Whether this stat is part of the human base stat kit used for growth/quests */
  baseStat?: boolean;
  /** Marks stats that should only benefit heroes (detrimental in quests) */
  isDetrimental?: boolean;
}

export interface CardDefinition {
  id: string;
  title: string;
  color: string;
  icon?: string;
  statIds: string[];
  isCore: boolean;
  order: number;
   isLocked?: boolean;
   isHidden?: boolean;
}

export interface BalancerPreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  isBuiltIn: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface BalancerConfig {
  version: string;
  stats: Record<string, StatDefinition>;
  cards: Record<string, CardDefinition>;
  presets: Record<string, BalancerPreset>;
  activePresetId: string;
}

export interface ConfigSnapshot {
  timestamp: number;
  config: BalancerConfig;
  description: string;
}

export type TacticalActionKind =
  | 'move'
  | 'attack'
  | 'overwatch'
  | 'hunker'
  | 'interact'
  | 'ability';

export interface TacticalActionConfig {
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

export interface TacticalSquadMemberConfig {
  id: string; // Archetype ID, character ID, o simile
  spawnX?: number;
  spawnY?: number;
  roleHint?: string;
}

export interface TacticalSquadConfig {
  id: string;
  label: string;
  team: 'player' | 'enemy';
  members: TacticalSquadMemberConfig[];
}

export type TacticalMissionKind =
  | 'engagement'
  | 'assassination'
  | 'defense'
  | 'escort'
  | 'survival';

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
