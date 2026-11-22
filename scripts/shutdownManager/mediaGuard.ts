/**
 * Media playback guard (Director ruling 2026-11-22, R-377).
 *
 * Distinguishes "awake, watching a film" from "asleep with the video still
 * running" — the two cases `HIDIdleTime` alone cannot tell apart:
 *
 * 1. Media veto — while `pmset -g assertions` shows a playback assertion
 *    (video wake lock, playing audio, AirPlay, coreaudiod render), an
 *    otherwise-allowed shutdown is vetoed as long as user idle stays below
 *    `policy.mediaGuard.vetoMaxIdleSeconds`.
 * 2. Grace probe — past the cap, playback alone no longer proves presence:
 *    a notification banner is posted and the manager probes `HIDIdleTime`
 *    for `gracePeriodSeconds`. Any input cancels the shutdown; silence lets
 *    it proceed. The banner never steals focus (`display notification`,
 *    not a dialog — `.windsurf/rules/16-no-foreground-windows.md`).
 *
 * Fail-closed: an unreadable `pmset` is treated as "media may be playing" —
 * the guard's job is to never power off mid-playback, and the grace probe
 * still bounds the error.
 *
 * @module mediaGuard
 */

import { execFile } from 'node:child_process';

const PMSET_TIMEOUT_MS = 5_000;
const OSASCRIPT_TIMEOUT_MS = 5_000;

/** Assertion types that only exist while a player renders audio/video. */
const MEDIA_ASSERTION_TYPES = new Set([
  'NoDisplaySleepAssertion',
  'NoIdleSleepAssertion',
  'PreventUserIdleDisplaySleep',
]);

/** `PreventUserIdleSystemSleep` counts only for audio-render names. */
const AUDIO_NAME_PATTERN = /audio/i;

/** Transient/power-management names that are not playback. */
const NON_MEDIA_NAME_PATTERN = /delayDisplayOff/i;

export interface MediaProbe {
  playing: boolean;
  /** Human-readable "owner (assertion: name)" descriptions of the hits. */
  sources: string[];
}

/**
 * Parses `pmset -g assertions` output into media-playback sources.
 *
 * Only per-pid assertion lines are considered (the summary section has no
 * `pid` prefix). `PreventUserIdleSystemSleep` is counted only when the
 * assertion name mentions audio (coreaudiod render); powerd's generic
 * "display is on" hold is excluded by that filter. `delayDisplayOff` is a
 * transient power-management hold, never playback.
 *
 * @param output - Raw stdout of `pmset -g assertions`.
 * @returns Matched media sources; empty = no playback detected.
 */
export function parseMediaAssertions(output: string): string[] {
  const sources: string[] = [];
  const linePattern =
    /pid\s+\d+\(([^)]+)\).*?\b(NoDisplaySleepAssertion|NoIdleSleepAssertion|PreventUserIdleDisplaySleep|PreventUserIdleSystemSleep)\b.*?named:\s*"([^"]+)"/;
  for (const line of output.split('\n')) {
    const match = linePattern.exec(line);
    if (!match) continue;
    const [, owner, assertionType, name] = match;
    if (NON_MEDIA_NAME_PATTERN.test(name)) continue;
    const isMedia =
      MEDIA_ASSERTION_TYPES.has(assertionType) ||
      (assertionType === 'PreventUserIdleSystemSleep' && AUDIO_NAME_PATTERN.test(name));
    if (isMedia) sources.push(`${owner} (${assertionType}: ${name})`);
  }
  return sources;
}

/**
 * Probes macOS power assertions for active media playback.
 *
 * Fail-closed: a failed `pmset` resolves to `playing: true` — the veto
 * then applies until the idle cap, after which the grace probe bounds it.
 *
 * @returns The current media probe.
 */
export function getMediaPlayback(): Promise<MediaProbe> {
  return new Promise((resolve) => {
    execFile('pmset', ['-g', 'assertions'], { timeout: PMSET_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        resolve({ playing: true, sources: [`pmset unreadable (fail-closed): ${error.message}`] });
        return;
      }
      const sources = parseMediaAssertions(stdout);
      resolve({ playing: sources.length > 0, sources });
    });
  });
}

/** Media-guard policy shape (mirrors `MediaGuardSchema` in sessionRegistry). */
export interface MediaGuardPolicy {
  enabled: boolean;
  vetoMaxIdleSeconds: number;
  gracePeriodSeconds: number;
}

