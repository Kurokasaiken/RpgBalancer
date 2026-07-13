import { useRef, memo, useCallback, useMemo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useResidentDragPreview } from '@/ui/idleVillage/hooks/useResidentDragPreview';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';
import '@/ui/styles/metallic-engraving.css';
import '@/ui/styles/irregular-clippath.css';

// Define ComponentId locally to avoid import issues
type ComponentId = string;
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import type { ResidentCompatibilityState } from './ResidentRosterTypes';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import {
  type PgCardFrameType,
  getPgCardFrameTokens,
  getPgCardFrameStyle,
} from '@/ui/idleVillage/config/pgCardFrameConfig';

/**
 * Props for the draggable rectangular token that mirrors resident stats.
 */
export interface PgCardProps {
  workerId: string;
  label: string;
  subtitle?: string;
  hp: number;
  fatigue: number;
  maxHp?: number;
  isDragging?: boolean;
  disabled?: boolean;
  className?: string;
  horizontal?: boolean; // New prop for horizontal bar mode
  statusLabel?: string;
  isInteractive?: boolean;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void; // Legacy, unused by dnd-kit
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void; // Legacy, unused by dnd-kit
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSelect?: (workerId: string) => void;
  portraitUrl?: string;
  compatibilityState?: ResidentCompatibilityState;
  compatibilityLabel?: string;
  /** Visual feedback state coming from DragTestContainer */
  dragFeedbackState?: 'idle' | 'valid' | 'invalid' | 'returning';
  /** Frame style applied to the portrait medallion. Defaults to `heroic`. */
  frameType?: PgCardFrameType;
}

type StatBarVariant = 'hp' | 'stamina' | 'fatigue';

const STAT_BAR_COLORS: Record<StatBarVariant, { start: string; end: string; shadow: string }> = {
  hp: { start: 'var(--skin-statbar-hp-start, #0a8a4a)', end: 'var(--skin-statbar-hp-end, #6ee7b7)', shadow: 'var(--skin-statbar-hp-glow, rgba(110,231,183,0.45))' },
  stamina: { start: 'var(--skin-statbar-stamina-start, #d4af37)', end: 'var(--skin-statbar-stamina-end, #f59e0b)', shadow: 'var(--skin-statbar-stamina-glow, rgba(245,158,11,0.45))' },
  fatigue: { start: 'var(--skin-statbar-fatigue-start, #9e5a4a)', end: 'var(--skin-statbar-fatigue-end, #d98a4a)', shadow: 'var(--skin-statbar-fatigue-glow, rgba(217,138,74,0.6))' },
};

interface PgCardStatBarProps {
  variant: StatBarVariant;
  value: number;
  maxValue?: number;
  className?: string;
}

