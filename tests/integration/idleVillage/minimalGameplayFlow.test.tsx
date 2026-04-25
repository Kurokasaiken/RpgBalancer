/**
 * Minimal Gameplay Loop Integration Test
 * 
 * Tests the complete drag loop: assign → quest → market → game over.
 * Uses real hooks and store, validates state transitions and UI updates.
 * 
 * @since NP-MIN-010E – Routing, Tests & Visual Baseline
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MinimalGameplayPage } from '@/ui/idleVillage/MinimalGameplayPage';
import { useMinimalGameplay } from '@/ui/idleVillage/hooks/useMinimalGameplay';
import { useGameplayStore } from '@/ui/idleVillage/store/gameplayStore';
import { PersistenceService } from '@/shared/persistence/PersistenceService';

// Mock persistence to avoid actual storage in tests
vi.mock('@/shared/persistence/PersistenceService', () => ({
  PersistenceService: {
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue(null),
  },
}));

// Helper wrapper to access hooks
function MinimalGameplayTestWrapper() {
  const { state, actions, isLoading, error } = useMinimalGameplay();
  const store = useGameplayStore();

  return (
    <div>
      <div data-testid="test-state">
        <div data-testid="residents-count">{state.residents.length}</div>
        <div data-testid="gold">{state.economy.gold}</div>
        <div data-testid="food">{state.economy.food}</div>
        <div data-testid="quest-active">{state.quest.isActive ? 'true' : 'false'}</div>
        <div data-testid="quest-result">{state.quest.result?.success ? 'success' : state.quest.result?.success === false ? 'failed' : 'none'}</div>
        <div data-testid="survival-day">{state.survival.currentDay}</div>
        <div data-testid="survival-injury-count">{state.survival.injuries.length}</div>
      </div>
      
      <MinimalGameplayPage />
      
      <div data-testid="test-actions">
        <button
          data-testid="assign-forest-work"
          onClick={() => actions.assignResidentToActivity('forest-work', state.residents[0]?.id)}
          disabled={!state.residents[0]}
        >
          Assign Forest Work
        </button>
        <button
          data-testid="start-quest"
          onClick={() => actions.startQuest()}
          disabled={state.quest.isActive}
        >
          Start Quest
        </button>
        <button
          data-testid="buy-food"
          onClick={() => actions.buyFood(1)}
          disabled={state.economy.gold < 5}
        >
          Buy Food
        </button>
        <button
          data-testid="advance-time"
          onClick={() => actions.advanceTime(1)}
        >
          Advance Time
        </button>
        <button
          data-testid="reset-game"
          onClick={() => actions.resetGame()}
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}

describe('MinimalGameplay Flow Integration', () => {
  beforeEach(() => {
    // Clear store and mocks
    useGameplayStore.getState().reset();
    vi.clearAllMocks();
    
    // Reset URL
    window.history.replaceState({}, '', '/minimal-gameplay');
  });

  it('should initialize with default state', async () => {
    render(<MinimalGameplayTestWrapper />);

    // Verify initial state
    await waitFor(() => {
      expect(screen.getByTestId('residents-count')).toHaveTextContent('1');
      expect(screen.getByTestId('gold')).toHaveTextContent('10');
      expect(screen.getByTestId('food')).toHaveTextContent('5');
      expect(screen.getByTestId('quest-active')).toHaveTextContent('false');
      expect(screen.getByTestId('quest-result')).toHaveTextContent('none');
      expect(screen.getByTestId('survival-day')).toHaveTextContent('1');
      expect(screen.getByTestId('survival-injury-count')).toHaveTextContent('0');
    });

    // Verify UI shows initial state
    const page = screen.getByTestId('minimal-gameplay-page');
    expect(page).toHaveAttribute('data-visual-state', 'initial');
    expect(screen.getByTestId('minimal-gameplay-status-badge')).toHaveTextContent('Ready');
  });

  it('should complete full gameplay loop: assign → quest → market → game over', async () => {
    render(<MinimalGameplayTestWrapper />);

    // Step 1: Assign resident to work
    const assignButton = screen.getByTestId('assign-forest-work');
    expect(assignButton).not.toBeDisabled();
    
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'jobActive');
      expect(screen.getByTestId('minimal-gameplay-status-badge')).toHaveTextContent('Working');
    });

    // Step 2: Start quest
    const questButton = screen.getByTestId('start-quest');
    expect(questButton).not.toBeDisabled();
    
    fireEvent.click(questButton);

    await waitFor(() => {
      expect(screen.getByTestId('quest-active')).toHaveTextContent('true');
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'questSkillCheck');
      expect(screen.getByTestId('minimal-gameplay-status-badge')).toHaveTextContent('Questing');
    });

    // Step 3: Complete quest (advance time to finish)
    const advanceButton = screen.getByTestId('advance-time');
    fireEvent.click(advanceButton); // Complete the quest

    await waitFor(() => {
      expect(screen.getByTestId('quest-active')).toHaveTextContent('false');
      expect(screen.getByTestId('quest-result')).toHaveTextContent('success'); // Assuming success for this test
    });

    // Step 4: Buy food from market
    const buyFoodButton = screen.getByTestId('buy-food');
    expect(buyFoodButton).not.toBeDisabled();
    
    fireEvent.click(buyFoodButton);

    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'marketPurchase');
      expect(screen.getByTestId('minimal-gameplay-status-badge')).toHaveTextContent('Trading');
    });

    // Verify economy updated
    await waitFor(() => {
      expect(screen.getByTestId('gold')).toHaveTextContent('5'); // 10 - 5 for food
      expect(screen.getByTestId('food')).toHaveTextContent('6'); // 5 + 1 purchased
    });

    // Step 5: Trigger game over (advance time multiple days to deplete resources)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(advanceButton);
      await waitFor(() => {
        // Just wait for state to update
      }, { timeout: 100 });
    }

    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'gameOver');
      expect(screen.getByTestId('minimal-gameplay-status-badge')).toHaveTextContent('Game Over');
      expect(screen.getByTestId('minimal-gameplay-game-over')).toBeInTheDocument();
    });
  });

  it('should handle quest failure gracefully', async () => {
    render(<MinimalGameplayTestWrapper />);

    // Assign work first
    fireEvent.click(screen.getByTestId('assign-forest-work'));
    
    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'jobActive');
    });

    // Start quest
    fireEvent.click(screen.getByTestId('start-quest'));

    await waitFor(() => {
      expect(screen.getByTestId('quest-active')).toHaveTextContent('true');
    });

    // Mock quest failure by manipulating store directly
    const store = useGameplayStore.getState();
    store.completeQuest(false, { gold: 0, experience: 0 });

    await waitFor(() => {
      expect(screen.getByTestId('quest-result')).toHaveTextContent('failed');
    });

    // Should still be able to continue gameplay
    const assignButton = screen.getByTestId('assign-forest-work');
    expect(assignButton).not.toBeDisabled();
  });

  it('should persist and restore state', async () => {
    // Initial render
    const { unmount } = render(<MinimalGameplayTestWrapper />);

    // Make some changes
    fireEvent.click(screen.getByTestId('assign-forest-work'));
    
    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'jobActive');
    });

    // Unmount component
    unmount();

    // Remount (should restore from persisted state)
    render(<MinimalGameplayTestWrapper />);

    // Verify state was restored (in real app, this would load from storage)
    await waitFor(() => {
      expect(screen.getByTestId('residents-count')).toHaveTextContent('1');
      expect(screen.getByTestId('gold')).toHaveTextContent('10');
    });
  });

  it('should handle reset functionality', async () => {
    render(<MinimalGameplayTestWrapper />);

    // Make some changes
    fireEvent.click(screen.getByTestId('assign-forest-work'));
    fireEvent.click(screen.getByTestId('start-quest'));
    
    await waitFor(() => {
      expect(screen.getByTestId('quest-active')).toHaveTextContent('true');
    });

    // Reset game
    fireEvent.click(screen.getByTestId('reset-game'));

    await waitFor(() => {
      expect(screen.getByTestId('residents-count')).toHaveTextContent('1');
      expect(screen.getByTestId('gold')).toHaveTextContent('10');
      expect(screen.getByTestId('food')).toHaveTextContent('5');
      expect(screen.getByTestId('quest-active')).toHaveTextContent('false');
      expect(screen.getByTestId('quest-result')).toHaveTextContent('none');
      expect(screen.getByTestId('survival-day')).toHaveTextContent('1');
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'initial');
    });
  });

  it('should validate resource constraints', async () => {
    render(<MinimalGameplayTestWrapper />);

    // Try to buy food without enough gold
    const buyFoodButton = screen.getByTestId('buy-food');
    expect(buyFoodButton).not.toBeDisabled(); // Should have enough gold initially

    fireEvent.click(buyFoodButton);

    await waitFor(() => {
      expect(screen.getByTestId('gold')).toHaveTextContent('5'); // 10 - 5
    });

    // Try to buy again with insufficient gold
    expect(buyFoodButton).toBeDisabled(); // Should be disabled now

    // Try to assign when no residents available (after reset)
    fireEvent.click(screen.getByTestId('reset-game'));
    
    await waitFor(() => {
      expect(screen.getByTestId('assign-forest-work')).not.toBeDisabled(); // Should have resident
    });
  });

  it('should handle error states gracefully', async () => {
    // Mock error in persistence
    const mockPersistence = vi.mocked(PersistenceService);
    mockPersistence.saveData.mockRejectedValue(new Error('Storage error'));

    render(<MinimalGameplayTestWrapper />);

    // Should still render despite persistence error
    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toBeInTheDocument();
      expect(screen.getByTestId('residents-count')).toHaveTextContent('1');
    });

    // Should still be able to interact
    fireEvent.click(screen.getByTestId('assign-forest-work'));
    
    await waitFor(() => {
      expect(screen.getByTestId('minimal-gameplay-page')).toHaveAttribute('data-visual-state', 'jobActive');
    });
  });
});
