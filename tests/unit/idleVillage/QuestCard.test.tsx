import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';

describe('QuestCard', () => {
  it('renders ActionCardBase children (progress bar, halo and risk stripes)', () => {
    render(
      <QuestCard
        label="Rat Hunt"
        icon="🐀"
        progressFraction={0.5}
        elapsedSeconds={50}
        totalDurationSeconds={100}
        injuryPercentage={30}
        deathPercentage={10}
      />,
    );

    expect(screen.getByTestId('quest-action-card')).toBeInTheDocument();
    expect(screen.getByText('QUEST')).toBeInTheDocument();
    expect(screen.getByTestId('action-progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('quest-risk-stripes')).toBeInTheDocument();
    expect(screen.getByTestId('quest-injury-risk')).toBeInTheDocument();
    expect(screen.getByTestId('quest-death-risk')).toBeInTheDocument();
  });

  it('renders countdown from elapsed/total duration', () => {
    render(
      <QuestCard
        label="Rat Hunt"
        icon="🐀"
        progressFraction={0.5}
        elapsedSeconds={50}
        totalDurationSeconds={100}
      />,
    );

    expect(screen.getByText('00:50')).toBeInTheDocument();
  });

  it('clamps injury + death risk stripes to 100% total width', () => {
    render(
      <QuestCard
        label="Rat Hunt"
        icon="🐀"
        progressFraction={0}
        elapsedSeconds={0}
        totalDurationSeconds={100}
        injuryPercentage={80}
        deathPercentage={50}
      />,
    );

    const injuryRisk = screen.getByTestId('quest-injury-risk');
    const deathRisk = screen.getByTestId('quest-death-risk');

    const injuryWidth = parseFloat(injuryRisk.style.width);
    const deathWidth = parseFloat(deathRisk.style.width);

    expect(injuryWidth).toBeCloseTo(61.54, 2);
    expect(deathWidth).toBeCloseTo(38.46, 2);
    expect(injuryWidth + deathWidth).toBeCloseTo(100, 5);
  });

  it('shows only death stripe when injury is zero', () => {
    render(
      <QuestCard
        label="Rat Hunt"
        icon="🐀"
        progressFraction={0}
        elapsedSeconds={0}
        totalDurationSeconds={100}
        injuryPercentage={0}
        deathPercentage={25}
      />,
    );

    expect(screen.queryByTestId('quest-injury-risk')).not.toBeInTheDocument();
    expect(screen.getByTestId('quest-death-risk')).toHaveStyle('width: 25%');
  });
});
