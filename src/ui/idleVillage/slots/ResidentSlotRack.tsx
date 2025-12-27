import type { CSSProperties, DragEvent } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  onSlotClick?: (slotId: string) => void;
  onSlotInspect?: (slotId: string) => void;
  draggingResidentId?: string | null;
}

const DEFAULT_ICON = '☆';

const scrollMaskStyle: CSSProperties = {
  maskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
};

interface BoardSlotProps {
  slot: ResidentSlotViewModel;
  dropState: DropState;
  displayInfo: SlotDisplayInfo;
  progress?: SlotProgressData | null;
  onSlotDrop?: ResidentSlotRackProps['onSlotDrop'];
  onSlotClear?: ResidentSlotRackProps['onSlotClear'];
  onSlotClick?: ResidentSlotRackProps['onSlotClick'];
  onSlotInspect?: ResidentSlotRackProps['onSlotInspect'];
}

const BoardSlot = memo(
  ({ slot, dropState, displayInfo, progress, onSlotDrop, onSlotClear, onSlotClick, onSlotInspect }: BoardSlotProps) => {
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
          onClick={onSlotClick ? () => onSlotClick(slot.id) : undefined}
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

interface DetailSlotProps {
  slot: ResidentSlotViewModel;
  dropState: DropState;
  displayInfo: SlotDisplayInfo;
  onSlotDrop?: ResidentSlotRackProps['onSlotDrop'];
  onSlotClear?: ResidentSlotRackProps['onSlotClear'];
  onSlotClick?: ResidentSlotRackProps['onSlotClick'];
}

const DetailSlot = memo(({ slot, dropState, displayInfo, onSlotDrop, onSlotClear, onSlotClick }: DetailSlotProps) => {
  const assignedLabel = slot.assignedResident ? formatResidentLabel(slot.assignedResident) : 'Drop resident';
  const isAssigned = Boolean(slot.assignedResidentId);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const residentId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    onSlotDrop?.(slot.id, residentId);
  };

  const handleClick = () => {
    if (isAssigned && onSlotClear) {
      onSlotClear(slot.id);
      return;
    }
    onSlotClick?.(slot.id);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={handleDrop}
        onClick={handleClick}
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
});

export const ResidentSlotRack: React.FC<ResidentSlotRackProps> = ({
  slots,
  variant = 'detail',
  overflow = 'wrap',
  getSlotProgress,
  resolveDisplayInfo,
  onSlotDrop,
  onSlotClear,
  onSlotClick,
  onSlotInspect,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const leftSentinelRef = useRef<HTMLSpanElement | null>(null);
  const rightSentinelRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const containerClasses = useMemo(() => {
    const base = 'flex gap-3 transition-all duration-300';
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

  useEffect(() => {
    if (overflow !== 'scroll') {
      setIsOverflowing(false);
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateOverflowState = () => {
      const canOverflow = container.scrollWidth - container.clientWidth > 4;
      setIsOverflowing(canOverflow);
    };

    updateOverflowState();

    const observerOptions: IntersectionObserverInit = {
      root: container,
      threshold: 0.1,
    };

    const leftObserver = new IntersectionObserver(([entry]) => setShowLeftFade(!entry.isIntersecting), observerOptions);
    const rightObserver = new IntersectionObserver(
      ([entry]) => setShowRightFade(!entry.isIntersecting),
      observerOptions,
    );

    if (leftSentinelRef.current) {
      leftObserver.observe(leftSentinelRef.current);
    }
    if (rightSentinelRef.current) {
      rightObserver.observe(rightSentinelRef.current);
    }

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(container);

    return () => {
      leftObserver.disconnect();
      rightObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [overflow, slots.length]);

  return (
    <div className="relative">
      {isOverflowing && showLeftFade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-black/60 via-black/20 to-transparent" />
      )}
      {isOverflowing && showRightFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-black/60 via-black/20 to-transparent" />
      )}
      {isOverflowing && (
        <button
          type="button"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/80 p-1 text-slate-200 hover:bg-black/60"
          onClick={() => scrollContainerRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {isOverflowing && (
        <button
          type="button"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/80 p-1 text-slate-200 hover:bg-black/60"
          onClick={() => scrollContainerRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        className={containerClasses}
        style={shouldApplyMask ? scrollMaskStyle : undefined}
      >
        {overflow === 'scroll' && <span ref={leftSentinelRef} className="h-0 w-px" aria-hidden />}
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
                progress={progress}
                onSlotDrop={onSlotDrop}
                onSlotClear={onSlotClear}
                onSlotClick={onSlotClick}
                onSlotInspect={onSlotInspect}
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
              onSlotClick={onSlotClick}
            />
          );
        })}
        {overflow === 'scroll' && <span ref={rightSentinelRef} className="h-0 w-px" aria-hidden />}
      </div>
      {isOverflowing && (
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
          Scroll to view more slots
        </p>
      )}
    </div>
  );
};

export default ResidentSlotRack;
