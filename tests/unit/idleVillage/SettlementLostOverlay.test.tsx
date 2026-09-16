import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettlementLostOverlay from '@/ui/idleVillage/components/SettlementLostOverlay';
import type { MinimalGameOverState } from '@/store/useMinimalGameplay';

let mockGameOverState: MinimalGameOverState = { isGameOver: false };
const mockResetGame = vi.fn();

vi.mock('@/store/useMinimalGameplay', () => ({
  useMinimalGameplayStore: (selector: (s: unknown) => unknown) =>
    selector({
      gameOverState: mockGameOverState,
      resetGame: mockResetGame,
    }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Skip the iris timing so the verdict is visible immediately.
vi.mock('@/ui/idleVillage/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

describe('SettlementLostOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameOverState = { isGameOver: false };
  });

  it('renders nothing while the run is ongoing', () => {
    render(<SettlementLostOverlay />);
    expect(screen.queryByTestId('settlement-lost-overlay')).not.toBeInTheDocument();
  });

  it('renders nothing for a different game over reason', () => {
    mockGameOverState = { isGameOver: true, reason: 'food_depleted' };
    render(<SettlementLostOverlay />);
    expect(screen.queryByTestId('settlement-lost-overlay')).not.toBeInTheDocument();
  });

  it('shows the verdict card on settlement_lost', () => {
    mockGameOverState = {
      isGameOver: true,
      reason: 'settlement_lost',
      summary: {
        daysSurvived: 12,
        goldEarned: 340,
        questsCompleted: 2,
        residentsLost: 3,
        finalRoster: [{ id: 'r1', name: 'Kaelen', level: 4, isInjured: true }],
      },
    };
    render(<SettlementLostOverlay />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('world.settlementLost.title')).toBeInTheDocument();
    expect(screen.getByText('world.settlementLost.losses.walls')).toBeInTheDocument();
    // Real stats from the domain summary, not config fiction.
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('blocks dismissal: Escape does not close the verdict', () => {
    mockGameOverState = { isGameOver: true, reason: 'settlement_lost' };
    render(<SettlementLostOverlay />);

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mockResetGame).not.toHaveBeenCalled();
  });

  it('CTA acknowledges the verdict and resets the run', () => {
    mockGameOverState = { isGameOver: true, reason: 'settlement_lost' };
    render(<SettlementLostOverlay />);

    fireEvent.click(screen.getByRole('button', { name: 'world.settlementLost.cta' }));

    expect(mockResetGame).toHaveBeenCalledTimes(1);
  });
});
