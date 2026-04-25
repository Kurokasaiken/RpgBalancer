/**
 * Style Lab Demo Stories
 * 
 * Storybook stories for Style Lab Demo components and presets.
 * Demonstrates all advanced components with different preset configurations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StyleLabDemo } from '../StyleLabDemo';
import { 
  applyMinimalFrontierPreset, 
  applyObsidianVaultPreset, 
  applyBlizzardRiftPreset 
} from '../presets';
import { defaultDemoConfig } from '../config/demoConfig';

const meta: Meta<typeof StyleLabDemo> = {
  title: 'Style Lab/StyleLabDemo',
  component: StyleLabDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced Style Lab Demo with configurable components and preset system.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StyleLabDemo>;

/**
 * Default story with Minimal Frontier preset
 */
export const MinimalFrontier: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Clean, balanced feel with optimized parameters for all demo components.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

/**
 * Obsidian Vault preset story
 */
export const ObsidianVault: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Heavy, dense feel with deep visual effects and deliberate timing.',
      },
    },
  },
  render: () => {
    return <StyleLabDemo />;
  },
};

/**
 * Blizzard Rift preset story
 */
export const BlizzardRift: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ultra-responsive, light feel with fast animations and icy effects.',
      },
    },
  },
  render: () => {
    return <StyleLabDemo />;
  },
};

/**
 * Individual component stories
 */

export const SliderComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider component with automatic movement and real-time value display.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

export const ToggleComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle switch component with automatic on/off switching.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

export const ProgressRingComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Circular progress ring with fill/drain animation and percentage display.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

export const TextFieldComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Text field component with automatic focus/unfocus loop and placeholder animation.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

export const ToastComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Notification toast component with automatic appear/disappear animation.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

export const HoverCardComponent: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover card component with continuous hover effect and content rotation.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

/**
 * Accessibility stories
 */

export const HighContrast: Story = {
  args: {
    className: '',
  },

  parameters: {
    docs: {
      description: {
        story: 'High contrast mode for accessibility testing.',
      },
    }
  },

  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },

  globals: {
    backgrounds: {
      value: "dark"
    }
  }
};

export const ReducedMotion: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Reduced motion mode for users who prefer less animation.',
      },
    },
  },
  render: () => {
    const config = applyMinimalFrontierPreset(defaultDemoConfig);
    return <StyleLabDemo />;
  },
};

/**
 * Integration stories
 */

export const FullIntegration: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete Style Lab Demo with all components and controls.',
      },
    },
  },
  render: () => {
    return <StyleLabDemo />;
  },
};

export const PresetComparison: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three presets.',
      },
    },
    layout: 'padded',
  },
  render: () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold mb-2">Minimal Frontier</h3>
          <div className="border rounded-lg p-4" style={{ height: '400px' }}>
            <StyleLabDemo />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Obsidian Vault</h3>
          <div className="border rounded-lg p-4" style={{ height: '400px' }}>
            <StyleLabDemo />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Blizzard Rift</h3>
          <div className="border rounded-lg p-4" style={{ height: '400px' }}>
            <StyleLabDemo />
          </div>
        </div>
      </div>
    );
  },
};
