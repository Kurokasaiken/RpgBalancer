/**
 * R-339 / PLAN-119 T8 (2026-11-15) — the `ExpeditionBottomSheet` primitive.
 *
 * At or below `bottomSheet.maxWidthPx` (1100, boundary inclusive) the
 * expedition surface exists ONLY as this non-modal bottom sheet — the
 * docked column, its chips and the right-edge tab never mount (AC10,
 * mutual exclusion of the lateral surfaces). These tests pin the
 * `expedition-bottom-sheet` contract (D5/AC9-AC10):
 *   non-modal shell (wrapper pointer-events:none, sheet auto, no scrim,
 *   no focus trap) · the three token detents peek/half/full with
 *   safe-area on peek · drag ONLY on the 44px handle strip · the six
 *   mockup blocks and their testids preserved · honest occupancy in
 *   `insets.bottom` (`insets.right` stays 0 in this band) · ≥44px
 *   targets and ≥`minTextPx` text · the drawer-side delegation that
 *   makes the exclusion real.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import '@testing-library/jest-dom';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import {
  ExpeditionBottomSheet,
  useExpeditionSheetMode,
} from '@/ui/idleVillage/components/gameFrame/ExpeditionBottomSheet';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import { useExpeditionSheet } from '@/ui/idleVillage/store/useExpeditionSheet';
import { useExpeditionDrawer } from '@/ui/idleVillage/store/useExpeditionDrawer';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { renderHook } from '@testing-library/react';

const SHEET = CASSETTO_LAYOUT_CONFIG.bottomSheet;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: (props: { onSlotClick?: (id: string) => void; slotSize?: number }) => (
    <button
      data-testid="resident-slot-rack-stub"
      data-slot-size={props.slotSize}
      onClick={() => props.onSlotClick?.('slot-leader')}
    />
  ),
}));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  subtitle: 'Plan the expedition',
  briefing: 'briefing',
  legs: [
    { label: 'Outbound', days: 3 },
    { label: 'At site', days: 2 },
    { label: 'Return', days: 3 },
  ],
  totalDays: 8,
  riskLabel: 'High',
  rewards: [{ icon: 'gold', qty: '60' }],
};

const LOADOUT = {
  slots: [
    { id: 'rope', icon: 'ico-pouch', label: 'Rope', qty: 2 },
    null,
  ],
  onReleaseItem: () => {},
  onOpenStash: () => {},
};

const renderSheet = (props: Partial<Parameters<typeof ExpeditionBottomSheet>[0]> = {}) =>
  render(
    <DndContext>
      <DragProvider>
        <TooltipProvider>
          <ExpeditionBottomSheet quest={QUEST} slots={[]} loadout={LOADOUT} {...props} />
        </TooltipProvider>
      </DragProvider>
    </DndContext>,
  );

beforeEach(() => {
  useExpeditionSheet.setState({ detent: 'peek' });
  useExpeditionDrawer.setState({ expanded: true });
  useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
});

describe('R-339 T8 — non-modal shell: the map stays interactive (AC9)', () => {
  // INV:expedition-bottom-sheet.INV-1
  it('wrapper swallows nothing — pointer-events none outside the sheet box', () => {
    renderSheet();
    const portal = screen.getByTestId('expedition-sheet-portal');
    expect(portal).toHaveStyle({ pointerEvents: 'none' });
    const sheet = screen.getByTestId('expedition-sheet');
    expect(sheet).toHaveStyle({ pointerEvents: 'auto' });
    /* No modal affordances: no scrim node, no dialog role, no focus trap. */
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sheet).toHaveAttribute('role', 'region');
    expect(document.querySelector('[data-scrim], [data-backdrop], [aria-modal="true"]')).toBeNull();
  });
});

