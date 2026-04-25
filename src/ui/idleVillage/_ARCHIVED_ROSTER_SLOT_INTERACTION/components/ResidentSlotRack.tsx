import type { CSSProperties } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActivitySlotCard from '@/ui/idleVillage/components/ActivitySlot';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ResidentSlotViewModel, SlotProgressData } from '@/ui/idleVillage/slots/types';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';

/**
 * ResidentSlotRack renders activity slots in board/detail layouts while staying Style-Lab compliant.
 * Theme tokens: border colors derive from global CSS vars (Gilded Observatory). Bloom states come from controller.
 */
export type ResidentSlotRackLayout = 'board' | 'detail';
export type ResidentSlotOverflow = 'wrap' | 'scroll';

interface SlotDisplayInfo {
  icon?: string;
  label?: string;
  visualVariant?: VerbVisualVariant;
}

export interface ResidentSlotRackProps {
  slots: ResidentSlotViewModel[];
  layout?: ResidentSlotRackLayout;
  overflowBehavior?: ResidentSlotOverflow;
  getSlotProgress?: (slotId: string) => SlotProgressData | null;
  resolveDisplayInfo?: (slot: ResidentSlotViewModel) => SlotDisplayInfo;
  onSlotDrop?: (slotId: string, residentId: string | null) => void;
  onSlotClear?: (slotId: string) => void;
  onSlotClick?: (slotId: string) => void;
  onSlotInspect?: (slotId: string) => void;
  selectedSlotId?: string | null;
  highlightedSlotId?: string | null;
  draggingResidentId?: string | null;
}

const DEFAULT_ICON = '☆';
const DEFAULT_LIST_LABEL = 'Resident slot rack';

const scrollMaskStyle: CSSProperties = {
  maskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12px, black calc(100% - 12px), transparent)',
};

interface OverflowState {
  containerRef: React.RefObject<HTMLDivElement>;
  leftRef: React.RefObject<HTMLSpanElement>;
  rightRef: React.RefObject<HTMLSpanElement>;
  isOverflowing: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
}

const useOverflowIndicators = (enabled: boolean, dependencyKey: number): OverflowState => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLSpanElement | null>(null);
  const rightRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const evaluateOverflow = () => {
      setIsOverflowing(container.scrollWidth - container.clientWidth > 4);
    };

    evaluateOverflow();

    const observerOptions: IntersectionObserverInit = {
      root: container,
      threshold: 0.1,
    };

    const leftObserver = new IntersectionObserver(([entry]) => setShowLeftFade(!entry.isIntersecting), observerOptions);
    const rightObserver = new IntersectionObserver(([entry]) => setShowRightFade(!entry.isIntersecting), observerOptions);

    if (leftRef.current) {
      leftObserver.observe(leftRef.current);
    }
    if (rightRef.current) {
      rightObserver.observe(rightRef.current);
    }

    const resizeObserver = new ResizeObserver(evaluateOverflow);
    resizeObserver.observe(container);

    return () => {
      leftObserver.disconnect();
      rightObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [enabled, dependencyKey]);

  return { containerRef, leftRef, rightRef, isOverflowing, showLeftFade, showRightFade };
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
  isSelected: boolean;
  isHighlighted: boolean;
}

