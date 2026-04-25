import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ActivitySlot from './ActivitySlot';
import type { ActivitySlotCardProps } from './ActivitySlot';

/**
 * Storybook stories for ActivitySlot component
 * Demonstrates various activity slot states and configurations
 */
const meta: Meta<typeof ActivitySlot> = {
  title: 'IdleVillage/Components/ActivitySlot',
  component: ActivitySlot,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ActivitySlot represents a draggable and droppable activity location on the village map. Supports various visual variants and interaction states.',
      },
    },
  },
  argTypes: {
    visualVariant: {
      control: { type: 'select' },
      options: ['azure', 'ember', 'jade', 'amethyst', 'solar'],
      description: 'Visual theme variant for the activity slot',
    },
    dropState: {
      control: { type: 'select' },
      options: ['idle', 'valid', 'invalid', 'locked'],
      description: 'Current drag and drop state',
    },
    assignedWorkerName: {
      control: { type: 'text' },
      description: 'Name of assigned worker',
    },
    progressFraction: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Activity completion progress (0-1)',
    },
  },
  args: {
    onWorkerDrop: fn(),
    onInspect: fn(),
    onClick: fn(),
    onHoverChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base mock props
const mockBaseProps: Omit<ActivitySlotCardProps, 'slotId' | 'label' | 'visualVariant' | 'dropState'> = {
  iconName: 'forest',
  assignedWorkerName: null,
  assignedWorkerAvatarUrl: null,
  progressFraction: 0,
  elapsedSeconds: 0,
  totalDuration: 60,
  isInteractive: true,
  canAcceptDrop: true,
  onWorkerDrop: fn(),
  onInspect: fn(),
  onClick: fn(),
  onHoverChange: fn(),
};

export const ForestJobIdle: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-1',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'idle',
  },
};

export const ForestJobValidDrop: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-2',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'valid',
  },
};

export const ForestJobInvalidDrop: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-3',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'invalid',
  },
};

export const ForestJobLocked: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-4',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'locked',
    canAcceptDrop: false,
  },
};

export const ForestJobInProgress: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-5',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'idle',
    assignedWorkerName: 'Aldric',
    progressFraction: 0.6,
    elapsedSeconds: 36,
    totalDuration: 60,
  },
};

export const ForestJobCompleted: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'forest-job-6',
    label: 'Forest Work',
    visualVariant: 'jade',
    dropState: 'idle',
    assignedWorkerName: 'Aldric',
    progressFraction: 1.0,
    elapsedSeconds: 60,
    totalDuration: 60,
  },
};

export const HighRiskQuest: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'quest-1',
    label: 'Dragon Hunt',
    visualVariant: 'ember',
    dropState: 'idle',
    iconName: 'dragon',
  },
};

export const DisabledSlot: Story = {
  args: {
    ...mockBaseProps,
    slotId: 'disabled-1',
    label: 'Locked Activity',
    visualVariant: 'azure',
    dropState: 'idle',
    isInteractive: false,
    canAcceptDrop: false,
    isLockedByPhase: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <ActivitySlot
        {...mockBaseProps}
        slotId="azure-1"
        label="Azure Activity"
        visualVariant="azure"
        dropState="idle"
        iconName="home"
      />
      <ActivitySlot
        {...mockBaseProps}
        slotId="ember-1"
        label="Ember Activity"
        visualVariant="ember"
        dropState="idle"
        iconName="fire"
      />
      <ActivitySlot
        {...mockBaseProps}
        slotId="jade-1"
        label="Jade Activity"
        visualVariant="jade"
        dropState="idle"
        iconName="leaf"
      />
      <ActivitySlot
        {...mockBaseProps}
        slotId="amethyst-1"
        label="Amethyst Activity"
        visualVariant="amethyst"
        dropState="idle"
        iconName="gem"
      />
      <ActivitySlot
        {...mockBaseProps}
        slotId="solar-1"
        label="Solar Activity"
        visualVariant="solar"
        dropState="idle"
        iconName="sun"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All visual variants displayed together for comparison.',
      },
    },
  },
};
