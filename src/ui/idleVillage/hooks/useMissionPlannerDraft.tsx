/**
 * Mission Planner draft context (MP-04, PLAN-018 T-004).
 *
 * Local presentation state for the Planner panel — React Context by design
 * (the draft is UI state scoped to the panel subtree, not shared domain
 * state; see project state-management invariant). All mutations go through
 * the pure ops in `missionPlannerDraft.ts`; the preview is recomputed from
 * live domain state on every change via the MP-01 engine, so a resident that
 * leaves or is injured while the panel is open visibly invalidates the draft
 * instead of showing stale numbers.
 *
 * The draft is intentionally NOT persisted (desiderata v23).
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { QuestEquipSlot } from '@/balancing/config/idleVillage/quests/questItems.schema';
import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import {
  assignResident,
  buildLaunchPayload,
  diffOutcomes,
  emptyMissionPlannerDraft,
  removeMember,
  setConsumableQty,
  setLoadoutItem,
  toMissionDraft,
  validateDraft,
  type DraftIssue,
  type DraftInvalidReason,
  type DraftValidation,
  type LaunchPayloadResult,
  type MissionPlannerDraft,
  type OutcomeDeltas,
  type PlannerLiveState,
} from '@/engine/game/idleVillage/missionPlannerDraft';
import {
  buildMissionInput,
  MissionPlannerEngineError,
  questOutcomeDistribution,
} from '@/engine/game/idleVillage/missionPlannerEngine';
import type {
  MissionPhaseSpec,
  MissionPlannerInput,
  MissionPreviewResult,
} from '@/engine/game/idleVillage/missionPlannerMath';

/** Telemetry event name reserved for MP-05 wiring (not emitted here). */
export const MISSION_PLANNER_DRAFT_CHANGE_EVENT = 'mission_planner_draft_change';

/** Maps engine error codes to draft issues (validation already covers the rest). */
const engineErrorToIssue = (err: unknown): DraftIssue => {
  const code = err instanceof MissionPlannerEngineError ? err.code : 'UNKNOWN_ITEM';
  const reason: DraftInvalidReason =
    code === 'PARTY_TOO_LARGE' ? 'PARTY_TOO_LARGE' : 'ITEM_UNKNOWN';
  return { reason };
};

/** What the provider needs to resolve a draft into a live preview. */
export interface MissionPlannerProviderProps {
  children: ReactNode;
  /** Live domain state (roster, slots, item catalog). */
  live: PlannerLiveState;
  /** Phase specs for the quest being planned (engine-ready). */
  phases: readonly MissionPhaseSpec[];
  /** Quest/activity id used by the launch payload. */
  questId: string;
  /** Skill-check config. */
  config?: QuestSkillCheckConfig;
  /** Draft shown when the panel opens (defaults to empty). */
  initialDraft?: MissionPlannerDraft;
  /** Optional sink called with (draft, changeKind) on every mutation — MP-05 wires telemetry. */
  onDraftChange?: (draft: MissionPlannerDraft, changeKind: string) => void;
}

/** Value exposed by the Mission Planner draft context. */
export interface MissionPlannerDraftContextValue {
  draft: MissionPlannerDraft;
  /**
   * Live preview — recomputed from current domain state on every render.
   * `null` when the engine refuses the draft (issues carry the reason).
   */
  preview: MissionPreviewResult | null;
  /**
   * The resolved engine input behind {@link preview} — member/phase specs,
   * consumables, item effects. `null` when the draft is invalid. Surfaced so
   * phase-level views can derive per-phase numbers (memberPhaseRisk etc.)
   * without rebuilding the draft chain.
   */
  input: MissionPlannerInput | null;
  /** Validation against live state (invalidations, missing required slots…). */
  validation: DraftValidation;
  /** Headline deltas vs the preview before the last change (null initially). */
  deltas: OutcomeDeltas | null;
  /** Drafted residents absent from the live roster (→ warning + canEmbark false). */
  invalidatedResidentIds: string[];
  canEmbark: boolean;
  issues: DraftIssue[];
  canUndo: boolean;
  canReset: boolean;
  assignResident: (slotId: string, residentId: string) => void;
  removeMember: (slotId: string) => void;
  setLoadoutItem: (residentId: string, slot: QuestEquipSlot, itemId?: string) => void;
  setConsumableQty: (itemId: string, qty: number) => void;
  /** Pops the last mutating operation. */
  undo: () => void;
  /** Restores the baseline captured when the provider mounted. */
  reset: () => void;
  /** Atomic launch contract — payload or issues, never partial. */
  buildLaunchPayload: () => LaunchPayloadResult;
}

const MissionPlannerDraftContext = createContext<MissionPlannerDraftContextValue | null>(null);

