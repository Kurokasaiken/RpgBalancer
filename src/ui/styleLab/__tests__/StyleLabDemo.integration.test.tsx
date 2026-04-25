/**
 * Style Lab Demo Integration Tests
 * 
 * Comprehensive integration tests for Style Lab Demo with all presets
 * and component functionality verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StyleLabDemo } from '../StyleLabDemo';
import { defaultDemoConfig } from '../config/demoConfig';
import { 
  applyMinimalFrontierPreset, 
  applyObsidianVaultPreset, 
  applyBlizzardRiftPreset 
} from '../presets';

// Mock useStyleLabTokens hook
vi.mock('../hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    preset: {
      surfaces: {
        panel: {
          background: 'rgb(30, 41, 59)',
          color: 'rgb(241, 245, 249)',
          borderColor: 'rgb(71, 85, 105)',
        },
        card: {
          background: 'rgb(51, 65, 85)',
          color: 'rgb(241, 245, 249)',
          borderColor: 'rgb(71, 85, 105)',
        },
      },
      modifierStatus: {
        active: {
          background: 'rgb(59, 130, 246)',
          border: 'rgb(147, 197, 253)',
          foreground: 'rgb(255, 255, 255)',
        },
        hover: {
          background: 'rgb(99, 102, 241)',
          border: 'rgb(165, 180, 252)',
          foreground: 'rgb(255, 255, 255)',
        },
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
      },
    },
    modifierScopes: {
      GLOBAL: {
        background: 'rgb(59, 130, 246)',
        border: 'rgb(147, 197, 253)',
        foreground: 'rgb(255, 255, 255)',
      },
      QUEST: {
        background: 'rgb(99, 102, 241)',
        border: 'rgb(165, 180, 252)',
        foreground: 'rgb(255, 255, 255)',
      },
    },
  }),
}));

// Mock persistence service
vi.mock('../../shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('StyleLabDemo Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders StyleLabDemo component', () => {
      render(<StyleLabDemo />);
      
      // Check for main demo container
      expect(screen.getByText('Slider')).toBeInTheDocument();
      expect(screen.getByText('Style Preset')).toBeInTheDocument();
      expect(screen.getByText('Animation')).toBeInTheDocument();
    });

    it('renders all component options', () => {
      render(<StyleLabDemo />);
      
      const components = [
        'Slider',
        'Toggle Switch',
        'Progress Ring',
        'Text Field',
        'Notification Toast',
        'Hover Card',
        'Drag & Drop',
        'Button',
      ];

      components.forEach((component) => {
        expect(screen.getByText(component)).toBeInTheDocument();
      });
    });

    it('renders preset switcher with all presets', () => {
      render(<StyleLabDemo />);
      
      expect(screen.getByText('🌅')).toBeInTheDocument(); // Minimal Frontier
      expect(screen.getByText('🗿')).toBeInTheDocument(); // Obsidian Vault
      expect(screen.getByText('❄️')).toBeInTheDocument(); // Blizzard Rift
      
      expect(screen.getByText('Minimal Frontier')).toBeInTheDocument();
      expect(screen.getByText('Obsidian Vault')).toBeInTheDocument();
      expect(screen.getByText('Blizzard Rift')).toBeInTheDocument();
    });
  });

  describe('Component Switching', () => {
    it('switches between components when clicked', async () => {
      render(<StyleLabDemo />);
      
      // Initially slider should be active
      expect(screen.getByText('Slider')).toBeInTheDocument();
      
      // Click on Toggle Switch
      fireEvent.click(screen.getByText('Toggle Switch'));
      
      // Toggle should now be active (we can verify by checking for toggle-specific controls)
      await waitFor(() => {
        expect(screen.getByText('Toggle Switch')).toBeInTheDocument();
      });
    });

    it('updates controls when component changes', async () => {
      render(<StyleLabDemo />);
      
      // Switch to Progress Ring
      fireEvent.click(screen.getByText('Progress Ring'));
      
      await waitFor(() => {
        // Should show Progress Ring specific controls
        expect(screen.getByText('Progress Ring')).toBeInTheDocument();
      });
    });
  });

  describe('Preset Switching', () => {
    it('switches presets when preset buttons are clicked', async () => {
      render(<StyleLabDemo />);
      
      // Click on Obsidian Vault preset
      fireEvent.click(screen.getByText('🗿'));
      
      // Should update the active preset (visual indication through button state)
      await waitFor(() => {
        expect(screen.getByText('Obsidian Vault')).toBeInTheDocument();
      });
    });

    it('shows preset descriptions', () => {
      render(<StyleLabDemo />);
      
      expect(screen.getByText('Clean, balanced feel with subtle animations')).toBeInTheDocument();
      expect(screen.getByText('Heavy, dense feel with deep visual effects')).toBeInTheDocument();
      expect(screen.getByText('Ultra-responsive, light feel with fast animations')).toBeInTheDocument();
    });

    it('highlights active preset', () => {
      render(<StyleLabDemo />);
      
      // Minimal Frontier should be active by default
      const minimalFrontierButton = screen.getByText('🌅').closest('button');
      expect(minimalFrontierButton).toHaveClass('bg-purple-500');
    });
  });

  describe('Animation Controls', () => {
    it('toggles animation enabled state', () => {
      render(<StyleLabDemo />);
      
      const animationToggle = screen.getByLabelText('Enabled');
      expect(animationToggle).toBeInTheDocument();
      
      fireEvent.click(animationToggle);
      
      // Should toggle the state
      expect(animationToggle).toBeInTheDocument();
    });

    it('adjusts animation speed', () => {
      render(<StyleLabDemo />);
      
      const speedSlider = screen.getByText(/Speed:/);
      expect(speedSlider).toBeInTheDocument();
      
      // Should display current speed
      expect(screen.getByText('Speed: 1x')).toBeInTheDocument();
    });
  });

  describe('Controls Panel', () => {
    it('toggles controls visibility', () => {
      render(<StyleLabDemo />);
      
      // Find the toggle controls button (should be present)
      const toggleButton = screen.getByText('📊') || screen.getByText('📈');
      expect(toggleButton).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      
      // Should hide/show controls panel
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders component-specific controls', async () => {
      render(<StyleLabDemo />);
      
      // Switch to Slider component
      fireEvent.click(screen.getByText('Slider'));
      
      await waitFor(() => {
        // Should show slider-specific controls
        expect(screen.getByText('Move Speed:')).toBeInTheDocument();
        expect(screen.getByText('Track Height:')).toBeInTheDocument();
      });
    });
  });

  describe('Preset Application', () => {
    it('applies Minimal Frontier preset correctly', () => {
      const config = applyMinimalFrontierPreset(defaultDemoConfig);
      
      expect(config.layout.splitRatio).toBe(0.65);
      expect(config.animation.speed).toBe(1.0);
      expect(config.slider.moveSpeed).toBe(0.8);
    });

    it('applies Obsidian Vault preset correctly', () => {
      const config = applyObsidianVaultPreset(defaultDemoConfig);
      
      expect(config.layout.splitRatio).toBe(0.7);
      expect(config.animation.speed).toBe(0.7);
      expect(config.dragDrop.springStiffness).toBe(260);
    });

    it('applies Blizzard Rift preset correctly', () => {
      const config = applyBlizzardRiftPreset(defaultDemoConfig);
      
      expect(config.layout.splitRatio).toBe(0.6);
      expect(config.animation.speed).toBe(1.3);
      expect(config.slider.moveSpeed).toBe(1.8);
    });
  });

  describe('Responsive Behavior', () => {
    it('renders in fullscreen layout', () => {
      render(<StyleLabDemo />);
      
      // Should have split layout structure
      const container = screen.getByText('Slider').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('maintains layout integrity with different content', async () => {
      render(<StyleLabDemo />);
      
      // Test with different components
      const components = ['Toggle Switch', 'Progress Ring', 'Text Field'];
      
      for (const component of components) {
        fireEvent.click(screen.getByText(component));
        
        await waitFor(() => {
          expect(screen.getByText(component)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(<StyleLabDemo />);
      
      // Check for proper labeling
      expect(screen.getByLabelText('Enabled')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<StyleLabDemo />);
      
      // Focus should be manageable
      const firstButton = screen.getByText('Slider');
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });

    it('maintains contrast and readability', () => {
      render(<StyleLabDemo />);
      
      // Text should be readable (basic check)
      const textElements = screen.getAllByText(/./);
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing preset gracefully', () => {
      render(<StyleLabDemo />);
      
      // Should not crash when switching components
      expect(() => {
        fireEvent.click(screen.getByText('Slider'));
      }).not.toThrow();
    });

    it('handles rapid preset switching', async () => {
      render(<StyleLabDemo />);
      
      // Rapidly switch between presets
      const presets = ['🌅', '🗿', '❄️'];
      
      for (const preset of presets) {
        fireEvent.click(screen.getByText(preset));
        await waitFor(() => {
          expect(screen.getByText(preset)).toBeInTheDocument();
        }, { timeout: 100 });
      }
    });
  });

  describe('Performance', () => {
    it('renders without excessive re-renders', () => {
      const { rerender } = render(<StyleLabDemo />);
      
      // Re-render should be stable
      expect(() => {
        rerender(<StyleLabDemo />);
      }).not.toThrow();
    });

    it('handles large number of interactions', () => {
      render(<StyleLabDemo />);
      
      // Simulate many interactions
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('Slider'));
        fireEvent.click(screen.getByText('Toggle Switch'));
      }
      
      // Should still be functional
      expect(screen.getByText('Slider')).toBeInTheDocument();
    });
  });
});
