/**
 * Stub Buildings section for Idle Village config.
 * This is a placeholder until we add full BuildingDefinition support.
 *
 * Engines do not yet consume the level/upgrade fields – they exist purely
 * as config scaffolding so we can start authoring building progression
 * without hardcoding anything.
 */

/**
 * Describes a single upgrade tier for an Idle Village building.
 */
export interface BuildingLevelDefinition {
  /** Target level for this upgrade tier (e.g. 2, 3, 4...) */
  level: number;
  /** Simple resource map for upgrade costs (resourceId -> amount) */
  costs?: Record<string, number>;
  /** Optional free-form notes for designers/balancers */
  notes?: string;
}

/**
 * Full building metadata editable from config/UI for Idle Village scenarios.
 */
export interface BuildingDefinition {
  id: string;
  label: string;
  description?: string;
  /** Tags describing the building type/purpose (e.g. "house", "job_site", "training", "shop") */
  tags: string[];
  /** Whether this building is present at game start */
  isInitiallyBuilt: boolean;
  /** Optional bonuses provided by this building (future extension) */
  bonuses?: {
    fatigueReductionPerDay?: number;
    jobRewardMultiplier?: number;
    questInjuryChanceReduction?: number;
  };
  /**
   * Optional current/base level of this building for a given scenario.
   * Engines are free to interpret this as they see fit; for now it is
   * informational/scaffolding only.
   */
  level?: number;
  /** Maximum level reachable via upgrades (purely config-driven) */
  maxLevel?: number;
  /**
   * Optional list of upgrade tiers. Each entry defines the target level
   * and the resource costs required to reach it.
   */
  upgrades?: BuildingLevelDefinition[];
  /** UI hints */
  icon?: string;
  colorClass?: string;
}
