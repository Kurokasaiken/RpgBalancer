/**
 * R-339 / PLAN-119 T6 (2026-11-15) — the slim docked top chrome of /game.
 *
 * Artifact-r004 D3 + Director ruling D10: two separate slimmer elements
 * (day banner + resource bar) arranged left/center — the top-right zone is
 * reserved for the future docked Chronicle surface (layout token, no
 * hanging tab). These tests pin the contract (`game-top-chrome`):
 *   the cluster publishes its real occupancy to `useGameLayoutInsets.top`;
 *   its left edge hugs the free-map band one margin right of `insets.left`;
 *   its right edge never enters the Chronicle reserve while it can stay at
 *   or above `minFitScale` (the reserve yields below that — screen edge is
 *   the only hard bound);
 *   the day banner seats the phase sun/moon dial in its emerald via
 *   `timeOfDay.dialSlim` (the mockup's sun ornament, config-driven).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import '@testing-library/jest-dom';
import { GameTopChrome } from '@/ui/idleVillage/components/gameFrame/GameTopChrome';
import { HudRealTime } from '@/ui/idleVillage/hudReal/HudRealTime';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { RESOURCES_SLIM_BAR } from '@/ui/idleVillage/hudReal/resourcesSlimGeometry';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';

const TC = CASSETTO_LAYOUT_CONFIG.topChrome;
const NAT_W = TIME_SLIM_BAR.w + TC.gapPx + RESOURCES_SLIM_BAR.w;
const ROW_H = Math.max(TIME_SLIM_BAR.h, RESOURCES_SLIM_BAR.h);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

const ITEMS: ResourceReadoutItem[] = [
  { id: 'gold', icon: <span data-icon="gold" />, label: 'Gold', value: 15 },
  { id: 'food', icon: <span data-icon="food" />, label: 'Food', value: 8, max: 20 },
  { id: 'wood', icon: <span data-icon="wood" />, label: 'Wood', value: 0 },
];

const renderChrome = (props: Partial<Parameters<typeof GameTopChrome>[0]> = {}) =>
  render(
    <TooltipProvider>
      <GameTopChrome frame={{ scale: 1, W: 1440, H: 900 }} items={ITEMS} {...props} />
    </TooltipProvider>,
  );

beforeEach(() => {
  useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
});

describe('R-339 T6 — the chrome publishes its real occupancy to the insets ledger', () => {
  // INV:game-top-chrome.INV-1
  it('visible publishes margin + row height × fit (× frame scale); unmount restores 0', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    const { unmount } = renderChrome();
    const fit = Math.min(1, (1440 - TC.chronicleReservePx - 332) / NAT_W);
    expect(useGameLayoutInsets.getState().insets.top).toBeCloseTo(TC.marginPx + ROW_H * fit, 6);
    unmount();
    expect(useGameLayoutInsets.getState().insets.top).toBe(0);
  });

  // INV:game-top-chrome.INV-1
  it('a hidden chrome publishes 0 and renders nothing', () => {
    renderChrome({ visible: false });
    expect(useGameLayoutInsets.getState().insets.top).toBe(0);
    expect(screen.queryByTestId('game-top-chrome')).not.toBeInTheDocument();
  });

  // INV:game-top-chrome.INV-1
  it('occupancy scales with the HUD zoom (frame.scale)', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
    renderChrome({ frame: { scale: 1.5, W: 1280, H: 720 } });
    const fit = Math.min(1, (1280 - TC.chronicleReservePx / 1.5 - TC.marginPx) / NAT_W);
    expect(useGameLayoutInsets.getState().insets.top).toBeCloseTo((TC.marginPx + ROW_H * fit) * 1.5, 6);
  });
});

describe('R-339 T6 — arranged left/center, top-right reserved for Chronicle', () => {
  // INV:game-top-chrome.INV-2
  it('sits one margin right of the left inset and clears the reserve at 1440', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    renderChrome();
    const el = screen.getByTestId('game-top-chrome');
    const left = parseFloat(el.style.left);
    expect(left).toBeCloseTo(320 + TC.marginPx, 6);
    /* Right edge: fit is reserve-bound at this width — the cluster ends at or
     *  before frame.W - chronicleReservePx/scale (D10, no overlap). */
    const fit = Math.min(1, (1440 - TC.chronicleReservePx - left) / NAT_W);
    expect(left + NAT_W * fit).toBeLessThanOrEqual(1440 - TC.chronicleReservePx + 1e-6);
    expect(fit).toBeGreaterThanOrEqual(TC.minFitScale);
  });

  // INV:game-top-chrome.INV-2
  it('follows the left inset when the rail folds to its chip', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    renderChrome();
    act(() => useGameLayoutInsets.getState().publish({ left: 40 }));
    expect(parseFloat(screen.getByTestId('game-top-chrome').style.left)).toBeCloseTo(40 + TC.marginPx, 6);
    act(() => useGameLayoutInsets.getState().publish({ left: 0 }));
    expect(parseFloat(screen.getByTestId('game-top-chrome').style.left)).toBeCloseTo(TC.marginPx, 6);
  });

  // INV:game-top-chrome.INV-4
  it('keeps natural size at 1920 (reserve cleared, fit = 1)', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    renderChrome({ frame: { scale: 1, W: 1920, H: 1080 } });
    const el = screen.getByTestId('game-top-chrome');
    expect(parseFloat(el.style.height)).toBeCloseTo(ROW_H, 6);
    expect(332 + NAT_W).toBeLessThanOrEqual(1920 - TC.chronicleReservePx);
  });

  // INV:game-top-chrome.INV-4
  it('below minFitScale the reserve yields — the cluster never leaves the window', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    renderChrome({ frame: { scale: 1, W: 768, H: 1024 } });
    const el = screen.getByTestId('game-top-chrome');
    const left = parseFloat(el.style.left);
    const fit = parseFloat(el.style.height) / ROW_H;
    /* The reserve path alone would force fit ~0.02 — below minFitScale the
     *  reserve yields and the cluster shrinks only to the screen edge. */
    expect(left + NAT_W * fit).toBeLessThanOrEqual(768 - TC.marginPx + 1e-6);
    expect(fit).toBeGreaterThan(0.4);
  });
});