describe('R-339 T8 — detents from the bottomSheet tokens (D5)', () => {
  // INV:expedition-bottom-sheet.INV-2
  it('rests at peek: peekPx + env(safe-area-inset-bottom), CTA row visible', () => {
    renderSheet();
    const sheet = screen.getByTestId('expedition-sheet');
    expect(sheet).toHaveAttribute('data-detent', 'peek');
    /* jsdom rewrites env() on the parsed style object — assert the raw
     *  attribute string carries the safe-area term. */
    expect(sheet.getAttribute('style')).toContain('safe-area-inset-bottom');
    expect(sheet.getAttribute('style')).toContain(`${SHEET.peekPx}px`);
    /* Peek IS the CTA row (D5): the launch-cta block rides the handle strip. */
    expect(screen.getByTestId('cassetto-confirm')).toBeInTheDocument();
  });

  // INV:expedition-bottom-sheet.INV-2
  it('half and full snap to the tokenized viewport fractions', () => {
    renderSheet();
    const sheet = screen.getByTestId('expedition-sheet');
    act(() => useExpeditionSheet.setState({ detent: 'half' }));
    expect(sheet.style.height).toBe(`${SHEET.halfFraction * 100}vh`);
    act(() => useExpeditionSheet.setState({ detent: 'full' }));
    expect(sheet.style.height).toBe(`${SHEET.fullFraction * 100}vh`);
  });

  // INV:expedition-bottom-sheet.INV-2
  it('the chevron toggles peek ⇄ expanded as the non-drag affordance', () => {
    renderSheet();
    fireEvent.click(screen.getByTestId('expedition-sheet-toggle'));
    expect(useExpeditionSheet.getState().detent).toBe('half');
    expect(screen.getByTestId('expedition-sheet')).toHaveAttribute('data-detent', 'half');
    fireEvent.click(screen.getByTestId('expedition-sheet-toggle'));
    expect(useExpeditionSheet.getState().detent).toBe('peek');
  });
});

describe('R-339 T8 — drag lives only on the handle strip (D5)', () => {
  /* jsdom has no PointerEvent: a typed `pointerdown` MouseEvent carries
   *  clientY to both the React handler and the window listeners. */
  const pointer = (type: 'pointerdown' | 'pointermove' | 'pointerup', clientY: number) =>
    new MouseEvent(type, { bubbles: true, cancelable: true, clientY });

  // INV:expedition-bottom-sheet.INV-3
  it('dragging the handle up snaps to the nearest detent', () => {
    renderSheet();
    const handle = screen.getByTestId('expedition-sheet-handle');
    /* Peek(56) → release height ~356 vs half(384 @768vh) → half. */
    fireEvent(handle, pointer('pointerdown', 500));
    act(() => {
      window.dispatchEvent(pointer('pointermove', 200));
      window.dispatchEvent(pointer('pointerup', 200));
    });
    expect(useExpeditionSheet.getState().detent).toBe('half');
  });

  // INV:expedition-bottom-sheet.INV-3
  it('dragging the handle down from full collapses toward peek', () => {
    act(() => useExpeditionSheet.setState({ detent: 'full' }));
    renderSheet();
    const handle = screen.getByTestId('expedition-sheet-handle');
    fireEvent(handle, pointer('pointerdown', 100));
    act(() => {
      window.dispatchEvent(pointer('pointermove', 780));
      window.dispatchEvent(pointer('pointerup', 780));
    });
    expect(useExpeditionSheet.getState().detent).toBe('peek');
  });

  // INV:expedition-bottom-sheet.INV-3
  it('the body never drags — scrolling wins; the detent is unchanged', () => {
    renderSheet();
    const body = screen.getByTestId('expedition-sheet-body');
    fireEvent(body, pointer('pointerdown', 500));
    act(() => {
      window.dispatchEvent(pointer('pointermove', 200));
      window.dispatchEvent(pointer('pointerup', 200));
    });
    expect(useExpeditionSheet.getState().detent).toBe('peek');
  });

  // INV:expedition-bottom-sheet.INV-3
  it('interactive children of the strip (CONFIRM) never start a drag', () => {
    renderSheet();
    fireEvent(screen.getByTestId('cassetto-confirm'), pointer('pointerdown', 500));
    act(() => {
      window.dispatchEvent(pointer('pointermove', 200));
      window.dispatchEvent(pointer('pointerup', 200));
    });
    expect(useExpeditionSheet.getState().detent).toBe('peek');
  });
});

