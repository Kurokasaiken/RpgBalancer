/**
 * Unit tests for the media playback guard (R-377, Director 2026-11-22).
 *
 * Covers the pmset assertion parser and the pure media gate: veto below the
 * idle cap, grace window with input probe past the cap.
 */

import { describe, it, expect } from 'vitest';
import {
  decideMediaGate,
  parseMediaAssertions,
  type MediaGuardPolicy,
} from '../../../scripts/shutdownManager/mediaGuard.js';

const CONFIG: MediaGuardPolicy = {
  enabled: true,
  vetoMaxIdleSeconds: 7200,
  gracePeriodSeconds: 300,
};

const IDLE_BELOW_CAP = 3600_000; // 1h
const IDLE_PAST_CAP = 7205_000; // just past the 2h cap
const NOW = 1_700_000_000_000;

const CHROME_VIDEO = `
Kernel Assertions:
   pid 348(powerd): [0x0000002e00018003] 00:03:30 PreventUserIdleSystemSleep named: "Powerd - Prevent sleep while display is on"
   pid 348(powerd): [0x00000093001082c8] 00:00:04 InternalPreventDisplaySleep named: "com.apple.powermanagement.delayDisplayOff"
   pid 669(Google Chrome): [0x000000e50001832b] 00:00:27 NoIdleSleepAssertion named: "Playing audio"
   pid 669(Google Chrome): [0x000000fd0005833a] 00:00:03 NoDisplaySleepAssertion named: "Video Wake Lock"
   pid 419(coreaudiod): [0x0000009500018272] 00:01:47 PreventUserIdleSystemSleep named: "com.apple.audio.ctx.preventuseridlesleep"
`;

const IDLE_DESKTOP = `
Kernel Assertions:
   pid 348(powerd): [0x0000002e00018003] 00:03:30 PreventUserIdleSystemSleep named: "Powerd - Prevent sleep while display is on"
   pid 348(powerd): [0x00000093001082c8] 00:00:04 InternalPreventDisplaySleep named: "com.apple.powermanagement.delayDisplayOff"
`;

describe('parseMediaAssertions', () => {
  it('detects browser video wake lock and playing audio', () => {
    const sources = parseMediaAssertions(CHROME_VIDEO);
    expect(sources.length).toBeGreaterThanOrEqual(3);
    expect(sources.join(' ')).toContain('Video Wake Lock');
    expect(sources.join(' ')).toContain('Playing audio');
    expect(sources.join(' ')).toContain('coreaudiod');
  });

  it('ignores powerd display-on and delayDisplayOff holds', () => {
    expect(parseMediaAssertions(IDLE_DESKTOP)).toEqual([]);
  });

  it('detects AirPlay and third-party player display-sleep holds', () => {
    const airplay = `   pid 1652(AirPlayUIAgent): [0x1] 00:02:22 PreventUserIdleDisplaySleep named: "com.apple.airplay.disableUserIdleDisplaySleep"`;
    const vlc = `   pid 900(VLC): [0x2] 00:10:00 PreventUserIdleDisplaySleep named: "VLC media playback"`;
    expect(parseMediaAssertions(airplay).length).toBe(1);
    expect(parseMediaAssertions(vlc).length).toBe(1);
  });

  it('ignores non-audio PreventUserIdleSystemSleep', () => {
    const backup = `   pid 42(backupd): [0x1] 00:05:00 PreventUserIdleSystemSleep named: "com.apple.backupd-auto"` +
      `\n   pid 43(mds): [0x2] 00:01:00 PreventUserIdleSystemSleep named: "Spotlight indexing"`;
    expect(parseMediaAssertions(backup)).toEqual([]);
  });

  it('returns empty on garbage or empty output', () => {
    expect(parseMediaAssertions('')).toEqual([]);
    expect(parseMediaAssertions('PreventUserIdleDisplaySleep    1\nno pid lines here')).toEqual([]);
  });
});

describe('decideMediaGate', () => {
  const base = { sources: ['Google Chrome (NoDisplaySleepAssertion: "Video Wake Lock")'], nowMs: NOW, config: CONFIG };

  it('allows immediately when no media is playing', () => {
    const r = decideMediaGate({ ...base, playing: false, idleMs: IDLE_PAST_CAP, grace: null });
    expect(r.allowed).toBe(true);
    expect(r.grace).toBeNull();
  });

  it('vetoes while media plays and idle is below the cap — the watching case', () => {
    const r = decideMediaGate({ ...base, playing: true, idleMs: IDLE_BELOW_CAP, grace: null });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('veto');
    expect(r.grace).toBeNull();
  });

  it('opens the grace window past the cap — the asleep-with-video case', () => {
    const r = decideMediaGate({ ...base, playing: true, idleMs: IDLE_PAST_CAP, grace: null });
    expect(r.allowed).toBe(false);
    expect(r.notify).toBe(true);
    expect(r.grace).toEqual({ startedAtMs: NOW, baselineIdleMs: IDLE_PAST_CAP });
    expect(r.reason).toContain('grace started');
  });

  it('keeps the shutdown pending while grace runs and idle grows', () => {
    const grace = { startedAtMs: NOW, baselineIdleMs: IDLE_PAST_CAP };
    const r = decideMediaGate({
      ...base,
      playing: true,
      idleMs: IDLE_PAST_CAP + 30_000,
      grace,
      nowMs: NOW + 30_000,
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('grace pending');
    expect(r.grace).toEqual(grace);
  });

  it('cancels the shutdown when input resets idle during grace — user is awake', () => {
    const grace = { startedAtMs: NOW, baselineIdleMs: IDLE_PAST_CAP };
    const r = decideMediaGate({
      ...base,
      playing: true,
      idleMs: 2_000,
      grace,
      nowMs: NOW + 60_000,
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('cancelled');
    expect(r.grace).toBeNull();
  });

  it('allows the shutdown when grace expires with no input — user is asleep', () => {
    const grace = { startedAtMs: NOW, baselineIdleMs: IDLE_PAST_CAP };
    const r = decideMediaGate({
      ...base,
      playing: true,
      idleMs: IDLE_PAST_CAP + 310_000,
      grace,
      nowMs: NOW + 310_000,
    });
    expect(r.allowed).toBe(true);
    expect(r.reason).toContain('grace expired');
    expect(r.grace).toBeNull();
  });
});
