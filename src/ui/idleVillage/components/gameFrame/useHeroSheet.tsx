import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useReducer, type ReactElement, type RefCallback } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { GameFrameConfig } from '@/balancing/config/idleVillage/gameFrameConfig';
import { getAllEquipment } from '@/balancing/equipment/equipmentStorage';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { heroSheetReducer, HERO_SHEET_INITIAL_STATE, type HeroSheetState } from './heroSheetMachine';
import { heroSheetViewModel, type HeroSheetViewModel } from './heroSheetViewModel';
import { HeroSheetPanel } from './HeroSheetPanel';
import type { HudPanelsApi } from './useHudPanels';

/**
 * useHeroSheet — the single transition owner behind `HeroSheetPanel` (PLAN-032 SP-1).
 *
 * It owns the reducer state, arms every timer the state describes, delegates the
 * roster rail's pointer/focus events into machine events, reconciles the open
 * target against the real DOM after roster mutations and drag-end, anchors the
 * plaque to the hovered card, and writes `panels.set('heroSheet', …)` one-way so
 * the Panels menu mirrors the machine (the menu never drives it — registry calls
 * arrive only through `open`/`close`/`toggle` below).
 *
 * The page gets three things back: `railRef`/`railProps` to spread on a wrapper
 * around the roster slot (the delegation boundary — the frozen roster itself is
 * untouched), and `panelNode` for `overlaySlot`.
 */

export interface UseHeroSheetOptions {
  config: GameFrameConfig['heroSheet'];
  residentsById: Record<string, ResidentState>;
  /** The shared HUD panels api — the hook writes `heroSheet` one-way (reflect). */
  panels: HudPanelsApi;
  /** True while a resident drag is active (pickup / flight / returning). */
  dragActive: boolean;
  /** Live bounds of the quest window — the sheet keeps clear of it (WCAG 2.4.11
   *  also forbids covering the focused card, which the anchor never does). */
  questBounds: { left: number; top: number; right: number; bottom: number } | null;
  /** Stacking order for the sheet (`zLayers.panels`). */
  zIndex: number;
}

export interface HeroSheetApi {
  /** Callback ref for the rail wrapper `<div>` the page puts around the roster. */
  railRef: RefCallback<HTMLDivElement>;
  /** Delegated listeners to spread on that same wrapper. */
  railProps: {
    onPointerOver: React.PointerEventHandler;
    onPointerOut: React.PointerEventHandler;
    onPointerDownCapture: React.PointerEventHandler;
    onFocusCapture: React.FocusEventHandler;
    onBlurCapture: React.FocusEventHandler;
  };
  /** `<HeroSheetPanel/>` ready for `overlaySlot` — null while closed. */
  panelNode: ReactElement | null;
  /** Registry entry points (sticky): menu, `P` shortcut, `panels.set`. */
  open: (targetId?: string) => void;
  close: (reason?: 'toggle' | 'route' | 'x' | 'esc') => void;
  toggle: () => void;
}

const cssEscape = (value: string): string =>
  typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&');

/** First `[data-resident-id]` ancestor — the roster wrapper and the inner card both carry it. */
const cardOf = (el: EventTarget | Element | null, rail: HTMLElement | null): HTMLElement | null => {
  if (!(el instanceof Element) || !rail) return null;
  const card = el.closest<HTMLElement>('[data-resident-id]');
  return card && rail.contains(card) ? card : null;
};

