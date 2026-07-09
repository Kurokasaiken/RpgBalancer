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
import { ResidentSlotRack } from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotBlueprint } from '@/ui/idleVillage/slots/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import type { TelemetryEntry } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';

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
      slots: [] as { id: string; state: 'empty'; initial: string; progress: number }[],
      maxSlots,
      durationDisplay: formatDuration(activity.durationFormula),
      rewardDisplay: formatRewards(activity),
      etaDisplay: formatDuration(activity.durationFormula),
      telemetry,
      isOpen: isDetailOpen,
      onClose: () => setIsDetailOpen(false),
      showTelemetry: true,
      showSlots: false,
      showInfo: true,
      inlineMode: true,
      pillar: 'wilderness' as const,
      skinPresetId: 'wanderlust' as const,
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
    }),
    [activity, activityKind, status, maxSlots, telemetry, isDetailOpen, addTelemetry],
  );

  const panelStyle: React.CSSProperties = {
    width: 680,
    maxWidth: '92vw',
    margin: '0 auto',
  };

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
                  <div className="flex flex-col items-center gap-1">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                      {isDetailOpen ? 'Clicca per chiudere' : 'Clicca per aprire il detail'}
                    </p>
                    <JobPOI
                      activityId={activity.id}
                      label={activity.label}
                      icon={activityIcon}
                      status={poiStatus}
                      freeSlots={freeSlots}
                      maxSlots={maxSlots}
                      canAcceptDrop={freeSlots > 0}
                      slots={controller.slots.map((slot) => ({
                        id: slot.id,
                        assignedResidentId: slot.assignedResidentId ?? undefined,
                        requirements: slot.requirement
                          ? {
                              requiredSkills: [
                                ...(slot.requirement.allOf ?? []),
                                ...(slot.requirement.anyOf ?? []),
                              ],
                            }
                          : {},
                      }))}
                      onClick={() => setIsDetailOpen((o) => !o)}
                    />
                  </div>

                  {isDetailOpen && (
                    <div className="w-full space-y-4" data-testid="poi-detail-panel">
                      <ActivityCapsuleDetailSkinAware {...detailProps} />

                      <WanderlustSurface
                        shape="panel"
                        material="bronze"
                        interactive={false}
                        style={panelStyle}
                      >
                        <div className="p-4">
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-200">
                            Slot Rack
                          </h3>
                          <ResidentSlotRack
                            slots={controller.slots}
                            onSlotClear={handleSlotClear}
                            draggingResidentId={draggingResidentId}
                            layout="detail"
                            overflowBehavior="scroll"
                            slotSize={120}
                          />
                          {controller.warnings.length > 0 && (
                            <div className="mt-3 text-[10px] text-red-300">
                              {controller.warnings[0].message}
                            </div>
                          )}
                        </div>
                      </WanderlustSurface>

                      <WanderlustSurface
                        shape="panel"
                        material="bronze"
                        interactive={false}
                        style={panelStyle}
                      >
                        <div className="p-4">
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-200">
                            Requisiti, ricompense e rischi
                          </h3>
                          <div className="grid grid-cols-1 gap-4 text-xs text-slate-300 md:grid-cols-2">
                            <div className="space-y-2">
                              <div>
                                <strong className="text-amber-100/80">Requisiti attività:</strong>
                                <div className="text-slate-400">
                                  {activity.statRequirement?.label ?? '—'}
                                </div>
                              </div>
                              <div>
                                <strong className="text-amber-100/80">Slot:</strong>
                                <ul className="mt-1 list-inside list-disc text-slate-400">
                                  {slotBlueprints && slotBlueprints.length > 0 ? (
                                    slotBlueprints.map((bp, i) => (
                                      <li key={bp.id}>
                                        {bp.label ?? `Slot ${i + 1}`}: {formatRequirementLabel(bp)}
                                      </li>
                                    ))
                                  ) : (
                                    <li>
                                      {maxSlots === 99
                                        ? 'Infiniti slot aperti'
                                        : `${maxSlots} slot disponibili`}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <strong className="text-amber-100/80">Durata:</strong>{' '}
                                {formatDuration(activity.durationFormula)}
                              </div>
                              <div>
                                <strong className="text-amber-100/80">Fatica:</strong>{' '}
                                {activity.dailyFatigueCost ??
                                  activity.fatigueProfile?.baseGain ??
                                  '—'}
                              </div>
                              <div>
                                <strong className="text-amber-100/80">Ricompense:</strong>
                                <div className="text-slate-400">{formatRewards(activity)}</div>
                              </div>
                              {typeof activity.dangerRating === 'number' && (
                                <div>
                                  <strong className="text-amber-100/80">Pericolo:</strong>{' '}
                                  {activity.dangerRating}
                                </div>
                              )}
                              {typeof activity.metadata?.injuryChanceDisplay === 'number' && (
                                <div>
                                  <strong className="text-amber-100/80">Ferita:</strong>{' '}
                                  {activity.metadata.injuryChanceDisplay}%
                                </div>
                              )}
                              {typeof activity.metadata?.deathChanceDisplay === 'number' && (
                                <div>
                                  <strong className="text-amber-100/80">Morte:</strong>{' '}
                                  {activity.metadata.deathChanceDisplay}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </WanderlustSurface>
                    </div>
                  )}
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
