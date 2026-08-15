import type { CSSProperties } from 'react';
import React, { memo, useRef, useEffect } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResidentSlotViewModel, SlotProgressData, DropState } from '@/ui/idleVillage/slots/types';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useSlotSounds } from '@/ui/idleVillage/hooks/useSlotSounds';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import type { MedalBehaviorControls } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
import { FeatureFlags } from '@/shared/config/featureFlags';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_SLOTTED_MEDAL_CONFIG } from '@/balancing/config/idleVillage/slottedMedalConfig';
import { resolveSlotState } from '@/ui/idleVillage/utils/slotStateMapping';
import type { MedalStyleBridgeConfig } from '@/ui/idleVillage/skins/slotRackSkinConfig';
import type { SlotActivityState } from '@/ui/idleVillage/slots/types';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { WanderlustSurface, type WanderlustShape } from '@/ui/wanderlust-surface/WanderlustSurface';
import { type MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';
import styles from './SlotShake.module.css';
import rackScrollStyles from './RackScroll.module.css';
import type { SlotDebugVisualizationSettings } from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';
import { useExtractionSequence } from '@/ui/idleVillage/interaction/useExtractionSequence';
import { getBloomStyle } from '@/ui/idleVillage/interaction/bloomEffect';
import { useV9Tooltip } from '@/ui/v9-skin/useV9Tooltip';

const SLOTTED_MEDAL_BEHAVIOR_CONFIG = {
  resistDurationMs: DEFAULT_SLOTTED_MEDAL_CONFIG.behavior.resistDurationMs,
  springStiffness: DEFAULT_SLOTTED_MEDAL_CONFIG.behavior.springStiffness,
  springDamping: DEFAULT_SLOTTED_MEDAL_CONFIG.behavior.springDamping,
  enableSound: true,
} as const;

const SLOTTED_MEDAL_TELEMETRY = DEFAULT_SLOTTED_MEDAL_CONFIG.telemetry;

const EXTRACTION_TIMING = {
  postOpenHold: 140,
  springDuration: 600, // Match PgCard bounce-spring duration
  cleanupDelay: 200,
} as const;

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
  getSlotActivityState?: (slotId: string) => SlotActivityState | null;
  resolveDisplayInfo?: (slot: ResidentSlotViewModel) => SlotDisplayInfo;
  onSlotDrop?: (slotId: string, residentId: string | null) => void;
  onSlotClear?: (slotId: string) => void;
  onSlotClick?: (slotId: string) => void;
  onSlotInspect?: (slotId: string) => void;
  onSlotPointerDown?: (slotId: string) => void;
  onSlotPointerUp?: (slotId: string) => void;
  selectedSlotId?: string | null;
  highlightedSlotId?: string | null;
  draggingResidentId?: string | null;
  shakingSlotIds?: Set<string>;
  className?: string;
  medalStyleConfig?: MedalStyleBridgeConfig;
  slotDebugVisualization?: SlotDebugVisualizationSettings;
  slotSize?: number; // Optional slot size in px for detail layouts
  
  // WanderlustSurface skin integration
  wanderlustShape?: WanderlustShape;
  wanderlustMaterial?: MaterialPreset;
  wanderlustInteractive?: boolean;
  wanderlustIsPaused?: boolean;
  enableWanderlustSurface?: boolean;
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
  isShaking: boolean;
}

