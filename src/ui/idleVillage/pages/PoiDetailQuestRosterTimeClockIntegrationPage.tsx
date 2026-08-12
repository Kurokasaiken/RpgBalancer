/**
 * PoiDetailQuestRosterTimeClockIntegrationPage — POI quest completo
 *
 * Banco di prova del quest system della famiglia POI (R-005, desiderata v3):
 * - `ClockWidgetStandalone` + `DayNightPOI`: tutto sulla pagina legge il time engine.
 * - Durata dalle fasi del `QuestBlueprint` (non da `durationFormula`), milestone
 *   equispaziate una per fase.
 * - `MagicCircleHalo`: attorno al POI si *scrive* un'iscrizione arcana dalle ore 12;
 *   a cerchio chiuso si ferma e pulsa.
 * - A ogni milestone un `MilestoneCheckModal` (consumabili → Destiny Astrolabe).
 *   Se la quest card è chiusa il check si risolve comunque, fuori scena.
 * - Il fallimento di una fase non interrompe la quest; il giocatore può però
 *   interromperla a mano.
 * - A spedizione avviata il click sul POI apre la `QuestChronicle` al posto del
 *   detail; le ricompense si applicano solo con "Raccogli ricompense".
 *
 * Route: /poi-quest-detail-roster-time-clock
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import { ClockWidgetStandalone } from '@/ui/idleVillage/frozen/kits/clockKit';
import { DayNightPOI, QuestPOI, type QuestPOIPhase } from '@/ui/idleVillage/frozen/kits/poiKit';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
import { MilestoneCheckModal } from '@/ui/idleVillage/components/MilestoneCheckModal';
import QuestChronicle, {
  type QuestChroniclePhase,
  type PhaseVisualState,
} from '@/ui/idleVillage/components/QuestChronicle';
import {
  useMilestoneEngine,
  type MilestoneEvent,
} from '@/ui/idleVillage/hooks/useMilestoneEngine';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import { questTotalDurationMs } from '@/balancing/config/idleVillage/quests/questTimeScale';
import {
  applyConsumableRiskEffects,
  buildAstrolabeSkillsForPhase,
  buildQuestMilestones,
  isPassingVerdict,
  resolveMilestoneWithoutAnimation,
  resolveQuestOutcomeTier,
  type AstrolabeResultShape,
} from '@/engine/game/idleVillage/questMilestones';
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

const DEFAULT_ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_city_rats;
const DEFAULT_ACTIVITY_ID = DEFAULT_ACTIVITY.id;

const ACTIVITIES = Object.values(DEFAULT_IDLE_VILLAGE_CONFIG.activities).filter(
  (a) => !a.tags.includes('test') && getActivityKind(a) === 'quest',
);

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

/** Fixed cadence of the countdown; the clock speed multiplies the increment. */
const COUNTDOWN_TICK_MS = 100;

/** Medallion size; the magic circle shares it so the two stay concentric. */
const QUEST_POI_SIZE = 200;

const GLOBAL_RULES = DEFAULT_IDLE_VILLAGE_CONFIG.globalRules;
/** Real milliseconds one time unit of the village clock represents. */
const MS_PER_TIME_UNIT = (GLOBAL_RULES.secondsPerTimeUnit ?? 1) * 1000;
const DAY_TIME_UNITS = GLOBAL_RULES.dayNightCycle?.dayTimeUnits ?? 5;
const NIGHT_TIME_UNITS = GLOBAL_RULES.dayNightCycle?.nightTimeUnits ?? 5;
const CYCLE_TIME_UNITS = DAY_TIME_UNITS + NIGHT_TIME_UNITS;

/**
 * Derives the day/night state from the page's own clock.
 *
 * Everything on this surface hangs off a single elapsed-time value, so the
 * day/night POI can never drift away from the clock widget next to it.
 * @param worldElapsedMs - Elapsed world time in milliseconds
 * @returns Current day, phase and progress through that phase
 */
