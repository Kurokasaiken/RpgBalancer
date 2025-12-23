import { useEffect, useMemo, useState } from 'react';
import type { MarbleCardTone } from '@/ui/fantasy/assets/marble-verb-card/marbleCardTokens';
import ResidentRoster from '@/ui/idleVillage/ResidentRoster';
import VerbCard, { type VerbVisualVariant, type ProgressStyle } from '@/ui/idleVillage/VerbCard';
import TheaterView from '@/ui/idleVillage/components/TheaterView';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

type SandboxSlot = {
  id: string;
  label: string;
  icon: string;
  tone: MarbleCardTone;
  totalDuration: number;
  remainingSeconds: number;
  injuryPercent: number;
  deathPercent: number;
  assignedResidentId: string | null;
};

const toneToVariant: Record<MarbleCardTone, VerbVisualVariant> = {
  day: 'solar',
  night: 'amethyst',
  job: 'jade',
  quest: 'amethyst',
  danger: 'ember',
  neutral: 'azure',
  system: 'solar',
};

const toneToProgressStyle: Record<MarbleCardTone, ProgressStyle> = {
  day: 'halo',
  night: 'halo',
  job: 'border',
  quest: 'halo',
  danger: 'border',
  neutral: 'ribbon',
  system: 'ribbon',
};

const buildResident = (params: Partial<ResidentState> & Pick<ResidentState, 'id' | 'displayName'>): ResidentState => ({
  homeId: undefined,
  status: 'available',
  fatigue: 0,
  injuryRecoveryTime: undefined,
  statProfileId: undefined,
  statSnapshot: {},
  statTags: [],
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...params,
});

const SandboxVerbCardSlot = ({
  slot,
  isDragActive,
  onDropResident,
  onFocus,
  isSelected,
}: {
  slot: SandboxSlot;
  isDragActive: boolean;
  onDropResident: (residentId: string | null) => void;
  onFocus: () => void;
  isSelected: boolean;
}) => {
  const [isOver, setIsOver] = useState(false);
  const progressFraction =
    slot.totalDuration > 0 ? Math.max(0, Math.min(1, 1 - slot.remainingSeconds / slot.totalDuration)) : 0;

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(true);
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const residentId = event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onDropResident(residentId);
    setIsOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'relative rounded-3xl border px-5 py-4 transition-all duration-200',
        isOver ? 'border-amber-300/80 bg-amber-100/5 shadow-[0_0_35px_rgba(217,180,130,0.35)]' : 'border-slate-800 bg-black/60',
        isSelected ? 'ring-2 ring-amber-300/70' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <VerbCard
        icon={slot.icon}
        progressFraction={progressFraction}
        elapsedSeconds={slot.totalDuration - slot.remainingSeconds}
        totalDuration={slot.totalDuration}
        injuryPercentage={slot.injuryPercent}
        deathPercentage={slot.deathPercent}
        assignedCount={slot.assignedResidentId ? 1 : 0}
        totalSlots={1}
        visualVariant={toneToVariant[slot.tone] ?? 'jade'}
        progressStyle={toneToProgressStyle[slot.tone] ?? 'border'}
        isInteractive
        dropState={isDragActive || isOver ? 'valid' : 'idle'}
        onClick={onFocus}
        className="mx-auto"
      />
      <div className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-slate-300">
        {slot.label}
        <div className="mt-1 text-[9px] text-slate-400">
          {slot.assignedResidentId ? (
            <span className="text-amber-200">{slot.assignedResidentId}</span>
          ) : (
            <span>Trascina un residente</span>
          )}
        </div>
      </div>
    </div>
  );
};

