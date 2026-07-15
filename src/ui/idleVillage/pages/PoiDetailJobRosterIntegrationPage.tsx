/**
 * PoiDetailJobRosterIntegrationPage — Job POI + Roster + real POI Detail
 *
 * Pagina di test in /test-hub che integra un roster draggabile con un vero POI
 * job proveniente dalla configurazione Idle Village. Al click sul medaglione POI si
 * apre il pannello dettaglio (ActivityCapsuleDetailSkinAware) con i dati reali
 * dell'attività e un vero slot rack interattivo alimentato da
 * useResidentSlotController.
 *
 * Route: /poi-job-detail-roster-integration
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from '@/localization/useTranslation';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
  useDndContext,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { getBloomStyle, type BloomState } from '@/ui/idleVillage/interaction/bloomEffect';
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
import { buildStatRequirementRows } from '@/ui/idleVillage/utils/statRequirementDisplay';
import type { ResidentSlotBlueprint, ResidentSlotViewModel, SlotActivityState } from '@/ui/idleVillage/slots/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDefinition, ActivityMaxSlots } from '@/balancing/config/idleVillage/types';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { getDefaultPoiColors } from '@/balancing/config/idleVillage/poiColorConfig';

/** Attività di default: raccolta di legname stabile (job). */
const DEFAULT_ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_wood_gathering_stable;
const DEFAULT_ACTIVITY_ID = DEFAULT_ACTIVITY.id;

/** Elenco attività reali escluse le voci di test. */
const ACTIVITIES = Object.values(DEFAULT_IDLE_VILLAGE_CONFIG.activities).filter(
  (a) => !a.tags.includes('test') && getActivityKind(a) === 'job',
);

/** Dati di esempio del registro eventi, identici a quelli di verification. */
function getMockTelemetry(t: TFunction<'idleVillage'>): TelemetryEntry[] {
  return [
    {
      id: 'tel-1',
      timestamp: new Date(Date.now() - 3600000),
      message: t('idleVillage:poiDetail.telemetry.initialized', { defaultValue: 'Activity started' }),
      type: 'start',
    },
    {
      id: 'tel-2',
      timestamp: new Date(Date.now() - 1800000),
      message: t('idleVillage:poiDetail.telemetry.workerAssigned', { defaultValue: '{worker} assigned to slot {slotNumber}', worker: t('idleVillage:activityCapsule.workerAlt', { defaultValue: 'Worker' }), slotNumber: 3 }),
      type: 'assign',
    },
    {
      id: 'tel-3',
      timestamp: new Date(Date.now() - 600000),
      message: t('idleVillage:poiDetail.telemetry.progressUpdate', { defaultValue: 'Progress update: {percent}%', percent: 65 }),
      type: 'done',
    },
  ];
}

type ActivityKind = 'job' | 'quest' | 'training' | 'maintenance';

function getActivityKind(activity: ActivityDefinition): ActivityKind {
  if (activity.tags.includes('quest')) return 'quest';
  if (activity.tags.includes('training')) return 'training';
  if (activity.tags.includes('job')) return 'job';
  return (activity.cardKind as ActivityKind) ?? 'job';
}

