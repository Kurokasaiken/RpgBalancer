/**
 * TS-002 Enhanced PgCard Component
 * 
 * Enhanced version of PgCard that uses TS-002 SkinSlot integration
 * for improved skin system integration and better performance.
 */

import { useRef, memo, useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useResidentDragPreview } from '@/ui/idleVillage/hooks/useResidentDragPreview';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { SkinSlot, useSkinSlot } from '@/ui/idleVillage/components/SkinSlot';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import type { ResidentCompatibilityState } from './ResidentRosterTypes';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface ComponentSkinBinding {
  componentId: ComponentId;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}

export interface PgCardTS002Props {
  workerId: string;
  label: string;
  subtitle?: string;
  hp: number;
  fatigue: number;
  maxHp?: number;
  isDragging?: boolean;
  disabled?: boolean;
  className?: string;
  horizontal?: boolean;
  statusLabel?: string;
  isInteractive?: boolean;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSelect?: (workerId: string) => void;
  portraitUrl?: string;
  compatibilityState?: ResidentCompatibilityState;
  compatibilityLabel?: string;
  dragFeedbackState?: 'idle' | 'valid' | 'invalid' | 'returning';
}

// ============================================================================
// SKIN BINDING CONFIGURATION
// ============================================================================

const pgCardSkinBinding: ComponentSkinBinding = {
  componentId: 'PgCard',
  name: 'Player Character Card',
  description: 'Draggable card component for player characters with stats and visual feedback',
  version: '2.0.0',
  defaultPreset: 'minimal-frontier',
  supportedPillars: ['frontier', 'wilderness', 'empire'],
  supportedMotionLevels: ['minimal', 'reduced', 'full'],
  cssClassBase: 'pg-card',
  dataAttributePrefix: 'pg-card',
  supportsMotionLevel: true,
  supportsTelemetry: true,
  supportsPillarSwitching: true,
  category: 'interactive',
  priority: 100,
  tags: ['card', 'player', 'character', 'draggable'],
  skinProperties: {
    supportsDrag: true,
    supportsDrop: false,
    interactive: true,
    showStats: true,
    showPortrait: true,
  },
};

// ============================================================================
// INTERNAL CARD COMPONENT
// ============================================================================

interface PgCardInternalProps extends PgCardTS002Props {
  skinData: {
    classes: string[];
    attributes: Record<string, string>;
    styles: Record<string, string>;
    className: string;
    isRegistered: boolean;
    currentPreset: SkinPresetId;
    currentPillar: StyleLabPillar;
    currentMotionLevel: MotionLevel;
  };
}

