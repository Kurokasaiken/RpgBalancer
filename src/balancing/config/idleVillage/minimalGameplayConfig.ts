/**
 * Minimal Gameplay Config
 *
 * Config-first scaffolding for the Idle Village minimal gameplay loop (NP-MIN-010B).
 * Surfaces loop timings, UI defaults, location metadata, and starter event log entries
 * so that the React hooks/pages can stay presentation-only.
 */

import type { VillageEvent } from '@/engine/game/idleVillage/TimeEngine';
import type { MinimalGameplayDropReason } from './minimalConfig';

export interface MinimalGameplayUITokens {
  /** Accent color applied to CTAs and progress halos. */
  accentHex: string;
  /** Background gradient token for hero/header blocks. */
  heroBackground: string;
  /** Border radius applied to major cards. */
  cardRadiusPx: number;
  /** Warning tone applied to fatigue and low food badges. */
  dangerHex: string;
}

export interface MinimalGameplayLoopTimingsConfig {
  /** Base loop tick in milliseconds (feeds tickIdleVillage). */
  tickIntervalMs: number;
  /** Autosave cadence in milliseconds (PersistenceService). */
  autosaveIntervalMs: number;
  /** Optional warmup delay before starting the first tick. */
  warmupDelayMs: number;
  /** Maximum allowed speed multiplier exposed to the UI. */
  maxSpeedMultiplier: number;
  /** Default multiplier applied on first load (typically 1x). */
  defaultSpeedMultiplier: number;
}

export interface MinimalGameplayHUDFieldConfig {
  id: 'day' | 'gold' | 'food' | 'fatigue';
  label: string;
  /** Optional formatting hint for future HUD renderer logic. */
  format?: 'integer' | 'percentage' | 'day-label';
  /** Whether the HUD should surface warning badges for this field. */
  supportsWarningBadge?: boolean;
}

export interface MinimalGameplayWarningTokens {
  /** Warning background color for fatigue alerts. */
  fatigueWarningBg: string;
  /** Warning background color for food alerts. */
  foodWarningBg: string;
  /** Warning background color for injury alerts. */
  injuryWarningBg: string;
  /** Warning text color for all alerts. */
  warningTextHex: string;
  /** Warning border color for emphasis. */
  warningBorderHex: string;
}

export interface MinimalGameplayWarningThresholds {
  /** Fatigue percentage that triggers warning badge (0-1). */
  fatigueDangerPercent: number;
  /** Food days remaining that triggers warning badge. */
  foodDangerDays: number;
  /** Localized copy for injury warning badge. */
  injuryBadgeCopy: string;
}

export interface MinimalGameplayTooltipConfig {
  /** Tooltip copy for gold changes. */
  gold: string;
  /** Tooltip copy for food changes. */
  food: string;
  /** Tooltip copy for day progression. */
  day: string;
  /** Tooltip copy for fatigue averages. */
  fatigue: string;
}

export interface MinimalGameplayResourceTickerConfig {
  /** Enables the animated ticker. */
  enabled: boolean;
  /** Animation duration in milliseconds. */
  durationMs: number;
  /** Name of easing curve to apply. */
  easing: 'linear' | 'easeInOutCubic';
  /** Whether to prefix positive deltas. */
  showPositivePrefix: boolean;
  /** Positive delta color token. */
  positiveColor: string;
  /** Negative delta color token. */
  negativeColor: string;
  /** Whether to surface fatigue deltas. */
  showFatigueDelta: boolean;
}

export interface MinimalGameplaySlotGlowStateConfig {
  /** Border color applied while the state is active. */
  borderColor: string;
  /** Background overlay color for the glow. */
  backgroundColor: string;
  /** CSS box shadow string for the bloom effect. */
  boxShadow: string;
  /** Optional opacity override. */
  opacity?: number;
}

export interface MinimalGameplaySlotHighlightConfig {
  /** Debounce duration (ms) before applying highlight transitions. */
  stabilizeMs: number;
  /** Scale applied when the slot becomes a valid drop target. */
  focusScale: number;
  /** Scale used for hover-only states. */
  hoverScale: number;
  /** Scale applied when the slot is manually selected/focused. */
  selectedScale: number;
  /** Opacity applied when the slot is invalid/locked. */
  invalidOpacity: number;
  /** Transition duration (ms) for highlight transforms. */
  transitionMs: number;
}

