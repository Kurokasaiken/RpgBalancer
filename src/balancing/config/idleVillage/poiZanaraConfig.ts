/**
 * poiZanaraConfig — geometry + palette of the painted POI marker (PLAN-117,
 * Director rulings 2026-11-12 in context/DECISION_LOG.md).
 *
 * All values mirror `public/assets/ui/hud-real/poi/layers/arc-geometry.json`
 * (the baptized 1786×1873 layer canvas); the component composes the tracked
 * webp layers at runtime — nothing here may drift from that file.
 *
 * Semantics (Director ruling): job/work fills CLOCKWISE from 12 with elapsed
 * time (empty→full); quest/expedition shows the remaining deadline draining
 * COUNTER-CLOCKWISE from 12 (full→empty). Urgency is ONLY a family→red colour
 * shift — no badge, no pulse (ruling, supersedes PLAN-117 rev.5).
 */
import { z } from 'zod';

export const PoiZanaraFamilySchema = z.enum(['job', 'quest']);
export type PoiZanaraFamily = z.infer<typeof PoiZanaraFamilySchema>;

export const PoiZanaraConfigSchema = z.object({
  /** Layer canvas the webp layers are authored on (px). */
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),
  /** Total piece width incl. punte on the canvas — the 48 CSS px reference maps to this. */
  pieceWidthPx: z.number().positive(),
  /** Ring centre on the canvas (arc-geometry.json `centre`). */
  ringCentre: z.tuple([z.number(), z.number()]),
  /** Ring radius in canvas px (arc-geometry.json `ringRadius`). */
  ringRadius: z.number().positive(),
  /** Channel inner/outer edge as fractions of ringRadius (arc-geometry.json). */
  channelInner: z.number().min(0).max(1),
  channelOuter: z.number().min(0).max(1),
  /** Icon diameter in the dome as a fraction of ringRadius. */
  iconDiameterFactor: z.number().positive(),
  /** Scale on the marker's authored sizePx for the Zanara material only — the
   *  painted jewel carries less info-density than the sigillo at equal px, so
   *  on the map it renders one notch bigger (live-map ruling 2026-11-13). */
  markerScale: z.number().positive(),
  /** Enamel colours (sRGB hex). `quest` is PROVISIONAL — pending Director ruling
   *  on the sea-biome composites (favourites: #636fa1, #2f6fd0). */
  familyColor: z.object({
    job: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    quest: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  /** Urgency target colour (ruling: family → this red, OKLCH path, no brown). */
  urgentRed: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Remaining-fraction threshold at which the red shift begins — PROVISIONAL
   *  (arc-geometry.json ships 0.25; candidates under review 0.10/0.15/0.25). */
  urgentStartsAtRemaining: z.number().min(0).max(1),
  /** How the red spreads on the residual arc — PROVISIONAL pending ruling:
   *  'tip' = intensity ramp anchored at the 12 o'clock tip;
   *  'whole' = the whole residual arc blends toward red. */
  urgentMode: z.enum(['tip', 'whole']),
  /** Ramp width in degrees for the 'tip' blend near the tip. */
  urgentTipRampDeg: z.number().positive(),
  /** Navy outline around the piece silhouette on the map (the «riga attorno»):
   *  hard drop-shadow stroke + soft grounding shadow, in CSS px at 48 px size. */
  outlineColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  outlinePx: z.number().positive(),
  /** Magic-circle halo (sigillo language): canvas-px radius where the halo's
   *  OUTER rail (r=54 of the halo viewBox) lands, per family — the pieces are
   *  not the same size, so the ring hugs each frame's outer ring edge. */
  haloOuterRailPx: z.object({
    job: z.number().min(0),
    quest: z.number().min(0),
  }),
  /** Far-zoom band tone — luminous saturated family colour, readable at
   *  resting-fit distance where the dark band + runes would be mud
   *  (Director ruling 2026-11-14: «da lontano cambi colore, zoomando diventa
   *  così»). Urgency overrides with `urgentRed` as usual. */
  haloFarColor: z.object({
    job: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    quest: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  /** zoomRatio (cam.zoom / fitZoom) below which the marker is in 'far' mode —
   *  above it the near look (dark band + white runes) fades in. */
  farBelowZoomRatio: z.number().min(1),
  /** Rune ink inside the halo — luminous white over the dark family band
   *  (ruling 2026-11-14: «al posto d'oro usa il bianco luminoso», supersedes
   *  the earlier gold ink). Applied to glyphs in both the bloom pass and
   *  the crisp pass. */
  haloRuneColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Angular gaps (deg, 0 = 12 o'clock, CW) where the rune ring is NOT drawn —
   *  the punte/gioielli live there and the runes «partono dai gioielli» only.
   *  Ranges may wrap past 360 (e.g. [-13, 13]). */
  haloGapDeg: z.object({
    job: z.array(z.tuple([z.number(), z.number()])),
    quest: z.array(z.tuple([z.number(), z.number()])),
  }),
  /** How much a map anchor grows when the camera zooms in from the resting
   *  fit: screen scale = (zoom / fitZoom)^exp, clamped (0 = constant size). */
  anchorZoomScaleExp: z.number().min(0).max(1),
  /** Asset folder under /public (trailing slash). */
  assetBase: z.string().min(1),
});

export type PoiZanaraConfig = z.infer<typeof PoiZanaraConfigSchema>;

/** Parsed once — a bad file must fail loudly at import, not mid-render. */
export const POI_ZANARA_CONFIG: PoiZanaraConfig = PoiZanaraConfigSchema.parse({
  canvasWidth: 1786,
  canvasHeight: 1873,
  pieceWidthPx: 1034,
  ringCentre: [892.4912624869174, 878.1980629436448],
  ringRadius: 365.7687706453247,
  channelInner: 0.845,
  channelOuter: 0.972,
  iconDiameterFactor: 0.78,
  markerScale: 1.3,
  /* Halo band tone = the DARKEST interior enamel of each dome (Director
   *  ruling 2026-11-14: «il colore sotto la scritta deve essere il più
   *  scuro dell'interno — blu intenso e verde intenso»). Sampled on the
   *  baked bases, dark-interior quartile: job ≈ #073b21, quest ≈ #0c2864.
   *  The runes inside are luminous `haloRuneColor` white. */
  familyColor: { job: '#0b4a2a', quest: '#0e3076' },
  urgentRed: '#e8553a',
  urgentStartsAtRemaining: 0.25,
  urgentMode: 'tip',
  urgentTipRampDeg: 12,
  outlineColor: '#101f3a',
  outlinePx: 1.6,
  /* Band must hug the outer ring from OUTSIDE — never overlap the gold rim
   *  (Director ruling 2026-11-14). The halo's inner edge sits at 45−railW/2
   *  ≈ 0.811× of this radius; measured frame outer edge: job ≈ r367,
   *  quest ≈ r416 → inner rail lands just past the rim (≈373 / ≈418). */
  haloOuterRailPx: { job: 460, quest: 515 },
  haloFarColor: { job: '#23c96e', quest: '#4d82ff' },
  farBelowZoomRatio: 1.35,
  /* luminous white over the dark family band (ruling 2026-11-14: «al posto
   *  d'oro usa il bianco luminoso» — supersedes the painted-gold ink). */
  haloRuneColor: '#ffffff',
  /* Measured 2026-11-13 from the base silhouettes: sectors where the piece
   *  protrudes past the ring band (punte + jewels), +4° margin each side. */
  haloGapDeg: {
    job: [[-10, 10], [73, 108], [153, 207], [252, 287]],
    quest: [[-13, 13], [72, 109], [153, 207], [251, 288]],
  },
  anchorZoomScaleExp: 0.6,
  assetBase: '/assets/ui/hud-real/poi/',
});

/** Layer file names inside `assetBase` (all canvas-aligned 1786×1873 except the icon). */
export const POI_ZANARA_LAYERS = {
  glow: 'poi-glow-gold.webp',
  channelMask: 'layers/poi-arc-mask.webp',
  incision: 'layers/poi-arc-inc.webp',
  /* Top decoration is per-family: `poi-arc-top` carries the job's emerald
   *  jewels; `poi-quest-top` is cut from the NATIVE blue piece (registered
   *  quest base pixels inside the top-layer footprint, dilated ~8px) so the
   *  sapphire gems are the original faceted art, not a hue shift or a
   *  punched-through green layer (Director ruling 2026-11-14). */
  top: { job: 'layers/poi-arc-top.webp', quest: 'layers/poi-quest-top.webp' },
  base: { job: 'layers/poi-job-base.webp', quest: 'layers/poi-quest-base.webp' },
  /* Far-zoom "light" piece (PLAN-125 Fase 4a, Director 2026-11-21): same
   *  marker, less complicated — engraved annulus flattened to a solid ring,
   *  dome and corner gems identical. Swapped in via CSS under
   *  `data-poi-zoom="far"`; canvas-aligned like every layer. Quest only. */
  light: { quest: 'layers/poi-quest-light.webp' },
} as const;
