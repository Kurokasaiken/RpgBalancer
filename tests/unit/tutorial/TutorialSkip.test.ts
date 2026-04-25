/**
 * Tutorial Skip System Tests - NP-219
 * 
 * Comprehensive test suite for tutorial skip system.
 * 
 * @since 2026-01-24
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TutorialSkipPrompt } from '@/ui/tutorial/components/TutorialSkipPrompt';
import {
  DEFAULT_TUTORIAL_SKIP_CONFIG,
  type TutorialSkipConfig,
  type SkipDecision,
  type SkipReason,
  type ExperienceLevel,
  type SkipTracking,
  generateTrackingId,
  isReturningUser,
  isExperiencedUser,
  hasCompletedTutorial,
  hasSpentEnoughTime,
  shouldShowSkipPrompt,
  getExperienceLevel,
  formatSessionCount,
  formatTime,
  calculateSkipRate,
  generateSkipSummary,
  validateConfig,
  STORAGE_KEYS,
} from '@/ui/tutorial/config/tutorialSkipConfig';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
});

describe('Tutorial Skip Configuration', () => {
  describe('generateTrackingId', () => {
    it('should generate unique tracking IDs', () => {
      const id1 = generateTrackingId();
      const id2 = generateTrackingId();
      
      expect(id1).toMatch(/^skip_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^skip_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in ID', () => {
      const id = generateTrackingId();
      const timestamp = parseInt(id.split('_')[1]);
      
      expect(timestamp).toBeCloseTo(Date.now(), 1000);
    });
  });

  describe('User Detection Functions', () => {
    it('should identify returning users', () => {
      expect(isReturningUser(2, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
      expect(isReturningUser(1, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
      expect(isReturningUser(0, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });

    it('should identify experienced users', () => {
      expect(isExperiencedUser(5, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
      expect(isExperiencedUser(4, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
      expect(isExperiencedUser(2, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });

    it('should check tutorial completion', () => {
      expect(hasCompletedTutorial(1, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
      expect(hasCompletedTutorial(0, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });

    it('should check time spent', () => {
      expect(hasSpentEnoughTime(60000, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
      expect(hasSpentEnoughTime(30000, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });
  });

  describe('shouldShowSkipPrompt', () => {
    it('should show prompt for returning users', () => {
      const userData = {
        sessionCount: 2,
        completionCount: 0,
        timeInSession: 0,
        skipCount: 0,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
    });

    it('should show prompt for experienced users', () => {
      const userData = {
        sessionCount: 5,
        completionCount: 0,
        timeInSession: 0,
        skipCount: 0,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
    });

    it('should show prompt for users who completed tutorial', () => {
      const userData = {
        sessionCount: 1,
        completionCount: 1,
        timeInSession: 0,
        skipCount: 0,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
    });

    it('should show prompt for users who spent enough time', () => {
      const userData = {
        sessionCount: 1,
        completionCount: 0,
        timeInSession: 70000,
        skipCount: 0,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(true);
    });

    it('should not show prompt for new users', () => {
      const userData = {
        sessionCount: 1,
        completionCount: 0,
        timeInSession: 0,
        skipCount: 0,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });

    it('should respect frequency limits', () => {
      const userData = {
        sessionCount: 2,
        completionCount: 0,
        timeInSession: 0,
        skipCount: 1,
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });

    it('should respect cooldown period', () => {
      const userData = {
        sessionCount: 2,
        completionCount: 0,
        timeInSession: 0,
        skipCount: 0,
        lastSkipTime: Date.now() - 100000, // 100 seconds ago
      };
      
      expect(shouldShowSkipPrompt(userData, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe(false);
    });
  });

  describe('getExperienceLevel', () => {
    it('should return correct experience levels', () => {
      expect(getExperienceLevel(1, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe('returning');
      expect(getExperienceLevel(2, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe('returning');
      expect(getExperienceLevel(4, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe('experienced');
      expect(getExperienceLevel(5, DEFAULT_TUTORIAL_SKIP_CONFIG)).toBe('expert');
    });
  });

  describe('formatSessionCount', () => {
    it('should format session counts correctly', () => {
      expect(formatSessionCount(1)).toBe('1st session');
      expect(formatSessionCount(2)).toBe('2nd session');
      expect(formatSessionCount(3)).toBe('3rd session');
      expect(formatSessionCount(4)).toBe('4th session');
      expect(formatSessionCount(10)).toBe('10th session');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(formatTime(1000)).toBe('1s');
      expect(formatTime(5000)).toBe('5s');
      expect(formatTime(60000)).toBe('1m 0s');
      expect(formatTime(65000)).toBe('1m 5s');
      expect(formatTime(3600000)).toBe('1h 0m');
      expect(formatTime(3665000)).toBe('1h 1m 5s');
    });
  });

  describe('calculateSkipRate', () => {
    it('should calculate skip rate correctly', () => {
      expect(calculateSkipRate(5, 10)).toBe(50);
      expect(calculateSkipRate(0, 10)).toBe(0);
      expect(calculateSkipRate(10, 10)).toBe(100);
      expect(calculateSkipRate(3, 0)).toBe(0);
    });
  });

  describe('generateSkipSummary', () => {
    it('should generate skip analytics summary', () => {
      const trackingData: SkipTracking[] = [
        {
          userId: 'user1',
          sessionId: 'session1',
          tutorialId: 'tutorial1',
          skipDecision: 'skip',
          skipReason: 'returning_user',
          experienceLevel: 'returning',
          sessionCount: 2,
          completionCount: 0,
          timeInSession: 30000,
          timestamp: Date.now(),
        },
        {
          userId: 'user2',
          sessionId: 'session2',
          tutorialId: 'tutorial1',
          skipDecision: 'play',
          skipReason: undefined,
          experienceLevel: 'new',
          sessionCount: 1,
          completionCount: 0,
          timeInSession: 10000,
          timestamp: Date.now(),
        },
      ];

      const summary = generateSkipSummary(trackingData);

      expect(summary.totalSkipRequests).toBe(2);
      expect(summary.skipDecisions.skip).toBe(1);
      expect(summary.skipDecisions.play).toBe(1);
      expect(summary.skipReasons.returning_user).toBe(1);
      expect(summary.experienceLevels.returning).toBe(1);
      expect(summary.experienceLevels.new).toBe(1);
      expect(summary.skipRates.overall).toBe(50);
    });

    it('should handle empty tracking data', () => {
      const summary = generateSkipSummary([]);

      expect(summary.totalSkipRequests).toBe(0);
      expect(summary.skipDecisions).toEqual({});
      expect(summary.skipReasons).toEqual({});
      expect(summary.experienceLevels).toEqual({});
      expect(summary.skipRates.overall).toBe(0);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      const config = {
        detection: {
          returningUserThreshold: 2,
          experiencedUserThreshold: 5,
          completionThreshold: 1,
          timeThreshold: 60000,
        },
        prompt: {
          maxShowFrequency: 1,
          cooldownPeriod: 300000,
        },
        replay: {
          maxReplayAttempts: 3,
          replayCooldown: 60000,
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const config = {
        detection: {
          returningUserThreshold: 0, // Invalid
          experiencedUserThreshold: 2, // Must be > returning
          completionThreshold: -1, // Invalid
          timeThreshold: -1000, // Invalid
        },
        prompt: {
          maxShowFrequency: 0, // Invalid
          cooldownPeriod: -1000, // Invalid
        },
        replay: {
          maxReplayAttempts: -1, // Invalid
          replayCooldown: -1000, // Invalid
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have correct storage keys', () => {
      expect(STORAGE_KEYS.USER_DATA).toBe('tutorial_skip_user_data');
      expect(STORAGE_KEYS.SESSION_DATA).toBe('tutorial_skip_session_data');
      expect(STORAGE_KEYS.ANALYTICS).toBe('tutorial_skip_analytics');
      expect(STORAGE_KEYS.CONFIG).toBe('tutorial_skip_config');
    });
  });
});

describe('TutorialSkipPrompt Component', () => {
  const mockOnDecision = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render skip prompt with default content', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Skip Tutorial?')).toBeInTheDocument();
    expect(screen.getByText(/Based on your experience/)).toBeInTheDocument();
    expect(screen.getByText('Returning Player')).toBeInTheDocument();
    expect(screen.getByText('Sessions:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Completions:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('should render with custom title and message', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="experienced"
        sessionCount={5}
        completionCount={2}
        timeInSession={45000}
        customTitle="Custom Title"
        customMessage="Custom message content"
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message content')).toBeInTheDocument();
    expect(screen.getByText('Experienced Player')).toBeInTheDocument();
  });

  it('should handle skip decision', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select a reason
    const reasonButton = screen.getByText("I've played this before");
    await user.click(reasonButton);

    // Click skip button
    const skipButton = screen.getByText('Skip Tutorial');
    await user.click(skipButton);

    expect(mockOnDecision).toHaveBeenCalledWith('skip', 'returning_user');
  });

  it('should handle play decision', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="new"
        sessionCount={1}
        completionCount={0}
        timeInSession={10000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    const playButton = screen.getByText('Play Tutorial');
    await user.click(playButton);

    expect(mockOnDecision).toHaveBeenCalledWith('play');
  });

  it('should handle defer decision', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowDefer: true } }}
      />
    );

    const deferButton = screen.getByText('Ask Me Later');
    await user.click(deferButton);

    expect(mockOnDecision).toHaveBeenCalledWith('defer');
  });

  it('should handle custom reason selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select "Other" reason
    const otherButton = screen.getByText('Other reason');
    await user.click(otherButton);

    // Enter custom reason
    const textarea = screen.getByPlaceholderText('Please explain why you want to skip...');
    await user.type(textarea, 'Custom reason text');

    // Submit custom reason
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    // Click skip button
    const skipButton = screen.getByText('Skip Tutorial');
    await user.click(skipButton);

    expect(mockOnDecision).toHaveBeenCalledWith('skip', 'other');
  });

  it('should disable skip button when no reason selected', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    const skipButton = screen.getByText('Skip Tutorial');
    expect(skipButton).toBeDisabled();
  });

  it('should enable skip button when reason selected', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    const reasonButton = screen.getByText("I've played this before");
    await user.click(reasonButton);

    const skipButton = screen.getByText('Skip Tutorial');
    expect(skipButton).not.toBeDisabled();
  });

  it('should handle close button click', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle overlay click', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByText('Skip Tutorial?').closest('.tutorial-skip-prompt')?.querySelector('.skip-prompt-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should show progress bar when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={3}
        completionCount={2}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showProgressBar: true } }}
      />
    );

    expect(screen.getByText('2 / 3 completed')).toBeInTheDocument();
  });

  it('should hide progress bar when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={3}
        completionCount={2}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showProgressBar: false } }}
      />
    );

    expect(screen.queryByText('2 / 3 completed')).not.toBeInTheDocument();
  });

  it('should show experience level when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="expert"
        sessionCount={5}
        completionCount={3}
        timeInSession={45000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showExperienceLevel: true } }}
      />
    );

    expect(screen.getByText('Expert Player')).toBeInTheDocument();
  });

  it('should hide experience level when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="expert"
        sessionCount={5}
        completionCount={3}
        timeInSession={45000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showExperienceLevel: false } }}
      />
    );

    expect(screen.queryByText('Expert Player')).not.toBeInTheDocument();
  });

  it('should show session count when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showSessionCount: true } }}
      />
    );

    expect(screen.getByText('Sessions:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should hide session count when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ ui: { showSessionCount: false } }}
      />
    );

    expect(screen.queryByText('Sessions:')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('should show replay option when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ replay: { showReplayOption: true } }}
      />
    );

    expect(screen.getByText(/You can replay this tutorial anytime/)).toBeInTheDocument();
  });

  it('should hide replay option when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ replay: { showReplayOption: false } }}
      />
    );

    expect(screen.queryByText(/You can replay this tutorial anytime/)).not.toBeInTheDocument();
  });

  it('should show defer option when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowDefer: true } }}
      />
    );

    expect(screen.getByText('Ask Me Later')).toBeInTheDocument();
  });

  it('should hide defer option when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowDefer: false } }}
      />
    );

    expect(screen.queryByText('Ask Me Later')).not.toBeInTheDocument();
  });

  it('should show force play option when enabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowForcePlay: true } }}
      />
    );

    expect(screen.getByText('Force Play')).toBeInTheDocument();
  });

  it('should hide force play option when disabled', () => {
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowForcePlay: false } }}
      />
    );

    expect(screen.queryByText('Force Play')).not.toBeInTheDocument();
  });

  it('should handle custom reason cancel', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select "Other" reason
    const otherButton = screen.getByText('Other reason');
    await user.click(otherButton);

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should hide custom reason input
    expect(screen.queryByPlaceholderText('Please explain why you want to skip...')).not.toBeInTheDocument();
    
    // Skip button should be disabled again
    const skipButton = screen.getByText('Skip Tutorial');
    expect(skipButton).toBeDisabled();
  });

  it('should handle custom reason submit without text', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select "Other" reason
    const otherButton = screen.getByText('Other reason');
    await user.click(otherButton);

    // Submit button should be disabled without text
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeDisabled();
  });

  it('should handle custom reason submit with text', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select "Other" reason
    const otherButton = screen.getByText('Other reason');
    await user.click(otherButton);

    // Enter custom reason
    const textarea = screen.getByPlaceholderText('Please explain why you want to skip...');
    await user.type(textarea, 'Custom reason text');

    // Submit button should be enabled with text
    const submitButton = screen.getByText('Submit');
    expect(submitButton).not.toBeDisabled();

    // Submit custom reason
    await user.click(submitButton);

    // Skip button should be enabled
    const skipButton = screen.getByText('Skip Tutorial');
    expect(skipButton).not.toBeDisabled();
  });
});

describe('Integration Tests', () => {
  const mockOnDecision = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle complete skip workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="experienced"
        sessionCount={5}
        completionCount={2}
        timeInSession={45000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{
          ui: {
            showProgressBar: true,
            showExperienceLevel: true,
            showSessionCount: true,
          },
          prompt: {
            allowDefer: true,
            allowForcePlay: true,
          },
          replay: {
            showReplayOption: true,
          },
        }}
      />
    );

    // Check all elements are present
    expect(screen.getByText('Skip Tutorial?')).toBeInTheDocument();
    expect(screen.getByText('Experienced Player')).toBeInTheDocument();
    expect(screen.getByText('Sessions:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Completions:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
    expect(screen.getByText('2 / 5 completed')).toBeInTheDocument();
    expect(screen.getByText('Ask Me Later')).toBeInTheDocument();
    expect(screen.getByText('Force Play')).toBeInTheDocument();
    expect(screen.getByText(/You can replay this tutorial anytime/)).toBeInTheDocument();

    // Select reason
    const reasonButton = screen.getByText("I'm experienced with this game");
    await user.click(reasonButton);

    // Skip tutorial
    const skipButton = screen.getByText('Skip Tutorial');
    await user.click(skipButton);

    expect(mockOnDecision).toHaveBeenCalledWith('skip', 'experienced_player');
  });

  it('should handle complete play workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="new"
        sessionCount={1}
        completionCount={0}
        timeInSession={10000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Play tutorial directly
    const playButton = screen.getByText('Play Tutorial');
    await user.click(playButton);

    expect(mockOnDecision).toHaveBeenCalledWith('play');
  });

  it('should handle complete defer workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
        config={{ prompt: { allowDefer: true } }}
      />
    );

    // Select reason
    const reasonButton = screen.getByText("I want to skip for now");
    await user.click(reasonButton);

    // Defer decision
    const deferButton = screen.getByText('Ask Me Later');
    await user.click(deferButton);

    expect(mockOnDecision).toHaveBeenCalledWith('defer', 'time_pressure');
  });

  it('should handle complete custom reason workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <TutorialSkipPrompt
        tutorialId="tutorial1"
        experienceLevel="returning"
        sessionCount={2}
        completionCount={0}
        timeInSession={30000}
        onDecision={mockOnDecision}
        onClose={mockOnClose}
      />
    );

    // Select "Other" reason
    const otherButton = screen.getByText('Other reason');
    await user.click(otherButton);

    // Enter custom reason
    const textarea = screen.getByPlaceholderText('Please explain why you want to skip...');
    await user.type(textarea, 'I have technical issues with the tutorial');

    // Submit custom reason
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    // Skip tutorial
    const skipButton = screen.getByText('Skip Tutorial');
    await user.click(skipButton);

    expect(mockOnDecision).toHaveBeenCalledWith('skip', 'other');
  });
});
