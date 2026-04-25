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

beforeEach(async () => {
  await StatBalanceHistoryStore.clear();
});

describe('StatBalanceHistoryStore', () => {
  it('adds and lists runs in reverse chronological order', async () => {
    const runA = createRun('runA');
    const runB = createRun('runB');

    await StatBalanceHistoryStore.addRun(runA);
    await StatBalanceHistoryStore.addRun(runB);

    const runs = await StatBalanceHistoryStore.listRuns();
    expect(runs.map((r: StatBalanceRun) => r.id)).toEqual(['runB', 'runA']);
  });

  it('adds and lists sessions, updating existing ones by id', async () => {
    const session1 = createSession('s1', ['r1']);
    const session1Updated = {
      ...session1,
      runs: [...session1.runs, createRun('r2')],
    };

    await StatBalanceHistoryStore.addSession(session1);
    await StatBalanceHistoryStore.addSession(session1Updated);

    const sessions = await StatBalanceHistoryStore.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].runs).toHaveLength(2);
  });

  it('retrieves a session by id', async () => {
    const session = createSession('session-xyz', ['ra', 'rb']);
    await StatBalanceHistoryStore.addSession(session);

    const loaded = await StatBalanceHistoryStore.getSession('session-xyz');
    expect(loaded).toBeDefined();
    expect(loaded?.sessionId).toBe('session-xyz');
  });

  it('clears runs and sessions', async () => {
    await StatBalanceHistoryStore.addRun(createRun('run1'));
    await StatBalanceHistoryStore.addSession(createSession('s1', ['r1']));

    await StatBalanceHistoryStore.clear();

    expect(await StatBalanceHistoryStore.listRuns()).toHaveLength(0);
    expect(await StatBalanceHistoryStore.listSessions()).toHaveLength(0);
  });
});
