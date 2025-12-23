import React, { useMemo, useState } from 'react';
import type { MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import MapMarker from '@/ui/idleVillage/MapMarker';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

export interface MapSlotVerbClusterProps {
  slot: MapSlotDefinition;
  left: number;
  top: number;
  verbs: VerbSummary[];
  cardScale: number;
  isDropMode: boolean;
  canAcceptDrop: boolean;
  isHighlighted: boolean;
  isOpen: boolean;
  priorityVerb?: VerbSummary | null;
  onDropResident: (slotId: string, residentId: string | null) => void;
  onFocusSlot: (slotId: string) => void;
}

const MapSlotVerbCluster: React.FC<MapSlotVerbClusterProps> = ({
  slot,
  left,
  top,
  verbs,
  cardScale,
  isDropMode,
  canAcceptDrop,
  isHighlighted,
  isOpen,
  priorityVerb,
  onDropResident,
  onFocusSlot,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const displayVerb = useMemo(() => {
    if (priorityVerb) return priorityVerb;
    if (verbs.length > 0) {
      return verbs[0];
    }
    return null;
  }, [priorityVerb, verbs]);

  const stackCount = Math.max(0, verbs.length - (displayVerb ? 1 : 0));
  const bloomActive = isOpen || (isDropMode && canAcceptDrop && isDragOver);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode || !canAcceptDrop) return;
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    if (!isDropMode || !isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode || !canAcceptDrop) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onDropResident(slot.id, residentId);
  };

  const handleFocusRequest = () => {
    onFocusSlot(slot.id);
  };

  return (
    <div
      className={[
        'absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-2 pointer-events-auto transition-all duration-300',
        bloomActive ? 'scale-110 drop-shadow-[0_0_45px_rgba(251,191,36,0.55)]' : 'scale-100',
        isHighlighted ? 'animate-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: `${left}%`, top: `${top}%` }}
      data-slot-id={slot.id}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-dropeffect={isDropMode && canAcceptDrop ? 'copy' : undefined}
    >
      <div className="relative flex flex-col items-center gap-2">
        <div
          className={[
            'pointer-events-none absolute -inset-8 rounded-full blur-3xl transition-all duration-300',
            bloomActive ? 'opacity-80 bg-amber-200/30' : 'opacity-0',
          ].join(' ')}
          aria-hidden
        />
        <div
          className={[
            'pointer-events-none absolute -inset-5 rounded-full blur-xl transition-all duration-300',
            isDropMode && canAcceptDrop ? 'opacity-80 bg-amber-200/25' : 'opacity-0',
          ].join(' ')}
          aria-hidden
        />
        <button
          type="button"
          onClick={handleFocusRequest}
          className={[
            'relative rounded-3xl border border-slate-900/70 bg-black/55 px-4 py-3 transition-all duration-200',
            bloomActive ? 'ring-2 ring-amber-300/70' : 'ring-1 ring-slate-800/60',
          ].join(' ')}
          style={{ transform: `scale(${cardScale})` }}
          aria-pressed={isOpen}
        >
          <div className="flex flex-col items-center gap-2">
            {displayVerb ? (
              <div className="relative">
                <VerbCardFX verb={displayVerb} />
                <MapMarker
                  verb={displayVerb}
                  isActive={displayVerb.progressFraction > 0 && displayVerb.progressFraction < 1}
                  isFinished={displayVerb.source === 'completed'}
                />
              </div>
            ) : (
              <div className="rounded-full border border-slate-600/60 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
                {slot.label}
              </div>
            )}
            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-300">{slot.label}</span>
            {stackCount > 0 && (
              <span className="text-[10px] text-amber-100/80">
                +{stackCount}
                {' '}
                altri
              </span>
            )}
            {isDropMode && (
              <span
                className={[
                  'text-[9px] uppercase tracking-[0.4em]',
                  canAcceptDrop ? 'text-amber-100' : 'text-slate-500',
                ].join(' ')}
              >
                {canAcceptDrop ? 'Drop Resident' : 'Slot Off'}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default MapSlotVerbCluster;

function VerbCardFX({ verb }: { verb: VerbSummary }) {
  const showResourcePull = verb.source === 'passive' || verb.tone === 'system';
  const showResidentEject =
    verb.progressFraction >= 0.98 && (verb.isJob || verb.isQuest) && (verb.assignedCount ?? 0) > 0;

  if (!showResourcePull && !showResidentEject) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {showResourcePull && <ResourceIntakeFX />}
      {showResidentEject && <ResidentEjectFX count={Math.max(1, verb.assignedCount)} />}
    </div>
  );
}

function ResourceIntakeFX() {
  const spokes = [-25, 12, 42];
  return (
    <>
      {spokes.map((deg, idx) => (
        <div
          key={`resource-spoke-${deg}`}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
          }}
        >
          <span
            className="block h-3 w-3 rounded-full bg-sky-200/90 shadow-[0_0_12px_rgba(56,189,248,0.55)]"
            style={{
              animation: `idleVillageResourceAttract 1.6s ease-in-out ${idx * 0.2}s infinite`,
            }}
          />
        </div>
      ))}
    </>
  );
}

function ResidentEjectFX({ count }: { count: number }) {
  const ejectors = Math.min(count, 3);
  return (
    <>
      {Array.from({ length: ejectors }).map((_, idx) => (
        <div
          key={`resident-eject-${idx}`}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${idx === 0 ? -18 : idx === 1 ? 12 : 28}deg)`,
          }}
        >
          <span
            className="block rounded-full border border-amber-200/70 bg-amber-100/90 px-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
            style={{
              animation: `idleVillageResidentEject 1.2s cubic-bezier(0.25, 0.9, 0.4, 1) ${idx * 0.15}s infinite`,
            }}
          >
            ✦
          </span>
        </div>
      ))}
    </>
  );
}