export const MEDIA_GUARD_DEFAULTS: MediaGuardPolicy = {
  enabled: true,
  vetoMaxIdleSeconds: 7200,
  gracePeriodSeconds: 300,
};

/** Pending grace window state held by the manager between poll cycles. */
export interface MediaGrace {
  /** Epoch ms when the grace window opened. */
  startedAtMs: number;
  /** `HIDIdleTime` at grace start — any lower reading means input happened. */
  baselineIdleMs: number;
}

export interface MediaGateResult {
  /** Whether the shutdown may proceed after the media gate. */
  allowed: boolean;
  reason: string;
  /** Next grace state (null = no pending grace). */
  grace: MediaGrace | null;
  /** True once, when the grace window opens and the banner must be posted. */
  notify: boolean;
}

/**
 * Pure media-gate decision for an otherwise-allowed shutdown.
 *
 * Sequence (only evaluated when `playing` is true):
 * idle < veto cap → veto; idle ≥ cap and no grace → open grace (`notify`);
 * during grace, a lower idle reading means input → cancel; elapsed <
 * gracePeriod → pending; elapsed ≥ gracePeriod → allow.
 *
 * @param input - Probe result, current idle, grace state, clock and policy.
 * @returns Gate verdict and the next grace state.
 */
export function decideMediaGate(input: {
  playing: boolean;
  sources: string[];
  idleMs: number;
  grace: MediaGrace | null;
  nowMs: number;
  config: MediaGuardPolicy;
}): MediaGateResult {
  const { playing, sources, idleMs, grace, nowMs, config } = input;
  const vetoCapMs = config.vetoMaxIdleSeconds * 1000;
  const graceMs = config.gracePeriodSeconds * 1000;
  const idleS = Math.round(idleMs / 1000);
  const src = sources.length > 0 ? ` [${sources.join('; ')}]` : '';

  if (!playing) {
    return { allowed: true, reason: 'no media playback', grace: null, notify: false };
  }
  /* Input probe first: any idle reading below the baseline recorded at grace
   * start means `HIDIdleTime` was reset — the user is awake. Reported as a
   * cancellation even when the reading falls back under the veto cap. */
  if (grace !== null && idleMs < grace.baselineIdleMs) {
    return {
      allowed: false,
      reason: `media grace cancelled — user input detected (idle reset to ${idleS}s)`,
      grace: null,
      notify: false,
    };
  }
  if (idleMs < vetoCapMs) {
    return {
      allowed: false,
      reason: `media playing — veto (idle ${idleS}s < cap ${config.vetoMaxIdleSeconds}s)${src}`,
      grace: null,
      notify: false,
    };
  }
  if (grace === null) {
    return {
      allowed: false,
      reason: `media grace started — shutdown in ${config.gracePeriodSeconds}s unless input (idle ${idleS}s >= cap)${src}`,
      grace: { startedAtMs: nowMs, baselineIdleMs: idleMs },
      notify: true,
    };
  }
  const elapsed = nowMs - grace.startedAtMs;
  if (elapsed < graceMs) {
    return {
      allowed: false,
      reason: `media grace pending ${Math.round(elapsed / 1000)}s/${config.gracePeriodSeconds}s — awaiting input`,
      grace,
      notify: false,
    };
  }
  return {
    allowed: true,
    reason: 'all sessions terminal and user idle; media grace expired without input',
    grace: null,
    notify: false,
  };
}

/**
 * Posts the grace-window banner — a macOS notification, never a dialog, so
 * no window is raised or focused (CTR-foreground-001). Fire-and-forget:
 * delivery failure must not affect the shutdown path.
 *
 * @param gracePeriodSeconds - Probe duration announced in the banner.
 */
export function notifyShutdownGrace(gracePeriodSeconds: number): Promise<void> {
  const minutes = Math.max(1, Math.round(gracePeriodSeconds / 60));
  const script =
    `display notification "Spegnimento tra ${minutes} min — ` +
    `muovi il mouse o premi un tasto per annullare" ` +
    `with title "Shutdown Manager" sound name "Glass"`;
  return new Promise((resolve) => {
    execFile('osascript', ['-e', script], { timeout: OSASCRIPT_TIMEOUT_MS }, () => resolve());
  });
}
