import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRef } from 'react';
import {
  heroSheetReducer,
  HERO_SHEET_INITIAL_STATE,
  type HeroSheetOpenState,
  type HeroSheetState,
} from '@/ui/idleVillage/components/gameFrame/heroSheetMachine';
import { useHeroSheet, type HeroSheetApi } from '@/ui/idleVillage/components/gameFrame/useHeroSheet';
import { useHudPanels } from '@/ui/idleVillage/components/gameFrame/useHudPanels';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const trackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: (...args: unknown[]) => trackTelemetryEvent(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/balancing/equipment/equipmentStorage', () => ({
  getAllEquipment: vi.fn().mockResolvedValue([]),
}));

const CONFIG = DEFAULT_GAME_FRAME_CONFIG.heroSheet;

/** A minimal ResidentState the view model accepts. */
const resident = (id: string, name: string): ResidentState =>
  ({
    id,
    displayName: name,
    status: 'active',
    currentHp: 40,
    maxHp: 40,
    fatigue: 20,
    isInjured: false,
    statSnapshot: { damage: 7, armor: 3 },
    statProfileId: 'vanguard',
  }) as unknown as ResidentState;

const RESIDENTS = { r1: resident('r1', 'Aldric'), r2: resident('r2', 'Brynn'), r3: resident('r3', 'Cedric') };

const open = (partial: Partial<HeroSheetOpenState> = {}): HeroSheetOpenState => ({
  status: 'open',
  targetId: 'r1',
  source: 'hover',
  pinned: false,
  pending: null,
  suspended: false,
  dismissedFor: null,
  lastViewedId: 'r1',
  ...partial,
});

