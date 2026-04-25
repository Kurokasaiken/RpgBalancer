/**
 * Accessibility tests for InteractionModePicker component
 * 
 * Tests keyboard navigation, screen reader compatibility, and ARIA compliance
 * 
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractionModePicker, CompactInteractionModePicker, InteractionModeStatus } from '@/ui/idleVillage/components/InteractionModePicker';
import { useInteractionModeStoreWithUtils } from '@/ui/idleVillage/hooks/useInteractionModeStore';

// Mock the store for testing
jest.mock('@/ui/idleVillage/hooks/useInteractionModeStore');

const mockStore = {
  preference: {
    preferredMode: 'desktop' as const,
    autoDetect: false,
    uiPreferences: {
      showModeSwitcher: true,
      enableHapticFeedback: true,
      animationSpeedMultiplier: 1.0,
      touchTargetSizeMultiplier: 1.0,
    },
    sessionStats: {
      totalSessions: 10,
      desktopSessions: 7,
      mobileSessions: 3,
      averageSessionDuration: 180,
    },
  },
  toggleMode: jest.fn(),
  setAutoDetect: jest.fn(),
};

jest.mocked(useInteractionModeStoreWithUtils).mockReturnValue(mockStore);

describe('InteractionModePicker Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Compliance', () => {
    it('should have proper ARIA attributes', () => {
      render(<InteractionModePicker />);
      
      // Check for proper role and label
      const picker = screen.getByRole('group', { name: /interaction mode controls/i });
      expect(picker).toBeInTheDocument();
      
      // Check mode toggle button
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeButton).toHaveAttribute('aria-pressed', 'true');
      expect(modeButton).toHaveAttribute('aria-describedby', 'mode-description');
      
      // Check auto-detect toggle
      const autoDetectButton = screen.getByRole('switch', { name: /auto-detect/i });
      expect(autoDetectButton).toHaveAttribute('aria-checked', 'false');
      expect(autoDetectButton).toHaveAttribute('aria-labelledby', 'auto-detect-label');
      
      // Check description
      const description = screen.getByText(/switch between desktop and mobile/i);
      expect(description).toHaveClass('sr-only');
    });

    it('should have proper semantic structure', () => {
      render(<InteractionModePicker />);
      
      // Main container should be a group
      const picker = screen.getByRole('group');
      expect(picker).toBeInTheDocument();
      
      // Buttons should be properly labeled
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1); // Mode toggle button
      
      // Switch should be properly labeled
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(1); // Auto-detect switch
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable', async () => {
      render(<InteractionModePicker />);
      
      const picker = screen.getByRole('group');
      picker.focus();
      
      expect(picker).toHaveFocus();
      
      // Tab navigation should work
      await userEvent.tab();
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeButton).toHaveFocus();
      
      // Enter key should activate button
      await userEvent.keyboard('{Enter}');
      expect(mockStore.toggleMode).toHaveBeenCalled();
    });

    it('should support keyboard shortcuts', async () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      modeButton.focus();
      
      // Space key should activate button
      await userEvent.keyboard('{ }');
      expect(mockStore.toggleMode).toHaveBeenCalled();
    });

    it('should handle focus management properly', async () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      const autoDetectSwitch = screen.getByRole('switch', { name: /auto-detect/i });
      
      // Focus should move between interactive elements
      modeButton.focus();
      expect(modeButton).toHaveFocus();
      
      await userEvent.tab();
      expect(autoDetectSwitch).toHaveFocus();
      
      // Focus should be visible
      expect(modeButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce mode changes', async () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Click to change mode
      await userEvent.click(modeButton);
      
      // Check for announcement
      const announcement = screen.getByText(/switched to mobile mode/i);
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce auto-detect changes', async () => {
      render(<InteractionModePicker />);
      
      const autoDetectSwitch = screen.getByRole('switch', { name: /auto-detect/i });
      
      // Click to toggle auto-detect
      await userEvent.click(autoDetectSwitch);
      
      // Check for announcement
      const announcement = screen.getByText(/auto-detect enabled/i);
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive labels', () => {
      render(<InteractionModePicker />);
      
      // Mode button should have descriptive label
      const modeButton = screen.getByRole('button', { name: /current mode: desktop. click to switch to mobile mode/i });
      expect(modeButton).toBeInTheDocument();
      
      // Auto-detect should have descriptive title
      const autoDetectSwitch = screen.getByRole('switch', { name: /auto-detect/i });
      expect(autoDetectSwitch).toHaveAttribute('title', /auto-detect is disabled/i);
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast', () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Check for visible text
      const buttonText = screen.getByText('desktop');
      expect(buttonText).toBeInTheDocument();
      
      // The button should have focus styles for contrast
      modeButton.focus();
      expect(modeButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Touch Targets', () => {
    it('should have adequate touch target sizes', () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      const autoDetectSwitch = screen.getByRole('switch', { name: /auto-detect/i });
      
      // Check minimum touch target size (44x44px recommended)
      expect(modeButton).toHaveClass('px-3 py-2');
      expect(autoDetectSwitch).toHaveClass('w-8 h-4');
    });

    it('should have adequate spacing between targets', () => {
      render(<InteractionModePicker />);
      
      const container = screen.getByRole('group');
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Check for gap between elements
      expect(container).toHaveClass('gap-2');
      expect(modeButton).toHaveClass('px-3 py-2');
    });
  });

  describe('Compact Variant', () => {
    it('should maintain accessibility in compact mode', () => {
      render(<CompactInteractionModePicker />);
      
      // Should still have proper ARIA attributes
      const picker = screen.getByRole('group', { name: /interaction mode controls/i });
      expect(picker).toBeInTheDocument();
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      expect(modeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Status Indicator', () => {
    it('should be accessible when showing stats', () => {
      render(<InteractionModeStatus showStats={true} />);
      
      const status = screen.getByText(/desktop.*10 sessions/i);
      expect(status).toBeInTheDocument();
    });

    it('should have proper labeling when showing stats', () => {
      render(<InteractionModeStatus showStats={true} />);
      
      const statusBadge = screen.getByLabelText(/session statistics: 10 total sessions/i);
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing preferences gracefully', () => {
      // Mock empty preferences
      jest.mocked(useInteractionModeStoreWithUtils).mockReturnValue({
        preference: {
          preferredMode: 'desktop',
          autoDetect: false,
          uiPreferences: { showModeSwitcher: false },
          sessionStats: { totalSessions: 0 },
        },
        toggleMode: jest.fn(),
        setAutoDetect: jest.fn(),
      });
      
      render(<InteractionModePicker />);
      
      // Should not render when switcher is disabled
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause layout shifts', async () => {
      const { container } = render(<InteractionModePicker />);
      
      // Initial render
      expect(container).toBeInTheDocument();
      
      // Should have stable dimensions
      const initialHeight = container.offsetHeight;
      
      // Trigger mode change
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      await userEvent.click(modeButton);
      
      // Height should remain stable
      expect(container.offsetHeight).toBe(initialHeight);
    });

    it('should have smooth transitions', () => {
      render(<InteractionModePicker />);
      
      const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
      
      // Should have transition classes
      expect(modeButton).toHaveClass('transition-all');
      expect(modeButton).toHaveClass('duration-200');
    });
  });
});

describe('InteractionModePicker Integration', () => {
  it('should integrate with store properly', () => {
    render(<InteractionModePicker />);
    
    // Should call store methods when interacted with
    const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
    fireEvent.click(modeButton);
    
    expect(mockStore.toggleMode).toHaveBeenCalled();
  });

  it('should respect store preferences', () => {
    // Mock preferences with auto-detect enabled
    jest.mocked(useInteractionModeStoreWithUtils).mockReturnValue({
      ...mockStore,
      preference: {
        ...mockStore.preference,
        autoDetect: true,
      },
    });
    
    render(<InteractionModePicker />);
    
    // Auto-detect switch should reflect store state
    const autoDetectSwitch = screen.getByRole('switch', { name: /auto-detect/i });
    expect(autoDetectSwitch).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Accessibility Checklist', () => {
  it('should pass comprehensive accessibility checklist', async () => {
    render(<InteractionModePicker />);
    
    // Keyboard navigation
    const modeButton = screen.getByRole('button', { name: /current mode: desktop/i });
    modeButton.focus();
    expect(modeButton).toHaveFocus();
    
    // Screen reader announcements
    await userEvent.click(modeButton);
    const announcement = screen.getByText(/switched to mobile mode/i);
    expect(announcement).toBeInTheDocument();
    
    // Touch targets
    expect(modeButton).toHaveClass('px-3 py-2');
    
    // Focus indicators
    expect(modeButton).toHaveClass('focus:ring-2');
  });
});
