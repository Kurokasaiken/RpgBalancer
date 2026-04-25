/**
 * WL-STY-011: ActivityCapsuleDetail Skin-Aware Component (TS-Series Integration)
 * 
 * Advanced ActivityCapsuleDetail component with full TS-Series skin system integration.
 * Provides window management, POI visualization, slot rack, telemetry, and CTA
 * with comprehensive theming and performance optimization.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSkinSystem } from '../../hooks/useSkinSystem';
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
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../types/SkinSchema';

// Slot data interface
export interface ActivityDetailSlotData {
  id: string;
  state: 'empty' | 'ghost' | 'idle' | 'active' | 'done' | 'locked';
  initial: string;
  progress: number;
  assignedWorkerName?: string;
  assignedWorkerAvatarUrl?: string;
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
    return getActivityCapsuleDetailSkinConfig(resolvedPillar, {
      presetId: resolvedPresetId,
      pillar: resolvedPillar,
      motionLevel: resolvedMotionLevel,
      ...skinConfigOverride,
    });
  }, [
    resolvedPillar,
    resolvedPresetId,
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
  
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState(position || { x: 0, y: 0 });
  const [validationErrors, setValidationErrors] = useState<SkinValidationResult | null>(null);
  const [currentConfig, setCurrentConfig] = useState(skinConfig);
  
  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (inlineMode || !enableDrag || !dragHandleRef.current || !windowRef.current) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragOffset({
      x: e.clientX - centerX,
      y: e.clientY - centerY,
    });
    
    setIsDragging(true);
    e.preventDefault();
  }, [enableDrag]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !windowRef.current) return;
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const windowEl = windowRef.current;
    const windowWidth = windowEl.offsetWidth;
    const windowHeight = windowEl.offsetHeight;
    
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport
    newX = Math.max(windowWidth / 2, Math.min(vw - windowWidth / 2, newX));
    newY = Math.max(windowHeight / 2, Math.min(vh - windowHeight / 2, newY));
    
    setWindowPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Global mouse event listeners
  useEffect(() => {
    if (isDragging && !inlineMode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
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

  const windowStyle: React.CSSProperties = {
    ...cssVars,
    ...statusStyles,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'all' : 'none',
    ...(inlineMode
      ? {
          position: 'relative',
          left: 'auto',
          top: 'auto',
          transform: 'none',
          margin: '0 auto',
          maxWidth: 'min(100%, var(--detail-window-width))',
        }
      : {
          left: windowPosition.x ? `${windowPosition.x}px` : '50%',
          top: windowPosition.y ? `${windowPosition.y}px` : '50%',
          transform:
            windowPosition.x || windowPosition.y
              ? 'translate(-50%, -50%)'
              : 'translate(-50%, -50%) scale(0.9)',
        }),
  };
  
  return (
    <div
      className={windowClasses}
      data-testid={dataTestId}
      data-activity-id={activityId}
      data-status={status}
      data-pillar={resolvedPillar}
      data-preset={resolvedPresetId}
      data-motion-level={resolvedMotionLevel}
      data-skin-binding-id={skinBindingId}
      style={windowStyle}
      aria-label={ariaLabel || `${name} activity detail window`}
      aria-live={skinConfig.accessibility.enableAriaLive ? ariaLive : 'off'}
    >
      {/* Window frame */}
      <div className="activity-capsule-detail-skin-aware__frame">
        {/* Window background with gradients */}
        <div className="activity-capsule-detail-skin-aware__background" />
        
        {/* Window decorations */}
        <div className="activity-capsule-detail-skin-aware__decorations">
          <div className="activity-capsule-detail-skin-aware__corners" />
          <div className="activity-capsule-detail-skin-aware__ambient-glow" />
        </div>
        
        {/* Drag handle */}
        {enableDrag && !inlineMode && (
          <div
            ref={dragHandleRef}
            className="activity-capsule-detail-skin-aware__drag-handle"
            onMouseDown={handleMouseDown}
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
        <div className="activity-capsule-detail-skin-aware__content">
          {/* Header */}
          <div className="activity-capsule-detail-skin-aware__header">
            {/* POI */}
            <div className="activity-capsule-detail-skin-aware__poi">
              <svg
                width={skinConfig.poi.poiSize}
                height={skinConfig.poi.poiSize}
                viewBox={`-${parseInt(skinConfig.poi.poiSize) / 2} -${parseInt(skinConfig.poiSize) / 2} ${skinConfig.poi.poiSize} ${skinConfig.poi.poiSize}`}
                className="activity-capsule-detail-skin-aware__poi-svg"
              >
                {/* POI SVG implementation would go here */}
                <circle
                  cx="0"
                  cy="0"
                  r="20"
                  fill="var(--detail-cavity-gradient)"
                  stroke="var(--detail-crown-border)"
                  strokeWidth="2"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="16"
                  fill="var(--detail-core-gradient)"
                  stroke="var(--detail-progress-ring-gradient)"
                  strokeWidth="3"
                  strokeDasharray={`${Math.PI * 2 * progress} ${Math.PI * 2 * (1 - progress)}`}
                  transform="rotate(-90)"
                />
              </svg>
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
          
          {/* Ornament divider */}
          <div className="activity-capsule-detail-skin-aware__ornament">
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
            <div className="activity-capsule-detail-skin-aware__ornament-center" />
            <div className="activity-capsule-detail-skin-aware__ornament-line" />
          </div>
          
          {/* Info row */}
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
          
          {/* Second ornament */}
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
              <div className="activity-capsule-detail-skin-aware__slot-rack">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`activity-capsule-detail-skin-aware__slot activity-capsule-detail-skin-aware__slot--${slot.state}`}
                    onClick={() => {
                      if (slot.state === 'empty' || slot.state === 'ghost') {
                        onSlotAssign?.(slot.id);
                      } else if (slot.state === 'idle') {
                        onSlotDetach?.(slot.id);
                      }
                    }}
                  >
                    {slotSkin ? (
                      // Use slot skin SVG template
                      <div 
                        className="activity-capsule-detail-skin-aware__slot-skin"
                        dangerouslySetInnerHTML={{ __html: slotSkin.htmlTemplate }}
                      />
                    ) : (
                      // Fallback to generic SVG
                      <svg
                        width={skinConfig.slotRack.slotSize}
                        height={skinConfig.slotRack.slotSize}
                        viewBox={`-${parseInt(skinConfig.slotRack.slotSize) / 2} -${parseInt(skinConfig.slotRack.slotSize) / 2} ${skinConfig.slotRack.slotSize} ${skinConfig.slotRack.slotSize}`}
                        className="activity-capsule-detail-skin-aware__slot-svg"
                      >
                        {/* Slot SVG implementation */}
                        <circle
                          cx="0"
                          cy="0"
                          r="20"
                          fill="var(--detail-cavity-gradient)"
                          stroke="var(--detail-cavity-border)"
                          strokeWidth="1"
                        />
                        {slot.state !== 'empty' && slot.state !== 'ghost' && (
                          <>
                            <circle
                              cx="0"
                              cy="0"
                              r="16"
                              fill="var(--detail-medal-gradient)"
                              stroke="var(--detail-medal-border)"
                              strokeWidth="2"
                            />
                            <text
                              x="0"
                              y="4"
                              textAnchor="middle"
                              fill="var(--detail-initials-color)"
                              fontSize="var(--detail-initials-font-size)"
                              fontFamily="var(--detail-initials-font)"
                              fontWeight="600"
                            >
                              {slot.initial}
                            </text>
                          </>
                        )}
                        {(slot.state === 'active' || slot.state === 'locked') && (
                          <circle
                            cx="0"
                            cy="0"
                            r="24"
                            fill="none"
                            stroke="var(--detail-slot-progress-gradient)"
                            strokeWidth="3"
                            strokeDasharray={`${Math.PI * 2 * slot.progress} ${Math.PI * 2 * (1 - slot.progress)}`}
                            transform="rotate(-90)"
                          />
                        )}
                      </svg>
                    )}
                  </div>
                ))}
              </div>
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
          
          {/* CTA buttons */}
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
        </div>
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
        
        .activity-capsule-detail-skin-aware__content {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: var(--detail-content-padding);
          gap: 16px;
          height: 100%;
          overflow: hidden;
        }
        
        .activity-capsule-detail-skin-aware__header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 4px;
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
          line-height: 1.2;
          letter-spacing: 0.05em;
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
          margin: 10px 0;
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
          font-size: 7.5px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--detail-text-tertiary);
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
          display: flex;
          gap: var(--detail-slot-gap);
          align-items: center;
          overflow-x: auto;
          overflow-y: visible;
          padding: 6px 2px 12px;
          scrollbar-width: none;
        }
        
        .activity-capsule-detail-skin-aware__slot-rack::-webkit-scrollbar {
          display: none;
        }
        
        .activity-capsule-detail-skin-aware__slot {
          flex-shrink: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform var(--detail-hover-animation-duration) ease;
        }
        
        .activity-capsule-detail-skin-aware__slot:hover {
          transform: scale(1.02);
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
        }
        
        .activity-capsule-detail-skin-aware__telemetry-message {
          color: var(--detail-text-secondary);
          font-style: italic;
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
  );
}

export default ActivityCapsuleDetailSkinAware;
