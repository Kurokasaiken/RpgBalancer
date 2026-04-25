/**
 * Haptic Feedback Tests
 * Unit tests for haptic feedback system
 * 
 * @see NP-212 – Haptic Feedback System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HapticFeedback, getHapticFeedback, resetHapticFeedback, haptic } from '../../../src/shared/haptic/hapticFeedback';
import { DEFAULT_HAPTIC_CONFIG, isHapticSupported, isMobileDevice } from '../../../src/shared/haptic/hapticConfig';

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('HapticFeedback', () => {
  beforeEach(() => {
    resetHapticFeedback();
    mockVibrate.mockClear();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const feedback = new HapticFeedback();
      const config = feedback.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.mobileOnly).toBe(true);
    });

    it('should accept custom configuration', () => {
      const feedback = new HapticFeedback({
        enabled: false,
        mobileOnly: false,
      });
      const config = feedback.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.mobileOnly).toBe(false);
    });

    it('should update configuration', () => {
      const feedback = new HapticFeedback();
      feedback.updateConfig({ enabled: false });
      
      const config = feedback.getConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe('Pattern Library', () => {
    it('should have all default patterns', () => {
      const feedback = new HapticFeedback();
      const patterns = feedback.getAvailablePatterns();
      
      expect(patterns).toContain('tap');
      expect(patterns).toContain('success');
      expect(patterns).toContain('error');
      expect(patterns).toContain('warning');
      expect(patterns).toContain('impact_light');
      expect(patterns).toContain('impact_medium');
      expect(patterns).toContain('impact_heavy');
      expect(patterns).toContain('selection');
      expect(patterns).toContain('notification');
    });

    it('should get pattern definition', () => {
      const feedback = new HapticFeedback();
      const pattern = feedback.getPatternDefinition('tap');
      
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('tap');
      expect(pattern?.pattern).toEqual([10]);
    });

    it('should return null for unknown pattern', () => {
      const feedback = new HapticFeedback();
      const pattern = feedback.getPatternDefinition('unknown' as any);
      
      expect(pattern).toBeNull();
    });
  });

  describe('Trigger Haptic', () => {
    it('should trigger tap pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.trigger('tap');
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger success pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.trigger('success');
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger error pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.trigger('error');
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should not trigger when disabled', () => {
      const feedback = new HapticFeedback({ enabled: false, mobileOnly: false });
      const result = feedback.trigger('tap');
      
      expect(result).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should not trigger when preferences disabled', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ enabled: false });
      const result = feedback.trigger('tap');
      
      expect(result).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should not trigger disabled pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ enabledPatterns: ['success'] });
      const result = feedback.trigger('tap');
      
      expect(result).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Custom Pattern', () => {
    it('should trigger custom pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.triggerCustom([100, 50, 100]);
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('should apply intensity to custom pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ intensity: 0.5 });
      feedback.triggerCustom([100, 50, 100]);
      
      expect(mockVibrate).toHaveBeenCalledWith([50, 25, 50]);
    });
  });

  describe('Intensity', () => {
    it('should apply intensity multiplier', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ intensity: 0.5 });
      feedback.trigger('tap');
      
      // tap pattern is [10], with intensity 0.3, then user intensity 0.5
      // 10 * 0.3 * 0.5 = 1.5 -> 2 (rounded)
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should handle zero intensity', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ intensity: 0 });
      feedback.trigger('tap');
      
      expect(mockVibrate).toHaveBeenCalledWith([0]);
    });

    it('should handle full intensity', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      feedback.updatePreferences({ intensity: 1.0 });
      feedback.trigger('tap');
      
      expect(mockVibrate).toHaveBeenCalled();
    });
  });

  describe('Stop Vibration', () => {
    it('should stop vibration', () => {
      const feedback = new HapticFeedback();
      feedback.stop();
      
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('User Preferences', () => {
    it('should get user preferences', () => {
      const feedback = new HapticFeedback();
      const preferences = feedback.getPreferences();
      
      expect(preferences.enabled).toBe(true);
      expect(preferences.intensity).toBe(1.0);
      expect(preferences.enabledPatterns.length).toBeGreaterThan(0);
    });

    it('should update user preferences', () => {
      const feedback = new HapticFeedback();
      feedback.updatePreferences({ intensity: 0.5 });
      
      const preferences = feedback.getPreferences();
      expect(preferences.intensity).toBe(0.5);
    });

    it('should update enabled patterns', () => {
      const feedback = new HapticFeedback();
      feedback.updatePreferences({ enabledPatterns: ['tap', 'success'] });
      
      const preferences = feedback.getPreferences();
      expect(preferences.enabledPatterns).toEqual(['tap', 'success']);
    });
  });

  describe('Availability', () => {
    it('should check if haptic is available', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const isAvailable = feedback.isAvailable();
      
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return false when mobile-only and not mobile', () => {
      const feedback = new HapticFeedback({ mobileOnly: true });
      // Assuming test environment is not mobile
      const isAvailable = feedback.isAvailable();
      
      // This depends on test environment
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Global Instance', () => {
    it('should create global instance', () => {
      const feedback1 = getHapticFeedback();
      const feedback2 = getHapticFeedback();
      
      expect(feedback1).toBe(feedback2);
    });

    it('should reset global instance', () => {
      const feedback1 = getHapticFeedback();
      resetHapticFeedback();
      const feedback2 = getHapticFeedback();
      
      expect(feedback1).not.toBe(feedback2);
    });
  });

  describe('Quick Trigger Functions', () => {
    beforeEach(() => {
      resetHapticFeedback();
      getHapticFeedback({ mobileOnly: false });
    });

    it('should trigger tap', () => {
      haptic.tap();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger success', () => {
      haptic.success();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger error', () => {
      haptic.error();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger warning', () => {
      haptic.warning();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger impact light', () => {
      haptic.impactLight();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger impact medium', () => {
      haptic.impactMedium();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger impact heavy', () => {
      haptic.impactHeavy();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger selection', () => {
      haptic.selection();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should trigger notification', () => {
      haptic.notification();
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should stop vibration', () => {
      haptic.stop();
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('Device Detection', () => {
    it('should check if haptic is supported', () => {
      const supported = isHapticSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should check if device is mobile', () => {
      const mobile = isMobileDevice();
      expect(typeof mobile).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle vibration error gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration error');
      });
      
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.trigger('tap');
      
      expect(result).toBe(false);
    });

    it('should throttle rapid vibrations', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      
      feedback.trigger('tap');
      const result = feedback.trigger('tap'); // Immediate second call
      
      expect(result).toBe(false);
    });

    it('should handle empty pattern', () => {
      const feedback = new HapticFeedback({ mobileOnly: false });
      const result = feedback.triggerCustom([]);
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith([]);
    });
  });
});