function PgCardStatBar({ variant, value, maxValue = 100, className = '' }: PgCardStatBarProps) {
  const percent = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : Math.max(0, Math.min(100, value));
  const colors = STAT_BAR_COLORS[variant];
  return (
    <div
      className={['rounded-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={{
        background: 'var(--skin-statbar-track, linear-gradient(180deg, #0c0b0a, #050505))',
        border: '1px solid var(--skin-statbar-track-border, rgba(216,177,62,0.08))',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.85), inset 0 1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${percent}%`,
          background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
          boxShadow: `inset 0 0 0 0.5px color-mix(in srgb, var(--skin-icon-color, #dfb857) 85%, transparent), 0 0 6px ${colors.shadow}`,
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="h-1/2 w-full rounded-t-full"
          style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
          }}
        />
      </div>
    </div>
  );
}

const PgCard = memo<PgCardProps>(({  
  workerId,
  label,
  subtitle,
  hp,
  fatigue,
  maxHp,
  isDragging: propIsDragging = false,
  disabled = false,
  className,
  horizontal = false,
  statusLabel,
  isInteractive = true,
  onDragStateChange,
  onDragStart,
  onDragEnd,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onSelect,
  portraitUrl,
  compatibilityState,
  compatibilityLabel,
  dragFeedbackState = 'idle',
  frameType = 'heroic',
}) => {
  // Instrument renderer stack at PgCard level (final rendering stage)
  useEffect(() => {
    // Generate a render index based on component creation order
    const renderIndex = Date.now() % 1000; // Simple pseudo-index for identification
    
    rendererStackInstrumentation.capturePgCard(
      renderIndex,
      {
        workerId,
        label,
        subtitle,
        hp,
        fatigue,
        maxHp,
        portraitUrl,
        compatibilityState,
        compatibilityLabel,
        frameType,
      },
      {
        displayName: label,
        displayedHp: hp,
        displayedFatigue: fatigue,
        portraitResolvedSource: portraitUrl,
        finalRenderOrder: renderIndex,
        frameType,
      }
    );
  }, [workerId, label, subtitle, hp, fatigue, maxHp, portraitUrl, compatibilityState, compatibilityLabel, frameType]);

  const { dragImageRef, isReady: dragPreviewReady } = useResidentDragPreview({
    residentId: workerId,
    label,
    portraitUrl,
  });
  const { setDragCursorOffset, setDragHomeCenter } = useDragContext();
  
  // Ref for direct DOM manipulation of transform origin
  const cardRef = useRef<HTMLDivElement>(null);

  // Skin binding integration
  const skinBinding = useSkinBinding({
    componentId: 'PgCard',
    name: 'PgCard',
    description: 'Player character card with stats and portrait',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'pgcard',
    dataAttributePrefix: 'pgcard',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    supportsPillarSwitching: true,
    requiredProperties: [],
    optionalProperties: ['hp', 'fatigue', 'maxHp', 'compatibilityState'],
    category: 'interactive',
    priority: 1,
    tags: ['character', 'card', 'draggable'],
  }, {
    properties: {
      hp,
      fatigue,
      maxHp,
      compatibilityState,
    },
    onSkinChange: (skinData) => {
      // Track skin changes for telemetry
      if (skinData.isTransitioning) {
        // Track transition start
      }
    },
  });

  const { classes, attributes: skinAttributes, styles } = skinBinding;
  const { trackComponentEvent } = useSkinTelemetry('PgCard');

  // Capture drag start via pointer down and set drag image
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    setDragCursorOffset({
      x: offsetX,
      y: offsetY,
      width: rect.width,
      height: rect.height,
    });

    // Store cursor offset globally for CustomDragOverlay modifier
    if (typeof window !== 'undefined') {
      (window as any).__dragCursorOffset = {
        x: offsetX,
        y: offsetY,
        width: rect.width,
        height: rect.height,
      };

      // Calculate and store the REAL portrait center for spring-back animation
      // This is the authoritative anchor point - CustomDragOverlay MUST NOT overwrite this
      const portraitImg = event.currentTarget.querySelector('img');
      if (portraitImg) {
        const portraitRect = portraitImg.getBoundingClientRect();
        (window as any).__dragHomeCenter = {
          x: portraitRect.left + portraitRect.width / 2,
          y: portraitRect.top + portraitRect.height / 2,
        };
      } else {
        // Fallback: use card center if no portrait image found
        (window as any).__dragHomeCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    if (!dragImageRef.current || !dragPreviewReady) {
      return;
    }

    requestAnimationFrame(() => {
      if (event.currentTarget && dragImageRef.current) {
        (event.currentTarget as HTMLElement & { dragImageRef?: HTMLCanvasElement; dragImageOffset?: { x: number; y: number } }).dragImageRef =
          dragImageRef.current;
        (event.currentTarget as HTMLElement & { dragImageRef?: HTMLCanvasElement; dragImageOffset?: { x: number; y: number } }).dragImageOffset = {
          x: dragImageRef.current?.width ? dragImageRef.current.width / 2 : offsetX,
          y: dragImageRef.current?.height ? dragImageRef.current.height / 2 : offsetY,
        };
      }
    });
  }, [dragImageRef, dragPreviewReady, setDragCursorOffset]);

  const { attributes, listeners, setNodeRef, isDragging: dndIsDragging } = useDraggable({
    id: workerId,
    disabled: disabled || !isInteractive || dragFeedbackState === 'returning',
    data: {
      workerId,
      label,
      portraitUrl,
      type: 'resident',
      // Stats payload consumed by drop targets (e.g. JobPOI) for requirement checks
      resident: { stats: { hp }, fatigue }
    }
  });

  
  // Prefer dnd-kit dragging state, fallback to prop
  const isDragging = dndIsDragging || propIsDragging;
  const isUnavailable = disabled || !isInteractive;
  const isReturning = dragFeedbackState === 'returning';
  const computedStatusLabel = statusLabel ?? (isUnavailable ? 'Unavailable' : 'Available');
  const hasPortrait = Boolean(portraitUrl);
  const portraitInitial = (label.charAt(0) || workerId.charAt(0)).toUpperCase();
  const { playCue } = useSensoryAudio();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _uiTokens = useMinimalStyleLabTokens(DEFAULT_MINIMAL_CONFIG.ui);

  const instrumentationMetadata = useMemo(
    () => ({
      workerId,
      label,
      status: computedStatusLabel,
      compatibilityState,
      layout: horizontal ? 'horizontal' : 'vertical',
      disabled,
      isInteractive,
      portraitType: hasPortrait ? 'portrait' : 'initials',
      frameType,
    }),
    [workerId, label, computedStatusLabel, compatibilityState, horizontal, disabled, isInteractive, hasPortrait, frameType],
  );

  // Still track instrumentation for analytics even if we don't use the canvas preview for drag
  useDragPreviewInstrumentation({
    residentId: workerId,
    source: 'pg_card',
    metadata: instrumentationMetadata,
  });

  // Skin telemetry events
  useEffect(() => {
    trackComponentEvent('rendered', {
      workerId,
      label,
      hp,
      fatigue,
      isDragging,
      disabled,
      horizontal,
      hasPortrait,
      frameType,
      skinBinding: skinBinding.componentId,
    });
  }, [workerId, label, hp, fatigue, isDragging, disabled, horizontal, hasPortrait, frameType, skinBinding.componentId, trackComponentEvent]);

  useEffect(() => {
    if (isDragging) {
      trackComponentEvent('drag_start', {
        workerId,
        label,
        frameType,
        skinBinding: skinBinding.componentId,
      });
    }
  }, [isDragging, workerId, label, frameType, skinBinding.componentId, trackComponentEvent]);

  // Trigger audio cues on interaction state changes
  useEffect(() => {
    if (isDragging) {
      playCue('pickup');
    }
  }, [isDragging, playCue]);

  const handlePointerDownInternal = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
  }, [onPointerDown]);

  const handlePointerMoveInternal = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // Legacy tracking
  }, []);

  const handlePointerUpInternal = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
  }, [onPointerUp]);

  const handlePointerCancelInternal = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event);
  }, [onPointerCancel]);

  const handleClickInternal = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        
    if (isUnavailable || isReturning) {
      event.preventDefault();
      return;
    }
        onSelect?.(workerId);
  }, [isUnavailable, isReturning, onSelect, workerId, dragFeedbackState]);

  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (isUnavailable || isReturning) {
      event.preventDefault();
      return;
    }
    playCue('pickup');
    onDragStart?.(event);
    onDragStateChange?.(workerId, true);
  }, [isUnavailable, isReturning, playCue, onDragStart, onDragStateChange, workerId]);

  const handleDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    onDragEnd?.(event);
    onDragStateChange?.(workerId, false);
    if (isReturning) {
      playCue('drop_invalid');
    }
  }, [onDragEnd, onDragStateChange, workerId, isReturning, playCue]);

  const handleKeyDownInternal = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isUnavailable || isReturning) {
        return;
      }
      onSelect?.(workerId);
    }
  }, [isUnavailable, isReturning, onSelect, workerId]);

  // Show absolute values instead of percentages
  const constrainedHp = hp;
  const constrainedFatigue = fatigue;
  const baseTokenClasses = horizontal
    ? 'flex items-center gap-3 rounded-[18px] border border-[var(--skin-surface-border)] bg-transparent px-3 py-2 text-left text-xs text-[var(--skin-text-primary)] shadow-[0_12px_26px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all max-w-sm'
    : 'flex flex-col gap-2 rounded-[22px] border border-[var(--skin-surface-border)] bg-transparent px-4 py-3 text-left text-xs text-[var(--skin-text-primary)] shadow-[0_18px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all';

  const returningOverlayClass = isReturning
    ? 'pointer-events-none opacity-60 grayscale animate-bounce-spring'
    : '';

  const compatibilityAccentClass =
    compatibilityState === 'valid'
      ? 'ring-2 ring-[var(--skin-status-met)]/60 shadow-[0_0_25px_color-mix(in_srgb,var(--skin-status-met)_25%,transparent)]'
      : compatibilityState === 'invalid'
        ? 'ring-1 ring-[var(--skin-text-muted)]/20 shadow-[0_0_20px_color-mix(in_srgb,var(--skin-text-muted)_20%,transparent)]'
        : '';

  const renderPortraitBadge = (variant: 'horizontal' | 'vertical') => {
    const frameTokens = getPgCardFrameTokens(frameType);
    const isCircular = frameTokens.borderRadius === 'full';
    const sizeClasses =
      variant === 'horizontal'
        ? hasPortrait
          ? 'h-8 w-14'
          : 'h-7 w-7'
        : hasPortrait
          ? 'h-10 w-16'
          : 'h-8 w-8';
    const shapeClass = isCircular ? 'rounded-full' : 'rounded-[14px]';
    const textStyle =
      variant === 'horizontal'
        ? 'text-[11px] font-semibold uppercase tracking-[0.3em]'
        : 'text-base font-semibold uppercase tracking-[0.3em]';
    const frameStyle = getPgCardFrameStyle(frameType, variant);

    return (
      <div
        className={[
          'relative flex items-center justify-center overflow-hidden text-[var(--skin-text-primary)]',
          'pgcard-frame',
          `pgcard-frame-${frameTokens.classSuffix}`,
          sizeClasses,
          shapeClass,
          hasPortrait ? '' : textStyle,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...frameStyle,
          width: variant === 'horizontal' ? '56px' : '64px',
          height: variant === 'horizontal' ? '32px' : '40px',
          minWidth: variant === 'horizontal' ? '56px' : '64px',
          minHeight: variant === 'horizontal' ? '32px' : '40px',
        }}
        data-frame-type={frameType}
        aria-hidden="true"
      >
        {frameTokens.hasInnerBevel && (
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.35)',
            }}
          />
        )}

        {hasPortrait ? (
          <img src={portraitUrl} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="relative z-0">{portraitInitial}</span>
        )}

        {frameTokens.hasCornerDecorations && (
          <>
            <span
              className="pointer-events-none absolute top-0 left-0 z-20 h-1.5 w-1.5"
              style={{
                borderTop: `2px solid ${frameTokens.accentColor}`,
                borderLeft: `2px solid ${frameTokens.accentColor}`,
                borderTopLeftRadius: frameTokens.borderRadius === 'sharp' ? '1px' : '6px',
              }}
            />
            <span
              className="pointer-events-none absolute top-0 right-0 z-20 h-1.5 w-1.5"
              style={{
                borderTop: `2px solid ${frameTokens.accentColor}`,
                borderRight: `2px solid ${frameTokens.accentColor}`,
                borderTopRightRadius: frameTokens.borderRadius === 'sharp' ? '1px' : '6px',
              }}
            />
            <span
              className="pointer-events-none absolute bottom-0 left-0 z-20 h-1.5 w-1.5"
              style={{
                borderBottom: `2px solid ${frameTokens.accentColor}`,
                borderLeft: `2px solid ${frameTokens.accentColor}`,
                borderBottomLeftRadius: frameTokens.borderRadius === 'sharp' ? '1px' : '6px',
              }}
            />
            <span
              className="pointer-events-none absolute bottom-0 right-0 z-20 h-1.5 w-1.5"
              style={{
                borderBottom: `2px solid ${frameTokens.accentColor}`,
                borderRight: `2px solid ${frameTokens.accentColor}`,
                borderBottomRightRadius: frameTokens.borderRadius === 'sharp' ? '1px' : '6px',
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      {...listeners}
      {...attributes}
      data-testid="pg-card"
      data-has-portrait={hasPortrait ? 'true' : 'false'}
      data-worker-id={workerId}
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`${label}, ${computedStatusLabel}, HP: ${maxHp ? `${hp}/${maxHp}` : `${constrainedHp}`}, Stamina: ${100 - constrainedFatigue}%${compatibilityState !== 'idle' ? `, ${compatibilityState === 'valid' ? 'Compatible' : 'No compatible slots'}${compatibilityLabel ? ` with ${compatibilityLabel}` : ''}` : ''}`}
      aria-describedby={compatibilityState !== 'idle' ? `compatibility-${workerId}` : undefined}
      aria-disabled={isUnavailable || isReturning}
      aria-pressed={isDragging}
      data-drag-state={isDragging ? 'dragging' : isReturning ? 'returning' : isUnavailable ? 'disabled' : 'idle'}
      data-resident-id={workerId}
      data-compatibility={compatibilityState}
      data-pgcard-frame={frameType}
      className={[
        baseTokenClasses,
        compatibilityAccentClass,
        'clip-path-card', // Irregular corners — organic, non-web-like appearance
        isUnavailable ? 'cursor-not-allowed opacity-35 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-[var(--skin-status-met)]/70',
        returningOverlayClass,
        isDragging ? 'opacity-40 pointer-events-none' : '',
        ...classes, // Add skin binding classes
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      // Add skin data attributes
      {...skinAttributes}
      // Add skin styles and dynamic transform origin for portrait-anchored spring-back
      style={{
        ...styles,
        background: 'var(--skin-surface-bg)',
        // Transform origin will be set dynamically in handlePointerDown
        transformOrigin: horizontal ? '28px 16px' : '32px 20px',
      }}
      // We combine dnd-kit listeners with our own logic
      onPointerDown={(e) => {
                // Capture cursor offset for drag overlay alignment
        handlePointerDown(e);
        handlePointerDownInternal(e);
        
        // Set up drag image for dnd-kit
        if (dragImageRef.current && dragPreviewReady) {
          const size = dragImageRef.current.width;
                    
          // Store references for dnd-kit to use
          (e.currentTarget as any).dragImageRef = dragImageRef.current;
          (e.currentTarget as any).dragImageOffset = { x: size / 2, y: size / 2 };
        }
        
        listeners?.onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        handlePointerMoveInternal(e);
        // listeners.onPointerMove?.(e); // dnd-kit might handle this? usually it attaches to window for move?
        // Actually dnd-kit listeners usually include onPointerDown, onKeyDown, etc.
      }}
      onPointerUp={(e) => {
        handlePointerUpInternal(e);
        // listeners.onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        handlePointerCancelInternal(e);
        listeners?.onPointerCancel?.(e);
      }}
      onClick={handleClickInternal}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onKeyDown={(e) => {
        handleKeyDownInternal(e);
        listeners?.onKeyDown?.(e);
      }}
    >
      {horizontal ? (
        // Horizontal bar mode
        <>
          <div className="shrink-0">{renderPortraitBadge('horizontal')}</div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold tracking-[0.08em] text-[var(--skin-text-primary)] text-engraved">{label}</span>
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[7.5px] tracking-[0.18em] uppercase',
                  isUnavailable ? 'border border-[var(--skin-status-unmet)]/70 text-[var(--skin-status-unmet)]/80 bg-[var(--skin-status-unmet)]/20' : 'border border-[var(--skin-status-met)]/70 text-[var(--skin-status-met)]/80 bg-[var(--skin-status-met)]/20',
                ].join(' ')}
              >
                {computedStatusLabel}
              </span>
            </div>

            {compatibilityState !== 'idle' && compatibilityState !== 'valid' && (
              <div
                className={[
                  'text-[10px] uppercase tracking-[0.2em]',
                  'text-[var(--skin-status-unmet)]',
                ].join(' ')}
              >
                Nessuno slot compatibile
              </div>
            )}
            {compatibilityState === 'valid' && (
              <div
                className={[
                  'text-[10px] uppercase tracking-[0.2em]',
                  'text-[var(--skin-status-met)]',
                ].join(' ')}
              >
                {`Compatibile${compatibilityLabel ? ` · ${compatibilityLabel}` : ''}`}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--skin-label-tertiary)] w-3">HP</span>
              <PgCardStatBar variant="hp" value={hp} maxValue={maxHp ?? 0} className="flex-1 h-1" />
              <span className="text-[9px] text-[var(--skin-body-color)] w-6 text-right text-engraved-light">
                {maxHp ? `${hp}/${maxHp}` : `${constrainedHp}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--skin-label-tertiary)] w-3 text-engraved-light">S</span>
              <PgCardStatBar variant="stamina" value={100 - constrainedFatigue} maxValue={100} className="flex-1 h-1" />
              <span className="text-[9px] text-[var(--skin-body-color)] w-6 text-right text-engraved-light">
                {100 - constrainedFatigue}
              </span>
            </div>
          </div>
        </>
      ) : (
        // Original vertical mode
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-[0.08em] text-[var(--skin-text-primary)] text-engraved">{label}</span>
            {renderPortraitBadge('vertical')}
          </div>
          {compatibilityState !== 'idle' && (
            <div
              className={[
                'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]',
                compatibilityState === 'valid'
                  ? 'border-[var(--skin-status-met)]/70 text-[var(--skin-status-met)] bg-[var(--skin-status-met)]/30'
                  : 'border-[var(--skin-status-unmet)]/70 text-[var(--skin-status-unmet)] bg-[var(--skin-status-unmet)]/30',
              ].join(' ')}
            >
              {compatibilityState === 'valid'
                ? `Compatibile${compatibilityLabel ? ` · ${compatibilityLabel}` : ''}`
                : 'Nessuno slot compatibile'}
            </div>
          )}
          {subtitle && <span className="text-[10px] tracking-wide text-[var(--skin-body-color)]">{subtitle}</span>}
          <div className="space-y-2 pt-1 text-[10px] tracking-[0.2em] uppercase">
            <div>
              <div className="mb-1 flex items-center justify-between text-[var(--skin-status-met)]/80 text-engraved-light">
                <span>HP</span>
                <span>{maxHp ? `${hp}/${maxHp}` : `${constrainedHp}`}</span>
              </div>
              <PgCardStatBar variant="hp" value={hp} maxValue={maxHp ?? 0} className="h-1.5 w-full" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[var(--skin-icon-color)]/80 text-engraved-light">
                <span>STAMINA</span>
                <span>{100 - constrainedFatigue}%</span>
              </div>
              <PgCardStatBar variant="stamina" value={100 - constrainedFatigue} maxValue={100} className="h-1.5 w-full" />
            </div>
          </div>
        </>
      )}
      
      {/* Screen reader only compatibility description */}
      {compatibilityState !== 'idle' && (
        <div
          id={`compatibility-${workerId}`}
          className="sr-only"
          aria-hidden="true"
        >
          {compatibilityState === 'valid' 
            ? `Compatible${compatibilityLabel ? ` with ${compatibilityLabel}` : ''}` 
            : 'No compatible slots available'
          }
        </div>
      )}
    </div>
  );
});

PgCard.displayName = 'PgCard';

export default PgCard;
export { PgCard };
