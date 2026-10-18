/**
 * questShellLayout — the ONE layout predicate for the running-quest shell
 * (R-196 / PLAN-035, WITNESS-01): rendering AND drag clamping read the same
 * answer, so the columns the window shows are exactly the union the drag
 * clamps. A companion column is "fit" when the viewport still leaves both
 * sides at least `minSidePanelWidthPx` after the window + gaps + edge insets:
 *
 *   companionsFit ⇔ vw ≥ widthPx + 2·gap + 2·edge + 2·minSide
 *                 ⇔ vw ≥ 640 + 16 + 36 + 360 = 1052 (default config)
 *
 * Between the fit threshold and the full-width budget the columns shrink
 * smoothly from `sidePanelWidthPx` down to `minSidePanelWidthPx`.
 */

import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

type QuestWindowLayoutConfig = Pick<
  (typeof DEFAULT_GAME_FRAME_CONFIG)['questWindow'],
  'widthPx' | 'sidePanelWidthPx' | 'sidePanelGapPx' | 'minSidePanelWidthPx' | 'edgeInsetPx'
>;

export interface QuestShellLayout {
  /** Whether companion columns may mount at this viewport width. */
  companionsFit: boolean;
  /** Column width at this viewport (sidePanelWidthPx → minSidePanelWidthPx). */
  effectiveSideWidth: number;
  /** Viewport width the predicate was evaluated at. */
  viewportWidth: number;
}

/** Pure predicate — the same function the window renders and the drag
 *  hook clamps against. `vw` is `window.innerWidth` in CSS px. */
export function resolveQuestShellLayout(
  vw: number,
  cfg: QuestWindowLayoutConfig = DEFAULT_GAME_FRAME_CONFIG.questWindow,
): QuestShellLayout {
  const budget = vw - cfg.widthPx - 2 * cfg.sidePanelGapPx - 2 * cfg.edgeInsetPx;
  const companionsFit = budget >= 2 * cfg.minSidePanelWidthPx;
  const effectiveSideWidth = Math.max(
    cfg.minSidePanelWidthPx,
    Math.min(cfg.sidePanelWidthPx, Math.floor(budget / 2)),
  );
  return { companionsFit, effectiveSideWidth, viewportWidth: vw };
}

/* ------------------------------------------------------------------ */
/* PLAN-043 WS-4 / artifact-r003 §4.1 — QuestStageCluster solver.        */
/* The run regime hands the cluster the WHOLE stage envelope; inside it  */
/* three columns are solved as one body — CompanionLeft, the run window,  */
/* and the right-wing SkillCheckColumn — so no pair of them can ever     */
/* overlap (BV-01) and a wing open/close re-derives `shiftX` from the    */
/* stored `userCenterX` with zero drift (BV-02).                          */
/* ------------------------------------------------------------------ */

type ClusterConfig = (typeof DEFAULT_GAME_FRAME_CONFIG)['questWindow']['cluster'];

export interface QuestClusterRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** User drag intent — the only stored value; everything else derives. */
export interface QuestClusterIntent {
  /** The window's user-chosen center x (viewport px). `null` = centred. */
  userCenterX: number | null;
  /** The window's user-chosen top y (viewport px). `null` = envelope top. */
  userTopY: number | null;
}

/** Requested wing state — before fit rules fold it into effective state. */
export interface QuestClusterWingState {
  /** The player asked for the left companion (party tab). */
  leftOpen: boolean;
  /** A skill check is live — the right column wants the stage. */
  rightOpen: boolean;
  /** The beat on stage carries the `expanded` tag (wide theatre). */
  expanded: boolean;
}

/** The solved cluster — rects in viewport px; `null` wings are not mounted. */
export interface QuestClusterGeometry {
  /** The run window's own rect. */
  window: QuestClusterRect;
  /** Effective window width (`C`) after the expanded floor resolves. */
  windowWidth: number;
  /** Left companion column rect, or `null` when closed/folded. */
  leftWing: QuestClusterRect | null;
  /** The folded roster tab — present iff the player asked for the left wing
   *  but the fit rules folded it (mutual exclusion / budget). */
  leftTab: QuestClusterRect | null;
  /** True when the left wing was requested but auto-folded by fit rules. */
  leftFolded: boolean;
  /** Right skill-check column rect, or `null` when no check is live. */
  rightWing: QuestClusterRect | null;
  /** Derived reconciliation — `clampedLeft − desiredLeft` (BV-02 probe). */
  shiftX: number;
  /** True while the wide stage is effectively on (never during a check). */
  expandedEffective: boolean;
  /** Wing column widths the solve committed to (render sizing). */
  columnWidths: { left: number; right: number };
}

const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** Column width at this viewport width (narrow → wide step). */
const wingWidth = (spec: { widthPx: number; wideWidthPx: number; wideAtPx: number }, vw: number) =>
  vw >= spec.wideAtPx ? spec.wideWidthPx : spec.widthPx;