describe('heroSheetMachine', () => {
  it('arms intent on card enter and suppresses it while dragging or dismissed', () => {
    const s1 = heroSheetReducer(HERO_SHEET_INITIAL_STATE, { type: 'cardEnter', id: 'r1', via: 'hover' });
    expect(s1).toMatchObject({ status: 'intending', targetId: 'r1' });

    const dragging = heroSheetReducer(HERO_SHEET_INITIAL_STATE, { type: 'dragStart' });
    expect(heroSheetReducer(dragging, { type: 'cardEnter', id: 'r1', via: 'hover' })).toMatchObject({ status: 'closed' });

    const dismissed: HeroSheetState = { ...HERO_SHEET_INITIAL_STATE, dismissedFor: 'r1' };
    expect(heroSheetReducer(dismissed, { type: 'cardEnter', id: 'r1', via: 'hover' })).toMatchObject({ status: 'closed' });
    // Another card still arms.
    expect(heroSheetReducer(dismissed, { type: 'cardEnter', id: 'r2', via: 'hover' })).toMatchObject({ status: 'intending', targetId: 'r2' });
  });

  it('drops the intent on card leave, pointerdown and target removal', () => {
    const intending = heroSheetReducer(HERO_SHEET_INITIAL_STATE, { type: 'cardEnter', id: 'r1', via: 'hover' });
    for (const event of [
      { type: 'cardLeave', id: 'r1', via: 'hover' } as const,
      { type: 'pointerDown' } as const,
      { type: 'targetRemoved', id: 'r1' } as const,
      { type: 'dragStart' } as const,
    ]) {
      expect(heroSheetReducer(intending, event)).toMatchObject({ status: 'closed' });
    }
  });

  it('opens with the right source on intentFired and sticky requests', () => {
    const intending = heroSheetReducer(HERO_SHEET_INITIAL_STATE, { type: 'cardEnter', id: 'r1', via: 'focus' });
    expect(heroSheetReducer(intending, { type: 'intentFired' })).toMatchObject({ status: 'open', source: 'focus' });
    expect(heroSheetReducer(HERO_SHEET_INITIAL_STATE, { type: 'openRequest', id: 'r2' })).toMatchObject({
      status: 'open',
      targetId: 'r2',
      source: 'sticky',
    });
  });

  it('dwell-gates retarget, cancels it on panel enter, honours pinned', () => {
    const s = heroSheetReducer(open(), { type: 'cardEnter', id: 'r2', via: 'hover' });
    expect(s).toMatchObject({ status: 'open', targetId: 'r1', pending: { kind: 'retarget', id: 'r2' } });
    expect(heroSheetReducer(s, { type: 'panelEnter' })).toMatchObject({ pending: null });

    const pinned = heroSheetReducer(open({ pinned: true }), { type: 'cardEnter', id: 'r2', via: 'hover' });
    expect(pinned).toMatchObject({ targetId: 'r1', pending: null, lastViewedId: 'r2' });

    const retargeted = heroSheetReducer(s, { type: 'retargetFired' });
    expect(retargeted).toMatchObject({ status: 'open', targetId: 'r2', pending: null, lastViewedId: 'r2' });
  });

  it('arms grace on card leave and panel leave, closes on graceFired', () => {
    const s = heroSheetReducer(open(), { type: 'cardLeave', id: 'r1', via: 'hover' });
    expect(s).toMatchObject({ pending: { kind: 'grace' } });
    // Re-entering the shown card cancels the grace.
    expect(heroSheetReducer(s, { type: 'cardEnter', id: 'r1', via: 'hover' })).toMatchObject({ pending: null });
    const gone = heroSheetReducer(s, { type: 'graceFired' });
    expect(gone).toMatchObject({ status: 'closed', lastCloseReason: 'grace' });

    const panelLeft = heroSheetReducer(open(), { type: 'panelLeave' });
    expect(panelLeft).toMatchObject({ pending: { kind: 'grace' } });
  });

  it('suppresses auto-open on the Esc-dismissed card until a clearing edge', () => {
    const closed = heroSheetReducer(open(), { type: 'closeRequest', reason: 'esc' });
    expect(closed).toMatchObject({ status: 'closed', dismissedFor: 'r1' });
    // The same card cannot re-arm while dismissed.
    expect(heroSheetReducer(closed, { type: 'cardEnter', id: 'r1', via: 'hover' })).toMatchObject({ status: 'closed' });
    // The clearing edge is its own pointerleave: enter, leave, enter again re-arms.
    const overDismissed = heroSheetReducer(closed, { type: 'cardEnter', id: 'r1', via: 'hover' });
    const cleared = heroSheetReducer(overDismissed, { type: 'cardLeave', id: 'r1', via: 'hover' });
    expect(cleared).toMatchObject({ dismissedFor: null });
    expect(heroSheetReducer(cleared, { type: 'cardEnter', id: 'r1', via: 'hover' })).toMatchObject({ status: 'intending' });
    // Sticky bypasses the latch unconditionally.
    expect(heroSheetReducer(closed, { type: 'openRequest', id: 'r1' })).toMatchObject({ status: 'open', source: 'sticky' });
  });

  it('suspends timers on dragStart and never opens mid-drag', () => {
    const suspended = heroSheetReducer(open({ pending: { kind: 'retarget', id: 'r2' } }), { type: 'dragStart' });
    expect(suspended).toMatchObject({ suspended: true, pending: null });
    // Card events are inert while suspended.
    expect(heroSheetReducer(suspended, { type: 'cardEnter', id: 'r2', via: 'hover' })).toMatchObject({ status: 'open', targetId: 'r1' });
    expect(heroSheetReducer(suspended, { type: 'dragEnd' })).toMatchObject({ suspended: false });
  });

  it('closes on target removal and on toggle/nav, honours pinned nav', () => {
    expect(heroSheetReducer(open(), { type: 'targetRemoved', id: 'r1' })).toMatchObject({ status: 'closed', lastCloseReason: 'target_removed' });
    expect(heroSheetReducer(open(), { type: 'toggleRequest', id: 'r1' })).toMatchObject({ status: 'closed', lastCloseReason: 'toggle' });
    expect(heroSheetReducer(open(), { type: 'nav', dir: 'next', id: 'r2' })).toMatchObject({ targetId: 'r2' });
    expect(heroSheetReducer(open({ pinned: true }), { type: 'nav', dir: 'next', id: 'r2' })).toMatchObject({ targetId: 'r1' });
  });

  it('reconciles only from open: never arms intent, can retarget or arm grace', () => {
    const reconcile = (over: Partial<Extract<Parameters<typeof heroSheetReducer>[1], { type: 'reconcile' }>> = {}) => ({
      type: 'reconcile' as const,
      id: null,
      onPanel: false,
      targetPresent: true,
      dismissedGone: false,
      pointerKnown: true,
      ...over,
    });
    expect(heroSheetReducer(HERO_SHEET_INITIAL_STATE, reconcile({ id: 'r2' }))).toMatchObject({ status: 'closed' });

    const retarget = heroSheetReducer(open(), reconcile({ id: 'r2' }));
    expect(retarget).toMatchObject({ pending: { kind: 'retarget', id: 'r2' } });

    const gone = heroSheetReducer(open(), reconcile());
    expect(gone).toMatchObject({ pending: { kind: 'grace' } });

    const removed = heroSheetReducer(open(), reconcile({ targetPresent: false }));
    expect(removed).toMatchObject({ status: 'closed', lastCloseReason: 'target_removed' });

    const onPanel = heroSheetReducer(open({ pending: { kind: 'grace' } }), reconcile({ onPanel: true }));
    expect(onPanel).toMatchObject({ pending: null });

    // Pointer position unknown (jsdom / before the first pointermove): existence
    // checks only — never arms grace, never retargets.
    const unknown = heroSheetReducer(open(), reconcile({ id: null, pointerKnown: false }));
    expect(unknown).toMatchObject({ status: 'open', pending: null });
    const unknownRemoved = heroSheetReducer(open(), reconcile({ targetPresent: false, pointerKnown: false }));
    expect(unknownRemoved).toMatchObject({ status: 'closed', lastCloseReason: 'target_removed' });
  });
});

