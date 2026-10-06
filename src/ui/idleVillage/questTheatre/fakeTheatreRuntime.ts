/**
 * Fake theatre runtime — DISPOSABLE demo adapter (PLAN-021 T-002/T-004).
 *
 * Drives a fixture through the read-model so the theatre can be watched over
 * the live map on the dev route. It is a harness, not a runtime: it proves
 * the frontier contract (resolved + current only), awaitingPlayer at decision
 * nodes and stale-intent rejection. Nothing here is canonical — S2 replaces
 * the producer side without touching the theatre.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_QUEST_THEATRE_CONFIG } from '@/balancing/config/idleVillage/questTheatreConfig';
import type { TheatreFixture } from './fixtures';
import type {
  TheatreCommandResult,
  TheatreIntent,
  TheatreNodeView,
  TheatreRunView,
} from './theatreContract';

/** Kinds that resolve by time alone — they never wait for the player. */
const TIMED_KINDS = new Set(['timed', 'consequence']);
/** Kinds that pause the run until a player intent arrives. */
const DECISION_KINDS = new Set(['choice', 'check', 'checkpoint', 'reward']);

/** Blocked-run fixture id → runtime-provided reason (D-open-6 demo). */
const BLOCKED_NODE_REASONS: Record<string, string> = {
  'b-choice': 'Il ponte è crollato mentre la compagnia attendeva — la via è chiusa.',
};

export interface FakeTheatreRun {
  /** Current frontier snapshot for the theatre. */
  snapshot: TheatreRunView;
  /** Send a UI intent into the fake runtime. */
  dispatch: (intent: TheatreIntent) => TheatreCommandResult;
  /** Whether timed nodes auto-advance (demo driver toggle). */
  autoAdvance: boolean;
  setAutoAdvance: (next: boolean) => void;
  /** Manually resolve the current timed node (when autoAdvance is off). */
  advanceOnce: () => void;
  /** Restart the fixture from node zero. */
  reset: () => void;
  /** Whether the run reached a terminal state. */
  ended: boolean;
}

/**
 * Drives a fixture through the theatre read-model.
 * @param fixture - The scenario to run.
 * @returns The adapter surface the theatre consumes.
 */
export function useFakeTheatreRun(fixture: TheatreFixture): FakeTheatreRun {
  const { timedNodeMs, autoAdvanceDefault } = DEFAULT_QUEST_THEATRE_CONFIG.demo;

  const [cursor, setCursor] = useState(0);
  const [runState, setRunState] = useState<TheatreRunView['runState']>('running');
  const [frontierVersion, setFrontierVersion] = useState(1);
  const [log, setLog] = useState<TheatreRunView['log']>([]);
  const [awaitingSince, setAwaitingSince] = useState<number | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(autoAdvanceDefault);

  const ended = runState !== 'running';
  const current = fixture.nodes[cursor];

  const stateForNode = useCallback(
    (index: number): TheatreNodeView['state'] => {
      if (index < cursor || ended) return 'resolved';
      if (index > cursor) return 'pending';
      const kind = current?.kind ?? '';
      if (TIMED_KINDS.has(kind)) return 'pending';
      if (DECISION_KINDS.has(kind)) return ended ? 'resolved' : 'awaitingPlayer';
      return 'unsupported';
    },
    [cursor, ended, current],
  );

  const appendLog = useCallback((text: string) => {
    setLog((prev) => [...prev, { id: `${prev.length}`, text }]);
  }, []);

  const resolveCurrent = useCallback(
    (summary?: string) => {
      if (!current) return;
      appendLog(summary ?? current.resolvedSummary ?? current.title ?? current.nodeId);
      setCursor((c) => c + 1);
      setFrontierVersion((v) => v + 1);
      setAwaitingSince(null);
    },
    [current, appendLog],
  );

  /**
   * Auto-advance of timed nodes — the demo's stand-in for "only time flows".
   * Decision nodes flip to awaitingPlayer and the run parks there.
   */
  useEffect(() => {
    if (!autoAdvance || ended || !current) return;
    if (!TIMED_KINDS.has(current.kind)) {
      if (DECISION_KINDS.has(current.kind)) setAwaitingSince((s) => s ?? Date.now());
      return;
    }
    const timer = setTimeout(() => resolveCurrent(), timedNodeMs);
    return () => clearTimeout(timer);
  }, [autoAdvance, ended, current, timedNodeMs, resolveCurrent]);

  const advanceOnce = useCallback(() => {
    if (!ended && current && TIMED_KINDS.has(current.kind)) resolveCurrent();
  }, [ended, current, resolveCurrent]);

  const reset = useCallback(() => {
    setCursor(0);
    setRunState('running');
    setFrontierVersion((v) => v + 1);
    setLog([]);
    setAwaitingSince(null);
  }, []);

  const dispatch = useCallback(
    (intent: TheatreIntent): TheatreCommandResult => {
      if (intent.expectedFrontierVersion !== frontierVersion) {
        return { status: 'rejected', reason: 'stale', message: 'snapshot scaduto' };
      }
      if (ended) {
        return { status: 'rejected', reason: 'other', message: 'run terminata' };
      }
      if (!current || intent.nodeId !== current.nodeId) {
        return { status: 'rejected', reason: 'other', message: 'nodo non corrente' };
      }
      switch (intent.kind) {
        case 'submitDecision': {
          if (!DECISION_KINDS.has(current.kind) || current.kind === 'reward') {
            return { status: 'rejected', reason: 'other', message: 'nodo senza decisione' };
          }
          const option = current.options?.find((o) => o.id === intent.optionId);
          resolveCurrent(
            current.kind === 'check'
              ? `${current.title} — esito: successo`
              : `${current.title} — ${option?.label ?? intent.optionId}`,
          );
          return { status: 'accepted' };
        }
        case 'retreat': {
          if (!DECISION_KINDS.has(current.kind)) {
            return { status: 'rejected', reason: 'other', message: 'ritiro non disponibile' };
          }
          setRunState('fled');
          appendLog(`Ritirata — ${current.title ?? current.nodeId}`);
          setFrontierVersion((v) => v + 1);
          return { status: 'accepted' };
        }
        case 'collectReward': {
          if (current.kind !== 'reward') {
            return { status: 'rejected', reason: 'other', message: 'nessuna ricompensa qui' };
          }
          setRunState('success');
          appendLog('Ricompensa raccolta — la prova è al sicuro');
          setFrontierVersion((v) => v + 1);
          return { status: 'accepted' };
        }
        default:
          return { status: 'rejected', reason: 'other' };
      }
    },
    [frontierVersion, ended, current, resolveCurrent, appendLog],
  );

  const snapshot = useMemo<TheatreRunView>(() => {
    const nodes: TheatreNodeView[] = fixture.nodes
      .slice(0, Math.min(cursor + 1, fixture.nodes.length))
      .map((node, index) => ({
        ...node,
        state: stateForNode(index),
      }));
    return {
      contractVersion: 1,
      runId: fixture.id,
      title: fixture.title,
      objective: fixture.objective,
      runState,
      frontierVersion,
      nodes,
      party: fixture.party,
      log,
      inAttesaDal: awaitingSince ?? undefined,
      blockedReason: current ? BLOCKED_NODE_REASONS[current.nodeId] : undefined,
    };
  }, [fixture, cursor, stateForNode, runState, frontierVersion, log, awaitingSince, current]);

  return { snapshot, dispatch, autoAdvance, setAutoAdvance, advanceOnce, reset, ended };
}
