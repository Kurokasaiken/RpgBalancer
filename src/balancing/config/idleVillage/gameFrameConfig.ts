/**
 * GameFrame — structural configuration.
 *
 * `GameFrame` (`src/ui/idleVillage/components/gameFrame/GameFrame.tsx`) is the
 * game's persistent shell: the world map fills the entire viewport, and a
 * small number of shaped, edge-anchored ribbons and hung objects sit over it.
 * There is no second frame around the map and no permanently-docked side
 * rail — see RICHIESTE.md R-075 for the research that grounds this (no
 * shipped title in the genre draws a border around its own map; ornament is
 * spent on exactly one earned object, never repeated per-panel).
 *
 * This module owns every structural number the shell reads — nothing is
 * hardcoded in the component. Material recipes (gradients, hairlines) live
 * with their material, matching `BAR_ENERGY` / `INSET_PANEL_PRESETS` /
 * `MATERIAL_PRESETS` elsewhere in the project.
 */

import { z } from 'zod';
import type { HudIconId } from '@/ui/idleVillage/components/gameFrame/hudIcons';

const gameFrameInsetsSchema = z.object({
  /** Distance from the viewport edge to every corner-anchored cluster. */
  edgeInsetPx: z.number().nonnegative(),
  /** Top of the right-edge hanging slot (event ledger): must clear the resource ribbon. */
  hangingTopPx: z.number().nonnegative(),
});

/**
 * `icon` is a `HudIconId`, not raw text — R-075 review flagged nav emoji
 * (`🏘 🗺 ⚒ 🍺`) as a production blocker alongside the resource-readout ones.
 * Zod can't import a union re-exported from a `.tsx` module cleanly here, so
 * this stays `z.string()` at the schema boundary and the id is cast to
 * `HudIconId` for consumers; `HudGlyph` will render `undefined` (nothing)
 * rather than throw if it's ever wrong.
 */
const gameFrameNavItemSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  icon: z.string(),
  /** Not yet a real destination — rendered dim and inert (DESIGN_PILLARS §4 R4.2 diegetic gating). */
  locked: z.boolean(),
});

/**
 * How the shell dresses the world beneath it.
 *
 * The map asset carries its own painted frame (`Frame.webp` z99) and border
 * (`Bordo.webp` z97). With the shell's own ribbons providing the frame, those
 * two layers would be a second frame around the first — so the shell hides
 * them. Both are ordinary manifest layers, so this is a `set_visibility`
 * override, not an asset edit (Director, 2026-09-22: "frame e bordo sono due
 * layer, li possiamo togliere facilmente se vogliamo").
 *
 * The sea tint answers the Director's other observation — that the reference
 * mockup married map and UI by pulling the sea toward the chrome's hue. Our
 * sea reads near-navy; the art bible's shadow law is "deep & cool teal /
 * emerald / turquoise, never grey or brown", so this pushes it *onto* DNA
 * rather than away from it. `sea` is its own layer (`Mare.webp` z10), so
 * nothing else in the painting is touched.
 */
