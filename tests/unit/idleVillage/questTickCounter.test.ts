import { describe, expect, it } from 'vitest';
import { tickCounterParams } from '@/ui/idleVillage/questS1Lab/questTickCounter';

describe('quest time bar — tick counter (R-234)', () => {
  // INV:R-234-tick-counter-within-total — the label never reads elapsed > total, however long the
  // party waits for orders (the bar is full and the run waits; the number stops at the total).
  it('clamps elapsed to the live total', () => {
    expect(tickCounterParams({ elapsedTicks: 315, durationTicks: 110 })).toEqual({ elapsed: 110, total: 110 });
    expect(tickCounterParams({ elapsedTicks: 40, durationTicks: 110 })).toEqual({ elapsed: 40, total: 110 });
    expect(tickCounterParams({ elapsedTicks: -3, durationTicks: 110 })).toEqual({ elapsed: 0, total: 110 });
  });
});
