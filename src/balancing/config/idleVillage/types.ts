// src/balancing/config/idleVillage/types.ts
// Generic, config-first domain types for the Idle Village meta-game.
// No hardcoded job/quest kinds or enums – everything is tag/ID based
// so new content can be added purely via config/UI.

import type { AppNavTabId } from '@/shared/navigation/navConfig';
import type { StatBlock } from '@/balancing/types';

/**
 * Config-driven description of a resource that Idle Village systems can exchange.
 */
export interface ResourceDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  /** Tailwind CSS class for coloring this resource in UI (e.g. "text-amber-300") */
  colorClass?: string;
  /** Reserved for future invariants (e.g. non-removable resources) */
  isCore?: boolean;
}

/**
 * Formula-based delta applied to a specific resource when resolving activities.
 */
export interface ResourceDeltaDefinition {
  /** ID of the resource being modified (must match a ResourceDefinition.id) */
  resourceId: string;
  /**
   * Formula evaluated at runtime (via FormulaEngine or equivalent).
   * Can depend on quest level, character stats, global rules, etc.
   */
  amountFormula: string;
}

/**
 * Constraints describing which resident stat tags are required/prohibited.
 */
export interface StatRequirement {
  /**
   * Resident must possess all of these stat tags.
   * Example: ["discipline","lantern"].
   */
  allOf?: string[];
  /**
   * Resident must match at least one of these tags.
   * Example: ["edge","moth"].
   */
  anyOf?: string[];
  /**
   * Resident must not include any of these tags.
   */
  noneOf?: string[];
  /**
   * Optional human-readable label for UI hinting.
   */
  label?: string;
}

/**
 * Generic activity definition. Covers jobs, quests, training, shop actions, etc.
 * Semantic meaning is derived from tags + resolutionEngineId, not from enums.
 */
export type ActivityMaxSlots = number | 'infinite';

/**
 * Per-slot multipliers applied to residents occupying an activity slot.
 */
export interface ActivitySlotModifier {
  /**
   * Multiplier applied to fatigue accumulation for residents occupying this slot.
   */
  fatigueMult?: number;
  /**
   * Multiplier applied to injury/risk calculations for this slot.
   */
  riskMult?: number;
  /**
   * Multiplier applied to resource yields for this slot.
   */
  yieldMult?: number;
}

export type ActivitySlotModifierMap = Record<number, ActivitySlotModifier>;

/**
 * Declarative definition of jobs, quests, trainings, purchases, etc.
 */
export interface ActivityDefinition {
  id: string;
  label: string;
  description?: string;

  /** Semantic tags: e.g. ["job"], ["quest","combat"], ["training"], ... */
  tags: string[];

  /**
   * Tags describing which MapSlotDefinition can host this activity.
   * Example: ["village_job"], ["world_quest"], ["shop"]
   */
  slotTags: string[];

  /**
   * Identifier for the resolver/engine used to execute this activity.
   * Example: "job", "quest_dispatch", "quest_combat" – purely string-based.
   */
  resolutionEngineId: string;

  /**
   * Optional recommended level of a "typical" character for this activity
   * (used especially for quests). Purely informational for some engines.
   */
  level?: number;

  /** Approximate danger rating used for injury probabilities (0 = safe). */
  dangerRating?: number;

  /** Core activity duration (excluding travel), as a formula string */
  durationFormula?: string;

  /** Optional travel time to the activity location */
  travelTimeToFormula?: string;

  /** Optional travel time back from the activity location */
  travelTimeFromFormula?: string;

  /** Resource costs paid when scheduling / resolving the activity */
  costs?: ResourceDeltaDefinition[];

  /** Base resource rewards produced by the activity (before variance) */
  rewards?: ResourceDeltaDefinition[];

  /** Optional base XP formula, typically a function of `level` */
  baseXpFormula?: string;
  /**
   * Optional stat requirement that every assigned resident must satisfy.
   * Used by scheduling UIs to validate drops.
   */
  statRequirement?: StatRequirement;

  /**
   * Optional whitelists for variance categories.
   * If unset, all defined categories are eligible.
   */
  allowedDifficultyCategoryIds?: string[];
  allowedRewardCategoryIds?: string[];

  /** Open extension point for domain-specific data */
  metadata?: Record<string, unknown>;
  /**
   * Maximum concurrent residents that can occupy this activity.
   * Use 'infinite' to preserve the legacy "no limit" behavior.
   */
  maxSlots?: ActivityMaxSlots;
  /**
   * Optional per-slot modifiers applied when residents occupy a specific slot index.
   * Keys are zero-based slot indexes.
   */
  slotModifiers?: ActivitySlotModifierMap;
}

