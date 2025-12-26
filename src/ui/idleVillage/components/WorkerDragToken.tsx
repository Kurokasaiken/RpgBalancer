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
  statusLabel?: string;
  isInteractive?: boolean;
  onDragStateChange?: (workerId: string, isDragging: boolean) => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSelect?: (workerId: string) => void;
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
  statusLabel,
  isInteractive = true,
  onDragStateChange,
  onDragStart,
  onDragEnd,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onSelect,
}) => {
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const didDragRef = useRef(false);
  const isUnavailable = disabled || !isInteractive;
  const computedStatusLabel = statusLabel ?? (isUnavailable ? 'Unavailable' : 'Available');

  const cleanupPreview = () => {
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (isUnavailable) {
      event.preventDefault();
      return;
    }
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

    didDragRef.current = true;
    onDragStateChange?.(workerId, true);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    cleanupPreview();
    if (isUnavailable) return;
    didDragRef.current = false;
    onDragEnd?.(event);
    onDragStateChange?.(workerId, false);
  };

  const handlePointerDownInternal = (event: React.PointerEvent<HTMLDivElement>) => {
    didDragRef.current = false;
    onPointerDown?.(event);
  };

  const handlePointerUpInternal = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (!didDragRef.current) {
      onSelect?.(workerId);
    }
    didDragRef.current = false;
  };

  const handlePointerCancelInternal = (event: React.PointerEvent<HTMLDivElement>) => {
    didDragRef.current = false;
    onPointerCancel?.(event);
  };

  const constrainedHp = Math.max(0, Math.min(100, hp));
  const constrainedFatigue = Math.max(0, Math.min(100, fatigue));
  const baseTokenClasses = horizontal
    ? 'flex items-center gap-3 rounded-[18px] border border-white/15 bg-[rgba(8,12,18,0.65)] px-3 py-2 text-left text-xs text-amber-100 shadow-[0_12px_26px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all max-w-sm'
    : 'flex flex-col gap-2 rounded-[22px] border border-white/15 bg-[rgba(6,10,18,0.7)] px-4 py-3 text-left text-xs text-amber-100 shadow-[0_18px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all';

  return (
    <div
      draggable={!isUnavailable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid="worker-drag-token"
      data-worker-id={workerId}
      className={[
        baseTokenClasses,
        isUnavailable ? 'cursor-not-allowed opacity-35 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-emerald-300/70',
        isDragging ? 'opacity-40' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={handlePointerDownInternal}
      onPointerUp={handlePointerUpInternal}
      onPointerCancel={handlePointerCancelInternal}
    >
      {horizontal ? (
        // Horizontal bar mode
        <>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-200/70 bg-[rgba(18,12,0,0.65)] text-[11px] font-semibold uppercase tracking-[0.3em] shadow-inner shadow-amber-900/40">
            {label.charAt(0) || workerId.charAt(0)}
          </div>
          
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">HP</span>
              <div className="flex-1 h-1 rounded-full bg-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all"
                  style={{ width: `${constrainedHp}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 w-6 text-right">
                {maxHp ? `${hp}/${maxHp}` : `${constrainedHp}%`}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 w-3">F</span>
              <div className="flex-1 h-1 rounded-full bg-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all"
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