export interface MinimalGameplaySlotGlowVisualConfig {
  /** Whether particle sprites render around the slot. */
  particlesEnabled: boolean;
  /** Whether the slot frame should clamp overflow to avoid scrollbars. */
  clampOverflow: boolean;
}

export interface MinimalGameplaySlotGlowConfig {
  /** Whether slot glow styles are enabled. */
  enabled: boolean;
  /** Glow state for idle slots. */
  idle: MinimalGameplaySlotGlowStateConfig;
  /** Glow state for valid drops. */
  valid: MinimalGameplaySlotGlowStateConfig;
  /** Glow state for invalid drops. */
  invalid: MinimalGameplaySlotGlowStateConfig;
  /** Glow state for warning drops. */
  warning: MinimalGameplaySlotGlowStateConfig;
  /** Glow state for blocked drops. */
  blocked: MinimalGameplaySlotGlowStateConfig;
  /** Highlight animation controls. */
  highlight?: MinimalGameplaySlotHighlightConfig;
  /** Visual niceties (particles, overflow clamping). */
  visuals?: MinimalGameplaySlotGlowVisualConfig;
}

export interface MinimalGameplaySensoryFeedbackConfig {
  audio: {
    /** Enables audio playback for feedback events. */
    enabled: boolean;
    /** Success SFX asset path (relative to public/assets/audio). */
    successSound: string;
    /** Warning SFX asset path. */
    warningSound: string;
    /** Blocked/error SFX asset path. */
    blockedSound: string;
    /** Volume multiplier [0-1]. */
    volume: number;
  };
  haptics: {
    /** Enables vibration feedback on supported devices. */
    enabled: boolean;
    /** Pattern used for success feedback. */
    successPattern: number[];
    /** Pattern used for warning feedback. */
    warningPattern: number[];
    /** Pattern used for blocked feedback. */
    blockedPattern: number[];
  };
}

export interface MinimalGameplayFeedbackConfig {
  /** Resource ticker animation and styling. */
  resourceTicker: MinimalGameplayResourceTickerConfig;
  /** Slot glow/bloom configuration. */
  slotGlow: MinimalGameplaySlotGlowConfig;
  /** Audio/haptic feedback toggles. */
  sensory: MinimalGameplaySensoryFeedbackConfig;
}

export interface MinimalGameplayUIConfig {
  /** High-level copy supporting the hero section of MinimalGameplayPage. */
  hero: {
    subtitle: string;
    description: string;
    themeToken: 'calibration' | 'jobLoop' | 'questLoop' | 'marketLoop' | 'gameOver';
  };
  /** HUD configuration so UI pulls labels/tokens from config. */
  hudFields: MinimalGameplayHUDFieldConfig[];
  /** Maximum number of log entries to show in the sidebar. */
  logDisplayLimit: number;
  /** Whether to show the critical panel on game-over. */
  showGameOverPanel: boolean;
  /** Style Laboratory preset identifier for theme consistency. */
  styleLabPreset: 'epicFrontier' | 'prismaticFrontier' | 'frontier' | 'obsidian' | 'ethereal' | 'vellumLight';
  /** Shared token bag consumed by Style Lab wrappers. */
  tokens: MinimalGameplayUITokens;
  /** Warning display tokens for roster alerts. */
  warningTokens: MinimalGameplayWarningTokens;
  /** Warning thresholds for roster status calculations. */
  thresholds: MinimalGameplayWarningThresholds;
  /** Localized tooltips for HUD elements and resources. */
  tooltips: {
    gold: string;
    food: string;
    day: string;
    fatigue: string;
  };
  /** Feedback configuration for animations and interactions. */
  feedback: {
    /** Resource ticker animation settings */
    resourceTicker: {
      /** Enable animated resource deltas */
      enabled: boolean;
      /** Animation duration in milliseconds */
      durationMs: number;
      /** Easing function for animations */
      easing: string;
      /** Show positive deltas with + prefix */
      showPositivePrefix: boolean;
      /** Color for positive deltas */
      positiveColor: string;
      /** Color for negative deltas */
      negativeColor: string;
    };
    /** Audio feedback settings */
    audio: {
      /** Enable audio feedback */
      enabled: boolean;
      /** Volume level (0-1) */
      volume: number;
    };
    /** Haptic feedback settings */
    haptics: {
      /** Enable haptic feedback */
      enabled: boolean;
      /** Vibration pattern for interactions */
      vibrationPattern: number[];
    };
  };
  /** Localized copy for drag-and-drop rejection reasons. */
  dropCopy: Record<MinimalGameplayDropReason, string>;
  /** Action panel configuration for buy food and quest demo buttons. */
  actionPanel: {
    buyFood: {
      label: string;
      tooltip: string;
      iconToken: string;
      defaultQuantity: number;
    };
    startQuestDemo: {
      label: string;
      tooltip: string;
      iconToken: string;
    };
  };
  /** Error messages for action failures. */
  errorMessages: {
    insufficientGold: string;
    residentBusy: string;
    questLocked: string;
  };
  /** Game over configuration for modal display and behavior. */
  gameOver: MinimalGameplayGameOverConfig;
}

