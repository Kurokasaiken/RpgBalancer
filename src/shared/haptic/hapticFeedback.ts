/**
 * Haptic Feedback Core
 * Vibration API wrapper with pattern library and user preferences
 * 
 * @see NP-212 – Haptic Feedback System
 */

import type { HapticConfig, HapticPattern, HapticPatternDefinition } from './hapticConfig';
import {
  DEFAULT_HAPTIC_CONFIG,
  isHapticSupported,
  isMobileDevice,
  getPattern,
  applyIntensity,
} from './hapticConfig';

/**
 * Haptic feedback manager
 */
export class HapticFeedback {
  private config: HapticConfig;
  private isSupported: boolean;
  private isMobile: boolean;
  private lastVibrationTime: number = 0;
  private minVibrationInterval: number = 50; // ms

  constructor(config: Partial<HapticConfig> = {}) {
    this.config = {
      ...DEFAULT_HAPTIC_CONFIG,
      ...config,
    };
    this.isSupported = isHapticSupported();
    this.isMobile = isMobileDevice();
  }

  /**
   * Trigger haptic feedback by pattern name
   */
  trigger(patternName: HapticPattern): boolean {
    // Check if haptic is enabled
    if (!this.config.enabled || !this.config.preferences.enabled) {
      return false;
    }

    // Check mobile-only restriction
    if (this.config.mobileOnly && !this.isMobile) {
      this.logFallback(patternName, 'Not on mobile device');
      return false;
    }

    // Check if pattern is enabled in preferences
    if (!this.config.preferences.enabledPatterns.includes(patternName)) {
      this.logFallback(patternName, 'Pattern disabled in preferences');
      return false;
    }

    // Check if device supports haptic
    if (!this.isSupported) {
      this.logFallback(patternName, 'Haptic not supported');
      return false;
    }

    // Throttle vibrations
    const now = Date.now();
    if (now - this.lastVibrationTime < this.minVibrationInterval) {
      return false;
    }

    // Get pattern definition
    const patternDef = getPattern(patternName, this.config);
    if (!patternDef) {
      console.warn(`[HapticFeedback] Pattern not found: ${patternName}`);
      return false;
    }

    // Apply intensity
    const intensity = this.config.preferences.intensity * (patternDef.intensity || 1.0);
    const pattern = applyIntensity(patternDef.pattern, intensity);

    // Trigger vibration
    try {
      navigator.vibrate(pattern);
      this.lastVibrationTime = now;
      
      if (this.config.fallback.showConsoleLog) {
        console.log(`[HapticFeedback] Triggered: ${patternName}`, pattern);
      }
      
      return true;
    } catch (error) {
      console.error(`[HapticFeedback] Error triggering vibration:`, error);
      return false;
    }
  }

  /**
   * Trigger custom pattern
   */
  triggerCustom(pattern: number[]): boolean {
    if (!this.config.enabled || !this.config.preferences.enabled) {
      return false;
    }

    if (this.config.mobileOnly && !this.isMobile) {
      return false;
    }

    if (!this.isSupported) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastVibrationTime < this.minVibrationInterval) {
      return false;
    }

    try {
      const intensity = this.config.preferences.intensity;
      const adjustedPattern = applyIntensity(pattern, intensity);
      navigator.vibrate(adjustedPattern);
      this.lastVibrationTime = now;
      return true;
    } catch (error) {
      console.error(`[HapticFeedback] Error triggering custom vibration:`, error);
      return false;
    }
  }

  /**
   * Stop all vibrations
   */
  stop(): void {
    if (this.isSupported) {
      try {
        navigator.vibrate(0);
      } catch (error) {
        console.error(`[HapticFeedback] Error stopping vibration:`, error);
      }
    }
  }

  /**
   * Log fallback
   */
  private logFallback(patternName: HapticPattern, reason: string): void {
    if (this.config.fallback.showConsoleLog) {
      console.log(`[HapticFeedback] Fallback for ${patternName}: ${reason}`);
    }

    if (this.config.fallback.showVisualFeedback) {
      // Visual feedback could be implemented here
      // e.g., flash animation, screen shake, etc.
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HapticConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<HapticConfig['preferences']>): void {
    this.config.preferences = {
      ...this.config.preferences,
      ...preferences,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  /**
   * Get user preferences
   */
  getPreferences(): HapticConfig['preferences'] {
    return { ...this.config.preferences };
  }

  /**
   * Check if haptic is available
   */
  isAvailable(): boolean {
    return this.isSupported && (!this.config.mobileOnly || this.isMobile);
  }

  /**
   * Get available patterns
   */
  getAvailablePatterns(): HapticPattern[] {
    return Object.keys(this.config.patterns) as HapticPattern[];
  }

  /**
   * Get pattern definition
   */
  getPatternDefinition(patternName: HapticPattern): HapticPatternDefinition | null {
    return this.config.patterns[patternName] || null;
  }
}

/**
 * Global haptic feedback instance
 */
let globalHapticFeedback: HapticFeedback | null = null;

/**
 * Get global haptic feedback instance
 */
export function getHapticFeedback(config?: Partial<HapticConfig>): HapticFeedback {
  if (!globalHapticFeedback) {
    globalHapticFeedback = new HapticFeedback(config);
  }
  return globalHapticFeedback;
}

/**
 * Reset global haptic feedback instance
 */
export function resetHapticFeedback(): void {
  globalHapticFeedback = null;
}

/**
 * Quick trigger functions
 */
export const haptic = {
  tap: () => getHapticFeedback().trigger('tap'),
  success: () => getHapticFeedback().trigger('success'),
  error: () => getHapticFeedback().trigger('error'),
  warning: () => getHapticFeedback().trigger('warning'),
  impactLight: () => getHapticFeedback().trigger('impact_light'),
  impactMedium: () => getHapticFeedback().trigger('impact_medium'),
  impactHeavy: () => getHapticFeedback().trigger('impact_heavy'),
  selection: () => getHapticFeedback().trigger('selection'),
  notification: () => getHapticFeedback().trigger('notification'),
  stop: () => getHapticFeedback().stop(),
};
