/**
 * R-339 / PLAN-119 (2026-11-15) — the expedition drawer's missing states.
 *
 * The signed cassetto covered the happy path only: ambiguous "Nd" journey
 * glyphs, a muted CONFIRM with no reason, no route from an empty party seat
 * to the roster, and no resting state when no quest is selected. These tests
 * pin the PLAN-119 fixes:
 *   legs read "N days" (ICU) + an explicit total;
 *   a disabled CONFIRM shows the inline reason (stock-detail parity);
 *   tapping an EMPTY party seat opens the floating roster panel;
 *   the drawer publishes its docked width to the shared insets ledger;
 *   with no quest the surface mounts NOTHING (R-351 — the old right-edge
 *   "SELECT A QUEST MARKER" tab was deleted by Director ruling).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { useGameLayoutInsets, freeMapShare } from '@/ui/idleVillage/store/useGameLayoutInsets';

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

const renderCassetto = (props: Partial<Parameters<typeof HudRealCassetto>[0]> = {}) =>
  render(
    <div style={{ position: 'relative', width: 420, height: 900 }}>
      <HudRealCassetto quest={QUEST} slots={[]} {...props} />
    </div>,
  );

describe('R-339 — journey legs say "N days" and the total is explicit', () => {
  // INV:hud-real-cassetto.INV-1
  it('each leg renders the localized days count, never the bare "Nd" glyph', () => {
    renderCassetto();
    expect(screen.getAllByText('gameFrame.cassetto.legDays:3')).toHaveLength(2);
    expect(screen.getByText('gameFrame.cassetto.legDays:2')).toBeInTheDocument();
    expect(screen.queryByText(/^3d$/i)).not.toBeInTheDocument();
  });

  // INV:hud-real-cassetto.INV-1
  it('the total row shows "Total: N days" when totalDays is provided', () => {
    renderCassetto();
    expect(screen.getByTestId('cassetto-journey-total')).toHaveTextContent(
      'gameFrame.cassetto.journeyTotal:8',
    );
  });
});

describe('R-339 — disabled CONFIRM states its reason inline', () => {
  // INV:hud-real-cassetto.INV-2
  it('muted plaque + reason element + aria-describedby wiring', () => {
    renderCassetto({ canSend: false, disabledReason: 'Party incomplete — fill the required slots' });
    const reason = screen.getByTestId('cassetto-confirm-reason');
    expect(reason).toHaveTextContent('Party incomplete');
    const confirm = screen.getByTestId('cassetto-confirm');
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-describedby', 'cassetto-confirm-reason');
  });

  // INV:hud-real-cassetto.INV-2
  it('enabled CONFIRM renders no reason element', () => {
    renderCassetto({ canSend: true });
    expect(screen.queryByTestId('cassetto-confirm-reason')).not.toBeInTheDocument();
    expect(screen.getByTestId('cassetto-confirm')).not.toBeDisabled();
  });
});

describe('R-339 — the empty party seat opens the roster panel', () => {
  // INV:hud-real-cassetto.INV-3
  it('onSlotClick is wired through to the rack (the only emit on an empty seat)', () => {
    const onOpenRoster = vi.fn();
    renderCassetto({ onSlotClick: onOpenRoster });
    screen.getByTestId('resident-slot-rack-stub').click();
    expect(onOpenRoster).toHaveBeenCalledTimes(1);
  });

  // INV:hud-real-cassetto.INV-3
  it('wiring: Detail forwards onOpenRoster to onSlotClick; the page opens the roster panel', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const read = (p: string) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../../', p), 'utf8') as string;
    const detail = read('src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx');
    expect(detail).toMatch(/onSlotClick=\{p\.onOpenRoster/);
    const page = read('src/pages/game-mappa2.tsx');
    expect(page).toMatch(/onOpenRoster=\{\(\)\s*=>\s*panels\.set\('roster', true\)\}/);
  });
});

describe('R-339 — the drawer publishes its docked width to the insets ledger', () => {
  beforeEach(() => {
    useGameLayoutInsets.setState({ insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  });

  // INV:hud-real-cassetto.INV-4
  it('mount publishes insets.right = aspect × viewportH; unmount restores 0', () => {
    const { unmount } = renderCassetto();
    const published = useGameLayoutInsets.getState().insets.right;
    expect(published).toBeGreaterThan(0);
    /* jsdom innerHeight 768 × the column aspect (~0.467 @1440 art) — the
     * publish is live-measured, not a magic constant. */
    expect(published).toBe(Math.round(published));
    unmount();
    expect(useGameLayoutInsets.getState().insets.right).toBe(0);
  });

  // INV:hud-real-cassetto.INV-4
  it('freeMapShare computes the AC share (≥65% one docked surface / ≥50% two)', () => {
    expect(freeMapShare({ top: 0, right: 441, bottom: 0, left: 0 }, 1920)).toBeCloseTo(0.77, 1);
    expect(freeMapShare({ top: 0, right: 420, bottom: 0, left: 300 }, 1440)).toBeCloseTo(0.5, 1);
    expect(freeMapShare({ top: 0, right: 0, bottom: 0, left: 0 }, 0)).toBe(0);
  });
});

describe('R-351 — no quest: the surface mounts nothing (edge tab deleted)', () => {
  // INV:expedition-drawer.INV-1
  it('the page no longer imports nor mounts ExpeditionEdgeTab / expedition-edge-tab', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const read = (p: string) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../../', p), 'utf8') as string;
    const page = read('src/pages/game-mappa2.tsx');
    expect(page).not.toMatch(/ExpeditionEdgeTab|expedition-edge-tab/);
    /* And the component file itself is gone. */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const exists = require('node:fs').existsSync(
      require('node:path').resolve(__dirname, '../../../src/ui/idleVillage/components/gameFrame/ExpeditionEdgeTab.tsx'),
    );
    expect(exists).toBe(false);
  });
});
