import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import ActivitySlot, { type ActivitySlotCardProps, type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';

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
}

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
          'absolute left-1/2 top-8 z-[999] w-[85%] max-w-[34rem] rounded-3xl obsidian-panel transition-all duration-500 ease-out border border-white/10', // Aggiunto un leggero bordo
          isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
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

          {/* ACTIVITIES AREA - Rimosso il div fisso nero */}
          <div
            className="relative flex flex-none items-center justify-center"
            style={{ height: activitiesHeight, flex: `0 0 ${activitiesHeight}` }}
          >
            <div className="relative z-20 flex w-full items-center justify-center gap-6 px-5 py-2">
              {slotCards && slotCards.length > 0
                ? slotCards.map((card) => (
                    <div key={card.slotId} className="flex items-center justify-center">
                      <div style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                        <ActivitySlot {...card} />
                      </div>
                    </div>
                  ))
                : verbs.map((verb) => (
                    <div key={verb.key} className="flex items-center justify-center">
                      <div style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                        <ActivitySlot
                          slotId={verb.key}
                          iconName={typeof verb.icon === 'string' ? (verb.icon as string) : slotIcon ?? '◎'}
                          label={verb.label}
                          assignedWorkerName={verb.assigneeNames?.[0]}
                          canAcceptDrop={(slotDropStates?.[verb.key] ?? 'idle') !== 'invalid'}
                          dropState={slotDropStates?.[verb.key] ?? 'idle'}
                          onWorkerDrop={(workerId) => onAssignResident?.(verb.key, workerId)}
                          onInspect={() => {}}
                          progressFraction={verb.progressFraction ?? 0}
                          elapsedSeconds={verb.elapsedSeconds ?? 0}
                          totalDuration={verb.totalDurationSeconds ?? 0}
                          isInteractive={true}
                          visualVariant={'azure'}
                        />
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
;

export default TheaterView;
