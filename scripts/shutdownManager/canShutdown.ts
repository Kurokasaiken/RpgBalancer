/**
 * Decision engine for the Global Session Shutdown Manager.
 *
 * Pure function: given a (already stale-recovered) registry, the user idle
 * measurement and policy, decides whether a shutdown request is allowed.
 * Fail-closed by design — anything unknown, missing or ambiguous blocks.
 *
 * @module canShutdown
 */

import {
  DEFAULT_RESTRICTED_DAYS_OF_WEEK,
  isQuietWindowActive,
  type Session,
  type SessionRegistry,
  type SessionState,
} from './sessionRegistry.js';

/** Short day labels for quiet-window diagnostics (index = `Date.getDay()`). */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Session states that always block shutdown. */
const BLOCKING_STATES: ReadonlySet<SessionState> = new Set([
  'STARTING',
  'RUNNING',
  'IDLE',
  'WAITING_FOR_USER',
  'BLOCKED',
  'QUEUED',
  'STOPPING',
  'UNKNOWN',
]);

/** Terminal states that never block shutdown. */
const TERMINAL_STATES: ReadonlySet<SessionState> = new Set([
  'COMPLETED',
  'FAILED',
  'TIMED_OUT',
  'ABANDONED_STALE',
]);

export interface ShutdownBlocker {
  projectId: string;
  sessionId: string;
  state: SessionState;
  reason: string;
}

export interface ShutdownDecision {
  allowed: boolean;
  reason: string;
  blockers: ShutdownBlocker[];
  userIdleMs: number | 'UNKNOWN';
  policy: SessionRegistry['policy'];
}

export interface CanShutdownOptions {
  /** Milliseconds the interactive user must be idle before shutdown is allowed. */
  userIdleThresholdMs?: number;
  /**
   * Max age (ms) of a session from its first heartbeat after which an
   * UNKNOWN/stuck session stops blocking (watchdog upper bound).
   * `undefined` = UNKNOWN blocks forever.
   */
  maxSessionAgeMs?: number;
  /** Current time; injectable for tests. */
  now?: Date;
}

/**
 * Decides whether the machine may shut down.
 *
 * Blocking rules (in order):
 * 1. `policy.shutdownEnabled === false` → blocked.
 * 1b. `policy.quietWindow.enabled` and now outside the window → blocked.
 *     The window covers `startHour`–`endHour` on `restrictedDaysOfWeek`
 *     and the whole day on unlisted days (R-211: weekends unrestricted).
 * 2. `userIdleMs === 'UNKNOWN'` or below threshold → blocked.
 * 3. Any session in a non-terminal state → blocked. Sessions whose
 *    heartbeat age exceeds `maxSessionAgeMs` are treated as stuck and
 *    reported in `blockers` with `reason='stuck-session-watchdog'`
 *    but no longer veto the shutdown.
 *
 * @param registry - Registry snapshot (call `recoverStaleSessions` first).
 * @param userIdleMs - Idle time in ms, or 'UNKNOWN' when unreadable.
 * @param options - Thresholds and clock overrides.
 * @returns A {@link ShutdownDecision}.
 */
export function canShutdown(
  registry: SessionRegistry,
  userIdleMs: number | 'UNKNOWN',
  options: CanShutdownOptions = {},
): ShutdownDecision {
  const now = options.now ?? new Date();
  const policy = registry.policy;
  const idleThreshold = options.userIdleThresholdMs ?? policy.userIdleThresholdSeconds * 1000;
  const blockers: ShutdownBlocker[] = [];

  for (const [projectId, project] of Object.entries(registry.projects)) {
    for (const [sessionId, session] of Object.entries(project.sessions)) {
      if (TERMINAL_STATES.has(session.state)) continue;
      const stuck = isStuck(session, now, options.maxSessionAgeMs);
      if (BLOCKING_STATES.has(session.state) && !stuck) {
        blockers.push({
          projectId,
          sessionId,
          state: session.state,
          reason: session.blockingReason ?? `state ${session.state} blocks shutdown`,
        });
      }
      if (stuck) {
        blockers.push({
          projectId,
          sessionId,
          state: session.state,
          reason: 'stuck-session-watchdog',
        });
      }
    }
  }

  const vetoes = blockers.filter((b) => b.reason !== 'stuck-session-watchdog');

  if (!policy.shutdownEnabled) {
    return { allowed: false, reason: 'policy.shutdownEnabled=false', blockers, userIdleMs, policy };
  }
  /* Quiet-window veto (Director rulings 2026-10-16 + 2026-10-17 R-211): when
   * enabled, shutdown is only allowed inside the configured overnight window
   * on restricted days — a drained queue at 15:00 on a weekday must not power
   * off the machine the Director may still be using. Days not listed in
   * `restrictedDaysOfWeek` (Sat/Sun by default) are active all day. */
  if (policy.quietWindow?.enabled && !isQuietWindowActive(now, policy.quietWindow)) {
    const w = policy.quietWindow;
    const days = (w.restrictedDaysOfWeek ?? DEFAULT_RESTRICTED_DAYS_OF_WEEK)
      .map((d) => DAY_NAMES[d])
      .join(',');
    return {
      allowed: false,
      reason: `outside quiet window (allowed ${w.startHour}:00–${w.endHour}:00 on ${days}; all day on other days)`,
      blockers,
      userIdleMs,
      policy,
    };
  }
  if (userIdleMs === 'UNKNOWN') {
    return { allowed: false, reason: 'user idle unreadable (fail-closed)', blockers, userIdleMs, policy };
  }
  if (userIdleMs < idleThreshold) {
    return {
      allowed: false,
      reason: `user active (idle ${Math.round(userIdleMs / 1000)}s < ${Math.round(idleThreshold / 1000)}s)`,
      blockers,
      userIdleMs,
      policy,
    };
  }
  if (vetoes.length > 0) {
    return { allowed: false, reason: `${vetoes.length} blocking session(s)`, blockers, userIdleMs, policy };
  }
  return { allowed: true, reason: 'all sessions terminal and user idle', blockers, userIdleMs, policy };
}

/**
 * A session is "stuck" when its heartbeat is older than `maxSessionAgeMs`.
 *
 * @param session - Session to evaluate.
 * @param now - Current time.
 * @param maxSessionAgeMs - Watchdog bound; disabled when undefined.
 */
function isStuck(session: Session, now: Date, maxSessionAgeMs?: number): boolean {
  if (maxSessionAgeMs === undefined) return false;
  const age = now.getTime() - new Date(session.heartbeatAt).getTime();
  return age > maxSessionAgeMs;
}
