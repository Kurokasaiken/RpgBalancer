import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

/**
 * Lets the player move a HUD panel by a handle, the same way the roster window
 * moves (pointer capture on the handle, translate on the panel). The offset is
 * relative to the panel's anchored position and resets on reload.
 */
export function useHudPanelDrag() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
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

  const panelStyle: CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    zIndex: dragging ? 1000 : undefined,
  };
  const handleProps = {
    onPointerDown,
    style: { cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' } as CSSProperties,
    'data-dragging': dragging || undefined,
  };

  return { panelStyle, handleProps, dragging };
}
