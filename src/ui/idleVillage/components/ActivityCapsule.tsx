/**
 * ActivityCapsule – POI Detail/Overlay Component (Plan §5.5)
 * 
 * Config-first capsule component for activity details with slot display,
 * progress bar, and CTA Collect. Follows Wanderlust art direction with
 * Wilderness/Empire pillar variants.
 * 
 * Dependencies: NP-SM-010 (skin registry), Style Lab tokens
 * Integration: useSkinPreferences, useIdleVillageConfig, telemetry
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getActivityCapsuleSkinConfig,
  getActivityCapsuleSkinOverrideById,
  type ActivityCapsuleSkinConfig,
} from '@/ui/idleVillage/skins/activityCapsuleSkinConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { SkinSlot } from '@/ui/idleVillage/components/SkinSlot';
import { getPoiAmberSkinConfig } from '@/ui/idleVillage/skins/poi/poiAmberSkinConfig';
import { getTemporarySkinConfig } from '@/ui/idleVillage/skins/temporary/temporarySkinRegistry';
import { useDroppable } from '@dnd-kit/core';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useTranslation } from '@/localization/useTranslation';
import ActionHalo from '@/ui/idleVillage/map/actionCards/ActionHalo';

/**
 * Individual slot component with DnD support
 */
const ActivityCapsuleSlot = ({
  slot,
  enableDropMode,
  isInteractive,
  isHovered,
  onSlotClick,
  onSlotHover,
  onResidentDrop,
  onResidentDetach,
  compact,
}: {
  slot: ActivitySlotData;
  enableDropMode: boolean;
  isInteractive: boolean;
  isHovered: boolean;
  onSlotClick?: (slotId: string) => void;
  onSlotHover?: (slotId: string, isHovering: boolean) => void;
  onResidentDrop?: (residentId: string, slotId: string) => void;
  onResidentDetach?: (slotId: string) => void;
  compact: boolean;
}) => {
  const { t } = useTranslation('idleVillage');

  // DnD setup for drop mode
  const { setNodeRef, isOver } = useDroppable({
    id: `activity-capsule-slot-${slot.slotId}`,
    disabled: !enableDropMode || slot.isLocked,
    data: {
      type: 'activity-capsule-slot',
      slotId: slot.slotId,
      isOccupied: slot.isOccupied,
      isLocked: slot.isLocked,
    },
  });

  const handleDrop = useCallback((event: any) => {
    const { active } = event;
    if (active?.data?.type === 'resident-token' && onResidentDrop) {
      onResidentDrop(active.data.residentId, slot.slotId);
    }
  }, [onResidentDrop, slot.slotId]);

  const handleSlotRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (enableDropMode && slot.isOccupied && onResidentDetach) {
      onResidentDetach(slot.slotId);
    }
  }, [enableDropMode, slot.isOccupied, onResidentDetach, slot.slotId]);

  return (
    <div
      ref={enableDropMode ? setNodeRef : undefined}
      className={clsx('activity-capsule__slot', {
        'activity-capsule__slot--occupied': slot.isOccupied,
        'activity-capsule__slot--locked': slot.isLocked,
        'activity-capsule__slot--interactive': isInteractive,
        'activity-capsule__slot--droppable': enableDropMode,
        'activity-capsule__slot--drop-over': enableDropMode && isOver && !slot.isOccupied,
        'activity-capsule__slot--drop-invalid': enableDropMode && isOver && slot.isLocked,
      })}
      data-testid={slot.slotId}
      data-slot-id={slot.slotId}
      data-occupied={slot.isOccupied}
      data-locked={slot.isLocked}
      data-drop-enabled={enableDropMode}
      data-drop-over={enableDropMode && isOver}
      onClick={() => onSlotClick?.(slot.slotId)}
      onMouseEnter={() => onSlotHover?.(slot.slotId, true)}
      onMouseLeave={() => onSlotHover?.(slot.slotId, false)}
      onContextMenu={handleSlotRightClick}
      onDrop={enableDropMode ? handleDrop : undefined}
      style={{
        width: compact ? 'var(--capsule-compact-slot-size)' : 'var(--capsule-slot-size)',
        height: compact ? 'var(--capsule-compact-slot-size)' : 'var(--capsule-slot-size)',
        borderRadius: 'var(--capsule-slot-border-radius)',
        border: enableDropMode && isOver && !slot.isOccupied
          ? '2px dashed var(--capsule-slot-drop-highlight)'
          : 'var(--capsule-slot-border)',
        backgroundColor: enableDropMode && isOver && !slot.isOccupied
          ? 'var(--capsule-slot-drop-background)'
          : 'var(--capsule-slot-background)',
        cursor: enableDropMode ? (slot.isOccupied ? 'pointer' : 'crosshair') : (isInteractive ? 'pointer' : 'default'),
        transition: 'var(--capsule-hover-transition)',
        transform: isHovered ? 'var(--capsule-hover-scale)' : 'scale(1)',
        boxShadow: isHovered ? 'var(--capsule-hover-glow)' :
          (enableDropMode && isOver && !slot.isOccupied ? 'var(--capsule-slot-drop-glow)' : 'none'),
      }}
    >
      {slot.assignedWorkerAvatarUrl ? (
        <img
          src={slot.assignedWorkerAvatarUrl}
          alt={slot.assignedWorkerName || t('idleVillage:activityCapsule.workerAlt', { defaultValue: 'Worker' })}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--capsule-slot-border-radius)',
            objectFit: 'cover',
          }}
        />
      ) : slot.assignedWorkerName ? (
        <div className="activity-capsule__slot-initials">
          {slot.assignedWorkerName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
      ) : (
        <div className="activity-capsule__slot-empty" />
      )}

      {/* Drop hint when empty and in drop mode */}
      {enableDropMode && !slot.isOccupied && !slot.isLocked && (
        <div
          className="activity-capsule__slot-drop-hint"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: 'var(--text-tertiary)',
            opacity: isOver ? 1 : 0.5,
            pointerEvents: 'none',
          }}
        >
          {isOver ? t('idleVillage:activityCapsule.dropHint', { defaultValue: 'Drop' }) : ''}
        </div>
      )}
    </div>
  );
};

