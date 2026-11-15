/**
 * R-339 / PLAN-119 T5 (2026-11-15) — the docked left Roster|Stash column.
 *
 * The mockup absorption replaces the floating-roster-as-summon with a
 * persistent docked column: segmented Roster|Stash tabs, portraits and
 * config-driven bars, stash rows (icon + name + one effect line), compact
 * member stat chips while packing, and a collapse chip as the only folded
 * form. These tests pin the contract (`roster-stash-rail`):
 *   the column publishes its real occupancy to `useGameLayoutInsets.left`;
 *   tabs switch the body; the chip folds and restores;
 *   ≤1100px mutual exclusion folds the rail for the open drawer and
 *   restores it when the drawer yields (state preserved);
 *   the bottom inset token keeps the column above the voce medallion.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import '@testing-library/jest-dom';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { RosterStashRail } from '@/ui/idleVillage/components/gameFrame/RosterStashRail';
import { useExpeditionRail } from '@/ui/idleVillage/store/useExpeditionRail';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';

const RAIL = CASSETTO_LAYOUT_CONFIG.rail;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

const resident = (over: Partial<ResidentState> = {}): ResidentState => ({
  id: 'r-ayla',
  displayName: 'Ayla',
  status: 'active',
  fatigue: 10,
  currentHp: 42,
  maxHp: 50,
  isHero: true,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...over,
});

const RESIDENTS = [
  resident(),
  resident({ id: 'r-bram', displayName: 'Bram', fatigue: 80, currentHp: 10, maxHp: 60 }),
];

const renderRail = (props: Partial<Parameters<typeof RosterStashRail>[0]> = {}) =>
  render(
    <DndContext>
      <DragProvider>
        <TooltipProvider>
          <RosterStashRail residents={RESIDENTS} stashConfig={VILLAGE_STASH_CONFIG} {...props} />
        </TooltipProvider>
      </DragProvider>
    </DndContext>,
  );

/** Force the narrow-viewport band for the mutex tests. */
const stubNarrow = (matches: boolean) => {
  const real = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('max-width') ? matches : real(query).matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  });
  return () => Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: real });
};

beforeEach(() => {
  useExpeditionRail.setState({ expanded: true, tab: 'roster', mutexCollapsed: false });
  useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  useVillageStashStore.setState({
    hydration: 'ready',
    bags: {},
    committed: {},
    activeStashOwner: null,
    lastEvent: null,
  });
});

describe('R-339 T5 — the rail publishes its real occupancy to the insets ledger', () => {
  // INV:roster-stash-rail.INV-1
  it('expanded publishes rail.widthPx; the chip publishes chipWidthPx; unmount restores 0', () => {
    const { unmount } = renderRail();
    expect(useGameLayoutInsets.getState().insets.left).toBe(RAIL.widthPx);
    fireEvent.click(screen.getByTestId('rail-collapse-chip'));
    expect(useGameLayoutInsets.getState().insets.left).toBe(RAIL.chipWidthPx);
    unmount();
    expect(useGameLayoutInsets.getState().insets.left).toBe(0);
  });

  // INV:roster-stash-rail.INV-1
  it('a hidden rail publishes 0 (village view / HUD hidden)', () => {
    renderRail({ visible: false });
    expect(useGameLayoutInsets.getState().insets.left).toBe(0);
  });

  // INV:roster-stash-rail.INV-5
  it('the column is docked at left:0 and capped above the bottom medallion zone', () => {
    renderRail();
    const rail = screen.getByTestId('roster-stash-rail');
    const plaque = rail.closest('section') ?? rail;
    expect(plaque).toHaveStyle({
      left: '0px',
      top: `${RAIL.marginPx}px`,
      bottom: `${RAIL.bottomInsetPx}px`,
      width: `${RAIL.widthPx}px`,
    });
  });
});

