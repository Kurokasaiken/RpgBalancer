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
  maxHp?: number;
  isDragging?: boolean;
  disabled?: boolean;
  className?: string;
  horizontal?: boolean; // New prop for horizontal bar mode
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
  maxHp,
  isDragging = false,
  disabled = false,
  className,
  horizontal = false,
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

    // Create SVG drag preview
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
    svg.style.position = 'fixed';
    svg.style.top = '-2000px';
    svg.style.left = '-2000px';
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '24');
    circle.setAttribute('cy', '24');
    circle.setAttribute('r', '22');
    circle.setAttribute('fill', 'rgba(15, 23, 42, 0.95)');
    circle.setAttribute('stroke', 'rgba(251, 191, 36, 0.8)');
    circle.setAttribute('stroke-width', '2');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '24');
    text.setAttribute('y', '24');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#fef3c7');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.textContent = (label.charAt(0) || workerId.charAt(0)).toUpperCase();
    
    svg.appendChild(circle);
    svg.appendChild(text);
    
    document.body.appendChild(svg);
    
    // Set drag image
    event.dataTransfer.setDragImage(svg, 24, 24);
    
    // Remove after drag
    setTimeout(() => {
      if (svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
    }, 100);

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
        horizontal 
          ? 'flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1.5 text-left text-xs text-amber-100 transition-all max-w-xs'
          : 'flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-4 py-3 text-left text-xs text-amber-100 shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition',
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
      {horizontal ? (
        // Horizontal bar mode
        <>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/80 bg-slate-900 text-xs font-semibold uppercase tracking-[0.3em] shrink-0">
            {label.charAt(0) || workerId.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 truncate font-medium text-[10px]">{label}</span>
              <span className="text-[9px] text-slate-500 capitalize">
                {disabled ? 'injured' : 'available'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">HP</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${constrainedHp}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 w-6 text-right">
                {maxHp ? `${hp}/${maxHp}` : `${constrainedHp}%`}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">F</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${constrainedFatigue}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 w-6 text-right">
                {constrainedFatigue}%
              </span>
            </div>
          </div>
        </>
      ) : (
        // Original vertical mode
        <>
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
                  className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500 transition-all"
                  style={{ width: `${constrainedFatigue}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkerDragToken;
