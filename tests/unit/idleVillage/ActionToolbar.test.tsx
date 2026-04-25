/**
 * ActionToolbar RTL Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActionToolbar from '@/ui/idleVillage/components/minimal/ActionToolbar';
import type { MinimalUIActionPanel } from '@/balancing/config/idleVillage/minimalConfig';

// Mock minimal config for testing
const mockActionPanel: MinimalUIActionPanel = {
  buyFood: {
    label: 'Compra Cibo',
    tooltip: 'Acquista cibo per i residenti',
    iconToken: '🍖',
    defaultQuantity: 5,
  },
  startQuestDemo: {
    label: 'Avvia Quest Demo',
    tooltip: 'Avvia una quest dimostrativa',
    iconToken: '⚔️',
  },
};

const mockUIConfig = {
  tokens: {
    accentHex: '#c9a227',
    heroBackground: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
    cardRadiusPx: 24,
    dangerHex: '#ef4444',
  },
  errorMessages: {
    insufficientGold: 'Oro insufficiente per comprare cibo',
    residentBusy: 'Il residente è già occupato',
    questLocked: 'Quest bloccata o requisiti non soddisfatti',
  },
};

describe('ActionToolbar', () => {
  const mockOnBuyFood = vi.fn();
  const mockOnStartQuest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders action buttons with correct labels and tooltips', () => {
    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });
    const startQuestButton = screen.getByRole('button', { name: /avvia quest demo/i });

    expect(buyFoodButton).toBeInTheDocument();
    expect(startQuestButton).toBeInTheDocument();
    expect(buyFoodButton).toHaveAttribute('title', mockActionPanel.buyFood.tooltip);
    expect(startQuestButton).toHaveAttribute('title', mockActionPanel.startQuestDemo.tooltip);
  });

  it('renders icon tokens in buttons', () => {
    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    expect(screen.getByText('🍖')).toBeInTheDocument();
    expect(screen.getByText('⚔️')).toBeInTheDocument();
  });

  it('calls onBuyFood when buy food button is clicked', async () => {
    mockOnBuyFood.mockResolvedValue({ success: true });

    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });
    fireEvent.click(buyFoodButton);

    await waitFor(() => {
      expect(mockOnBuyFood).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onStartQuest when start quest button is clicked', async () => {
    mockOnStartQuest.mockResolvedValue({ success: true });

    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    const startQuestButton = screen.getByRole('button', { name: /avvia quest demo/i });
    fireEvent.click(startQuestButton);

    await waitFor(() => {
      expect(mockOnStartQuest).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        disabled={true}
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });
    const startQuestButton = screen.getByRole('button', { name: /avvia quest demo/i });

    expect(buyFoodButton).toBeDisabled();
    expect(startQuestButton).toBeDisabled();
  });

  it('shows status message when provided', () => {
    const statusMessage = 'Errore: Oro insufficiente';

    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        statusMessage={statusMessage}
        uiConfig={mockUIConfig}
      />
    );

    expect(screen.getByText(statusMessage)).toBeInTheDocument();
  });

  it('does not show status message when empty', () => {
    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        statusMessage=""
        uiConfig={mockUIConfig}
      />
    );

    // Should not find any status message element
    const statusElements = screen.queryAllByRole('status');
    expect(statusElements.length).toBe(0);
  });

  it('shows processing indicator when action is in progress', async () => {
    mockOnBuyFood.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });
    fireEvent.click(buyFoodButton);

    // Should show processing indicator
    expect(screen.getByText('Elaborazione...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Elaborazione...')).not.toBeInTheDocument();
    });
  });

  it('prevents multiple clicks while processing', async () => {
    mockOnBuyFood.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });

    // Click multiple times quickly
    fireEvent.click(buyFoodButton);
    fireEvent.click(buyFoodButton);
    fireEvent.click(buyFoodButton);

    // Should only be called once
    await waitFor(() => {
      expect(mockOnBuyFood).toHaveBeenCalledTimes(1);
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <ActionToolbar
        actionPanel={mockActionPanel}
        onBuyFood={mockOnBuyFood}
        onStartQuest={mockOnStartQuest}
        statusMessage="Test message"
        uiConfig={mockUIConfig}
      />
    );

    const buyFoodButton = screen.getByRole('button', { name: /compra cibo/i });
    const startQuestButton = screen.getByRole('button', { name: /avvia quest demo/i });

    expect(buyFoodButton).toHaveAttribute('aria-label', `${mockActionPanel.buyFood.label}: ${mockActionPanel.buyFood.tooltip}`);
    expect(startQuestButton).toHaveAttribute('aria-label', `${mockActionPanel.startQuestDemo.label}: ${mockActionPanel.startQuestDemo.tooltip}`);

    // Status message should be announced
    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });
});
