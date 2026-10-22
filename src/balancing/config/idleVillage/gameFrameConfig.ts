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
  /** Baked colour-graded variant of the same map (see scripts/bake-map-grade.py). */
  gradedManifestPath: z.string(),
  /** Translucent sea: seabed opacity and its speed against the camera (< 1 reads as depth). Omit for an opaque sea. */
  seabed: z.object({ opacity: z.number().min(0).max(1), parallax: z.number().min(0).max(1) }).optional(),
  /** Life of the map (the shipped atmosphere values are near-invisible: 2-4% shadows, 12-35 min cloud crossings). */
  motion: z.object({
    cloudShadowOpacity: z.number().min(0).max(1),
    /** Shadow displacement from its cloud, world px (down-right: light from the top-left). */
    cloudShadowOffsetX: z.number(),
    cloudShadowOffsetY: z.number(),
    cloudSpeed: z.number().positive(),
    seaMotionAmount: z.number().nonnegative(),
    seaMotionPeriod: z.number().positive(),
    seaLineOpacity: z.number().min(0).max(1),
    foamStrength: z.number().min(0).max(1),
    foamCrestSpeed: z.number().nonnegative(),
  }),
  /** Stage colour behind the map: the sea's edge colour, so a seam between sprites never shows a dark line. */
  stageColor: z.string(),
  /** Which one the screen uses; in dev `?map=original|graded` overrides it. */
  grade: z.enum(['original', 'graded']),
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
    /** Extra open sea above and below the canvas (painted sea mirrored; never land). */
    seaMarginYPx: z.number().nonnegative().optional(),
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
  /** Event types that stay visible while collapsed, even if they would sort below `maxVisibleRows`. */
  pinTypesWhenCollapsed: z.array(z.string()),
  types: z.array(gameFrameEventTypeSchema).min(1),
});

/** What the shell says about the game itself. */
const gameFrameIdentitySchema = z.object({
  /** The title plaque in the top-left corner. Off: the corner is left to the map. */
  showTitle: z.boolean(),
});

/** Which frame construction the HUD pieces use; `legacy` keeps the pre-redesign look for side-by-side checks. */
const gameFrameHudSchema = z.object({
  material: z.enum(['legacy', 'lacquer']),
  /** R-260: the transient resource-delta feedback the resource readout
   *  plays when a quest settlement commits (a «+N» chip on the gold tile,
   *  an «+N XP» chip anchored under the readout; each count-up eased over
   *  `countUpMs`). Reduced-motion renders the final amount instantly. */
  resourceDelta: z.object({
    /** How long the chips stay visible before the stamp clears, ms. */
    durationMs: z.number().int().positive(),
    /** Count-up sweep duration, ms (0 = the chip shows the amount at once). */
    countUpMs: z.number().int().nonnegative(),
  }),
});

/**
 * Where the quest detail opens: in the corridor between the roster (left) and the event
 * ledger (right), so the roster stays visible and usable as the drag source for its slots.
 */
const gameFrameQuestDetailSchema = z.object({
  /** The detail's own width (px); the component is 680 wide. */
  widthPx: z.number().positive(),
  /** Air kept between the detail and the roster / ledger, px. */
  gapPx: z.number().nonnegative(),
  /** Distance from the top of the screen (below the top plaques), px. */
  topPx: z.number().nonnegative(),
  /** Width the event ledger takes at the right (matches its panel). */
  ledgerWidthPx: z.number().positive(),
});

/** The running-quest window (R-106, R-196): a floating HUD panel with companion
 *  plaques — the party roster and belt stack to its left, the chronicle to its
 *  right — all inside one draggable shell. */
