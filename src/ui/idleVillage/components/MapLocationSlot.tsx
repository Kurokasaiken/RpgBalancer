import React, { useState } from 'react';
import type { MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';

export interface MapLocationSlotProps {
  slot: MapSlotDefinition;
  left: number;
  top: number;
  verbs: VerbSummary[];
  isSelected: boolean;
  isDropMode: boolean;
  isActiveDropTarget: boolean;
  isHighlighted: boolean;
  canAcceptDrop: boolean;
  onSelect: (slotId: string) => void;
  onDropResident: (slotId: string, residentId: string | null) => void;
}

const MapLocationSlot: React.FC<MapLocationSlotProps> = ({
  slot,
  left,
  top,
  verbs,
  isSelected,
  isDropMode,
  isActiveDropTarget,
  isHighlighted,
  canAcceptDrop,
  onSelect,
  onDropResident,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const auraActive = isSelected || isActiveDropTarget || isDragOver || isHighlighted;
  const crestColor = isDragOver ? '#22c55e' : 'rgba(15,23,42,0.9)';
  const slotIcon = slot.icon ?? '◎';
  const activityCount = verbs.length;

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
    if (!isDragOver) {
      setIsDragOver(true);
    }
    if (!isSelected) {
      onSelect(slot.id);
    }
  };

  const handleDragLeave = () => {
    if (!isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    if (!isDropMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
    setIsDragOver(false);
  };

  const handleSelect = () => {
    onSelect(slot.id);
  };

  return (
    <div
      className="absolute pointer-events-auto select-none"
      style={{ left: `${left}%`, top: `${top}%`, zIndex: 20 }}
      data-slot-id={slot.id}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={[
            'pointer-events-none absolute -inset-6 rounded-full blur-3xl transition-all duration-200',
            auraActive ? 'opacity-90 bg-amber-200/40' : 'opacity-0',
          ].join(' ')}
          aria-hidden
        />
        <button
          type="button"
          aria-pressed={isSelected}
          className={[
            'relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-200/70 text-2xl text-amber-100 shadow-lg transition-all duration-200',
            auraActive ? 'ring-4 ring-amber-300/60 scale-105' : 'ring-2 ring-slate-900/80 scale-100',
          ].join(' ')}
          style={{ backgroundColor: crestColor }}
          onClick={handleSelect}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span>{slotIcon}</span>
          {activityCount > 1 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
              +{activityCount - 1}
            </span>
          )}
        </button>
        <span className="mt-2 text-[10px] uppercase tracking-[0.35em] text-slate-200 drop-shadow">
          {slot.label}
        </span>
      </div>
    </div>
  );
};

export default MapLocationSlot;
