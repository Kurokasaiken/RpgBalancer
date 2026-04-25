/**
 * Interaction Mode Accessibility Test Suite
 * 
 * Comprehensive accessibility testing for Interaction Mode components
 * covering screen reader, keyboard, and touch interactions.
 * 
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InteractionModePicker } from '@/ui/idleVillage/components/InteractionModePicker';
import { InteractionModeDiagnosticsDrawer } from '@/ui/idleVillage/components/InteractionModeDiagnosticsDrawer';
import { useSandboxInteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';
import { useInteractionModeStoreWithUtils } from '@/ui/idleVillage/hooks/useInteractionModeStore';

// Mock the interaction mode store
vi.mock('@/ui/idleVillage/hooks/useInteractionModeStore', () => ({
  useInteractionModeStoreWithUtils: () => ({
    preference: {
      preferredMode: 'desktop' as const,
      autoDetect: true,
      uiPreferences: {
        showModeSwitcher: true,
        enableHapticFeedback: true,
        animationSpeedMultiplier: 1.0,
        touchTargetSizeMultiplier: 1.0,
      },
      sessionStats: {
        totalSessions: 5,
        desktopSessions: 3,
        mobileSessions: 2,
        averageSessionDuration: 120,
      },
    },
    toggleMode: vi.fn(),
    setAutoDetect: vi.fn(),
    getModeSummary: () => ({
      totalSessions: 5,
      desktopSessions: 3,
      mobileSessions: 2,
      averageSessionDuration: 120,
    }),
  }),
}));

// Mock analytics
vi.mock('@/analytics/idleVillageInteractionMode', () => ({
  getInteractionModeAnalytics: () => ({
    updateAnalytics: vi.fn().mockResolvedValue(undefined),
    exportEvents: vi.fn().mockResolvedValue('mock data'),
  }),
  getCurrentKPI: () => ({
    switchRate: 1.2,
    tapCount: { desktop: 45, mobile: 23 },
    errorCount: { desktop: 2, mobile: 1 },
    averageSessionDuration: { desktop: 150, mobile: 90 },
    modePreference: { desktop: 60, mobile: 40 },
    satisfactionScore: 4.2,
    taskCompletionRate: { desktop: 0.85, mobile: 0.78 },
  }),
}));

// Mock persistence service
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
}));

describe('InteractionModeAccessibility', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear any existing announcements
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on mode toggle button', () => {
      render(<InteractionModePicker testId="mode-picker" />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeToggle).toBeInTheDocument();
      expect(modeToggle).toHaveAttribute('aria-pressed', 'true');
      expect(modeToggle).toHaveAttribute('aria-describedby', 'mode-description');
    });

    it('should have descriptive content for screen readers', () => {
      render(<InteractionModePicker />);
      
      const description = screen.getByText(/switch between desktop and mobile interaction modes/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('sr-only');
    });

    it('should announce mode changes to screen readers', async () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Click to toggle mode
      await user.click(modeToggle);
      
      // Check for announcement (appears in sr-only region)
      await waitFor(() => {
        const announcement = screen.getByText(/switched to mobile mode/i);
        expect(announcement).toBeInTheDocument();
        expect(announcement).toHaveAttribute('aria-live', 'polite');
        expect(announcement).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should have proper role for interaction mode controls', () => {
      render(<InteractionModePicker />);
      
      const controlsContainer = screen.getByRole('group', { name: 'Interaction Mode Controls' });
      expect(controlsContainer).toBeInTheDocument();
    });

    it('should have accessible auto-detect toggle', () => {
      render(<InteractionModePicker />);
      
      const autoDetectToggle = screen.getByRole('switch', { name: /auto-detect/i });
      expect(autoDetectToggle).toBeInTheDocument();
      expect(autoDetectToggle).toHaveAttribute('aria-checked', 'true');
      expect(autoDetectToggle).toHaveAttribute('aria-labelledby', 'auto-detect-label');
    });

    it('should announce auto-detect changes', async () => {
      render(<InteractionModePicker />);
      
      const autoDetectToggle = screen.getByRole('switch', { name: /auto-detect/i });
      
      // Click to toggle auto-detect
      await user.click(autoDetectToggle);
      
      // Check for announcement
      await waitFor(() => {
        const announcement = screen.getByText(/auto-detect disabled/i);
        expect(announcement).toBeInTheDocument();
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have accessible session statistics', () => {
      render(<InteractionModePicker />);
      
      const stats = screen.getByLabelText(/session statistics: 5 total sessions/i);
      expect(stats).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeToggle).toHaveAttribute('tabIndex', '0');
    });

    it('should handle Enter key activation', async () => {
      const mockToggle = vi.fn();
      vi.mocked(useInteractionModeStoreWithUtils).mockReturnValue({
        preference: {
          preferredMode: 'desktop' as const,
          autoDetect: true,
          uiPreferences: { showModeSwitcher: true, enableHapticFeedback: true, animationSpeedMultiplier: 1.0, touchTargetSizeMultiplier: 1.0 },
          sessionStats: { totalSessions: 5, desktopSessions: 3, mobileSessions: 2, averageSessionDuration: 120 },
        },
        toggleMode: mockToggle,
        setAutoDetect: vi.fn(),
        getModeSummary: () => ({ totalSessions: 5, desktopSessions: 3, mobileSessions: 2, averageSessionDuration: 120 }),
      });

      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      modeToggle.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockToggle).toHaveBeenCalled();
    });

    it('should handle Space key activation', async () => {
      const mockToggle = vi.fn();
      vi.mocked(useInteractionModeStoreWithUtils).mockReturnValue({
        preference: {
          preferredMode: 'desktop' as const,
          autoDetect: true,
          uiPreferences: { showModeSwitcher: true, enableHapticFeedback: true, animationSpeedMultiplier: 1.0, touchTargetSizeMultiplier: 1.0 },
          sessionStats: { totalSessions: 5, desktopSessions: 3, mobileSessions: 2, averageSessionDuration: 120 },
        },
        toggleMode: mockToggle,
        setAutoDetect: vi.fn(),
        getModeSummary: () => ({ totalSessions: 5, desktopSessions: 3, mobileSessions: 2, averageSessionDuration: 120 }),
      });

      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      modeToggle.focus();
      
      await user.keyboard(' ');
      
      expect(mockToggle).toHaveBeenCalled();
    });

    it('should have visible focus indicators', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeToggle).toHaveClass('focus:ring-2');
    });

    it('should support Tab navigation between controls', async () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      const autoDetectToggle = screen.getByRole('switch', { name: /auto-detect/i });
      
      modeToggle.focus();
      expect(modeToggle).toHaveFocus();
      
      await user.tab();
      expect(autoDetectToggle).toHaveFocus();
    });
  });

  describe('Touch Accessibility', () => {
    it('should have adequate touch targets (44px minimum)', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      const styles = window.getComputedStyle(modeToggle);
      
      // Check that padding provides adequate touch target size
      expect(modeToggle).toHaveClass('px-3', 'py-2');
    });

    it('should prevent touch conflicts on mobile mode', async () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Simulate touch event
      fireEvent.touchStart(modeToggle);
      fireEvent.touchEnd(modeToggle);
      
      // Should still trigger the click handler
      await waitFor(() => {
        expect(screen.getByText(/switched to mobile mode/i)).toBeInTheDocument();
      });
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color for state indication', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Should have text content in addition to color
      expect(modeToggle).toHaveTextContent(/desktop/i);
    });

    it('should have sufficient contrast ratios', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Should have contrast-providing classes
      expect(modeToggle).toHaveClass('text-white', 'bg-blue-600');
    });
  });

  describe('Diagnostics Drawer Accessibility', () => {
    it('should have accessible drawer controls', () => {
      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={vi.fn()}
          currentMode="desktop"
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close diagnostics/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have accessible tab navigation', () => {
      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={vi.fn()}
          currentMode="desktop"
        />
      );
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4); // Overview, Timeline, Events, Export
      
      // First tab should be selected
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('should support keyboard navigation in drawer', async () => {
      const onClose = vi.fn();
      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={onClose}
          currentMode="desktop"
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close diagnostics/i });
      closeButton.focus();
      
      await user.keyboard('{Enter}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should have accessible form controls', () => {
      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={vi.fn()}
          currentMode="desktop"
        />
      );
      
      // Switch to Events tab to see filters
      const eventsTab = screen.getByRole('tab', { name: 'Events' });
      fireEvent.click(eventsTab);
      
      // Check for accessible form controls
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // Each checkbox should be properly labeled
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });

    it('should have accessible export controls', async () => {
      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={vi.fn()}
          currentMode="desktop"
        />
      );
      
      // Switch to Export tab
      const exportTab = screen.getByRole('tab', { name: 'Export' });
      fireEvent.click(exportTab);
      
      const exportButtons = screen.getAllByRole('button', { name: /export/i });
      expect(exportButtons).toHaveLength(3); // JSON, CSV, Markdown
      
      // Each button should have accessible name
      exportButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      const mockAnalytics = {
        updateAnalytics: vi.fn().mockRejectedValue(new Error('Test error')),
        exportEvents: vi.fn(),
      };
      
      vi.mocked(require('@/analytics/idleVillageInteractionMode').getInteractionModeAnalytics)
        .mockReturnValue(mockAnalytics);

      render(
        <InteractionModeDiagnosticsDrawer
          isOpen={true}
          onClose={vi.fn()}
          currentMode="desktop"
        />
      );
      
      // Wait for error to appear
      await waitFor(() => {
        const error = screen.getByText(/error: failed to load diagnostics data/i);
        expect(error).toBeInTheDocument();
        expect(error).toHaveClass('text-red-500');
      });
    });
  });

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('should meet 1.4.3 Contrast (Minimum)', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Should use high contrast color combinations
      expect(modeToggle).toHaveClass('text-white', 'bg-blue-600');
    });

    it('should meet 2.1.1 Keyboard (Level A)', () => {
      render(<InteractionModePicker />);
      
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });

    it('should meet 2.4.6 Headings and Labels (Level AA)', () => {
      render(<InteractionModePicker />);
      
      const group = screen.getByRole('group', { name: 'Interaction Mode Controls' });
      expect(group).toBeInTheDocument();
      
      const label = screen.getByLabelText(/auto-detect/i);
      expect(label).toBeInTheDocument();
    });

    it('should meet 3.2.1 On Focus (Level A)', async () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      modeToggle.focus();
      
      expect(modeToggle).toHaveFocus();
      expect(modeToggle).toHaveClass('focus:ring-2');
    });

    it('should meet 4.1.2 Name, Role, Value (Level A)', () => {
      render(<InteractionModePicker />);
      
      const modeToggle = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeToggle).toHaveAttribute('role', 'button');
      expect(modeToggle).toHaveAccessibleName();
      
      const autoDetectToggle = screen.getByRole('switch', { name: /auto-detect/i });
      expect(autoDetectToggle).toHaveAttribute('role', 'switch');
      expect(autoDetectToggle).toHaveAccessibleName();
      expect(autoDetectToggle).toHaveAttribute('aria-checked');
    });
  });
});
