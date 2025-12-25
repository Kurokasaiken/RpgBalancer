import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { createVillageStateFromConfig, getStartingResidentFatigue, type ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlot from '@/ui/idleVillage/components/ActivitySlot';
import VerbDetailCard, { type VerbDetailAssignment, type VerbSlotState } from '@/ui/idleVillage/VerbDetailCard';
import ResidentRoster from '@/ui/idleVillage/ResidentRoster';
import WorkerDragToken from '@/ui/idleVillage/components/WorkerDragToken';
import TheaterView from '@/ui/idleVillage/components/TheaterView';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';

interface ActivitySlotData {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerId: string | null;
  activity: ActivityDefinition;
  mapSlotLabel?: string;
}

type SandboxVerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';

const deriveVerbTone = (activity: ActivityDefinition): SandboxVerbTone => {
  if (activity.tags?.includes('quest')) return 'quest';
  if (activity.tags?.includes('job')) return 'job';
  if (activity.tags?.includes('danger')) return 'danger';
  if (activity.tags?.includes('system')) return 'system';
  return 'neutral';
};

const formatRewardLabel = (activity: ActivityDefinition): string | null => {
  if (!activity.rewards || activity.rewards.length === 0) return null;
  return activity.rewards
    .map((reward) => {
      const amount = reward.amountFormula ?? '';
      return [amount, reward.resourceId].filter(Boolean).join(' ');
    })
    .join(', ');
};

const VillageSandbox = () => {
  const { activePreset, presets, setPreset, randomizeTheme, resetRandomization, isRandomized } = useThemeSwitcher();
  const { config } = useIdleVillageConfig();
  const initialResidents = useMemo(() => {
    const residents = loadResidentsFromCharacterManager({ config });
    if (residents.length === 0) {
      // Fallback: create a default resident
      const fallbackFatigue = getStartingResidentFatigue(config);
      residents.push({
        id: 'default-founder',
        displayName: 'Founder',
        currentHp: 100,
        maxHp: 100,
        fatigue: fallbackFatigue,
        status: 'available',
        isHero: false,
        isInjured: false,
        statSnapshot: { hp: 100, damage: 10, agility: 10 },
        statTags: ['founder'],
        survivalCount: 0,
        survivalScore: 0,
      });
    }
    return residents;
  }, [config]);
  const { state: villageState, resetState } = useVillageStateStore(() =>
    createVillageStateFromConfig({ config, initialResidents }),
  );

  const activities = useMemo<ActivityDefinition[]>(() => Object.values(config.activities ?? {}), [config.activities]);
  const showcaseActivities = useMemo<ActivityDefinition[]>(() => {
    const sorted = [...activities].sort((a, b) => (a.label ?? a.id).localeCompare(b.label ?? b.id));
    return sorted.slice(0, 3);
  }, [activities]);
  const residents = useMemo<ResidentState[]>(() => Object.values(villageState.residents ?? {}), [villageState.residents]);

  const refreshResidentsFromCharacterManager = useCallback(() => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    if (latestResidents.length === 0) return;
    resetState(
      () =>
        createVillageStateFromConfig({
          config,
          initialResidents: latestResidents,
        }),
      'VillageSandbox resident refresh',
    );
  }, [config, resetState]);

  useEffect(() => {
    if (residents.length === 0) {
      const latest = loadResidentsFromCharacterManager({ config });
      if (latest.length > 0) {
        resetState(
          () =>
            createVillageStateFromConfig({
              config,
              initialResidents: latest,
            }),
          'VillageSandbox auto-import residents',
        );
      }
      return;
    }
    const hasLegacyFounderNames = residents.some(
      (resident) => !resident.displayName && resident.id?.startsWith('founder-'),
    );
    if (hasLegacyFounderNames) {
      refreshResidentsFromCharacterManager();
    }
  }, [residents, refreshResidentsFromCharacterManager, config, resetState]);

  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [detailSlotId, setDetailSlotId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [theaterSlotId, setTheaterSlotId] = useState<string | null>(null);

  useEffect(() => {
    setAssignments((prev) => {
      const next: Record<string, string | null> = {};
      showcaseActivities.forEach((activity) => {
        next[activity.id] = prev[activity.id] ?? null;
      });
      return next;
    });
  }, [showcaseActivities]);

  const slots = useMemo<ActivitySlotData[]>(() => {
    return showcaseActivities.map((activity) => {
      const meta = (activity.metadata ?? {}) as { icon?: string; mapSlotId?: string } | undefined;
      const mapSlot = meta?.mapSlotId ? config.mapSlots?.[meta.mapSlotId] : undefined;
      const derivedIcon = meta?.icon ?? mapSlot?.icon ?? '☆';
      return {
        slotId: activity.id,
        label: activity.label ?? activity.id,
        iconName: derivedIcon,
        assignedWorkerId: assignments[activity.id] ?? null,
        activity,
        mapSlotLabel: mapSlot?.label,
      };
    });
  }, [showcaseActivities, assignments, config.mapSlots]);

  const handleWorkerDrop = useCallback(
    (activityId: string, residentId: string | null) => {
      if (!residentId) return;
      setAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key] === residentId) {
            next[key] = null;
          }
        });
        next[activityId] = residentId;
        return next;
      });
      setDraggingResidentId(null);
      const activityLabel = config.activities?.[activityId]?.label ?? activityId;
      const resident = villageState.residents?.[residentId];
      const residentLabel = resident ? formatResidentLabel(resident) : residentId;
      setAssignmentFeedback(`${residentLabel} assegnato a ${activityLabel}.`);
    },
    [config.activities, villageState.residents],
  );

  const resolveWorkerName = (residentId: string | null) => {
    if (!residentId) return null;
    const resident = villageState.residents?.[residentId];
    return resident ? formatResidentLabel(resident) : residentId;
  };

  const selectedSlot = useMemo(() => slots.find((slot) => slot.slotId === detailSlotId) ?? null, [slots, detailSlotId]);

  const detailActivity = selectedSlot?.activity ?? null;

  const detailSlots = useMemo<VerbSlotState[]>(
    () =>
      slots.map((slot) => ({
        id: slot.slotId,
        label: slot.label,
        statHint: slot.activity.statRequirement?.label ?? slot.activity.description,
        requirementLabel: slot.activity.statRequirement?.label ?? slot.activity.description,
        assignedResidentId: slot.assignedWorkerId,
        required: Boolean(slot.activity.slotTags?.includes('required')),
      })),
    [slots],
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
    const dangerPercent = Math.min(100, (detailActivity?.dangerRating ?? 1) * 15);
    return {
      rewards: detailActivity?.rewards ?? [],
      injuryPercentage: assignedResident ? Math.max(0, 100 - hpPercent) : dangerPercent,
      deathPercentage: assignedResident ? Math.max(0, fatigueValue - 70) : Math.round(dangerPercent / 2),
      note: assignedResident
        ? `${formatResidentLabel(assignedResident)} assegnato a ${selectedSlot.label}.`
        : 'Nessun residente assegnato.',
    };
  }, [selectedSlot, residents, detailActivity]);

  const handleResidentDragStart = useCallback(
    (residentId: string) => (event: React.DragEvent<HTMLElement>) => {
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

  const theaterSlot = useMemo(
    () => slots.find((slot) => slot.slotId === theaterSlotId) ?? null,
    [slots, theaterSlotId],
  );

  const theaterVerbs = useMemo<VerbSummary[]>(() => {
    if (!theaterSlot) return [];
    const assignedName = resolveWorkerName(theaterSlot.assignedWorkerId);
    const tone = deriveVerbTone(theaterSlot.activity);
    const injuryPercentage = Math.min(100, (theaterSlot.activity.dangerRating ?? 1) * 15);
    const deathPercentage = Math.round(injuryPercentage / 2);
    const totalSlots =
      typeof theaterSlot.activity.maxSlots === 'number'
        ? theaterSlot.activity.maxSlots
        : theaterSlot.activity.maxSlots === 'infinite'
          ? 4
          : 1;

    const summary: VerbSummary = {
      key: `sandbox_theater_${theaterSlot.slotId}`,
      source: 'system',
      activityId: theaterSlot.slotId,
      slotId: theaterSlot.slotId,
      label: theaterSlot.activity.label ?? theaterSlot.slotId,
      kindLabel: tone === 'job' ? 'Job' : tone === 'quest' ? 'Quest' : 'Activity',
      isQuest: tone === 'quest',
      isJob: tone === 'job',
      icon: theaterSlot.iconName,
      visualVariant: 'azure',
      progressStyle: 'ribbon',
      progressFraction: 0,
      elapsedSeconds: 0,
      totalDurationSeconds: Number(theaterSlot.activity.durationFormula ?? 0),
      remainingSeconds: 0,
      injuryPercentage,
      deathPercentage,
      assignedCount: theaterSlot.assignedWorkerId ? 1 : 0,
      totalSlots,
      rewardLabel: formatRewardLabel(theaterSlot.activity),
      tone,
      deadlineLabel: null,
      assigneeNames: assignedName ? [assignedName] : [],
      notes: theaterSlot.activity.description ?? null,
    };

    return [summary];
  }, [theaterSlot, resolveWorkerName]);

  const handleCloseTheater = useCallback(() => {
    setIsTheaterOpen(false);
  }, []);

  const handleLocationInspect = useCallback(() => {
    const targetSlot = slots[0];
    if (!targetSlot) return;
    setTheaterSlotId(targetSlot.slotId);
    setIsTheaterOpen(true);
  }, [slots]);

  const handleResetSandboxState = useCallback(() => {
    resetState(
      () =>
        createVillageStateFromConfig({
          config,
          initialResidents: loadResidentsFromCharacterManager({ config }),
        }),
      'VillageSandbox manual reset',
    );
  }, [config, resetState]);

  const handleResetSandboxFatigue = useCallback(() => {
    const targetFatigue = getStartingResidentFatigue(config);
    resetState(
      () => {
        const nextResidents: Record<string, ResidentState> = {};
        Object.entries(villageState.residents ?? {}).forEach(([id, resident]) => {
          nextResidents[id] = { ...resident, fatigue: targetFatigue };
        });
        return {
          ...villageState,
          residents: nextResidents,
        };
      },
      'VillageSandbox reset fatigue',
    );
  }, [config, resetState, villageState]);

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 text-ivory">
      <section
        className="rounded-2xl border p-4 shadow-xl backdrop-blur-sm"
        style={{
          borderColor: 'var(--panel-border)',
          background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
          boxShadow: `0 30px 60px var(--card-shadow-color)`,
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.5em]"
              style={{ color: 'var(--slot-helper-color, rgba(255,255,255,0.55))' }}
            >
              Style Laboratory
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activePreset.label}
              {isRandomized ? ' + Chaos Mix' : ''} · {activePreset.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isPresetActive = activePreset.id === preset.id && !isRandomized;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id)}
                  className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                  style={{
                    border: `1px solid ${isPresetActive ? 'var(--accent-color)' : 'var(--panel-border)'}`,
                    background: isPresetActive ? 'var(--card-highlight)' : 'transparent',
                    color: isPresetActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: isPresetActive ? `0 0 20px var(--halo-color)` : 'none',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={randomizeTheme}
              className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
              style={{
                border: '1px solid var(--accent-strong)',
                background: 'var(--card-highlight)',
                color: 'var(--text-primary)',
              }}
            >
              Randomize
            </button>
            {isRandomized && (
              <button
                type="button"
                onClick={resetRandomization}
                className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                style={{
                  border: '1px dashed var(--panel-border)',
                  color: 'var(--text-muted)',
                }}
              >
                Reset
              </button>
            )}

          </div>
        </div>
      </section>

      <header className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Village Sandbox</p>
          <h1 className="text-3xl font-semibold tracking-widest">Frontier — Atomic Layer</h1>
          <p className="text-sm text-slate-300">
            Trascina i lavoratori negli slot attività per vedere le barre reagire e il cerchio Halo evidenziare il drop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetSandboxState}
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/70 bg-rose-500/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.25)] transition-colors hover:bg-rose-500/25"
          >
            <span aria-hidden>⚠</span>
            Reset Sandbox
          </button>
          <button
            type="button"
            onClick={handleResetSandboxFatigue}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-black/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)] transition-colors hover:bg-amber-500/20"
          >
            <span aria-hidden>☽</span>
            Reset Fatigue
          </button>
        </div>
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
                    label={slot.mapSlotLabel ? `${slot.label} · ${slot.mapSlotLabel}` : slot.label}
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
                  onInspect={handleLocationInspect}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4 mt-8">
        <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Test Drag Token (Isolated)</h2>
        <WorkerDragToken
          workerId="test-resident"
          label="Test Resident"
          subtitle="Isolated test for drag"
          hp={90}
          fatigue={10}
          isDragging={draggingResidentId === "test-resident"}
          disabled={false}
          onDragStateChange={(id: string, dragging: boolean) => {
            console.log('Test drag state:', id, dragging);
            setDraggingResidentId(dragging ? id : null);
          }}
          onDragStart={(event) => {
            console.log('Test drag start');
            event.dataTransfer.setData('text/resident-id', 'test-resident');
            event.dataTransfer.effectAllowed = 'move';
            setDraggingResidentId('test-resident');
          }}
         onDragEnd={() => {
            console.log('Test drag end');
            setDraggingResidentId(null);
          }}
        />
      </div>

      {detailSlotId && detailActivity && detailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDetailSlotId(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <VerbDetailCard
              title={detailActivity.label ?? detailActivity.id}
              subtitle="Dettaglio Attività"
              activity={detailActivity}
              description={detailActivity.description ?? 'Scheda dinamica collegata al worker selezionato.'}
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
      {isTheaterOpen && theaterSlot && (
        <TheaterView
          slotLabel={theaterSlot.label}
          slotIcon={theaterSlot.iconName}
          panoramaUrl={null}
          verbs={theaterVerbs}
          onClose={handleCloseTheater}
        />
      )}
    </div>
  );
};

export default VillageSandbox;
