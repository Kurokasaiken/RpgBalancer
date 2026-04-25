import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VillageSandboxHeader } from '../VillageSandboxHeader';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  RotateCcw: () => <span>Reset</span>,
}));

describe('VillageSandboxHeader', () => {
  it('renders title and resources', () => {
    render(
      <VillageSandboxHeader
        gold={100}
        food={50}
        population={8}
        dayCounter={3}
        phaseLabel="Phase"
        phaseIcon="☀️"
        cycleProgressFraction={0.25}
      />
    );

    expect(screen.getByText('Village Sandbox')).toBeInTheDocument();
    const header = screen.getByTestId('village-sandbox-header');
    const goldValues = within(header).getAllByTestId('summary-gold-value');
    const foodValues = within(header).getAllByTestId('summary-food-value');
    const populationValues = within(header).getAllByTestId('summary-population-value');
    expect(goldValues[0]).toHaveTextContent('100');
    expect(foodValues[0]).toHaveTextContent('50');
    expect(populationValues[0]).toHaveTextContent('8');
  });

  it('renders reset button and calls onReset when clicked', async () => {
    const user = userEvent.setup();
    const mockOnReset = vi.fn();

    render(
      <VillageSandboxHeader
        gold={0}
        food={0}
        population={0}
        dayCounter={1}
        phaseLabel="Phase"
        phaseIcon="☀️"
        cycleProgressFraction={0.5}
        onReset={mockOnReset}
      />
    );

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('does not render reset button when onReset is not provided', () => {
    render(
      <VillageSandboxHeader
        gold={0}
        food={0}
        population={0}
        dayCounter={1}
        phaseLabel="Phase"
        phaseIcon="☀️"
        cycleProgressFraction={0.5}
      />
    );

    expect(screen.queryByRole('button', { name: /Reset/i })).not.toBeInTheDocument();
  });
});