function deriveDayNight(worldElapsedMs: number): {
  currentDay: number;
  isDayPhase: boolean;
  cycleProgress: number;
} {
  const timeUnits = worldElapsedMs / MS_PER_TIME_UNIT;
  const positionInCycle = timeUnits % CYCLE_TIME_UNITS;
  const isDayPhase = positionInCycle < DAY_TIME_UNITS;
  const phaseLength = isDayPhase ? DAY_TIME_UNITS : NIGHT_TIME_UNITS;
  const phasePosition = isDayPhase ? positionInCycle : positionInCycle - DAY_TIME_UNITS;

  return {
    currentDay: Math.floor(timeUnits / CYCLE_TIME_UNITS) + 1,
    isDayPhase,
    cycleProgress: phaseLength > 0 ? phasePosition / phaseLength : 0,
  };
}

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
  questId: string;
  icon: string;
  label: string;
  progress: number;
  questStatus: 'available' | 'in_progress' | 'completed' | 'failed';
  phases: QuestPOIPhase[];
  currentPhaseIndex: number;
  /** True once the inscription has closed: the halo stops and pulses. */
  isHaloComplete: boolean;
  timeRemainingMs?: number;
  isExpirable?: boolean;
  injuryRisk?: number;
  deathRisk?: number;
  dangerRating?: number;
  canAcceptDrop: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function DroppablePoi({
  dropId,
  questId,
  icon,
  label,
  progress,
  questStatus,
  phases,
  currentPhaseIndex,
  isHaloComplete,
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
      <QuestPOI
        questId={questId}
        label={label}
        icon={icon}
        status={questStatus}
        phases={phases}
        currentPhaseIndex={currentPhaseIndex}
        progress={progress}
        size={QUEST_POI_SIZE}
        timeRemainingMs={timeRemainingMs}
        isExpirable={isExpirable}
        showRiskBadges
        injuryRisk={injuryRisk}
        deathRisk={deathRisk}
        dangerRating={dangerRating}
        // Concentric with the medallion. At progress 0 it draws nothing at all,
        // so no ring or track telegraphs the path before the first character.
        medallionOverlay={
          <MagicCircleHalo
            progress={progress}
            isComplete={isHaloComplete}
            size={QUEST_POI_SIZE}
          />
        }
      />
    </div>
  );
}

