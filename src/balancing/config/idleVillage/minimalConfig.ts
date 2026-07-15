/**
 * Minimal Config – Logic Core
 *
 * Config-first definition of activities, rewards, costs, global rules, and starting resources
 * for the Minimal Gameplay loop. This is the single source of truth for all numbers;
 * UI and hooks must read from here, never hardcode values.
 */

import { z } from 'zod';

const EVENT_LOG_SEVERITIES = ['info', 'success', 'warning', 'error'] as const;
export type MinimalEventSeverity = (typeof EVENT_LOG_SEVERITIES)[number];

const MinimalEventTemplateSchema = z.object({
  severity: z.enum(EVENT_LOG_SEVERITIES),
  message: z.string(),
});

const MinimalEventLogConfigSchema = z.object({
  templates: z.record(z.string(), MinimalEventTemplateSchema),
});

export type MinimalEventTemplate = z.infer<typeof MinimalEventTemplateSchema>;
export type MinimalEventLogConfig = z.infer<typeof MinimalEventLogConfigSchema>;

/**
 * Canonical reason codes exposed by the Minimal Gameplay engine/store for validation feedback.
 */
export enum MinimalGameplayReasonCode {
  ResidentNotFound = 'resident_not_found',
  ActivityNotFound = 'activity_not_found',
  ActivityInProgress = 'activity_in_progress',
  ResidentInjured = 'resident_injured',
  ResidentBusy = 'resident_busy',
  ResidentExhausted = 'resident_exhausted',
  InsufficientResources = 'insufficient_resources',
  StatRequirementFailed = 'stat_requirement_failed',
  Unknown = 'unknown',
}

/**
 * Reason codes surfaced by drag-and-drop validation in Minimal Gameplay.
 * Exported as a type for UI/config consumers that rely on literal unions.
 */
export type MinimalGameplayDropReason = `${MinimalGameplayReasonCode}`;

/**
 * Allowed formatter values for Minimal HUD fields.
 */
const HUD_FIELD_FORMATS = ['integer', 'percentage', 'fraction', 'day-label'] as const;

export type MinimalHudFieldFormat = (typeof HUD_FIELD_FORMATS)[number];

/**
 * Schema for a minimal activity definition.
 */
export const MinimalActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['job', 'quest', 'market']),
  baseReward: z.object({
    gold: z.number().default(0),
    food: z.number().default(0),
    wood: z.number().default(0), // Added for vertical slice
    xp: z.number().default(0),   // Added for vertical slice
  }),
  cost: z.object({
    gold: z.number().default(0),
    food: z.number().default(0),
  }),
  durationTicks: z.number().positive().default(1),
  durationMs: z.number().positive().optional(), // Added for real duration preservation
  dangerRating: z.number().min(0).max(10).default(0), // Added for risk calculations
  statRequirements: z.record(z.string(), z.number()).optional(),
  fatiguePerTick: z.number().default(0),
  maxSlots: z.union([z.number().int().min(1), z.literal('infinite')]).default('infinite'), // Added for slot controller
});

export type MinimalActivity = z.infer<typeof MinimalActivitySchema>;

/**
 * Schema for global game rules.
 */
export const MinimalGlobalRulesSchema = z.object({
  baseFoodPriceInGold: z.number().positive().default(1),
  maxActiveQuests: z.number().nonnegative().default(1),
  dailyFoodConsumptionPerResident: z.number().positive().default(2),
  fatigueDecayPerRestTick: z.number().positive().default(5),
  injuryProbabilityThreshold: z.number().min(0).max(1).default(0.05),
  dayLengthInTimeUnits: z.number().positive().default(60),
  dayNightCycle: z
    .object({
      dayTimeUnits: z.number().positive().default(40),
      nightTimeUnits: z.number().positive().default(20),
    })
    .default({ dayTimeUnits: 40, nightTimeUnits: 20 }),
  secondsPerTimeUnit: z.number().positive().default(1),
  rngSeed: z.number().int().nonnegative().default(734_003),
});

export type MinimalGlobalRules = z.infer<typeof MinimalGlobalRulesSchema>;

/**
 * Schema for starting resources.
 */
