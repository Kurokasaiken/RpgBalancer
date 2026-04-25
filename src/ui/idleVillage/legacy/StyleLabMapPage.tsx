import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/useResidentSlotController';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useVillageSandbox } from '@/ui/idleVillage/hooks/useVillageSandbox';
import type { ReactNode, DragEvent as ReactDragEvent } from 'react';
import DayNightActionCard from '@/ui/idleVillage/map/actionCards/DayNightActionCard';
import HungerActionCard from '@/ui/idleVillage/map/actionCards/HungerActionCard';
import JobActionCard from '@/ui/idleVillage/map/actionCards/JobActionCard';
import QuestActionCard from '@/ui/idleVillage/map/actionCards/QuestActionCard';
import { ResourcePanel } from '@/ui/idleVillage/map/components/ResourcePanel';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import type { DropState } from '@/ui/idleVillage/legacy/VerbCard';
import { formatRewardLabel } from '@/ui/idleVillage/verbSummaries';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { computeDropStateForResident } from '@/ui/idleVillage/slots/residentSlotValidators';
import type { QuestPhase } from '@/balancing/config/idleVillage/types';
import ActivityCardDetail from '@/ui/idleVillage/components/ActivityCardDetail';
import PgCard from '@/ui/idleVillage/components/PgCard';
import LocationCard, { type LocationFeaturedActivity } from '@/ui/idleVillage/components/LocationCard';
// import TheaterView from '@/ui/idleVillage/components/TheaterView';
import PgDetailCard from '@/ui/idleVillage/components/PgDetailCard';
import QuestChronicle from '@/ui/idleVillage/components/QuestChronicle';

type DemoRequirementKey = 'none' | 'hp200';

/**
 * Local type definitions for activity detail modal.
 */
type ActivityCardMetric = {
  id: string;
  label: string;
  value: string;
  type: 'progress' | 'count' | 'text';
};

/**
 * Temporary Style Lab shell per resettare la MapPage prima del nuovo rollout.
 * Mostriamo solo il laboratorio per scegliere i preset e ripartire da zero.
 */
export function MapPage() {
  return (
    <DragProvider>
      <MapPageInner />
    </DragProvider>
  );
}

