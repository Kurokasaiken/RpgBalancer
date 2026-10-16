/**
 * Unit tests for the canShutdown() decision engine.
 *
 * Covers the decision matrix: policy gate × user-idle gate × session states,
 * plus the stuck-session watchdog.
 */

import { describe, it, expect } from 'vitest';
import { canShutdown } from '../../../scripts/shutdownManager/canShutdown.js';
import {
  createDefaultRegistry,
  type SessionRegistry,
  type SessionState,
} from '../../../scripts/shutdownManager/sessionRegistry.js';

const NOW = new Date('2026-10-16T00:00:00.000Z');
const IDLE_OK = 600_000; // 10 min
const IDLE_THRESHOLD_S = 300;

function registryWith(
  sessions: { id: string; state: SessionState; ageMs?: number }[],
  overrides?: Partial<SessionRegistry['policy']>,
): SessionRegistry {
  const registry = createDefaultRegistry('test-machine');
  registry.policy = {
    dryRun: true,
    shutdownEnabled: true,
    userIdleThresholdSeconds: IDLE_THRESHOLD_S,
    ...overrides,
  };
  registry.projects.RPG = { status: 'active', sessions: {} };
  for (const s of sessions) {
    registry.projects.RPG.sessions[s.id] = {
      pid: 1234,
      heartbeatAt: new Date(NOW.getTime() - (s.ageMs ?? 0)).toISOString(),
      state: s.state,
      owner: 'test',
      ttlSeconds: 60,
    };
  }
  return registry;
}

const opts = { now: NOW };

describe('canShutdown — policy gate', () => {
  it('blocks when shutdownEnabled=false even with all sessions completed and idle user', () => {
    const r = canShutdown(
      registryWith([{ id: 'a', state: 'COMPLETED' }], { shutdownEnabled: false }),
      IDLE_OK,
      opts,
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('shutdownEnabled');
  });

  it('blocks when dryRun only affects execution, not the decision itself', () => {
    const r = canShutdown(registryWith([], { dryRun: true, shutdownEnabled: true }), IDLE_OK, opts);
    expect(r.allowed).toBe(true);
    expect(r.policy.dryRun).toBe(true);
  });

  it('blocks outside the quiet window even when idle and sessions are terminal', () => {
    /* NOW = 00:00 UTC. Window 22→07 would be active — use 08→12 to be out. */
    const r = canShutdown(
      registryWith([], {
        quietWindow: { enabled: true, startHour: 8, endHour: 12 },
      }),
      IDLE_OK,
      opts,
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('outside quiet window');
  });

  it('allows inside the quiet window when all other gates pass', () => {
    const r = canShutdown(
      registryWith([{ id: 'a', state: 'COMPLETED' }], {
        quietWindow: { enabled: true, startHour: 22, endHour: 7 },
      }),
      IDLE_OK,
      opts,
    );
    expect(r.allowed).toBe(true);
  });

  it('ignores the quiet window when disabled', () => {
    const r = canShutdown(
      registryWith([], {
        quietWindow: { enabled: false, startHour: 8, endHour: 12 },
      }),
      IDLE_OK,
      opts,
    );
    expect(r.allowed).toBe(true);
  });
});

describe('canShutdown — user idle gate', () => {
  it('blocks when userIdleMs is UNKNOWN', () => {
    const r = canShutdown(registryWith([]), 'UNKNOWN', opts);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('fail-closed');
  });

  it('blocks when the user is active (idle below threshold)', () => {
    const r = canShutdown(registryWith([]), 60_000, opts);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('user active');
  });

  it('allows when idle exceeds the threshold', () => {
    const r = canShutdown(registryWith([]), IDLE_OK, opts);
    expect(r.allowed).toBe(true);
  });
});

describe('canShutdown — session state matrix', () => {
  const blocking: SessionState[] = [
    'STARTING', 'RUNNING', 'IDLE', 'WAITING_FOR_USER', 'BLOCKED', 'QUEUED', 'STOPPING', 'UNKNOWN',
  ];
  const terminal: SessionState[] = ['COMPLETED', 'FAILED'];

  for (const state of blocking) {
    it(`blocks on non-terminal state ${state}`, () => {
      const r = canShutdown(registryWith([{ id: 's', state }]), IDLE_OK, opts);
      expect(r.allowed).toBe(false);
      expect(r.blockers.some((b) => b.sessionId === 's')).toBe(true);
    });
  }

  for (const state of terminal) {
    it(`does not block on terminal state ${state}`, () => {
      const r = canShutdown(registryWith([{ id: 's', state }]), IDLE_OK, opts);
      expect(r.allowed).toBe(true);
    });
  }
});

describe('canShutdown — stuck-session watchdog', () => {
  it('blocks forever on a stale UNKNOWN session without a watchdog bound', () => {
    const r = canShutdown(
      registryWith([{ id: 'old', state: 'UNKNOWN', ageMs: 24 * 3600_000 }]),
      IDLE_OK,
      opts,
    );
    expect(r.allowed).toBe(false);
  });

  it('reports but does not veto a session past maxSessionAgeMs', () => {
    const r = canShutdown(
      registryWith([{ id: 'old', state: 'RUNNING', ageMs: 5 * 3600_000 }]),
      IDLE_OK,
      { ...opts, maxSessionAgeMs: 4 * 3600_000 },
    );
    expect(r.allowed).toBe(true);
    expect(r.blockers[0]?.reason).toBe('stuck-session-watchdog');
  });
});
