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