const gameFrameQuestWindowSchema = z.object({
  /** Window width (px). */
  widthPx: z.number().positive(),
  /** Distance from the top of the screen at its anchored position, px. */
  topPx: z.number().nonnegative(),
  /** Theater aspect ratio, width / height (cinema scope ≈ 2.39). */
  theaterAspect: z.number().positive(),
  /** PLAN-061 (R-231 #8): accepted relative deviation between a cover-fit
   *  theatre asset's on-disk aspect and `theaterAspect`. 0.05 lets 21:9
   *  generator output (2.357) pass while rejecting real mismatches
   *  (≤1.9 or portrait). Enforced by `npm run check:quest-art`. */
  theaterAssetAspectTolerance: z.number().positive().max(0.5),
  /** How long the expedition lasts on the game clock, in days: the time bar fills over this span. */
  durationDays: z.number().positive(),
  /** R-199: narrative stage max height — the "what is happening" area reads
   *  wide and tall, scrolling only past this. */
  stageMaxHeightPx: z.number().positive(),
  /** PLAN-040 T-001: when the plaque is height-capped the stage may shrink to
   *  this floor before scrolling — keeps at least a line of "what is
   *  happening" readable instead of collapsing to zero. */
  stageMinHeightPx: z.number().nonnegative(),
  /** PLAN-040 T-001: the choices column scrolls internally past this cap —
   *  the phase tiles below must never spill under the plaque border. */
  choicesMaxHeightPx: z.number().positive(),
  /** PLAN-040 T-001: the theatre is the flex-shrink reservoir of the window —
   *  when the plaque is capped it shrinks, but never under this floor. */
  theaterMinHeightPx: z.number().positive(),
  /** PLAN-040 T-001: on short viewports the theatre's floor lowers further so
   *  at least one choice row + the phase tiles stay reachable above the
   *  scroll fold — `min(theaterMinHeightPx, max(this, plaqueCap*share))`. */
  theaterMinHeightShortPx: z.number().positive(),
  /** Share of the capped plaque height the theatre floor may claim. */
  theaterMaxShareOfPlaque: z.number().positive().max(1),
  /** Log lines a phase tooltip shows before it says "+N more". */
  tooltipLines: z.number().int().positive(),
  /** Width of each companion column (party roster / belt left, chronicle right), px. */
  sidePanelWidthPx: z.number().positive(),
  /** Air between the window and each companion column, px. */
  sidePanelGapPx: z.number().nonnegative(),
  /** Minimum usable companion width — below the fit threshold the companions
   *  auto-collapse (resolveQuestShellLayout); between threshold and
   *  `sidePanelWidthPx`×2 budget they shrink smoothly. */
  minSidePanelWidthPx: z.number().positive(),
  /** Screen-edge inset the shell's whole union (window + companions) is
   *  clamped into, px (drag + anchor). */
  edgeInsetPx: z.number().nonnegative(),
  /** PLAN-043 WS-4 / artifact-r003: the QuestStageCluster — a three-zone,
   *  zero-overlap arrangement the cluster itself solves every resize, drag,
   *  wing-open and beat-stage change. The window's nominal width is the
   *  ratified `clamp(760px, 50vw, 1040px)`; both wings reserve real estate
   *  inside the envelope margins and the group recenters as one body so the
   *  pieces never intersect. */
  cluster: z.object({
    /** Nominal window width lower bound, px (viewport ≥ this column+envelope). */
    widthMinPx: z.number().positive(),
    /** Nominal window width = vw × this fraction, between min and max. */
    widthVwFraction: z.number().positive(),
    /** Nominal window width upper bound, px. */
    widthMaxPx: z.number().positive(),
    /** Vertical inset of the window under the stage-envelope top, px. */
    topOffsetPx: z.number().nonnegative(),
    /** Air between the window and each wing, px. */
    gapPx: z.number().nonnegative(),
    /** Minimum viewport margin the solved group keeps on both sides, px. */
    marginPx: z.number().nonnegative(),
    /** Left companion column (party roster + micro-belt zone). */
    companionLeft: z.object({
      /** Column width on viewports below `wideAtPx`. */
      widthPx: z.number().positive(),
      /** Column width on viewports ≥ `wideAtPx`. */
      wideWidthPx: z.number().positive(),
      /** Viewport width that flips the column to its wide variant, px. */
      wideAtPx: z.number().positive(),
      /** Viewport width below which the column never unfolds even alone. */
      neverBelowPx: z.number().positive(),
      /** Folded roster-tab footprint width — counts into the solved group so
       *  a left-clamped cluster can never overlap it (BV-01). */
      foldedTabWidthPx: z.number().positive(),
    }),
    /** Right wing: the skill-check column (astrolabe + verdict card). */
    skillCheckColumn: z.object({
      /** Column width on viewports below `wideAtPx`. */
      widthPx: z.number().positive(),
      /** Column width on viewports ≥ `wideAtPx`. */
      wideWidthPx: z.number().positive(),
      /** Viewport width that flips the column to its wide variant, px. */
      wideAtPx: z.number().positive(),
      /** Viewport width below which the column never opens. */
      neverBelowPx: z.number().positive(),
      /** Astrolabe backing-store cap inside the column, px. */
      astrolabeMaxPx: z.number().positive(),
    }),
    /** Below this viewport width both wings cannot coexist — the right wing
     *  wins while a check is live and the left companion auto-folds into
     *  its header tab (mutual exclusion, artifact-r003 §2/BV-03). */
    bothWingsBelowPx: z.number().positive(),
    /** Wing fold/unfold transition lock, ms — geometry is re-solved while the
     *  lock runs; a user toggle during it replays the lock, never an overlap. */
    wingTransitionMs: z.number().int().nonnegative(),
    /** `expanded` beat stage: the window widens to
     *  `min(expandedWidthPx, vw − 2·marginPx)` with the wide theatre aspect
     *  (BV-11); a skill check on top re-solves back to the nominal floor. */
    expandedWidthPx: z.number().positive(),
    /** Wide theatre aspect used while `expanded`. */
    expandedTheaterAspect: z.number().positive(),
  }),
  /** BeatSequencer pacing (PLAN-025 T-008): per-beat on-stage durations in ms
   *  and the queue ceiling — overflow compacts into a recap beat. */
  beats: z.object({
    sceneMs: z.number().int().positive(),
    checkMs: z.number().int().positive(),
    /** R-199: while the docked astrolabe presents a check the beat is held —
     *  this is only the leak-guard cap (the resolve drives advancement). */
    checkHoldMs: z.number().int().positive(),
    /** R-199: dwell after the astrolabe resolves, so the verdict text lands. */
    checkVerdictMs: z.number().int().positive(),
    harmMs: z.number().int().positive(),
    endMs: z.number().int().positive(),
    recapMs: z.number().int().positive(),
    /** Max beats replayed per commit delta; the skipped head becomes a recap. */
    maxQueue: z.number().int().positive(),
  }),
  /** Whether bag items start armed for the next check. `false` = nothing is spent
   *  unless the player arms it (R-106 playtest: the bonus vanished unasked). The lab
   *  keeps its own default (armed, Director D1) — divergence flagged in PLAN-025. */
  consumablesArmedByDefault: z.boolean(),
  /** R-199: the optional companion columns (party roster + belt left,
   *  chronicle right) start closed — the player opens them from the header
   *  icons. Overrides the R-196 «all visible» default at the Director's call. */
  companionsDefaultOpen: z.boolean(),
  /** R-199: the per-check options popover on the window header.
   *  PLAN-040 T-003: the skill check itself is an external overlay in
   *  `#game-modal-root` (sibling of the window, in front of it) — its sizing
   *  is layout-driven and every geometric constant lives here. */
  skillCheck: z.object({
    /** Mount the options control at all. */
    optionsPanel: z.boolean(),
    /** Offer «skip the whole check» — jump straight to the resolved verdict. */
    allowSkipCheck: z.boolean(),
    /** Offer «skip the opening animation» — the dice still play out. */
    allowSkipIntro: z.boolean(),
    /** Viewport margin the overlay plaque keeps on every side (px) — its
     *  max-height is `100dvh − 2·overlayMarginPx`. */
    overlayMarginPx: z.number().positive(),
    /** Floor for the board square (px): the plaque's flex layout never lets
     *  the astrolabe board render smaller than this; below it the plaque
     *  scrolls internally instead of clipping the board. */
    boardMinPx: z.number().positive(),
    /** Preferred board square size (px) — the layout shrinks it toward
     *  `boardMinPx` when the viewport cannot fit it. */
    boardSizePx: z.number().positive(),
    /** The board grows with the screen: `boardVh` % of the viewport height, between `boardSizePx` and `boardMaxPx`. */
    boardVh: z.number().positive(),
    boardMaxPx: z.number().positive(),
    /** Viewport width below which the board cap drops to the compact rule
     *  (`min(50vh, 90vw)`), px. */
    compactBelowPx: z.number().positive(),
    /** Ms between the painted verdict and the armed click-to-dismiss —
     *  a skip-click landing exactly as the verdict appears must not erase it
     *  before it is seen (PLAN-040 debate r007). */
    dismissArmDelayMs: z.number().int().nonnegative(),
    /** Post-verdict auto-dismiss (ms). 0 = manual only — the player clicks
     *  the overlay away; the outcome stays readable in the log. */
    verdictAutoDismissMs: z.number().int().nonnegative(),
    /** T-004: paired-delta lower bound (p25, ms) the warm path must beat on
     *  `vite preview` before `prewarmQuestSkillCheck` ships — inconclusive
     *  measurements mean the audio fix alone ships. */
    warmMinGainMs: z.number().int().nonnegative(),
    /** T-004: minimum boot-slack (ms) left under the ≤4s budget before the
     *  warm path is scheduled at all. */
    warmSlackMinMs: z.number().int().nonnegative(),
    /** T-004: the warm path itself — enabled only after the measured
     *  paired-delta p25 clears `warmMinGainMs`; `?warmcheck=1` force-enables
     *  it for the probe regardless. */
    warmEnabled: z.boolean(),
    /** R-241 B4: while `data-astro-idle="parked"` freezes the verdict frame,
     *  the ambient `.rays` (the astrolabe's lights) keep turning — at this
     *  slowed duration (ms/revolution, normal is 26s). Reduced motion still
     *  pauses them via media query. */
    parkedRaysDurationMs: z.number().int().positive(),
  }),
  /** R-199: the end-of-run report is its own floating, non-modal plaque —
   *  staged reveal, skippable — outside the theatre's DOM. */
  rewardPopup: z.object({
    /** Popup width, px. */
    widthPx: z.number().positive(),
    /** Wall-clock between reveal stages (banner → sections → loot). */
    stageMs: z.number().int().positive(),
    /** R-239: min gap (chrome px) the report keeps from every viewport edge —
     *  drag clamp inset AND the cap `viewportH/zoom − 2·edgeInsetPx` that stops
     *  a long staged reveal from growing the plaque off-screen. */
    edgeInsetPx: z.number().int().nonnegative(),
  }),
  /** PLAN-040 T-005: the post-check outcome toast — small fixed plaque under
   *  `zLayers.questToast`, all text painted at once, dismissed by click. */
  outcomeToast: z.object({
    /** Toast width, px (~320 by spec). */
    widthPx: z.number().positive(),
    /** 0 = stays until clicked (default); >0 auto-dismisses after N ms. */
    autoDismissMs: z.number().int().nonnegative(),
    /** End-of-run hold (ms): the toast waits for the reward report's
     *  first-frame acknowledgement; past this it flushes anyway so an
     *  outcome is never lost. */
    rewardAckTimeoutMs: z.number().int().positive(),
    /** Where the toast anchors: centred above the bottom edge, or the
     *  bottom-right corner. */
    anchor: z.enum(['bottom-center', 'right']),
    /** Horizontal offset (px) from the anchor edge — and the min side gap. */
    offsetXPx: z.number().int().nonnegative(),
    /** Vertical offset (px) from the bottom edge. */
    offsetYPx: z.number().int().nonnegative(),
  }),
});

