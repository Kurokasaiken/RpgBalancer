/**
 * WL-STY-011: ActivityCapsuleDetail Skin-Aware Component (TS-Series Integration)
 * 
 * Advanced ActivityCapsuleDetail component with full TS-Series skin system integration.
 * Provides window management, POI visualization, slot rack, telemetry, and CTA
 * with comprehensive theming and performance optimization.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useHeavyDrag } from '@/ui/wanderlust-surface/useHeavyDrag';
import { useSkinSystem } from '../../hooks/useSkinSystem';
import { ResidentSlotRack } from '../../components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '../../slots/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { LocationDropState } from '../../map/validators/locationDropValidators';
import { useSkinSlot, type UseSkinSlotOptions } from '../../hooks/useSkinSlot';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';
import type { ActivityCapsuleDetailSkinConfig } from './ActivityCapsuleDetailSkinSchema';
import { getTemporarySkinConfig } from '../temporary/temporarySkinRegistry';
import {
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  getActivityCapsuleDetailSkinConfig,
  createActivityCapsuleDetailSkinBinding,
  validateActivityCapsuleDetailSkinConfig,
  mergeActivityCapsuleDetailSkinConfig,
} from './ActivityCapsuleDetailSkinSchema';
import { getActivityCapsuleDetailSkinConfigWithPreset } from './ActivityCapsuleDetailSkinPresets';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../types/SkinSchema';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { InsetPanel } from '@/ui/wanderlust-surface/InsetPanel';
import { WanderlustRequirementList } from '@/ui/wanderlust-surface/layout/WanderlustLayout';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout/WanderlustAmbientField';
import { V9GlassLayersOnly } from '@/ui/v9-skin/V9GlassLayersOnly';

// Slot data interface
export interface ActivityDetailSlotData {
  id: string;
  /** Resident ID currently assigned to this slot. */
  residentId?: string;
  state: 'empty' | 'ghost' | 'idle' | 'active' | 'done' | 'locked';
  initial: string;
  progress: number;
  assignedWorkerName?: string;
  assignedWorkerAvatarUrl?: string;
}

/**
 * Maps ActivityDetailSlotData to ResidentSlotViewModel for ResidentSlotRack integration.
 * This is a simplified mapper for POI detail context; full resident state is not available.
 */
function mapToResidentSlotViewModel(
  slot: ActivityDetailSlotData,
  index: number
): ResidentSlotViewModel {
  const isAssigned = slot.state !== 'empty' && slot.state !== 'ghost';

  const assignedResident: ResidentState | undefined = isAssigned
    ? ({
        id: slot.residentId ?? slot.id,
        displayName: slot.assignedWorkerName,
        portraitUrl: slot.assignedWorkerAvatarUrl,
        status: 'available',
        fatigue: 0,
        currentHp: 1,
        maxHp: 1,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      } as ResidentState)
    : undefined;

  return {
    id: slot.id,
    index,
    label: `Slot ${index + 1}`,
    assignedResidentId: isAssigned ? (slot.residentId ?? slot.id) : null,
    assignedResident,
    activityId: 'activity-poi',
    activityLabel: 'POI Activity',
    displayRole: 'activity',
    isPlaceholder: false,
    dropState: 'idle',
    bloomState: 'idle',
    status: isAssigned ? 'assigned' : 'empty',
    telemetryTags: [],
  };
}

// Telemetry entry interface
export interface TelemetryEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'assign' | 'start' | 'done' | 'detach' | 'reject';
}

// Component props
export interface ActivityCapsuleDetailSkinAwareProps {
  /** Core activity data */
  activityId: string;
  name: string;
  type: string;
  subtitle?: string;
  
  /** Status and progress */
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  duration: number;
  elapsed: number;
  
  /** Slot management */
  slots: ActivityDetailSlotData[];
  maxSlots: number;
  
  /** Information display */
  durationDisplay: string;
  rewardDisplay: string;
  etaDisplay: string;
  
  /** Telemetry */
  telemetry: TelemetryEntry[];
  
  /** Actions */
  onStart?: () => void;
  onCancel?: () => void;
  onCollect?: () => void;
  onSlotAssign?: (slotId: string) => void;
  onSlotDetach?: (slotId: string) => void;
  
  /** TS-Series skin configuration */
  pillar?: StyleLabPillar;
  skinPresetId?: SkinPresetId;
  motionLevel?: MotionLevel;
  skinConfigOverride?: Partial<ActivityCapsuleDetailSkinConfig>;
  enableSkinBinding?: boolean;
  skinBindingId?: string;
  
  /** Window management */
  isOpen: boolean;
  onClose?: () => void;
  enableDrag?: boolean;
  position?: { x: number; y: number };
  
  /** Display options */
  showTelemetry?: boolean;
  showSlots?: boolean;
  showInfo?: boolean;
  compact?: boolean;
  
  /** Accessibility */
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  
  /** Development tools */
  enableDevTools?: boolean;
  onValidationError?: (errors: SkinValidationResult) => void;
  onSkinChange?: (config: ActivityCapsuleDetailSkinConfig) => void;
  
  /** Test identifiers */
  dataTestId?: string;

  /** Presentation */
  inlineMode?: boolean;
}