function MapPageInner() {
  const {
    activePreset,
    presets,
    setPreset,
    randomizeTheme,
    resetRandomization,
    isRandomized,
    config,
    cycleProgressFraction,
    cyclePhaseIcon,
    isCyclePlaying,
    setIsCyclePlaying,
    cycleVariant,
    cycleDayCount,
    totalCycleSeconds,
    villageState,
    residents,
    draggingResidentId,
    setActiveId,
    assignmentFeedback,
    setAssignmentFeedback,
    slotAssignments,
    setSlotAssignments,
    managedActivities,
    activityScheduler,
    residentsById,
    handleLocationInspect,
    openDetailPanel,
    closeDetailPanel,
    locationSlots,
    locationDropState,
    demoPanelState,
    demoPanelHandlers,
    handleResetResidents,
    detailContexts,
  } = useVillageSandbox();

  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'available' | 'away' | 'exhausted' | 'injured'>('all');
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [isQuestDetailOpen, setIsQuestDetailOpen] = useState(false);

  // Global dragend listener to reset dragging state if drag ends unexpectedly
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setActiveId(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, [setActiveId]);

  // Stub implementations for location drag handlers
  const handleLocationDragIntent = useCallback(() => {
    // TODO: Implement location drag intent logic
  }, []);

  const handleLocationResidentDragEnter = useCallback((_residentId: string | null) => {
    // TODO: Implement resident drag enter logic
  }, []);

  const handleLocationResidentDragLeave = useCallback(() => {
    // TODO: Implement resident drag leave logic
  }, []);

  const handleLocationResidentDrop = useCallback((_residentId: string) => {
    // TODO: Implement resident drop logic
  }, []);

  const foodAmount = villageState.resources?.food ?? 10;
  const goldAmount = villageState.resources?.gold ?? 100;
  const dayCounter = cycleDayCount ?? 0;
  const haloSizePx = 80;
  const haloStrokeWidth = 2.5;
  const innerSizePercent = 84;
  const availableResidents = useMemo(
    () => residents.filter((resident) => {
      if (rosterFilter === 'all') return resident.status !== 'dead';
      return resident.status === rosterFilter;
    }),
    [residents, rosterFilter],
  );

  const availableCount = useMemo(
    () => residents.filter((resident) => resident.status === 'available').length,
    [residents],
  );

  const primaryJobActivity = useMemo(
    () => managedActivities.find((activity) => activity.tags?.includes('job')),
    [managedActivities],
  );

  const jobAssignedResidentId = primaryJobActivity ? slotAssignments?.[primaryJobActivity.id] ?? null : null;
  const jobState =
    primaryJobActivity && jobAssignedResidentId
      ? activityScheduler.getActivityState(primaryJobActivity.id, jobAssignedResidentId)
      : null;

  const questActivity = useMemo(
    () => managedActivities.find((activity) => activity.tags?.includes('quest')),
    [managedActivities],
  );

  const questAssignedResidentId = questActivity ? slotAssignments?.[questActivity.id] ?? null : null;
  const questState =
    questActivity && questAssignedResidentId
      ? activityScheduler.getActivityState(questActivity.id, questAssignedResidentId)
      : null;

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      return config?.resources?.[resourceId]?.label ?? resourceId;
    },
    [config?.resources],
  );

  const jobProgressFraction = jobState?.progress ?? 0;
  const jobElapsedSeconds = jobState?.elapsed ?? 0;
  const jobIsPlaying = jobState?.status === 'running';
  const jobTotalDurationSeconds =
    jobState?.duration ?? (primaryJobActivity ? Number(primaryJobActivity.durationFormula) || 0 : 0);
  const jobIcon = ((primaryJobActivity?.metadata ?? {}) as { icon?: ReactNode })?.icon ?? '⚒️';
  const maxFatigueBeforeExhausted = config?.globalRules.maxFatigueBeforeExhausted ?? 100;
  const questProgressFraction = questState?.progress ?? 0;
  const questElapsedSeconds = questState?.elapsed ?? 0;
  const questIsPlaying = questState?.status === 'running';
  const questTotalDurationSeconds =
    questState?.duration ?? (questActivity ? Number(questActivity.durationFormula) || 0 : 0);
  const questIcon = ((questActivity?.metadata ?? {}) as { icon?: ReactNode })?.icon ?? '⚔️';

  const jobRewardLabel = useMemo(
    () => (primaryJobActivity ? formatRewardLabel(primaryJobActivity.rewards, getResourceLabel) : null),
    [getResourceLabel, primaryJobActivity],
  );

  const jobHelperText = jobRewardLabel ?? undefined;

  const validateJobAssignment = useCallback(
    (residentId: string): { ok: true } | { ok: false; reason: string } => {
      if (!primaryJobActivity) return { ok: false, reason: 'Nessuna attività job attiva.' };
      const resident = residentsById[residentId];
      if (!resident) return { ok: false, reason: 'Residente non trovato.' };
      if (resident.status !== 'available') return { ok: false, reason: `${resident.displayName ?? resident.id} non è disponibile.` };
      if (resident.fatigue >= maxFatigueBeforeExhausted) {
        return {
          ok: false,
          reason: `${resident.displayName ?? resident.id} è troppo stanco (${resident.fatigue}/${maxFatigueBeforeExhausted}).`,
        };
      }
      if (primaryJobActivity.statRequirement) {
        const match = evaluateStatRequirement(resident, primaryJobActivity.statRequirement);
        if (!match.matches) {
          return {
            ok: false,
            reason: primaryJobActivity.statRequirement.label
              ? `${resident.displayName ?? resident.id} non soddisfa ${primaryJobActivity.statRequirement.label}.`
              : `${resident.displayName ?? resident.id} non soddisfa i requisiti.`,
          };
        }
      }
      return { ok: true };
    },
    [primaryJobActivity, residentsById, maxFatigueBeforeExhausted],
  );

  const jobDropState: DropState = useMemo(() => {
    if (!primaryJobActivity || !draggingResidentId) return 'idle';
    return computeDropStateForResident(
      draggingResidentId,
      primaryJobActivity,
      { canAssignResident: activityScheduler.canAssignResident },
      primaryJobActivity.statRequirement,
      residentsById,
    );
  }, [
    activityScheduler.canAssignResident,
    draggingResidentId,
    primaryJobActivity,
    residentsById,
  ]);

  const questDropState: DropState = useMemo(() => {
    if (!questActivity || !draggingResidentId) return 'idle';
    return computeDropStateForResident(
      draggingResidentId,
      questActivity,
      { canAssignResident: activityScheduler.canAssignResident },
      questActivity.statRequirement,
      residentsById,
    );
  }, [
    activityScheduler.canAssignResident,
    draggingResidentId,
    questActivity,
    residentsById,
  ]);

  const tryStartJob = useCallback(
    (residentId: string) => {
      if (!primaryJobActivity) {
        setAssignmentFeedback('Nessuna attività disponibile.');
        return;
      }
      if (jobState?.status === 'running') {
        setAssignmentFeedback('Attività già in corso.');
        return;
      }

      const validation = validateJobAssignment(residentId);
      if (!validation.ok) {
        setAssignmentFeedback(validation.reason);
        return;
      }

      const previousAssignment = slotAssignments[primaryJobActivity.id] ?? null;
      setSlotAssignments((prev) => ({ ...prev, [primaryJobActivity.id]: residentId }));
      const durationSeconds = jobTotalDurationSeconds > 0 ? jobTotalDurationSeconds : undefined;
      const started = activityScheduler.startActivity(primaryJobActivity.id, residentId, durationSeconds);
      if (!started) {
        setSlotAssignments((prev) => ({ ...prev, [primaryJobActivity.id]: previousAssignment }));
        setAssignmentFeedback('Impossibile avviare il job.');
        return;
      }
      const label = residentsById[residentId]?.displayName ?? residentId;
      setAssignmentFeedback(`${label} assegnato al job.`);
      setActiveId(null);
    },
    [
      activityScheduler,
      jobState?.status,
      jobTotalDurationSeconds,
      primaryJobActivity,
      residentsById,
      setActiveId,
      setAssignmentFeedback,
      setSlotAssignments,
      slotAssignments,
      validateJobAssignment,
    ],
  );

  const handleJobToggle = useCallback(() => {
    if (!primaryJobActivity) return;
    if (jobState?.status === 'running' && jobState.scheduledId) {
      activityScheduler.cancelActivity(jobState.scheduledId);
      setSlotAssignments((prev) => ({ ...prev, [primaryJobActivity.id]: null }));
      setAssignmentFeedback('Job messo in pausa.');
      return;
    }
    if (jobAssignedResidentId) {
      tryStartJob(jobAssignedResidentId);
    } else {
      setAssignmentFeedback('Trascina un residente sul job per iniziare.');
    }
  }, [activityScheduler, jobAssignedResidentId, jobState, primaryJobActivity, setAssignmentFeedback, setSlotAssignments, tryStartJob]);

  const extractResidentId = (event: ReactDragEvent<HTMLDivElement>): string | null => {
    return (
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) ||
      event.dataTransfer.getData('text/resident-id') ||
      event.dataTransfer.getData('text/plain') ||
      null
    );
  };

  const handleJobDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!primaryJobActivity) return;
      const residentId = extractResidentId(event);
      if (!residentId) {
        setAssignmentFeedback('Nessun residente valido nel drop.');
        return;
      }
      tryStartJob(residentId);
    },
    [primaryJobActivity, setAssignmentFeedback, tryStartJob],
  );

  const handleJobDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (jobDropState === 'idle') return;
      event.preventDefault();
      event.dataTransfer.dropEffect = jobDropState === 'valid' ? 'copy' : 'none';
    },
    [jobDropState],
  );

  const validateQuestAssignment = useCallback(
    (residentId: string): { ok: true } | { ok: false; reason: string } => {
      if (!questActivity) return { ok: false, reason: 'Nessuna quest attiva.' };
      const resident = residentsById[residentId];
      if (!resident) return { ok: false, reason: 'Residente non trovato.' };
      if (resident.status !== 'available') return { ok: false, reason: `${resident.displayName ?? resident.id} non è disponibile.` };
      if (resident.fatigue >= maxFatigueBeforeExhausted) {
        return {
          ok: false,
          reason: `${resident.displayName ?? resident.id} è troppo stanco (${resident.fatigue}/${maxFatigueBeforeExhausted}).`,
        };
      }
      if (questActivity.statRequirement) {
        const match = evaluateStatRequirement(resident, questActivity.statRequirement);
        if (!match.matches) {
          return {
            ok: false,
            reason: questActivity.statRequirement.label
              ? `${resident.displayName ?? resident.id} non soddisfa ${questActivity.statRequirement.label}.`
              : `${resident.displayName ?? resident.id} non soddisfa i requisiti.`,
          };
        }
      }
      return { ok: true };
    },
    [questActivity, residentsById, maxFatigueBeforeExhausted],
  );

  const tryStartQuest = useCallback(
    (residentId: string) => {
      if (!questActivity) {
        setAssignmentFeedback('Nessuna quest disponibile.');
        return;
      }
      if (questState?.status === 'running') {
        setAssignmentFeedback('Quest già in corso.');
        return;
      }

      const validation = validateQuestAssignment(residentId);
      if (!validation.ok) {
        setAssignmentFeedback(validation.reason);
        return;
      }

      const previousAssignment = slotAssignments[questActivity.id] ?? null;
      setSlotAssignments((prev) => ({ ...prev, [questActivity.id]: residentId }));
      const durationSeconds = questTotalDurationSeconds > 0 ? questTotalDurationSeconds : undefined;
      const started = activityScheduler.startActivity(questActivity.id, residentId, durationSeconds);
      if (!started) {
        setSlotAssignments((prev) => ({ ...prev, [questActivity.id]: previousAssignment }));
        setAssignmentFeedback('Impossibile avviare la quest.');
        return;
      }
      const label = residentsById[residentId]?.displayName ?? residentId;
      setAssignmentFeedback(`${label} assegnato alla quest.`);
      setActiveId(null);
    },
    [
      activityScheduler,
      questActivity,
      questState?.status,
      questTotalDurationSeconds,
      residentsById,
      setActiveId,
      setAssignmentFeedback,
      setSlotAssignments,
      slotAssignments,
      validateQuestAssignment,
    ],
  );

  const handleQuestToggle = useCallback(() => {
    if (!questActivity) return;
    if (questState?.status === 'running' && questState.scheduledId) {
      activityScheduler.cancelActivity(questState.scheduledId);
      setSlotAssignments((prev) => ({ ...prev, [questActivity.id]: null }));
      setAssignmentFeedback('Quest messa in pausa.');
      return;
    }
    if (questAssignedResidentId) {
      tryStartQuest(questAssignedResidentId);
    } else {
      setAssignmentFeedback('Trascina un residente sulla quest per iniziare.');
    }
  }, [
    activityScheduler,
    questActivity,
    questAssignedResidentId,
    questState,
    setAssignmentFeedback,
    setSlotAssignments,
    tryStartQuest,
  ]);

  const handleQuestDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!questActivity) return;
      const residentId = extractResidentId(event);
      if (!residentId) {
        setAssignmentFeedback('Nessun residente valido nel drop.');
        return;
      }
      tryStartQuest(residentId);
    },
    [questActivity, setAssignmentFeedback, tryStartQuest],
  );

  const handleQuestDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (questDropState === 'idle') return;
      event.preventDefault();
      event.dataTransfer.dropEffect = questDropState === 'valid' ? 'copy' : 'none';
    },
    [questDropState],
  );

  // const handleRosterDragStart = useCallback(
  //   (residentId: string) => (event: React.DragEvent<HTMLElement>) => {
  //     setActiveId(residentId);
  //     event.dataTransfer.setData(RESIDENT_DRAG_MIME, residentId);
  //     event.dataTransfer.setData('text/resident-id', residentId);
  //     event.dataTransfer.setData('text/plain', residentId);
  //   },
  //   [setActiveId],
  // );

  // const handleRosterDragEnd = useCallback(() => {
  //   setActiveId(null);
  // }, [setActiveId]);

  const locationPanelFeaturedActivity = useMemo<LocationFeaturedActivity | null>(() => {
    if (locationSlots.length === 0) return null;
    const slot = locationSlots[0];
    if (!slot.assignedWorkerId) return null;
    const state = activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId);
    const residentName = residentsById[slot.assignedWorkerId]?.displayName ?? slot.assignedWorkerId;
    return {
      slotId: slot.slotId,
      icon: slot.iconName ?? '◎',
      label: slot.label,
      progressFraction: state?.progress ?? 0,
      progressLabel: state?.progress ? `${Math.round((state.progress ?? 0) * 100)}%` : undefined,
      assignedNames: residentName ? [residentName] : [],
      tone: slot.activity.tags?.includes('quest')
        ? 'quest'
        : slot.activity.tags?.includes('job')
          ? 'job'
          : 'neutral',
    };
  }, [locationSlots, activityScheduler, residentsById]);

  const demoRequirementOptions: DemoRequirementKey[] = ['none', 'hp200'];

  const renderDemoRequirementControls = () => (
    <div className="flex gap-2">
      {demoRequirementOptions.map((key) => (
        <button
          key={key}
          type="button"
          className={[
            'flex-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] transition',
            demoPanelState.requirement === key
              ? 'border-amber-300 text-amber-100 bg-amber-300/10'
              : 'border-white/15 text-slate-400 hover:text-amber-100',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => demoPanelHandlers.setRequirement(key)}
        >
          {key === 'none' ? 'Nessuno' : '200 HP'}
        </button>
      ))}
    </div>
  );

  const renderDemoPanel = () => (
    <div className="rounded-3xl border border-white/15 bg-black/30 p-4 shadow-[0_18px_46px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Demo Slot</p>
          <p className="text-sm text-slate-200">{demoPanelState.requirementDescription}</p>
        </div>
        <div className="flex gap-2">
          {/* <button
            type="button"
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-200 transition hover:border-amber-200/60 hover:text-amber-100"
            onClick={handleResetSandboxState}
          >
            Reset
          </button> */}
        </div>
      </div>
      <div className="mt-4">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <div className="flex gap-2 min-w-max">
            <ActivityCardDetail
              activity={demoPanelState.activityDefinition}
              slotLabel="Demo Activity"
              preview={demoPanelState.preview}
              slotViewModels={demoPanelState.slotViewModels}
              metrics={demoPanelState.metrics}
              rewards={[]}
              durationSeconds={60}
              elapsedSeconds={demoPanelState.elapsedSeconds}
              onDropResident={(slotId: string, residentId: string | null) => demoPanelHandlers.onSlotDrop(slotId, residentId || '')}
              onRemoveResident={(slotId: string) => demoPanelHandlers.onSlotClear(slotId)}
              slotOverflowMode="wrap"
              isStartDisabled={!demoPanelState.hasAssignments}
              onStart={demoPanelHandlers.onStart}
              draggingResidentId={draggingResidentId}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Requisiti</p>
        {renderDemoRequirementControls()}
      </div>
      {demoPanelState.hasAssignments && (
        <button
          type="button"
          className="mt-4 w-full rounded-full border border-white/20 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-200 transition hover:border-rose-300/70 hover:text-rose-100"
          onClick={demoPanelHandlers.onRemoveAll}
        >
          Rimuovi tutti
        </button>
      )}
    </div>
  );

  // const questBlueprint = useMemo(
  //   () => (questActivity ? findQuestBlueprintForActivity(config, questActivity.id) : null),
  //   [config, questActivity],
  // );

  const questChronicleData = useMemo(() => {
    // if (questBlueprint) {
    //   const chronicle = buildQuestChroniclePhases({ blueprint: questBlueprint, questState: undefined });
    //   return {
    //     chronicle,
    //     title: questBlueprint.label,
    //     summary: typeof questBlueprint.summary === 'string' ? questBlueprint.summary : undefined,
    //   };
    // }
    if (!questActivity) return null;
    const fallbackPhase: QuestPhase = {
      id: questActivity.id,
      type: 'explore',
      label: questActivity.label ?? questActivity.id,
      icon: typeof questIcon === 'string' ? questIcon : '⚔️',
      narrative: questActivity.description,
    };
    return {
      chronicle: {
        phases: [
          {
            phase: fallbackPhase,
            state: 'active' as const,
          },
        ],
        activeIndex: 0,
      },
      title: questActivity.label ?? questActivity.id,
      summary: typeof questActivity.description === 'string' ? questActivity.description : undefined,
    };
  }, [questActivity, questIcon]);

  const handleQuestDetailRequest = useCallback(() => {
    if (!questActivity) return;
    setIsQuestDetailOpen(true);
  }, [questActivity]);

  const handleJobDetailRequest = useCallback(() => {
    if (!primaryJobActivity) return;
    openDetailPanel(primaryJobActivity.id);
  }, [openDetailPanel, primaryJobActivity]);

  const assignmentBanner = assignmentFeedback ?? null;

  return (
    <div
      className="observatory-page min-h-screen text-slate-100"
      style={{
        backgroundColor: 'var(--surface-base, #050509)',
        backgroundImage: 'var(--body-bg-overlay, radial-gradient(circle at top, rgba(5,5,9,0.95), rgba(7,10,19,0.92))), var(--body-bg-texture, url(/assets/ui/bg.png))',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      <section className="observatory-container py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <StyleLaboratoryPanel
            activePreset={activePreset}
            presets={presets}
            isRandomized={isRandomized}
            onSelectPreset={setPreset}
            onRandomize={randomizeTheme}
            onResetRandomization={resetRandomization}
            className="flex-1 border-amber-200/30 bg-black/40"
            kickerLabel="Style Lab · Village Sandbox"
            headerLabel="Style Lab"
          />

          <div className="flex w-full flex-col gap-3 lg:max-w-sm">
            <ResourcePanel
              className="w-full"
              headerLabel="Risorse"
              items={[
                { label: 'Cibo', value: foodAmount, accentClass: 'text-amber-200', borderClass: 'border-amber-300/40' },
                { label: 'Oro', value: goldAmount, accentClass: 'text-yellow-200', borderClass: 'border-yellow-200/40' },
                { label: 'Giorno', value: dayCounter, accentClass: 'text-cyan-200', borderClass: 'border-cyan-300/40' },
              ]}
            />
            {assignmentBanner && (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-[11px] text-amber-100 shadow-inner shadow-amber-400/30">
                {assignmentBanner}
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-full border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-rose-100 transition hover:border-rose-300/70 hover:bg-rose-400/20"
              onClick={handleResetResidents}
            >
              🔄 Reset Residenti
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="w-72 shrink-0 rounded-2xl border border-white/15 bg-black/80 px-4 py-4 text-[11px] shadow-lg backdrop-blur">
          <div className="mb-3 flex items-center">
            <div className="flex items-center gap-3">
              <div className="text-[11px] uppercase tracking-[0.35em] text-amber-200/80">Roster</div>
              <div className="text-[11px] text-amber-100">{availableCount}/{residents.length}</div>
              {!rosterCollapsed && (
                <select
                  value={rosterFilter}
                  onChange={(e) => setRosterFilter(e.target.value as 'all' | 'available' | 'away' | 'exhausted' | 'injured')}
                  className="px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-slate-800 border border-slate-600 text-slate-200 hover:border-amber-400/70 transition-colors"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="away">Away</option>
                  <option value="exhausted">Exhausted</option>
                  <option value="injured">Injured</option>
                </select>
              )}
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-amber-100 transition-colors"
                onClick={() => setRosterCollapsed(!rosterCollapsed)}
                title={rosterCollapsed ? "Espandi roster" : "Collassa roster"}
              >
                {rosterCollapsed ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          {!rosterCollapsed && (
            <div className="space-y-2 overflow-y-auto max-h-96">
              {availableResidents.length === 0 ? (
                <div className="py-8 text-center text-sm italic text-slate-400">
                  Nessun residente disponibile
                </div>
              ) : (
                availableResidents.map((resident) => (
                  <PgCard
                    key={`${resident.id}-${resident.status}`}
                    workerId={resident.id}
                    label={resident.displayName || resident.id}
                    hp={resident.currentHp}
                    fatigue={resident.fatigue}
                    maxHp={resident.maxHp}
                    isDragging={draggingResidentId === resident.id}
                    disabled={resident.status !== 'available'}
                    horizontal={true}
                    portraitUrl={resident.portraitUrl}
                    onDragStateChange={(workerId: string, isDragging: boolean) => {
                      if (isDragging) {
                        setActiveId(workerId);
                      } else {
                        setActiveId(null);
                      }
                    }}
                    onDragStart={(event: ReactDragEvent<HTMLDivElement>) => {
                      event.dataTransfer.setData(RESIDENT_DRAG_MIME, resident.id);
                      event.dataTransfer.setData('text/resident-id', resident.id);
                      event.dataTransfer.setData('text/plain', resident.id);
                      event.dataTransfer.effectAllowed = 'copy';
                      // handleRosterDragStart(resident.id);
                    }}
                    onDragEnd={() => {
                      // handleRosterDragEnd();
                    }}
                    onSelect={(workerId: string) => {
                      // Handle selection - toggle resident detail modal
                      setSelectedResidentIds((prev) =>
                        prev.includes(workerId)
                          ? prev.filter((id) => id !== workerId)
                          : [...prev, workerId]
                      );
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="w-72 shrink-0 relative">
              {renderDemoPanel()}
              {/* Bloom effect overlay - positioned after content */}
              <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-amber-400/10 via-transparent to-cyan-400/10 blur-lg opacity-50 pointer-events-none z-10" />
            </div>
              <div className="rounded-3xl border border-white/15 bg-black/30 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)]">
                <LocationCard
                  title={locationPanelFeaturedActivity?.label ?? 'Località attiva'}
                  description="Trascina un residente e osserva gli slot compatibili"
                  dropState={locationDropState}
                  isLockedByPhase={false}
                  featuredActivity={locationPanelFeaturedActivity}
                  onInspect={handleLocationInspect}
                  onDragIntent={handleLocationDragIntent}
                  onResidentDragEnter={(residentId: string | null) => handleLocationResidentDragEnter(residentId)}
                  onResidentDragLeave={handleLocationResidentDragLeave}
                  onResidentDrop={(residentId: string | null) => residentId && handleLocationResidentDrop(residentId, locationPanelFeaturedActivity?.slotId)}
                  size="compact"
                />
              </div>
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
                <DayNightActionCard
                  phaseIcon={<span aria-hidden>{cyclePhaseIcon}</span>}
                  isPlaying={isCyclePlaying}
                  progressFraction={cycleProgressFraction}
                  totalSeconds={totalCycleSeconds}
                  variant={cycleVariant}
                  haloSizePx={haloSizePx}
                  haloStrokeWidth={haloStrokeWidth}
                  innerSizePercent={innerSizePercent}
                  onToggle={() => setIsCyclePlaying((prev) => !prev)}
                />
                <HungerActionCard
                  progressFraction={cycleProgressFraction}
                  totalSeconds={totalCycleSeconds}
                  isPlaying={isCyclePlaying}
                />

                <div
                  className="w-full flex items-center justify-center p-1"
                  onDragOver={handleJobDragOver}
                  onDragEnter={handleJobDragOver}
                  onDrop={handleJobDrop}
                  data-testid="job-card-dropzone"
                >
                  {primaryJobActivity ? (
                    <JobActionCard
                      label={primaryJobActivity.label ?? primaryJobActivity.id}
                      icon={<span aria-hidden>{jobIcon}</span>}
                      progressFraction={jobProgressFraction}
                      elapsedSeconds={jobElapsedSeconds}
                      totalDurationSeconds={jobTotalDurationSeconds}
                      isPlaying={jobIsPlaying}
                      onToggle={handleJobToggle}
                      dropState={jobDropState}
                      helperText={jobHelperText}
                      dataTestId="job-action-card"
                      onMedallionClick={handleJobDetailRequest}
                    />
                  ) : (
                    <div className="text-[11px] text-slate-500">Nessun job disponibile</div>
                  )}
                </div>

                {questActivity && (
                  <div className="w-full flex items-center justify-center p-1">
                    <QuestActionCard
                      label={questActivity.label ?? questActivity.id}
                      icon={<span aria-hidden>{questIcon}</span>}
                      progressFraction={questProgressFraction}
                      elapsedSeconds={questElapsedSeconds}
                      totalDurationSeconds={questTotalDurationSeconds}
                      injuryPercentage={0}
                      deathPercentage={0}
                      isPlaying={questIsPlaying}
                      dropState={questDropState}
                      onToggle={handleQuestToggle}
                      onMedallionClick={handleQuestDetailRequest}
                      onMedallionDrop={handleQuestDrop}
                      onMedallionDragOver={handleQuestDragOver}
                      onMedallionDragEnter={handleQuestDragOver}
                      onMedallionDragLeave={handleQuestDragOver} // Note: handleQuestDragOver is used, but for leave, might need separate
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* {isTheaterOpen && theaterPrimarySlot && (
        <TheaterView
          slotLabel={theaterPrimarySlot.label}
          slotIcon={theaterPrimarySlot.iconName}
          verbs={theaterVerbs}
          slotCards={theaterSlotCards}
          jobCards={theaterJobCards}
          acceptResidentDrop={Boolean(draggingResidentId)}
          onResidentDrop={(residentId) => residentId && handleLocationResidentDrop(residentId, theaterPrimarySlot?.slotId)}
          onAssignResident={(slotId, residentId) => handleWorkerDrop(slotId, residentId, { autoStart: false })}
          onClose={handleCloseTheater}
        />
      )} */}

      {questChronicleData && isQuestDetailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6" data-testid="quest-detail-modal">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsQuestDetailOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
            <QuestChronicle
              title={questChronicleData.title}
              summary={questChronicleData.summary}
              phases={questChronicleData.chronicle.phases}
              currentPhaseIndex={questChronicleData.chronicle.activeIndex}
            />
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-white/30 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-200 hover:border-amber-200/70 hover:text-amber-100"
              onClick={() => setIsQuestDetailOpen(false)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {detailContexts.map((context) => {
        const activityState = activityScheduler.getActivityState(context.slotId, context.slot.assignedWorkerId || '');
        const progressFraction = activityState?.progress ?? 0;
        const elapsedSeconds = activityState?.elapsed ?? 0;
          const totalDurationSeconds = activityState?.duration ?? (Number(context.activity.durationFormula) || 90);

        const metrics: ActivityCardMetric[] = [
          {
            id: 'detail-progress',
            label: 'Progresso',
            value: `${Math.round(progressFraction * 100)}%`,
            type: 'progress',
          },
          {
            id: 'detail-duration',
            label: 'Durata',
            value: `${elapsedSeconds}/${totalDurationSeconds}s`,
            type: 'text',
          },
        ];

        const slotViewModels: ResidentSlotViewModel[] = context.slot.assignedWorkerId ? [
          {
            id: context.slot.slotId,
            index: 0,
            label: context.slot.label,
            assignedResidentId: context.slot.assignedWorkerId,
            isPlaceholder: false,
            dropState: 'idle' as const,
          },
        ] : [];

        return (
          <div key={context.slotId} className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6" data-testid="activity-detail-modal">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closeDetailPanel(context.slotId)} />
            <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
              <ActivityCardDetail
                activity={context.activity}
                slotLabel={context.slot.label}
                preview={{
                  rewards: context.activity.rewards || [],
                  injuryPercentage: Math.min(100, (context.activity.dangerRating ?? 1) * 15),
                  deathPercentage: Math.round((context.activity.dangerRating ?? 1) * 15 / 2),
                }}
                slotViewModels={slotViewModels}
                metrics={metrics}
                rewards={context.activity.rewards || []}
                durationSeconds={totalDurationSeconds}
                elapsedSeconds={elapsedSeconds}
                onDropResident={() => {}}
                onRemoveResident={() => {}}
                slotOverflowMode="wrap"
                isStartDisabled={true}
                onStart={() => {}}
                draggingResidentId={draggingResidentId}
              />
              <button
                type="button"
                className="mt-4 w-full rounded-full border border-white/30 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-200 hover:border-amber-200/70 hover:text-amber-100"
                onClick={() => closeDetailPanel(context.slotId)}
              >
                Chiudi
              </button>
            </div>
          </div>
        );
      })}

      {selectedResidentIds.map((residentId, index) => {
        const resident = residentsById[residentId];
        if (!resident) return null;

        const handleClose = () => {
          setSelectedResidentIds((prev) => prev.filter((id) => id !== residentId));
        };

        // Posizioni predefinite per evitare sovrapposizioni
        const positions = [
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, // Centro
          { top: '10%', left: '10%' }, // Alto-sinistra
          { top: '10%', right: '10%' }, // Alto-destra
          { bottom: '10%', left: '10%' }, // Basso-sinistra
          { bottom: '10%', right: '10%' }, // Basso-destra
        ];

        const position = positions[index % positions.length];

        return (
          <div
            key={residentId}
            className="fixed z-40 pointer-events-none"
            style={{
              ...position,
              transform: position.transform || undefined,
            }}
          >
            <div className="pointer-events-auto">
              <PgDetailCard resident={resident} onClose={handleClose} />
            </div>
          </div>
        );
      })}
    </section>
    </div>
  );
}

export default MapPage;
