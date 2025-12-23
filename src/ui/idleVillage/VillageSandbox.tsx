import { useState } from 'react';

type Worker = {
  id: string;
  name: string;
  hp: number;
  fatigue: number;
};

type ActivitySlotData = {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerId: string | null;
};

const WORKER_DRAG_MIME = 'application/x-frontier-worker';

type WorkerCardProps = Worker;

const WorkerCard: React.FC<WorkerCardProps> = ({ id, name, hp, fatigue }) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(WORKER_DRAG_MIME, id);
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition hover:border-emerald-300/60 hover:shadow-[0_12px_35px_rgba(16,185,129,0.2)]"
    >
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-ivory">{name}</div>

      <label className="mb-1 block text-[11px] uppercase tracking-[0.4em] text-emerald-200/80">HP</label>
      <div className="h-3 w-full rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${hp}%` }} />
      </div>

      <label className="mb-1 mt-4 block text-[11px] uppercase tracking-[0.4em] text-amber-200/80">Fatica</label>
      <div className="h-3 w-full rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${fatigue}%` }} />
      </div>
    </div>
  );
};

interface ActivitySlotProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string | null;
  onWorkerDrop: (workerId: string | null) => void;
}

const ActivitySlot: React.FC<ActivitySlotProps> = ({ slotId, iconName, label, assignedWorkerName, onWorkerDrop }) => {
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
    const workerId = event.dataTransfer.getData(WORKER_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onWorkerDrop(workerId);
    setIsOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative h-28 w-28 rounded-full border-2 border-amber-200/40 bg-slate-900/70 shadow-[0_0_30px_rgba(201,162,39,0.25)] transition-all duration-200',
          isOver ? 'border-emerald-300/70 shadow-[0_0_45px_rgba(16,185,129,0.4)] scale-105' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Activity slot ${slotId}`}
      >
        <div className="absolute inset-1 rounded-full border border-slate-700/60" />
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-slate-950/90 text-3xl">
          {iconName}
        </div>
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

const VillageSandbox = () => {
  const [workers] = useState<Worker[]>([
    { id: 'worker-1', name: 'Fondatore', hp: 92, fatigue: 18 },
    { id: 'worker-2', name: 'Taglialegna', hp: 74, fatigue: 42 },
    { id: 'worker-3', name: 'Cacciatore', hp: 65, fatigue: 27 },
  ]);

  const [slots, setSlots] = useState<ActivitySlotData[]>([
    { slotId: 'slot-berries', label: 'Raccolta bacche', iconName: '🍇', assignedWorkerId: null },
    { slotId: 'slot-well', label: 'Scavo pozzo', iconName: '🕳️', assignedWorkerId: null },
  ]);

  const handleWorkerDrop = (slotId: string, workerId: string | null) => {
    if (!workerId) return;
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.slotId === slotId) {
          return { ...slot, assignedWorkerId: workerId };
        }
        if (slot.assignedWorkerId === workerId) {
          return { ...slot, assignedWorkerId: null };
        }
        return slot;
      }),
    );
  };

  const resolveWorkerName = (workerId: string | null) => workers.find((worker) => worker.id === workerId)?.name ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6 text-ivory">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Village Sandbox</p>
        <h1 className="text-3xl font-semibold tracking-widest">Frontier — Atomic Layer</h1>
        <p className="text-sm text-slate-300">
          Trascina i lavoratori negli slot attività per vedere le barre reagire e il cerchio Halo evidenziare il drop.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Lavoratori</h2>
          <div className="flex flex-col gap-4">
            {workers.map((worker) => (
              <WorkerCard key={worker.id} {...worker} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</h2>
          <div className="flex flex-wrap items-start gap-6">
            {slots.map((slot) => (
              <ActivitySlot
                key={slot.slotId}
                slotId={slot.slotId}
                iconName={slot.iconName}
                label={slot.label}
                assignedWorkerName={resolveWorkerName(slot.assignedWorkerId)}
                onWorkerDrop={(workerId) => handleWorkerDrop(slot.slotId, workerId)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VillageSandbox;
