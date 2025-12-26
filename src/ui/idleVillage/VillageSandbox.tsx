import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { createVillageStateFromConfig, getStartingResidentFatigue, type ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlotCard, { type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { VerbSlotState } from '@/ui/idleVillage/VerbDetailCard';
import ActivityCardDetail from '@/ui/idleVillage/components/ActivityCardDetail';
import ResidentRoster from '@/ui/idleVillage/ResidentRosterDnd';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import TheaterView from '@/ui/idleVillage/components/TheaterView';
import { DragProvider, useDragContext } from '@/ui/idleVillage/components/DragContext';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { useActivityScheduler, type ActivityResolutionResult } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { DEFAULT_SECONDS_PER_TIME_UNIT } from '@/ui/idleVillage/verbSummaries';

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

const VillageSandboxContent = () => {
  const { activePreset, presets, setPreset, randomizeTheme, resetRandomization, isRandomized } = useThemeSwitcher();
  const { config } = useIdleVillageConfig();
  const { activeId: draggingResidentId, setActiveId } = useDragContext();
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [detailPanelSlotIds, setDetailPanelSlotIds] = useState<string[]>([]);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [theaterSlotId, setTheaterSlotId] = useState<string | null>(null);
  const [rosterCounts, setRosterCounts] = useState<{ filtered: number; total: number }>({ filtered: 0, total: 0 });
  const [detailAssignments, setDetailAssignments] = useState<Record<string, string | null>>({});
  const [isCyclePlaying, setIsCyclePlaying] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

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

  // Activity completion handler
  const handleActivityComplete = useCallback((result: ActivityResolutionResult) => {
    console.log('Activity completed:', result);
    
    // Update assignment feedback
    const resident = villageState.residents[result.residentId];
    const residentLabel = resident ? formatResidentLabel(resident) : result.residentId;
    const activityLabel = config.activities?.[result.activityId]?.label ?? result.activityId;
    
    if (result.success) {
      setAssignmentFeedback(`${residentLabel} ha completato ${activityLabel} con successo!`);
    } else {
      const fallenCount = result.outcome.fallen.length;
      if (fallenCount > 0) {
        setAssignmentFeedback(`${residentLabel} è morto durante ${activityLabel}!`);
      } else {
        setAssignmentFeedback(`${residentLabel} ha fallito ${activityLabel}.`);
      }
    }

    // Clear the assignment
    setAssignments(prev => {
      const next = { ...prev };
      if (next[result.activityId] === result.residentId) {
        next[result.activityId] = null;
      }
      return next;
    });
  }, [villageState.residents, config.activities]);

  // Resource change handler
  const handleResourcesChange = useCallback((resources: VillageResources, changes: any[]) => {
    console.log('Resources changed:', resources, changes);
    // Update UI to show resource changes
    // This could trigger a toast or update a resource display
  }, []);

  // Resident state change handler
  const handleResidentStateChange = useCallback((residentId: string, newState: Partial<VillageState['residents'][string]>) => {
    console.log('Resident state changed:', residentId, newState);
    // The village state is already updated by the scheduler
    // This can be used for additional UI updates
  }, []);

  // Initialize activity scheduler
  const activityScheduler = useActivityScheduler({
    config,
    initialVillageState: villageState,
    onActivityComplete: handleActivityComplete,
    onResourcesChange: handleResourcesChange,
    onResidentStateChange: handleResidentStateChange,
  });

  const activities = useMemo<ActivityDefinition[]>(() => Object.values(config.activities ?? {}), [config.activities]);
  const schedulerVillageState = activityScheduler.villageState;
  const showcaseActivities = useMemo<ActivityDefinition[]>(() => {
    const sorted = [...activities].sort((a, b) => (a.label ?? a.id).localeCompare(b.label ?? b.id));
    return sorted.slice(0, 3);
  }, [activities]);
  const residents = useMemo<ResidentState[]>(() => {
    const source = schedulerVillageState?.residents ?? villageState.residents ?? {};
    const entries = Object.values(source).filter((resident) => resident.status !== 'dead');
    const rankResident = (resident: ResidentState): number => {
      if (resident.isInjured) return 3;
      switch (resident.status) {
        case 'available':
          return 0;
        case 'working':
          return 1;
        case 'away':
          return 2;
        case 'exhausted':
          return 4;
        default:
          return 5;
      }
    };
    return entries.sort((a, b) => {
      const rankDiff = rankResident(a) - rankResident(b);
      if (rankDiff !== 0) return rankDiff;
      return formatResidentLabel(a).localeCompare(formatResidentLabel(b));
    });
  }, [schedulerVillageState?.residents, villageState.residents]);
  const selectedResident = useMemo(
    () => residents.find((resident) => resident.id === selectedResidentId) ?? null,
    [residents, selectedResidentId],
  );
  const secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config.globalRules.dayLengthInTimeUnits || 5;
  const dayNightSettings = config.globalRules.dayNightCycle ?? {
    dayTimeUnits: dayLengthSetting,
    nightTimeUnits: dayLengthSetting,
  };
  const dayTimeUnits = Math.max(1, dayNightSettings.dayTimeUnits ?? dayLengthSetting);
  const nightTimeUnits = Math.max(1, dayNightSettings.nightTimeUnits ?? dayLengthSetting);
  const totalCycleUnits = dayTimeUnits + nightTimeUnits;
  const currentTimeUnits = schedulerVillageState?.currentTime ?? villageState.currentTime ?? 0;
  const initialCycleUnit = totalCycleUnits > 0 ? currentTimeUnits % totalCycleUnits : 0;
  const [cycleTimeUnits, setCycleTimeUnits] = useState(initialCycleUnit);
  const cycleTickRef = useRef<number | null>(null);
  const cycleProgressFraction = totalCycleUnits > 0 ? cycleTimeUnits / totalCycleUnits : 0;
  const isDayPhase = cycleTimeUnits < dayTimeUnits;
  const cyclePhaseLabel = isDayPhase ? 'Fase giorno' : 'Fase notte';
  const cyclePhaseIcon = isDayPhase ? '☀️' : '🌙';
  const cycleVariant: VerbVisualVariant = isDayPhase ? 'solar' : 'amethyst';
  const totalCycleSeconds = totalCycleUnits * secondsPerTimeUnit;
  const cycleElapsedSeconds = cycleProgressFraction * totalCycleSeconds;

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
  }, [config, residents.length, resetState, refreshResidentsFromCharacterManager]);

  useEffect(() => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    if (latestResidents.length > residents.length) {
      resetState(
        () =>
          createVillageStateFromConfig({
            config,
            initialResidents: latestResidents,
          }),
        'VillageSandbox sync residents',
      );
    }
  }, [config, residents.length, resetState]);


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
    const dayNightSlot: ActivitySlotData = {
      slotId: 'day-night-cycle',
      label: `${cyclePhaseLabel} · ${isCyclePlaying ? 'In esecuzione' : 'In pausa'}`,
      iconName: cyclePhaseIcon,
      assignedWorkerId: null,
      activity: {
        id: 'day-night-cycle',
        label: cyclePhaseLabel,
        description: 'Ciclo giorno/notte',
        tags: ['system'],
        slotTags: [],
        resolutionEngineId: 'system',
        durationFormula: String(totalCycleSeconds),
        metadata: {},
        rewards: [],
      },
    };
    const activitySlots = showcaseActivities.map((activity) => {
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
    return [dayNightSlot, ...activitySlots];
  }, [
    showcaseActivities,
    assignments,
    config.mapSlots,
    cyclePhaseLabel,
    cyclePhaseIcon,
    totalCycleSeconds,
    isCyclePlaying,
  ]);

  useEffect(() => {
    if (isCyclePlaying) return;
    setCycleTimeUnits(initialCycleUnit);
  }, [initialCycleUnit, isCyclePlaying]);

  useEffect(() => {
    if (!isCyclePlaying || totalCycleUnits <= 0 || secondsPerTimeUnit <= 0) {
      cycleTickRef.current = null;
      return;
    }
    let frameId: number;
    const tick = (timestamp: number) => {
      if (cycleTickRef.current == null) {
        cycleTickRef.current = timestamp;
      }
      const deltaSeconds = (timestamp - cycleTickRef.current) / 1000;
      cycleTickRef.current = timestamp;
      if (deltaSeconds > 0) {
        const deltaUnits = deltaSeconds / secondsPerTimeUnit;
        setCycleTimeUnits((prev) => (prev + deltaUnits) % totalCycleUnits);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      cycleTickRef.current = null;
    };
  }, [isCyclePlaying, secondsPerTimeUnit, totalCycleUnits]);

  useEffect(() => {
    if (isCyclePlaying) {
      activityScheduler.resumeTimer();
    } else {
      activityScheduler.pauseTimer();
    }
  }, [isCyclePlaying, activityScheduler]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      setIsCyclePlaying((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setDetailPanelSlotIds((prev) => prev.filter((slotId) => slots.some((slot) => slot.slotId === slotId)));
  }, [slots]);

  const openDetailPanel = useCallback((slotId: string) => {
    setDetailPanelSlotIds((prev) => {
      if (prev.includes(slotId)) {
        return [...prev.filter((id) => id !== slotId), slotId];
      }
      return [...prev, slotId];
    });
  }, []);

  const closeDetailPanel = useCallback((slotId: string) => {
    setDetailPanelSlotIds((prev) => prev.filter((id) => id !== slotId));
  }, []);

  const startSlotActivity = useCallback(
    (slotId: string, residentOverride?: string | null) => {
      const slot = slots.find((item) => item.slotId === slotId);
      if (!slot) return false;
      const activity = config.activities?.[slotId];
      const residentId = residentOverride ?? assignments[slotId] ?? slot.assignedWorkerId ?? null;
      if (!residentId) {
        setAssignmentFeedback('Assegna un residente prima di iniziare l’attività.');
        return false;
      }
      const duration = activity ? Number(activity.durationFormula) || 90 : 90;
      const success = activityScheduler.startActivity(slotId, residentId, duration);
      const residentLabel = formatResidentLabel(villageState.residents[residentId]);
      const activityLabel = activity?.label ?? slot.label;
      if (success) {
        setAssignmentFeedback(`${residentLabel} ha iniziato ${activityLabel}.`);
        return true;
      }
      setAssignmentFeedback(`Impossibile iniziare ${activityLabel}.`);
      return false;
    },
    [assignments, slots, config.activities, activityScheduler, villageState.residents],
  );

  const handleWorkerDrop = useCallback(
    (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => {
      const autoStart = options?.autoStart ?? true;
      const activity = config.activities?.[activityId];

      if (!residentId) {
        setAssignments((prev) => {
          const next = { ...prev };
          next[activityId] = null;
          return next;
        });
        setAssignmentFeedback(`Slot ${activity?.label ?? activityId} liberato.`);
        return;
      }

      if (!activityScheduler.canAssignResident(residentId, activityId)) {
        setAssignmentFeedback(`Impossibile assegnare ${formatResidentLabel(villageState.residents[residentId])} a questa attività.`);
        return;
      }

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

      if (autoStart) {
        startSlotActivity(activityId, residentId);
        setActiveId(null);
      } else {
        const residentLabel = formatResidentLabel(villageState.residents[residentId]);
        const activityLabel = activity?.label ?? activityId;
        setAssignmentFeedback(`${residentLabel} è pronto per ${activityLabel}. Premi Start per avviare.`);
      }
    },
    [activityScheduler, config.activities, startSlotActivity, villageState.residents, setActiveId],
  );

  const canSlotAcceptDrop = useCallback(
    (slotId: string): boolean => {
      if (!draggingResidentId) return false;
      return activityScheduler.canAssignResident(draggingResidentId, slotId);
    },
    [draggingResidentId, activityScheduler]
  );

  const resolveWorkerName = (residentId: string | null) => {
    if (!residentId) return null;
    const resident = villageState.residents?.[residentId];
    return resident ? formatResidentLabel(resident) : residentId;
  };

  const theaterSlot = useMemo(
    () => slots.find((slot) => slot.slotId === theaterSlotId) ?? null,
    [slots, theaterSlotId],
  );

  const detailSlotAssignments = useMemo<ActivityCardSlotAssignment[]>(() => {
    if (!theaterSlot) return [];

    const slotAssignment = slots.find((slot) => slot.slotId === theaterSlot.slotId);
    const assignedResidentId = assignments[theaterSlot.slotId] ?? slotAssignment?.assignedWorkerId ?? null;
    const residentName = assignedResidentId ? formatResidentLabel(villageState.residents[assignedResidentId]) : null;

    return [
      {
        slot: {
          id: theaterSlot.slotId,
          assignedResidentId,
          residentName,
          requirementLabel: 'Generalist',
          statHint: 'Edge',
          allowMultiple: false,
        },
        residentName,
        dropState:
          draggingResidentId == null
            ? 'idle'
            : activityScheduler.canAssignResident(draggingResidentId, theaterSlot.slotId)
              ? 'valid'
              : 'invalid',
      },
    ];
  }, [activityScheduler, assignments, draggingResidentId, slots, theaterSlot, villageState.residents]);

  const detailContexts = useMemo(() => {
    return detailPanelSlotIds
      .map((slotId) => {
        const selectedSlot = slots.find((slot) => slot.slotId === slotId);
        if (!selectedSlot) return null;
        const activity = config.activities?.[slotId];
        if (!activity) return null;
        const assignedResidentId = assignments[slotId] ?? selectedSlot.assignedWorkerId ?? null;
        return {
          slotId,
          activity,
          slotLabel: selectedSlot.label,
          preview: {
            injuryPercentage: Number(activity.damageFormula ?? 0) * 4,
            deathPercentage: Number(activity.damageFormula ?? 0),
          },
          metrics: [
            {
              id: 'difficulty',
              label: 'Difficulty',
              value: String(activity.difficulty ?? '—'),
              tone: (activity.difficulty ?? 0) >= 5 ? 'danger' : 'warning',
            },
          ],
          durationSeconds: Number(activity.durationFormula ?? 0),
          startDisabled: !assignedResidentId,
        };
      })
      .filter((context): context is NonNullable<typeof context> => Boolean(context));
  }, [config.activities, assignments, detailPanelSlotIds, slots]);

  const handleDetailStart = useCallback(
    (slotId: string) => {
      startSlotActivity(slotId);
    },
    [startSlotActivity],
  );

  const handleResidentDragStart = useCallback(
    (residentId: string) => (event: React.DragEvent<HTMLElement>) => {
      event.dataTransfer.setData('text/resident-id', residentId);
      event.dataTransfer.setData('text/plain', residentId);
      event.dataTransfer.effectAllowed = 'copy';
      setActiveId(residentId);
      setAssignmentFeedback(null);
    },
    [],
  );

  const handleResidentDragEnd = useCallback(() => {
    setActiveId(null);
  }, []);

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

  const handleResidentSelect = useCallback((residentId: string) => {
    setSelectedResidentId((prev) => (prev === residentId ? null : residentId));
  }, []);

  useEffect(() => {
    if (selectedResidentId && !residents.some((resident) => resident.id === selectedResidentId)) {
      setSelectedResidentId(null);
    }
  }, [residents, selectedResidentId]);

  const styleLabStatRows = useMemo(
    () => [
      {
        label: 'Surface',
        value: activePreset.tokens['surface-base'] ?? '--',
      },
      {
        label: 'Panel',
        value: activePreset.tokens['panel-surface'] ?? '--',
      },
      {
        label: 'Accent',
        value: activePreset.tokens['accent-color'] ?? '--',
      },
      {
        label: 'Halo',
        value: activePreset.tokens['halo-color'] ?? '--',
      },
    ],
    [activePreset.tokens],
  );

  const styleLabPanelStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      borderColor: tokens['panel-border'] ?? 'rgba(255, 255, 255, 0.15)',
      background: [
        tokens['panel-sheen'] ?? 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 60%)',
        'linear-gradient(140deg, rgba(255,255,255,0.03), rgba(0,0,0,0.2))',
        tokens['surface-panel'] ?? 'rgba(8,10,16,0.92)',
      ]
        .filter(Boolean)
        .join(', '),
      boxShadow: `0 25px 55px ${tokens['card-shadow-color'] ?? 'rgba(0, 0, 0, 0.55)'}`,
    };
  }, [activePreset.tokens]);

  const findAcceptingSlotId = useCallback(
    (residentId: string) => {
      const acceptingSlot = slots.find((slot) => activityScheduler.canAssignResident(residentId, slot.slotId));
      return acceptingSlot?.slotId ?? null;
    },
    [slots, activityScheduler],
  );

  const openTheaterForSlot = useCallback(
    (slotId: string | null) => {
      if (!slotId) return;
      setTheaterSlotId(slotId);
      setIsTheaterOpen(true);
    },
    [],
  );

  const handleLocationResidentDrop = useCallback(
    (residentId: string) => {
      const targetSlotId = findAcceptingSlotId(residentId);
      if (!targetSlotId) {
        setAssignmentFeedback('Nessuna attività compatibile in questo luogo.');
        return;
      }
      openTheaterForSlot(targetSlotId);
    },
    [findAcceptingSlotId, openTheaterForSlot],
  );

  const slotDropStates = useMemo<Record<string, DropState>>(() => {
    if (!draggingResidentId) return {};
    return slots.reduce<Record<string, DropState>>((acc, slot) => {
      acc[slot.slotId] = activityScheduler.canAssignResident(draggingResidentId, slot.slotId) ? 'valid' : 'invalid';
      return acc;
    }, {});
  }, [draggingResidentId, slots, activityScheduler]);

  const locationDropState: DropState = useMemo(() => {
    if (!draggingResidentId) return 'idle';
    const anyValid = Object.values(slotDropStates).some((state) => state === 'valid');
    return anyValid ? 'valid' : 'invalid';
  }, [draggingResidentId, slotDropStates]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTheaterOpen) {
        handleCloseTheater();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isTheaterOpen, handleCloseTheater]);

  const handleLocationInspect = useCallback(() => {
    const targetSlot = slots[0];
    if (!targetSlot) return;
    openTheaterForSlot(targetSlot.slotId);
  }, [slots, openTheaterForSlot]);

  const handleLocationDragIntent = useCallback(
    (residentId: string | null) => {
      if (!residentId) return;
      const targetSlotId = findAcceptingSlotId(residentId) ?? slots[0]?.slotId ?? null;
      if (!targetSlotId) return;
      if (!isTheaterOpen || theaterSlotId !== targetSlotId) {
        openTheaterForSlot(targetSlotId);
      }
    },
    [findAcceptingSlotId, slots, theaterSlotId, isTheaterOpen, openTheaterForSlot],
  );

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

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Village Sandbox</p>
          <p className="text-sm text-slate-300">
            Trascina i lavoratori negli slot attività per vedere le barre reagire e il cerchio Halo evidenziare il drop.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetSandboxFatigue}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-black/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)] transition-colors hover:bg-amber-500/20"
        >
          <span aria-hidden>☽</span>
          Reset Fatigue
        </button>
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="space-y-4 lg:w-1/3">
          <DragTestContainer
            residents={residents}
            onCountsChange={setRosterCounts}
            onDragStart={(residentId) => {
              console.log('VillageSandbox drag start:', residentId);
              setActiveId(residentId);
            }}
            onDragEnd={(residentId) => {
              console.log('VillageSandbox drag end:', residentId);
              setActiveId(null);
            }}
            onDragStateChange={(residentId, isDragging) => {
              console.log('VillageSandbox drag state:', residentId, isDragging);
              setActiveId(isDragging ? residentId : null);
            }}
            onResidentSelect={handleResidentSelect}
          />

          {assignmentFeedback && (
            <div className="rounded-[22px] border border-amber-200/40 bg-[rgba(17,10,0,0.75)] px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-amber-100 shadow-[0_15px_30px_rgba(0,0,0,0.45)]">
              {assignmentFeedback}
            </div>
          )}

          {selectedResident && (
            <section className="relative overflow-hidden rounded-[26px] border border-[color:var(--panel-border)] bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.12),rgba(4,7,14,0.95))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]">
              <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'var(--card-surface-radial)' }} />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
                  <span>Dettaglio residente</span>
                  <button
                    type="button"
                    onClick={() => setSelectedResidentId(null)}
                    className="rounded-full border border-white/20 px-3 py-0.5 text-[9px] uppercase tracking-[0.3em] text-slate-200 hover:border-rose-300 hover:text-rose-200"
                  >
                    chiudi
                  </button>
                </div>
                <WorkerCard
                  id={selectedResident.id}
                  name={formatResidentLabel(selectedResident)}
                  hp={selectedResident.maxHp > 0 ? Math.round((selectedResident.currentHp / selectedResident.maxHp) * 100) : 0}
                  fatigue={Math.round(selectedResident.fatigue)}
                  isDragging={false}
                  isHovering
                />
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                  <div className="rounded-[16px] border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[8px] text-slate-500">Stato</p>
                    <p className="text-[11px] text-amber-100">
                      {selectedResident.isInjured ? 'Ferito' : selectedResident.status}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[8px] text-slate-500">Tag</p>
                    <p className="text-[11px] text-emerald-100">
                      {selectedResident.statTags?.length ? selectedResident.statTags.join(', ') : '—'}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[8px] text-slate-500">HP</p>
                    <p className="text-[11px] text-emerald-100">
                      {selectedResident.currentHp}/{selectedResident.maxHp}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[8px] text-slate-500">Fatigue</p>
                    <p className="text-[11px] text-amber-100">{Math.round(selectedResident.fatigue)}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="relative overflow-hidden rounded-[26px] border border-[color:var(--panel-border)] bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.12),rgba(4,7,14,0.9))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'var(--card-surface-radial, radial-gradient(circle at 20% 0%, rgba(255,255,255,0.25), transparent 60%))' }} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-amber-100">
                <span>Resources</span>
                <span>Eco Pulse</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-200">
                <div className="rounded-[18px] border border-amber-300/60 bg-black/40 px-3 py-2 shadow-inner shadow-amber-900/40">
                  <p className="text-[9px] text-amber-200/80">Food</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-amber-100">{villageState.resources.food ?? 0}</p>
                </div>
                <div className="rounded-[18px] border border-emerald-400/50 bg-black/40 px-3 py-2 shadow-inner shadow-emerald-900/40">
                  <p className="text-[9px] text-emerald-200/80">Wood</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-emerald-100">{villageState.resources.wood ?? 0}</p>
                </div>
                <div className="rounded-[18px] border border-slate-400/60 bg-black/40 px-3 py-2 shadow-inner shadow-slate-900/40">
                  <p className="text-[9px] text-slate-300/80">Stone</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-slate-100">{villageState.resources.stone ?? 0}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 flex-1">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-wrap items-start gap-6 lg:flex-1">
                {slots.map((slot) => {
                  const isDayNightCard = slot.slotId === 'day-night-cycle';
                  const assignedName = isDayNightCard ? null : resolveWorkerName(slot.assignedWorkerId);
                  const activityState =
                    !isDayNightCard && slot.assignedWorkerId
                      ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId)
                      : null;
                  const progressFraction = isDayNightCard ? cycleProgressFraction : activityState?.progress ?? 0;
                  const elapsedSeconds = isDayNightCard ? cycleElapsedSeconds : activityState?.elapsed ?? 0;
                  const totalDuration = isDayNightCard ? totalCycleSeconds : activityState?.duration ?? 90;
                  const slotDropState: DropState =
                    isDayNightCard || draggingResidentId == null
                      ? 'idle'
                      : activityScheduler.canAssignResident(draggingResidentId, slot.slotId)
                        ? 'valid'
                        : 'invalid';

                  return (
                    <ActivitySlotCard
                      key={slot.slotId}
                      slotId={slot.slotId}
                      iconName={slot.iconName}
                      label={
                        slot.mapSlotLabel && !isDayNightCard
                          ? `${slot.label} · ${slot.mapSlotLabel}`
                          : slot.label
                      }
                      assignedWorkerName={assignedName}
                      canAcceptDrop={!isDayNightCard && canSlotAcceptDrop(slot.slotId)}
                      dropState={slotDropState}
                      onWorkerDrop={
                        isDayNightCard ? () => {} : (workerId) => handleWorkerDrop(slot.slotId, workerId)
                      }
                      onInspect={isDayNightCard ? undefined : openDetailPanel}
                      onClick={isDayNightCard ? () => setIsCyclePlaying((prev) => !prev) : undefined}
                      progressFraction={progressFraction}
                      elapsedSeconds={elapsedSeconds}
                      totalDuration={totalDuration}
                      isInteractive={isDayNightCard ? true : !isDayNightCard}
                      visualVariant={isDayNightCard ? cycleVariant : 'azure'}
                    />
                  );
                })}
              </div>

              <div className="space-y-3 w-full max-w-[11rem] lg:w-[6.9rem]">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Luogo attivo</div>
                <LocationCard
                  title="Foresta · Raccolta Bacche"
                  description="Trascina un lavoratore per avviare la spedizione e apri la vista panoramica per controllare più VerbCard."
                  onInspect={handleLocationInspect}
                  iconRow={
                    <div className="flex items-center gap-3 text-emerald-200 text-4xl">
                      <span>🌲</span>
                      <span>🌳</span>
                      <span>🌲</span>
                    </div>
                  }
                  onDragIntent={handleLocationDragIntent}
                  onResidentDrop={handleLocationResidentDrop}
                  dropState={locationDropState}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {detailContexts.length > 0 && (
        <div
          className={[
            'pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6',
            isTheaterOpen ? 'lg:justify-start lg:pl-16' : 'lg:justify-center',
          ].join(' ')}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={[
              'pointer-events-none flex w-full max-w-6xl flex-wrap justify-center gap-4',
              isTheaterOpen ? 'lg:justify-start' : 'lg:justify-center',
            ].join(' ')}
            style={{ pointerEvents: 'none' }}
          >
            {detailContexts.map((context) => (
              <div key={context.slotId} className="pointer-events-none flex w-full max-w-[420px] justify-center">
                <ActivityCardDetail
                  activity={context.activity}
                  slotLabel={context.slotLabel}
                  preview={context.preview}
                  assignments={detailSlotAssignments}
                  rewards={context.activity.rewards}
                  metrics={context.metrics}
                  durationSeconds={context.durationSeconds}
                  elapsedSeconds={0}
                  onStart={() => handleDetailStart(context.slotId)}
                  onClose={() => closeDetailPanel(context.slotId)}
                  onDropResident={(slotId, residentId) => handleWorkerDrop(slotId, residentId, { autoStart: false })}
                  onRemoveResident={(slotId) => handleWorkerDrop(slotId, null)}
                  isStartDisabled={context.startDisabled}
                  draggingResidentId={draggingResidentId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {isTheaterOpen && theaterSlot && (
        <TheaterView
          slotLabel={theaterSlot.label}
          slotIcon={theaterSlot.iconName}
          verbs={theaterVerbs}
          onClose={handleCloseTheater}
          acceptResidentDrop={!!draggingResidentId}
          onResidentDrop={(residentId) => {
            console.log('Resident dropped in TheaterView:', residentId);
            // Qui puoi gestire l'assegnazione del residente all'attività
          }}
        />
      )}
  </div>
  );
};

const VillageSandbox = () => {
  return (
    <DragProvider>
      <VillageSandboxContent />
    </DragProvider>
  );
};

export default VillageSandbox;
