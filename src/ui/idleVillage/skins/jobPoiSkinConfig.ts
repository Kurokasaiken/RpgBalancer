/**
 * JobPOI visual skin configuration.
 * Config-first tokens for the Job POI medallion — Wilderness pillar only.
 *
 * Jobs are continuous, cyclic activities (chopping wood, farming, mining).
 * Visual grammar: organic amber/gold with fatigue indicator and drop zone.
 */

/**
 * SVG corona layer colors for GenericPoiSkin integration.
 */
export interface JobPoiCorona {
  /** Core color of the animated progress ring (RGB channels). */
  coronaCore: { r: number; g: number; b: number };
  /** Outer bloom glow of the progress ring (RGB channels). */
  coronaGlow: { r: number; g: number; b: number };
  /** Rim gradient stops [highlight, mid, shadow]. */
  rimColors: [string, string, string];
  /** Stone field gradient stops [inner, outer]. */
  stoneColors: [string, string];
  /** Ambient radial glow color on the stone field. */
  stoneAmbient: string;
  /** Pin icon tint. */
  pinColor: string;
}

/**
 * Job-specific status palettes — one per runtime state.
 */
export interface JobPoiStatusPalettes {
  /** Resident assigned and working normally. */
  working: JobPoiCorona;
  /** No resident assigned or job not started. */
  idle: JobPoiCorona;
  /** Assigned resident's fatigue has hit the cap — job stalled. */
  exhausted: JobPoiCorona;
}

/**
 * Drop zone visual tokens shown below the POI medallion.
 */
export interface JobPoiDropZoneConfig {
  /** Label when no resident is assigned. */
  emptyLabel: string;
  /** Label during active drag hover. */
  dragOverLabel: string;
  /** Label when drag is invalid (e.g., resident already assigned). */
  invalidLabel: string;
  /** Border color in empty state. */
  emptyBorderColor: string;
  /** Background tint in empty state. */
  emptyBackground: string;
  /** Border color when a valid drag hovers. */
  validBorderColor: string;
  /** Background tint for valid hover. */
  validBackground: string;
  /** Border color when drop is invalid. */
  invalidBorderColor: string;
  /** Background tint for invalid hover. */
  invalidBackground: string;
}

/**
 * Complete visual configuration for a JobPOI instance.
 */
export interface JobPoiConfig {
  /** Default render size in pixels. */
  size: number;
  /** Pillar is always Wilderness for jobs. */
  pillar: 'wilderness';
  /** Corona tokens per status. */
  palettes: JobPoiStatusPalettes;
  /** Fatigue bar accent color (0% = full, 100% = exhausted). */
  fatigueBarColor: string;
  /** Overlay tint applied to the whole component when exhausted. */
  exhaustedOverlayColor: string;
  /** Color of the resource reward badge text. */
  rewardBadgeColor: string;
  /** Drop zone visual config. */
  dropZone: JobPoiDropZoneConfig;
  /** Whether to render the drop zone below the medallion. */
  enableDropZone: boolean;
}

/**
 * Versioned preset wrapping a JobPoiConfig with metadata.
 */
export interface JobPoiSkinPreset {
  id: string;
  label: string;
  description: string;
  version: number;
  supportedPresets: string[];
  config: JobPoiConfig;
  cssVars: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

const WORKING_PALETTE: JobPoiCorona = {
  coronaCore: { r: 139, g: 105, b: 20 },
  coronaGlow: { r: 180, g: 140, b: 40 },
  rimColors: ['#fce890', '#c09030', '#200e02'],
  stoneColors: ['#1e1608', '#030202'],
  stoneAmbient: 'rgba(255,220,120,.22)',
  pinColor: 'rgba(205,190,148,.72)',
};

const IDLE_PALETTE: JobPoiCorona = {
  coronaCore: { r: 90, g: 70, b: 18 },
  coronaGlow: { r: 110, g: 88, b: 24 },
  rimColors: ['#c0a040', '#806020', '#150900'],
  stoneColors: ['#161004', '#020101'],
  stoneAmbient: 'rgba(200,170,80,.14)',
  pinColor: 'rgba(170,155,110,.55)',
};

const EXHAUSTED_PALETTE: JobPoiCorona = {
  coronaCore: { r: 80, g: 80, b: 80 },
  coronaGlow: { r: 100, g: 100, b: 100 },
  rimColors: ['#b0b0b0', '#707070', '#1a1a1a'],
  stoneColors: ['#141414', '#020202'],
  stoneAmbient: 'rgba(180,180,180,.12)',
  pinColor: 'rgba(160,160,160,.60)',
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const defaultJobPoiConfig: JobPoiConfig = {
  size: 120,
  pillar: 'wilderness',
  palettes: {
    working: WORKING_PALETTE,
    idle: IDLE_PALETTE,
    exhausted: EXHAUSTED_PALETTE,
  },
  fatigueBarColor: '#f59e0b',
  exhaustedOverlayColor: 'transparent',
  rewardBadgeColor: 'rgba(251,191,36,.90)',
  enableDropZone: true,
  dropZone: {
    emptyLabel: 'Drag resident here',
    dragOverLabel: 'Drop to assign',
    invalidLabel: 'Cannot assign',
    emptyBorderColor: 'rgba(100,120,80,.45)',
    emptyBackground: 'rgba(30,40,20,.30)',
    validBorderColor: 'rgba(74,222,128,.70)',
    validBackground: 'rgba(20,80,40,.35)',
    invalidBorderColor: 'rgba(248,113,113,.60)',
    invalidBackground: 'rgba(80,20,20,.30)',
  },
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const WILDERNESS_JOB_DEFAULT_PRESET: JobPoiSkinPreset = {
  id: 'wilderness_job_default',
  label: 'Wilderness Job (Default)',
  description: 'Amber-gold organic style for repeatable village jobs.',
  version: 1,
  supportedPresets: ['minimal_frontier', 'minimal-frontier'],
  config: defaultJobPoiConfig,
  cssVars: {
    '--job-poi-size': '120px',
    '--job-poi-fatigue-color': '#f59e0b',
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Returns the JobPOI skin preset for a given Style Lab preset ID.
 */
export function getJobPoiSkinForPreset(presetId?: string): JobPoiSkinPreset {
  switch (presetId) {
    case 'minimal_frontier':
    case 'minimal-frontier':
    default:
      return WILDERNESS_JOB_DEFAULT_PRESET;
  }
}

/**
 * Resolves a Style Lab preset ID to the canonical JobPOI preset ID.
 */
export function resolveJobPoiPresetId(presetId?: string): string {
  switch (presetId) {
    case 'minimal-frontier':
    case 'minimal_frontier':
    default:
      return 'wilderness_job_default';
  }
}