describe('R-339 T8 — same planner surface, six named blocks preserved', () => {
  // INV:expedition-bottom-sheet.INV-4
  it('every block from the spec is present and carries its own content', () => {
    const { container } = renderSheet();
    const blocks = ['quest-banner', 'party-slots', 'bag-slots', 'journey-strip', 'risk-rewards', 'launch-cta'];
    for (const name of blocks) {
      expect(container.querySelector(`[data-block="${name}"]`), `missing block ${name}`).toBeInTheDocument();
    }
    expect(container.querySelector('[data-block="quest-banner"]')).toHaveTextContent('briefing');
    expect(container.querySelector('[data-block="party-slots"] [data-testid="resident-slot-rack-stub"]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="bag-slots"] [data-cassetto-bag]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="journey-strip"] [data-testid="cassetto-journey-total"]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="risk-rewards"]')).toHaveTextContent('High');
    expect(container.querySelector('[data-block="launch-cta"] [data-testid="cassetto-confirm"]')).toBeInTheDocument();
  });

  /* INV:expedition-bottom-sheet.INV-4 (statement amended R-357/D-1,
   *  sync:bug) — the sheet, like the column, paints no cost cell (the cost
   *  lives in the supplies flow). */
  // INV:expedition-bottom-sheet.INV-8 — R-357/D-1 amended: no cost cell in the sheet either.
  it('paints no cost cell (INV-5 parity with the column)', () => {
    const { container } = renderSheet();
    expect(container.querySelector('[data-testid="cassetto-cost-slot"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="cassetto-cost-value"]')).not.toBeInTheDocument();
  });

  // INV:expedition-bottom-sheet.INV-4
  it('muted CTA: disabled + inline reason + aria-describedby (AC4 parity)', () => {
    renderSheet({ canSend: false, disabledReason: 'Party incomplete' });
    const cta = screen.getByTestId('cassetto-confirm');
    expect(cta).toBeDisabled();
    const reason = screen.getByTestId('cassetto-confirm-reason');
    expect(reason).toHaveTextContent('Party incomplete');
    expect(cta).toHaveAttribute('aria-describedby', 'expedition-sheet-confirm-reason');
  });

  // INV:expedition-bottom-sheet.INV-4
  it('enabled CTA fires the real session onConfirm', () => {
    const onConfirm = vi.fn();
    renderSheet({ canSend: true, onConfirm });
    fireEvent.click(screen.getByTestId('cassetto-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('R-339 T8 — honest occupancy in the insets ledger', () => {
  // INV:expedition-bottom-sheet.INV-5
  it('publishes the peek height to insets.bottom; insets.right stays 0', () => {
    renderSheet();
    const { insets } = useGameLayoutInsets.getState();
    /* jsdom measures 0 → the ledger falls back to the detent token. */
    expect(insets.bottom).toBe(SHEET.peekPx);
    expect(insets.right).toBe(0);
  });

  // INV:expedition-bottom-sheet.INV-5
  it('half/full publish their token heights; unmount restores 0', () => {
    const view = renderSheet();
    act(() => useExpeditionSheet.setState({ detent: 'half' }));
    expect(useGameLayoutInsets.getState().insets.bottom).toBe(Math.round(window.innerHeight * SHEET.halfFraction));
    view.unmount();
    expect(useGameLayoutInsets.getState().insets.bottom).toBe(0);

    const hidden = renderSheet({ visible: false });
    expect(useGameLayoutInsets.getState().insets.bottom).toBe(0);
    expect(screen.queryByTestId('expedition-sheet')).not.toBeInTheDocument();
    hidden.unmount();
  });
});

describe('R-339 T8 — touch targets and text floor (AC10)', () => {
  // INV:expedition-bottom-sheet.INV-6
  it('handle strip, CONFIRM and chevron meet the ≥44px target', () => {
    renderSheet();
    const handle = screen.getByTestId('expedition-sheet-handle');
    expect(handle.style.minHeight).toBe(`${SHEET.handlePx}px`);
    expect(SHEET.handlePx).toBeGreaterThanOrEqual(44);
    const toggle = screen.getByTestId('expedition-sheet-toggle');
    expect(toggle.style.width).toBe(`${SHEET.handlePx}px`);
    expect(toggle.style.height).toBe(`${SHEET.handlePx}px`);
  });

  // INV:expedition-bottom-sheet.INV-6
  it('party slots render at the config slot size and body text at minTextPx', () => {
    renderSheet();
    expect(screen.getByTestId('resident-slot-rack-stub')).toHaveAttribute('data-slot-size', String(SHEET.slotPx));
    expect(screen.getByTestId('expedition-sheet').style.fontSize).toBe(`${SHEET.minTextPx}px`);
    expect(SHEET.minTextPx).toBeGreaterThanOrEqual(16);
  });
});

describe('R-339 T8 — mutual exclusion of the lateral surfaces (AC10)', () => {
  const SHEET_MQ = `(max-width: ${SHEET.maxWidthPx}px)`;
  const realMatchMedia = window.matchMedia;
  const stubMatchMedia = (narrow: boolean) => {
    window.matchMedia = ((query: string) => ({
      matches: query === SHEET_MQ ? narrow : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  };
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  const renderDrawer = () =>
    render(
      <DndContext>
        <DragProvider>
          <TooltipProvider>
            <div style={{ position: 'relative', width: 420, height: 900 }}>
              <ExpeditionDrawer quest={QUEST} slots={[]} loadout={LOADOUT} />
            </div>
          </TooltipProvider>
        </DragProvider>
      </DndContext>,
    );

  // INV:expedition-bottom-sheet.INV-7
  it('useExpeditionSheetMode reads the same maxWidthPx token the page guards on', () => {
    stubMatchMedia(true);
    const { result, unmount } = renderHook(() => useExpeditionSheetMode());
    expect(result.current).toBe(true);
    unmount();
    stubMatchMedia(false);
    const wide = renderHook(() => useExpeditionSheetMode());
    expect(wide.result.current).toBe(false);
    wide.unmount();
  });

  // INV:expedition-bottom-sheet.INV-7
  it('at ≤1100 the drawer mounts the sheet — column and chips never mount', () => {
    stubMatchMedia(true);
    renderDrawer();
    expect(screen.getByTestId('expedition-sheet')).toBeInTheDocument();
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeNull();
    expect(screen.queryByTestId('expedition-drawer')).toBeNull();
    expect(screen.queryByTestId('expedition-drawer-collapse')).toBeNull();
    expect(screen.queryByTestId('expedition-drawer-expand')).toBeNull();
    /* The fold token is irrelevant in this band: even a folded drawer is a
     *  sheet, never a lateral chip. */
    act(() => useExpeditionDrawer.setState({ expanded: false }));
    stubMatchMedia(true);
    renderDrawer();
    expect(screen.getAllByTestId('expedition-sheet').length).toBe(2);
    expect(screen.queryByTestId('expedition-drawer-expand')).toBeNull();
  });

  // INV:expedition-bottom-sheet.INV-7
  it('above 1100 the drawer keeps the signed column (exclusion boundary)', () => {
    stubMatchMedia(false);
    renderDrawer();
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeInTheDocument();
    expect(screen.queryByTestId('expedition-sheet')).toBeNull();
  });
});
