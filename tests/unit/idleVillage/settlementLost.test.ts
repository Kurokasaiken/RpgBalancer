import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
  traceMinimalGameplay: vi.fn(),
}));

import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

describe('settlement lost — run-ending trigger', () => {
  beforeEach(() => {
    useMinimalGameplayStore.setState({ gameOverState: { isGameOver: false } });
  });

  it('sets gameOverState with reason settlement_lost and a real summary', () => {
    useMinimalGameplayStore.getState().triggerSettlementLost();

    const go = useMinimalGameplayStore.getState().gameOverState;
    expect(go.isGameOver).toBe(true);
    expect(go.reason).toBe('settlement_lost');
    expect(go.summary).toBeDefined();
    expect(typeof go.summary?.daysSurvived).toBe('number');
    expect(typeof go.summary?.residentsLost).toBe('number');
    expect(Array.isArray(go.summary?.finalRoster)).toBe(true);
    expect(typeof go.gameOverAt).toBe('number');
  });

  it('is idempotent — a second trigger does not overwrite the first', () => {
    useMinimalGameplayStore.getState().triggerSettlementLost();
    const firstAt = useMinimalGameplayStore.getState().gameOverState.gameOverAt;

    useMinimalGameplayStore.getState().triggerSettlementLost();

    expect(useMinimalGameplayStore.getState().gameOverState.gameOverAt).toBe(firstAt);
  });

  it('does not override an existing game over with a different reason', () => {
    useMinimalGameplayStore.setState({
      gameOverState: { isGameOver: true, reason: 'food_depleted', gameOverAt: 1 },
    });

    useMinimalGameplayStore.getState().triggerSettlementLost();

    expect(useMinimalGameplayStore.getState().gameOverState.reason).toBe('food_depleted');
  });

  it('resetGame clears the game over state (new run)', () => {
    useMinimalGameplayStore.getState().triggerSettlementLost();
    useMinimalGameplayStore.getState().resetGame();

    expect(useMinimalGameplayStore.getState().gameOverState.isGameOver).toBe(false);
  });
});
