import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestBranchDiagram from '../QuestBranchDiagram';
import type { QuestDefinition, QuestState } from '@/engine/quest/types';

const sampleQuest: QuestDefinition = {
  id: 'quest_heroic',
  title: 'Heroic Expedition',
  description: 'Branching quest used for diagram tests',
  startPhaseId: 'phase_dialogue',
  successPhaseIds: ['phase_boss'],
  failurePhaseIds: ['phase_failure'],
  phases: [
    {
      type: 'dialogue',
      id: 'phase_dialogue',
      title: 'Choose Approach',
      description: 'Pick a path',
      choices: [
        {
          id: 'choice_sneak',
          text: 'Sneak through tunnels',
          outcome: {
            nextPhaseIds: ['phase_branch'],
            metadata: { choiceMade: 'Sneak through tunnels' },
          },
        },
        {
          id: 'choice_charge',
          text: 'Charge the gate',
          outcome: {
            nextPhaseIds: ['phase_boss'],
            metadata: { choiceMade: 'Charge the gate' },
          },
        },
      ],
    },
    {
      type: 'branch',
      id: 'phase_branch',
      title: 'Check Supplies',
      description: 'Automatic branching',
      conditions: [
        {
          type: 'random_chance',
          chance: 1,
          outcome: {
            nextPhaseIds: ['phase_boss'],
            metadata: { branchReason: 'random chance success' },
          },
        },
      ],
      defaultOutcome: {
        nextPhaseIds: ['phase_failure'],
      },
    },
    {
      type: 'fight',
      id: 'phase_boss',
      title: 'Boss Encounter',
      description: 'Final battle',
    },
    {
      type: 'trap',
      id: 'phase_failure',
      title: 'Supply Failure',
      description: 'Quest fails',
    },
  ],
};

const sampleState: QuestState = {
  questId: 'quest_heroic',
  currentPhaseId: 'phase_boss',
  completedPhaseIds: ['phase_dialogue', 'phase_branch'],
  branchHistory: [
    {
      phaseId: 'phase_dialogue',
      choiceId: 'choice_sneak',
      outcome: {
        nextPhaseIds: ['phase_branch'],
        metadata: { choiceMade: 'Sneak through tunnels' },
      },
      timestamp: Date.now() - 10_000,
    },
    {
      phaseId: 'phase_branch',
      outcome: {
        nextPhaseIds: ['phase_boss'],
        metadata: { branchReason: 'random chance success' },
      },
      timestamp: Date.now() - 5_000,
    },
  ],
  effectsApplied: [],
  startTime: Date.now() - 60_000,
  lastActivityTime: Date.now() - 5_000,
  metadata: {},
};

describe('QuestBranchDiagram', () => {
  it('renders nodes and edges for quest phases', () => {
    render(<QuestBranchDiagram quest={sampleQuest} questState={sampleState} />);

    expect(screen.getByLabelText('Quest Branch Diagram')).toBeInTheDocument();
    expect(screen.getByText('Heroic Expedition')).toBeInTheDocument();
    expect(screen.getByText('Choose Approach')).toBeInTheDocument();
    expect(screen.getByText('Boss Encounter')).toBeInTheDocument();

    expect(screen.getAllByText('Sneak through tunnels')).toHaveLength(2); // In choice summary and edge
    expect(screen.getByText('Cond. 1')).toBeInTheDocument();
  });

  it('invokes onNodeSelect when node is clicked', () => {
    const handleSelect = vi.fn();
    render(<QuestBranchDiagram quest={sampleQuest} questState={sampleState} onNodeSelect={handleSelect} />);

    const nodeButton = screen.getByRole('button', { name: /Fase Choose Approach stato completed/i });
    fireEvent.click(nodeButton);

    expect(handleSelect).toHaveBeenCalledWith('phase_dialogue');
  });

  it('shows empty state when quest has no phases', () => {
    const emptyQuest: QuestDefinition = {
      ...sampleQuest,
      phases: [],
    };
    render(<QuestBranchDiagram quest={emptyQuest} questState={{ ...sampleState, completedPhaseIds: [], branchHistory: [] }} />);

    expect(screen.getByText('Nessuna fase disponibile per questa quest.')).toBeInTheDocument();
  });
});
