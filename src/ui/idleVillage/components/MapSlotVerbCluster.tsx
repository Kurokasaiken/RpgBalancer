import React, { useMemo, useState } from 'react';
import type { MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import VerbCard, { type DropState } from '@/ui/idleVillage/VerbCard';

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
  onDropResident: (slotId: string, residentId: string | null) => void;
  onSelectSlot: (slotId: string) => void;
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
  onDropResident,
  onSelectSlot,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const cards = useMemo(() => verbs.slice(0, 2), [verbs]);
  const bloomActive = isSelected || isHighlighted || isActiveDropTarget || isDragOver;
  const dropState: DropState =
    isDropMode && (isActiveDropTarget || isDragOver) ? (canAcceptDrop ? 'valid' : 'invalid') : 'idle';

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isActiveDropTarget ? 'copy' : 'none';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    if (!isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    if (canAcceptDrop) {
      onDropResident(slot.id, residentId);
    }
  };

  const handleSelect = () => {
    onSelectSlot(slot.id);
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%`, zIndex: bloomActive ? 25 : 20 }}
      data-slot-id={slot.id}
    >
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
            onClick={handleSelect}
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
              onClick={handleSelect}
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