export const MinimalStartingResourcesSchema = z.object({
  gold: z.number().nonnegative().default(10),
  food: z.number().nonnegative().default(5),
  maxFood: z.number().positive().default(20),
  residents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      stats: z.record(z.string(), z.number()),
      fatigue: z.number().min(0).max(100).default(0),
      isInjured: z.boolean().default(false),
      level: z.number().positive().default(1),
    })
  ).default([]),
});

export type MinimalStartingResources = z.infer<typeof MinimalStartingResourcesSchema>;

/**
 * Full minimal configuration schema.
 */
const MinimalHudFieldSchema = z.object({
  id: z.enum(['day', 'gold', 'food', 'fatigue']),
  label: z.string(),
  format: z.enum(HUD_FIELD_FORMATS).default('integer'),
  supportsWarningBadge: z.boolean().default(false),
});

const MinimalUITokensSchema = z.object({
  accentHex: z.string(),
  heroBackground: z.string(),
  cardRadiusPx: z.number().positive(),
  dangerHex: z.string(),
});

const MinimalUIWarningThresholdsSchema = z.object({
  fatigueDangerPercent: z.number().min(0).max(100).default(70),
  foodDangerDays: z.number().min(0).default(1),
  injuryBadgeCopy: z.string().default('Ferito'),
});

const MinimalUIWarningCopySchema = z.object({
  fatigueHigh: z.string().default('Fatica critica'),
  fatigueRecovered: z.string().default('Fatigue stabilizzata'),
  foodLow: z.string().default('Scorte di cibo critiche'),
  foodRecovered: z.string().default('Cibo stabilizzato'),
});

const MinimalUIWarningTokensSchema = z.object({
  fatigueHex: z.string(),
  foodHex: z.string(),
  safeHex: z.string(),
  textHex: z.string(),
});

const MinimalUIActionPanelSchema = z.object({
  buyFood: z.object({
    label: z.string().default('Compra Cibo'),
    tooltip: z.string().default('Acquista cibo per i residenti'),
    iconToken: z.string().default('🍖'),
    defaultQuantity: z.number().positive().default(5),
  }),
  startQuestDemo: z.object({
    label: z.string().default('Avvia Quest Demo'),
    tooltip: z.string().default('Avvia una quest dimostrativa'),
    iconToken: z.string().default('⚔️'),
  }),
  upgradeBuilding: z.object({
    label: z.string().default('Potenzia Edificio'),
    tooltip: z.string().default('Sblocca un upgrade visibile collegato alla struttura'),
    iconToken: z.string().default('🏗️'),
    targetBuildingId: z.string().default('building_gold_mine_minimal'),
  }),
});

const MinimalUITooltipPolicySchema = z.object({
  /** Delay in ms before showing tooltip on hover */
  showDelayMs: z.number().min(0).default(500),
  /** Delay in ms before hiding tooltip after mouse leave */
  hideDelayMs: z.number().min(0).default(200),
  /** Whether to show tooltip on hover (vs click only) */
  showOnHover: z.boolean().default(true),
  /** Whether to show tooltip on focus (keyboard navigation) */
  showOnFocus: z.boolean().default(true),
  /** Auto-hide duration in ms (0 = no auto-hide) */
  autoHideDurationMs: z.number().min(0).default(0),
  /** Whether to disable hoverable content (close on mouse leave content) */
  disableHoverableContent: z.boolean().default(false),
  /** Whether to skip delay duration on first show */
  skipDelayDuration: z.boolean().default(false),
});

const MinimalUITooltipSectionSchema = z.object({
  /** Icon token for this tooltip section */
  iconToken: z.string().optional(),
  /** Tooltip copy entries */
  entries: z.record(z.string(), z.string()),
});

const MinimalUITooltipsSchema = z.object({
  /** Global tooltip behavior policies */
  policy: MinimalUITooltipPolicySchema,
  /** HUD resources tooltips */
  hudResources: MinimalUITooltipSectionSchema,
  /** Worker trait tooltips */
  workerTraits: MinimalUITooltipSectionSchema,
  /** Activity slot status tooltips */
  slotStatus: MinimalUITooltipSectionSchema,
});