/** Stacking order of the shell's layers (the map is 0). One list instead of numbers sprinkled in components. */
const gameFrameZLayersSchema = z.object({
  wash: z.number().int(),
  floating: z.number().int(),
  /** Floating panels (roster, ledger, running quest): above the chrome and its dressing — the player moves them over the HUD. */
  panels: z.number().int(),
  chrome: z.number().int(),
  dressing: z.number().int(),
  /** PLAN-040 T-005: post-check outcome toast — above panels, below the
   *  end-of-run report. */
  questToast: z.number().int(),
  /** PLAN-040 T-006: the reward/report popup — above the toast, below a
   *  running check (a check in flight must never sit under the report). */
  reward: z.number().int(),
  /** PLAN-040 T-003: the external skill-check overlay — in front of the
   *  quest window and the report, under the boot veil. */
  questCheck: z.number().int(),
  /** Title veil over everything while /game boots (PLAN-031): nothing may peek through before the reveal. */
  boot: z.number().int(),
});

/**
 * Title veil shown while /game preloads (PLAN-031 T-A1): a branded loading
 * screen with real progress, skin-independent title art (deep sea + parchment
 * gold), and a minimum display time so it never flashes.
 */
const gameFrameBootVeilSchema = z.object({
  /** Exit fade once boot completes; reduced-motion skips it entirely. */
  fadeMs: z.number().nonnegative(),
  /** Shortest time the veil stays up even if boot is instant, so it never flickers. */
  minDisplayMs: z.number().nonnegative(),
  /** Title-screen palette: the HUD's sea-teal lacquer backdrop, parchment-gold accents (CSS colour strings). */
  colors: z.object({
    bgDeep: z.string(),
    bgGlow: z.string(),
    title: z.string(),
    caption: z.string(),
    barTrack: z.string(),
    barFill: z.string(),
    rule: z.string(),
    error: z.string(),
  }),
  /** Rendered width of the authored logo plaque on the veil (it keeps its own aspect). */
  logoWidthPx: z.number().positive(),
  /** Progress-bar geometry. */
  barWidthPx: z.number().positive(),
  barHeightPx: z.number().positive(),
});

