/**
 * QuestPhaseList Component Tests
 *
 * Tests for the QuestPhaseList component that displays quest phases
 * with branching visualization.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestPhaseList from './QuestPhaseList';
import type { QuestDefinition, QuestState } from '@/engine/quest/types';

describe('QuestPhaseList', () => {
  const getPhaseCard = (title: string): HTMLElement => {
    let node = screen.getByText(title).parentElement;
    while (node && !node.classList.contains('relative')) {
      node = node.parentElement;
    }
    if (!node) {
      throw new Error(`Could not locate phase card for "${title}"`);
    }
    return node as HTMLElement;
  };
  const mockQuest: QuestDefinition = {
    id: 'test-quest',
    title: 'Test Quest',
    description: 'A quest for testing',
    phases: [
      {
        type: 'dialogue',
        id: 'phase-1',
        title: 'Opening Dialogue',
        description: 'Choose your path',
        choices: [
          {
            id: 'choice-heroic',
            text: 'Take the heroic path',
            outcome: { nextPhaseIds: ['phase-2'] },
          },
        ],
      },
      {
        type: 'fight',
        id: 'phase-2',
        title: 'Epic Battle',
        description: 'Fight the dragon',
      },
      {
        type: 'branch',
        id: 'phase-3',
        title: 'Crossroads',
        description: 'A branching decision',
        conditions: [],
        defaultOutcome: { nextPhaseIds: ['phase-4'] },
      },
    ],
    startPhaseId: 'phase-1',
    successPhaseIds: ['phase-4'],
    failurePhaseIds: [],
  };

  const mockQuestState: QuestState = {
    questId: 'test-quest',
    currentPhaseId: 'phase-2',
    completedPhaseIds: ['phase-1'],
    branchHistory: [
      {
        phaseId: 'phase-1',
        choiceId: 'choice-heroic',
        outcome: {
          nextPhaseIds: ['phase-2'],
          metadata: { choiceMade: 'Take the heroic path' },
        },
        timestamp: Date.now() - 60000,
        randomSeed: 12345,
      },
    ],
    effectsApplied: [],
    startTime: Date.now() - 120000,
    lastActivityTime: Date.now() - 30000,
    metadata: {},
  };

  describe('rendering', () => {
    it('should render quest title and phase count', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      expect(screen.getByText('Quest Progression')).toBeInTheDocument();
      expect(screen.getByText('1/3 phases')).toBeInTheDocument();
    });

    it('should display completed phases with checkmark', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      const completedCard = getPhaseCard('Opening Dialogue');
      expect(completedCard).toHaveClass('border-green-400/60');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should highlight current phase', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      const currentCard = getPhaseCard('Epic Battle');
      expect(currentCard).toHaveClass('ring-amber-400/40');
    });

    it('should show branch point indicator for branch phases', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      const branchCard = getPhaseCard('Crossroads');
      expect(branchCard).toHaveClass('border-yellow-400/60');
    });
  });

  describe('phase types', () => {
    it('should display correct icons for different phase types', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      expect(screen.getAllByLabelText('dialogue').length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText('fight').length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText('branch').length).toBeGreaterThan(0);
    });

    it('should apply correct colors for phase types', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      const dialoguePhase = screen.getByText('Opening Dialogue').closest('.relative');
      expect(dialoguePhase).toHaveClass('text-blue-300');

      const fightPhase = screen.getByText('Epic Battle').closest('.relative');
      expect(fightPhase).toHaveClass('text-orange-300');

      const branchPhase = screen.getByText('Crossroads').closest('.relative');
      expect(branchPhase).toHaveClass('text-yellow-300');
    });
  });

  describe('branching display', () => {
    it('should show chosen choice for dialogue phases', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      expect(screen.getByText('Chose: Take the heroic path')).toBeInTheDocument();
    });

    it('should show question mark for phases with available choices', () => {
      const stateWithChoices: QuestState = {
        ...mockQuestState,
        currentPhaseId: 'phase-1', // Dialogue phase with choices
        completedPhaseIds: [],
        branchHistory: [],
      };

      render(<QuestPhaseList quest={mockQuest} questState={stateWithChoices} />);

      expect(screen.getByLabelText('Choices available')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode when specified', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} compact />);

      const header = screen.getByRole('heading', { name: 'Quest Progression' });
      const scrollContainer = header?.parentElement?.nextElementSibling;
      expect(scrollContainer).toHaveClass('max-h-48');
    });

    it('should hide descriptions in compact mode', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} compact />);

      // In compact mode, descriptions should not be shown
      const description = screen.queryByText('Choose your path');
      expect(description).toBeNull();
    });
  });

  describe('telemetry summary', () => {
    it('should display branch count and duration', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      expect(screen.getByText('Branches taken: 1')).toBeInTheDocument();
      expect(screen.getByText(/Duration: \d+s/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels for phase icons', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      // Check that icons have aria-label or are marked as decorative
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show current phase indicator with proper label', () => {
      render(<QuestPhaseList quest={mockQuest} questState={mockQuestState} />);

      const currentIndicator = screen.getByText('●');
      expect(currentIndicator).toHaveAttribute('aria-label', 'Current');
    });
  });

  describe('edge cases', () => {
    it('should handle empty quest gracefully', () => {
      const emptyQuest: QuestDefinition = {
        ...mockQuest,
        phases: [],
      };
      const emptyState: QuestState = {
        ...mockQuestState,
        completedPhaseIds: [],
      };

      render(<QuestPhaseList quest={emptyQuest} questState={emptyState} />);

      expect(screen.getByText('Quest Progression')).toBeInTheDocument();
      expect(screen.getByText(/0\s*\/\s*0\s*phases/)).toBeInTheDocument();
    });

    it('should handle quest with no branch history', () => {
      const stateWithoutHistory: QuestState = {
        ...mockQuestState,
        branchHistory: [],
      };

      render(<QuestPhaseList quest={mockQuest} questState={stateWithoutHistory} />);

      expect(screen.getByText('Branches taken: 0')).toBeInTheDocument();
    });
  });
});