const PgCardInternal = memo<PgCardInternalProps>(({
  workerId,
  label,
  subtitle,
  hp,
  fatigue,
  maxHp = 100,
  isDragging = false,
  disabled = false,
  className = '',
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
  skinData,
}) => {
  // Hooks
  const cardRef = useRef<HTMLDivElement>(null);
  const { tokens } = useMinimalStyleLabTokens();
  const { playSound } = useSensoryAudio();
  const { trackEvent } = useSkinTelemetry();
  const { setDraggedItem } = useDragContext();

  // Drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id: workerId,
    disabled: disabled || !isInteractive,
  });

  // Drag preview
  const dragPreview = useResidentDragPreview({
    workerId,
    label,
    hp,
    fatigue,
    maxHp,
    portraitUrl,
    isDragging: isDndDragging,
  });

  // Instrumentation
  useDragPreviewInstrumentation({
    workerId,
    isDragging: isDndDragging,
    dragPreview,
  });

  // Event handlers
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || disabled) return;
    
    playSound('pickup');
    trackEvent('card_pointer_down', {
      workerId,
      hp,
      fatigue,
      currentPreset: skinData.currentPreset,
      currentPillar: skinData.currentPillar,
    });
    
    onPointerDown?.(event);
  }, [isInteractive, disabled, playSound, trackEvent, workerId, hp, fatigue, skinData, onPointerDown]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || disabled) return;
    
    playSound('drop');
    trackEvent('card_pointer_up', {
      workerId,
      hp,
      fatigue,
      currentPreset: skinData.currentPreset,
      currentPillar: skinData.currentPillar,
    });
    
    onPointerUp?.(event);
  }, [isInteractive, disabled, playSound, trackEvent, workerId, hp, fatigue, skinData, onPointerUp]);

  const handleClick = useCallback(() => {
    if (!isInteractive || disabled) return;
    
    playSound('select');
    onSelect?.(workerId);
    trackEvent('card_selected', {
      workerId,
      hp,
      fatigue,
      currentPreset: skinData.currentPreset,
      currentPillar: skinData.currentPillar,
    });
  }, [isInteractive, disabled, playSound, onSelect, workerId, hp, fatigue, trackEvent, skinData]);

  // Computed styles
  const computedStyles = useMemo(() => {
    const hpPercent = (hp / maxHp) * 100;
    const fatiguePercent = (fatigue / 100) * 100;
    
    return {
      ...skinData.styles,
      '--hp-percent': `${hpPercent}%`,
      '--fatigue-percent': `${fatiguePercent}%`,
      '--card-width': horizontal ? '200px' : '120px',
      '--card-height': horizontal ? '80px' : '160px',
    } as React.CSSProperties;
  }, [skinData.styles, hp, maxHp, fatigue, horizontal]);

  // CSS classes
  const cssClasses = useMemo(() => {
    const baseClasses = [
      ...skinData.classes,
      className,
    ];

    // State classes
    if (isDragging || isDndDragging) baseClasses.push('pg-card--dragging');
    if (disabled) baseClasses.push('pg-card--disabled');
    if (!isInteractive) baseClasses.push('pg-card--static');
    if (horizontal) baseClasses.push('pg-card--horizontal');
    
    // Compatibility state classes
    if (compatibilityState) {
      baseClasses.push(`pg-card--compatibility-${compatibilityState}`);
    }
    
    // Drag feedback state classes
    if (dragFeedbackState !== 'idle') {
      baseClasses.push(`pg-card--feedback-${dragFeedbackState}`);
    }

    return baseClasses.filter(Boolean);
  }, [skinData.classes, className, isDragging, isDndDragging, disabled, isInteractive, horizontal, compatibilityState, dragFeedbackState]);

  // Data attributes
  const dataAttributes = useMemo(() => {
    return {
      ...skinData.attributes,
      'data-worker-id': workerId,
      'data-hp': hp.toString(),
      'data-fatigue': fatigue.toString(),
      'data-max-hp': maxHp.toString(),
      'data-horizontal': horizontal.toString(),
      'data-interactive': isInteractive.toString(),
      'data-disabled': disabled.toString(),
      'data-compatibility': compatibilityState || '',
      'data-feedback': dragFeedbackState,
      'data-preset': skinData.currentPreset,
      'data-pillar': skinData.currentPillar,
      'data-motion': skinData.currentMotionLevel,
    };
  }, [skinData.attributes, workerId, hp, fatigue, maxHp, horizontal, isInteractive, disabled, compatibilityState, dragFeedbackState, skinData]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (cardRef.current !== node) {
          cardRef.current = node;
        }
      }}
      className={cssClasses.join(' ')}
      style={computedStyles}
      {...attributes}
      {...listeners}
      {...dataAttributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      role="button"
      tabIndex={isInteractive && !disabled ? 0 : -1}
      aria-label={`${label} - HP: ${hp}/${maxHp}, Fatigue: ${fatigue}%`}
      aria-disabled={disabled}
    >
      {/* Card Content */}
      <div className="pg-card__content">
        {/* Portrait */}
        {portraitUrl && (
          <div className="pg-card__portrait">
            <img
              src={portraitUrl}
              alt={`${label} portrait`}
              className="pg-card__portrait-image"
              loading="lazy"
            />
          </div>
        )}

        {/* Stats */}
        <div className="pg-card__stats">
          {/* Label */}
          <div className="pg-card__label">
            {label}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="pg-card__subtitle">
              {subtitle}
            </div>
          )}

          {/* HP Bar */}
          <div className="pg-card__hp-bar">
            <div 
              className="pg-card__hp-fill"
              style={{ width: `var(--hp-percent)` }}
            />
            <span className="pg-card__hp-text">
              {hp}/{maxHp}
            </span>
          </div>

          {/* Fatigue Bar */}
          {fatigue > 0 && (
            <div className="pg-card__fatigue-bar">
              <div 
                className="pg-card__fatigue-fill"
                style={{ width: `var(--fatigue-percent)` }}
              />
              <span className="pg-card__fatigue-text">
                {fatigue}%
              </span>
            </div>
          )}

          {/* Status Label */}
          {statusLabel && (
            <div className="pg-card__status">
              {statusLabel}
            </div>
          )}

          {/* Compatibility Label */}
          {compatibilityLabel && (
            <div className="pg-card__compatibility">
              {compatibilityLabel}
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      {(isDragging || isDndDragging) && (
        <div className="pg-card__drag-overlay">
          <div className="pg-card__drag-indicator" />
        </div>
      )}
    </div>
  );
});

PgCardInternal.displayName = 'PgCardInternal';

// ============================================================================
// MAIN TS-002 PG CARD COMPONENT
// ============================================================================

const PgCardTS002 = memo<PgCardTS002Props>((props) => {
  // Use TS-002 skin slot hook
  const skinData = useSkinSlot('PgCard', pgCardSkinBinding, {
    autoRegister: true,
    autoUnregister: true,
    enableLiveUpdates: true,
    generateClasses: true,
    generateAttributes: true,
    generateStyles: true,
    skinProperties: {
      supportsDrag: true,
      supportsDrop: false,
      interactive: props.isInteractive ?? true,
      showStats: true,
      showPortrait: !!props.portraitUrl,
      horizontal: props.horizontal ?? false,
    },
    onError: (error) => {
      console.error('PgCard skin error:', error);
    },
    onRegistered: (componentId) => {
      console.log('PgCard registered:', componentId);
    },
    onUnregistered: (componentId) => {
      console.log('PgCard unregistered:', componentId);
    },
  });

  return (
    <PgCardInternal
      {...props}
      skinData={skinData}
    />
  );
});

PgCardTS002.displayName = 'PgCardTS002';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { PgCardTS002 as PgCard };
export default PgCardTS002;

// Export the skin binding for other components to use
export { pgCardSkinBinding };
