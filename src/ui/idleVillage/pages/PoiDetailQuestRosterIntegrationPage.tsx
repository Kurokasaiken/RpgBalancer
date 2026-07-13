/**
 * PoiDetailQuestRosterIntegrationPage — Quest POI + Roster + real POI Detail
 *
 * Pagina di test in /test-hub che integra un roster draggabile con un vero POI
 * quest proveniente dalla configurazione Idle Village. Al click sul medaglione POI si
 * apre il pannello dettaglio (ActivityCapsuleDetailSkinAware) con i dati reali
 * dell'attività e un vero slot rack interattivo alimentato da
 * useResidentSlotController.
 *
 * Gli slot sono a ruolo (combattente/supporto/vanguard, vedi
 * metadata.slotBlueprints in defaultConfig.ts): ognuno ha requisiti propri,
 * può essere obbligatorio, e può avere modificatori di rischio propri o
 * penalità se lasciato vuoto. Un pannello di preview live (deterministico,
 * senza rng) mostra %successo/ferita/morte/reward mentre si assegnano PG e
 * oggetti mock; il pulsante Embark risolve l'esito una sola volta tramite
 * QuestPowerEngine.resolveQuestPower.
 *
 * Route: /poi-quest-detail-roster-integration
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
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import {
  DEFAULT_QUEST_POWER_RULES,
  resolveQuestPower,
  type QuestOutcome,
  type QuestPowerResult,
} from '@/engine/game/idleVillage/QuestPowerEngine';
import { useQuestAssignmentPreview } from '@/ui/idleVillage/hooks/useQuestAssignmentPreview';
import { QuestAssignmentPreview } from '@/ui/idleVillage/components/QuestAssignmentPreview';
import { MOCK_QUEST_ITEMS, type QuestItemMock } from '@/balancing/config/idleVillage/quests/questItemsMock';

/** Attività di riferimento usata dalla pagina di verification. */
const DEFAULT_ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_city_rats;
const DEFAULT_ACTIVITY_ID = DEFAULT_ACTIVITY.id;

/** Elenco attività reali escluse le voci di test. */
const ACTIVITIES = Object.values(DEFAULT_IDLE_VILLAGE_CONFIG.activities).filter(
  (a) => !a.tags.includes('test') && getActivityKind(a) === 'quest',
);

/** Dati di esempio del registro eventi, identici a quelli di verification. */
const mockTelemetry: TelemetryEntry[] = [
  {
    id: 'tel-1',
    timestamp: new Date(Date.now() - 3600000),
    message: 'Activity started',
    type: 'start',
  },
  {
    id: 'tel-2',
    timestamp: new Date(Date.now() - 1800000),
    message: 'Worker assigned to slot 3',
    type: 'assign',
  },
  {
    id: 'tel-3',
    timestamp: new Date(Date.now() - 600000),
    message: 'Progress update: 65%',
    type: 'done',
  },
];

type ActivityKind = 'job' | 'quest' | 'training' | 'maintenance';

function getActivityKind(activity: ActivityDefinition): ActivityKind {
  if (activity.tags.includes('quest')) return 'quest';
  if (activity.tags.includes('training')) return 'training';
  if (activity.tags.includes('job')) return 'job';
  return (activity.cardKind as ActivityKind) ?? 'job';
}

