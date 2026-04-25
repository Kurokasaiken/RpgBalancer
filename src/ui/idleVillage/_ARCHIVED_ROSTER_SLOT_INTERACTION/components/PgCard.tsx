import { useRef, memo, useCallback, useMemo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useResidentDragPreview } from '@/ui/idleVillage/hooks/useResidentDragPreview';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import type { ResidentCompatibilityState } from './ResidentRosterTypes';

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
  onSelect,
  portraitUrl,
  compatibilityState = 'idle',
  compatibilityLabel,
  dragFeedbackState = 'idle',
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}) => {
  const { dragImageRef, isReady: dragPreviewReady } = useResidentDragPreview({
    residentId: workerId,
    label,
    portraitUrl,
  });
  const { setDragCursorOffset } = useDragContext();

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

    if (!dragImageRef.current || !dragPreviewReady) {
      return;
    }

    requestAnimationFrame(() => {
      (event.currentTarget as HTMLElement & { dragImageRef?: HTMLCanvasElement; dragImageOffset?: { x: number; y: number } }).dragImageRef =
        dragImageRef.current;
      (event.currentTarget as HTMLElement & { dragImageRef?: HTMLCanvasElement; dragImageOffset?: { x: number; y: number } }).dragImageOffset = {
        x: dragImageRef.current?.width ? dragImageRef.current.width / 2 : offsetX,
        y: dragImageRef.current?.height ? dragImageRef.current.height / 2 : offsetY,
      };
    });
  }, [dragImageRef, dragPreviewReady, setDragCursorOffset]);

  const { attributes, listeners, setNodeRef, isDragging: dndIsDragging } = useDraggable({
    id: workerId,
    disabled: disabled || !isInteractive,
    data: {
      workerId,
      label,
      portraitUrl,
      type: 'resident'
    }
  });

  // Debug: check what listeners we have
  console.log('🔍 [PgCard] Listeners:', listeners);

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
    }),
    [workerId, label, computedStatusLabel, compatibilityState, horizontal, disabled, isInteractive, hasPortrait],
  );

  // Still track instrumentation for analytics even if we don't use the canvas preview for drag
  useDragPreviewInstrumentation({
    residentId: workerId,
    source: 'pg_card',
    metadata: instrumentationMetadata,
  });

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
    // dnd-kit usually prevents click on drag, but we check availability
    onSelect?.(workerId);
  }, [isUnavailable, isReturning, onSelect, workerId]);

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
    ? 'flex items-center gap-3 rounded-[18px] border border-white/15 bg-[rgba(8,12,18,0.65)] px-3 py-2 text-left text-xs text-amber-100 shadow-[0_12px_26px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all max-w-sm'
    : 'flex flex-col gap-2 rounded-[22px] border border-white/15 bg-[rgba(6,10,18,0.7)] px-4 py-3 text-left text-xs text-amber-100 shadow-[0_18px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all';

  const returningOverlayClass = isReturning
    ? 'pointer-events-none opacity-60 grayscale animate-bounce-spring'
    : '';

  const compatibilityAccentClass =
    compatibilityState === 'valid'
      ? 'ring-2 ring-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
      : compatibilityState === 'invalid'
        ? 'ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
        : '';

  const renderPortraitBadge = (variant: 'horizontal' | 'vertical') => {
    const sizeClasses =
      variant === 'horizontal'
        ? hasPortrait
          ? 'h-8 w-14'
          : 'h-7 w-7'
        : hasPortrait
          ? 'h-10 w-16'
          : 'h-8 w-8';
    const shapeClass = hasPortrait ? 'rounded-[999px]' : 'rounded-full';
    const textStyle =
      variant === 'horizontal'
        ? 'text-[11px] font-semibold uppercase tracking-[0.3em]'
        : 'text-base font-semibold uppercase tracking-[0.3em]';
    return (
      <div
        className={[
          'flex items-center justify-center border border-amber-200/70 bg-[rgba(18,12,0,0.65)] text-ivory shadow-inner shadow-amber-900/40 overflow-hidden',
          sizeClasses,
          shapeClass,
          hasPortrait ? '' : textStyle,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {hasPortrait ? (
          <img src={portraitUrl} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          portraitInitial
        )}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
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
      className={[
        baseTokenClasses,
        compatibilityAccentClass,
        isUnavailable ? 'cursor-not-allowed opacity-35 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-emerald-300/70',
        returningOverlayClass,
        isDragging ? 'opacity-40' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      // We combine dnd-kit listeners with our own logic
      onPointerDown={(e) => {
        console.log('🔍 [PgCard] onPointerDown called');
        // Capture cursor offset for drag overlay alignment
        handlePointerDown(e);
        handlePointerDownInternal(e);
        
        // Set up drag image for dnd-kit
        if (dragImageRef.current && dragPreviewReady) {
          const size = dragImageRef.current.width;
          console.log('🔍 [PgCard] Setting drag image with size:', size);
          
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
              <span className="truncate text-[11px] font-semibold tracking-[0.08em] text-ivory">{label}</span>
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[7.5px] tracking-[0.18em] uppercase',
                  isUnavailable ? 'border border-rose-300/70 text-rose-100/80 bg-rose-900/20' : 'border border-emerald-200/70 text-emerald-100/80 bg-emerald-900/20',
                ].join(' ')}
              >
                {computedStatusLabel}
              </span>
            </div>

            {compatibilityState !== 'idle' && (
              <div
                className={[
                  'text-[10px] uppercase tracking-[0.2em]',
                  compatibilityState === 'valid' ? 'text-emerald-200' : 'text-rose-200',
                ].join(' ')}
              >
                {compatibilityState === 'valid'
                  ? `Compatibile${compatibilityLabel ? ` · ${compatibilityLabel}` : ''}`
                  : 'Nessuno slot compatibile'}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">HP</span>
              <div className="flex-1 h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500 transition-all"
                  style={{ width: `${maxHp ? (hp / maxHp) * 100 : constrainedHp}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 w-6 text-right">
                {maxHp ? `${hp}/${maxHp}` : `${constrainedHp}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">S</span>
              <div className="flex-1 h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500 transition-all"
                  style={{ width: `${100 - constrainedFatigue}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 w-6 text-right">
                {100 - constrainedFatigue}
              </span>
            </div>
          </div>
        </>
      ) : (
        // Original vertical mode
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-[0.08em] text-ivory">{label}</span>
            {renderPortraitBadge('vertical')}
          </div>
          {compatibilityState !== 'idle' && (
            <div
              className={[
                'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]',
                compatibilityState === 'valid'
                  ? 'border-emerald-300/70 text-emerald-100 bg-emerald-900/30'
                  : 'border-rose-300/70 text-rose-100 bg-rose-900/30',
              ].join(' ')}
            >
              {compatibilityState === 'valid'
                ? `Compatibile${compatibilityLabel ? ` · ${compatibilityLabel}` : ''}`
                : 'Nessuno slot compatibile'}
            </div>
          )}
          {subtitle && <span className="text-[10px] tracking-wide text-slate-400">{subtitle}</span>}
          <div className="space-y-2 pt-1 text-[10px] tracking-[0.2em] uppercase">
            <div>
              <div className="mb-1 flex items-center justify-between text-emerald-200/80">
                <span>HP</span>
                <span>{maxHp ? `${hp}/${maxHp}` : `${constrainedHp}`}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500 transition-all"
                  style={{ width: `${maxHp ? (hp / maxHp) * 100 : constrainedHp}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-amber-200/80">
                <span>STAMINA</span>
                <span>{100 - constrainedFatigue}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500 transition-all"
                  style={{ width: `${100 - constrainedFatigue}%` }}
                />
              </div>
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