const rectsOverlap = (a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export function useHeroSheet({ config, residentsById, panels, dragActive, questBounds, zIndex }: UseHeroSheetOptions): HeroSheetApi {
  const { t } = useTranslation('idleVillage');
  const [state, dispatch] = useReducer(
    heroSheetReducer,
    HERO_SHEET_INITIAL_STATE,
    (initial) => ({ ...initial, dragging: dragActive }) as HeroSheetState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const dragActiveRef = useRef(dragActive);
  dragActiveRef.current = dragActive;
  const questBoundsRef = useRef(questBounds);
  questBoundsRef.current = questBounds;
  const residentsByIdRef = useRef(residentsById);
  residentsByIdRef.current = residentsById;

  const [railEl, setRailEl] = useState<HTMLDivElement | null>(null);
  const railRef = useCallback((el: HTMLDivElement | null) => setRailEl(el), []);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  /** Session position: stored on close-while-pinned, applied at the next open, cleared otherwise. */
  const sessionOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const lastPanelRectRef = useRef<DOMRect | null>(null);
  const anchorCardTopRef = useRef<number | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [openOffset, setOpenOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [railVersion, setRailVersion] = useState(0);
  const [equipmentMap, setEquipmentMap] = useState<Record<string, EquipmentItem>>({});
  const panelHeightRef = useRef<number | null>(null);

  /* The equipment map is shared session data (same source PgDetailCard loads):
   * fetched once, not per open. */
  useEffect(() => {
    let cancelled = false;
    getAllEquipment()
      .then((all) => {
        if (!cancelled) setEquipmentMap(Object.fromEntries(all.map((item) => [item.id, item])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Timers: every `pending`/`intending` the state describes gets exactly one
   * timeout; a transition re-arms, an unmount clears all. ── */
  useEffect(() => {
    const timers: number[] = [];
    if (state.status === 'intending') {
      timers.push(window.setTimeout(() => dispatch({ type: 'intentFired' }), config.hoverIntentMs));
    } else if (state.status === 'open' && state.pending && !state.suspended) {
      const ms = state.pending.kind === 'grace' ? config.graceMs : config.retargetDwellMs;
      const type = state.pending.kind === 'grace' ? 'graceFired' : 'retargetFired';
      timers.push(window.setTimeout(() => dispatch({ type }), ms));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [state, config.hoverIntentMs, config.graceMs, config.retargetDwellMs]);

  /* ── Telemetry + focus bookkeeping on real transitions. ── */
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    const wasOpen = prev.status === 'open';
    const isOpen = state.status === 'open';
    if (!wasOpen && isOpen) {
      trackTelemetryEvent('hero_sheet_open', { source: state.source, pinned: state.pinned });
      if (state.source !== 'sticky') returnFocusRef.current = document.activeElement as HTMLElement | null;
      setOpenOffset(sessionOffsetRef.current ?? { x: 0, y: 0 });
    } else if (wasOpen && isOpen && prev.targetId !== state.targetId) {
      trackTelemetryEvent('hero_sheet_retarget', { from: prev.targetId, to: state.targetId });
    } else if (wasOpen && !isOpen) {
      trackTelemetryEvent('hero_sheet_close', { reason: state.status === 'closed' ? state.lastCloseReason : undefined });
      /* Pinned close persists the session position (measured rect − base anchor);
       * anything else re-anchors at the next open. */
      sessionOffsetRef.current =
        prev.pinned && lastPanelRectRef.current && anchor
          ? { x: lastPanelRectRef.current.left - anchor.left - openOffset.x, y: lastPanelRectRef.current.top - anchor.top - openOffset.y }
          : null;
      /* Focus return: only when the sheet had it (focus source or a control
       * inside it was focused) — a hover-close while the pointer is elsewhere
       * must not move the user's focus. */
      const focusWasInside = panelRef.current ? panelRef.current.contains(document.activeElement) : false;
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (prev.source === 'focus' || focusWasInside) {
        const fallback = prev.status === 'open' ? railEl?.querySelector<HTMLElement>(`[data-resident-id="${cssEscape(prev.targetId)}"] [tabindex], [data-resident-id="${cssEscape(prev.targetId)}"]`) : null;
        const focusTarget = target?.isConnected ? target : fallback;
        focusTarget?.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /* ── Registry flag: reflect only. ── */
  useEffect(() => {
    const open = state.status === 'open';
    if (panels.visible.heroSheet !== open) panels.set('heroSheet', open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, panels.set]);

  /* ── Rail delegation: pointerover/out + focusin/out with relatedTarget
   * containment; a pointerdown anywhere on the rail cancels a pending intent
   * (click-assign never opens). ── */
  const railProps = useMemo<HeroSheetApi['railProps']>(
    () => ({
      onPointerOver: (e) => {
        const card = cardOf(e.target, railEl);
        if (!card || card.contains(e.relatedTarget as Node)) return;
        const id = card.dataset.residentId;
        if (id) dispatch({ type: 'cardEnter', id, via: 'hover' });
      },
      onPointerOut: (e) => {
        const card = cardOf(e.target, railEl);
        if (!card || card.contains(e.relatedTarget as Node)) return;
        const id = card.dataset.residentId;
        if (id) dispatch({ type: 'cardLeave', id, via: 'hover' });
      },
      onPointerDownCapture: () => dispatch({ type: 'pointerDown' }),
      onFocusCapture: (e) => {
        const card = cardOf(e.target, railEl);
        if (!card || card.contains(e.relatedTarget as Node)) return;
        if (!(e.target as HTMLElement).matches?.(':focus-visible')) return;
        const id = card.dataset.residentId;
        if (id) dispatch({ type: 'cardEnter', id, via: 'focus' });
      },
      onBlurCapture: (e) => {
        const card = cardOf(e.target, railEl);
        if (!card || card.contains(e.relatedTarget as Node)) return;
        const id = card.dataset.residentId;
        if (id) dispatch({ type: 'cardLeave', id, via: 'focus' });
      },
    }),
    [railEl],
  );

  /* ── Pointer bookkeeping for the post-commit reconcile. ── */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  /* ── DOM-order rail ids (nav order honours filters/sort — never the raw store). ── */
  const railOrderIds = useCallback((): string[] => {
    if (!railEl) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    railEl.querySelectorAll<HTMLElement>('[data-resident-id]').forEach((el) => {
      const id = el.dataset.residentId;
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    });
    return ids;
    // railVersion re-reads after roster mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [railEl, railVersion]);

  const neighbourId = useCallback(
    (id: string, delta: number): string | null => {
      const ids = railOrderIds();
      const next = ids.indexOf(id) + delta;
      return ids[next] ?? null;
    },
    [railOrderIds],
  );

  /* ── Reconcile: post-commit truth from elementFromPoint at the last pointer
   * position. It may retarget or arm grace ONLY from `open`. ── */
  const reconcileNow = useCallback(() => {
    const st = stateRef.current;
    const rail = railEl;
    let id: string | null = null;
    let onPanel = false;
    const last = lastPointerRef.current;
    // jsdom has no elementFromPoint: reconcile degrades to target-existence only.
    if (rail && last && typeof document.elementFromPoint === 'function') {
      const el = document.elementFromPoint(last.x, last.y);
      if (el) {
        if (panelRef.current?.contains(el)) onPanel = true;
        else {
          const card = cardOf(el, rail);
          if (card) id = card.dataset.residentId ?? null;
        }
      }
    }
    const targetId = st.status === 'open' ? st.targetId : null;
    const targetPresent = !rail
      ? false
      : targetId
        ? !!residentsByIdRef.current[targetId] && !!rail.querySelector(`[data-resident-id="${cssEscape(targetId)}"]`)
        : true;
    const dismissedGone =
      !!st.dismissedFor && (!rail || !rail.querySelector(`[data-resident-id="${cssEscape(st.dismissedFor)}"]`));
    const pointerKnown = !!last && typeof document.elementFromPoint === 'function';
    dispatch({ type: 'reconcile', id, onPanel, targetPresent, dismissedGone, pointerKnown });
  }, [railEl]);

  /* Roster DOM mutations (sort, unmount after click-assign, collapse) schedule
   * ONE rect-reconcile on the next frame — never armed from closed/intending. */
  useEffect(() => {
    const rail = railEl;
    if (!rail) return undefined;
    let raf = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setRailVersion((v) => v + 1);
        reconcileNow();
      });
    });
    observer.observe(rail, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [railEl, reconcileNow]);

  /* Resident drag: suspend timers while it lasts, ONE reconcile at dragEnd. */
  const prevDrag = useRef(dragActive);
  useEffect(() => {
    if (dragActive === prevDrag.current) return;
    prevDrag.current = dragActive;
    dispatch({ type: dragActive ? 'dragStart' : 'dragEnd' });
    if (!dragActive) requestAnimationFrame(reconcileNow);
  }, [dragActive, reconcileNow]);

  /* Domain removal (a resident leaving the roster store) closes the sheet on it.
   * So does the rail itself unmounting (roster panel closed/collapsed away). */
  useEffect(() => {
    if (state.status === 'open' && (!residentsById[state.targetId] || !railEl)) {
      dispatch({ type: 'targetRemoved', id: state.targetId });
    }
  }, [state, residentsById, railEl]);

  /* ── Esc, capture phase, before every other panel: dnd > sheet > others. ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || dragActiveRef.current) return;
      if (stateRef.current.status !== 'open') return;
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: 'closeRequest', reason: 'esc' });
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  /* ── Prev/next keys: only with focus inside the panel or on the rail. ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (st.status !== 'open' || st.pinned) return;
      const isPrev = config.navPrevKeys.includes(e.key);
      const isNext = config.navNextKeys.includes(e.key);
      if (!isPrev && !isNext) return;
      const active = document.activeElement as HTMLElement | null;
      const inPanel = !!active && !!panelRef.current?.contains(active);
      const inRail = !!active && !!railEl?.contains(active);
      if (!inPanel && !inRail) return;
      if (active && (active.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName))) return;
      const next = neighbourId(st.targetId, isPrev ? -1 : 1);
      if (!next) return;
      e.preventDefault();
      dispatch({ type: 'nav', dir: isPrev ? 'prev' : 'next', id: next });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [config.navPrevKeys, config.navNextKeys, railEl, neighbourId]);

  /* Route change → close. */
  useEffect(() => {
    const onPop = () => dispatch({ type: 'closeRequest', reason: 'route' });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ── Anchor: right of the card, Y from it at open; re-anchor on roster scroll
   * past the tolerance band. Never covers the anchor card; keeps clear of the
   * quest rail when it can. ── */
  const computeAnchor = useCallback(
    (targetId: string): { left: number; top: number; cardTop: number } | null => {
      const rail = railEl;
      if (!rail) return null;
      const card = rail.querySelector<HTMLElement>(`[data-resident-id="${cssEscape(targetId)}"]`);
      if (!card) return null;
      const rect = card.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = config.widthPx;
      const h = panelHeightRef.current ?? Math.min(460, vh - 32);
      const gap = config.railOffsetXPx;
      const inset = 8;

      // Candidates, in preference order: right of card, then left of card.
      const candidates = [rect.right + gap, rect.left - gap - w].map((left) => ({
        left: Math.max(inset, Math.min(left, vw - w - inset)),
        natural: left,
      }));
      const quest = questBoundsRef.current;
      let best = candidates[0];
      let bestPenalty = Number.POSITIVE_INFINITY;
      for (const c of candidates) {
        const clamped = c.left !== c.natural;
        const box = { left: c.left, right: c.left + w, top: rect.top, bottom: rect.top + h };
        const onCard = rectsOverlap(box, { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
        if (onCard) continue; // never cover the anchor card
        const onQuest = quest ? rectsOverlap(box, quest) : false;
        const penalty = (onQuest ? 2 : 0) + (clamped ? 1 : 0);
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          best = c;
        }
      }
      const top = Math.max(inset, Math.min(rect.top, vh - h - inset));
      return { left: Math.round(best.left), top: Math.round(top), cardTop: rect.top };
    },
    [railEl, config.widthPx, config.railOffsetXPx],
  );

  /* Anchor on open/retarget. */
  useLayoutEffect(() => {
    if (state.status !== 'open') {
      anchorCardTopRef.current = null;
      setAnchor(null);
      return;
    }
    const base = computeAnchor(state.targetId);
    if (base) {
      anchorCardTopRef.current = base.cardTop;
      setAnchor({ left: base.left, top: base.top });
      /* aria-describedby: the focused/hovered card describes itself through the sheet. */
      const card = railEl?.querySelector<HTMLElement>(`[data-resident-id="${cssEscape(state.targetId)}"]`);
      card?.setAttribute('aria-describedby', 'hero-sheet');
      return () => card?.removeAttribute('aria-describedby');
    }
    return undefined;
  }, [state, railEl, computeAnchor]);

  /* Measured panel height feeds the next clamp; last rect feeds pinned persistence. */
  useLayoutEffect(() => {
    if (state.status === 'open' && panelRef.current) {
      lastPanelRectRef.current = panelRef.current.getBoundingClientRect();
      panelHeightRef.current = panelRef.current.offsetHeight;
    }
  });

  /* Re-anchor on roster scroll / viewport resize beyond the tolerance band. */
  useEffect(() => {
    const rail = railEl;
    if (!rail) return undefined;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const st = stateRef.current;
        if (st.status !== 'open' || st.suspended) return;
        const base = computeAnchor(st.targetId);
        if (!base) return;
        const prev = anchorCardTopRef.current;
        if (prev === null || Math.abs(base.cardTop - prev) > config.anchorTolerancePx) {
          anchorCardTopRef.current = base.cardTop;
          setAnchor({ left: base.left, top: base.top });
        }
      });
    };
    rail.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      rail.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      cancelAnimationFrame(raf);
    };
  }, [railEl, computeAnchor, config.anchorTolerancePx]);

  /* ── Registry entry points (sticky source — always bypasses dismissedFor). ── */
  const firstRailId = useCallback(() => railOrderIds()[0] ?? null, [railOrderIds]);
  const open = useCallback<HeroSheetApi['open']>(
    (targetId) => {
      const st = stateRef.current;
      const id =
        targetId ??
        (st.lastViewedId && residentsByIdRef.current[st.lastViewedId] ? st.lastViewedId : firstRailId());
      if (!id) return;
      if (st.status === 'closed') dispatch({ type: 'openRequest', id });
      else if (st.status === 'intending') dispatch({ type: 'openRequest', id });
      else if (st.targetId !== id) dispatch({ type: 'openRequest', id });
    },
    [firstRailId],
  );
  const close = useCallback<HeroSheetApi['close']>((reason = 'toggle') => {
    dispatch({ type: 'closeRequest', reason });
  }, []);
  const toggle = useCallback<HeroSheetApi['toggle']>(() => {
    const st = stateRef.current;
    if (st.status === 'open') dispatch({ type: 'closeRequest', reason: 'toggle' });
    else {
      const id = st.lastViewedId && residentsByIdRef.current[st.lastViewedId] ? st.lastViewedId : firstRailId();
      if (id) dispatch({ type: 'toggleRequest', id });
    }
  }, [firstRailId]);

  /* ── Panel node for overlaySlot. ── */
  const vm: HeroSheetViewModel | null = useMemo(() => {
    if (state.status !== 'open') return null;
    const resident = residentsById[state.targetId];
    return resident ? heroSheetViewModel(resident, equipmentMap, t) : null;
  }, [state, residentsById, equipmentMap, t]);

  const nav = useMemo(() => {
    if (state.status !== 'open') return { canPrev: false, canNext: false };
    const ids = railOrderIds();
    const i = ids.indexOf(state.targetId);
    return { canPrev: i > 0, canNext: i >= 0 && i < ids.length - 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, railOrderIds]);

  const panelNode = useMemo<ReactElement | null>(() => {
    if (state.status !== 'open' || !vm || !anchor) return null;
    return (
      <HeroSheetPanel
        vm={vm}
        left={anchor.left + openOffset.x}
        top={anchor.top + openOffset.y}
        widthPx={config.widthPx}
        zIndex={zIndex}
        pinned={state.pinned}
        canPrev={nav.canPrev}
        canNext={nav.canNext}
        onPrev={() => {
          const next = neighbourId(state.targetId, -1);
          if (next) dispatch({ type: 'nav', dir: 'prev', id: next });
        }}
        onNext={() => {
          const next = neighbourId(state.targetId, 1);
          if (next) dispatch({ type: 'nav', dir: 'next', id: next });
        }}
        onTogglePin={() => dispatch({ type: 'pinToggle' })}
        onClose={() => dispatch({ type: 'closeRequest', reason: 'x' })}
        onPointerEnter={() => dispatch({ type: 'panelEnter' })}
        onPointerLeave={() => dispatch({ type: 'panelLeave' })}
        panelRef={panelRef}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, vm, anchor, openOffset, config.widthPx, zIndex, nav, neighbourId]);

  return { railRef, railProps, panelNode, open, close, toggle };
}