const MinimalUIErrorMessagesSchema = z.object({
  insufficientGold: z.string().default('Oro insufficiente per comprare cibo'),
  residentBusy: z.string().default('Il residente è già occupato'),
  questLocked: z.string().default('Quest bloccata o requisiti non soddisfatti'),
  upgradeLocked: z.string().default('Serve più oro per l’upgrade attuale'),
});

const MinimalLogPanelSeveritySchema = z.object({
  backgroundColor: z.string(),
  color: z.string(),
  icon: z.string(),
});

const MinimalLogPanelSeverityPaletteSchema = z.object({
  info: MinimalLogPanelSeveritySchema,
  success: MinimalLogPanelSeveritySchema,
  warning: MinimalLogPanelSeveritySchema,
  error: MinimalLogPanelSeveritySchema,
});

const MinimalLogPanelEmptyStateSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),
});

const MinimalLogPanelAriaLabelsSchema = z.object({
  panelLabel: z.string(),
  entryLabel: z.string(),
  emptyStateDescription: z.string(),
  loadingLabel: z.string(),
});

const MinimalLogPanelConfigSchema = z.object({
  maxEntries: z.number().min(1).max(50).default(10),
  severityPalette: MinimalLogPanelSeverityPaletteSchema,
  emptyState: MinimalLogPanelEmptyStateSchema,
  ariaLabels: MinimalLogPanelAriaLabelsSchema,
});

const MinimalBuildingUpgradeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  cost: z.object({
    gold: z.number().nonnegative().default(0),
    food: z.number().nonnegative().default(0),
  }),
  effects: z.object({
    slotIncrease: z.number().int().optional(),
    rewardMultiplier: z.number().positive().optional(),
  }).default({}),
});

const MinimalBuildingDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  icon: z.string().default('🏚️'),
  activityId: z.string(),
  baseSlots: z.number().int().nonnegative().default(1),
  upgrades: z.array(MinimalBuildingUpgradeSchema).default([]),
});

const MinimalNightThreatEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  countdownDays: z.number().positive(),
  effect: z.object({
    foodMultiplier: z.number().positive().optional(),
    additionalFoodLoss: z.number().nonnegative().optional(),
    goldLoss: z.number().nonnegative().optional(),
    fatigueSpike: z.number().nonnegative().optional(),
  }),
  spyMitigation: z.object({
    successRate: z.number().min(0).max(1).default(0.5),
    mitigationDescription: z.string(),
  }).optional(),
});

const MinimalNightThreatConfigSchema = z.object({
  countdownLabel: z.string().default('Night Threat'),
  initialCountdownDays: z.number().int().positive().default(3),
  spySlotId: z.string().default('night_spy_slot'),
  spyTooltip: z.string().default('Assegna una spia per mitigare l\'evento notturno.'),
  events: z.array(MinimalNightThreatEventSchema).default([]),
});

const MinimalGameOverReasonSchema = z.enum(['food_depleted', 'all_injured', 'manual_reset']);
const MinimalGameOverMessageSchema = z.object({
  title: z.string(),
  description: z.string(),
  restartButton: z.string().default('Ricomincia'),
});

const MinimalGameOverMessagesSchema = z.object({
  food_depleted: MinimalGameOverMessageSchema,
  all_injured: MinimalGameOverMessageSchema,
  manual_reset: MinimalGameOverMessageSchema,
});

const MinimalGameOverStatsLayoutSchema = z.object({
  daysSurvived: z.object({
    label: z.string().default('Giorni sopravvissuti'),
    format: z.enum(['integer']).default('integer'),
  }),
  goldEarned: z.object({
    label: z.string().default('Oro guadagnato'),
    format: z.enum(['integer']).default('integer'),
  }),
  questsCompleted: z.object({
    label: z.string().default('Quest completate'),
    format: z.enum(['integer']).default('integer'),
  }),
  residentsLost: z.object({
    label: z.string().default('Residenti persi'),
    format: z.enum(['integer']).default('integer'),
  }),
});

const MinimalGameOverConfigSchema = z.object({
  reasons: MinimalGameOverMessagesSchema,
  statsLayout: MinimalGameOverStatsLayoutSchema,
  modalTitle: z.string().default('Game Over'),
  closeOnEscape: z.boolean().default(true),
  closeOnBackdropClick: z.boolean().default(false),
});