/**
 * Named range representing difficulty or reward multipliers for variance rolls.
 */
export interface ActivityRollCategory {
  id: string;
  label: string;
  description?: string;
  /** Tailwind class for visual indicator (e.g. green/yellow/red) */
  colorClass?: string;
  icon?: string;
  /** Tooltip text to explain the meaning of this category in UI */
  tooltip?: string;
  /** Inclusive lower bound of the multiplier range */
  minMultiplier: number;
  /** Inclusive upper bound of the multiplier range */
  maxMultiplier: number;
  /** Relative weight when sampling this category */
  weight: number;
}

/**
 * Bundled configuration describing difficulty/reward randomization buckets.
 */
export interface ActivityVarianceConfig {
  /** Difficulty scaling categories (e.g. under-tuned, normal, overtuned) */
  difficultyCategories: Record<string, ActivityRollCategory>;
  /** Reward scaling categories (e.g. underpaid, normal, well_paid) */
  rewardCategories: Record<string, ActivityRollCategory>;
}

/**
 * Config describing a resident injury tier and its gameplay multipliers.
 */
export interface InjuryTierDefinition {
  id: string;
  label: string;
  description?: string;
  /** Days required before this injury naturally recovers (integer time units / day) */
  recoveryTimeInDays: number;
  /** Optional multiplier applied to job payouts while the resident is injured */
  jobEfficiencyMultiplier?: number;
  /** Whether the resident can join quests while in this tier */
  questEligibility?: 'full' | 'limited' | 'none';
  /** Optional multiplier applied to fatigue accumulation */
  fatigueGainMultiplier?: number;
  /** Optional Tailwind class for UI indicators */
  colorClass?: string;
}

/**
 * Global death rate config used by quest resolution when computing mortality.
 */
export interface DeathRules {
  /** Base probability of death at maximum danger before modifiers */
  baseDeathChanceAtMaxDanger: number;
  /** Additional death chance per point of activity danger */
  dangerDeathMultiplierPerPoint: number;
  /** Multipliers applied per injury tier id (light/moderate/severe, etc.) */
  injuryTierMultipliers?: Record<string, number>;
  /**
   * Optional adjustments keyed by quest outcome (e.g. success/partial/fail/deadly),
   * where the value is an additive modifier applied to the final death chance.
   */
  questOutcomeAdjustments?: Record<string, number>;
  /** Chance per in-game day that starving residents die */
  starvationDeathChancePerDay?: number;
}

export interface VerbToneColors {
  neutral?: string;
  job?: string;
  quest?: string;
  danger?: string;
  system?: string;
}

export interface PassiveEffectDefinition {
  id: string;
  label: string;
  description?: string;
  /**
   * Optional icon rendered on VerbCard (e.g. emoji or unicode glyph).
   */
  icon?: string;
  /**
   * Optional verb tone identifier used by UI to pick ring colors.
   */
  verbToneId?: string;
  /**
   * Direct map slot where this passive verb should appear.
   * If omitted, `slotTags` are used to match a slot dynamically.
   */
  slotId?: string;
  /**
   * Alternative to slotId; matches any map slot that declares one of these tags.
   */
  slotTags?: string[];
  /**
   * Time units between ticks (can be combined with frequencyFormula for dynamic cadence).
   */
  timeUnitsBetweenTicks?: number;
  /**
   * Optional formula evaluated at runtime to derive cadence or scaling factors.
   */
  frequencyFormula?: string;
  /**
   * Resource deltas applied whenever the passive triggers (consumption or production).
   */
  resourceDeltas?: ResourceDeltaDefinition[];
  /**
   * Optional requirements describing which residents/buildings unlock or boost the passive.
   */
  statRequirements?: StatRequirement;
  /**
   * Generic unlock conditions referenced by higher-level engines.
   */
  unlockConditionIds?: string[];
  /**
   * Additional domain-specific metadata (damage from starvation, buffs, etc.).
   */
  metadata?: Record<string, unknown>;
}

export interface MapLayoutDefinition {
  pixelWidth: number;
  pixelHeight: number;
}

export interface MapSlotDefinition {
  id: string;
  label: string;
  description?: string;

  /** Logical position on the village/world map (UI decides how to render it) */
  x: number;
  y: number;

  /** Which activity.slotTags are accepted in this slot */
  slotTags: string[];

  /** Whether the slot is usable at game start */
  isInitiallyUnlocked: boolean;

  /** Generic condition IDs (interpreted by higher-level engines) */
  unlockConditionIds?: string[];

  /** Optional UI icon/glyph for the map marker (e.g. "⛏", "⚒") */
  icon?: string;
  /** Tailwind color class for the marker label/outline */
  colorClass?: string;
  /** Optional cinematic panorama shown in TheaterView (21:9 image URL) */
  panoramaUrl?: string;
}

