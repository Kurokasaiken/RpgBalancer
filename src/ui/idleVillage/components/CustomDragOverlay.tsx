import { useEffect, useMemo, useRef, useState } from 'react';
import { DragOverlay, type Modifier, type DropAnimation, type DropAnimationFunctionArguments } from '@dnd-kit/core';
import { useDragContext } from './DragContextStore';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { WanderlustMedalOverlay } from './WanderlustMedalOverlay';
import { getDragConfig } from '../config/dragConfig';
import WorkerCard from './WorkerCard';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getEventCoordinates, CSS } from '@dnd-kit/utilities';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';

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
          portraitUrl={getResidentPortraitUrl(resident)}
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
  dragVisualState?: DragVisualState;
}

type DragVisualState = {
  mode: 'idle' | 'dragging' | 'flight' | 'returning';
  residentId?: string;
};

// Drop animation: spring the overlay CENTER back to the CENTER of the original PgCard.
//
// ROOT CAUSE of the previous bug:
//   When the drag ends, dnd-kit's AnimationManager clones the last PositionedOverlay
//   and re-renders it inside NullifiedContextProvider, which injects
//   `ActiveDraggableContext = {x:0, y:0}`. Our modifier snapOverlayCenterToCursor
//   then runs on that zero-delta and positions the clone at the INITIAL CLICK OFFSET
//   from the card top-left — not at the current cursor/release position.
//   Reading getBoundingClientRect() or getComputedStyle() at that point therefore
//   returns the initial-click position, not where the user let go.
//
// THE FIX:
//   1. Store the EXACT cursor position on every pointermove AND on pointerup
//      (capture phase) into window.__lastDragPosition.
//   2. In the DropAnimationFunction, derive both keyframes in absolute viewport
//      coordinates and convert to the clone's local transform space by subtracting
//      the clone's base CSS top/left (which dnd-kit sets from initialRect).
//
// COORDINATE ALGEBRA (viewport-relative):
//   clone base position: (baseLeft, baseTop) = clone.style.left/.top
//   START keyframe: cursor at release = __lastDragPosition
//     since snapOverlayCenterToCursor places medal center at cursor:
//     containerLeft = cursorX − medalSize/2
//     startTransform.x = containerLeft − baseLeft = cursorX − medalSize/2 − baseLeft
//   END keyframe: PgCard center
//     containerLeft = cardCenterX − medalSize/2
//     endTransform.x = containerLeft − baseLeft = cardCenterX − medalSize/2 − baseLeft
const centerReturnDropAnimation: DropAnimation = ({
  active,
  dragOverlay,
}: DropAnimationFunctionArguments): Promise<void> => {
  // Valid drop: FlightProxy owns the token from here (flag set by
  // useDragOutcome.startFlight). Hide the dnd-kit clone immediately or the
  // token appears doubled (clone + flight proxy) for the animation duration.
  if ((window as Window & { __dragFlightActive?: boolean }).__dragFlightActive) {
    (dragOverlay.node as HTMLElement).style.display = 'none';
    return Promise.resolve();
  }

  const medalSize = getDragConfig().overlay.medalSizePx;
  const halfMedal = medalSize / 2;

  // Base CSS position of the clone (initialRect stored as inline style by dnd-kit).
  const baseLeft = parseFloat((dragOverlay.node as HTMLElement).style.left || '0');
  const baseTop  = parseFloat((dragOverlay.node as HTMLElement).style.top  || '0');

  // START: where the medal center was when the user released (viewport coords).
  // __lastDragPosition is written on every pointermove + pointerup capture.
  const lastPos = (window as any).__lastDragPosition as { x: number; y: number } | undefined;
  const startCenterX = lastPos?.x ?? (baseLeft + halfMedal);
  const startCenterY = lastPos?.y ?? (baseTop  + halfMedal);

  // END: center of the PgCard (live measurement from dnd-kit, scroll-safe).
  const endCenterX = active.rect.left + active.rect.width  / 2;
  const endCenterY = active.rect.top  + active.rect.height / 2;

  // Convert viewport centers to clone-local transforms:
  //   containerTopLeft = center − halfMedal  →  transform = containerTopLeft − base
  const startTransform = {
    x: startCenterX - halfMedal - baseLeft,
    y: startCenterY - halfMedal - baseTop,
    scaleX: 1,
    scaleY: 1,
  };
  const endTransform = {
    x: endCenterX - halfMedal - baseLeft,
    y: endCenterY - halfMedal - baseTop,
    scaleX: 1,
    scaleY: 1,
  };

  // Dim source card while overlay flies back.
  const prevOpacity = active.node.style.getPropertyValue('opacity');
  active.node.style.setProperty('opacity', '0.5');

  const animation = dragOverlay.node.animate(
    [
      { opacity: 1, transform: CSS.Transform.toString(startTransform) },
      { opacity: 0, transform: CSS.Transform.toString(endTransform) },
    ],
    {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      fill: 'forwards',
    },
  );

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      active.node.style.setProperty('opacity', prevOpacity);
      resolve();
    };
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  });
};

