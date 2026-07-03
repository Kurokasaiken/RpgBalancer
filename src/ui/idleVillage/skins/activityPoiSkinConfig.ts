/**
 * ActivityPOI visual skin configuration.
 * Config-first tokens for the Activity POI medallion.
 *
 * Activities are one-shot timed events (training, maintenance, exploration).
 * Two pillars: Frontier (natural danger, teal-slate) or Empire (structured risk, bronze-indigo).
 * Visual grammar: countdown timer badge, risk stripe, single resident slot.
 */

/**
 * SVG corona layer colors for GenericPoiSkin integration.
 */
export interface ActivityPoiCorona {
  coronaCore: { r: number; g: number; b: number };
  coronaGlow: { r: number; g: number; b: number };
  rimColors: [string, string, string];
  stoneColors: [string, string];
  stoneAmbient: string;
  pinColor: string;
}

/**
 * Status palettes for ActivityPOI runtime states.
 */
export interface ActivityPoiStatusPalettes {
  /** Activity not started, available to schedule. */
  idle: ActivityPoiCorona;
  /** Activity running with a resident assigned. */
  inProgress: ActivityPoiCorona;
  /** Activity finished, awaiting collect. */
  completed: ActivityPoiCorona;
  /** Activity cannot be started (missing requirements). */
  blocked: ActivityPoiCorona;
}

/**
 * Risk display tokens for the danger badge overlay.
 */
export interface ActivityPoiRiskConfig {
  /** Color when dangerRating is 0–2 (safe). */
  lowColor: string;
  /** Color when dangerRating is 3–5 (moderate). */
  medColor: string;
  /** Color when dangerRating is 6–10 (high). */
  highColor: string;
  /** Label prefix, e.g. "Risk". */
  badgeLabel: string;
}

/**
 * Countdown timer badge tokens.
 */
export interface ActivityPoiTimerConfig {
  /** Text color for the timer. */
  textColor: string;
  /** Background of the timer badge pill. */
  background: string;
  /** Border of the timer badge pill. */
  border: string;
}

/**
 * Complete visual configuration for an ActivityPOI instance.
 */
export interface ActivityPoiConfig {
  size: number;
  pillar: 'frontier' | 'empire';
  palettes: ActivityPoiStatusPalettes;
  risk: ActivityPoiRiskConfig;
  timer: ActivityPoiTimerConfig;
  /** Whether to show the countdown timer badge. */
  showTimer: boolean;
  /** Whether to show the risk/danger badge. */
  showRiskBadge: boolean;
}

/**
 * Versioned preset wrapping an ActivityPoiConfig with metadata.
 */
