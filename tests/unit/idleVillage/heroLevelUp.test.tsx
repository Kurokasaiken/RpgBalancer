import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import path from 'path';
import {
  HERO_LEVEL_CONFIG,
  HERO_LEVEL_CONFIG_INVALID,
  heroLevelConfigSchema,
  parseHeroLevelConfig,
  type HeroLevelConfig,
} from '@/balancing/config/idleVillage/heroLevelConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { HeroLevelDecor } from '@/ui/idleVillage/rosterV2/HeroLevelDecor';
import { dispatchHeroLevelUp, subscribeHeroLevelUp, type HeroLevelUpEvent } from '@/ui/idleVillage/rosterV2/heroLevelUpEvents';
import { runHeroLevelUpStaging } from '@/ui/idleVillage/rosterV2/runHeroLevelUpStaging';
import { clearMountedCardsForTest, registerMountedCard } from '@/ui/idleVillage/rosterV2/mountedCardRegistry';

const telemetrySpy = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: (...args: unknown[]) => telemetrySpy(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      `${key}:${opts?.n ?? ''}`,
  }),
}));

/** Minimal canonical resident — only the fields the seam reads. */
const resident = (id: string, isHero: boolean): ResidentState =>
  ({ id, displayName: id, isHero, status: 'available', fatigue: 0, currentHp: 50, maxHp: 50 } as ResidentState);

const resolveKey = (locale: 'en' | 'it-IT', key: string): string | undefined => {
  const doc = JSON.parse(
    readFileSync(path.resolve(__dirname, `../../../public/locales/${locale}/idleVillage.json`), 'utf8'),
  );
  return key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), doc) as string | undefined;
};

describe('heroLevelConfig', () => {
  const raw = () => structuredClone(JSON.parse(JSON.stringify({ levels: HERO_LEVEL_CONFIG?.levels, fx: HERO_LEVEL_CONFIG?.fx, staging: HERO_LEVEL_CONFIG?.staging })));

  it('parses the authored config and reports it valid', () => {
    const out = parseHeroLevelConfig(raw());
    expect(out.configInvalid).toBe(false);
    expect(out.config?.staging.targets.length).toBeGreaterThanOrEqual(1);
    expect(HERO_LEVEL_CONFIG_INVALID).toBe(false);
    // Every configured level is an int >= 1 keyed by resident id.
    for (const [id, lv] of Object.entries(HERO_LEVEL_CONFIG!.levels)) {
      expect(id.length).toBeGreaterThan(0);
      expect(Number.isInteger(lv) && lv >= 1).toBe(true);
    }
  });

  it('drops malformed level entries per-key, no coercion, marks invalid', () => {
    const r = raw();
    r.levels['hero-sir-spaccaculi'] = '4'; // string is dropped, not converted
    r.levels['bad-zero'] = 0;
    r.levels['good'] = 2;
    const out = parseHeroLevelConfig(r);
    expect(out.configInvalid).toBe(true);
    expect(out.config?.levels['hero-sir-spaccaculi']).toBeUndefined();
    expect(out.config?.levels['bad-zero']).toBeUndefined();
    expect(out.config?.levels['good']).toBe(2);
  });

  it('a non-object levels section is unsalvageable → config null', () => {
    const out = parseHeroLevelConfig({ ...raw(), levels: 'nope' });
    expect(out.config).toBeNull();
    expect(out.configInvalid).toBe(true);
  });

  it('distinguishes absent staging (invalid) from explicit empty (valid no-op)', () => {
    const absent = parseHeroLevelConfig({ levels: { h: 1 } });
    expect(absent.configInvalid).toBe(true);
    expect(absent.config?.staging.targets).toEqual([]);

    const empty = parseHeroLevelConfig({ levels: { h: 1 }, staging: { targets: [] } });
    expect(empty.configInvalid).toBe(false);
    expect(empty.config?.staging.targets).toEqual([]);
  });

  it('keeps absent fx fields as defaults without invalidating; invalid fx is defaulted + flagged', () => {
    const noFx = parseHeroLevelConfig({ levels: { h: 1 }, staging: { targets: [] } });
    expect(noFx.configInvalid).toBe(false);
    expect(noFx.config?.fx.ringMs).toBeGreaterThan(0);
    expect(noFx.config?.fx.floaterMs).toBeGreaterThan(0);

    const badFx = parseHeroLevelConfig({ levels: { h: 1 }, staging: { targets: [] }, fx: { ringMs: -5 } });
    expect(badFx.configInvalid).toBe(true);
    expect(badFx.config?.fx.ringMs).toBeGreaterThan(0);
    expect(badFx.config?.fx.floaterMs).toBeGreaterThan(0);
  });

  it('strips unknown keys at every level and marks the result invalid', () => {
    const out = parseHeroLevelConfig({ ...raw(), xpToNext: 100, staging: { targets: ['h'], extra: 1 } });
    expect(out.configInvalid).toBe(true);
    expect('xpToNext' in (out.config as object)).toBe(false);
    expect('extra' in (out.config?.staging as object)).toBe(false);
  });

  it('the strict schema throws on the same malformed input (dev path)', () => {
    expect(() => heroLevelConfigSchema.parse({ levels: { h: 0 }, staging: { targets: [] } })).toThrow();
    expect(() => heroLevelConfigSchema.parse({ ...raw(), xpToNext: 5 })).toThrow();
  });
});

