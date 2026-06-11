/**
 * QuestChronicle Skin Configuration — "Bronze Chronicle v4"
 *
 * Config-first tokens for the cinematic quest overview component, converted
 * from the external quest_chronicle_v4.html skin: bronze physical frame with
 * noise + corner ornaments, procedural SVG cinema scene, stone table strip,
 * vertical phase cards with spherical POI and progress-driven B&W→color
 * saturation, narrative diary panel.
 *
 * Dependencies: NP-SM-010 (skin registry), Style Lab tokens
 * Integration: useSkinPreferences, PresetManager, telemetry
 */

import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

/**
 * Outer physical frame (bronze bevel) configuration.
 */
export interface QuestChronicleFrameConfig {
  /** Visual border thickness (frame padding). */
  framePadding: string;
  frameBorderRadius: string;
  innerBorderRadius: string;
  /** Metal gradient of the physical frame. */
  frameGradient: string;
  frameBoxShadow: string;
  /** Noise overlay opacity on the metal. */
  noiseOpacity: number;
  /** Corner ornament diamonds. */
  cornerColor: string;
  cornerHighlight: string;
}

/**
 * Cinema (panorama) section configuration.
 */
export interface QuestChronicleCinemaConfig {
  background: string;
  vignette: string;
  eyebrowColor: string;
  ruleGradient: string;
  titleColor: string;
  titleShadow: string;
  ctaColor: string;
  ctaBorder: string;
  ctaBackground: string;
}

/**
 * Stone table strip (below the cinema) configuration.
 */
export interface QuestChronicleTableConfig {
  background: string;
  borderTop: string;
  stoneOpacity: number;
}

/**
 * Thin segmented progress bar configuration.
 */
export interface QuestChronicleProgressConfig {
  trackBackground: string;
  trackBorder: string;
  trackHeight: string;
  segmentDivider: string;
}

/**
 * Narrative (diary) side panel configuration.
 */
export interface QuestChronicleNarrativeConfig {
  borderLeft: string;
  labelColor: string;
  labelRule: string;
  textColor: string;
  pillSuccessBorder: string;
  pillSuccessColor: string;
  pillSuccessBackground: string;
  pillFailureBorder: string;
  pillFailureColor: string;
  pillFailureBackground: string;
  statusTextColor: string;
}

/**
 * Phase card chrome (everything except per-variant palette).
 */
export interface QuestChroniclePhaseConfig {
  cardBorder: string;
  cardBackground: string;
  cardVignette: string;
  cardBorderRadius: string;
  titleColor: string;
  metaColor: string;
  injuryTextColor: string;
  deathTextColor: string;
  badgeSuccessFill: string;
  badgeSuccessStroke: string;
  badgeSuccessText: string;
  badgeFailureFill: string;
  badgeFailureStroke: string;
  badgeFailureText: string;
  /** Saturation/brightness for locked cards (B&W→color mechanic). */
  lockedSaturation: number;
  lockedBrightness: number;
  activeMinSaturation: number;
}

/**
 * Per-variant palette: POI ring/sphere, glow, procedural scene and
 * progress fill gradient.
 */
export interface QuestChronicleVariantPalette {
  /** Ring metal gradient stops (bright → dark). */
  ring0: string;
  ring1: string;
  ring2: string;
  /** Inner sphere gradient stops. */
  sphere0: string;
  sphere1: string;
  /** Active pulse glow color. */
  glow: string;
  /** Procedural mini-scene behind the POI. */
  sceneSky: string;
  sceneMid: string;
  sceneFore: string;
  sceneAura: string;
  /** Progress segment fill gradient. */
  fill: string;
  fillGlow: string;
}

export type QuestChronicleVariantKey = 'amethyst' | 'ember' | 'jade';

/**
 * Outcome splash (LoL-style victory/defeat overlay) configuration.
 */
export interface QuestChronicleOutcomePalette {
  textColor: string;
  glow: string;
  line: string;
  haze: string;
}

export interface QuestChronicleOutcomeConfig {
  victory: QuestChronicleOutcomePalette;
  partial: QuestChronicleOutcomePalette;
  defeat: QuestChronicleOutcomePalette;
  backdropColor: string;
  subLabelColor: string;
  revealDurationMs: number;
  revealEasing: string;
}

/**
 * Pillar-specific partial overrides.
 */