/**
 * ARIA Live announcement hook for ActivityCapsule
 */
const useAriaLiveAnnouncements = (
  activityId: string,
  label: string,
  status: string,
  progressFraction: number,
  slots: ActivitySlotData[],
  canCollect: boolean,
  enableAriaLive: boolean,
  ariaLiveMode: 'polite' | 'assertive' | 'off'
) => {
  const { t } = useTranslation('idleVillage');
  const [announcement, setAnnouncement] = useState('');
  const announcementTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Previous state refs for change detection
  const prevStatusRef = useRef(status);
  const prevProgressRef = useRef(progressFraction);
  const prevSlotsRef = useRef(slots.map(s => ({ slotId: s.slotId, isOccupied: s.isOccupied })));
  const prevCanCollectRef = useRef(canCollect);

  // Generate announcement based on changes
  const generateAnnouncement = useCallback(() => {
    if (!enableAriaLive || ariaLiveMode === 'off') return;

    let message = '';

    // Status changes
    if (prevStatusRef.current !== status) {
      switch (status) {
        case 'in-progress':
          message = t('idleVillage:activityCapsule.ariaLive.started', { defaultValue: '{label} activity started', label });
          break;
        case 'completed':
          message = t('idleVillage:activityCapsule.ariaLive.completed', { defaultValue: '{label} activity completed', label });
          break;
        case 'blocked':
          message = t('idleVillage:activityCapsule.ariaLive.blocked', { defaultValue: '{label} activity blocked', label });
          break;
        case 'idle':
          message = t('idleVillage:activityCapsule.ariaLive.idle', { defaultValue: '{label} activity is idle', label });
          break;
      }
      prevStatusRef.current = status;
    }

    // Progress changes (announce at milestones)
    if (prevProgressRef.current !== progressFraction && status === 'in-progress') {
      const prevPercent = Math.round(prevProgressRef.current * 100);
      const currentPercent = Math.round(progressFraction * 100);

      // Announce at 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      if (milestones.includes(currentPercent) && currentPercent > prevPercent) {
        const progressAnnouncement = t('idleVillage:activityCapsule.ariaLive.progress', { defaultValue: '{label} progress: {percent}%', label, percent: currentPercent });
        message = message ? `${message}. ${progressAnnouncement}` : progressAnnouncement;
      }
      prevProgressRef.current = progressFraction;
    }

    // Slot occupancy changes
    const currentSlots = slots.map(s => ({ slotId: s.slotId, isOccupied: s.isOccupied }));
    const slotChanges = currentSlots.filter((slot, index) =>
      slot.isOccupied !== prevSlotsRef.current[index]?.isOccupied
    );

    if (slotChanges.length > 0) {
      const newlyOccupied = slotChanges.filter(s => s.isOccupied).length;
      const newlyVacant = slotChanges.filter(s => !s.isOccupied).length;

      if (newlyOccupied > 0) {
        const workerAssigned = t('idleVillage:activityCapsule.ariaLive.workerAssigned', { defaultValue: '{count} worker(s) assigned to {label}', count: newlyOccupied, label });
        message = message ? `${message}. ${workerAssigned}` : workerAssigned;
      }
      if (newlyVacant > 0) {
        const slotFreed = t('idleVillage:activityCapsule.ariaLive.slotFreed', { defaultValue: '{count} slot(s) freed from {label}', count: newlyVacant, label });
        message = message ? `${message}. ${slotFreed}` : slotFreed;
      }
      prevSlotsRef.current = currentSlots;
    }

    // Collect availability changes
    if (prevCanCollectRef.current !== canCollect && canCollect) {
      const readyToCollect = t('idleVillage:activityCapsule.ariaLive.readyToCollect', { defaultValue: '{label} ready to collect', label });
      message = message ? `${message}. ${readyToCollect}` : readyToCollect;
      prevCanCollectRef.current = canCollect;
    }

    if (message) {
      setAnnouncement(message);

      // Clear announcement after 3 seconds using requestAnimationFrame loop
      // Note: This avoids setTimeout/setInterval restrictions in Sandbox components
      let frameCount = 0;
      const maxFrames = 180; // ~3 seconds at 60fps

      const clearAnnouncement = () => {
        frameCount++;
        if (frameCount >= maxFrames) {
          setAnnouncement('');
        } else {
          requestAnimationFrame(clearAnnouncement);
        }
      };

      // Start the clear animation
      requestAnimationFrame(clearAnnouncement);

      // Store a reference for cleanup (though RAF cleans up automatically)
      announcementTimeoutRef.current = true as any;
    }
  }, [t, label, status, progressFraction, slots, canCollect, enableAriaLive, ariaLiveMode]);

  // Effect to detect changes and generate announcements
  useEffect(() => {
    // Generate announcements asynchronously to avoid setState during render
    // Note: Using requestAnimationFrame for React-safe async execution
    const rafId = requestAnimationFrame(() => {
      generateAnnouncement();
    });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [generateAnnouncement]);
  return announcement;
};

