/**
 * Stub Buildings section for Idle Village config.
 * This is a placeholder until we add full BuildingDefinition support.
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
  /** UI hints */
  icon?: string;
  colorClass?: string;
}
