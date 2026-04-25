import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { useDroppable } from '@dnd-kit/core';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import type { LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { getSlotGlowConfig } from '@/ui/idleVillage/config/minimalFeedbackConfig';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { useAudioCueConfig } from '@/ui/idleVillage/hooks/useAudioCueConfig';
import { useHaptic } from '@/shared/haptic/useHaptic';
import { DropFeedbackContainer } from './DropFeedbackUI';
import { useActivitySlotTelemetry } from '@/ui/idleVillage/telemetry/hooks/useActivitySlotTelemetry';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StatModifierDisplay } from '@/ui/styleLab/components/StatModifierDisplay';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';
import { useSkinBinding } from '../hooks/useSkinBinding';
import { useSkinTelemetry } from '../hooks/useSkinTelemetry';
export type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
export type DropState = LocationDropState;

/**
 * Props for the enhanced activity slot with VerbCard-like behaviors.
 */
export interface ActivitySlotCardProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string | null;
  /** Optional portrait or avatar URL shown instead of initials when provided. */
  assignedWorkerAvatarUrl?: string | null;

  // Progress & Timer
  progressFraction: number; // 0 to 1
  elapsedSeconds: number;   // For timer display
  totalDuration: number;    // Total duration in seconds

  // Interaction
  isInteractive?: boolean;
  dropState?: DropState;
  canAcceptDrop?: boolean;
  visualVariant?: VerbVisualVariant;
  /** When true, slot is locked (e.g. night phase) - shows overlay and blocks interaction */
  isLockedByPhase?: boolean;
  /** Removes chrome/borders for token-like display (used by demo slots). */
  minimalChrome?: boolean;
  /**
   * When true, glow/bloom only appears for valid drops; invalid states fade alpha.
   * Useful for teaching slots where hover shouldn't trigger bloom.
   */
  highlightOnlyOnValidDrop?: boolean;
  /** Optional explicit test id for Playwright/RTL selectors. */
  testId?: string;

  // Drop Feedback
  /** Validation result for the last drop operation */
  validationResult?: DropValidationResult;
  /** Whether to show drop feedback */
  showDropFeedback?: boolean;

  // Callbacks
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
  onClick?: () => void;
  _onMouseEnter?: () => void;
  _onMouseLeave?: () => void;
  onHoverChange?: (slotId: string, isHovering: boolean) => void;
  onDropComplete?: (slotId: string, workerId: string | null) => void;
  onResidentDragEnter?: (slotId: string, residentId: string) => void;
  onResidentDragLeave?: (slotId: string) => void;
  /**
   * When true the slot renders the bloom/highlight even if no drag interaction is active.
   */
  isSelected?: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

type SlotGlowConfig = ReturnType<typeof getSlotGlowConfig>;
type SlotHighlightTokens = NonNullable<SlotGlowConfig['highlight']>;
type SlotVisualTokens = NonNullable<SlotGlowConfig['visuals']>;

const FALLBACK_SLOT_HIGHLIGHT: SlotHighlightTokens = {
  stabilizeMs: 0,
  focusScale: 1.04,
  hoverScale: 1.02,
  selectedScale: 1.05,
  invalidOpacity: 0.35,
  transitionMs: 200,
};

const FALLBACK_SLOT_VISUALS: SlotVisualTokens = {
  particlesEnabled: true,
  clampOverflow: true,
};

const formatTime = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VARIANT_COLORS: Record<VerbVisualVariant, { primary: string; glow: string }> = {
  azure: { primary: 'rgba(59, 130, 246, 0.55)', glow: 'rgba(59, 130, 246, 0.8)' },
  ember: { primary: 'rgba(251, 146, 60, 0.55)', glow: 'rgba(251, 146, 60, 0.8)' },
  jade: { primary: 'rgba(34, 197, 94, 0.55)', glow: 'rgba(34, 197, 94, 0.8)' },
  amethyst: { primary: 'rgba(168, 85, 247, 0.55)', glow: 'rgba(168, 85, 247, 0.8)' },
  solar: { primary: 'rgba(251, 191, 36, 0.55)', glow: 'rgba(251, 191, 36, 0.8)' },
};

