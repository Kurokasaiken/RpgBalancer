import type { CSSProperties } from 'react';
import { memo, useMemo } from 'react';
import ActivitySlotCard from '@/ui/idleVillage/components/ActivitySlot';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ResidentSlotController, ResidentSlotViewModel, SlotProgressData } from '@/ui/idleVillage/slots/useResidentSlotController';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';

export type ResidentSlotRackVariant = 'board' | 'detail';
export type ResidentSlotOverflow = 'wrap' | 'scroll';

interface SlotDisplayInfo {
  icon?: string;
  label?: string;
}

export interface ResidentSlotRackProps {
  slots: ResidentSlotViewModel[];
  variant?: ResidentSlotRackVariant;
  overflow?: ResidentSlotOverflow;
  getSlotProgress?: ResidentSlotController['getSlotProgress'];
  resolveDisplayInfo?: (slot: ResidentSlotViewModel) => SlotDisplayInfo;
  onSlotDrop?: (slotId: string, residentId: string | null) => void;
  onSlotClear?: (slotId: string) => void;
  onSlotInspect?: (slotId: string) => void;
  draggingResidentId?: string | null;
}

const DEFAULT_ICON = '☆';

const scrollMaskStyle: CSSProperties = {
  maskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
};

const BoardSlot = memo(
  ({
    slot,
    dropState,
    displayInfo,
    onSlotDrop,
    onSlotClear,
    onSlotInspect,
    progress,
  }: {
    slot: ResidentSlotViewModel;
    dropState: DropState;
    displayInfo: SlotDisplayInfo;
    onSlotDrop?: ResidentSlotRackProps['onSlotDrop'];
    onSlotClear?: ResidentSlotRackProps['onSlotClear'];
    onSlotInspect?: ResidentSlotRackProps['onSlotInspect'];
    progress?: SlotProgressData | null;
  }) => {
    const assignedName = slot.assignedResident ? formatResidentLabel(slot.assignedResident) : null;
    return (
      <div className="flex flex-col items-center gap-2">
        <ActivitySlotCard
          slotId={slot.id}
          iconName={displayInfo.icon ?? DEFAULT_ICON}
          label={displayInfo.label ?? slot.label}
          assignedWorkerName={assignedName}
          progressFraction={progress?.ratio ?? 0}
          elapsedSeconds={progress?.elapsedSeconds ?? 0}
          totalDuration={progress?.totalSeconds ?? 0}
          isInteractive
          dropState={dropState}
          onWorkerDrop={(residentId) => onSlotDrop?.(slot.id, residentId)}
          onInspect={() => onSlotInspect?.(slot.id)}
        />
        {slot.assignedResidentId && onSlotClear && (
          <button
            type="button"
            className="text-[10px] uppercase tracking-[0.2em] text-rose-200 hover:text-rose-100"
            onClick={() => onSlotClear(slot.id)}
          >
            Clear
          </button>
        )}
      </div>
    );
  },
);

const DetailSlot = memo(
  ({
    slot,
    dropState,
    displayInfo,
    onSlotDrop,
    onSlotClear,
  }: {
    slot: ResidentSlotViewModel;
    dropState: DropState;
    displayInfo: SlotDisplayInfo;
    onSlotDrop?: ResidentSlotRackProps['onSlotDrop'];
    onSlotClear?: ResidentSlotRackProps['onSlotClear'];
  }) => {
    const assignedLabel = slot.assignedResident ? formatResidentLabel(slot.assignedResident) : 'Drop resident';
    const isAssigned = Boolean(slot.assignedResidentId);

    return (
      <div className="flex flex-col items-center gap-1">
        <div
          role="button"
          tabIndex={0}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(event) => {
            event.preventDefault();
            const residentId =
              event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
            onSlotDrop?.(slot.id, residentId);
          }}
          onClick={() => {
            if (!isAssigned || !onSlotClear) return;
            onSlotClear(slot.id);
          }}
          className={[
            'relative flex h-14 w-14 items-center justify-center rounded-full border text-[10px] font-semibold uppercase transition-colors',
            dropState === 'valid'
              ? 'border-emerald-300 bg-emerald-500/20 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              : dropState === 'invalid'
                ? 'opacity-35 border-white/20 text-slate-400 cursor-not-allowed'
                : isAssigned
                  ? 'border-white/30 bg-white/10 text-amber-50'
                  : 'border-dashed border-white/20 text-slate-400',
          ].join(' ')}
          title={slot.statHint ?? slot.requirement?.label ?? 'Any stat'}
        >
          {isAssigned ? (
            <span>{assignedLabel.slice(0, 3)}</span>
          ) : (
            <span className="flex flex-col items-center text-[9px] uppercase tracking-[0.2em]">
              <span>{displayInfo.icon ?? '+'}</span>
              <span>{displayInfo.label ?? slot.label}</span>
            </span>
          )}
          {isAssigned && onSlotClear && (
            <span className="absolute -top-1 -right-1 rounded-full bg-black/60 px-1 text-[8px] text-slate-100">×</span>
          )}
        </div>
        <p className="text-[9px] tracking-[0.2em] text-slate-400">{slot.label}</p>
      </div>
    );
  },
);

export const ResidentSlotRack: React.FC<ResidentSlotRackProps> = ({
  slots,
  variant = 'detail',
  overflow = 'wrap',
  getSlotProgress,
  resolveDisplayInfo,
  onSlotDrop,
  onSlotClear,
  onSlotInspect,
}) => {
  const containerClasses = useMemo(() => {
    const base = 'flex gap-3';
    if (variant === 'board') {
      return overflow === 'scroll'
        ? `${base} overflow-x-auto pb-2 pr-1 [-webkit-overflow-scrolling:touch]`
        : `${base} flex-wrap`;
    }
    return overflow === 'scroll'
      ? `${base} overflow-x-auto pb-2 pr-1 text-center [-webkit-overflow-scrolling:touch]`
      : `${base} flex-wrap`;
  }, [variant, overflow]);

  const shouldApplyMask = overflow === 'scroll';

  return (
    <div className={containerClasses} style={shouldApplyMask ? scrollMaskStyle : undefined}>
      {slots.map((slot) => {
        const dropState = slot.dropState ?? 'idle';
        const displayInfo = resolveDisplayInfo?.(slot) ?? { icon: DEFAULT_ICON, label: slot.label };
        const progress = getSlotProgress?.(slot.id) ?? null;

        if (variant === 'board') {
          return (
            <BoardSlot
              key={slot.id}
              slot={slot}
              dropState={dropState}
              displayInfo={displayInfo}
              onSlotDrop={onSlotDrop}
              onSlotClear={onSlotClear}
              onSlotInspect={onSlotInspect}
              progress={progress}
            />
          );
        }

        return (
          <DetailSlot
            key={slot.id}
            slot={slot}
            dropState={dropState}
            displayInfo={displayInfo}
            onSlotDrop={onSlotDrop}
            onSlotClear={onSlotClear}
          />
        );
      })}
    </div>
  );
};

export default ResidentSlotRack;
