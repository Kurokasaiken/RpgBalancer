/**
 * useQuestExpeditionSession — the live planning surface of a REAL quest POI
 * (PLAN-019-S2.4): roster → quest slots → dynamic forecast → «Invia
 * spedizione» → a frozen engine run. Built as an adapter over the trusted
 * stack (`useResidentSlotController`, `ResidentSlotRack`, `useDragOutcome`)
 * — no parallel drag system, no second quest state.
 *
 * Lifecycle:
 * - POI `available` → click opens the detail; the offer resolves ONCE on
 *   open (`resolveQuestOffer` — signals snapshot fixed, instance registered)
 *   and stays frozen for the whole planning session.
 * - The player assigns residents: eligibility = `questResidentEligibility`
 *   (config `QUEST_ELIGIBILITY`: dead/away/exhausted out, injured in, the
 *   `inExpedition` lock derived from unsettled runs — never a stored flag).
 * - The forecast (`estimateForPartyAsync`) recomputes on every assignment
 *   change — debounced and chunked per `QUEST_PLANNING` so the surface never
 *   blocks a frame; a stale sim aborts instead of overwriting a newer one.
 * - «Invia spedizione» re-checks every precondition at the write boundary
 *   and freezes party stats, loadout, resolved offer, scenario instance,
 *   node schedule (`ticksPerNode`) and launch tick into the run — the single
 *   mutation, single persist.
 * - While the run lives the POI halo is `questHaloProgress` (elapsed /
 *   live-duration); clicking it routes to the canonical `QuestRunWindow`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { QUEST_PLANNING } from '@/balancing/config/idleVillage/quests/questPlanning';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { useMinimalGameplayWithIdleVillageConfig, useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotBlueprint, DropState } from '@/ui/idleVillage/slots/types';
import type { GetResidentCompatibility } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { resolveQuestOffer, estimateForPartyAsync, scenarioForQuest, type PartyEstimate, type ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import { computeForecastDelta, type ForecastDelta } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { memberReveals, planningHints } from '@/ui/idleVillage/questS1Lab/questCertainty';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { questHaloProgress } from '@/ui/idleVillage/questS1Lab/questSchedule';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { availableOptions } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestId, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestRunApi } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { buildExpeditionParty, isExpeditionItem, loadoutDuration } from './questExpedition';
import { settleRun, runIdOf } from './questSettlement';
import { releaseLoadout, reserveLoadout } from '@/ui/idleVillage/questS1Lab/expeditionLoadout';
import { QuestExpeditionDetail } from './QuestExpeditionDetail';

/** Loadout candidates: catalog items carrying a REAL expedition effect —
 *  engine-flagged consumables plus duration-channel items (mounts)
 *  (PLAN-019-S3 T-3). Items with no channel stay catalog-only. */
const EXPEDITION_ITEMS = Object.values(defaultQuestItems).filter(isExpeditionItem);

/** Resolved-offer cache: `resolveQuestOffer` is deterministic on
 *  `(poiId, daysPlayed)` — the expensive part is the reference-band sim,
 *  which must not rerun on every detail open. */
const offerCache = new Map<string, ResolvedQuestOffer>();

export interface QuestExpeditionSessionOptions {
  /** The authored POI this session plans/launches. */
  poi: QuestPoi;
  /** The run api for `poi.questId` — page-owned, persists via save key. */
  questRun: QuestRunApi;
  /**
   * Non-terminal runs of EVERY quest — the global «one expedition out»
   * launch gate and the source of the `inExpedition` lock (union of their
   * parties' residentIds, derived — never stored).
   */
  activeRuns: ReadonlyArray<QuestRunState | null>;
  /** Canonical game tick — the clock halo, schedule and launch share. */
  currentTick: number;
  /** Routes an active run to the canonical `QuestRunWindow`. */
  onOpenRun?: (questId: QuestId) => void;
  /** Where the planning panel first appears (viewport px). */
  detailPosition?: { x: number; y: number };
}

/** Whether `residentId` rides in ANY non-terminal run's party — the union
 *  lock T-1 derives (one active run max by the launch gate, but the check
 *  stays honest if that ever relaxes). */
function inAnyExpedition(residentId: string, activeRuns: ReadonlyArray<QuestRunState | null>): boolean {
  return activeRuns.some((run) => residentInExpedition(residentId, run));
}