const BoardSlot = memo(
  ({ slot, dropState, displayInfo, progress, onSlotDrop, onSlotClear, onSlotClick, onSlotInspect, isSelected, isHighlighted, isShaking }: BoardSlotProps) => {
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
        {/* ActivitySlotCard component removed - needs replacement */}
        {/* <ActivitySlotCard
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
            onSlotDrop?.(slot.id, residentId);
          }}
          onInspect={() => onSlotInspect?.(slot.id)}
          onClick={onSlotClick ? () => onSlotClick(slot.id) : undefined}
        /> */}
        {slot.assignedResidentId && onSlotClear && (
          <button
            type="button"
            className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80 hover:text-amber-100"
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
  _onSlotDrop?: (slotId: string, residentId: string) => void;
  onSlotClear?: (slotId: string) => void;
  onSlotClick?: (slotId: string) => void;
  isHighlighted: boolean;
  isSelected: boolean;
  draggingResidentId?: string | null;
  isShaking: boolean;
  activityState?: SlotActivityState | null;
  medalStyleConfig?: MedalStyleBridgeConfig;
  slotDebugVisualization?: SlotDebugVisualizationSettings;
  slotSize?: number;
}

const DetailSlot = memo(({
  slot,
  dropState,
  displayInfo,
  _onSlotDrop,
  onSlotClear,
  onSlotClick,
  isHighlighted,
  isSelected,
  draggingResidentId,
  isShaking,
  activityState,
  medalStyleConfig,
  slotDebugVisualization,
  slotSize,
}: DetailSlotProps) => {
  const { setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: 'slot', slotId: slot.id }
  });

  const slotTooltip = slot.statHint ?? slot.requirement?.label ?? 'Any stat';

  // Extraction choreography — single shared implementation (see /slot reference)
  const extraction = useExtractionSequence({
    onExtracted: () => {
      if (onSlotClear) onSlotClear(slot.id);
      // The consumer may start a return flight; the slot itself is done —
      // reset shortly after so the bezel settles into the empty state.
      scheduleExtractionTimeout(() => extraction.reset(), 200);
    },
    onOvershoot: () => {
      if (shouldShowMedal) {
        trackTelemetryEvent(SLOTTED_MEDAL_TELEMETRY.detachEvent, {
          slotId: slot.id,
          residentId: slot.assignedResidentId,
          medalType: 'bronze',
          timestamp: Date.now(),
        });
        slotSounds.detach();
      }
      // NOTE: the in-slot portrait must NOT spring in place here — that made it
      // "move and come back" before extraction, diverging from /slot. The token
      // only moves via the shared FlightProxy (started by the page on onExtracted).
    },
  });
  const extractionProgress = extraction.progress;
  const isExtracting = extraction.isExtracting;
  const extractionTimeoutsRef = useRef<number[]>([]);

  // Drop impact animation state
  const [dropImpactScale, setDropImpactScale] = useState(1);
  const [isDropAnimating, setIsDropAnimating] = useState(false);
  const [dropGlowIntensity, setDropGlowIntensity] = useState(0);

  const scheduleExtractionTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    extractionTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearExtractionTimeouts = useCallback(() => {
    extractionTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    extractionTimeoutsRef.current = [];
  }, []);

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
  const isAssigned = Boolean(slot.assignedResidentId) || Boolean(slot.assignedResident);
  const isDropTarget = Boolean(draggingResidentId && dropState === 'valid');
  const _playCue = useSensoryAudio();
  const slotSounds = useSlotSounds({ enabled: true, volume: 0.5 });

  // Ref for medal behavior to handle failed state
  const medalBehaviorRef = useRef<MedalBehaviorControls | null>(null);
  const lastMedalResidentIdRef = useRef<string | null>(null);

  // SlottedMedal integration - always enabled for Phase 5 rollout
  const slotId = slot.id ?? '';
  const isSlot0 = slotId.endsWith('slot0');
  const shouldShowMedal = isSlot0 && isAssigned;
  const debugVisualization = slotDebugVisualization?.enabled ? slotDebugVisualization : null;

  // Handle activity state changes (including failed state)
  useEffect(() => {
    if (activityState && medalBehaviorRef.current) {
      const behavior = medalBehaviorRef.current;
      
      if (activityState.state === 'failed') {
        // Trigger failed animation on medal
        if (behavior.handleFailed) {
          behavior.handleFailed(activityState.failureType);
        }
        
        // Track failure telemetry
        trackTelemetryEvent('slot_activity_failed', {
          slotId: slot.id,
          residentId: slot.assignedResidentId,
          failureType: activityState.failureType,
          progress: activityState.progress,
          timestamp: Date.now(),
        });
      } else if (activityState.state === 'completing') {
        // Trigger completion animation
        if (behavior.handleComplete) {
          behavior.handleComplete();
        }
      }
    }
  }, [activityState, slot.id, slot.assignedResidentId]);

  // Drop impact animation with overshoot, bounce, and glow
  const triggerDropImpact = useCallback(() => {
    setIsDropAnimating(true);
    setDropImpactScale(1.15); // Overshoot - character appears larger
    setDropGlowIntensity(1); // Intense glow on impact
    
    setTimeout(() => {
      setDropImpactScale(0.9); // Compress - like sinking into mechanism
      setDropGlowIntensity(0.6); // Sustained glow
      
      setTimeout(() => {
        setDropImpactScale(1.05); // Micro-bounce
        setDropGlowIntensity(0.3); // Fading glow
        
        setTimeout(() => {
          setDropImpactScale(1.0); // Settle to final position
          setDropGlowIntensity(0); // Glow fades out
          setIsDropAnimating(false);
        }, 100);
      }, 120);
    }, 80);
  }, []);

  // Handle medal drop telemetry when resident is assigned
  useEffect(() => {
    if (isAssigned && shouldShowMedal && slot.assignedResidentId) {
      if (lastMedalResidentIdRef.current !== slot.assignedResidentId) {
        lastMedalResidentIdRef.current = slot.assignedResidentId;
        trackTelemetryEvent(SLOTTED_MEDAL_TELEMETRY.dropEvent, {
          slotId: slot.id,
          residentId: slot.assignedResidentId,
          medalType: 'bronze',
          timestamp: Date.now(),
        });
        slotSounds.clank();
        // Note: No spring animation on assignment - only on extraction
      }
    } else {
      lastMedalResidentIdRef.current = null;
    }
  }, [isAssigned, shouldShowMedal, slot.id, slot.assignedResidentId, slotSounds]);

  // Press-and-hold extraction mechanism — delegates to the shared sequence
  const startExtraction = useCallback(() => {
    if (!isAssigned || !onSlotClear) return;
    extraction.start();
  }, [isAssigned, onSlotClear, extraction]);

  const cancelExtraction = useCallback(() => {
    extraction.cancel();
  }, [extraction]);

  useEffect(() => {
    return () => {
      clearExtractionTimeouts();
    };
  }, [clearExtractionTimeouts]);

  const handleClick = () => {
    if (!isAssigned) {
      onSlotClick?.(slot.id);
      return;
    }
    // For assigned slots, extraction is handled by press-and-hold
  };

  const slotState = dropState === 'valid' ? 'valid' : dropState === 'invalid' ? 'invalid' : isAssigned ? 'assigned' : 'empty';
  const resolvedMedalSkinPreset = medalStyleConfig?.skinPreset ?? 'minimal';

  const slotButtonStyle: CSSProperties = {
    background: 'var(--slot-rack-slot-bg, rgba(15, 23, 42, 0.6))',
    border:
      slotState === 'valid'
        ? 'var(--slot-rack-slot-border-valid, 1px solid rgba(58, 215, 128, 0.6))'
        : slotState === 'invalid'
          ? 'var(--slot-rack-slot-border-invalid, 1px dashed rgba(255, 255, 255, 0.35))'
          : slotState === 'assigned'
            ? 'var(--slot-rack-slot-border-assigned, 1px solid rgba(252, 232, 144, 0.7))'
            : 'var(--slot-rack-slot-border-empty, 1px dashed rgba(148, 163, 184, 0.45))',
    color:
      slotState === 'empty'
        ? 'var(--slot-rack-slot-empty-text, #cbd5e1)'
        : 'var(--slot-rack-slot-text, #f8fafc)',
    boxShadow:
      dropGlowIntensity > 0
        ? `0 0 ${40 + dropGlowIntensity * 20}px rgba(58, 215, 128, ${0.6 * dropGlowIntensity}), 0 0 ${20 + dropGlowIntensity * 10}px rgba(255, 255, 255, ${0.3 * dropGlowIntensity})`
        : slotState === 'valid'
          // Valid bloom comes from the shared alpha-shaped effect on the wrapper
          ? 'var(--slot-rack-slot-shadow-valid, none)'
          : isHighlighted
            ? 'var(--slot-rack-slot-shadow-highlighted, 0 0 24px rgba(251, 191, 36, 0.45))'
            : 'var(--slot-rack-slot-shadow, none)',
    transition: 'box-shadow 200ms ease, border 200ms ease, background 200ms ease, color 200ms ease, transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: `scale(${dropImpactScale})`,
  };

  if (isSelected) {
    slotButtonStyle.outline = '1px solid var(--slot-rack-slot-ring-color, rgba(255, 255, 255, 0.4))';
    slotButtonStyle.outlineOffset = 'var(--slot-rack-slot-ring-offset, 2px)';
  }

  const labelStyle: CSSProperties = {
    color: 'var(--slot-rack-slot-label-color, #94a3b8)',
  };

  const badgeStyle: CSSProperties = {
    background: 'var(--slot-rack-slot-badge-bg, rgba(0, 0, 0, 0.6))',
    color: 'var(--slot-rack-slot-badge-text, #f8fafc)',
  };

  const clearButtonStyle: CSSProperties = {
    color: 'var(--slot-rack-slot-clear-text, #f8fafc)',
  };

  const initialsStyle: CSSProperties = {
    background: 'var(--slot-rack-slot-initials-bg, rgba(0, 0, 0, 0.7))',
    color: 'var(--slot-rack-slot-text, #f8fafc)',
  };

  const v12State = isAssigned ? 'occupied' : 'empty';

  const pgTokenDebugStyle: CSSProperties | undefined = debugVisualization
    ? {
        boxShadow: `0 0 24px ${debugVisualization.colors.pgToken}`,
        outline: `2px solid ${debugVisualization.colors.pgToken}`,
        outlineOffset: '2px',
        backgroundColor: 'rgba(0,0,0,0.6)',
      }
    : undefined;

  return (
    <div className="flex flex-col items-center gap-1" role="listitem" data-slot-id={slotId} data-drop-state={dropState}>
      <Slot
        ref={setNodeRef}
        tooltip={slotTooltip}
        slotProps={{
          letter: displayInfo.icon ?? 'Q',
          state: v12State,
          extractionProgress,
          debugVisualization: debugVisualization ?? undefined,
          sizePx: slotSize,
        }}
        wrapperProps={{
          role: 'button',
          tabIndex: 0,
          'data-testid': `slot-button-${slot.id}`,
          onClick: handleClick,
          onMouseDown: isAssigned ? startExtraction : undefined,
          onMouseUp: isAssigned ? cancelExtraction : undefined,
          onMouseLeave: isAssigned ? cancelExtraction : undefined,
          onTouchStart: isAssigned ? startExtraction : undefined,
          onTouchEnd: isAssigned ? cancelExtraction : undefined,
          className: [
            'relative',
            shouldShowMedal ? '[&_.slot-v12]:hidden' : '',
            dropState === 'invalid' ? 'cursor-not-allowed' : '',
            isExtracting ? 'cursor-grabbing' : '',
          ]
            .filter(Boolean)
            .join(' '),
          style: {
            // Shared AAA bloom — identical to the POI medallion (alpha-shaped halo + pulse)
            ...getBloomStyle(slotState === 'valid' ? 'valid' : slotState === 'invalid' ? 'invalid' : 'idle', slotSize ?? 96),
            ...(isHighlighted && slotState !== 'valid' ? { filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' } : {}),
            ...(isSelected ? { outline: '2px solid var(--slot-rack-slot-ring-color, rgba(255, 255, 255, 0.4))', outlineOffset: '4px', borderRadius: '50%' } : {}),
            ...(isExtracting ? { filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))' } : {}),
          },
          'data-selected': isSelected ? 'true' : undefined,
          'data-highlighted': isHighlighted ? 'true' : undefined,
          'data-extracting': isExtracting ? 'true' : undefined,
        }}
      >
        {isAssigned && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative">
              {debugVisualization?.showLabels && (
                <span
                  className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    background: debugVisualization.colors.labelBackdrop,
                    color: debugVisualization.colors.labelText,
                  }}
                >
                  PG TOKEN
                </span>
              )}
              {shouldShowMedal ? (
                <div
                  data-testid={`slot-medal-${slot.id}`}
                  className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-560 ease-out ${isExtracting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} ${isShaking ? styles.animateSlotShake : ''}`}
                >
                  <WanderlustMedalOverlay
                    portraitUrl={assignedAvatarUrl}
                    isDragging={false}
                    sizePx={40}
                    className="h-10 w-10"
                  />
                </div>
              ) : (
                <span
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/70 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-50 ${isShaking ? styles.animateSlotShake : ''}`}
                style={pgTokenDebugStyle}
              >
                {assignedAvatarUrl ? (
                  <img src={assignedAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span style={initialsStyle}>{assignedInitials || assignedLabel.slice(0, 3)}</span>
                )}
              </span>
              )}
            </div>
          </div>
        )}
      </Slot>
      <p className="text-[9px] tracking-[0.2em]" style={labelStyle}>
        {slot.label}
      </p>
    </div>
  );
});

