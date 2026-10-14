/**
 * Meta-Layer engine core (PLAN-030 / R-164).
 *
 * Pure, deterministic engine for the opportunity-layer prototype:
 * flat `qualities` world state + transient offer generation + gated
 * commitment (leader-capacity) + graduated resolution + write-back.
 *
 * Ratified rules implemented here:
 * - hybrid model: qualities + authored milestones (offers are NOT nodes);
 * - 4 computed gate states on every offer (locked/underprepared/ready/
 *   over-qualified) with scout-band narrowing by explorer quality;
 * - dual timers: acceptanceTicks (offer expiry) vs completionTicks
 *   (post-commit deadline) + optional appearance window;
 * - steering = visible weight multiplier, never a filter;
 * - parallel capacity = leader count only;
 * - no offline: time advances only through explicit advanceTime ticks.
 */

import type {
  GateState,
  MetaLayerConfig,
  MetaLayerTuning,
  MilestoneNode,
  OfferDef,
  QualityDelta,
  QualityKey,
  RequirementRef,
  SteeringBias,
} from '@/balancing/config/metaLayer';
import { mulberry32 } from './rng';

/* ------------------------------------------------------------------------ */
/* Types                                                                     */
/* ------------------------------------------------------------------------ */

/** Flat world state: quality key → integer level. */
export interface WorldState {
  tick: number;
  qualities: Record<QualityKey, number>;
}

/** Party description at meta-layer granularity (no roster detail). */
export interface PartyCapability {
  /** Total leaders — parallel capacity. */
  leaders: number;
  /** 0..1 — how good the party is at scouting (narrows risk bands). */
  explorerQuality: number;
  /** Capability tags owned (match offer `capability` requirements). */
  capabilities: string[];
  /** Named stats (match `stat` requirements via `min`). */
  stats: Record<string, number>;
}

/** An offer instance currently on the board. */
export interface LiveOffer {
  instanceId: string;
  defId: string;
  generatedAt: number;
  /** expiresAt = generatedAt + acceptanceTicks. */
  expiresAt: number;
}

/** A committed (accepted) quest occupying a leader until resolution. */
export interface CommittedQuest {
  instanceId: string;
  defId: string;
  leaderIndex: number;
  startedAt: number;
  /** startedAt + durationTicks — when the quest resolves. */
  resolvesAt: number;
  /** startedAt + completionTicks — hard deadline; past it auto-fails. */
  deadlineAt: number;
}

/** Graduated quest outcome. */
export type QuestOutcome =
  | 'epic-fail'
  | 'fail'
  | 'almost'
  | 'win'
  | 'big-win';

/** What a failed (or epic-failed) quest did to the party. */
export type HarmOutcome = 'none' | 'wound' | 'death';

/** The offer card's declared price: success plus harm, as bands. */
export interface OfferForecast {
  /** Success band: [1-failHi, 1-failLo] after gate adjustment. */
  success: [number, number];
  /** failBand × harmProfile.wound. */
  wound: [number, number];
  /** failBand × harmProfile.death. */
  death: [number, number];
}

/** Result of evaluating an offer's gate for a given party/world. */
export interface GateEvaluation {
  state: GateState;
  /** Risk band as reported by the scout (narrowed by explorerQuality). */
  scoutBand: [number, number];
  /** Requirements not currently satisfied. */
  missing: RequirementRef[];
  /** Missing requirements marked `absolute` → the gate is Locked. */
  missingAbsolute: RequirementRef[];
  /** The route shown on the card while Locked (ratified). */
  unlockRoute?: RequirementRef;
  /** True if durationTicks > completionTicks (quest can't finish in time). */
  willExceedCompletion: boolean;
}

/** Session-level mutable state for a meta-layer run. */
export interface MetaSessionState {
  world: WorldState;
  board: LiveOffer[];
  committed: CommittedQuest[];
  /** defIds consumed (completed or failed; non-repeatable gone forever). */
  consumed: Record<string, number>;
  /** defId → last tick it entered the board (repeat cooldown). */
  lastSeenAt: Record<string, number>;
  instanceCounter: number;
  seed: number;
  rngCalls: number;
}

