import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';

/**
 * Props controlling the independent Theater overlay rendered above the sandbox map.
 */
export interface TheaterOverlayProps {
  /**
   * Controls whether the overlay is rendered. False removes it from the DOM for accessibility.
   */
  isOpen: boolean;
  /**
   * Primary slot showcased inside the overlay header; derived from config-first slot data.
   */
  theaterPrimarySlot: ActivitySlotData | null;
  /**
   * Verbs/activities highlighted inside the overlay, typically sourced from useMapContext.
   */
  theaterVerbs: VerbSummary[];
  /**
   * Identifier of the resident currently being dragged, propagated from the drag controller.
   */
  draggingResidentId: string | null;
  /**
   * Enables drop affordances inside the overlay when true.
   */
  acceptResidentDrop?: boolean;
  /**
   * Callback invoked when the overlay should close (ESC key, close button).
   */
  onClose: () => void;
  /**
   * Callback fired when a resident token is dropped inside the overlay boundary.
   */
  onResidentDrop?: (residentId: string | null) => void;
}

/**
 * Config-driven floating overlay that mirrors the Observatory look & feel to preview verbs attached
 * to the inspected location while remaining drag-aware.
 *
 * @param props.isOpen - Controls whether the overlay should render.
 * @param props.theaterPrimarySlot - Highlighted slot rendered in the header.
 * @param props.theaterVerbs - Verb summaries showcased in the action carousel.
 * @param props.draggingResidentId - Active drag token propagated from the roster.
 * @param props.acceptResidentDrop - Enables drop affordances when true.
 * @param props.onClose - Close handler bound to ESC and the close button.
 * @param props.onResidentDrop - Invoked when a resident gets dropped on the overlay.
 */