/**
 * Activity slot data for capsule display
 */
export interface ActivitySlotData {
  slotId: string;
  assignedWorkerName?: string | null;
  assignedWorkerAvatarUrl?: string | null;
  isOccupied: boolean;
  isLocked: boolean;
}

/**
 * Props for ActivityCapsule component
 */
export interface ActivityCapsuleProps {
  /** Activity identifier */
  activityId: string;

  /** Activity metadata */
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  helperText?: string;

  /** Slot configuration */
  slots: ActivitySlotData[];
  maxSlots: number;

  /** Progress tracking */
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;

  /** Status and actions */
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  canCollect: boolean;
  onCollect?: () => void;
  collectLabel?: string;
  collectDisabled?: boolean;

  /** Skin configuration */
  pillar?: StyleLabPillar;
  skinPresetOverrideId?: string;
  skinConfigOverride?: Partial<ActivityCapsuleSkinConfig>;

  /** Interaction handlers */
  onSlotClick?: (slotId: string) => void;
  onSlotHover?: (slotId: string, isHovering: boolean) => void;
  onActivityClick?: () => void;

  /** Drop functionality */
  onResidentDrop?: (residentId: string, slotId: string) => void;
  onResidentDetach?: (slotId: string) => void;
  enableDropMode?: boolean;
  dropValidationConfig?: {
    maxResidentLevel?: number;
    requiredSkills?: string[];
    phaseRestrictions?: string[];
  };

