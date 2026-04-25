import { useDroppable } from '@dnd-kit/core';

interface DroppableActivitySlotProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string;
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
}

export function DroppableActivitySlot({
  slotId,
  iconName,
  label,
  assignedWorkerName,
  onInspect,
  onWorkerDrop,
}: DroppableActivitySlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
  });

  const workerInitial = assignedWorkerName?.charAt(0) ?? null;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        ref={setNodeRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const workerId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
          onWorkerDrop(workerId);
        }}
        onClick={() => onInspect?.(slotId)}
        className={[
          'relative h-28 w-28 cursor-pointer rounded-full border shadow-cobalt transition-all duration-200',
          assignedWorkerName
            ? 'ring-2 ring-emerald-400/70 shadow-[0_0_55px_rgba(0,70,120,0.55)]'
            : 'ring-2 ring-amber-500/30 shadow-[0_0_35px_rgba(255,215,0,0.45)]',
          isOver ? 'ring-amber-200 scale-110 animate-pulse shadow-[0_0_70px_rgba(255,215,0,0.65)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          borderColor: 'var(--color-bronze-light)',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(13,15,18,0.95))',
        }}
        aria-label={`Activity slot ${slotId}`}
      >
        <div className="absolute inset-1 rounded-full border" style={{ borderColor: 'rgba(255,215,0,0.15)' }} />
        <div
          className="absolute inset-4 flex items-center justify-center rounded-full text-3xl text-amber-200 shadow-inner shadow-black/70"
          style={{ background: 'var(--panel-surface)' }}
        >
          <span aria-hidden>{iconName}</span>
        </div>
        {workerInitial && (
          <div className="gem-oil absolute -right-1 -top-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-50">
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
}