/**
 * Provides draft state for one Planner panel instance.
 *
 * The baseline is captured at mount (`initialDraft` or empty); `reset`
 * restores it, `undo` unwinds the last mutation. Both are exact because
 * drafts are immutable values and the preview is a pure function of
 * (draft, live). `prevOutcome` anchors the displayed deltas to the preview
 * shown before the last change.
 */
export function MissionPlannerProvider({
  children,
  live,
  phases,
  questId,
  config = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  initialDraft,
  onDraftChange,
}: MissionPlannerProviderProps) {
  const baselineRef = useRef<MissionPlannerDraft | null>(null);
  if (baselineRef.current === null) {
    baselineRef.current = initialDraft ?? emptyMissionPlannerDraft();
  }

  const [draft, setDraft] = useState<MissionPlannerDraft>(baselineRef.current);
  const [history, setHistory] = useState<MissionPlannerDraft[]>([]);
  const [prevOutcome, setPrevOutcome] = useState<MissionPreviewResult | null>(null);

  const resolved = useMemo(() => {
    // Recompute from live state on every change: drafted residents resolve to
    // their CURRENT roster state, so departures/injuries invalidate the draft
    // instead of feeding stale numbers to the player.
    const missionDraft = toMissionDraft(draft, live, phases);
    let preview: MissionPreviewResult | null = null;
    let input: MissionPlannerInput | null = null;
    const engineIssues: DraftIssue[] = [];
    try {
      input = buildMissionInput(missionDraft, config);
      preview = questOutcomeDistribution(missionDraft, config);
    } catch (err) {
      engineIssues.push(engineErrorToIssue(err));
    }
    const validation = validateDraft(draft, live, config);
    return {
      preview,
      input,
      validation: {
        canEmbark: validation.canEmbark && preview !== null,
        issues: [...validation.issues, ...engineIssues],
        invalidatedResidentIds: validation.invalidatedResidentIds,
      },
    };
  }, [draft, live, phases, config]);

  const deltas = useMemo(
    () => diffOutcomes(prevOutcome, resolved.preview ?? ({} as MissionPreviewResult)),
    [prevOutcome, resolved.preview],
  );

  const mutate = useCallback(
    (next: MissionPlannerDraft, changeKind: string) => {
      if (next === draft) return;
      setHistory((h) => [...h, draft]);
      // Deltas shown after this change are measured vs the current preview.
      setPrevOutcome(resolved.preview);
      setDraft(next);
      onDraftChange?.(next, changeKind);
    },
    [draft, resolved.preview, onDraftChange],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPrevOutcome(resolved.preview);
      setDraft(prev);
      onDraftChange?.(prev, 'undo');
      return h.slice(0, -1);
    });
  }, [resolved.preview, onDraftChange]);

  const reset = useCallback(() => {
    const baseline = baselineRef.current ?? emptyMissionPlannerDraft();
    if (draft === baseline) return;
    setHistory((h) => [...h, draft]);
    setPrevOutcome(resolved.preview);
    setDraft(baseline);
    onDraftChange?.(baseline, 'reset');
  }, [draft, resolved.preview, onDraftChange]);

  const value = useMemo<MissionPlannerDraftContextValue>(
    () => ({
      draft,
      preview: resolved.preview,
      input: resolved.input,
      validation: resolved.validation,
      deltas,
      invalidatedResidentIds: resolved.validation.invalidatedResidentIds,
      canEmbark: resolved.validation.canEmbark,
      issues: resolved.validation.issues,
      canUndo: history.length > 0,
      canReset: draft !== baselineRef.current,
      assignResident: (slotId, residentId) =>
        mutate(assignResident(draft, slotId, residentId), 'assign_resident'),
      removeMember: (slotId) => mutate(removeMember(draft, slotId), 'remove_member'),
      setLoadoutItem: (residentId, slot, itemId) =>
        mutate(setLoadoutItem(draft, residentId, slot, itemId), 'set_loadout_item'),
      setConsumableQty: (itemId, qty) =>
        mutate(setConsumableQty(draft, itemId, qty), 'set_consumable'),
      undo,
      reset,
      buildLaunchPayload: () => buildLaunchPayload(draft, live, questId, config),
    }),
    [draft, resolved, deltas, history, live, questId, config, mutate, undo, reset],
  );

  return (
    <MissionPlannerDraftContext.Provider value={value}>
      {children}
    </MissionPlannerDraftContext.Provider>
  );
}

/**
 * Consumes the Mission Planner draft context. Throws when used outside the
 * provider — the panel is the only legal owner of this state.
 */
export function useMissionPlannerDraft(): MissionPlannerDraftContextValue {
  const ctx = useContext(MissionPlannerDraftContext);
  if (!ctx) {
    throw new Error('useMissionPlannerDraft must be used inside <MissionPlannerProvider>.');
  }
  return ctx;
}