const VillageSandbox = () => {
  const [residents] = useState<ResidentState[]>([
    buildResident({ id: 'resident-1', displayName: 'Arianna' }),
    buildResident({ id: 'resident-2', displayName: 'Bastian' }),
  ]);

  const [slots, setSlots] = useState<SandboxSlot[]>([
    {
      id: 'slot-1',
      label: 'Mining Surge',
      icon: '⚒',
      tone: 'job',
      totalDuration: 40,
      remainingSeconds: 40,
      injuryPercent: 12,
      deathPercent: 3,
      assignedResidentId: null,
    },
  ]);

  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const handleResidentDragStart =
    (residentId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData(RESIDENT_DRAG_MIME, residentId);
      event.dataTransfer.setData('text/plain', residentId);
      event.dataTransfer.effectAllowed = 'copy';
      setDraggingResidentId(residentId);
    };

  const handleResidentDragEnd = () => {
    setDraggingResidentId(null);
  };

  const handleDropResident = (slotId: string, residentId: string | null) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, assignedResidentId: residentId, remainingSeconds: slot.totalDuration }
          : slot.assignedResidentId === residentId
            ? { ...slot, assignedResidentId: null, remainingSeconds: slot.totalDuration }
            : slot,
      ),
    );
    if (residentId) {
      setSelectedSlotId(slotId);
    }
    setDraggingResidentId(null);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlots((prev) =>
        prev.map((slot) => {
          if (!slot.assignedResidentId || slot.remainingSeconds <= 0) return slot;
          return { ...slot, remainingSeconds: slot.remainingSeconds - 1 };
        }),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const activeLabels = useMemo(() => {
    const current = slots
      .filter((slot) => slot.assignedResidentId)
      .map((slot) => slot.assignedResidentId as string);
    return current.length > 0 ? current.join(', ') : null;
  }, [slots]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-ivory">Village Sandbox</h1>

      <div className="space-y-8 rounded-3xl border border-amber-200/25 bg-[radial-gradient(circle_at_top,#050509_0%,#050509_55%,#010102_100%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-sm uppercase tracking-[0.35em] text-slate-400">Residenti (roster live)</h2>
            <ResidentRoster
              residents={residents}
              activeResidentId={draggingResidentId}
              onDragStart={handleResidentDragStart}
              onDragEnd={handleResidentDragEnd}
              assignmentFeedback={null}
              maxFatigueBeforeExhausted={100}
            />
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-sm uppercase tracking-[0.35em] text-slate-400">Verb Cards</h2>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-end">
              {slots.map((slot) => (
                <SandboxVerbCardSlot
                  key={slot.id}
                  slot={slot}
                  isDragActive={Boolean(draggingResidentId)}
                  onDropResident={(residentId) => handleDropResident(slot.id, residentId)}
                  onFocus={() => setSelectedSlotId(slot.id)}
                  isSelected={selectedSlotId === slot.id}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800/60 bg-black/70 p-4 text-xs uppercase tracking-[0.3em] text-slate-400">
          <div>
            Slot attivo:{' '}
            {activeLabels ? <span className="text-amber-200">{activeLabels}</span> : <span className="text-slate-500">—</span>}
          </div>
        </section>
        {selectedSlotId && (
          <TheaterView
            slotLabel={slots.find((slot) => slot.id === selectedSlotId)?.label ?? selectedSlotId}
            slotIcon={slots.find((slot) => slot.id === selectedSlotId)?.icon}
            verbs={
              slots
                .filter((slot) => slot.id === selectedSlotId)
                .map((slot) => slotToVerbSummary(slot))
            }
            onClose={() => setSelectedSlotId(null)}
            acceptResidentDrop={Boolean(draggingResidentId)}
            onResidentDrop={(residentId) => handleDropResident(selectedSlotId, residentId)}
          />
        )}
      </div>
    </div>
  );
};

function slotToVerbSummary(slot: SandboxSlot): VerbSummary {
  const progressFraction =
    slot.totalDuration > 0 ? Math.max(0, Math.min(1, 1 - slot.remainingSeconds / slot.totalDuration)) : 0;
  return {
    key: slot.id,
    source: 'scheduled',
    slotId: slot.id,
    label: slot.label,
    kindLabel: 'Sandbox Job',
    isQuest: false,
    isJob: true,
    icon: slot.icon,
    visualVariant: toneToVariant[slot.tone] ?? 'jade',
    progressStyle: toneToProgressStyle[slot.tone] ?? 'border',
    progressFraction,
    elapsedSeconds: slot.totalDuration - slot.remainingSeconds,
    totalDurationSeconds: slot.totalDuration,
    remainingSeconds: slot.remainingSeconds,
    injuryPercentage: slot.injuryPercent,
    deathPercentage: slot.deathPercent,
    assignedCount: slot.assignedResidentId ? 1 : 0,
    totalSlots: 1,
    rewardLabel: slot.assignedResidentId,
    tone: 'job',
    deadlineLabel: null,
    assigneeNames: slot.assignedResidentId ? [slot.assignedResidentId] : [],
  };
}

export default VillageSandbox;
