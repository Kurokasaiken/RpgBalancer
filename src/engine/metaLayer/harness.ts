/**
 * Meta-Layer harness facade (PLAN-030 / R-164).
 *
 * The 4-API surface for playing the prototype loop:
 * `offerQuests` → `inspectRequirements` → `selectQuest` → `advanceTime`.
 * Stateless consumers use `createSession` + the methods; the driver and
 * the tests share the same surface.
 */

import type {
  MetaLayerConfig,
  OfferDef,
  SteeringBias,
} from '@/balancing/config/metaLayer';
import {
  advanceTime as engineAdvanceTime,
  commitOffer,
  evaluateGateState,
  generateOffers,
  initialWorldState,
  openApproaches,
  requirementMet,
  type AdvanceReport,
  type CommitResult,
  type CommittedQuest,
  type GateEvaluation,
  type LiveOffer,
  type MetaSessionState,
  type PartyCapability,
  type WorldState,
} from './engine';
import { mulberry32 } from './rng';

/** A live offer with its evaluated gate — the unit shown to the player. */
export interface OfferView {
  instanceId: string;
  def: OfferDef;
  gate: GateEvaluation;
  ticksToExpiry: number;
}

/** What inspectRequirements returns for one requirement. */
export interface RequirementReport {
  kind: string;
  key: string;
  min?: number;
  severity?: string;
  met: boolean;
  current: number | string;
}

/** Full inspection of one offer def. */
export interface OfferInspection {
  defId: string;
  gate: GateEvaluation;
  requirements: RequirementReport[];
  appearsWhen: RequirementReport[];
  onBoard: boolean;
}

/** A milestone with its approach openness — the visible strategic goal. */
export interface MilestoneView {
  id: string;
  label: string;
  openApproachIndexes: number[];
  approaches: RequirementReport[][];
}

/** The whole meta-layer session: world + board + commitments. */
export interface MetaSession {
  state: MetaSessionState;
  cfg: MetaLayerConfig;
  party: PartyCapability;
  steering: SteeringBias;
}

/**
 * Create a session at tick 0 with the initial board already generated.
 */
export function createSession(
  cfg: MetaLayerConfig,
  party: PartyCapability,
  seed: number,
  steering: SteeringBias = {},
): MetaSession {
  const state: MetaSessionState = {
    world: initialWorldState(cfg),
    board: [],
    committed: [],
    consumed: {},
    lastSeenAt: {},
    instanceCounter: 0,
    seed,
    rngCalls: 0,
  };
  const session: MetaSession = { state, cfg, party, steering };
  const rng = mulberry32((seed ^ 0xa5a5a5a5) >>> 0);
  const fresh = generateOffers(cfg, state, party, steering, rng);
  state.instanceCounter += fresh.length;
  for (const o of fresh) {
    state.board.push(o);
    state.lastSeenAt[o.defId] = state.world.tick;
  }
  return session;
}

/** Find the OfferDef for an instance id, or undefined. */
function defOf(session: MetaSession, defId: string): OfferDef | undefined {
  return session.cfg.offers.find((o) => o.id === defId);
}

/**
 * `offer_quests`: the current board with gates evaluated against the
 * party and world — the offer-card list (Locked offers included with
 * their unlock route).
 */
export function offerQuests(session: MetaSession): OfferView[] {
  return session.state.board.map((live: LiveOffer) => {
    const def = defOf(session, live.defId);
    if (!def) throw new Error(`Unknown offer def ${live.defId}`);
    return {
      instanceId: live.instanceId,
      def,
      gate: evaluateGateState(
        def,
        session.party,
        session.state.world,
        session.cfg.tuning,
      ),
      ticksToExpiry: live.expiresAt - session.state.world.tick,
    };
  });
}

function reportRequirement(
  req: { kind: string; key: string; min?: number; severity?: string },
  session: MetaSession,
): RequirementReport {
  const r = req as Parameters<typeof requirementMet>[0];
  const met = requirementMet(r, session.party, session.state.world);
  let current: number | string;
  if (req.kind === 'quality') {
    current = session.state.world.qualities[req.key] ?? 0;
  } else if (req.kind === 'capability') {
    current = session.party.capabilities.includes(req.key)
      ? 'owned'
      : 'missing';
  } else {
    current = session.party.stats[req.key] ?? 0;
  }
  return {
    kind: req.kind,
    key: req.key,
    min: req.min,
    severity: req.severity,
    met,
    current,
  };
}

/**
 * `inspect_requirements`: full detail on an offer def — every
 * requirement with met/current, appearance conditions, and the
 * evaluated gate. The "what am I missing" view.
 */
export function inspectRequirements(
  session: MetaSession,
  defId: string,
): OfferInspection {
  const def = defOf(session, defId);
  if (!def) throw new Error(`Unknown offer def ${defId}`);
  return {
    defId,
    gate: evaluateGateState(
      def,
      session.party,
      session.state.world,
      session.cfg.tuning,
    ),
    requirements: def.requires.map((r) => reportRequirement(r, session)),
    appearsWhen: (def.appearsWhen ?? []).map((r) =>
      reportRequirement(r, session),
    ),
    onBoard: session.state.board.some((o) => o.defId === defId),
  };
}

/**
 * `select_quest`: commit a live offer (consumes a leader). Returns the
 * CommitResult; on success the quest sits in `session.state.committed`.
 */
export function selectQuest(
  session: MetaSession,
  instanceId: string,
): CommitResult {
  return commitOffer(
    session.cfg,
    session.state,
    session.party,
    instanceId,
  );
}

/**
 * `advance_time`: advance the world `ticks` and return the event report
 * (expired offers, clock ticks, resolutions, newly generated offers).
 */
export function advanceSessionTime(
  session: MetaSession,
  ticks: number,
): AdvanceReport {
  return engineAdvanceTime(
    session.cfg,
    session.state,
    session.party,
    session.steering,
    ticks,
  );
}

/** Current committed quests. */
export function committedQuests(session: MetaSession): CommittedQuest[] {
  return session.state.committed;
}

/** Free leader count right now. */
export function freeLeaders(session: MetaSession): number {
  return session.party.leaders - session.state.committed.length;
}

/** Milestone views: every authored milestone with open approaches. */
export function milestoneViews(session: MetaSession): MilestoneView[] {
  return session.cfg.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    openApproachIndexes: openApproaches(
      m,
      session.party,
      session.state.world,
    ),
    approaches: m.approaches.map((a) =>
      a.map((r) => reportRequirement(r, session)),
    ),
  }));
}

/** Read-only world state accessor. */
export function worldOf(session: MetaSession): WorldState {
  return session.state.world;
}
