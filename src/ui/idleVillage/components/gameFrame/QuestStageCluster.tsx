/**
 * QuestStageCluster — PLAN-043 WS-4 (artifact-r003 §4.1): the run regime's
 * three-column body. `solveQuestClusterGeometry` is the ONE answer for
 * where CompanionLeft, the run window and the right-wing SkillCheckColumn
 * paint — this component applies it, owns the cluster drag gesture and
 * reconciles it back to committed `userCenterX`/`userTopY` intent (BV-02).
 *
 * Why a group-level drag: the three columns are absolutely positioned
 * siblings, so one translate on the group moves them together — the same
 * union the solver bounded (BV-01 zero-overlap survives mid-drag, and a
 * wing opening while the group is parked near an edge shifts the whole
 * body instead of overlapping).
 *
 * Drag contract: the gesture writes NOTHING per move (transform on the
 * group element, one write per frame); on release it commits only the
 * window's live centre/top — `shiftX` stays derived, never stored. A
 * double-click on the drag handle clears the intent (centre + envelope top).
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { getHudZoomFactor } from './hudScale';
import {
  solveQuestClusterGeometry,
  type QuestClusterGeometry,
  type QuestClusterIntent,
  type QuestClusterRect,
  type QuestClusterWingState,
} from './questShellLayout';

type ClusterConfig = (typeof DEFAULT_GAME_FRAME_CONFIG)['questWindow']['cluster'];

/** Elements that may never start a cluster drag. */
const DRAG_EXCLUDE_SELECTOR = 'button, select, input, label, a, [data-hud-controls], [data-dnd-overlay]';

const rectToStyle = (rect: QuestClusterRect, transitionMs: number): CSSProperties => ({
  position: 'absolute',
  left: rect.x,
  top: rect.y,
  width: rect.w,
  /* A hard slot height: the window shell is `height:100%` of this rect — a
   * bare maxHeight would leave the plaque unbounded (its inner scroll
   * region is what yields, per the stage's vertical-budget contract). */
  height: rect.h,
  maxHeight: rect.h,
  transition: `left ${transitionMs}ms ease, width ${transitionMs}ms ease, top ${transitionMs}ms ease`,
  pointerEvents: 'auto',
});

export interface QuestStageClusterProps {
  /** Live viewport (the solver's horizontal bounds = viewport ± margin). */
  viewport: { w: number; h: number };
  /** The stage envelope the run regime hands the cluster (vertical bounds). */
  envelope: QuestClusterRect;
  /** Committed drag intent — `null`s mean "solver default". */
  intent: QuestClusterIntent;
  /** Commit on drag end — `null` center = cleared intent (double-click). */
  onCommitIntent: (userCenterX: number | null, userTopY: number | null) => void;
  /** Requested wing state (pre-fit — the solver applies fold/exclusion). */
  wings: QuestClusterWingState;
  /** Cluster content: each slot receives its solved rect. */
  renderWindow: (rect: QuestClusterRect, geometry: QuestClusterGeometry) => ReactNode;
  renderLeftWing?: (rect: QuestClusterRect, geometry: QuestClusterGeometry) => ReactNode;
  /** The folded roster tab — rendered when the left wing is auto-folded. */
  renderLeftTab?: (rect: QuestClusterRect, geometry: QuestClusterGeometry) => ReactNode;
  renderRightWing?: (rect: QuestClusterRect, geometry: QuestClusterGeometry) => ReactNode;
  /** Z layer the group paints on (`zLayers.panels` by default). */
  zIndex?: number;
  /** Injectable for tests. */
  cfg?: ClusterConfig;
}

