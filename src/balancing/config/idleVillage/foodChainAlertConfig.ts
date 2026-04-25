import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

/**
 * Food chain alert severity levels.
 */
export type FoodChainAlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Configurable thresholds that drive the CLI + analytics behavior.
 * Keeping them in a dedicated config module prevents magic numbers in scripts.
 */
export interface FoodChainAlertThresholds {
  /** Days of food stock below which the system raises a critical alert. */
  minimumDaysOfFoodCritical: number;
  /** Days of food stock below which the system raises a warning alert. */
  minimumDaysOfFoodWarning: number;
  /**
   * Percentage (0-1) of production deficit (consumption - production) that triggers a warning.
   * Example: 0.15 => alert when production is 15% lower than consumption.
   */
  productionDeficitPercent: number;
  /** Consecutive deficit days needed before escalation to a critical alert. */
  consecutiveDeficitDaysCritical: number;
  /** Consecutive deficit days needed before creating a warning alert. */
  consecutiveDeficitDaysWarning: number;
  /** Desired buffer expressed as days of food reserves. */
  targetStockpileDays: number;
  /** Cooldown window (in minutes) before repeating the same alert type. */
  alertCooldownMinutes: number;
  /** Maximum alerts that can be emitted per watch interval to avoid flooding channels. */
  maxAlertsPerInterval: number;
}

/**
 * Additional behavioral configuration for the CLI + analytics helper.
 */
export interface FoodChainAlertConfig {
  /** Threshold configuration. */
  thresholds: FoodChainAlertThresholds;
  /**
   * Tags that identify activities contributing directly to food production.
   * Used when converting scheduler KPIs into food production estimates.
   */
  productionActivityTags: string[];
  /** Activity IDs or tags that consume food beyond resident baseline usage. */
  highConsumptionActivityTags: string[];
  /** Telemetry event/channel name used across scripts + UI diagnostics. */
  telemetryEvent: string;
  /**
   * Default watch loop interval in seconds (used by `--watch` CLI option when no value provided).
   */
  defaultWatchIntervalSeconds: number;
  /**
   * Units of food produced per farming-oriented activity completion (used for scheduler integration).
   */
  foodUnitsPerProductionActivity: number;
}

/**
 * Default config-first values for the Food Chain alert system.
 * These numbers are conservative and meant to be tuned via the Phase 12 plans/UI.
 */
export const DEFAULT_FOOD_CHAIN_ALERT_CONFIG: FoodChainAlertConfig = {
  thresholds: {
    minimumDaysOfFoodCritical: 1,
    minimumDaysOfFoodWarning: 3,
    productionDeficitPercent: 0.15,
    consecutiveDeficitDaysCritical: 2,
    consecutiveDeficitDaysWarning: 1,
    targetStockpileDays: 5,
    alertCooldownMinutes: 15,
    maxAlertsPerInterval: 5,
  },
  productionActivityTags: ['food', 'farming', 'hunting', 'gathering'],
  highConsumptionActivityTags: ['feast', 'festival'],
  telemetryEvent: 'food_chain_alert',
  defaultWatchIntervalSeconds: 30,
  foodUnitsPerProductionActivity: 12,
};

/**
 * Helper that derives per-resident consumption from the active IdleVillageConfig
 * to keep analyzers aware of current balancing numbers.
 */
export const deriveFoodConsumptionPerResident = (
  config: IdleVillageConfig,
): number => config.globalRules.foodConsumptionPerResidentPerDay;
