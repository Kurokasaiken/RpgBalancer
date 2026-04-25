import { useMemo, useCallback, useState } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useMapContext } from '@/ui/idleVillage/hooks/useMapContext';
import { type DropState } from '@/ui/idleVillage/hooks/useSandboxDragController';
import { useQuestChronicle } from '@/ui/idleVillage/hooks/useQuestChronicle';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import { resolveFeaturedActivity } from '@/ui/idleVillage/map/mapSelectors';
import { ActionCardWrapper } from '@/ui/idleVillage/components/ActionCardWrapper';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { computeDropStateForResident } from '@/ui/idleVillage/slots/residentSlotValidators';
import QuestChronicle from '../components/QuestChronicle';
import PgCard from '@/ui/idleVillage/components/PgCard';
import LocationCard, { type LocationFeaturedActivity } from '@/ui/idleVillage/components/LocationCard';
import SchedaPergamena from '@/ui/idleVillage/components/SchedaPergamena';
import DayNightActionCard from '@/ui/idleVillage/map/actionCards/DayNightActionCard';
import HungerActionCard from '@/ui/idleVillage/map/actionCards/HungerActionCard';
import { ResourcePanel } from '@/ui/idleVillage/map/components/ResourcePanel';
import { useActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import ActivityCardDetail, { type ActivityCardMetric } from '@/ui/idleVillage/components/ActivityCardDetail';
import { HUDNotificationLayer } from '@/ui/idleVillage/components/HUDNotificationLayer';
import { DEFAULT_HUD_NOTIFICATION_CONFIG } from '@/balancing/config/idleVillage/hudNotificationConfig';
import { useMapHeatmapData } from '@/ui/idleVillage/hooks/useMapHeatmapData';
import MapHeatmapOverlay from '@/ui/idleVillage/components/MapHeatmapOverlay';
import { DEFAULT_HEATMAP_CONFIG } from '@/balancing/config/idleVillage/heatmapConfig';
import { useBootGuardDiagnostics } from '@/ui/shared/bootGuard/useBootGuardDiagnostics';

/**
 * Local type definitions for activity detail modal.
 */
type DemoRequirementKey = 'none' | 'hp200';

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
  const bootGuardDiagnostics = useBootGuardDiagnostics({
    pageId: 'idle-village-map',
    source: 'MapPage',
  });

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div data-testid="idle-village-map-error" className="p-4 text-red-400">
          <p>Idle Village Map failed to load.</p>
          <pre className="text-xs">{error.message}</pre>
        </div>
      )}
      onError={(error, info) => {
        bootGuardDiagnostics.captureError(error, info?.componentStack);
      }}
    >
      <MapPageContent />
    </ErrorBoundary>
  );
}

