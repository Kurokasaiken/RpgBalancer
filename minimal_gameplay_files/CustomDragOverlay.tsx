import { useEffect, useMemo, useRef, useState } from 'react';
import { DragOverlay, type Modifier } from '@dnd-kit/core';
import { useDragContext } from './DragContextStore';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { WanderlustMedalOverlay } from './WanderlustMedalOverlay';
import { getDragConfig } from '../config/dragConfig';
import WorkerCard from './WorkerCard';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getEventCoordinates } from '@dnd-kit/utilities';

interface DragOverlayContentProps {
  label: string;
  resident?: ResidentState;
}

export function DragOverlayContent({ label, resident }: DragOverlayContentProps) {
  // Check if this is a component drag (not a resident drag)
  const isComponentDrag = label.includes('component') || !resident;
  
  if (resident) {
    return (
      <div data-testid="drag-overlay-content">
        <WorkerCard
          id={resident.id}
          name={resident.displayName || resident.id}
          hp={resident.currentHp}
          fatigue={resident.fatigue}
          isDragging={true}
          portraitUrl={resident.portraitUrl}
        />
      </div>
    );
  }
  
  // Component drag fallback
  return (
    <div data-testid="drag-overlay-content" className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
      <span className="text-amber-300 text-xs font-bold">{label}</span>
    </div>
  );
}

// Child version that always shows circular portrait for residents
export function DragOverlayContentChild({ label, resident }: DragOverlayContentProps) {
  if (resident) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
        {resident.portraitUrl ? (
          <img 
            src={resident.portraitUrl} 
            alt={resident.displayName ?? resident.id}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold uppercase tracking-[0.15em] text-amber-100">
            {(resident.displayName ?? resident.id).charAt(0)}
          </span>
        )}
      </div>
    );
  }
  
  // Fallback for non-resident items
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-slate-900 text-lg font-semibold uppercase tracking-[0.15em] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
      {label.charAt(0) || '?'}
    </div>
  );
}

interface CustomDragOverlayProps {
  residentsById?: Record<string, ResidentState>;
  /** Use child version (circular portrait) instead of full WorkerCard */
  useChildVersion?: boolean;
  /** Use PgCard skin preview instead of WorkerCard */
  usePgCardPreview?: boolean;
  /** Premium drag visual state — single source of truth for overlay visibility */
  dragVisualState?: {
    mode: 'idle' | 'dragging' | 'flight';
    residentId?: string;
  };
}

// Custom modifier that centers the overlay under the cursor using the overlay size instead of the draggable size
const snapOverlayCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!activatorEvent || !draggingNodeRect) {
    return transform;
  }

  const activatorCoordinates = getEventCoordinates(activatorEvent);
  if (!activatorCoordinates) {
    return transform;
  }

  const pointerOffsetX = activatorCoordinates.x - draggingNodeRect.left;
  const pointerOffsetY = activatorCoordinates.y - draggingNodeRect.top;
  const overlaySize = getDragConfig().overlay.medalSizePx ?? draggingNodeRect.width;

  return {
    ...transform,
    x: transform.x + pointerOffsetX - overlaySize / 2,
    y: transform.y + pointerOffsetY - overlaySize / 2,
  };
};

