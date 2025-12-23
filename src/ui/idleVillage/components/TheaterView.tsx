import React, { useState, useEffect } from 'react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import MarbleMedallionCard from '@/ui/fantasy/assets/marble-verb-card/MarbleMedallionCard';
import VerbCard from '@/ui/idleVillage/VerbCard';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

export interface TheaterViewProps {
  slotLabel: string;
  slotIcon?: string;
  panoramaUrl?: string | null;
  verbs: VerbSummary[];
  onClose: () => void;
  acceptResidentDrop?: boolean;
  onResidentDrop?: (residentId: string | null) => void;
}

const TheaterView: React.FC<TheaterViewProps> = ({
  slotLabel,
  slotIcon,
  panoramaUrl,
  verbs,
  onClose,
  acceptResidentDrop = false,
  onResidentDrop,
}) => {
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
    <div
      className={[
        'absolute left-1/2 top-6 z-40 w-[82%] -translate-x-1/2 rounded-3xl border border-gold/30 bg-black/85 shadow-[0_20px_120px_rgba(0,0,0,0.65)] backdrop-blur-lg transition-all duration-700 ease-out',
        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        acceptResidentDrop && isDragOver ? 'border-emerald-300/70 shadow-[0_0_60px_rgba(16,185,129,0.45)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
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
      <header className="relative overflow-hidden rounded-t-3xl">
        {panoramaUrl ? (
          <img
            src={panoramaUrl}
            alt={slotLabel}
            className="h-48 w-full object-cover"
            style={{ aspectRatio: '21 / 9' }}
          />
        ) : (
          <div className="h-48 w-full bg-linear-to-r from-slate-900 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/55 to-black/65" />
        <div className="absolute inset-0 flex items-end justify-between px-6 pb-4">
          <div className="flex items-center gap-3">
            <MarbleMedallionCard title={slotLabel} icon={slotIcon ?? '◎'} tone="neutral" progress={0} isActive={false} />
            <div className="space-y-1 text-sm uppercase tracking-[0.35em] text-amber-200">
              <div className="text-lg font-semibold tracking-[0.2em]">Theater View</div>
              <div className="text-xs text-amber-100/70">Bloom Reveal attivo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amber-200/60 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-amber-100 hover:bg-amber-100/10"
          >
            Chiudi
          </button>
        </div>
      </header>

      <div className="flex flex-nowrap gap-4 overflow-x-auto px-6 py-5">
        {verbs.map((verb) => (
          <div key={verb.key} className="flex flex-col items-center gap-2 text-center text-[10px] uppercase tracking-[0.25em] text-ivory/80">
            <VerbCard
              icon={verb.icon ?? '◎'}
              progressFraction={verb.progressFraction}
              elapsedSeconds={verb.elapsedSeconds}
              totalDuration={verb.totalDurationSeconds || verb.remainingSeconds || 0}
              injuryPercentage={verb.injuryPercentage}
              deathPercentage={verb.deathPercentage}
              assignedCount={verb.assignedCount}
              totalSlots={verb.totalSlots}
              visualVariant={verb.visualVariant}
              progressStyle={verb.progressStyle}
              className="w-32"
            />
            <div className="space-y-0.5">
              <div className="text-[9px] font-semibold text-ivory">{verb.label}</div>
              <div className="text-[9px] text-ivory/60">{verb.kindLabel}</div>
              {verb.deadlineLabel && <div className="text-[9px] text-amber-200">{verb.deadlineLabel}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TheaterView;
