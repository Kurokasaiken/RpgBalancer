import { useRef } from 'react';

/**
 * Props for the draggable rectangular token that mirrors worker stats.
 */
export interface WorkerDragTokenProps {
  workerId: string;
  label: string;
  subtitle?: string;
  hp: number;
  fatigue: number;
  isDragging?: boolean;
  disabled?: boolean;
  className?: string;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Draggable rectangular badge that exposes resident stats and controls the drag lifecycle.
 */
const WorkerDragToken: React.FC<WorkerDragTokenProps> = ({
  workerId,
  label,
  subtitle,
  hp,
  fatigue,
  isDragging = false,
  disabled = false,
  className,
  onDragStateChange,
  onDragStart,
  onDragEnd,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}) => {
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const cleanupPreview = () => {
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.dataTransfer.setData('text/resident-id', workerId);
    event.dataTransfer.setData('text/plain', workerId);
    event.dataTransfer.effectAllowed = 'move';

    // Create canvas drag preview for perfect circle
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw circle background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; // slate-900 with transparency
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // amber-300
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw shadow
      ctx.shadowColor = 'rgba(251, 191, 36, 0.55)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = '#fef3c7'; // amber-100
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((label.charAt(0) || workerId.charAt(0)).toUpperCase(), 24, 24);
      
      // Set drag image
      event.dataTransfer.setDragImage(canvas, 24, 24);
    }

    onDragStateChange?.(workerId, true);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    cleanupPreview();
    if (disabled) return;
    onDragEnd?.(event);
    onDragStateChange?.(workerId, false);
  };

  const constrainedHp = Math.max(0, Math.min(100, hp));
  const constrainedFatigue = Math.max(0, Math.min(100, fatigue));

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid="worker-drag-token"
      data-worker-id={workerId}
      className={[
        'flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-4 py-3 text-left text-xs text-amber-100 shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition',
        disabled ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-emerald-400/70',
        isDragging ? 'opacity-40' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[0.08em] text-ivory">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/60 bg-slate-900 text-base font-semibold uppercase tracking-[0.3em]">
          {label.charAt(0) || workerId.charAt(0)}
        </div>
      </div>
      {subtitle && <span className="text-[10px] tracking-wide text-slate-400">{subtitle}</span>}
      <div className="space-y-2 pt-1 text-[10px] tracking-[0.2em] uppercase">
        <div>
          <div className="mb-1 flex items-center justify-between text-emerald-200/80">
            <span>HP</span>
            <span>{constrainedHp}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500 transition-all"
              style={{ width: `${constrainedHp}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-amber-200/80">
            <span>FATICA</span>
            <span>{constrainedFatigue}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 transition-all"
              style={{ width: `${constrainedFatigue}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDragToken;
