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
}) => {
  const isExhausted = fatigue > 90;

  const cardStyle: React.CSSProperties = {
    borderColor: 'var(--card-border-color)',
    background: `var(--card-surface-radial), var(--card-surface)`,
    boxShadow: isHovering ? '0 0 80px var(--halo-color)' : '0 18px 35px var(--card-shadow-color)',
    color: 'var(--text-primary)',
  };

  if (isDragging) {
    return (
      <div
        data-testid="worker-card"
        data-worker-id={id}
        data-worker-name={name}
        data-worker-hp={hp}
        data-worker-fatigue={fatigue}
        className="flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-semibold shadow-[0_0_35px_rgba(251,191,36,0.45)]"
        style={{
          borderColor: 'var(--accent-color)',
          background: 'var(--card-surface)',
          color: 'var(--accent-strong)',
          boxShadow: `0 0 35px var(--halo-color)`,
        }}
      >
        {name.charAt(0) || id.charAt(0)}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => onHoverChange?.(id, true)}
      onMouseLeave={() => onHoverChange?.(id, false)}
      data-testid="worker-card"
      data-worker-id={id}
      data-worker-name={name}
      data-worker-hp={hp}
      data-worker-fatigue={fatigue}
      className={[
        'relative w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border p-4 transition',
        isExhausted ? 'grayscale-[0.45] opacity-85' : '',
        isHovering ? 'ring-4 shadow-xl' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...cardStyle,
        borderColor: isHovering ? 'var(--accent-color)' : 'var(--card-border-color)',
        boxShadow: isExhausted ? '0 12px 24px rgba(0,0,0,0.35)' : cardStyle.boxShadow,
      }}
    >
      {isHovering && (
        <div
          className="pointer-events-none absolute inset-0 blur-2xl transition-opacity duration-300"
          style={{ background: 'var(--card-highlight)' }}
        />
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {name}
          </span>
          <span className="text-[9px]" style={{ color: isExhausted ? 'var(--fatigue-bar-end)' : 'var(--hp-bar-end)' }}>
            {isExhausted ? 'ESAUSTO' : 'PRONTO'}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div
              className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--hp-bar-end)' }}
            >
              <span>HP</span>
              <span>{hp}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--hp-bar-track)' }}>
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
            <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--fatigue-bar-track)' }}>
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

export default WorkerCard;
