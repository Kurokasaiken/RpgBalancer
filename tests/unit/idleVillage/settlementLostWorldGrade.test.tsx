import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { OxidizedGradeFilter } from '@/ui/idleVillage/components/OxidizedGradeFilter';
import { useSettlementLostGrade } from '@/ui/idleVillage/hooks/useSettlementLostGrade';
import { settlementLostConfig } from '@/balancing/config/idleVillage/settlementLostConfig';

let mockGameOver: { isGameOver: boolean; reason?: string } = { isGameOver: false };
let mockReduced = false;

vi.mock('@/store/useMinimalGameplay', () => ({
  useMinimalGameplayStore: (selector: (s: unknown) => unknown) => selector({ gameOverState: mockGameOver }),
}));
vi.mock('@/ui/idleVillage/hooks/useReducedMotion', () => ({ useReducedMotion: () => mockReduced }));

describe('settlement lost — world grade on /game (R-282 follow-up)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGameOver = { isGameOver: false };
    mockReduced = false;
  });
  afterEach(() => vi.useRealTimers());

  it('stays 0 while the run is alive', () => {
    const { result } = renderHook(() => useSettlementLostGrade());
    expect(result.current).toBe(0);
  });

  it('ignores a different game-over reason', () => {
    mockGameOver = { isGameOver: true, reason: 'food_depleted' };
    const { result } = renderHook(() => useSettlementLostGrade());
    expect(result.current).toBe(0);
  });

  it('climbs 0→1 over the iris duration, never snapping at the first tick', () => {
    mockGameOver = { isGameOver: true, reason: 'settlement_lost' };
    const { result } = renderHook(() => useSettlementLostGrade());
    act(() => { vi.advanceTimersByTime(settlementLostConfig.irisDurationMs / 2); });
    expect(result.current).toBeGreaterThan(0.3);
    expect(result.current).toBeLessThan(0.7);
    act(() => { vi.advanceTimersByTime(settlementLostConfig.irisDurationMs); });
    expect(result.current).toBe(1);
  });

  it('jumps straight to 1 under reduced motion', () => {
    mockGameOver = { isGameOver: true, reason: 'settlement_lost' };
    mockReduced = true;
    const { result } = renderHook(() => useSettlementLostGrade());
    expect(result.current).toBe(1);
  });

  it('filter at progress 0 is the identity, at 1 is the verdigris ramp', () => {
    const { container, rerender } = render(<OxidizedGradeFilter progress={0} filterId="t-grade" />);
    const red0 = container.querySelector('feFuncR')!.getAttribute('tableValues')!.split(' ').map(Number);
    expect(red0[0]).toBeCloseTo(0, 3);
    expect(red0[red0.length - 1]).toBeCloseTo(1, 3);
    expect(container.querySelector('feColorMatrix')!.getAttribute('values')).toBe('1');
    rerender(<OxidizedGradeFilter progress={1} filterId="t-grade" />);
    const red1 = container.querySelector('feFuncR')!.getAttribute('tableValues')!.split(' ').map(Number);
    expect(red1).toEqual(settlementLostConfig.ramp.red.map((v) => Number(v.toFixed(4))));
    expect(container.querySelector('feColorMatrix')!.getAttribute('values')).toBe('0');
    expect(container.querySelector('filter')!.getAttribute('id')).toBe('t-grade');
  });
});