export function ActivityCapsuleDetailSkinAware({
  activityId,
  name,
  type,
  subtitle,
  status,
  progress,
  duration,
  elapsed,
  slots,
  maxSlots,
  durationDisplay,
  rewardDisplay,
  etaDisplay,
  telemetry,
  onStart,
  onCancel,
  onCollect,
  onSlotAssign,
  onSlotDetach,
  pillar,
  skinPresetId,
  motionLevel,
  skinConfigOverride,
  enableSkinBinding = true,
  skinBindingId,
  isOpen,
  onClose,
  enableDrag = true,
  position,
  showTelemetry = true,
  showSlots = true,
  showInfo = true,
  compact = false,
  ariaLabel,
  ariaLive = 'polite',
  enableDevTools = false,
  onValidationError,
  onSkinChange,
  dataTestId = 'activity-capsule-detail-skin-aware',
  inlineMode = false,
}: ActivityCapsuleDetailSkinAwareProps) {
  // TS-Series skin system integration
  const skinSystem = useSkinSystem();
  const componentId = skinBindingId || `activity-capsule-detail-${activityId}`;
  
  // Resolve skin configuration
  const resolvedPillar = pillar || skinSystem.state.currentPillar;
  const resolvedPresetId = skinPresetId || skinSystem.state.currentPreset;
  const resolvedMotionLevel = motionLevel || skinSystem.state.currentMotionLevel;
  
  const baseSkinConfig = useMemo(() => {
    return getActivityCapsuleDetailSkinConfigWithPreset(
      resolvedPresetId,
      resolvedPillar,
      resolvedMotionLevel,
      skinConfigOverride,
    );
  }, [
    resolvedPresetId,
    resolvedPillar,
    resolvedMotionLevel,
    skinConfigOverride,
  ]);

  const skinBinding = useMemo(() => {
    return createActivityCapsuleDetailSkinBinding(componentId, {
      ...baseSkinConfig,
      pillar: resolvedPillar,
      presetId: resolvedPresetId,
      motionLevel: resolvedMotionLevel,
    });
  }, [
    componentId,
    baseSkinConfig,
    resolvedPillar,
    resolvedPresetId,
    resolvedMotionLevel,
  ]);

  const skinSlot = useSkinSlot(componentId, skinBinding, {
    autoRegister: enableSkinBinding,
    autoUnregister: enableSkinBinding,
    enableLiveUpdates: enableSkinBinding,
  });

  const slotBinding = useMemo(() => {
    return skinSystem.getComponentBinding?.(componentId) ?? null;
  }, [componentId, skinSystem.getComponentBinding, skinSlot.renderCount, skinSlot.lastUpdate]);

  const skinConfig = useMemo(() => {
    if (slotBinding?.config) {
      return mergeActivityCapsuleDetailSkinConfig(
        baseSkinConfig,
        slotBinding.config as ActivityCapsuleDetailSkinConfig
      );
    }
    return baseSkinConfig;
  }, [baseSkinConfig, slotBinding?.config]);
  
  // Get slot skin for wilderness bronze theme
  const slotSkin = useMemo(() => {
    if (skinConfig.pillar === 'wilderness' && skinConfig.presetId === 'wanderlust') {
      return getTemporarySkinConfig('slot_wilderness_bronze');
    }
    return null;
  }, [skinConfig.pillar, skinConfig.presetId]);
  
  // Framer Motion drag (deve stare prima dell'uso di heavyDrag.isDragging)
  const dragControls = useDragControls();
  const heavyDrag = useHeavyDrag();

  // Component state
  const [validationErrors, setValidationErrors] = useState<SkinValidationResult | null>(null);
  const isDragging = heavyDrag.isDragging;
  const [currentConfig, setCurrentConfig] = useState(skinConfig);

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(skinConfig);
  const validationRef = useRef(validationErrors);
  
  // Update refs
  useEffect(() => {
    configRef.current = skinConfig;
    setCurrentConfig(skinConfig);
  }, [skinConfig]);
  
  useEffect(() => {
    validationRef.current = validationErrors;
  }, [validationErrors]);
  
  // Validate skin configuration
  useEffect(() => {
    if (skinConfig.enableValidation) {
      const validation = validateActivityCapsuleDetailSkinConfig(skinConfig);
      setValidationErrors(validation);
      
      if (!validation.isValid && onValidationError) {
        onValidationError(validation);
      }
    }
  }, [skinConfig, skinConfig.enableValidation, onValidationError]);
  
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
      trackTelemetryEvent('activity_capsule_detail_skin_aware_rendered', {
        activityId,
        status,
        progress,
        slotCount: slots.length,
        pillar: resolvedPillar,
        presetId: resolvedPresetId,
        motionLevel: resolvedMotionLevel,
        skinBindingEnabled: enableSkinBinding,
        validationErrors: validationErrors?.errors.length || 0,
        isOpen,
        compact,
        timestamp: Date.now(),
      });
    }
  }, [
    activityId,
    status,
    progress,
    slots.length,
    resolvedPillar,
    resolvedPresetId,
    resolvedMotionLevel,
    enableSkinBinding,
    validationErrors?.errors.length,
    isOpen,
    compact,
    skinConfig.enableTelemetry,
  ]);
  
  // Drag handlers

  // Debug logging
  useEffect(() => {
    console.log('DEBUG ActivityCapsuleDetailSkinAware:', {
      showSlots,
      showTelemetry,
      showInfo,
      isOpen,
      slots: slots.length,
      telemetry: telemetry.length,
    });
  }, [showSlots, showTelemetry, showInfo, isOpen, slots, telemetry]);
  
  // Generate CSS custom properties
  const cssVars = useMemo((): React.CSSProperties => {
    const { window, poi, header, ornament, info, slotRack, telemetry, cta, animation, typography, audio, accessibility } = skinConfig;
    
    return {
      // Window tokens
      '--detail-window-background': window.windowBackground,
      '--detail-window-border': window.windowBorder,
      '--detail-window-border-radius': window.windowBorderRadius,
      '--detail-window-box-shadow': window.windowBoxShadow,
      '--detail-window-width': compact ? window.compactWindowWidth : window.windowWidth,
      '--detail-window-min-height': window.windowMinHeight,
      '--detail-window-backdrop': window.windowBackdrop,
      '--detail-frame-gradient': window.frameGradient,
      '--detail-frame-border-gradient': window.frameBorderGradient,
      '--detail-frame-corner-decorations': window.frameCornerDecorations,
      '--detail-frame-ambient-glow': window.frameAmbientGlow,
      '--detail-header-height': window.headerHeight,
      '--detail-content-padding': compact ? window.mobileContentPadding : window.contentPadding,
      
      // POI tokens
      '--detail-poi-size': poi.poiSize,
      '--detail-poi-glow': poi.poiGlow,
      '--detail-crown-gradient': poi.crownGradient,
      '--detail-crown-animation': poi.crownAnimation,
      '--detail-core-gradient': poi.coreGradient,
      '--detail-progress-ring-width': poi.progressRingWidth,
      '--detail-progress-ring-gradient': poi.progressRingGradient,
      '--detail-idle-color': poi.idleColor,
      '--detail-active-color': poi.activeColor,
      '--detail-completed-color': poi.completedColor,
      
      // Header tokens
      '--detail-name-font': header.nameFont,
      '--detail-name-font-size': header.nameFontSize,
      '--detail-name-color': header.nameColor,
      '--detail-type-font': header.typeFont,
      '--detail-type-font-size': header.typeFontSize,
      '--detail-type-color': header.typeColor,
      '--detail-status-dot-size': header.statusDotSize,
      '--detail-status-font': header.statusFont,
      '--detail-status-font-size': header.statusFontSize,
      '--detail-status-idle-color': header.statusIdleColor,
      '--detail-status-active-color': header.statusActiveColor,
      '--detail-status-completed-color': header.statusCompletedColor,
      
      // Slot rack tokens
      '--detail-slot-size': slotRack.slotSize,
      '--detail-slot-gap': slotRack.slotGap,
      '--detail-cavity-gradient': slotRack.cavityGradient,
      '--detail-medal-gradient': slotRack.medalGradient,
      '--detail-initials-font': slotRack.initialsFont,
      '--detail-initials-font-size': slotRack.initialsFontSize,
      '--detail-initials-color': slotRack.initialsColor,
      '--detail-slot-progress-width': slotRack.slotProgressWidth,
      '--detail-slot-progress-gradient': slotRack.slotProgressGradient,
      '--detail-slot-idle-glow': slotRack.slotIdleGlow,
      '--detail-slot-active-glow': slotRack.slotActiveGlow,
      '--detail-slot-completed-glow': slotRack.slotCompletedGlow,
      
      // CTA tokens
      '--detail-button-background': cta.buttonBackground,
      '--detail-button-border': cta.buttonBorder,
      '--detail-button-border-radius': cta.buttonBorderRadius,
      '--detail-button-padding': cta.buttonPadding,
      '--detail-button-font': cta.buttonFont,
      '--detail-button-font-size': cta.buttonFontSize,
      '--detail-button-color': cta.buttonColor,
      '--detail-button-hover-background': cta.buttonHoverBackground,
      '--detail-button-disabled-background': cta.buttonDisabledBackground,
      '--detail-button-disabled-color': cta.buttonDisabledColor,
      '--detail-button-disabled-opacity': String(cta.buttonDisabledOpacity),
      '--detail-start-button-background': cta.startButtonBackground,
      '--detail-cancel-button-background': cta.cancelButtonBackground,
      '--detail-collect-button-background': cta.collectButtonBackground,
      
      // Animation tokens
      '--detail-window-entry-animation': animation.windowEntryAnimation,
      '--detail-window-entry-duration': animation.windowEntryDuration,
      '--detail-window-entry-easing': animation.windowEntryEasing,
      '--detail-poi-idle-animation': animation.poiIdleAnimation,
      '--detail-poi-idle-duration': animation.poiIdleDuration,
      '--detail-slot-idle-animation': animation.slotIdleAnimation,
      '--detail-slot-idle-duration': animation.slotIdleDuration,
      '--detail-ui-animation-duration': animation.uiAnimationDuration,
      '--detail-hover-animation-duration': animation.hoverAnimationDuration,
      '--detail-click-animation-duration': animation.clickAnimationDuration,
      
      // Typography tokens
      '--detail-primary-font': typography.primaryFont,
      '--detail-primary-font-weight': typography.primaryFontWeight,
      '--detail-primary-line-height': typography.primaryLineHeight,
      '--detail-text-primary': typography.textPrimary,
      '--detail-text-secondary': typography.textSecondary,
      '--detail-text-tertiary': typography.textTertiary,
      
      // Accessibility tokens
      '--detail-focus-indicator-style': accessibility.focusIndicatorStyle,
      '--detail-focus-indicator-width': accessibility.focusIndicatorWidth,
      '--detail-focus-indicator-color': accessibility.focusIndicatorColor,
    } as React.CSSProperties;
  }, [skinConfig, compact]);
  
  // Apply status-specific styles
  const statusStyles = useMemo((): React.CSSProperties => {
    switch (status) {
      case 'idle':
        return {
          '--detail-status-color': skinConfig.header.statusIdleColor,
          '--detail-poi-color': skinConfig.poi.idleColor,
        };
      case 'in-progress':
        return {
          '--detail-status-color': skinConfig.header.statusActiveColor,
          '--detail-poi-color': skinConfig.poi.activeColor,
          '--detail-frame-ambient-glow': 'radial-gradient(circle at 50% 92%, rgba(255, 188, 30, 0.08) 0%, rgba(255, 188, 30, 0) 100%)',
        };
      case 'completed':
        return {
          '--detail-status-color': skinConfig.header.statusCompletedColor,
          '--detail-poi-color': skinConfig.poi.completedColor,
          '--detail-frame-ambient-glow': 'radial-gradient(circle at 50% 92%, rgba(48, 188, 72, 0.06) 0%, rgba(48, 188, 72, 0) 100%)',
        };
      case 'blocked':
        return {
          '--detail-status-color': skinConfig.header.statusBlockedColor,
          '--detail-poi-color': skinConfig.poi.blockedColor,
        };
      default:
        return {};
    }
  }, [skinConfig, status]);

  // Convert slots to ResidentSlotViewModel for ResidentSlotRack
  const residentSlots = useMemo(() => {
    return slots.map((slot, index) => mapToResidentSlotViewModel(slot, index));
  }, [slots]);

  // Resolve slot size from skin config for detail layouts
  const slotSizePx = useMemo(() => {
    const parsed = parseInt(skinConfig.slotRack.slotSize, 10);
    return Number.isNaN(parsed) ? 80 : parsed;
  }, [skinConfig.slotRack.slotSize]);

  // Resolve display info for slot icons
  const resolveDisplayInfo = useCallback((slot: ResidentSlotViewModel) => {
    const originalSlot = slots.find(s => s.id === slot.id);
    return {
      icon: originalSlot?.initial || '☆',
      label: slot.label,
    };
  }, [slots]);

  // Map slot activity state for ResidentSlotRack
  const getSlotActivityState = useCallback((slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return null;
    // Map ResidentSlotViewModel state to SlotActivityUIState
    const stateMap: Record<string, 'idle' | 'active' | 'locked' | 'completing' | 'failed' | 'done'> = {
      'empty': 'idle',
      'ghost': 'idle',
      'idle': 'idle',
      'active': 'active',
      'done': 'done',
      'locked': 'locked',
    };
    return {
      state: stateMap[slot.state] || 'idle',
      progress: 0,
      remainingSeconds: 0,
      isLockedByPhase: false,
    };
  }, [slots]);

  // Component classes
  const windowClasses = [
    'activity-capsule-detail-skin-aware',
    `activity-capsule-detail-skin-aware--${status}`,
    `activity-capsule-detail-skin-aware--pillar-${resolvedPillar}`,
    `activity-capsule-detail-skin-aware--motion-${resolvedMotionLevel}`,
    `activity-capsule-detail-skin-aware--preset-${resolvedPresetId}`,
    isOpen ? 'activity-capsule-detail-skin-aware--open' : '',
    isDragging ? 'activity-capsule-detail-skin-aware--dragging' : '',
    compact ? 'activity-capsule-detail-skin-aware--compact' : '',
    validationErrors?.isValid === false ? 'activity-capsule-detail-skin-aware--validation-errors' : '',
    enableDevTools ? 'activity-capsule-detail-skin-aware--dev-tools' : '',
    inlineMode ? 'activity-capsule-detail-skin-aware--inline' : 'activity-capsule-detail-skin-aware--floating',
  ].filter(Boolean).join(' ');
  
  if (!isOpen) return null;

  // Style applied to the WanderlustSurface wrapper.
  // Positioning for floating mode is handled by the motion.div parent.
  const surfaceStyle: React.CSSProperties = {
    ...cssVars,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'all' : 'none',
    width: '100%',
    minHeight: 'var(--detail-window-min-height)',
    ...(inlineMode
      ? {
          position: 'relative',
          margin: '0 auto',
          maxWidth: 'min(100%, var(--detail-window-width))',
        }
      : {}),
  };

  // Inner content div: positioning + frame are handled by the surface, so
  // neutralize the legacy floating/background styling.
  const innerStyle: React.CSSProperties = {
    ...statusStyles,
    position: 'relative',
    left: 'auto',
    top: 'auto',
    transform: 'none',
    margin: 0,
    width: '100%',
    minHeight: 'auto',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
  };

  const surface = (
    <WanderlustSurface
      shape="panel"
      material="bronze"
      interactive={enableDrag}
      isDragging={isDragging}
      className="activity-capsule-detail-surface"
      style={surfaceStyle}
    >
      <div
        className={windowClasses}
        data-testid={dataTestId}
        data-activity-id={activityId}
        data-status={status}
        data-pillar={resolvedPillar}
        data-preset={resolvedPresetId}
        data-motion-level={resolvedMotionLevel}
        data-skin-binding-id={skinBindingId}
        style={innerStyle}
        aria-label={ariaLabel || `${name} activity detail window`}
        aria-live={skinConfig.accessibility.enableAriaLive ? ariaLive : 'off'}
      >
      {/* Window frame */}
      <div className="activity-capsule-detail-skin-aware__frame">
        {/* Window background: V9 Glass Layers (if wanderlust) or simple gradient */}
        {skinConfig.presetId === 'wanderlust' ? (
          <V9GlassLayersOnly />
        ) : (
          <div className="activity-capsule-detail-skin-aware__background" />
        )}
        
        {/* Window decorations */}
        <div className="activity-capsule-detail-skin-aware__decorations">
          <div className="activity-capsule-detail-skin-aware__corners" />
          <div className="activity-capsule-detail-skin-aware__ambient-glow" />
        </div>
        
        {/* Drag handle */}
        {enableDrag && !inlineMode && (
          <div
            className="activity-capsule-detail-skin-aware__drag-handle"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="activity-capsule-detail-skin-aware__handle-dots">
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        {/* Close button */}
        {onClose && (
          <button
            className="activity-capsule-detail-skin-aware__close-button"
            onClick={onClose}
            aria-label="Close activity details"
          >
            ✕
          </button>
        )}
        
        {/* Content */}
        <WanderlustAmbientField paused={false}>
          <div className="activity-capsule-detail-skin-aware__content">

          {/* ── LEFT COLUMN: narrativo + slot ── */}
          <div className="activity-capsule-detail-skin-aware__col-left">

          {/* Header */}
          <div className="activity-capsule-detail-skin-aware__header">
            {/* POI — progress ring con calcolo circumference corretto */}
            <div className="activity-capsule-detail-skin-aware__poi">
              {(() => {
                const poiSizePx = parseInt(skinConfig.poi.poiSize) || 60;
                const outerR = poiSizePx * 0.38;
                const innerR = poiSizePx * 0.30;
                const circumference = 2 * Math.PI * innerR;
                const dashFilled = circumference * Math.min(1, Math.max(0, progress));
                const dashGap = circumference - dashFilled;
                return (
                  <svg
                    width={poiSizePx}
                    height={poiSizePx}
                    viewBox={`0 0 ${poiSizePx} ${poiSizePx}`}
                    className="activity-capsule-detail-skin-aware__poi-svg"
                  >
                    {/* Outer cavity ring */}
                    <circle cx={poiSizePx/2} cy={poiSizePx/2} r={outerR}
                      fill="rgba(6,4,2,0.75)"
                      stroke="rgba(160,110,25,0.5)"
                      strokeWidth="1.5"
                    />
                    {/* Background track */}
                    <circle cx={poiSizePx/2} cy={poiSizePx/2} r={innerR}
                      fill="none"
                      stroke="rgba(90,60,10,0.25)"
                      strokeWidth="3"
                    />
                    {/* Progress arc */}
                    <circle cx={poiSizePx/2} cy={poiSizePx/2} r={innerR}
                      fill="none"
                      stroke="rgba(215,165,45,0.85)"
                      strokeWidth="3"
                      strokeDasharray={`${dashFilled} ${dashGap}`}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${poiSizePx/2} ${poiSizePx/2})`}
                      style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                    {/* Inner core dot */}
                    <circle cx={poiSizePx/2} cy={poiSizePx/2} r={poiSizePx*0.10}
                      fill="rgba(200,150,35,0.55)"
                    />
                  </svg>
                );
              })()}
            </div>
            
            {/* Activity info */}
            <div className="activity-capsule-detail-skin-aware__activity-info">
              <h2 className="activity-capsule-detail-skin-aware__name">{name}</h2>
              <div className="activity-capsule-detail-skin-aware__type">{type}</div>
              {subtitle && (
                <div className="activity-capsule-detail-skin-aware__subtitle">{subtitle}</div>
              )}
              <div className="activity-capsule-detail-skin-aware__status">
                <div className="activity-capsule-detail-skin-aware__status-dot" />
                <span className="activity-capsule-detail-skin-aware__status-text">
                  {status === 'idle' && 'In attesa'}
                  {status === 'in-progress' && 'In corso'}
                  {status === 'completed' && 'Completato'}
                  {status === 'blocked' && 'Bloccato'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Left ornament */}
          <div className="activity-capsule-detail-skin-aware__ornament">
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
            <div className="activity-capsule-detail-skin-aware__ornament-center" />
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
          </div>

          {/* Slot rack */}
          {showSlots && (
            <div className="activity-capsule-detail-skin-aware__slot-section">
              <div className="activity-capsule-detail-skin-aware__section-label">
                Personaggi assegnati
              </div>
              <InsetPanel style={{ overflow: 'hidden' }}>
                <ResidentSlotRack
                  slots={residentSlots}
                  layout="detail"
                  overflowBehavior="scroll"
                  resolveDisplayInfo={resolveDisplayInfo}
                  getSlotActivityState={getSlotActivityState}
                  onSlotClick={(slotId) => {
                    const slot = slots.find(s => s.id === slotId);
                    if (!slot) return;
                    if (slot.state === 'empty' || slot.state === 'ghost') {
                      onSlotAssign?.(slotId);
                    } else if (slot.state === 'idle') {
                      onSlotDetach?.(slotId);
                    }
                  }}
                  onSlotClear={onSlotDetach}
                  className="activity-capsule-detail-skin-aware__slot-rack"
                  slotSize={slotSizePx}
                />
              </InsetPanel>
            </div>
          )}

          {/* CTA — bottom of left column */}
          <div className="activity-capsule-detail-skin-aware__cta-row">
            {status === 'idle' && onStart && (
              <button
                className="activity-capsule-detail-skin-aware__button activity-capsule-detail-skin-aware__button--start"
                onClick={onStart}
                disabled={slots.filter(s => s.state === 'idle').length === 0}
              >
                Avvia
              </button>
            )}
            {status === 'in-progress' && onCancel && (
              <button
                className="activity-capsule-detail-skin-aware__button activity-capsule-detail-skin-aware__button--cancel"
                onClick={onCancel}
              >
                Annulla
              </button>
            )}
            {status === 'completed' && onCollect && (
              <button
                className="activity-capsule-detail-skin-aware__button activity-capsule-detail-skin-aware__button--collect"
                onClick={onCollect}
              >
                Raccogli
              </button>
            )}
          </div>

          </div>{/* end __col-left */}

          {/* ── COLUMN DIVIDER ── */}
          <div className="activity-capsule-detail-skin-aware__col-divider" />

          {/* ── RIGHT COLUMN: meccanico + registro ── */}
          <div className="activity-capsule-detail-skin-aware__col-right">

          {/* Stats strip: duration / reward / eta */}
          {showInfo && (
            <div className="activity-capsule-detail-skin-aware__info-row">
              <div className="activity-capsule-detail-skin-aware__info-item">
                <div className="activity-capsule-detail-skin-aware__info-label">Durata</div>
                <div className="activity-capsule-detail-skin-aware__info-value">{durationDisplay}</div>
              </div>
              <div className="activity-capsule-detail-skin-aware__info-item">
                <div className="activity-capsule-detail-skin-aware__info-label">Ricompensa</div>
                <div className="activity-capsule-detail-skin-aware__info-value">{rewardDisplay}</div>
              </div>
              <div className="activity-capsule-detail-skin-aware__info-item">
                <div className="activity-capsule-detail-skin-aware__info-label">ETA</div>
                <div className="activity-capsule-detail-skin-aware__info-value">{etaDisplay}</div>
              </div>
            </div>
          )}

          {/* Right ornament */}
          <div className="activity-capsule-detail-skin-aware__ornament">
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
            <div className="activity-capsule-detail-skin-aware__ornament-center" />
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
          </div>

          {/* Requirements — su pergamena */}
          {showSlots && (
            <div className="activity-capsule-detail-skin-aware__requirements">
              <div className="activity-capsule-detail-skin-aware__section-label">
                Requisiti
              </div>
              <InsetPanel material="parchment" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Forza', current: 45, required: 60 },
                  { label: 'Destrezza', current: 38, required: 50 },
                  { label: 'Costituzione', current: 42, required: 40 },
                ].map((req, i) => {
                  const met = req.current >= req.required;
                  const pct = Math.min(1, req.current / req.required);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flex: '0 0 88px', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(55, 38, 12, 0.65)', fontFamily: 'inherit' }}>
                        {req.label}
                      </span>
                      <div style={{ flex: 1, height: '3px', background: 'rgba(110, 80, 30, 0.18)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct * 100}%`, height: '100%', background: met ? 'rgba(65, 115, 50, 0.75)' : 'rgba(160, 85, 25, 0.65)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', minWidth: '46px', textAlign: 'right', color: met ? 'rgba(45, 90, 35, 0.9)' : 'rgba(130, 65, 20, 0.9)' }}>
                        {req.current}<span style={{ opacity: 0.5, fontSize: '9px' }}>/{req.required}</span>
                      </span>
                    </div>
                  );
                })}
              </InsetPanel>
            </div>
          )}

          {/* Telemetry */}
          {showTelemetry && (
            <div className="activity-capsule-detail-skin-aware__telemetry">
              <div className="activity-capsule-detail-skin-aware__section-label">
                Registro eventi
              </div>
              <div className="activity-capsule-detail-skin-aware__telemetry-log">
                {telemetry.length === 0 ? (
                  <div className="activity-capsule-detail-skin-aware__telemetry-empty">
                    Nessun evento registrato.
                  </div>
                ) : (
                  telemetry.map((entry) => (
                    <div
                      key={entry.id}
                      className={`activity-capsule-detail-skin-aware__telemetry-entry activity-capsule-detail-skin-aware__telemetry-entry--${entry.type}`}
                    >
                      <span className="activity-capsule-detail-skin-aware__telemetry-time">
                        {entry.timestamp.toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="activity-capsule-detail-skin-aware__telemetry-message">
                        {entry.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          </div>{/* end __col-right */}

        </div>{/* end __content */}
        </WanderlustAmbientField>
      </div>
      
      {/* Validation errors for development */}
      {enableDevTools && validationErrors && !validationErrors.isValid && (
        <div className="activity-capsule-detail-skin-aware__validation-errors">
          <div className="activity-capsule-detail-skin-aware__validation-error-title">
            Skin Validation Errors
          </div>
          {validationErrors.errors.map((error, index) => (
            <div key={index} className="activity-capsule-detail-skin-aware__validation-error">
              {error.path}: {error.message}
            </div>
          ))}
        </div>
      )}
      
      {/* CSS-in-JS styles */}
      <style>{`
        /* Lift content above the WanderlustSurface SVG well (z-index 1) */
        .activity-capsule-detail-surface .ws-content {
          position: relative;
          z-index: 2;
        }

        /* "Beautiful Fantasy" ambient — aggiunge un velo indaco/cosmico al fondo scuro */
        .activity-capsule-detail-skin-aware__background {
          background:
            radial-gradient(ellipse at 28% 18%, rgba(40, 28, 60, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 72% 80%, rgba(25, 14, 4, 0.50) 0%, transparent 50%),
            var(--detail-frame-gradient);
        }

        .activity-capsule-detail-skin-aware {
          width: var(--detail-window-width);
          min-height: var(--detail-window-min-height);
          background: var(--detail-window-background);
          border: var(--detail-window-border);
          border-radius: var(--detail-window-border-radius);
          box-shadow: var(--detail-window-box-shadow);
          backdrop-filter: blur(8px);
          transition: var(--detail-window-entry-duration) var(--detail-window-entry-easing);
          font-family: var(--detail-primary-font);
          font-weight: var(--detail-primary-font-weight);
          line-height: var(--detail-primary-line-height);
          color: var(--detail-text-primary);
        }
        
        .activity-capsule-detail-skin-aware--floating {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
        }

        .activity-capsule-detail-skin-aware--open {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        
        .activity-capsule-detail-skin-aware--dragging {
          transition: none;
        }
        
        .activity-capsule-detail-skin-aware__frame {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .activity-capsule-detail-skin-aware__background {
          position: absolute;
          inset: 0;
          background: var(--detail-frame-gradient);
        }
        
        .activity-capsule-detail-skin-aware__decorations {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .activity-capsule-detail-skin-aware__corners {
          position: absolute;
          inset: 0;
          border: 1px solid var(--detail-frame-corner-decorations);
          border-radius: var(--detail-window-border-radius);
        }
        
        .activity-capsule-detail-skin-aware__ambient-glow {
          position: absolute;
          inset: 0;
          background: var(--detail-frame-ambient-glow);
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.35s ease;
        }

        .activity-capsule-detail-skin-aware--inline {
          position: relative;
          width: 100%;
          max-width: var(--detail-window-width);
          margin: 0 auto;
          left: auto !important;
          top: auto !important;
          transform: none !important;
          z-index: auto !important;
          opacity: 1;
          pointer-events: auto;
        }
        
        .activity-capsule-detail-skin-aware--in-progress .activity-capsule-detail-skin-aware__ambient-glow,
        .activity-capsule-detail-skin-aware--completed .activity-capsule-detail-skin-aware__ambient-glow {
          opacity: 1;
        }
        
        .activity-capsule-detail-skin-aware__drag-handle {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: var(--detail-header-height);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          z-index: 10;
        }
        
        .activity-capsule-detail-skin-aware__drag-handle:active {
          cursor: grabbing;
        }
        
        .activity-capsule-detail-skin-aware__handle-dots {
          display: flex;
          gap: 3px;
          opacity: 0.28;
        }
        
        .activity-capsule-detail-skin-aware__handle-dots span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--detail-drag-handle-dot-color);
        }
        
        .activity-capsule-detail-skin-aware__close-button {
          position: absolute;
          top: 14px;
          right: 18px;
          width: 22px;
          height: 22px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--detail-close-button-color);
          font-size: 15px;
          line-height: 1;
          transition: color 0.15s;
          z-index: 11;
          font-family: var(--detail-primary-font);
        }
        
        .activity-capsule-detail-skin-aware__close-button:hover {
          color: var(--detail-close-button-hover-color);
        }
        
        /*
         * WanderlustSurface (ws-root--panel) has ws-content padding: 22px on all sides.
         * We fix the outer surface to 680px; the inner div takes 100% of ws-content's
         * content area (680 - 44 = 636px), which fits inside ws-root without clipping.
         */
        .activity-capsule-detail-surface {
          width: 680px !important;
          max-width: 92vw !important;
        }
        .activity-capsule-detail-skin-aware {
          width: 100%;
          max-width: 100%;
        }

        .activity-capsule-detail-skin-aware__content {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          padding: 20px 24px 18px;
          gap: 0;
          height: 100%;
          overflow: hidden;
        }

        .activity-capsule-detail-skin-aware__col-left {
          flex: 0 0 54%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-right: 22px;
          min-height: 0;
        }

        .activity-capsule-detail-skin-aware__col-divider {
          width: 1px;
          align-self: stretch;
          background: linear-gradient(to bottom, transparent, rgba(180, 130, 40, 0.22) 20%, rgba(180, 130, 40, 0.22) 80%, transparent);
          flex-shrink: 0;
          margin: 4px 0;
        }

        .activity-capsule-detail-skin-aware__col-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-left: 22px;
          min-height: 0;
        }
        
        .activity-capsule-detail-skin-aware__header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 0;
          padding-bottom: 6px;
        }
        
        .activity-capsule-detail-skin-aware__poi {
          flex-shrink: 0;
        }
        
        .activity-capsule-detail-skin-aware__poi-svg {
          display: block;
        }
        
        .activity-capsule-detail-skin-aware__activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .activity-capsule-detail-skin-aware__name {
          font-family: var(--detail-name-font);
          font-size: var(--detail-name-font-size);
          font-weight: 700;
          color: var(--detail-name-color);
          line-height: 1.15;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          text-shadow:
            0 0 18px rgba(200, 155, 45, 0.40),
            0 0 40px rgba(200, 155, 45, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.70);
          background: linear-gradient(
            160deg,
            rgba(245, 210, 95, 1) 0%,
            rgba(215, 165, 50, 1) 45%,
            rgba(175, 120, 20, 1) 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .activity-capsule-detail-skin-aware__type {
          font-family: var(--detail-type-font);
          font-size: var(--detail-type-font-size);
          font-weight: 400;
          color: var(--detail-type-color);
          font-style: italic;
        }
        
        .activity-capsule-detail-skin-aware__subtitle {
          font-family: var(--detail-type-font);
          font-size: var(--detail-type-font-size);
          color: var(--detail-text-secondary);
          margin-top: 2px;
        }
        
        .activity-capsule-detail-skin-aware__status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
        }
        
        .activity-capsule-detail-skin-aware__status-dot {
          width: var(--detail-status-dot-size);
          height: var(--detail-status-dot-size);
          border-radius: 50%;
          background: var(--detail-status-color);
          flex-shrink: 0;
        }
        
        .activity-capsule-detail-skin-aware__status-text {
          font-family: var(--detail-status-font);
          font-size: var(--detail-status-font-size);
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--detail-status-color);
        }
        
        .activity-capsule-detail-skin-aware__ornament {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
        }
        
        .activity-capsule-detail-skin-aware__ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(180, 130, 40, 0.28), transparent);
        }
        
        .activity-capsule-detail-skin-aware__ornament-center {
          width: 4px;
          height: 4px;
          background: rgba(200, 155, 50, 0.4);
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        
        .activity-capsule-detail-skin-aware__info-row {
          display: flex;
          gap: 0;
          margin-bottom: 4px;
        }
        
        .activity-capsule-detail-skin-aware__info-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 10px;
          position: relative;
        }
        
        .activity-capsule-detail-skin-aware__info-item + .activity-capsule-detail-skin-aware__info-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(180, 130, 40, 0.2), transparent);
        }
        
        .activity-capsule-detail-skin-aware__info-label {
          font-family: var(--detail-primary-font);
          font-size: 7px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--detail-text-tertiary);
        }
        
        .activity-capsule-detail-skin-aware__info-value {
          font-family: var(--detail-primary-font);
          font-size: 13px;
          font-weight: 600;
          color: var(--detail-text-primary);
        }
        
        .activity-capsule-detail-skin-aware__slot-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .activity-capsule-detail-skin-aware__section-label {
          font-family: var(--detail-primary-font);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--detail-text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .activity-capsule-detail-skin-aware__section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(180, 130, 40, 0.2), transparent);
        }

        .activity-capsule-detail-skin-aware__slot-rack {
          max-width: 100%;
        }

        .activity-capsule-detail-skin-aware__slot-rack > div {
          max-width: 100%;
        }

        .activity-capsule-detail-skin-aware__slot-rack .slot-v12__halo {
          opacity: 0.35 !important;
          filter: blur(10px) !important;
        }

        .activity-capsule-detail-skin-aware__requirements {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .activity-capsule-detail-skin-aware__slot--ghost {
          opacity: 0.45;
          animation: ghost-pulse 2.8s ease-in-out infinite;
        }
        
        .activity-capsule-detail-skin-aware__slot-svg {
          display: block;
        }
        
        .activity-capsule-detail-skin-aware__telemetry {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-log {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
          max-height: 120px;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-log::-webkit-scrollbar {
          width: 2px;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-log::-webkit-scrollbar-thumb {
          background: rgba(180, 130, 40, 0.18);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry {
          display: flex;
          gap: 8px;
          align-items: baseline;
          font-size: 10px;
          line-height: 1.4;
          padding: 3px 6px;
          border-left: 1.5px solid transparent;
          border-radius: 0 1px 1px 0;
          transition: background 0.12s;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry:hover {
          background: rgba(255, 200, 60, 0.03);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry--assign {
          border-left-color: rgba(210, 148, 28, 0.65);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry--start {
          border-left-color: rgba(255, 200, 60, 0.65);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry--done {
          border-left-color: rgba(60, 180, 80, 0.65);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry--detach {
          border-left-color: rgba(180, 130, 40, 0.35);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-entry--reject {
          border-left-color: rgba(200, 60, 40, 0.65);
        }
        
        .activity-capsule-detail-skin-aware__telemetry-time {
          font-family: var(--detail-primary-font);
          font-size: 8px;
          color: var(--detail-text-tertiary);
          flex-shrink: 0;
          letter-spacing: 0.03em;
          min-width: 28px;
          font-variant-numeric: tabular-nums;
        }

        .activity-capsule-detail-skin-aware__telemetry-message {
          color: var(--detail-text-secondary);
          font-style: normal;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-message em {
          color: var(--detail-text-primary);
          font-style: normal;
        }
        
        .activity-capsule-detail-skin-aware__telemetry-empty {
          font-size: 10px;
          font-style: italic;
          color: var(--detail-text-tertiary);
          opacity: 0.28;
          padding: 4px 6px;
        }
        
        .activity-capsule-detail-skin-aware__cta-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .activity-capsule-detail-skin-aware__button {
          flex: 1;
          padding: var(--detail-button-padding);
          font-family: var(--detail-button-font);
          font-size: var(--detail-button-font-size);
          font-weight: 600;
          color: var(--detail-button-color);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: var(--detail-button-border);
          border-radius: var(--detail-button-border-radius);
          cursor: pointer;
          transition: all 0.16s ease;
          position: relative;
          overflow: hidden;
        }
        
        .activity-capsule-detail-skin-aware__button::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
          transition: left 0.3s;
        }
        
        .activity-capsule-detail-skin-aware__button:hover::after {
          left: 100%;
        }
        
        .activity-capsule-detail-skin-aware__button--start {
          background: var(--detail-start-button-background);
          border-color: var(--detail-start-button-border);
          color: var(--detail-start-button-color);
          box-shadow: 0 2px 10px rgba(160, 90, 8, 0.28), inset 0 1px 0 rgba(255, 218, 95, 0.14);
        }
        
        .activity-capsule-detail-skin-aware__button--cancel {
          background: var(--detail-cancel-button-background);
          border-color: var(--detail-cancel-button-border);
          color: var(--detail-cancel-button-color);
        }
        
        .activity-capsule-detail-skin-aware__button--collect {
          background: var(--detail-collect-button-background);
          border-color: var(--detail-collect-button-border);
          color: var(--detail-collect-button-color);
          box-shadow: 0 0 14px rgba(58, 178, 78, 0.18);
        }
        
        .activity-capsule-detail-skin-aware__button:disabled {
          opacity: var(--detail-button-disabled-opacity);
          cursor: not-allowed;
        }
        
        .activity-capsule-detail-skin-aware__validation-errors {
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
        
        .activity-capsule-detail-skin-aware__validation-error-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .activity-capsule-detail-skin-aware__validation-error {
          font-size: 9px;
          line-height: 1.2;
        }
        
        /* Animations */
        @keyframes ghost-pulse {
          0%, 100% { opacity: 0.22; }
          50% { opacity: 0.40; }
        }
        
        @keyframes slot-appear {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        /* Motion level adaptations */
        .activity-capsule-detail-skin-aware--motion-minimal {
          animation: none;
          transition: none;
        }
        
        .activity-capsule-detail-skin-aware--motion-minimal .activity-capsule-detail-skin-aware__slot {
          transform: none !important;
        }
        
        .activity-capsule-detail-skin-aware--motion-reduced {
          animation-duration: 0.1s;
          transition-duration: 0.1s;
        }
        
        /* High contrast mode */
        .activity-capsule-detail-skin-aware--high-contrast {
          border: 2px solid;
        }
        
        .activity-capsule-detail-skin-aware--high-contrast:focus {
          outline: var(--detail-focus-indicator-style);
          outline-offset: 2px;
        }
      `}</style>
      
      {/* Inject slot skin CSS when available */}
      {slotSkin && (
        <style dangerouslySetInnerHTML={{ __html: slotSkin.cssStyles }} />
      )}
    </div>
    </WanderlustSurface>
  );

  if (inlineMode) return surface;

  return (
    // Outer div: static centering only
    <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
      <div style={{ position: 'relative' }}>
        {/* Ghost drag tracker — invisible, Framer Motion writes rawX/rawY directly */}
        {enableDrag && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            style={{
              x: heavyDrag.rawX,
              y: heavyDrag.rawY,
              position: 'absolute',
              inset: 0,
              opacity: 0,
              zIndex: 2,
              pointerEvents: 'none',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onDragStart={heavyDrag.onDragStart}
            onDragEnd={heavyDrag.onDragEnd}
          />
        )}
        {/* Visual element — spring-lagged behind ghost = "lifting with effort" feel */}
        <motion.div
          style={{ x: heavyDrag.x, y: heavyDrag.y, cursor: 'default' }}
          animate={{
            scale: heavyDrag.isDragging ? 1.05 : 1,
            boxShadow: heavyDrag.isDragging
              ? '0 24px 48px rgba(0, 0, 0, 0.8), 0 12px 24px rgba(0, 0, 0, 0.6)'
              : '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          transition={{
            scale: { duration: 0.2, ease: 'easeOut' },
            boxShadow: { duration: 0.2, ease: 'easeOut' },
          }}
        >
          {surface}
        </motion.div>
      </div>
    </div>
  );
}

export default ActivityCapsuleDetailSkinAware;