/** Page-like harness: rail + api, no GameFrame — the delegation boundary is what matters. */
function Harness({ dragActive = false, apiRef }: { dragActive?: boolean; apiRef: { current: HeroSheetApi | null } }) {
  const apiInner = useRef<HeroSheetApi | null>(null);
  const panels = useHudPanels({
    interceptToggle: (id) => {
      if (id !== 'heroSheet') return false;
      apiInner.current?.toggle();
      return true;
    },
  });
  const heroSheet = useHeroSheet({
    config: CONFIG,
    residentsById: RESIDENTS,
    panels,
    dragActive,
    questBounds: null,
    zIndex: 12,
  });
  apiInner.current = heroSheet;
  apiRef.current = heroSheet;
  return (
    <>
      <div ref={heroSheet.railRef} {...heroSheet.railProps} data-testid="rail">
        <div data-resident-id="r1" tabIndex={0}>
          <button type="button">card one</button>
        </div>
        <div data-resident-id="r2" tabIndex={0}>
          <button type="button">card two</button>
        </div>
      </div>
      {heroSheet.panelNode}
      <span data-testid="flag">{String(panels.visible.heroSheet)}</span>
    </>
  );
}

const SHEET = 'Aldric';

describe('useHeroSheet (delegated rail)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    trackTelemetryEvent.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = async () => {
    const apiRef = { current: null as HeroSheetApi | null };
    render(<Harness apiRef={apiRef} />);
    // Flush the equipment-map promise (mocked getAllEquipment) inside act.
    await act(async () => undefined);
    return apiRef;
  };

  it('opens after the hover intent, anchored, and mirrors the registry flag', async () => {
    await setup();
    const card = screen.getByText('card one').closest('[data-resident-id]')!;
    fireEvent.pointerOver(card.querySelector('button')!);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs));
    expect(screen.getByRole('region', { name: SHEET })).toBeInTheDocument();
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
    expect(trackTelemetryEvent).toHaveBeenCalledWith('hero_sheet_open', { source: 'hover', pinned: false });
  });

  it('does not open on a passing hover, and pointerdown cancels a pending intent', async () => {
    await setup();
    const card = screen.getByText('card one').closest('[data-resident-id]')!;
    fireEvent.pointerOver(card);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs - 1));
    fireEvent.pointerOut(card, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs + 50));
    expect(screen.queryByRole('region', { name: SHEET })).not.toBeInTheDocument();

    fireEvent.pointerOver(card);
    fireEvent.pointerDown(card);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs + 50));
    expect(screen.queryByRole('region', { name: SHEET })).not.toBeInTheDocument();
  });

  it('filters relatedTarget containment: moving within a card is a no-op', async () => {
    await setup();
    const card = screen.getByText('card one').closest('[data-resident-id]')!;
    fireEvent.pointerOver(card);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs));
    const region = screen.getByRole('region', { name: SHEET });
    /* jsdom does not carry relatedTarget on its synthetic pointer events — a
     * MouseEvent does, and React reads it off the native event the same way it
     * reads a real PointerEvent's. pointerout to a child inside the same card
     * is filtered: the sheet stays. */
    const innerOut = new MouseEvent('pointerout', { bubbles: true, relatedTarget: card.querySelector('button') });
    fireEvent(card, innerOut);
    act(() => vi.advanceTimersByTime(CONFIG.graceMs + 50));
    expect(region).toBeInTheDocument();
    // Leaving for real (to the document body) still arms grace.
    const realOut = new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body });
    fireEvent(card, realOut);
    act(() => vi.advanceTimersByTime(CONFIG.graceMs + 50));
    expect(region).not.toBeInTheDocument();
  });

  it('retargets on dwell over another card and closes through grace', async () => {
    await setup();
    const c1 = screen.getByText('card one').closest('[data-resident-id]')!;
    const c2 = screen.getByText('card two').closest('[data-resident-id]')!;
    fireEvent.pointerOver(c1);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs));
    fireEvent.pointerOver(c2, { relatedTarget: c1 });
    act(() => vi.advanceTimersByTime(CONFIG.retargetDwellMs));
    expect(screen.getByRole('region', { name: 'Brynn' })).toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('hero_sheet_retarget', { from: 'r1', to: 'r2' });

    fireEvent.pointerOut(c2, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(CONFIG.graceMs + 1));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('hero_sheet_close', { reason: 'grace' });
  });

  it('sticky open bypasses dismissedFor and Esc suppresses the dismissed card', async () => {
    const api = await setup();
    act(() => api.current!.open('r1'));
    expect(screen.getByRole('region', { name: SHEET })).toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('hero_sheet_open', { source: 'sticky', pinned: false });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('hero_sheet_close', { reason: 'esc' });
    expect(screen.getByTestId('flag')).toHaveTextContent('false');

    // Dismissed: hover intent on that card is suppressed.
    const card = screen.getByText('card one').closest('[data-resident-id]')!;
    fireEvent.pointerOver(card);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs + 50));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    // Sticky still bypasses the latch.
    act(() => api.current!.open('r1'));
    expect(screen.getByRole('region', { name: SHEET })).toBeInTheDocument();
  });

  it('toggle routes through the machine and mirrors the flag both ways', async () => {
    const api = await setup();
    act(() => api.current!.toggle());
    expect(screen.getByRole('region', { name: SHEET })).toBeInTheDocument();
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
    act(() => api.current!.toggle());
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
  });

  it('pin toggle marks aria-pressed and disables the chevrons', async () => {
    const api = await setup();
    act(() => api.current!.open('r1'));
    fireEvent.click(screen.getByRole('button', { name: 'gameFrame.heroSheet.pin' }));
    const unpin = screen.getByRole('button', { name: 'gameFrame.heroSheet.unpin' });
    expect(unpin).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'gameFrame.heroSheet.next' })).toBeDisabled();
  });

  it('does not open while a resident drag is active', async () => {
    const apiRef = { current: null as HeroSheetApi | null };
    render(<Harness apiRef={apiRef} dragActive />);
    await act(async () => undefined);
    const card = screen.getByText('card one').closest('[data-resident-id]')!;
    fireEvent.pointerOver(card);
    act(() => vi.advanceTimersByTime(CONFIG.hoverIntentMs + 50));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