export interface TrialOfFireRules {
  /**
   * Minimum death risk (0-1) required for a Trial of Fire survival to grant a stat bonus.
   */
  highRiskThreshold: number;
  /**
   * Percentage-based multiplier applied to each numeric stat in the resident snapshot
   * when they survive a qualifying Trial of Fire. Example: 0.05 = +5%.
   */
  statBonusMultiplier: number;
  /**
   * Optional number of survivals required before the resident is flagged as hero.
   */
  heroSurvivalThreshold?: number;
  /**
   * Percentage (0-1) of max HP restored after a successful Trial of Fire survival.
   */
  hpRecoveryPercent?: number;
}

export interface GlobalRules {
  // Fatigue / exhaustion
  maxFatigueBeforeExhausted: number;
  fatigueRecoveryPerDay: number;
  dayLengthInTimeUnits: number;
  dayNightCycle?: {
    dayTimeUnits: number;
    nightTimeUnits: number;
  };
  /**
   * Optional conversion factor for UI timers (seconds shown in VerbCard timers).
   * Defaults to 60 seconds per village time unit if omitted.
   */
  secondsPerTimeUnit?: number;
  fatigueYellowThreshold: number;
  fatigueRedThreshold: number;

  // Injury
  baseLightInjuryChanceAtMaxFatigue: number;
  dangerInjuryMultiplierPerPoint: number;
  /**
   * Injury severity tiers available in the simulation.
   * These drive UI hints and engine-side recovery windows.
   */
  injuryTiers: Record<string, InjuryTierDefinition>;
  /** Optional configuration for hard-death calculations */
  deathRules?: DeathRules;

  // Food economy
  /** How many units of food each non-dead resident consumes per in-game day */
  foodConsumptionPerResidentPerDay: number;
  /** Baseline price of 1 unit of food in gold (for early-game balancing) */
  baseFoodPriceInGold: number;

  /**
   * Optional starting resources for a new Idle Village run.
   * Keys are resource IDs and values are starting quantities.
   * If omitted, the engine starts with an empty resource map.
   */
  startingResources?: Record<string, number>;

  // Quest XP: expression using at least `level`
  questXpFormula: string;

  // Limits/constraints
  maxActiveQuests: number;

  // Quest spawning (config-driven)
  /** How often the quest spawner runs, in in-game days (>= 1). */
  questSpawnEveryNDays: number;
  /** Maximum number of quest offers that can be present globally at once. */
  maxGlobalQuestOffers: number;
  /** Maximum number of quest offers that can target the same map slot. */
  maxQuestOffersPerSlot: number;

  // Optional UI theme overrides for VerbCard ring colors (CSS color values).
  verbToneColors?: VerbToneColors;

  // Optional seed for deterministic generation (when desired)
  defaultRandomSeed?: number;

  /**
   * Optional Trial of Fire configuration used when processing high-risk survivals.
   */
  trialOfFire?: TrialOfFireRules;
}

export interface OverlaySettings {
  /** Whether overlay mode is enabled */
  enabled: boolean;
  
  /** Default overlay position on screen */
  defaultPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Default overlay size preset */
  defaultSize: 'compact' | 'medium' | 'wide';
  
  /** Default zoom level (0.5 to 2.0) */
  defaultZoom: number;
  
  /** Whether overlay is always-on-top by default */
  alwaysOnTop: boolean;
  
  /** Whether overlay has transparency by default */
  transparency: boolean;
  
  /** Which widgets are shown by default in overlay */
  enabledWidgets: OverlayWidget[];
  
  /** Auto-hide timeout in seconds (0 = never auto-hide) */
  autoHideTimeoutSeconds: number;
  
  /** Whether to show system tray icon */
  showSystemTrayIcon: boolean;
}

export interface OverlayWidget {
  id: string;
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>;
}

export interface IdleVillageUiPreferences {
  defaultAppTabId?: AppNavTabId;
}

export interface IdleVillageConfig {
  version: string;
  resources: Record<string, ResourceDefinition>;
  activities: Record<string, ActivityDefinition>;
  mapSlots: Record<string, MapSlotDefinition>;
  mapLayout?: MapLayoutDefinition;
  passiveEffects: Record<string, PassiveEffectDefinition>;
  buildings: Record<string, import('./buildings').BuildingDefinition>;
  variance: ActivityVarianceConfig;
  globalRules: GlobalRules;
  overlaySettings: OverlaySettings;
  uiPreferences?: IdleVillageUiPreferences;
}

export interface IdleVillageConfigSnapshot {
  timestamp: number;
  config: IdleVillageConfig;
  description: string;
}

