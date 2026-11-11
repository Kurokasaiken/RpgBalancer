/**
 * Time of day on /game is config-driven (Director 2026-11-11: «tutti quei valori devono essere governati da config, se c'è
 * scritto da 1 altra parte hardcoded è un errore»). The curve, max speed and speeds come from gameFrameConfig.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { ambientForPhase, nightShownAt, offeredSpeeds } from '@/ui/idleVillage/config/timeOfDay';

const TOD = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.map;

describe('time of day (config-driven)', () => {
  it('day starts in full light and ends at the configured night light', () => {
    expect(ambientForPhase(TOD, true, 0).light).toBe(1);
    expect(ambientForPhase(TOD, true, 1).light).toBeCloseTo(TOD.nightLight);
  });

  it('a different nightLight in the config changes the curve (no literal in the code)', () => {
    const darker = { ...TOD, nightLight: 0.2 };
    expect(ambientForPhase(darker, true, 1).light).toBeCloseTo(0.2);
    expect(ambientForPhase(darker, false, 0).light).toBeCloseTo(0.2);
  });

  it('dusk turns amber before nightfall and the amber fades at the end of the phase', () => {
    expect(ambientForPhase(TOD, true, TOD.curve.duskWarmPeak).warm).toBeCloseTo(1);
    expect(ambientForPhase(TOD, true, 1).warm).toBeCloseTo(0);
  });

  it('the night shows up to the configured speed only', () => {
    expect(nightShownAt(TOD, TOD.maxSpeed)).toBe(true);
    expect(nightShownAt(TOD, TOD.maxSpeed * 2)).toBe(false);
  });

  it('offered speeds are the configured list capped by the engine max', () => {
    expect(offeredSpeeds(DEFAULT_GAME_FRAME_CONFIG.gamePage.speeds, 5)).toEqual([1, 2, 4]);
  });

  it('/game opens paused and hides nav labels by config', () => {
    expect(DEFAULT_GAME_FRAME_CONFIG.gamePage.startPaused).toBe(true);
    expect(DEFAULT_GAME_FRAME_CONFIG.gamePage.navShowLabels).toBe(false);
  });
});
