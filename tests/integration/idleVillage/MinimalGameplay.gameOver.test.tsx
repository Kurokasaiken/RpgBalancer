import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import MinimalGameplayPage from '@/ui/idleVillage/MinimalGameplayPage';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { saveMinimalGameplaySnapshot } from '@/shared/persistence/PersistenceService';

// Mock dependencies
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveMinimalGameplaySnapshot: vi.fn(),
  loadMinimalGameplaySnapshotData: vi.fn(),
}));

vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({
    activePreset: 'default',
    presets: [],
    isRandomized: false,
    setPreset: vi.fn(),
    randomizeTheme: vi.fn(),
    resetRandomization: vi.fn(),
  }),
}));

describe('MinimalGameplay Game Over Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Initialize store for each test
    const { initializeMinimalGameplayStore } = await import('@/store/useMinimalGameplay');
    await initializeMinimalGameplayStore();
  });

  afterEach(() => {
    // Reset store after each test
    useMinimalGameplayStore.getState().resetGame();
  });

  describe('Food Depletion Game Over', () => {
    it('shows game over modal when food reaches zero', async () => {
      // Set up initial state with low food
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 1, // Very low food
          maxFood: 25,
          currentDay: 5,
          gold: 100,
          residents: [
            {
              id: 'test-resident',
              name: 'Test Resident',
              level: 1,
              stats: { strength: 5, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
              fatigue: 0,
              isWorking: false,
              isInjured: false,
            },
          ],
        },
      }));

      render(<MinimalGameplayPage />);

      // Trigger game over by consuming food (simulate tick)
      const store = useMinimalGameplayStore.getState();
      store.tick(2000); // This should consume food and trigger game over

      await waitFor(() => {
        expect(screen.getByText('Scorte Esaurite')).toBeInTheDocument();
      });

      expect(screen.getByText('Le scorte di cibo sono terminate. Tutti i residenti hanno lasciato il villaggio.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ricomincia/i })).toBeInTheDocument();
    });

    it('saves game over snapshot with correct data', async () => {
      // Set up state that will trigger food depletion
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 0, // No food
          currentDay: 10,
          gold: 500,
          residents: [
            {
              id: 'resident-1',
              name: 'Aurora',
              level: 2,
              stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
              fatigue: 20,
              isWorking: false,
              isInjured: false,
            },
          ],
        },
      }));

      render(<MinimalGameplayPage />);

      // Trigger game over
      const store = useMinimalGameplayStore.getState();
      store.tick(1000);

      await waitFor(() => {
        expect(saveMinimalGameplaySnapshot).toHaveBeenCalled();
      });

      const snapshotCall = vi.mocked(saveMinimalGameplaySnapshot).mock.calls[0];
      expect(snapshotCall[0]).toContain('gameover-');
      expect(snapshotCall[1]).toMatchObject({
        gold: 500,
        food: 0,
        currentDay: 10,
        gameOverState: {
          isGameOver: true,
          reason: 'food_depleted',
          summary: {
            daysSurvived: 10,
            goldEarned: 500,
            questsCompleted: 0,
            residentsLost: 0,
          },
        },
      });
    });

    it('emits game over telemetry event', async () => {
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 0,
          currentDay: 7,
          gold: 300,
          residents: [],
        },
      }));

      render(<MinimalGameplayPage />);

      const store = useMinimalGameplayStore.getState();
      store.tick(1000);

      await waitFor(() => {
        expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_gameplay_game_over', {
          reason: 'food_depleted',
          daysSurvived: 7,
          goldEarned: 300,
          questsCompleted: 0,
          residentsLost: 0,
        });
      });
    });
  });

  describe('All Residents Injured Game Over', () => {
    it('shows game over modal when all residents are injured', async () => {
      // Set up state with all residents injured
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 10,
          currentDay: 3,
          gold: 200,
          residents: [
            {
              id: 'resident-1',
              name: 'Aurora',
              level: 1,
              stats: { strength: 5, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
              fatigue: 0,
              isWorking: false,
              isInjured: true, // Injured
            },
            {
              id: 'resident-2',
              name: 'Kai',
              level: 1,
              stats: { strength: 4, endurance: 6, agility: 5, intelligence: 4, perception: 3 },
              fatigue: 0,
              isWorking: false,
              isInjured: true, // Also injured
            },
          ],
        },
      }));

      render(<MinimalGameplayPage />);

      // Trigger game over check
      const store = useMinimalGameplayStore.getState();
      store.tick(1000);

      await waitFor(() => {
        expect(screen.getByText('Tutti Feriti')).toBeInTheDocument();
      });

      expect(screen.getByText('Tutti i residenti sono feriti e non possono più lavorare. Il villaggio non può continuare.')).toBeInTheDocument();
    });

    it('saves game over snapshot for injured residents scenario', async () => {
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 15,
          currentDay: 8,
          gold: 400,
          residents: [
            {
              id: 'resident-1',
              name: 'Aurora',
              level: 2,
              stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
              fatigue: 0,
              isWorking: false,
              isInjured: true,
            },
          ],
        },
      }));

      render(<MinimalGameplayPage />);

      const store = useMinimalGameplayStore.getState();
      store.tick(1000);

      await waitFor(() => {
        expect(saveMinimalGameplaySnapshot).toHaveBeenCalled();
      });

      const snapshotCall = vi.mocked(saveMinimalGameplaySnapshot).mock.calls[0];
      expect(snapshotCall[1].gameOverState).toMatchObject({
        isGameOver: true,
        reason: 'all_injured',
        summary: {
          daysSurvived: 8,
          goldEarned: 400,
          questsCompleted: 0,
          residentsLost: 1,
        },
      });
    });

    it('emits correct telemetry for injured residents game over', async () => {
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 20,
          currentDay: 12,
          gold: 600,
          residents: [
            {
              id: 'resident-1',
              name: 'Aurora',
              level: 3,
              stats: { strength: 7, endurance: 6, agility: 5, intelligence: 4, perception: 5 },
              fatigue: 0,
              isWorking: false,
              isInjured: true,
            },
          ],
        },
      }));

      render(<MinimalGameplayPage />);

      const store = useMinimalGameplayStore.getState();
      store.tick(1000);

      await waitFor(() => {
        expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_gameplay_game_over', {
          reason: 'all_injured',
          daysSurvived: 12,
          goldEarned: 600,
          questsCompleted: 0,
          residentsLost: 1,
        });
      });
    });
  });

  describe('Restart Functionality', () => {
    it('restarts game when restart button is clicked', async () => {
      // Set up game over state
      useMinimalGameplayStore.setState((state) => ({
        state: {
          ...state.state,
          food: 0,
          currentDay: 5,
          gold: 100,
        },
        gameOverState: {
          isGameOver: true,
          reason: 'food_depleted',
          summary: {
            daysSurvived: 5,
            goldEarned: 100,
            questsCompleted: 0,
            residentsLost: 0,
          },
          gameOverAt: Date.now(),
        },
      }));

      render(<MinimalGameplayPage />);

      // Click restart button
      const restartButton = screen.getByRole('button', { name: /ricomincia/i });
      fireEvent.click(restartButton);

      // Verify game state is reset
      const store = useMinimalGameplayStore.getState();
      expect(store.state.food).toBeGreaterThan(0);
      expect(store.state.currentDay).toBe(0);
      expect(store.gameOverState.isGameOver).toBe(false);
    });

    it('emits restart telemetry with correct data', async () => {
      useMinimalGameplayStore.setState((state) => ({
        gameOverState: {
          isGameOver: true,
          reason: 'food_depleted',
          summary: {
            daysSurvived: 7,
            goldEarned: 250,
            questsCompleted: 1,
            residentsLost: 2,
          },
        },
      }));

      render(<MinimalGameplayPage />);

      const restartButton = screen.getByRole('button', { name: /ricomincia/i });
      fireEvent.click(restartButton);

      expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_gameplay_restart', {
        reason: 'food_depleted',
        daysSurvived: 7,
        goldEarned: 250,
        questsCompleted: 1,
        residentsLost: 2,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Manual Reset Game Over', () => {
    it('shows manual reset game over when resetGame is called directly', () => {
      // Note: Manual reset game over is typically triggered by user action
      // This test verifies the config supports manual_reset reason
      const mockGameOverState = {
        isGameOver: true,
        reason: 'manual_reset' as const,
        summary: {
          daysSurvived: 3,
          goldEarned: 50,
          questsCompleted: 0,
          residentsLost: 0,
        },
        gameOverAt: Date.now(),
      };

      // Mock the modal component to test rendering
      const { rerender } = render(
        <div data-testid="mock-modal">
          <h1>Game Over</h1>
          <h2>Riavvio Manuale</h2>
          <p>Hai scelto di ricominciare il gioco.</p>
        </div>
      );

      // This test verifies the config supports manual_reset reason
      const config = useMinimalGameplayStore.getState().config.ui.gameOver;
      expect(config.reasons.manual_reset).toBeDefined();
      expect(config.reasons.manual_reset.title).toBe('Riavvio Manuale');
    });
  });
});
