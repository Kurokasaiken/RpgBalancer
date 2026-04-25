import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { AccessibilityAudit } from './AccessibilityAudit';

/**
 * Storybook stories for AccessibilityAudit component
 * Demonstrates accessibility testing and reporting functionality
 */
const meta: Meta<typeof AccessibilityAudit> = {
  title: 'IdleVillage/Components/AccessibilityAudit',
  component: AccessibilityAudit,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AccessibilityAudit provides real-time accessibility testing and reporting using axe-core. Helps identify and fix accessibility issues during development.',
      },
    },
  },
  argTypes: {
    enabled: {
      control: { type: 'boolean' },
      description: 'Whether accessibility auditing is enabled',
    },
    showDetails: {
      control: { type: 'boolean' },
      description: 'Whether to show detailed issue information',
    },
  },
  args: {
    onViolationFound: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: {
    enabled: true,
    showDetails: false,
  },
};

export const WithDetails: Story = {
  args: {
    enabled: true,
    showDetails: true,
  },
};

export const Disabled: Story = {
  args: {
    enabled: false,
    showDetails: false,
  },
};

export const Interactive: Story = {
  args: {
    enabled: true,
    showDetails: true,
    onViolationFound: (violation) => {
      console.log('Accessibility violation found:', violation);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive mode with violation callback for custom handling.',
      },
    },
  },
};