/** One event emitted by advanceTime. */
export type SessionEvent =
  | { kind: 'offer-expired'; defId: string; tick: number }
  | { kind: 'offer-window-closed'; defId: string; tick: number }
  | { kind: 'offer-generated'; defId: string; instanceId: string; tick: number }
  | { kind: 'clock-tick'; key: QualityKey; value: number; tick: number }
  | {
      kind: 'quest-resolved';
      defId: string;
      /** Which committed instance resolved — lets consumers attribute
       *  consequences to the right party when two quests share a defId. */
      instanceId: string;
      outcome: QuestOutcome;
      harm: HarmOutcome;
      writes: QualityDelta[];
      tick: number;
    }
  | { kind: 'quest-deadline-fail'; defId: string; instanceId: string; tick: number };

/** Full report returned by advanceTime. */
export interface AdvanceReport {
  events: SessionEvent[];
  expiredOffers: string[];
  resolved: { defId: string; outcome: QuestOutcome; harm: HarmOutcome }[];
}

/* ------------------------------------------------------------------------ */
/* Requirements                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Evaluate a single requirement against party + world state.
 * `quality` reads world qualities (default min = 1, i.e. presence);
 * `capability` checks the party tag set; `stat` compares ≥ min (default 1).
 */
export function requirementMet(
  req: RequirementRef,
  party: PartyCapability,
  world: WorldState,
): boolean {
  switch (req.kind) {
    case 'quality':
      return (world.qualities[req.key] ?? 0) >= (req.min ?? 1);
    case 'capability':
      return party.capabilities.includes(req.key);
    case 'stat':
      return (party.stats[req.key] ?? 0) >= (req.min ?? 1);
  }
}

/* ------------------------------------------------------------------------ */
/* Gate evaluation                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Compute the party's abstract power: Σstats + powerPerCapability per tag.
 * Used only for the over-qualified comparison.
 */
export function partyPower(
  party: PartyCapability,
  tuning: MetaLayerTuning,
): number {
  const statSum = Object.values(party.stats).reduce((a, b) => a + b, 0);
  return statSum + party.capabilities.length * tuning.powerPerCapability;
}

/**
 * Narrow a raw risk band toward its midpoint proportionally to the
 * party's explorer quality — the scout report (no intel currency; the
 * explorer IS the info lever).
 */
export function scoutBand(
  rawBand: [number, number],
  explorerQuality: number,
  tuning: MetaLayerTuning,
): [number, number] {
  const mid = (rawBand[0] + rawBand[1]) / 2;
  const half =
    ((rawBand[1] - rawBand[0]) / 2) *
    (1 - explorerQuality * tuning.scoutNarrowingMax);
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}

/**
 * Evaluate the 4-state gate for an offer (ratified contract):
 * Locked (any `absolute` requirement missing → card names unlockRoute),
 * Underprepared (non-absolute gaps), Over-qualified (power above tier
 * threshold), Ready otherwise.
 */
export function evaluateGateState(
  offer: OfferDef,
  party: PartyCapability,
  world: WorldState,
  tuning: MetaLayerTuning,
): GateEvaluation {
  const missing = offer.requires.filter(
    (r) => !requirementMet(r, party, world),
  );
  const missingAbsolute = missing.filter((r) => r.severity === 'absolute');
  const willExceedCompletion = offer.durationTicks > offer.completionTicks;

  let state: GateState;
  if (missingAbsolute.length > 0) {
    state = 'locked';
  } else if (missing.length > 0) {
    state = 'underprepared';
  } else {
    const threshold =
      offer.tier === 1
        ? tuning.overQualifiedPower.t1
        : offer.tier === 2
          ? tuning.overQualifiedPower.t2
          : tuning.overQualifiedPower.t3;
    state = partyPower(party, tuning) >= threshold ? 'over-qualified' : 'ready';
  }

  return {
    state,
    scoutBand: scoutBand(offer.riskBand, party.explorerQuality, tuning),
    missing,
    missingAbsolute,
    unlockRoute:
      state === 'locked'
        ? (offer.unlockRoute ?? missingAbsolute[0])
        : undefined,
    willExceedCompletion,
  };
}

/* ------------------------------------------------------------------------ */
/* World state                                                               */
/* ------------------------------------------------------------------------ */

/** Build the initial world state from config. */
export function initialWorldState(cfg: MetaLayerConfig): WorldState {
  const qualities: Record<QualityKey, number> = {};
  for (const d of cfg.initialQualities) {
    qualities[d.key] = (qualities[d.key] ?? 0) + d.delta;
  }
  for (const c of cfg.clocks) {
    qualities[c.key] = c.startAt;
  }
  return { tick: 0, qualities };
}

/**
 * Write a quality delta into the world. Clock qualities clamp at ≥0
 * (a clock cannot run backwards past zero).
 */
