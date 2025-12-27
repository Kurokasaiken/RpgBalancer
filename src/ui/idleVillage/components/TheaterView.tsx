import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import ActivitySlot, { type ActivitySlotCardProps, type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import ResidentSlotRack, { type ResidentSlotRackProps } from '@/ui/idleVillage/slots/ResidentSlotRack';
import {
  useResidentSlotController,
  type UseResidentSlotControllerOptions,
} from '@/ui/idleVillage/slots/useResidentSlotController';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';
import VerbCard from '@/ui/idleVillage/VerbCard';

/**
 * Props for the compact theater-style overlay that previews the currently selected slot.
 */
export interface TheaterViewProps {
  slotLabel: string;
  slotIcon?: string;
  verbs: VerbSummary[];
  onClose: () => void;
  acceptResidentDrop?: boolean;
  onResidentDrop?: (residentId: string | null) => void;
  onAssignResident?: (slotId: string, residentId: string | null) => void;
  slotDropStates?: Record<string, DropState>;
  slotCards?: ActivitySlotCardProps[];
  rackSources?: TheaterRackSource[];
  onVerbDrop?: (verb: VerbSummary, residentId: string | null) => void;
}

/** Data source used to render ResidentSlotRack rails inside the Theater view. */
export interface TheaterRackSource {
  /** Stable identifier for this rack (activity or slot id). */
  id: string;
  /** Primary label shown above the rack (typically the activity name). */
  title: string;
  /** Optional subtitle (map slot label or contextual note). */
  subtitle?: string;
  /** Controller options powering this rack. */
  controller: UseResidentSlotControllerOptions;
  /** Optional icon/label resolver for the rack’s slots. */
  resolveDisplayInfo?: ResidentSlotRackProps['resolveDisplayInfo'];
  /** Overflow policy for this rail (default: scroll). */
  overflow?: ResidentSlotRackProps['overflow'];
}

interface TheaterRackRailProps {
  source: TheaterRackSource;
  scale: number;
}

const RAIL_LABEL_CLASS =
  'text-[9px] uppercase tracking-[0.28em] text-amber-200/70 text-center whitespace-nowrap';

/**
 * Single rack renderer bridging ResidentSlotController with ResidentSlotRack.
 */
const TheaterRackRail: React.FC<TheaterRackRailProps> = ({ source, scale }) => {
  const { controller, resolveDisplayInfo, overflow = 'scroll', title, subtitle, id } = source;

  const rackController = useResidentSlotController(controller);
  const { slots, assignResidentToSlot, clearSlot, getSlotProgress } = rackController;

  const handleSlotDrop = useCallback<NonNullable<ResidentSlotRackProps['onSlotDrop']>>(
    (slotId, residentId) => {
      if (!residentId) {
        clearSlot(slotId);
        return;
      }
      assignResidentToSlot(residentId, slotId);
    },
    [assignResidentToSlot, clearSlot],
  );

  const handleSlotClear = useCallback<NonNullable<ResidentSlotRackProps['onSlotClear']>>(
    (slotId) => clearSlot(slotId),
    [clearSlot],
  );

  const scaledStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: 'center top',
    }),
    [scale],
  );

  return (
    <div
      key={id}
      className="flex min-w-[7rem] flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 shadow-inner shadow-black/40"
    >
      <p className={RAIL_LABEL_CLASS}>{title}</p>
      {subtitle && <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>}
      <div style={scaledStyle} className="w-max">
        <ResidentSlotRack
          slots={slots}
          variant="board"
          overflow={overflow ?? 'scroll'}
          getSlotProgress={getSlotProgress}
          resolveDisplayInfo={resolveDisplayInfo}
          onSlotDrop={handleSlotDrop}
          onSlotClear={handleSlotClear}
        />
      </div>
    </div>
  );
};

/**
 * Compact overlay showing a set of ActivitySlot previews for the inspected location.
 */
