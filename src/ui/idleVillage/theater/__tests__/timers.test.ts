import { describe, it, expect } from 'vitest';
import { ensureTheaterTimers } from '../timers';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';

describe('theater timers', () => {
  it('returns default timers when config has no theater settings', () => {
    const config = { ...DEFAULT_IDLE_VILLAGE_CONFIG };
    const timers = ensureTheaterTimers(config);

    expect(timers).toEqual({
      hoverOpenMs: 600,
      hoverCloseMs: 200,
      maxPreviewCount: 3,
    });
  });

  it('overrides defaults with config values', () => {
    const config = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      ui: {
        theater: {
          hoverOpenMs: 1000,
          hoverCloseMs: 500,
          maxPreviewCount: 5,
        },
      },
    };
    const timers = ensureTheaterTimers(config);

    expect(timers).toEqual({
      hoverOpenMs: 1000,
      hoverCloseMs: 500,
      maxPreviewCount: 5,
    });
  });

  it('partially overrides defaults with config values', () => {
    const config = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      ui: {
        theater: {
          hoverOpenMs: 800,
        },
      },
    };
    const timers = ensureTheaterTimers(config);

    expect(timers).toEqual({
      hoverOpenMs: 800,
      hoverCloseMs: 200,
      maxPreviewCount: 3,
    });
  });

  it('handles missing ui.theater config gracefully', () => {
    const config = {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      ui: {},
    };
    const timers = ensureTheaterTimers(config);

    expect(timers).toEqual({
      hoverOpenMs: 600,
      hoverCloseMs: 200,
      maxPreviewCount: 3,
    });
  });

  it('handles missing ui config gracefully', () => {
    const config = { ...DEFAULT_IDLE_VILLAGE_CONFIG };
    const timers = ensureTheaterTimers(config);

    expect(timers).toEqual({
      hoverOpenMs: 600,
      hoverCloseMs: 200,
      maxPreviewCount: 3,
    });
  });
});