const VARIANT_BLOOM_STYLE: Record<VerbVisualVariant, { glow: string; ring: string; fill: string }> = {
  azure: {
    glow: 'rgba(59,130,246,0.65)',
    ring: 'rgba(96,165,250,0.9)',
    fill: 'rgba(15,23,42,0.65)',
  },
  ember: {
    glow: 'rgba(239,68,68,0.65)',
    ring: 'rgba(248,113,113,0.95)',
    fill: 'rgba(67,20,7,0.55)',
  },
  jade: {
    glow: 'rgba(34,197,94,0.65)',
    ring: 'rgba(74,222,128,0.95)',
    fill: 'rgba(6,78,59,0.6)',
  },
  amethyst: {
    glow: 'rgba(168,85,247,0.65)',
    ring: 'rgba(216,180,254,0.95)',
    fill: 'rgba(76,29,149,0.58)',
  },
  solar: {
    glow: 'rgba(245,158,11,0.65)',
    ring: 'rgba(252,211,77,0.95)',
    fill: 'rgba(120,53,15,0.58)',
  },
};

/**
 * Enhanced activity slot with VerbCard-like progress, timer, and interaction states.
 */
const ActivitySlotCard: React.FC<ActivitySlotCardProps> = ({
  slotId,
  iconName,
  label,
  assignedWorkerName,
  assignedWorkerAvatarUrl,
  progressFraction,
  elapsedSeconds,
  totalDuration,
  isInteractive = false,
  dropState = 'idle',
  canAcceptDrop = true,
  visualVariant = 'azure',
  isLockedByPhase = false,
  minimalChrome = false,
  highlightOnlyOnValidDrop = false,
  testId,
  validationResult,
  showDropFeedback = false,
  onWorkerDrop,
  onInspect,
  onClick,
  _onMouseEnter,
  _onMouseLeave,
  onResidentDragEnter,
  onResidentDragLeave,
  isSelected = false,
}) => {
  // Skin binding integration
  const skinBinding = useSkinBinding({
    componentId: 'ActivitySlot',
    name: 'ActivitySlot',
    description: 'Interactive activity slot with progress and drop functionality',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'activity-slot',
    dataAttributePrefix: 'activity-slot',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    supportsPillarSwitching: true,
    requiredProperties: [],
    optionalProperties: ['progressFraction', 'dropState', 'isLocked', 'visualVariant'],
    category: 'interactive',
    priority: 3,
    tags: ['activity', 'slot', 'droppable'],
  }, {
    properties: {
      progressFraction,
      dropState,
      isLocked: isLockedByPhase,
      visualVariant,
    },
    onSkinChange: (skinData) => {
      // Track skin changes for telemetry
      if (skinData.isTransitioning) {
        // Track transition start
      }
    },
  });

  const { classes, attributes, styles } = skinBinding;
  const { trackComponentEvent } = useSkinTelemetry('ActivitySlot');

  const [isOver, setIsOver] = useState(false);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Initialize config-driven hooks
  const slotGlowConfig = getSlotGlowConfig();
  const highlightSettings = useMemo(() => slotGlowConfig.highlight ?? FALLBACK_SLOT_HIGHLIGHT, [slotGlowConfig.highlight]);
  const slotVisualSettings = useMemo(() => slotGlowConfig.visuals ?? FALLBACK_SLOT_VISUALS, [slotGlowConfig.visuals]);
  const _styleTokens = useMinimalStyleLabTokens(undefined); // Use undefined for default behavior
  const { playCue } = useAudioCueConfig();
  const { trigger: triggerHaptic } = useHaptic({
    preferences: {
      enabled: slotGlowConfig.enabled,
      intensity: 0.5,
      enabledPatterns: ['success', 'warning', 'error'],
    },
  });
  // TODO(style-lab-flexibility): wire interactionPhysics.mass/damping/shadowDepth into
  // Framer Motion spring transitions + dynamic shadows (pick-up overshoot 1.0→0.95→1.0)
  // once Style Lab tokens expose these presets.
  
  // Initialize dnd-kit droppable
  const { isOver: dndIsOver, setNodeRef } = useDroppable({
    id: slotId,
    disabled: isLockedByPhase || !canAcceptDrop,
    data: {
      type: 'activity-slot',
      slotId,
      canAcceptDrop,
    },
  });

  // Disabled native drop handler - force all drops through dnd-kit handleDragEnd with validation
  const handleNativeDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Do NOT call onWorkerDrop - let dnd-kit handleDragEnd process with validation
  };
  
  // Initialize telemetry hook (placeholder for future integration)
  const _telemetry = useActivitySlotTelemetry({
    enablePerformanceMonitoring: true,
  });

  const clampedProgress = clamp01(progressFraction);
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const isActive = elapsedSeconds > 0 && remainingSeconds > 0;
  const workerInitial = assignedWorkerName?.charAt(0) ?? null;
  const hasWorker = Boolean(assignedWorkerName);

  const isHoveringValid = dndIsOver && canAcceptDrop && !isLockedByPhase;

  const [stableDropState, setStableDropState] = useState<DropState>(dropState);
  useEffect(() => {
    if (!highlightSettings.stabilizeMs) {
      setStableDropState(dropState);
      return;
    }
    const timer = window.setTimeout(() => setStableDropState(dropState), highlightSettings.stabilizeMs);
    return () => window.clearTimeout(timer);
  }, [dropState, highlightSettings.stabilizeMs]);

  const visualDropState = stableDropState;

  const progressDegrees = clampedProgress * 360;
  const haloStartDeg = 0; // align start with base orientation
  const variantColors = VARIANT_COLORS[visualVariant] ?? VARIANT_COLORS.azure;
  const haloStyle: CSSProperties = {
    background: `conic-gradient(from ${haloStartDeg}deg, ${variantColors.primary} 0deg ${progressDegrees}deg, rgba(6,8,14,0.15) ${progressDegrees}deg 360deg)`,
  };
  const variantBloom = VARIANT_BLOOM_STYLE[visualVariant] ?? VARIANT_BLOOM_STYLE.azure;

  // Get config-driven glow styles based on drop state
  const getGlowStyles = (state: DropState) => {
    switch (state) {
      case 'valid':
        return slotGlowConfig.valid;
      case 'invalid':
        return slotGlowConfig.invalid;
      case 'idle':
        return slotGlowConfig.idle;
      case 'locked':
        return slotGlowConfig.invalid; // Map locked to invalid for now
      default:
        return slotGlowConfig.idle;
    }
  };

  const currentGlow = getGlowStyles(visualDropState);

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    } else if (onInspect) {
      onInspect(slotId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
  };

  const _interactiveProps = isInteractive
    ? {
      role: 'button',
      tabIndex: 0,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-pressed': isActive,
      'aria-label': `${isActive ? 'In progress' : 'Ready'}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'
        }. ${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
    }
    : {
      onClick: handleClick,
      'aria-label': `Activity slot ${label ?? slotId}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'
        }. ${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
    };

  type HighlightState = 'idle' | 'valid' | 'hover' | 'selected' | 'invalid' | 'locked' | 'focused';
  const shouldForceHighlight = isSelected && !hasWorker && !isLockedByPhase;
  const highlightState = useMemo<HighlightState>(() => {
    if (isLockedByPhase) return 'locked';
    if (!canAcceptDrop && !hasWorker) return 'invalid';
    if (shouldForceHighlight) return 'selected';
    if (visualDropState === 'valid' && !hasWorker) return 'valid';
    if (visualDropState === 'invalid') return 'invalid';
    if (isHoveringValid && !hasWorker) return 'hover';
    if (isFocused && isInteractive) return 'focused';
    return 'idle';
  }, [canAcceptDrop, hasWorker, isFocused, isHoveringValid, isInteractive, isLockedByPhase, shouldForceHighlight, visualDropState]);

  type HighlightVisual = { className: string; style?: CSSProperties };
  const highlightVisual: HighlightVisual = useMemo(() => {
    const stableGlow = getGlowStyles(visualDropState);
    const allowGlow = !highlightOnlyOnValidDrop || highlightState === 'valid' || highlightState === 'selected';
    const style: CSSProperties = {
      transform: 'scale(1)',
      transition: `transform ${highlightSettings.transitionMs}ms ease, opacity ${highlightSettings.transitionMs}ms ease`,
    };
    let className = '';
    let scale = 1;
    let opacity = 1;

    if (allowGlow && !isLockedByPhase) {
      style.boxShadow = stableGlow.boxShadow;
      style.borderColor = stableGlow.borderColor;
    }

    switch (highlightState) {
      case 'selected':
        scale = highlightSettings.selectedScale;
        className = clsx(className, 'ring-2 ring-offset-2');
        break;
      case 'valid':
        scale = highlightSettings.focusScale;
        className = clsx(className, 'ring-2 ring-offset-2');
        break;
      case 'hover':
        scale = highlightSettings.hoverScale;
        break;
      case 'focused':
        scale = highlightSettings.selectedScale;
        className = clsx(className, 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-blue-900/50');
        if (!allowGlow) {
          style.boxShadow = '0 0 24px rgba(59, 130, 246, 0.4)';
        }
        break;
      case 'invalid':
      case 'locked':
        opacity = highlightSettings.invalidOpacity;
        className = clsx(className, 'opacity-40 cursor-not-allowed');
        break;
      case 'idle':
      default:
        className = clsx(className, 'drop-shadow-[0_0_22px_rgba(5,8,18,0.55)]');
        break;
    }

    style.transform = `scale(${scale})`;
    style.opacity = opacity;
    return { className, style };
  }, [getGlowStyles, highlightOnlyOnValidDrop, highlightSettings, highlightState, isLockedByPhase, visualDropState]);

  const frameClasses = clsx(
    'relative transition-transform duration-200',
    minimalChrome ? 'h-20 w-20 drop-shadow-none' : 'h-28 w-28',
    isLockedByPhase ? 'cursor-not-allowed' : 'cursor-pointer',
    highlightVisual.className,
    slotVisualSettings.clampOverflow !== false && 'overflow-hidden',
  );

  const innerCardClasses = clsx(
    'relative flex h-18 w-18 items-center justify-center rounded-2xl border text-xs text-amber-100 transition-all duration-200',
    minimalChrome
      ? 'border-transparent bg-transparent shadow-none'
      : 'border-slate-600/60 bg-black/80',
    visualDropState === 'invalid' && 'opacity-40',
    isOver && !minimalChrome && !hasWorker && 'scale-105',
    !minimalChrome && !hasWorker && 'hover:scale-105',
  );
  const innerCardStyle: CSSProperties =
    visualDropState === 'valid' && !isLockedByPhase && !hasWorker
      ? {
          borderColor: variantBloom.ring,
          background: variantBloom.fill,
          boxShadow: `0 0 20px ${variantBloom.glow}`,
          transform: 'scale(1.05)',
        }
      : isOver && !minimalChrome && !hasWorker
        ? { boxShadow: `0 0 18px ${variantBloom.glow}`, transform: 'scale(1.03)' }
        : {};

  // Add particle effects for active slots
  const renderParticles = () => {
    if (!slotVisualSettings.particlesEnabled) return null;
    if (!isActive && !isHoveringValid) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-ping"
            style={{
              left: `${20 + (i * 10)}%`,
              top: `${30 + (i * 5)}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s',
            }}
          />
        ))}
      </div>
    );
  };

  const renderDefaultChrome = () => (
    <>
      <div className="absolute inset-0 rounded-full border border-slate-600/60 opacity-30" />
      <div className="absolute inset-0 rounded-full" style={haloStyle} />
      <div className="absolute inset-1 rounded-full bg-black/90 backdrop-blur-md" />

      {/* Particle effects */}
      {renderParticles()}

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div className={innerCardClasses} style={innerCardStyle}>
          <span className="text-4xl" aria-hidden>
            {iconName}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-400">{label}</span>
        </div>

        {(assignedWorkerAvatarUrl || workerInitial) && (
          <div className="absolute -right-1 -top-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-50 overflow-hidden">
            {assignedWorkerAvatarUrl ? (
              <img src={assignedWorkerAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              workerInitial
            )}
          </div>
        )}
      </div>
    </>
  );

  const renderMinimalChrome = () => (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={clsx(
          'flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/50 text-2xl text-amber-100 transition-all duration-200',
          (dropState === 'invalid' || !canAcceptDrop) && 'opacity-35',
        )}
        style={
          dropState === 'valid' && !hasWorker
            ? {
                borderColor: variantBloom.ring,
                background: variantBloom.fill,
                boxShadow: `0 0 18px ${variantBloom.glow}`,
              }
            : undefined
        }
      >
        {assignedWorkerAvatarUrl ? (
          <img src={assignedWorkerAvatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : hasWorker ? (
          <span className="text-sm font-semibold uppercase tracking-[0.25em]">{workerInitial}</span>
        ) : (
          <span aria-hidden>{iconName}</span>
        )}
      </div>
    </div>
  );

  const resolvedTestId = testId ?? `activity-slot-${slotId}`;

  const slotStateAttrs = {
    'data-drop-state': dropState,
    'data-can-drop': canAcceptDrop ? 'true' : 'false',
    'data-highlight-visible': highlightVisual.className?.includes('ring-2') ? 'true' : 'false',
    'data-drop-state-stable': visualDropState,
    'data-highlight-state': highlightState,
  } as const;

  const { entries: slotModifiers, isLoading: slotModifiersLoading } = useModifierVisualization('activitySlot', {
    entityId: slotId,
    maxEntries: 4,
  });

  const slotSurface = (
    <StyleLabSurface
      variant="card"
      className={[...frameClasses, ...classes].join(' ')}
      style={{...highlightVisual.style, ...styles}}
      testId={resolvedTestId}
      {...attributes}
    >
      {minimalChrome ? renderMinimalChrome() : renderDefaultChrome()}
      {isLockedByPhase && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-sm">
          <span className="text-2xl" aria-hidden>
            🔒
          </span>
        </div>
      )}
    </StyleLabSurface>
  );

  const slotSurfaceWithTooltip = slotModifiersLoading || slotModifiers.length > 0 ? (
    <TooltipPrimitive.Root delayDuration={200} disableHoverableContent>
      <TooltipPrimitive.Trigger asChild>
        {slotSurface}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="center"
          className="z-50 w-72 rounded-3xl border border-white/10 bg-slate-950/95 p-3 backdrop-blur"
        >
          <StatModifierDisplay
            modifierEntries={slotModifiers}
            isLoading={slotModifiersLoading}
            showHeader={false}
            maxVisible={4}
            emptyLabel="Nessun modificatore attivo su questo slot"
            testId={`slot-${slotId}-modifier-display`}
          />
          <TooltipPrimitive.Arrow className="fill-slate-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  ) : (
    slotSurface
  );

  return (
    <DropFeedbackContainer
      isDragActive={showDropFeedback && !validationResult?.isValid}
      feedbackType={validationResult?.isValid ? 'valid' : (validationResult?.failedRule ? 'invalid' : 'blocked')}
      message={validationResult?.message}
      showTooltip={showDropFeedback}
      showIndicator={showDropFeedback}
      testId={testId ? `${testId}-feedback` : undefined}
    >
      <div
        ref={setNodeRef}
        className="flex items-center justify-center relative"
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label={`${label} activity slot${assignedWorkerName ? `, assigned to ${assignedWorkerName}` : ', unassigned'}${isActive ? `, in progress, ${formatTime(remainingSeconds)} remaining` : `, ready, duration: ${formatTime(totalDuration)}`}${!canAcceptDrop ? ', not accepting drops' : ''}${isLockedByPhase ? ', locked by phase' : ''}`}
        aria-describedby={validationResult?.message ? `validation-${slotId}` : undefined}
        aria-dropeffect={canAcceptDrop && !isLockedByPhase ? 'move' : 'none'}
        aria-disabled={!isInteractive || isLockedByPhase}
        aria-busy={isActive}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onDrop={handleNativeDrop}
        onDragOver={(e) => e.preventDefault()}
        {...slotStateAttrs}
      >
        {slotSurfaceWithTooltip}
      </div>
      
      {/* Screen reader only validation description */}
      {validationResult?.message && (
        <div
          id={`validation-${slotId}`}
          className="sr-only"
          aria-hidden="true"
        >
          {validationResult.message}
        </div>
      )}
    </DropFeedbackContainer>
  );
};

export default ActivitySlotCard;
export { ActivitySlotCard as ActivitySlot };
