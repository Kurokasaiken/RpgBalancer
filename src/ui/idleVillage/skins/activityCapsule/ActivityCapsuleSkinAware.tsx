/**
 * WL-STY-010: ActivityCapsule Skin-Aware Component (TS-Series Integration)
 * 
 * Advanced ActivityCapsule component with full TS-Series skin system integration.
 * Provides automatic skin binding, hot-reloading, validation, and performance
 * optimization while maintaining backward compatibility with existing ActivityCapsule.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), TS-003 (SkinReplacementAPI)
 * Integration: useSkinSystem, SkinRegistry, telemetry, persistence
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { useSkinSystem } from '../hooks/useSkinSystem';
import { useSkinSlot } from '../components/SkinSlot';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';
import { 
  ActivityCapsuleSkinConfig,
  getActivityCapsuleSkinConfig,
  createActivityCapsuleSkinBinding,
  validateActivityCapsuleSkinConfig,
  mergeActivityCapsuleSkinConfig,
  type ActivityCapsuleFrameConfig,
  type ActivityCapsuleProgressConfig,
  type ActivityCapsuleCTAConfig,
  type ActivityCapsuleAnimationConfig,
  type ActivityCapsuleTypographyConfig,
  type ActivityCapsuleStatusConfig,
  type ActivityCapsuleAccessibilityConfig,
} from './ActivityCapsuleSkinSchema';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../SkinSchema';

// Re-export ActivitySlotData for backward compatibility
export interface ActivitySlotData {
  slotId: string;
  assignedWorkerName?: string | null;
  assignedWorkerAvatarUrl?: string | null;
  isOccupied: boolean;
  isLocked: boolean;
}

/**
 * Enhanced props for ActivityCapsuleSkinAware component
 */
export interface ActivityCapsuleSkinAwareProps {
  /** Core activity data */
  activityId: string;
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
  
  /** TS-Series skin configuration */
  pillar?: StyleLabPillar;
  skinPresetId?: SkinPresetId;
  motionLevel?: MotionLevel;
  skinConfigOverride?: Partial<ActivityCapsuleSkinConfig>;
  enableSkinBinding?: boolean;
  skinBindingId?: string;
  
  /** Legacy compatibility */
  skinPresetOverrideId?: string;
  skinConfigOverrideLegacy?: Partial<any>;
  
  /** Interaction handlers */
  onSlotClick?: (slotId: string) => void;
  onSlotHover?: (slotId: string, isHovering: boolean) => void;
  onActivityClick?: () => void;
  
  /** Display options */
  showSlots?: boolean;
  showProgress?: boolean;
  showTimer?: boolean;
  compact?: boolean;
  
  /** Accessibility */
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  
  /** Development tools */
  enableDevTools?: boolean;
  onValidationError?: (errors: SkinValidationResult) => void;
  onSkinChange?: (config: ActivityCapsuleSkinConfig) => void;
  
  /** Test identifiers */
  dataTestId?: string;
}

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
 * ActivityCapsuleSkinAware component with full TS-Series integration
 */