const TheaterView: React.FC<TheaterViewProps> = ({
  slotLabel,
  slotIcon,
  verbs,
  onClose,
  acceptResidentDrop = false,
  onResidentDrop,
  onAssignResident,
  slotDropStates,
  slotCards,
  rackSources,
  onVerbDrop,
}) => {
  const THEATER_HEIGHT = '34vh';
  const ACTIVITY_SLOT_BASE_PX = 112; // Tailwind h-28
  const ACTIVITY_SCALE = 0.45;
  const ACTIVITY_ROW_PADDING = 8;
  const ACTIVITY_ROW_HEIGHT = ACTIVITY_SLOT_BASE_PX * ACTIVITY_SCALE + ACTIVITY_ROW_PADDING * 2;
  const panoramaHeight = `calc(${THEATER_HEIGHT} - ${ACTIVITY_ROW_HEIGHT}px)`;
  const activitiesHeight = `${ACTIVITY_ROW_HEIGHT}px`;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    if (!isDragHandleTarget(event.target)) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!acceptResidentDrop || !onResidentDrop) return;
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    if (!acceptResidentDrop || !isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!acceptResidentDrop || !onResidentDrop) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onResidentDrop(residentId);
  };

  return (
    <>
      {/* Sfondo esterno più morbido */}
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.6)_120%)] transition-opacity duration-500"
        style={{ opacity: isMounted ? 1 : 0 }}
      />
      
      <div
        className={[
          'absolute left-1/2 top-8 z-[999] w-[85%] max-w-[34rem] rounded-3xl obsidian-panel transition-all duration-200 ease-out border border-white/10',
          isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
          isDragOver ? 'ring-4 ring-amber-300/50 shadow-[0_0_55px_rgba(251,191,36,0.45)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          minHeight: THEATER_HEIGHT,
          transform: `translate(-50%, 0) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : undefined,
          backgroundColor: 'rgba(20, 20, 25, 0.95)' // Assicurati che il pannello non sia nero puro
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPointerDown={handlePointerDown}
      >
        <div className="flex h-full flex-col gap-3 px-4 py-3">
          {/* PANORAMA AREA */}
          <div
            className={`relative z-0 w-full overflow-hidden rounded-[28px] shadow-[0_18px_35px_rgba(0,0,0,0.45)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            data-theater-drag-handle="true"
            style={{ height: panoramaHeight, flex: `0 0 ${panoramaHeight}` }}
          >
            <img
              src={theaterPlaceholder}
              alt="Panorama"
              className="h-full w-full object-cover"
              style={{ minHeight: panoramaHeight }}
            />
            {/* Overlay immagine alleggerito */}
            <div className="absolute inset-0 rounded-2xl border border-amber-100/10 bg-linear-to-t from-black/30 via-transparent to-transparent shadow-inner shadow-black/20" />
            
            {/* Header Info */}
            <div className="pointer-events-none absolute top-4 left-4 right-4 z-20">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 px-4 py-2 backdrop-blur-md">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Panorama</p>
                  <p className="text-lg font-semibold tracking-[0.2em] text-amber-50">
                    {slotIcon ?? '◎'} {slotLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/50 text-slate-100 hover:bg-rose-900/40 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVITIES AREA */}
          <div
            className="relative flex flex-none items-center justify-center"
            style={{ height: activitiesHeight, flex: `0 0 ${activitiesHeight}` }}
          >
            <div className="relative z-20 flex w-full items-center justify-center gap-6 overflow-x-auto px-5 py-2">
              {rackSources && rackSources.length > 0
                ? rackSources.map((source) => (
                    <TheaterRackRail key={source.id} source={source} scale={ACTIVITY_SCALE} />
                  ))
                : slotCards && slotCards.length > 0
                  ? slotCards.map((card) => (
                      <div key={card.slotId} className="flex items-center justify-center">
                        <div style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                          <ActivitySlot {...card} />
                        </div>
                      </div>
                    ))
                  : verbs.map((verb) => {
                      const dropStateKey = verb.slotId ?? verb.key;
                      const dropState = slotDropStates?.[dropStateKey] ?? 'idle';
                      const canAccept = dropState !== 'invalid';

                      const handleVerbDragOver = (event: React.DragEvent<HTMLDivElement>) => {
                        if (!acceptResidentDrop) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = canAccept ? 'copy' : 'none';
                      };

                      const handleVerbDrop = (event: React.DragEvent<HTMLDivElement>) => {
                        if (!acceptResidentDrop) return;
                        event.preventDefault();
                        const residentId =
                          event.dataTransfer.getData(RESIDENT_DRAG_MIME) ||
                          event.dataTransfer.getData('text/plain') ||
                          null;
                        onVerbDrop?.(verb, residentId);
                      };

                      return (
                        <div
                          key={verb.key}
                          className={[
                            'flex items-center justify-center rounded-[999px] transition-all duration-200',
                            canAccept ? 'shadow-[0_0_45px_rgba(251,191,36,0.35)]' : '',
                          ].join(' ')}
                          onDragOver={handleVerbDragOver}
                          onDragEnter={handleVerbDragOver}
                          onDrop={handleVerbDrop}
                        >
                          <div style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                            <VerbCard
                              icon={verb.icon ?? slotIcon ?? '◎'}
                              progressFraction={verb.progressFraction}
                              elapsedSeconds={verb.elapsedSeconds}
                              totalDuration={verb.totalDurationSeconds || verb.remainingSeconds || 0}
                              injuryPercentage={verb.injuryPercentage}
                              deathPercentage={verb.deathPercentage}
                              assignedCount={verb.assignedCount}
                              totalSlots={verb.totalSlots}
                              visualVariant={verb.visualVariant}
                              dropState={dropState}
                              isInteractive
                              onClick={() => onAssignResident?.(verb.slotId ?? verb.key, null)}
                            />
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
;

export default TheaterView;