/**
 * The "hide HUD" gesture: every chrome cluster slides off along its own edge
 * (top rises, bottom sinks) and a lone pearl stays on screen to call it back.
 * `offscreenPx` is extra travel past each element's own height/width so tall
 * instruments (the hung ledger) fully clear the edge.
 */
const gameFrameHudHideSchema = z.object({
  /** Slide duration; reduced-motion makes it instant instead. */
  slideMs: z.number().nonnegative(),
  /** Extra px of travel beyond translateY(±100%) so nothing peeks back in. */
  offscreenPx: z.number().positive(),
  /** One-key toggle, same guard rules as the panel shortcuts. */
  shortcut: z.string().length(1),
  /** Ms of stillness before the chrome slides away on its own; 0 disables the idle hide. */
  idleHideMs: z.number().nonnegative(),
  /** Surface a sea wonder the moment the chrome leaves — the contemplation reward. */
  wonderOnHide: z.boolean(),
});

/**
 * Event theatre timings (PLAN-033, R-169): the clock freezes while the curtains
 * close, the card plays and the curtains reopen, then returns to its pre-event
 * state. The curtain transition itself (~900ms) lives in `trailer.css`.
 */
const gameFrameEventTheatreSchema = z.object({
  /** Beat between the shroud fully closed and the event card entering. */
  cardDelayMs: z.number().nonnegative(),
  /** The clock stays frozen this long after the shroud begins reopening, so the
   *  world never visibly ticks under half-drawn curtains. */
  freezeReleaseMs: z.number().nonnegative(),
});

/**
 * Auto-reveal of the quest offers on `/game` (R-200, PLAN-037): once the boot
 * veil is gone, the offers mount one at a time `staggerMs` of wall clock
 * apart — they never hide again. The Director «Show quest» action only jumps
 * the queue (one-way); «Reset» re-arms the stagger for a new take. `enabled:
 * false` restores the legacy boot-dark behaviour (no offer until a reveal
 * channel opens) for surfaces that stage the reveal by hand.
 */
const gameFrameQuestRevealSchema = z.object({
  enabled: z.boolean(),
  /** Delay between the veil's exit and the first offer's entrance, ms. */
  initialDelayMs: z.number().nonnegative(),
  /** Wall-clock gap between consecutive offer entrances, ms. */
  staggerMs: z.number().positive(),
});

/** Below this viewport width the top row drops its detail (resource trends, place name) to tooltips. */
const gameFrameBreakpointsSchema = z.object({
  compactTopPx: z.number().positive(),
});

/**
 * The hero sheet (PLAN-032 SP-1): a read-only `HudPlaque` singleton that opens on
 * hover/focus-intent over a roster card, anchored rail-adjacent. All timings and
 * geometry are here; the machine (`heroSheetMachine`) is pure and reads them.
 */
