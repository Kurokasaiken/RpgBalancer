import React, { useState, useEffect } from 'react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import theaterPlaceholder from '@/assets/ui/idleVillage/theater-placeholder.jpg';

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
}) => {
  const THEATER_HEIGHT = '50vh';
  const PANORAMA_RATIO = 0.6; // reduced by 15%
  const ACTIVITY_RATIO = 1 - PANORAMA_RATIO;
  const ACTIVITY_SCALE = 0.6; // reduced by 25%
  const panoramaHeight = `calc(${THEATER_HEIGHT} * ${PANORAMA_RATIO})`;
  const activitiesHeight = `calc(${THEATER_HEIGHT} * ${ACTIVITY_RATIO})`;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          'absolute left-1/2 top-10 z-40 w-1/2 max-w-4xl -translate-x-1/2 rounded-3xl obsidian-panel transition-all duration-500 ease-out',
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          acceptResidentDrop && isDragOver ? 'ring-2 ring-emerald-300/70 shadow-[0_0_40px_rgba(16,185,129,0.45)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ height: THEATER_HEIGHT }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-dropeffect={acceptResidentDrop ? 'copy' : undefined}
      >
        {acceptResidentDrop && (
          <div
            className={[
              'pointer-events-none absolute inset-0 rounded-3xl border-2 border-dashed transition-colors duration-200',
              isDragOver ? 'border-emerald-300/80' : 'border-transparent',
            ].join(' ')}
          />
        )}
        <div className="flex h-full flex-col gap-4 px-6 py-4">
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-amber-200/30 shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
            style={{ flex: `0 0 ${panoramaHeight}` }}
          >
            <img
              src={theaterPlaceholder}
              alt="Northern frontier panorama"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/65 via-black/20 to-transparent" />
            <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Panorama</p>
                <p className="text-lg font-semibold tracking-[0.2em] text-amber-50">
                  {slotIcon ?? '◎'} {slotLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-amber-200/80 bg-black/40 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-100 transition hover:bg-amber-100/10"
              >
                Chiudi
              </button>
            </div>
          </div>
          <div
            className="flex flex-1 items-end justify-between gap-4 overflow-x-auto pb-2"
            style={{ height: activitiesHeight, flex: `0 0 ${activitiesHeight}` }}
          >
            {verbs.map((verb) => (
              <div
                key={verb.key}
                className="flex flex-1 items-end justify-center h-full"
                style={{ height: '100%' }}
              >
                <div
                  className="origin-bottom"
                  style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'bottom center' }}
                >
                  <ActivitySlot
                    slotId={verb.key}
                    iconName={typeof verb.icon === 'string' ? (verb.icon as string) : slotIcon ?? '◎'}
                    label={verb.label}
                    assignedWorkerName={verb.assigneeNames?.[0]}
                    onWorkerDrop={() => {}}
                    onInspect={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
;

export default TheaterView;
