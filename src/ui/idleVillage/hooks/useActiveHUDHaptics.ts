/**
 * Hook for Active HUD Haptics & Sound System
 *
 * Provides config-first haptic and audio feedback for Phase 12 HUD interactions.
 * Integrates with telemetry and respects user preferences.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActiveHUDActivityViewModel } from './useActiveHUDState';
import { getHUDHapticsConfig, isHapticsSupported, isAudioSupported, type HUDHapticsConfig, type HUDHapticEventType } from '@/balancing/config/idleVillage/hudHapticsConfig';

/**
 * Props for useActiveHUDHaptics hook
 */
export interface UseActiveHUDHapticsProps {
  /** Current HUD activities state */
  activities: ActiveHUDActivityViewModel[];
  /** Whether haptics are enabled */
  enabled?: boolean;
  /** Test mode flag */
  testMode?: boolean;
  /** Custom config override */
  configOverride?: Partial<HUDHapticsConfig>;
  /** Callback for haptic events */
  onHapticEvent?: (eventType: HUDHapticEventType, activity?: ActiveHUDActivityViewModel) => void;
}

/**
 * Internal state for haptic cooldown tracking
 */
interface HapticCooldownState {
  lastEventTime: number;
  eventType: HUDHapticEventType;
  activityKey?: string;
}

/**
 * Hook result interface
 */
export interface UseActiveHUDHapticsResult {
  /** Trigger haptic feedback for specific event */
  triggerHaptic: (eventType: HUDHapticEventType, activity?: ActiveHUDActivityViewModel) => void;
  /** Trigger haptic feedback with custom pattern */
  triggerCustomHaptic: (sequence: Array<[number, number]>) => void;
  /** Check if haptics are available */
  isHapticsAvailable: boolean;
  /** Check if audio is available */
  isAudioAvailable: boolean;
  /** Current haptic config */
  config: HUDHapticsConfig;
  /** Clear all active haptics */
  clearHaptics: () => void;
}

/**
 * Audio context manager for synthesized tones
 */
class AudioManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined' || this.initialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[HUD Haptics] Failed to initialize audio context:', error);
    }
  }

  playTone(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.audioContext || this.audioContext.state === 'suspended') return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('[HUD Haptics] Failed to play tone:', error);
    }
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Simple timer manager for haptic feedback
 */