// Emit a synthetic dragover so legacy listeners (e.g., Playwright harness) can capture drag coords
const dispatchSyntheticDragOver = (pos: { x: number; y: number }) => {
  if (!pos) return;
  try {
    const dragEvent = new DragEvent('dragover', {
      clientX: pos.x,
      clientY: pos.y,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(dragEvent);
    return;
  } catch (error) {
    // fallback for environments where DragEvent init may fail
  }

  const mouseEvent = new MouseEvent('dragover', {
    clientX: pos.x,
    clientY: pos.y,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(mouseEvent);
};

export function CustomDragOverlay({ 
  residentsById, 
  usePgCardPreview = true,
  dragVisualState,
}: CustomDragOverlayProps) {
  const { setDragPreviewCenter, magnetTargetCenter } = useDragContext();
  const overlayPreviewIdRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [overlayCenter, setOverlayCenter] = useState<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  
  // REGOLA 2: Solo il proxy durante il drag
  const activeId = dragVisualState?.mode === 'dragging' ? dragVisualState.residentId : null;
  const activeResident = activeId && residentsById ? residentsById[activeId] : undefined;
  
  // Debug coordinate tracking
  useEffect(() => {
    if (!overlayRef.current || !activeId) return;
    
    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    
    console.log('=== DRAG OVERLAY DEBUG ===');
    console.log('Active resident ID:', activeId);
    console.log('Overlay container rect:', {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      centerX: Math.round(rect.left + rect.width / 2),
      centerY: Math.round(rect.top + rect.height / 2)
    });
    
    // Find the medal overlay inside
    const medalOverlay = overlay.querySelector('.tok-svg');
    if (medalOverlay) {
      const medalRect = medalOverlay.getBoundingClientRect();
      console.log('Medal overlay rect:', {
        x: Math.round(medalRect.left),
        y: Math.round(medalRect.top),
        width: Math.round(medalRect.width),
        height: Math.round(medalRect.height)
      });
    }
    
    console.log('Cursor position:', cursorPosition);
    console.log('========================');
  }, [activeId, cursorPosition]);
  
  // Calculate magnetic tilt based on distance to nearest slot
  const magneticTilt = useMemo(() => {
    if (!cursorPosition || !magnetTargetCenter) {
      return { rotate: 0, scale: 1 };
    }

    const dx = magnetTargetCenter.x - cursorPosition.x;
    const dy = magnetTargetCenter.y - cursorPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Maximum magnetic range (pixels)
    const maxRange = 150;
    
    if (distance > maxRange) {
      return { rotate: 0, scale: 1 };
    }

    // Calculate tilt strength (stronger when closer)
    const strength = 1 - (distance / maxRange);
    const maxTilt = 8; // Maximum tilt in degrees
    
    // Calculate angle toward the slot
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Apply tilt based on strength
    const rotate = angle * strength * 0.3; // Reduce effect for subtlety
    const scale = 1 + (strength * 0.05); // Slight scale increase when close
    
    return { rotate, scale };
  }, [cursorPosition, magnetTargetCenter]);

  // Track cursor position during drag using global pointer events
  useEffect(() => {
    if (!activeId) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setCursorPosition(pos);
      // With snapCenterToCursor, the overlay center should be at cursor position
      setDragPreviewCenter(pos);
      dispatchSyntheticDragOver(pos);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      setCursorPosition(null);
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
  }, [activeId, measurePreviewCreation, instrumentationMetadata]);

  useEffect(() => {
    if (!activeId) {
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
        dispatchSyntheticDragOver(nextCenter);
      }
      frame = window.requestAnimationFrame(measure);
    };

    frame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(frame);
      setOverlayCenter(null);
      setDragPreviewCenter(null);
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
          data-drag-preview="true"
          data-debug-active-id={activeId}
          data-debug-use-preview={usePgCardPreview ? 'true' : 'false'}
          data-debug-has-resident={activeResident ? 'true' : 'false'}
          style={{
            transform: `rotate(${magneticTilt.rotate}deg) scale(${magneticTilt.scale})`,
            transition: 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transformOrigin: 'center center',
            display: 'inline-block',
          }}
        >
          {usePgCardPreview && activeResident ? (
            <WanderlustMedalOverlay
              portraitUrl={activeResident?.portraitUrl}
              isDragging={true}
              sizePx={getDragConfig().overlay.medalSizePx}
            />
          ) : useChildVersion ? (
            <DragOverlayContentChild label={activeId} resident={activeResident} />
          ) : (
            <DragOverlayContent label={activeId} resident={activeResident} />
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