export interface MinimalGameplayGameOverStatsLayout {
  showDaysSurvived: boolean;
  showGoldEarned: boolean;
  showQuestsCompleted: boolean;
  showResidentsLost: boolean;
  showFinalRoster: boolean;
}

export interface MinimalGameplayGameOverMessage {
  title: string;
  description: string;
  ctaText: string;
}

export interface MinimalGameplayGameOverMessages {
  food_depleted: MinimalGameplayGameOverMessage;
  all_injured: MinimalGameplayGameOverMessage;
  manual_reset: MinimalGameplayGameOverMessage;
}

export interface MinimalGameplayGameOverConfig {
  messages: MinimalGameplayGameOverMessages;
  statsLayout: MinimalGameplayGameOverStatsLayout;
  enableRestart: boolean;
  telemetryTags: string[];
}

export interface MinimalGameplayGameOverReasons {
  /** Food reserves depleted to zero. */
  food_depleted: 'food_depleted';
  /** All residents are injured and cannot work. */
  all_injured: 'all_injured';
  /** Manual reset triggered by user. */
  manual_reset: 'manual_reset';
}

export type MinimalGameplayGameOverReason = keyof MinimalGameplayGameOverReasons;

export interface MinimalGameplayGameOverMessageConfig {
  /** Main title shown in the modal. */
  title: string;
  /** Descriptive message explaining the game over reason. */
  description: string;
  /** Optional call-to-action text for restart button. */
  ctaText?: string;
}

export interface MinimalGameplayGameOverStatsLayout {
  /** Whether to show days survived. */
  showDaysSurvived: boolean;
  /** Whether to show gold earned. */
  showGoldEarned: boolean;
  /** Whether to show quests completed. */
  showQuestsCompleted: boolean;
  /** Whether to show residents lost to injury. */
  showResidentsLost: boolean;
  /** Whether to show final roster status. */
  showFinalRoster: boolean;
}

export interface MinimalGameplayGameOverConfig {
  /** Localized messages for each game over reason. */
  messages: MinimalGameplayGameOverMessages;
  /** Which statistics to display in the summary. */
  statsLayout: MinimalGameplayGameOverStatsLayout;
  /** Whether to show restart button. */
  enableRestart: boolean;
  /** Telemetry tags for game over events. */
  telemetryTags: string[];
}

export interface MinimalGameplayLocationDefinition {
  id: string;
  label: string;
  /** Primary icon/emoji used by the map and UI cards. */
  icon: string;
  /** ActivityDefinition.id used when resolving jobs/quests. */
  activityId: string;
  /** Slot identifier used by the Minimal Gameplay map. */
  slotId: string;
  description: string;
  telemetryTags?: string[];
  recommendedStatTags?: string[];
}

export interface MinimalGameplayResidentDefinition {
  id: string;
  /** Human-readable identifier shown in roster UI. */
  name: string;
  /** Label consumed by config-driven checklists and docs; defaults to name. */
  label: string;
  level: number;
  stats: Record<string, number>;
  fatigue: number;
  traits?: string[];
  isInjured?: boolean;
}

