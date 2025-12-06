import { describe, it, expect, beforeEach } from 'vitest';
import { StatBalanceHistoryStore } from '../stats/StatBalanceHistoryStore';
import type { StatBalanceRun, StatBalanceSession } from '../stats/StatBalanceTypes';

function createRun(id: string): StatBalanceRun {
  return {
    id,
    timestamp: Date.now(),
    configVersion: '1.0.0',
    weights: { damage: 5, armor: 3 },
    tiers: [25, 50],
    iterationsPerTier: 1000,
    balanceScore: 0.1,
    summary: {
      overpowered: ['damage'],
      underpowered: ['armor'],
    },
  };
}

function createSession(sessionId: string, runIds: string[]): StatBalanceSession {
  const runs = runIds.map(createRun);
  return {
    sessionId,
    startTime: runs[0]?.timestamp ?? Date.now(),
    endTime: runs[runs.length - 1]?.timestamp,
    runs,
    strategy: 'auto',
  };
}

beforeEach(() => {
  StatBalanceHistoryStore.clear();
});

describe('StatBalanceHistoryStore', () => {
  it('adds and lists runs in reverse chronological order', () => {
    const runA = createRun('runA');
    const runB = createRun('runB');

    StatBalanceHistoryStore.addRun(runA);
    StatBalanceHistoryStore.addRun(runB);

    const runs = StatBalanceHistoryStore.listRuns();
    expect(runs.map((r) => r.id)).toEqual(['runB', 'runA']);
  });

  it('adds and lists sessions, updating existing ones by id', () => {
    const session1 = createSession('s1', ['r1']);
    const session1Updated = {
      ...session1,
      runs: [...session1.runs, createRun('r2')],
    };

    StatBalanceHistoryStore.addSession(session1);
    StatBalanceHistoryStore.addSession(session1Updated);

    const sessions = StatBalanceHistoryStore.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].runs).toHaveLength(2);
  });

  it('retrieves a session by id', () => {
    const session = createSession('session-xyz', ['ra', 'rb']);
    StatBalanceHistoryStore.addSession(session);

    const loaded = StatBalanceHistoryStore.getSession('session-xyz');
    expect(loaded).toBeDefined();
    expect(loaded?.sessionId).toBe('session-xyz');
  });

  it('clears runs and sessions', () => {
    StatBalanceHistoryStore.addRun(createRun('run1'));
    StatBalanceHistoryStore.addSession(createSession('s1', ['r1']));

    StatBalanceHistoryStore.clear();

    expect(StatBalanceHistoryStore.listRuns()).toHaveLength(0);
    expect(StatBalanceHistoryStore.listSessions()).toHaveLength(0);
  });
});