const BoardSlot = memo(
  ({ slot, dropState, displayInfo, progress, onSlotDrop, onSlotClear, onSlotClick, onSlotInspect, isSelected, isHighlighted }: BoardSlotProps) => {
    const { setNodeRef, isOver } = useDroppable({
      id: slot.id,
      data: { type: 'slot', slotId: slot.id }
    });
    
    const assignedResident = slot.assignedResident;
    const assignedName = assignedResident ? formatResidentLabel(assignedResident) : null;
    const assignedAvatarUrl = assignedResident ? getResidentPortraitUrl(assignedResident) : null;

    // Enhance drop state with hover feedback
    const effectiveDropState = isOver && dropState === 'valid' ? 'valid' : dropState;

    return (
      <div 
        ref={setNodeRef}
        role="listitem" 
        data-slot-id={slot.id} 
        data-drop-state={effectiveDropState}
        data-selected={isSelected ? 'true' : undefined} 
        data-highlighted={isHighlighted ? 'true' : undefined} 
        className="flex flex-col items-center gap-2"
      >
        <ActivitySlotCard
          slotId={slot.id}
          iconName={displayInfo.icon ?? DEFAULT_ICON}
          label={displayInfo.label ?? slot.label}
          assignedWorkerName={assignedName}
          assignedWorkerAvatarUrl={assignedAvatarUrl}
          progressFraction={progress?.ratio ?? 0}
          elapsedSeconds={progress?.elapsedSeconds ?? 0}
          totalDuration={progress?.totalSeconds ?? 0}
          isInteractive
          dropState={effectiveDropState}
          visualVariant={displayInfo.visualVariant}
          onWorkerDrop={(residentId) => {
            console.log('🔍 [ResidentSlotRack] onWorkerDrop called:', { slotId: slot.id, residentId });
            onSlotDrop?.(slot.id, residentId);
          }}
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
  _onSlotDrop?: ResidentSlotRackProps['onSlotDrop'];
  onSlotClear?: ResidentSlotRackProps['onSlotClear'];
  onSlotClick?: ResidentSlotRackProps['onSlotClick'];
  isHighlighted: boolean;
  isSelected: boolean;
  draggingResidentId?: string | null;
}

const DetailSlot = memo(({ slot, dropState, displayInfo, _onSlotDrop, onSlotClear, onSlotClick, isHighlighted, isSelected, draggingResidentId }: DetailSlotProps) => {
  const { setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: 'slot', slotId: slot.id }
  });

  const assignedResident = slot.assignedResident;
  const assignedLabel = assignedResident ? formatResidentLabel(assignedResident) : 'Drop resident';
  const assignedAvatarUrl = assignedResident ? getResidentPortraitUrl(assignedResident) : null;
  const assignedInitials = assignedLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();
  const isAssigned = Boolean(slot.assignedResidentId);
  const isDropTarget = Boolean(draggingResidentId && dropState === 'valid');
  const _playCue = useSensoryAudio();

  const handleClick = () => {
    if (isAssigned && onSlotClear) {
      onSlotClear(slot.id);
      return;
    }
    onSlotClick?.(slot.id);
  };

  return (
    <div className="flex flex-col items-center gap-1" role="listitem" data-slot-id={slot.id} data-drop-state={dropState}>
      <div
        ref={setNodeRef}
        role="button"
        tabIndex={0}
        data-testid={`slot-button-${slot.id}`}
        onClick={handleClick}
        className={[
          'relative flex h-14 w-14 items-center justify-center rounded-full border text-[10px] font-semibold uppercase transition-colors',
          dropState === 'valid'
            ? 'border-emerald-300 bg-emerald-500/20 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
            : dropState === 'invalid'
              ? 'opacity-35 border-white/20 text-slate-400 cursor-not-allowed'
              : isAssigned
                ? 'border-slate-300/70 bg-slate-500/10 text-slate-50'
                : 'border-dashed border-white/20 text-slate-400',
          isHighlighted ? 'ring-2 ring-amber-200/80 ring-offset-2 ring-offset-black/50' : '',
          isSelected ? 'outline-1 outline-white/40' : '',
          isDropTarget ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={slot.statHint ?? slot.requirement?.label ?? 'Any stat'}
        data-selected={isSelected ? 'true' : undefined}
        data-highlighted={isHighlighted ? 'true' : undefined}
      >
        {isAssigned ? (
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/70 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-50">
            {assignedAvatarUrl ? (
              <img src={assignedAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              assignedInitials || assignedLabel.slice(0, 3)
            )}
          </span>
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
  layout = 'detail',
  overflowBehavior = 'wrap',
  getSlotProgress,
  resolveDisplayInfo,
  onSlotDrop,
  onSlotClear,
  onSlotClick,
  onSlotInspect,
  selectedSlotId,
  highlightedSlotId,
  draggingResidentId,
}) => {
  const overflowEnabled = overflowBehavior === 'scroll';
  const { containerRef, leftRef, rightRef, isOverflowing, showLeftFade, showRightFade } = useOverflowIndicators(
    overflowEnabled,
    slots.length,
  );

  const canScroll = overflowEnabled && isOverflowing;

  const containerClasses = useMemo(() => {
    const base = 'flex gap-3 transition-all duration-300';
    if (layout === 'board') {
      return overflowEnabled ? `${base} overflow-x-auto pb-2 pr-1 [-webkit-overflow-scrolling:touch]` : `${base} flex-wrap`;
    }
    return overflowEnabled ? `${base} overflow-x-auto pb-2 pr-1 text-center [-webkit-overflow-scrolling:touch]` : `${base} flex-wrap`;
  }, [layout, overflowEnabled]);

  return (
    <div className="relative group/rack" aria-live="polite">
      {isOverflowing && showLeftFade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-black/60 via-black/20 to-transparent z-10" />
      )}
      {isOverflowing && showRightFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-black/60 via-black/20 to-transparent z-10" />
      )}
      {canScroll && (
        <button
          type="button"
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-3 rounded-full bg-black/80 p-1.5 text-slate-200 hover:bg-black/60 opacity-0 group-hover/rack:opacity-100 transition-opacity disabled:opacity-0"
          disabled={!showLeftFade}
          onClick={() => containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
          aria-label="Scroll slot rack left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScroll && (
        <button
          type="button"
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-3 rounded-full bg-black/80 p-1.5 text-slate-200 hover:bg-black/60 opacity-0 group-hover/rack:opacity-100 transition-opacity disabled:opacity-0"
          disabled={!showRightFade}
          onClick={() => containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
          aria-label="Scroll slot rack right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={containerRef}
        className={containerClasses}
        style={overflowEnabled ? scrollMaskStyle : undefined}
        role="list"
        aria-label={DEFAULT_LIST_LABEL}
      >
        {overflowEnabled && <span ref={leftRef} className="shrink-0 w-px h-full opacity-0" aria-hidden />}
        {slots.map((slot) => {
          const dropState = slot.dropState ?? 'idle';
          const displayInfo = resolveDisplayInfo?.(slot) ?? { icon: DEFAULT_ICON, label: slot.label };
          const progress = getSlotProgress?.(slot.id) ?? null;
          const isSelected = slot.id === selectedSlotId;
          const isHighlighted = slot.id === highlightedSlotId;

          if (layout === 'board') {
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
                isSelected={isSelected}
                isHighlighted={isHighlighted}
              />
            );
          }

          return (
            <DetailSlot
              key={slot.id}
              slot={slot}
              dropState={dropState}
              displayInfo={displayInfo}
              _onSlotDrop={onSlotDrop}
              onSlotClear={onSlotClear}
              onSlotClick={onSlotClick}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              draggingResidentId={draggingResidentId}
            />
          );
        })}
        {overflowEnabled && <span ref={rightRef} className="shrink-0 w-px h-full opacity-0" aria-hidden />}
      </div>
      {isOverflowing && (
        <p className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-slate-400 opacity-60">Scroll for more</p>
      )}
    </div>
  );
};

export const ResidentSlotRackSkeleton: React.FC<{ layout?: ResidentSlotRackLayout; slots?: number }> = ({
  layout = 'detail',
  slots = 3,
}) => {
  return (
    <div className={`flex gap-3 ${layout === 'board' ? 'flex-wrap' : 'flex-wrap'}`} aria-live="polite" aria-busy="true">
      {Array.from({ length: slots }).map((_, index) => (
        <div key={`slot-skeleton-${index}`} className="flex flex-col items-center gap-2" role="presentation">
          <div
            className={`animate-pulse rounded-${layout === 'board' ? '[20px]' : 'full'} border border-white/10 bg-white/5 ${layout === 'board' ? 'h-24 w-24' : 'h-14 w-14'}`}
          />
          <div className="h-2 w-12 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
};

export default ResidentSlotRack;
