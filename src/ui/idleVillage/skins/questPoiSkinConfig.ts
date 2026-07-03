/**
 * QuestPOI visual skin configuration.
 * Config-first tokens for the Quest POI medallion — Empire pillar only.
 *
 * Quests are multi-phase narrative encounters (check/fight/stealth/explore).
 * Visual grammar: crimson-gold imperial danger, phase-dot row, risk rating badge.
 * On click opens QuestChronicle detail panel (not ActivityCapsuleDetailSkinAware).
 */

/**
 * SVG corona layer colors for GenericPoiSkin integration.
 */
export interface QuestPoiCorona {
  coronaCore: { r: number; g: number; b: number };
  coronaGlow: { r: number; g: number; b: number };
  rimColors: [string, string, string];
  stoneColors: [string, string];
  stoneAmbient: string;
  pinColor: string;
}

/**
 * Status palettes per quest runtime state.
 */
export interface QuestPoiStatusPalettes {
  /** Quest is visible and can be started. */
  available: QuestPoiCorona;
  /** Quest is active — at least one phase in progress. */
  inProgress: QuestPoiCorona;
  /** All phases resolved successfully. */
  completed: QuestPoiCorona;
  /** Quest failed — one or more critical phases failed. */
  failed: QuestPoiCorona;
}

/**
 * Phase dot indicator tokens.
 * Shown as a row of small circles below the medallion, one per phase.
 */
export interface QuestPoiPhaseDotsConfig {
  /** Dot for a phase not yet reached. */
  lockedColor: string;
  /** Dot for the currently active phase. */
  activeColor: string;
  /** Dot for a successfully completed phase. */
  successColor: string;
  /** Dot for a failed phase. */
  failureColor: string;
  /** Glow filter for the active dot. */
  activeGlow: string;
  /** Dot size in pixels. */
  dotSize: number;
  /** Gap between dots in pixels. */
  dotGap: number;
  /** Max dots to show before "+N more" overflow. */
  maxVisible: number;
}

/**
 * Danger rating badge tokens.
 */
export interface QuestPoiDangerConfig {
  /** Color when dangerRating ≤ 3 (low). */
  lowColor: string;
  /** Color when dangerRating ≤ 6 (moderate). */
  medColor: string;
  /** Color when dangerRating > 6 (high). */
  highColor: string;
  /** Icon prefix for the badge (e.g. "⚠️"). */
  icon: string;
}

/**
 * Complete visual configuration for a QuestPOI instance.
 */
export interface QuestPoiConfig {
  size: number;
  pillar: 'empire';
  palettes: QuestPoiStatusPalettes;
  phaseDots: QuestPoiPhaseDotsConfig;
  danger: QuestPoiDangerConfig;
  /** Whether to render the phase dot row below the medallion. */
  showPhaseDots: boolean;
  /** Whether to show the danger rating badge. */
  showDangerBadge: boolean;
}

/**
 * Versioned preset wrapping a QuestPoiConfig with metadata.
 */
export interface QuestPoiSkinPreset {
  id: string;
  label: string;
  description: string;
  version: number;
  supportedPresets: string[];
  config: QuestPoiConfig;
  cssVars: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

const AVAILABLE_PALETTE: QuestPoiCorona = {
  coronaCore: { r: 185, g: 28, b: 28 },
  coronaGlow: { r: 220, g: 50, b: 50 },
  rimColors: ['#fca5a5', '#b91c1c', '#1c0404'],
  stoneColors: ['#1a0606', '#040101'],
  stoneAmbient: 'rgba(220,60,60,.20)',
  pinColor: 'rgba(252,165,165,.70)',
};

const IN_PROGRESS_PALETTE: QuestPoiCorona = {
  coronaCore: { r: 200, g: 80, b: 20 },
  coronaGlow: { r: 240, g: 110, b: 30 },
  rimColors: ['#fdba74', '#c2410c', '#1c0802'],
  stoneColors: ['#1a0c04', '#040201'],
  stoneAmbient: 'rgba(240,120,40,.22)',
  pinColor: 'rgba(253,186,116,.72)',
};

const COMPLETED_PALETTE: QuestPoiCorona = {
  coronaCore: { r: 200, g: 160, b: 20 },
  coronaGlow: { r: 240, g: 200, b: 40 },
  rimColors: ['#fef08a', '#ca8a04', '#1c1000'],
  stoneColors: ['#1a1400', '#040300'],
  stoneAmbient: 'rgba(240,200,50,.24)',
  pinColor: 'rgba(254,240,138,.80)',
};

const FAILED_PALETTE: QuestPoiCorona = {
  coronaCore: { r: 70, g: 70, b: 75 },
  coronaGlow: { r: 90, g: 90, b: 95 },
  rimColors: ['#94a3b8', '#475569', '#0f172a'],
  stoneColors: ['#0f1520', '#020508'],
  stoneAmbient: 'rgba(148,163,184,.12)',
  pinColor: 'rgba(148,163,184,.55)',
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const defaultQuestPoiConfig: QuestPoiConfig = {
  size: 120,
  pillar: 'empire',
  palettes: {
    available: AVAILABLE_PALETTE,
    inProgress: IN_PROGRESS_PALETTE,
    completed: COMPLETED_PALETTE,
    failed: FAILED_PALETTE,
  },
  phaseDots: {
    lockedColor: 'rgba(71,85,105,.55)',
    activeColor: 'rgba(253,186,116,.95)',
    successColor: 'rgba(74,222,128,.90)',
    failureColor: 'rgba(248,113,113,.90)',
    activeGlow: '0 0 6px rgba(253,186,116,.70)',
    dotSize: 7,
    dotGap: 5,
    maxVisible: 5,
  },
  danger: {
    lowColor: 'rgba(74,222,128,.90)',
    medColor: 'rgba(251,191,36,.90)',
    highColor: 'rgba(248,113,113,.90)',
    icon: '⚠️',
  },
  showPhaseDots: true,
  showDangerBadge: true,
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const EMPIRE_QUEST_DEFAULT_PRESET: QuestPoiSkinPreset = {
  id: 'empire_quest_default',
  label: 'Empire Quest (Default)',
  description: 'Crimson-gold imperial style for multi-phase narrative quests.',
  version: 1,
  supportedPresets: ['minimal_frontier', 'minimal-frontier'],
  config: defaultQuestPoiConfig,
  cssVars: {
    '--quest-poi-size': '120px',
    '--quest-poi-pillar': 'empire',
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Returns the QuestPOI skin preset for a given Style Lab preset ID.
 */
export function getQuestPoiSkinForPreset(presetId?: string): QuestPoiSkinPreset {
  switch (presetId) {
    case 'empire_quest_default':
    case 'minimal_frontier':
    case 'minimal-frontier':
    default:
      return EMPIRE_QUEST_DEFAULT_PRESET;
  }
}

/**
 * Resolves a Style Lab preset ID to the canonical QuestPOI preset ID.
 */
export function resolveQuestPoiPresetId(presetId?: string): string {
  switch (presetId) {
    case 'minimal-frontier':
    case 'minimal_frontier':
    case 'empire_quest_default':
    default:
      return 'empire_quest_default';
  }
}
