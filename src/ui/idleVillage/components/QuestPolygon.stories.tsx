import type { Meta, StoryObj } from '@storybook/react';
import { QuestPolygon } from './QuestPolygon';

const meta: Meta<typeof QuestPolygon> = {
  title: 'Idle Village/QuestPolygon',
  component: QuestPolygon,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    injuryPercentage: 15,
    deathPercentage: 5,
  },
};

export const HighRisk: Story = {
  args: {
    injuryPercentage: 45,
    deathPercentage: 15,
  },
};

export const LowRisk: Story = {
  args: {
    injuryPercentage: 5,
    deathPercentage: 0,
  },
};