/**
 * `solveQuestClusterGeometry` — the ONE answer for the run cluster's three
 * columns. Pure: identical inputs → identical output, so render, drag clamp
 * and the BV-01 bounding-box probe agree bit-for-bit.
 *
 * Contract (artifact-r003 §4.1.3):
 *   extL = leftOpen ? L + g : 0;   extR = rightOpen ? R + g : 0
 *   desiredLeft = userCenterX − C/2 − extL
 *   clampedLeft = clamp(desiredLeft, envX+m, envRight−m−(extL+C+extR))
 *   windowLeft = clampedLeft + extL;   shiftX = clampedLeft − desiredLeft
 *
 * Fit rules, in order:
 *  - a check beat suppresses `expanded` (the window re-solves to nominal C
 *    before the right wing slides in — BV-11);
 *  - `expanded` folds the left companion (the wide stage owns the margins);
 *  - under `bothWingsBelowPx` the wings mutually exclude — the live check
 *    wins and the left companion folds to its roster tab (BV-03);
 *  - a wing never opens below its own `neverBelowPx` floor.
 *
 * @param viewport  live viewport size — the horizontal bounds are the
 *                  contract's `m` margin from the viewport edge (the
 *                  cluster is a floating HUD group, it may paint into the
 *                  envelope's outer inset when a wing forces it).
 * @param envelope  the stage envelope the run regime hands the cluster
 *                  (`solveStageLayout.clusterEnvelope`), viewport px —
 *                  vertical bounds, default center and resting height.
 * @param intent    stored drag intent — `userCenterX`/`userTopY`, or nulls.
 * @param wings     requested wing state (pre-fit).
 * @param cfg       `gameFrameConfig.questWindow.cluster` (injectable for tests).
 */
export function solveQuestClusterGeometry(
  viewport: { w: number; h: number },
  envelope: QuestClusterRect,
  intent: QuestClusterIntent,
  wings: QuestClusterWingState,
  cfg: ClusterConfig = DEFAULT_GAME_FRAME_CONFIG.questWindow.cluster,
): QuestClusterGeometry {
  const vw = viewport.w;
  const m = cfg.marginPx;
  const g = cfg.gapPx;

  /* The `expanded` stage owns the margins — wings fold; a live check always
   * wins over the wide stage (BV-11: nominal C before the column slides in). */
  const expandedEffective = wings.expanded && !wings.rightOpen;
  const C = expandedEffective
    ? Math.min(cfg.expandedWidthPx, vw - 2 * m)
    : clampN(vw * cfg.widthVwFraction, cfg.widthMinPx, cfg.widthMaxPx);

  const L = wingWidth(cfg.companionLeft, vw);
  const R = wingWidth(cfg.skillCheckColumn, vw);

  const rightOpen = wings.rightOpen && vw >= cfg.skillCheckColumn.neverBelowPx;
  /* Mutual exclusion: under `bothWingsBelowPx` the two wings cannot coexist —
   * the live check wins; while the stage is expanded the margins are spent. */
  const leftOpen =
    wings.leftOpen &&
    vw >= cfg.companionLeft.neverBelowPx &&
    !expandedEffective &&
    !(rightOpen && vw < cfg.bothWingsBelowPx);
  const leftFolded = wings.leftOpen && !leftOpen;

  /* The folded tab is still geometry — it reserves its footprint inside the
   *  group so a left-clamped cluster never paints over it (BV-01). */
  const extL = leftOpen ? L + g : leftFolded ? cfg.companionLeft.foldedTabWidthPx + g : 0;
  const extR = rightOpen ? R + g : 0;
  const total = extL + C + extR;

  const centerX = intent.userCenterX ?? envelope.x + envelope.w / 2;
  const desiredLeft = centerX - C / 2 - extL;
  const clampedLeft = clampN(desiredLeft, m, Math.max(m, vw - m - total));
  const windowLeft = clampedLeft + extL;
  const shiftX = clampedLeft - desiredLeft;

  const topY = clampN(
    intent.userTopY ?? envelope.y + cfg.topOffsetPx,
    envelope.y,
    Math.max(envelope.y, envelope.y + envelope.h - cfg.topOffsetPx),
  );
  const windowH = Math.max(0, envelope.y + envelope.h - topY);

  const leftWing: QuestClusterRect | null = leftOpen
    ? { x: clampedLeft, y: topY, w: L, h: windowH }
    : null;
  const rightWing: QuestClusterRect | null = rightOpen
    ? { x: windowLeft + C + g, y: topY, w: R, h: windowH }
    : null;
  /* The folded roster tab rides the group's left edge (`clampedLeft` — the
   * extL slot the solver reserved for it). */
  const leftTab: QuestClusterRect | null = leftFolded
    ? { x: clampedLeft, y: topY, w: cfg.companionLeft.foldedTabWidthPx, h: 120 }
    : null;

  return {
    window: { x: windowLeft, y: topY, w: C, h: windowH },
    windowWidth: C,
    leftWing,
    leftTab,
    leftFolded,
    rightWing,
    shiftX,
    expandedEffective,
    columnWidths: { left: leftOpen || leftFolded ? L : 0, right: rightOpen ? R : 0 },
  };
}
