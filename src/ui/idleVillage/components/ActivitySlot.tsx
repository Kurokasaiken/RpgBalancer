import { useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';

export type VerbVisualVariant = 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
export type DropState = 'idle' | 'valid' | 'invalid';

/**
 * Props for the enhanced activity slot with VerbCard-like behaviors.
 */
export interface ActivitySlotCardProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string | null;
  
  // Progress & Timer
  progressFraction: number; // 0 to 1
  elapsedSeconds: number;   // For timer display
  totalDuration: number;    // Total duration in seconds
  
  // Interaction
  isInteractive?: boolean;
  dropState?: DropState;
  canAcceptDrop?: boolean;
  visualVariant?: VerbVisualVariant;
  
  // Callbacks
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onHoverChange?: (slotId: string, isHovering: boolean) => void;
  onDropComplete?: (slotId: string, workerId: string | null) => void;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const formatTime = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VARIANT_COLORS: Record<VerbVisualVariant, { primary: string; glow: string }> = {
  azure: { primary: 'rgba(59, 130, 246, 0.55)', glow: 'rgba(59, 130, 246, 0.8)' },
  ember: { primary: 'rgba(251, 146, 60, 0.55)', glow: 'rgba(251, 146, 60, 0.8)' },
  jade: { primary: 'rgba(34, 197, 94, 0.55)', glow: 'rgba(34, 197, 94, 0.8)' },
  amethyst: { primary: 'rgba(168, 85, 247, 0.55)', glow: 'rgba(168, 85, 247, 0.8)' },
  solar: { primary: 'rgba(251, 191, 36, 0.55)', glow: 'rgba(251, 191, 36, 0.8)' },
};

/**
 * Enhanced activity slot with VerbCard-like progress, timer, and interaction states.
 */
const ActivitySlotCard: React.FC<ActivitySlotCardProps> = ({
  slotId,
  iconName,
  label,
  assignedWorkerName,
  progressFraction,
  elapsedSeconds,
  totalDuration,
  isInteractive = false,
  dropState = 'idle',
  canAcceptDrop = true,
  visualVariant = 'azure',
  onWorkerDrop,
  onInspect,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  
  const clampedProgress = clamp01(progressFraction);
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const isActive = elapsedSeconds > 0 && remainingSeconds > 0;
  const workerInitial = assignedWorkerName?.charAt(0) ?? null;
  const hasWorker = Boolean(assignedWorkerName);
  
  // Bloom mode - show on all valid slots during drag, enhanced when hovering
  const bloomActive = canAcceptDrop || hasWorker;
  const isHoveringValid = isOver && canAcceptDrop;
  
  // Progress calculation for halo
  const progressDegrees = clampedProgress * 360;
  const haloStartDeg = -90; // start from top (12 o'clock)
  const haloHighlightStartDeg = haloStartDeg + Math.max(progressDegrees - 40, 0);
  const variantColors = VARIANT_COLORS[visualVariant] ?? VARIANT_COLORS.azure;

  /**
   * Sets visual highlight when a dragged resident enters the slot.
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Worker tokens declare effectAllowed='move', so we must mirror it here
    event.dataTransfer.dropEffect = 'move';
    setIsOver(true);
    
    // Capture the dragging resident ID
    const residentId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    if (residentId) {
      setDraggingResidentId(residentId);
    }
  };

  /**
   * Clears visual highlight when a dragged resident leaves the slot.
   */
  const handleDragLeave = () => {
    setIsOver(false);
  };

  /**
   * Accepts the dropped resident id and notifies listeners about assignment.
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('ActivitySlot handleDrop called');
    event.preventDefault();
    
    // Use the stored dragging resident ID first, fallback to dataTransfer
    const workerId = draggingResidentId || event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    console.log('Dropped workerId:', workerId);
    
    if (!workerId) {
      console.log('No worker ID found');
      setIsOver(false);
      setDraggingResidentId(null);
      return;
    }
    
    console.log('Calling onWorkerDrop with:', workerId);
    onWorkerDrop(workerId);
    setIsOver(false);
    setDraggingResidentId(null);
  };

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    } else if (onInspect) {
      onInspect(slotId);
    }
  };

  const interactiveProps = isInteractive
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: handleClick,
        'aria-pressed': isActive,
        'aria-label': `${isActive ? 'In progress' : 'Ready'}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'}. ` +
          `${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
      }
    : {
        onClick: handleClick,
        'aria-label': `Activity slot ${label ?? slotId}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'}. ` +
          `${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
      };
  
  const baseClasses = [
    'relative h-28 w-28 rounded-full border transition-all duration-200 cursor-pointer',
    dropState === 'valid'
      ? 'ring-4 ring-emerald-400/90 drop-shadow-[0_0_60px_rgba(16,185,129,0.8)] scale-110 border-emerald-400/60'
      : dropState === 'invalid'
        ? 'opacity-35 border-white/15 cursor-not-allowed'
        : isHoveringValid
          ? 'ring-4 ring-white/90 drop-shadow-[0_0_80px_rgba(255,255,255,0.8)] scale-110 border-white/50'
          : bloomActive
            ? 'ring-4 ring-yellow-400/80 drop-shadow-[0_0_60px_rgba(251,204,21,0.7)] scale-105 border-yellow-400/60'
            : 'shadow-cobalt scale-100',
  ].join(' ');

  const baseShadow = hasWorker ? '0 0 55px var(--color-cobalt-glow)' : '0 0 35px var(--color-bronze-light)';
  const slotStyle: CSSProperties = {
    borderColor: 'var(--color-bronze-light)',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(13,15,18,0.95))',
    boxShadow: bloomActive ? undefined : baseShadow, // Let ring/drop-shadow handle bloom when active
  };

  return (
    <div
      className="flex items-center justify-center relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={baseClasses}
        style={slotStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...interactiveProps}
      >
        <div className="absolute inset-1 rounded-full border" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }} />

        {/* Halo + icon container */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[6.5rem] w-[6.5rem]">
            {/* Halo progress indicator - always visible */}
            <div className="absolute inset-0">
              <div className="absolute inset-1 rounded-full border border-slate-900/70" />
              <div
                className="absolute inset-2 rounded-full opacity-70 blur-[0.5px]"
                style={{
                  background: `conic-gradient(from ${haloStartDeg}deg, ${variantColors.primary} 0deg ${progressDegrees}deg, rgba(4,6,16,0.35) ${progressDegrees}deg 360deg)`,
                }}
              />
              <div
                className="absolute inset-3 rounded-full mix-blend-screen opacity-70"
                style={{
                  background: `conic-gradient(from ${haloHighlightStartDeg}deg, rgba(255,255,255,0.4), transparent 120deg)`,
                }}
              />
              <div className="absolute inset-[10px] rounded-full border border-slate-900/60 border-dashed opacity-40 animate-[spin_14s_linear_infinite]" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative z-10 flex h-[4.8rem] w-[4.8rem] flex-col items-center justify-center rounded-full text-amber-200 shadow-inner shadow-black/70"
            style={{ background: 'var(--panel-surface)' }}
          >
            <div className="text-3xl leading-none">
              {iconName ? <span aria-hidden>{iconName}</span> : <Sparkles className="h-6 w-6 text-amber-200" />}
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-amber-100/85 font-mono">
              {formatTime(isActive ? remainingSeconds : totalDuration)}
            </div>
          </div>
        </div>

        {/* Worker indicator */}
        {workerInitial && (
          <div className="gem-oil absolute -right-1 -top-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-50 z-20">
            {workerInitial}
          </div>
        )}

        {/* Screen-reader only timetable info */}
        <span className="sr-only">
          {assignedWorkerName ? `Assigned to ${assignedWorkerName}. ` : 'Unassigned. '}
          {isActive ? `${formatTime(remainingSeconds)} remaining.` : `Duration ${formatTime(totalDuration)}.`}
        </span>
      </div>
    </div>
  );
};

export default ActivitySlotCard;
