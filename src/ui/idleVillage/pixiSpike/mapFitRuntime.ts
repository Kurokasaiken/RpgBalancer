/**
 * Map-fit runtime constants owned by the renderer (CTR-game-005, PLAN-054 T-001).
 *
 * This leaf module is the single source of truth the Playwright spec and the
 * `probe-game-map-fit.cjs` CLI read through `tests/helpers/mapFitContract.ts`,
 * so a constant here can never drift away from the contract that guards it.
 */

/**
 * Extra sea (world px) the deep-sea and pattern quads draw past the camera's
 * reach (±`safeFit.seaMarginPx` / `seaMarginYPx` in `gameFrameConfig`). The
 * quads' far edge stays off-screen in every camera state, so the stage colour
 * can never leak a visible line at the painted-canvas edge (R-148).
 */
export const SEA_QUAD_PAD = 1600;

/**
 * True when the runtime may publish test seams on `window` (`__worldCam`,
 * `__worldCamCtl`, `__canopySway`): dev builds and the `playwright` build mode
 * used by the e2e preview server. Never true in a real production bundle.
 */
export const isMapFitTestRuntime = import.meta.env?.DEV === true || import.meta.env?.MODE === 'playwright';