const MinimalLoopConfigSchema = z.object({
  tickIntervalMs: z.number().min(500).default(1000),
  autosaveIntervalMs: z.number().positive().default(30000),
  warmupDelayMs: z.number().nonnegative().default(1200),
  maxSpeedMultiplier: z.number().positive().default(5),
  defaultSpeedMultiplier: z.number().positive().default(1),
});

/**
 * Schema for roster display configuration.
 */
const MinimalRosterConfigSchema = z.object({
  maxWorkers: z.number().int().min(1).default(10),
  showWarnings: z.boolean().default(true),
  enableDragPrep: z.boolean().default(true),
});

/**
 * Schema for resource warning thresholds.
 */
const MinimalWarningConfigSchema = z.object({
  lowFoodThreshold: z.number().min(0).default(20),
  highFatigueThreshold: z.number().min(0).max(100).default(80),
  warningInterval: z.number().positive().default(5000),
});

const MinimalUIConfigSchema = z.object({
  hudFields: z.array(MinimalHudFieldSchema).min(1),
  tokens: MinimalUITokensSchema,
  warningThresholds: MinimalUIWarningThresholdsSchema,
  warningCopy: MinimalUIWarningCopySchema,
  warningTokens: MinimalUIWarningTokensSchema,
  actionPanel: MinimalUIActionPanelSchema,
  errorMessages: MinimalUIErrorMessagesSchema,
  logDisplayLimit: z.number().positive().default(5),
  logPanel: MinimalLogPanelConfigSchema,
  tooltips: MinimalUITooltipsSchema,
  gameOver: MinimalGameOverConfigSchema,
});

export type MinimalLoopConfig = z.infer<typeof MinimalLoopConfigSchema>;
export type MinimalRosterConfig = z.infer<typeof MinimalRosterConfigSchema>;
export type MinimalWarningConfig = z.infer<typeof MinimalWarningConfigSchema>;
export type MinimalUIConfig = z.infer<typeof MinimalUIConfigSchema>;
export type MinimalHUDFieldConfig = z.infer<typeof MinimalHudFieldSchema>;
export type MinimalUITokens = z.infer<typeof MinimalUITokensSchema>;
export type MinimalUIWarningThresholds = z.infer<typeof MinimalUIWarningThresholdsSchema>;
export type MinimalUIWarningCopy = z.infer<typeof MinimalUIWarningCopySchema>;
export type MinimalUIWarningTokens = z.infer<typeof MinimalUIWarningTokensSchema>;
export type MinimalUIActionPanel = z.infer<typeof MinimalUIActionPanelSchema>;
export type MinimalUIErrorMessages = z.infer<typeof MinimalUIErrorMessagesSchema>;
export type MinimalUILogPanelConfig = z.infer<typeof MinimalLogPanelConfigSchema>;
export type MinimalUITooltipPolicy = z.infer<typeof MinimalUITooltipPolicySchema>;
export type MinimalUITooltipSection = z.infer<typeof MinimalUITooltipSectionSchema>;
export type MinimalUITooltips = z.infer<typeof MinimalUITooltipsSchema>;
export type MinimalGameOverReason = z.infer<typeof MinimalGameOverReasonSchema>;
export type MinimalGameOverConfig = z.infer<typeof MinimalGameOverConfigSchema>;
export type MinimalGameOverMessages = z.infer<typeof MinimalGameOverMessagesSchema>;
export type MinimalNightThreatConfig = z.infer<typeof MinimalNightThreatConfigSchema>;

/**
 * Schema for POI state colors.
 */
const MinimalPOIStateColorsSchema = z.object({
  idle: z.object({
    bg: z.string(),
    border: z.string(),
  }),
  running: z.object({
    bg: z.string(),
    border: z.string(),
  }),
  completed: z.object({
    bg: z.string(),
    border: z.string(),
  }),
});

export type MinimalPOIStateColors = z.infer<typeof MinimalPOIStateColorsSchema>;

export const MinimalConfigSchema = z.object({
  version: z.string(),
  loop: MinimalLoopConfigSchema,
  globalRules: MinimalGlobalRulesSchema,
  startingResources: MinimalStartingResourcesSchema,
  activities: z.array(MinimalActivitySchema),
  ui: MinimalUIConfigSchema,
  eventLog: MinimalEventLogConfigSchema,
  buildings: z.array(MinimalBuildingDefinitionSchema).default([]),
  nightThreat: MinimalNightThreatConfigSchema.optional(),
  poiStates: MinimalPOIStateColorsSchema.optional(),
  rosterConfig: MinimalRosterConfigSchema,
  warningConfig: MinimalWarningConfigSchema,
});

