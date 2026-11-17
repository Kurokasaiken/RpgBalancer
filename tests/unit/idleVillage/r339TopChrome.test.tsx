/**
 * R-339 / PLAN-119 T6 (2026-11-15) — the slim docked top chrome of /game.
 *
 * Artifact-r004 D3 + Director ruling D10 + R-350 (Director 2026-11-15) +
 * R-352 (Director 2026-11-16, «distanza tempo↔bordo sinistro»): the
 * resource bar is centred on the frame's absolute horizontal centre; the
 * day banner docks at `topChrome.bannerMarginPx` — decoupled, breathing
 * at the left edge — never inside the bound one margin right of
 * `insets.left`; the top-right zone is reserved for the future docked
 * Chronicle surface (layout token, no hanging tab). These tests pin the
 * contract (`game-top-chrome`):
 *   the chrome publishes its real occupancy to `useGameLayoutInsets.top`;
 *   the bar centres on frame.W/2; the banner sits at `bannerDock =
 *   max(bannerMarginPx, leftBound)` with at least `gapPx` before the bar;
 *   one shared fit keeps banner right + gapPx at or left of the bar's
 *   left edge and the bar's right edge out of the Chronicle reserve
 *   while it can stay at or above `minFitScale` (the reserve yields
 *   below that — the left bound and the screen edge are the hard
 *   bounds);
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
/* R-352: the resource bar renders at RES_K so its capsule band matches the
 *  banner's (`topChrome.capsulePx`, measured on the signed art). */
const RES_K = TC.capsulePx.time / TC.capsulePx.resources;
/* The cap seats are symmetric: art+slots shift LEFT so slot 0's glass
 *  starts exactly where the mirrored seat ends (`seatPx`, matched to the
 *  right cap's ornament) — `RES_SHIFT` is negative, the medallion is
 *  cut by the inner clip. */
const RES_SHIFT = TC.resCapMirror.seatPx - RESOURCES_SLIM_BAR.slots[0].x;
const RES_W = (RESOURCES_SLIM_BAR.w + RES_SHIFT) * RES_K;
const RES_H = RESOURCES_SLIM_BAR.h * RES_K;
const ROW_H = Math.max(TIME_SLIM_BAR.h, RES_H);

/* The component's fit math, mirrored: the banner docks at
 * `bannerDock = max(bannerMarginPx, leftBound)`; shared fit ≤ 1 bounded
 * by banner right + gapPx ≤ bar left (`fit ≤ overlapFit`) and (soft) the
 * Chronicle reserve; below `minFitScale` the reserve yields to the
 * screen edge. */
const bannerDock = (leftBound: number) => Math.max(TC.bannerMarginPx, leftBound);
const overlapFit = (W: number, leftBound: number) =>
  (W - 2 * (bannerDock(leftBound) + TC.gapPx)) / (2 * TIME_SLIM_BAR.w + RES_W);
const reserveFit = (W: number, scale = 1) => (W - (2 * TC.chronicleReservePx) / scale) / RES_W;
const screenFit = (W: number) => (W - 2 * TC.marginPx) / RES_W;
const fitFor = (W: number, leftBound: number, scale = 1) => {
  const reserved = Math.min(1, overlapFit(W, leftBound), reserveFit(W, scale));
  return reserved >= TC.minFitScale
    ? reserved
    : Math.max(0, Math.min(1, overlapFit(W, leftBound), screenFit(W)));
};

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
    const fit = fitFor(1440, 332);
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
    const fit = fitFor(1280, TC.marginPx, 1.5);
    expect(useGameLayoutInsets.getState().insets.top).toBeCloseTo((TC.marginPx + ROW_H * fit) * 1.5, 6);
  });
});

