import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestAssignmentPreview } from '@/ui/idleVillage/components/QuestAssignmentPreview';
import type { QuestAssignmentPreviewResult } from '@/ui/idleVillage/hooks/useQuestAssignmentPreview';
import type { OutcomeDistribution, QuestOutcome } from '@/engine/game/idleVillage/QuestPowerEngine';

const emptyDistribution: OutcomeDistribution = {
  perfect: 0,
  success: 0,
  partial: 0,
  fail: 0,
  deadly: 0,
};

const makePreview = (overrides: Partial<QuestAssignmentPreviewResult> = {}): QuestAssignmentPreviewResult => ({
  partyPower: 10,
  questDifficulty: 20,
  powerRatio: 0.5,
  distribution: emptyDistribution,
  projectedDeathChance: 5,
  projectedInjuryChance: 15,
  projectedRewardMultiplier: 1.25,
  canEmbark: true,
  blockingReasons: [],
  ...overrides,
});

describe('QuestAssignmentPreview', () => {
  it('renders death, injury and reward preview', () => {
    render(<QuestAssignmentPreview preview={makePreview()} />);

    expect(screen.getByTestId('quest-assignment-preview')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('1.25×')).toBeInTheDocument();
    expect(screen.getByText('Preview Assegnazione')).toBeInTheDocument();
  });

  it('renders blocking reasons when embark is not allowed', () => {
    render(
      <QuestAssignmentPreview
        preview={makePreview({
          canEmbark: false,
          blockingReasons: ['Manca un guerriero'],
          projectedDeathChance: 25,
        })}
      />,
    );

    expect(screen.getByText('⚠ Manca un guerriero')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('does not render blocking reasons when embark is allowed', () => {
    render(<QuestAssignmentPreview preview={makePreview()} />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();
  });
});
