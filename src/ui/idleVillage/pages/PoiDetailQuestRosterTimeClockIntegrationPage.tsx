/**
 * PoiDetailQuestRosterTimeClockIntegrationPage — POI quest completo
 *
 * Banco di prova del quest system della famiglia POI (R-005, desiderata v3):
 * - `DayNightTimeEngineStrip` (clockKit) trapianta clock + day/night con una riga.
 * - Durata dalle fasi del `QuestBlueprint` (non da `durationFormula`), milestone
 *   equispaziate una per fase.
 * - `MagicCircleHalo`: attorno al POI si *scrive* un'iscrizione arcana dalle ore 12;
 *   a cerchio chiuso si ferma e pulsa.
 * - A ogni milestone un `MilestoneCheckModal` (consumabili → Destiny Astrolabe).
 *   Se la quest card è chiusa il check si risolve comunque, fuori scena.
 * - Il fallimento di una fase non interrompe la quest; il giocatore può però
 *   interromperla a mano.
 * - A spedizione avviata il click sul POI apre la quest card al posto del detail;
 *   a quest conclusa la card diventa `QuestRewardPanel` e le ricompense si
 *   applicano solo con "Raccogli ricompense".
 *
 * Desiderata v4:
 * - Detail, quest card e skill check sono `FloatingPanel`: spostabili,
 *   riducibili a icona, e senza backdrop — la pagina resta sempre usabile.
 * - Le fasi si risolvono una alla volta: mentre un check attende il giocatore il
 *   tempo della quest non avanza, quindi fra una fase e l'altra passa davvero
 *   tempo. Ridurre a icona il check lo affida al destino e la quest riprende.
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
} from '@/engine/game/idleVillage/questMilestones';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import type {
  ActivityDetailSlotData,
  TelemetryEntry,
} from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import { buildStatRequirementRows } from '@/ui/idleVillage/utils/statRequirementDisplay';
import type { ResidentSlotBlueprint, ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
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
  draggingResidentId?: string | null;
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
  draggingResidentId,
  onClick,
}: DroppablePoiProps) {
  const { setNodeRef } = useDroppable({
    id: dropId,
    disabled: !canAcceptDrop,
    data: { accepts: ['resident'] },
  });

  const { active } = useDndContext();
  const isActive = Boolean(active || draggingResidentId);
  const highlightState: BloomState = isActive
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
        : document.querySelector('.poi-detail-stage__medallion [role="button"]');
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
  const isCheckAwaiting = activeMilestone !== null && !isMilestoneMinimized;

  /**
   * Countdown loop. The cadence is fixed and the clock's speed multiplier
   * scales the increment, so ×8 really advances the quest eight times faster;
   * pausing the clock freezes the inscription mid-word.
   */
  useEffect(() => {
    if (!isQuestRunning || isPaused || isCheckAwaiting) return;
    const countdown = setInterval(() => {
      setElapsedMs((prev) => Math.min(prev + COUNTDOWN_TICK_MS * speed, questDurationMs));
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(countdown);
  }, [isQuestRunning, isPaused, isCheckAwaiting, speed, questDurationMs]);

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
      return buildAstrolabeSkillsForPhase(
        {
          phase,
          residents: partyResidents,
          blueprintDifficulty: blueprint?.difficulty,
          fallbackRequirement: activity.statRequirement,
        },
        idleVillageConfig.questSkillCheckConfig,
      );
    },
    [questPhases, partyResidents, blueprint?.difficulty, activity.statRequirement, idleVillageConfig.questSkillCheckConfig],
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
      resolveMilestoneWithoutAnimation({ skills, risk }, idleVillageConfig.questSkillCheckConfig),
    );
  }, [
    milestoneQueue,
    activeMilestone,
    isQuestCardOpen,
    questPhases,
    buildSkillsForPhaseIndex,
    recordPhaseResult,
    idleVillageConfig.questSkillCheckConfig,
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
    const phase = questPhases[index];
    const spent = MOCK_QUEST_ITEMS.filter((item) => milestoneConsumableIds.includes(item.id));
    const risk = applyConsumableRiskEffects(
      {
        injuryChance: phase?.riskProfile?.injuryChance ?? 0,
        deathChance: phase?.riskProfile?.deathChance ?? 0,
      },
      spent,
    );
    recordPhaseResult(
      index,
      resolveMilestoneWithoutAnimation(
        { skills: buildSkillsForPhaseIndex(index), risk },
        idleVillageConfig.questSkillCheckConfig,
      ),
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
    recordPhaseResult,
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
   */
  const startQuest = useCallback(() => {
    setElapsedMs(0);
    setPhaseResults([]);
    setMilestoneQueue([]);
    setActiveMilestone(null);
    resetMilestones();
    setIsQuestRunning(true);
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
    isDetailOpen,
    resetMilestones,
    activity.label,
    activity.id,
    questPhases.length,
    questDurationMs,
    addTelemetry,
    trackTelemetryEvent,
  ]);

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

  /** Records the verdict the player just watched and closes the check. */
  const handleMilestoneResolved = useCallback(
    (result: AstrolabeResultShape) => {
      if (!activeMilestone) return;
      recordPhaseResult(activeMilestone.milestoneIndex, result);
    },
    [activeMilestone, recordPhaseResult],
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
      startQuest();
    }
  }, [questStartRequested, isPaused, canEmbarkLocal, startQuest]);

  useEffect(() => {
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
  }, [assignAnyResident, fillRequiredResidentSlots, resolveActiveMilestone, findAcceptingSlot, getResidentCompatibility, setDraggingResidentId, handleAssign, controller, setIsDetailOpen, draggingResidentId, pageFlight, selectedActivityId, ACTIVITIES, setSelectedActivityId, questStartRequested]);

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
      showTelemetry: true,
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

              {/* Day/Night time engine — drop-in from clockKit. */}
              <DayNightTimeEngineStrip gameplay={gameplay} compact />

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
                  <div
                    className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-6"
                    data-page-dragging-resident-id={draggingResidentId ?? 'null'}
                  >
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
                      getResidentCompatibility={getResidentCompatibility}
                      lockedResidentIds={[...assignedIds, ...(flyingResidentId ? [flyingResidentId] : [])]}
                      lockedStatusLabel="Away"
                      activeResidentId={draggingResidentId}
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
                      canAcceptDrop={canAcceptPoiDrop}
                      draggingResidentId={draggingResidentId}
                      onClick={handlePoiClick}
                    />
                  </section>
                </StyleLabSurface>
              </div>
            </div>
          </div>

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
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.injuryChance ?? 0
                }
                deathChance={
                  questPhases[activeMilestone.milestoneIndex].riskProfile?.deathChance ?? 0
                }
                criticalFailChance={
                  100 - idleVillageConfig.questSkillCheckConfig.backgroundResolution.epicFailThreshold + 1
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
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
};

export default PoiDetailQuestRosterTimeClockIntegrationPage;
