import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

/**
 * Lets the player move a HUD panel by its title bar: spread `handleProps` on the header
 * row (no grip icon). Presses on the row's own controls (buttons, menus) never start a
 * drag, a double-click puts the panel back where it was anchored, and the offset is
 * clamped so the panel can never leave the viewport. The offset is relative to the
 * anchored position and resets on reload.
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

export function useHudPanelDrag() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  /* Base rect of the dragged panel at offset (0,0), captured on pointerdown so
   * the pointermove clamp can keep the whole panel inside the viewport. */
  const baseRect = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
      event.preventDefault();
      event.stopPropagation();
      start.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
      pointerId.current = event.pointerId;
      const rect = findHudPanelElement(event.currentTarget as HTMLElement)?.getBoundingClientRect();
      baseRect.current = rect
        ? { left: rect.left - offset.x, top: rect.top - offset.y, width: rect.width, height: rect.height }
        : null;
      setDragging(true);
      // Capture is a nicety (keeps the drag when the pointer leaves the handle); it throws
      // for a pointer that is not active, which must not cancel the drag itself.
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* window listeners below still track the pointer */
      }
    },
    [offset],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      let nextX = event.clientX - start.current.x;
      let nextY = event.clientY - start.current.y;
      const base = baseRect.current;
      if (base) {
        const loX = -base.left;
        const hiX = window.innerWidth - base.left - base.width;
        const loY = -base.top;
        const hiY = window.innerHeight - base.top - base.height;
        nextX = Math.min(Math.max(nextX, Math.min(loX, hiX)), Math.max(loX, hiX));
        nextY = Math.min(Math.max(nextY, Math.min(loY, hiY)), Math.max(loY, hiY));
      }
      setOffset({ x: nextX, y: nextY });
    };
    const end = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      pointerId.current = null;
      setDragging(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging]);

  // No `zIndex` key unless dragging: spreading `zIndex: undefined` over a panel's own
  // style would erase its layer and drop it under the HUD chrome.
  const panelStyle: CSSProperties = dragging
    ? { transform: `translate(${offset.x}px, ${offset.y}px)`, zIndex: 1000 }
    : { transform: `translate(${offset.x}px, ${offset.y}px)` };
  const resetPosition = useCallback(() => setOffset({ x: 0, y: 0 }), []);
  const handleProps = {
    onPointerDown,
    onDoubleClick: resetPosition,
    style: { cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' } as CSSProperties,
    'data-dragging': dragging || undefined,
  };

  return { panelStyle, handleProps, dragging };
}
