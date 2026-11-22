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
import { render, screen } from '@testing-library/react';
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
    // R-357 (2026-11-20): the risk is a row of skulls — its band name lives in the accessible name
    expect(container.querySelector('[data-block="risk-rewards"] [data-testid="cassetto-risk-value"]')?.getAttribute('aria-label')).toContain('High');
    expect(container.querySelector('[data-block="launch-cta"] [data-testid="cassetto-confirm"]')).toBeInTheDocument();
  });

  // INV:expedition-drawer.INV-4
  it('SUPPLIES (bag-slots) carries no cost cell (R-357: saved idea, not shown)', () => {
    const { container } = renderDrawer();
    expect(container.querySelector('[data-testid="cassetto-cost-slot"]')).toBeNull();
  });
});

describe('R-339 T2 — ONE form only: no fold chips (Director 2026-11-22, OB-7 γ)', () => {
  // INV:expedition-drawer.INV-1
  it('mounts expanded with the signed column and NO fold chip', () => {
    renderDrawer();
    expect(screen.getByTestId('expedition-drawer')).toHaveAttribute('data-expanded');
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeInTheDocument();
    expect(screen.queryByTestId('expedition-drawer-collapse')).toBeNull();
    expect(screen.queryByTestId('expedition-drawer-expand')).toBeNull();
  });

  // INV:expedition-drawer.INV-1
  it('the drawer never reads the fold store — the column is the only lateral form', () => {
    useExpeditionDrawer.setState({ expanded: false });
    renderDrawer();
    expect(document.querySelector('[data-hudreal-cassetto]')).toBeInTheDocument();
    expect(screen.getByTestId('cassetto-confirm')).toBeInTheDocument();
    useExpeditionDrawer.setState({ expanded: true });
  });
});

describe('R-339 T2 — honest occupancy in the insets ledger', () => {
  // INV:expedition-drawer.INV-3
  it('expanded: the column publishes its own live measure — never a chip token', () => {
    renderDrawer();
    const expandedInset = useGameLayoutInsets.getState().insets.right;
    expect(expandedInset).toBeGreaterThan(0);
    expect(expandedInset).not.toBe(DRAWER.chipWidthPx);
  });

  // INV:expedition-drawer.INV-3
  it('unmount restores 0; hidden publishes 0 and renders nothing', () => {
    const expanded = renderDrawer();
    expect(useGameLayoutInsets.getState().insets.right).toBeGreaterThan(0);
    expanded.unmount();
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);

    renderDrawer({ visible: false });
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);
    expect(screen.queryByTestId('expedition-drawer')).not.toBeInTheDocument();
  });
});