describe('R-339/R-350/R-352 — centred bar, banner docked at bannerMarginPx', () => {
  // INV:game-top-chrome.INV-2
  it('the banner docks at bannerMarginPx; the bar centres and clears the reserve at 1440', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
    renderChrome();
    /* fit = 1 at 1440 with no left dock: the bar sits exactly on the
     *  frame centre; the banner breathes at its own left dock. */
    const fit = 1;
    const resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    const bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    expect(resLeft + (RES_W * fit) / 2).toBeCloseTo(1440 / 2, 6);
    expect(bannerLeft).toBeCloseTo(TC.bannerMarginPx, 6);
    /* Decoupled — but never overlapping: at least gapPx to the bar. */
    expect(bannerLeft + TIME_SLIM_BAR.w * fit + TC.gapPx).toBeLessThanOrEqual(resLeft + 1e-6);
    /* The bar's right edge clears the Chronicle reserve (D10). */
    expect(resLeft + RES_W * fit).toBeLessThanOrEqual(1440 - TC.chronicleReservePx + 1e-6);
  });

  // INV:game-top-chrome.INV-2
  it('a left dock pushes the banner to the bound while the bar stays centred', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
    renderChrome();
    /* A left dock pushes the bound right: the banner slides to it, the
     *  shared fit shrinks until banner right + gapPx = bar left. */
    act(() => useGameLayoutInsets.getState().publish({ left: 400 }));
    const bound = 400 + TC.marginPx;
    let fit = fitFor(1440, bound);
    let resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    let bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    expect(bannerLeft).toBeCloseTo(bound, 6);
    expect(bannerLeft + TIME_SLIM_BAR.w * fit + TC.gapPx).toBeCloseTo(resLeft, 6);
    expect(resLeft + (RES_W * fit) / 2).toBeCloseTo(1440 / 2, 6);
    /* Bound released: the banner returns to its margin dock. */
    act(() => useGameLayoutInsets.getState().publish({ left: 0 }));
    resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    expect(resLeft + RES_W / 2).toBeCloseTo(1440 / 2, 6);
    expect(bannerLeft).toBeCloseTo(TC.bannerMarginPx, 6);
    fit = fitFor(1440, TC.marginPx);
    expect(fit).toBe(1);
  });

  // INV:game-top-chrome.INV-4
  it('keeps natural size at 1920 (reserve and bound cleared, fit = 1)', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 320 } });
    renderChrome({ frame: { scale: 1, W: 1920, H: 1080 } });
    const el = screen.getByTestId('game-top-chrome');
    expect(parseFloat(el.style.height)).toBeCloseTo(ROW_H, 6);
    const resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    const bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    expect(resLeft + RES_W / 2).toBeCloseTo(1920 / 2, 6);
    /* A left inset pushes the banner's dock to the bound, still centred bar. */
    expect(bannerLeft).toBeCloseTo(bannerDock(320 + TC.marginPx), 6);
    expect(bannerLeft + TIME_SLIM_BAR.w + TC.gapPx).toBeLessThanOrEqual(resLeft + 1e-6);
    expect(resLeft + RES_W).toBeLessThanOrEqual(1920 - TC.chronicleReservePx + 1e-6);
  });

  // INV:game-top-chrome.INV-4
  it('below minFitScale the reserve yields — centred, docked, never off-screen', () => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
    renderChrome({ frame: { scale: 1, W: 800, H: 600 } });
    const bound = TC.marginPx;
    const fit = parseFloat(screen.getByTestId('game-top-chrome').style.height) / ROW_H;
    const resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    const bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    /* The reserve path alone would force a tiny fit — below minFitScale
     *  the reserve yields; the banner dock keeps banner right + gapPx =
     *  bar left as the binding bound. */
    expect(fit).toBeCloseTo(overlapFit(800, bound), 6);
    expect(fit).toBeLessThan(1);
    expect(resLeft + (RES_W * fit) / 2).toBeCloseTo(800 / 2, 6);
    expect(bannerLeft + TIME_SLIM_BAR.w * fit + TC.gapPx).toBeCloseTo(resLeft, 6);
    expect(bannerLeft).toBeCloseTo(bannerDock(bound), 6);
    expect(resLeft + RES_W * fit).toBeLessThanOrEqual(800 - TC.marginPx + 1e-6);
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

describe('R-352 — the resource bar is specular end-to-end and capsule-matched', () => {
  // INV:game-top-chrome.INV-6
  it('the left cap is ONE flipped slice — the cap-mirror lab pick, clipped to the symmetric seat', () => {
    renderChrome();
    const mirror = screen.getByTestId('chrome-res-cap-mirror');
    expect(mirror).toBeInTheDocument();
    const cap = TC.resCapMirror;
    /* The clip shows only `seatPx` — the ornament end of the pick, so the
     *  left seat equals the right cap's. One piece, not a composite. */
    expect(parseFloat(mirror.style.left)).toBeCloseTo(0, 6);
    expect(parseFloat(mirror.style.top)).toBeCloseTo(cap.destY, 6);
    expect(parseFloat(mirror.style.width)).toBeCloseTo(cap.seatPx, 6);
    expect(parseFloat(mirror.style.height)).toBeCloseTo(cap.h, 6);
    const imgs = mirror.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute('src')).toBe('/assets/ui/hud-real/resources/bar-slim.webp');
    expect(imgs[0].style.transform).toContain('scaleX(-1)');
    /* The img must keep the full bar width inside the clip — without
     *  `maxWidth: 'none'` the global img preflight squeezes it to the clip
     *  and the whole bar renders compressed into the cap. */
    expect(imgs[0].style.maxWidth).toBe('none');
    expect(parseFloat(imgs[0].style.width)).toBeCloseTo(RESOURCES_SLIM_BAR.w, 6);
    /* Offset pins the flip: clip column 0 shows source column srcX+w (the
     *  bar's right edge) — `srcX + w - barW`. */
    expect(parseFloat(imgs[0].style.left)).toBeCloseTo(cap.srcX + cap.w - RESOURCES_SLIM_BAR.w, 6);
    expect(parseFloat(imgs[0].style.top)).toBeCloseTo(-cap.srcY, 6);
  });

  // INV:game-top-chrome.INV-6
  it('the cap seats are symmetric — art slides left, medallion cut by the inner clip', () => {
    renderChrome();
    const slot = screen.getByTestId('chrome-resources');
    const inner = slot.firstElementChild as HTMLElement;
    /* The inner clips the art's left bleed (medallion under the seat). */
    expect(inner.style.overflow).toBe('hidden');
    /* Slot 0's glass starts exactly where the seat ends. */
    const wrapper = inner.querySelector('[data-hudreal-resources]')!.parentElement as HTMLElement;
    expect(parseFloat(wrapper.style.left)).toBeCloseTo(RES_SHIFT, 6);
    expect(RES_SHIFT + RESOURCES_SLIM_BAR.slots[0].x).toBeCloseTo(TC.resCapMirror.seatPx, 6);
    /* The bar art's right edge lands on the inner's right edge. */
    expect(RES_SHIFT + RESOURCES_SLIM_BAR.w).toBeCloseTo(RES_W / RES_K, 6);
  });

  // INV:game-top-chrome.INV-6
  it('the bar renders at RES_K so its capsule band matches the banner', () => {
    renderChrome();
    const slot = screen.getByTestId('chrome-resources');
    /* fit = 1 at 1440: the slot is exactly the scaled bar. */
    expect(parseFloat(slot.style.height)).toBeCloseTo(RES_H, 6);
    expect(parseFloat(slot.style.width)).toBeCloseTo(RES_W, 6);
    /* The inner unscaled bar is reduced by fit × RES_K. */
    const inner = slot.firstElementChild as HTMLElement;
    expect(inner.style.transform).toBe(`scale(${RES_K})`);
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