const gameFrameWorldDressingSchema = z.object({
  /**
   * Which manifest the shell loads.
   *
   * The canonical `manifest.json` carries 23 separate surface layers, which
   * is the right shape for *authoring* — an artist can move, retint or hide
   * any piece. None of them animates, has a condition or parallaxes
   * (verified against the manifest), so at runtime the game was compositing
   * 19 static textures to draw one unchanging painting.
   *
   * `manifest-flat.json` is the same painting with those 19 pre-composited
   * offline into `base_flat.webp`: 23 layers -> 5, 4.64MB -> 0.83MB, pixel
   * identical. Only what the game actually manipulates stays separate — the
   * two event shrouds (code slides them) and frame/border (toggleable).
   * The canonical manifest is untouched, so `/world-surface` keeps every
   * layer for authoring.
   */
  manifestPath: z.string(),
  /** Manifest layer ids the shell hides because it provides the frame itself. */
  hiddenLayerIds: z.array(z.string()),
  /**
   * Ambient light rays / dust. Off: the rays are a large `screen`-blended
   * gradient with a pulse animation plus 60 animated dust motes, they are
   * off by default on `/world-surface` too, and the Director does not want
   * them ("penso che non ci servano più").
   */
  showAtmosphere: z.boolean(),
  /**
   * Painted water sprites. Measured cost: none — they carry no blend mode and
   * no filter, they are transform-animated images. Kept ON.
   */
  showSeaMarks: z.boolean(),
  showWaves: z.boolean(),
  /**
   * Sea/coast ripple — ON. The Director wants it ("a me piacciono"), and it
   * had already been chosen over the sprite-sheet alternative on looks.
   *
   * What made it the most expensive thing on the map was not the effect but
   * one attribute: `feTurbulence`'s `baseFrequency` was animated, which
   * regenerates the whole Perlin field from scratch every frame over ~911 kpx
   * (sea + the two island layers), CPU-bound. `rippleAnimateFrequency: false`
   * keeps the ripple and the movement, generating the field once — the water
   * laps instead of deforming. That distinction is a deliberate artistic
   * choice recorded in `WorldSurfaceSeaRipple.tsx`, so it is the Director's
   * to reverse: flip it back to `true` for the original look at full cost.
   */
  showSeaRipple: z.boolean(),
  /**
   * How the ripple is produced.
   *
   * `smil` computes it: animated `feTurbulence` + `feDisplacementMap` on the
   * CPU. Measured on this map it moves the coastline by **1.21 screen px** at
   * the zoom the game actually runs at (0.24) — invisible — while filtering
   * ~720 kpx every frame. Paying a lot for nothing.
   *
   * `sprite` plays it: a pre-rendered 30-frame sheet (5x6, 59 KB) stepped by
   * CSS keyframes and masked to the shoreline. No filter, no rAF, nothing
   * computed per frame — the Director's own instinct ("facciamo un video e lo
   * facciamo girare invece di calcolarlo"), and it is what originally shipped
   * in commit 0bb46308 before the SMIL path replaced it.
   */
  rippleMode: z.enum(['smil', 'sprite']),
  /** `smil` only. See `animateFrequency` in `SeaRippleConfig` — the costly attribute. */
  rippleAnimateFrequency: z.boolean(),
  /**
   * Cloud-shadow breathing (15 animated shadow sprites).
   *
   * TENSION, NAMED NOT HIDDEN: desiderata v19 says breath is "sempre attivo...
   * non legato a un flag". The same desiderata also requires "profilazione
   * Tauri obbligatoria prima del rollout", which never happened — and it is
   * part of what makes this surface unusable today. Off here until it is
   * profiled; this is the Director's call to reverse, not mine.
   */
  breathEnabled: z.boolean(),
  /**
   * Open-sea pattern (the moving water away from the coast, as opposed to the
   * ripple which is the shoreline). The one water effect built the right way:
   * a WebGL2 shader on its own canvas, sized under the compositing texture
   * ceiling and ticked by `setInterval`. It runs on the GPU, so it does not
   * belong in the same cost bracket as the SVG-filter effects.
   *
   * Its `baseColor` is `#0b5c6b` — petrol teal — so it also carries part of
   * the map/UI colour marriage the Director asked about, without a runtime
   * recolour of the sea layer.
   */
  showSeaPattern: z.boolean(),
  /**
   * Older foam: a texture sliding sideways under a world-sized mask. It reads as
   * drift, not as water reaching the shore, and costs a full-size masked layer.
   */
  showFoam: z.boolean(),
  /**
   * Frame the land inside the area the chrome leaves free, with placeholder sea past the
   * canvas sides (mirrored edge, valid up to the land's 266 px distance from them).
   * `landBounds` is the bounding box of `land_mask.webp` scaled to the 4240x2828 canvas.
   */
  safeFit: z.object({
    enabled: z.boolean(),
    landBounds: z.object({ x0: z.number(), x1: z.number(), y0: z.number(), y1: z.number() }),
    insets: z.object({ top: z.number(), bottom: z.number() }),
    seaMarginPx: z.number(),
  }),
  /**
   * Crests that travel toward the coast and dissolve gradually before reaching it (no
   * standing band of foam along the shore). WebGL shader over a baked distance field;
   * no filter, no blend.
   */
  showCoastFoam: z.boolean(),
  /** The glass "teca" overlay — 369 kpx of blur at opacity 0.035-0.05. */
  showGlass: z.boolean(),
  seaGrade: z.object({
    /**
     * OFF by default, on purpose.
     *
     * Recolouring the sea at runtime means a filter (or worse, a blend) over
     * a 4240x2828 layer — ~12 megapixels reprocessed every repaint, on top of
     * the breathing displacement and the atmosphere layers that already
     * repaint continuously. A `tint_layer` version of this measured a 1016ms
     * worst frame against 50ms with it off, and made `/game-frame`
     * unusable. The correct home for this colour is the asset: `Mare.webp`
     * should be recoloured offline once, at which point this costs nothing at
     * runtime and this flag can go away.
     */
    enabled: z.boolean(),
    layerId: z.string(),
    /** CSS filter applied to the sea layer's own pixels when enabled. */
    filter: z.string(),
  }),
});

