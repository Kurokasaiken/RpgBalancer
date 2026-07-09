/**
 * PoiDetailRosterIntegrationPage — POI + Roster + real POI Detail
 *
 * Pagina di test in /test-hub che integra un roster draggabile con un vero POI
 * proveniente dalla configurazione Idle Village. Al click sul medaglione POI si
 * apre il pannello dettaglio (ActivityCapsuleDetailSkinAware) con i dati reali
 * dell'attività e un vero slot rack interattivo alimentato da
 * useResidentSlotController.
 *
 * Dati reali letti da DEFAULT_IDLE_VILLAGE_CONFIG.activities: icona, numero di
 * slot, requisiti, durata, ricompense, affaticamento, rischio ferita/morte.
 */

import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import {
  RosterDraggable,
  RosterKitShell,
  useRosterKitData,
  type RosterDropVerdict,
} from '@/ui/idleVillage/frozen/kits/rosterKit';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import type {
  ActivityDetailSlotData,
  TelemetryEntry,
} from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotBlueprint } from '@/ui/idleVillage/slots/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';

/** Elenco attività reali escluse le voci di test. */
const ACTIVITIES = Object.values(DEFAULT_IDLE_VILLAGE_CONFIG.activities).filter(
  (a) => !a.tags.includes('test'),
);

type ActivityKind = 'job' | 'quest' | 'training' | 'maintenance';

function getActivityKind(activity: ActivityDefinition): ActivityKind {
  if (activity.tags.includes('quest')) return 'quest';
  if (activity.tags.includes('training')) return 'training';
  if (activity.tags.includes('job')) return 'job';
  return (activity.cardKind as ActivityKind) ?? 'job';
}

function getActivityIcon(activity: ActivityDefinition): string {
  const meta = activity.metadata as Record<string, unknown> | undefined;
  if (typeof meta?.icon === 'string' && meta.icon) return meta.icon;
  if (activity.tags.includes('wood')) return '🪵';
  if (activity.tags.includes('water')) return '💧';
  if (activity.tags.includes('combat')) return '⚔';
  if (activity.tags.includes('explore')) return '🌿';
  if (activity.tags.includes('market')) return '🏪';
  if (activity.tags.includes('danger')) return '☠';
  return '⭐';
}

function formatDuration(formula?: string): string {
  const value = parseInt(formula ?? '', 10);
  if (Number.isNaN(value)) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  if (value >= 60) return `${Math.ceil(value / 60)}m`;
  return `${value}ms`;
}

function formatRewards(activity: ActivityDefinition): string {
  const parts: string[] = [];
  if (activity.rewards && activity.rewards.length > 0) {
    parts.push(activity.rewards.map((r) => `${r.resourceId} ${r.amountFormula}`).join(' + '));
  }
  if (activity.dailyRewardProfile && activity.dailyRewardProfile.length > 0) {
    parts.push(
      activity.dailyRewardProfile.map((r) => `${r.resourceId}/day ${r.amountPerDay}`).join(' + '),
    );
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function formatRequirementLabel(req?: ResidentSlotBlueprint['requirement']): string {
  return req?.label ?? 'Any';
}

function buildSlotBlueprints(activity: ActivityDefinition): ResidentSlotBlueprint[] | undefined {
  const meta = activity.metadata as { slotBlueprints?: ResidentSlotBlueprint[] } | undefined;
  return meta?.slotBlueprints;
}

// Color mapping from poiAmberSkinConfig for wilderness pillar
const WILDERNESS_COLORS = {
  coronaCore: { r: 210, g: 138, b: 28 },
  coronaGlow: { r: 180, g: 105, b: 10 },
  rimColors: ['#fce890', '#c09030', '#200e02'] as [string, string, string],
  stoneColors: ['#1e1608', '#030202'] as [string, string],
  stoneAmbient: 'rgba(255,220,120,.22)',
  pinColor: 'rgba(205,190,148,.72)',
};

interface DroppablePoiProps {
  dropId: string;
  icon: string;
  label: string;
  progress: number;
  canAcceptDrop: boolean;
  onClick: () => void;
}

function DroppablePoi({ dropId, icon, label, progress, canAcceptDrop, onClick }: DroppablePoiProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    disabled: !canAcceptDrop,
    data: { accepts: ['resident'] },
  });

  return (
    <div
      ref={setNodeRef}
      className="relative flex cursor-pointer flex-col items-center gap-2"
      onClick={onClick}
      style={
        isOver
          ? {
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0 0 12px rgba(201, 162, 39, 0.8))',
            }
          : undefined
      }
      role="button"
      tabIndex={0}
      aria-label={`${label} — clicca per aprire il detail`}
    >
      <GenericPoiSkin
        icon={icon}
        progress={progress}
        coronaCore={WILDERNESS_COLORS.coronaCore}
        coronaGlow={WILDERNESS_COLORS.coronaGlow}
        rimColors={WILDERNESS_COLORS.rimColors}
        stoneColors={WILDERNESS_COLORS.stoneColors}
        stoneAmbient={WILDERNESS_COLORS.stoneAmbient}
        pinColor={WILDERNESS_COLORS.pinColor}
        pillar="wilderness"
        size={200}
        enableHover
        label={undefined}
      />
      <div className="text-xs font-semibold tracking-wider text-amber-200">{label}</div>
    </div>
  );
}

