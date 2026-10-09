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
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { resolveQuestOffer, estimateForPartyAsync, scenarioForQuest, type PartyEstimate, type ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { questHaloProgress } from '@/ui/idleVillage/questS1Lab/questSchedule';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { availableOptions } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestId, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestRunApi } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { buildExpeditionParty } from './questExpedition';
import { QuestExpeditionDetail } from './QuestExpeditionDetail';

/** Loadout candidates: every catalog item that bridges to an engine flag
 *  (the real item identity — the engine consumes `engineFlag`). */
const EXPEDITION_ITEMS = Object.values(defaultQuestItems).filter((i) => i.engineFlag);

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
    const requiredIds = new Set(poi.slots.required);
    const list = [...authoredSlots.required, ...authoredSlots.optional];
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
   *  expedition (derived from `activeRuns` — never a stored flag). */
  const lockedResidentIds = useMemo(() => {
    const locked = new Set<string>(assignedIds);
    if (flyingResidentId) locked.add(flyingResidentId);
    for (const active of activeRuns) {
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
        .then((value) => setEstimate({ key: estimateKey, value }))
        .catch(() => {
          /* Aborted = superseded by a newer estimate; swallow. */
        });
    }, QUEST_PLANNING.forecastDebounceMs);
    return () => {
      window.clearTimeout(timer);
      controllerAbort.abort();
    };
  }, [isDetailOpen, resolved, estimateKey, requiredFilled, partyMembers]);

  /* ------------------------------------------------------------------ */
  /* Launch — preconditions re-checked at the write boundary.             */
  /* ------------------------------------------------------------------ */
  const anyRunActive = activeRuns.some((r) => r && !r.ended);
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
      clock: { nodeTicks: poi.ticksPerNode, startTick: currentTick },
      scenarioInstance: resolved.instance,
      resolvedOffer: resolved.resolvedOffer,
    });
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
    currentTick,
    questRun,
    onOpenRun,
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
    setIsDetailOpen(false);
    setAssignments({});
    setSelectedItemIds([]);
    setEstimate(null);
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
      getAssignments: () => assignments,
      getEstimate: () => estimate?.value ?? null,
      getResolvedOffer: () => resolved?.resolvedOffer ?? null,
      getRun: () => questRun.run,
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