export interface ActivityPoiSkinPreset {
  id: string;
  label: string;
  description: string;
  version: number;
  supportedPresets: string[];
  config: ActivityPoiConfig;
  cssVars: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Frontier palettes (teal-slate — exploration, training, survival)
// ---------------------------------------------------------------------------

const FRONTIER_IDLE: ActivityPoiCorona = {
  coronaCore: { r: 42, g: 100, b: 120 },
  coronaGlow: { r: 56, g: 128, b: 150 },
  rimColors: ['#7dd3e8', '#2a7a96', '#061620'],
  stoneColors: ['#081620', '#010608'],
  stoneAmbient: 'rgba(56,180,200,.18)',
  pinColor: 'rgba(130,210,230,.65)',
};

const FRONTIER_IN_PROGRESS: ActivityPoiCorona = {
  coronaCore: { r: 20, g: 150, b: 170 },
  coronaGlow: { r: 34, g: 190, b: 210 },
  rimColors: ['#a8eef8', '#38b4c8', '#061e28'],
  stoneColors: ['#061820', '#010a10'],
  stoneAmbient: 'rgba(34,210,230,.24)',
  pinColor: 'rgba(160,240,255,.75)',
};

const FRONTIER_COMPLETED: ActivityPoiCorona = {
  coronaCore: { r: 22, g: 200, b: 120 },
  coronaGlow: { r: 34, g: 220, b: 140 },
  rimColors: ['#86efac', '#22c55e', '#052010'],
  stoneColors: ['#061a0e', '#010805'],
  stoneAmbient: 'rgba(34,220,130,.22)',
  pinColor: 'rgba(150,255,180,.75)',
};

const FRONTIER_BLOCKED: ActivityPoiCorona = {
  coronaCore: { r: 75, g: 75, b: 80 },
  coronaGlow: { r: 95, g: 95, b: 100 },
  rimColors: ['#a0a0b0', '#606068', '#101015'],
  stoneColors: ['#101014', '#020204'],
  stoneAmbient: 'rgba(160,160,180,.12)',
  pinColor: 'rgba(150,150,165,.55)',
};

// ---------------------------------------------------------------------------
// Empire palettes (bronze-indigo — maintenance, garrison duties)
// ---------------------------------------------------------------------------

const EMPIRE_IDLE: ActivityPoiCorona = {
  coronaCore: { r: 140, g: 90, b: 30 },
  coronaGlow: { r: 170, g: 110, b: 40 },
  rimColors: ['#f0c060', '#a06820', '#1a0e04'],
  stoneColors: ['#1c1208', '#040202'],
  stoneAmbient: 'rgba(210,160,60,.18)',
  pinColor: 'rgba(230,190,120,.65)',
};

const EMPIRE_IN_PROGRESS: ActivityPoiCorona = {
  coronaCore: { r: 100, g: 80, b: 200 },
  coronaGlow: { r: 120, g: 100, b: 220 },
  rimColors: ['#c4b5fd', '#7c3aed', '#0d0820'],
  stoneColors: ['#0e0818', '#020108'],
  stoneAmbient: 'rgba(167,139,250,.20)',
  pinColor: 'rgba(200,180,255,.72)',
};

const EMPIRE_COMPLETED: ActivityPoiCorona = {
  coronaCore: { r: 220, g: 170, b: 40 },
  coronaGlow: { r: 245, g: 200, b: 60 },
  rimColors: ['#fef08a', '#ca8a04', '#1c1000'],
  stoneColors: ['#1a1400', '#040300'],
  stoneAmbient: 'rgba(250,200,50,.24)',
  pinColor: 'rgba(255,230,130,.80)',
};

const EMPIRE_BLOCKED: ActivityPoiCorona = {
  coronaCore: { r: 75, g: 75, b: 80 },
  coronaGlow: { r: 95, g: 95, b: 100 },
  rimColors: ['#a0a0b0', '#606068', '#101015'],
  stoneColors: ['#101014', '#020204'],
  stoneAmbient: 'rgba(160,160,180,.12)',
  pinColor: 'rgba(150,150,165,.55)',
};

// ---------------------------------------------------------------------------
// Default configs
// ---------------------------------------------------------------------------

const SHARED_RISK_CONFIG: ActivityPoiRiskConfig = {
  lowColor: 'rgba(74,222,128,.90)',
  medColor: 'rgba(251,191,36,.90)',
  highColor: 'rgba(248,113,113,.90)',
  badgeLabel: 'Risk',
};

const SHARED_TIMER_CONFIG: ActivityPoiTimerConfig = {
  textColor: 'rgba(226,232,240,.90)',
  background: 'rgba(15,23,42,.75)',
  border: 'rgba(71,85,105,.60)',
};

export const defaultFrontierActivityPoiConfig: ActivityPoiConfig = {
  size: 120,
  pillar: 'frontier',
  palettes: {
    idle: FRONTIER_IDLE,
    inProgress: FRONTIER_IN_PROGRESS,
    completed: FRONTIER_COMPLETED,
    blocked: FRONTIER_BLOCKED,
  },
  risk: SHARED_RISK_CONFIG,
  timer: SHARED_TIMER_CONFIG,
  showTimer: true,
  showRiskBadge: true,
};

export const defaultEmpireActivityPoiConfig: ActivityPoiConfig = {
  size: 120,
  pillar: 'empire',
  palettes: {
    idle: EMPIRE_IDLE,
    inProgress: EMPIRE_IN_PROGRESS,
    completed: EMPIRE_COMPLETED,
    blocked: EMPIRE_BLOCKED,
  },
  risk: SHARED_RISK_CONFIG,
  timer: SHARED_TIMER_CONFIG,
  showTimer: true,
  showRiskBadge: true,
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const FRONTIER_ACTIVITY_DEFAULT_PRESET: ActivityPoiSkinPreset = {
  id: 'frontier_activity_default',
  label: 'Frontier Activity (Default)',
  description: 'Teal-slate style for one-shot frontier activities (training, exploration).',
  version: 1,
  supportedPresets: ['minimal_frontier', 'minimal-frontier'],
  config: defaultFrontierActivityPoiConfig,
  cssVars: {
    '--activity-poi-size': '120px',
    '--activity-poi-pillar': 'frontier',
  },
};

export const EMPIRE_ACTIVITY_DEFAULT_PRESET: ActivityPoiSkinPreset = {
  id: 'empire_activity_default',
  label: 'Empire Activity (Default)',
  description: 'Bronze-indigo style for empire activities (maintenance, garrison duties).',
  version: 1,
  supportedPresets: ['minimal_frontier', 'minimal-frontier'],
  config: defaultEmpireActivityPoiConfig,
  cssVars: {
    '--activity-poi-size': '120px',
    '--activity-poi-pillar': 'empire',
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Returns the ActivityPOI skin preset for a given preset ID.
 */
export function getActivityPoiSkinForPreset(presetId?: string): ActivityPoiSkinPreset {
  switch (presetId) {
    case 'empire_activity_default':
      return EMPIRE_ACTIVITY_DEFAULT_PRESET;
    case 'frontier_activity_default':
    case 'minimal_frontier':
    case 'minimal-frontier':
    default:
      return FRONTIER_ACTIVITY_DEFAULT_PRESET;
  }
}

/**
 * Resolves a Style Lab preset ID to the canonical ActivityPOI preset ID.
 */
export function resolveActivityPoiPresetId(presetId?: string): string {
  switch (presetId) {
    case 'empire_activity_default':
      return 'empire_activity_default';
    case 'minimal-frontier':
    case 'minimal_frontier':
    default:
      return 'frontier_activity_default';
  }
}
