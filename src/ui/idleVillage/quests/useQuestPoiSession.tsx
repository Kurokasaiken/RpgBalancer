/**
 * useQuestPoiSession — the whole quest-POI session of
 * `/poi-quest-detail-roster-time-clock`, extracted from that page so any surface
 * (the reference page, the game-frame map) runs the same quest with one hook.
 *
 * Owns: activity selection, slot assignments and drop verdicts for the roster,
 * the quest clock (driven by the canonical time store's pause/speed), milestone
 * checks, outcome, rewards. Returns the values a surface needs to draw its own
 * POI and roster, plus `overlays` — the floating detail, quest card, skill check
 * and drag flight — to render once inside the surface's `DndContext`.
 *
 * Behaviour is unchanged from the page; see questPoiKit.md for the state machine.
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
import { useTranslation } from '@/localization/useTranslation';
import { getBloomStyle, type BloomState } from '@/ui/idleVillage/interaction/bloomEffect';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import {
  RosterDraggable,
  RosterKitShell,
  useRosterKitData,
  type RosterDropVerdict,
} from '@/ui/idleVillage/frozen/kits/rosterKit';
import type { GetResidentCompatibility } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { QuestPOI, type QuestPOIPhase } from '@/ui/idleVillage/frozen/kits/poiKit';
import {
  useMinimalGameplayWithIdleVillageConfig,
  useMinimalGameplayStore,
} from '@/store/useMinimalGameplay';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
import { MilestoneCheckModal } from '@/ui/idleVillage/components/MilestoneCheckModal';
import { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';
import {
  QuestRewardPanel,
  type QuestRewardPhaseLine,
  type QuestRewardLine,
  type QuestRewardPartyLine,
} from '@/ui/idleVillage/components/QuestRewardPanel';
import QuestChronicle, {
  type QuestChroniclePhase,
  type PhaseVisualState,
} from '@/ui/idleVillage/components/QuestChronicle';
import {
  useMilestoneEngine,
  type MilestoneEvent,
} from '@/ui/idleVillage/hooks/useMilestoneEngine';
import { questTotalDurationMs } from '@/balancing/config/idleVillage/quests/questTimeScale';
import {
  applyConsumableRiskEffects,
  buildAstrolabeSkillsForPhase,
  buildQuestMilestones,
  isPassingVerdict,
  resolveMilestoneWithoutAnimation,
  resolveQuestOutcomeTier,
  type AstrolabeResultShape,
  type QuestOutcomeTier,
} from '@/engine/game/idleVillage/questMilestones';
import {
  aliveMaskFromStates,
  buildSessionMissionInput,
  initialMemberStates,
  memberConsequencesFromStates,
  missionRunRewardMultiplier,
  resolveMissionPhase,
  rollPhaseMemberRisks,
  type MemberLifeState,
  type MemberRiskRoll,
} from '@/engine/game/idleVillage/missionResolver';
import {
  classifyTier,
  computeMissionPreview,
  type MissionPlannerInput,
  type MissionPreviewResult,
} from '@/engine/game/idleVillage/missionPlannerMath';
import {
  validateDraft,
  type MissionLaunchPayload,
  type MissionPlannerDraft,
  type PlannerLiveState,
} from '@/engine/game/idleVillage/missionPlannerDraft';
import type { LoadoutAssignment } from '@/engine/game/idleVillage/missionPlannerLoadout';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import type { QuestBlueprint } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import type {
  ActivityDetailSlotData,
  TelemetryEntry,
} from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import { buildStatRequirementRows } from '@/ui/idleVillage/utils/statRequirementDisplay';
import type { ResidentSlotBlueprint, ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import {
  DEFAULT_QUEST_POWER_RULES,
  calculatePartyPower,
  calculatePowerRatio,
  calculateQuestDifficulty,
  getOutcomeDistribution,
  type QuestOutcome,
  type QuestPowerResult,
} from '@/engine/game/idleVillage/QuestPowerEngine';
import { useQuestAssignmentPreview } from '@/ui/idleVillage/hooks/useQuestAssignmentPreview';
import { QuestAssignmentPreview } from '@/ui/idleVillage/components/QuestAssignmentPreview';
import { MOCK_QUEST_ITEMS, type QuestItemMock } from '@/balancing/config/idleVillage/quests/questItemsMock';

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

export type ActivityKind = 'job' | 'quest' | 'training' | 'maintenance';

export function getActivityKind(activity: ActivityDefinition): ActivityKind {
  if (activity.tags.includes('quest')) return 'quest';
  if (activity.tags.includes('training')) return 'training';
  if (activity.tags.includes('job')) return 'job';
  return (activity.cardKind as ActivityKind) ?? 'job';
}

export function getActivityIcon(activity: ActivityDefinition): string {
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

export const QUEST_OUTCOME_LABELS: Record<QuestOutcome, string> = {
  perfect: 'Perfetto',
  success: 'Successo',
  partial: 'Successo Parziale',
  fail: 'Fallimento',
  deadly: 'Disastro',
};

export const OUTCOME_CONFIG: Record<QuestOutcome, { icon: string; color: string; bg: string; border: string }> = {
  perfect: { icon: '★', color: 'text-amber-200', bg: 'bg-amber-950/40', border: 'border-amber-500/50' },
  success: { icon: '✓', color: 'text-emerald-200', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50' },
  partial: { icon: '~', color: 'text-sky-200', bg: 'bg-sky-950/40', border: 'border-sky-500/50' },
  fail: { icon: '✗', color: 'text-orange-200', bg: 'bg-orange-950/40', border: 'border-orange-500/50' },
  deadly: { icon: '☠', color: 'text-rose-200', bg: 'bg-rose-950/40', border: 'border-rose-600/60' },
};

export interface QuestPoiSessionOptions {
  /**
   * Element a resident flies to when dropped on the POI with the detail closed.
   * Defaults to the reference page's medallion.
   */
  poiFlightTargetSelector?: string;
  /** Publish `window.__idleVillageTestHooks` (e2e). Only one surface per screen should. */
  exposeTestHooks?: boolean;
  /** Activity the session starts on; defaults to `quest_city_rats`. */
  initialActivityId?: string;
  /**
   * How the floating detail is presented. Defaults keep the reference pages as they
   * were: centred, with the seeded telemetry log. A game screen passes its own.
   */
  detail?: {
    /** Top-left viewport coordinate; omitted = centred. */
    position?: { x: number; y: number };
    /** The scripted telemetry log is a developer aid, not player-facing. Default true. */
    showTelemetry?: boolean;
    /** Draw the window as the HUD plaque instead of the bronze surface. Default false. */
    hudSurface?: boolean;
  };
}

