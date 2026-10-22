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
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localizeNodes } from '@/balancing/config/idleVillage/quests/questContentLocale';
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { QUEST_HALO_RENDER_MS, QUEST_HALO_STEPS } from '@/balancing/config/idleVillage/quests/questPois';
import { useThrottledValue } from '@/ui/idleVillage/hooks/useThrottledValue';
import { QUEST_PLANNING } from '@/balancing/config/idleVillage/quests/questPlanning';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { defaultQuestItems, toEngineFlag } from '@/balancing/config/idleVillage/quests/questItems';
import { useMinimalGameplayWithIdleVillageConfig, useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotBlueprint, DropState, SlotSeatPhase } from '@/ui/idleVillage/slots/types';
import type { GetResidentCompatibility } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { useDragOutcome, elementCenter, getSlotComponentElement } from '@/ui/idleVillage/interaction/useDragOutcome';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { resolveQuestOffer, estimateForPartyAsync, scenarioForQuest, type PartyEstimate, type ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import { computeForecastDelta, type ForecastDelta, type QuestSimulationChunkTiming } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { memberReveals, planningHints } from '@/ui/idleVillage/questS1Lab/questCertainty';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { questHaloProgress } from '@/ui/idleVillage/questS1Lab/questSchedule';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { availableOptions, ENGINE_SCHEMA_VERSION } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestId, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { journeyFasiOf } from './questJourney';
import { resolveQuestJourneyLaunchSpec } from './questJourneyAuthoring';
import { WANDERLUST_PRESENTATION_MANIFEST } from '@/ui/idleVillage/config/presentationConfig';
import type { QuestRunApi } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { buildExpeditionParty, loadoutDuration, planSlotSwap, type BagStockEntry } from './questExpedition';
import type { SlotTokenDragData } from '@/ui/idleVillage/components/ResidentSlotRack';
import { runIdOf, beginSettlement as beginRunSettlement, commitSettlement as commitRunSettlement, settlementResourceDelta, type SettlementDeps, type SettlementMarker } from './questSettlement';
import { useRewardAck } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { emptyStashBag, remainingFor, useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { QuestExpeditionDetail } from './QuestExpeditionDetail';

/** Loadout candidates (PLAN-036, R-195): the bag sells EXACTLY what the
 *  village warehouse stocks — single source `VILLAGE_STASH_CONFIG.items`,
 *  whose schema already guarantees every row is a bag-legal consumable
 *  with a real `engineFlag` channel (`isExpeditionItem`'s bar). The run
 *  consumes the item's engine flag, never the shelf row. */
const EXPEDITION_ITEMS: BagStockEntry[] = VILLAGE_STASH_CONFIG.items.map((row) => ({
  item: defaultQuestItems[row.itemId],
  qty: row.qty,
}));

/** Resolved-offer cache: `resolveQuestOffer` is deterministic on
 *  `(poiId, daysPlayed)` — the expensive part is the reference-band sim,
 *  which must not rerun on every detail open. */
const offerCache = new Map<string, ResolvedQuestOffer>();

/** PLAN-053: the journey route's origin — the settlement anchor authored
 *  in the world manifest (`village_01`). Fail-safe: a missing anchor would
 *  silently draw a broken route, so the lookup throws at module load. */
const VILLAGE_ORIGIN = (() => {
  const anchor = WANDERLUST_PRESENTATION_MANIFEST.anchors?.find((a) => a.type === 'settlement');
  if (!anchor) throw new Error('useQuestExpeditionSession: nessun anchor di tipo settlement nel manifest di presentazione');
  return { x: anchor.x, y: anchor.y };
})();

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
  /** Opens the village-owned stash from the planner bag control. */
  onOpenStash: (trigger: HTMLElement) => void;
  /** Where the planning panel first appears (viewport px). */
  detailPosition?: { x: number; y: number };
  /**
   * PLAN-043 WS-2: optional wrapper applied around the mounted
   * `QuestExpeditionDetail` — the three-zone stage wraps it in a
   * `StagePanelFrame` (suspension treatment + zone-aware drag claim) while
   * the session keeps owning `isDetailOpen`. Identity `node => node` default.
   */
  wrapDetail?: (node: React.ReactNode) => React.ReactNode;
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
  onOpenStash,
  detailPosition,
  wrapDetail,
}: QuestExpeditionSessionOptions) {
  const { t, i18n } = useTranslation('idleVillage');
  const { residentsById } = useRosterKitData();
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  /* The scenario follows the content locale (R-234, T-A13): a language change must rebuild it, or the
   * planner keeps the English captured at mount. */
  const scenario = useMemo(() => scenarioForQuest(poi.questId), [poi.questId, i18n.language]);
  const run = questRun.run;

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolved, setResolved] = useState<ResolvedQuestOffer | null>(null);
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const [resolvePending, setResolvePending] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  /* PLAN-073: the bag is ledger-derived, never local state — the warehouse
   *  shelf and every competing planner read the same `bags[poi.id]` slice,
   *  and draft reservations survive closing the panel by design. */
  const stashBag = useVillageStashStore((s) => s.bags[poi.id]);
  const stashBags = useVillageStashStore((s) => s.bags);
  const stashCommitted = useVillageStashStore((s) => s.committed);
  const selectedItemIds = useMemo(() => (stashBag ?? emptyStashBag()).filter((id): id is string => Boolean(id)), [stashBag]);
  /* The picker's stock badge reads the real pool: remaining copies worldwide,
   *  plus any copy already packed in THIS bag (it is returnable, so it still
   *  counts as available to its owner). */
  const expeditionItems = useMemo<BagStockEntry[]>(
    () =>
      EXPEDITION_ITEMS.map((entry) => ({
        ...entry,
        qty: remainingFor(entry.item.id, stashBags, stashCommitted) + ((stashBag ?? []).includes(entry.item.id) ? 1 : 0),
      })),
    [stashBags, stashCommitted, stashBag],
  );
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  /** R-183: the slot whose token is being dragged onto another slot. */
  const [swapFromSlotId, setSwapFromSlotId] = useState<string | null>(null);
  /* PLAN-043 WS-1 swap re-bite: per-seat replay counter — bumped by
   * `commitSwap` on BOTH seats when a slot↔slot swap lands, merged into the
   * rack's view models so each SeatCycle re-seats exactly once. */
  const [seatNonces, setSeatNonces] = useState<Record<string, number>>({});
  /* Swap guard: latest extraction-seat phase reported by each DetailSlot.
   * Ref (not state): the verdict must read the CURRENT phase inside
   * handleDragEnd/commitSwap, not a render-old snapshot. */
  const slotPhaseRef = useRef<Record<string, SlotSeatPhase>>({});
  const handleSlotPhaseChange = useCallback((slotId: string, phase: SlotSeatPhase) => {
    slotPhaseRef.current[slotId] = phase;
  }, []);
  /* A swap that passed the drag-end gate and is flying to the target seat —
   * commits atomically at the flight's `onComplete` (PLAN-043 WS-1), never at
   * pointer release. */
  const pendingSwapRef = useRef<{ fromSlotId: string; toSlotId: string; residentId: string } | null>(null);
  const [flyingResidentId, setFlyingResidentId] = useState<string | null>(null);
  /* R-265: rapid click-assign serialisation reads the REF (synchronous), while
   *  the STATE lands as a transition — the click's page-wide render becomes
   *  interruptible instead of one contiguous ~300–700 ms task inside the
   *  handler. The roster card dims a frame later at worst, and the flight
   *  itself already starts 50 ms out — the click no longer blocks the page. */
  const flyingResidentRef = useRef<string | null>(null);
  const setFlying = useCallback((id: string | null) => {
    flyingResidentRef.current = id;
    startTransition(() => setFlyingResidentId(id));
  }, []);
  /* R-257: resident mid slot→roster return — set urgently with the flight and
   *  released only when the deferred `assignments` clear commits, so the
   *  seat's medallion copy stays suppressed for the whole handoff (the proxy
   *  can land before the transition commits: without this the medal pops
   *  back into the seat for the gap). */
  const [returningResidentId, setReturningResidentId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{ key: string; value: PartyEstimate } | null>(null);
  /** Last completed estimate of a DIFFERENT configuration — the delta
   *  baseline (S3 T-2). Only real sims count as baseline ('incomplete'
   *  never does); reverting the party restores an identical sim because
   *  the seed derives from the inputs. */
  const prevEstimateRef = useRef<{ key: string; value: PartyEstimate } | null>(null);
  /** Last Monte-Carlo compute duration, exposed only through the existing E2E seam. */
  const forecastRequestIdRef = useRef(0);
  const forecastTimingRef = useRef<{
    key: string | null;
    startedAtMs: number | null;
    durationMs: number | null;
    attempts: number;
    aborted: number;
    requestId: number;
    chunks: QuestSimulationChunkTiming[];
  }>({
    key: null,
    startedAtMs: null,
    durationMs: null,
    attempts: 0,
    aborted: 0,
    requestId: 0,
    chunks: [],
  });
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
      /* R-248: party edits land as a TRANSITION — this hook lives in the
       * page, so an urgent setState renders the whole /game chrome in one
       * contiguous task (the ~200ms blocks the Director's probe measured).
       * A transition lets React split it; the seat fills a frame later.
       * Guards stay safe: rapid click-assigns are serialised by
       * `flyingResidentId` (kept urgent), and the updater form reads the
       * freshest state. */
      /* R-257: assigning the mid-exit resident consumes the return intent —
       * the clear can be coalesced with this assign into one commit (the
       * never-empty `assignments` keeps the watcher from releasing), so the
       * suppression must be lifted here or the seat medal stays hidden. */
      setReturningResidentId((current) => (current === residentId ? null : current));
      startTransition(() => {
        setAssignments((a) => ({ ...a, [slotBlueprintId]: residentId }));
      });
      trackTelemetryEvent('quest_expedition_assign', { poiId: poi.id, slotId: slotBlueprintId, residentId });
    },
    [poi.id],
  );

  const handleClear = useCallback(
    (slotBlueprintId: string) => {
      startTransition(() => {
        setAssignments((a) => ({ ...a, [slotBlueprintId]: null }));
      });
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

  /** Same gate a swap commits through (`planSlotSwap`) — shared by the drop
   *  verdict and the bloom the rack paints while the token is in the air. */
  const swapAllowed = useCallback(
    (fromSlotId: string, toSlotId: string) =>
      planSlotSwap(assignments, fromSlotId, toSlotId, (residentId, slotId) => eligibilityFor(residentId, slotId).eligible) !== null,
    [assignments, eligibilityFor],
  );

  /** The rack's view: during a swap drag every other slot blooms valid /
   *  invalid by the swap gate (the controller marks occupied slots `locked`,
   *  which says nothing about whether a trade would be accepted). */
  const rackSlots = useMemo(() => {
    const base = swapFromSlotId
      ? controller.slots.map((slot) =>
          slot.id === swapFromSlotId
            ? slot
            : { ...slot, dropState: swapAllowed(swapFromSlotId, slot.id) ? ('valid' as const) : ('invalid' as const) },
        )
      : controller.slots;
    /* PLAN-043 WS-1: surface each seat's replay counter — defined only after
     * a committed swap, so `data-seat-nonce` never appears on untouched seats
     * and the lab markup is byte-identical. */
    return base.map((slot) => (seatNonces[slot.id] !== undefined ? { ...slot, seatNonce: seatNonces[slot.id] } : slot));
  }, [swapFromSlotId, controller.slots, swapAllowed, seatNonces]);

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
  /* Party + forecast (immediate, chunked, abortable).                    */
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
  const partyMembersRef = useRef(partyMembers);
  partyMembersRef.current = partyMembers;

  const requiredFilled = useMemo(
    () => controller.slots.filter((s) => s.required).every((s) => s.assignedResidentId),
    [controller.slots],
  );

  /** Stable key over simulation inputs; image URL/object identity changes do
   *  not restart the same estimate, while stat/HP/trait changes do. */
  const estimateKey = useMemo(
    () =>
      resolved
        ? `${resolved.instance.instanceId}|${JSON.stringify(resolved.resolvedOffer)}|${JSON.stringify(
            partyMembers.map(({ id, name, role, stats, hp, traits }) => [id, name, role, stats, hp, traits ?? []]),
          )}`
        : null,
    [resolved, partyMembers],
  );

  useEffect(() => {
    const currentResolved = resolvedRef.current;
    if (!isDetailOpen || !currentResolved || !estimateKey) {
      startTransition(() => setEstimate(null));
      prevEstimateRef.current = null;
      return;
    }
    if (!requiredFilled) {
      startTransition(() => setEstimate({ key: estimateKey, value: 'incomplete' }));
      return;
    }
    const controllerAbort = new AbortController();
    const startedAtMs = performance.now();
    const previousTiming = forecastTimingRef.current;
    const requestId = ++forecastRequestIdRef.current;
    const attempts = previousTiming.key === estimateKey ? previousTiming.attempts + 1 : 1;
    const aborted = previousTiming.key === estimateKey ? previousTiming.aborted : 0;
    forecastTimingRef.current = { key: estimateKey, startedAtMs, durationMs: null, attempts, aborted, requestId, chunks: [] };
    let completed = false;
    estimateForPartyAsync(currentResolved.resolvedOffer, partyMembersRef.current, {
      runs: QUEST_PLANNING.forecastRuns,
      chunkRuns: QUEST_PLANNING.forecastChunkRuns,
      signal: controllerAbort.signal,
      onChunkTiming: import.meta.env.MODE === 'playwright'
        ? (timing) => {
            if (forecastTimingRef.current.requestId === requestId) {
              forecastTimingRef.current = {
                ...forecastTimingRef.current,
                chunks: [...forecastTimingRef.current.chunks, timing],
              };
            }
          }
        : undefined,
    })
      .then((value) => {
        completed = true;
        const chunkTimings = forecastTimingRef.current.requestId === requestId ? forecastTimingRef.current.chunks : [];
        forecastTimingRef.current = {
          key: estimateKey,
          startedAtMs,
          durationMs: performance.now() - startedAtMs,
          attempts,
          aborted,
          requestId,
          chunks: chunkTimings,
        };
        /* R-248: the estimate landing repaints the wing — presentational,
         *  so it lands as a transition instead of a contiguous urgent task. */
        startTransition(() => {
          setEstimate((prev) => {
            if (prev && prev.key !== estimateKey && typeof prev.value === 'object') {
              prevEstimateRef.current = prev;
            }
            return { key: estimateKey, value };
          });
        });
      })
      .catch(() => {
        /* Aborted = superseded by a newer estimate; swallow. */
      });
    return () => {
      controllerAbort.abort();
      if (!completed && forecastTimingRef.current.requestId === requestId) {
        forecastTimingRef.current = {
          ...forecastTimingRef.current,
          aborted: forecastTimingRef.current.aborted + 1,
        };
      }
    };
  }, [isDetailOpen, estimateKey, requiredFilled]);

  /** Signed pp shift vs the previous party configuration (S3 T-2) — only
   *  when a real previous sim exists and the current one has landed. */
  const forecastDelta = useMemo<ForecastDelta | null>(() => {
    const cur = estimate && estimate.key === estimateKey ? estimate.value : null;
    const prev = prevEstimateRef.current;
    if (!cur || typeof cur !== 'object' || !prev || typeof prev.value !== 'object') return null;
    return computeForecastDelta(cur.sim, prev.value.sim);
  }, [estimate, estimateKey]);

  /* `revealAtPlanning` (S3 T-1/D-S3-3): nodes whose `revealHint` unlocks
   *  because an assigned member meets the slot's stat threshold.
   *  TODO(S3, Director 2026-10-10): intel source must move off party slots —
   *  scouting is an external system (explorer building/resident, not yet on
   *  /game). The slot-seam stays authored but no canonical slot carries it. */
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
    /* The instance keeps the authored English (its hash); the hints the player reads follow the content locale. */
    return planningHints(localizeNodes(nodes, poi.questId), revealedNodeIds).slice(0, QUEST_PLANNER_INFO.maxPreviewHints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, revealedNodeIds, poi.questId, i18n.language]);

  /** LOADOUT duration channel (S3 T-3, desiderata v24 #7): items declaring
   *  `durationMult`/`durationDelta` reshape the run's real pace — the
   *  launch clock AND the estimate chip share this one derivation.
   *  R-231: `poi.ticksPerNode` and `poi.estimatedDurationTicks` are the
   *  normative authority (e.g. 10 ticks/node × 11 nodes = 110 ticks ≈ 2m
   *  for `poi-goblin`, instead of multiplying `durationDays × dayLengthInTimeUnits`). */
  const baseNodeTicks = poi.ticksPerNode;
  const expeditionSpanTicks = poi.estimatedDurationTicks;
  const expeditionDuration = useMemo(
    () => loadoutDuration(selectedItemIds, baseNodeTicks, expeditionSpanTicks),
    [selectedItemIds, baseNodeTicks, expeditionSpanTicks],
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
        const itemIds = new Set(EXPEDITION_ITEMS.map((e) => e.item.id));
        /* Re-validate at restore: a resident may have died/left since the
         *  draft was written — never resurrect an ineligible assignment. */
        const restored: Record<string, string | null> = {};
        for (const [slotId, residentId] of Object.entries(draft.assignments ?? {})) {
          if (residentId && slotBlueprints.some((s) => s.id === slotId) && eligibilityFor(residentId, slotId).eligible) {
            restored[slotId] = residentId;
          }
        }
        setAssignments(restored);
        /* PLAN-073: bag contents are the ledger's, not the draft's — a
         *  legacy draft's `items` field is a hint applied only when this
         *  POI owns no reservations yet (and only while availability
         *  still holds: `assign` re-validates at mutation time). */
        const stash = useVillageStashStore.getState();
        if (stash.hydration === 'ready' && !(stash.bags[poi.id] ?? []).some(Boolean)) {
          (draft.items ?? [])
            .filter((id) => itemIds.has(id))
            .slice(0, QUEST_STASH.bagSlots)
            .forEach((id) => stash.assign(poi.id, id));
        }
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
  /* Settlement (S2.5 → R-260): the report's lifecycle drives the journal.  */
  /*  begin — the report's first painted frame persists `settling`         */
  /*  (frozen plan + durable "shown" bit); NO aggregate mutation —         */
  /*  resources stay unchanged at arrival until the player dismisses       */
  /*  the report. commit — the report's dismissal applies the effects,     */
  /*  releases the loadout and stamps `settled`, then publishes the        */
  /*  transient resource delta for the HUD chip. replay — a `settling`     */
  /*  marker on the first hydrated run = the report was shown but never    */
  /*  dismissed (reload mid-ceremony) → auto-commit once, no ceremony.     */
  /* ------------------------------------------------------------------ */
  const settleDeps = useMemo<SettlementDeps>(
    () => ({
      persistRun: (marker: SettlementMarker) => questRun.applySettlement(marker),
      applyToStore: (plan) => {
        useMinimalGameplayStore.getState().applyQuestSettlement(plan);
      },
      releaseLoadout: (runId) => {
        /* PLAN-073: terminal transitions free the run's committed slots —
         *  the copies return to the shared pool (derived availability). */
        useVillageStashStore.getState().releaseCommit(runId);
      },
      nowTick: () => useMinimalGameplayStore.getState().state.currentTick,
      questTitle: scenario?.title,
    }),
    [questRun, scenario?.title],
  );

  /** R-260 begin: persist `settling` (frozen plan) — the report's painted
   *  frame is the trigger; this call alone moves no resources. */
  const beginSettlement = useCallback(async () => {
    const current = questRun.run;
    if (!current?.ended || current.settlement) return;
    trackTelemetryEvent('quest_settlement_begin', { poiId: poi.id, runId: runIdOf(current), outcome: current.outcome });
    await beginRunSettlement(current, settleDeps).catch((error) =>
      trackTelemetryEvent('quest_settlement_error', {
        poiId: poi.id,
        runId: runIdOf(current),
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }, [questRun, settleDeps, poi.id]);

  /* The report paints → begin. The popup's own first-frame stamp
   *  (`markRewardShown` → rewardAck) is the shown signal; the durable side
   *  of the boundary is the persisted `settling` marker. */
  const rewardAck = useRewardAck(poi.questId);
  const reportShown = Boolean(run?.ended && rewardAck && rewardAck === runIdOf(run));
  useEffect(() => {
    if (!reportShown) return;
    void beginSettlement();
  }, [reportShown, beginSettlement]);

  /** R-260 commit: the report's dismissal applies the plan → `settled`,
   *  then stamps the granted delta for the HUD readout chip. Returns the
   *  marker so callers can await the write; null when nothing committed. */
  const commitInFlightRef = useRef(false);
  const commitSettlement = useCallback(async (): Promise<SettlementMarker | null> => {
    const current = questRun.run;
    if (!current?.ended || current.settlement?.status === 'settled' || commitInFlightRef.current) return null;
    commitInFlightRef.current = true;
    const runId = runIdOf(current);
    trackTelemetryEvent('quest_settlement_commit', { poiId: poi.id, runId, outcome: current.outcome });
    try {
      const done = await commitRunSettlement(current, settleDeps);
      trackTelemetryEvent('quest_settlement_done', { poiId: poi.id, runId, outcome: current.outcome });
      const delta = settlementResourceDelta(done.plan);
      if (delta.gold > 0 || delta.xp > 0) {
        useMinimalGameplayStore.getState().publishResourceDelta(delta);
      }
      return done;
    } catch (error) {
      trackTelemetryEvent('quest_settlement_error', {
        poiId: poi.id,
        runId,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      commitInFlightRef.current = false;
    }
  }, [questRun, settleDeps, poi.id]);

  /* R-260 replay: the FIRST hydrated run is authoritative — a persisted
   *  `settling` means the report showed and the dismissal never landed
   *  (reload mid-ceremony, or a legacy crash mid-settle). Auto-commit once
   *  through the same idempotent kernel; `replayedRef` latches on the first
   *  non-null run so a fresh in-session `settling` never self-commits. */
  const replayedRef = useRef(false);
  useEffect(() => {
    if (replayedRef.current || !run) return;
    replayedRef.current = true;
    if (run.ended && run.settlement?.status === 'settling') void commitSettlement();
  }, [run, commitSettlement]);

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
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    /* PLAN-053 T-004: a journey-enabled POI (authored `fasi`) freezes its
     *  launch spec here — route endpoints, authored beat plans, the
     *  sampled day-length — so the run's andata/svolgimento/ritorno legs
     *  replay identically after a reload. Legacy POIs get `undefined` and
     *  keep the pre-journey lifecycle. */
    const journey = journeyFasiOf(poi)
      ? resolveQuestJourneyLaunchSpec({
          poi,
          nodes: resolved.instance.nodes,
          startNode: resolved.instance.startNode,
          origin: VILLAGE_ORIGIN,
          ticksPerDay: useMinimalGameplayStore.getState().config.globalRules.dayLengthInTimeUnits,
          nodeTicks: expeditionDuration.nodeTicks,
          runSeed: seed,
          engineSchemaVersion: ENGINE_SCHEMA_VERSION,
          scenarioHash: resolved.instance.scenarioHash,
          launchedAtTick: currentTick,
        })
      : null;
    /* PLAN-073 commit boundary: the draft bag freezes under the run's
     *  identity BEFORE the run starts; a launch failure rolls the bag back
     *  untouched (`rollbackCommit` restores the exact slot layout). */
    const runId = resolved.instance.instanceId;
    const stash = useVillageStashStore.getState();
    if (!stash.commitRun(runId, poi.id)) {
      /* Ledger not hydrated or degraded — refuse the launch rather than
       *  start a run whose loadout the shelf never saw. */
      sendingRef.current = false;
      return;
    }
    try {
    questRun.start({
      party: { members },
      seed,
      questId: poi.questId,
      loadout: selectedItemIds,
      clock: { nodeTicks: expeditionDuration.nodeTicks, startTick: currentTick },
      scenarioInstance: resolved.instance,
      resolvedOffer: resolved.resolvedOffer,
      ...(journey ? { journey } : {}),
    });
    } catch (error) {
      stash.rollbackCommit(runId);
      sendingRef.current = false;
      throw error;
    }
    /* R-139: the party is «away» for the village store too — wounds do not
     *  heal while assigned. Released by `applyPlanToState` at settlement. */
    useMinimalGameplayStore.getState().setResidentsOnExpedition(
      members.map((m) => m.id),
      true,
    );
    clearDraft();
    setIsDetailOpen(false);
    setAssignments({});
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
  /* demoLaunch — staging shortcut (Director panel)                       */
  /* ------------------------------------------------------------------ */
  const demoLaunchPending = useRef(false);
  /**
   * Stages a one-click expedition through the SAME canonical launch a
   * player triggers: opens the detail, auto-fills required slots with the
   * first eligible roster residents (one slot per render pass, so
   * `assignments`/`assignedIds`/`eligibilityFor` recompute for real), then
   * crosses the real `send` boundary — offer freeze, party re-validation,
   * loadout reservation, settlement wiring. No lab-preset shortcut. If no
   * eligible resident exists for a required slot, the detail stays open so
   * the blocked state stays visible.
   */
  const demoLaunch = useCallback(() => {
    demoLaunchPending.current = true;
    setIsDetailOpen(true);
  }, []);
  useEffect(() => {
    if (!demoLaunchPending.current) return;
    /* A live run blocks the real send too — cancel instead of holding a
     *  pending launch that could fire unexpectedly when the run settles. */
    if (anyRunActive) {
      demoLaunchPending.current = false;
      return;
    }
    if (!resolved) return;
    const missing = slotBlueprints.find((s) => s.required && !assignments[s.id]);
    if (missing) {
      const candidateId = Object.keys(residentsById).find(
        (id) => !assignedIds.includes(id) && eligibilityFor(id, missing.id).eligible,
      );
      if (candidateId) {
        handleAssign(missing.id, candidateId);
      } else {
        /* No eligible resident: the real path can't launch either — leave
         *  the detail open so the blocked state stays visible. */
        demoLaunchPending.current = false;
      }
      return;
    }
    if (selectedItemIds.length === 0) {
      /* Pack the canonical default bag too — a staged run should look like
       *  a real packed expedition, not an empty-handed one. The next pass
       *  re-runs with the loadout applied, then crosses `send()`. */
      const pack = QUEST_STASH.defaultLoadout
        .map((flag) => EXPEDITION_ITEMS.find((e) => toEngineFlag(e.item.id) === flag)?.item.id)
        .filter((id): id is string => Boolean(id))
        .slice(0, QUEST_STASH.bagSlots);
      if (pack.length > 0) {
        /* Ledger assign — availability-gated like a real pack (PLAN-073). */
        const stash = useVillageStashStore.getState();
        pack.forEach((id) => stash.assign(poi.id, id));
        return;
      }
    }
    if (canSend) {
      demoLaunchPending.current = false;
      send();
    }
  }, [resolved, anyRunActive, slotBlueprints, assignments, residentsById, assignedIds, eligibilityFor, handleAssign, canSend, send, selectedItemIds]);

  /* ------------------------------------------------------------------ */
  /* Drag & drop — same flight contract as the mock session: the verdict  */
  /*  object tells the roster kit where to fly, the flight's completion    */
  /*  performs the assignment. Drops that don't target this session's      */
  /*  slots return `undefined` so the page can offer them elsewhere.       */
  /* ------------------------------------------------------------------ */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as Partial<SlotTokenDragData> | undefined;
      if (data?.type === 'slot-token') {
        /* A slotted token, not a roster card: only the owning session arms
         *  the swap preview — a roster resident drag stays untouched. */
        if (data.slotId && slotBlueprints.some((s) => s.id === data.slotId)) setSwapFromSlotId(data.slotId);
        return;
      }
      setDraggingResidentId(event.active.id as string);
    },
    [slotBlueprints],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent): RosterDropVerdict => {
      setDraggingResidentId(null);
      const tokenData = event.active.data.current as Partial<SlotTokenDragData> | undefined;
      if (tokenData?.type === 'slot-token') {
        /* R-183 slot↔slot swap: the resident never leaves the rack — the
         *  drop moves it to an empty slot or trades places with the occupant,
         *  each landing re-checked by the quest eligibility gate. */
        const fromSlotId = tokenData.slotId;
        if (!fromSlotId || !slotBlueprints.some((s) => s.id === fromSlotId)) return; // another session's token
        setSwapFromSlotId(null);
        const toSlotId = event.over?.id as string | undefined;
        if (!toSlotId || !isDetailOpen || run) return false;
        if (toSlotId === fromSlotId) return true;
        if (!slotBlueprints.some((s) => s.id === toSlotId)) return false;
        /* PLAN-043 WS-1 seat guard: a trade is refused while EITHER seat's
         * extraction machine is busy — the token returns to its own castone
         * (BV-05). The origin seat reports `idle` during its own token drag:
         * the drag itself cancelled the hold, so the occupant is stable. */
        if (slotPhaseRef.current[fromSlotId] !== 'idle' || slotPhaseRef.current[toSlotId] !== 'idle') return false;
        const next = planSlotSwap(assignments, fromSlotId, toSlotId, (rid, sid) => eligibilityFor(rid, sid).eligible);
        if (!next) return false;
        /* Commit at the flight's LANDING, not at pointer release (PLAN-043
         * WS-1): the token flies from the release point to the target seat;
         * `handlePageFlightComplete` → `commitSwap` swaps both occupants and
         * bumps both seat nonces in one render. */
        const to = elementCenter(getSlotComponentElement(toSlotId));
        if (!to) return false;
        const movingResidentId = tokenData.residentId ?? assignments[fromSlotId];
        if (!movingResidentId) return false;
        pendingSwapRef.current = { fromSlotId, toSlotId, residentId: movingResidentId };
        startFlight({
          residentId: movingResidentId,
          slotId: toSlotId,
          isInset: true,
          toX: to.x,
          toY: to.y,
        });
        return true;
      }
      const residentId = event.active.id as string;
      const overId = event.over?.id as string | undefined;
      if (!overId) return;
      const slot = controller.slots.find((s) => s.id === overId);
      if (!slot) return; // not ours — let the page route it elsewhere

      if (!isDetailOpen || run) return false;
      const resident = residentsById[residentId];
      if (!resident || assignedIds.includes(residentId)) return false;
      if (slot.assignedResidentId || !eligibilityFor(residentId, slot.id).eligible) return false;

      const element = getSlotComponentElement(slot.id);
      return { flightToSlot: { slotId: slot.id, element } };
    },
    [controller.slots, isDetailOpen, run, residentsById, assignedIds, eligibilityFor, slotBlueprints, assignments, poi.id, startFlight],
  );

  /* PLAN-043 WS-1 swap commit: fires at the token's LANDING on the target
   * seat, never at pointer release. One atomic render swaps both occupants
   * AND bumps both seat nonces — the two SeatCycles re-seat together, no
   * empty flash, no A/B desync (WITNESS-07's grok race). The idle-seat guard
   * is re-checked on the TARGET only: a hold started on it during the flight
   * still refuses. The SOURCE seat is deliberately not re-checked — its
   * cancelled-pull decay keeps `isExtracting` true for up to cancelMs after
   * the drop, which would silently eat the swap it belongs to (the drag-end
   * guard already vetted the pre-drag state). */
  const commitSwap = useCallback(
    (fromSlotId: string, toSlotId: string, residentId: string) => {
      if (slotPhaseRef.current[toSlotId] !== 'idle') return false;
      const next = planSlotSwap(assignments, fromSlotId, toSlotId, (rid, sid) => eligibilityFor(rid, sid).eligible);
      if (!next) return false;
      /* R-248: same transition treatment as assign/clear — the swap commit
       *  lands at the flight's end, so the page render is interruptible. */
      startTransition(() => {
        setAssignments(next);
        setSeatNonces((prev) => ({
          ...prev,
          [fromSlotId]: (prev[fromSlotId] ?? 0) + 1,
          [toSlotId]: (prev[toSlotId] ?? 0) + 1,
        }));
      });
      trackTelemetryEvent('quest_expedition_swap', {
        poiId: poi.id,
        fromSlotId,
        toSlotId,
        residentId,
        displacedId: assignments[toSlotId] ?? null,
      });
      return true;
    },
    [assignments, eligibilityFor, poi.id],
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
      if (flyingResidentRef.current || !isDetailOpen || run) return false;
      const slot = findAcceptingSlot(residentId);
      if (!slot) return false;
      const from = elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`));
      if (!from) return false;
      setFlying(residentId);
      window.setTimeout(() => {
        const to = elementCenter(getSlotComponentElement(slot.id));
        if (!to) {
          setFlying(null);
          return;
        }
        startFlight({ residentId, slotId: slot.id, isInset: true, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
      }, 50);
      return true;
    },
    [isDetailOpen, run, findAcceptingSlot, startFlight, setFlying],
  );

  /** Extraction → spring-back (R-248): the seat clears AND the extracted
   *  token flies back to its roster card — the same contract
   *  `useQuestPoiSession.handleSlotClear` already honours. A clear issued
   *  while another flight is airborne keeps the clear but skips the return
   *  flight (the page-flight machine carries one token at a time). */
  const handleSlotClear = useCallback(
    (slotBlueprintId: string) => {
      const residentId = assignments[slotBlueprintId];
      controller.clearSlot(slotBlueprintId);
      if (!residentId || flyingResidentRef.current) return;
      const from = elementCenter(getSlotComponentElement(slotBlueprintId));
      /* R-257: under a roster filter ('available' and friends) the slotted
       *  card is filtered OUT of the DOM — without a fallback the return
       *  flight silently never ran. Land on the roster list itself (then the
       *  container): the card pops back in exactly where the proxy lands. */
      const to =
        elementCenter(document.querySelector(`[data-resident-id="${residentId}"]`))
        ?? elementCenter(document.querySelector('[data-resident-count]'))
        ?? elementCenter(document.querySelector('[data-testid="drag-test-container"]'));
      if (from && to) {
        setReturningResidentId(residentId);
        setFlying(residentId);
        startFlight({
          residentId,
          slotId: slotBlueprintId,
          isInset: false,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
        });
      }
    },
    [assignments, controller.clearSlot, startFlight, setFlying],
  );

  const handlePageFlightComplete = useCallback(
    (residentId: string, slotId?: string, isInset?: boolean) => {
      /* A swap that passed the drag-end gate commits HERE, at landing — the
       * residentId check keeps a stale pending swap from hijacking a later
       * roster flight that happens to land on the same seat. */
      const swap = pendingSwapRef.current;
      pendingSwapRef.current = null;
      if (swap && isInset && slotId === swap.toSlotId && residentId === swap.residentId) {
        commitSwap(swap.fromSlotId, swap.toSlotId, residentId);
      } else if (isInset && slotId) {
        handleAssign(slotId, residentId);
      }
      setFlying(null);
      settleFlight();
    },
    [handleAssign, settleFlight, commitSwap, setFlying],
  );

  /* R-257: the seat suppression outlives the proxy: it lifts only once the
   *  deferred `assignments` clear commits — the roster card pops back in
   *  exactly as the seat's copy would re-render, so a medallion never
   *  flashes back into the seat between landing and commit. */
  useEffect(() => {
    if (!returningResidentId || Object.values(assignments).includes(returningResidentId)) return;
    setReturningResidentId(null);
  }, [assignments, returningResidentId]);

  /* R-257: every resident whose seat medallion is rendered elsewhere —
   *  the airborne flight AND the mid-exit resident whose deferred clear is
   *  still uncommitted (they can differ when a new flight starts before an
   *  earlier return's clear lands). */
  const suppressedResidentIds = useMemo(
    () => [flyingResidentId, returningResidentId].filter((id): id is string => Boolean(id)),
    [flyingResidentId, returningResidentId],
  );

  /* ------------------------------------------------------------------ */
  /* POI marker + routing.                                                */
  /* ------------------------------------------------------------------ */
  const handlePoiClick = useCallback(() => {
    /* R-133: the run window answers the click only while the expedition is
     * actually under way. Offers with no run — and runs already ended — open
     * the POI detail instead (the report stays reachable via the Panels menu). */
    if (run && !run.ended) {
      onOpenRun?.(poi.questId);
    } else {
      setIsDetailOpen(true);
    }
  }, [run, onOpenRun, poi.questId]);

  const halo = useMemo(
    () => (run ? questHaloProgress(run, poi, currentTick) : null),
    [run, poi, currentTick],
  );
  /* PLAN-034 T-005/RC-1: the halo feeds the 1000-line medallion subtree. The
   * clock ticks faster than the seal can be drawn (~50 attribute writes per
   * render — the `map-quest-poi` storm of the T-002 trace), so `poiView` samples
   * the halo at QUEST_HALO_RENDER_MS: the marker subtree stays referentially
   * stable between samples and React bails out of it on the in-between ticks. */
  const haloView = useThrottledValue(halo, QUEST_HALO_RENDER_MS);
  /* …and quantised to the seal's own letter grid (QUEST_HALO_STEPS): steps the
   * rim cannot show are never rendered. */
  const haloFraction = Math.round((haloView?.fraction ?? 0) * QUEST_HALO_STEPS) / QUEST_HALO_STEPS;
  const haloStatus = haloView?.status ?? null;

  const questStatus: 'available' | 'in_progress' | 'completed' | 'failed' = !run
    ? 'available'
    : run.ended
      ? run.outcome === 'reward' || run.outcome === 'survived'
        ? 'completed'
        : 'failed'
      : 'in_progress';

  /* `gameplay` is the whole store — a new identity on every tick — while the
   * marker contract only reads `state.isPaused` (MapQuestPoiSessionShape).
   * A slim, referentially-stable view keeps it from breaking `poiView`'s
   * memo on every clock update (PLAN-034 T-005). */
  const poiGameplay = useMemo(
    () => ({ state: { isPaused: gameplay.state?.isPaused ?? false } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameplay.state?.isPaused],
  );

  const poiView = useMemo(
    () => ({
      activity: { id: poi.id, label: scenario?.title ?? poi.id },
      questStatus,
      activityProgress: haloFraction,
      /* No drop-on-POI for the real path: the detail's slot rack is the
       * only landing zone (T-1 trusted contract). */
      poiDropId: `expedition-poi-drop-${poi.id}`,
      canAcceptPoiDrop: false,
      handlePoiClick,
      draggingResidentId,
      gameplay: poiGameplay,
      haloStatus,
      /* D-H-4 badge: the frontier sits on a player-owned node — «the
       *  expedition waits for you», independent of halo fill. */
      decisionWaiting: Boolean(run && !run.ended && run.frontier.status === 'waiting'),
    }),
    [poi.id, scenario?.title, questStatus, haloFraction, haloStatus, handlePoiClick, draggingResidentId, poiGameplay],
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
    pendingSwapRef.current = null;
  }, []);

  /* PLAN-073: the picker's toggle delegates to the ledger — in-bag ⇒ release
   *  at its slot, out-of-bag ⇒ assign first-free (full bag and stock-out are
   *  announced rejects, never silent no-ops). */
  const toggleItem = useCallback(
    (itemId: string) => {
      const stash = useVillageStashStore.getState();
      const slot = (stash.bags[poi.id] ?? []).indexOf(itemId);
      if (slot >= 0) stash.release(poi.id, slot);
      else stash.assign(poi.id, itemId);
    },
    [poi.id],
  );

  /* PLAN-073 D-2: per-owner release-all — the bag's «reset party» twin. */
  const releaseAllItems = useCallback(() => {
    useVillageStashStore.getState().releaseAll(poi.id);
  }, [poi.id]);

  /* Binding: opening the shelf from THIS planner claims it for this owner —
   *  the page opens the panel and restores focus as before. */
  const handleOpenStash = useCallback(
    (trigger: HTMLButtonElement) => {
      useVillageStashStore.getState().bindStash(poi.id);
      onOpenStash(trigger);
    },
    [poi.id, onOpenStash],
  );

  const overlays = (
    <>
      {isDetailOpen && (!run || run.ended) &&
        (wrapDetail ?? ((node) => node))(
        <QuestExpeditionDetail
          poi={poi}
          scenario={scenario}
          resolved={resolved}
          resolvePending={resolvePending}
          slots={rackSlots}
          estimate={estimate?.key === estimateKey ? estimate.value : 'computing'}
          forecastDelta={forecastDelta}
          intelHints={intelHints}
          expeditionDuration={expeditionDuration}
          requiredFilled={requiredFilled}
          items={expeditionItems}
          selectedItemIds={selectedItemIds}
          onToggleItem={toggleItem}
          onReleaseAllItems={releaseAllItems}
          onOpenStash={handleOpenStash}
          canSend={canSend}
          onSend={send}
          onClose={closeDetail}
          onSlotClear={handleSlotClear}
          suppressedResidentIds={suppressedResidentIds}
          onSlotPhaseChange={handleSlotPhaseChange}
          position={detailPosition}
        />
      )}
      <DragOutcomeFlight state={pageFlight} residentsById={residentsById} onComplete={handlePageFlightComplete} />
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
       *  revert exercises the real recompute chain (S3 T-2 reversibility).
       *  R-248: routed through `handleSlotClear` so the seam also replays
       *  the extraction's return flight, like the rack does. */
      clearSlot: (slotBlueprintId: string) => handleSlotClear(slotBlueprintId),
      /* PLAN-043 WS-1 witnesses: the swap commit itself (phase guard included)
       *  and the seat observables BV-04/BV-05 assert on. */
      commitSwap: (fromSlotId: string, toSlotId: string) =>
        commitSwap(fromSlotId, toSlotId, assignments[fromSlotId] ?? ''),
      getSlotPhase: (slotBlueprintId: string) => slotPhaseRef.current[slotBlueprintId] ?? 'idle',
      getSeatNonces: () => seatNonces,
      toggleItem,
      getAssignments: () => assignments,
      getEstimate: () => estimate?.value ?? null,
      /* Serialized estimate — lets a test detect a recomputed forecast
       * without shipping object identity across the evaluate boundary. */
      getEstimateJson: () => JSON.stringify(estimate?.value ?? null),
      /** Last actual chunked-simulation time, excluding React scheduling. */
      getForecastTiming: () => forecastTimingRef.current,
      getResolvedOffer: () => resolved?.resolvedOffer ?? null,
      getRun: () => questRun.run,
      getSettlement: () => questRun.run?.settlement ?? null,
      /* R-260: the report-dismissal commit — same boundary `onClose` lands
       *  on, so a test exercises the real collect path. */
      commitSettlement: () => commitSettlement(),
      /* The village journal entries settlement narrated (PLAN-019-S4 T-1)
       *  — the loop test asserts the village HEARD what happened, not just
       *  that the numbers moved. Read-only tail of `state.eventLog`. */
      getEventLog: () =>
        useMinimalGameplayStore.getState().state.eventLog?.map((e) => ({
          type: e.type ?? null,
          residentId: e.residentId ?? null,
          messageKey: e.messageKey ?? null,
          messageParams: e.messageParams ?? null,
        })) ?? [],
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
            /* R-183: quest XP credited to the resident by settlement. */
            xp: r.xp ?? 0,
          })),
        };
      },
      /* The player's command on a waiting frontier — the same api the
       *  QuestRunWindow buttons call, so catch-up paths stay honest. */
      choose: (optionId: string, useConsumable = false) => questRun.choose(optionId, { useConsumable }),
      getOptions: () => (questRun.run ? availableOptions(questRun.run).map((o) => o.id) : []),
      getHalo: () => halo,
      isDetailOpen: () => isDetailOpen,
      /* PLAN-043 WS-4 BV probes: one canonical launch (real send boundary,
       *  default bag packed) — the same path the Director's demo button
       *  takes, so cluster/geometry witnesses never stage a fake run. */
      demoLaunch: () => demoLaunch(),
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
    demoLaunch,
    closeDetail,
    questStatus,
    halo,
    poiView,
    /* R-260: the report-dismissal boundary — the page's reward popup
     *  `onClose` calls it; all close paths converge here. */
    commitSettlement,
    overlays,
    gameplay,
    draggingResidentId,
    /* R-257: the rack suppresses the seat medallion while this resident's
     *  flight proxy is airborne — never two identical medallions at once. */
    flyingResidentId,
    suppressedResidentIds,
    /** Drag cancel resets both drag kinds (roster card and slot token). */
    setDraggingResidentId: (id: string | null) => {
      setDraggingResidentId(id);
      if (id === null) setSwapFromSlotId(null);
    },
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
