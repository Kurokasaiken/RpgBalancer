import { describe, it, expect } from 'vitest';
import { questAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';

describe('questAvailability', () => {
  it('starts full and drains linearly with game ticks', () => {
    expect(questAvailability(100, 100, 60, 5)).toEqual({ progress: 1, state: 'available' });
    expect(questAvailability(250, 100, 60, 5).progress).toBeCloseTo(0.5);
  });

  it('turns expiring in the last quarter and expired at zero', () => {
    expect(questAvailability(100 + 240, 100, 60, 5).state).toBe('expiring'); // 20% left
    expect(questAvailability(100 + 300, 100, 60, 5)).toEqual({ progress: 0, state: 'expired' });
    expect(questAvailability(100 + 999, 100, 60, 5).progress).toBe(0);
  });

  it('does not move while the clock is stopped', () => {
    expect(questAvailability(180, 100, 60, 5)).toEqual(questAvailability(180, 100, 60, 5));
    expect(questAvailability(100, 100, 60, 5).progress).toBe(1);
  });
});