const gameFrameHeroSheetSchema = z.object({
  /** Panel width (px). */
  widthPx: z.number().positive(),
  /** Gap between the roster card's right edge and the sheet (px). */
  railOffsetXPx: z.number().nonnegative(),
  /** Dwell on a card before the sheet opens (hover intent). */
  hoverIntentMs: z.number().nonnegative(),
  /** How long the sheet survives after the pointer leaves card∪panel before closing. */
  graceMs: z.number().nonnegative(),
  /** Dwell on a different card before an open sheet retargets to it. */
  retargetDwellMs: z.number().nonnegative(),
  /** Re-anchor when the anchor card's rect moved more than this (roster scroll), px. */
  anchorTolerancePx: z.number().nonnegative(),
  /** Previous/next keys when focus is in the panel or on the card rail
   *  (layout-independent: `[`/`]` are broken on Italian keyboards). */
  navPrevKeys: z.array(z.string()).min(1),
  navNextKeys: z.array(z.string()).min(1),
});

/**
 * Painted dry-brush wash along the screen edges: the "contorno" without a frame. Off by
 * default until a painted asset exists; `?wash=1` in dev shows it for evaluation.
 */
const gameFrameEdgeWashSchema = z.object({
  enabled: z.boolean(),
  /** Vertical strip for the left edge and horizontal strip for the bottom edge. */
  leftSrc: z.string(),
  bottomSrc: z.string(),
  opacity: z.number().min(0).max(1),
  /** Thickness of the left and bottom bands, px. */
  leftPx: z.number().nonnegative(),
  bottomPx: z.number().nonnegative(),
});

/** Test / trailer tooling that must never reach a player build. */
const gameFrameDebugSchema = z.object({
  /** Mount the Director panel (dev builds only; F10 shows/hides it). */
  directorPanel: z.boolean(),
});

/**
 * PLAN-043 WS-2 — the three-zone stage (ratified artifact-r005): the `/game`
 * window manager splits the area between the fixed chrome bands into three
 * logical allocation regions — `leftWing` (roster/stash), `centerStage`
 * (planner or the whole-stage quest cluster), `rightWing` (ledger/merchant) —
 * plus the zone-exempt `heroSheet` overlay. Zones are logical regions, never
 * painted rectangles: a wing with no expanded occupant shrinks to its strip
 * rail, and everything the solver, the drag clamp and the BV probes need is
 * declared here.
 */
const gameFrameStageZoneIdSchema = z.enum(['leftWing', 'centerStage', 'rightWing']);
const gameFrameStagePanelRoleSchema = z.enum(['home', 'session', 'persistent-transient', 'exempt']);

const gameFrameStageZonesSchema = z.object({
  /** Fixed chrome bands the stage never enters (existing top bar / bottom nav). */
  chrome: z.object({ topPx: z.number().nonnegative(), bottomPx: z.number().nonnegative() }),
  /** R-253: in `run` regime the quest cluster may paint OVER the chrome bands
   *  by these margins — the run surface is modal-grade and needs image+text+
   *  choices simultaneously visible (Director ruling: «il componente quest
   *  può andare sopra l'HUD»). `0` = legacy behavior, cluster confined
   *  between the bands. */
  questChromeOverlap: z.object({ topPx: z.number().nonnegative(), bottomPx: z.number().nonnegative() }),
  /** Outer edge inset E and inter-zone gutter G (DIRECTOR G.5: E frozen at 24). */
  outer: z.object({ edgePx: z.number().nonnegative(), gutterPx: z.number().nonnegative() }),
  /** Contract width budget: contractViewportPx − (2E + 2G). */
  budgetPx: z.number().positive(),
  /** The contract viewport width the arithmetic invariant is verified at. */
  contractViewportPx: z.number().positive(),
  zones: z.object({
    leftWing: z.object({ minPx: z.number().positive(), maxPx: z.number().positive() }),
    centerStage: z.object({ minPx: z.number().positive(), maxPx: z.number().positive() }),
    rightWing: z.object({ minPx: z.number().positive(), maxPx: z.number().positive() }),
  }),
  /**
   * Deterministic floor selection (WITNESS-03): exactly two legal floor sets,
   * committed once after measuring the roster's min-content (T-WS2.1) — never
   * a live solver alternative. `zones.minPx` mirrors the selected preset.
   */
  floorConfig: z.enum(['floorA', 'floorB']),
  floorPresets: z.object({
    floorA: z.object({ left: z.number().positive(), center: z.number().positive(), right: z.number().positive() }),
    floorB: z.object({ left: z.number().positive(), center: z.number().positive(), right: z.number().positive() }),
  }),
  /** Strip chrome geometry (§A.3b): wing rail at the zone's outer edge; the
   *  center tab sits at the stage top aligned to `userCenterX`. */
  strip: z.object({
    wingRailPx: z.number().positive(),
    /** Wing strip boxes on the rail, stacked with `gapPx`, capped `maxPerZone`. */
    wingTabPx: z.object({ wPx: z.number().positive(), hPx: z.number().positive() }),
    gapPx: z.number().nonnegative(),
    centerTab: z.object({ wPx: z.number().positive(), hPx: z.number().positive() }),
    maxPerZone: z.number().int().positive(),
  }),
  /** Unordered, non-transitive co-expansion permits — only `[roster, villageStash]` (leftWing stack). */
  authorizedPairs: z.array(z.tuple([z.string(), z.string()])),
  /** Wing-collapse hysteresis band (px): collapse below the threshold, re-expand at threshold + this. */
  hysteresisPx: z.number().nonnegative(),
  /**
   * The declarative panel → zone map (§E). `BagExternalPicker` is deliberately
   * absent: it is a `[data-hud-companion]` inside the planner shell, travels
   * with `questDetail` occupancy and retires with it at run start (§D.2).
   */
  panels: z.record(
    z.string(),
    z.object({
      zone: gameFrameStageZoneIdSchema,
      role: gameFrameStagePanelRoleSchema,
      /** Occupancy tie-break seed (§A.1) — lower wins. */
      priority: z.number().int(),
      /** Zone-exempt overlay (heroSheet): overlay-registered, never occupies a zone. */
      overlay: z.boolean().optional(),
      /** Run-regime disposition (§D.2): `retire` clears occupancy (placements kept); `suspend` keeps it mounted-hidden. */
      runPolicy: z.enum(['retire', 'suspend']).optional(),
      /** Expanded-admission fit gate (§D.1 rule b): `minWidthPx ≤ zoneWidth(vw)`. */
      minWidthPx: z.number().positive(),
      /** `zone-fill` renders at the zone width (elastic wings); `natural` at `naturalWidthPx` clamped to the zone. */
      widthMode: z.enum(['zone-fill', 'natural']),
      naturalWidthPx: z.number().positive(),
      /** Stack-fit test and the rendered `max-height` budget. */
      minHeightPx: z.number().positive(),
      naturalHeightPx: z.number().positive(),
    }),
  ),
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
  /** Game days the opportunity stays open once it appears; the marker's ring counts them down. */
  availableDays: z.number().positive(),
});

