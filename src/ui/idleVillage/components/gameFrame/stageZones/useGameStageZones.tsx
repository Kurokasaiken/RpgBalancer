/**
 * useGameStageZones — PLAN-043 WS-2 (artifact-r005 §B/§C): the React surface
 * of the three-zone stage. One hook owns the reducer commit cycle; a Context
 * distributes the solved `StageLayout` and the api to frames, strips and the
 * page. Presentation state lives in Context (invariant: presentation = React
 * Context, domain stays in the existing stores — no new Zustand store).
 *
 * Layers:
 *  - `useGameStageZonesState` — state owner: reducer + viewport feed +
 *    revision-guarded layout effects (pointercancel fan-out, focus redirect).
 *  - `GameStageContext` / `useGameStage` — distribution.
 *  - `useStagePanel` — one panel's `PanelResolution`.
 *  - `StagePanelFrame` — the per-panel shell: solver rect, suspension
 *    treatment (hidden + inert + aria-hidden + pointer-events none — the
 *    visibility/pointer pair is the WKWebView fallback for `inert`), and the
 *    capture-phase drag claim.
 *  - `StageStripsLayer` — wing rails + strip tabs (click expands, drag moves
 *    the occupancy to another zone or back onto a rail).
 *  - `useStageOverlayEscape` — overlay-stack registration gated on the
 *    panel's live presentation, so a suspended panel deregisters in the same
 *    commit that hides it (BV-08: Escape never reaches it).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { registerOverlay, unregisterOverlay } from '../overlayStack';
import { getHudZoomFactor } from '../hudScale';
import {
  solveStageLayout,
  type PanelResolution,
  type StageLayout,
  type StagePanelId,
  type StageRect,
} from './solveStageLayout';
import { initStageZones, stageZonesReducer, type StageZonesState } from './stageZonesReducer';

type StageZonesConfig = (typeof DEFAULT_GAME_FRAME_CONFIG)['stageZones'];

/** Actions the page and the frames dispatch — the commit api (§A.5). */
export interface GameStageApi {
  /** Re-activation is safe: OPEN on an occupant bumps its openSeq (brings to top). */
  open: (panelId: StagePanelId) => void;
  close: (panelId: StagePanelId) => void;
  /** Occupancy-driven toggle (menu/shortcut path). */
  toggle: (panelId: StagePanelId) => void;
  /** Idempotent sync for effect-driven openers (`setOpen(id, open)`). */
  setOpen: (panelId: StagePanelId, open: boolean) => void;
  expand: (panelId: StagePanelId) => void;
  minimize: (panelId: StagePanelId) => void;
  pin: (panelId: StagePanelId) => void;
  unpin: (panelId: StagePanelId) => void;
  /** Start the single stage drag — ignored while another drag is live. */
  beginDrag: (panelId: StagePanelId, pointerId: number) => void;
  /** Commit a drop: reducer picks in-zone placement, strip collapse (pointer
   *  on the target's rail/tab region), cross-zone landing or clamp-back.
   *  `zones`/`nominalZones`/revision come from the committed layout snapshot
   *  the drag saw — callers never supply them. */
  drop: (panelId: StagePanelId, pointer: { x: number; y: number }, point: { x: number; y: number }) => void;
  cancelDrag: () => void;
  /** Double-click reset: the panel returns to its zone home. */
  resetPlacement: (panelId: StagePanelId) => void;
  /** F5 cluster drag intent — the strip row and the run cluster's window anchor.
   *  `null` clears the intent (double-click reset). */
  stageDrag: (userCenterX: number | null, userTopY?: number | null) => void;
  /** Consumes `rejectedAtRevision` after the toast has painted. */
  consumeRejection: () => void;
}

/** The distributed value: committed state + the solved layout + the api. */
export interface GameStage {
  state: StageZonesState;
  layout: StageLayout;
  /** Monotone commit counter — revision-guarded effects key on it. */
  revision: number;
  api: GameStageApi;
  /** True while the panel holds a zone occupancy entry (open, strip or suspended). */
  isOpen: (panelId: StagePanelId) => boolean;
  resolution: (panelId: StagePanelId) => PanelResolution;
}

const GameStageContext = createContext<GameStage | null>(null);