function getActivityIcon(activity: ActivityDefinition): string {
  // Same icon used in the verification page for Dangerous Hunt.
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

function formatSeconds(value: number): string {
  if (Number.isNaN(value)) return '—';
  if (value >= 1000) {
    const seconds = value / 1000;
    return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
  }
  if (value >= 60) return `${Math.ceil(value / 60)}m`;
  return `${value}ms`;
}

function formatRewards(activity: ActivityDefinition): string {
  const parts: string[] = [];
  if (activity.rewards && activity.rewards.length > 0) {
    parts.push(
      activity.rewards.map((r) => `${r.resourceId}: +${r.amountFormula}`).join(', '),
    );
  }
  if (activity.dailyRewardProfile && activity.dailyRewardProfile.length > 0) {
    parts.push(
      activity.dailyRewardProfile.map((r) => `${r.resourceId}/day ${r.amountPerDay}`).join(', '),
    );
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
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

const QUEST_OUTCOME_LABELS: Record<QuestOutcome, string> = {
  perfect: 'Perfetto',
  success: 'Successo',
  partial: 'Successo Parziale',
  fail: 'Fallimento',
  deadly: 'Disastro',
};

const OUTCOME_CONFIG: Record<QuestOutcome, { icon: string; color: string; bg: string; border: string }> = {
  perfect: { icon: '★', color: 'text-amber-200', bg: 'bg-amber-950/40', border: 'border-amber-500/50' },
  success: { icon: '✓', color: 'text-emerald-200', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50' },
  partial: { icon: '~', color: 'text-sky-200', bg: 'bg-sky-950/40', border: 'border-sky-500/50' },
  fail: { icon: '✗', color: 'text-orange-200', bg: 'bg-orange-950/40', border: 'border-orange-500/50' },
  deadly: { icon: '☠', color: 'text-rose-200', bg: 'bg-rose-950/40', border: 'border-rose-600/60' },
};

interface EmbarkResultModalProps {
  result: QuestPowerResult;
  residentsById: Record<string, { displayName?: string; id: string }>;
  onClose: () => void;
}

function EmbarkResultModal({ result, residentsById, onClose }: EmbarkResultModalProps) {
  const cfg = OUTCOME_CONFIG[result.outcome];
  const injured = result.consequences.filter((c) => c.consequence === 'injured');
  const dead = result.consequences.filter((c) => c.consequence === 'dead');
  const unscathed = result.consequences.filter((c) => c.consequence === 'none');

  return (
    <div
      data-testid="quest-embark-result"
      role="dialog"
      aria-modal="true"
      aria-label="Esito missione"
      className="rounded-xl border bg-slate-950/95 p-5 space-y-4 shadow-2xl"
      style={{ borderColor: 'inherit' }}
    >
      <div className={`rounded-lg border p-4 text-center ${cfg.bg} ${cfg.border}`}>
        <p className="text-3xl">{cfg.icon}</p>
        <p className={`mt-1 text-xl font-semibold tracking-wider ${cfg.color}`}>
          {QUEST_OUTCOME_LABELS[result.outcome]}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Power ratio: <span className="text-slate-200">{result.powerRatio.toFixed(2)}</span>
          {' · '}
          Reward ×<span className="text-slate-200">{result.rewardMultiplier.toFixed(2)}</span>
        </p>
      </div>

      {(dead.length > 0 || injured.length > 0 || unscathed.length > 0) && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Conseguenze del party</p>
          <div className="grid grid-cols-1 gap-1.5">
            {dead.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-rose-700/40 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200">
                <span>☠</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-rose-400 font-medium">Morto</span>
              </div>
            ))}
            {injured.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                <span>🩹</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-amber-400 font-medium">Ferito</span>
              </div>
            ))}
            {unscathed.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-slate-700/40 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-300">
                <span>✓</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-slate-500 font-medium">Illeso</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded border border-slate-600 bg-slate-800 py-2 text-xs uppercase tracking-widest text-slate-200 hover:bg-slate-700 transition-colors"
      >
        Chiudi
      </button>
    </div>
  );
}

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

/** Wraps the canonical GenericPoiSkin with drop/click affordances for the map POI. */
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

const PoiDetailQuestRosterIntegrationPage: FC = () => {
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
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>(mockTelemetry);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [embarkResult, setEmbarkResult] = useState<QuestPowerResult | null>(null);

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivityId) ?? DEFAULT_ACTIVITY,
    [selectedActivityId],
  );
  const activityKind = useMemo(() => getActivityKind(activity), [activity]);
  const activityIcon = useMemo(() => getActivityIcon(activity), [activity]);
  const slotBlueprints = useMemo(() => buildSlotBlueprints(activity), [activity]);

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
      trackTelemetryEvent('poi_detail_quest_roster_assign', { activityId: activity.id, slotId, residentId });
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
          trackTelemetryEvent('poi_detail_quest_roster_detach', { activityId: activity.id, slotId });
        }
        return { ...a, [slotId]: null };
      });
    },
    [residentsById, activity.id, addTelemetry],
  );

  const controller = useResidentSlotController({
    activity,
    assignments,
    residents: residentsById,
    hoveredResidentId: draggingResidentId,
    slotBlueprints,
    onAssign: handleAssign,
    onClear: handleClear,
  });

  const maxSlots = controller.slots.length;
  const freeSlots = controller.slots.filter((s) => !s.assignedResidentId).length;

  const poiDropId = useMemo(() => `job-poi-drop-${activity.id}`, [activity.id]);

  const questPowerRules = DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.questPowerRules ?? DEFAULT_QUEST_POWER_RULES;

  const selectedItems = useMemo<QuestItemMock[]>(
    () => MOCK_QUEST_ITEMS.filter((item) => selectedItemIds.includes(item.id)),
    [selectedItemIds],
  );

  const preview = useQuestAssignmentPreview(activity, controller.slots, questPowerRules, selectedItems);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  }, []);

  const findAcceptingSlot = useCallback(
    (residentId: string) => {
      const resident = residentsById[residentId];
      if (!resident || assignedIds.includes(residentId)) return null;
      // Slots are already sorted left-to-right by index; pick the first empty
      // slot whose requirements the resident satisfies.
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

  const handleResidentSelect = useCallback(
    (residentId: string) => {
      if (flyingResidentId) return;
      const slot = findAcceptingSlot(residentId);
      if (!slot) return;
      const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (!from) return;

      // Open the POI detail so the target slot is rendered, then launch the
      // resident card into the slot with the same flight animation used for drag.
      setIsDetailOpen(true);
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
    [flyingResidentId, findAcceptingSlot, setIsDetailOpen, startFlight],
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

  // Only flip to 'in-progress' after Embark is resolved — assignments alone
  // keep the detail in 'idle' so the Avvia button stays visible.
  const status: 'idle' | 'in-progress' | 'completed' | 'blocked' =
    embarkResult ? 'in-progress' : 'idle';

  const activityProgress = embarkResult ? 0.65 : 0;
  const duration = parseInt(activity.durationFormula ?? '0', 10) || 0;
  const elapsed = Math.floor(duration * activityProgress);
  const remaining = duration - elapsed;

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
        role: slot.role,
        roleLabel: slot.label,
        required: slot.required,
      };
    });
  }, [controller.slots, activityProgress]);

  // Real requirements from the activity config; name/icon/color per stat are
  // resolved from the Balancer stat catalog inside the builder.
  const requirementRows = useMemo(
    () => buildStatRequirementRows(activity.statRequirement),
    [activity],
  );

  const handleEmbark = useCallback(() => {
    if (!preview.canEmbark) return;
    const partyResidents = controller.slots
      .filter((slot) => slot.assignedResident)
      .map((slot) => slot.assignedResident!);
    const result = resolveQuestPower(partyResidents, activity, questPowerRules, Math.random);
    setEmbarkResult(result);
    addTelemetry(
      'start',
      `Attività ${activity.label} avviata — esito: ${QUEST_OUTCOME_LABELS[result.outcome]}`,
    );
    trackTelemetryEvent('poi_detail_quest_roster_start', {
      activityId: activity.id,
      outcome: result.outcome,
      partyPower: result.partyPower,
    });
  }, [preview.canEmbark, controller.slots, activity, questPowerRules, addTelemetry]);

  const detailProps = useMemo(
    () => ({
      activityId: activity.id,
      name: activity.label,
      type: activityKind,
      questTags: activity.tags,
      subtitle: activity.description,
      status,
      progress: activityProgress,
      duration,
      elapsed,
      slots: detailSlots,
      maxSlots,
      draggingResidentId,
      requirements: requirementRows,
      durationDisplay: formatSeconds(duration),
      rewardDisplay: formatRewards(activity),
      etaDisplay: formatSeconds(remaining),
      telemetry,
      isOpen: isDetailOpen,
      onClose: () => setIsDetailOpen(false),
      showTelemetry: true,
      showSlots: true,
      showInfo: true,
      compact: false,
      // In-flow (not a floating fixed modal): keeps the slot rack in the page
      // layout so its [data-slot-id] rects match the visuals → correct drag
      // coordinates, same feel as /minimal-roster-slot-integration.
      inlineMode: true,
      enableDrag: false,
      pillar: 'wilderness' as const,
      dataTestId: 'poi-detail-wrapper-test',
      poiIcon: activityIcon,
      ariaLabel: `POI Detail: ${activity.label}`,
      ariaLive: 'polite' as const,
      enableDevTools: true,
      startDisabled: !preview.canEmbark,
      onStart: handleEmbark,
      onCancel: () => {
        addTelemetry('done', `Attività ${activity.label} annullata`);
        trackTelemetryEvent('poi_detail_quest_roster_cancel', { activityId: activity.id });
      },
      onCollect: () => {
        addTelemetry('done', `Ricompensa ${activity.label} raccolta`);
        trackTelemetryEvent('poi_detail_quest_roster_collect', { activityId: activity.id });
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
      addTelemetry,
      handleSlotClear,
      activityIcon,
      preview.canEmbark,
      handleEmbark,
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
            data-testid="poi-detail-quest-roster-integration-page"
            className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8"
          >
            <div className="mx-auto max-w-7xl space-y-6">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                  Test Hub · Quest POI Detail + Roster Integration
                </p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                  QUEST POI DETAIL + ROSTER INTEGRATION
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  POI quest reale da Idle Village config, detail completo, slot a ruolo e preview live.
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
                    setTelemetry(mockTelemetry);
                    setIsDetailOpen(false);
                    setSelectedItemIds([]);
                    setEmbarkResult(null);
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
                <div className="space-y-6">
                  <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-200">
                      Village Roster
                    </h2>
                    <RosterDraggable
                      componentId="poi-detail-quest-roster"
                      useWanderlustSkin={true}
                      useExternalDndContext={true}
                      onDragEnd={handleDragEnd as unknown as any}
                      onFlightComplete={handleFlightComplete}
                      onResidentSelect={handleResidentSelect}
                      lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                      lockedStatusLabel="Away"
                    />
                  </div>

                  <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-200">
                      Oggetti (mock)
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_QUEST_ITEMS.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            data-testid={`quest-item-${item.id}`}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <QuestAssignmentPreview preview={preview} />

                  {embarkResult && (
                    <EmbarkResultModal
                      result={embarkResult}
                      residentsById={residentsById}
                      onClose={() => setEmbarkResult(null)}
                    />
                  )}
                </div>

                <StyleLabSurface className="poi-detail-surface" variant="panel">
                  <section className="poi-detail-stage">
                    <DroppablePoi
                      dropId={poiDropId}
                      icon={activityIcon}
                      label={activity.label}
                      progress={activityProgress}
                      injuryRisk={preview.projectedInjuryChance}
                      deathRisk={preview.projectedDeathChance}
                      dangerRating={`${activity.dangerRating}/5`}
                      canAcceptDrop={freeSlots > 0}
                      onClick={() => setIsDetailOpen(true)}
                    />

                    <div className="poi-detail-stage__detail">
                      <ActivityCapsuleDetailSkinAware {...detailProps} />
                    </div>
                  </section>
                </StyleLabSurface>
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

export default PoiDetailQuestRosterIntegrationPage;
