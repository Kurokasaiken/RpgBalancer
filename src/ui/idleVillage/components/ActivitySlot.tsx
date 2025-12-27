import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import type { VerbVisualVariant } from '@/ui/idleVillage/VerbCard';
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
  /** When true, slot is locked (e.g. night phase) - shows overlay and blocks interaction */
  isLockedByPhase?: boolean;

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
  isLockedByPhase = false,
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

  const isHoveringValid = isOver && canAcceptDrop && !isLockedByPhase;

  const progressDegrees = clampedProgress * 360;
  const haloStartDeg = 0; // align start with base orientation
  const variantColors = VARIANT_COLORS[visualVariant] ?? VARIANT_COLORS.azure;
  const haloStyle: CSSProperties = {
    background: `conic-gradient(from ${haloStartDeg}deg, ${variantColors.primary} 0deg ${progressDegrees}deg, rgba(6,8,14,0.15) ${progressDegrees}deg 360deg)`,
  };

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

    // Block drops during night phase
    if (isLockedByPhase) {
      console.log('Slot locked by phase, drop blocked');
      setIsOver(false);
      setDraggingResidentId(null);
      return;
    }

    // Use the stored dragging resident ID first, fallback to dataTransfer
    const workerId =
      draggingResidentId ||
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) ||
      event.dataTransfer.getData('text/plain') ||
      null;
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
      'aria-label': `${isActive ? 'In progress' : 'Ready'}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'
        }. ${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
    }
    : {
      onClick: handleClick,
      'aria-label': `Activity slot ${label ?? slotId}. ${assignedWorkerName ? `Assigned to ${assignedWorkerName}` : 'Unassigned'
        }. ${isActive ? `${formatTime(remainingSeconds)} remaining` : `Duration: ${formatTime(totalDuration)}`}`.trim(),
    };

  const frameClasses = [
    'relative h-28 w-28 transition-transform duration-200',
    isLockedByPhase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    dropState === 'valid' && !isLockedByPhase
      ? 'scale-110 drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]'
      : dropState === 'invalid' || isLockedByPhase
        ? 'opacity-40 cursor-not-allowed'
        : isHoveringValid || hasWorker
          ? 'scale-105 drop-shadow-[0_0_28px_rgba(250,204,21,0.35)]'
          : 'drop-shadow-[0_0_22px_rgba(5,8,18,0.55)]',
  ].join(' ');

  return (
    <div
      className="flex items-center justify-center relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={frameClasses}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...interactiveProps}
      >
        <div className="absolute inset-0 rounded-full border border-slate-600/60 opacity-30" />
        <div className="absolute inset-0 rounded-full" style={haloStyle} />
        <div className="absolute inset-1 rounded-full bg-black/90 backdrop-blur-md" />

        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div
            className={clsx(
              'relative flex h-18 w-18 cursor-pointer select-none flex-col items-center justify-center rounded-2xl border border-slate-600/60 bg-black/80 text-xs text-amber-100 transition-all duration-200',
              dropState === 'valid' && 'ring-2 ring-green-400/70 bg-green-950/40',
              dropState === 'invalid' && 'ring-2 ring-red-400/70 bg-red-950/40',
              isOver && 'ring-4 ring-amber-300/60 scale-105',
              'hover:ring-2 hover:ring-amber-300/40',
            )}
          >
            <div className="text-3xl leading-none">
              {iconName ? <span aria-hidden>{iconName}</span> : <Sparkles className="h-6 w-6 text-amber-200" />}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.35em] text-amber-100/80 font-mono">
              {formatTime(isActive ? remainingSeconds : totalDuration)}
            </div>
          </div>
        </div>

        {workerInitial && (
          <div className="absolute -right-1 -top-1 z-20 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-50 border border-white/20">
            {workerInitial}
          </div>
        )}

        <span className="sr-only">
          {isLockedByPhase ? 'Slot locked (night phase). ' : ''}
          {assignedWorkerName ? `Assigned to ${assignedWorkerName}. ` : 'Unassigned. '}
          {isActive ? `${formatTime(remainingSeconds)} remaining.` : `Duration ${formatTime(totalDuration)}.`}
        </span>

        {/* Night phase lock overlay */}
        {isLockedByPhase && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-sm">
            <span className="text-2xl" aria-hidden>🔒</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitySlotCard;