/** StagePanels that sit inside zones (overlay `heroSheet` is exempt). */
export const isStageManagedPanel = (config: StageZonesConfig, id: string): id is StagePanelId =>
  Object.prototype.hasOwnProperty.call(config.panels, id) && !config.panels[id as StagePanelId].overlay;

const occupantZones = (state: StageZonesState, panelId: StagePanelId): boolean =>
  (['leftWing', 'centerStage', 'rightWing'] as const).some((z) => state.occupancy[z].some((o) => o.panelId === panelId));

/* PLAN-043 WS-5 DEF-06: the stage solver works in chrome-layer units —
 *  under the browser CSS `zoom` path the layer's usable size is
 *  `innerWidth / getHudZoomFactor()` (1 when unzoomed or natively zoomed). */
const viewportNow = () => {
  const z = getHudZoomFactor();
  return { w: window.innerWidth / z, h: window.innerHeight / z };
};
/** Pointer coords are device px; solver geometry is in chrome units. */
const clientToUnits = (x: number, y: number) => {
  const z = getHudZoomFactor();
  return { x: x / z, y: y / z };
};

/**
 * The stage state owner — run once per screen (the page calls it, then
 * provides the value through `GameStageContext`). Viewport changes feed
 * `VIEWPORT_CHANGED` (rAF-coalesced); the reducer's hysteresis keeps the
 * collapse flags stable inside the band (BV-04).
 */
export function useGameStageZonesState(): GameStage {
  const config = DEFAULT_GAME_FRAME_CONFIG.stageZones;
  const reducer = useMemo(() => (s: StageZonesState, a: Parameters<typeof stageZonesReducer>[2]) => stageZonesReducer(config, s, a), [config]);
  const [state, dispatch] = useReducer(reducer, undefined, () => initStageZones(config, viewportNow(), 'generic'));
  const stateRef = useRef(state);
  stateRef.current = state;

  const layout = useMemo(
    () =>
      solveStageLayout(config, {
        viewport: state.viewport,
        regime: state.regime,
        occupancy: state.occupancy,
        collapsed: state.collapsed,
        intent: { placements: state.placements, userCenterX: state.userCenterX },
      }),
    [config, state],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  /* Viewport feed — every resize commits (the solver is pure and cheap; the
   *  hysteresis lives in the reducer, not in throttle logic). */
  useEffect(() => {
    let frame: number | null = null;
    const onResize = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const { w, h } = viewportNow();
        const v = stateRef.current.viewport;
        if (v.w !== w || v.h !== h) dispatch({ type: 'VIEWPORT_CHANGED', w, h });
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  /* Revision-guarded layout effects (§A.5.3): pointer capture release and
   *  focus redirection land in a `useLayoutEffect` — before paint, in the same
   *  commit that caused them; a passive effect would paint one frame with
   *  focus inside a hidden subtree. */
  const prevLayout = useRef<StageLayout | null>(null);
  useLayoutEffect(() => {
    const prev = prevLayout.current;
    prevLayout.current = layout;

    /* 1. Release the pointer of every drag the commit cancelled. */
    for (const { pointerId } of state.pendingEffects.pointerCancel) {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId }));
    }

    /* 2. Focus redirect (§A.3a): a panel that just lost its expanded
     *  presentation must not hold focus — hand it to the strip tab if one
     *  exists, else to the Panels-menu trigger (never to body). */
    if (prev) {
      for (const [id, res] of Object.entries(layout.panels) as Array<[StagePanelId, PanelResolution]>) {
        const wasExpanded = prev.panels[id]?.presentationEffective === 'expanded';
        const nowExpanded = res.presentationEffective === 'expanded';
        if (!wasExpanded || nowExpanded) continue;
        const root = document.querySelector<HTMLElement>(`[data-stage-panel="${id}"]`) ?? document.querySelector<HTMLElement>(`[data-hud-panel="${id}"]`);
        if (root?.contains(document.activeElement)) {
          const target =
            document.querySelector<HTMLElement>(`[data-hud-strip-tab="${id}"]`) ??
            document.querySelector<HTMLElement>('[data-hud-panels-trigger]');
          target?.focus();
        }
      }
    }
  }, [layout, state.pendingEffects.pointerCancel, state.revision]);

  const api = useMemo<GameStageApi>(
    () => ({
      open: (panelId) => dispatch({ type: 'OPEN', panelId }),
      close: (panelId) => dispatch({ type: 'CLOSE', panelId }),
      toggle: (panelId) => dispatch({ type: occupantZones(stateRef.current, panelId) ? 'CLOSE' : 'OPEN', panelId }),
      setOpen: (panelId, open) => {
        const open0 = occupantZones(stateRef.current, panelId);
        if (open && !open0) dispatch({ type: 'OPEN', panelId });
        else if (!open && open0) dispatch({ type: 'CLOSE', panelId });
      },
      expand: (panelId) => dispatch({ type: 'EXPAND', panelId }),
      minimize: (panelId) => dispatch({ type: 'MINIMIZE', panelId }),
      pin: (panelId) => dispatch({ type: 'PIN', panelId }),
      unpin: (panelId) => dispatch({ type: 'UNPIN', panelId }),
      beginDrag: (panelId, pointerId) => dispatch({ type: 'DRAG_START', panelId, pointerId }),
      drop: (panelId, pointer, point) =>
        dispatch({
          type: 'DROP',
          panelId,
          pointer,
          point,
          zones: layoutRef.current.zones,
          nominalZones: layoutRef.current.nominalZones,
        }),
      cancelDrag: () => dispatch({ type: 'DRAG_CANCEL' }),
      resetPlacement: (panelId) => dispatch({ type: 'RESET_PLACEMENT', panelId }),
      stageDrag: (userCenterX, userTopY = null) => dispatch({ type: 'STAGE_DRAG', userCenterX, userTopY }),
      consumeRejection: () => dispatch({ type: 'REJECTION_CONSUMED' }),
    }),
    [],
  );

  const isOpen = useCallback((panelId: StagePanelId) => occupantZones(state, panelId), [state]);
  const resolution = useCallback((panelId: StagePanelId) => layout.panels[panelId], [layout]);

  return useMemo(
    () => ({ state, layout, revision: state.revision, api, isOpen, resolution }),
    [state, layout, api, isOpen, resolution],
  );
}