export const ResidentSlotRack: React.FC<ResidentSlotRackProps> = ({
  slots,
  layout = 'detail',
  overflowBehavior = 'wrap',
  getSlotProgress,
  getSlotActivityState,
  resolveDisplayInfo,
  onSlotDrop,
  onSlotClear,
  onSlotClick,
  onSlotInspect,
  selectedSlotId,
  highlightedSlotId,
  draggingResidentId,
  shakingSlotIds,
  className,
  slotDebugVisualization,
  slotSize,
  wanderlustShape = 'panel',
  wanderlustMaterial = 'bronze',
  wanderlustInteractive = false,
  wanderlustIsPaused = false,
  enableWanderlustSurface = false,
}) => {
  const overflowEnabled = overflowBehavior === 'scroll';
  const { containerRef, leftRef, rightRef, isOverflowing, showLeftFade, showRightFade } = useOverflowIndicators(
    overflowEnabled,
    slots.length,
  );

  const canScroll = overflowEnabled && isOverflowing;

  // Tooltip props for infinite-slot placeholders; must be created at the top level,
  // not inside the map below, to keep hook count stable across renders.
  const placeholderTooltipProps = useV9Tooltip('Slot aggiuntivo disponibile');

  const rackShellStyle: CSSProperties = {
    background: 'var(--slot-rack-bg, transparent)',
    backgroundBlendMode: 'var(--slot-rack-bg-blend, normal)',
    backgroundSize: 'var(--slot-rack-bg-size, auto)',
    backgroundRepeat: 'var(--slot-rack-bg-repeat, no-repeat)',
    backgroundPosition: 'var(--slot-rack-bg-position, center)',
    border: 'var(--slot-rack-border, none)',
    borderRadius: 'var(--slot-rack-border-radius, 0px)',
    padding: 'var(--slot-rack-padding, 0px)',
    boxShadow: 'var(--slot-rack-shadow, none)',
  };

  const rackClassName = ['relative group/rack', className].filter(Boolean).join(' ');

  const containerClasses = useMemo(() => {
    const base = 'flex gap-[var(--slot-rack-gap,12px)] transition-all duration-300';
    // Themed thin scrollbar (RackScroll.module.css) instead of the OS default
    const scroll = `overflow-x-auto pb-2 pr-1 [-webkit-overflow-scrolling:touch] ${rackScrollStyles.rackScroll}`;
    if (layout === 'board') {
      return overflowEnabled ? `${base} ${scroll}` : `${base} flex-wrap`;
    }
    return overflowEnabled ? `${base} ${scroll} text-center` : `${base} flex-wrap`;
  }, [layout, overflowEnabled]);

  const rackContent = (
    <div
      className={rackClassName}
      aria-live="polite"
      style={rackShellStyle}
      data-testid="resident-slot-rack-root"
    >
      {isOverflowing && showLeftFade && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8"
          style={{ backgroundImage: 'var(--slot-rack-scroll-fade-left, linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.25), transparent))' }}
        />
      )}
      {isOverflowing && showRightFade && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8"
          style={{ backgroundImage: 'var(--slot-rack-scroll-fade-right, linear-gradient(270deg, rgba(0,0,0,0.7), rgba(0,0,0,0.25), transparent))' }}
        />
      )}
      {canScroll && (
        <button
          type="button"
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-3 rounded-full border p-1.5 opacity-0 transition-opacity group-hover/rack:opacity-100 disabled:opacity-0"
          disabled={!showLeftFade}
          onClick={() => containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
          aria-label="Scroll slot rack left"
          style={{
            background: 'var(--slot-rack-nav-bg, rgba(0,0,0,0.8))',
            border: 'var(--slot-rack-nav-border, 1px solid rgba(255,255,255,0.1))',
            color: 'var(--slot-rack-nav-icon, #cbd5e1)',
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScroll && (
        <button
          type="button"
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-3 rounded-full border p-1.5 opacity-0 transition-opacity group-hover/rack:opacity-100 disabled:opacity-0"
          disabled={!showRightFade}
          onClick={() => containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
          aria-label="Scroll slot rack right"
          style={{
            background: 'var(--slot-rack-nav-bg, rgba(0,0,0,0.8))',
            border: 'var(--slot-rack-nav-border, 1px solid rgba(255,255,255,0.1))',
            color: 'var(--slot-rack-nav-icon, #cbd5e1)',
          }}
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
        data-testid="resident-slot-rack"
      >
        {overflowEnabled && <span ref={leftRef} className="shrink-0 w-px h-full opacity-0" aria-hidden />}
        {slots.map((slot) => {
          const dropState = slot.dropState ?? 'idle';
          const displayInfo = resolveDisplayInfo?.(slot) ?? { icon: DEFAULT_ICON, label: slot.label };
          const progress = getSlotProgress?.(slot.id) ?? null;
          const isSelected = slot.id === selectedSlotId;
          const isHighlighted = slot.id === highlightedSlotId;
          const isShaking = shakingSlotIds?.has(slot.id) ?? false;

          // Infinite-slot placeholder: render as a "+" add indicator
          if (slot.isPlaceholder && layout === 'detail') {
            const sz = slotSize ?? 96;
            return (
              <div key={slot.id} className="flex flex-col items-center gap-1 shrink-0" role="listitem" aria-label="Slot aggiuntivo">
                <div
                  className="flex items-center justify-center rounded-full border-2 border-dashed"
                  style={{
                    width: sz, height: sz,
                    borderColor: 'var(--slot-rack-slot-border-empty, rgba(148,163,184,0.3))',
                    color: 'var(--slot-rack-slot-label-color, rgba(148,163,184,0.45))',
                    fontSize: sz * 0.32,
                    lineHeight: 1,
                  }}
                  {...placeholderTooltipProps}
                >
                  +
                </div>
                <p className="text-[9px] tracking-[0.2em]" style={{ color: 'var(--slot-rack-slot-label-color, #94a3b8)' }}>
                  {slot.label}
                </p>
              </div>
            );
          }

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
                isShaking={isShaking}
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
              isShaking={isShaking}
              activityState={getSlotActivityState?.(slot.id)}
              slotDebugVisualization={slotDebugVisualization}
              slotSize={slotSize}
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

  if (enableWanderlustSurface) {
    return (
      <WanderlustSurface
        shape={wanderlustShape}
        material={wanderlustMaterial}
        interactive={wanderlustInteractive}
        isDragging={!!draggingResidentId}
        isPaused={wanderlustIsPaused}
        className={className}
      >
        {rackContent}
      </WanderlustSurface>
    );
  }

  return rackContent;
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