function getActivityIcon(activity: ActivityDefinition): string {
  // Job- and quest-specific icons resolved from config.
  if (activity.id === 'job_wood_gathering_stable') return '🪵';
  if (activity.id === 'quest_dangerous_hunt') return '🏹';
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

function formatSeconds(value: number, t: TFunction<'idleVillage'>): string {
  if (Number.isNaN(value)) return t('idleVillage:poiDetail.duration.none', { defaultValue: '—' });
  if (value >= 1000) {
    const seconds = value / 1000;
    return t('idleVillage:poiDetail.duration.seconds', { defaultValue: '{seconds}s', seconds: Number.isInteger(seconds) ? seconds : Number(seconds.toFixed(1)) });
  }
  if (value >= 60) return t('idleVillage:poiDetail.duration.minutes', { defaultValue: '{minutes}m', minutes: Math.ceil(value / 60) });
  return t('idleVillage:poiDetail.duration.milliseconds', { defaultValue: '{ms}ms', ms: value });
}

function formatRewards(activity: ActivityDefinition, t: TFunction<'idleVillage'>): string {
  const parts: string[] = [];
  if (activity.rewards && activity.rewards.length > 0) {
    parts.push(
      activity.rewards.map((r) => t('idleVillage:poiDetail.reward.single', { defaultValue: '{resourceId}: +{amountFormula}', resourceId: r.resourceId, amountFormula: r.amountFormula })).join(', '),
    );
  }
  if (activity.dailyRewardProfile && activity.dailyRewardProfile.length > 0) {
    parts.push(
      activity.dailyRewardProfile.map((r) => t('idleVillage:poiDetail.reward.daily', { defaultValue: '{resourceId}/day {amountPerDay}', resourceId: r.resourceId, amountPerDay: r.amountPerDay })).join(', '),
    );
  }
  return parts.length > 0 ? parts.join(t('idleVillage:poiDetail.reward.separator', { defaultValue: ' · ' })) : t('idleVillage:poiDetail.reward.none', { defaultValue: '—' });
}

function buildSlotBlueprints(activity: ActivityDefinition): ResidentSlotBlueprint[] | undefined {
  const meta = activity.metadata as { slotBlueprints?: ResidentSlotBlueprint[] } | undefined;
  return meta?.slotBlueprints;
}

// Config-first POI color palette (replaces hardcoded WILDERNESS_COLORS).
const DEFAULT_POI_COLORS = getDefaultPoiColors('wilderness');

interface DroppablePoiProps {
  dropId: string;
  icon: string;
  label: string;
  progress: number;
  timeRemainingMs?: number;
  isExpirable?: boolean;
  injuryRisk?: number;
  deathRisk?: number;
  dangerRating?: string;
  canAcceptDrop: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function DroppablePoi({
  dropId,
  icon,
  label,
  progress,
  timeRemainingMs,
  isExpirable,
  injuryRisk,
  deathRisk,
  dangerRating,
  canAcceptDrop,
  onClick,
}: DroppablePoiProps) {
  const { t } = useTranslation('idleVillage');
  const { setNodeRef } = useDroppable({
    id: dropId,
    disabled: !canAcceptDrop,
    data: { accepts: ['resident'] },
  });

  // Shared AAA bloom: glow across the WHOLE drag (not just on hover-over),
  // same system as JobPOI / slots. 'valid' while a resident is dragged and
  // this POI can accept it; 'idle' otherwise. No hover/over scale jump.
  const { active } = useDndContext();
  const highlightState: BloomState = active
    ? (canAcceptDrop ? 'valid' : 'invalid')
    : 'idle';

  return (
    <div
      ref={setNodeRef}
      className="poi-detail-stage__medallion relative flex cursor-pointer flex-col items-center gap-2"
      onClick={onClick}
      style={getBloomStyle(highlightState, 200)}
      role="button"
      tabIndex={0}
      aria-label={`${label} — ${t('idleVillage:poiDetail.openDetail', { defaultValue: 'click to open details' })}`}
    >
      <GenericPoiSkin
        icon={icon}
        progress={progress}
        coronaCore={DEFAULT_POI_COLORS.coronaCore}
        coronaGlow={DEFAULT_POI_COLORS.coronaGlow}
        rimColors={DEFAULT_POI_COLORS.rimColors}
        stoneColors={DEFAULT_POI_COLORS.stoneColors}
        stoneAmbient={DEFAULT_POI_COLORS.stoneAmbient}
        pinColor={DEFAULT_POI_COLORS.pinColor}
        pillar="wilderness"
        size={200}
        enableHover
        label={label}
        timeRemainingMs={timeRemainingMs}
        isExpirable={isExpirable}
        showRiskBadges
        injuryRisk={injuryRisk}
        deathRisk={deathRisk}
        dangerRating={dangerRating}
      />
    </div>
  );
}

const PoiDetailJobRosterIntegrationPage: FC = () => {
  const { t } = useTranslation('idleVillage');
  const { residentsById } = useRosterKitData();

  // No pre-fill: the first slot must appear empty until the player assigns a resident.
  const defaultAssignments = {} as Record<string, string | null>;

  const [selectedActivityId, setSelectedActivityId] = useState<string>(DEFAULT_ACTIVITY_ID);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    defaultAssignments,
  );
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>(() => getMockTelemetry(t));

  const poiRef = useRef<HTMLDivElement | null>(null);

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivityId) ?? DEFAULT_ACTIVITY,
    [selectedActivityId],
  );
  const activityKind = useMemo(() => getActivityKind(activity), [activity]);
  const activityIcon = useMemo(() => getActivityIcon(activity), [activity]);
  const slotBlueprints = useMemo(() => buildSlotBlueprints(activity), [activity]);

  // Jobs can have infinite slots; preserve that behavior for real job config.
  const controllerMaxSlots = useMemo<ActivityMaxSlots>(() => {
    if (activity.maxSlots === 'infinite') return 'infinite';
    return typeof activity.maxSlots === 'number' ? activity.maxSlots : 4;
  }, [activity]);

  // For jobs, keep the real stat requirement so the slot rack validates
  // assignments against the actual activity config.
  const activityForController = useMemo(
    () => ({ ...activity, maxSlots: controllerMaxSlots }),
    [activity, controllerMaxSlots],
  );

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
        t('idleVillage:poiDetail.telemetry.assigned', { defaultValue: '{resident} → {slotId}', resident: resident ? formatResidentLabel(resident) : residentId, slotId }),
      );
      trackTelemetryEvent('poi_detail_job_roster_assign', { activityId: activity.id, slotId, residentId });
    },
    [residentsById, activity.id, addTelemetry, t],
  );

  const handleClear = useCallback(
    (slotId: string) => {
      setAssignments((a) => {
        const residentId = a[slotId];
        const resident = residentId ? residentsById[residentId] : undefined;
        if (residentId) {
          addTelemetry(
            'detach',
            t('idleVillage:poiDetail.telemetry.detached', { defaultValue: '{resident} ← {slotId}', resident: resident ? formatResidentLabel(resident) : residentId, slotId }),
          );
          trackTelemetryEvent('poi_detail_job_roster_detach', { activityId: activity.id, slotId });
        }
        return { ...a, [slotId]: null };
      });
    },
    [residentsById, activity.id, addTelemetry, t],
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
        : document.querySelector('.poi-detail-stage__medallion');
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

  const openDetailFromPoi = useCallback(() => {
    const poi = poiRef.current ?? document.querySelector('.poi-detail-stage__medallion');
    const rect = poi?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const detailWidth = 680;
    const detailHeight = 520;
    const padding = 16;

    const maxLeft = Math.max(padding, viewportWidth - detailWidth - padding);
    const maxTop = Math.max(padding, viewportHeight - detailHeight - padding);

    const clampedLeft = rect
      ? Math.min(
          Math.max(rect.left + rect.width / 2 - detailWidth / 2, padding),
          maxLeft,
        )
      : padding;
    const clampedTop = rect
      ? Math.min(
          Math.max(rect.top + rect.height / 2 - detailHeight / 2, padding),
          maxTop,
        )
      : padding;

    setDetailPosition({ x: clampedLeft, y: clampedTop });
    setIsDetailOpen(true);
  }, []);

  const handleResidentSelect = useCallback(
    (residentId: string) => {
      if (flyingResidentId) return;
      const slot = findAcceptingSlot(residentId);
      if (!slot) return;
      const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (!from) return;

      // Open the POI detail so the target slot is rendered, then launch the
      // resident card into the slot with the same flight animation used for drag.
      openDetailFromPoi();
      setFlyingResidentId(residentId);
      setTimeout(() => {
        const to = elementCenter(document.querySelector(`[data-slot-id="${slot.id}"]`));
        if (!to) return;
        startFlight({
          residentId,
          slotId: slot.id,
          isInset: true,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
        });
      }, 50);
    },
    [flyingResidentId, findAcceptingSlot, openDetailFromPoi, startFlight],
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

  const duration = parseInt(activity.durationFormula ?? '0', 10) || 0;
  const hasDuration = duration > 0;
  const activityProgress = hasDuration && assignedIds.length > 0 ? 0.65 : 0;
  const elapsed = Math.floor(duration * activityProgress);
  const remaining = duration - elapsed;

  const riskBadges = useMemo(() => {
    const meta = activity.metadata as Record<string, unknown> | undefined;
    const badges: { label: string; value: string }[] = [];
    if (activityKind === 'job') {
      if (typeof meta?.riskLevel === 'string') {
        badges.push({ label: t('idleVillage:poiDetail.badgeLabels.riskLevel', { defaultValue: 'Risk Level' }), value: meta.riskLevel });
      } else if (activity.dangerRating && activity.dangerRating <= 1) {
        badges.push({ label: t('idleVillage:poiDetail.badgeLabels.riskLevel', { defaultValue: 'Risk Level' }), value: 'low' });
      }
      if (typeof meta?.repeatable === 'boolean') {
        badges.push({ label: t('idleVillage:poiDetail.badgeLabels.repeatable', { defaultValue: 'Repeatable' }), value: meta.repeatable ? t('idleVillage:poiDetail.badgeLabels.yes', { defaultValue: 'Yes' }) : t('idleVillage:poiDetail.badgeLabels.no', { defaultValue: 'No' }) });
      }
    }
    const injury = meta?.injuryChanceDisplay as number | undefined;
    const death = meta?.deathChanceDisplay as number | undefined;
    if (injury !== undefined) badges.push({ label: t('idleVillage:poiDetail.badgeLabels.injuryRisk', { defaultValue: 'Injury Risk' }), value: `${injury}%` });
    if (death !== undefined) badges.push({ label: t('idleVillage:poiDetail.badgeLabels.deathRisk', { defaultValue: 'Death Risk' }), value: `${death}%` });
    badges.push({ label: t('idleVillage:poiDetail.badgeLabels.dangerRating', { defaultValue: 'Danger Rating' }), value: t('idleVillage:poiDetail.rating.outOf', { defaultValue: '{rating}/5', rating: activity.dangerRating }) });
    return badges;
  }, [activity, activityKind, t]);

  const detailSlots = useMemo<ActivityDetailSlotData[]>(() => {
    return controller.slots.map((slot) => {
      const resident = slot.assignedResident;
      const isAssigned = !!resident;
      return {
        id: slot.id,
        residentId: slot.assignedResidentId ?? undefined,
        state: isAssigned ? 'active' : 'empty',
        initial: '',
        progress: isAssigned ? activityProgress : 0,
        assignedWorkerName: resident ? formatResidentLabel(resident) : undefined,
        assignedWorkerAvatarUrl: resident ? getResidentPortraitUrl(resident) : undefined,
        visualProfileId: resident?.visualProfileId,
        statProfileId: resident?.statProfileId,
        // Carry the controller's live drop state so the slot rack blooms during
        // a drag — same behaviour as /minimal-job-poi-roster-integration.
        dropState: slot.dropState,
      };
    });
  }, [controller.slots, activityProgress]);

  // Activity state + display info for the ResidentSlotRack rendered inside
  // ActivityCapsuleDetailSkinAware. Empty slots show the POI icon; assigned
  // slots show the resident's first initial.
  const getDetailSlotActivityState = useCallback(
    (slotId: string): SlotActivityState | null => {
      const slot = detailSlots.find((s) => s.id === slotId);
      if (!slot) return null;
      const isAssigned = !!slot.residentId;
      return {
        state: isAssigned ? 'active' : 'idle',
        progress: isAssigned ? activityProgress : 0,
        remainingSeconds: isAssigned ? remaining : 0,
        isLockedByPhase: false,
      };
    },
    [detailSlots, activityProgress, remaining],
  );

  const resolveDetailSlotDisplayInfo = useCallback(
    (slot: ResidentSlotViewModel) => ({
      icon: slot.assignedResident?.displayName ? slot.assignedResident.displayName.charAt(0) : activityIcon,
      label: slot.label,
    }),
    [activityIcon],
  );

  // Real requirements from the activity config; name/icon/color per stat are
  // resolved from the Balancer stat catalog inside the builder.
  const requirementRows = useMemo(
    () => buildStatRequirementRows(activity.statRequirement),
    [activity],
  );

  const detailProps = useMemo(
    () => ({
      activityId: activity.id,
      name: activity.label,
      type: activityKind,
      subtitle: activity.description,
      status,
      progress: activityProgress,
      duration,
      elapsed,
      slots: detailSlots,
      maxSlots,
      draggingResidentId,
      requirements: requirementRows,
      durationDisplay: formatSeconds(duration, t),
      rewardDisplay: formatRewards(activity, t),
      etaDisplay: formatSeconds(remaining, t),
      telemetry,
      isOpen: isDetailOpen,
      onClose: () => {
        setIsDetailOpen(false);
        setDetailPosition(undefined);
      },
      showTelemetry: true,
      showSlots: true,
      showInfo: true,
      compact: false,
      // Floating modal so the panel can be dragged and positioned over the POI.
      inlineMode: false,
      enableDrag: true,
      position: detailPosition,
      pillar: 'wilderness' as const,
      dataTestId: 'poi-detail-wrapper-test',
      poiIcon: activityIcon,
      ariaLabel: t('idleVillage:poiDetail.ariaLabel', { defaultValue: 'POI Detail: {label}', label: activity.label }),
      ariaLive: 'polite' as const,
      enableDevTools: true,
      ...(activityKind === 'quest'
        ? {
            onStart: () => {
              addTelemetry('start', t('idleVillage:poiDetail.telemetry.started', { defaultValue: 'Activity {label} started', label: activity.label }));
              trackTelemetryEvent('poi_detail_job_roster_start', { activityId: activity.id });
            },
            onCancel: () => {
              addTelemetry('done', t('idleVillage:poiDetail.telemetry.cancelled', { defaultValue: 'Activity {label} cancelled', label: activity.label }));
              trackTelemetryEvent('poi_detail_job_roster_cancel', { activityId: activity.id });
            },
            onCollect: () => {
              addTelemetry('done', t('idleVillage:poiDetail.telemetry.collected', { defaultValue: 'Reward {label} collected', label: activity.label }));
              trackTelemetryEvent('poi_detail_job_roster_collect', { activityId: activity.id });
            },
          }
        : {}),
      getSlotActivityState: getDetailSlotActivityState,
      resolveDisplayInfo: resolveDetailSlotDisplayInfo,
      onSlotDetach: handleSlotClear,
      onSlotAssign: () => {
        // No-op: assignments are driven by roster drag/click.
      },
    }),
    [
      activity,
      activityKind,
      status,
      activityProgress,
      duration,
      elapsed,
      remaining,
      maxSlots,
      detailSlots,
      draggingResidentId,
      requirementRows,
      telemetry,
      isDetailOpen,
      detailPosition,
      addTelemetry,
      handleSlotClear,
      activityIcon,
      getDetailSlotActivityState,
      resolveDetailSlotDisplayInfo,
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
            data-testid="poi-detail-job-roster-integration-page"
            className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8"
          >
            <div className="mx-auto max-w-7xl space-y-6">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                  {t('idleVillage:testRoster.poiDetailPage.pretitle')}
                </p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                  {t('idleVillage:testRoster.poiDetailPage.title')}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {t('idleVillage:testRoster.poiDetailPage.description')}
                </p>
              </header>

              <div
                className="flex flex-wrap items-center gap-4 p-4"
                style={{
                  borderRadius: 'var(--radius-md, 3px)',
                  border: '1px solid var(--panel-border, rgba(255,255,255,0.055))',
                  background: 'var(--panel-bg, rgba(9,8,6,0.94))',
                  boxShadow: 'var(--shadow-deep, 0 24px 64px rgba(0,0,0,0.98), 0 6px 18px rgba(0,0,0,1))',
                }}
              >
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  {t('idleVillage:testRoster.poiDetailPage.activityLabel')}
                </label>
                <select
                  className="px-3 py-1.5 text-sm"
                  style={{
                    borderRadius: 'var(--radius-sm, 2px)',
                    border: '1px solid var(--card-border, rgba(255,255,255,0.04))',
                    background: 'var(--card-bg, rgba(13,11,8,0.96))',
                    color: 'var(--t1, #f0e8d5)',
                  }}
                  value={selectedActivityId}
                  onChange={(e) => {
                    setSelectedActivityId(e.target.value);
                    setAssignments({});
                    setTelemetry(getMockTelemetry(t));
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
                    {t('idleVillage:testRoster.poiDetailPage.rosterTitle')}
                  </h2>
                  <RosterDraggable
                    componentId="poi-detail-job-roster"
                    useWanderlustSkin={true}
                    useExternalDndContext={true}
                    onDragEnd={handleDragEnd as unknown as any}
                    onFlightComplete={handleFlightComplete}
                    onResidentSelect={handleResidentSelect}
                    lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                    lockedStatusLabel={t('idleVillage:workerTooltip.statuses.away', { defaultValue: 'Away' })}
                  />
                </div>

                <StyleLabSurface className="poi-detail-surface" variant="panel">
                  <section className="poi-detail-stage">
                    <DroppablePoi
                      dropId={poiDropId}
                      icon={activityIcon}
                      label={activity.label}
                      progress={activityProgress}
                      timeRemainingMs={remaining}
                      isExpirable={assignedIds.length > 0}
                      injuryRisk={(activity.metadata as Record<string, number> | undefined)?.injuryChanceDisplay}
                      deathRisk={(activity.metadata as Record<string, number> | undefined)?.deathChanceDisplay}
                      dangerRating={t('idleVillage:poiDetail.rating.outOf', { defaultValue: '{rating}/5', rating: activity.dangerRating })}
                      canAcceptDrop={freeSlots > 0}
                      onClick={(event) => {
                        poiRef.current = event.currentTarget;
                        openDetailFromPoi();
                      }}
                    />

                    <div className="poi-detail-stage__detail" />
                  </section>
                </StyleLabSurface>
              </div>
            </div>
          </div>

          <ActivityCapsuleDetailSkinAware {...detailProps} />

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

export default PoiDetailJobRosterIntegrationPage;
