import { useEffect, useMemo, useState } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { selectDefaultFounder } from '@/engine/game/idleVillage/seedDemoResidents';
import { createVillageStateFromConfig, type ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import VerbDetailCard, { type VerbDetailAssignment, type VerbSlotState } from '@/ui/idleVillage/VerbDetailCard';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';

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

const VillageSandbox = () => {
  const { config } = useIdleVillageConfig();
  const defaultFounderPreset = useMemo(() => selectDefaultFounder(config), [config]);
  const { state: villageState } = useVillageStateStore(() =>
    createVillageStateFromConfig({ config, founderPreset: defaultFounderPreset }),
  );

  const mapSlots = useMemo(() => Object.values(config.mapSlots ?? {}), [config.mapSlots]);

  const workers = useMemo<Worker[]>(() => {
    const residents = Object.values(villageState.residents ?? {});
    if (!residents.length) {
      return [
        { id: 'worker-1', name: 'Fondatore', hp: 92, fatigue: 18 },
        { id: 'worker-2', name: 'Taglialegna', hp: 74, fatigue: 42 },
        { id: 'worker-3', name: 'Cacciatore', hp: 65, fatigue: 27 },
      ];
    }
    return residents.map((resident) => ({
      id: resident.id,
      name: formatResidentLabel(resident),
      hp: resident.maxHp > 0 ? Math.round(Math.max(0, Math.min(100, (resident.currentHp / resident.maxHp) * 100))) : 0,
      fatigue: Math.round(Math.max(0, Math.min(100, resident.fatigue ?? 0))),
    }));
  }, [villageState.residents]);

  const [hoveredWorkerId, setHoveredWorkerId] = useState<string | null>(null);
  const [draggingWorkerId, setDraggingWorkerId] = useState<string | null>(null);
  const [detailSlotId, setDetailSlotId] = useState<string | null>(null);

  const [slots, setSlots] = useState<ActivitySlotData[]>(() =>
    mapSlots.map((slot) => ({
      slotId: slot.id,
      label: slot.label,
      iconName: slot.icon ?? '☆',
      assignedWorkerId: null,
    })),
  );

  useEffect(() => {
    setSlots((prev) =>
      mapSlots.map((slot) => {
        const existing = prev.find((item) => item.slotId === slot.id);
        return (
          existing ?? {
            slotId: slot.id,
            label: slot.label,
            iconName: slot.icon ?? '☆',
            assignedWorkerId: null,
          }
        );
      }),
    );
  }, [mapSlots]);

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

  const selectedSlot = useMemo(() => slots.find((slot) => slot.slotId === detailSlotId) ?? null, [slots, detailSlotId]);

  const detailActivity = useMemo<ActivityDefinition | null>(() => {
    if (!selectedSlot) return null;
    return {
      id: selectedSlot.slotId,
      label: selectedSlot.label,
      description: 'Panoramica completa della carta attività selezionata.',
      tags: ['job'],
      slotTags: ['sandbox'],
      resolutionEngineId: 'sandbox_demo',
      dangerRating: 1,
      durationFormula: '60',
      metadata: {},
      costs: [],
      rewards: [],
    };
  }, [selectedSlot]);

  const detailSlots = useMemo<VerbSlotState[]>(
    () =>
      slots.map((slot) => {
        const slotDefinition = config.mapSlots?.[slot.slotId];
        return {
          id: slot.slotId,
          label: slotDefinition?.label ?? slot.label,
          statHint: slotDefinition?.description,
          requirementLabel: slotDefinition?.description,
          assignedResidentId: slot.assignedWorkerId,
          required: Boolean(slotDefinition?.slotTags?.includes('required')),
        };
      }),
    [slots, config.mapSlots],
  );

  const workerToResident = (worker: Worker): ResidentState => ({
    id: worker.id,
    displayName: worker.name,
    status: 'available',
    fatigue: worker.fatigue,
    statTags: [],
    currentHp: Math.round((worker.hp / 100) * 100),
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    homeId: undefined,
    injuryRecoveryTime: undefined,
    statProfileId: undefined,
    statSnapshot: {},
  });

  const detailAssignments = useMemo<VerbDetailAssignment[]>(
    () =>
      workers.map((worker) => ({
        resident: workerToResident(worker),
        isSelected: selectedSlot?.assignedWorkerId === worker.id,
        onToggle: () => {
          if (!selectedSlot) return;
          handleWorkerDrop(selectedSlot.slotId, worker.id);
          setDetailSlotId(selectedSlot.slotId);
        },
      })),
    [workers, selectedSlot],
  );

  const detailPreview = useMemo(() => {
    if (!selectedSlot) return null;
    const assignedWorker = workers.find((worker) => worker.id === selectedSlot.assignedWorkerId) ?? null;
    return {
      rewards: [],
      injuryPercentage: assignedWorker ? Math.max(0, 100 - assignedWorker.hp) : 10,
      deathPercentage: assignedWorker ? Math.max(0, assignedWorker.fatigue - 70) : 0,
      note: assignedWorker ? `${assignedWorker.name} in ricognizione.` : 'Nessun lavoratore assegnato.',
    };
  }, [selectedSlot, workers]);

  const handleHoverChange = (workerId: string, isHovering: boolean) => {
    setHoveredWorkerId((prev) => {
      if (isHovering) return workerId;
      return prev === workerId ? null : prev;
    });
  };

  const handleDragStateChange = (workerId: string, isDragging: boolean) => {
    setDraggingWorkerId((prev) => {
      if (isDragging) return workerId;
      return prev === workerId ? null : prev;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 text-ivory">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Village Sandbox</p>
        <h1 className="text-3xl font-semibold tracking-widest">Frontier — Atomic Layer</h1>
        <p className="text-sm text-slate-300">
          Trascina i lavoratori negli slot attività per vedere le barre reagire e il cerchio Halo evidenziare il drop.
        </p>
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="space-y-4 lg:w-1/3">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Lavoratori</h2>
          <div className="flex flex-col gap-4">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                {...worker}
                onHoverChange={handleHoverChange}
                onDragStateChange={handleDragStateChange}
                isGhosted={draggingWorkerId === worker.id}
                isHovering={hoveredWorkerId === worker.id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-wrap items-start gap-6 lg:flex-1">
                {slots.map((slot) => (
                  <ActivitySlot
                    key={slot.slotId}
                    slotId={slot.slotId}
                    iconName={slot.iconName}
                    label={slot.label}
                    assignedWorkerName={resolveWorkerName(slot.assignedWorkerId)}
                    onWorkerDrop={(workerId) => handleWorkerDrop(slot.slotId, workerId)}
                    onInspect={(slotId) => setDetailSlotId(slotId)}
                  />
                ))}
              </div>

              <div className="space-y-3 lg:w-72">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Luogo attivo</div>
                <LocationCard
                  title="Foresta · Raccolta Bacche"
                  description="Trascina un lavoratore per avviare la spedizione e apri la vista panoramica per controllare più VerbCard."
                  iconRow={
                    <div className="flex items-center gap-3 text-emerald-200 text-4xl">
                      <span>🌲</span>
                      <span>🌳</span>
                      <span>🌲</span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {detailSlotId && detailActivity && detailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDetailSlotId(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <VerbDetailCard
              title={detailActivity.label}
              subtitle="Dettaglio Attività"
              activity={detailActivity}
              description="Scheda dinamica collegata al worker selezionato."
              preview={detailPreview}
              assignments={detailAssignments}
              slots={detailSlots}
              slotLabel={detailSlots[0]?.label ?? 'Slot Sandbox'}
              durationSeconds={60}
              elapsedSeconds={0}
              isActive={false}
              onClose={() => setDetailSlotId(null)}
              startDisabled
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VillageSandbox;