export function applyQualityDelta(world: WorldState, delta: QualityDelta): void {
  const next = (world.qualities[delta.key] ?? 0) + delta.delta;
  world.qualities[delta.key] = delta.key.startsWith('clock:')
    ? Math.max(0, next)
    : next;
}

/** True while the offer's appearance window contains `tick`. */
export function windowOpen(offer: OfferDef, tick: number): boolean {
  if (!offer.window) return true;
  return tick >= offer.window.openAt && tick <= offer.window.closeAt;
}

/* ------------------------------------------------------------------------ */
/* Offer generation                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Is an offer definition eligible to enter the board right now?
 * Checks `appearsWhen` (quality gating + party-side requirements),
 * consumed/repeat-cooldown state, and the appearance window.
 */
export function offerEligible(
  offer: OfferDef,
  state: MetaSessionState,
  party: PartyCapability,
  cfg: MetaLayerConfig,
): boolean {
  if (!windowOpen(offer, state.world.tick)) return false;
  const consumedAt = state.consumed[offer.id];
  if (consumedAt !== undefined) {
    if (!offer.repeatable) return false;
    const cd = offer.repeatCooldownTicks ?? 1;
    if (state.world.tick - consumedAt < cd) return false;
  }
  if (state.board.some((o) => o.defId === offer.id)) return false;
  if (state.committed.some((q) => q.defId === offer.id)) return false;
  for (const req of offer.appearsWhen ?? []) {
    if (!requirementMet(req, party, state.world)) return false;
  }
  return true;
}

/**
 * Weighted-sample offers into empty board slots. Steering applies a
 * per-family multiplier to `weight` — a bias, never a filter (families
 * with multiplier 0 remain eligible at their base weight only if the
 * caller wants a hard filter, which steering must not do; a 0 multiplier
 * IS allowed to soft-mute but is not a filter on other families).
 */
export function generateOffers(
  cfg: MetaLayerConfig,
  state: MetaSessionState,
  party: PartyCapability,
  steering: SteeringBias,
  rng: () => number,
): LiveOffer[] {
  const slots = cfg.tuning.boardSize - state.board.length;
  if (slots <= 0) return [];

  const pool = cfg.offers
    .filter((o) => offerEligible(o, state, party, cfg))
    .map((o) => ({
      offer: o,
      w: o.weight * (steering[o.family] ?? 1),
    }))
    .filter((e) => e.w > 0);

  const generated: LiveOffer[] = [];
  for (let i = 0; i < slots && pool.length > 0; i++) {
    const total = pool.reduce((a, e) => a + e.w, 0);
    let roll = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      roll -= pool[idx].w;
      if (roll <= 0) break;
    }
    const [picked] = pool.splice(idx, 1);
    const def = picked.offer;
    generated.push({
      instanceId: `offer-${state.instanceCounter + i}`,
      defId: def.id,
      generatedAt: state.world.tick,
      expiresAt: state.world.tick + def.acceptanceTicks,
    });
  }
  return generated;
}

/* ------------------------------------------------------------------------ */
/* Commitment                                                                */
/* ------------------------------------------------------------------------ */

/** Why a commit may be rejected. */
export type CommitRejection =
  | 'offer-not-on-board'
  | 'offer-expired'
  | 'gate-locked'
  | 'no-leader-available';

export type CommitResult =
  | { ok: true; quest: CommittedQuest }
  | { ok: false; reason: CommitRejection; gate?: GateEvaluation };

/**
 * Accept a live offer: consumes one leader (leader-capacity = the only
 * parallel constraint, per ratification). Locked gates reject; every
 * other state commits — Underprepared is a deliberate risk choice.
 */
export function commitOffer(
  cfg: MetaLayerConfig,
  state: MetaSessionState,
  party: PartyCapability,
  instanceId: string,
): CommitResult {
  const live = state.board.find((o) => o.instanceId === instanceId);
  if (!live) return { ok: false, reason: 'offer-not-on-board' };
  if (state.world.tick >= live.expiresAt) {
    return { ok: false, reason: 'offer-expired' };
  }
  const def = cfg.offers.find((o) => o.id === live.defId);
  if (!def) return { ok: false, reason: 'offer-not-on-board' };

  const gate = evaluateGateState(def, party, state.world, cfg.tuning);
  if (gate.state === 'locked') {
    return { ok: false, reason: 'gate-locked', gate };
  }
  const freeLeader =
    party.leaders - state.committed.length;
  if (freeLeader <= 0) return { ok: false, reason: 'no-leader-available' };

  const usedSlots = new Set(state.committed.map((q) => q.leaderIndex));
  let leaderIndex = 0;
  while (usedSlots.has(leaderIndex)) leaderIndex++;

  const quest: CommittedQuest = {
    instanceId: live.instanceId,
    defId: def.id,
    leaderIndex,
    startedAt: state.world.tick,
    resolvesAt: state.world.tick + def.durationTicks,
    deadlineAt: state.world.tick + def.completionTicks,
  };
  state.board = state.board.filter((o) => o.instanceId !== instanceId);
  state.committed.push(quest);
  return { ok: true, quest };
}