export interface QuestChroniclePillarConfig {
  frame?: Partial<QuestChronicleFrameConfig>;
  cinema?: Partial<QuestChronicleCinemaConfig>;
  table?: Partial<QuestChronicleTableConfig>;
  progress?: Partial<QuestChronicleProgressConfig>;
  narrative?: Partial<QuestChronicleNarrativeConfig>;
  phase?: Partial<QuestChroniclePhaseConfig>;
  variants?: Partial<Record<QuestChronicleVariantKey, Partial<QuestChronicleVariantPalette>>>;
  outcome?: Partial<QuestChronicleOutcomeConfig>;
}

/**
 * Complete QuestChronicle skin configuration.
 */
export interface QuestChronicleSkinConfig {
  frame: QuestChronicleFrameConfig;
  cinema: QuestChronicleCinemaConfig;
  table: QuestChronicleTableConfig;
  progress: QuestChronicleProgressConfig;
  narrative: QuestChronicleNarrativeConfig;
  phase: QuestChroniclePhaseConfig;
  variants: Record<QuestChronicleVariantKey, QuestChronicleVariantPalette>;
  outcome: QuestChronicleOutcomeConfig;

  /** Pillar-specific overrides. */
  wilderness: QuestChroniclePillarConfig;
  empire: QuestChroniclePillarConfig;

  /** Feature flags. */
  enableReducedMotion: boolean;
  enableTelemetry: boolean;
}

