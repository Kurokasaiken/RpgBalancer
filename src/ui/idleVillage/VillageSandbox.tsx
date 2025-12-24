import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { createVillageStateFromConfig, type ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import VerbDetailCard, { type VerbDetailAssignment, type VerbSlotState } from '@/ui/idleVillage/VerbDetailCard';
import ResidentRoster from '@/ui/idleVillage/ResidentRoster';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';

type ActivitySlotData = {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerId: string | null;
};

const VillageSandbox = () => {
  const { config } = useIdleVillageConfig();
  const initialResidents = useMemo(() => loadResidentsFromCharacterManager(), []);
  const { state: villageState } = useVillageStateStore(() =>
    createVillageStateFromConfig({ config, initialResidents }),
  );

  const mapSlots = useMemo(() => Object.values(config.mapSlots ?? {}), [config.mapSlots]);
  const residents = useMemo<ResidentState[]>(() => Object.values(villageState.residents ?? {}), [villageState.residents]);

  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
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

  const handleWorkerDrop = useCallback(
    (slotId: string, residentId: string | null) => {
      if (!residentId) return;
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.slotId === slotId) {
            return { ...slot, assignedWorkerId: residentId };
          }
          if (slot.assignedWorkerId === residentId) {
            return { ...slot, assignedWorkerId: null };
          }
          return slot;
        }),
      );
      setDraggingResidentId(null);
      const slotLabel = config.mapSlots?.[slotId]?.label ?? slotId;
      const resident = villageState.residents?.[residentId];
      const residentLabel = resident ? formatResidentLabel(resident) : residentId;
      setAssignmentFeedback(`${residentLabel} assegnato a ${slotLabel}.`);
    },
    [config.mapSlots, villageState.residents],
  );

  const resolveWorkerName = (residentId: string | null) => {
    if (!residentId) return null;
    const resident = villageState.residents?.[residentId];
    return resident ? formatResidentLabel(resident) : residentId;
  };

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

  const detailAssignments = useMemo<VerbDetailAssignment[]>(
    () =>
      residents.map((resident) => ({
        resident,
        isSelected: selectedSlot?.assignedWorkerId === resident.id,
        onToggle: () => {
          if (!selectedSlot) return;
          handleWorkerDrop(selectedSlot.slotId, resident.id);
          setDetailSlotId(selectedSlot.slotId);
        },
      })),
    [residents, selectedSlot, handleWorkerDrop],
  );

  const detailPreview = useMemo(() => {
    if (!selectedSlot) return null;
    const assignedResident = residents.find((resident) => resident.id === selectedSlot.assignedWorkerId) ?? null;
    const hpPercent =
      assignedResident && assignedResident.maxHp > 0
        ? Math.max(0, Math.min(100, Math.round((assignedResident.currentHp / assignedResident.maxHp) * 100)))
        : 0;
    const fatigueValue = assignedResident?.fatigue ?? 0;
    return {
      rewards: [],
      injuryPercentage: assignedResident ? Math.max(0, 100 - hpPercent) : 10,
      deathPercentage: assignedResident ? Math.max(0, fatigueValue - 70) : 0,
      note: assignedResident ? `${formatResidentLabel(assignedResident)} in ricognizione.` : 'Nessun residente assegnato.',
    };
  }, [selectedSlot, residents]);

  const handleResidentDragStart = useCallback(
    (residentId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData('text/resident-id', residentId);
      event.dataTransfer.setData('text/plain', residentId);
      event.dataTransfer.effectAllowed = 'copy';
      setDraggingResidentId(residentId);
      setAssignmentFeedback(null);
    },
    [],
  );

  const handleResidentDragEnd = useCallback(() => {
    setDraggingResidentId(null);
  }, []);

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
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Residenti</h2>
          <ResidentRoster
            residents={residents}
            activeResidentId={draggingResidentId}
            onDragStart={handleResidentDragStart}
            onDragEnd={handleResidentDragEnd}
            assignmentFeedback={assignmentFeedback}
            maxFatigueBeforeExhausted={config.globalRules.maxFatigueBeforeExhausted ?? 100}
          />
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