export interface MinimalGameplayConfig {
  version: string;
  loop: MinimalGameplayLoopTimingsConfig;
  ui: MinimalGameplayUIConfig;
  locations: MinimalGameplayLocationDefinition[];
  residents: MinimalGameplayResidentDefinition[];
  feedback: MinimalGameplayFeedbackConfig;
  defaultEventLog: VillageEvent[];
}

const VERSION = '0.1.0-minimal-gameplay';

export const MINIMAL_GAMEPLAY_LOOP_TIMINGS: MinimalGameplayLoopTimingsConfig = {
  tickIntervalMs: 1_000,
  autosaveIntervalMs: 30_000,
  warmupDelayMs: 1_200,
  maxSpeedMultiplier: 5,
  defaultSpeedMultiplier: 1,
};

export const MINIMAL_GAMEPLAY_UI_CONFIG: MinimalGameplayUIConfig = {
  hero: {
    subtitle: 'Calibrazione Shell',
    description: 'Loop compatto per validare job, quest e market con 1 residente.',
    themeToken: 'calibration',
  },
  hudFields: [
    { id: 'day', label: 'Day', format: 'day-label' },
    { id: 'gold', label: 'Gold', format: 'integer', supportsWarningBadge: false },
    { id: 'food', label: 'Food', format: 'integer', supportsWarningBadge: true },
    { id: 'fatigue', label: 'Fatigue', format: 'percentage', supportsWarningBadge: true },
  ],
  logDisplayLimit: 5,
  showGameOverPanel: true,
  styleLabPreset: 'epicFrontier',
  tokens: {
    accentHex: '#c9a227',
    heroBackground: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
    cardRadiusPx: 24,
    dangerHex: '#ef4444',
  },
  warningTokens: {
    fatigueWarningBg: 'rgba(251, 191, 36, 0.1)',
    foodWarningBg: 'rgba(239, 68, 68, 0.1)',
    injuryWarningBg: 'rgba(220, 38, 38, 0.1)',
    warningTextHex: '#1f2937',
    warningBorderHex: '#f59e0b',
  },
  thresholds: {
    fatigueDangerPercent: 0.7, // 70% fatigue triggers warning
    foodDangerDays: 2, // 2 days of food triggers warning
    injuryBadgeCopy: 'Injured',
  },
  tooltips: {
    gold: 'Current gold reserves. Earned from mining and other activities.',
    food: 'Food supplies remaining. Consumed daily by residents.',
    day: 'Current day in the village cycle. Advances with time.',
    fatigue: 'Average resident fatigue level. High fatigue reduces efficiency.',
  },
  dropCopy: {
    resident_not_found: 'Resident non trovato nel roster corrente.',
    activity_not_found: 'Attività non configurata per questo slot.',
    activity_in_progress: 'Slot già occupato: attendi completamento o libera manualmente.',
    resident_injured: 'Questo residente è infortunato e deve riposare.',
    resident_busy: 'Il residente è già assegnato a un’altra attività.',
    resident_exhausted: 'Fatica troppo alta: fallo riposare prima di un nuovo incarico.',
    insufficient_resources: 'Risorse insufficienti per avviare questa attività.',
    stat_requirement_failed: 'Requisiti di statistica non soddisfatti.',
    unknown: 'Assegnazione non valida per motivi sconosciuti.',
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
  },
  errorMessages: {
    insufficientGold: 'Oro insufficiente per comprare cibo',
    residentBusy: 'Il residente è già occupato',
    questLocked: 'Quest bloccata o requisiti non soddisfatti',
  },
  gameOver: {
    messages: {
      food_depleted: {
        title: 'Game Over: Starvation',
        description: 'Your village has run out of food. All residents have starved and the settlement has collapsed.',
        ctaText: 'Start New Village',
      },
      all_injured: {
        title: 'Game Over: All Injured',
        description: 'All of your residents are too injured to work. Without workers, the village cannot sustain itself.',
        ctaText: 'Restart Settlement',
      },
      manual_reset: {
        title: 'Village Reset',
        description: 'You have chosen to reset your village and start fresh.',
        ctaText: 'Begin Again',
      },
    },
    statsLayout: {
      showDaysSurvived: true,
      showGoldEarned: true,
      showQuestsCompleted: true,
      showResidentsLost: true,
      showFinalRoster: true,
    },
    enableRestart: true,
    telemetryTags: ['minimal-gameplay', 'game-over'],
  },
  feedback: {
    resourceTicker: {
      enabled: true,
      durationMs: 900,
      easing: 'easeInOutCubic',
      showPositivePrefix: true,
      positiveColor: '#22c55e',
      negativeColor: '#ef4444',
    },
    audio: {
      enabled: false,
      volume: 0.5,
    },
    haptics: {
      enabled: false,
      vibrationPattern: [50],
    },
  },
};