export const DEFAULT_QUEST_CHRONICLE_SKIN_CONFIG: QuestChronicleSkinConfig = {
  frame: {
    framePadding: '10px',
    frameBorderRadius: '24px',
    innerBorderRadius: '16px',
    frameGradient:
      'linear-gradient(135deg, #fce89a 0%, #e4b048 8%, #a05c18 22%, #602c08 38%, #341604 58%, #6b3a10 72%, #c8903a 84%, #f0cc70 92%, #a86820 100%)',
    frameBoxShadow:
      '0 0 0 1px rgba(0,0,0,0.9), 0 0 0 2px rgba(80,40,10,0.6), inset 0 1px 0 rgba(255,230,140,0.25), inset 0 -1px 0 rgba(40,15,5,0.8), 0 20px 60px rgba(0,0,0,0.9), 0 4px 20px rgba(120,70,10,0.3)',
    noiseOpacity: 0.7,
    cornerColor: '#e4b048',
    cornerHighlight: '#fce890',
  },
  cinema: {
    background: '#08131f',
    vignette:
      'linear-gradient(to bottom, rgba(5,5,9,.1) 0%, transparent 30%, transparent 50%, rgba(4,6,10,.72) 76%, rgba(3,5,9,.97) 100%)',
    eyebrowColor: 'rgba(195,155,55,.58)',
    ruleGradient: 'linear-gradient(to right, rgba(200,155,45,.65), transparent)',
    titleColor: '#f0e8c8',
    titleShadow: '0 0 50px rgba(195,150,40,.4), 0 2px 6px rgba(0,0,0,.9)',
    ctaColor: 'rgba(200,160,60,.75)',
    ctaBorder: '1px solid rgba(180,130,40,.35)',
    ctaBackground: 'rgba(5,5,9,.55)',
  },
  table: {
    background: '#07090e',
    borderTop: '1px solid rgba(150,115,35,.2)',
    stoneOpacity: 0.12,
  },
  progress: {
    trackBackground: 'rgba(255,255,255,.04)',
    trackBorder: '1px solid rgba(255,255,255,.03)',
    trackHeight: '5px',
    segmentDivider: 'rgba(0,0,0,.5)',
  },
  narrative: {
    borderLeft: '1px solid rgba(150,115,35,.13)',
    labelColor: 'rgba(190,145,50,.46)',
    labelRule: 'rgba(190,145,50,.26)',
    textColor: 'rgba(215,200,165,.75)',
    pillSuccessBorder: '1px solid rgba(16,185,129,.4)',
    pillSuccessColor: 'rgba(105,225,165,.9)',
    pillSuccessBackground: 'rgba(10,80,50,.2)',
    pillFailureBorder: '1px solid rgba(244,63,94,.4)',
    pillFailureColor: 'rgba(253,164,175,.9)',
    pillFailureBackground: 'rgba(90,15,30,.2)',
    statusTextColor: 'rgba(170,180,170,.4)',
  },
  phase: {
    cardBorder: '1px solid rgba(150,115,35,.16)',
    cardBackground: '#06080f',
    cardVignette: 'linear-gradient(to bottom, transparent 20%, rgba(4,6,14,.88) 100%)',
    cardBorderRadius: '10px',
    titleColor: 'rgba(230,210,160,.9)',
    metaColor: 'rgba(115,130,140,.5)',
    injuryTextColor: 'rgba(245,158,11,.75)',
    deathTextColor: 'rgba(244,63,94,.75)',
    badgeSuccessFill: '#052a16',
    badgeSuccessStroke: '#10b981',
    badgeSuccessText: '#6ee7b7',
    badgeFailureFill: '#2a0509',
    badgeFailureStroke: '#f43f5e',
    badgeFailureText: '#fda4af',
    lockedSaturation: 0,
    lockedBrightness: 0.45,
    activeMinSaturation: 0.15,
  },
  variants: {
    ember: {
      ring0: '#fcd34d',
      ring1: '#b45309',
      ring2: '#78350f',
      sphere0: '#1c0e04',
      sphere1: '#2e1508',
      glow: 'rgba(245,158,11,.65)',
      sceneSky: '#160c08',
      sceneMid: 'rgba(42,20,10,.86)',
      sceneFore: 'rgba(18,8,4,.96)',
      sceneAura: 'rgba(165,82,20,.18)',
      fill: 'linear-gradient(90deg, #92400e, #f59e0b, #fde68a)',
      fillGlow: '0 0 6px rgba(245,158,11,.55)',
    },
    amethyst: {
      ring0: '#c4b5fd',
      ring1: '#7c3aed',
      ring2: '#3b1789',
      sphere0: '#0d0818',
      sphere1: '#180d2a',
      glow: 'rgba(167,139,250,.6)',
      sceneSky: '#08090f',
      sceneMid: 'rgba(20,18,36,.88)',
      sceneFore: 'rgba(8,7,18,.97)',
      sceneAura: 'rgba(82,62,165,.14)',
      fill: 'linear-gradient(90deg, #5b21b6, #a78bfa, #ddd6fe)',
      fillGlow: '0 0 6px rgba(167,139,250,.5)',
    },
    jade: {
      ring0: '#6ee7b7',
      ring1: '#059669',
      ring2: '#064e3b',
      sphere0: '#021a12',
      sphere1: '#073020',
      glow: 'rgba(16,185,129,.6)',
      sceneSky: '#090a0a',
      sceneMid: 'rgba(14,20,18,.9)',
      sceneFore: 'rgba(5,10,8,.97)',
      sceneAura: 'rgba(20,62,40,.08)',
      fill: 'linear-gradient(90deg, #064e3b, #10b981, #6ee7b7)',
      fillGlow: '0 0 6px rgba(16,185,129,.5)',
    },
  },
  outcome: {
    victory: {
      textColor: '#f0e8c8',
      glow: 'rgba(195,150,40,.65)',
      line: 'rgba(200,155,45,.8)',
      haze: 'rgba(195,150,40,.22)',
    },
    partial: {
      textColor: '#e8d8a8',
      glow: 'rgba(234,179,8,.5)',
      line: 'rgba(234,179,8,.7)',
      haze: 'rgba(234,179,8,.18)',
    },
    defeat: {
      textColor: '#fecdd3',
      glow: 'rgba(244,63,94,.6)',
      line: 'rgba(244,63,94,.8)',
      haze: 'rgba(244,63,94,.22)',
    },
    backdropColor: 'rgba(3,5,9,.78)',
    subLabelColor: 'rgba(215,200,165,.7)',
    revealDurationMs: 700,
    revealEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  wilderness: {
    frame: {
      frameGradient:
        'linear-gradient(135deg, #d7f5cf 0%, #8ec77a 8%, #3f7a36 22%, #1d4218 38%, #0c2409 58%, #2c5a22 72%, #7ab35e 84%, #c7eab0 92%, #5c9446 100%)',
      cornerColor: '#8ec77a',
      cornerHighlight: '#d7f5cf',
    },
    cinema: {
      eyebrowColor: 'rgba(140,195,120,.6)',
      ruleGradient: 'linear-gradient(to right, rgba(120,190,95,.65), transparent)',
      titleColor: '#e4f2d4',
      titleShadow: '0 0 50px rgba(95,170,60,.4), 0 2px 6px rgba(0,0,0,.9)',
      ctaColor: 'rgba(140,200,110,.75)',
      ctaBorder: '1px solid rgba(95,170,60,.35)',
    },
    narrative: {
      labelColor: 'rgba(130,185,95,.5)',
      labelRule: 'rgba(130,185,95,.28)',
    },
    outcome: {
      victory: {
        textColor: '#e4f2d4',
        glow: 'rgba(95,170,60,.65)',
        line: 'rgba(120,190,95,.8)',
        haze: 'rgba(95,170,60,.22)',
      },
    },
  },
  empire: {
    frame: {
      frameGradient:
        'linear-gradient(135deg, #fff0b8 0%, #f0c860 8%, #b87818 22%, #703c08 38%, #401e02 58%, #7c4a0e 72%, #d8a040 84%, #ffe088 92%, #b87820 100%)',
      frameBoxShadow:
        '0 0 0 1px rgba(0,0,0,0.95), 0 0 0 3px rgba(100,55,10,0.7), inset 0 1px 0 rgba(255,240,170,0.35), inset 0 -1px 0 rgba(45,18,4,0.9), 0 24px 70px rgba(0,0,0,0.95), 0 5px 24px rgba(150,90,15,0.4)',
    },
    cinema: {
      titleColor: '#fdeec0',
    },
  },
  enableReducedMotion: true,
  enableTelemetry: false,
};

const mergeSection = <T extends object>(base: T, ...overrides: (Partial<T> | undefined)[]): T =>
  overrides.reduce<T>((acc, override) => ({ ...acc, ...(override ?? {}) }), { ...base });

const mergeVariants = (
  base: Record<QuestChronicleVariantKey, QuestChronicleVariantPalette>,
  ...overrides: (Partial<Record<QuestChronicleVariantKey, Partial<QuestChronicleVariantPalette>>> | undefined)[]
): Record<QuestChronicleVariantKey, QuestChronicleVariantPalette> => {
  const keys: QuestChronicleVariantKey[] = ['amethyst', 'ember', 'jade'];
  const result = { ...base };
  for (const override of overrides) {
    if (!override) continue;
    for (const key of keys) {
      if (override[key]) result[key] = { ...result[key], ...override[key] };
    }
  }
  return result;
};

const mergeOutcome = (
  base: QuestChronicleOutcomeConfig,
  ...overrides: (Partial<QuestChronicleOutcomeConfig> | undefined)[]
): QuestChronicleOutcomeConfig =>
  overrides.reduce<QuestChronicleOutcomeConfig>(
    (acc, override) => ({
      ...acc,
      ...(override ?? {}),
      victory: { ...acc.victory, ...(override?.victory ?? {}) },
      partial: { ...acc.partial, ...(override?.partial ?? {}) },
      defeat: { ...acc.defeat, ...(override?.defeat ?? {}) },
    }),
    { ...base },
  );

/**
 * Resolves the QuestChronicle skin config for a pillar, with optional
 * call-site overrides (highest priority).
 */
export function getQuestChronicleSkinConfig(
  pillar?: StyleLabPillar,
  overrides?: Partial<QuestChronicleSkinConfig>,
): QuestChronicleSkinConfig {
  const base = DEFAULT_QUEST_CHRONICLE_SKIN_CONFIG;
  const pillarConfig: QuestChroniclePillarConfig =
    pillar === 'wilderness' ? base.wilderness : pillar === 'empire' ? base.empire : {};

  return {
    frame: mergeSection(base.frame, pillarConfig.frame, overrides?.frame),
    cinema: mergeSection(base.cinema, pillarConfig.cinema, overrides?.cinema),
    table: mergeSection(base.table, pillarConfig.table, overrides?.table),
    progress: mergeSection(base.progress, pillarConfig.progress, overrides?.progress),
    narrative: mergeSection(base.narrative, pillarConfig.narrative, overrides?.narrative),
    phase: mergeSection(base.phase, pillarConfig.phase, overrides?.phase),
    variants: mergeVariants(base.variants, pillarConfig.variants, overrides?.variants),
    outcome: mergeOutcome(base.outcome, pillarConfig.outcome, overrides?.outcome),
    wilderness: base.wilderness,
    empire: base.empire,
    enableReducedMotion: overrides?.enableReducedMotion ?? base.enableReducedMotion,
    enableTelemetry: overrides?.enableTelemetry ?? base.enableTelemetry,
  };
}
