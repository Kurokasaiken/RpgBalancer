import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinimalGameOverModal from '@/ui/idleVillage/components/MinimalGameOverModal';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { MinimalGameOverState, MinimalGameOverConfig } from '@/balancing/config/idleVillage/minimalConfig';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

describe('MinimalGameOverModal', () => {
  const mockConfig: MinimalGameOverConfig = {
    reasons: {
      food_depleted: {
        title: 'Scorte Esaurite',
        description: 'Le scorte di cibo sono terminate. Tutti i residenti hanno lasciato il villaggio.',
        restartButton: 'Ricomincia',
      },
      all_injured: {
        title: 'Tutti Feriti',
        description: 'Tutti i residenti sono feriti e non possono più lavorare. Il villaggio non può continuare.',
        restartButton: 'Ricomincia',
      },
      manual_reset: {
        title: 'Riavvio Manuale',
        description: 'Hai scelto di ricominciare il gioco.',
        restartButton: 'Ricomincia',
      },
    },
    statsLayout: {
      daysSurvived: { label: 'Giorni sopravvissuti', format: 'integer' },
      goldEarned: { label: 'Oro guadagnato', format: 'integer' },
      questsCompleted: { label: 'Quest completate', format: 'integer' },
      residentsLost: { label: 'Residenti persi', format: 'integer' },
    },
    modalTitle: 'Game Over',
    closeOnEscape: true,
    closeOnBackdropClick: false,
  };

  const mockGameOverState: MinimalGameOverState = {
    isGameOver: true,
    reason: 'food_depleted',
    summary: {
      daysSurvived: 15,
      goldEarned: 1250,
      questsCompleted: 3,
      residentsLost: 1,
      finalRoster: [
        { id: '1', name: 'Aurora', level: 2, isInjured: false },
        { id: '2', name: 'Kai', level: 1, isInjured: true },
      ],
    },
    gameOverAt: Date.now(),
  };

  const mockOnRestart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders modal when isOpen is true and gameOverState.isGameOver is true', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
          testId="test-modal"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Game Over')).toBeInTheDocument();
      expect(screen.getByText('Scorte Esaurite')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <MinimalGameOverModal
          isOpen={false}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not render modal when gameOverState.isGameOver is false', () => {
      const gameOverState = { ...mockGameOverState, isGameOver: false };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={gameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders correct reason messages based on gameOverState.reason', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Scorte Esaurite')).toBeInTheDocument();
      expect(screen.getByText('Le scorte di cibo sono terminate. Tutti i residenti hanno lasciato il villaggio.')).toBeInTheDocument();
    });

    it('renders statistics when summary is provided', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument(); // daysSurvived
      expect(screen.getByText('1250')).toBeInTheDocument(); // goldEarned
      expect(screen.getByText('3')).toBeInTheDocument(); // questsCompleted
      expect(screen.getByText('1')).toBeInTheDocument(); // residentsLost
    });

    it('does not render statistics when summary is not provided', () => {
      const gameOverState = { ...mockGameOverState, summary: undefined };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={gameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.queryByText('Statistiche Finali')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'game-over-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'game-over-description');
    });

    it('focuses the restart button on mount', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      const restartButton = screen.getByRole('button', { name: /ricomincia/i });
      expect(restartButton).toHaveFocus();
    });

    it('traps focus within modal', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      const restartButton = screen.getByRole('button', { name: /ricomincia/i });

      // Tab should keep focus within modal
      fireEvent.keyDown(restartButton, { key: 'Tab' });
      expect(restartButton).toHaveFocus();
    });

    it('closes modal on Escape key when closeOnEscape is true', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it('does not close modal on backdrop click when closeOnBackdropClick is false', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
          testId="test-modal"
        />
      );

      const backdrop = screen.getByTestId('test-modal');
      fireEvent.click(backdrop);

      expect(mockOnRestart).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('calls onRestart when restart button is clicked', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      const restartButton = screen.getByRole('button', { name: /ricomincia/i });
      fireEvent.click(restartButton);

      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it('emits telemetry event when restart is clicked', () => {
      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      const restartButton = screen.getByRole('button', { name: /ricomincia/i });
      fireEvent.click(restartButton);

      expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_gameplay_restart', {
        reason: 'food_depleted',
        daysSurvived: 15,
        goldEarned: 1250,
        questsCompleted: 3,
        residentsLost: 1,
        timestamp: expect.any(Number),
      });
    });

    it('closes modal on backdrop click when closeOnBackdropClick is true', () => {
      const configWithBackdropClick = {
        ...mockConfig,
        closeOnBackdropClick: true,
      };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={configWithBackdropClick}
          onRestart={mockOnRestart}
          testId="test-modal"
        />
      );

      const backdrop = screen.getByTestId('test-modal');
      fireEvent.click(backdrop);

      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration', () => {
    it('uses manual_reset reason when gameOverState.reason is undefined', () => {
      const gameOverState = { ...mockGameOverState, reason: undefined };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={gameOverState}
          config={mockConfig}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Riavvio Manuale')).toBeInTheDocument();
      expect(screen.getByText('Hai scelto di ricominciare il gioco.')).toBeInTheDocument();
    });

    it('uses modalTitle from config', () => {
      const configWithCustomTitle = {
        ...mockConfig,
        modalTitle: 'Partita Terminata',
      };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={configWithCustomTitle}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Partita Terminata')).toBeInTheDocument();
    });

    it('uses custom restart button text from reason config', () => {
      const configWithCustomButton = {
        ...mockConfig,
        reasons: {
          ...mockConfig.reasons,
          food_depleted: {
            ...mockConfig.reasons.food_depleted,
            restartButton: 'Nuova Partita',
          },
        },
      };

      render(
        <MinimalGameOverModal
          isOpen={true}
          gameOverState={mockGameOverState}
          config={configWithCustomButton}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByRole('button', { name: 'Nuova Partita' })).toBeInTheDocument();
    });
  });
});
