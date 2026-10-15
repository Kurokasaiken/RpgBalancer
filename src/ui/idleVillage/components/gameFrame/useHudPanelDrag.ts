import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react';

/**
 * Lets the player move a HUD panel by its title bar: spread `handleProps` on the header
 * row (no grip icon). Presses on the row's own controls (buttons, menus) never start a
 * drag, a double-click puts the panel back where it was anchored, and the offset is
 * clamped so the panel can never leave the viewport. The offset is relative to the
 * anchored position and resets on reload.
 *
 * R-196 (WITNESS-01): with `shellRef` the clamp applies to the UNION of the
 * panel and every mounted `[data-hud-companion]` column inside it — the
 * companions are absolutely positioned children of the same translated shell,
 * so one clamp keeps the whole layout inside `[edgeInsetPx, vw − edgeInsetPx]`.
 * A ResizeObserver on the shell plus a window-resize listener re-clamp the
 * committed offset whenever content height or open panels change (the caller
 * passes `reclampDeps` — e.g. the open flags — since companion open/close does
 * not resize the shell element itself).
 */
/**
 * Locates the floating element a drag handle belongs to: the nearest
 * `[data-hud-panel]` ancestor when present, otherwise the nearest
 * `position: fixed|absolute` ancestor (the plaque root the transform lands on).
 */
function findHudPanelElement(from: HTMLElement): HTMLElement | null {
  const tagged = from.closest<HTMLElement>('[data-hud-panel]');
  if (tagged) return tagged;
  let el = from.parentElement;
  while (el && el !== document.body) {
    const position = getComputedStyle(el).position;
    if (position === 'fixed' || position === 'absolute') return el;
    el = el.parentElement;
  }
  return null;
}

/** Union rect of `shell` and every mounted `[data-hud-companion]` inside it,
 *  minus `offset` — i.e. the union at translate(0,0). Companion columns hang
 *  off the shell with `right/left: calc(100% + gap)` and never inflate the
 *  shell's own bounding box, so their rects are unioned explicitly. */
function untransformedUnionRect(shell: HTMLElement, offset: { x: number; y: number }) {
  const rects = [shell.getBoundingClientRect()];
  shell.querySelectorAll<HTMLElement>('[data-hud-companion]').forEach((c) => rects.push(c.getBoundingClientRect()));
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.left - offset.x);
    top = Math.min(top, r.top - offset.y);
    right = Math.max(right, r.right - offset.x);
    bottom = Math.max(bottom, r.bottom - offset.y);
  }
  return { left, top, width: right - left, height: bottom - top };
}

export interface HudPanelDragOptions {
  /** The shell whose union (panel + `[data-hud-companion]` children) is
   *  clamped. Omit for the legacy single-panel behavior. */
  shellRef?: RefObject<HTMLElement | null>;
  /** Edge inset the union stays inside (px). Default 0 = flush to the viewport. */
  edgeInsetPx?: number;
  /** Values that re-arm the re-clamp effect when they change — pass the
   *  companion open flags so opening/closing a column re-fits the union. */
  reclampDeps?: readonly unknown[];
}

