/**
 * R-357 / Director ruling 2026-11-20 — «× chiudi e perdi tutto».
 *
 * The cassetto's close is a DISCARD, not a fold: every filled seat clears
 * through the real `onSlotClear` path, the whole per-POI bag releases to the
 * shared pool (`onReleaseAllItems`), and only then the planner closes. An
 * unfilled seat must NOT be cleared (no phantom clear calls), and the
 * ordering matters — the draft is gone before `onClose` tears the surface
 * down.
 *
 * `ExpeditionDrawer` is stubbed so the test exercises the REAL
 * `handleDiscardClose` the Detail adapter wires as `onClose` — not a copy.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HudRealCassettoDetail } from '@/ui/idleVillage/hudReal/HudRealCassettoDetail';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

/* The drawer is the mount primitive — stub it and expose the wired onClose. */
vi.mock('@/ui/idleVillage/components/gameFrame/ExpeditionDrawer', () => ({
  ExpeditionDrawer: (props: { onClose?: () => void }) => (
    <button data-testid="drawer-stub-close" onClick={props.onClose} />
  ),
}));

const baseProps = () => ({
  poi: { id: 'poi-test', fasi: { travelDays: 1 } },
  scenario: { title: 'Q', offer: { dispatch: 'd', objective: 'o' }, rewardBase: 60 },
  forecastDelta: null,
  intelHints: [],
  expeditionDuration: { estimatedTicks: 8 },
  estimate: 'incomplete' as const,
  requiredFilled: false,
  items: [],
  selectedItemIds: [],
  slots: [
    { id: 'slot-a', assignedResidentId: 'res-1' },
    { id: 'slot-b', assignedResidentId: null },
    { id: 'slot-c', assignedResidentId: 'res-3' },
  ],
  onToggleItem: vi.fn(),
  onReleaseAllItems: vi.fn(),
  onOpenStash: vi.fn(),
  canSend: false,
  onSend: vi.fn(),
  onClose: vi.fn(),
  onSlotClear: vi.fn(),
});

describe('R-357 — × discards the draft: seats clear, bag releases, then close', () => {
  it('clears every filled seat, releases the bag, closes LAST', () => {
    const p = baseProps();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<HudRealCassettoDetail {...(p as any)} />);
    fireEvent.click(screen.getByTestId('drawer-stub-close'));

    expect(p.onSlotClear).toHaveBeenCalledTimes(2);
    expect(p.onSlotClear).toHaveBeenCalledWith('slot-a');
    expect(p.onSlotClear).toHaveBeenCalledWith('slot-c');
    /* The empty seat must not receive a phantom clear. */
    expect(p.onSlotClear).not.toHaveBeenCalledWith('slot-b');

    expect(p.onReleaseAllItems).toHaveBeenCalledTimes(1);
    expect(p.onClose).toHaveBeenCalledTimes(1);

    /* Ordering: the draft is fully discarded BEFORE the planner closes. */
    const lastClear = Math.max(...p.onSlotClear.mock.invocationCallOrder);
    expect(lastClear).toBeLessThan(p.onReleaseAllItems.mock.invocationCallOrder[0]);
    expect(p.onReleaseAllItems.mock.invocationCallOrder[0]).toBeLessThan(
      p.onClose.mock.invocationCallOrder[0],
    );
  });

  it('still closes when no release-all handler is bound (optional prop)', () => {
    const p = { ...baseProps(), onReleaseAllItems: undefined };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<HudRealCassettoDetail {...(p as any)} />);
    fireEvent.click(screen.getByTestId('drawer-stub-close'));
    expect(p.onSlotClear).toHaveBeenCalledTimes(2);
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });
});
