import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface ActivitySlotProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string | null;
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
}

const ActivitySlot: React.FC<ActivitySlotProps> = ({ slotId, iconName, label, assignedWorkerName, onWorkerDrop, onInspect }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const workerId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    onWorkerDrop(workerId);
    setIsOver(false);
  };

  const workerInitial = assignedWorkerName?.charAt(0) ?? null;
  const hasWorker = Boolean(assignedWorkerName);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onInspect?.(slotId)}
        className={[
          'relative h-28 w-28 rounded-full border border-slate-700/80 bg-slate-900 drop-shadow-xl transition-all duration-200',
          hasWorker
            ? 'ring-2 ring-emerald-400/70 shadow-[0_0_45px_rgba(16,185,129,0.45)]'
            : 'ring-2 ring-amber-500/30 shadow-[0_0_30px_rgba(201,162,39,0.35)]',
          isOver ? 'ring-amber-300 scale-110 animate-pulse shadow-[0_0_60px_rgba(251,191,36,0.55)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Activity slot ${slotId}`}
      >
        <div className="absolute inset-1 rounded-full border border-slate-700/60" />
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-slate-950/90 text-3xl text-amber-200">
          {iconName ? (
            <span aria-hidden>{iconName}</span>
          ) : (
            <Sparkles className="h-6 w-6 text-amber-200" />
          )}
        </div>
        {workerInitial && (
          <div className="absolute -right-1 -top-1 rounded-full border border-amber-300/70 bg-slate-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.55)]">
            {workerInitial}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.35em] text-slate-300">{label}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200">
          {assignedWorkerName ? assignedWorkerName : 'Trascina un lavoratore'}
        </div>
      </div>
    </div>
  );
};

export default ActivitySlot;