class HapticTimerManager {
  private timers: Map<number, NodeJS.Timeout> = new Map();
  private nextId = 0;

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextId++;
    const timer = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.set(id, timer);
    return id;
  }

  clearTimeout(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

/**
 * Config-first hook for Active HUD haptics and audio feedback
 * 
 * @param props - Hook configuration and state
 * @returns Haptic control functions and state
 */
export function useActiveHUDHaptics(props: UseActiveHUDHapticsProps): UseActiveHUDHapticsResult {
  const { activities, enabled = true, testMode = false, configOverride, onHapticEvent } = props;

  // Get config with overrides
  const config = useMemo<HUDHapticsConfig>(() => {
    const baseConfig = getHUDHapticsConfig(testMode);
    if (configOverride) {
      return {
        ...baseConfig,
        ...configOverride,
        global: { ...baseConfig.global, ...configOverride.global },
        audio: { ...baseConfig.audio, ...configOverride.audio },
        patterns: { ...baseConfig.patterns, ...configOverride.patterns },
      };
    }
    return baseConfig;
  }, [testMode, configOverride]);

  // Audio manager instance
  const audioManagerRef = useRef<AudioManager>();
  
  // Cooldown tracking
  const cooldownStateRef = useRef<HapticCooldownState>({
    lastEventTime: 0,
    eventType: 'card_select', // Default
  });

  // Active haptic tracking
  const activeHapticsRef = useRef<Set<number>>(new Set());

  // Timer manager
  const timerManagerRef = useRef<HapticTimerManager>();

  // Initialize managers
  useEffect(() => {
    timerManagerRef.current = new HapticTimerManager();
    
    if (config.audio.enabled && isAudioSupported()) {
      audioManagerRef.current = new AudioManager();
    }

    return () => {
      timerManagerRef.current?.clearAll();
      audioManagerRef.current?.dispose();
    };
  }, [config.audio.enabled]);

  // Resume audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = (): void => {
      audioManagerRef.current?.resume();
    };

    if (config.audio.enabled) {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [config.audio.enabled]);

  // Check if haptics are available
  const isHapticsAvailable = useMemo(() => {
    return enabled && config.global.enabled && isHapticsSupported();
  }, [enabled, config.global.enabled]);

  // Check if audio is available
  const isAudioAvailable = useMemo(() => {
    return enabled && config.audio.enabled && isAudioSupported();
  }, [enabled, config.audio.enabled]);

  /**
   * Convert haptic sequence to VibratePattern
   */
  const sequenceToVibratePattern = (sequence: Array<[number, number]>): number[] => {
    const pattern: number[] = [];
    for (const [duration, intensity] of sequence) {
      pattern.push(duration);
      if (intensity < 1) {
        pattern.push(duration * 0.3); // Pause for intensity effect
      }
    }
    return pattern;
  };

  /**
   * Trigger haptic feedback for specific event
   */
  const triggerHaptic = useCallback((eventType: HUDHapticEventType, activity?: ActiveHUDActivityViewModel) => {
    if (!isHapticsAvailable || !timerManagerRef.current) return;

    const now = Date.now();
    const timeSinceLastEvent = now - cooldownStateRef.current.lastEventTime;

    // Check cooldown
    if (timeSinceLastEvent < config.global.cooldownMs) {
      console.log('[HUD Haptics] Cooldown active', { eventType, cooldownMs: config.global.cooldownMs, timeSinceLastEvent });
      return;
    }

    const pattern = config.patterns[eventType];
    if (!pattern || !pattern.haptic.enabled) return;

    // Check concurrent limit
    if (activeHapticsRef.current.size >= config.global.maxConcurrent) {
      console.log('[HUD Haptics] Concurrent limit reached', { 
        activeCount: activeHapticsRef.current.size, 
        maxConcurrent: config.global.maxConcurrent 
      });
      return;
    }

    try {
      // Apply intensity scaling and convert to vibrate pattern
      const scaledSequence = pattern.haptic.sequence.map(([duration, intensity]) => [
        duration,
        intensity * config.global.intensity,
      ] as [number, number]);

      const vibratePattern = sequenceToVibratePattern(scaledSequence);

      // Trigger haptic
      const success = navigator.vibrate(vibratePattern);
      
      if (success) {
        const hapticId = Date.now(); // Use timestamp as ID
        activeHapticsRef.current.add(hapticId);
        
        // Clear from active set after sequence completes
        const totalDuration = scaledSequence.reduce((sum, [duration]) => sum + duration, 0);
        timerManagerRef.current.setTimeout(() => {
          activeHapticsRef.current.delete(hapticId);
        }, totalDuration + 100);
      }

      // Play audio if enabled
      if (pattern.audio.enabled && isAudioAvailable && audioManagerRef.current) {
        const { frequency, duration, volume } = pattern.audio;
        
        if (frequency && duration) {
          const finalVolume = volume || config.audio.masterVolume;
          audioManagerRef.current.playTone(frequency, duration, finalVolume);
        }
      }

      // Update cooldown state
      cooldownStateRef.current = {
        lastEventTime: now,
        eventType,
        activityKey: activity?.key,
      };

      // Trigger visual emphasis if coordinated
      if (pattern.visual.coordinated && pattern.visual.emphasis && activity?.key) {
        timerManagerRef.current.setTimeout(() => {
          const element = document.querySelector(`[data-activity-key="${activity.key}"]`);
          if (element) {
            element.classList.add('haptic-emphasis');
            timerManagerRef.current.setTimeout(() => {
              element.classList.remove('haptic-emphasis');
            }, 200);
          }
        }, pattern.visual.delayMs);
      }

      // Log event
      console.log('[HUD Haptics] Triggered', {
        eventType,
        activityKey: activity?.key,
        pattern: pattern.haptic.type,
        sequence: scaledSequence,
        intensity: config.global.intensity,
      });

      // Callback
      onHapticEvent?.(eventType, activity);

    } catch (error) {
      console.warn('[HUD Haptics] Failed to trigger haptic:', error);
    }
  }, [isHapticsAvailable, isAudioAvailable, config, onHapticEvent]);

  /**
   * Trigger custom haptic pattern
   */
  const triggerCustomHaptic = useCallback((sequence: Array<[number, number]>) => {
    if (!isHapticsAvailable || !timerManagerRef.current) return;

    try {
      const scaledSequence = sequence.map(([duration, intensity]) => [
        duration,
        intensity * config.global.intensity,
      ] as [number, number]);

      const vibratePattern = sequenceToVibratePattern(scaledSequence);
      const success = navigator.vibrate(vibratePattern);
      
      if (success) {
        const hapticId = Date.now();
        activeHapticsRef.current.add(hapticId);
        
        const totalDuration = scaledSequence.reduce((sum, [duration]) => sum + duration, 0);
        timerManagerRef.current.setTimeout(() => {
          activeHapticsRef.current.delete(hapticId);
        }, totalDuration + 100);
      }

      console.log('[HUD Haptics] Custom triggered', { sequence: scaledSequence });
    } catch (error) {
      console.warn('[HUD Haptics] Failed to trigger custom haptic:', error);
    }
  }, [isHapticsAvailable, config.global.intensity]);

  /**
   * Clear all active haptics
   */
  const clearHaptics = useCallback(() => {
    if (isHapticsAvailable) {
      navigator.vibrate(0);
      activeHapticsRef.current.clear();
      timerManagerRef.current?.clearAll();
      console.log('[HUD Haptics] Cleared all haptics');
    }
  }, [isHapticsAvailable]);

  return {
    triggerHaptic,
    triggerCustomHaptic,
    isHapticsAvailable,
    isAudioAvailable,
    config,
    clearHaptics,
  };
}
