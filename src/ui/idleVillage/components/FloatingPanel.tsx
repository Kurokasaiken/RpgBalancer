/**
 * FloatingPanel — a movable, minimisable panel that never blocks the page.
 *
 * Desiderata v4: the POI detail, the quest card and the milestone skill check
 * are not modals. Each can be dragged by its header, collapsed to an icon and
 * closed, and while one is open the rest of the surface stays fully
 * interactive — no backdrop, no pointer capture. The last panel touched comes
 * to the front.
 *
 * Why not `PanelShell` from the design system: that shell drags via
 * `@dnd-kit`'s `useDraggable`, which needs a `DndContext`. The quest surface
 * already owns a `DndContext` for resident drag-and-drop, and its `onDragEnd`
 * treats every `active.id` as a resident id — a panel drag would be read as a
 * resident being dropped. This component drags with plain pointer events so the
 * two systems cannot collide.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';

/** Viewport margin kept free so a panel's header can never be dragged away. */
const EDGE_MARGIN = 8;

/**
 * Shared stacking counter. Panels are few and short-lived, so a module-level
 * counter is enough to bring the focused one forward without every caller
 * having to own z-order state.
 */
let stackCounter = 1000;

export interface FloatingPanelProps {
  /** Stable id, used for test hooks and as the drag key. */
  panelId: string;
  /** Header title. */
  title: string;
  /** Panel body. */
  children: ReactNode;
  /** Optional glyph shown in the header and in the minimised pill. */
  icon?: string;
  /** Where the panel first appears; it is clamped into the viewport. */
  initialPosition?: { x: number; y: number };
  /** Panel width in pixels. */
  width?: number;
  /** Maximum body height before the body scrolls. */
  maxBodyHeight?: number;
  /** Shows a close button when provided. */
  onClose?: () => void;
  /** Whether the panel offers the minimise control. Defaults to true. */
  minimizable?: boolean;
  /** Controlled minimised state; omit to let the panel own it. */
  isMinimized?: boolean;
  /** Notified whenever the minimised state changes. */
  onMinimizedChange?: (minimized: boolean) => void;
}

/**
 * FloatingPanel — see module docblock for the interaction contract.
 * @param props - Component props
 * @returns The floating panel, or its minimised pill
 */
export function FloatingPanel({
  panelId,
  title,
  children,
  icon,
  initialPosition,
  width = 520,
  maxBodyHeight,
  onClose,
  minimizable = true,
  isMinimized,
  onMinimizedChange,
}: FloatingPanelProps): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const rawId = useId();
  const headingId = `floating-panel-title-${rawId.replace(/:/g, '')}`;

  const [position, setPosition] = useState(
    () => initialPosition ?? { x: 120, y: 96 },
  );
  const [zIndex, setZIndex] = useState(() => ++stackCounter);
  const [ownMinimized, setOwnMinimized] = useState(false);

  const minimized = isMinimized ?? ownMinimized;
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const bringToFront = useCallback(() => {
    setZIndex(++stackCounter);
  }, []);

  const setMinimized = useCallback(
    (next: boolean) => {
      if (isMinimized === undefined) setOwnMinimized(next);
      onMinimizedChange?.(next);
    },
    [isMinimized, onMinimizedChange],
  );

  /** Keeps the panel reachable after a drag or a viewport resize. */
  const clamp = useCallback((x: number, y: number) => {
    // A pointer event without usable coordinates must not strand the panel at
    // NaN, which would drop its inline position entirely.
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const rect = panelRef.current?.getBoundingClientRect();
    const panelWidth = rect?.width || width;
    return {
      x: Math.min(Math.max(EDGE_MARGIN - panelWidth + 80, x), window.innerWidth - 80),
      y: Math.min(Math.max(EDGE_MARGIN, y), window.innerHeight - 48),
    };
  }, [width]);

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Let the header's own buttons win the event.
      if ((event.target as HTMLElement).closest('button')) return;
      bringToFront();
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      dragOffsetRef.current = {
        dx: event.clientX - position.x,
        dy: event.clientY - position.y,
      };
      // Capture keeps events coming if the pointer outruns the header, but it is
      // an optimisation: a browser that refuses it must still let the drag work.
      try {
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      } catch {
        // best-effort only
      }
    },
    [bringToFront, position.x, position.y],
  );

  const handleHeaderPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const offset = dragOffsetRef.current;
      if (!offset) return;
      const next = clamp(event.clientX - offset.dx, event.clientY - offset.dy);
      if (next) setPosition(next);
    },
    [clamp],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    const target = event.currentTarget as HTMLElement;
    try {
      if (target.hasPointerCapture?.(event.pointerId)) {
        target.releasePointerCapture?.(event.pointerId);
      }
    } catch {
      // best-effort only
    }
  }, []);

  // A window that shrinks below the panel must not strand it off-screen.
  useEffect(() => {
    const onResize = (): void => setPosition((prev) => clamp(prev.x, prev.y) ?? prev);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);

  const headerControls = (
    <div className="ml-auto flex items-center gap-1">
      {minimizable && (
        <button
          type="button"
          data-testid={`floating-panel-minimize-${panelId}`}
          aria-label={
            minimized
              ? t('idleVillage:floatingPanel.restore', { defaultValue: 'Restore panel' })
              : t('idleVillage:floatingPanel.minimize', { defaultValue: 'Minimise panel' })
          }
          onClick={() => setMinimized(!minimized)}
          className="rounded px-2 py-0.5 text-sm leading-none text-amber-200/80 transition-colors hover:bg-amber-400/10 hover:text-amber-100"
        >
          {minimized ? '▢' : '—'}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          data-testid={`floating-panel-close-${panelId}`}
          aria-label={t('idleVillage:floatingPanel.close', { defaultValue: 'Close panel' })}
          onClick={onClose}
          className="rounded px-2 py-0.5 text-sm leading-none text-amber-200/80 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
        >
          ✕
        </button>
      )}
    </div>
  );

  if (minimized) {
    return (
      <SkinScope
        as="div"
        data-testid={`floating-panel-${panelId}`}
        data-minimized="true"
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex }}
      >
        <div
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-move touch-none select-none items-center gap-2 rounded-full border border-amber-700/50 bg-slate-950/95 px-3 py-1.5 shadow-xl"
        >
          {icon && <span aria-hidden>{icon}</span>}
          <span className="max-w-[220px] truncate text-xs uppercase tracking-[0.2em] text-amber-100">
            {title}
          </span>
          {headerControls}
        </div>
      </SkinScope>
    );
  }

  return (
    <SkinScope
      as="div"
      data-testid={`floating-panel-${panelId}`}
      data-minimized="false"
      style={{ position: 'fixed', left: position.x, top: position.y, width, zIndex }}
      onPointerDownCapture={bringToFront}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={headingId}
        className="overflow-hidden rounded-xl border border-amber-700/50 bg-slate-950/97 shadow-2xl"
      >
        <div
          data-testid={`floating-panel-header-${panelId}`}
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-move touch-none select-none items-center gap-2 border-b border-amber-700/30 bg-slate-900/80 px-3 py-2"
        >
          {icon && <span aria-hidden>{icon}</span>}
          <span
            id={headingId}
            className="truncate text-[11px] uppercase tracking-[0.28em] text-amber-100"
          >
            {title}
          </span>
          {headerControls}
        </div>

        <div
          className="overflow-y-auto"
          style={{ maxHeight: maxBodyHeight ?? 'min(78vh, 900px)' }}
        >
          {children}
        </div>
      </div>
    </SkinScope>
  );
}

export default FloatingPanel;