export function useHudPanelDrag(options?: HudPanelDragOptions) {
  /* Committed offset: React state, applied through `panelStyle`. It changes only on
   * drag start/end and on double-click reset, never per pointermove. */
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  /* Live offset written straight to the panel element while dragging. Per-move
   * setState re-rendered the whole panel (roster, stats, ledger) every frame, which
   * is what made the windows stutter. The DOM write is throttled to one per frame. */
  const liveOffset = useRef({ x: 0, y: 0 });
  const panelEl = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  /* Base rect of the dragged union at offset (0,0), captured on pointerdown so
   * the pointermove clamp can keep the whole union inside the viewport. */
  const baseRect = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const shellRef = options?.shellRef;
  const edgeInsetPx = options?.edgeInsetPx ?? 0;
  const reclampDeps = options?.reclampDeps;

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
      event.preventDefault();
      event.stopPropagation();
      start.current = { x: event.clientX - liveOffset.current.x, y: event.clientY - liveOffset.current.y };
      pointerId.current = event.pointerId;
      const el = findHudPanelElement(event.currentTarget as HTMLElement);
      panelEl.current = el;
      /* R-196: with a shell the clamp base is the union of the window and its
       * mounted companion columns; the current translate is subtracted so the
       * base is expressed at offset (0,0). */
      const shell = shellRef?.current;
      baseRect.current = shell
        ? untransformedUnionRect(shell, liveOffset.current)
        : (() => {
            const rect = el?.getBoundingClientRect();
            return rect
              ? { left: rect.left - liveOffset.current.x, top: rect.top - liveOffset.current.y, width: rect.width, height: rect.height }
              : null;
          })();
      setDragging(true);
      // Capture is a nicety (keeps the drag when the pointer leaves the handle); it throws
      // for a pointer that is not active, which must not cancel the drag itself.
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* window listeners below still track the pointer */
      }
    },
    [shellRef],
  );

  useEffect(() => {
    if (!dragging) return;
    const paint = () => {
      frame.current = null;
      const el = panelEl.current;
      if (el) el.style.transform = `translate(${liveOffset.current.x}px, ${liveOffset.current.y}px)`;
    };
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      let nextX = event.clientX - start.current.x;
      let nextY = event.clientY - start.current.y;
      const base = baseRect.current;
      if (base) {
        const loX = edgeInsetPx - base.left;
        const hiX = window.innerWidth - edgeInsetPx - base.left - base.width;
        const loY = edgeInsetPx - base.top;
        const hiY = window.innerHeight - edgeInsetPx - base.top - base.height;
        nextX = Math.min(Math.max(nextX, Math.min(loX, hiX)), Math.max(loX, hiX));
        nextY = Math.min(Math.max(nextY, Math.min(loY, hiY)), Math.max(loY, hiY));
      }
      liveOffset.current = { x: nextX, y: nextY };
      if (frame.current === null) frame.current = requestAnimationFrame(paint);
    };
    const end = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      pointerId.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      paint();
      setOffset({ ...liveOffset.current });
      panelEl.current = null;
      setDragging(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [dragging, edgeInsetPx]);

  /* Re-clamp the committed offset when the union's footprint changes without a
   * drag: companion open/close (reclampDeps), content height (ResizeObserver on
   * the shell — choice count changes the window height), viewport resize. */
  const reclamp = useCallback(() => {
    const shell = shellRef?.current;
    if (!shell) return;
    const base = untransformedUnionRect(shell, liveOffset.current);
    const loX = edgeInsetPx - base.left;
    const hiX = window.innerWidth - edgeInsetPx - base.left - base.width;
    const loY = edgeInsetPx - base.top;
    const hiY = window.innerHeight - edgeInsetPx - base.top - base.height;
    const x = Math.min(Math.max(liveOffset.current.x, Math.min(loX, hiX)), Math.max(loX, hiX));
    const y = Math.min(Math.max(liveOffset.current.y, Math.min(loY, hiY)), Math.max(loY, hiY));
    if (x === liveOffset.current.x && y === liveOffset.current.y) return;
    liveOffset.current = { x, y };
    shell.style.transform = `translate(${x}px, ${y}px)`;
    setOffset({ x, y });
  }, [shellRef, edgeInsetPx]);

  useEffect(() => {
    const shell = shellRef?.current;
    if (!shell) return;
    reclamp();
    const observer = new ResizeObserver(reclamp);
    observer.observe(shell);
    shell.querySelectorAll<HTMLElement>('[data-hud-companion]').forEach((c) => observer.observe(c));
    window.addEventListener('resize', reclamp);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reclamp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reclamp, ...(reclampDeps ?? [])]);

  // No `zIndex` key unless dragging: spreading `zIndex: undefined` over a panel's own
  // style would erase its layer and drop it under the HUD chrome.
  const panelStyle: CSSProperties = dragging
    ? { transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex: 1000 }
    : { transform: `translate(${offset.x}px, ${offset.y}px)` };
  const resetPosition = useCallback(() => {
    liveOffset.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
  }, []);
  const handleProps = {
    onPointerDown,
    onDoubleClick: resetPosition,
    style: { cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' } as CSSProperties,
    'data-dragging': dragging || undefined,
  };

  return { panelStyle, handleProps, dragging, resetPosition };
}
