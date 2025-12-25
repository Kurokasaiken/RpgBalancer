import { useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Props for the draggable/droppable activity slot nodes on the village map.
 */
export interface ActivitySlotProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string | null;
  canAcceptDrop?: boolean;
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
}

/**
 * Circular drop target showing available activities and assigned residents.
 */
const ActivitySlot: React.FC<ActivitySlotProps> = ({ slotId, iconName, label, assignedWorkerName, canAcceptDrop = true, onWorkerDrop, onInspect }) => {
  const [isOver, setIsOver] = useState(false);

  /**
   * Marks the slot as active when a resident is dragged over it.
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isOver) setIsOver(true);
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
    event.preventDefault();
    
    // Check if drop is allowed
    if (!canAcceptDrop) {
      setIsOver(false);
      return;
    }
    
    const workerId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    onWorkerDrop(workerId);
    setIsOver(false);
  };

  const workerInitial = assignedWorkerName?.charAt(0) ?? null;
  const hasWorker = Boolean(assignedWorkerName);
  
  // Bloom mode - show on all valid slots during drag, enhanced when hovering
  const bloomActive = canAcceptDrop || hasWorker;
  const isHoveringValid = isOver && canAcceptDrop;
  
  const baseClasses = [
    'relative h-28 w-28 rounded-full border transition-all duration-200',
    isHoveringValid
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
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onInspect?.(slotId)}
        className={baseClasses}
        style={slotStyle}
        aria-label={`Activity slot ${label ?? slotId}`}
      >
        <div
          className="absolute inset-1 rounded-full border"
          style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}
        />
        <div
          className="absolute inset-4 flex items-center justify-center rounded-full text-3xl text-amber-200 shadow-inner shadow-black/70"
          style={{ background: 'var(--panel-surface)' }}
        >
          {iconName ? (
            <span aria-hidden>{iconName}</span>
          ) : (
            <Sparkles className="h-6 w-6 text-amber-200" />
          )}
        </div>
        {workerInitial && (
          <div className="gem-oil absolute -right-1 -top-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-50">
            {workerInitial}
          </div>
        )}
      </div>
      <div className="text-xs text-slate-400 max-w-28 truncate">
        {label}
      </div>
    </div>
  );
};

export default ActivitySlot;
