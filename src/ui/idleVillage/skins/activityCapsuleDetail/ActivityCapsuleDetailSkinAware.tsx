/**
 * WL-STY-011: ActivityCapsuleDetail Skin-Aware Component (TS-Series Integration)
 * 
 * Advanced ActivityCapsuleDetail component with full TS-Series skin system integration.
 * Provides window management, POI visualization, slot rack, telemetry, and CTA
 * with comprehensive theming and performance optimization.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TFunction } from 'i18next';
import { motion, useDragControls } from 'framer-motion';
import { useHeavyDrag } from '@/ui/wanderlust-surface/useHeavyDrag';
import { useSkinSystem } from '../../hooks/useSkinSystem';
import { ResidentSlotRack } from '../../components/ResidentSlotRack';
import type { ResidentSlotViewModel, SlotBloomState, DropState, SlotActivityState } from '../../slots/types';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import type { StatRequirementRow } from '../../utils/statRequirementDisplay';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
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
import { useQuestLoreDrop } from '@/ui/idleVillage/hooks/useQuestLoreDrop';
import { useTranslation } from '@/localization/useTranslation';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../types/SkinSchema';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { InsetPanel } from '@/ui/wanderlust-surface/InsetPanel';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
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
  /** Visual profile ids carried through so the slot rack resolves the
   *  assigned resident's REAL portrait (not the default) after remapping. */
  visualProfileId?: string;
  statProfileId?: string;
  /** Live drop-validation state for the currently-dragged token. Drives the
   *  shared AAA bloom on the slot; defaults to 'idle' when no drag is active. */
  dropState?: DropState;
  /** Semantic role of this slot (e.g. 'combatant', 'support'), forwarded from ResidentSlotBlueprint. */
  role?: string;
  /** Human-readable label for the role, shown instead of the generic "Slot N". */
  roleLabel?: string;
  /** Whether this slot must be filled before the activity can start. */
  required?: boolean;
}

/**
 * Maps ActivityDetailSlotData to ResidentSlotViewModel for ResidentSlotRack integration.
 * This is a simplified mapper for POI detail context; full resident state is not available.
 */
