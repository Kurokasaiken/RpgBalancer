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
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import '@testing-library/jest-dom';
import { GameTopChrome } from '@/ui/idleVillage/components/gameFrame/GameTopChrome';
import { HudRealTime } from '@/ui/idleVillage/hudReal/HudRealTime';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { RESOURCES_SLIM_BAR } from '@/ui/idleVillage/hudReal/resourcesSlimGeometry';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { EVENTS_BAR_CONFIG } from '@/balancing/config/idleVillage/eventsBarConfig';
import { HudRealEventsBar } from '@/ui/idleVillage/hudReal/HudRealEventsBar';
import { selectEventsBarEvent } from '@/ui/idleVillage/components/gameFrame/eventsBarModel';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';

const TC = CASSETTO_LAYOUT_CONFIG.topChrome;
/* R-352: the resource bar renders at RES_K so its capsule band matches the
 *  banner's (`topChrome.capsulePx`, measured on the signed art). R-376-bis:
 *  `resourcesBoost` enlarges the bar in proportion to the banner. */
const RES_K = (TC.capsulePx.time / TC.capsulePx.resources) * TC.resourcesBoost;
/* R-376: the pointed-cap art is natively specular — the bar mounts at its
 *  own size, no cap-mirror slice, no shift, no clip. */
const RES_W = RESOURCES_SLIM_BAR.w * RES_K;
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
    /* R-376-bis: with the boosted bar the cleared-bound premise needs a
     *  smaller inset — at 320 the banner's bound would collide with the
     *  bar's left edge at 1920 and fit would shrink (by design). */
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 240 } });
    renderChrome({ frame: { scale: 1, W: 1920, H: 1080 } });
    const el = screen.getByTestId('game-top-chrome');
    expect(parseFloat(el.style.height)).toBeCloseTo(ROW_H, 6);
    const resLeft = parseFloat(screen.getByTestId('chrome-resources').style.left);
    const bannerLeft = parseFloat(screen.getByTestId('chrome-day-banner').style.left);
    expect(resLeft + RES_W / 2).toBeCloseTo(1920 / 2, 6);
    /* A left inset pushes the banner's dock to the bound, still centred bar. */
    expect(bannerLeft).toBeCloseTo(bannerDock(240 + TC.marginPx), 6);
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

describe('R-376 — the resource bar is natively specular end-to-end and capsule-matched', () => {
  // INV:game-top-chrome.INV-6
  it('mounts the signed art with no cap mirror, no shift, no clip — the retired R-352 hack', () => {
    renderChrome();
    /* The pointed-cap art is specular by construction: the flipped-slice
     *  overlay (`resCapMirror`) is gone for good, and so is its config. */
    expect(screen.queryByTestId('chrome-res-cap-mirror')).not.toBeInTheDocument();
    expect('resCapMirror' in TC).toBe(false);
    const slot = screen.getByTestId('chrome-resources');
    const inner = slot.firstElementChild as HTMLElement;
    /* No clip, no art shift: the section sits at the inner's origin. */
    expect(inner.style.overflow).not.toBe('hidden');
    const section = inner.querySelector('[data-hudreal-resources]') as HTMLElement;
    expect(section).toBeInTheDocument();
    expect(parseFloat(section.style.left ?? '0') || 0).toBeCloseTo(0, 6);
    /* The bar fills the slot at its own size scaled by RES_K. */
    expect(parseFloat(slot.style.width)).toBeCloseTo(RES_W, 6);
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


describe('R-386 — the Events bar docks in the top-right reserve, specular to Time', () => {
  const EVENTS: HudEvent[] = [
    { id: 'quest-open', typeId: 'quest', title: 'Quest aperta', daysLeft: 1 },
    { id: 'invasion', typeId: 'threat', title: 'Invasione goblin', daysLeft: 5 },
  ];

  // INV:game-top-chrome.INV-8
  it('renders inside the Chronicle reserve with its right edge at the chrome margin', () => {
    renderChrome({ events: EVENTS });
    const slot = screen.getByTestId('chrome-events');
    const left = parseFloat(slot.style.left);
    const width = parseFloat(slot.style.width);
    expect(left + width).toBeCloseTo(1440 - TC.marginPx, 6);
    expect(width).toBeCloseTo(TC.chronicleReservePx - TC.marginPx, 6);
    const res = screen.getByTestId('chrome-resources');
    const resRight = parseFloat(res.style.left) + parseFloat(res.style.width);
    expect(resRight).toBeLessThanOrEqual(left + 1e-6);
    expect(document.querySelector('[data-hudslot="events"]')).toBeInTheDocument();
  });

  // INV:game-top-chrome.INV-8
  it('hides rather than overlapping the centred chrome when the reserve yields', () => {
    renderChrome({ frame: { scale: 1, W: 800, H: 600 }, events: EVENTS });
    expect(screen.queryByTestId('chrome-events')).not.toBeInTheDocument();
  });

  // INV:game-top-chrome.INV-9
  it('clicking the bar toggles the Events panel contract', () => {
    const onToggleEvents = vi.fn();
    renderChrome({ events: EVENTS, eventsOpen: true, onToggleEvents });
    fireEvent.click(screen.getByTestId('chrome-events').querySelector('button')!);
    expect(onToggleEvents).toHaveBeenCalledTimes(1);
  });
});

describe('R-386 — collapsed event selection and gem semantics', () => {
  const quest: HudEvent = { id: 'quest-open', typeId: 'quest', title: 'Quest aperta', daysLeft: 1 };
  const threat: HudEvent = { id: 'invasion', typeId: 'threat', title: 'Invasione goblin', daysLeft: 5 };

  // INV:game-top-chrome.INV-9
  it('a pinned threat outranks a nearer non-threat in the collapsed bar', () => {
    expect(selectEventsBarEvent([quest, threat], DEFAULT_GAME_FRAME_CONFIG.eventLedger.pinTypesWhenCollapsed)?.id).toBe('invasion');
  });

  // INV:game-top-chrome.INV-9
  it('without a pinned threat the nearest deadline wins and arriving rows are ignored', () => {
    expect(selectEventsBarEvent([quest, { ...threat, typeId: 'visit', daysLeft: 0, arriving: true }], DEFAULT_GAME_FRAME_CONFIG.eventLedger.pinTypesWhenCollapsed)?.id).toBe('quest-open');
  });

  // INV:game-top-chrome.INV-10
  it('danger keeps the native red gem; other tones recolour a circular copy of it', () => {
    const { rerender } = render(<HudRealEventsBar events={[threat]} />);
    const bar = document.querySelector('[data-hudreal-events-bar]') as HTMLElement;
    expect(bar.dataset.gemTone).toBe('danger');
    expect(document.querySelector('[data-events-gem-filter]')).not.toBeInTheDocument();

    rerender(<HudRealEventsBar events={[quest]} />);
    expect(bar.dataset.gemTone).toBe('warning');
    const gem = document.querySelector('[data-events-gem-filter]') as HTMLImageElement;
    expect(gem).toBeInTheDocument();
    expect(gem.style.clipPath).toContain(`circle(${EVENTS_BAR_CONFIG.gem.r}px`);
    expect(gem.style.filter).toBe(EVENTS_BAR_CONFIG.gemFilters.warning);
  });

  // INV:game-top-chrome.INV-10
  it('the medallion keeps a type glyph so the sign is never colour-only', () => {
    render(<HudRealEventsBar events={[threat]} />);
    const glyph = document.querySelector('[data-hudreal-events-bar] [role="img"]');
    expect(glyph).toBeInTheDocument();
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
