import { useRef } from 'react';

/**
 * Visual card props representing a drag-enabled resident in Idle Village.
 */
export interface WorkerCardProps {
  id: string;
  name: string;
  hp: number;
  fatigue: number;
  onHoverChange?: (workerId: string, isHovering: boolean) => void;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  isGhosted?: boolean;
  isHovering?: boolean;
}

/**
 * Resident card with drag previews, HP/fatigue bars, and hover states.
 */
const WorkerCard: React.FC<WorkerCardProps> = ({
  id,
  name,
  hp,
  fatigue,
  onHoverChange,
  onDragStateChange,
  isGhosted = false,
  isHovering = false,
}) => {
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  /**
   * Removes the temporary drag preview element from the DOM.
   */
  const cleanupPreview = () => {
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  };

  /**
   * Initializes drag metadata and renders the custom drag image preview.
   */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.dataTransfer.setData('text/resident-id', id);
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    const preview = document.createElement('div');
    preview.className =
      'flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/80 bg-slate-950 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.55)]';
    preview.textContent = name.charAt(0) || id.charAt(0);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;
    event.dataTransfer.setDragImage(preview, 24, 24);
    onDragStateChange?.(id, true);
  };

  /**
   * Resets drag preview and notifies listeners that dragging ended.
   */
  const handleDragEnd = () => {
    cleanupPreview();
    onDragStateChange?.(id, false);
  };

  const isExhausted = fatigue > 90;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => onHoverChange?.(id, true)}
      onMouseLeave={() => onHoverChange?.(id, false)}
      onDragEnd={handleDragEnd}
      data-testid="worker-card"
      data-worker-id={id}
      data-worker-name={name}
      className={[
        'relative w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90 p-4 shadow-[0_18px_35px_rgba(0,0,0,0.55)] transition',
        'bg-[radial-gradient(circle_at_top,#101826_0%,#05070d_70%)]',
        isExhausted ? 'grayscale-[0.45] opacity-85' : 'hover:border-emerald-300/70 hover:shadow-[0_25px_45px_rgba(34,197,94,0.2)]',
        isGhosted ? 'opacity-30 pointer-events-none' : '',
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