function mapToResidentSlotViewModel(
  slot: ActivityDetailSlotData,
  index: number,
  t: TFunction<'idleVillage'>
): ResidentSlotViewModel {
  const isAssigned = slot.state !== 'empty' && slot.state !== 'ghost';

  const assignedResident: ResidentState | undefined = isAssigned
    ? ({
        id: slot.residentId ?? slot.id,
        displayName: slot.assignedWorkerName,
        portraitUrl: slot.assignedWorkerAvatarUrl,
        // Carry the visual profile ids so the rack resolves the REAL portrait
        // (branch 3 of resolveResidentPortrait) instead of the default one.
        visualProfileId: slot.visualProfileId,
        statProfileId: slot.statProfileId,
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

  // Live drop state flows in from the controller (via ActivityDetailSlotData).
  // Assigned slots read 'locked'; free slots read 'valid'/'invalid' during a
  // drag. This is what lets the bloom fire inside the skin-aware detail.
  const dropState: DropState = slot.dropState ?? 'idle';
  const bloomState: SlotBloomState = dropState === 'valid' ? 'valid' : 'idle';

  const baseLabel = slot.roleLabel ?? t('idleVillage:activityCapsule.slotLabel', { defaultValue: 'Slot {index}', index: index + 1 });
  const label = slot.required ? `${baseLabel} *` : baseLabel;

  return {
    id: slot.id,
    index,
    label,
    assignedResidentId: isAssigned ? (slot.residentId ?? slot.id) : null,
    assignedResident,
    isPlaceholder: false,
    dropState,
    bloomState,
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
  /** Resident currently being dragged, so the slot rack can render drop-target
   *  feedback (bloom + highlight) exactly like the standalone rack pages. */
  draggingResidentId?: string | null;
  /** Requirement rows derived from the activity's `statRequirement` (variable
   *  count; name/icon/color resolved from the Balancer stat catalog). When
   *  omitted the requirements panel is hidden. */
  requirements?: StatRequirementRow[];
  
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

  /** Optional slot rack overrides. Allows the page to control how slots are
   *  rendered and which activity state each slot reports. */
  getSlotActivityState?: (slotId: string) => SlotActivityState | null;
  resolveDisplayInfo?: (
    slot: ResidentSlotViewModel,
  ) => { icon?: string; label?: string; visualVariant?: VerbVisualVariant };

  /**
   * Explicit override for the Start/Embark button's disabled state (e.g. driven
   * by required-slot validation upstream). When omitted, falls back to the
   * legacy heuristic (disabled when there are no idle/open slots left).
   */
  startDisabled?: boolean;

  /**
   * Visual pending state for a start that has been requested while time is
   * paused and is waiting for the clock to resume before actually launching.
   */
  startPending?: boolean;
  
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

  /** POI medallion mirror: the icon of the POI that opens this detail, so the
   *  header circle reproduces the EXACT same POI (same halo fill = `progress`).
   *  Defaults to a star if the opening context isn't provided. */
  poiIcon?: string;

  /** Tags used to match a quest Lore Drop for this POI. When provided and the
   *  activity type is 'quest', the component will show the assigned Lore Drop. */
  questTags?: string[];
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
  draggingResidentId,
  requirements,
  durationDisplay,
  rewardDisplay,
  etaDisplay,
  telemetry,
  onStart,
  onCancel,
  onCollect,
  onSlotAssign,
  onSlotDetach,
  getSlotActivityState: getSlotActivityStateProp,
  resolveDisplayInfo: resolveDisplayInfoProp,
  startDisabled,
  startPending,
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
  poiIcon = '⭐',
  questTags,
}: ActivityCapsuleDetailSkinAwareProps) {
  const { t } = useTranslation('idleVillage');
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
    if (slotBinding?.skinProperties) {
      return mergeActivityCapsuleDetailSkinConfig(
        baseSkinConfig,
        slotBinding.skinProperties as unknown as Partial<ActivityCapsuleDetailSkinConfig>
      );
    }
    return baseSkinConfig;
  }, [baseSkinConfig, slotBinding?.skinProperties]);
  
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

  // Floating position: the consumer supplies a top-left coordinate (usually the
  // clicked POI center, clamped to viewport). When no position is provided, the
  // panel falls back to center of the screen.
  const floatingLeft = position?.x ?? '50%';
  const floatingTop = position?.y ?? '50%';
  const usePositionedFloating = position !== undefined;

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
  const statusStyles = useMemo((): React.CSSProperties & Record<string, string> => {
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
    return slots.map((slot, index) => mapToResidentSlotViewModel(slot, index, t));
  }, [slots, t]);

  // Resolve slot size from skin config for detail layouts
  const slotSizePx = useMemo(() => {
    const parsed = parseInt(skinConfig.slotRack.slotSize, 10);
    return Number.isNaN(parsed) ? 80 : parsed;
  }, [skinConfig.slotRack.slotSize]);

  // Quest POIs can expose their assigned Lore Drop in the detail panel.
  const isQuestType = type === 'quest';
  const typeLabel = t('idleVillage:activityCapsule.type.' + type as any, { defaultValue: type });
  const questLore = useQuestLoreDrop({
    entityId: isQuestType ? activityId : null,
    entityType: 'quest',
    tags: questTags,
    completed: status === 'completed',
  });

  // Resolve display info for slot icons
  const resolveDisplayInfoDefault = useCallback((slot: ResidentSlotViewModel) => {
    const originalSlot = slots.find(s => s.id === slot.id);
    return {
      icon: originalSlot?.initial || '☆',
      label: slot.label,
    };
  }, [slots]);

  // Map slot activity state for ResidentSlotRack
  const getSlotActivityStateDefault = useCallback((slotId: string) => {
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
        aria-label={ariaLabel || t('idleVillage:activityCapsule.accessibility.activityCapsule', { defaultValue: '{label} activity capsule', label: name })}
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
        {enableDrag && (
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
            aria-label={t('idleVillage:activityCapsule.accessibility.closeDetails')}
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
            {/* POI — the EXACT same medallion that opens this detail, reproduced
                here with the same `progress` so both halos fill together. */}
            <div className="activity-capsule-detail-skin-aware__poi">
              {(() => {
                const poiSizePx = parseInt(skinConfig.poi.poiSize) || 60;
                return (
                  <GenericPoiSkin
                    icon={poiIcon}
                    progress={progress}
                    size={poiSizePx}
                    pillar={resolvedPillar === 'empire' ? 'empire' : 'wilderness'}
                    enableHover={false}
                  />
                );
              })()}
            </div>
            
            {/* Activity info */}
            <div className="activity-capsule-detail-skin-aware__activity-info">
              <h2 className="activity-capsule-detail-skin-aware__name">{name}</h2>
              <div className="activity-capsule-detail-skin-aware__type">{typeLabel}</div>
              {subtitle && (
                <div className="activity-capsule-detail-skin-aware__subtitle">{subtitle}</div>
              )}
              <div className="activity-capsule-detail-skin-aware__status">
                <div className="activity-capsule-detail-skin-aware__status-dot" />
                <span className="activity-capsule-detail-skin-aware__status-text">
                  {status === 'idle' && t('idleVillage:activityCapsule.status.idle')}
                  {status === 'in-progress' && t('idleVillage:activityCapsule.status.inProgress')}
                  {status === 'completed' && t('idleVillage:activityCapsule.status.completed')}
                  {status === 'blocked' && t('idleVillage:activityCapsule.status.blocked')}
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

          {/* Lore Drop — assigned quest fragment */}
          {isQuestType && questLore.loreDrop && (
            <div className="activity-capsule-detail-skin-aware__lore">
              <div className="activity-capsule-detail-skin-aware__section-label">
                {t('idleVillage:activityCapsule.sections.lore')}
              </div>
              <InsetPanel
                style={{
                  padding: '12px 14px',
                  background: 'var(--skin-inset-bg, #060f16)',
                  border: '1px solid var(--skin-inset-border, rgba(223,184,87,0.5))',
                  borderRadius: 'var(--skin-inset-radius, 10px)',
                }}
              >
                <div className="activity-capsule-detail-skin-aware__lore-title">
                  {questLore.loreDrop.title}
                  {!questLore.isDiscovered && (
                    <span style={{ marginLeft: 8, fontSize: '0.85em', opacity: 0.6 }}>
                      🔒
                    </span>
                  )}
                </div>
                {questLore.isDiscovered ? (
                  <div className="activity-capsule-detail-skin-aware__lore-body">
                    {questLore.loreDrop.body}
                  </div>
                ) : (
                  <div className="activity-capsule-detail-skin-aware__lore-locked">
                    {t('idleVillage:activityCapsule.lore.locked')}
                  </div>
                )}
              </InsetPanel>
            </div>
          )}

          {/* Slot rack */}
          {showSlots && (
            <div className="activity-capsule-detail-skin-aware__slot-section">
              <div className="activity-capsule-detail-skin-aware__section-label">
                {t('idleVillage:activityCapsule.sections.assignedCharacters')}
              </div>
              {/* overflow visible so the slots' AAA bloom (drop-shadow halo)
                  isn't clipped by the inset — matches the standalone rack pages. */}
              <InsetPanel style={{ overflow: 'visible' }}>
                <ResidentSlotRack
                  slots={residentSlots}
                  layout="detail"
                  overflowBehavior="scroll"
                  draggingResidentId={draggingResidentId}
                  resolveDisplayInfo={resolveDisplayInfoProp ?? resolveDisplayInfoDefault}
                  getSlotActivityState={getSlotActivityStateProp ?? getSlotActivityStateDefault}
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
                type="button"
                data-testid="poi-detail-start-button"
                className={[
                  'activity-capsule-detail-skin-aware__button',
                  'activity-capsule-detail-skin-aware__button--start',
                  startPending ? 'activity-capsule-detail-skin-aware__button--start-pending' : '',
                ].filter(Boolean).join(' ')}
                onClick={onStart}
                disabled={startDisabled ?? false}
              >
                {startPending
                  ? t('idleVillage:activityCapsule.actions.startPending')
                  : t('idleVillage:activityCapsule.actions.start')}
              </button>
            )}
            {status === 'in-progress' && onCancel && (
              <button
                className="activity-capsule-detail-skin-aware__button activity-capsule-detail-skin-aware__button--cancel"
                onClick={onCancel}
              >
                {t('idleVillage:activityCapsule.actions.cancel')}
              </button>
            )}
            {status === 'completed' && onCollect && (
              <button
                className="activity-capsule-detail-skin-aware__button activity-capsule-detail-skin-aware__button--collect"
                onClick={onCollect}
              >
                {t('idleVillage:activityCapsule.actions.collect')}
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
                <div className="activity-capsule-detail-skin-aware__info-label">{t('idleVillage:activityCapsule.info.duration')}</div>
                <div className="activity-capsule-detail-skin-aware__info-value">{durationDisplay}</div>
              </div>
              <div className="activity-capsule-detail-skin-aware__info-item">
                <div className="activity-capsule-detail-skin-aware__info-label">{t('idleVillage:activityCapsule.info.reward')}</div>
                <div className="activity-capsule-detail-skin-aware__info-value">{rewardDisplay}</div>
              </div>
              <div className="activity-capsule-detail-skin-aware__info-item">
                <div className="activity-capsule-detail-skin-aware__info-label">{t('idleVillage:activityCapsule.info.eta')}</div>
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

          {/* Requirements — derived from the activity's statRequirement (variable
              count). Name/icon/color per stat come from the Balancer catalog. */}
          {requirements && requirements.length > 0 && (
            <div className="activity-capsule-detail-skin-aware__requirements">
              <div className="activity-capsule-detail-skin-aware__section-label">
                {t('idleVillage:activityCapsule.sections.requirements')}
              </div>
              <InsetPanel
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px 14px',
                  background: 'var(--skin-inset-bg, #060f16)',
                  border: '1px solid var(--skin-inset-border, rgba(223,184,87,0.5))',
                  borderRadius: 'var(--skin-inset-radius, 10px)',
                }}
              >
                {requirements.map((req) => {
                  const relationMeta = {
                    all: { label: t('idleVillage:activityCapsule.requirements.relation.all', { defaultValue: 'Required' }), color: 'var(--skin-status-met, #7bc96f)' },
                    any: { label: t('idleVillage:activityCapsule.requirements.relation.any', { defaultValue: 'One of' }), color: 'var(--skin-title-color, #f0cf6a)' },
                    none: { label: t('idleVillage:activityCapsule.requirements.relation.none', { defaultValue: 'Forbidden' }), color: 'var(--skin-status-unmet, #d98a4a)' },
                  }[req.relation];
                  const Icon = getStatIconComponent(req.icon);
                  const isColorClass = !!req.bgColor && /^(bg|text)-/.test(req.bgColor);
                  const isColorValue = !!req.bgColor && /^(#|rgb|hsl|oklch)/.test(req.bgColor);
                  return (
                    <span
                      key={req.key}
                      className={isColorClass ? req.bgColor : undefined}
                      title={`${req.label} — ${relationMeta.label}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '5px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        lineHeight: 1,
                        color: 'var(--skin-text-primary, #f5f2e8)',
                        background: isColorValue
                          ? req.bgColor
                          : isColorClass
                            ? undefined
                            : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${relationMeta.color}`,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          width: 15,
                          height: 15,
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: relationMeta.color,
                          fontSize: '13px',
                        }}
                      >
                        {Icon ? <Icon size={13} /> : req.icon ?? '◆'}
                      </span>
                      <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>{req.label}</span>
                      {req.numeric && (
                        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
                          {req.numeric.operator} {req.numeric.value}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.16em',
                          color: relationMeta.color,
                          opacity: 0.9,
                        }}
                      >
                        {relationMeta.label}
                      </span>
                    </span>
                  );
                })}
              </InsetPanel>
            </div>
          )}

          {/* Telemetry */}
          {showTelemetry && (
            <div className="activity-capsule-detail-skin-aware__telemetry">
              <div className="activity-capsule-detail-skin-aware__section-label">
                {t('idleVillage:activityCapsule.sections.telemetry')}
              </div>
              <div className="activity-capsule-detail-skin-aware__telemetry-log">
                {telemetry.length === 0 ? (
                  <div className="activity-capsule-detail-skin-aware__telemetry-empty">
                    {t('idleVillage:activityCapsule.telemetry.empty')}
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
            {t('idleVillage:activityCapsule.devTools.validationTitle', { defaultValue: 'Skin Validation Errors' })}
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

        /* An open detail panel must NOT grow on hover — kill the generic
           .ws-root--interactive hover scale for this surface only. Drag/lift
           feedback still comes from the framer-motion wrapper. */
        .activity-capsule-detail-surface.ws-root--interactive:hover {
          transform: none;
        }

        /* ── Inherit the global V9 Obsidian default skin ──
           The --detail-* tokens are applied INLINE via cssVars, so we override
           the key ones with !important (stylesheet !important beats inline).
           Obsidian base (#060f16) + azure light leak + gold accents + ivory text. */
        .activity-capsule-detail-surface.ws-root {
          --detail-frame-gradient:
            radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%),
            var(--skin-surface-base, #060f16) !important;
          --detail-window-background: var(--skin-surface-base, #060f16) !important;
          --detail-text-primary: var(--skin-text-primary, #f5f2e8) !important;
          --detail-text-secondary: var(--skin-text-secondary, rgba(245,242,232,0.70)) !important;
          --detail-text-tertiary: var(--skin-text-muted, rgba(245,242,232,0.50)) !important;
          --detail-name-color: var(--skin-title-color, #f0cf6a) !important;
          --detail-type-color: var(--skin-label-tertiary, #9a8246) !important;
          --detail-initials-color: var(--skin-text-primary, #f5f2e8) !important;
        }
        /* base fill = obsidian + azure leak (over any warm veil) */
        .activity-capsule-detail-surface .activity-capsule-detail-skin-aware__background {
          background:
            radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%),
            var(--skin-surface-base, #060f16) !important;
        }
        /* slot rack + requisiti panels → obsidian inset with gold trim */
        .activity-capsule-detail-surface .activity-capsule-detail-skin-aware__requirements,
        .activity-capsule-detail-surface .activity-capsule-detail-skin-aware__info-row {
          --slot-rack-slot-bg: var(--skin-inset-bg, #060f16);
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
          top: var(--skin-close-offset, 12px);
          right: var(--skin-close-offset, 12px);
          width: var(--skin-close-size, 34px);
          height: var(--skin-close-size, 34px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--skin-close-bg);
          border: var(--skin-close-border);
          border-radius: var(--skin-close-radius, 50%);
          box-shadow: var(--skin-close-shadow);
          cursor: pointer;
          color: var(--skin-close-color);
          font-size: 1.15rem;
          font-weight: 300;
          line-height: 1;
          transition: color 0.15s, filter 0.18s;
          z-index: 11;
          font-family: var(--detail-primary-font);
        }

        .activity-capsule-detail-skin-aware__close-button:hover {
          color: var(--skin-close-hover-color);
          filter: brightness(1.25);
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

        .activity-capsule-detail-skin-aware__lore {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .activity-capsule-detail-skin-aware__lore-title {
          font-family: var(--detail-primary-font);
          font-size: 12px;
          font-weight: 600;
          color: var(--detail-name-color, #f0cf6a);
          line-height: 1.5;
          margin-bottom: 6px;
        }

        .activity-capsule-detail-skin-aware__lore-body {
          font-family: var(--detail-primary-font);
          font-size: 11px;
          color: var(--detail-text-primary);
          line-height: 1.6;
          font-style: italic;
        }

        .activity-capsule-detail-skin-aware__lore-locked {
          font-family: var(--detail-primary-font);
          font-size: 11px;
          color: var(--detail-text-secondary);
          line-height: 1.6;
          font-style: italic;
          opacity: 0.7;
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
        
        /* ── Inherit the global default skin (--skin-* tokens) so the detail
           buttons match the rest of the app regardless of skin-system
           resolution. Avvia = CTA plaque, Annulla = engraved secondary. ── */
        .activity-capsule-detail-skin-aware__button--start {
          background: var(--skin-cta-bg);
          border: var(--skin-cta-border);
          color: var(--skin-cta-color);
          clip-path: var(--skin-cta-clip);
          border-radius: 0;
          box-shadow: var(--skin-cta-shadow);
          text-shadow: var(--skin-cta-text-shadow);
          letter-spacing: 0.28em;
        }
        .activity-capsule-detail-skin-aware__button--start:hover {
          filter: var(--skin-cta-hover-filter);
          box-shadow: var(--skin-cta-hover-glow);
        }
        .activity-capsule-detail-skin-aware__button--start-pending {
          background: var(--skin-cta-hover-glow, rgba(160, 90, 8, 0.45));
          box-shadow: 0 0 16px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255, 218, 95, 0.2);
          animation: activity-capsule-detail-skin-aware__button-pulse 1.6s ease-in-out infinite;
        }
        .activity-capsule-detail-skin-aware__button--cancel {
          background: var(--skin-btn2-bg);
          border: var(--skin-btn2-border);
          color: var(--skin-btn2-color);
          box-shadow: var(--skin-btn2-shadow);
          text-shadow: var(--skin-incision-label);
        }
        .activity-capsule-detail-skin-aware__button--cancel:hover {
          filter: brightness(1.12);
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
        
        @keyframes activity-capsule-detail-skin-aware__button-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
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
    // Outer div: fixed positioning — uses the provided position when available,
    // otherwise centers on the screen. The motion.div inside adds the spring-lag.
    <div style={{ position: 'fixed', left: floatingLeft, top: floatingTop, transform: usePositionedFloating ? 'translate(0, 0)' : 'translate(-50%, -50%)', zIndex: 1000 }}>
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
