/**
 * resourceDeltaChip.test.tsx — R-260 HUD feedback for the committed
 * settlement grant (PLAN-075): the readout shows a «+N» chip on the gold
 * tile and an «+N XP» chip anchored under the readout, each counting up
 * over `hud.resourceDelta.countUpMs` — instantly under reduced-motion.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResourceReadout, type ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { countUpValue, useCountUp } from '@/ui/idleVillage/components/gameFrame/useCountUp';
import { renderHook } from '@testing-library/react';

const ITEMS: ResourceReadoutItem[] = [
  { id: 'gold', icon: <span />, label: 'Gold', value: 72, description: 'Gold 72.' },
  { id: 'food', icon: <span />, label: 'Food', value: 8, max: 20 },
  { id: 'wood', icon: <span />, label: 'Wood', value: 3 },
];

const DELTA = { chips: { gold: 57 }, tray: { id: 'xp', label: 'XP', amount: 3 }, at: 1000 };

const setReducedMotion = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
};

beforeEach(() => setReducedMotion(true));
afterEach(() => setReducedMotion(false));

describe('countUpValue (pure)', () => {
  it('starts at 0, ends at the target, eases out', () => {
    expect(countUpValue(57, 0)).toBe(0);
    expect(countUpValue(57, 1)).toBe(57);
    expect(countUpValue(57, 1.5)).toBe(57);
    const mid = countUpValue(57, 0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(57);
    /* ease-out cubic: the midpoint is already past half the target. */
    expect(mid).toBeGreaterThanOrEqual(Math.round(57 * 0.5));
  });

  it('degenerate targets stay at 0', () => {
    expect(countUpValue(0, 0.5)).toBe(0);
    expect(countUpValue(Number.NaN, 0.5)).toBe(0);
  });
});

// INV:resource-readout.INV-1 — the delta stamp renders one chip per granted
// resource; grants with no tile anchor under the readout.
describe('ResourceReadout delta chips (R-260)', () => {
  it('renders the «+N» chip on the gold tile and the «+N XP» tray', () => {
    render(<ResourceReadout items={ITEMS} delta={DELTA} />);
    const goldChip = screen.getByTestId('resource-delta-gold');
    expect(goldChip).toBeInTheDocument();
    expect(goldChip).toHaveTextContent('+57');
    expect(goldChip).toHaveAttribute('aria-label', 'Gold +57');
    const xpTray = screen.getByTestId('resource-delta-xp');
    expect(xpTray).toBeInTheDocument();
    expect(xpTray).toHaveTextContent('+3');
    expect(xpTray).toHaveAttribute('aria-label', 'XP +3');
  });

  it('no stamp → no chips; a zero amount renders nothing', () => {
    render(<ResourceReadout items={ITEMS} />);
    expect(screen.queryByTestId('resource-delta-gold')).toBeNull();
    render(<ResourceReadout items={ITEMS} delta={{ chips: { gold: 0 }, at: 1 }} />);
    expect(screen.queryByTestId('resource-delta-gold')).toBeNull();
  });

  // INV:resource-readout.INV-1 — reduced-motion shows the final amount
  // instantly; with motion the count-up sweeps 0 → amount.
  it('reduced-motion lands on the final amount; motion sweeps up', () => {
    /* beforeEach armed reduced-motion → instant. */
    const reduced = renderHook(() => useCountUp(57, 900, 1));
    expect(reduced.result.current).toBe(57);

    /* Motion on → the sweep starts at 0 and climbs on rAF. */
    setReducedMotion(false);
    const animated = renderHook(() => useCountUp(57, 900, 1));
    expect(animated.result.current).toBe(0);
    animated.unmount();
  });
});