/**
 * One kind of upcoming event. `priority` orders the groups when the ledger is sorted
 * by type and breaks ties when it is sorted by due date (lower = more important).
 * `tone` picks the row's signal colour: the louder the consequence of missing it,
 * the louder the tone (a threat is `danger`, a visitor is `neutral`).
 */
const gameFrameEventTypeSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  icon: z.string(),
  tone: z.enum(['danger', 'warning', 'neutral', 'good']),
  priority: z.number().int(),
});

const gameFrameEventLedgerSchema = z.object({
  /** Rows shown while the ledger is collapsed (the most pressing first); "Show all" reveals the rest. */
  maxVisibleRows: z.number().int().positive(),
  /** At or below this many days left a row is drawn as urgent. */
  urgentWithinDays: z.number().nonnegative(),
  defaultSort: z.enum(['due', 'type']),
  types: z.array(gameFrameEventTypeSchema).min(1),
});

/**
 * The roster is shown as an object resting on the table at the map's lower-left, in
 * its `compact` density (one ~30px strip per character): a fixed width (the canonical
 * roster stretches to its container) and a contact shadow.
 */
const gameFrameRosterSchema = z.object({
  widthPx: z.number().positive(),
  /** Visual scale. 1 with the compact density; kept for layouts that need to shrink it whole. */
  scale: z.number().positive(),
  leftPx: z.number(),
  bottomPx: z.number(),
  tiltDeg: z.number(),
});

/**
 * Quest POIs pinned on the world map. Each opens the quest detail of `activityId`
 * (an activity in the Idle Village config with a quest blueprint).
 */
const gameFrameQuestPoiSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  /** World pixels (manifest `coordinateSystem.canvas`). */
  x: z.number(),
  y: z.number(),
  /** Marker diameter on screen; it does not scale with zoom. */
  sizePx: z.number().positive(),
});

const gameFrameConfigSchema = z.object({
  insets: gameFrameInsetsSchema,
  /** Default nav rail. Only unlocked ids are expected to have working content. */
  navItems: z.array(gameFrameNavItemSchema),
  worldDressing: gameFrameWorldDressingSchema,
  eventLedger: gameFrameEventLedgerSchema,
  roster: gameFrameRosterSchema,
  questPois: z.array(gameFrameQuestPoiSchema),
});

export type GameFrameInsetsConfig = z.infer<typeof gameFrameInsetsSchema>;
export type GameFrameNavItemConfig = Omit<z.infer<typeof gameFrameNavItemSchema>, 'icon'> & {
  icon: HudIconId;
};
export type GameFrameQuestPoiConfig = z.infer<typeof gameFrameQuestPoiSchema>;
export type GameFrameWorldDressingConfig = z.infer<typeof gameFrameWorldDressingSchema>;
export type GameFrameEventTypeConfig = Omit<z.infer<typeof gameFrameEventTypeSchema>, 'icon'> & {
  icon: HudIconId;
};
export type GameFrameEventLedgerConfig = Omit<z.infer<typeof gameFrameEventLedgerSchema>, 'types'> & {
  types: GameFrameEventTypeConfig[];
};
export type GameFrameConfig = Omit<z.infer<typeof gameFrameConfigSchema>, 'navItems' | 'eventLedger'> & {
  navItems: GameFrameNavItemConfig[];
  eventLedger: GameFrameEventLedgerConfig;
};

