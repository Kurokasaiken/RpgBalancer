/**
 * Meta-Layer session driver (PLAN-030 / R-164).
 *
 * Scripted driver over the harness API: plays N decision cycles with a
 * pluggable pick policy and returns a full textual log — used by tests
 * and by the Director's manual 50–100 cycle session (Gate A exit).
 */

import type {
  MetaLayerConfig,
  SteeringBias,
} from '@/balancing/config/metaLayer';
import type { GateState, PartyCapability } from './engine';
import { offerForecast } from './engine';
import {
  advanceSessionTime,
  committedQuests,
  createSession,
  freeLeaders,
  inspectRequirements,
  milestoneViews,
  offerQuests,
  selectQuest,
  worldOf,
  type MetaSession,
  type OfferView,
} from './harness';

/** A pick policy: given the board, choose an offer instance or null. */
export type PickPolicy = (
  session: MetaSession,
  board: OfferView[],
) => string | null;

/** Deterministic policies for the driver (full diagnostic set = Gate B). */
export const DRIVER_POLICIES: Record<string, PickPolicy> = {
  /** Pick the first Ready (or over-qualified) offer. */
  firstReady: (_s, board) =>
    board.find((o) => o.gate.state === 'ready' || o.gate.state === 'over-qualified')
      ?.instanceId ?? null,
  /** Pick the offer with the lowest scouted risk. */
  lowestRisk: (_s, board) => {
    const c = board.filter((o) => o.gate.state !== 'locked');
    if (c.length === 0) return null;
    c.sort(
      (a, b) =>
        (a.gate.scoutBand[0] + a.gate.scoutBand[1]) / 2 -
        (b.gate.scoutBand[0] + b.gate.scoutBand[1]) / 2,
    );
    return c[0].instanceId;
  },
  /** Pick the soonest-to-expire takeable offer (deadline-aware). */
  deadlineAware: (_s, board) => {
    const c = board.filter((o) => o.gate.state !== 'locked');
    if (c.length === 0) return null;
    c.sort((a, b) => a.ticksToExpiry - b.ticksToExpiry);
    return c[0].instanceId;
  },
  /** Never commit — observe the world's unsolicited evolution. */
  passive: () => null,
};

/** One cycle's record inside a driver log. */
export interface CycleRecord {
  tick: number;
  action: string;
  detail: string;
}

/** Result of a driven session. */
export interface DriverResult {
  cycles: CycleRecord[];
  finalTick: number;
  qualities: Record<string, number>;
  commits: number;
  resolutions: { defId: string; outcome: string; harm: string }[];
}

/**
 * Play `cycles` decision rounds: each cycle commits as many offers as
 * the policy picks (bounded by free leaders), then advances `ticksPerCycle`.
 */
export function driveSession(
  cfg: MetaLayerConfig,
  party: PartyCapability,
  seed: number,
  steering: SteeringBias,
  policy: PickPolicy,
  cycles: number,
  ticksPerCycle: number,
): DriverResult {
  const session = createSession(cfg, party, seed, steering);
  const log: CycleRecord[] = [];
  const resolutions: { defId: string; outcome: string; harm: string }[] = [];
  let commits = 0;

  for (let c = 0; c < cycles; c++) {
    const board = offerQuests(session);
    let pick = policy(session, board);
    while (pick !== null && freeLeaders(session) > 0) {
      const res = selectQuest(session, pick);
      if (!res.ok) {
        log.push({
          tick: worldOf(session).tick,
          action: 'commit-rejected',
          detail: `${pick}: ${res.reason}`,
        });
        break;
      }
      commits++;
      log.push({
        tick: worldOf(session).tick,
        action: 'commit',
        detail: res.quest.defId,
      });
      board.splice(
        board.findIndex((o) => o.instanceId === pick),
        1,
      );
      pick = policy(session, board);
    }

    const report = advanceSessionTime(session, ticksPerCycle);
    for (const e of report.events) {
      if (e.kind === 'quest-resolved') {
        resolutions.push({ defId: e.defId, outcome: e.outcome, harm: e.harm });
        log.push({
          tick: e.tick,
          action: 'resolved',
          detail: `${e.defId} → ${e.outcome}${e.harm !== 'none' ? ` (${e.harm})` : ''}`,
        });
      } else if (e.kind !== 'offer-generated' && e.kind !== 'clock-tick') {
        log.push({ tick: e.tick, action: e.kind, detail: e.defId });
      }
    }
  }

  return {
    cycles: log,
    finalTick: worldOf(session).tick,
    qualities: { ...worldOf(session).qualities },
    commits,
    resolutions,
  };
}

/** Format a human-readable board snapshot (Director's manual session). */
export function formatBoard(session: MetaSession): string {
  const lines: string[] = [
    `--- tick ${worldOf(session).tick} | leaders free ${freeLeaders(session)} | committed ${committedQuests(session).length} ---`,
  ];
  for (const o of offerQuests(session)) {
    const g = o.gate;
    const f = offerForecast(o.def, g, session.cfg.tuning);
    const pct = (b: [number, number]) =>
      `${(b[0] * 100).toFixed(0)}-${(b[1] * 100).toFixed(0)}%`;
    const reward =
      o.def.provides.length > 0
        ? o.def.provides.map((p) => `${p.delta > 0 ? '+' : ''}${p.delta} ${p.key}`).join(', ')
        : '—';
    const unlock =
      g.state === 'locked'
        ? ` via: ${g.unlockRoute ? `${g.unlockRoute.kind}:${g.unlockRoute.key}` : '?'}`
        : '';
    lines.push(
      `  [${g.state.toUpperCase().padEnd(14)}] ${o.def.id} (${o.def.family} t${o.def.tier})`,
    );
    lines.push(
      `      succ ${pct(f.success)} | wound ${pct(f.wound)} | death ${pct(f.death)} | exp in ${o.ticksToExpiry}${unlock}`,
    );
    lines.push(`      reward: ${reward}`);
  }
  for (const m of milestoneViews(session)) {
    lines.push(
      `  MILESTONE ${m.id}: ${m.openApproachIndexes.length}/${m.approaches.length} approaches open`,
    );
  }
  return lines.join('\n');
}

/** Detail dump for one offer (manual inspection). */
export function formatInspection(session: MetaSession, defId: string): string {
  const ins = inspectRequirements(session, defId);
  const lines = [
    `${defId} — ${ins.gate.state}${ins.gate.willExceedCompletion ? ' (cannot finish in time)' : ''}`,
    ...ins.requirements.map(
      (r) =>
        `  ${r.met ? '✓' : '✗'} ${r.kind}:${r.key}${r.min !== undefined ? `>=${r.min}` : ''} [${r.severity ?? '-'}] current=${r.current}`,
    ),
  ];
  if (ins.appearsWhen.length > 0) {
    lines.push('  appearsWhen:');
    for (const r of ins.appearsWhen) {
      lines.push(
        `    ${r.met ? '✓' : '✗'} ${r.kind}:${r.key}${r.min !== undefined ? `>=${r.min}` : ''} current=${r.current}`,
      );
    }
  }
  return lines.join('\n');
}

export type { GateState };