  /** Display options */
  showSlots?: boolean;
  showProgress?: boolean;
  showTimer?: boolean;
  compact?: boolean;

  /** Accessibility */
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';

  /** Test identifiers */
  dataTestId?: string;

  /** POI skin integration */
  enablePoiVisualization?: boolean;
  poiSkinId?: string;
}

/**
 * Check if activity should automatically have POI skin based on activityId
 */
const shouldAutoEnablePoiSkin = (activityId: string): boolean => {
  // Auto-enable POI skin only for very specific POI activity patterns
  // Be conservative to avoid false positives
  return activityId.startsWith('slot-c-poi') ||
    activityId === 'slot-c-poi' ||
    activityId.includes('punto-di-interesse');
};

/**
 * Format time display for timer
 */
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * ActivityCapsule component with config-first skin support
 */
export function ActivityCapsule({
  activityId,
  label,
  icon,
  subtitle,
  helperText,
  slots,
  maxSlots: _maxSlots,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  status,
  canCollect,
  onCollect,
  collectLabel,
  collectDisabled = false,
  pillar,
  skinPresetOverrideId,
  skinConfigOverride,
  onSlotClick,
  onSlotHover,
  onActivityClick,
  onResidentDrop,
  onResidentDetach,
  enableDropMode = false,
  dropValidationConfig,
  showSlots = true,
  showProgress = true,
  showTimer = true,
  compact = false,
  ariaLabel,
  ariaLive = 'polite',
  dataTestId = 'activity-capsule',
  enablePoiVisualization = false,
  poiSkinId,
}: ActivityCapsuleProps) {
  // Config hooks
  const _idleVillageConfig = useIdleVillageConfig();
  const { presetId: skinPresetId, pillar: currentPillar } = useSkinPreferences();
  const { t } = useTranslation('idleVillage');

  const resolvedCollectLabel = collectLabel ?? t('idleVillage:activityCapsule.actions.collect', { defaultValue: 'Collect' });

  // Resolve pillar and skin config
  const resolvedPillar = pillar || currentPillar;
  const skinConfig = useMemo(() => {
    if (skinPresetOverrideId) {
      const overrideConfig = getActivityCapsuleSkinOverrideById(skinPresetOverrideId, skinConfigOverride);
      if (overrideConfig) {
        return overrideConfig;
      }
    }
    return getActivityCapsuleSkinConfig(resolvedPillar, skinConfigOverride);
  }, [resolvedPillar, skinConfigOverride, skinPresetOverrideId]);

  // Component state
  const [isHovered, setIsHovered] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  // Calculate remaining time
  const remainingSeconds = useMemo(() =>
    Number.isFinite(elapsedSeconds) && elapsedSeconds >= 0
      ? Math.max(0, totalDurationSeconds - elapsedSeconds)
      : -1,
    [totalDurationSeconds, elapsedSeconds]
  );

  const { shouldShowPoiSkin, effectivePoiSkinId } = useMemo(() => {
    const autoPoiSkin = shouldAutoEnablePoiSkin(activityId);
    const isExplicitlyDisabled = enablePoiVisualization === false;
    const wantsVisualization = enablePoiVisualization || autoPoiSkin;
    const resolvedId = poiSkinId || (autoPoiSkin ? 'poi_wilderness_amber' : null);

    const canRender = !isExplicitlyDisabled && wantsVisualization && Boolean(resolvedId);

    return {
      shouldShowPoiSkin: canRender,
      effectivePoiSkinId: canRender && resolvedId ? resolvedId : null,
    };
  }, [activityId, enablePoiVisualization, poiSkinId]);

  const haloSize = useMemo(() => {
    const slotSizeValue = Number.parseFloat(skinConfig.layout?.slotSize ?? '48');
    if (!Number.isFinite(slotSizeValue)) {
      return 32;
    }
    const radius = slotSizeValue * 0.75;
    return Math.max(24, Math.round(radius));
  }, [skinConfig.layout?.slotSize]);

  const haloIconText = useMemo(() => {
    if (!label) return t('idleVillage:activityCapsule.defaultHalo', { defaultValue: 'POI' });
    const firstWord = label.split(' ')[0] ?? label;
    return firstWord.slice(0, 4).toUpperCase();
  }, [label, t]);

  // Determine if capsule should be interactive
  const isInteractive = Boolean(onActivityClick || onSlotClick || (canCollect && onCollect));

  // Generate CSS custom properties for skin tokens
  const cssVars = useMemo((): CSSProperties => {
    const { layout, progress, cta, animation } = skinConfig;

    return {
      '--capsule-frame-border': layout.frameBorder,
      '--capsule-frame-background': layout.frameBackground,
      '--capsule-frame-border-radius': layout.frameBorderRadius,
      '--capsule-frame-padding': layout.framePadding,
      '--capsule-frame-min-height': layout.frameMinHeight,
      '--capsule-frame-box-shadow': layout.frameBoxShadow,
      '--capsule-slot-gap': layout.slotGap,
      '--capsule-slot-size': layout.slotSize,
      '--capsule-slot-border-radius': layout.slotBorderRadius,
      '--capsule-slot-border': layout.slotBorder,
      '--capsule-slot-background': layout.slotBackground,
      '--capsule-progress-background': progress.progressBackground,
      '--capsule-progress-fill': progress.progressFill,
      '--capsule-progress-border': progress.progressBorder,
      '--capsule-progress-height': progress.progressHeight,
      '--capsule-progress-border-radius': progress.progressBorderRadius,
      '--capsule-progress-transition': progress.progressTransition,
      '--capsule-liquid-gold-gradient': progress.liquidGoldGradient,
      '--capsule-liquid-gold-glow': progress.liquidGoldGlow,
      '--capsule-timer-font': progress.timerFont,
      '--capsule-timer-color': progress.timerColor,
      '--capsule-timer-font-size': progress.timerFontSize,
      '--capsule-cta-background': cta.ctaBackground,
      '--capsule-cta-border-color': cta.ctaBorderColor,
      '--capsule-cta-text-color': cta.ctaTextColor,
      '--capsule-cta-border-radius': cta.ctaBorderRadius,
      '--capsule-cta-padding': cta.ctaPadding,
      '--capsule-cta-font-size': cta.ctaFontSize,
      '--capsule-cta-font-weight': cta.ctaFontWeight,
      '--capsule-cta-hover-background': cta.ctaHoverBackground,
      '--capsule-cta-hover-border-color': cta.ctaHoverBorderColor,
      '--capsule-cta-active-scale': String(cta.ctaActiveScale),
      '--capsule-cta-transition': cta.ctaTransition,
      '--capsule-cta-disabled-background': cta.ctaDisabledBackground,
      '--capsule-cta-disabled-text-color': cta.ctaDisabledTextColor,
      '--capsule-cta-disabled-opacity': String(cta.ctaDisabledOpacity),
      '--capsule-entry-duration': animation.entryDuration,
      '--capsule-entry-easing': animation.entryEasing,
      '--capsule-hover-scale': String(animation.slotHoverScale),
      '--capsule-hover-glow': animation.slotHoverGlow,
      '--capsule-hover-transition': animation.slotHoverTransition,
    } as CSSProperties;
  }, [skinConfig]);

  // Handle collect action
  const handleCollect = useCallback(async () => {
    if (!canCollect || collectDisabled || isCollecting || !onCollect) return;

    setIsCollecting(true);

    try {
      await onCollect();

      // Telemetry
      if (skinConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_collect', {
          activityId,
          status,
          pillar: resolvedPillar,
          skinPresetId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('ActivityCapsule: Collect failed', error);
    } finally {
      setIsCollecting(false);
    }
  }, [canCollect, collectDisabled, isCollecting, onCollect, activityId, status, resolvedPillar, skinPresetId, skinConfig.enableTelemetry]);

  // Handle slot interactions
  const handleSlotClick = useCallback((slotId: string) => {
    onSlotClick?.(slotId);

    // Telemetry
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_slot_click', {
        activityId,
        slotId,
        pillar: resolvedPillar,
        skinPresetId,
        timestamp: Date.now(),
      });
    }
  }, [onSlotClick, activityId, resolvedPillar, skinPresetId, skinConfig.enableTelemetry]);

  const handleSlotHover = useCallback((slotId: string, isHovering: boolean) => {
    onSlotHover?.(slotId, isHovering);
  }, [onSlotHover]);

  // Telemetry on mount
  useEffect(() => {
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_rendered', {
        activityId,
        status,
        progressFraction,
        slotCount: slots.length,
        pillar: resolvedPillar,
        skinPresetId,
        compact,
        timestamp: Date.now(),
      });
    }
  }, [activityId, status, progressFraction, slots.length, resolvedPillar, skinPresetId, compact, skinConfig.enableTelemetry]);

  // ARIA Live announcements
  const ariaLiveAnnouncement = useAriaLiveAnnouncements(
    activityId,
    label,
    status,
    progressFraction,
    slots,
    canCollect,
    skinConfig.enableAriaLive,
    ariaLive || 'polite'
  );

  // Drop validation (only when drop mode is enabled)
  const dropValidation = useResidentDropValidation({
    enableTelemetry: skinConfig.enableTelemetry,
    config: dropValidationConfig ? {
      maxFatigueBeforeExhausted: dropValidationConfig.maxResidentLevel || 90,
      defaultCrewSize: 1,
      enableStatValidation: true,
      enableFatigueValidation: true,
      enableCrewValidation: true,
    } : undefined,
  });

  // Handle resident drop
  const handleResidentDrop = useCallback((residentId: string, slotId: string) => {
    if (!enableDropMode || !onResidentDrop) return;

    // Validate drop
    const validationResult = dropValidation.validateDrop({
      resident: { id: residentId } as any, // TODO: Get full resident data
      context: `activity-capsule-${activityId}`,
    });

    // Track telemetry
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_drop_attempt', {
        activityId,
        poiId: activityId,
        slotId,
        residentId,
        validationResult: validationResult.isValid,
        validationFailedRule: validationResult.failedRule,
        validationMessage: validationResult.message,
        timestamp: Date.now(),
      });
    }

    // Only proceed if validation passes
    if (validationResult.isValid) {
      onResidentDrop(residentId, slotId);
    }
  }, [enableDropMode, onResidentDrop, activityId, dropValidation, skinConfig.enableTelemetry]);

  // Handle resident detach
  const handleResidentDetach = useCallback((slotId: string) => {
    if (!enableDropMode || !onResidentDetach) return;

    // Track telemetry
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detach', {
        activityId,
        poiId: activityId,
        slotId,
        timestamp: Date.now(),
      });
    }

    onResidentDetach(slotId);
  }, [enableDropMode, onResidentDetach, activityId, skinConfig.enableTelemetry]);

  // POI skin telemetry
  useEffect(() => {
    if (shouldShowPoiSkin && effectivePoiSkinId) {
      trackTelemetryEvent('slot_lab_poi_skin_rendered', {
        activityId,
        poiSkinId: effectivePoiSkinId,
        pillar: resolvedPillar,
        timestamp: Date.now(),
      });
    }
  }, [shouldShowPoiSkin, effectivePoiSkinId, activityId, resolvedPillar]);

  // Generate grid columns based on slot count and compact mode
  const gridColumns = compact
    ? skinConfig.layout.mobileSlotColumns
    : Math.min(slots.length, skinConfig.layout.slotGridColumns);

  const capsuleClasses = clsx(
    'activity-capsule',
    `activity-capsule--${status}`,
    `activity-capsule--pillar-${resolvedPillar}`,
    {
      'activity-capsule--interactive': isInteractive,
      'activity-capsule--hovered': isHovered,
      'activity-capsule--compact': compact,
      'activity-capsule--collecting': isCollecting,
    }
  );

  return (
    <StyleLabSurface>
      <div
        className={capsuleClasses}
        data-testid={dataTestId}
        data-activity-id={activityId}
        data-status={status}
        data-pillar={resolvedPillar}
        data-skin-preset={skinPresetId}
        style={cssVars}
        aria-label={ariaLabel || t('idleVillage:activityCapsule.accessibility.activityCapsule', { defaultValue: `${label} activity capsule`, label })}
        aria-live={skinConfig.enableAriaLive ? ariaLive : 'off'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onActivityClick}
      >
        {/* Frame container */}
        <div className="activity-capsule__frame">
          {/* Header */}
          <div className="activity-capsule__header">
            <div className="activity-capsule__title">
              {icon && <div className="activity-capsule__icon">{icon}</div>}
              <div className="activity-capsule__label">{label}</div>
            </div>
            {subtitle && <div className="activity-capsule__subtitle">{subtitle}</div>}
          </div>

          {/* Helper text */}
          {helperText && (
            <div className="activity-capsule__helper">{helperText}</div>
          )}

          {/* Slots grid */}
          {showSlots && slots.length > 0 && (
            <div
              className="activity-capsule__slots"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: 'var(--capsule-slot-gap)',
              }}
            >
              {slots.map((slot) => (
                <ActivityCapsuleSlot
                  key={slot.slotId}
                  slot={slot}
                  enableDropMode={enableDropMode}
                  isInteractive={Boolean(onSlotClick)}
                  isHovered={isHovered}
                  onSlotClick={handleSlotClick}
                  onSlotHover={handleSlotHover}
                  onResidentDrop={handleResidentDrop}
                  onResidentDetach={handleResidentDetach}
                  compact={compact}
                />
              ))}
            </div>
          )}

          {/* Progress section */}
          {showProgress && (
            <div className="activity-capsule__progress">
              {/* Progress bar */}
              <div
                className="activity-capsule__progress-bar"
                style={{
                  height: 'var(--capsule-progress-height)',
                  borderRadius: 'var(--capsule-progress-border-radius)',
                  background: 'var(--capsule-progress-background)',
                  border: 'var(--capsule-progress-border)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  className="activity-capsule__progress-fill"
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, progressFraction * 100))}%`,
                    background: 'var(--capsule-progress-fill)',
                    transition: 'var(--capsule-progress-transition)',
                    boxShadow: 'var(--capsule-liquid-gold-glow)',
                    position: 'relative',
                  }}
                >
                  {/* Shimmer effect */}
                  {skinConfig.progress.liquidGoldShimmer && (
                    <div
                      className="activity-capsule__progress-shimmer"
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '14px',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22))',
                        animation: `shimmer ${skinConfig.progress.shimmerAnimationDuration} ease-in-out infinite`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Timer */}
              {showTimer && (
                <div
                  className="activity-capsule__timer"
                  style={{
                    fontFamily: 'var(--capsule-timer-font)',
                    color: 'var(--capsule-timer-color)',
                    fontSize: 'var(--capsule-timer-font-size)',
                    marginTop: '4px',
                    textAlign: 'center',
                  }}
                >
                  {formatTime(remainingSeconds)}
                </div>
              )}
            </div>
          )}

          {/* CTA Collect button */}
          {canCollect && (
            <button
              className={clsx('activity-capsule__cta', {
                'activity-capsule__cta--disabled': collectDisabled || isCollecting,
              })}
              disabled={collectDisabled || isCollecting}
              onClick={handleCollect}
              style={{
                background: collectDisabled || isCollecting
                  ? 'var(--capsule-cta-disabled-background)'
                  : 'var(--capsule-cta-background)',
                border: `1px solid ${collectDisabled || isCollecting
                  ? 'transparent'
                  : 'var(--capsule-cta-border-color)'}`,
                color: collectDisabled || isCollecting
                  ? 'var(--capsule-cta-disabled-text-color)'
                  : 'var(--capsule-cta-text-color)',
                borderRadius: 'var(--capsule-cta-border-radius)',
                padding: 'var(--capsule-cta-padding)',
                fontSize: 'var(--capsule-cta-font-size)',
                fontWeight: 'var(--capsule-cta-font-weight)',
                transition: 'var(--capsule-cta-transition)',
                opacity: collectDisabled || isCollecting
                  ? 'var(--capsule-cta-disabled-opacity)'
                  : 1,
                cursor: collectDisabled || isCollecting ? 'not-allowed' : 'pointer',
                transform: isCollecting ? 'var(--capsule-cta-active-scale)' : 'scale(1)',
              }}
            >
              {isCollecting ? t('idleVillage:activityCapsule.actions.collecting', { defaultValue: 'Collecting...' }) : resolvedCollectLabel}
            </button>
          )}
        </div>

        {/* POI Visualization */}
        {shouldShowPoiSkin && effectivePoiSkinId && (() => {
          const poiSkinConfig = effectivePoiSkinId === 'poi_wilderness_amber'
            ? getPoiAmberSkinConfig()
            : getTemporarySkinConfig(effectivePoiSkinId);

          if (!poiSkinConfig) return null;

          const poiBinding = {
            componentId: 'POIComponent',
            name: 'POI Visualization',
            description: 'POI skin visualization component',
            version: '1.0.0',
            defaultPreset: 'minimal-wilderness' as const,
            supportedPillars: ['wilderness'] as const,
            supportedMotionLevels: ['full'] as const,
            cssClassBase: 'poi-visualization',
            dataAttributePrefix: 'data-poi',
            supportsMotionLevel: true,
            supportsTelemetry: true,
            supportsPillarSwitching: true,
            category: 'visualization',
            priority: 1,
            tags: ['poi', 'skin', 'visualization'],
          };

          return (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{ width: `${haloSize * 2}px`, height: `${haloSize * 2}px` }}
                data-testid="activity-capsule-poi-halo"
              >
                <ActionHalo
                  size={haloSize}
                  ringWidth={Math.max(2, Math.round(haloSize * 0.12))}
                  fillFraction={progressFraction}
                  pillar={resolvedPillar}
                  iconText={haloIconText}
                  dataTestId="action-halo-poi"
                />
              </div>
              <SkinSlot
                componentId="POIComponent"
                binding={poiBinding}
                skinOptions={{
                  generateClasses: true,
                  generateAttributes: true,
                  generateStyles: true,
                }}
                className="activity-capsule__poi-visualization"
                data-testid="poi-visualization"
              >
                <style>{poiSkinConfig.cssStyles}</style>
                <div
                  dangerouslySetInnerHTML={{ __html: poiSkinConfig.htmlTemplate }}
                  style={{
                    width: '100%',
                    height: '120px',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                />
              </SkinSlot>
            </div>
          );
        })()}
      </div>

      {/* ARIA Live announcements */}
      {skinConfig.enableAriaLive && ariaLiveAnnouncement && (
        <div
          aria-live={ariaLive || 'polite'}
          aria-atomic="true"
          className="sr-only"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {ariaLiveAnnouncement}
        </div>
      )}

      {/* CSS-in-JS animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .activity-capsule {
          min-height: var(--capsule-frame-min-height);
          border-radius: var(--capsule-frame-border-radius);
          background: var(--capsule-frame-background);
          border: 1px solid var(--capsule-frame-border);
          box-shadow: var(--capsule-frame-box-shadow);
          padding: var(--capsule-frame-padding);
          transition: var(--capsule-entry-duration) var(--capsule-entry-easing);
          animation: var(--capsule-entry-duration) var(--capsule-entry-easing) capsule-entry;
        }
        
        @keyframes capsule-entry {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .activity-capsule__frame {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .activity-capsule__header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-capsule__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        
        .activity-capsule__label {
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .activity-capsule__subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.8;
        }
        
        .activity-capsule__helper {
          font-size: 11px;
          color: var(--text-tertiary);
          opacity: 0.7;
        }
        
        .activity-capsule__slot {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .activity-capsule__slot-initials {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
        }
        
        .activity-capsule__slot-empty {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-tertiary);
          opacity: 0.3;
        }
        
        /* Drop mode styles */
        .activity-capsule__slot--droppable {
          transition: all 0.2s ease;
        }
        
        .activity-capsule__slot--drop-over {
          animation: drop-pulse 1s infinite;
        }
        
        .activity-capsule__slot--drop-invalid {
          animation: drop-shake 0.3s ease-in-out;
        }
        
        .activity-capsule__slot-drop-hint {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        @keyframes drop-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes drop-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        .activity-capsule__progress {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-capsule__cta {
          align-self: flex-start;
          font-family: inherit;
          border: none;
          outline: none;
        }
        
        .activity-capsule__cta:hover:not(.activity-capsule__cta--disabled) {
          background: var(--capsule-cta-hover-background);
          border-color: var(--capsule-cta-hover-border-color);
        }
        
        .activity-capsule__cta:active:not(.activity-capsule__cta--disabled) {
          transform: var(--capsule-cta-active-scale);
        }
      `}</style>
    </StyleLabSurface>
  );
}

export default ActivityCapsule;