const gameFrameConfigSchema = z.object({
  insets: gameFrameInsetsSchema,
  /** Default nav rail. Only unlocked ids are expected to have working content. */
  navItems: z.array(gameFrameNavItemSchema),
  worldDressing: gameFrameWorldDressingSchema,
  eventLedger: gameFrameEventLedgerSchema,
  roster: gameFrameRosterSchema,
  questPois: z.array(gameFrameQuestPoiSchema),
  identity: gameFrameIdentitySchema,
  hud: gameFrameHudSchema,
  questDetail: gameFrameQuestDetailSchema,
  questWindow: gameFrameQuestWindowSchema,
  zLayers: gameFrameZLayersSchema,
  bootVeil: gameFrameBootVeilSchema,
  hudHide: gameFrameHudHideSchema,
  eventTheatre: gameFrameEventTheatreSchema,
  questReveal: gameFrameQuestRevealSchema,
  breakpoints: gameFrameBreakpointsSchema,
  edgeWash: gameFrameEdgeWashSchema,
  heroSheet: gameFrameHeroSheetSchema,
  debug: gameFrameDebugSchema,
  stageZones: gameFrameStageZonesSchema,
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
    hangingTopPx: 92,
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
    maxVisibleRows: 3,
    urgentWithinDays: 2,
    defaultSort: 'due',
    pinTypesWhenCollapsed: ['threat'],
    types: [
      { id: 'threat', labelKey: 'gameFrame.events.types.threat', icon: 'threat', tone: 'danger', priority: 0 },
      { id: 'quest', labelKey: 'gameFrame.events.types.quest', icon: 'evt-quest', tone: 'warning', priority: 1 },
      { id: 'expedition', labelKey: 'gameFrame.events.types.expedition', icon: 'evt-expedition', tone: 'warning', priority: 1 },
      { id: 'construction', labelKey: 'gameFrame.events.types.construction', icon: 'evt-construction', tone: 'neutral', priority: 2 },
      { id: 'harvest', labelKey: 'gameFrame.events.types.harvest', icon: 'evt-harvest', tone: 'good', priority: 3 },
      { id: 'visit', labelKey: 'gameFrame.events.types.visit', icon: 'evt-visit', tone: 'neutral', priority: 4 },
    ],
  },
  questPois: [{ id: 'city-rats', activityId: 'quest_city_rats', x: 2750, y: 1000, sizePx: 55, availableDays: 5 }],
  worldDressing: {
    manifestPath: '/assets/world/wanderlust/base/manifest-flat.json',
    gradedManifestPath: '/assets/world/wanderlust/base/manifest-flat-graded.json',
    grade: 'graded',
    stageColor: '#489397',
    motion: { cloudShadowOpacity: 0.42, cloudShadowOffsetX: 90, cloudShadowOffsetY: 140, cloudSpeed: 1, seaMotionAmount: 24, seaMotionPeriod: 10, seaLineOpacity: 0.26, foamStrength: 0.7, foamCrestSpeed: 14 },
    seabed: { opacity: 0.55, parallax: 0.8 },
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
      // Fixed chrome. Top: resources plaque 79 px + 8. Bottom: nav plinth 77 px + 23 (islands sit just above the nav).
      // /game adds the open roster / ledger widths left and right, so the land is framed between them.
      insets: { top: 87, bottom: 100 },
      // Open sea all round: how far the camera may travel past the painted canvas. The deep-sea
      // shader fades to a flat fog ~1700 world px out, so this reach reads as open ocean, not as a
      // repeated texture. It must stay wide enough that the coverage floor (viewport must fit inside
      // canvas + 2*margin) never beats the safe-fit zoom at real window sizes — otherwise the land
      // over-zooms and slides under the fixed chrome (R-148; see game_map_fit_contract.md).
      seaMarginPx: 3600,
      seaMarginYPx: 1800,
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
  // Director, 2026-10-07: no game title on the HUD.
  identity: { showTitle: false },
  hud: { material: 'lacquer', resourceDelta: { durationMs: 2600, countUpMs: 900 } },
  /* WS-3 Dispatch Table: `ledgerWidthPx` is the RIGHT WING reservation the
   *  pinned forecast occupies (stageZones `rightWing` = 340). */
  questDetail: { widthPx: 680, gapPx: 8, topPx: 100, ledgerWidthPx: 340 },
  questWindow: {
    /* R-199: wider and more cinematic — an ~820px shell with a near-scope
     * theatre (2.4:1 → ~340px of painted scene) and companions that start
     * closed, opened on demand from the header icons. */
    widthPx: 820,
    topPx: 72,
    theaterAspect: 2.4,
    theaterAssetAspectTolerance: 0.05,
    /* R-199: the expedition lasts ~5 days on the game clock — the phase bar
     * fills over this span and later frontiers stay locked until due. */
    durationDays: 5,
    stageMaxHeightPx: 260,
    stageMinHeightPx: 44,
    choicesMaxHeightPx: 190,
    theaterMinHeightPx: 190,
    theaterMinHeightShortPx: 96,
    theaterMaxShareOfPlaque: 0.36,
    tooltipLines: 6,
    sidePanelWidthPx: 260,
    sidePanelGapPx: 8,
    minSidePanelWidthPx: 180,
    edgeInsetPx: 18,
    /* PLAN-043 WS-4 (artifact-r003): the solved quest cluster.
     * Window width = clamp(760px, 50vw, 1040px); wings 280/340 at
     * 1280–1440, 320/420 ≥1920; mutual exclusion below 1440px. */
    cluster: {
      widthMinPx: 760,
      widthVwFraction: 0.5,
      widthMaxPx: 1040,
      topOffsetPx: 24,
      gapPx: 14,
      marginPx: 16,
      companionLeft: { widthPx: 280, wideWidthPx: 320, wideAtPx: 1920, neverBelowPx: 1100, foldedTabWidthPx: 40 },
      skillCheckColumn: { widthPx: 340, wideWidthPx: 420, wideAtPx: 1920, neverBelowPx: 1100, astrolabeMaxPx: 480 },
      bothWingsBelowPx: 1440,
      wingTransitionMs: 180,
      expandedWidthPx: 1180,
      expandedTheaterAspect: 2.1,
    },
    consumablesArmedByDefault: true,
    companionsDefaultOpen: false,
    skillCheck: {
      optionsPanel: true,
      allowSkipCheck: true,
      allowSkipIntro: true,
      overlayMarginPx: 16,
      boardMinPx: 240,
      boardSizePx: 480,
      boardVh: 40,
      boardMaxPx: 680,
      compactBelowPx: 1300,
      dismissArmDelayMs: 350,
      /* R-259: the player gets ~1s of click window after the verdict is
         dismissible; with no input the beat auto-advances as if clicked. */
      verdictAutoDismissMs: 1000,
      warmMinGainMs: 150,
      warmSlackMinMs: 300,
      warmEnabled: false,
      parkedRaysDurationMs: 90000,
    },
    rewardPopup: { widthPx: 400, stageMs: 280, edgeInsetPx: 12 },
    /* R-259: the outcome popup anchors on the RIGHT — it must read as
       «born from the skill check», which lives in the right wing. */
    outcomeToast: { widthPx: 320, autoDismissMs: 0, rewardAckTimeoutMs: 4000, anchor: 'right', offsetXPx: 24, offsetYPx: 24 },
    beats: { sceneMs: 1600, checkMs: 1800, checkHoldMs: 45000, checkVerdictMs: 2400, harmMs: 1200, endMs: 1600, recapMs: 1800, maxQueue: 24 },
  },
  zLayers: { wash: 7, floating: 8, chrome: 10, dressing: 11, panels: 12, questToast: 20, reward: 25, questCheck: 30, boot: 40 },
  bootVeil: {
    fadeMs: 550,
    minDisplayMs: 400,
    colors: {
      // The HUD's own sea-teal lacquer (--skin-hud-lacquer-deep / --hud-lacquer-tint):
      // the title screen is painted in the same water the chrome swims in.
      bgDeep: '#0f2627',
      bgGlow: '#1d4a4d',
      title: '#e6d3a3',
      caption: '#8fb5b2',
      barTrack: 'rgba(230, 211, 163, 0.16)',
      barFill: '#d9b26f',
      rule: 'rgba(217, 178, 111, 0.5)',
      error: '#e58a7a',
    },
    logoWidthPx: 560,
    barWidthPx: 320,
    barHeightPx: 3,
  },
  hudHide: { slideMs: 520, offscreenPx: 260, shortcut: 'h', idleHideMs: 30000, wonderOnHide: true },
  eventTheatre: { cardDelayMs: 700, freezeReleaseMs: 1000 },
  /* R-200: goblin enters ~1s after the veil lifts, rovine ~5s later — one
   *  offer at a time so each entrance reads (and the Director's «Show quest»
   *  skips straight to all revealed). */
  questReveal: { enabled: true, initialDelayMs: 1000, staggerMs: 5000 },
  breakpoints: { compactTopPx: 1400 },
  edgeWash: { enabled: false, leftSrc: '/assets/ui/hud/edge_wash_left.webp', bottomSrc: '/assets/ui/hud/edge_wash_bottom.webp', opacity: 0.55, leftPx: 120, bottomPx: 110 },
  heroSheet: {
    widthPx: 380,
    railOffsetXPx: 14,
    hoverIntentMs: 350,
    graceMs: 400,
    retargetDwellMs: 120,
    anchorTolerancePx: 24,
    navPrevKeys: ['ArrowLeft', 'PageUp'],
    navNextKeys: ['ArrowRight', 'PageDown'],
  },
  debug: { directorPanel: true },
  /* PLAN-043 WS-2 — ratified artifact-r005. T-WS2.1 measured the roster's
   *  min-content at 460px (clone shrink-to-fit on /game, 1280×720) — over the
   *  236 floor → `floorB` committed (260/616/340, still 1280-exact). */
  stageZones: {
    chrome: { topPx: 92, bottomPx: 100 },
    questChromeOverlap: { topPx: 84, bottomPx: 88 },
    outer: { edgePx: 24, gutterPx: 8 },
    budgetPx: 1216,
    contractViewportPx: 1280,
    zones: {
      leftWing: { minPx: 260, maxPx: 400 },
      centerStage: { minPx: 616, maxPx: 1040 },
      rightWing: { minPx: 340, maxPx: 340 },
    },
    floorConfig: 'floorB',
    floorPresets: {
      floorA: { left: 236, center: 640, right: 340 },
      floorB: { left: 260, center: 616, right: 340 },
    },
    strip: { wingRailPx: 32, wingTabPx: { wPx: 32, hPx: 160 }, gapPx: 4, centerTab: { wPx: 160, hPx: 28 }, maxPerZone: 4 },
    authorizedPairs: [['roster', 'villageStash']],
    hysteresisPx: 24,
    panels: {
      roster: {
        zone: 'leftWing',
        role: 'home',
        priority: 0,
        runPolicy: 'suspend',
        minWidthPx: 200,
        widthMode: 'zone-fill',
        naturalWidthPx: 400,
        minHeightPx: 240,
        naturalHeightPx: 300,
      },
      villageStash: {
        zone: 'leftWing',
        role: 'persistent-transient',
        priority: 1,
        runPolicy: 'suspend',
        minWidthPx: 236,
        widthMode: 'zone-fill',
        naturalWidthPx: 320,
        minHeightPx: 200,
        naturalHeightPx: 360,
      },
      events: {
        zone: 'rightWing',
        role: 'home',
        priority: 0,
        runPolicy: 'suspend',
        minWidthPx: 280,
        widthMode: 'zone-fill',
        naturalWidthPx: 300,
        minHeightPx: 160,
        naturalHeightPx: 320,
      },
      merchant: {
        zone: 'rightWing',
        role: 'persistent-transient',
        priority: 1,
        runPolicy: 'suspend',
        minWidthPx: 320,
        widthMode: 'zone-fill',
        naturalWidthPx: 360,
        minHeightPx: 240,
        naturalHeightPx: 420,
      },
      questDetail: {
        zone: 'centerStage',
        role: 'home',
        priority: 0,
        runPolicy: 'retire',
        minWidthPx: 460,
        widthMode: 'natural',
        naturalWidthPx: 680,
        minHeightPx: 300,
        naturalHeightPx: 520,
      },
      /* PLAN-043 WS-5: the expedition forecast lives INSIDE the planner —
       *  the pinned right column of `questDetail` (QuestExpeditionDetail
       *  `quest-expedition-forecast-column`). The separate `questForecast`
       *  stage tenant was declared but never mounted (DEF-02) — removed. */
      /* The run window/cluster claims the whole stage envelope in `run`
       *  regime — WS-2 sees it as ONE occupant; F5 internals own its columns.
       *  `suspend` keeps it in occupancy (the solver hands it the envelope);
       *  its OPEN is the only zone-managed open admitted during `run`. */
      quest: {
        zone: 'centerStage',
        role: 'session',
        priority: 0,
        runPolicy: 'suspend',
        minWidthPx: 640,
        widthMode: 'natural',
        naturalWidthPx: 820,
        minHeightPx: 400,
        naturalHeightPx: 600,
      },
      heroSheet: {
        zone: 'rightWing',
        role: 'persistent-transient',
        priority: 9,
        overlay: true,
        runPolicy: 'suspend',
        minWidthPx: 280,
        widthMode: 'natural',
        naturalWidthPx: 380,
        minHeightPx: 200,
        naturalHeightPx: 400,
      },
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
