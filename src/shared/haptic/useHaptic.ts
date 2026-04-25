/**
 * useHaptic Hook
 * React hook for haptic feedback integration
 * 
 * @see NP-212 – Haptic Feedback System
 */

import { useCallback, useEffect, useState } from 'react';
import { HapticFeedback, getHapticFeedback } from './hapticFeedback';
import type { HapticConfig, HapticPattern } from './hapticConfig';

/**
 * Haptic hook return type
 */
export interface UseHapticReturn {
  /** Trigger haptic feedback by pattern name */
  trigger: (pattern: HapticPattern) => boolean;
  /** Trigger custom pattern */
  triggerCustom: (pattern: number[]) => boolean;
  /** Stop all vibrations */
  stop: () => void;
  /** Check if haptic is available */
  isAvailable: boolean;
  /** Update user preferences */
  updatePreferences: (preferences: Partial<HapticConfig['preferences']>) => void;
  /** Get current preferences */
  preferences: HapticConfig['preferences'];
  /** Quick trigger functions */
  tap: () => boolean;
  success: () => boolean;
  error: () => boolean;
  warning: () => boolean;
  impactLight: () => boolean;
  impactMedium: () => boolean;
  impactHeavy: () => boolean;
  selection: () => boolean;
  notification: () => boolean;
}

/**
 * useHaptic hook
 */
export function useHaptic(config?: Partial<HapticConfig>): UseHapticReturn {
  const [haptic] = useState(() => getHapticFeedback(config));
  const [preferences, setPreferences] = useState(() => haptic.getPreferences());
  const [isAvailable] = useState(() => haptic.isAvailable());

  // Update preferences in state when changed
  const updatePreferences = useCallback((newPreferences: Partial<HapticConfig['preferences']>) => {
    haptic.updatePreferences(newPreferences);
    setPreferences(haptic.getPreferences());
  }, [haptic]);

  // Trigger functions
  const trigger = useCallback((pattern: HapticPattern) => {
    return haptic.trigger(pattern);
  }, [haptic]);

  const triggerCustom = useCallback((pattern: number[]) => {
    return haptic.triggerCustom(pattern);
  }, [haptic]);

  const stop = useCallback(() => {
    haptic.stop();
  }, [haptic]);

  // Quick trigger functions
  const tap = useCallback(() => haptic.trigger('tap'), [haptic]);
  const success = useCallback(() => haptic.trigger('success'), [haptic]);
  const error = useCallback(() => haptic.trigger('error'), [haptic]);
  const warning = useCallback(() => haptic.trigger('warning'), [haptic]);
  const impactLight = useCallback(() => haptic.trigger('impact_light'), [haptic]);
  const impactMedium = useCallback(() => haptic.trigger('impact_medium'), [haptic]);
  const impactHeavy = useCallback(() => haptic.trigger('impact_heavy'), [haptic]);
  const selection = useCallback(() => haptic.trigger('selection'), [haptic]);
  const notification = useCallback(() => haptic.trigger('notification'), [haptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      haptic.stop();
    };
  }, [haptic]);

  return {
    trigger,
    triggerCustom,
    stop,
    isAvailable,
    updatePreferences,
    preferences,
    tap,
    success,
    error,
    warning,
    impactLight,
    impactMedium,
    impactHeavy,
    selection,
    notification,
  };
}

/**
 * useHapticTrigger hook
 * Simplified hook that returns only trigger functions
 */
export function useHapticTrigger() {
  const haptic = getHapticFeedback();

  return {
    tap: useCallback(() => haptic.trigger('tap'), [haptic]),
    success: useCallback(() => haptic.trigger('success'), [haptic]),
    error: useCallback(() => haptic.trigger('error'), [haptic]),
    warning: useCallback(() => haptic.trigger('warning'), [haptic]),
    impactLight: useCallback(() => haptic.trigger('impact_light'), [haptic]),
    impactMedium: useCallback(() => haptic.trigger('impact_medium'), [haptic]),
    impactHeavy: useCallback(() => haptic.trigger('impact_heavy'), [haptic]),
    selection: useCallback(() => haptic.trigger('selection'), [haptic]),
    notification: useCallback(() => haptic.trigger('notification'), [haptic]),
  };
}

/**
 * useHapticButton hook
 * Hook for button components with automatic haptic feedback
 */
export function useHapticButton(
  onClick?: () => void,
  hapticPattern: HapticPattern = 'tap'
) {
  const haptic = getHapticFeedback();

  const handleClick = useCallback(() => {
    haptic.trigger(hapticPattern);
    if (onClick) {
      onClick();
    }
  }, [haptic, hapticPattern, onClick]);

  return { onClick: handleClick };
}

/**
 * useHapticEffect hook
 * Trigger haptic feedback on dependency change
 */
export function useHapticEffect(
  pattern: HapticPattern,
  deps: React.DependencyList
) {
  const haptic = getHapticFeedback();

  useEffect(() => {
    haptic.trigger(pattern);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
