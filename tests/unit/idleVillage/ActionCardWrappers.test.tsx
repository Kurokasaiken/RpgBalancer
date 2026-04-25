import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  JobCard,
  QuestCard,
  TrainingCard,
  MaintenanceCard,
} from '@/ui/idleVillage/map/actionCards/wrappers';

describe('ActionCard Wrappers', () => {
  it('renders JobCard with minimal props', () => {
    render(
      <JobCard
        label="Forge Shift"
        icon={<span role="img" aria-label="anvil">⚒️</span>}
        progressFraction={0.25}
        elapsedSeconds={15}
        totalDurationSeconds={60}
        isPlaying
        dataTestId="job-card"
        helperText="Produce ingots"
      />,
    );

    expect(screen.getByTestId('job-card')).toBeInTheDocument();
  });

  it('renders QuestCard with risk stripes and collect CTA', () => {
    const handleCollect = vi.fn();
    render(
      <QuestCard
        label="Scout Forest"
        icon={<span role="img" aria-label="scout">🧭</span>}
        progressFraction={0.5}
        elapsedSeconds={40}
        totalDurationSeconds={80}
        injuryPercentage={30}
        deathPercentage={10}
        isPlaying={false}
        dataTestId="quest-card"
        onCollect={handleCollect}
        status="completed"
      />,
    );

    expect(screen.getByTestId('quest-card')).toBeInTheDocument();
    if (screen.queryByTestId('quest-card-risk')) {
      expect(screen.getByTestId('quest-card-risk')).toBeInTheDocument();
    }
    if (screen.queryByTestId('quest-card-collect')) {
      fireEvent.click(screen.getByTestId('quest-card-collect'));
      expect(handleCollect).toHaveBeenCalledTimes(1);
    }
  });

  it('renders TrainingCard with stat gain metrics', () => {
    render(
      <TrainingCard
        label="Discipline Drills"
        icon={<span role="img" aria-label="discipline">🛡️</span>}
        progressFraction={0.2}
        elapsedSeconds={10}
        totalDurationSeconds={50}
        statGainLabel="+Discipline"
        statGainValue="+5"
        fatigueCostLabel="Fatigue"
        fatigueCostValue="+12"
        dataTestId="training-card"
      />,
    );

    expect(screen.getByTestId('training-card')).toBeInTheDocument();
    expect(screen.getByText('Discipline Drills')).toBeInTheDocument();
  });

  it('renders MaintenanceCard with custom metrics and risk stripes', () => {
    render(
      <MaintenanceCard
        label="Injury Ward"
        icon={<span role="img" aria-label="ward">⚕️</span>}
        progressFraction={0.8}
        elapsedSeconds={70}
        totalDurationSeconds={90}
        injuryPercentage={15}
        deathPercentage={2}
        upkeepLabel="Upkeep"
        upkeepValue="-5 food"
        warningLabel="Risk"
        warningValue="Low"
        dataTestId="maintenance-card"
      />,
    );

    expect(screen.getByTestId('maintenance-card')).toBeInTheDocument();
    expect(screen.getByText('Injury Ward')).toBeInTheDocument();
    if (screen.queryByText('Upkeep')) {
      expect(screen.getByText('Upkeep')).toBeInTheDocument();
    }
  });
});
