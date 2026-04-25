import React from 'react';
import { useSkinBinding } from '../hooks/useSkinBinding';
import { useSkinTelemetry } from '../hooks/useSkinTelemetry';
/**
 * Visual card props representing a resident overview card in Idle Village.
 */
export interface WorkerCardProps {
  /** Unique resident identifier */
  id: string;
  /** Resident display name */
  name: string;
  /** Current HP percentage */
  hp: number;
  /** Current fatigue percentage */
  fatigue: number;
  /** Optional hover callback for highlight effects */
  onHoverChange?: (workerId: string, isHovering: boolean) => void;
  /** When true, the card renders in compact circular mode (during drag). */
  isDragging?: boolean;
  /** Whether the cursor is over the card */
  isHovering?: boolean;
  /** Portrait URL for the resident */
  portraitUrl?: string;
}

/**
 * Resident info card with HP/fatigue bars that collapses into a circular badge while its drag token is active.
 */
const WorkerCard: React.FC<WorkerCardProps> = ({
  id,
  name,
  hp,
  fatigue,
  onHoverChange,
  isDragging = false,
  isHovering = false,
  portraitUrl,
}) => {
  // Skin binding integration
  const skinBinding = useSkinBinding({
    componentId: 'WorkerCard',
    name: 'WorkerCard',
    description: 'Resident overview card with HP/fatigue bars',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'worker-card',
    dataAttributePrefix: 'worker-card',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    supportsPillarSwitching: true,
    requiredProperties: [],
    optionalProperties: ['hp', 'fatigue', 'isDragging', 'isHovering'],
    category: 'display',
    priority: 2,
    tags: ['resident', 'card', 'overview'],
  }, {
    properties: {
      hp,
      fatigue,
      isDragging,
      isHovering,
    },
    onSkinChange: (skinData) => {
      // Track skin changes for telemetry
      if (skinData.isTransitioning) {
        // Track transition start
      }
    },
  });

  const { classes, attributes, styles } = skinBinding;
  const { trackComponentEvent } = useSkinTelemetry('WorkerCard');

  const isExhausted = fatigue > 90;

  const cardStyle: React.CSSProperties = {
    borderColor: 'var(--card-border-color)',
    background: `var(--card-surface-radial), var(--card-surface)`,
    boxShadow: isHovering ? '0 0 80px var(--halo-color)' : '0 24px 45px rgba(0, 5, 15, 0.75)',
    color: 'var(--text-primary)',
    backgroundBlendMode: 'overlay',
    padding: '1.5rem',
    ...styles, // Add skin styles
  };

  if (isDragging) {
    return (
      <div
        data-testid="worker-card"
        data-worker-id={id}
        data-worker-name={name}
        data-worker-hp={hp}
        data-worker-fatigue={fatigue}
        data-is-dragging={isDragging ? 'true' : 'false'}
        data-is-exhausted={isExhausted ? 'true' : 'false'}
        className={`worker-card ${isDragging ? 'dragging' : ''} ${isExhausted ? 'exhausted' : ''} ${classes.join(' ')}`}
        style={{
          border: '2px solid rgba(251, 191, 36, 0.7)',
          borderRadius: '999px',
          backgroundColor: 'rgba(6, 10, 18, 0.9)',
          boxShadow: '0 0 25px rgba(251, 191, 36, 0.55)',
        }}
        {...attributes}
        onMouseEnter={() => {
          onHoverChange?.(id, true);
          trackComponentEvent('hover_start', { workerId: id, name });
        }}
        onMouseLeave={() => {
          onHoverChange?.(id, false);
          trackComponentEvent('hover_end', { workerId: id, name });
        }}
      >
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span style={{ color: 'var(--accent-strong, #f7ebd2)' }}>
            {name.charAt(0) || id.charAt(0)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => {
        onHoverChange?.(id, true);
        trackComponentEvent('hover_start', { workerId: id, name });
      }}
      onMouseLeave={() => {
        onHoverChange?.(id, false);
        trackComponentEvent('hover_end', { workerId: id, name });
      }}
      data-testid="worker-card"
      data-worker-id={id}
      data-worker-name={name}
      data-worker-hp={hp}
      data-worker-fatigue={fatigue}
      className={[
        'relative w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border transition',
        isExhausted ? 'grayscale-[0.25] opacity-90 before:absolute before:inset-0 before:bg-linear-to-br before:from-black/40 before:to-transparent before:pointer-events-none' : '',
        isHovering ? 'ring-4 shadow-xl' : '',
        ...classes,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...cardStyle,
        borderColor: isHovering ? 'var(--accent-color)' : 'var(--card-border-color)',
        boxShadow: isExhausted ? '0 12px 24px rgba(0,0,0,0.35)' : cardStyle.boxShadow,
      }}
      {...attributes}
    >
      {isHovering && (
        <div
          className="pointer-events-none absolute inset-0 blur-3xl transition-opacity duration-300 shadow-cobalt"
          style={{ background: 'var(--card-highlight)' }}
        />
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
          <span className="text-sm font-semibold quest-title-bronze" style={{ color: 'var(--text-primary)' }}>
            {name}
          </span>
          <span className="text-[9px]" style={{ color: isExhausted ? 'var(--fatigue-bar-end)' : 'var(--hp-bar-end)' }}>
            {isExhausted ? 'ESAUSTO' : 'PRONTO'}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <div
              className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--hp-bar-end)' }}
            >
              <span>HP</span>
              <span>{hp}%</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full"
              style={{
                background: 'var(--hp-bar-track)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 12px var(--halo-color)'
              }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hp}%`,
                  background: `linear-gradient(90deg, var(--hp-bar-start), var(--hp-bar-end))`,
                }}
              />
            </div>
          </div>
          <div>
            <div
              className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--fatigue-bar-end)' }}
            >
              <span>FATICA</span>
              <span>{fatigue}%</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full"
              style={{
                background: 'var(--fatigue-bar-track)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 12px var(--halo-color)'
              }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${fatigue}%`,
                  background: `linear-gradient(90deg, var(--fatigue-bar-start), var(--fatigue-bar-end))`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { WorkerCard };

export default WorkerCard;