function MapPageContent() {
  const {
    activePreset: themePreset,
    presets: themePresets,
    setPreset: setThemePreset,
    randomizeTheme,
    resetRandomization,
    isRandomized,
    shellPresetOptions,
    activeShellPresetId,
    setShellPresetId,
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
    managedActivities,
    activityScheduler,
    residentsById,
    slotAssignments,
    setSlotAssignments,
    handleLocationInspect,
    handleLocationDragIntent,
    handleLocationResidentDrop,
    openDetailPanel,
    closeDetailPanel,
    locationSlots,
    locationDropState,
    demoPanelState,
    demoPanelHandlers,
    handleResetResidents,
    detailContexts,
  } = useMapContext();

  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'available' | 'away' | 'exhausted' | 'injured'>('all');
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [isQuestDetailOpen, setIsQuestDetailOpen] = useState(false);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  const maxFatigueBeforeExhausted = config?.globalRules.maxFatigueBeforeExhausted ?? 100;

  const getActivityState = useCallback((slotId: string, residentId: string) => {
    return activityScheduler.getActivityState(slotId, residentId);
  }, [activityScheduler]);

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

  // Pre-compute activity handlers to avoid useCallback inside map
  const activityHandlers = useMemo(() => {
    const handlers: Record<string, {
      handleDrop: (residentId: string | null) => void;
      handleDetail: () => void;
    }> = {};

    managedActivities.forEach((activity) => {
      handlers[activity.id] = {
        handleDrop: (residentId: string | null) => {
          if (!activity || !residentId) return;
          const validation = validateJobAssignment(residentId); // Reuse validation logic
          if (!validation.ok) {
            setAssignmentFeedback(validation.reason);
            return;
          }
          const previousAssignment = slotAssignments[activity.id] ?? null;
          setSlotAssignments((prev) => ({ ...prev, [activity.id]: residentId }));
          const totalDuration = activityScheduler.getActivityState(activity.id, residentId)?.duration ?? (Number(activity.durationFormula) || 0);
          const durationSeconds = totalDuration > 0 ? totalDuration : undefined;
          const started = activityScheduler.startActivity(activity.id, residentId, durationSeconds);
          if (!started) {
            setSlotAssignments((prev) => ({ ...prev, [activity.id]: previousAssignment }));
            setAssignmentFeedback('Impossibile avviare l\'attività.');
            return;
          }
          const label = residentsById[residentId]?.displayName ?? residentId;
          setAssignmentFeedback(`${label} assegnato a ${activity.label}.`);
          setActiveId(null);
        },
        handleDetail: () => {
          openDetailPanel(activity.id);
        },
      };
    });

    return handlers;
  }, [managedActivities, activityScheduler, residentsById, setActiveId, setAssignmentFeedback, setSlotAssignments, slotAssignments, openDetailPanel]);
  const activityDropStates = useMemo(() => {
    const states: Record<string, DropState> = {};
    managedActivities.forEach((activity) => {
      if (!activity || !draggingResidentId) {
        states[activity.id] = 'idle';
      } else {
        states[activity.id] = computeDropStateForResident(
          draggingResidentId,
          activity,
          { canAssignResident: activityScheduler.canAssignResident },
          activity.statRequirement,
          residentsById,
          { maxFatigueBeforeExhausted },
        );
      }
    });
    return states;
  }, [
    managedActivities,
    draggingResidentId,
    activityScheduler.canAssignResident,
    residentsById,
    maxFatigueBeforeExhausted,
  ]);

  // Phase 12: Synchronized HUD state for active activities monitoring
  const hudState = useActiveHUDState({
    config,
    villageState,
    secondsPerTimeUnit: config.globalRules.secondsPerTimeUnit ?? 60,
    currentTime: villageState.currentTime ?? 0,
    getActivityState,
  });

  // Phase 12: Heatmap data for activity density visualization
  const heatmapState = useMapHeatmapData({
    hudState,
    config: DEFAULT_HEATMAP_CONFIG,
    mapDimensions: { width: 1200, height: 800 }, // Map dimensions - should be configurable
    villageState,
  });

  const getResourceMetadata = useResourceMetadata(config);

  const getResourceLabel = useCallback(
    (resourceId: string) => getResourceMetadata(resourceId).label,
    [getResourceMetadata],
  );

  const maxFatigueBeforeExhausted = config?.globalRules.maxFatigueBeforeExhausted ?? 100;

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
      { maxFatigueBeforeExhausted },
    );
  }, [
    activityScheduler.canAssignResident,
    draggingResidentId,
    primaryJobActivity,
    residentsById,
    maxFatigueBeforeExhausted,
  ]);

  const questDropState: DropState = useMemo(() => {
    if (!questActivity || !draggingResidentId) return 'idle';
    return computeDropStateForResident(
      draggingResidentId,
      questActivity,
      { canAssignResident: activityScheduler.canAssignResident },
      questActivity.statRequirement,
      residentsById,
      { maxFatigueBeforeExhausted },
    );
  }, [
    activityScheduler.canAssignResident,
    draggingResidentId,
    questActivity,
    residentsById,
    maxFatigueBeforeExhausted,
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
      const totalDuration = activityScheduler.getActivityState(primaryJobActivity.id, residentId)?.duration ?? (Number(primaryJobActivity.durationFormula) || 0);
      const durationSeconds = totalDuration > 0 ? totalDuration : undefined;
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
      const totalDuration = activityScheduler.getActivityState(questActivity.id, residentId)?.duration ?? (Number(questActivity.durationFormula) || 0);
      const durationSeconds = totalDuration > 0 ? totalDuration : undefined;
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

  //     event.dataTransfer.setData('text/resident-id', residentId);
  //     event.dataTransfer.setData('text/plain', residentId);
  //   },
  //   [setActiveId],
  // );

  // const handleRosterDragEnd = useCallback(() => {
  //   setActiveId(null);
  // }, [setActiveId]);

  const [selectedLocation, setSelectedLocation] = useState<LocationFeaturedActivity | null>(null);
  const [detailCardResidents, setDetailCardResidents] = useState<Record<string, ResidentState>>({});
  const [hoveredResidentId, setHoveredResidentId] = useState<string | null>(null);
  const [pergamenaAnchor, setPergamenaAnchor] = useState<HTMLElement | null>(null);

  const locationPanelFeaturedActivity = useMemo<LocationFeaturedActivity | null>(() => {
    if (locationSlots.length === 0) return null;
    const primarySlot = locationSlots.find((slot) => slot.assignedWorkerId) ?? locationSlots[0] ?? null;
    return resolveFeaturedActivity({
      slotId: primarySlot?.slotId ?? null,
      slots: locationSlots,
      scheduler: activityScheduler,
      residentsById,
      config,
    });
  }, [activityScheduler, config, locationSlots, residentsById]);

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

  const questChronicle = useQuestChronicle({
    config,
    questActivity,
  });

  const handleQuestDetailRequest = useCallback(() => {
    if (!questActivity || !questChronicle) return;
    setIsQuestDetailOpen(true);
  }, [questActivity, questChronicle]);

  const handleJobDetailRequest = useCallback(() => {
    if (!primaryJobActivity) return;
    openDetailPanel(primaryJobActivity.id);
  }, [openDetailPanel, primaryJobActivity]);

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
            activePreset={themePreset}
            presets={themePresets}
            isRandomized={isRandomized}
            onSelectPreset={setThemePreset}
            onRandomize={randomizeTheme}
            onResetRandomization={resetRandomization}
            className="flex-1 border-amber-200/30 bg-black/40"
            kickerLabel="Style Lab · Village Sandbox"
            headerLabel="Style Lab"
          />

          <div className="flex w-full flex-col gap-3 lg:max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-lg backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Scenario Preset</p>
              <p className="mt-1 text-sm text-slate-200">
                Seleziona il loop preconfigurato che verrà caricato nella sandbox (config locked).
              </p>
              <div className="mt-3 grid gap-2">
                {shellPresetOptions.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={[
                      'w-full rounded-xl border px-3 py-2 text-left transition',
                      activeShellPresetId === preset.id
                        ? 'border-amber-300/70 bg-amber-400/10 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                        : 'border-white/15 text-slate-200 hover:border-amber-200/40 hover:text-amber-50',
                      preset.isEditor ? 'italic' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setShellPresetId(preset.id)}
                    data-testid={`shell-preset-${preset.id}`}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
                      <span>{preset.label}</span>
                      {preset.isEditor ? <span className="text-slate-400">Editor</span> : <span className="text-amber-200">Loop</span>}
                    </div>
                    <p className="mt-1 text-[12px] text-slate-300">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <ResourcePanel
              className="w-full"
              headerLabel="Risorse"
              items={[
                { label: 'Cibo', value: foodAmount, accentClass: 'text-amber-200', borderClass: 'border-amber-300/40' },
                { label: 'Oro', value: goldAmount, accentClass: 'text-yellow-200', borderClass: 'border-yellow-200/40' },
                { label: 'Giorno', value: dayCounter, accentClass: 'text-cyan-200', borderClass: 'border-cyan-300/40' },
              ]}
            />
            <div className="flex items-center gap-4">
              {assignmentFeedback && (
                <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-[11px] text-amber-100 shadow-inner shadow-amber-400/30">
                  {assignmentFeedback}
                </div>
              )}
              <button
                type="button"
                className="rounded-full border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-rose-100 transition hover:border-rose-300/70 hover:bg-rose-400/20"
                onClick={handleResetResidents}
              >
                🔄 Reset Residenti
              </button>
            </div>
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
                  <div
                    key={`${resident.id}-${resident.status}`}
                    className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <PgCard
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
                      }}
                      onDragEnd={() => {
                        setActiveId(null);
                      }}
                      onPointerEnter={(event: React.PointerEvent<HTMLDivElement>) => {
                        setHoveredResidentId(resident.id);
                        setPergamenaAnchor(event.currentTarget);
                        setDetailCardResidents(prev => ({ ...prev, [resident.id]: resident }));
                      }}
                      onPointerLeave={() => {
                        // Reset hover state immediatamente
                        setHoveredResidentId(null);
                        setPergamenaAnchor(null);
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
                  </div>
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
          <div className="rounded-3xl border border-white/15 bg-black/30 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] relative overflow-hidden">
            <LocationCard
              title={locationPanelFeaturedActivity?.label ?? 'Località attiva'}
              description="Trascina un residente e osserva gli slot compatibili"
              dropState={locationDropState}
              isLockedByPhase={false}
              featuredActivity={locationPanelFeaturedActivity}
              onInspect={handleLocationInspect}
              onDragIntent={handleLocationDragIntent}
              onResidentDrop={(residentId: string | null) => residentId && handleLocationResidentDrop(residentId, locationPanelFeaturedActivity?.slotId)}
              size="compact"
            />
            {/* Enhanced bloom effect for location card based on drop state */}
            {draggingResidentId && locationDropState !== 'idle' && (
              <div
                className={`absolute inset-0 rounded-3xl blur-xl pointer-events-none z-10 transition-all duration-300 ${
                  locationDropState === 'valid'
                    ? 'bg-linear-to-br from-emerald-400/20 via-transparent to-cyan-400/15'
                    : 'bg-linear-to-br from-red-400/15 via-transparent to-orange-400/10'
                }`}
                style={{
                  opacity: locationDropState === 'valid' ? 0.6 : 0.4,
                }}
              />
            )}
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
            {managedActivities.map((activity) => {
              const assignedResidentId = slotAssignments?.[activity.id] ?? null;
              const activityState = assignedResidentId ? activityScheduler.getActivityState(activity.id, assignedResidentId) : null;
              const activityDropState = activityDropStates[activity.id];
              const handlers = activityHandlers[activity.id];

              return (
                <div
                  key={activity.id}
                  className="w-full flex items-center justify-center p-1 relative"
                  onDragOver={(e) => {
                    if (activityDropState === 'idle') return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = activityDropState === 'valid' ? 'copy' : 'none';
                  }}
                  onDragEnter={(e) => {
                    if (activityDropState === 'idle') return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = activityDropState === 'valid' ? 'copy' : 'none';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const residentId = extractResidentId(e);
                    if (residentId) handlers.handleDrop(residentId);
                  }}
                  data-testid={`activity-slot-${activity.id}`}
                >
                  <ActionCardWrapper
                    activity={activity}
                    config={config}
                    residents={residentsById}
                    currentTime={currentTime}
                    onCollect={() => {
                      // Telemetry for capsule collect
                      trackTelemetryEvent('activity_capsule_collect_clicked', {
                        activityId: activity.id,
                        slotId: activity.id,
                        event: 'capsule_collect_clicked',
                        timestamp: Date.now(),
                      });
                    }}
                    dataTestId={`activity-card-${activity.id}`}
                  />
                  {/* Detail button */}
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full border border-white/25 bg-black/40 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-slate-200 hover:border-amber-200/70 hover:text-amber-100 transition"
                    onClick={handlers.handleDetail}
                    aria-label={`Apri dettagli ${activity.label}`}
                    data-testid={`activity-detail-trigger-${activity.id}`}
                  >
                    Dettaglio
                  </button>
                  {/* Bloom effect */}
                  {draggingResidentId && activityDropState !== 'idle' && (
                    <div
                      className={`absolute inset-0 rounded-2xl blur-xl pointer-events-none z-10 transition-all duration-300 ${
                        activityDropState === 'valid'
                          ? 'bg-linear-to-br from-emerald-400/25 via-transparent to-cyan-400/20'
                          : 'bg-linear-to-br from-red-400/20 via-transparent to-orange-400/15'
                      }`}
                      style={{
                        opacity: activityDropState === 'valid' ? 0.7 : 0.5,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase 12: Heatmap Overlay */}
      <MapHeatmapOverlay
        heatmapState={heatmapState}
        isVisible={isHeatmapVisible}
        onToggle={setIsHeatmapVisible}
        showLegend={true}
        enableHover={true}
      />

      {/* {isTheaterOpen && theaterPrimarySlot && (
        <TheaterView
          slotLabel={theaterPrimarySlot.label}
          slotIcon={theaterPrimarySlot.iconName}
          verbs={theaterVerbs}
          slotCards={theaterSlotCards}
          jobCards={theaterJobCards}
          acceptResidentDrop={Boolean(draggingResidentId)}
          onResidentDrop={(residentId) => residentId && handleLocationResidentDrop(residentId, theaterPrimarySlot.slotId)}
          onAssignResident={(slotId, residentId) => handleWorkerDrop(slotId, residentId, { autoStart: false })}
          onClose={handleCloseTheater}
        />
      )} */}

      {questChronicle && isQuestDetailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6" data-testid="quest-detail-modal">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsQuestDetailOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
            <QuestChronicle
              title={questChronicle.title}
              summary={questChronicle.summary}
              phases={questChronicle.chronicle.phases}
              currentPhaseIndex={questChronicle.chronicle.activeIndex}
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
            tone: 'neutral',
          },
          {
            id: 'detail-duration',
            label: 'Durata',
            value: `${elapsedSeconds}/${totalDurationSeconds}s`,
            tone: 'neutral',
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

      {selectedResidentIds.map((residentId) => {
        const resident = residentsById[residentId];
        if (!resident) return null;

        return null; // Disabilitato detail cards, usa SchedaPergamena su hover
      })}
    </section>

    {/* Scheda Pergamena - Bento Grid System */}
    {hoveredResidentId && detailCardResidents[hoveredResidentId] && (
      <SchedaPergamena
        resident={detailCardResidents[hoveredResidentId]}
        isOpen={!!hoveredResidentId}
        onClose={() => {
          setHoveredResidentId(null);
          setPergamenaAnchor(null);
        }}
        anchorElement={pergamenaAnchor}
      />
    )}

    {/* Active HUD Notification Layer */}
    <HUDNotificationLayer config={DEFAULT_HUD_NOTIFICATION_CONFIG} />

    {/* Phase 12 Active HUD - synchronized with map activities */}
    {hudState.hasActiveActivities && (
      <div className="fixed top-4 right-4 z-50">
        <ActiveHUD
          hudState={hudState}
          villageState={villageState}
          secondsPerTimeUnit={config.globalRules.secondsPerTimeUnit ?? 60}
          variant="compact"
          maxVisible={5}
          enableTelemetry={true}
        />
      </div>
    )}
    </div>
  );
}

export default MapPage;
