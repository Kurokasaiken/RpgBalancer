import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import ActivitySlot, { type DropState } from '@/ui/idleVillage/components/ActivitySlot';
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
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.85)_120%)] transition-opacity duration-500"
        style={{ opacity: isMounted ? 1 : 0 }}
      />
      <div
        className={[
          'absolute left-1/2 top-8 z-[999] w-[85%] max-w-[34rem] rounded-3xl obsidian-panel transition-all duration-500 ease-out',
          isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          minHeight: THEATER_HEIGHT,
          transform: `translate(-50%, 0) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : undefined,
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-dropeffect={acceptResidentDrop ? 'copy' : undefined}
        onPointerDown={handlePointerDown}
      >
        {acceptResidentDrop && (
          <div
            className={[
              'pointer-events-none absolute inset-0 rounded-3xl border-2 border-dashed transition-colors duration-200',
              isDragOver ? 'border-emerald-300/80' : 'border-transparent',
            ].join(' ')}
          />
        )}
        <div className="flex h-full flex-col gap-3 px-4 py-3">
          <div
            className={`relative z-0 w-full overflow-hidden rounded-[28px] shadow-[0_18px_35px_rgba(0,0,0,0.45)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            data-theater-drag-handle="true"
            style={{ height: panoramaHeight, flex: `0 0 ${panoramaHeight}` }}
          >
            <img
              src={theaterPlaceholder}
              alt="Northern frontier panorama"
              className="h-full w-full object-cover"
              style={{ minHeight: panoramaHeight }}
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute top-4 left-4 right-4 z-20">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-[rgba(6,9,14,0.25)] px-4 py-2 shadow-[0_12px_20px_rgba(0,0,0,0.35)] backdrop-blur">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Panorama</p>
                  <p className="text-lg font-semibold tracking-[0.2em] text-amber-50">
                    {slotIcon ?? '◎'} {slotLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/50 text-slate-100 transition hover:border-rose-300 hover:text-rose-200"
                  aria-label="Chiudi TheaterView"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <div
            className="relative flex flex-none items-center"
            style={{ height: activitiesHeight, flex: `0 0 ${activitiesHeight}` }}
          >
            <div className="absolute inset-0 rounded-2xl border border-amber-100/20 bg-gradient-to-t from-black/55 via-black/12 to-transparent shadow-inner shadow-black/40" />
            <div className="relative z-20 mx-auto flex w-full max-w-3xl items-center justify-center gap-6 overflow-x-auto px-5 py-2">
              {verbs.map((verb) => (
                <div
                  key={verb.key}
                  className="flex flex-1 items-end justify-center"
                  style={{ height: '100%' }}
                >
                  <div
                    className="origin-center"
                    style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center center' }}
                  >
                    <ActivitySlot
                      slotId={verb.key}
                      iconName={typeof verb.icon === 'string' ? (verb.icon as string) : slotIcon ?? '◎'}
                      label={verb.label}
                      assignedWorkerName={verb.assigneeNames?.[0]}
                      canAcceptDrop={(slotDropStates?.[verb.key] ?? 'idle') !== 'invalid'}
                      dropState={slotDropStates?.[verb.key] ?? 'idle'}
                      onWorkerDrop={(workerId) => onAssignResident?.(verb.key, workerId)}
                      onInspect={() => {}}
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
