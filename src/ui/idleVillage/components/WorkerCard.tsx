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

  if (isDragging) {
    return (
      <div
        data-testid="worker-card"
        data-worker-id={id}
        data-worker-name={name}
        data-worker-hp={hp}
        data-worker-fatigue={fatigue}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/60 bg-slate-950/80 text-2xl font-semibold text-amber-200 shadow-[0_0_35px_rgba(251,191,36,0.45)]"
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
        'relative w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90 p-4 shadow-[0_18px_35px_rgba(0,0,0,0.55)] transition',
        'bg-[radial-gradient(circle_at_top,#101826_0%,#05070d_70%)]',
        isExhausted ? 'grayscale-[0.45] opacity-85' : 'hover:border-emerald-300/70 hover:shadow-[0_25px_45px_rgba(34,197,94,0.2)]',
        isHovering ? 'ring-4 ring-amber-300/70 shadow-[0_0_80px_rgba(251,191,36,0.45)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isHovering && (
        <div className="pointer-events-none absolute inset-0 bg-amber-200/10 blur-2xl transition-opacity duration-300" />
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
          <span className="text-sm font-semibold text-ivory">{name}</span>
          <span className="text-[9px] text-slate-500">{isExhausted ? 'ESAUSTO' : 'PRONTO'}</span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-emerald-200/70">
              <span>HP</span>
              <span>{hp}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80">
              <div className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500 transition-all" style={{ width: `${hp}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-amber-200/80">
              <span>FATICA</span>
              <span>{fatigue}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80">
              <div className="h-full rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 transition-all" style={{ width: `${fatigue}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;