export function useQuestExpeditionSession({
  poi,
  questRun,
  activeRuns,
  currentTick,
  onOpenRun,
  detailPosition,
}: QuestExpeditionSessionOptions) {
  const { t } = useTranslation('idleVillage');
  const { residentsById } = useRosterKitData();
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const scenario = useMemo(() => scenarioForQuest(poi.questId), [poi.questId]);
  const run = questRun.run;

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolved, setResolved] = useState<ResolvedQuestOffer | null>(null);
  const [resolvePending, setResolvePending] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{ key: string; value: PartyEstimate } | null>(null);
  /** Last completed estimate of a DIFFERENT configuration — the delta
   *  baseline (S3 T-2). Only real sims count as baseline ('incomplete'
   *  never does); reverting the party restores an identical sim because
   *  the seed derives from the inputs. */
  const prevEstimateRef = useRef<{ key: string; value: PartyEstimate } | null>(null);
  const sendingRef = useRef(false);
  const { state: pageFlight, startFlight, settle: settleFlight } = useDragOutcome();

  /* ------------------------------------------------------------------ */
  /* Offer — resolved once per (poi, daysPlayed) on detail open.          */
  /* ------------------------------------------------------------------ */
  const currentDay = gameplay.state.currentDay;
  useEffect(() => {
    if (!isDetailOpen || resolved) return;
    const cacheKey = `${poi.id}@${Math.floor(currentDay)}`;
    const cached = offerCache.get(cacheKey);
    if (cached) {
      setResolved(cached);
      return;
    }
    /* The reference-band derivation is a Monte Carlo — resolve off the
     * current frame so opening the detail never stutters. */
    let cancelled = false;
    setResolvePending(true);
    const timer = window.setTimeout(() => {
      const offer = resolveQuestOffer(poi);
      offerCache.set(cacheKey, offer);
      if (!cancelled) {
        setResolved(offer);
        setResolvePending(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isDetailOpen, resolved, poi, currentDay]);

  /* ------------------------------------------------------------------ */
  /* Slots — authored offer slots partitioned by the POI's required ids.  */
  /* ------------------------------------------------------------------ */
  const authoredSlots = useMemo(() => scenario?.offer.slots, [scenario]);
  const slotBlueprints = useMemo<ResidentSlotBlueprint[]>(() => {
    if (!authoredSlots) return [];
    /* The POI declares WHICH authored slots it offers (a weaker posting may
     *  offer fewer than the scenario has): required ∪ optional is the rack. */
    const requiredIds = new Set(poi.slots.required);
    const offeredIds = new Set([...poi.slots.required, ...poi.slots.optional]);
    const list = [...authoredSlots.required, ...authoredSlots.optional].filter((s) => offeredIds.has(s.id));
    return list.map((slot, index) => ({
      /* The droppable id is POI-scoped so a slot of another POI's detail
       * can never intercept this session's drops. */
      id: `${poi.id}:${slot.id}`,
      label: slot.label ?? slot.id,
      statHint: slot.statHint,
      requirement: slot.requirement,
      modifiers: slot.modifiers,
      role: slot.role,
      index,
      required: requiredIds.has(slot.id),
      isVirtual: false,
    }));
  }, [authoredSlots, poi]);

  /** The minimal ActivityDefinition the trusted controller consumes —
   *  an adapter, not a real activity: eligibility lives in the quest
   *  validator, not the activity rules. */
  const activity = useMemo<ActivityDefinition>(
    () => ({
      id: poi.id,
      label: scenario?.title ?? poi.id,
      tags: ['quest'],
      slotTags: [],
      resolutionEngineId: 'quest_graph',
      maxSlots: slotBlueprints.length,
    }),
    [poi.id, scenario?.title, slotBlueprints.length],
  );

  /** Quest eligibility as the controller's drop-state override — the
   *  built-in validator is stricter (`status === 'available'` only), while
   *  the Director's config admits injured residents. */
  const eligibilityFor = useCallback(
    (residentId: string, slotBlueprintId: string) => {
      const resident = residentsById[residentId];
      if (!resident) return { eligible: false as const };
      const slot = slotBlueprints.find((s) => s.id === slotBlueprintId);
      const base = questResidentEligibility(resident, slot?.requirement, run);
      if (base.eligible && inAnyExpedition(residentId, activeRuns)) {
        return { eligible: false as const, reason: 'in-expedition' as const };
      }
      return base;
    },
    [residentsById, slotBlueprints, run, activeRuns],
  );

  const handleAssign = useCallback(
    (slotBlueprintId: string, residentId: string) => {
      setAssignments((a) => ({ ...a, [slotBlueprintId]: residentId }));
      trackTelemetryEvent('quest_expedition_assign', { poiId: poi.id, slotId: slotBlueprintId, residentId });
    },
    [poi.id],
  );

  const handleClear = useCallback(
    (slotBlueprintId: string) => {
      setAssignments((a) => ({ ...a, [slotBlueprintId]: null }));
      trackTelemetryEvent('quest_expedition_detach', { poiId: poi.id, slotId: slotBlueprintId });
    },
    [poi.id],
  );

  const controller = useResidentSlotController({
    activity,
    assignments,
    residents: residentsById,
    hoveredResidentId: draggingResidentId,
    slotBlueprints,
    customValidator: (residentId, slotBlueprintId) => {
      const check = eligibilityFor(residentId, slotBlueprintId);
      return check.eligible
        ? null
        : { success: false as const, reason: 'VALIDATION_FAILED' as const, details: check.reason ?? 'ineligible', slotId: slotBlueprintId };
    },
    dropStateResolver: (residentId, slotBlueprint): DropState | undefined =>
      eligibilityFor(residentId, slotBlueprint.id).eligible ? 'valid' : 'invalid',
    onAssign: handleAssign,
    onClear: handleClear,
  });

  const assignedIds = useMemo(
    () => Object.values(assignments).filter((v): v is string => Boolean(v)),
    [assignments],
  );

  /** First slot that would accept the resident — drives the roster's
   *  per-card compatibility (grayscale/aria-disabled come from there). */
  const findAcceptingSlot = useCallback(
    (residentId: string) => {
      if (assignedIds.includes(residentId)) return undefined;
      return controller.slots.find(
        (slot) => !slot.assignedResidentId && eligibilityFor(residentId, slot.id).eligible,
      );
    },
    [controller.slots, assignedIds, eligibilityFor],
  );

  const getResidentCompatibility: GetResidentCompatibility = useCallback(
    (residentId) => {
      if (!isDetailOpen || run) return undefined;
      const slot = findAcceptingSlot(residentId);
      if (slot) return { state: 'valid', slotId: slot.id, slotLabel: slot.label };
      const resident = residentsById[residentId];
      const reason = resident
        ? controller.slots.map((s) => eligibilityFor(residentId, s.id)).find((c) => !c.eligible)?.reason
        : undefined;
      return { state: 'invalid', reason };
    },
    [isDetailOpen, run, findAcceptingSlot, residentsById, controller.slots, eligibilityFor],
  );

  /** Locked = assigned + in-flight + every resident out on an unsettled
   *  expedition (derived from `activeRuns` — never a stored flag; a
   *  `settled` run releases its party). */
  const lockedResidentIds = useMemo(() => {
    const locked = new Set<string>(assignedIds);
    if (flyingResidentId) locked.add(flyingResidentId);
    for (const active of activeRuns) {
      if (active?.settlement?.status === 'settled') continue;
      active?.party.forEach((m) => locked.add(m.id));
    }
    return [...locked];
  }, [assignedIds, flyingResidentId, activeRuns]);

  /* ------------------------------------------------------------------ */
  /* Party + forecast (debounced, chunked, abortable).                    */
  /* ------------------------------------------------------------------ */
  const partyMembers = useMemo<LabMember[]>(() => {
    const members: LabMember[] = [];
    for (const slot of slotBlueprints) {
      const residentId = assignments[slot.id];
      const resident = residentId ? residentsById[residentId] : undefined;
      if (!resident) continue;
      const role = (slot.role === 'leader' || slot.role === 'bodyguard' ? slot.role : 'member') as LabMember['role'];
      members.push(residentToQuestMember(resident, role));
    }
    return members;
  }, [slotBlueprints, assignments, residentsById]);

  const requiredFilled = useMemo(
    () => controller.slots.filter((s) => s.required).every((s) => s.assignedResidentId),
    [controller.slots],
  );

  /** Stable estimate key: same instance + same ordered party = the sim the
   *  cache answers; any change recomputes. */
  const estimateKey = useMemo(
    () =>
      resolved
        ? `${resolved.instance.instanceId}|${partyMembers.map((m) => `${m.id}:${m.role}`).join(',')}`
        : null,
    [resolved, partyMembers],
  );

  useEffect(() => {
    if (!isDetailOpen || !resolved || !estimateKey) {
      setEstimate(null);
      prevEstimateRef.current = null;
      return;
    }
    if (!requiredFilled) {
      setEstimate({ key: estimateKey, value: 'incomplete' });
      return;
    }
    const controllerAbort = new AbortController();
    const timer = window.setTimeout(() => {
      estimateForPartyAsync(resolved.resolvedOffer, partyMembers, {
        runs: QUEST_PLANNING.forecastRuns,
        chunkRuns: QUEST_PLANNING.forecastChunkRuns,
        signal: controllerAbort.signal,
      })
        .then((value) =>
          setEstimate((prev) => {
            if (prev && prev.key !== estimateKey && typeof prev.value === 'object') {
              prevEstimateRef.current = prev;
            }
            return { key: estimateKey, value };
          }),
        )
        .catch(() => {
          /* Aborted = superseded by a newer estimate; swallow. */
        });
    }, QUEST_PLANNING.forecastDebounceMs);
    return () => {
      window.clearTimeout(timer);
      controllerAbort.abort();
    };
  }, [isDetailOpen, resolved, estimateKey, requiredFilled, partyMembers]);

  /** Signed pp shift vs the previous party configuration (S3 T-2) — only
   *  when a real previous sim exists and the current one has landed. */
  const forecastDelta = useMemo<ForecastDelta | null>(() => {
    const cur = estimate && estimate.key === estimateKey ? estimate.value : null;
    const prev = prevEstimateRef.current;
    if (!cur || typeof cur !== 'object' || !prev || typeof prev.value !== 'object') return null;
    return computeForecastDelta(cur.sim, prev.value.sim);
  }, [estimate, estimateKey]);

  /* `revealAtPlanning` (S3 T-1/D-S3-3): nodes whose `revealHint` unlocks
   *  because an assigned member meets the slot's stat threshold. */
  const revealedNodeIds = useMemo(() => {
    const revealed = new Set<string>();
    if (!authoredSlots || !QUEST_PLANNER_INFO.revealAtPlanning.enabled) return revealed;
    const nodes = resolved?.instance.nodes;
    for (const slot of [...authoredSlots.required, ...authoredSlots.optional]) {
      const spec = slot.revealAtPlanning;
      if (!spec) continue;
      const residentId = assignments[`${poi.id}:${slot.id}`];
      const resident = residentId ? residentsById[residentId] : undefined;
      if (!resident) continue;
      if (!memberReveals(spec, residentToQuestMember(resident, 'member'))) continue;
      /* `reveals` absent = every authored `revealHint` unlocks. */
      const targets = spec.reveals ?? Object.values(nodes ?? {}).filter((n) => n.revealHint).map((n) => n.id);
      targets.forEach((id) => revealed.add(id));
    }
    return revealed;
  }, [authoredSlots, assignments, residentsById, poi.id, resolved]);

  /** Authored planning intel for the OUTCOME zone: `previewHint` always,
   *  `revealHint` only through the explorer slot — capped per config. */
  const intelHints = useMemo(() => {
    const nodes = resolved?.instance.nodes;
    if (!nodes) return [];
    return planningHints(nodes, revealedNodeIds).slice(0, QUEST_PLANNER_INFO.maxPreviewHints);
  }, [resolved, revealedNodeIds]);

  /** LOADOUT duration channel (S3 T-3, desiderata v24 #7): items declaring
   *  `durationMult`/`durationDelta` reshape the run's real pace — the
   *  launch clock AND the estimate chip share this one derivation. */
  const expeditionDuration = useMemo(
    () => loadoutDuration(selectedItemIds, poi.ticksPerNode, poi.estimatedDurationTicks),
    [selectedItemIds, poi],
  );

  /* ------------------------------------------------------------------ */
  /* Draft persistence (Director 2026-10-09, ratified at S3 baptism): the
   *  party/loadout draft survives closing the panel — keyed by POI +
   *  in-game day, mirroring the offer cache's resolution. Cleared at
   *  send; restored on open only while no run is live.                 */
  /* ------------------------------------------------------------------ */
  const draftKey = `idleVillage.questExpeditionDraft.${poi.id}.${Math.floor(currentDay)}`;
  /* `draftReady` is state, not a ref: the write effect must re-arm when the
   *  restore completes, otherwise a change made while loadData was in flight
   *  would never be persisted until the next edit. */
  const [draftReady, setDraftReady] = useState(false);
  /* A new day = a new draft identity: the restore gate reopens. */
  useEffect(() => {
    setDraftReady(false);
  }, [draftKey]);

  useEffect(() => {
    if (!isDetailOpen || !resolved || run || draftReady) return;
    let cancelled = false;
    void loadData<{ assignments?: Record<string, string | null>; items?: string[] } | null>(draftKey, null).then((draft) => {
      if (cancelled) return;
      if (draft) {
        const itemIds = new Set(EXPEDITION_ITEMS.map((i) => i.id));
        /* Re-validate at restore: a resident may have died/left since the
         *  draft was written — never resurrect an ineligible assignment. */
        const restored: Record<string, string | null> = {};
        for (const [slotId, residentId] of Object.entries(draft.assignments ?? {})) {
          if (residentId && slotBlueprints.some((s) => s.id === slotId) && eligibilityFor(residentId, slotId).eligible) {
            restored[slotId] = residentId;
          }
        }
        setAssignments(restored);
        setSelectedItemIds((draft.items ?? []).filter((id) => itemIds.has(id)).slice(0, QUEST_STASH.bagSlots));
      }
      setDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isDetailOpen, resolved, run, draftReady, draftKey, slotBlueprints, eligibilityFor]);

  /* Debounced write — drag storms never hit the service per-frame. */
  useEffect(() => {
    if (!isDetailOpen || !draftReady) return;
    const timer = window.setTimeout(() => {
      void saveData(draftKey, { assignments, items: selectedItemIds });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [isDetailOpen, draftReady, draftKey, assignments, selectedItemIds]);

  const clearDraft = useCallback(() => {
    void clearData(draftKey);
  }, [draftKey]);

  /* ------------------------------------------------------------------ */
  /* Settlement (S2.5) — a terminal run settles once, idempotently.       */
  /*  Journal: persist `settling` → apply effects (ledger-keyed, co-       */
  /*  located in the gameplay aggregate) → release loadout → persist       */
  /*  `settled`. A run stuck at `settling` after a crash replays on the    */
  /*  next render; dedup keys make the replay free.                        */
  /* ------------------------------------------------------------------ */
  const settlingRef = useRef(false);
  const runEnded = Boolean(run?.ended);
  const runSettled = run?.settlement?.status === 'settled';
  useEffect(() => {
    if (!run?.ended || runSettled || settlingRef.current) return;
    settlingRef.current = true;
    const runId = runIdOf(run);
    trackTelemetryEvent('quest_settlement_begin', { poiId: poi.id, runId, outcome: run.outcome });
    void settleRun(run, {
      persistRun: (marker) => questRun.applySettlement(marker),
      applyToStore: (plan) => {
        useMinimalGameplayStore.getState().applyQuestSettlement(plan);
      },
      releaseLoadout,
      nowTick: () => useMinimalGameplayStore.getState().state.currentTick,
    })
      .then(() => trackTelemetryEvent('quest_settlement_done', { poiId: poi.id, runId, outcome: run.outcome }))
      .catch((error) =>
        trackTelemetryEvent('quest_settlement_error', {
          poiId: poi.id,
          runId,
          message: error instanceof Error ? error.message : String(error),
        }),
      )
      .finally(() => {
        settlingRef.current = false;
      });
  }, [run, runEnded, runSettled, questRun, poi.id]);

  /* ------------------------------------------------------------------ */
  /* Launch — preconditions re-checked at the write boundary.             */
  /* ------------------------------------------------------------------ */
  /* Sequential-expeditions gate (T-5): a POI run blocks every other
   *  launch until it is SETTLED — `ended` alone is not enough (the party
   *  is still locked, consequences pending). */
  const anyRunActive = activeRuns.some((r) => r && r.settlement?.status !== 'settled');
  const canSend = Boolean(resolved) && requiredFilled && !anyRunActive && !sendingRef.current;

  /* `sending` stays latched until the run lands — a double-click inside the
   * same frame must not queue a second launch (T-3). */
  useEffect(() => {
    if (run) sendingRef.current = false;
  }, [run]);

  const send = useCallback(() => {
    /* The authoritative gate, repeated here at the write boundary: a stale
     *  render can leave the button enabled a beat after the state moved. */
    if (sendingRef.current || !resolved || !requiredFilled || anyRunActive) return;
    /* Re-validate every member at the write boundary — the roster may have
     *  changed since the assignment was made (death, another expedition). */
    const members = buildExpeditionParty(
      slotBlueprints.map((s) => ({ blueprintId: s.id, required: Boolean(s.required), role: s.role, requirement: s.requirement })),
      assignments,
      residentsById,
      activeRuns,
    );
    if (!members) return;

    sendingRef.current = true;
    trackTelemetryEvent('quest_expedition_launch', {
      poiId: poi.id,
      questId: poi.questId,
      partyIds: members.map((m) => m.id),
      loadout: selectedItemIds,
      launchTick: currentTick,
    });
    questRun.start({
      party: { members },
      seed: (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0,
      questId: poi.questId,
      loadout: selectedItemIds,
      clock: { nodeTicks: expeditionDuration.nodeTicks, startTick: currentTick },
      scenarioInstance: resolved.instance,
      resolvedOffer: resolved.resolvedOffer,
    });
    /* The bag reservation rides the run's identity (scenarioInstanceId —
     * the same key `runIdOf` uses at settlement). Fire-and-forget: the
     * run exists now, and release on terminal transition is guaranteed by
     * the settlement journal regardless of when this write lands. */
    void reserveLoadout(resolved.instance.instanceId, selectedItemIds);
    clearDraft();
    setIsDetailOpen(false);
    setAssignments({});
    setSelectedItemIds([]);
    setEstimate(null);
    onOpenRun?.(poi.questId);
  }, [
    resolved,
    requiredFilled,
    anyRunActive,
    slotBlueprints,
    assignments,
    residentsById,
    activeRuns,
    poi,
    selectedItemIds,
    expeditionDuration,
    currentTick,
    questRun,
    onOpenRun,
    clearDraft,
  ]);

  /* ------------------------------------------------------------------ */
  /* Drag & drop — same flight contract as the mock session: the verdict  */
  /*  object tells the roster kit where to fly, the flight's completion    */
  /*  performs the assignment. Drops that don't target this session's      */
  /*  slots return `undefined` so the page can offer them elsewhere.       */
  /* ------------------------------------------------------------------ */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingResidentId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent): RosterDropVerdict => {
      setDraggingResidentId(null);
      const residentId = event.active.id as string;
      const overId = event.over?.id as string | undefined;
      if (!overId) return;
      const slot = controller.slots.find((s) => s.id === overId);
      if (!slot) return; // not ours — let the page route it elsewhere

      if (!isDetailOpen || run) return false;
      const resident = residentsById[residentId];
      if (!resident || assignedIds.includes(residentId)) return false;
      if (slot.assignedResidentId || !eligibilityFor(residentId, slot.id).eligible) return false;

      const element = document.querySelector(`[data-slot-id="${slot.id}"]`);
      return { flightToSlot: { slotId: slot.id, element } };
    },
    [controller.slots, isDetailOpen, run, residentsById, assignedIds, eligibilityFor],
  );

  const handleFlightComplete = useCallback(
    (residentId: string, slotId?: string) => {
      if (slotId && slotBlueprints.some((s) => s.id === slotId)) {
        handleAssign(slotId, residentId);
        return true;
      }
      return false;
    },
    [slotBlueprints, handleAssign],
  );

  const handleResidentSelect = useCallback(
    (residentId: string) => {
      if (flyingResidentId || !isDetailOpen || run) return false;
      const slot = findAcceptingSlot(residentId);
      if (!slot) return false;
      const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (!from) return false;
      setFlyingResidentId(residentId);
      window.setTimeout(() => {
        const to = elementCenter(document.querySelector(`[data-slot-id="${slot.id}"]`));
        if (!to) {
          setFlyingResidentId(null);
          return;
        }
        startFlight({ residentId, slotId: slot.id, isInset: true, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
      }, 50);
      return true;
    },
    [flyingResidentId, isDetailOpen, run, findAcceptingSlot, startFlight],
  );

  const handlePageFlightComplete = useCallback(
    (residentId: string, slotId?: string, isInset?: boolean) => {
      if (isInset && slotId) handleAssign(slotId, residentId);
      setFlyingResidentId(null);
      settleFlight();
    },
    [handleAssign, settleFlight],
  );

  /* ------------------------------------------------------------------ */
  /* POI marker + routing.                                                */
  /* ------------------------------------------------------------------ */
  const handlePoiClick = useCallback(() => {
    if (run) {
      onOpenRun?.(poi.questId);
    } else {
      setIsDetailOpen(true);
    }
  }, [run, onOpenRun, poi.questId]);

  const halo = useMemo(
    () => (run ? questHaloProgress(run, poi, currentTick) : null),
    [run, poi, currentTick],
  );

  const questStatus: 'available' | 'in_progress' | 'completed' | 'failed' = !run
    ? 'available'
    : run.ended
      ? run.outcome === 'reward' || run.outcome === 'survived'
        ? 'completed'
        : 'failed'
      : 'in_progress';

  const poiView = useMemo(
    () => ({
      activity: { id: poi.id, label: scenario?.title ?? poi.id },
      questStatus,
      activityProgress: halo?.fraction ?? 0,
      /* No drop-on-POI for the real path: the detail's slot rack is the
       * only landing zone (T-1 trusted contract). */
      poiDropId: `expedition-poi-drop-${poi.id}`,
      canAcceptPoiDrop: false,
      handlePoiClick,
      draggingResidentId,
      gameplay,
      haloStatus: halo?.status ?? null,
      /* D-H-4 badge: the frontier sits on a player-owned node — «the
       *  expedition waits for you», independent of halo fill. */
      decisionWaiting: Boolean(run && !run.ended && run.frontier.status === 'waiting'),
    }),
    [poi.id, scenario?.title, questStatus, halo, handlePoiClick, draggingResidentId, gameplay],
  );

  /* ------------------------------------------------------------------ */
  /* Overlays — the planning detail + the flight layer.                   */
  /* ------------------------------------------------------------------ */
  const closeDetail = useCallback(() => {
    /* Draft semantics (S3 T-3): closing keeps the party/loadout — the
     *  in-memory state IS the draft and the debounced write has already
     *  persisted it; reopening shows the same configuration. */
    setIsDetailOpen(false);
    setEstimate(null);
    prevEstimateRef.current = null;
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : current.length < QUEST_STASH.bagSlots
          ? [...current, itemId]
          : current,
    );
  }, []);

  const overlays = (
    <>
      {isDetailOpen && !run && (
        <QuestExpeditionDetail
          poi={poi}
          scenario={scenario}
          resolved={resolved}
          resolvePending={resolvePending}
          slots={controller.slots}
          estimate={estimate?.key === estimateKey ? estimate.value : 'computing'}
          forecastDelta={forecastDelta}
          intelHints={intelHints}
          expeditionDuration={expeditionDuration}
          requiredFilled={requiredFilled}
          items={EXPEDITION_ITEMS}
          selectedItemIds={selectedItemIds}
          onToggleItem={toggleItem}
          canSend={canSend}
          onSend={send}
          onClose={closeDetail}
          onSlotClear={controller.clearSlot}
          position={detailPosition}
        />
      )}
      <DragOutcomeFlight state={pageFlight} residentsById={residentsById} onComplete={handlePageFlightComplete} />
      {draggingResidentId && (
        <div
          data-drag-preview="true"
          data-dnd-overlay="true"
          style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 9999, transform: 'translate(-50%, -50%)' }}
        />
      )}
    </>
  );

  /* ------------------------------------------------------------------ */
  /* E2E hooks — same `__idleVillageTestHooks` surface the reference page   */
  /* uses, namespaced per POI. `advanceTicks` moves the canonical clock     */
  /* (and every derived frontier) so catch-up paths run in tests too.       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const hooks = ((window as unknown as { __idleVillageTestHooks?: Record<string, unknown> }).__idleVillageTestHooks ??=
      {});
    /* The canonical `tick` action, not a raw `setState`: same path the game
     *  loop takes — day/phase derivation AND the persistence schedule, so a
     *  reload sees the same clock the halo was projecting (D-J). The game is
     *  usually paused in tests — unpause for the synthetic span, restore after. */
    hooks.advanceTicks = (n: number) => {
      const store = useMinimalGameplayStore;
      const { state } = store.getState();
      const speed = Math.max(1, state.speedMultiplier || 1);
      const wasPaused = state.isPaused;
      if (wasPaused) store.setState((s) => ({ state: { ...s.state, isPaused: false } }));
      store.getState().tick(Math.ceil((Math.max(0, n) * 1000) / speed), 'manual');
      if (wasPaused) store.setState((s) => ({ state: { ...s.state, isPaused: true } }));
    };
    /* Read-only view of the canonical clock: tick counter, pause flag and
     *  speed multiplier — the values the HUD time controls drive. */
    hooks.getClock = () => {
      const s = useMinimalGameplayStore.getState().state;
      return { currentTick: s.currentTick ?? 0, currentDay: s.currentDay ?? 0, isPaused: s.isPaused, speedMultiplier: s.speedMultiplier };
    };
    const expedition = (hooks.expedition ??= {}) as Record<string, unknown>;
    expedition[poi.id] = {
      openDetail: () => setIsDetailOpen(true),
      closeDetail,
      send,
      /* Same gate a real drop crosses — tests can't smuggle an ineligible
       *  resident through a path the UI would refuse. */
      assignToSlot: (slotBlueprintId: string, residentId: string) => {
        if (!eligibilityFor(residentId, slotBlueprintId).eligible) return false;
        handleAssign(slotBlueprintId, residentId);
        return true;
      },
      checkEligibility: (slotBlueprintId: string, residentId: string) => eligibilityFor(residentId, slotBlueprintId),
      /* The slot rack's «Clear» affordance — same path the UI takes, so a
       *  revert exercises the real recompute chain (S3 T-2 reversibility). */
      clearSlot: (slotBlueprintId: string) => controller.clearSlot(slotBlueprintId),
      toggleItem,
      getAssignments: () => assignments,
      getEstimate: () => estimate?.value ?? null,
      /* Serialized estimate — lets a test detect a recomputed forecast
       * without shipping object identity across the evaluate boundary. */
      getEstimateJson: () => JSON.stringify(estimate?.value ?? null),
      getResolvedOffer: () => resolved?.resolvedOffer ?? null,
      getRun: () => questRun.run,
      getSettlement: () => questRun.run?.settlement ?? null,
      /* The gameplay aggregate slice settlement mutates — E2E asserts
       *  consequences as DATA (gold/xp deltas, resident isDead/isInjured). */
      getVillage: () => {
        const s = useMinimalGameplayStore.getState().state;
        return {
          gold: s.gold,
          xp: s.xp,
          residents: s.residents.map((r) => ({
            id: r.id,
            isDead: Boolean(r.isDead),
            isInjured: Boolean(r.isInjured),
            injuredUntilTick: r.injuredUntilTick ?? null,
          })),
        };
      },
      /* The player's command on a waiting frontier — the same api the
       *  QuestRunWindow buttons call, so catch-up paths stay honest. */
      choose: (optionId: string, useConsumable = false) => questRun.choose(optionId, { useConsumable }),
      getOptions: () => (questRun.run ? availableOptions(questRun.run).map((o) => o.id) : []),
      getHalo: () => halo,
      isDetailOpen: () => isDetailOpen,
    };
    return () => {
      delete expedition[poi.id];
    };
  });

  return {
    poi,
    run,
    isDetailOpen,
    setIsDetailOpen,
    resolved,
    controller,
    assignments,
    partyMembers,
    estimate,
    canSend,
    send,
    closeDetail,
    questStatus,
    halo,
    poiView,
    overlays,
    gameplay,
    draggingResidentId,
    setDraggingResidentId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleFlightComplete,
    handleResidentSelect,
    getResidentCompatibility,
    lockedResidentIds,
    /** Owns a drop/flight target id — the page composes handlers across
     *  sessions by asking each who owns the target. */
    ownsSlotId: (slotId: string | undefined) =>
      Boolean(slotId && slotBlueprints.some((s) => s.id === slotId)),
  };
}

export type QuestExpeditionSession = ReturnType<typeof useQuestExpeditionSession>;
