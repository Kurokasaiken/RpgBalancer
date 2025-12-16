// src/balancing/config/idleVillage/types.ts
// Generic, config-first domain types for the Idle Village meta-game.
// No hardcoded job/quest kinds or enums – everything is tag/ID based
// so new content can be added purely via config/UI.

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

export interface ResourceDeltaDefinition {
  /** ID of the resource being modified (must match a ResourceDefinition.id) */
  resourceId: string;
  /**
   * Formula evaluated at runtime (via FormulaEngine or equivalent).
   * Can depend on quest level, character stats, global rules, etc.
   */
  amountFormula: string;
}

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
   * Optional whitelists for variance categories.
   * If unset, all defined categories are eligible.
   */
  allowedDifficultyCategoryIds?: string[];
  allowedRewardCategoryIds?: string[];

  /** Open extension point for domain-specific data */
  metadata?: Record<string, unknown>;
}

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

export interface ActivityVarianceConfig {
  /** Difficulty scaling categories (e.g. under-tuned, normal, overtuned) */
  difficultyCategories: Record<string, ActivityRollCategory>;
  /** Reward scaling categories (e.g. underpaid, normal, well_paid) */
  rewardCategories: Record<string, ActivityRollCategory>;
}

export interface VerbToneColors {
  neutral?: string;
  job?: string;
  quest?: string;
  danger?: string;
  system?: string;
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
}

export interface FounderPreset {
  id: string;
  label: string;
  description?: string;

  /**
   * Reference to an archetype / character template defined elsewhere
   * (e.g. in archetype config or character creator presets).
   */
  archetypeId: string;

  /** Difficulty tag (e.g. "easy", "normal", "hard") – fully config-driven. */
  difficultyTag: string;

  /**
   * Optional formula applied on top of the base archetype stats
   * to make founders stronger/weaker per difficulty.
   */
  statAdjustmentFormula?: string;
}

export interface GlobalRules {
  // Fatigue / exhaustion
  maxFatigueBeforeExhausted: number;
  fatigueRecoveryPerDay: number;
  dayLengthInTimeUnits: number;
  /**
   * Optional conversion factor for UI timers (seconds shown in VerbCard timers).
   * Defaults to 60 seconds per village time unit if omitted.
   */
  secondsPerTimeUnit?: number;
  fatigueYellowThreshold: number;
  fatigueRedThreshold: number;

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

  // Injury
  baseLightInjuryChanceAtMaxFatigue: number;
  dangerInjuryMultiplierPerPoint: number;

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

export interface IdleVillageConfig {
  version: string;
  resources: Record<string, ResourceDefinition>;
  activities: Record<string, ActivityDefinition>;
  mapSlots: Record<string, MapSlotDefinition>;
  buildings: Record<string, import('./buildings').BuildingDefinition>;
  founders: Record<string, FounderPreset>;
  variance: ActivityVarianceConfig;
  globalRules: GlobalRules;
  overlaySettings: OverlaySettings;
}

export interface IdleVillageConfigSnapshot {
  timestamp: number;
  config: IdleVillageConfig;
  description: string;
}
