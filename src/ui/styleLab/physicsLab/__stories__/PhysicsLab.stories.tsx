/**
 * Physics Lab Stories
 *
 * Storybook stories for Physics Lab components with Style Lab integration.
 * Demonstrates physics presets, interactive controls, and visual effects.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PhysicsLabApp } from '../PhysicsLabApp';
import { LabPanel } from '../components/LabPanel';
import { usePhysicsLabSync } from '../hooks/usePhysicsLabSync';
import { physicsPresets } from '@/ui/styleLab/config/physicsPresets';

/**
 * Simple wrapper that provides dark background for stories
 */
const StyleLabWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ backgroundColor: '#050509', padding: '20px', minHeight: '100vh' }}>
      {children}
    </div>
  );
};

/**
 * Physics Lab App Stories
 */
const meta: Meta<typeof PhysicsLabApp> = {
  title: 'Physics Lab/PhysicsLabApp',
  component: PhysicsLabApp,
  decorators: [
    (Story) => (
      <StyleLabWrapper>
        <Story />
      </StyleLabWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Physics Lab App demonstrates the complete physics simulation micro-app with:
- Interactive card/slot drag and drop
- Real-time physics parameter adjustment
- Visual feedback and animations
- Style Lab token integration

The stories showcase different physics presets and their visual/behavioral differences.
        `,
      },
    },
    layout: 'centered',
  },
  argTypes: {
    // Physics preset controls will be handled by the component's internal state
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story with Minimal Frontier preset
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default Physics Lab with Minimal Frontier preset - balanced lift and glow.',
      },
    },
  },
};

/**
 * Obsidian Vault preset story
 */
export const ObsidianVault: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Heavy drag feel with deep slot glow and subdued lift. Inspired by Obsidian preset typography.',
      },
    },
  },
};

/**
 * Blizzard Rift preset story
 */
export const BlizzardRift: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Ultra-responsive, low-mass profile with icy cursor trails and high lift.',
      },
    },
  },
};

/**
 * Interactive Lab Panel story
 */
export const LabPanelInteractive: Story = {
  render: () => {
    const LabPanelStory = () => {
      const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
      const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

      return (
        <div style={{ width: '600px', height: '500px' }}>
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        </div>
      );
    };

    return (
      <StyleLabWrapper>
        <LabPanelStory />
      </StyleLabWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive Lab Panel with full controls for physics parameters, FX settings, and preset management.',
      },
    },
  },
};

/**
 * High Contrast accessibility story
 */
export const HighContrast: Story = {
  args: {},

  parameters: {
    docs: {
      description: {
        story: 'Physics Lab with high contrast mode for accessibility testing.',
      },
    }
  },

  globals: {
    backgrounds: {
      value: "dark"
    }
  }
};

/**
 * Reduced Motion story
 */
export const ReducedMotion: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Physics Lab with reduced motion for users who prefer minimal animations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ animation: 'none !important' }}>
        <StyleLabWrapper>
          <Story />
        </StyleLabWrapper>
      </div>
    ),
  ],
};

/**
 * Performance test story
 */
export const PerformanceTest: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'High-performance preset for testing animation smoothness and rendering performance.',
      },
    },
  },
};

/**
 * All presets comparison
 */
export const PresetComparison: Story = {
  render: () => {
    const PresetComparisonGrid = () => {
      const presetEntries = Object.entries(physicsPresets);
      
      return (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          padding: '20px',
          backgroundColor: '#050509',
        }}>
          {presetEntries.map(([id, preset]) => (
            <div 
              key={id}
              style={{
                border: '1px solid #3b4b4d',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#0f1a1d',
              }}
            >
              <h3 style={{ color: '#f0efe4', margin: '0 0 8px 0' }}>{preset.label}</h3>
              <p style={{ color: '#3b4b4d', margin: '0 0 12px 0', fontSize: '12px' }}>
                {preset.description}
              </p>
              <div style={{ fontSize: '11px', color: '#c9a227' }}>
                <div>Lift: {preset.liftScale.toFixed(2)}</div>
                <div>Mass: {preset.mass.toFixed(1)}</div>
                <div>Spring: {preset.spring.stiffness}</div>
                <div>Trail: {preset.cursor.trail}</div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <StyleLabWrapper>
        <PresetComparisonGrid />
      </StyleLabWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid comparison of all physics presets showing their key parameters.',
      },
    },
  },
};
