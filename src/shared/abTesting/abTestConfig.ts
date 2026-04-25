/**
 * A/B Test Configuration
 * Default configurations for A/B tests
 * 
 * @see NP-223 – A/B Test Framework
 */

import type { ABTestConfig } from './abTestFramework';

/**
 * Example A/B test: Install prompt timing
 */
export const INSTALL_PROMPT_TIMING_TEST: ABTestConfig = {
  testId: 'install_prompt_timing_v1',
  testName: 'Install Prompt Timing Optimization',
  enabled: true,
  variants: [
    {
      id: 'control',
      name: 'Control (Immediate)',
      weight: 0.5,
      config: {
        delayMs: 0,
        minInteractions: 0,
      },
    },
    {
      id: 'delayed',
      name: 'Delayed (3 interactions)',
      weight: 0.5,
      config: {
        delayMs: 5000,
        minInteractions: 3,
      },
    },
  ],
  targetAudience: {
    platforms: ['mobile'],
  },
};

/**
 * Example A/B test: Tutorial copy
 */
export const TUTORIAL_COPY_TEST: ABTestConfig = {
  testId: 'tutorial_copy_v1',
  testName: 'Tutorial Copy Optimization',
  enabled: true,
  variants: [
    {
      id: 'control',
      name: 'Control (Original)',
      weight: 0.5,
      config: {
        copyStyle: 'original',
      },
    },
    {
      id: 'simplified',
      name: 'Simplified Copy',
      weight: 0.5,
      config: {
        copyStyle: 'simplified',
      },
    },
  ],
};

/**
 * Example A/B test: Haptic feedback intensity
 */
export const HAPTIC_INTENSITY_TEST: ABTestConfig = {
  testId: 'haptic_intensity_v1',
  testName: 'Haptic Feedback Intensity',
  enabled: true,
  variants: [
    {
      id: 'control',
      name: 'Control (Medium)',
      weight: 0.33,
      config: {
        intensity: 'medium',
      },
    },
    {
      id: 'light',
      name: 'Light Intensity',
      weight: 0.33,
      config: {
        intensity: 'light',
      },
    },
    {
      id: 'strong',
      name: 'Strong Intensity',
      weight: 0.34,
      config: {
        intensity: 'strong',
      },
    },
  ],
  targetAudience: {
    platforms: ['mobile'],
  },
};

/**
 * All configured A/B tests
 */
export const AB_TESTS: Record<string, ABTestConfig> = {
  installPromptTiming: INSTALL_PROMPT_TIMING_TEST,
  tutorialCopy: TUTORIAL_COPY_TEST,
  hapticIntensity: HAPTIC_INTENSITY_TEST,
};