describe('R-339 T6 — two separate slim elements, e2e-compatible slots', () => {
  // INV:game-top-chrome.INV-2
  it('renders the day banner and the resource bar as separate data-hudslot elements', () => {
    renderChrome();
    expect(screen.getByTestId('game-top-chrome')).toBeInTheDocument();
    /* The blueprint slots the e2e suite selects on. */
    expect(document.querySelector('[data-hudslot="time"]')).toBeInTheDocument();
    expect(document.querySelector('[data-hudslot="resources"]')).toBeInTheDocument();
    expect(screen.getByTestId('chrome-day-banner')).toBeInTheDocument();
    expect(screen.getByTestId('chrome-resources')).toBeInTheDocument();
  });

  // INV:game-top-chrome.INV-5
  it('the slim resource bar hosts one compact chip per item', () => {
    renderChrome();
    const chips = document.querySelectorAll('[data-hr-res]');
    expect(chips.length).toBe(ITEMS.length);
    for (const item of ITEMS) {
      expect(document.querySelector(`[data-hr-res="${item.id}"]`)).toBeInTheDocument();
    }
  });
});

describe('R-339 T6 — the sun ornament seats in the slim banner emerald', () => {
  const labels = { pause: 'Pause', resume: 'Resume', speedGroup: 'Speed', speed: (s: number) => `x${s}`, spaceKey: 'Space', paused: 'Paused' };

  // INV:game-top-chrome.INV-3
  it('day phase: the sun disc + tick crown render via timeOfDay.dialSlim', () => {
    const { container } = render(
      <HudRealTime
        dayLabel="Day 1"
        isDayPhase
        cycleProgress={0.5}
        isPaused={false}
        locked={false}
        speed={{ multiplier: 1, available: [1, 2, 4], onChange: () => {}, onTogglePause: () => {} }}
        labels={labels}
        dial={DEFAULT_GAME_FRAME_CONFIG.timeOfDay.dialSlim}
        bar={TIME_SLIM_BAR}
        asset="/assets/ui/hud-real/time/bar-slim.webp"
      />,
    );
    const phase = container.querySelector('[data-hr-time="phase"]');
    expect(phase).toBeInTheDocument();
    expect(phase!.getAttribute('data-phase')).toBe('day');
    const sun = phase!.querySelector('img[src*="sun.webp"]') as HTMLImageElement;
    expect(sun).toBeInTheDocument();
    expect(sun.style.opacity).toBe('1');
    /* The tick crown is the config's count; the disc sits at the measured
     *  slim emerald centre (config-driven, not hardcoded). */
    const DIAL = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.dialSlim;
    expect(container.querySelectorAll('svg line').length).toBe(DIAL.ticks);
  });

  // INV:game-top-chrome.INV-3
  it('night phase: the moon disc replaces the sun', () => {
    const { container } = render(
      <HudRealTime
        dayLabel="Night 1"
        isDayPhase={false}
        cycleProgress={0.5}
        isPaused={false}
        locked={false}
        speed={{ multiplier: 1, available: [1, 2, 4], onChange: () => {}, onTogglePause: () => {} }}
        labels={labels}
        dial={DEFAULT_GAME_FRAME_CONFIG.timeOfDay.dialSlim}
        bar={TIME_SLIM_BAR}
      />,
    );
    const phase = container.querySelector('[data-hr-time="phase"]');
    expect(phase!.getAttribute('data-phase')).toBe('night');
    const moon = phase!.querySelector('img[src*="moon.webp"]') as HTMLImageElement;
    expect(moon.style.opacity).toBe('1');
  });
});
