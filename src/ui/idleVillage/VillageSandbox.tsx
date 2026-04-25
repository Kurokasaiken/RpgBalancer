import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useBootGuardDiagnostics } from '@/ui/shared/bootGuard/useBootGuardDiagnostics';
import { applyDragOverride, clearDragOverrideOnUnmount } from './utils/dragOverride';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import SummaryStrip from '@/ui/idleVillage/components/SummaryStrip';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import TheaterOverlay from '@/ui/idleVillage/components/TheaterOverlay';
import { useVillageSandbox } from '@/ui/idleVillage/hooks/useVillageSandbox';
import { useSandboxCore } from './hooks/useSandboxCore';
import { createVillageStateFromConfig, type ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import ActivityArea, { type ActivityAreaHandlers, type ActivityAreaSlot } from '@/ui/idleVillage/ActivityArea';
import MapBoardShell from '@/ui/idleVillage/components/MapBoardShell';
import AncillaryPanels from '@/ui/idleVillage/components/AncillaryPanels';
import VillageSandboxColumns from '@/ui/idleVillage/components/VillageSandboxColumns';
import VillageRosterSection from '@/ui/idleVillage/components/VillageRosterSection';
import type { TradeRoutePanelProps } from '@/ui/idleVillage/components/TradeRoutePanel';
import type { TradeRoute, TradeResult, MigrationRequest, VillageSummary } from '@/ui/idleVillage/state/VillageRegistry';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import ResidentSlotRack from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import ActivitySlotCard from '@/ui/idleVillage/components/ActivitySlot';
import { DetailPanelStack } from '@/ui/idleVillage/components/DetailPanelStack';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { resolveResidentRackDisplayInfo } from '@/ui/idleVillage/slots/residentSlotDisplay';
import ActionDetailHarness from '@/ui/idleVillage/components/ActionDetailHarness';
import GymShiftHUD from '@/ui/idleVillage/components/GymShiftHUD';
import GymShiftCard from '@/ui/idleVillage/components/GymShiftCard';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { DragErrorOverlay } from '@/ui/idleVillage/components/DragErrorOverlay';
import BoutCard from '@/ui/idleVillage/components/BoutCard';
import RestOverlay from '@/ui/idleVillage/components/RestOverlay';
import TrainingTracker from '@/ui/idleVillage/components/TrainingTracker';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { useSandboxInteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type {
  ResidentAssignmentCandidate,
  ResidentPickerSlotMeta,
} from '@/ui/idleVillage/components/InlineResidentChips';
import type {
  IdleVillageTestHooks,
  DemoPanelHandlerArgs,
  DemoPanelHandlerName,
} from '@/ui/idleVillage/types/IdleVillageTestHooks';
import WorkerPickerSheet from '@/ui/idleVillage/components/WorkerPickerSheet';
import WorkerPickerDiagnosticsPanel from '@/ui/idleVillage/components/WorkerPickerDiagnosticsPanel';
import type { WorkerPickerTelemetryEvent } from '@/ui/idleVillage/components/WorkerPickerSheet';
import { getTelemetrySnapshot, recordAssignmentInteractionEvent, getReplayActions } from '@/ui/idleVillage/utils/workerPickerTelemetry';
import DiagnosticsPanel from '@/ui/idleVillage/components/DiagnosticsPanel';
import DragPreviewInstrumentationPanel from '@/ui/idleVillage/components/DragPreviewInstrumentationPanel';
import { IdleVillagePinballMonitor } from '@/ui/idleVillage/components/IdleVillagePinballMonitor';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

declare global {
  interface Window {
    __idleVillageTestHooks?: IdleVillageTestHooks;
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
}

export interface VillageSandboxContentProps {
  activeShellPresetId?: string;
  shellPresetOptions?: Array<{
    id: string;
    label: string;
    isEditor: boolean;
  }>;
}

const PUNCH_CLUB_PRESET_ID = 'punch_club_light';

export const VillageSandboxContent: React.FC<VillageSandboxContentProps> = ({
  activeShellPresetId,
  shellPresetOptions,
}) => {
  const bootGuardDiagnostics = useBootGuardDiagnostics({
    pageId: 'idle-village-sandbox',
    source: 'VillageSandbox',
  });
  useEffect(() => {
    bootGuardDiagnostics.clearError();
  }, [bootGuardDiagnostics]);

  const diagnostics = useMemo(
    () => createSandboxDiagnostics<PickerDiagnosticsPayload>('VillageSandbox', 'picker'),
    [],
  );
  const {
    residents,
    assignmentFeedback,
    handleResidentSelect: baseHandleResidentSelect,
    isDayPhase,
    cycleProgressFraction,
    cycleElapsedSeconds,
    secondsPerTimeUnit,
    cycleDayCount,
    cyclePhaseLabel,
    cyclePhaseIcon,
    totalCycleSeconds,
    isCyclePlaying,
    toggleCyclePlaying,
    locationSlots,
    openTheaterForSlot,
    isTheaterOpen,
    theaterPrimarySlot,
    theaterVerbs,
    handleCloseTheater,
    hoverStart,
    hoverEnd,
    handleLocationResidentDrop,
    handleWorkerDrop: legacyHandleWorkerDrop,
    slotDropStates,
    locationDropState,
    activityAreaSlots,
    activityAreaHandlers,
    managedActivities,
    slotAssignments,
    detailContexts,
    demoPanelHandlers,
    resetState,
    config,
    activityScheduler,
    villageState,
    activeSlots,
    getVillageSummaries,
    getTradeRoutes,
    getMigrationQueue,
    getLastTradeResult,
    processMigrationTick,
    handleResetSandboxState,
    seedTradeRoutes,
    seedMigrationQueue,
    handleQuickWorkShift,
    handleQuickRest,
    isResting,
    canSlotAcceptDrop,
    startSlotActivity: sandboxStartSlotActivity,
    closeDetailPanel,
    residentSlotRackSlots,
    assignResidentToSlot,
    clearResidentSlot,
    getResidentSlotProgress,
    resourceItems,
    headerResources,
    getResidentCompatibility,
    // ActionDetailHarness
    getActionDetailHarnessSnapshot,
    hudEntries,
    handleResolveActivity,
    questTelemetry,
    questTelemetryPanelState,
    setSelectedSlot,
    updateState,
    formatCycleSeconds,
    slots,
    setSlotAssignments,
    setAssignmentFeedback,
    setIsCyclePlaying,
    getSlotCompatibilityDiagnostics,
    dragErrorRecovery,
    scheduleTimeout,
  } = useVillageSandbox();
  const { activeId: draggingResidentId, setActiveId } = useDragContext();
  const hooksRef = useRef<IdleVillageTestHooks | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const theaterVerbSummaries = useMemo<VerbSummary[]>(
    () => (theaterVerbs ?? []) as VerbSummary[],
    [theaterVerbs],
  );
  const resolvedActivities = useMemo(() => {
    const configuredActivities = config?.activities ?? {};
    if (Object.keys(configuredActivities).length > 0) {
      return configuredActivities;
    }
    return DEFAULT_IDLE_VILLAGE_CONFIG.activities ?? {};
  }, [config?.activities]);

  const isMobile = useIsMobile();
  const interaction = useSandboxInteractionMode({
    isMobile,
    handleResidentSelect: baseHandleResidentSelect,
    onDesktopSlotFocus: (slotId) => setSelectedSlot(slotId),
    onPickerOpen: (slotId) => diagnostics.debug('picker-open', { slotId }),
    diagnosticsScope: 'VillageSandbox:interaction',
  });
  const handleResidentSelect = interaction.handleResidentSelect;

  const isDevMode = typeof window !== 'undefined'
    ? window.location.search.includes('dev=1') || import.meta.env.MODE !== 'production'
    : false;

  const isTestMode =
    typeof window !== 'undefined' &&
    (window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS || window.__ENABLE_IDLE_VILLAGE_DIAGNOSTICS);

  const [pickerTelemetryEvents, setPickerTelemetryEvents] = useState<WorkerPickerTelemetryEvent[]>(() => {
    const snapshot = getTelemetrySnapshot({ clone: true });
    return snapshot?.events ?? [];
  });

  const handlePickerTelemetry = useCallback(() => {
    const snapshot = getTelemetrySnapshot({ clone: true });
    setPickerTelemetryEvents(snapshot?.events ?? []);

    // Log picker diagnostics
    if (isTestMode) {
      diagnostics.info(
        'Picker telemetry snapshot',
        {
          eventCount: snapshot?.events?.length ?? 0,
          metrics: snapshot?.metrics,
          tapCount: snapshot?.tapCount,
        },
        ['picker'],
      );
    }
  }, [diagnostics, isTestMode]);

  // Migration to useSandboxCore for ActionDetailHarness and ActivityArea
  const maxFatigueBeforeExhausted =
    config?.globalRules?.maxFatigueBeforeExhausted ??
    DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.maxFatigueBeforeExhausted ??
    100;

  const core = useSandboxCore({
    villageState,
    activityScheduler,
    secondsPerTimeUnit,
    slots,
    slotAssignments,
    setSlotAssignments,
    setAssignmentFeedback,
    setIsCyclePlaying,
    updateState,
    dragContext: { 
      activeId: draggingResidentId, 
      setActiveId: (id: string | null) => {
        if (id) handleResidentSelect(id);
        else setActiveId(null);
      } 
    },
    locationSlotIds: locationSlots.map(s => s.slotId),
    managedActivities,
    residentsById: residents.reduce<Record<string, ResidentState>>((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {}),
    config,
    formatCycleSeconds,
    maxFatigueBeforeExhausted,
    isDayPhase,
  });

  const handleWorkerDrop = core.handleWorkerDrop ?? legacyHandleWorkerDrop;

  // Diagnostic logs for core integration
  useEffect(() => {
    diagnostics.debug('core slotDropStates snapshot', core.slotDropStates);
    diagnostics.debug('core actionDetailHarnessState snapshot', core.actionDetailHarnessState);
  }, [diagnostics, core.slotDropStates, core.actionDetailHarnessState]);

  const safeDetailContexts = useMemo(() => detailContexts ?? [], [detailContexts]);
  const safeDetailContextCount = safeDetailContexts.length;
  const safeResourceItems = useMemo(() => resourceItems ?? [], [resourceItems]);
  const safeActivityAreaSlots = useMemo(
    () => (activityAreaSlots ?? []) as ActivityAreaSlot[],
    [activityAreaSlots],
  );
  const safeResidentSlotRackSlots = useMemo(
    () => (residentSlotRackSlots ?? []) as ResidentSlotViewModel[],
    [residentSlotRackSlots],
  );
  const safeHeaderResources = useMemo(
    () => headerResources ?? { gold: 0, food: 0, population: 0 },
    [headerResources],
  );
  const resolveSummaryValues = useMemo(
    () => ({
      gold: safeHeaderResources.gold ?? 0,
      food: safeHeaderResources.food ?? 0,
      population: safeHeaderResources.population ?? 0,
    }),
    [safeHeaderResources],
  );
  const derivePanelSnapshot = useCallback(() => {
    return safeResourceItems.reduce<Record<string, number>>((acc, item) => {
      if (item && typeof item.id === 'string') {
        acc[item.id] = typeof item.value === 'number' ? item.value : 0;
      }
      return acc;
    }, {});
  }, [safeResourceItems]);

  const selectedSlotId = interaction.pickerState.slotId;
  const isPickerActive = Boolean(selectedSlotId);
  const shouldHighlightSlot = interaction.interactionMode !== 'drag';

  const residentPickerCandidates = useMemo<ResidentAssignmentCandidate[] | null>(() => {
    if (!selectedSlotId || typeof getSlotCompatibilityDiagnostics !== 'function') {
      return null;
    }
    const diagnostics = getSlotCompatibilityDiagnostics(selectedSlotId) ?? [];
    if (!diagnostics.length) {
      return [];
    }

    return diagnostics.map((entry) => {
      const resident = villageState.residents[entry.residentId];
      return {
        id: entry.residentId,
        displayName: resident ? formatResidentLabel(resident) : entry.residentId,
        statusLabel: resident?.status ?? 'unknown',
        fatigue: resident?.fatigue ?? 0,
        portraitUrl: resident?.portraitUrl ?? null,
        compatibility: entry,
      };
    });
  }, [getSlotCompatibilityDiagnostics, selectedSlotId, villageState.residents]);
  const pickerSlotMeta = useMemo<ResidentPickerSlotMeta | null>(() => {
    if (!selectedSlotId) {
      return null;
    }
    const slot = safeActivityAreaSlots.find((activitySlot) => activitySlot.slotId === selectedSlotId);
    if (!slot) {
      return null;
    }
    return {
      slotId: slot.slotId,
      label: slot.label,
      activityLabel: slot.mapSlotLabel,
      iconName: slot.iconName,
    };
  }, [safeActivityAreaSlots, selectedSlotId]);

  const shouldUseWorkerPickerSheet = isPickerActive && interaction.interactionMode !== 'drag';
  const sandboxLayout: 'board' | 'stacked' = isPickerActive ? 'stacked' : 'board';
  const resolvedPickerResidents = residentPickerCandidates ?? [];

  const handlePickerAssign = useCallback(
    (residentId: string) => {
      if (!selectedSlotId) {
        return;
      }
      handleWorkerDrop(selectedSlotId, residentId);
      interaction.closePicker();
      setSelectedSlot(null);
    },
    [handleWorkerDrop, interaction, selectedSlotId, setSelectedSlot],
  );

  const handlePickerClose = useCallback(() => {
    interaction.closePicker();
    setSelectedSlot(null);
  }, [interaction, setSelectedSlot]);

  const handleSlotClick = useCallback(
    (slotId: string) => {
      interaction.handleSlotClick(slotId);
      setSelectedSlot(slotId);
    },
    [interaction, setSelectedSlot],
  );

  const handleDragStart = useCallback(
    (residentId: string) => {
      interaction.closePicker();
      setSelectedSlot(null);
      setActiveId(residentId);
    },
    [interaction, setActiveId, setSelectedSlot],
  );

  const handleDragEnd = useCallback(() => {
    setActiveId(null);
  }, [setActiveId]);

  const primaryLocationSlot = useMemo(() => locationSlots?.[0] ?? null, [locationSlots]);
  const canOpenOverlay = Boolean(primaryLocationSlot);
  const locationTitle = primaryLocationSlot?.label ?? 'Luogo attivo';
  const locationDescription =
    primaryLocationSlot?.activity?.description ?? 'Trascina un residente per aprire gli slot compatibili.';

  const handleOpenTheater = useCallback(() => {
    if (!primaryLocationSlot) return;
    openTheaterForSlot(primaryLocationSlot.slotId);
  }, [primaryLocationSlot, openTheaterForSlot]);

  const averageFatigue = useMemo(() => {
    if (!residents || residents.length === 0) {
      return 0;
    }
    const total = residents.reduce((sum, resident) => sum + (resident.fatigue ?? 0), 0);
    return Math.round(total / residents.length);
  }, [residents]);

  const fallbackActivityAreaHandlers = useMemo<ActivityAreaHandlers>(
    () => ({
      onWorkerDrop: () => undefined,
      onInspect: () => undefined,
      onToggleCycle: () => undefined,
      onLocationInspect: () => undefined,
      onLocationDragEnter: () => undefined,
      onLocationDragLeave: () => undefined,
      onLocationDrop: () => undefined,
      onSlotResidentDragEnter: () => undefined,
      onSlotResidentDragLeave: () => undefined,
    }),
    [],
  );
  const effectiveActivityAreaHandlers = activityAreaHandlers ?? fallbackActivityAreaHandlers;

  const handleResidentRackDrop = useCallback(
    (slotId: string, residentId: string | null) => {
      if (!residentId) {
        clearResidentSlot?.(slotId);
        return;
      }
      assignResidentToSlot?.(slotId, residentId);
    },
    [assignResidentToSlot, clearResidentSlot],
  );

  useEffect(() => {
    if (safeDetailContextCount > 0 && isTheaterOpen) {
      handleCloseTheater();
    }
  }, [safeDetailContextCount, isTheaterOpen, handleCloseTheater]);

  const safeSlotDropStates = useMemo(() => slotDropStates ?? {}, [slotDropStates]);
  const safeLocationDropState = locationDropState ?? 'idle';

  const rawVillageSummaries = getVillageSummaries?.() ?? [];
  const tradeRoutes = useMemo(() => getTradeRoutes?.() ?? [], [getTradeRoutes]);
  const migrationQueue = useMemo(() => getMigrationQueue?.() ?? [], [getMigrationQueue]);
  const lastTradeResult = getLastTradeResult?.() ?? null;
  const derivedVillageSummaries: VillageSummary[] =
    rawVillageSummaries.length > 0 || (tradeRoutes as unknown as Array<{ fromVillageId: string; toVillageId: string }>).length === 0
      ? rawVillageSummaries
      : Array.from(new Set((tradeRoutes as unknown as Array<{ fromVillageId: string; toVillageId: string }>).flatMap((route) => [route.fromVillageId, route.toVillageId]))).map((id) => ({
          id,
          name: id,
          currentResources: {},
          population: 0,
          activeActivities: 0,
          status: 'inactive' as VillageSummary['status'],
        }));
  const villageIds = derivedVillageSummaries.map((summary) => summary.id);
  const tradeRoutesLength = tradeRoutes.length;
  const migrationQueueLength = migrationQueue.length;
  const mapBoardKey = `${tradeRoutesLength}-${migrationQueueLength}`;

  const startSlotActivity = useCallback(
    (slotId: string, residentOverride?: string | null): boolean => {
      const preferSlotId = residentOverride ?? null;

      if (typeof sandboxStartSlotActivity === 'function') {
        const started = sandboxStartSlotActivity(slotId, preferSlotId);
        if (started) {
          return true;
        }
      }

      const jobActivityId = managedActivities.find((activity) => activity.tags?.includes('job'))?.id ?? null;
      if (slotId === jobActivityId && typeof handleQuickWorkShift === 'function') {
        handleQuickWorkShift();
        return true;
      }

      if (typeof demoPanelHandlers?.onStart === 'function') {
        demoPanelHandlers.onStart();
        return true;
      }

      diagnostics.warn('startSlotActivity:no-handler', { slotId });
      return false;
    },
    [sandboxStartSlotActivity, managedActivities, handleQuickWorkShift, demoPanelHandlers, diagnostics],
  );

  const ancillaryPanelsProps = useMemo(() => {
    // Log risk diagnostics
    if (isTestMode && questTelemetryPanelState?.telemetry) {
      diagnostics.info('Quest telemetry panel state', {
        compact: true,
        showHeatmap: true,
        showRecentDecisions: true,
        riskPercentages: (questTelemetryPanelState.telemetry as { riskPercentages?: unknown }).riskPercentages,
        recentDecisions: (questTelemetryPanelState.telemetry as { recentDecisions?: unknown[] }).recentDecisions?.length ?? 0,
      }, ['risk']);
    }

    const tradeRouteHandlers: TradeRoutePanelProps = {
      villageIds,
      tradeRoutes,
      lastTradeResult,
      onCreateTradeRoute: () => false,
      onExecuteTradeRoute: () => false,
    };

    return {
      hudEntries,
      onResolve: handleResolveActivity,
      activeSlots,
      secondsPerTimeUnit,
      resourceItems: safeResourceItems,
      questTelemetryProps: {
        ...questTelemetryPanelState,
        compact: true,
        showHeatmap: true,
        questTelemetryPanelState,
      },
      tradeRouteProps: tradeRouteHandlers,
      migrationQueueProps: {
        migrationQueue,
        onProcessMigrationTick: () => {
          if (typeof processMigrationTick === 'function') {
            const result = processMigrationTick();
            return Array.isArray(result) ? result : [];
          }
          return [];
        },
      },
      maxVisibleHudEntries: 3,
    };
  }, [
    hudEntries,
    handleResolveActivity,
    activeSlots,
    secondsPerTimeUnit,
    safeResourceItems,
    questTelemetryPanelState,
    isTestMode,
    villageIds,
    tradeRoutes,
    lastTradeResult,
    migrationQueue,
    processMigrationTick,
    diagnostics,
  ]);

  const handleResetClick = useCallback(async () => {
    if (!handleResetSandboxState || isResetting) {
      return;
    }
    setIsResetting(true);
    try {
      await handleResetSandboxState();
    } finally {
      setIsResetting(false);
    }
  }, [handleResetSandboxState, isResetting]);

  const [isRestOverlayVisible, setIsRestOverlayVisible] = useState(false);
  const isPunchClubPreset = useMemo(
    () =>
      activeShellPresetId === PUNCH_CLUB_PRESET_ID ||
      (typeof config?.version === 'string' && config.version.startsWith(PUNCH_CLUB_PRESET_ID)),
    [activeShellPresetId, config?.version],
  );

  const getSlotIdForActivity = useCallback(
    (activityId: string | null) => {
      if (!activityId) {
        return null;
      }
      if (slotAssignments && Object.prototype.hasOwnProperty.call(slotAssignments, activityId)) {
        return activityId;
      }
      const prefix = `${activityId}-slot-`;
      return Object.keys(slotAssignments ?? {}).find((key) => key.startsWith(prefix)) ?? null;
    },
    [slotAssignments],
  );

  const punchClubJobActivity = useMemo<ActivityDefinition | null>(() => {
    if (!isPunchClubPreset) {
      return null;
    }
    return managedActivities.find((activity) => activity.tags?.includes('job')) ?? null;
  }, [isPunchClubPreset, managedActivities]);

  const punchClubQuestActivity = useMemo<ActivityDefinition | null>(() => {
    if (!isPunchClubPreset) {
      return null;
    }
    return managedActivities.find((activity) => activity.tags?.includes('quest')) ?? null;
  }, [isPunchClubPreset, managedActivities]);

  const punchClubJobSlotId = useMemo(() => getSlotIdForActivity(punchClubJobActivity?.id ?? null), [
    getSlotIdForActivity,
    punchClubJobActivity?.id,
  ]);
  const punchClubQuestSlotId = useMemo(() => getSlotIdForActivity(punchClubQuestActivity?.id ?? null), [
    getSlotIdForActivity,
    punchClubQuestActivity?.id,
  ]);

  const punchClubJobAssignedResidentId = punchClubJobSlotId ? slotAssignments?.[punchClubJobSlotId] ?? null : null;
  const punchClubQuestAssignedResidentId = punchClubQuestSlotId ? slotAssignments?.[punchClubQuestSlotId] ?? null : null;

  const resolveActivityState = useCallback(
    (slotId: string | null, residentId: string | null) => {
      if (!slotId || !residentId || typeof activityScheduler?.getActivityState !== 'function') {
        return null;
      }
      return activityScheduler.getActivityState(slotId, residentId);
    },
    [activityScheduler],
  );

  const punchClubJobState = useMemo(
    () => resolveActivityState(punchClubJobSlotId, punchClubJobAssignedResidentId),
    [resolveActivityState, punchClubJobSlotId, punchClubJobAssignedResidentId],
  );

  const punchClubQuestState = useMemo(
    () => resolveActivityState(punchClubQuestSlotId, punchClubQuestAssignedResidentId),
    [resolveActivityState, punchClubQuestSlotId, punchClubQuestAssignedResidentId],
  );

  const evaluateDurationSeconds = useCallback(
    (activity: ActivityDefinition | null) => {
      if (!activity) {
        return 0;
      }
      const durationUnits = Number(activity.durationFormula);
      if (!Number.isFinite(durationUnits)) {
        return 0;
      }
      return Math.max(1, Math.round(durationUnits * secondsPerTimeUnit));
    },
    [secondsPerTimeUnit],
  );

  const punchClubJobDurationSeconds =
    punchClubJobState?.duration ??
    evaluateDurationSeconds(punchClubJobActivity ?? null);
  const punchClubQuestDurationSeconds =
    punchClubQuestState?.duration ??
    evaluateDurationSeconds(punchClubQuestActivity ?? null);

  const handlePunchClubJobDrop = useCallback(
    (residentId: string | null) => {
      if (!residentId || !punchClubJobSlotId) {
        return;
      }
      handleWorkerDrop(punchClubJobSlotId, residentId);
    },
    [handleWorkerDrop, punchClubJobSlotId],
  );

  const handlePunchClubQuestDrop = useCallback(
    (residentId: string | null) => {
      if (!residentId || !punchClubQuestSlotId) {
        return;
      }
      handleWorkerDrop(punchClubQuestSlotId, residentId);
    },
    [handleWorkerDrop, punchClubQuestSlotId],
  );

  const handlePunchClubJobToggle = useCallback(() => {
    if (!punchClubJobSlotId) {
      return;
    }
    startSlotActivity?.(punchClubJobSlotId);
  }, [punchClubJobSlotId, startSlotActivity]);

  const handlePunchClubQuestToggle = useCallback(() => {
    if (!punchClubQuestSlotId) {
      return;
    }
    startSlotActivity?.(punchClubQuestSlotId);
  }, [punchClubQuestSlotId, startSlotActivity]);

  const handleCloseRestOverlay = useCallback(() => {
    setIsRestOverlayVisible(false);
  }, []);

  useEffect(() => {
    if (!isPunchClubPreset) {
      setIsRestOverlayVisible(false);
    }
  }, [isPunchClubPreset]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cleanupHooks: (() => void) | null = null;
    let pollIntervalId: number | null = null;

    const attachHooks = () => {
      const hooks: IdleVillageTestHooks = {
        seedResidents: async (seededResidents) => {
          const nextState = await resetState(
            () =>
              createVillageStateFromConfig({
                config,
                initialResidents: seededResidents,
              }),
            'Test hook seed residents',
          );
          activityScheduler.resetScheduler(nextState);
        },
        invokeDemoHandler: (<TName extends DemoPanelHandlerName>(
          handlerName: TName,
          ...args: DemoPanelHandlerArgs<TName>
        ) => {
          if (!demoPanelHandlers) {
            throw new Error('Demo panel handlers are not available');
          }
          const handler = demoPanelHandlers[handlerName] as (
            ...handlerArgs: DemoPanelHandlerArgs<TName>
          ) => void;
          if (typeof handler !== 'function') {
            throw new Error(`Demo handler ${String(handlerName)} is not available`);
          }
          handler(...args);
        }),
        advanceTimeUnits: (deltaUnits) => {
          if (typeof activityScheduler?.advanceTimeUnitsDebug !== 'function') {
            throw new Error('advanceTimeUnitsDebug hook is not available');
          }
          activityScheduler.advanceTimeUnitsDebug(deltaUnits);
        },
        advanceTimeSeconds: (deltaSeconds) => {
          if (typeof activityScheduler?.advanceTimeSeconds !== 'function') {
            throw new Error('advanceTimeSeconds hook is not available');
          }
          activityScheduler.advanceTimeSeconds(deltaSeconds);
        },
        assignResidentToActivity: (activityId, residentId) => {
          handleWorkerDrop(activityId, residentId, { autoStart: true });
        },
        /**
         * Forces the specified slot to start or resume its activity, optionally overriding the assigned resident.
         * Fallbacks in order:
         *   1. Direct sandbox controller.
         *   2. Demo handler.
         *   3. Test hook bridge.
         */
        startSlotActivity: (slotId, residentOverride) => {
          const preferredResidentId = residentOverride ?? null;
          const resolveAssignedResidentId = () => slotAssignments?.[slotId] ?? null;
          const effectiveResidentId = preferredResidentId ?? resolveAssignedResidentId();

          const logStartDiagnostics = (phase: string) => {
            const assignmentDiagnostics = activityScheduler.getAssignmentDiagnostics?.() ?? null;
            const rosterSnapshot = residents.map((resident) => ({
              id: resident.id,
              status: resident.status,
              fatigue: resident.fatigue ?? 0,
            }));
            diagnostics.warn('startSlotActivity', {
              phase,
              slotId,
              preferredResidentId,
              effectiveResidentId,
              assignmentDiagnostics,
              rosterSnapshot,
              isDayPhase,
            });
          };

          if (!effectiveResidentId) {
            logStartDiagnostics('missing-effective-resident');
            return false;
          }
          const assignedResidentId: string = effectiveResidentId;

          if (typeof activityScheduler.startActivity === 'function') {
            const success = activityScheduler.startActivity(slotId, assignedResidentId);
            if (success) {
              return true;
            }
            logStartDiagnostics('startActivity-returned-false');
          }

          if (typeof demoPanelHandlers.onStart === 'function') {
            demoPanelHandlers.onStart();
            return true;
          }

          logStartDiagnostics('no-handler-available');
          return false;
        },
        /**
         * Assigns a resident to the primary job slot (Gym Shift in Punch Club preset).
         * Optionally starts the activity immediately.
         */
        assignResidentToJobSlot: (residentId, autoStart) => {
          const jobActivityId = managedActivities.find((activity) => activity.tags?.includes('job'))?.id;
          if (!jobActivityId) {
            diagnostics.warn('assignResidentToJobSlot:no-job-activity');
            return false;
          }
          if (!activityScheduler.canAssignResident?.(residentId, jobActivityId)) {
            diagnostics.warn('assignResidentToJobSlot:cant-assign', { residentId, jobActivityId });
            return false;
          }
          diagnostics.info('assignResidentToJobSlot:assigning', { residentId, jobActivityId, autoStart: autoStart ?? false });
          handleWorkerDrop(jobActivityId, residentId, { autoStart: autoStart ?? false });
          return true;
        },
        getManagedActivityHandles: () => ({
          jobActivityId: managedActivities.find((activity) => activity.tags?.includes('job'))?.id ?? null,
          questActivityId: managedActivities.find((activity) => activity.tags?.includes('quest'))?.id ?? null,
          residentIds: residents.map((resident) => resident.id),
          slotAssignments: { ...(slotAssignments ?? {}) },
        }),
        getSlotAssignments: () => ({ ...(slotAssignments ?? {}) }),
        getResidentRosterSnapshot: () =>
          residents.map((resident) => ({
            id: resident.id,
            status: resident.status,
            statTags: resident.statTags ?? [],
            fatigue: resident.fatigue ?? 0,
          })),
        getActivityDefinition: (activityId) => {
          const activity = resolvedActivities?.[activityId] ?? null;
          if (!activity) {
            return null;
          }
          const { id, label, statRequirement, rewards } = activity;
          return {
            id,
            label,
            statRequirement,
            rewards,
          };
        },
        getAssignmentDiagnostics: (_residentId, _activityId) => {
          const last = activityScheduler.getAssignmentDiagnostics?.();
          return last || null;
        },
        getAssignmentFeedback: () => assignmentFeedback ?? null,
        getResourceSnapshot: () => ({
          summary: {
            gold: resolveSummaryValues.gold,
            food: resolveSummaryValues.food,
            population: resolveSummaryValues.population,
          },
          panel: derivePanelSnapshot(),
        }),
        getActionDetailHarnessState: getActionDetailHarnessSnapshot,
        getLocationSlotIds: () => (locationSlots ?? []).map((slot) => slot.slotId),
        seedTradeRoutes: (routes: TradeRoute[], lastResult?: TradeResult) => {
          if (typeof seedTradeRoutes !== 'function') {
            throw new Error('seedTradeRoutes handler unavailable');
          }
          seedTradeRoutes(routes, lastResult);
        },
        seedMigrationQueue: (requests: MigrationRequest[]) => {
          if (typeof seedMigrationQueue !== 'function') {
            throw new Error('seedMigrationQueue handler unavailable');
          }
          seedMigrationQueue(requests);
        },
        getTradeRoutesSnapshot: () => {
          const tradeRouteSource = typeof getTradeRoutes === 'function' ? getTradeRoutes() : tradeRoutes;
          const migrationQueueSource =
            typeof getMigrationQueue === 'function' ? getMigrationQueue() : migrationQueue;
          const lastTradeResultValue: TradeResult | null | undefined =
            typeof getLastTradeResult === 'function' ? getLastTradeResult() : lastTradeResult;
          const tradeRoutesSnapshot = tradeRouteSource.map((route) => ({ ...route }));
          const migrationQueueSnapshot = migrationQueueSource.map((request) => ({ ...request }));
          const lastTradeResultSnapshot = lastTradeResultValue ? { ...lastTradeResultValue } : null;
          return {
            tradeRoutes: tradeRoutesSnapshot,
            migrationQueue: migrationQueueSnapshot,
            lastTradeResult: lastTradeResultSnapshot,
          };
        },
        getShellPresetDiagnostics: () => ({
          activeShellPresetId: activeShellPresetId ?? '',
          shellPresetOptions: (shellPresetOptions ?? []).map((preset) => ({
            id: preset.id,
            label: preset.label,
            isEditor: preset.isEditor,
          })),
          availableActivityIds: Object.keys(config.activities ?? {}),
        }),
        getSchedulerTelemetry: () => activityScheduler.getSchedulerTelemetry?.() ?? { events: [] },
        getSlotDropStates: () => core.slotDropStates,
        setDraggingResidentId: (residentId) => {
          // Direct state injection - call the setter exposed by useSandboxDragController
          if (typeof window !== 'undefined') {
            const setter = (window as Window & { __setTestDraggingOverride?: (id: string | null) => void }).__setTestDraggingOverride;
            if (setter) {
              setter(residentId ?? null);
            }
          }
        },
        beginDrag: (residentId) => {
          applyDragOverride(residentId);
        },
        endDrag: () => {
          applyDragOverride(null);
        },
        getLocationDropState: () => safeLocationDropState,
        getDraggingResidentId: () => {
          // In test mode, always read from window override (even if null)
          if (typeof window !== 'undefined' && window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS) {
            if (Object.prototype.hasOwnProperty.call(window, '__idleVillageTestDragOverride')) {
              return window.__idleVillageTestDragOverride ?? null;
            }
          }
          return draggingResidentId ?? null;
        },
        getHudEntries: () => [...(hudEntries ?? [])],
        isDayPhase: () => isDayPhase,
        getQuestTelemetrySnapshot: () => questTelemetry.telemetry,
        recordQuestTelemetryResult: (result) => {
          questTelemetry.recordQuestResult(result);
        },
        clearQuestTelemetry: () => questTelemetry.clearTelemetry(),
        setSelectedSlot: (slotId) => setSelectedSlot(slotId),
      };

      window.__idleVillageTestHooks = hooks;
      hooksRef.current = hooks;

      cleanupHooks = () => {
        if (window.__idleVillageTestHooks === hooksRef.current) {
          delete window.__idleVillageTestHooks;
        }
        hooksRef.current = null;
      };
    };

    const tryExposeHooks = () => {
      const isTestEnv = import.meta.env?.MODE === 'test';
      if (!isTestEnv && !window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS) {
        return false;
      }
      attachHooks();
      return true;
    };

    if (!tryExposeHooks()) {
      pollIntervalId = window.setInterval(() => {
        if (window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS && tryExposeHooks()) {
          if (pollIntervalId !== null) {
            window.clearInterval(pollIntervalId);
            pollIntervalId = null;
          }
        }
      }, 100);
    }

    return () => {
      if (pollIntervalId !== null) {
        window.clearInterval(pollIntervalId);
      }
      clearDragOverrideOnUnmount();
      cleanupHooks?.();
    };
  }, [
    activityScheduler,
    config,
    demoPanelHandlers,
    handleWorkerDrop,
    managedActivities,
    resetState,
    residents,
    seedMigrationQueue,
    seedTradeRoutes,
    getLastTradeResult,
    getMigrationQueue,
    getTradeRoutes,
    lastTradeResult,
    migrationQueue,
    tradeRoutes,
    slotDropStates,
    derivePanelSnapshot,
    resolveSummaryValues,
    slotAssignments,
    resolvedActivities,
    assignmentFeedback,
    getActionDetailHarnessSnapshot,
    activeShellPresetId,
    shellPresetOptions,
    locationSlots,
    hudEntries,
    core.slotDropStates,
    safeLocationDropState,
    draggingResidentId,
    setActiveId,
    sandboxStartSlotActivity,
    handleQuickWorkShift,
    isDayPhase,
    questTelemetry,
    setSelectedSlot,
    diagnostics,
  ]);

  const renderBoardBody = () => {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Activity Slots</div>
          <ResidentSlotRack
            slots={safeResidentSlotRackSlots}
            layout="board"
            overflowBehavior="scroll"
            getSlotProgress={getResidentSlotProgress}
            resolveDisplayInfo={resolveResidentRackDisplayInfo}
            onSlotDrop={handleResidentRackDrop}
            onSlotClear={(slotId) => clearResidentSlot?.(slotId)}
            onSlotInspect={(slotId) => effectiveActivityAreaHandlers.onInspect?.(slotId)}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Active Activities</div>
          <div className="mt-3 flex flex-wrap gap-4">
            {safeActivityAreaSlots.map((slot) => (
              <ActivitySlotCard
                key={slot.slotId}
                slotId={slot.slotId}
                iconName={slot.iconName}
                label={slot.mapSlotLabel ? `${slot.label} · ${slot.mapSlotLabel}` : slot.label}
                assignedWorkerName={slot.assignedWorkerName ?? undefined}
                assignedWorkerAvatarUrl={slot.assignedWorkerAvatarUrl ?? undefined}
                progressFraction={slot.progressFraction}
                elapsedSeconds={slot.elapsedSeconds}
                totalDuration={slot.totalDurationSeconds}
                isInteractive
                dropState={safeSlotDropStates?.[slot.slotId] ?? 'idle'}
                canAcceptDrop={
                  slot.slotId === 'day-night-cycle'
                    ? false
                    : canSlotAcceptDrop?.(slot.slotId) ?? slot.canAcceptDrop
                }
                visualVariant={slot.visualVariant}
                onWorkerDrop={(residentId) => {
                  if (!residentId) {
                    return;
                  }
                  handleWorkerDrop(slot.slotId, residentId);
                }}
                onInspect={() => openTheaterForSlot(slot.slotId)}
                onResidentDragEnter={(residentId) =>
                  activityAreaHandlers?.onSlotResidentDragEnter?.(slot.slotId, residentId)
                }
                onResidentDragLeave={() => activityAreaHandlers?.onSlotResidentDragLeave?.(slot.slotId)}
              />
            ))}
          </div>
        </div>

        {primaryLocationSlot && (
          <LocationCard
            title={primaryLocationSlot.label}
            description={primaryLocationSlot.activity?.description ?? locationDescription}
            onInspect={() => openTheaterForSlot(primaryLocationSlot.slotId)}
            onResidentDragEnter={(residentId) => activityAreaHandlers?.onLocationDragEnter?.(residentId)}
            onResidentDragLeave={() => activityAreaHandlers?.onLocationDragLeave?.()}
            onResidentDrop={(residentId) => {
              if (!residentId) {
                return;
              }
              // Pass the specific slot ID for the featured activity
              handleLocationResidentDrop(residentId, primaryLocationSlot.slotId);
            }}
            dropState={safeLocationDropState}
            isLockedByPhase={!isDayPhase}
          />
        )}
      </div>
    );
  };

  const handleWorkShiftClick = useCallback(() => {
    if (typeof handleQuickWorkShift === 'function') {
      handleQuickWorkShift();
    }
  }, [handleQuickWorkShift]);

  const handleRestClick = () => {
    if (typeof handleQuickRest === 'function') {
      void handleQuickRest();
    }
  };

  const handleDetailPanelWorkerDrop = useCallback(
    (activityId: string, residentId: string | null, _options?: { autoStart?: boolean }) => {
      if (!residentId) {
        return;
      }
      handleWorkerDrop(activityId, residentId);
      if (interaction.interactionMode === 'drag') {
        recordAssignmentInteractionEvent({
          method: 'drag',
          slotId: activityId,
          residentId,
          timestamp: Date.now(),
        });
      }
    },
    [handleWorkerDrop, interaction.interactionMode],
  );

  const cycleProgressPercent = Math.round((cycleProgressFraction ?? 0) * 100);
  const cycleElapsedLabel = formatCycleSeconds(cycleElapsedSeconds ?? 0);

  const punchClubLeftColumn = (
    <>
      <VillageRosterSection
        residents={residents}
        assignmentFeedback={assignmentFeedback}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onResidentSelect={handleResidentSelect}
        isDayPhase={isDayPhase}
        getResidentCompatibility={getResidentCompatibility}
        componentId="roster-component"
      />
      {punchClubJobActivity && punchClubJobAssignedResidentId && (
        <GymShiftHUD
          activity={punchClubJobActivity}
          villageState={villageState}
          config={config}
          assignedResidentId={punchClubJobAssignedResidentId}
          progressFraction={punchClubJobState?.progress ?? 0}
          elapsedSeconds={punchClubJobState?.elapsed ?? 0}
          totalDurationSeconds={punchClubJobDurationSeconds}
        />
      )}
      {punchClubJobActivity && (
        <GymShiftCard
          activity={punchClubJobActivity}
          villageState={villageState}
          config={config}
          isPlaying={punchClubJobState?.status === 'running'}
          assignedResidentId={punchClubJobAssignedResidentId}
          progressFraction={punchClubJobState?.progress ?? 0}
          elapsedSeconds={punchClubJobState?.elapsed ?? 0}
          totalDurationSeconds={punchClubJobDurationSeconds}
          onWorkerDrop={handlePunchClubJobDrop}
          onTogglePlay={handlePunchClubJobToggle}
        />
      )}
      {punchClubQuestActivity && (
        <BoutCard
          activity={punchClubQuestActivity}
          villageState={villageState}
          isPlaying={punchClubQuestState?.status === 'running'}
          assignedResidentId={punchClubQuestAssignedResidentId}
          progressFraction={punchClubQuestState?.progress ?? 0}
          elapsedSeconds={punchClubQuestState?.elapsed ?? 0}
          totalDurationSeconds={punchClubQuestDurationSeconds}
          onWorkerDrop={handlePunchClubQuestDrop}
          onToggleStart={handlePunchClubQuestToggle}
        />
      )}
      <TrainingTracker villageState={villageState} />
    </>
  );

  const defaultLeftColumn = (
    <>
      <MapBoardShell
        key={mapBoardKey}
        openButton={
          !isPickerActive && (
            <button
              type="button"
              className="rounded-xl border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200 disabled:opacity-40"
              disabled={!canOpenOverlay}
              onClick={handleOpenTheater}
            >
              Open Theater
            </button>
          )
        }
        closeButton={
          !isPickerActive && (
            <button
              type="button"
              className="rounded-xl border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-rose-200"
              onClick={handleCloseTheater}
            >
              Close Theater
            </button>
          )
        }
        boardBody={renderBoardBody()}
      />
      <VillageRosterSection
        residents={residents}
        assignmentFeedback={assignmentFeedback}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onResidentSelect={handleResidentSelect}
        isDayPhase={isDayPhase}
        getResidentCompatibility={getResidentCompatibility}
        componentId="roster-component"
      />

      <ActionDetailHarness
        title={core.actionDetailHarnessState.title}
        slotId={core.actionDetailHarnessState.slotId}
        assignedResidentName={core.actionDetailHarnessState.assignedResidentName}
        helperText={core.actionDetailHarnessState.helperText}
        icon={<span aria-hidden>⚒️</span>}
        dropState={core.actionDetailHarnessState.dropState}
        isPlaying={core.actionDetailHarnessState.isPlaying}
        progressFraction={core.actionDetailHarnessState.progressFraction}
        elapsedSeconds={core.actionDetailHarnessState.elapsedSeconds}
        totalDurationSeconds={core.actionDetailHarnessState.totalDurationSeconds}
        elapsedLabel={core.actionDetailHarnessState.elapsedLabel}
        remainingLabel={core.actionDetailHarnessState.remainingLabel}
        onInspect={core.actionDetailHarnessState.slotId ? () => openTheaterForSlot(core.actionDetailHarnessState.slotId!) : undefined}
        onStart={core.actionDetailHarnessState.slotId ? () => startSlotActivity?.(core.actionDetailHarnessState.slotId!) : undefined}
        onJobDrop={core.handleAssignResidentToJob}
        onJobDragOver={core.handleJobDropzoneDragOver}
        showBloom={core.actionDetailHarnessState.showBloom}
      />

      <ActivityArea
        slots={safeActivityAreaSlots}
        isDayPhase={isDayPhase}
        cycleProgressFraction={cycleProgressFraction}
        cycleElapsedSeconds={cycleElapsedSeconds}
        secondsPerTimeUnit={secondsPerTimeUnit}
        draggingResidentId={draggingResidentId}
        slotDropStates={core.slotDropStates}
        locationDropState={core.locationDropState}
        handlers={{ ...effectiveActivityAreaHandlers, onWorkerDrop: handleWorkerDrop }}
        locationTitle={locationTitle}
        locationDescription={locationDescription}
        selectedSlotId={isPickerActive ? selectedSlotId : null}
        highlightSelectedSlot={shouldHighlightSlot && !isPunchClubPreset}
        residentsCandidates={
          selectedSlotId && residentPickerCandidates && residentPickerCandidates.length > 0
            ? residentPickerCandidates
            : undefined
        }
        onAssign={selectedSlotId ? handlePickerAssign : undefined}
        onClose={selectedSlotId ? handlePickerClose : undefined}
        onInspectResident={selectedSlotId ? handleResidentSelect : undefined}
        onSlotClick={handleSlotClick}
        layout={sandboxLayout}
        onSlotHoverStart={hoverStart}
        onSlotHoverEnd={hoverEnd}
      />
      <div className="default-card rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
        <p>
          {primaryLocationSlot
            ? `Highlighting location: ${primaryLocationSlot.label}. Drag a resident to open the overlay automatically.`
            : 'Add at least one activity in IdleVillageConfig to preview the overlay.'}
        </p>
        {draggingResidentId && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Dragging: <span className="text-amber-200">{draggingResidentId}</span>
          </p>
        )}
      </div>
    </>
  );

  const leftColumn = isPunchClubPreset ? punchClubLeftColumn : defaultLeftColumn;

  const rightColumn = (
    <div data-testid="active-hud" data-variant={isPunchClubPreset ? 'punch-club' : 'default'}>
      <AncillaryPanels {...ancillaryPanelsProps} />
      
      {/* Alt Visual Pinball Monitor */}
      <IdleVillagePinballMonitor
        visible={isDevMode || isTestMode}
        autoLaunch={true}
        showStats={true}
        title="Alt Visual Monitor"
        className="mt-4"
      />
    </div>
  );

  const telemetrySnapshot = useMemo(() => getTelemetrySnapshot({ clone: true }), []);

  const handleReplayEvent = useCallback((event: WorkerPickerTelemetryEvent) => {
    diagnostics.info('Replaying telemetry event', event);

    const actions = getReplayActions(event);

    for (const action of actions) {
      switch (action.type) {
        case 'open_picker':
          interaction.handleSlotClick(action.slotId);
          diagnostics.info('Replayed: opened picker for slot', { slotId: action.slotId });
          break;
        case 'attempt_assignment':
          recordAssignmentInteractionEvent({
            method: 'tap',
            slotId: action.slotId,
            residentId: action.residentId,
            timestamp: Date.now(),
          });
          diagnostics.info('Replayed: assignment attempt', { slotId: action.slotId, residentId: action.residentId });
          break;
        case 'confirm_assignment':
          handleWorkerDrop(action.slotId, action.residentId);
          diagnostics.info('Replayed: assignment success', { slotId: action.slotId, residentId: action.residentId });
          break;
        case 'cancel_assignment':
          interaction.closePicker();
          setSelectedSlot(null);
          diagnostics.info('Replayed: assignment cancel');
          break;
        case 'close_picker':
          interaction.closePicker();
          setSelectedSlot(null);
          diagnostics.info('Replayed: picker close');
          break;
        default:
          diagnostics.info('Unknown replay action', action);
      }
    }
  }, [diagnostics, interaction, handleWorkerDrop, setSelectedSlot]);

  return (
    <TooltipProvider testId="village-sandbox-tooltip-provider">
      <SandboxTimingProvider value={{ scheduleTimeout }}>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div data-testid="idle-village-sandbox-error" className="idle-village-sandbox-error">
              <p>Something went wrong in Village Sandbox.</p>
              <pre>{error.message}</pre>
              <button
                type="button"
                className="rounded-xl border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-rose-200 disabled:opacity-40"
                onClick={handleResetClick}
                disabled={!handleResetSandboxState || isResetting}
                aria-live="polite"
                aria-busy={isResetting}
              >
                {isResetting ? 'Resetting…' : 'Reset'}
              </button>
            </div>
          )}
        >
          <main className="flex flex-col lg:flex-row gap-6 min-h-0">
            <div className="flex-1 min-h-0">
              {leftColumn}
            </div>
            <div className="lg:w-80 xl:w-96">
              {rightColumn}
            </div>
          </main>
          
          {!isPunchClubPreset && !isPickerActive && (
            <DetailPanelStack
              detailContexts={safeDetailContexts}
              slotAssignments={slotAssignments ?? {}}
              residentsById={villageState?.residents ?? {}}
              secondsPerTimeUnit={secondsPerTimeUnit}
              draggingResidentId={draggingResidentId}
              schedulerBridge={{
                canAssignResident: activityScheduler?.canAssignResident ?? (() => false),
                getActivityState: activityScheduler?.getActivityState ?? (() => null),
              }}
              onWorkerDrop={handleDetailPanelWorkerDrop}
              onStart={(slotId) => startSlotActivity?.(slotId)}
              onClose={(slotId) => closeDetailPanel(slotId)}
              isTheaterOpen={isTheaterOpen}
            />
          )}

          {!isPunchClubPreset && theaterPrimarySlot && (
            <TheaterOverlay
              isOpen={isTheaterOpen}
              theaterPrimarySlot={theaterPrimarySlot}
              theaterVerbs={theaterVerbSummaries}
              draggingResidentId={draggingResidentId}
              acceptResidentDrop={Boolean(draggingResidentId)}
              onClose={handleCloseTheater}
              onResidentDrop={(residentId) => residentId && handleLocationResidentDrop(residentId, theaterPrimarySlot.slotId)}
            />
          )}

          {shouldUseWorkerPickerSheet && (
            <WorkerPickerSheet
              isOpen
              slotMeta={pickerSlotMeta}
              residents={resolvedPickerResidents}
              onAssign={handlePickerAssign}
              onClose={handlePickerClose}
              onInspectResident={handleResidentSelect}
              trigger={interaction.pickerState.trigger}
              onTelemetry={handlePickerTelemetry}
            />
          )}

          {isPunchClubPreset && isRestOverlayVisible && (
            <RestOverlay
              villageState={villageState}
              config={config}
              isVisible={isRestOverlayVisible}
              isResting={Boolean(isResting)}
              onToggleRest={() => {
                if (typeof handleQuickRest === 'function') {
                  void handleQuickRest();
                }
              }}
              onClose={handleCloseRestOverlay}
            />
          )}

          <DragPreviewInstrumentationPanel />
          <DiagnosticsPanel />

          {/* Drag Error Recovery Overlay */}
          {dragErrorRecovery.state.activeError && (
            <DragErrorOverlay
              error={dragErrorRecovery.state.activeError}
              onDismiss={dragErrorRecovery.dismissError}
              onAction={dragErrorRecovery.trackAction}
              autoOpen={dragErrorRecovery.state.autoOpen}
            />
          )}
        </main>
      </ErrorBoundary>
      </SandboxTimingProvider>
    </TooltipProvider>
  );

const VillageSandbox: React.FC<VillageSandboxContentProps> = (props) => (
  <DragProvider>
    <VillageSandboxContent {...props} />
  </DragProvider>
);

export default VillageSandbox;
