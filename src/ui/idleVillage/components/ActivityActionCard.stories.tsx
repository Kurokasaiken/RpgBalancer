import type { Meta, StoryObj } from '@storybook/react';
import ActivityActionCard from './ActivityActionCard';
import type { ActivityActionCardProps } from './ActivityActionCard';

/**
 * @deprecated This story shows the deprecated ActivityActionCard.
 * Use ActionCardWrapper or specific wrappers instead. See migration guide.
 */

// Mock props for stories
const mockBaseProps: Omit<ActivityActionCardProps, 'slotId' | 'label' | 'visualVariant' | 'dropState' | 'riskPercentages'> = {
    helperText: 'Helper text',
    icon: '⚔️',
    assignedResidentId: null,
    assignedResidentName: null,
    progressFraction: 0.5,
    elapsedSeconds: 30,
    totalDurationSeconds: 60,
    variant: 'compact',
    canAcceptDrop: true,
    disabled: false,
    ctaLabel: 'Start',
    onClick: () => console.log('Card clicked'),
    onWorkerDrop: () => console.log('Worker dropped'),
    onHoverChange: () => console.log('Hover changed'),
    onMouseEnter: () => console.log('Mouse entered'),
    onMouseLeave: () => console.log('Mouse left'),
};

const meta: Meta<typeof ActivityActionCard> = {
    title: 'IdleVillage/Components/ActivityActionCard (Deprecated)',
    component: ActivityActionCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '⚠️ **DEPRECATED**: Use ActionCardWrapper or specific wrappers (JobCard, QuestCard, TrainingCard, MaintenanceCard) instead. See [Migration Guide](/docs/ACTIVITY_ACTION_CARD_MIGRATION.md).'
            }
        }
    },
    argTypes: {
        visualVariant: {
            control: { type: 'select' },
            options: ['azure', 'ember', 'jade', 'amethyst', 'solar'],
        },
        dropState: {
            control: { type: 'select' },
            options: ['idle', 'valid', 'invalid'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const JobCardIdle: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'job-1',
        label: 'Woodcutting Job',
        visualVariant: 'azure',
        dropState: 'idle',
        riskPercentages: { injury: 0.1, death: 0.01 },
    },
};

export const JobCardValidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'job-2',
        label: 'Fishing Job',
        visualVariant: 'azure',
        dropState: 'valid',
        riskPercentages: { injury: 0.2, death: 0.02 },
    },
};

export const JobCardInvalidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'job-3',
        label: 'Mining Job',
        visualVariant: 'azure',
        dropState: 'invalid',
        riskPercentages: { injury: 0.3, death: 0.03 },
    },
};

export const QuestCardIdle: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-1',
        label: 'Bandit Hunt Quest',
        visualVariant: 'solar',
        dropState: 'idle',
        riskPercentages: { injury: 0.4, death: 0.1 },
    },
};

export const QuestCardValidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-2',
        label: 'Treasure Quest',
        visualVariant: 'solar',
        dropState: 'valid',
        riskPercentages: { injury: 0.5, death: 0.15 },
    },
};

export const QuestCardInvalidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-3',
        label: 'Dragon Quest',
        visualVariant: 'solar',
        dropState: 'invalid',
        riskPercentages: { injury: 0.6, death: 0.2 },
    },
};

export const DangerCardIdle: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'danger-1',
        label: 'Cave Exploration',
        visualVariant: 'ember',
        dropState: 'idle',
        riskPercentages: { injury: 0.7, death: 0.3 },
    },
};

export const DangerCardValidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'danger-2',
        label: 'Swamp Hunt',
        visualVariant: 'ember',
        dropState: 'valid',
        riskPercentages: { injury: 0.8, death: 0.4 },
    },
};

export const DangerCardInvalidDrop: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'danger-3',
        label: 'Volcano Climb',
        visualVariant: 'ember',
        dropState: 'invalid',
        riskPercentages: { injury: 0.9, death: 0.5 },
    },
};

export const DetailVariant: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'detail-1',
        label: 'Detailed Activity',
        helperText: 'This is a detailed view with more information',
        visualVariant: 'jade',
        variant: 'detail',
        dropState: 'idle',
        riskPercentages: { injury: 0.25, death: 0.05 },
    },
};

export const HighRiskCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'high-risk-1',
        label: 'High Risk Mission',
        visualVariant: 'amethyst',
        dropState: 'idle',
        riskPercentages: { injury: 0.9, death: 0.7 },
    },
};

export const QuestCheckCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-check-1',
        label: 'Scout Tunnel Check',
        visualVariant: 'amethyst',
        dropState: 'idle',
        riskPercentages: { injury: 18, death: 4 },
        questPhaseSequence: {
            currentPhaseIndex: 0,
            totalPhases: 3,
            currentPhaseType: 'check',
        },
    },
};

export const QuestFightCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-fight-1',
        label: 'Crush Brood Fight',
        visualVariant: 'ember',
        dropState: 'idle',
        riskPercentages: { injury: 40, death: 15 },
        questPhaseSequence: {
            currentPhaseIndex: 1,
            totalPhases: 3,
            currentPhaseType: 'fight',
        },
    },
};

export const QuestStealthCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-stealth-1',
        label: 'Recover Cache Stealth',
        visualVariant: 'amethyst',
        dropState: 'idle',
        riskPercentages: { injury: 25, death: 8 },
        questPhaseSequence: {
            currentPhaseIndex: 2,
            totalPhases: 3,
            currentPhaseType: 'stealth',
        },
    },
};

export const QuestTrapCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-trap-1',
        label: 'Seal Vents Trap',
        visualVariant: 'jade',
        dropState: 'idle',
        riskPercentages: { injury: 12, death: 2 },
        questPhaseSequence: {
            currentPhaseIndex: 0,
            totalPhases: 1,
            currentPhaseType: 'trap',
        },
    },
};

export const QuestExploreCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'quest-explore-1',
        label: 'Perimeter Exploration',
        visualVariant: 'amethyst',
        dropState: 'idle',
        riskPercentages: { injury: 20, death: 6 },
        questPhaseSequence: {
            currentPhaseIndex: 1,
            totalPhases: 2,
            currentPhaseType: 'explore',
        },
    },
};

export const HeroicFeedbackCard: Story = {
    args: {
        ...mockBaseProps,
        slotId: 'heroic-quest-1',
        label: 'Completed Heroic Quest',
        visualVariant: 'solar',
        progressFraction: 1.0,
        elapsedSeconds: 120,
        totalDurationSeconds: 120,
        dropState: 'idle',
        riskPercentages: { injury: 25, death: 15 },
        heroicFeedback: {
            showBadge: true,
            label: 'Heroic',
        },
        questPhaseSequence: {
            currentPhaseIndex: 2,
            totalPhases: 3,
            currentPhaseType: 'fight',
        },
    },
};