/** The context value — frames, strips and page wiring read the stage here. */
export function useGameStage(): GameStage {
  const ctx = useContext(GameStageContext);
  if (!ctx) throw new Error('useGameStage outside <GameStageContext.Provider>');
  return ctx;
}

/** One panel's live resolution (expanded rect / strip rect / suspension). */
export function useStagePanel(panelId: StagePanelId): PanelResolution {
  return useGameStage().layout.panels[panelId];
}

export const GameStageProvider = GameStageContext.Provider;

/* ------------------------------------------------------------------ */
/* Stage drag — the zone-aware drag committed through the reducer.       */
/* ------------------------------------------------------------------ */

interface LiveStageDrag {
  pointerId: number;
  startClient: { x: number; y: number };
  baseRect: StageRect;
  el: HTMLElement;
  lastDelta: { x: number; y: number };
  /* Imperatively attached on pointerdown — a React-commit lag must not let a
   *  fast press/release wedge `activeDrag` (the reducer would keep it set and
   *  every later drag would be ignored). */
  move: (event: globalThis.PointerEvent) => void;
  up: (event: globalThis.PointerEvent) => void;
  cancel: (event: globalThis.PointerEvent) => void;
}

/** Claim markers: rows a stage drag may start on (panel title bars via
 *  `useHudPanelDrag`, the roster's own handle, strip tabs handle themselves). */
const DRAG_HANDLE_SELECTOR = '[data-hud-drag-handle],[data-testid="roster-drag-handle"]';
/** Elements that must never start a stage drag. */
const DRAG_EXCLUDE_SELECTOR = 'button, select, input, label, a, [data-hud-controls], [data-dnd-overlay], [data-hud-strip-tab]';

/**
 * The capture-phase claim a `StagePanelFrame` runs on pointerdown: a press on
 * the panel's drag handle starts the single stage drag (the inner hook's own
 * pointerdown never sees it — capture stopPropagation lands first). Pointer
 * movement writes the transform straight to the frame element (no re-render
 * per move, same technique as `useHudPanelDrag`); the drop commits through
 * `api.drop` so the reducer — not the pointer path — decides the landing.
 */
