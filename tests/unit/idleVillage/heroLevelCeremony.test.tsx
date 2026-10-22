/**
 * PLAN-067 T-C1 (R-234, LVL = B) — the level-up ceremony. Before: with the roster closed the Director
 * button did NOTHING (silent reject), and with it open a ghost «LEVEL 4» flashed for 0.4 s while the
 * number never changed. Now: the roster opens by itself, the level really rises (4 → 5, mock), and one
 * plate per hero stamps the new level with the real gains from config.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HERO_LEVEL_CONFIG } from '@/balancing/config/idleVillage/heroLevelConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { runHeroLevelUpStaging } from '@/ui/idleVillage/rosterV2/runHeroLevelUpStaging';
import { dispatchHeroLevelUp, subscribeHeroLevelUp, type HeroLevelUpEvent } from '@/ui/idleVillage/rosterV2/heroLevelUpEvents';
import { clearMountedCardsForTest, registerMountedCard } from '@/ui/idleVillage/rosterV2/mountedCardRegistry';
import { resetMockLevelsForTest } from '@/ui/idleVillage/rosterV2/heroLevelMock';
import { heroLevelGains, toRoman } from '@/ui/idleVillage/rosterV2/heroLevelGains';
import { HeroLevelCeremony } from '@/ui/idleVillage/rosterV2/HeroLevelCeremony';
import { runStagingOpeningRoster } from '@/ui/idleVillage/rosterV2/runStagingOpeningRoster';

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({ trackTelemetryEvent: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, o?: Record<string, unknown>) => (o ? `${key}|${Object.values(o).join(',')}` : key) }),
}));

const HERO = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];
const resident = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, displayName: id.toUpperCase(), isHero: true, status: 'available', fatigue: 0, currentHp: 50, maxHp: 195, statSnapshot: { agility: 72, evasion: 10, regen: 5, ward: 8, damage: 30, armor: 12 }, ...extra }) as unknown as ResidentState;

afterEach(() => { clearMountedCardsForTest(); resetMockLevelsForTest(); vi.useRealTimers(); });

describe('level really rises (R-234, T-C1)', () => {
  // INV:R-234-levelup-rises — the Director level-up raises the shown level by one (mock, in memory).
  it('shows base+1 after the command, and dispatches the NEW level', () => {
    const base = HERO_LEVEL_CONFIG!.levels[HERO];
    expect(heroLevelView(resident(HERO)).level).toBe(base);
    const unreg = registerMountedCard(HERO);
    const events: HeroLevelUpEvent[] = [];
    const unsub = subscribeHeroLevelUp((e) => events.push(e));
    const res = runHeroLevelUpStaging({ residentsById: { [HERO]: resident(HERO) } as never, config: { ...HERO_LEVEL_CONFIG!, staging: { targets: [HERO] } } });
    expect(res.accepted).toBe(true);
    expect(events[0].level).toBe(base + 1);
    expect(heroLevelView(resident(HERO)).level).toBe(base + 1);
    unsub(); unreg();
  });
});

describe('gains from config (R-234, T-C1)', () => {
  it('reads the real values and adds the authored deltas', () => {
    const rows = heroLevelGains(resident(HERO));
    expect(rows.length).toBeGreaterThan(0);
    const stat = rows.find((r) => r.key !== 'maxHp');
    expect(stat).toBeTruthy();
    expect(stat!.to).toBeGreaterThan(stat!.from);
    expect([72, 10, 5, 8, 30, 12]).toContain(stat!.from);
    const hp = rows.find((r) => r.key === 'maxHp');
    expect(hp!.from).toBe(195);
    expect(hp!.to).toBeGreaterThan(195);
  });
  it('writes the level as a roman numeral', () => {
    expect([1, 4, 5, 9, 14].map(toRoman)).toEqual(['I', 'IV', 'V', 'IX', 'XIV']);
  });
});

describe('HeroLevelCeremony (R-234, T-C1)', () => {
  const ids = () => [HERO, Object.keys(HERO_LEVEL_CONFIG!.levels)[1]];
  const mount = () => {
    const map = Object.fromEntries(ids().map((id) => [id, resident(id)]));
    return render(<HeroLevelCeremony residentsById={map as never} />);
  };
  const fire = () => act(() => {
    ids().forEach((id, i) => dispatchHeroLevelUp({ type: 'hero_levelup_mock', residentId: id, level: 5, eventId: `9:${i}` }));
  });
  // INV:R-234-levelup-ceremony — one plate per hero with the roman seal and the real gains; «continue» closes it.
  it('stamps one plate per hero and dismisses on «continue»', () => {
    mount();
    expect(screen.queryAllByTestId('hero-levelup-plate')).toHaveLength(0);
    fire();
    const plates = screen.getAllByTestId('hero-levelup-plate');
    expect(plates).toHaveLength(2);
    expect(plates[0].textContent).toContain('V');
    expect(plates[0].querySelectorAll('[data-gain-row]').length).toBeGreaterThan(0);
    fireEvent.click(plates[0].querySelector('button')!);
    expect(screen.getAllByTestId('hero-levelup-plate')).toHaveLength(1);
  });

  it('is static under reduced motion', () => {
    const mm = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() });
    vi.stubGlobal('matchMedia', mm); window.matchMedia = mm as never;
    mount(); fire();
    expect(screen.getAllByTestId('hero-levelup-plate')[0]).toHaveAttribute('data-reduced-motion', 'true');
    vi.unstubAllGlobals();
  });
});

describe('Director opens the roster first (R-234, T-C1)', () => {
  // INV:R-234-levelup-opens-roster — a rejected first try opens the roster and retries until a card mounts.
  it('retries after opening the roster, and stops on success', () => {
    vi.useFakeTimers();
    let mounted = false;
    const openRoster = vi.fn(() => { setTimeout(() => { mounted = true; }, 250); });
    const run = vi.fn(() => ({ accepted: mounted, configuredTargets: [], dispatchedTargets: [] }));
    runStagingOpeningRoster({ run, openRoster, intervalMs: 100, maxTries: 15 });
    expect(openRoster).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(run.mock.calls.length).toBeGreaterThan(1);
    expect(run.mock.results.at(-1)!.value.accepted).toBe(true);
    const calls = run.mock.calls.length;
    vi.advanceTimersByTime(2000);
    expect(run.mock.calls.length).toBe(calls);
  });
  it('does not open the roster when the first try succeeds', () => {
    const openRoster = vi.fn();
    runStagingOpeningRoster({ run: () => ({ accepted: true, configuredTargets: [], dispatchedTargets: [] }), openRoster });
    expect(openRoster).not.toHaveBeenCalled();
  });
});