export const QuestStageCluster: React.FC<QuestStageClusterProps> = ({
  viewport,
  envelope,
  intent,
  onCommitIntent,
  wings,
  renderWindow,
  renderLeftWing,
  renderLeftTab,
  renderRightWing,
  zIndex = DEFAULT_GAME_FRAME_CONFIG.zLayers.panels,
  cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.cluster,
}) => {
  const geometry = useMemo(
    () => solveQuestClusterGeometry(viewport, envelope, intent, wings, cfg),
    [viewport, envelope, intent, wings, cfg],
  );
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  /* R-239 release flicker: the element that still carries the gesture
   *  translate while the committed intent renders. Set at pointerup,
   *  consumed by the post-commit layout effect (or the rAF fallback when
   *  the commit produced no re-render). */
  const pendingReleaseRef = useRef<HTMLDivElement | null>(null);

  /** Cluster drag — deltas clamped so the release commit re-derives to the
   *  same pixel the player sees (solver bounds = viewport margins). */
  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest(DRAG_EXCLUDE_SELECTOR)) return;
      if (!target.closest('[data-hud-drag-handle]')) return;
      const el = groupRef.current;
      if (!el) return;
      event.preventDefault();
      const geo = geometryRef.current;
      const m = cfg.marginPx;
      const total = (geo.leftWing ? geo.leftWing.w + cfg.gapPx : geo.leftTab ? geo.leftTab.w + cfg.gapPx : 0)
        + geo.window.w
        + (geo.rightWing ? cfg.gapPx + geo.rightWing.w : 0);
      const unionLeft = geo.window.x - (geo.leftWing ? geo.leftWing.w + cfg.gapPx : geo.leftTab ? geo.leftTab.w + cfg.gapPx : 0);
      /* Allowed delta so the whole union stays inside [m, vw−m]; vertical
       * bounds come from the envelope + configured top offset. */
      const dxLo = m - unionLeft;
      const dxHi = viewport.w - m - (unionLeft + total);
      const dyLo = envelope.y - geo.window.y;
      const dyHi = envelope.y + envelope.h - cfg.topOffsetPx - geo.window.y;
      const start = { x: event.clientX, y: event.clientY };
      const delta = { x: 0, y: 0 };
      const pointerId = event.pointerId;
      let frame: number | null = null;
      const paint = () => {
        frame = null;
        el.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
      };
      const move = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        /* PLAN-043 WS-5 DEF-06: pointer deltas arrive in device px; the
         *  cluster lives in chrome-layer units (`viewport`/`geo` are solver
         *  units) — divide by the HUD zoom factor (1 when unzoomed). */
        const z = getHudZoomFactor();
        delta.x = Math.min(Math.max((ev.clientX - start.x) / z, Math.min(dxLo, dxHi)), Math.max(dxLo, dxHi));
        delta.y = Math.min(Math.max((ev.clientY - start.y) / z, Math.min(dyLo, dyHi)), Math.max(dyLo, dyHi));
        if (frame === null) frame = requestAnimationFrame(paint);
      };
      const end = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (frame !== null) cancelAnimationFrame(frame);
        /* R-239: commit BEFORE dropping the translate. The previous order
         *  (clear transform → commit → async re-render) painted at least one
         *  frame at the stale pre-drag rect — the release "scatto" the
         *  Director saw. Now the translate survives until the committed
         *  geometry is in the DOM (layout effect below, pre-paint), and
         *  `dragging` stays true until then so rect transitions stay off. */
        pendingReleaseRef.current = el;
        /* Commit only the intent: the window's live centre becomes
         * `userCenterX`; the solver re-derives the group left under whatever
         * wings are open (BV-02: reopening/closing wings drifts 0px). */
        onCommitIntent(geo.window.x + delta.x + geo.window.w / 2, geo.window.y + delta.y);
        /* Fallback for the no-rerender path (identical intent) — the layout
         *  effect never fires, so drop the translate after one frame. */
        requestAnimationFrame(() => {
          const pending = pendingReleaseRef.current;
          if (pending) {
            pendingReleaseRef.current = null;
            pending.style.transform = '';
            setDragging(false);
          }
        });
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      setDragging(true);
    },
    [cfg, envelope, viewport.w, onCommitIntent],
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-hud-drag-handle]')) return;
      if (target.closest(DRAG_EXCLUDE_SELECTOR)) return;
      onCommitIntent(null, null);
    },
    [onCommitIntent],
  );

  /* Post-commit drop: once the committed geometry is committed to the DOM
   *  (still before paint), remove the gesture translate — the window lands
   *  where the player dropped it, with no stale-rect frame in between.
   *  `dragging` (which keeps the rect transitions at 0ms) must survive ONE
   *  painted frame: if it flipped in the same style recalc that moves the
   *  rect, the browser would animate `left/top` from the pre-drag rect —
   *  the visible "scatto" measured by probe10 (~500ms eased re-slide). */
  useLayoutEffect(() => {
    const pending = pendingReleaseRef.current;
    if (!pending) return;
    pendingReleaseRef.current = null;
    pending.style.transform = '';
    requestAnimationFrame(() => requestAnimationFrame(() => setDragging(false)));
  }, [geometry]);

  /* Safety net: if the component unmounts mid-gesture the transform must not
   *  linger (the listeners live on window; the element write is cheap). */
  useEffect(
    () => () => {
      pendingReleaseRef.current = null;
      if (groupRef.current) groupRef.current.style.transform = '';
    },
    [],
  );

  /* While a gesture is live — and through the commit paint — rect changes
   *  land instantly; easing `left/top` while the group translate is still
   *  applied would paint a double-offset frame. */
  const t = dragging ? 0 : cfg.wingTransitionMs;
  return (
    <div
      ref={groupRef}
      data-quest-cluster=""
      data-testid="quest-stage-cluster"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      data-dragging={dragging || undefined}
      /* BV probes: the solver's committed answer is observable on the group —
       *  a painted-vs-solved mismatch is a one-line diagnosis. */
      data-geo={JSON.stringify({ w: geometry.window, l: geometry.leftWing, lt: geometry.leftTab, r: geometry.rightWing, shx: geometry.shiftX })}
      style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}
    >
      {geometry.leftWing && renderLeftWing ? (
        <div data-testid="quest-cluster-left" style={rectToStyle(geometry.leftWing, t)}>
          {renderLeftWing(geometry.leftWing, geometry)}
        </div>
      ) : null}
      {geometry.leftTab && renderLeftTab ? (
        <div data-testid="quest-cluster-left-tab" style={rectToStyle(geometry.leftTab, t)}>
          {renderLeftTab(geometry.leftTab, geometry)}
        </div>
      ) : null}
      <div data-testid="quest-cluster-window" style={rectToStyle(geometry.window, t)}>
        {renderWindow(geometry.window, geometry)}
      </div>
      {geometry.rightWing && renderRightWing ? (
        <div data-testid="quest-cluster-right" style={rectToStyle(geometry.rightWing, t)}>
          {renderRightWing(geometry.rightWing, geometry)}
        </div>
      ) : null}
    </div>
  );
};

export default QuestStageCluster;