export function useQuestPoiSession({
  poiFlightTargetSelector = '.poi-detail-stage__medallion [role="button"]',
  exposeTestHooks = true,
  initialActivityId,
  detail: detailPresentation,
}: QuestPoiSessionOptions = {}) {
  const { t } = useTranslation('idleVillage');
  const { residentsById } = useRosterKitData();
  const { config: idleVillageConfig } = useIdleVillageConfig();

  // Time engine — canonical store (TimeEngine contract, §2.2 Gameplay Layer).
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const {
    state: gameState,
    tick,
    addResources,
    config,
  } = gameplay;
  const isPaused = gameState.isPaused;
  const speed = gameState.speedMultiplier;
  const isDayPhase = gameState.isDayPhase;
  const cycleProgress = gameState.cycleProgress;
  const currentTick = gameState.currentTick;
  const currentDay = gameState.currentDay;

  // Sync the canonical IdleVillage config into the store so tick() uses the
  // correct day/night cycle (config-first runtime, not a stale hydrated config).
  useEffect(() => {
    useMinimalGameplayStore.setState({ config });
  }, [config]);

  const defaultAssignments = {} as Record<string, string | null>;

  const ACTIVITIES = useMemo(
    () =>
      Object.values(idleVillageConfig.activities).filter(
        (a) => !a.tags.includes('test'),
      ),
    [idleVillageConfig.activities],
  );

  const DEFAULT_ACTIVITY = useMemo(
    () => idleVillageConfig.activities.quest_city_rats ?? ACTIVITIES[0],
    [idleVillageConfig.activities, ACTIVITIES],
  );

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    () =>
      (initialActivityId && idleVillageConfig.activities[initialActivityId]?.id) ??
      idleVillageConfig.activities.quest_city_rats?.id ??
      idleVillageConfig.activities.job_city_rats?.id ??
      ACTIVITIES[0]?.id ??
      '',
  );
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    defaultAssignments,
  );
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [questStartRequested, setQuestStartRequested] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>(mockTelemetry);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [embarkResult, setEmbarkResult] = useState<QuestPowerResult | null>(null);

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
  /**
   * Whether the open check has been collapsed to an icon. Minimising it means
   * "let fate decide": the phase resolves off-screen and the quest resumes.
   */
  const [isMilestoneMinimized, setIsMilestoneMinimized] = useState(false);
  /** Whether the quest card has replaced the POI detail. */
  const [isQuestCardOpen, setIsQuestCardOpen] = useState(false);
  /**
   * Whether the party-consequences panel is showing. Tracked separately from
   * `embarkResult` so dismissing the panel cannot discard the quest outcome
   * that the collect gate still depends on.
   */
  const [isConsequencesOpen, setIsConsequencesOpen] = useState(true);

  // -- MP-06: planner-aligned resolution state --------------------------------
  /**
   * The canonical `MissionPlannerInput` for the running quest — the same
   * object the Planner previewed at launch, so every check samples from the
   * distribution the player was shown. Null until the quest starts (or for
   * activities without a blueprint).
   */
  const [missionInput, setMissionInput] = useState<MissionPlannerInput | null>(null);
  /** Per-member `alive | injured | dead`, persisting across phases. */
  const [memberStates, setMemberStates] = useState<Record<string, MemberLifeState>>({});
  /** Mirror of `memberStates` for callbacks that run inside effects. */
  const memberStatesRef = useRef<Record<string, MemberLifeState>>({});
  /**
   * Phase index whose checkpoint is waiting for a continue/retreat decision
   * (D2); null while the run flows. Only set while the quest card is open —
   * an unobserved quest never stalls on a decision the player cannot see.
   */
  const [checkpointPhaseIndex, setCheckpointPhaseIndex] = useState<number | null>(null);
  /** Consumable item ids committed at launch — spent, not re-selectable. */
  const [consumedItemIds, setConsumedItemIds] = useState<string[]>([]);
  /** Launch payload parked while the clock is paused; fired on unpause. */
  const [pendingLaunchPayload, setPendingLaunchPayload] = useState<MissionLaunchPayload | null>(
    null,
  );
  /** Whether the run ended via a checkpoint retreat (telemetry/labels). */
  const [retreatedAtEnd, setRetreatedAtEnd] = useState(false);

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
    () => idleVillageConfig.questBlueprints?.[activity.id] ?? null,
    [activity.id, idleVillageConfig.questBlueprints],
  );
  const questPhases = useMemo(() => blueprint?.phases ?? [], [blueprint]);

  const questDurationMs = useMemo(
    () => questTotalDurationMs(questPhases, idleVillageConfig.questTimeScale),
    [questPhases, idleVillageConfig.questTimeScale],
  );
  /**
   * Duration the run actually plays on: the mission input folds equipment /
   * consumable duration deltas (e.g. `draft_horse`), the authored total is
   * the fallback for runs launched without a mission input.
   */
  const effectiveQuestDurationMs = missionInput?.duration ?? questDurationMs;
  const milestones = useMemo(
    () => buildQuestMilestones(effectiveQuestDurationMs, questPhases.length),
    [effectiveQuestDurationMs, questPhases.length],
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
      setQuestStartRequested(false);
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

  const poiDropId = useMemo(() => `job-poi-drop-${activity.id}`, [activity.id]);

  const questPowerRules = idleVillageConfig.globalRules.questPowerRules ?? DEFAULT_QUEST_POWER_RULES;

  const selectedItems = useMemo<QuestItemMock[]>(
    () => MOCK_QUEST_ITEMS.filter((item) => selectedItemIds.includes(item.id)),
    [selectedItemIds],
  );

  const preview = useQuestAssignmentPreview(activity, controller.slots, questPowerRules, selectedItems);

  const canEmbarkLocal = useMemo(
    () => controller.slots.every((slot) => !slot.required || slot.assignedResidentId),
    [controller.slots],
  );

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

  const getResidentCompatibility: GetResidentCompatibility = useCallback(
    (residentId: string) => {
      const slot = findAcceptingSlot(residentId);
      if (slot) return { state: 'valid', slotId: slot.id, slotLabel: slot.label };
      return { state: 'invalid', reason: 'Nessuno slot compatibile' };
    },
    [findAcceptingSlot],
  );

  const assignAnyResident = useCallback(() => {
    for (const slot of controller.slots) {
      if (slot.assignedResidentId) continue;
      const resident = Object.values(residentsById).find(
        (r) => !assignedIds.includes(r.id) && evaluateStatRequirement(r, slot.requirement).matches,
      );
      if (resident) {
        handleAssign(slot.id, resident.id);
        return resident.id;
      }
    }
    return null;
  }, [controller.slots, residentsById, assignedIds, handleAssign]);

  const fillRequiredResidentSlots = useCallback(() => {
    const usedResidentIds = new Set(assignedIds);
    const toAssign: Record<string, string> = {};
    for (const slot of controller.slots) {
      if (!slot.required || slot.assignedResidentId) continue;
      const resident = Object.values(residentsById).find(
        (r) => !usedResidentIds.has(r.id) && evaluateStatRequirement(r, slot.requirement).matches,
      );
      if (resident) {
        toAssign[slot.id] = resident.id;
        usedResidentIds.add(resident.id);
      }
    }
    const count = Object.keys(toAssign).length;
    if (count === 0) return 0;
    setAssignments((prev) => ({ ...prev, ...toAssign }));
    for (const [slotId, residentId] of Object.entries(toAssign)) {
      const resident = residentsById[residentId];
      addTelemetry(
        'assign',
        `${resident ? formatResidentLabel(resident) : residentId} → ${slotId}`,
      );
      trackTelemetryEvent('poi_detail_quest_roster_assign', { activityId: activity.id, slotId, residentId });
    }
    return count;
  }, [controller.slots, residentsById, assignedIds, addTelemetry, activity.id]);

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
        : document.querySelector(poiFlightTargetSelector);
      return { flightToSlot: { slotId: slot.id, element } };
    },
    [controller.slots, findAcceptingSlot, poiDropId, residentsById, assignedIds, isDetailOpen, poiFlightTargetSelector],
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

  const status: 'idle' | 'in-progress' | 'completed' | 'blocked' = isQuestRunning
    ? 'in-progress'
    : embarkResult
      ? 'completed'
      : 'idle';

  const canAcceptPoiDrop = useMemo(
    () => status === 'idle' && !!draggingResidentId && !!findAcceptingSlot(draggingResidentId),
    [status, draggingResidentId, findAcceptingSlot],
  );

  /**
   * True while a skill check is open and waiting for the player.
   *
   * This is what makes the phases resolve one at a time: quest time does not
   * advance while a check is on the table, so the next milestone can never be
   * crossed before the current one is settled. Minimising the panel drops the
   * wait — see the auto-resolve effect below.
   */
  const isCheckAwaiting =
    (activeMilestone !== null && !isMilestoneMinimized) || checkpointPhaseIndex !== null;

  /**
   * Countdown loop. The cadence is fixed and the clock's speed multiplier
   * scales the increment, so ×8 really advances the quest eight times faster;
   * pausing the clock freezes the inscription mid-word.
   */
  useEffect(() => {
    if (!isQuestRunning || isPaused || isCheckAwaiting) return;
    const countdown = setInterval(() => {
      setElapsedMs((prev) =>
        Math.min(prev + COUNTDOWN_TICK_MS * speed, effectiveQuestDurationMs),
      );
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(countdown);
  }, [isQuestRunning, isPaused, isCheckAwaiting, speed, effectiveQuestDurationMs]);

  const partyResidents = useMemo(
    () =>
      controller.slots
        .filter((slot) => slot.assignedResident)
        .map((slot) => slot.assignedResident!),
    [controller.slots],
  );

  /**
   * Members still in the living set S, with effective stats (MP-03 loadout
   * deltas are already folded into `member.stats` by `buildMissionInput`).
   * Dead members are excluded — their stats no longer feed later checks —
   * while injured members keep rolling (spec §4.1).
   */
  const livingPartyResidents = useMemo(() => {
    if (!missionInput) return partyResidents;
    return missionInput.members
      .filter((member) => memberStates[member.residentId] !== 'dead')
      .map((member) => {
        const base = residentsById[member.residentId];
        return base ? ({ ...base, statSnapshot: member.stats } as ResidentState) : null;
      })
      .filter((resident): resident is ResidentState => !!resident);
  }, [missionInput, memberStates, partyResidents, residentsById]);

  /**
   * Builds the astrolabe input for one phase from the authored quest data and
   * the party currently in the slots.
   */
  const buildSkillsForPhaseIndex = useCallback(
    (phaseIndex: number) => {
      const phase = questPhases[phaseIndex];
      if (!phase) return [];
      return buildAstrolabeSkillsForPhase(
        {
          phase,
          residents: livingPartyResidents,
          blueprintDifficulty: blueprint?.difficulty,
        },
        idleVillageConfig.questSkillCheckConfig,
      );
    },
    [questPhases, livingPartyResidents, blueprint?.difficulty, idleVillageConfig.questSkillCheckConfig],
  );

  /**
   * Finalises the run — natural completion, checkpoint retreat (D2) or wipe.
   *
   * Party consequences come from the per-member risk rolls the phases
   * actually produced (`memberStates`), not from a second outcome-keyed risk
   * model: MP-06 migrated the quest flow off `resolvePartyConsequences`.
   * `wiped` forces `deadly` even when earlier phases were won (spec §4.3).
   */
  const finalizeQuestRun = useCallback(
    (opts: {
      results: readonly (AstrolabeResultShape | null)[];
      states: Record<string, MemberLifeState>;
      retreated: boolean;
    }) => {
      const { results, states, retreated } = opts;
      const resolved = results.filter((entry): entry is AstrolabeResultShape => !!entry);
      const passed = resolved.filter((entry) => isPassingVerdict(entry.verdict)).length;
      const wiped =
        missionInput !== null &&
        missionInput.members.length > 0 &&
        missionInput.members.every((m) => states[m.residentId] === 'dead');
      const outcome = resolveQuestOutcomeTier(results, { wiped });

      // The power roll still supplies the display fields (party power, ratio,
      // distribution); outcome and consequences come from the sampled run.
      const partyPower = calculatePartyPower(partyResidents, questPowerRules);
      const questLevel = typeof activity.level === 'number' ? activity.level : 1;
      const dangerRating =
        typeof activity.dangerRating === 'number' ? activity.dangerRating : 0;
      const questDifficulty = calculateQuestDifficulty(
        questLevel,
        dangerRating,
        questPowerRules,
      );
      const powerRatio = calculatePowerRatio(partyPower, questDifficulty);
      const distribution = getOutcomeDistribution(powerRatio, questPowerRules);
      const consequences = missionInput
        ? memberConsequencesFromStates(
            Object.fromEntries(
              missionInput.members.map((m) => [m.residentId, states[m.residentId] ?? 'alive']),
            ),
          )
        : [];
      const rewardMultiplier = missionInput
        ? missionRunRewardMultiplier(missionInput, outcome)
        : (questPowerRules.rewardMultipliers[outcome] ?? 1);

      const result: QuestPowerResult = {
        partyPower,
        questDifficulty,
        powerRatio,
        distribution,
        outcome,
        rewardMultiplier,
        consequences,
      };
      setEmbarkResult(result);
      setIsQuestRunning(false);
      setCheckpointPhaseIndex(null);
      setRetreatedAtEnd(retreated);
      addTelemetry(
        'done',
        retreated
          ? `Quest ${activity.label} — ritiro dopo ${passed}/${questPhases.length} fasi superate`
          : `Quest ${activity.label} conclusa — ${passed}/${questPhases.length} fasi superate`,
      );
      trackTelemetryEvent('quest_completed', {
        activityId: activity.id,
        phasesPassed: passed,
        phasesTotal: questPhases.length,
        outcome: result.outcome,
        retreated,
        wiped,
      });
    },
    [
      missionInput,
      partyResidents,
      questPowerRules,
      activity,
      questPhases.length,
      addTelemetry,
    ],
  );

  /**
   * Records one resolved phase — verdict plus the per-member risk rolls that
   * decide who stays in the living set (MP-06). Dead members leave S for
   * later phases; injured members keep rolling. Then the run either wipes
   * (→ `deadly`), or, when more phases remain and the quest card is open,
   * pauses on a checkpoint waiting for the player's continue/retreat call.
   */
  const recordResolvedPhase = useCallback(
    (phaseIndex: number, result: AstrolabeResultShape, memberRolls: MemberRiskRoll[]) => {
      const nextResults = [...phaseResults];
      nextResults[phaseIndex] = result;
      setPhaseResults(nextResults);

      const nextStates = { ...memberStatesRef.current };
      memberRolls.forEach((rollEntry) => {
        if (rollEntry.dead) {
          nextStates[rollEntry.residentId] = 'dead';
        } else if (rollEntry.wounded && nextStates[rollEntry.residentId] !== 'dead') {
          nextStates[rollEntry.residentId] = 'injured';
        }
      });
      memberStatesRef.current = nextStates;
      setMemberStates(nextStates);

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

      const wiped =
        missionInput !== null &&
        missionInput.members.length > 0 &&
        missionInput.members.every((m) => nextStates[m.residentId] === 'dead');
      if (wiped) {
        finalizeQuestRun({ results: nextResults, states: nextStates, retreated: false });
      } else if (phaseIndex < questPhases.length - 1 && isQuestCardOpen) {
        setCheckpointPhaseIndex(phaseIndex);
      }
    },
    [
      phaseResults,
      questPhases,
      missionInput,
      isQuestCardOpen,
      finalizeQuestRun,
      addTelemetry,
      activity.id,
    ],
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
    if (milestoneQueue.length === 0 || activeMilestone || checkpointPhaseIndex !== null) return;
    const [next, ...rest] = milestoneQueue;

    if (isQuestCardOpen) {
      setMilestoneQueue(rest);
      setMilestoneConsumableIds([]);
      setActiveMilestone(next);
      return;
    }

    if (missionInput && next.milestoneIndex < missionInput.phases.length) {
      // Planner-aligned path: weakest-tag check + a risk roll per living
      // member, sampled from the same model the Planner displayed (MP-06).
      const resolved = resolveMissionPhase(
        missionInput,
        next.milestoneIndex,
        aliveMaskFromStates(missionInput, memberStatesRef.current),
        idleVillageConfig.questSkillCheckConfig,
      );
      setMilestoneQueue(rest);
      recordResolvedPhase(
        next.milestoneIndex,
        {
          verdict: resolved.verdict,
          roll: resolved.roll,
          riskRoll: resolved.memberRolls[0]?.riskRoll ?? 0,
          skillIndex: 0,
          skillName: resolved.skillTag ?? '',
          wounded: resolved.memberRolls.some((r) => r.wounded),
          dead: resolved.memberRolls.some((r) => r.dead),
        },
        resolved.memberRolls,
      );
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
    recordResolvedPhase(
      next.milestoneIndex,
      resolveMilestoneWithoutAnimation({ skills, risk }, idleVillageConfig.questSkillCheckConfig),
      [],
    );
  }, [
    milestoneQueue,
    activeMilestone,
    checkpointPhaseIndex,
    isQuestCardOpen,
    missionInput,
    questPhases,
    buildSkillsForPhaseIndex,
    recordResolvedPhase,
    idleVillageConfig.questSkillCheckConfig,
  ]);

  /**
   * The inscription has closed. The halo stops and pulses, and the combined
   * outcome is computed from the phases that actually resolved — a single
   * failed phase does not abort the run, it only weighs on the total.
   */
  useEffect(() => {
    if (!isQuestRunning || elapsedMs < effectiveQuestDurationMs) return;
    if (milestoneQueue.length > 0 || activeMilestone || checkpointPhaseIndex !== null) return;

    const resolved = phaseResults.filter((entry): entry is AstrolabeResultShape => !!entry);
    if (resolved.length < questPhases.length) return;

    finalizeQuestRun({ results: phaseResults, states: memberStatesRef.current, retreated: false });
  }, [
    isQuestRunning,
    elapsedMs,
    effectiveQuestDurationMs,
    milestoneQueue.length,
    activeMilestone,
    checkpointPhaseIndex,
    phaseResults,
    questPhases.length,
    finalizeQuestRun,
  ]);

  /**
   * Minimising an unresolved check hands the phase to fate: it resolves
   * off-screen, exactly as it would with the card closed, and quest time starts
   * flowing again. An already-resolved check is left alone.
   */
  useEffect(() => {
    if (!activeMilestone || !isMilestoneMinimized) return;
    const index = activeMilestone.milestoneIndex;
    if (phaseResults[index]) {
      setActiveMilestone(null);
      setIsMilestoneMinimized(false);
      return;
    }
    if (missionInput && index < missionInput.phases.length) {
      const resolved = resolveMissionPhase(
        missionInput,
        index,
        aliveMaskFromStates(missionInput, memberStatesRef.current),
        idleVillageConfig.questSkillCheckConfig,
      );
      recordResolvedPhase(
        index,
        {
          verdict: resolved.verdict,
          roll: resolved.roll,
          riskRoll: resolved.memberRolls[0]?.riskRoll ?? 0,
          skillIndex: 0,
          skillName: resolved.skillTag ?? '',
          wounded: resolved.memberRolls.some((r) => r.wounded),
          dead: resolved.memberRolls.some((r) => r.dead),
        },
        resolved.memberRolls,
      );
      setActiveMilestone(null);
      setIsMilestoneMinimized(false);
      return;
    }

    const phase = questPhases[index];
    const spent = MOCK_QUEST_ITEMS.filter((item) => milestoneConsumableIds.includes(item.id));
    const risk = applyConsumableRiskEffects(
      {
        injuryChance: phase?.riskProfile?.injuryChance ?? 0,
        deathChance: phase?.riskProfile?.deathChance ?? 0,
      },
      spent,
    );
    recordResolvedPhase(
      index,
      resolveMilestoneWithoutAnimation(
        { skills: buildSkillsForPhaseIndex(index), risk },
        idleVillageConfig.questSkillCheckConfig,
      ),
      [],
    );
    setActiveMilestone(null);
    setIsMilestoneMinimized(false);
  }, [
    activeMilestone,
    isMilestoneMinimized,
    phaseResults,
    idleVillageConfig.questSkillCheckConfig,
    questPhases,
    milestoneConsumableIds,
    buildSkillsForPhaseIndex,
    recordResolvedPhase,
    missionInput,
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
    setIsMilestoneMinimized(false);
    setAssignments({});
    setSelectedItemIds([]);
    setMissionInput(null);
    memberStatesRef.current = {};
    setMemberStates({});
    setCheckpointPhaseIndex(null);
    setConsumedItemIds([]);
    setPendingLaunchPayload(null);
    setRetreatedAtEnd(false);
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
    setIsMilestoneMinimized(false);
    setAssignments({});
    setTelemetry(mockTelemetry);
    setIsDetailOpen(false);
    setSelectedItemIds([]);
    setMissionInput(null);
    memberStatesRef.current = {};
    setMemberStates({});
    setCheckpointPhaseIndex(null);
    setConsumedItemIds([]);
    setPendingLaunchPayload(null);
    setRetreatedAtEnd(false);
  }, [selectedActivityId]);

  const questProgress =
    effectiveQuestDurationMs > 0 ? Math.min(1, elapsedMs / effectiveQuestDurationMs) : 0;
  const isHaloComplete = questProgress >= 1;
  const activityProgress = isQuestRunning || embarkResult ? questProgress : 0;
  // Numeric fields stay in seconds; the display strings are formatted from
  // milliseconds, because formatSeconds reads anything under 60 as raw ms.
  const duration = Math.round(effectiveQuestDurationMs / 1000);
  const elapsed = Math.floor(duration * activityProgress);
  const remaining = duration - elapsed;
  const remainingMs = Math.max(0, effectiveQuestDurationMs - elapsedMs);

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

  /** Trials recap for the reward surface. */
  const rewardPhaseLines = useMemo<QuestRewardPhaseLine[]>(
    () =>
      questPhases.map((phase, index) => {
        const result = phaseResults[index];
        return {
          id: phase.id,
          title: phase.title,
          icon: phase.icon,
          passed: !!result && isPassingVerdict(result.verdict),
          verdictLabel: result?.verdict,
          wounded: result?.wounded,
          dead: result?.dead,
        };
      }),
    [questPhases, phaseResults],
  );

  /** Rewards earned, with the outcome multiplier already applied. */
  const rewardLines = useMemo<QuestRewardLine[]>(() => {
    const multiplier = embarkResult?.rewardMultiplier ?? 1;
    return (activity.rewards ?? []).map((reward) => {
      const base = Number(reward.amountFormula);
      const amount = Number.isFinite(base)
        ? `+${Math.round(base * multiplier * 10) / 10}`
        : `+${reward.amountFormula}`;
      return { id: reward.resourceId, label: reward.resourceId, amount };
    });
  }, [activity.rewards, embarkResult?.rewardMultiplier]);

  /** Fate of each party member, from the engine's consequences. */
  const rewardPartyLines = useMemo<QuestRewardPartyLine[]>(
    () =>
      (embarkResult?.consequences ?? []).map((consequence) => {
        const resident = residentsById[consequence.residentId];
        return {
          residentId: consequence.residentId,
          name: resident ? formatResidentLabel(resident) : consequence.residentId,
          state:
            consequence.consequence === 'dead'
              ? 'dead'
              : consequence.consequence === 'injured'
                ? 'injured'
                : 'none',
        };
      }),
    [embarkResult?.consequences, residentsById],
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
      const isAssigned = !!resident || Boolean(slot.assignedResidentId);
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
  }, [controller.slots, activityProgress, assignments]);

  const requirementRows = useMemo(
    () => buildStatRequirementRows(activity.statRequirement),
    [activity],
  );

  /**
   * Launches the expedition. Starting a quest does not resolve it: the clock
   * begins, the inscription starts writing, and the outcome is assembled from
   * the milestone checks that follow.
   *
   * MP-06: when a validated planner `payload` is provided, its party/loadouts/
   * consumables replace the page-level selection; either way the run builds
   * the same `MissionPlannerInput` the Planner displayed, so every check
   * samples from that distribution. Consumables are committed at launch and
   * cannot be re-selected mid-run.
   */
  const startQuest = useCallback(
    (payload?: MissionLaunchPayload) => {
      const launchAssignments: Record<string, string> = payload
        ? Object.fromEntries(payload.party.map((member) => [member.slotId, member.residentId]))
        : Object.fromEntries(
            Object.entries(assignments).filter(([, v]) => !!v),
          ) as Record<string, string>;
      const launchLoadouts: Record<string, LoadoutAssignment> = payload
        ? Object.fromEntries(payload.party.map((member) => [member.residentId, member.loadout]))
        : {};
      // Legacy launch: the pre-selected quest items become the consumable pool.
      const launchConsumables = payload
        ? payload.consumables
        : selectedItemIds.map((itemId) => ({ itemId, qty: 1 }));

      const plannerBlueprint = defaultQuestBlueprints[activity.id];
      if (plannerBlueprint) {
        const input = buildSessionMissionInput({
          slotBlueprints: slotBlueprints ?? [],
          assignments: launchAssignments,
          loadouts: launchLoadouts,
          consumables: launchConsumables,
          residentsById,
          blueprint: plannerBlueprint as QuestBlueprint,
          rewardMultipliers: questPowerRules.rewardMultipliers,
          config: idleVillageConfig.questSkillCheckConfig,
        });
        setMissionInput(input);
        const states = initialMemberStates(input);
        memberStatesRef.current = states;
        setMemberStates(states);
      }

      if (payload) setAssignments(launchAssignments);
      setConsumedItemIds(launchConsumables.map((c) => c.itemId));
      setRetreatedAtEnd(false);
      setCheckpointPhaseIndex(null);

      setElapsedMs(0);
      setPhaseResults([]);
      setMilestoneQueue([]);
      setActiveMilestone(null);
      resetMilestones();
      setIsQuestRunning(true);
      // The detail's job is done the moment the expedition leaves: hand the
      // open panel over to the quest card — a planner launch does the same,
      // so whoever embarked keeps watching the same POI and its checks.
      if (isDetailOpen || payload) {
        setIsDetailOpen(false);
        setIsQuestCardOpen(true);
      }
      addTelemetry('start', `Quest ${activity.label} avviata — ${questPhases.length} fasi`);
      trackTelemetryEvent('poi_detail_quest_roster_start', {
        activityId: activity.id,
        phasesTotal: questPhases.length,
        durationMs: effectiveQuestDurationMs,
        fromPlanner: !!payload,
      });
    },
    [
      isDetailOpen,
      resetMilestones,
      activity.label,
      activity.id,
      questPhases.length,
      effectiveQuestDurationMs,
      addTelemetry,
      assignments,
      selectedItemIds,
      slotBlueprints,
      residentsById,
      questPowerRules.rewardMultipliers,
      idleVillageConfig.questSkillCheckConfig,
    ],
  );

  /**
   * Planner launch (MP-06): the payload was validated atomically by MP-04
   * (`buildLaunchPayload`), but the live roster may have changed since — the
   * domain contract is re-checked here before the run commits. UI rejection
   * alone would leave a stale payload sail through.
   * @returns true when the run was started (or queued behind a paused clock)
   */
  const startQuestWithPayload = useCallback(
    (payload: MissionLaunchPayload): boolean => {
      if (isQuestRunning) return false;
      const live: PlannerLiveState = {
        residentsById,
        slots: (slotBlueprints ?? []).map((s) => ({
          id: s.id,
          required: s.required,
          emptyPenalty: s.emptyPenalty,
          residentRiskModifiers: s.residentRiskModifiers,
        })),
        itemCatalog: defaultQuestItems,
      };
      const draft: MissionPlannerDraft = {
        assignments: Object.fromEntries(
          payload.party.map((member) => [member.slotId, member.residentId]),
        ),
        loadouts: Object.fromEntries(
          payload.party.map((member) => [member.residentId, member.loadout]),
        ),
        consumables: Object.fromEntries(payload.consumables.map((c) => [c.itemId, c.qty])),
      };
      const validation = validateDraft(draft, live, idleVillageConfig.questSkillCheckConfig);
      if (!validation.canEmbark) {
        trackTelemetryEvent('mission_launch_rejected', {
          activityId: activity.id,
          reasons: validation.issues.map((issue) => issue.reason),
        });
        return false;
      }
      if (isPaused) {
        setPendingLaunchPayload(payload);
        setQuestStartRequested(true);
        return true;
      }
      startQuest(payload);
      return true;
    },
    [
      isQuestRunning,
      isPaused,
      residentsById,
      slotBlueprints,
      idleVillageConfig.questSkillCheckConfig,
      activity.id,
      startQuest,
    ],
  );

  const handleEmbark = useCallback(() => {
    if (!canEmbarkLocal || isQuestRunning) return;
    if (isPaused) {
      setQuestStartRequested(true);
      return;
    }
    startQuest();
  }, [
    canEmbarkLocal,
    isQuestRunning,
    isPaused,
    startQuest,
  ]);

  /** Checkpoint (D2): the party pushes on to the next phase. */
  const handleCheckpointContinue = useCallback(() => {
    setCheckpointPhaseIndex(null);
    trackTelemetryEvent('quest_checkpoint_continue', {
      activityId: activity.id,
      phaseIndex: checkpointPhaseIndex,
    });
  }, [activity.id, checkpointPhaseIndex]);

  /**
   * Checkpoint (D2): the party pulls out. The run closes on the phases
   * actually played — the tier still needs at least half of them passed —
   * keeping every effect those phases produced.
   */
  const handleCheckpointRetreat = useCallback(() => {
    if (checkpointPhaseIndex === null) return;
    addTelemetry('detach', `Ritiro dalla quest ${activity.label} dopo la fase ${checkpointPhaseIndex + 1}`);
    trackTelemetryEvent('quest_checkpoint_retreat', {
      activityId: activity.id,
      phaseIndex: checkpointPhaseIndex,
    });
    finalizeQuestRun({
      results: phaseResults,
      states: memberStatesRef.current,
      retreated: true,
    });
  }, [checkpointPhaseIndex, activity.id, activity.label, phaseResults, finalizeQuestRun, addTelemetry]);

  /**
   * Checkpoint preview (D2) — the two options get two different previews:
   *
   * - CONTINUE re-runs the exact DP on the REMAINING phases with the members
   *   still alive (injured keep rolling, dead are out) — the quest-total
   *   forecast for what is left, not a copy of the phase just resolved.
   * - RETREAT is deterministic: the tier `classifyTier` assigns to the phases
   *   already played.
   */
  const checkpointContinuePreview = useMemo<MissionPreviewResult | null>(() => {
    if (checkpointPhaseIndex === null || !missionInput) return null;
    const remainingPhases = missionInput.phases.slice(checkpointPhaseIndex + 1);
    const aliveMembers = missionInput.members.filter(
      (m) => memberStates[m.residentId] !== 'dead',
    );
    if (remainingPhases.length === 0 || aliveMembers.length === 0) return null;
    return computeMissionPreview({ ...missionInput, phases: remainingPhases, members: aliveMembers });
  }, [checkpointPhaseIndex, missionInput, memberStates]);

  const checkpointRetreatTier = useMemo<QuestOutcomeTier | null>(() => {
    if (checkpointPhaseIndex === null) return null;
    const played = phaseResults.slice(0, checkpointPhaseIndex + 1).filter(Boolean);
    const passed = played.filter((r) => isPassingVerdict(r.verdict)).length;
    const anyDeath = Object.values(memberStates).some((s) => s === 'dead');
    return classifyTier(passed, played.length, anyDeath);
  }, [checkpointPhaseIndex, phaseResults, memberStates]);

  /** Records the verdict the player just watched and closes the check. */
  const handleMilestoneResolved = useCallback(
    (result: AstrolabeResultShape) => {
      if (!activeMilestone) return;
      const index = activeMilestone.milestoneIndex;
      // The astrolabe supplies the verdict; the per-member risk rolls come
      // from the planner model so dead members really leave later checks.
      const { rolls } =
        missionInput && index < missionInput.phases.length
          ? rollPhaseMemberRisks(
              missionInput,
              index,
              aliveMaskFromStates(missionInput, memberStatesRef.current),
            )
          : { rolls: [] as MemberRiskRoll[] };
      recordResolvedPhase(
        index,
        {
          ...result,
          wounded: result.wounded || rolls.some((r) => r.wounded),
          dead: result.dead || rolls.some((r) => r.dead),
        },
        rolls,
      );
    },
    [activeMilestone, missionInput, recordResolvedPhase],
  );

  const questStateRef = useRef({
    isQuestRunning,
    isPaused,
    isDayPhase,
    cycleProgress,
    currentTick,
    elapsedMs,
    isQuestCardOpen,
    embarkResult,
    activeMilestone,
  });
  const gameStateRef = useRef(gameState);
  const assignmentsRef = useRef(assignments);

  useEffect(() => {
    questStateRef.current = {
      isQuestRunning,
      isPaused,
      isDayPhase,
      cycleProgress,
      currentTick,
      elapsedMs,
      isQuestCardOpen,
      embarkResult,
      activeMilestone,
    };
    gameStateRef.current = gameState;
  }, [isQuestRunning, isPaused, isDayPhase, cycleProgress, currentTick, elapsedMs, isQuestCardOpen, embarkResult, activeMilestone, gameState]);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  const resolveActiveMilestone = useCallback(
    (verdict: 'win' | 'bigwin' | 'almost' | 'fail' | 'deadly' = 'win') => {
      if (!activeMilestone) return false;
      handleMilestoneResolved({ verdict, wounded: false, dead: false } as AstrolabeResultShape);
      setActiveMilestone(null);
      return true;
    },
    [activeMilestone, handleMilestoneResolved],
  );

  useEffect(() => {
    if (questStartRequested && !isPaused && canEmbarkLocal) {
      setQuestStartRequested(false);
      const payload = pendingLaunchPayload;
      setPendingLaunchPayload(null);
      startQuest(payload ?? undefined);
    }
  }, [questStartRequested, isPaused, canEmbarkLocal, pendingLaunchPayload, startQuest]);

  useEffect(() => {
    if (!exposeTestHooks) return;
    (window as any).__idleVillageTestHooks = {
      ...((window as any).__idleVillageTestHooks ?? {}),
      assignResident: (residentId: string) => {
        const slot0 = controller.slots.find((s) => (s.id ?? '').endsWith('slot0') && !s.assignedResidentId);
        const slot = slot0 ?? findAcceptingSlot(residentId) ?? controller.slots.find((s) => !s.assignedResidentId) ?? null;
        if (slot) {
          handleAssign(slot.id, residentId);
          return residentId;
        }
        return null;
      },
      assignAnyResident,
      fillRequiredResidentSlots,
      resolveActiveMilestone,
      findAcceptingSlot,
      getResidentCompatibility,
      setDraggingResidentId,
      getDraggingResidentId: () => draggingResidentId,
      openPoiDetail: () => setIsDetailOpen(true),
      getSlotAssignments: () =>
        controller.slots.map((s) => ({ id: s.id, assignedResidentId: s.assignedResidentId })),
      getQuestState: () => ({
        ...questStateRef.current,
        questStartRequested,
        memberStates: memberStatesRef.current,
        checkpointPhaseIndex,
      }),
      getVillageResources: () => ({
        gold: gameStateRef.current.gold,
        food: gameStateRef.current.food,
        wood: gameStateRef.current.wood,
        xp: gameStateRef.current.xp,
      }),
      getPageFlight: () => pageFlight,
      getAssignments: () => assignmentsRef.current,
      getSelectedActivityId: () => selectedActivityId,
      setSelectedActivityId: (id: string) => {
        if (ACTIVITIES.some((a) => a.id === id)) {
          setSelectedActivityId(id);
          return true;
        }
        return false;
      },
      getAvailableActivityIds: () => ACTIVITIES.map((a) => a.id),
      getActivityInfo: (id: string) => {
        const a = ACTIVITIES.find((x) => x.id === id);
        if (!a) return null;
        return { id: a.id, label: a.label, kind: getActivityKind(a) };
      },
    };
  }, [assignAnyResident, fillRequiredResidentSlots, resolveActiveMilestone, findAcceptingSlot, getResidentCompatibility, setDraggingResidentId, handleAssign, controller, setIsDetailOpen, draggingResidentId, pageFlight, selectedActivityId, ACTIVITIES, setSelectedActivityId, questStartRequested, exposeTestHooks]);

  /**
   * Collects the rewards: the party returns to the roster, the inscription
   * dissolves and the POI goes back to its pre-assignment state. Rewards apply
   * only here, so an uncollected quest still holds its prize.
   */
  const handleCollect = useCallback(() => {
    const bundle: Partial<Record<string, number>> = {};
    for (const line of rewardLines) {
      const raw = line.amount.replace(/^\+/, '');
      const amount = Number(raw);
      if (Number.isFinite(amount) && amount > 0) {
        bundle[line.id] = (bundle[line.id] ?? 0) + amount;
      }
    }
    if (Object.keys(bundle).length > 0) {
      addResources(bundle as Partial<Record<'gold' | 'food' | 'wood' | 'xp', number>>);
    }
    addTelemetry('done', `Ricompense di ${activity.label} raccolte`);
    trackTelemetryEvent('quest_rewards_collected', {
      activityId: activity.id,
      outcome: embarkResult?.outcome,
      bundle,
    });
    resetQuestRun();
  }, [activity.label, activity.id, embarkResult?.outcome, rewardLines, addResources, addTelemetry, resetQuestRun]);

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
      onClose: () => {
        setIsDetailOpen(false);
      },
      showTelemetry: detailPresentation?.showTelemetry ?? true,
      position: detailPresentation?.position,
      hudSurface: detailPresentation?.hudSurface ?? false,
      showSlots: true,
      showInfo: true,
      compact: false,
      pillar: 'wilderness' as const,
      dataTestId: 'poi-detail-wrapper-test',
      poiIcon: activityIcon,
      ariaLabel: `POI Detail: ${activity.label}`,
      ariaLive: 'polite' as const,
      enableDevTools: true,
      startDisabled: !canEmbarkLocal || status === 'in-progress',
      startPending: questStartRequested,
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
      canEmbarkLocal,
      questStartRequested,
      handleEmbark,
      detailPresentation?.showTelemetry,
      detailPresentation?.hudSurface,
      detailPresentation?.position?.x,
      detailPresentation?.position?.y,
    ],
  );


  const questStatus: 'available' | 'in_progress' | 'completed' | 'failed' = isQuestRunning
    ? 'in_progress'
    : embarkResult
      ? embarkResult.outcome === 'fail' || embarkResult.outcome === 'deadly'
        ? 'failed'
        : 'completed'
      : 'available';

  const lockedResidentIds = useMemo(
    () => [...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])],
    [assignedIds, flyingResidentId],
  );

  const overlays = (
    <>
    {/*
      Detail and quest card are floating panels, not modals: movable,
      minimisable, and they leave the rest of the surface usable. Once the
      expedition has left, the quest card takes the detail's place — the
      POI no longer offers slots to fill, it tells the story of what is
      happening out there.
    */}
    {isDetailOpen && !isQuestCardOpen && (
      <ActivityCapsuleDetailSkinAware {...detailProps} />
    )}

    {isQuestCardOpen && (
      <FloatingPanel
        panelId="quest-card"
        title={
          embarkResult
            ? t('idleVillage:questReward.panelTitle', { defaultValue: 'Rewards' })
            : activity.label
        }
        icon={embarkResult ? '🏆' : activityIcon}
        width={embarkResult ? 620 : 860}
        initialPosition={{ x: 180, y: 70 }}
        onClose={() => setIsQuestCardOpen(false)}
      >
        {embarkResult ? (
          <QuestRewardPanel
            questTitle={activity.label}
            isVictory={
              embarkResult.outcome !== 'fail' && embarkResult.outcome !== 'deadly'
            }
            outcomeLabel={QUEST_OUTCOME_LABELS[embarkResult.outcome]}
            phasesPassed={
              phaseResults.filter((entry) => entry && isPassingVerdict(entry.verdict)).length
            }
            phasesTotal={questPhases.length}
            phases={rewardPhaseLines}
            rewards={rewardLines}
            rewardMultiplier={embarkResult.rewardMultiplier}
            party={rewardPartyLines}
            onCollect={handleCollect}
          />
        ) : (
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
              onCollect={undefined}
            />
        )}
      </FloatingPanel>
    )}

    {/*
      Milestone skill check — a floating panel like the others. Minimising
      it hands the phase over to fate: the check resolves off-screen and
      the quest clock, which waits while the panel is open, resumes.
    */}
    {activeMilestone && questPhases[activeMilestone.milestoneIndex] && (
      <FloatingPanel
        panelId="milestone-check"
        title={`${questPhases[activeMilestone.milestoneIndex].title} · ${
          activeMilestone.milestoneIndex + 1
        }/${questPhases.length}`}
        icon={questPhases[activeMilestone.milestoneIndex].icon ?? '🎲'}
        width={720}
        initialPosition={{ x: 300, y: 60 }}
        isMinimized={isMilestoneMinimized}
        onMinimizedChange={setIsMilestoneMinimized}
        onClose={() => setActiveMilestone(null)}
      >
        <MilestoneCheckModal
          phaseTitle={questPhases[activeMilestone.milestoneIndex].title}
          phaseIcon={questPhases[activeMilestone.milestoneIndex].icon}
          phaseSummary={questPhases[activeMilestone.milestoneIndex].copy?.summary}
          milestoneLabel={`${activeMilestone.milestoneIndex + 1} / ${questPhases.length}`}
          skills={buildSkillsForPhaseIndex(activeMilestone.milestoneIndex)}
          injuryChance={
            applyConsumableRiskEffects(
              {
                injuryChance:
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.injuryChance ?? 0,
                deathChance:
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.deathChance ?? 0,
              },
              (missionInput?.consumables ?? []).map((c) => ({
                effect: {
                  injuryChanceDelta: c.injuryChanceDelta,
                  deathChanceDelta: c.deathChanceDelta,
                },
              })),
            ).injuryChance
          }
          deathChance={
            applyConsumableRiskEffects(
              {
                injuryChance:
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.injuryChance ?? 0,
                deathChance:
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.deathChance ?? 0,
              },
              (missionInput?.consumables ?? []).map((c) => ({
                effect: {
                  injuryChanceDelta: c.injuryChanceDelta,
                  deathChanceDelta: c.deathChanceDelta,
                },
              })),
            ).deathChance
          }
          criticalFailChance={
            100 - idleVillageConfig.questSkillCheckConfig.backgroundResolution.epicFailThreshold + 1
          }
          consumables={MOCK_QUEST_ITEMS.filter((item) => !consumedItemIds.includes(item.id))}
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
      </FloatingPanel>
    )}

    {/*
      Phase checkpoint (D2): while the player watches, the run pauses after
      each phase for a continue/retreat call. Retreating closes the quest on
      the phases already played.
    */}
    {checkpointPhaseIndex !== null && !embarkResult && (
      <FloatingPanel
        panelId="quest-checkpoint"
        title={t('idleVillage:questCheckpoint.title', { defaultValue: 'Checkpoint' })}
        icon="🏕"
        width={440}
        initialPosition={{ x: 320, y: 140 }}
        onClose={handleCheckpointContinue}
      >
        <div className="space-y-4 p-5" data-testid="quest-checkpoint-panel">
          <p className="text-center text-sm text-slate-300">
            {t('idleVillage:questCheckpoint.summary', {
              played: checkpointPhaseIndex + 1,
              total: questPhases.length,
              defaultValue: 'Phase {{played}} of {{total}} is behind you.',
            })}
          </p>
          <ul className="space-y-1 text-xs">
            {(missionInput?.members ?? []).map((member) => {
              const state = memberStates[member.residentId] ?? 'alive';
              const resident = residentsById[member.residentId];
              return (
                <li
                  key={member.residentId}
                  data-testid={`checkpoint-member-${member.residentId}`}
                  className="flex items-center justify-between rounded border border-slate-700/50 bg-slate-900/40 px-3 py-1.5"
                >
                  <span className="text-slate-200">
                    {resident ? formatResidentLabel(resident) : member.residentId}
                  </span>
                  <span
                    className={
                      state === 'dead'
                        ? 'text-rose-300'
                        : state === 'injured'
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                    }
                  >
                    {t(`idleVillage:questCheckpoint.member.${state}`, {
                      defaultValue: state,
                    })}
                  </span>
                </li>
              );
            })}
          </ul>

          {/*
            The two options show two different previews: "push on" previews
            the REMAINING quest (DP on the living members), "retreat" shows
            the deterministic tier of the phases already played.
          */}
          {(checkpointContinuePreview || checkpointRetreatTier) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                data-testid="checkpoint-continue-preview"
                className="rounded border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 space-y-1"
              >
                <p className="text-[10px] uppercase tracking-widest text-emerald-300/80">
                  {t('idleVillage:questCheckpoint.ifContinue', {
                    defaultValue: 'If you push on',
                  })}
                </p>
                {checkpointContinuePreview ? (
                  <div className="space-y-0.5 tabular-nums">
                    <p className="flex justify-between">
                      <span className="text-slate-400">
                        {t('idleVillage:missionPlanner.metric.success')}
                      </span>
                      <span className="text-slate-200">
                        {(checkpointContinuePreview.questSuccess * 100).toFixed(0)}%
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">
                        {t('idleVillage:missionPlanner.metric.injury')}
                      </span>
                      <span className="text-amber-300">
                        {(checkpointContinuePreview.aggregate.anyInjury * 100).toFixed(0)}%
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">
                        {t('idleVillage:missionPlanner.metric.death')}
                      </span>
                      <span className="text-rose-300">
                        {(checkpointContinuePreview.aggregate.anyDeath * 100).toFixed(0)}%
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>
              <div
                data-testid="checkpoint-retreat-preview"
                className="rounded border border-sky-800/40 bg-sky-950/20 px-3 py-2 space-y-1"
              >
                <p className="text-[10px] uppercase tracking-widest text-sky-300/80">
                  {t('idleVillage:questCheckpoint.ifRetreat', {
                    defaultValue: 'If you retreat now',
                  })}
                </p>
                {checkpointRetreatTier ? (
                  <p className="flex items-center gap-1.5 text-slate-200">
                    <span aria-hidden>{OUTCOME_CONFIG[checkpointRetreatTier].icon}</span>
                    {t(`idleVillage:questOutcome.${checkpointRetreatTier}`, {
                      defaultValue: checkpointRetreatTier,
                    })}
                  </p>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <SkinButton
              variant="cta"
              data-testid="checkpoint-continue"
              onClick={handleCheckpointContinue}
            >
              {t('idleVillage:questCheckpoint.continue', { defaultValue: 'Push on' })}
            </SkinButton>
            <SkinButton
              variant="utility"
              data-testid="checkpoint-retreat"
              onClick={handleCheckpointRetreat}
            >
              {t('idleVillage:questCheckpoint.retreat', { defaultValue: 'Retreat' })}
            </SkinButton>
          </div>
        </div>
      </FloatingPanel>
    )}

    <DragOutcomeFlight
      state={pageFlight}
      residentsById={residentsById}
      onComplete={handlePageFlightComplete}
    />
    {draggingResidentId && (
      <div
        data-drag-preview="true"
        data-dnd-overlay="true"
        data-page-forced-id={draggingResidentId}
        style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 9999, transform: 'translate(-50%, -50%)' }}
      />
    )}
    </>
  );

  return {
    t,
    gameplay,
    residentsById,
    ACTIVITIES,
    activity,
    activityIcon,
    selectedActivityId,
    setSelectedActivityId,
    isQuestRunning,
    handleAbandon,
    elapsedMs,
    questDurationMs: effectiveQuestDurationMs,
    remainingMs,
    questPhases,
    phaseResults,
    currentPhaseIndex,
    poiPhaseDots,
    activityProgress,
    isHaloComplete,
    status,
    questStatus,
    preview,
    embarkResult,
    isConsequencesOpen,
    setIsConsequencesOpen,
    selectedItemIds,
    toggleItem,
    poiDropId,
    canAcceptPoiDrop,
    handlePoiClick,
    draggingResidentId,
    setDraggingResidentId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleFlightComplete,
    handleResidentSelect,
    getResidentCompatibility,
    lockedResidentIds,
    overlays,
    // MP-06 — planner launch + per-member resolution surface.
    missionInput,
    memberStates,
    checkpointPhaseIndex,
    retreatedAtEnd,
    consumedItemIds,
    isQuestCardOpen,
    startQuestWithPayload,
    handleCheckpointContinue,
    handleCheckpointRetreat,
  };
}

export type QuestPoiSession = ReturnType<typeof useQuestPoiSession>;
