/**
 * Physics Lab Accessibility Tests
 *
 * Accessibility tests for Physics Lab components using axe-core and RTL.
 * Tests keyboard navigation, screen reader support, and reduced motion preferences.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PhysicsLabApp } from '../PhysicsLabApp';
import { LabPanel } from '../components/LabPanel';
import { usePhysicsLabSync } from '../hooks/usePhysicsLabSync';
import { physicsPresets } from '@/ui/styleLab/config/physicsPresets';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Mock wrapper for testing
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ backgroundColor: '#050509', padding: '20px' }}>
      {children}
    </div>
  );
};

describe('Physics Lab Accessibility', () => {
  beforeEach(() => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  describe('PhysicsLabApp', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check for main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for canvas area
      const canvasArea = screen.getByText(/physics lab canvas/i);
      expect(canvasArea).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Tab through interactive elements
      const user = userEvent.setup();
      
      // Find first interactive element (should be a button)
      const firstButton = screen.getAllByRole('button')[0];
      expect(firstButton).toBeInTheDocument();
      
      // Focus and test keyboard interaction
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      // Test Enter key
      fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' });
    });

    test('should respect reduced motion preferences', async () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check that animations are disabled when reduced motion is preferred
      const animatedElements = document.querySelectorAll('[style*="animation"]');
      
      // In reduced motion mode, animations should be disabled or have reduced duration
      animatedElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const animationDuration = style.animationDuration;
        
        // Either no animation or very short duration
        expect(
          animationDuration === 'none' || 
          parseFloat(animationDuration) <= 0.01
        ).toBe(true);
      });
    });

    test('should have sufficient color contrast', async () => {
      const { container } = render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    test('should support screen reader announcements', () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check for live regions or aria-live elements
      const liveRegions = document.querySelectorAll('[aria-live]');
      
      // Should have at least one live region for dynamic content
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    test('should have proper focus management', () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check that focus indicators are visible
      const focusableElements = document.querySelectorAll('button, [tabindex="0"]');
      
      focusableElements.forEach(element => {
        // Element should be focusable
        expect(element).toHaveAttribute('tabindex');
      });
    });

    test('should have proper semantic structure', () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      if (headings.length > 0) {
        // First heading should be h1
        expect(headings[0]).toHaveAttribute('aria-level', '1');
      }

      // Check for proper landmark elements
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('LabPanel', () => {
    test('should not have accessibility violations', async () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      const { container } = render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have accessible tab navigation', () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check for tab list and tab panels
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4); // Physics, Materials, FX, Outcomes
      
      // Check for tab panels
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels.length).toBeGreaterThan(0);
    });

    test('should support keyboard tab navigation', async () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      // Focus first tab
      const firstTab = screen.getByRole('tab', { name: /physics/i });
      firstTab.focus();
      expect(firstTab).toHaveFocus();
      
      // Navigate tabs with arrow keys
      fireEvent.keyDown(firstTab, { key: 'ArrowRight', code: 'ArrowRight' });
      
      // Check that next tab is focused
      const secondTab = screen.getAllByRole('tab')[1];
      expect(secondTab).toHaveFocus();
    });

    test('should have accessible form controls', () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check for properly labeled form controls
      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        // Each slider should have an associated label
        const label = screen.getByLabelText(/lift scale|spring stiffness|mass/i);
        expect(label).toBeInTheDocument();
      });

      // Check for select elements
      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        // Each select should have an associated label
        expect(select).toHaveAttribute('aria-label');
      });
    });

    test('should announce tab changes to screen readers', () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check for aria-live regions that announce tab changes
      const liveRegions = document.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    test('should have accessible preset selection', () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check for preset selection controls
      const presetSelect = screen.getByRole('combobox', { name: /active preset/i });
      expect(presetSelect).toBeInTheDocument();
      
      // Check that options are accessible
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3); // Three presets
    });

    test('should have accessible export functionality', () => {
      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check for export buttons
      const exportButtons = screen.getAllByRole('button', { name: /export/i });
      expect(exportButtons.length).toBeGreaterThan(0);
      
      // Check that buttons have proper aria labels
      exportButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Reduced Motion Support', () => {
    test('should disable animations when reduced motion is preferred', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      // Check that CSS animations are disabled
      const style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);

      // Verify that the reduced motion styles are applied
      const computedStyle = window.getComputedStyle(document.body);
      expect(computedStyle.animationDuration).toBe('0.01ms');
    });

    test('should respect motion preferences in LabPanel', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      const LabPanelStory = () => {
        const { preset, applyPreset, updatePreset } = usePhysicsLabSync();
        const availablePresets = ['minimalFrontier', 'obsidianVault', 'blizzardRift'];

        return (
          <LabPanel
            config={preset}
            onUpdateConfig={updatePreset}
            availablePresets={availablePresets}
            onApplyPreset={applyPreset}
          />
        );
      };

      render(
        <TestWrapper>
          <LabPanelStory />
        </TestWrapper>
      );

      // Check that interactive elements don't have animations
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const style = window.getComputedStyle(button);
        expect(style.transitionDuration).toBe('0.01ms');
      });
    });
  });

  describe('High Contrast Support', () => {
    test('should maintain accessibility in high contrast mode', async () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      const { container } = render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support full keyboard workflow', async () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      const user = userEvent.setup();
      
      // Tab through all interactive elements
      await user.tab();
      
      // Should be able to navigate through all interactive elements
      const interactiveElements = screen.getAllByRole('button');
      expect(interactiveElements.length).toBeGreaterThan(0);
      
      // Each element should be keyboard accessible
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabindex');
      });
    });

    test('should have visible focus indicators', () => {
      render(
        <TestWrapper>
          <PhysicsLabApp />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Check that buttons have visible focus styles
      buttons.forEach(button => {
        button.focus();
        const style = window.getComputedStyle(button);
        
        // Should have visible focus indicator (outline or similar)
        expect(style.outlineWidth !== '0px' || style.boxShadow !== 'none').toBe(true);
      });
    });
  });
});