describe('heroLevelView', () => {
  it('hero + configured level → the level; non-hero in levels → null; hero without level → null', () => {
    const heroId = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];
    expect(heroLevelView(resident(heroId, true)).level).toBe(HERO_LEVEL_CONFIG!.levels[heroId]);
    expect(heroLevelView(resident(heroId, false)).level).toBeNull();
    expect(heroLevelView(resident('hero-no-level', true)).level).toBeNull();
    expect(heroLevelView(null).level).toBeNull();
  });
});

describe('runHeroLevelUpStaging', () => {
  const config: HeroLevelConfig = {
    levels: { 'hero-a': 3, 'hero-b': 2 },
    fx: { ringMs: 1400, floaterMs: 1800 },
    staging: { targets: ['hero-a', 'hero-b'] },
  };
  const residentsById = {
    'hero-a': resident('hero-a', true),
    'hero-b': resident('hero-b', true),
    'villager-c': resident('villager-c', false),
  };

  beforeEach(() => {
    clearMountedCardsForTest();
    telemetrySpy.mockClear();
  });

  it('REJECTS on invalid config — no dispatch, telemetry or audio', () => {
    const events: HeroLevelUpEvent[] = [];
    const unsub = subscribeHeroLevelUp((e) => events.push(e));
    const playCue = vi.fn();
    const res = runHeroLevelUpStaging({ residentsById, config, configInvalid: true, playCue });
    expect(res.accepted).toBe(false);
    expect(res.configuredTargets).toEqual(['hero-a', 'hero-b']);
    expect(res.dispatchedTargets).toEqual([]);
    expect(events).toEqual([]);
    expect(telemetrySpy).not.toHaveBeenCalled();
    expect(playCue).not.toHaveBeenCalled();
    unsub();
  });

  it('REJECTS when any target is not a roster-valid hero', () => {
    const playCue = vi.fn();
    const res = runHeroLevelUpStaging({
      residentsById,
      config: { ...config, staging: { targets: ['hero-a', 'villager-c'] } },
      playCue,
    });
    expect(res.accepted).toBe(false);
    expect(res.dispatchedTargets).toEqual([]);
    expect(telemetrySpy).not.toHaveBeenCalled();
    expect(playCue).not.toHaveBeenCalled();

    const stale = runHeroLevelUpStaging({
      residentsById,
      config: { ...config, staging: { targets: ['hero-a', 'ghost-id'] } },
    });
    expect(stale.accepted).toBe(false);
  });

  it('REJECTS (no-op) when no valid target has a mounted card', () => {
    const playCue = vi.fn();
    const res = runHeroLevelUpStaging({ residentsById, config, playCue });
    expect(res.accepted).toBe(false);
    expect(res.configuredTargets).toEqual(['hero-a', 'hero-b']);
    expect(res.dispatchedTargets).toEqual([]);
    expect(telemetrySpy).not.toHaveBeenCalled();
    expect(playCue).not.toHaveBeenCalled();
  });

  it('ACCEPTS with ≥1 eligible: N events, ONE telemetry (exact payload), ONE cue, monotonic eventIds', () => {
    const unregs = [registerMountedCard('hero-a'), registerMountedCard('hero-b')];
    const events: HeroLevelUpEvent[] = [];
    const unsub = subscribeHeroLevelUp((e) => events.push(e));
    const playCue = vi.fn();

    const res = runHeroLevelUpStaging({ residentsById, config, playCue });
    expect(res.accepted).toBe(true);
    expect(res.dispatchedTargets).toEqual(['hero-a', 'hero-b']);
    expect(events.map((e) => e.residentId)).toEqual(['hero-a', 'hero-b']);
    expect(events.map((e) => e.eventId)).toEqual(['1:0', '1:1']);
    expect(events[0].level).toBe(4); // T-C1 (R-234): the event carries the NEW level (authored 3 + 1)
    expect(telemetrySpy).toHaveBeenCalledTimes(1);
    expect(telemetrySpy).toHaveBeenCalledWith('feature_action', {
      action: 'hero_levelup_mock',
      configuredTargets: ['hero-a', 'hero-b'],
      dispatchedTargets: ['hero-a', 'hero-b'],
    });
    expect(playCue).toHaveBeenCalledTimes(1);

    // Rapid retrigger → new command seq → eventIds keep climbing.
    const res2 = runHeroLevelUpStaging({ residentsById, config, playCue });
    expect(res2.accepted).toBe(true);
    expect(events.map((e) => e.eventId)).toEqual(['1:0', '1:1', '2:0', '2:1']);
    unsub();
    unregs.forEach((u) => u());
  });

  it('mounts-only filtering: a valid-but-unmounted target stays configured, not dispatched', () => {
    const unreg = registerMountedCard('hero-a');
    const res = runHeroLevelUpStaging({ residentsById, config });
    expect(res.accepted).toBe(true);
    expect(res.configuredTargets).toEqual(['hero-a', 'hero-b']);
    expect(res.dispatchedTargets).toEqual(['hero-a']);
    unreg();
  });
});