const RAW_DEFAULT_GAME_FRAME_CONFIG: GameFrameConfig = {
  insets: {
    edgeInsetPx: 18,
    hangingTopPx: 74,
  },
  navItems: [
    { id: 'village', labelKey: 'gameFrame.nav.village', icon: 'settlement', locked: false },
    { id: 'map', labelKey: 'gameFrame.nav.map', icon: 'world', locked: false },
    { id: 'workshop', labelKey: 'gameFrame.nav.workshop', icon: 'workshop', locked: true },
    { id: 'tavern', labelKey: 'gameFrame.nav.tavern', icon: 'tavern', locked: true },
  ],
  roster: {
    widthPx: 400,
    scale: 1,
    leftPx: 24,
    bottomPx: 150,
    // Not rotated: the roster's cards run continuous pulse/glow animations, and under a
    // rotated parent every frame is resampled, which reads as shimmering.
    tiltDeg: 0,
  },
  eventLedger: {
    maxVisibleRows: 1,
    urgentWithinDays: 2,
    defaultSort: 'due',
    types: [
      { id: 'threat', labelKey: 'gameFrame.events.types.threat', icon: 'threat', tone: 'danger', priority: 0 },
      { id: 'expedition', labelKey: 'gameFrame.events.types.expedition', icon: 'company', tone: 'warning', priority: 1 },
      { id: 'construction', labelKey: 'gameFrame.events.types.construction', icon: 'workshop', tone: 'neutral', priority: 2 },
      { id: 'harvest', labelKey: 'gameFrame.events.types.harvest', icon: 'food', tone: 'good', priority: 3 },
      { id: 'visit', labelKey: 'gameFrame.events.types.visit', icon: 'tavern', tone: 'neutral', priority: 4 },
    ],
  },
  questPois: [{ id: 'city-rats', activityId: 'quest_city_rats', x: 2750, y: 1000, sizePx: 96 }],
  worldDressing: {
    manifestPath: '/assets/world/wanderlust/base/manifest-flat.json',
    hiddenLayerIds: ['frame', 'border'],
    showAtmosphere: false,
    showSeaMarks: true,
    showWaves: true,
    showSeaRipple: true,
    rippleMode: 'sprite',
    rippleAnimateFrequency: false,
    breathEnabled: false,
    showSeaPattern: true,
    showFoam: false,
    safeFit: {
      enabled: true,
      landBounds: { x0: 271, x1: 3974, y0: 305, y1: 2642 },
      // Ribbon heights are 61 / 67 px, plus 8 px of air.
      insets: { top: 69, bottom: 75 },
      seaMarginPx: 260,
    },
    showCoastFoam: true,
    showGlass: false,
    seaGrade: {
      enabled: false,
      layerId: 'sea',
      /*
       * The grade that lands the painted near-navy sea on the petrol teal the
       * chrome lives in — kept here as the recipe to bake into `Mare.webp`,
       * and usable at runtime for a quick look by flipping `enabled`.
       */
      filter: 'hue-rotate(-26deg) saturate(1.5) brightness(1.75)',
    },
  },
};

/**
 * Validated, safe-default structural config for `GameFrame`.
 *
 * The Zod schema validates shape at the `z.string()` boundary (`icon` is
 * runtime-checked as a non-empty string); the `as GameFrameConfig` narrows it
 * to `HudIconId` for consumers, matching the pattern already used for
 * `GameFrameConfig` itself.
 */
export const DEFAULT_GAME_FRAME_CONFIG = gameFrameConfigSchema.parse(
  RAW_DEFAULT_GAME_FRAME_CONFIG,
) as GameFrameConfig;