const TheaterOverlay: React.FC<TheaterOverlayProps> = ({
  isOpen,
  theaterPrimarySlot,
  theaterVerbs,
  draggingResidentId,
  acceptResidentDrop = false,
  onClose,
  onResidentDrop,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const dropEnabled = Boolean(acceptResidentDrop && draggingResidentId && onResidentDrop);

  // Emit theater_opened telemetry when overlay opens
  useEffect(() => {
    if (isOpen && theaterPrimarySlot) {
      console.log('Theater opened for slot:', theaterPrimarySlot.slotId);
    }
  }, [isOpen, theaterPrimarySlot]);

  // Setup window handlers for telemetry
  useEffect(() => {
    if (!isOpen) return;

    const handleSlotSelection = (activityKey: string, activityType?: string, residentName?: string) => {
      console.log('Theater slot selected:', { activityKey, activityType, residentName });
    };

    const handleResidentDrop = (residentId: string, slotId: string, dropValid: boolean) => {
      // TODO: Replace with generic telemetry system
      console.log('Theater resident dropped:', { residentId, slotId, dropValid });
    };

    window.__theaterHandlers = {
      handleSlotSelection,
      handleResidentDrop,
    };

    return () => {
      window.__theaterHandlers = undefined;
    };
  }, [isOpen, theaterPrimarySlot]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => {
      cancelAnimationFrame(frame);
      setIsMounted(false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Theater closed via Escape');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, theaterPrimarySlot]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        const dx = event.clientX - pointerOriginRef.current.x;
        const dy = event.clientY - pointerOriginRef.current.y;
        setPosition({
          x: dragOriginRef.current.x + dx,
          y: dragOriginRef.current.y + dy,
        });
        rafRef.current = null;
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const isDragHandleTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('[data-theater-drag-handle="true"]'));
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isOpen) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      if (!isDragHandleTarget(event.target)) return;
      event.preventDefault();
      pointerOriginRef.current = { x: event.clientX, y: event.clientY };
      dragOriginRef.current = { ...position };
      setIsDragging(true);
    },
    [isOpen, position],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!dropEnabled) return;
      event.preventDefault();
      if (!isDragOver) {
        setIsDragOver(true);
      }
      event.dataTransfer.dropEffect = 'copy';
    },
    [dropEnabled, isDragOver],
  );

  const handleDragLeave = useCallback(() => {
    if (!dropEnabled || !isDragOver) return;
    setIsDragOver(false);
  }, [dropEnabled, isDragOver]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!dropEnabled) return;
      event.preventDefault();
      setIsDragOver(false);
      const residentId =
        event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
      
      if (residentId && theaterPrimarySlot) {
        window.__theaterHandlers?.handleResidentDrop?.(residentId, theaterPrimarySlot.slotId, true);
      }
      
      onResidentDrop?.(residentId);
    },
    [dropEnabled, onResidentDrop, theaterPrimarySlot],
  );

  const verbsToRender = useMemo(() => {
    if (!theaterVerbs || theaterVerbs.length === 0) {
      return [];
    }
    return theaterVerbs;
  }, [theaterVerbs]);

  if (!isOpen || !theaterPrimarySlot) {
    return null;
  }

  const cardCanAcceptDrop = dropEnabled;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.6)_120%)] transition-opacity duration-500"
        style={{ opacity: isMounted ? 1 : 0 }}
        aria-hidden
      />
      <div
        data-testid="theater-overlay"
        className={[
          'absolute left-1/2 top-8 z-40 w-[85%] max-w-136 rounded-3xl obsidian-panel border border-white/10 transition-all duration-200 ease-out',
          isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
          isDragOver ? 'ring-4 ring-amber-300/50 shadow-[0_0_55px_rgba(251,191,36,0.45)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          minHeight: '34vh',
          transform: `translate(-50%, 0) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : undefined,
          backgroundColor: 'rgba(20, 20, 25, 0.95)',
        }}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPointerDown={handlePointerDown}
        role="dialog"
        aria-modal="true"
        aria-label="Theater overlay"
      >
        <div className="flex h-full flex-col gap-3 px-4 py-3">
          <div
            className={`relative z-0 w-full overflow-hidden rounded-[28px] shadow-[0_18px_35px_rgba(0,0,0,0.45)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            data-theater-drag-handle="true"
            style={{ height: '22vh', flex: '0 0 22vh' }}
          >
            <img src={theaterPlaceholder} alt="Panorama" className="h-full w-full object-cover" />
            <div className="absolute inset-0 rounded-2xl border border-amber-100/10 bg-linear-to-t from-black/30 via-transparent to-transparent shadow-inner shadow-black/20" />
            <div className="pointer-events-none absolute top-4 left-4 right-4 z-20">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 px-4 py-2 backdrop-blur-md">
                <div>
                  <p className="text-lg font-semibold tracking-[0.2em] text-amber-50">{theaterPrimarySlot.label}</p>
                  {theaterPrimarySlot.mapSlotLabel && (
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300">{theaterPrimarySlot.mapSlotLabel}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi Theater Overlay"
                  className="pointer-events-auto rounded-full border border-white/20 bg-black/40 p-2 text-ivory transition hover:border-rose-300/70 hover:text-rose-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="relative flex flex-none items-center justify-center" style={{ height: '12vh', flex: '0 0 12vh' }}>
            <div className="relative z-20 flex w-full items-center justify-center gap-6 overflow-x-auto px-5 py-2">
              {verbsToRender.length === 0 ? (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Nessuna attività disponibile</p>
              ) : (
                verbsToRender.map((verb) => {
                  const totalDuration = verb.totalDurationSeconds || verb.remainingSeconds || 0;
                  const remainingSeconds = verb.remainingSeconds || 0;
                  const progress = totalDuration > 0 ? (totalDuration - remainingSeconds) / totalDuration : 0;
                  const status = verb.progressFraction >= 1 ? 'completed' : verb.progressFraction > 0 ? 'running' : 'paused';
                  
                  return (
                    <div
                      key={verb.key}
                      style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
                      className="transition-transform hover:scale-90"
                    >
                      <ActivityCapsule
                        activityId={verb.slotId ?? verb.key}
                        label={verb.label}
                        slots={[
                          {
                            id: verb.slotId ?? verb.key,
                            slotId: verb.slotId ?? verb.key,
                            assignedWorkerName: verb.assigneeNames?.[0],
                            assignedWorkerAvatarUrl: undefined,
                            isOccupied: Boolean(verb.assigneeNames?.[0]),
                            isLocked: false,
                          }
                        ]}
                        maxSlots={1}
                        progressFraction={progress}
                        elapsedSeconds={remainingSeconds}
                        totalDurationSeconds={remainingSeconds}
                        status={status === 'running' ? 'in-progress' : status === 'completed' ? 'completed' : 'idle'}
                        canCollect={status === 'completed'}
                        onActivityClick={() => {
                          window.__theaterHandlers?.handleSlotSelection?.(
                            verb.key,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (verb as any).activityType,
                            verb.assigneeNames?.[0]
                          );
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TheaterOverlay;