export type MinimalConfig = z.infer<typeof MinimalConfigSchema>;

/**
 * Default minimal configuration.
 */
export const DEFAULT_MINIMAL_CONFIG: MinimalConfig = {
  version: '0.1.0-minimal-logic',
  loop: {
    tickIntervalMs: 1000,
    autosaveIntervalMs: 30000,
    warmupDelayMs: 1200,
    maxSpeedMultiplier: 5,
    defaultSpeedMultiplier: 1,
  },
  globalRules: {
    baseFoodPriceInGold: 1,
    maxActiveQuests: 1,
    dailyFoodConsumptionPerResident: 2,
    fatigueDecayPerRestTick: 5,
    injuryProbabilityThreshold: 0.05,
    dayLengthInTimeUnits: 60,
    dayNightCycle: {
      dayTimeUnits: 40,
      nightTimeUnits: 20,
    },
    secondsPerTimeUnit: 1,
    rngSeed: 734_003,
  },
  startingResources: {
    gold: 15,
    food: 8,
    maxFood: 25,
    residents: [
      {
        id: 'resident-1',
        name: 'Aurora Calder',
        stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
        fatigue: 0,
        isInjured: false,
        level: 1,
      },
      {
        id: 'resident-2',
        name: 'Marcus Stone',
        stats: { strength: 7, endurance: 6, agility: 3, intelligence: 2, perception: 3 },
        fatigue: 0,
        isInjured: false,
        level: 1,
      },
      {
        id: 'resident-3',
        name: 'Luna Swift',
        stats: { strength: 4, endurance: 4, agility: 7, intelligence: 5, perception: 6 },
        fatigue: 0,
        isInjured: false,
        level: 1,
      },
      {
        id: 'resident-4',
        name: 'Thorin Ironforge',
        stats: { strength: 8, endurance: 7, agility: 2, intelligence: 3, perception: 2 },
        fatigue: 0,
        isInjured: false,
        level: 1,
      },
    ],
  },
  activities: [
    {
      id: 'job_wood_gathering_stable',
      name: 'Wood Gathering',
      type: 'job',
      baseReward: { gold: 0, food: 0, wood: 2, xp: 1 },
      cost: { gold: 0, food: 0 },
      durationTicks: 4,
      dangerRating: 1,
      fatiguePerTick: 1,
      maxSlots: 'infinite',
    },
    {
      id: 'job_gold_mine_minimal',
      name: 'Gold Mine (Minimal)',
      type: 'job',
      baseReward: { gold: 6, food: 0 },
      cost: { gold: 0, food: 0 },
      durationTicks: 4,
      fatiguePerTick: 2,
    },
    {
      id: 'quest_forest_hunt_minimal',
      name: 'Forest Hunt (Minimal)',
      type: 'quest',
      baseReward: { gold: 10, food: 4 },
      cost: { gold: 2, food: 0 },
      durationTicks: 6,
      fatiguePerTick: 3,
      statRequirements: { perception: 3 },
    },
    {
      id: 'market_trade_minimal',
      name: 'Market Trade (Minimal)',
      type: 'market',
      baseReward: { gold: 0, food: 6 },
      cost: { gold: 4, food: 0 },
      durationTicks: 1,
      fatiguePerTick: 0,
    },
  ],
  ui: {
    hudFields: [
      { id: 'day', label: 'Day', format: 'day-label', supportsWarningBadge: false },
      { id: 'gold', label: 'Gold', format: 'integer', supportsWarningBadge: false },
      { id: 'food', label: 'Food', format: 'fraction', supportsWarningBadge: true },
      { id: 'fatigue', label: 'Fatigue', format: 'percentage', supportsWarningBadge: true },
    ],
    tokens: {
      accentHex: '#c9a227',
      heroBackground: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
      cardRadiusPx: 24,
      dangerHex: '#ef4444',
    },
    warningThresholds: {
      fatigueDangerPercent: 70,
      foodDangerDays: 1,
      injuryBadgeCopy: 'Ferito',
    },
    warningCopy: {
      fatigueHigh: 'Fatica critica sui residenti',
      fatigueRecovered: 'Fatica sotto controllo',
      foodLow: 'Scorte di cibo critiche',
      foodRecovered: 'Scorte di cibo stabili',
    },
    warningTokens: {
      fatigueHex: '#f97316',
      foodHex: '#fbbf24',
      safeHex: '#0f172a',
      textHex: '#f8fafc',
    },
    actionPanel: {
      buyFood: {
        label: 'Compra Cibo',
        tooltip: 'Acquista cibo per i residenti',
        iconToken: '🍖',
        defaultQuantity: 5,
      },
      startQuestDemo: {
        label: 'Avvia Quest Demo',
        tooltip: 'Avvia una quest dimostrativa',
        iconToken: '⚔️',
      },
      upgradeBuilding: {
        label: 'Potenzia Miniera',
        tooltip: 'Rinforza la miniera per aggiungere un nuovo slot',
        iconToken: '🏗️',
        targetBuildingId: 'building_gold_mine_minimal',
      },
    },
    errorMessages: {
      insufficientGold: 'Oro insufficiente per comprare cibo',
      residentBusy: 'Il residente è già occupato',
      questLocked: 'Quest bloccata o requisiti non soddisfatti',
      upgradeLocked: 'Serve più oro per completare l’upgrade',
    },
    logDisplayLimit: 5,
    logPanel: {
      maxEntries: 10,
      severityPalette: {
        info: { backgroundColor: 'rgb(59, 130, 246)', color: 'rgb(255, 255, 255)', icon: 'ℹ️' },
        success: { backgroundColor: 'rgb(34, 197, 94)', color: 'rgb(255, 255, 255)', icon: '✅' },
        warning: { backgroundColor: 'rgb(251, 191, 36)', color: 'rgb(0, 0, 0)', icon: '⚠️' },
        error: { backgroundColor: 'rgb(239, 68, 68)', color: 'rgb(255, 255, 255)', icon: '❌' },
      },
      emptyState: {
        title: 'Nessun evento',
        description: 'Nessuna attività registrata finora',
        icon: '📋',
      },
      ariaLabels: {
        panelLabel: 'Pannello eventi di gioco',
        entryLabel: 'Evento di gioco',
        emptyStateDescription: 'Nessun evento di gioco registrato',
        loadingLabel: 'Caricamento eventi...',
      },
    },
    tooltips: {
      policy: {
        showDelayMs: 500,
        hideDelayMs: 200,
        showOnHover: true,
        showOnFocus: true,
        autoHideDurationMs: 0,
        disableHoverableContent: false,
        skipDelayDuration: false,
      },
      hudResources: {
        iconToken: '💰',
        entries: {
          gold: 'Current gold reserves. Earned from mining and other activities.',
          food: 'Food supplies remaining. Consumed daily by residents.',
          day: 'Current day in the village cycle. Advances with time.',
          fatigue: 'Average resident fatigue level. High fatigue reduces efficiency.',
        },
      },
      workerTraits: {
        iconToken: '👥',
        entries: {
          strength: 'Physical power for mining and combat activities.',
          endurance: 'Stamina for long-duration activities and fatigue resistance.',
          agility: 'Speed and reflexes for hunting and scouting tasks.',
          intelligence: 'Problem-solving ability for complex quests and crafting.',
          perception: 'Awareness and detection skills for exploration.',
          injured: 'This resident is injured and cannot work until recovered.',
          exhausted: 'This resident is too exhausted to work effectively.',
        },
      },
      slotStatus: {
        iconToken: '📍',
        entries: {
          idle: 'Activity slot is available for assignment.',
          active: 'Activity is currently in progress.',
          blocked: 'This slot is locked or unavailable.',
          warning: 'Assignment may have risks or requirements.',
          valid_drop: 'This resident can be assigned here.',
          invalid_drop: 'This resident cannot be assigned here.',
        },
      },
    },
    gameOver: {
      reasons: {
        food_depleted: {
          title: 'Scorte Esaurite',
          description: 'Le scorte di cibo sono terminate. Tutti i residenti hanno lasciato il villaggio.',
          restartButton: 'Ricomincia',
        },
        all_injured: {
          title: 'Tutti Feriti',
          description: 'Tutti i residenti sono feriti e non possono più lavorare. Il villaggio non può continuare.',
          restartButton: 'Ricomincia',
        },
        manual_reset: {
          title: 'Riavvio Manuale',
          description: 'Hai scelto di ricominciare il gioco.',
          restartButton: 'Ricomincia',
        },
      },
      statsLayout: {
        daysSurvived: {
          label: 'Giorni sopravvissuti',
          format: 'integer',
        },
        goldEarned: {
          label: 'Oro guadagnato',
          format: 'integer',
        },
        questsCompleted: {
          label: 'Quest completate',
          format: 'integer',
        },
        residentsLost: {
          label: 'Residenti persi',
          format: 'integer',
        },
      },
      modalTitle: 'Game Over',
      closeOnEscape: true,
      closeOnBackdropClick: false,
    },
  },
  eventLog: {
    templates: {
      activity_scheduled: {
        severity: 'info',
        message: '{residentName} scheduled {activityName}',
      },
      activity_started: {
        severity: 'info',
        message: '{residentName} started {activityName}',
      },
      activity_completed: {
        severity: 'success',
        message:
          '{residentName} completed {activityName} (+{rewardGold} gold, +{rewardFood} food)',
      },
      activity_cancelled: {
        severity: 'warning',
        message: '{activityName} cancelled for {residentName}',
      },
      activity_failed: {
        severity: 'error',
        message: '{activityName} failed ({reason})',
      },
      fatigue_decay: {
        severity: 'info',
        message: 'Fatigue recovered: -{fatigueDelta}',
      },
      fatigue_warning: {
        severity: 'warning',
        message: 'High fatigue detected for {residentName} ({fatigue}%)',
      },
      night_threat_warning: {
        severity: 'warning',
        message: 'La minaccia notturna arriverà in {daysRemaining} giorni',
      },
      night_threat_resolved: {
        severity: 'success',
        message: 'La minaccia notturna è stata contenuta ({eventLabel})',
      },
      night_threat_attack: {
        severity: 'error',
        message: '{eventLabel} ha colpito il villaggio ({effectDescription})',
      },
    },
  },
  buildings: [
    {
      id: 'building_gold_mine_minimal',
      label: 'Gold Mine',
      description: 'Il cuore economico del loop minimale.',
      icon: '⛏️',
      activityId: 'job_gold_mine_minimal',
      baseSlots: 1,
      upgrades: [
        {
          id: 'gold_mine_reinforced_shaft',
          label: 'Pozzo Rinforzato',
          description: 'Aggiunge un tunnel di estrazione e +1 slot lavoratore.',
          cost: { gold: 500, food: 0 },
          effects: {
            slotIncrease: 1,
          },
        },
      ],
    },
  ],
  nightThreat: {
    countdownLabel: 'Night Threat',
    initialCountdownDays: 3,
    spySlotId: 'night_spy_slot',
    spyTooltip: 'Assegna una spia per mitigare l’evento notturno.',
    events: [
      {
        id: 'wolf_pack',
        label: 'Branco di Lupi',
        description: 'Consumano il doppio del cibo e possono ferire un residente.',
        countdownDays: 3,
        effect: {
          foodMultiplier: 2,
          additionalFoodLoss: 2,
          fatigueSpike: 5,
        },
        spyMitigation: {
          successRate: 0.65,
          mitigationDescription: 'La spia disperde il branco e recupera 10 gold in pelli.',
        },
      },
    ],
  },
  poiStates: {
    idle: {
      bg: 'rgb(34, 197, 94)',
      border: 'rgb(22, 163, 74)',
    },
    running: {
      bg: 'rgb(59, 130, 246)',
      border: 'rgb(37, 99, 235)',
    },
    completed: {
      bg: 'rgb(251, 191, 36)',
      border: 'rgb(245, 158, 11)',
    },
  },
  rosterConfig: {
    maxWorkers: 10,
    showWarnings: true,
    enableDragPrep: true,
  },
  warningConfig: {
    lowFoodThreshold: 20,
    highFatigueThreshold: 80,
    warningInterval: 5000,
  },
};
