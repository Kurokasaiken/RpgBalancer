/**
 * MagicCircleHalo visual skin configuration.
 *
 * This is the skin config for the quest-POI timer halo: an arcane inscription
 * that writes itself into existence around the POI while a quest runs.
 *
 * Visual grammar (desiderata v3, FROZEN):
 * - The circle does NOT exist at t=0. No ring, no track, no faded guide.
 * - Characters materialise one by one starting at 12 o'clock, clockwise.
 * - Where the light has been lit, it stays lit. The writing IS the circle.
 * - At completion the formation locks in with a stronger energy pulse.
 *
 * The glyphs are NOT font characters and NOT decorative runes: they are thin
 * stroke paths built from a shared construction grammar (a spine plus accents
 * in a normalised 10x14 box) so they read as one written language. The
 * definitive glyph language is owned by R-006 (POI reskin) — swapping
 * `glyphPaths` here is the single point of change.
 */

/**
 * Colour and glow properties for the inscription.
 */
export interface MagicCircleHaloPalette {
  /** Stroke colour of a materialised glyph. */
  glyphColor: string;
  /** Colour of the glow halo around each glyph. */
  glowColor: string;
  /** Glow blur radius in px while the inscription is forming. */
  glowRadius: number;
  /** Glow blur radius in px once the circle is complete. */
  completionGlowRadius: number;
  /** Colour of the completion energy pulse. */
  pulseColor: string;
}

/**
 * Complete configuration for MagicCircleHalo appearance and timing.
 */
export interface MagicCircleHaloConfig {
  /** Rendered box size in pixels (the halo is square). */
  size: number;
  /** Number of characters that make up the full inscription. */
  glyphCount: number;
  /** Inscription radius as a fraction of half the box size. */
  radiusRatio: number;
  /** Glyph height in pixels (the 10x14 box is scaled to this). */
  glyphSize: number;
  /** Stroke width of a glyph path in screen pixels (non-scaling stroke). */
  glyphStrokeWidth: number;
  /** Duration in ms of a single character's materialisation. */
  materialiseDurationMs: number;
  /** Duration in ms of one completion pulse cycle. */
  completionPulseDurationMs: number;
  /** Angle in degrees at which the inscription starts. -90 = 12 o'clock. */
  startAngleDeg: number;
  /** Whether the inscription is written clockwise. */
  clockwise: boolean;
  /**
   * Maximum radial wobble in px applied while forming, easing to 0 at
   * completion — "slightly irregular during formation, perfectly resolved
   * once the circle is closed".
   */
  formationJitterPx: number;
  /** Stroke path templates in a normalised 10 wide x 14 tall box. */
  glyphPaths: string[];
  /** Palette for the inscription. */
  palette: MagicCircleHaloPalette;
}

/**
 * Complete preset including metadata and CSS variables.
 */
export interface MagicCircleHaloSkinPresetConfig {
  /** Unique identifier for the preset. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Description of the preset's purpose. */
  description: string;
  /** Version number for compatibility tracking. */
  version: number;
  /** List of supported Style Lab preset IDs. */
  supportedPresets: string[];
  /** Visual configuration for the preset. */
  config: MagicCircleHaloConfig;
  /** CSS custom properties exposed by the preset. */
  cssVars: Record<string, string>;
}

/**
 * The arcane alphabet: thin stroke paths sharing one construction grammar.
 *
 * Every glyph lives in a 10 wide x 14 tall box and is drawn with the same
 * stroke weight and round caps. Most carry a vertical spine with accents,
 * which is what makes the set read as a single written language rather than
 * a pile of unrelated symbols.
 */
const ARCANE_GLYPH_PATHS: string[] = [
  'M5 1 L5 13',
  'M5 1 L5 13 M2 4 L8 4',
  'M5 1 L5 13 M2 10 L8 10',
  'M5 1 L5 13 M5 7 L9 3',
  'M5 1 L5 13 M5 7 L1 3',
  'M3 1 Q8 7 3 13',
  'M7 1 Q2 7 7 13',
  'M5 1 L5 13 M2 2 Q5 5 8 2',
  'M2 3 Q5 8 8 3 M5 8 L5 13',
  'M5 2 A3 3 0 1 1 5 8 M5 8 L5 13',
  'M5 1 L5 9 A2.5 2.5 0 1 0 5 13',
  'M2 1 L8 1 M5 1 L5 13',
  'M2 13 L5 1 L8 13',
  'M5 1 L5 13 M3 6 L7 6 M3 9 L7 9',
  'M4 1 Q9 4 4 7 Q9 10 4 13',
  'M5 1 L5 13 M2 7 Q5 11 8 7',
];

export const defaultMagicCircleHaloConfig: MagicCircleHaloConfig = {
  // The box matches the POI medallion's own square. The medallion draws its orb
  // inset within that square, so the radius ratio is tuned to sit just outside
  // the orb's glow: pushed further out the inscription stops reading as
  // belonging to the POI and floats beside it.
  size: 200,
  glyphCount: 36,
  radiusRatio: 0.78,
  glyphSize: 13,
  glyphStrokeWidth: 0.85,
  materialiseDurationMs: 420,
  completionPulseDurationMs: 1600,
  startAngleDeg: -90,
  clockwise: true,
  formationJitterPx: 1.6,
  glyphPaths: ARCANE_GLYPH_PATHS,
  palette: {
    glyphColor: '#f7e6a8',
    glowColor: 'rgba(246, 205, 110, 0.95)',
    glowRadius: 3.5,
    completionGlowRadius: 7,
    pulseColor: 'rgba(252, 232, 144, 0.5)',
  },
};

export const EMPIRE_MAGIC_CIRCLE_HALO_PRESET: MagicCircleHaloSkinPresetConfig = {
  id: 'empire_magic_circle_default',
  label: 'Empire Magic Circle (Default)',
  description:
    'Arcane inscription that writes itself clockwise from 12 o\'clock around a quest POI.',
  version: 1,
  supportedPresets: ['base', 'minimal_frontier', 'minimal-frontier'],
  config: defaultMagicCircleHaloConfig,
  cssVars: {
    '--magic-circle-size': '200px',
    '--magic-circle-glyph-color': '#f7e6a8',
  },
};

/**
 * Gets the MagicCircleHalo skin preset for a given Style Lab preset ID.
 * @param presetId - Optional Style Lab preset ID
 * @returns The corresponding MagicCircleHalo skin preset
 */
export function getMagicCircleHaloSkinForPreset(
  presetId?: string,
): MagicCircleHaloSkinPresetConfig {
  switch (presetId) {
    case 'base':
    case 'minimal_frontier':
    case 'minimal-frontier':
    default:
      return EMPIRE_MAGIC_CIRCLE_HALO_PRESET;
  }
}

/**
 * Resolves a Style Lab preset ID to the canonical MagicCircleHalo preset ID.
 * @param presetId - Optional Style Lab preset ID to resolve
 * @returns The canonical preset ID for MagicCircleHalo
 */
export function resolveMagicCircleHaloPresetId(presetId?: string): string {
  switch (presetId) {
    case 'minimal-frontier':
    case 'minimal_frontier':
      return 'minimal_frontier';
    case 'base':
      return 'base';
    default:
      return 'base';
  }
}