const MINIMAL_GAMEPLAY_FEEDBACK_CONFIG: MinimalGameplayFeedbackConfig = {
  resourceTicker: {
    enabled: true,
    durationMs: 900,
    easing: 'easeInOutCubic',
    showPositivePrefix: true,
    positiveColor: '#22c55e',
    negativeColor: '#ef4444',
    showFatigueDelta: true,
  },
  slotGlow: {
    enabled: true,
    idle: {
      borderColor: 'rgba(201,162,39,0.35)',
      backgroundColor: 'rgba(6,8,14,0.65)',
      boxShadow: '0 0 18px rgba(6,8,14,0.45)',
      opacity: 0.9,
    },
    valid: {
      borderColor: 'rgba(34,197,94,0.9)',
      backgroundColor: 'rgba(34,197,94,0.18)',
      boxShadow: '0 0 45px rgba(34,197,94,0.65)',
    },
    invalid: {
      borderColor: 'rgba(239,68,68,0.75)',
      backgroundColor: 'rgba(239,68,68,0.18)',
      boxShadow: '0 0 35px rgba(239,68,68,0.55)',
    },
    warning: {
      borderColor: 'rgba(245,158,11,0.75)',
      backgroundColor: 'rgba(245,158,11,0.15)',
      boxShadow: '0 0 35px rgba(245,158,11,0.5)',
    },
    blocked: {
      borderColor: 'rgba(148,163,184,0.65)',
      backgroundColor: 'rgba(15,23,42,0.65)',
      boxShadow: '0 0 25px rgba(148,163,184,0.35)',
      opacity: 0.5,
    },
    highlight: {
      stabilizeMs: 120,
      focusScale: 1.04,
      hoverScale: 1.02,
      selectedScale: 1.05,
      invalidOpacity: 0.35,
      transitionMs: 220,
    },
    visuals: {
      particlesEnabled: true,
      clampOverflow: true,
    },
  },
  sensory: {
    audio: {
      enabled: true, // Enable audio for drag-drop testing
      successSound: 'minimal/feedback-valid.mp3',
      warningSound: 'minimal/feedback-warning.mp3',
      blockedSound: 'minimal/feedback-blocked.mp3',
      volume: 0.5,
    },
    haptics: {
      enabled: false,
      successPattern: [10, 30, 10],
      warningPattern: [60, 40, 60],
      blockedPattern: [120, 60, 120],
    },
  },
};