/* ------------------------------------------------------------------------ */
/* Resolution                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Resolve a committed quest to a graduated outcome.
 * failChance = scout-band midpoint adjusted by gate state
 * (underprepared +penalty, over-qualified −bonus). The roll maps to
 * epic-fail/fail inside the fail zone and almost/win/big-win inside
 * the success zone per `tuning.outcomeTable`.
 */
/**
 * The gate-adjusted fail chance: scout-band midpoint shifted by
 * underprepared/over-qualified modifiers. Both card forecast and
 * resolution use the same number — what you see is what you roll.
 */
export function gateAdjustedFailChance(
  offer: OfferDef,
  gate: GateEvaluation,
  tuning: MetaLayerTuning,
): number {
  const mid = (offer.riskBand[0] + offer.riskBand[1]) / 2;
  if (gate.state === 'underprepared') {
    return Math.min(1, mid + tuning.underpreparedFailPenalty);
  }
  if (gate.state === 'over-qualified') {
    return Math.max(0, mid - tuning.overQualifiedFailBonus);
  }
  return mid;
}

/**
 * The declared price on the card: success/wound/death bands derived from
 * the SCOUTED band (what the explorer reports) adjusted by gate state,
 * with harm = failChance × the offer's conditional harm profile.
 */
export function offerForecast(
  offer: OfferDef,
  gate: GateEvaluation,
  tuning: MetaLayerTuning,
): OfferForecast {
  const [lo, hi] = gate.scoutBand;
  let failLo = lo;
  let failHi = hi;
  if (gate.state === 'underprepared') {
    failLo = Math.min(1, lo + tuning.underpreparedFailPenalty);
    failHi = Math.min(1, hi + tuning.underpreparedFailPenalty);
  } else if (gate.state === 'over-qualified') {
    failLo = Math.max(0, lo - tuning.overQualifiedFailBonus);
    failHi = Math.max(0, hi - tuning.overQualifiedFailBonus);
  }
  return {
    success: [1 - failHi, 1 - failLo],
    wound: [failLo * offer.harmProfile.wound, failHi * offer.harmProfile.wound],
    death: [failLo * offer.harmProfile.death, failHi * offer.harmProfile.death],
  };
}

/**
 * Resolve a committed quest to a graduated outcome + harm.
 * failChance = scout-band midpoint adjusted by gate state (via
 * gateAdjustedFailChance). On fail-zone rolls a second roll applies the
 * offer's harmProfile; epic-fail scales both harm rates and a clean roll
 * still lands a wound.
 */
export function resolveOutcome(
  offer: OfferDef,
  gate: GateEvaluation,
  tuning: MetaLayerTuning,
  rng: () => number,
): { outcome: QuestOutcome; harm: HarmOutcome } {
  const failChance = gateAdjustedFailChance(offer, gate, tuning);
  const roll = rng();
  let outcome: QuestOutcome;
  if (roll < failChance) {
    outcome =
      roll < failChance * tuning.outcomeTable.epicFailBelow
        ? 'epic-fail'
        : 'fail';
  } else if (roll >= tuning.outcomeTable.bigWinAbove) {
    outcome = 'big-win';
  } else {
    const successZone = 1 - failChance;
    const intoSuccess = roll - failChance;
    outcome =
      intoSuccess < successZone * tuning.outcomeTable.almostBelow
        ? 'almost'
        : 'win';
  }

  if (outcome !== 'fail' && outcome !== 'epic-fail') {
    return { outcome, harm: 'none' };
  }
  const scale = outcome === 'epic-fail' ? tuning.epicFailHarmScale : 1;
  const deathP = Math.min(1, offer.harmProfile.death * scale);
  const woundP = Math.min(1, offer.harmProfile.wound * scale);
  const h = rng();
  if (h < deathP) return { outcome, harm: 'death' };
  if (h < deathP + woundP) return { outcome, harm: 'wound' };
  return { outcome, harm: outcome === 'epic-fail' ? 'wound' : 'none' };
}

