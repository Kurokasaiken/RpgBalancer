import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

/**
 * Lets the player move a HUD panel by its title bar: spread `handleProps` on the header
 * row (no grip icon). Presses on the row's own controls (buttons, menus) never start a
 * drag, and a double-click puts the panel back where it was anchored. The offset is
 * relative to the anchored position and resets on reload.
 */
export function useHudPanelDrag() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
      event.preventDefault();
      event.stopPropagation();
      start.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
      pointerId.current = event.pointerId;
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
      setOffset({ x: event.clientX - start.current.x, y: event.clientY - start.current.y });
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