// Custom modifier that aligns overlay center to cursor pickup position.
//
// IMPORTANT: this modifier MUST NOT touch __dragHomeCenter — that value is the
// authoritative spring-return anchor and is written by PgCard.handlePointerDown
// using the REAL portrait DOM rect. Overwriting it here with a hardcoded
// estimate (the previous bug) made the token spring back to the card's
// top-left corner instead of the portrait center.
const snapOverlayCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!activatorEvent || !draggingNodeRect) {
    return transform;
  }

  const activatorCoordinates = getEventCoordinates(activatorEvent);
  if (!activatorCoordinates) {
    return transform;
  }

  // Use true pointer pickup offset captured by PgCard handlePointerDown.
  // This ensures overlay center aligns exactly where the user clicked.
  const dragCursorOffset = (window as any).__dragCursorOffset;
  const overlaySize = getDragConfig().overlay.medalSizePx ?? draggingNodeRect.width;

  if (dragCursorOffset) {
    // dnd-kit places overlay top-left where the original node top-left was,
    // then applies `transform` (delta from pickup point). We add the pickup
    // offset (cursor position relative to node top-left) and subtract half
    // the overlay size so that overlay CENTER sits exactly on the cursor.
    return {
      ...transform,
      x: transform.x + dragCursorOffset.x - overlaySize / 2,
      y: transform.y + dragCursorOffset.y - overlaySize / 2,
    };
  }

  // Fallback when pickup offset is unavailable: assume click was at the center
  // of the dragged node, then re-center overlay (which may have different size)
  // on the cursor.
  return {
    ...transform,
    x: transform.x + draggingNodeRect.width / 2 - overlaySize / 2,
    y: transform.y + draggingNodeRect.height / 2 - overlaySize / 2,
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
  useChildVersion = false,
  dragVisualState,
}: CustomDragOverlayProps) {
  const { setDragPreviewCenter, magnetTargetCenter, setDragHomeCenter } = useDragContext();
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

  // Sync portrait origin from window global to drag context
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__dragHomeCenter) {
      setDragHomeCenter((window as any).__dragHomeCenter);
    }
  }, [activeId, setDragHomeCenter]);

  // Track cursor position during drag using global pointer events
  useEffect(() => {
    if (!activeId) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      // Store release position for drop animation (read by centerReturnDropAnimation).
      (window as any).__lastDragPosition = pos;
      setCursorPosition(pos);
      // With snapCenterToCursor, the overlay center should be at cursor position
      setDragPreviewCenter(pos);
      dispatchSyntheticDragOver(pos);
    };

    // Capture the EXACT release coordinates before dnd-kit's pointerup handler
    // fires and changes activeId (which would clean up this effect too early).
    const handlePointerUp = (e: PointerEvent) => {
      (window as any).__lastDragPosition = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      setCursorPosition(null);
    };
  }, [activeId, setDragPreviewCenter]);

  // Force `grabbing` cursor on every element while a drag is active.
  // Without this, the cursor reverts to the arrow when it crosses elements
  // whose own CSS sets a different cursor (or none).
  useEffect(() => {
    if (!activeId) return;
    const previousBodyCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-drag-grabbing-cursor', 'true');
    styleEl.textContent = '*, *::before, *::after { cursor: grabbing !important; }';
    document.head.appendChild(styleEl);
    return () => {
      document.body.style.cursor = previousBodyCursor;
      styleEl.remove();
    };
  }, [activeId]);

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
      modifiers={[snapOverlayCenterToCursor]}
      dropAnimation={centerReturnDropAnimation}
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
            // `block` + lineHeight/fontSize 0 prevents inline line-height from
            // adding ~3-5 px of phantom height to the wrapper bbox, which would
            // push the overlay center below the cursor.
            display: 'block',
            lineHeight: 0,
            fontSize: 0,
            cursor: 'grabbing',
          }}
        >
          {usePgCardPreview && activeResident ? (
            <WanderlustMedalOverlay
              portraitUrl={activeResident ? getResidentPortraitUrl(activeResident) : undefined}
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