describe('HeroLevelDecor', () => {
  const heroId = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];

  const renderCard = (r: ResidentState) =>
    render(
      <div style={{ position: 'relative' }}>
        <div data-wanderlust-portrait style={{ width: 22, height: 22 }} />
        <HeroLevelDecor resident={r} />
      </div>,
    );

  beforeEach(() => clearMountedCardsForTest());
  afterEach(() => vi.useRealTimers());

  it('T-02b: non-hero card keeps the slot but mounts zero hero-level elements', () => {
    renderCard(resident(heroId, false));
    expect(document.querySelector(`[data-hero-level-slot="${heroId}"]`)).toBeTruthy();
    expect(document.querySelector('[data-hero-level]')).toBeNull();
    expect(document.querySelector('[data-hero-level-ring]')).toBeNull();
  });

  it('T-02: level null → arc not mounted; level ≥ 1 → resting ring + badge with a11y name', () => {
    renderCard(resident('hero-no-level', true));
    expect(document.querySelector('[data-hero-level-ring]')).toBeNull();

    renderCard(resident(heroId, true));
    expect(document.querySelector(`[data-hero-level-ring="${heroId}"]`)).toBeTruthy();
    expect(screen.getByRole('img', { name: `gameFrame.heroLevel.a11y:${HERO_LEVEL_CONFIG!.levels[heroId]}` })).toBeInTheDocument();
  });

  it('registers the card in the mounted registry on mount (the command eligibility seam)', async () => {
    const { unmount } = renderCard(resident(heroId, true));
    const { isCardMounted } = await import('@/ui/idleVillage/rosterV2/mountedCardRegistry');
    expect(isCardMounted(heroId)).toBe(true);
    unmount();
    expect(isCardMounted(heroId)).toBe(false);
  });

  it('a level-up event mounts the ignition overlay keyed by eventId, then returns to rest', () => {
    vi.useFakeTimers();
    renderCard(resident(heroId, true));
    act(() => {
      dispatchHeroLevelUp({ type: 'hero_levelup_mock', residentId: heroId, level: 4, eventId: '9:0' });
    });
    expect(document.querySelector('[data-hero-level-ignition="9:0"]')).toBeTruthy();

    // Retrigger supersedes by eventId — one live ignition, keyed remount.
    act(() => {
      dispatchHeroLevelUp({ type: 'hero_levelup_mock', residentId: heroId, level: 4, eventId: '10:0' });
    });
    expect(document.querySelector('[data-hero-level-ignition="9:0"]')).toBeNull();
    expect(document.querySelector('[data-hero-level-ignition="10:0"]')).toBeTruthy();

    // After ringMs the overlay unmounts and the resting ring stays.
    act(() => {
      vi.advanceTimersByTime(HERO_LEVEL_CONFIG!.fx.ringMs + 10);
    });
    expect(document.querySelector('[data-hero-level-ignition]')).toBeNull();
    expect(document.querySelector(`[data-hero-level-ring="${heroId}"]`)).toBeTruthy();
  });
});

describe('heroLevel i18n', () => {
  it('resolves badge/floater/a11y in both locales with {{n}} interpolation', () => {
    for (const locale of ['en', 'it-IT'] as const) {
      for (const key of ['badge', 'floater', 'a11y']) {
        const value = resolveKey(locale, `gameFrame.heroLevel.${key}`);
        expect(typeof value, `${locale} missing ${key}`).toBe('string');
        /* i18next-icu: the interpolation syntax is `{n}` — `{{n}}` would
         * render literally (verified at runtime in the headed smoke). */
        expect(value).toContain('{n}');
        expect(value).not.toContain('{{');
      }
      expect(resolveKey(locale, 'gameFrame.director.levelUp')).toBeTruthy();
    }
  });
});
