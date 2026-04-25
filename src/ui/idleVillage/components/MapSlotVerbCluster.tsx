import React, { useMemo, useState } from 'react';
import type { MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import VerbCard, { type DropState } from '@/ui/idleVillage/legacy/VerbCard';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

export interface MapSlotVerbClusterProps {
  slot: MapSlotDefinition;
  left: number;
  top: number;
  verbs: VerbSummary[];
  cardScale: number;
  isDropMode: boolean;
  canAcceptDrop: boolean;
  isActiveDropTarget: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  slotDropState?: DropState;
  onDropResident: (slotId: string, residentId: string | null) => void;
  onSelectSlot: (slotId: string) => void;
  onSelectVerb?: (slotId: string, verb: VerbSummary | null) => void;
  onResidentDragEnter?: (slotId: string, residentId: string | null) => void;
  onResidentDragLeave?: (slotId: string) => void;
}

const MapSlotVerbCluster: React.FC<MapSlotVerbClusterProps> = ({
  slot,
  left,
  top,
  verbs,
  cardScale,
  isDropMode,
  canAcceptDrop,
  isActiveDropTarget,
  isHighlighted,
  isSelected,
  slotDropState = 'idle',
  onDropResident,
  onSelectSlot,
  onSelectVerb,
  onResidentDragEnter,
  onResidentDragLeave,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const cards = useMemo(() => verbs.slice(0, 2), [verbs]);
  const bloomActive = isSelected || isHighlighted || isActiveDropTarget || isDragOver;
  const dropState: DropState = isDropMode
    ? slotDropState ?? (isActiveDropTarget || isDragOver ? (canAcceptDrop ? 'valid' : 'invalid') : 'idle')
    : 'idle';
  const haloActive = bloomActive || dropState === 'valid';

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isActiveDropTarget ? 'copy' : 'none';
    if (!isDragOver) {
      setIsDragOver(true);
    }
    if (!isSelected) {
      onSelectSlot(slot.id);
    }
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onResidentDragEnter?.(slot.id, residentId);
  };

  const handleDragLeave = () => {
    if (!isDragOver) return;
    setIsDragOver(false);
    onResidentDragLeave?.(slot.id);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    if (canAcceptDrop) {
      onDropResident(slot.id, residentId);
    }
    onResidentDragLeave?.(slot.id);
  };

  const handleSelect = (verb?: VerbSummary) => {
    onSelectSlot(slot.id);
    if (verb) {
      onSelectVerb?.(slot.id, verb);
    }
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%`, zIndex: bloomActive ? 25 : 20 }}
      data-slot-id={slot.id}
    >
      <div
        className={[
          'pointer-events-none absolute top-full left-1/2 -translate-x-1/2 -translate-y-4',
          'transition-all duration-300',
          haloActive ? 'opacity-90 scale-100' : 'opacity-0 scale-75',
        ].join(' ')}
        aria-hidden
      >
        <div className="h-24 w-24 rounded-full bg-amber-200/35 blur-3xl shadow-[0_0_55px_rgba(251,191,36,0.55)]" />
      </div>
      <div
        className={[
          'relative flex flex-col items-center gap-3 rounded-3xl border border-slate-900/70 bg-black/60 px-4 py-4 transition-all duration-200',
          bloomActive
            ? 'ring-4 ring-amber-300/60 drop-shadow-[0_0_50px_rgba(251,191,36,0.8)] scale-105'
            : 'ring-1 ring-slate-800/60 scale-100',
        ].join(' ')}
        style={{ transform: `scale(${cardScale})` }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {cards.length === 0 ? (
          <button
            type="button"
            className="rounded-full border border-slate-600/60 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200"
            onClick={() => handleSelect()}
          >
            {slot.label}
          </button>
        ) : (
          cards.map((verb) => (
            <VerbCard
              key={verb.key}
              icon={verb.icon ?? '◎'}
              progressFraction={verb.progressFraction}
              elapsedSeconds={verb.elapsedSeconds}
              totalDuration={verb.totalDurationSeconds || verb.remainingSeconds || 0}
              injuryPercentage={verb.injuryPercentage}
              deathPercentage={verb.deathPercentage}
              assignedCount={verb.assignedCount}
              totalSlots={verb.totalSlots}
              dropState={dropState}
              isInteractive
              onClick={() => handleSelect(verb)}
              className="w-32"
              visualVariant={verb.visualVariant}
              progressStyle={verb.progressStyle}
            />
          ))
        )}
        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-300">{slot.label}</span>
        {isDropMode && (
          <span
            className={[
              'text-[9px] uppercase tracking-[0.4em]',
              canAcceptDrop ? 'text-amber-100' : 'text-slate-500',
            ].join(' ')}
          >
            {canAcceptDrop ? 'Slot pronto' : 'Slot non compatibile'}
          </span>
        )}
      </div>
    </div>
  );
};

export default MapSlotVerbCluster;