describe('R-339 T5 — segmented tabs drive the column body', () => {
  // INV:roster-stash-rail.INV-2
  it('Roster tab: one row per member with portrait, name and the config bars', () => {
    renderRail();
    expect(screen.getByRole('tab', { selected: true })).toHaveAttribute('data-testid', 'rail-tab-roster');
    for (const r of RESIDENTS) {
      const row = screen.getByTestId(`rail-roster-row-${r.id}`);
      expect(row).toHaveTextContent(r.displayName!);
      expect(row.querySelector('img')).toBeInTheDocument();
    }
    /* Config-driven: exactly the bars the layout config declares, labeled. */
    const row = screen.getByTestId('rail-roster-row-r-ayla');
    expect(row.querySelectorAll('[role="img"][aria-label]').length).toBe(RAIL.bars.length);
    expect(row).toHaveTextContent('42/50');
  });

  // INV:roster-stash-rail.INV-2
  it('Stash tab: member stat chips + item rows (tile, name, single effect line)', () => {
    renderRail();
    fireEvent.click(screen.getByTestId('rail-tab-stash'));
    expect(screen.getByRole('tab', { selected: true })).toHaveAttribute('data-testid', 'rail-tab-stash');
    for (const r of RESIDENTS) {
      expect(screen.getByTestId(`rail-member-chip-${r.id}`)).toBeInTheDocument();
    }
    const firstRow = document.querySelector('[data-testid^="rail-stash-item-"]');
    expect(firstRow).not.toBeNull();
    /* Icon tile + name + desc — the desc is one line (ellipsis chrome). */
    expect(firstRow!.textContent!.length).toBeGreaterThan(0);
    /* Capacity footer from the shared view-model. */
    expect(screen.getByText(/gameFrame\.stash\.capacity/)).toBeInTheDocument();
  });
});

describe('R-339 T5 — persistent by default, chip is the only folded form', () => {
  // INV:roster-stash-rail.INV-3
  it('mounts expanded; the collapse chip folds to the edge chip; expand restores', () => {
    renderRail();
    expect(screen.getByTestId('roster-stash-rail')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('rail-collapse-chip'));
    expect(screen.queryByTestId('roster-stash-rail')).not.toBeInTheDocument();
    const chip = screen.getByTestId('rail-expand-chip');
    fireEvent.click(chip);
    expect(screen.getByTestId('roster-stash-rail')).toBeInTheDocument();
  });

  // INV:roster-stash-rail.INV-3
  it('the rail remembers the selected tab across a fold', () => {
    renderRail();
    fireEvent.click(screen.getByTestId('rail-tab-stash'));
    fireEvent.click(screen.getByTestId('rail-collapse-chip'));
    fireEvent.click(screen.getByTestId('rail-expand-chip'));
    expect(screen.getByRole('tab', { selected: true })).toHaveAttribute('data-testid', 'rail-tab-stash');
  });
});

describe('R-339 T5 — ≤1100px mutual exclusion with the right drawer', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubNarrow(true);
  });
  afterEach(() => {
    restore();
  });

  // INV:roster-stash-rail.INV-4
  it('an open drawer (insets.right>0) folds the rail; drawer yield restores it', () => {
    renderRail();
    /* Drawer publishes its width — the rail folds itself (mutex-owned). */
    act(() => useGameLayoutInsets.getState().publish({ right: 400 }));
    expect(screen.queryByTestId('roster-stash-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('rail-expand-chip')).toBeInTheDocument();
    /* The fold is mutex-owned: when the drawer yields, the rail comes back. */
    act(() => useGameLayoutInsets.getState().publish({ right: 0 }));
    expect(screen.getByTestId('roster-stash-rail')).toBeInTheDocument();
  });

  // INV:roster-stash-rail.INV-4
  it('a USER collapse while the drawer is open does not auto-restore', () => {
    useExpeditionRail.setState({ expanded: false, mutexCollapsed: false });
    renderRail();
    act(() => useGameLayoutInsets.getState().publish({ right: 400 }));
    act(() => useGameLayoutInsets.getState().publish({ right: 0 }));
    expect(screen.getByTestId('rail-expand-chip')).toBeInTheDocument();
  });

  // INV:roster-stash-rail.INV-4
  it('outside the narrow band the drawer does not fold the rail', () => {
    restore();
    restore = stubNarrow(false);
    renderRail();
    act(() => useGameLayoutInsets.getState().publish({ right: 400 }));
    expect(screen.getByTestId('roster-stash-rail')).toBeInTheDocument();
  });
});
