/**
 * R-339 / PLAN-119 T2 (2026-11-15) — the `ExpeditionDrawer` primitive.
 *
 * The drawer is the mockup's right-edge planning surface (artifact-r004):
 * while a quest is selected it exists in exactly two forms — the signed
 * column docked flush-right, or a slim chip docked on the same edge — and
 * the fold is visual only (the planner detail, its slots and bag stay
 * alive; state preserved across the fold, mirroring the rail contract).
 * These tests pin the contract (`expedition-drawer`):
 *   expanded → the column + its fold chip; collapsed → the edge chip;
 *   the six named blocks (quest-banner / party-slots / bag-slots /
 *   journey-strip / risk-rewards / launch-cta) structure the interior;
 *   the chip publishes `drawer.chipWidthPx` to the insets ledger while
 *   the column keeps owning its measured width; the risk-rewards block
 *   carries the reserved (S2) cost slot, flagged placeholder.
 * The no-quest resting form is `ExpeditionEdgeTab` (covered by
 * `r339ExpeditionStates` + the `expedition-edge-tab` contract) — a
 * different surface, not a drawer mode.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import '@testing-library/jest-dom';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import { useExpeditionDrawer } from '@/ui/idleVillage/store/useExpeditionDrawer';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';

const DRAWER = CASSETTO_LAYOUT_CONFIG.drawer;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: (props: { onSlotClick?: (id: string) => void }) => (
    <button data-testid="resident-slot-rack-stub" onClick={() => props.onSlotClick?.('slot-leader')} />
  ),
}));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  subtitle: 'Pianifica la spedizione',
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

/* The bag wells render only while a loadout is bound (R-337 contract) —
 *  pass the real prop shape so `bag-slots` has its content. */
const LOADOUT = {
  slots: [
    { id: 'rope', icon: 'ico-pouch', label: 'Rope', qty: 2 },
    null,
  ],
  onReleaseItem: () => {},
  onOpenStash: () => {},
};

const renderDrawer = (props: Partial<Parameters<typeof ExpeditionDrawer>[0]> = {}) =>
  render(
    <DndContext>
      <DragProvider>
        <TooltipProvider>
          <div style={{ position: 'relative', width: 420, height: 900 }}>
            <ExpeditionDrawer quest={QUEST} slots={[]} loadout={LOADOUT} {...props} />
          </div>
        </TooltipProvider>
      </DragProvider>
    </DndContext>,
  );

beforeEach(() => {
  useExpeditionDrawer.setState({ expanded: true });
  useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
});

describe('R-339 T2 — the drawer mounts the six named blocks of the mockup', () => {
  // INV:expedition-drawer.INV-2
  it('every block from the spec is present and carries its own content', () => {
    const { container } = renderDrawer();
    const blocks = ['quest-banner', 'party-slots', 'bag-slots', 'journey-strip', 'risk-rewards', 'launch-cta'];
    for (const name of blocks) {
      expect(container.querySelector(`[data-block="${name}"]`), `missing block ${name}`).toBeInTheDocument();
    }
    /* Content ownership: each block actually contains its elements, not
     *  just a stray marker. */
    expect(container.querySelector('[data-block="quest-banner"]')).toHaveTextContent('Goblin Extermination');
    expect(container.querySelector('[data-block="party-slots"] [data-testid="resident-slot-rack-stub"]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="bag-slots"] [data-cassetto-bag]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="journey-strip"] [data-testid="cassetto-journey-total"]')).toBeInTheDocument();
    expect(container.querySelector('[data-block="risk-rewards"]')).toHaveTextContent('High');
    expect(container.querySelector('[data-block="launch-cta"] [data-testid="cassetto-confirm"]')).toBeInTheDocument();
  });

  // INV:expedition-drawer.INV-4
  it('risk-rewards reserves the S2 cost slot, flagged placeholder and empty', () => {
    const { container } = renderDrawer();
    const slot = container.querySelector('[data-block="risk-rewards"] [data-testid="cassetto-cost-slot"]');
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveAttribute('data-placeholder', 'cost-preview');
    expect(slot).toBeEmptyDOMElement();
  });
});

describe('R-339 T2 — expanded ⇄ chip fold preserves the session surface', () => {
  // INV:expedition-drawer.INV-1
  it('mounts expanded with the signed column and a fold chip; the chip folds it', () => {
    renderDrawer();
    expect(screen.getByTestId('expedition-drawer')).toHaveAttribute('data-expanded');
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('expedition-drawer-collapse'));
    expect(document.querySelector('[data-hudreal-cassetto]')).not.toBeInTheDocument();
    expect(screen.getByTestId('expedition-drawer-expand')).toBeInTheDocument();
    expect(screen.getByTestId('expedition-drawer')).not.toHaveAttribute('data-expanded');
  });

  // INV:expedition-drawer.INV-1
  it('the edge chip restores the full drawer (visual fold — the surface never closed)', () => {
    renderDrawer();
    fireEvent.click(screen.getByTestId('expedition-drawer-collapse'));
    fireEvent.click(screen.getByTestId('expedition-drawer-expand'));
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeInTheDocument();
    expect(screen.getByTestId('cassetto-confirm')).toBeInTheDocument();
  });

  // INV:expedition-drawer.INV-5
  it('the fold chip hugs the column left edge — same min(aspect·vh, cap) width rule', () => {
    renderDrawer();
    const chip = screen.getByTestId('expedition-drawer-collapse');
    expect(chip.style.right).toContain('min(');
    expect(chip.style.right).toContain('100vh');
    expect(chip.style.right).toContain(`${DRAWER.widthMaxPx}px`);
  });
});

describe('R-339 T2 — honest occupancy in the insets ledger', () => {
  // INV:expedition-drawer.INV-3
  it('collapsed publishes drawer.chipWidthPx; expanded the column keeps its own measure', () => {
    renderDrawer();
    /* Expanded: the column's own effect publishes aspect × viewportH (the
     *  same live measure as hud-real-cassetto.INV-4 — not the chip token). */
    const expandedInset = useGameLayoutInsets.getState().insets.right;
    expect(expandedInset).toBeGreaterThan(0);
    expect(expandedInset).not.toBe(DRAWER.chipWidthPx);
    fireEvent.click(screen.getByTestId('expedition-drawer-collapse'));
    expect(useGameLayoutInsets.getState().insets.right).toBe(DRAWER.chipWidthPx);
    fireEvent.click(screen.getByTestId('expedition-drawer-expand'));
    expect(useGameLayoutInsets.getState().insets.right).toBe(expandedInset);
  });

  // INV:expedition-drawer.INV-3
  it('unmount restores 0 from either form; hidden publishes 0 and renders nothing', () => {
    useExpeditionDrawer.setState({ expanded: false });
    const collapsed = renderDrawer();
    expect(useGameLayoutInsets.getState().insets.right).toBe(DRAWER.chipWidthPx);
    collapsed.unmount();
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);

    const expanded = renderDrawer();
    expect(useGameLayoutInsets.getState().insets.right).toBeGreaterThan(0);
    expanded.unmount();
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);

    renderDrawer({ visible: false });
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);
    expect(screen.queryByTestId('expedition-drawer')).not.toBeInTheDocument();
  });
});