const PoiDetailQuestRosterTimeClockIntegrationPage: FC = () => {
  const { residentsById } = useRosterKitData();

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

  // Clock state. `worldElapsedMs` is the single time source of this surface:
  // the clock widget, the day/night POI and the quest countdown all read it.
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [worldElapsedMs, setWorldElapsedMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown state: only increments while the quest is actually running.
  const [elapsedMs, setElapsedMs] = useState(0);

  /**
   * Whether the expedition is under way. Deliberately separate from
   * `embarkResult`: the run has to exist before an outcome does, otherwise the
   * quest would resolve the instant it is launched and the milestones would
   * never fire.
   */
  const [isQuestRunning, setIsQuestRunning] = useState(false);
  /** Astrolabe result per phase index; null until that milestone resolves. */
  const [phaseResults, setPhaseResults] = useState<(AstrolabeResultShape | null)[]>([]);
  /** Milestones crossed but not yet shown, in order. */
  const [milestoneQueue, setMilestoneQueue] = useState<MilestoneEvent[]>([]);
  /** The milestone currently displayed in the check modal. */
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  /** Consumables the player is spending on the current check. */
  const [milestoneConsumableIds, setMilestoneConsumableIds] = useState<string[]>([]);
  /** Whether the quest card has replaced the POI detail. */
  const [isQuestCardOpen, setIsQuestCardOpen] = useState(false);
  /**
   * Whether the party-consequences panel is showing. Tracked separately from
   * `embarkResult` so dismissing the panel cannot discard the quest outcome
   * that the collect gate still depends on.
   */
  const [isConsequencesOpen, setIsConsequencesOpen] = useState(true);

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === selectedActivityId) ?? DEFAULT_ACTIVITY,
    [selectedActivityId],
  );
  const activityKind = useMemo(() => getActivityKind(activity), [activity]);
  const activityIcon = useMemo(() => getActivityIcon(activity), [activity]);
  const slotBlueprints = useMemo(() => buildSlotBlueprints(activity), [activity]);

  /**
   * Quest blueprint for the selected activity. The blueprint's phases are the
   * single source of truth for how long the halo takes to write itself:
   * `activity.durationFormula` is a seconds-based sandbox display value and can
   * diverge from the authored phases.
   */
  const blueprint = useMemo(
    () => defaultQuestBlueprints[activity.id] ?? null,
    [activity.id],
  );
  const questPhases = useMemo(() => blueprint?.phases ?? [], [blueprint]);

  const questDurationMs = useMemo(() => questTotalDurationMs(questPhases), [questPhases]);
  const milestones = useMemo(
    () => buildQuestMilestones(questDurationMs, questPhases.length),
    [questDurationMs, questPhases.length],
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

  /**
   * World clock. Fixed cadence, speed scales the increment — the same
   * arrangement as the quest countdown, so the two stay locked together.
   */
  useEffect(() => {
    if (isPaused) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setWorldElapsedMs((prev) => prev + COUNTDOWN_TICK_MS * speed);
    }, COUNTDOWN_TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPaused, speed]);

  const { currentDay, isDayPhase, cycleProgress } = useMemo(
    () => deriveDayNight(worldElapsedMs),
    [worldElapsedMs],
  );

  const status: 'idle' | 'in-progress' | 'completed' | 'blocked' = isQuestRunning
    ? 'in-progress'
    : embarkResult
      ? 'completed'
      : 'idle';

  /**
   * Countdown loop. The cadence is fixed and the clock's speed multiplier
   * scales the increment, so ×8 really advances the quest eight times faster;
   * pausing the clock freezes the inscription mid-word.
   */
  useEffect(() => {
    if (!isQuestRunning || isPaused) return;
    const countdown = setInterval(() => {
      setElapsedMs((prev) => Math.min(prev + COUNTDOWN_TICK_MS * speed, questDurationMs));
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(countdown);
  }, [isQuestRunning, isPaused, speed, questDurationMs]);

  const partyResidents = useMemo(
    () =>
      controller.slots
        .filter((slot) => slot.assignedResident)
        .map((slot) => slot.assignedResident!),
    [controller.slots],
  );

  /**
   * Builds the astrolabe input for one phase from the authored quest data and
   * the party currently in the slots.
   */
  const buildSkillsForPhaseIndex = useCallback(
    (phaseIndex: number) => {
      const phase = questPhases[phaseIndex];
      if (!phase) return [];
      return buildAstrolabeSkillsForPhase({
        phase,
        residents: partyResidents,
        blueprintDifficulty: blueprint?.difficulty,
        fallbackRequirement: activity.statRequirement,
      });
    },
    [questPhases, partyResidents, blueprint?.difficulty, activity.statRequirement],
  );

  const recordPhaseResult = useCallback(
    (phaseIndex: number, result: AstrolabeResultShape) => {
      setPhaseResults((prev) => {
        const next = [...prev];
        next[phaseIndex] = result;
        return next;
      });
      const phase = questPhases[phaseIndex];
      addTelemetry(
        isPassingVerdict(result.verdict) ? 'done' : 'detach',
        `${phase?.title ?? `Fase ${phaseIndex + 1}`} — ${result.verdict}`,
      );
      trackTelemetryEvent('quest_phase_resolved', {
        activityId: activity.id,
        phaseId: phase?.id,
        phaseIndex,
        verdict: result.verdict,
        wounded: result.wounded,
        dead: result.dead,
      });
    },
    [questPhases, addTelemetry, activity.id],
  );

  /**
   * A crossed milestone is queued rather than shown directly: at ×8 speed
   * several can be crossed between renders, and each still deserves its own
   * check instead of being collapsed into one.
   */
  const handleMilestone = useCallback((event: MilestoneEvent) => {
    setMilestoneQueue((queue) => [...queue, event]);
  }, []);

  const { reset: resetMilestones } = useMilestoneEngine({
    elapsedMs,
    milestones,
    active: isQuestRunning,
    onMilestone: handleMilestone,
  });

  /**
   * Drains the milestone queue. With the card open the player watches the
   * astrolabe; with the card closed the check still resolves, just off-screen —
   * the quest never stalls waiting to be observed.
   */
  useEffect(() => {
    if (milestoneQueue.length === 0 || activeMilestone) return;
    const [next, ...rest] = milestoneQueue;

    if (isQuestCardOpen) {
      setMilestoneQueue(rest);
      setMilestoneConsumableIds([]);
      setActiveMilestone(next);
      return;
    }

    const phase = questPhases[next.milestoneIndex];
    const skills = buildSkillsForPhaseIndex(next.milestoneIndex);
    const risk = applyConsumableRiskEffects(
      {
        injuryChance: phase?.riskProfile?.injuryChance ?? 0,
        deathChance: phase?.riskProfile?.deathChance ?? 0,
      },
      [],
    );
    setMilestoneQueue(rest);
    recordPhaseResult(
      next.milestoneIndex,
      resolveMilestoneWithoutAnimation({ skills, risk }),
    );
  }, [
    milestoneQueue,
    activeMilestone,
    isQuestCardOpen,
    questPhases,
    buildSkillsForPhaseIndex,
    recordPhaseResult,
  ]);

  /**
   * The inscription has closed. The halo stops and pulses, and the combined
   * outcome is computed from the phases that actually resolved — a single
   * failed phase does not abort the run, it only weighs on the total.
   */
  useEffect(() => {
    if (!isQuestRunning || elapsedMs < questDurationMs) return;
    if (milestoneQueue.length > 0 || activeMilestone) return;

    const resolved = phaseResults.filter((entry): entry is AstrolabeResultShape => !!entry);
    if (resolved.length < questPhases.length) return;

    const passed = resolved.filter((entry) => isPassingVerdict(entry.verdict)).length;

    // The engine supplies the party consequences from its own risk model, but
    // the headline outcome comes from the trials the party actually faced —
    // a power roll could otherwise announce "perfect" over three failed phases.
    const powerResult = resolveQuestPower(partyResidents, activity, questPowerRules, Math.random);
    const outcome = resolveQuestOutcomeTier(phaseResults);
    const result: QuestPowerResult = {
      ...powerResult,
      outcome,
      rewardMultiplier: questPowerRules.rewardMultipliers[outcome] ?? 1,
    };
    setEmbarkResult(result);
    setIsQuestRunning(false);
    addTelemetry(
      'done',
      `Quest ${activity.label} conclusa — ${passed}/${questPhases.length} fasi superate`,
    );
    trackTelemetryEvent('quest_completed', {
      activityId: activity.id,
      phasesPassed: passed,
      phasesTotal: questPhases.length,
      outcome: result.outcome,
    });
  }, [
    isQuestRunning,
    elapsedMs,
    questDurationMs,
    milestoneQueue.length,
    activeMilestone,
    phaseResults,
    questPhases,
    partyResidents,
    activity,
    questPowerRules,
    addTelemetry,
  ]);

  /** Returns the POI to its pre-assignment state and frees the party. */
  const resetQuestRun = useCallback(() => {
    setElapsedMs(0);
    setEmbarkResult(null);
    setIsQuestRunning(false);
    setPhaseResults([]);
    setMilestoneQueue([]);
    setActiveMilestone(null);
    setMilestoneConsumableIds([]);
    setIsQuestCardOpen(false);
    setIsConsequencesOpen(true);
    setAssignments({});
    setSelectedItemIds([]);
    resetMilestones();
  }, [resetMilestones]);

  // Reset everything when the selected activity changes
  useEffect(() => {
    setElapsedMs(0);
    setEmbarkResult(null);
    setIsQuestRunning(false);
    setPhaseResults([]);
    setMilestoneQueue([]);
    setActiveMilestone(null);
    setMilestoneConsumableIds([]);
    setIsQuestCardOpen(false);
    setIsConsequencesOpen(true);
    setAssignments({});
    setTelemetry(mockTelemetry);
    setIsDetailOpen(false);
    setSelectedItemIds([]);
  }, [selectedActivityId]);

  const questProgress = questDurationMs > 0 ? Math.min(1, elapsedMs / questDurationMs) : 0;
  const isHaloComplete = questProgress >= 1;
  const activityProgress = isQuestRunning || embarkResult ? questProgress : 0;
  // Numeric fields stay in seconds; the display strings are formatted from
  // milliseconds, because formatSeconds reads anything under 60 as raw ms.
  const duration = Math.round(questDurationMs / 1000);
  const elapsed = Math.floor(duration * activityProgress);
  const remaining = duration - elapsed;
  const remainingMs = Math.max(0, questDurationMs - elapsedMs);

  /** Index of the phase currently being written, clamped to the last phase. */
  const currentPhaseIndex = Math.min(
    questPhases.length === 0 ? 0 : questPhases.length - 1,
    phaseResults.filter(Boolean).length,
  );

  /** Visual state of every phase, shared by the POI dots and the quest card. */
  const phaseVisualStates = useMemo<PhaseVisualState[]>(
    () =>
      questPhases.map((_, index) => {
        const result = phaseResults[index];
        if (result) return isPassingVerdict(result.verdict) ? 'success' : 'failure';
        if (isQuestRunning && index === currentPhaseIndex) return 'active';
        return 'locked';
      }),
    [questPhases, phaseResults, isQuestRunning, currentPhaseIndex],
  );

  const poiPhaseDots = useMemo<QuestPOIPhase[]>(
    () => questPhases.map((phase, index) => ({ id: phase.id, state: phaseVisualStates[index] })),
    [questPhases, phaseVisualStates],
  );

  const chroniclePhases = useMemo<QuestChroniclePhase[]>(
    () =>
      questPhases.map((phase, index) => {
        const result = phaseResults[index];
        return {
          phase,
          state: phaseVisualStates[index],
          result: result
            ? {
                phaseId: phase.id,
                result: isPassingVerdict(result.verdict) ? 'success' : 'failure',
                timestamp: index,
                notes: result.verdict,
              }
            : undefined,
        };
      }),
    [questPhases, phaseResults, phaseVisualStates],
  );

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
        dropState: slot.dropState,
        role: slot.role,
        roleLabel: slot.label,
        required: slot.required,
      };
    });
  }, [controller.slots, activityProgress]);

  const requirementRows = useMemo(
    () => buildStatRequirementRows(activity.statRequirement),
    [activity],
  );

  /**
   * Launches the expedition. Starting a quest does not resolve it: the clock
   * begins, the inscription starts writing, and the outcome is assembled from
   * the milestone checks that follow.
   */
  const handleEmbark = useCallback(() => {
    if (!preview.canEmbark || isQuestRunning) return;
    setElapsedMs(0);
    setPhaseResults([]);
    setMilestoneQueue([]);
    setActiveMilestone(null);
    resetMilestones();
    setIsQuestRunning(true);
    setIsPaused(false);
    // The detail's job is done the moment the expedition leaves: hand the open
    // panel over to the quest card, so whoever pressed Start keeps watching the
    // same POI and sees its milestone checks instead of a stale slot rack.
    if (isDetailOpen) {
      setIsDetailOpen(false);
      setIsQuestCardOpen(true);
    }
    addTelemetry('start', `Quest ${activity.label} avviata — ${questPhases.length} fasi`);
    trackTelemetryEvent('poi_detail_quest_roster_start', {
      activityId: activity.id,
      phasesTotal: questPhases.length,
      durationMs: questDurationMs,
    });
  }, [
    preview.canEmbark,
    isQuestRunning,
    isDetailOpen,
    resetMilestones,
    activity.label,
    activity.id,
    questPhases.length,
    questDurationMs,
    addTelemetry,
  ]);

  /** Records the verdict the player just watched and closes the check. */
  const handleMilestoneResolved = useCallback(
    (result: AstrolabeResultShape) => {
      if (!activeMilestone) return;
      recordPhaseResult(activeMilestone.milestoneIndex, result);
    },
    [activeMilestone, recordPhaseResult],
  );

  /**
   * Collects the rewards: the party returns to the roster, the inscription
   * dissolves and the POI goes back to its pre-assignment state. Rewards apply
   * only here, so an uncollected quest still holds its prize.
   */
  const handleCollect = useCallback(() => {
    addTelemetry('done', `Ricompense di ${activity.label} raccolte`);
    trackTelemetryEvent('quest_rewards_collected', {
      activityId: activity.id,
      outcome: embarkResult?.outcome,
    });
    resetQuestRun();
  }, [activity.label, activity.id, embarkResult?.outcome, addTelemetry, resetQuestRun]);

  /** Abandons a running quest; the party comes home with nothing. */
  const handleAbandon = useCallback(() => {
    addTelemetry('detach', `Quest ${activity.label} interrotta dal giocatore`);
    trackTelemetryEvent('quest_abandoned', {
      activityId: activity.id,
      elapsedMs,
      phasesResolved: phaseResults.filter(Boolean).length,
    });
    resetQuestRun();
  }, [activity.label, activity.id, elapsedMs, phaseResults, addTelemetry, resetQuestRun]);

  /**
   * Clicking the POI opens the detail before the expedition leaves, and the
   * quest card once it is under way.
   */
  const handlePoiClick = useCallback(() => {
    if (isQuestRunning || embarkResult) {
      setIsQuestCardOpen(true);
      trackTelemetryEvent('quest_card_opened', { activityId: activity.id });
      return;
    }
    setIsDetailOpen(true);
  }, [isQuestRunning, embarkResult, activity.id]);

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
      durationDisplay: formatSeconds(questDurationMs),
      rewardDisplay: formatRewards(activity),
      etaDisplay: formatSeconds(remainingMs),
      telemetry,
      isOpen: isDetailOpen,
      onClose: () => setIsDetailOpen(false),
      showTelemetry: true,
      showSlots: true,
      showInfo: true,
      compact: false,
      inlineMode: true,
      enableDrag: false,
      pillar: 'wilderness' as const,
      dataTestId: 'poi-detail-wrapper-test',
      poiIcon: activityIcon,
      ariaLabel: `POI Detail: ${activity.label}`,
      ariaLive: 'polite' as const,
      enableDevTools: true,
      startDisabled: !preview.canEmbark || status === 'in-progress',
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
        // No-op
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
      remainingMs,
      questDurationMs,
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
            data-testid="poi-detail-quest-roster-time-clock-integration-page"
            className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8"
          >
            <div className="mx-auto max-w-7xl space-y-6">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                  Test Hub · Quest POI Detail + Roster + Time Clock Integration
                </p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                  QUEST POI DETAIL + ROSTER + TIME CLOCK
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Assegna il party e avvia: attorno al POI si scrive un cerchio magico che misura
                  la durata delle fasi del blueprint. A ogni milestone scatta uno skill check;
                  a cerchio chiuso clicca il POI per leggere la cronaca e raccogliere le ricompense.
                </p>
              </header>

              {/* Time engine: the clock drives the countdown, the day/night
                  POI reads the same world state as any other POI. */}
              <div className="flex flex-wrap items-start gap-6">
                <div className="min-w-[280px] flex-1">
                  <ClockWidgetStandalone
                currentDay={currentDay}
                isPaused={isPaused}
                speedMultiplier={speed}
                defaultSpeedMultiplier={1}
                maxSpeedMultiplier={8}
                tickIntervalMs={1000}
                warmupDelayMs={0}
                accentHex="#f59e0b"
                    onSpeedChange={setSpeed}
                    onTogglePause={() => setIsPaused(!isPaused)}
                    showTimingDetails={false}
                  />
                </div>

                {/* Day/Night POI — stessa struttura della pagina di riferimento
                    /minimal-time-daynight-integration: componente + lettura di
                    fase, avanzamento e stato. Qui è pilotato dal clock di questa
                    pagina, non dallo store globale. */}
                <div
                  className="flex items-center gap-5 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4"
                  data-testid="daynight-poi-panel"
                >
                  <DayNightPOI
                    isDayPhase={isDayPhase}
                    cycleProgress={cycleProgress}
                    isPaused={isPaused}
                    onTogglePause={() => setIsPaused((paused) => !paused)}
                  />
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/60">
                      Day/Night POI
                    </p>
                    <p>
                      Fase: <span className="text-slate-200">{isDayPhase ? 'Giorno' : 'Notte'}</span>
                    </p>
                    <p>
                      Ciclo:{' '}
                      <span className="text-slate-200">{Math.round(cycleProgress * 100)}%</span>
                    </p>
                    <p>
                      Stato:{' '}
                      <span className="text-slate-200">{isPaused ? 'In pausa' : 'In corso'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Attività:
                </label>
                <select
                  className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-ivory"
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                >
                  {ACTIVITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                {isQuestRunning && (
                  <button
                    type="button"
                    data-testid="quest-abandon-button"
                    onClick={handleAbandon}
                    className="rounded border border-rose-700/50 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200 transition-colors hover:bg-rose-900/40"
                  >
                    Interrompi quest
                  </button>
                )}
                <div className="ml-auto text-xs text-slate-400" data-testid="quest-countdown">
                  Countdown: {(elapsedMs / 1000).toFixed(1)}s / {(questDurationMs / 1000).toFixed(1)}s
                  {' · '}
                  Fasi: {phaseResults.filter(Boolean).length}/{questPhases.length}
                </div>
              </div>

              {/* items-start: the POI panel must not stretch to the roster's
                  height, or the medallion floats in a tall empty band. */}
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
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

                  {embarkResult && isConsequencesOpen && (
                    <EmbarkResultModal
                      result={embarkResult}
                      residentsById={residentsById}
                      onClose={() => setIsConsequencesOpen(false)}
                    />
                  )}
                </div>

                <StyleLabSurface className="poi-detail-surface" variant="panel">
                  <section className="poi-detail-stage">
                    <DroppablePoi
                      dropId={poiDropId}
                      questId={activity.id}
                      icon={activityIcon}
                      label={activity.label}
                      progress={activityProgress}
                      questStatus={
                        isQuestRunning
                          ? 'in_progress'
                          : embarkResult
                            ? embarkResult.outcome === 'fail' || embarkResult.outcome === 'deadly'
                              ? 'failed'
                              : 'completed'
                            : 'available'
                      }
                      phases={poiPhaseDots}
                      currentPhaseIndex={currentPhaseIndex}
                      isHaloComplete={isHaloComplete && (isQuestRunning || !!embarkResult)}
                      timeRemainingMs={Math.max(0, questDurationMs - elapsedMs)}
                      isExpirable={status === 'in-progress'}
                      // Rounded: the projection is a float and the badge would
                      // otherwise read "19.849999999999998%".
                      injuryRisk={Math.round(preview.projectedInjuryChance * 10) / 10}
                      deathRisk={Math.round(preview.projectedDeathChance * 10) / 10}
                      dangerRating={activity.dangerRating}
                      canAcceptDrop={freeSlots > 0 && status === 'idle'}
                      onClick={handlePoiClick}
                    />
                  </section>
                </StyleLabSurface>
              </div>
            </div>
          </div>

          {/*
            Detail and quest card open as a centred overlay: on this page the POI
            sits far down a tall column, and an inline panel would open partly
            off-screen. Once the expedition has left, the quest card takes the
            detail's place — the POI no longer offers slots to fill, it tells the
            story of what is happening out there.
          */}
          {(isDetailOpen || isQuestCardOpen) && (
            <div
              data-testid="poi-detail-overlay"
              className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:p-8"
              onClick={() => {
                setIsDetailOpen(false);
                setIsQuestCardOpen(false);
              }}
            >
              <div
                className="max-h-[92vh] w-full max-w-4xl overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                {isQuestCardOpen ? (
                  <QuestChronicle
                    title={activity.label}
                    questId={activity.id}
                    questTags={activity.tags}
                    phases={chroniclePhases}
                    currentPhaseIndex={currentPhaseIndex}
                    activePhaseProgress={questProgress}
                    questProgress={questProgress}
                    questDone={!!embarkResult}
                    outcome={
                      embarkResult
                        ? {
                            result:
                              embarkResult.outcome === 'fail' ||
                              embarkResult.outcome === 'deadly'
                                ? 'defeat'
                                : 'victory',
                            label: QUEST_OUTCOME_LABELS[embarkResult.outcome],
                            subLabel: `${phaseResults.filter(
                              (entry) => entry && isPassingVerdict(entry.verdict),
                            ).length}/${questPhases.length} fasi superate`,
                            icon: OUTCOME_CONFIG[embarkResult.outcome].icon,
                          }
                        : undefined
                    }
                    onCollect={embarkResult ? handleCollect : undefined}
                  />
                ) : (
                  <ActivityCapsuleDetailSkinAware {...detailProps} />
                )}
              </div>
            </div>
          )}

          {/* Milestone skill check — only rendered when the player is watching */}
          {activeMilestone && questPhases[activeMilestone.milestoneIndex] && (
            <MilestoneCheckModal
              phaseTitle={questPhases[activeMilestone.milestoneIndex].title}
              phaseIcon={questPhases[activeMilestone.milestoneIndex].icon}
              phaseSummary={questPhases[activeMilestone.milestoneIndex].copy?.summary}
              milestoneLabel={`${activeMilestone.milestoneIndex + 1} / ${questPhases.length}`}
              skills={buildSkillsForPhaseIndex(activeMilestone.milestoneIndex)}
              injuryChance={
                questPhases[activeMilestone.milestoneIndex].riskProfile?.injuryChance ?? 0
              }
              deathChance={
                questPhases[activeMilestone.milestoneIndex].riskProfile?.deathChance ?? 0
              }
              consumables={MOCK_QUEST_ITEMS}
              spentConsumableIds={milestoneConsumableIds}
              onToggleConsumable={(itemId) =>
                setMilestoneConsumableIds((prev) =>
                  prev.includes(itemId)
                    ? prev.filter((id) => id !== itemId)
                    : [...prev, itemId],
                )
              }
              onResolved={handleMilestoneResolved}
              onDismiss={() => setActiveMilestone(null)}
            />
          )}

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

export default PoiDetailQuestRosterTimeClockIntegrationPage;