function useStagePanelDragClaim(
  panelId: StagePanelId,
  frameRef: RefObject<HTMLElement | null>,
  resolution: PanelResolution,
): { onPointerDownCapture: (e: ReactPointerEvent<HTMLElement>) => void; onDoubleClickCapture: (e: React.MouseEvent<HTMLElement>) => void; dragging: boolean } {
  const stage = useGameStage();
  const [dragging, setDragging] = useState(false);
  const live = useRef<LiveStageDrag | null>(null);
  const abortedAt = useRef(stage.state.pendingEffects.dragAbortedAt);

  const endLive = useCallback(
    (commit: { pointer: { x: number; y: number }; point: { x: number; y: number } } | null) => {
      const d = live.current;
      if (!d) return;
      live.current = null;
      window.removeEventListener('pointermove', d.move);
      window.removeEventListener('pointerup', d.up);
      window.removeEventListener('pointercancel', d.cancel);
      d.el.style.transform = '';
      setDragging(false);
      if (commit) stage.api.drop(panelId, commit.pointer, commit.point);
    },
    [panelId, stage.api],
  );
  const endLiveRef = useRef(endLive);
  endLiveRef.current = endLive;

  /* Abort on the reducer's abort stamp: a DRAG_CANCEL / regime flip lands in
   *  one commit and every live drag discards its uncommitted movement. */
  useEffect(() => {
    const stamp = stage.state.pendingEffects.dragAbortedAt;
    if (stamp !== abortedAt.current) {
      abortedAt.current = stamp;
      if (live.current) endLiveRef.current(null);
    }
  }, [stage.revision, stage.state.pendingEffects.dragAbortedAt]);

  /* Unmount mid-drag: discard the gesture and free the listeners. */
  useEffect(() => () => endLiveRef.current(null), []);

  const onPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (resolution.presentationEffective !== 'expanded' || !resolution.rect) return;
      if (stage.state.activeDrag || live.current) return;
      /* Run regime: the quest cluster is the only expanded occupant and its
       *  window keeps its own `useHudPanelDrag` gesture — a stage claim here
       *  would commit a DROP against zero-width nominal zones (they collapse
       *  under run), corrupting occupancy. F5 cluster intent (STAGE_DRAG)
       *  arrives with the WS-4 columns. */
      if (stage.state.regime === 'run') return;
      const target = event.target as HTMLElement;
      if (target.closest(DRAG_EXCLUDE_SELECTOR)) return;
      if (!target.closest(DRAG_HANDLE_SELECTOR)) return;
      event.preventDefault();
      /* Capture-phase stop: the panel's own drag hook (bubble-phase
       *  pointerdown) never starts — the stage owns the gesture. */
      event.stopPropagation();
      const el = frameRef.current;
      if (!el) return;
      const pointerId = event.pointerId;
      const startClient = { x: event.clientX, y: event.clientY };
      const baseRect = resolution.rect;
      const d: LiveStageDrag = {
        pointerId,
        startClient,
        baseRect,
        el,
        lastDelta: { x: 0, y: 0 },
        move: () => undefined,
        up: () => undefined,
        cancel: () => undefined,
      };
      d.move = (ev: globalThis.PointerEvent) => {
        if (live.current !== d || ev.pointerId !== d.pointerId) return;
        const env = stage.layout.envelope;
        const dx = (ev.clientX - d.startClient.x) / getHudZoomFactor();
        const dy = (ev.clientY - d.startClient.y) / getHudZoomFactor();
        /* BV-10: the dragged shell never crosses the chrome bands — clamp the
         *  delta so `base + delta` stays inside the stage envelope. */
        const nextX = Math.min(Math.max(d.baseRect.x + dx, env.x), Math.max(env.x, env.x + env.w - d.baseRect.w));
        const nextY = Math.min(Math.max(d.baseRect.y + dy, env.y), Math.max(env.y, env.y + env.h - d.baseRect.h));
        d.lastDelta = { x: nextX - d.baseRect.x, y: nextY - d.baseRect.y };
        d.el.style.transform = `translate(${d.lastDelta.x}px, ${d.lastDelta.y}px)`;
      };
      d.up = (ev: globalThis.PointerEvent) => {
        if (live.current !== d || ev.pointerId !== d.pointerId) return;
        const point = { x: d.baseRect.x + d.lastDelta.x, y: d.baseRect.y + d.lastDelta.y };
        endLiveRef.current({ pointer: clientToUnits(ev.clientX, ev.clientY), point });
      };
      d.cancel = (ev: globalThis.PointerEvent) => {
        if (live.current !== d || ev.pointerId !== d.pointerId) return;
        stage.api.cancelDrag();
        endLiveRef.current(null);
      };
      /* Attach now — not in an effect: a pointerup landing before React
       *  commits the `dragging` render would otherwise orphan `live` and
       *  leave the reducer's `activeDrag` stuck forever. */
      window.addEventListener('pointermove', d.move);
      window.addEventListener('pointerup', d.up);
      window.addEventListener('pointercancel', d.cancel);
      live.current = d;
      stage.api.beginDrag(panelId, pointerId);
      setDragging(true);
    },
    [panelId, resolution, stage, frameRef],
  );

  const onDoubleClickCapture = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (!target.closest(DRAG_HANDLE_SELECTOR)) return;
      if (target.closest(DRAG_EXCLUDE_SELECTOR)) return;
      /* Double-click reset rides the stage, not the inner hook. */
      event.stopPropagation();
      stage.api.resetPlacement(panelId);
    },
    [panelId, stage.api],
  );

  return { onPointerDownCapture, onDoubleClickCapture, dragging };
}

