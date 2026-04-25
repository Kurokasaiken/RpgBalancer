import { useEffect, useMemo, useRef, useState } from 'react';
import { DragOverlay, type Modifier } from '@dnd-kit/core';
import { useDragContext } from './DragContextStore';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import WorkerCard from './WorkerCard';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getEventCoordinates } from '@dnd-kit/utilities';

interface DragOverlayContentProps {
  label: string;
  resident?: ResidentState;
}

export function DragOverlayContent({ label, resident }: DragOverlayContentProps) {
  if (resident) {
    return (
      <WorkerCard
        id={resident.id}
        name={resident.displayName ?? resident.id}
        hp={Math.round((resident.currentHp ?? resident.statSnapshot?.hp ?? 100) / 10) * 10}
        fatigue={Math.round((resident.fatigue ?? 0) * 10) / 10}
        isHovering={false}
        isDragging={true}
        portraitUrl={resident.portraitUrl}
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-slate-900 text-lg font-semibold uppercase tracking-[0.15em] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
      {label.charAt(0) || '?'}
    </div>
  );
}

interface CustomDragOverlayProps {
  residentsById?: Record<string, ResidentState>;
}

// Custom modifier that centers the overlay on cursor using overlay dimensions (not draggable dimensions)
const OVERLAY_SIZE = 64; // WorkerCard isDragging size is 64x64px (h-16 w-16)

const snapOverlayCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!activatorEvent || !draggingNodeRect) {
    return transform;
  }

  const activatorCoordinates = getEventCoordinates(activatorEvent);
  if (!activatorCoordinates) {
    return transform;
  }

  // Always center the overlay on the cursor, ignoring where the user clicked on the original element
  // This ensures the overlay center is always at the cursor position
  // The transform already positions the overlay at the draggable's original position,
  // so we need to adjust it to center on the cursor instead
  
  // Calculate how much to shift from the draggable's top-left to center the overlay on cursor
  const shiftX = activatorCoordinates.x - draggingNodeRect.left - OVERLAY_SIZE / 2;
  const shiftY = activatorCoordinates.y - draggingNodeRect.top - OVERLAY_SIZE / 2;

  return {
    ...transform,
    x: transform.x + shiftX,
    y: transform.y + shiftY,
  };
};

export function CustomDragOverlay({ residentsById }: CustomDragOverlayProps = {}) {
  const { activeId, setDragPreviewCenter } = useDragContext();
  const overlayPreviewIdRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [overlayCenter, setOverlayCenter] = useState<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const activeResident = activeId && residentsById ? residentsById[activeId] : undefined;

  // Track cursor position during drag using global pointer events
  useEffect(() => {
    if (!activeId) {
      setCursorPosition(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setCursorPosition(pos);
      // With snapCenterToCursor, the overlay center should be at cursor position
      setDragPreviewCenter(pos);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [activeId, setDragPreviewCenter]);

  const instrumentationMetadata = useMemo(
    () => ({
      source: 'custom_drag_overlay',
      activeId,
    }),
    [activeId],
  );

  const { measurePreviewCreation } = useDragPreviewInstrumentation({
    source: 'custom_overlay',
    residentId: activeId ?? undefined,
    metadata: instrumentationMetadata,
  });

  useEffect(() => {
    if (!activeId) {
      overlayPreviewIdRef.current = null;
      return;
    }

    const measurementStart = typeof performance !== 'undefined' ? performance.now() : null;
    if (measurementStart === null) {
      return;
    }

    let mounted = true;
    void measurePreviewCreation({
      startTime: measurementStart,
      previewId: overlayPreviewIdRef.current ?? undefined,
      metadata: { ...instrumentationMetadata, phase: 'overlay_mount' },
    }).then((result) => {
      if (!mounted) {
        return;
      }
      if (result?.previewId) {
        overlayPreviewIdRef.current = result.previewId;
      }
    });

    return () => {
      mounted = false;
    };
  }, [activeId, instrumentationMetadata, measurePreviewCreation]);

  useEffect(() => {
    if (!activeId) {
      setOverlayCenter(null);
      setDragPreviewCenter(null);
      return;
    }

    let frame: number;
    const measure = () => {
      // DragOverlay renders in a portal, so we need to find the element in the DOM
      const node = overlayRef.current ?? document.querySelector('[data-drag-preview-center]');
      if (node) {
        const rect = node.getBoundingClientRect();
        const nextCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        setOverlayCenter(nextCenter);
        setDragPreviewCenter(nextCenter);
      }
      frame = window.requestAnimationFrame(measure);
    };

    frame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeId, setDragPreviewCenter]);

  return (
    <DragOverlay
      className="pointer-events-none"
      modifiers={[snapOverlayCenterToCursor]}
    >
      {activeId ? (
        <div
          ref={overlayRef}
          data-drag-preview-center={cursorPosition ? `${cursorPosition.x.toFixed(2)},${cursorPosition.y.toFixed(2)}` : (overlayCenter ? `${overlayCenter.x.toFixed(2)},${overlayCenter.y.toFixed(2)}` : undefined)}
          style={{ display: 'inline-block' }}
        >
          <DragOverlayContent label={activeId} resident={activeResident} />
        </div>
      ) : null}
    </DragOverlay>
  );
}