const PoiDetailRosterIntegrationPage: FC = () => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITIES[0]?.id ?? '');
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivityId) ?? ACTIVITIES[0]!,
    [selectedActivityId],
  );
  const activityKind = useMemo(() => getActivityKind(activity), [activity]);
  const activityIcon = useMemo(() => getActivityIcon(activity), [activity]);
  const slotBlueprints = useMemo(() => buildSlotBlueprints(activity), [activity]);

  // ResidentSlotRack renders infinite slots as a non-droppable "+" placeholder.
  // For the test page we want a real, interactive slot rack, so we cap infinite
  // activities to a finite number of slots for the controller only.
  const finiteMaxSlots = typeof activity.maxSlots === 'number' ? activity.maxSlots : 4;
  const activityForController = useMemo(
    () => ({ ...activity, maxSlots: finiteMaxSlots as number }),
    [activity, finiteMaxSlots],
  );

  const { residentsById } = useRosterKitData();
  const { state: pageFlight, startFlight, settle: settleFlight } = useDragOutcome();

  const assignedIds = useMemo(
    () => Object.values(assignments).filter(Boolean) as string[],
    [assignments],
  );

  const addTelemetry = useCallback((type: TelemetryEntry['type'], message: string) => {
    setTelemetry((prev) => [
      { id: `${Date.now()}-${Math.random()}`, timestamp: new Date(), message, type },
      ...prev,
    ]);
  }, []);

  const handleAssign = useCallback(
    (slotId: string, residentId: string) => {
      setAssignments((a) => ({ ...a, [slotId]: residentId }));
      const resident = residentsById[residentId];
      addTelemetry(
        'assign',
        `${resident ? formatResidentLabel(resident) : residentId} → ${slotId}`,
      );
      trackTelemetryEvent('poi_detail_roster_assign', { activityId: activity.id, slotId, residentId });
    },
    [residentsById, activity.id, addTelemetry],
  );

  const handleClear = useCallback(
    (slotId: string) => {
      setAssignments((a) => {
        const residentId = a[slotId];
        const resident = residentId ? residentsById[residentId] : undefined;
        if (residentId) {
          addTelemetry(
            'detach',
            `${resident ? formatResidentLabel(resident) : residentId} ← ${slotId}`,
          );
          trackTelemetryEvent('poi_detail_roster_detach', { activityId: activity.id, slotId });
        }
        return { ...a, [slotId]: null };
      });
    },
    [residentsById, activity.id, addTelemetry],
  );

  const controller = useResidentSlotController({
    activity: activityForController,
    assignments,
    residents: residentsById,
    hoveredResidentId: draggingResidentId,
    slotBlueprints,
    onAssign: handleAssign,
    onClear: handleClear,
  });

  const maxSlots = controller.slots.length;
  const freeSlots = controller.slots.filter((s) => !s.assignedResidentId).length;
  const poiStatus = assignedIds.length > 0 ? 'working' : 'idle';
  const poiDropId = useMemo(() => `job-poi-drop-${activity.id}`, [activity.id]);

  const findAcceptingSlot = useCallback(
    (residentId: string) => {
      const resident = residentsById[residentId];
      if (!resident || assignedIds.includes(residentId)) return null;
      return (
        controller.slots.find(
          (slot) => !slot.assignedResidentId && evaluateStatRequirement(resident, slot.requirement).matches,
        ) ?? null
      );
    },
    [controller.slots, residentsById, assignedIds],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingResidentId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent): RosterDropVerdict => {
      setDraggingResidentId(null);
      const residentId = event.active.id as string;
      const overId = event.over?.id as string | undefined;
      if (!overId) return;

      const resident = residentsById[residentId];
      if (!resident || assignedIds.includes(residentId)) return false;

      let slot = controller.slots.find((s) => s.id === overId);
      if (overId === poiDropId) {
        slot = findAcceptingSlot(residentId);
        if (!slot) return false;
      } else if (!slot) {
        return;
      }

      const accepted =
        !slot.assignedResidentId &&
        evaluateStatRequirement(resident, slot.requirement).matches;
      if (!accepted) return false;

      const element = isDetailOpen
        ? document.querySelector(`[data-slot-id="${slot.id}"]`)
        : null;
      return { flightToSlot: { slotId: slot.id, element } };
    },
    [controller.slots, findAcceptingSlot, poiDropId, residentsById, assignedIds, isDetailOpen],
  );

  const handleFlightComplete = useCallback(
    (residentId: string, slotId?: string) => {
      if (slotId) handleAssign(slotId, residentId);
    },
    [handleAssign],
  );

  const handleResidentSelect = useCallback(
    (residentId: string) => {
      if (flyingResidentId) return;
      const slot = findAcceptingSlot(residentId);
      if (!slot) return;
      const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (isDetailOpen) {
        const to = elementCenter(document.querySelector(`[data-slot-id="${slot.id}"]`));
        if (!from || !to) return;
        setFlyingResidentId(residentId);
        startFlight({
          residentId,
          slotId: slot.id,
          isInset: true,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
        });
      } else {
        handleAssign(slot.id, residentId);
      }
    },
    [flyingResidentId, findAcceptingSlot, isDetailOpen, startFlight, handleAssign],
  );

  const handleSlotClear = useCallback(
    (slotId: string) => {
      const residentId = assignments[slotId];
      handleClear(slotId);
      if (!residentId) return;
      const from = elementCenter(document.querySelector(`[data-slot-id="${slotId}"]`));
      const to = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (from && to) {
        setFlyingResidentId(residentId);
        startFlight({
          residentId,
          slotId,
          isInset: false,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
        });
      }
    },
    [assignments, handleClear, startFlight],
  );

  const handlePageFlightComplete = useCallback(
    (residentId: string, slotId?: string, isInset?: boolean) => {
      if (isInset && slotId) handleAssign(slotId, residentId);
      setFlyingResidentId(null);
      settleFlight();
    },
    [handleAssign, settleFlight],
  );

  const status: 'idle' | 'in-progress' | 'completed' | 'blocked' =
    poiStatus === 'working' ? 'in-progress' : 'idle';

  const detailSlots = useMemo<ActivityDetailSlotData[]>(() => {
    return controller.slots.map((slot) => {
      const resident = slot.assignedResident;
      const isAssigned = !!resident;
      return {
        id: slot.id,
        residentId: slot.assignedResidentId ?? undefined,
        state: isAssigned ? 'idle' : 'empty',
        initial: '',
        progress: 0,
        assignedWorkerName: resident ? formatResidentLabel(resident) : undefined,
        assignedWorkerAvatarUrl: resident ? getResidentPortraitUrl(resident) : undefined,
      };
    });
  }, [controller.slots]);

  const detailProps = useMemo(
    () => ({
      activityId: activity.id,
      name: activity.label,
      type: activityKind,
      subtitle: activity.description,
      status,
      progress: 0,
      duration: parseInt(activity.durationFormula ?? '0', 10) || 0,
      elapsed: 0,
      slots: detailSlots,
      maxSlots,
      durationDisplay: formatDuration(activity.durationFormula),
      rewardDisplay: formatRewards(activity),
      etaDisplay: formatDuration(activity.durationFormula),
      telemetry,
      isOpen: isDetailOpen,
      onClose: () => setIsDetailOpen(false),
      showTelemetry: true,
      showSlots: true,
      showInfo: true,
      compact: false,
      inlineMode: false,
      enableDrag: true,
      pillar: 'wilderness' as const,
      skinPresetId: 'wanderlust' as const,
      dataTestId: 'poi-detail-wrapper-test',
      ariaLabel: `POI Detail: ${activity.label}`,
      onStart: () => {
        addTelemetry('start', `Attività ${activity.label} avviata`);
        trackTelemetryEvent('poi_detail_roster_start', { activityId: activity.id });
      },
      onCancel: () => {
        addTelemetry('done', `Attività ${activity.label} annullata`);
        trackTelemetryEvent('poi_detail_roster_cancel', { activityId: activity.id });
      },
      onCollect: () => {
        addTelemetry('done', `Ricompensa ${activity.label} raccolta`);
        trackTelemetryEvent('poi_detail_roster_collect', { activityId: activity.id });
      },
      onSlotDetach: handleSlotClear,
      onSlotAssign: () => {
        // No-op: assignments are driven by roster drag/click.
      },
    }),
    [
      activity,
      activityKind,
      status,
      maxSlots,
      detailSlots,
      telemetry,
      isDetailOpen,
      addTelemetry,
      handleSlotClear,
    ],
  );

  return (
    <TooltipProvider>
      <RosterKitShell>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragCancel={() => setDraggingResidentId(null)}
        >
          <div
            data-testid="poi-detail-roster-integration-page"
            className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8"
          >
            <div className="mx-auto max-w-7xl space-y-6">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                  Test Hub · POI Detail + Roster Integration
                </p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                  POI DETAIL + ROSTER INTEGRATION
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  POI reale da Idle Village config, detail completo e slot rack interattivo.
                </p>
              </header>

              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Attività:
                </label>
                <select
                  className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-ivory"
                  value={selectedActivityId}
                  onChange={(e) => {
                    setSelectedActivityId(e.target.value);
                    setAssignments({});
                    setTelemetry([]);
                    setIsDetailOpen(false);
                  }}
                >
                  {ACTIVITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-200">
                    Village Roster
                  </h2>
                  <RosterDraggable
                    componentId="poi-detail-roster"
                    useWanderlustSkin={true}
                    useExternalDndContext={true}
                    onDragEnd={handleDragEnd as unknown as any}
                    onFlightComplete={handleFlightComplete}
                    onResidentSelect={handleResidentSelect}
                    lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                    lockedStatusLabel="Away"
                  />
                </div>

                <div className="flex flex-col items-center gap-6 rounded-lg border border-slate-700/50 bg-slate-900/30 p-6">
                  <div className="poi-detail-stage__medallion flex flex-col items-center gap-2">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    {isDetailOpen ? 'Clicca per chiudere' : 'Clicca per aprire il detail'}
                  </p>
                  <DroppablePoi
                    dropId={poiDropId}
                    icon={activityIcon}
                    label={activity.label}
                    progress={0}
                    canAcceptDrop={freeSlots > 0}
                    onClick={() => setIsDetailOpen((o) => !o)}
                  />
                </div>

                <div className="poi-detail-stage__detail">
                  <ActivityCapsuleDetailSkinAware {...detailProps} />
                </div>
                </div>
              </div>
            </div>
          </div>

          <DragOutcomeFlight
            state={pageFlight}
            residentsById={residentsById}
            onComplete={handlePageFlightComplete}
          />
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
};

export default PoiDetailRosterIntegrationPage;
