import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestDetailPanel from '../QuestDetailPanel';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';
import type { StatModifierEntry } from '@/ui/styleLab/components/StatModifierDisplay';

vi.mock('@/ui/idleVillage/hooks/useModifierVisualization');
vi.mock('@/ui/styleLab/components/StatModifierDisplay', () => ({
  StatModifierDisplay: ({ testId }: { testId?: string }) => (
    <div data-testid={testId ?? 'stat-modifier-display'}>mock-modifier-display</div>
  ),
}));
vi.mock('@/ui/components/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseModifierVisualization = vi.mocked(useModifierVisualization);

const baseSummary: VerbSummary = {
  key: 'quest-summary-1',
  source: 'scheduled',
  activityId: 'quest-activity-1',
  slotId: 'slot-quest-1',
  label: 'Fogwall Recon',
  kindLabel: 'Quest',
  isQuest: true,
  isJob: false,
  icon: '🜂',
  visualVariant: 'amethyst',
  progressStyle: 'halo',
  progressFraction: 0.5,
  elapsedSeconds: 120,
  totalDurationSeconds: 240,
  remainingSeconds: 120,
  injuryPercentage: 22,
  deathPercentage: 6,
  assignedCount: 2,
  totalSlots: 3,
  rewardLabel: '+30 gold',
  tone: 'quest',
  deadlineLabel: null,
  assigneeNames: ['Aurora', 'Grim'],
};

const baseActivity: ActivityDefinition = {
  id: 'quest-activity-1',
  label: 'Fogwall Recon',
  resolutionEngineId: 'quest-engine',
  maxSlots: 3,
  slotModifiers: {},
  statRequirement: { label: 'Resolve', allOf: ['resolve'] },
  rewards: [{ resourceId: 'gold', amountFormula: '+30' }],
  tags: ['quest'],
};

describe('QuestDetailPanel', () => {
  beforeEach(() => {
    mockUseModifierVisualization.mockReturnValue({ entries: [], isLoading: false });
  });

  it('renders placeholder when summary or activity is missing', () => {
    render(<QuestDetailPanel summary={null} activity={undefined} />);
    expect(
      screen.getByText('Seleziona una quest o attività dalla mappa per vedere i dettagli.'),
    ).toBeInTheDocument();
  });

  it('renders modifier preview when hook returns entries', () => {
    const modifiers: StatModifierEntry[] = [
      {
        id: 'mod_quest_reward_gold',
        label: 'Consiglio Bonus',
        statId: 'stat_reward_gold',
        scope: 'QUEST',
        valueLabel: '+35%',
        operation: 'ADD',
      },
    ];
    mockUseModifierVisualization.mockReturnValue({ entries: modifiers, isLoading: false });

    render(<QuestDetailPanel summary={baseSummary} activity={baseActivity} config={null} />);

    const modifierDisplay = screen.getByTestId('quest-slot-quest-1-modifier-display');
    expect(modifierDisplay).toBeInTheDocument();
    expect(mockUseModifierVisualization).toHaveBeenCalledWith(
      'questDetail',
      expect.objectContaining({ entityId: 'slot-quest-1' }),
    );
  });
});