/* ------------------------------------------------------------------ */
/* StagePanelFrame — the per-panel shell.                                */
/* ------------------------------------------------------------------ */

export interface StagePanelFrameProps {
  panelId: StagePanelId;
  /**
   * `positioned` (default): the frame takes the solver rect as
   * `position: fixed`. `false`: the child positions itself (the planner's
   * fixed shell) and the frame only claims drag + applies suspension.
   */
  positioned?: boolean;
  /** Extra style on the frame element. */
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
  /** Static node, or a render function fed the live resolution (panels that
   *  size from the zone rect — e.g. `widthPx={res.rect.w}` — use it). */
  children: ReactNode | ((res: PanelResolution) => ReactNode);
}

/**
 * Wraps one zone-managed panel. The frame carries `data-stage-panel`, owns the
 * solver rect (positioned mode), applies the suspension treatment
 * (`inert` + `aria-hidden` + `visibility` + `pointer-events` — suspension is
 * presentation, not unmount: state survives), and claims drag gestures on
 * marked handle rows in capture phase.
 */
export function StagePanelFrame({ panelId, positioned = true, style, className, zIndex, children }: StagePanelFrameProps) {
  const stage = useGameStage();
  const res = stage.layout.panels[panelId];
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useStagePanelDragClaim(panelId, frameRef, res);

  const expanded = res.presentationEffective === 'expanded' && !!res.rect;
  const frameStyle: CSSProperties = {
    position: 'fixed',
    zIndex: zIndex ?? DEFAULT_GAME_FRAME_CONFIG.zLayers.panels,
    visibility: expanded ? 'visible' : 'hidden',
    pointerEvents: expanded ? 'auto' : 'none',
    ...(positioned && res.rect
      ? { left: res.rect.x, top: res.rect.y, width: res.rect.w, maxHeight: res.rect.h, overflowY: 'auto' as const }
      : { left: 0, top: 0 }),
    ...(drag.dragging ? { zIndex: (zIndex ?? DEFAULT_GAME_FRAME_CONFIG.zLayers.panels) + 1000 } : null),
    ...style,
  };

  return (
    <div
      ref={frameRef}
      data-stage-panel={panelId}
      data-stage-zone={res.zone}
      data-stage-presentation={res.presentationEffective ?? 'suspended'}
      /* `inert` as a bare attribute — React serialises it; the visibility +
       *  pointer-events pair covers engines without inert (WKWebView). */
      inert={expanded ? undefined : true}
      aria-hidden={expanded ? undefined : true}
      className={className}
      style={frameStyle}
      onPointerDownCapture={drag.onPointerDownCapture}
      onDoubleClickCapture={drag.onDoubleClickCapture}
    >
      {typeof children === 'function' ? children(res) : children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Strip chrome — wing rails + tabs.                                     */
/* ------------------------------------------------------------------ */

/**
 * The strip layer: one tab per strip-presented panel, painted at the solver's
 * `stripRect`, plus the wing rails themselves (the zone's collapsed edge). A
 * click expands the panel in place; a drag carries the occupancy to the drop
 * zone (the reducer decides expanded vs strip vs clamp-back).
 */
export function StageStripsLayer({ zIndex }: { zIndex?: number }) {
  const stage = useGameStage();
  const { t } = useTranslation('idleVillage');
  const { layout } = stage;
  const dragRef = useRef<{ panelId: StagePanelId; pointerId: number; startClient: { x: number; y: number }; rect: StageRect; el: HTMLElement; moved: boolean } | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const tabs = (Object.entries(layout.panels) as Array<[StagePanelId, PanelResolution]>).filter(([, r]) => r.stripRect);

  const endTabDrag = useCallback(
    (commit: { pointer: { x: number; y: number }; point: { x: number; y: number } } | null, expand: StagePanelId | null) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      d.el.style.transform = '';
      bump();
      if (expand) stage.api.expand(expand);
      else if (commit) stage.api.drop(d.panelId, commit.pointer, commit.point);
    },
    [stage.api],
  );

  const onTabPointerDown = (panelId: StagePanelId, rect: StageRect) => (event: ReactPointerEvent<HTMLElement>) => {
    if (stage.state.activeDrag || dragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { panelId, pointerId: event.pointerId, startClient: { x: event.clientX, y: event.clientY }, rect, el: event.currentTarget as HTMLElement, moved: false };
    stage.api.beginDrag(panelId, event.pointerId);
    bump();
  };

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const d = dragRef.current;
      if (!d || event.pointerId !== d.pointerId) return;
      const dx = (event.clientX - d.startClient.x) / getHudZoomFactor();
      const dy = (event.clientY - d.startClient.y) / getHudZoomFactor();
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      d.moved = true;
      d.el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const up = (event: globalThis.PointerEvent) => {
      const d = dragRef.current;
      if (!d || event.pointerId !== d.pointerId) return;
      if (!d.moved) {
        endTabDrag(null, d.panelId);
        return;
      }
      const dx = (event.clientX - d.startClient.x) / getHudZoomFactor();
      const dy = (event.clientY - d.startClient.y) / getHudZoomFactor();
      endTabDrag({ pointer: clientToUnits(event.clientX, event.clientY), point: { x: d.rect.x + dx, y: d.rect.y + dy } }, null);
    };
    const cancel = (event: globalThis.PointerEvent) => {
      const d = dragRef.current;
      if (!d || event.pointerId !== d.pointerId) return;
      stage.api.cancelDrag();
      endTabDrag(null, null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [stage, endTabDrag]);

  /* R-215: the rail marks the collapsed edge of a zone that holds strips —
   * a zero-width zone owns no edge. `w <= wingRailPx` alone also matched
   * `w === 0`: on an empty stage the solver centres three zero-width zones
   * (`bandLeft + residual/2`), painting two phantom filet lines at the stage
   * centre — and in `run` regime (every zone {x:0,w:0}) two stacked at x=0. */
  const rails = (['leftWing', 'rightWing'] as const).filter((zone) => {
    const w = layout.zones[zone].w;
    return w > 0 && w <= DEFAULT_GAME_FRAME_CONFIG.stageZones.strip.wingRailPx;
  });

  return (
    <div data-stage-strips="" aria-hidden={tabs.length === 0 || undefined} style={{ position: 'fixed', inset: 0, zIndex: zIndex ?? DEFAULT_GAME_FRAME_CONFIG.zLayers.panels, pointerEvents: 'none' }}>
      {rails.map((zone) => {
        const r = layout.zones[zone];
        return (
          <div
            key={zone}
            data-stage-rail={zone}
            aria-hidden="true"
            style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderInlineStart: zone === 'rightWing' ? undefined : '1px solid var(--skin-hud-row-filet)', borderInlineEnd: zone === 'rightWing' ? '1px solid var(--skin-hud-row-filet)' : undefined }}
          />
        );
      })}
      {tabs.map(([panelId, res]) => {
        const r = res.stripRect!;
        const wing = res.zone !== 'centerStage';
        return (
          <button
            key={panelId}
            type="button"
            data-hud-strip-tab={panelId}
            data-stage-zone={res.zone}
            aria-label={t('gameFrame.stage.expandPanel', { name: t(`gameFrame.panels.names.${panelId}`) })}
            title={t(`gameFrame.panels.names.${panelId}`)}
            onPointerDown={onTabPointerDown(panelId, r)}
            onClick={(e) => e.preventDefault() /* expansion happens on pointerup so a drag never double-fires */}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              pointerEvents: 'auto',
              cursor: 'grab',
              touchAction: 'none',
              writingMode: wing ? 'vertical-rl' : undefined,
              textOrientation: wing ? 'mixed' : undefined,
              fontFamily: 'var(--skin-font-display)',
              fontSize: 'var(--skin-hud-caps-size)',
              letterSpacing: 'var(--skin-hud-caps-tracking)',
              color: 'var(--skin-title-color)',
              background: 'var(--skin-surface-bg)',
              border: '1px solid var(--skin-hud-row-filet)',
              borderRadius: 'var(--skin-hud-row-radius)',
            }}
          >
            {t(`gameFrame.panels.names.${panelId}`)}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay stack, gated on live presentation (BV-08).                    */
/* ------------------------------------------------------------------ */

/**
 * `useOverlayEscape` for stage-managed panels: the overlay registration is
 * gated on `presentationEffective === 'expanded'`, so a panel suspended or
 * stripped by a commit deregisters in the SAME commit — Escape can never
 * reach a hidden panel.
 */
export function useStageOverlayEscape(panelId: StagePanelId, onEscape: () => void): void {
  const stage = useGameStage();
  const res = stage.layout.panels[panelId];
  const active = res.presentationEffective === 'expanded' && !res.suspended;
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;
  const overlayId = `stage:${panelId}`;
  useEffect(() => {
    if (!active) return undefined;
    registerOverlay(overlayId, () => handlerRef.current());
    return () => unregisterOverlay(overlayId);
  }, [active, overlayId]);
}

/**
 * Mountable Escape binding for one zone-managed panel — one element per panel
 * the page wants on the overlay stack (the run cluster is NOT bound here: its
 * own overlay entries already arbitrate Escape).
 */
export function StagePanelEscape({ panelId, onEscape }: { panelId: StagePanelId; onEscape: () => void }): null {
  useStageOverlayEscape(panelId, onEscape);
  return null;
}

/* ------------------------------------------------------------------ */
/* Rejection toast — §D.3's "not now" affordance.                        */
/* ------------------------------------------------------------------ */

/**
 * Renders the localized "available after the quest" toast while
 * `state.rejectedAtRevision` is set, then consumes the marker (the reducer
 * clears it so a stale rejection never re-shows).
 */
export function StageRejectedToast() {
  const stage = useGameStage();
  const { t } = useTranslation('idleVillage');
  const rejected = stage.state.rejectedAtRevision;
  const [shownAt, setShownAt] = useState<number | null>(null);
  useEffect(() => {
    if (!rejected) return undefined;
    setShownAt(rejected.revision);
    trackTelemetryEvent('stage_open_rejected', { panelId: rejected.panelId, regime: stage.state.regime });
    const timer = globalThis.setTimeout(() => stage.api.consumeRejection(), 2400);
    return () => globalThis.clearTimeout(timer);
  }, [rejected, stage.state.regime, stage.api]);
  if (!rejected || shownAt !== rejected.revision) return null;
  return (
    <div
      role="status"
      data-stage-toast="open-rejected"
      style={{
        position: 'fixed',
        top: DEFAULT_GAME_FRAME_CONFIG.stageZones.chrome.topPx + 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.panels + 10,
        fontFamily: 'var(--skin-font-display)',
        fontSize: 'var(--skin-hud-caps-size)',
        color: 'var(--skin-title-color)',
        background: 'var(--skin-surface-bg)',
        border: '1px solid var(--skin-hud-row-filet)',
        borderRadius: 'var(--skin-hud-row-radius)',
        padding: 'var(--skin-hud-row-padding)',
        pointerEvents: 'none',
      }}
    >
      {t('gameFrame.stage.openRejected', { name: t(`gameFrame.panels.names.${rejected.panelId}`) })}
    </div>
  );
}