/** Qualities written for a given outcome. */
export function outcomeWrites(offer: OfferDef, outcome: QuestOutcome): QualityDelta[] {
  if (outcome === 'win' || outcome === 'big-win') return offer.provides;
  if (outcome === 'almost') return offer.providesOnAlmost ?? [];
  return [];
}

/* ------------------------------------------------------------------------ */
/* Time                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Advance the world by `ticks`. Per tick: world tick++, clocks advance
 * on their period (capped at `max`), expired offers leave the board,
 * offers outside a closing window leave, committed quests resolve at
 * `resolvesAt` (writing `provides` on success) or auto-fail at
 * `deadlineAt` if the deadline lands first. Freed leaders are implicit
 * (committed list shrinks). After the ticks, the board is topped up.
 */
export function advanceTime(
  cfg: MetaLayerConfig,
  state: MetaSessionState,
  party: PartyCapability,
  steering: SteeringBias,
  ticks: number,
): AdvanceReport {
  const rng = mulberry32((state.seed ^ (state.rngCalls * 0x9e3779b9)) >>> 0);
  const events: SessionEvent[] = [];
  const expiredOffers: string[] = [];
  const resolved: { defId: string; outcome: QuestOutcome }[] = [];

  for (let t = 0; t < ticks; t++) {
    state.world.tick += 1;
    const now = state.world.tick;

    for (const clock of cfg.clocks) {
      if (now % clock.periodTicks === 0) {
        const cur = state.world.qualities[clock.key] ?? 0;
        const next = clock.max !== undefined ? Math.min(cur + 1, clock.max) : cur + 1;
        if (next !== cur) {
          state.world.qualities[clock.key] = next;
          events.push({ kind: 'clock-tick', key: clock.key, value: next, tick: now });
        }
      }
    }

    const stillOnBoard: LiveOffer[] = [];
    for (const o of state.board) {
      const def = cfg.offers.find((d) => d.id === o.defId);
      if (now >= o.expiresAt) {
        expiredOffers.push(o.defId);
        events.push({ kind: 'offer-expired', defId: o.defId, tick: now });
      } else if (def && !windowOpen(def, now)) {
        expiredOffers.push(o.defId);
        events.push({ kind: 'offer-window-closed', defId: o.defId, tick: now });
      } else {
        stillOnBoard.push(o);
      }
    }
    state.board = stillOnBoard;

    const stillCommitted: CommittedQuest[] = [];
    for (const q of state.committed) {
      const def = cfg.offers.find((d) => d.id === q.defId);
      if (!def) continue;
      if (now >= q.deadlineAt && q.resolvesAt > q.deadlineAt) {
        state.consumed[q.defId] = now;
        events.push({ kind: 'quest-deadline-fail', defId: q.defId, instanceId: q.instanceId, tick: now });
        resolved.push({ defId: q.defId, outcome: 'fail', harm: 'none' });
        continue;
      }
      if (now >= q.resolvesAt) {
        const gate = evaluateGateState(def, party, state.world, cfg.tuning);
        const { outcome, harm } = resolveOutcome(def, gate, cfg.tuning, rng);
        const writes = outcomeWrites(def, outcome);
        for (const w of writes) applyQualityDelta(state.world, w);
        state.consumed[q.defId] = now;
        events.push({
          kind: 'quest-resolved',
          defId: q.defId,
          instanceId: q.instanceId,
          outcome,
          harm,
          writes,
          tick: now,
        });
        resolved.push({ defId: q.defId, outcome, harm });
        continue;
      }
      stillCommitted.push(q);
    }
    state.committed = stillCommitted;
  }

  const fresh = generateOffers(cfg, state, party, steering, rng);
  state.instanceCounter += fresh.length;
  for (const o of fresh) {
    state.board.push(o);
    state.lastSeenAt[o.defId] = state.world.tick;
    events.push({
      kind: 'offer-generated',
      defId: o.defId,
      instanceId: o.instanceId,
      tick: state.world.tick,
    });
  }
  state.rngCalls += 1;

  return { events, expiredOffers, resolved };
}

/* ------------------------------------------------------------------------ */
/* Milestones                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Which approaches of a milestone are currently open for this
 * party/world? Each approach is a requirement set; all must be met.
 */
export function openApproaches(
  milestone: MilestoneNode,
  party: PartyCapability,
  world: WorldState,
): number[] {
  const open: number[] = [];
  milestone.approaches.forEach((approach, i) => {
    if (approach.every((r) => requirementMet(r, party, world))) open.push(i);
  });
  return open;
}
