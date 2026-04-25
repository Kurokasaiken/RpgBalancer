import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ResourcePanel from '../ResourcePanel';
import type { SummaryStripProps } from '../SummaryStrip';

vi.mock('../SummaryStrip', () => {
  const MockSummaryStrip = ({ gold, food, population, className = '' }: SummaryStripProps) => (
    <div data-testid="summary-strip" data-class={className}>
      <span data-field="gold">{gold}</span>
      <span data-field="food">{food}</span>
      <span data-field="population">{population}</span>
    </div>
  );

  return { default: MockSummaryStrip };
});

describe('ResourcePanel', () => {
  it('renders legacy resource values and rates', () => {
    render(
      <ResourcePanel
        gold={200}
        food={80}
        population={15}
        goldRate={5}
        foodRate={-2}
        populationRate={0.5}
      />
    );

    expect(screen.getByTestId('resource-value-gold')).toHaveTextContent('200');
    expect(screen.getByTestId('resource-value-food')).toHaveTextContent('80');
    expect(screen.getByTestId('resource-value-population')).toHaveTextContent('15');

    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('+0.5')).toBeInTheDocument();
  });

  it('renders resources section title', () => {
    render(
      <ResourcePanel
        gold={0}
        food={0}
        population={0}
      />
    );

    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ResourcePanel
        gold={0}
        food={0}
        population={0}
        className="custom-panel"
      />
    );

    const panel = screen.getByTestId('resource-panel');
    expect(panel).toHaveClass('custom-panel');
  });

  it('shows SummaryStrip at bottom', () => {
    render(
      <ResourcePanel
        gold={100}
        food={50}
        population={10}
      />
    );

    // Check that SummaryStrip is rendered with the same values
    const summaryStrip = screen.getByTestId('summary-strip');
    expect(summaryStrip).toBeInTheDocument();
    expect(within(summaryStrip).getByText('100')).toBeInTheDocument();
    expect(within(summaryStrip).getByText('50')).toBeInTheDocument();
    expect(within(summaryStrip).getByText('10')).toBeInTheDocument();
  });

  it('renders config-driven items with icons and deltas', () => {
    render(
      <ResourcePanel
        title="Village Pulse"
        items={[
          { id: 'mana', label: 'Mana', icon: '✨', value: 42, delta: 3, accentClass: 'text-indigo-200' },
          { id: 'ore', label: 'Ore', icon: '⛏️', value: 18, delta: -2, accentClass: 'text-emerald-200' },
        ]}
      />
    );

    const panel = screen.getByTestId('resource-panel');
    expect(within(panel).getByText('Village Pulse')).toBeVisible();

    const manaCard = within(panel).getByText('Mana').closest('article');
    expect(manaCard).toBeTruthy();
    expect(within(manaCard as HTMLElement).getByText('✨')).toBeVisible();
    expect(within(manaCard as HTMLElement).getByText('42')).toBeVisible();
    expect(within(manaCard as HTMLElement).getByText('+3')).toBeVisible();

    const oreCard = within(panel).getByText('Ore').closest('article');
    expect(oreCard).toBeTruthy();
    expect(within(oreCard as HTMLElement).getByText('⛏️')).toBeVisible();
    expect(within(oreCard as HTMLElement).getByText('18')).toBeVisible();
    expect(within(oreCard as HTMLElement).getByText('-2')).toBeVisible();

    expect(screen.queryByTestId('summary-strip')).not.toBeInTheDocument();
  });
});
