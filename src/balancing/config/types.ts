/**
 * Defines a stat in the balancer system, including its properties and constraints.
 */
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

/**
 * Defines a card in the balancer system, grouping related stats.
 */
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

/**
 * Represents a preset configuration for the balancer, including weights and metadata.
 */
export interface BalancerPreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  isBuiltIn: boolean;
  createdAt: string;
  modifiedAt: string;
}

/**
 * The complete configuration for the balancer system, including stats, cards, and presets.
 */
export interface BalancerConfig {
  version: string;
  stats: Record<string, StatDefinition>;
  cards: Record<string, CardDefinition>;
  presets: Record<string, BalancerPreset>;
  activePresetId: string;
}

/**
 * A snapshot of the balancer configuration at a specific point in time.
 */
export interface ConfigSnapshot {
  timestamp: number;
  config: BalancerConfig;
  description: string;
}

/**
 * Defines the kinds of tactical actions available in the game.
 */
export type TacticalActionKind =
  | 'move'
  | 'attack'
  | 'overwatch'
  | 'hunker'
  | 'interact'
  | 'ability';

/**
 * Configuration for a tactical action, defining its properties and costs.
 */
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

/**
 * Defines the types of tactical objectives available in missions.
 */
export type TacticalObjectiveType =
  | 'eliminateAllEnemies'
  | 'extractUnit'
  | 'survive'
  | 'reachArea';

/**
 * Configuration for a tactical objective in a mission.
 */
export interface TacticalObjectiveConfig {
  id: string;
  type: TacticalObjectiveType;
  description: string;
  isPrimary: boolean;
}

/**
 * Configuration for a squad member in a tactical mission.
 */
export interface TacticalSquadMemberConfig {
  id: string; // Archetype ID, character ID, o simile
  spawnX?: number;
  spawnY?: number;
  roleHint?: string;
}

/**
 * Configuration for a squad in a tactical mission.
 */
export interface TacticalSquadConfig {
  id: string;
  label: string;
  team: 'player' | 'enemy';
  members: TacticalSquadMemberConfig[];
}

/**
 * Defines the kinds of tactical missions available.
 */
export type TacticalMissionKind =
  | 'engagement'
  | 'assassination'
  | 'defense'
  | 'escort'
  | 'survival';

/**
 * Configuration for a tactical mission, including squads, objectives, and settings.
 */
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