export const MINIMAL_GAMEPLAY_LOCATIONS: MinimalGameplayLocationDefinition[] = [
  {
    id: 'location_gold_mine',
    label: 'Gold Mine',
    icon: '',
    activityId: 'job_gold_mine_minimal',
    slotId: 'gold_mine_slot',
    description: 'Loop base: +5 gold ogni 5s, esercita EconomyEngine.',
    telemetryTags: ['economy', 'job'],
    recommendedStatTags: ['strength', 'endurance'],
  },
  {
    id: 'location_wood_gathering',
    label: 'Wood Gathering',
    icon: '',
    activityId: 'job_wood_gathering_stable',
    slotId: 'wood_gathering_slot',
    description: 'Stable job: +2 wood ogni 4s, basso rischio, ripetibile all infinito.',
    telemetryTags: ['economy', 'job', 'stable'],
    recommendedStatTags: ['strength', 'endurance'],
  },
  {
    id: 'location_quest_board',
    label: 'Quest Board',
    icon: '',
    activityId: 'quest_forest_hunt_minimal',
    slotId: 'quest_board_slot',
    description: 'Quest breve per validare skill check e reward mix.',
    telemetryTags: ['quest', 'skill-check'],
    recommendedStatTags: ['perception', 'agility'],
  },
  {
    id: 'location_repeatable_quests',
    label: 'Repeatable Quests',
    icon: '',
    activityId: 'quest_gold_repeatable',
    slotId: 'repeatable_quest_slot',
    description: 'Quest ripetibile: +8 gold ogni 6s, sempre disponibile, rischio moderato.',
    telemetryTags: ['quest', 'repeatable', 'gold'],
    recommendedStatTags: ['intelligence', 'perception'],
  },
  {
    id: 'location_dangerous_quests',
    label: 'Dangerous Quests',
    icon: '',
    activityId: 'quest_dangerous_hunt',
    slotId: 'dangerous_quest_slot',
    description: 'Quest pericolosa: +15 gold ogni 8s, alto rischio, bassa probabilità successo.',
    telemetryTags: ['quest', 'danger', 'high-risk'],
    recommendedStatTags: ['strength', 'agility', 'perception'],
  },
  {
    id: 'location_market',
    label: 'Market',
    icon: '',
    activityId: 'job_market_visit_minimal',
    slotId: 'market_slot',
    description: 'Scambia gold food seguendo globalRules.baseFoodPriceInGold.',
    telemetryTags: ['economy', 'market'],
    recommendedStatTags: ['intelligence'],
  },
];

export const MINIMAL_GAMEPLAY_RESIDENTS: MinimalGameplayResidentDefinition[] = [
  {
    id: 'resident-1',
    name: 'Aurora Calder',
    label: 'Aurora Calder',
    level: 1,
    stats: {
      strength: 5,
      endurance: 5,
      agility: 4,
      intelligence: 3,
      perception: 4,
    },
    fatigue: 0,
    traits: ['generalist', 'prototype'],
  },
  {
    id: 'resident-2',
    name: 'Marcus Stone',
    label: 'Marcus Stone',
    level: 1,
    stats: {
      strength: 6,
      endurance: 6,
      agility: 3,
      intelligence: 2,
      perception: 3,
    },
    fatigue: 0,
    traits: ['warrior', 'strong'],
  },
  {
    id: 'resident-3',
    name: 'Luna Swift',
    label: 'Luna Swift',
    level: 1,
    stats: {
      strength: 4,
      endurance: 4,
      agility: 6,
      intelligence: 5,
      perception: 6,
    },
    fatigue: 0,
    traits: ['scout', 'agile'],
  },
  {
    id: 'resident-4',
    name: 'Thorin Ironforge',
    label: 'Thorin Ironforge',
    level: 1,
    stats: {
      strength: 7,
      endurance: 7,
      agility: 2,
      intelligence: 3,
      perception: 2,
    },
    fatigue: 0,
    traits: ['blacksmith', 'tank'],
  },
];

export const DEFAULT_MINIMAL_GAMEPLAY_EVENT_LOG: VillageEvent[] = [
  {
    time: 0,
    type: 'activity_scheduled',
    payload: {
      activityId: 'job_gold_mine_minimal',
      residentId: 'resident-1',
      status: 'bootstrap_complete',
    },
  },
  {
    time: 2,
    type: 'activity_completed',
    payload: {
      activityId: 'job_gold_mine_minimal',
      rewardGold: 5,
      fatigueDelta: 0.05,
    },
  },
  {
    time: 4,
    type: 'activity_scheduled',
    payload: {
      activityId: 'quest_forest_hunt_minimal',
      status: 'awaiting_skill_check',
    },
  },
];

export const MINIMAL_GAMEPLAY_CONFIG: MinimalGameplayConfig = {
  version: VERSION,
  loop: MINIMAL_GAMEPLAY_LOOP_TIMINGS,
  ui: MINIMAL_GAMEPLAY_UI_CONFIG,
  locations: MINIMAL_GAMEPLAY_LOCATIONS,
  residents: MINIMAL_GAMEPLAY_RESIDENTS,
  feedback: MINIMAL_GAMEPLAY_FEEDBACK_CONFIG,
  defaultEventLog: DEFAULT_MINIMAL_GAMEPLAY_EVENT_LOG,
};
