import type { CSSProperties } from 'react';
import React, { memo, useRef, useEffect } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActivitySlotCard from '@/ui/idleVillage/components/ActivitySlot';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ResidentSlotViewModel, SlotProgressData } from '@/ui/idleVillage/slots/types';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useSlotSounds } from '@/ui/idleVillage/hooks/useSlotSounds';
import { useSlottedMedalBehavior, type MedalBehaviorControls } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import { FeatureFlags } from '@/shared/config/featureFlags';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_SLOTTED_MEDAL_CONFIG } from '@/balancing/config/idleVillage/slottedMedalConfig';
import { resolveSlotState } from '@/ui/idleVillage/utils/slotStateMapping';
import type { MedalStyleBridgeConfig } from '@/ui/idleVillage/skins/slotRackSkinConfig';
import type { SlotActivityState } from '@/ui/idleVillage/slots/types';
import { SlotV12Renderer } from '@/ui/idleVillage/components/SlotV12Renderer';
import styles from './SlotShake.module.css';
import pgCardStyles from './PgCard.module.css';
import type { SlotDebugVisualizationSettings } from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';

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
  selectedSlotId?: string | null;
  highlightedSlotId?: string | null;
  draggingResidentId?: string | null;
  shakingSlotIds?: Set<string>;
  className?: string;
  medalStyleConfig?: MedalStyleBridgeConfig;
  slotDebugVisualization?: SlotDebugVisualizationSettings;
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
}: DetailSlotProps) => {
  const { setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: 'slot', slotId: slot.id }
  });

  // Extraction mechanism state
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const extractionTimerRef = useRef<number | null>(null);
  const extractionStartTimeRef = useRef<number>(0);
  const extractionTimeoutsRef = useRef<number[]>([]);
  const EXTRACTION_DURATION = 560; // 560ms to match bezel transition time

  // Drop impact animation state
  const [dropImpactScale, setDropImpactScale] = useState(1);
  const [isDropAnimating, setIsDropAnimating] = useState(false);
  const [dropGlowIntensity, setDropGlowIntensity] = useState(0);

  // Extraction spring animation state for PG returning to roster
  const [isExtractionSpringAnimating, setIsExtractionSpringAnimating] = useState(false);

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

  // Extraction spring animation for PG returning to roster
  const triggerExtractionSpring = useCallback(() => {
    setIsExtractionSpringAnimating(true);
    
    // Use same duration as PgCard bounce-spring (0.6s)
    scheduleExtractionTimeout(() => {
      setIsExtractionSpringAnimating(false);
    }, 600);
  }, [scheduleExtractionTimeout]);

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

  // Press-and-hold extraction mechanism with spring physics
  const startExtraction = useCallback(() => {
    if (!isAssigned || !onSlotClear) return;
    setIsExtracting(true);
    setExtractionProgress(0);
    clearExtractionTimeouts();
    extractionStartTimeRef.current = Date.now();
    
    // Start progress animation with requestAnimationFrame for immediate response
    extractionTimerRef.current = requestAnimationFrame(function animate() {
      const elapsed = Date.now() - extractionStartTimeRef.current;
      const progress = Math.min(elapsed / EXTRACTION_DURATION, 1);
      
      // Use linear progress to match insertion animation exactly (no easing)
      setExtractionProgress(progress);
      
      if (progress >= 1) {
        // Extraction complete - trigger spring animation
        extractionTimerRef.current = null;
        
        // Track medal detach event if SlottedMedal is present
        if (shouldShowMedal) {
          trackTelemetryEvent(SLOTTED_MEDAL_TELEMETRY.detachEvent, {
            slotId: slot.id,
            residentId: slot.assignedResidentId,
            medalType: 'bronze',
            timestamp: Date.now(),
          });
          slotSounds.detach();
        }
        
        // Wait for bezel animation to complete (560ms) before starting spring animation
        scheduleExtractionTimeout(() => {
          // Spring animation effect - briefly overshoot then settle
          setExtractionProgress(1.2); // Overshoot to mirror bezel flare
          
          scheduleExtractionTimeout(() => {
            triggerExtractionSpring();

            scheduleExtractionTimeout(() => {
              setExtractionProgress(1.0);

              // Wait for bounce-spring animation to complete before removing PG
              scheduleExtractionTimeout(() => {
                onSlotClear(slot.id);

                scheduleExtractionTimeout(() => {
                  setIsExtracting(false);
                  setExtractionProgress(0);
                }, EXTRACTION_TIMING.cleanupDelay);
              }, EXTRACTION_TIMING.springDuration);
            }, EXTRACTION_TIMING.postOpenHold);
          }, EXTRACTION_TIMING.postOpenHold);
        }, 560); // Wait for bezel animation (560ms)
      } else {
        // Continue animation
        extractionTimerRef.current = requestAnimationFrame(animate);
      }
    });
  }, [clearExtractionTimeouts, isAssigned, onSlotClear, scheduleExtractionTimeout, shouldShowMedal, slot.assignedResidentId, slot.id, triggerExtractionSpring]);

  const cancelExtraction = useCallback(() => {
    if (extractionTimerRef.current) {
      cancelAnimationFrame(extractionTimerRef.current);
      extractionTimerRef.current = null;
    }
    clearExtractionTimeouts();
    
    // Animate back to closed position from current progress
    const currentProgress = extractionProgress;
    const startTime = Date.now();
    const duration = 300; // Quick close animation
    
    const closeTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth closing
      const easeInCubic = (t: number) => t * t * t;
      const closeProgress = currentProgress * (1 - easeInCubic(progress));
      
      setExtractionProgress(closeProgress);
      
      if (progress >= 1) {
        clearInterval(closeTimer);
        setIsExtracting(false);
        setExtractionProgress(0);
      }
    }, 16);
  }, [clearExtractionTimeouts, extractionProgress]);

  useEffect(() => {
    return () => {
      if (extractionTimerRef.current) {
        cancelAnimationFrame(extractionTimerRef.current);
      }
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
          ? 'var(--slot-rack-slot-shadow-valid, 0 0 24px rgba(58, 215, 128, 0.45))'
          : isHighlighted
            ? 'var(--slot-rack-slot-shadow-highlighted, 0 0 24px rgba(251, 191, 36, 0.45))'
            : 'var(--slot-rack-slot-shadow, none)',
    transition: 'box-shadow 200ms ease, border 200ms ease, background 200ms ease, color 200ms ease, transform 80ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: `scale(${isExtractionSpringAnimating ? 1 : dropImpactScale})`,
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
      <div
        ref={setNodeRef}
        role="button"
        tabIndex={0}
        data-testid={`slot-button-${slot.id}`}
        onClick={handleClick}
        onMouseDown={isAssigned ? startExtraction : undefined}
        onMouseUp={isAssigned ? cancelExtraction : undefined}
        onMouseLeave={isAssigned ? cancelExtraction : undefined}
        onTouchStart={isAssigned ? startExtraction : undefined}
        onTouchEnd={isAssigned ? cancelExtraction : undefined}
        className={[
          'relative',
          dropState === 'invalid' ? 'cursor-not-allowed opacity-35' : '',
          isDropTarget ? 'animate-pulse' : '',
          isExtracting ? 'cursor-grabbing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          transition: 'filter 200ms ease',
          ...(slotState === 'valid' ? { filter: 'drop-shadow(0 0 12px rgba(58, 215, 128, 0.6))' } : {}),
          ...(isHighlighted ? { filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' } : {}),
          ...(isSelected ? { outline: '2px solid var(--slot-rack-slot-ring-color, rgba(255, 255, 255, 0.4))', outlineOffset: '4px', borderRadius: '50%' } : {}),
          ...(isExtracting ? { filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))' } : {}),
        }}
        title={slot.statHint ?? slot.requirement?.label ?? 'Any stat'}
        data-selected={isSelected ? 'true' : undefined}
        data-highlighted={isHighlighted ? 'true' : undefined}
        data-extracting={isExtracting ? 'true' : undefined}
      >
        <SlotV12Renderer
          letter={displayInfo.icon ?? 'Q'}
          state={v12State}
          extractionProgress={extractionProgress}
          debugVisualization={debugVisualization ?? undefined}
        />
        {isAssigned && !isExtractionSpringAnimating && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${isExtractionSpringAnimating ? pgCardStyles['animate-bounce-spring'] : ''}`}>
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
              {shouldShowMedal && (
                <div className={`absolute -top-2 -right-2 z-10 transition-all duration-560 ease-out ${isExtracting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                  <WanderlustMedalOverlay
                    portraitUrl={assignedAvatarUrl}
                    isDragging={false}
                    sizePx={24}
                    className="h-6 w-6"
                    data-testid={`slot-medal-${slot.id}`}
                  />
                </div>
              )}
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
            </div>
          </div>
        )}
        {isAssigned && onSlotClear && (
          <span className="absolute -top-1 -right-1 rounded-full px-1 text-[8px]" style={badgeStyle}>
            ×
          </span>
        )}
      </div>
      <p className="text-[9px] tracking-[0.2em]" style={labelStyle}>
        {slot.label}
      </p>
      {slot.assignedResidentId && onSlotClear && (
        <button
          type="button"
          className="text-[8px] uppercase tracking-[0.25em]"
          style={clearButtonStyle}
          onClick={() => onSlotClear(slot.id)}
        >
          Clear
        </button>
      )}
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
}) => {
  const overflowEnabled = overflowBehavior === 'scroll';
  const { containerRef, leftRef, rightRef, isOverflowing, showLeftFade, showRightFade } = useOverflowIndicators(
    overflowEnabled,
    slots.length,
  );

  const canScroll = overflowEnabled && isOverflowing;

  const rackShellStyle: CSSProperties = {
    background: 'var(--slot-rack-bg, transparent)',
    border: 'var(--slot-rack-border, none)',
    borderRadius: 'var(--slot-rack-border-radius, 0px)',
    padding: 'var(--slot-rack-padding, 0px)',
    boxShadow: 'var(--slot-rack-shadow, none)',
  };

  const rackClassName = ['relative group/rack', className].filter(Boolean).join(' ');

  const containerClasses = useMemo(() => {
    const base = 'flex gap-3 transition-all duration-300';
    if (layout === 'board') {
      return overflowEnabled ? `${base} overflow-x-auto pb-2 pr-1 [-webkit-overflow-scrolling:touch]` : `${base} flex-wrap`;
    }
    return overflowEnabled ? `${base} overflow-x-auto pb-2 pr-1 text-center [-webkit-overflow-scrolling:touch]` : `${base} flex-wrap`;
  }, [layout, overflowEnabled]);

  return (
    <div className={rackClassName} aria-live="polite" style={rackShellStyle}>
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