export function ActivityCapsuleSkinAware({
  activityId,
  label,
  icon,
  subtitle,
  helperText,
  slots,
  maxSlots,
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  status,
  canCollect,
  onCollect,
  collectLabel = 'Collect',
  collectDisabled = false,
  pillar,
  skinPresetId,
  motionLevel,
  skinConfigOverride,
  enableSkinBinding = true,
  skinBindingId,
  // Legacy compatibility
  skinPresetOverrideId,
  skinConfigOverrideLegacy,
  onSlotClick,
  onSlotHover,
  onActivityClick,
  showSlots = true,
  showProgress = true,
  showTimer = true,
  compact = false,
  ariaLabel,
  ariaLive = 'polite',
  enableDevTools = false,
  onValidationError,
  onSkinChange,
  dataTestId = 'activity-capsule-skin-aware',
}: ActivityCapsuleSkinAwareProps) {
  // TS-Series skin system integration
  const skinSystem = useSkinSystem();
  const skinSlot = useSkinSlot({
    componentId: skinBindingId || `activity-capsule-${activityId}`,
    componentType: 'ActivityCapsule',
    enabled: enableSkinBinding,
    priority: 'normal',
  });
  
  // Legacy compatibility handling
  const resolvedSkinPresetId = skinPresetId || skinPresetOverrideId || skinSystem.presetId;
  const resolvedPillar = pillar || skinSystem.pillar;
  const resolvedMotionLevel = motionLevel || skinSystem.motionLevel;
  
  // Resolve skin configuration with TS-Series integration
  const skinConfig = useMemo(() => {
    let baseConfig = getActivityCapsuleSkinConfig(resolvedPillar, {
      presetId: resolvedSkinPresetId,
      pillar: resolvedPillar,
      motionLevel: resolvedMotionLevel,
      ...skinConfigOverride,
    });
    
    // Apply legacy overrides for backward compatibility
    if (skinConfigOverrideLegacy) {
      baseConfig = mergeActivityCapsuleSkinConfig(baseConfig, skinConfigOverrideLegacy);
    }
    
    // Apply skin slot overrides if available
    if (skinSlot.binding?.config) {
      baseConfig = mergeActivityCapsuleSkinConfig(baseConfig, skinSlot.binding.config);
    }
    
    return baseConfig;
  }, [
    resolvedPillar, 
    resolvedSkinPresetId, 
    resolvedMotionLevel, 
    skinConfigOverride, 
    skinConfigOverrideLegacy,
    skinSlot.binding?.config,
  ]);
  
  // Component state
  const [isHovered, setIsHovered] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<SkinValidationResult | null>(null);
  const [currentConfig, setCurrentConfig] = useState(skinConfig);
  
  // Refs for performance optimization
  const configRef = useRef(skinConfig);
  const validationRef = useRef(validationErrors);
  
  // Update refs when values change
  useEffect(() => {
    configRef.current = skinConfig;
  }, [skinConfig]);
  
  useEffect(() => {
    validationRef.current = validationErrors;
  }, [validationErrors]);
  
  // Calculate remaining time
  const remainingSeconds = useMemo(() => 
    Math.max(0, totalDurationSeconds - elapsedSeconds),
    [totalDurationSeconds, elapsedSeconds]
  );
  
  // Determine if capsule should be interactive
  const isInteractive = Boolean(onActivityClick || onSlotClick || (canCollect && onCollect));
  
  // Validate skin configuration
  useEffect(() => {
    if (skinConfig.enableValidation) {
      const validation = validateActivityCapsuleSkinConfig(skinConfig);
      setValidationErrors(validation);
      
      if (!validation.isValid && onValidationError) {
        onValidationError(validation);
      }
    }
  }, [skinConfig, skinConfig.enableValidation, onValidationError]);
  
  // Create skin binding for TS-Series integration
  useEffect(() => {
    if (enableSkinBinding && skinBindingId) {
      const binding = createActivityCapsuleSkinBinding(skinBindingId, {
        ...skinConfig,
        pillar: resolvedPillar,
        presetId: resolvedSkinPresetId,
        motionLevel: resolvedMotionLevel,
      });
      
      skinSlot.register(binding);
      
      return () => {
        skinSlot.unregister();
      };
    }
  }, [
    enableSkinBinding,
    skinBindingId,
    resolvedPillar,
    resolvedSkinPresetId,
    resolvedMotionLevel,
    skinConfig,
    skinSlot,
  ]);
  
  // Handle skin configuration changes
  useEffect(() => {
    if (currentConfig !== skinConfig) {
      setCurrentConfig(skinConfig);
      onSkinChange?.(skinConfig);
    }
  }, [currentConfig, skinConfig, onSkinChange]);
  
  // Telemetry tracking
  useEffect(() => {
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_skin_aware_rendered', {
        activityId,
        status,
        progressFraction,
        slotCount: slots.length,
        pillar: resolvedPillar,
        presetId: resolvedSkinPresetId,
        motionLevel: resolvedMotionLevel,
        skinBindingEnabled: enableSkinBinding,
        validationErrors: validationErrors?.errors.length || 0,
        compact,
        timestamp: Date.now(),
      });
    }
  }, [
    activityId,
    status,
    progressFraction,
    slots.length,
    resolvedPillar,
    resolvedSkinPresetId,
    resolvedMotionLevel,
    enableSkinBinding,
    validationErrors?.errors.length,
    compact,
    skinConfig.enableTelemetry,
  ]);
  
  // Handle collect action with TS-Series integration
  const handleCollect = useCallback(async () => {
    if (!canCollect || collectDisabled || isCollecting || !onCollect) return;
    
    setIsCollecting(true);
    
    try {
      await onCollect();
      
      // TS-Series telemetry
      if (skinConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_skin_aware_collect', {
          activityId,
          status,
          pillar: resolvedPillar,
          presetId: resolvedSkinPresetId,
          motionLevel: resolvedMotionLevel,
          skinBindingId: skinBindingId,
          timestamp: Date.now(),
        });
      }
      
      // TS-Series skin replacement API integration
      if (skinConfig.enableHotReload) {
        const api = getSkinReplacementAPI_TS003();
        api.trackEvent('collect', {
          componentId: skinBindingId || `activity-capsule-${activityId}`,
          activityId,
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('ActivityCapsuleSkinAware: Collect failed', error);
    } finally {
      setIsCollecting(false);
    }
  }, [
    canCollect,
    collectDisabled,
    isCollecting,
    onCollect,
    activityId,
    status,
    resolvedPillar,
    resolvedSkinPresetId,
    resolvedMotionLevel,
    skinBindingId,
    skinConfig.enableTelemetry,
    skinConfig.enableHotReload,
  ]);
  
  // Handle slot interactions with TS-Series integration
  const handleSlotClick = useCallback((slotId: string) => {
    onSlotClick?.(slotId);
    
    // TS-Series telemetry
    if (skinConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_skin_aware_slot_click', {
        activityId,
        slotId,
        pillar: resolvedPillar,
        presetId: resolvedSkinPresetId,
        motionLevel: resolvedMotionLevel,
        skinBindingId: skinBindingId,
        timestamp: Date.now(),
      });
    }
    
    // TS-Series skin replacement API integration
    if (skinConfig.enableHotReload) {
      const api = getSkinReplacementAPI_TS003();
      api.trackEvent('slot_click', {
        componentId: skinBindingId || `activity-capsule-${activityId}`,
        slotId,
        activityId,
      });
    }
  }, [
    onSlotClick,
    activityId,
    resolvedPillar,
    resolvedSkinPresetId,
    resolvedMotionLevel,
    skinBindingId,
    skinConfig.enableTelemetry,
    skinConfig.enableHotReload,
  ]);
  
  const handleSlotHover = useCallback((slotId: string, isHovering: boolean) => {
    onSlotHover?.(slotId, isHovering);
  }, [onSlotHover]);
  
  // Generate CSS custom properties for TS-Series skin tokens
  const cssVars = useMemo((): CSSProperties => {
    const { frame, progress, cta, animation, typography, status, accessibility } = skinConfig;
    
    return {
      // Frame tokens
      '--capsule-frame-border': frame.frameBorder,
      '--capsule-frame-background': frame.frameBackground,
      '--capsule-frame-border-radius': frame.frameBorderRadius,
      '--capsule-frame-padding': frame.framePadding,
      '--capsule-frame-min-height': frame.frameMinHeight,
      '--capsule-frame-box-shadow': frame.frameBoxShadow,
      '--capsule-frame-decoration': frame.frameDecoration || 'none',
      '--capsule-frame-glow': frame.frameGlow || 'none',
      '--capsule-frame-inner-shadow': frame.frameInnerShadow || 'none',
      
      // Slot tokens
      '--capsule-slot-gap': frame.slotGap,
      '--capsule-slot-size': compact ? frame.compactSlotSize : frame.slotSize,
      '--capsule-slot-border-radius': frame.slotBorderRadius,
      '--capsule-slot-border': frame.slotBorder,
      '--capsule-slot-background': frame.slotBackground,
      '--capsule-slot-columns': String(compact ? frame.mobileSlotColumns : frame.slotGridColumns),
      
      // Progress tokens
      '--capsule-progress-background': progress.progressBackground,
      '--capsule-progress-fill': progress.progressFill,
      '--capsule-progress-border': progress.progressBorder,
      '--capsule-progress-height': progress.progressHeight,
      '--capsule-progress-border-radius': progress.progressBorderRadius,
      '--capsule-progress-transition': progress.progressTransition,
      '--capsule-liquid-gold-gradient': progress.liquidGoldGradient,
      '--capsule-liquid-gold-glow': progress.liquidGoldGlow,
      '--capsule-shimmer-duration': progress.shimmerAnimationDuration,
      '--capsule-shimmer-intensity': String(progress.shimmerIntensity),
      '--capsule-progress-pulse-enabled': String(progress.progressPulseEnabled),
      '--capsule-progress-pulse-intensity': String(progress.progressPulseIntensity),
      '--capsule-progress-pulse-duration': progress.progressPulseDuration,
      '--capsule-progress-pulse-color': progress.progressPulseColor || 'transparent',
      
      // Timer tokens
      '--capsule-timer-font': progress.timerFont,
      '--capsule-timer-color': progress.timerColor,
      '--capsule-timer-font-size': progress.timerFontSize,
      '--capsule-timer-font-weight': progress.timerFontWeight,
      
      // CTA tokens
      '--capsule-cta-background': cta.ctaBackground,
      '--capsule-cta-border-color': cta.ctaBorderColor,
      '--capsule-cta-text-color': cta.ctaTextColor,
      '--capsule-cta-border-radius': cta.ctaBorderRadius,
      '--capsule-cta-padding': cta.ctaPadding,
      '--capsule-cta-font-size': cta.ctaFontSize,
      '--capsule-cta-font-weight': cta.ctaFontWeight,
      '--capsule-cta-font-family': cta.ctaFontFamily,
      '--capsule-cta-hover-background': cta.ctaHoverBackground,
      '--capsule-cta-hover-border-color': cta.ctaHoverBorderColor,
      '--capsule-cta-hover-text-color': cta.ctaHoverTextColor || 'inherit',
      '--capsule-cta-active-scale': String(cta.ctaActiveScale),
      '--capsule-cta-transition': cta.ctaTransition,
      '--capsule-cta-disabled-background': cta.ctaDisabledBackground,
      '--capsule-cta-disabled-text-color': cta.ctaDisabledTextColor,
      '--capsule-cta-disabled-opacity': String(cta.ctaDisabledOpacity),
      '--capsule-cta-disabled-border-color': cta.ctaDisabledBorderColor || 'transparent',
      '--capsule-cta-icon': cta.ctaIcon || 'none',
      '--capsule-cta-icon-size': cta.ctaIconSize || '10px',
      '--capsule-cta-icon-color': cta.ctaIconColor || 'inherit',
      
      // Animation tokens
      '--capsule-entry-duration': animation.entryDuration,
      '--capsule-entry-easing': animation.entryEasing,
      '--capsule-entry-delay': animation.entryDelay || '0s',
      '--capsule-slot-hover-scale': String(animation.slotHoverScale),
      '--capsule-slot-hover-glow': animation.slotHoverGlow,
      '--capsule-slot-hover-transition': animation.slotHoverTransition,
      '--capsule-slot-hover-rotate': String(animation.slotHoverRotate || 0),
      '--capsule-progress-animation-enabled': String(animation.progressAnimationEnabled),
      '--capsule-progress-animation-type': animation.progressAnimationType,
      '--capsule-progress-animation-duration': animation.progressAnimationDuration,
      '--capsule-collect-feedback-animation': animation.collectFeedbackAnimation,
      '--capsule-collect-feedback-duration': animation.collectFeedbackDuration,
      '--capsule-collect-feedback-color': animation.collectFeedbackColor || 'transparent',
      
      // Typography tokens
      '--capsule-title-font': typography.titleFont,
      '--capsule-title-font-size': typography.titleFontSize,
      '--capsule-title-font-weight': typography.titleFontWeight,
      '--capsule-title-color': typography.titleColor,
      '--capsule-title-line-height': typography.titleLineHeight,
      '--capsule-title-letter-spacing': typography.titleLetterSpacing || 'normal',
      '--capsule-subtitle-font': typography.subtitleFont,
      '--capsule-subtitle-font-size': typography.subtitleFontSize,
      '--capsule-subtitle-font-weight': typography.subtitleFontWeight,
      '--capsule-subtitle-color': typography.subtitleColor,
      '--capsule-subtitle-line-height': typography.subtitleLineHeight,
      '--capsule-helper-font': typography.helperFont,
      '--capsule-helper-font-size': typography.helperFontSize,
      '--capsule-helper-font-weight': typography.helperFontWeight,
      '--capsule-helper-color': typography.helperColor,
      '--capsule-helper-opacity': String(typography.helperOpacity),
      '--capsule-slot-initials-font': typography.slotInitialsFont,
      '--capsule-slot-initials-font-size': typography.slotInitialsFontSize,
      '--capsule-slot-initials-font-weight': typography.slotInitialsFontWeight,
      '--capsule-slot-initials-color': typography.slotInitialsColor,
      
      // Status tokens
      '--capsule-idle-frame-opacity': String(status.idle.frameOpacity),
      '--capsule-idle-progress-opacity': String(status.idle.progressOpacity),
      '--capsule-idle-cta-opacity': String(status.idle.ctaOpacity),
      '--capsule-idle-status-color': status.idle.statusColor || 'inherit',
      '--capsule-idle-status-icon': status.idle.statusIcon || 'none',
      '--capsule-in-progress-frame-glow': status.inProgress.frameGlow,
      '--capsule-in-progress-progress-glow': status.inProgress.progressGlow,
      '--capsule-in-progress-status-color': status.inProgress.statusColor,
      '--capsule-in-progress-status-icon': status.inProgress.statusIcon || 'none',
      '--capsule-in-progress-pulse-enabled': String(status.inProgress.pulseEnabled),
      '--capsule-completed-frame-glow': status.completed.frameGlow,
      '--capsule-completed-progress-glow': status.completed.progressGlow,
      '--capsule-completed-status-color': status.completed.statusColor,
      '--capsule-completed-status-icon': status.completed.statusIcon || 'none',
      '--capsule-completed-celebration-enabled': String(status.completed.celebrationEnabled),
      '--capsule-blocked-frame-opacity': String(status.blocked.frameOpacity),
      '--capsule-blocked-progress-opacity': String(status.blocked.progressOpacity),
      '--capsule-blocked-cta-opacity': String(status.blocked.ctaOpacity),
      '--capsule-blocked-status-color': status.blocked.statusColor,
      '--capsule-blocked-status-icon': status.blocked.statusIcon || 'none',
      '--capsule-blocked-pattern': status.blocked.blockedPattern || 'none',
      
      // Accessibility tokens
      '--capsule-focus-indicator-style': accessibility.focusIndicatorStyle,
      '--capsule-high-contrast-mode': String(accessibility.highContrastMode),
    } as CSSProperties;
  }, [skinConfig, compact]);
  
  // Apply status-specific styles
  const statusStyles = useMemo((): CSSProperties => {
    const statusConfig = skinConfig.status[status];
    
    switch (status) {
      case 'idle':
        return {
          opacity: statusConfig.frameOpacity,
          '--capsule-progress-opacity': String(statusConfig.progressOpacity),
          '--capsule-cta-opacity': String(statusConfig.ctaOpacity),
        };
      case 'in-progress':
        return {
          boxShadow: statusConfig.frameGlow,
          '--capsule-progress-glow': statusConfig.progressGlow,
        };
      case 'completed':
        return {
          boxShadow: statusConfig.frameGlow,
          '--capsule-progress-glow': statusConfig.progressGlow,
        };
      case 'blocked':
        return {
          opacity: statusConfig.frameOpacity,
          '--capsule-progress-opacity': String(statusConfig.progressOpacity),
          '--capsule-cta-opacity': String(statusConfig.ctaOpacity),
          backgroundImage: statusConfig.blockedPattern,
        };
      default:
        return {};
    }
  }, [skinConfig, status]);
  
  // Generate grid columns based on slot count and compact mode
  const gridColumns = compact 
    ? skinConfig.frame.mobileSlotColumns 
    : Math.min(slots.length, skinConfig.frame.slotGridColumns);
  
  // Component classes
  const capsuleClasses = clsx(
    'activity-capsule-skin-aware',
    `activity-capsule-skin-aware--${status}`,
    `activity-capsule-skin-aware--pillar-${resolvedPillar}`,
    `activity-capsule-skin-aware--motion-${resolvedMotionLevel}`,
    `activity-capsule-skin-aware--preset-${resolvedSkinPresetId}`,
    {
      'activity-capsule-skin-aware--interactive': isInteractive,
      'activity-capsule-skin-aware--hovered': isHovered,
      'activity-capsule-skin-aware--compact': compact,
      'activity-capsule-skin-aware--collecting': isCollecting,
      'activity-capsule-skin-aware--validation-errors': validationErrors?.isValid === false,
      'activity-capsule-skin-aware--dev-tools': enableDevTools,
    }
  );
  
  return (
    <div
      className={capsuleClasses}
      data-testid={dataTestId}
      data-activity-id={activityId}
      data-status={status}
      data-pillar={resolvedPillar}
      data-preset={resolvedSkinPresetId}
      data-motion-level={resolvedMotionLevel}
      data-skin-binding-id={skinBindingId}
      style={{ ...cssVars, ...statusStyles }}
      aria-label={ariaLabel || `${label} activity capsule`}
      aria-live={skinConfig.accessibility.enableAriaLive ? ariaLive : 'off'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onActivityClick}
    >
      {/* Validation errors display for development */}
      {enableDevTools && validationErrors && !validationErrors.isValid && (
        <div className="activity-capsule-skin-aware__validation-errors">
          <div className="activity-capsule-skin-aware__validation-error-title">
            Skin Validation Errors
          </div>
          {validationErrors.errors.map((error, index) => (
            <div key={index} className="activity-capsule-skin-aware__validation-error">
              {error.path}: {error.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Frame container */}
      <div className="activity-capsule-skin-aware__frame">
        {/* Header */}
        <div className="activity-capsule-skin-aware__header">
          <div className="activity-capsule-skin-aware__title">
            {icon && <div className="activity-capsule-skin-aware__icon">{icon}</div>}
            <div className="activity-capsule-skin-aware__label">{label}</div>
            {skinConfig.status[status].statusIcon && (
              <div className="activity-capsule-skin-aware__status-icon">
                {skinConfig.status[status].statusIcon}
              </div>
            )}
          </div>
          {subtitle && <div className="activity-capsule-skin-aware__subtitle">{subtitle}</div>}
        </div>
        
        {/* Helper text */}
        {helperText && (
          <div className="activity-capsule-skin-aware__helper">{helperText}</div>
        )}
        
        {/* Slots grid */}
        {showSlots && slots.length > 0 && (
          <div 
            className="activity-capsule-skin-aware__slots"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gap: 'var(--capsule-slot-gap)',
            }}
          >
            {slots.map((slot) => (
              <div
                key={slot.slotId}
                className={clsx('activity-capsule-skin-aware__slot', {
                  'activity-capsule-skin-aware__slot--occupied': slot.isOccupied,
                  'activity-capsule-skin-aware__slot--locked': slot.isLocked,
                  'activity-capsule-skin-aware__slot--interactive': Boolean(onSlotClick),
                })}
                data-slot-id={slot.slotId}
                data-occupied={slot.isOccupied}
                data-locked={slot.isLocked}
                onClick={() => handleSlotClick(slot.slotId)}
                onMouseEnter={() => handleSlotHover(slot.slotId, true)}
                onMouseLeave={() => handleSlotHover(slot.slotId, false)}
                style={{
                  width: 'var(--capsule-slot-size)',
                  height: 'var(--capsule-slot-size)',
                  borderRadius: 'var(--capsule-slot-border-radius)',
                  border: 'var(--capsule-slot-border)',
                  backgroundColor: 'var(--capsule-slot-background)',
                  cursor: onSlotClick ? 'pointer' : 'default',
                  transition: 'var(--capsule-slot-hover-transition)',
                  transform: isHovered ? `scale(var(--capsule-slot-hover-scale)) rotate(var(--capsule-slot-hover-rotate))` : 'scale(1) rotate(0deg)',
                  boxShadow: isHovered ? 'var(--capsule-slot-hover-glow)' : 'none',
                }}
              >
                {slot.assignedWorkerAvatarUrl ? (
                  <img
                    src={slot.assignedWorkerAvatarUrl}
                    alt={slot.assignedWorkerName || 'Worker'}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 'var(--capsule-slot-border-radius)',
                      objectFit: 'cover',
                    }}
                  />
                ) : slot.assignedWorkerName ? (
                  <div className="activity-capsule-skin-aware__slot-initials">
                    {slot.assignedWorkerName
                      .split(' ')
                      .map(name => name.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                ) : (
                  <div className="activity-capsule-skin-aware__slot-empty" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Progress section */}
        {showProgress && (
          <div className="activity-capsule-skin-aware__progress">
            {/* Progress bar */}
            <div
              className={clsx('activity-capsule-skin-aware__progress-bar', {
                'activity-capsule-skin-aware__progress-bar--pulse': 
                  skinConfig.progress.progressPulseEnabled && status === 'in-progress',
              })}
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
                className="activity-capsule-skin-aware__progress-fill"
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
                    className="activity-capsule-skin-aware__progress-shimmer"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '14px',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22))',
                      opacity: 'var(--capsule-shimmer-intensity)',
                      animation: `shimmer ${skinConfig.progress.shimmerAnimationDuration} ease-in-out infinite`,
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Timer */}
            {showTimer && (
              <div
                className="activity-capsule-skin-aware__timer"
                style={{
                  fontFamily: 'var(--capsule-timer-font)',
                  color: 'var(--capsule-timer-color)',
                  fontSize: 'var(--capsule-timer-font-size)',
                  fontWeight: 'var(--capsule-timer-font-weight)',
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
        {canCollect && onCollect && (
          <button
            className={clsx('activity-capsule-skin-aware__cta', {
              'activity-capsule-skin-aware__cta--disabled': collectDisabled || isCollecting,
              'activity-capsule-skin-aware__cta--celebration': 
                status === 'completed' && skinConfig.status.completed.celebrationEnabled,
            })}
            disabled={collectDisabled || isCollecting}
            onClick={handleCollect}
            style={{
              background: collectDisabled || isCollecting 
                ? 'var(--capsule-cta-disabled-background)' 
                : 'var(--capsule-cta-background)',
              border: `1px solid ${collectDisabled || isCollecting 
                ? 'var(--capsule-cta-disabled-border-color)' 
                : 'var(--capsule-cta-border-color)'}`,
              color: collectDisabled || isCollecting 
                ? 'var(--capsule-cta-disabled-text-color)' 
                : 'var(--capsule-cta-text-color)',
              borderRadius: 'var(--capsule-cta-border-radius)',
              padding: 'var(--capsule-cta-padding)',
              fontSize: 'var(--capsule-cta-font-size)',
              fontWeight: 'var(--capsule-cta-font-weight)',
              fontFamily: 'var(--capsule-cta-font-family)',
              transition: 'var(--capsule-cta-transition)',
              opacity: collectDisabled || isCollecting 
                ? 'var(--capsule-cta-disabled-opacity)' 
                : 1,
              cursor: collectDisabled || isCollecting ? 'not-allowed' : 'pointer',
              transform: isCollecting ? 'var(--capsule-cta-active-scale)' : 'scale(1)',
            }}
          >
            <span className="activity-capsule-skin-aware__cta-icon" style={{
              display: 'var(--capsule-cta-icon)',
              width: 'var(--capsule-cta-icon-size)',
              height: 'var(--capsule-cta-icon-size)',
              color: 'var(--capsule-cta-icon-color)',
              marginRight: '4px',
            }}>
              {skinConfig.cta.ctaIcon}
            </span>
            {isCollecting ? 'Collecting...' : collectLabel}
          </button>
        )}
      </div>
      
      {/* CSS-in-JS animations and styles */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: var(--capsule-shimmer-intensity); }
        }
        
        @keyframes progress-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: var(--capsule-progress-pulse-intensity); }
        }
        
        .activity-capsule-skin-aware {
          min-height: var(--capsule-frame-min-height);
          border-radius: var(--capsule-frame-border-radius);
          background: var(--capsule-frame-background);
          border: 1px solid var(--capsule-frame-border);
          box-shadow: var(--capsule-frame-box-shadow);
          padding: var(--capsule-frame-padding);
          transition: var(--capsule-entry-duration) var(--capsule-entry-easing);
          animation: var(--capsule-entry-duration) var(--capsule-entry-easing) var(--capsule-entry-delay) capsule-entry;
          position: relative;
          overflow: hidden;
        }
        
        .activity-capsule-skin-aware::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--capsule-frame-decoration);
          pointer-events: none;
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
        
        .activity-capsule-skin-aware__frame {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .activity-capsule-skin-aware__header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-capsule-skin-aware__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--capsule-title-font);
          font-size: var(--capsule-title-font-size);
          font-weight: var(--capsule-title-font-weight);
          color: var(--capsule-title-color);
          line-height: var(--capsule-title-line-height);
          letter-spacing: var(--capsule-title-letter-spacing);
        }
        
        .activity-capsule-skin-aware__subtitle {
          font-family: var(--capsule-subtitle-font);
          font-size: var(--capsule-subtitle-font-size);
          font-weight: var(--capsule-subtitle-font-weight);
          color: var(--capsule-subtitle-color);
          line-height: var(--capsule-subtitle-line-height);
        }
        
        .activity-capsule-skin-aware__helper {
          font-family: var(--capsule-helper-font);
          font-size: var(--capsule-helper-font-size);
          font-weight: var(--capsule-helper-font-weight);
          color: var(--capsule-helper-color);
          opacity: var(--capsule-helper-opacity);
        }
        
        .activity-capsule-skin-aware__status-icon {
          font-size: 12px;
          opacity: 0.8;
        }
        
        .activity-capsule-skin-aware__slot {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .activity-capsule-skin-aware__slot-initials {
          font-family: var(--capsule-slot-initials-font);
          font-size: var(--capsule-slot-initials-font-size);
          font-weight: var(--capsule-slot-initials-font-weight);
          color: var(--capsule-slot-initials-color);
          text-transform: uppercase;
        }
        
        .activity-capsule-skin-aware__slot-empty {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--capsule-helper-color);
          opacity: 0.3;
        }
        
        .activity-capsule-skin-aware__progress {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-capsule-skin-aware__progress-bar--pulse {
          animation: progress-pulse var(--capsule-progress-pulse-duration) ease-in-out infinite;
        }
        
        .activity-capsule-skin-aware__cta {
          align-self: flex-start;
          font-family: inherit;
          border: none;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .activity-capsule-skin-aware__cta:hover:not(.activity-capsule-skin-aware__cta--disabled) {
          background: var(--capsule-cta-hover-background);
          border-color: var(--capsule-cta-hover-border-color);
          color: var(--capsule-cta-hover-text-color);
        }
        
        .activity-capsule-skin-aware__cta:active:not(.activity-capsule-skin-aware__cta--disabled) {
          transform: var(--capsule-cta-active-scale);
        }
        
        .activity-capsule-skin-aware__cta--celebration {
          animation: var(--capsule-collect-feedback-duration) var(--capsule-collect-feedback-animation);
        }
        
        .activity-capsule-skin-aware__validation-errors {
          position: absolute;
          top: -2px;
          right: -2px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          z-index: 1000;
          max-width: 200px;
        }
        
        .activity-capsule-skin-aware__validation-error-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .activity-capsule-skin-aware__validation-error {
          font-size: 9px;
          line-height: 1.2;
        }
        
        /* Motion level adaptations */
        .activity-capsule-skin-aware--motion-minimal {
          animation: none;
          transition: none;
        }
        
        .activity-capsule-skin-aware--motion-minimal .activity-capsule-skin-aware__slot {
          transform: none !important;
        }
        
        .activity-capsule-skin-aware--motion-minimal .activity-capsule-skin-aware__progress-fill {
          transition: none;
        }
        
        .activity-capsule-skin-aware--motion-reduced {
          animation-duration: 0.1s;
          transition-duration: 0.1s;
        }
        
        /* High contrast mode */
        .activity-capsule-skin-aware--high-contrast {
          border: 2px solid;
        }
        
        .activity-capsule-skin-aware--high-contrast:focus {
          outline: var(--capsule-focus-indicator-style);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export default ActivityCapsuleSkinAware;
