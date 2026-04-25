/**
 * useSlottedMedalBehavior Hook
 * 
 * Manages the complete behavior state machine for slotted medals
 * Separates dnd-kit drag logic from Framer Motion animations
 * Reads configuration from centralized slottedMedal config
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnimationControls } from 'framer-motion';
import { DEFAULT_SLOTTED_MEDAL_CONFIG } from '@/balancing/config/idleVillage/slottedMedalConfig';

export type MedalState = 'empty' | 'landing' | 'idle' | 'active' | 'locked' | 'unlocking' | 'failed';

export interface MedalBehaviorConfig {
  /** Resistance duration before allowing detach (ms) */
  resistDurationMs?: number;
  /** Spring stiffness for animations */
  springStiffness?: number;
  /** Spring damping for animations */
  springDamping?: number;
  /** Enable shake animations */
  enableShake?: boolean;
  /** Enable sound effects */
  enableSound?: boolean;
}

export interface MedalBehaviorControls {
  /** Current state of the medal */
  state: MedalState;
  /** Framer Motion animation controls */
  animationControls: ReturnType<typeof useAnimationControls>;
  /** Spring medal to center of slot */
  springToCenter: () => Promise<void>;
  /** Trigger shake animation with reason */
  triggerShake: (reason: 'assign' | 'reject') => Promise<void>;
  /** Trigger clank effect (audio + visual) */
  triggerClank: () => void;
  /** Start resistance timer for detach */
  resistStart: () => void;
  /** Trigger detach animation */
  triggerDetach: () => Promise<void>;
  /** Handle successful drop */
  handleDrop: (residentId: string) => void;
  /** Handle failed drop attempt */
  handleReject: () => void;
  /** Handle completion of activity */
  handleComplete: () => void;
  /** Handle failed activity */
  handleFailed: (failureType?: 'injury' | 'death' | 'mission_failure') => void;
  /** Reset to empty state */
  reset: () => void;
}

const DEFAULT_CONFIG: Required<MedalBehaviorConfig> = {
  resistDurationMs: 600,
  springStiffness: 300,
  springDamping: 30,
  enableShake: true,
  enableSound: true,
};

export const useSlottedMedalBehavior = (config: MedalBehaviorConfig = {}): MedalBehaviorControls => {
  const behaviorConfig = DEFAULT_SLOTTED_MEDAL_CONFIG.behavior ?? DEFAULT_CONFIG;
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...behaviorConfig,
    ...config,
  };

  const animationControls = useAnimationControls();
  const [state, setStateValue] = useState<MedalState>('empty');
  const stateRef = useRef<MedalState>('empty');
  const resistTimeoutRef = useRef<number | null>(null);
  const failureTimeoutRef = useRef<number | null>(null);
  const isResistingRef = useRef(false);

  const setState = useCallback((nextState: MedalState) => {
    stateRef.current = nextState;
    setStateValue(nextState);
  }, []);

  const clearResistTimeout = useCallback(() => {
    if (resistTimeoutRef.current) {
      clearTimeout(resistTimeoutRef.current);
      resistTimeoutRef.current = null;
    }
    isResistingRef.current = false;
  }, []);

  const clearFailureTimeout = useCallback(() => {
    if (failureTimeoutRef.current) {
      clearTimeout(failureTimeoutRef.current);
      failureTimeoutRef.current = null;
    }
  }, []);

  const runAnimation = useCallback(async (definition: Parameters<ReturnType<typeof useAnimationControls>['start']>[0]) => {
    try {
      await animationControls.start(definition);
    } catch {
      // Framer motion can throw if component unmounted; swallow for hook stability
    }
  }, [animationControls]);

  const springToCenter = useCallback(async () => {
    if (stateRef.current !== 'landing' && stateRef.current !== 'idle') {
      return;
    }

    setState('active');

    await runAnimation({
      scale: 0.92,
      y: 2,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
      transition: {
        type: 'spring',
        stiffness: mergedConfig.springStiffness,
        damping: mergedConfig.springDamping,
      },
    });

    if (mergedConfig.enableSound) {
      synthSounds.clank();
    }
  }, [mergedConfig.enableSound, mergedConfig.springDamping, mergedConfig.springStiffness, runAnimation, setState]);

  const triggerShake = useCallback(async (reason: 'assign' | 'reject') => {
    const shakeConfig = reason === 'assign'
      ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.4 } }
      : { x: [-4, 4, -4, 4, -2, 2, 0], transition: { duration: 0.6 } };

    await runAnimation(mergedConfig.enableShake ? shakeConfig : { x: [0], transition: { duration: 0.05 } });

    if (mergedConfig.enableSound) {
      reason === 'assign' ? synthSounds.clank() : synthSounds.reject();
    }
  }, [mergedConfig.enableShake, mergedConfig.enableSound, runAnimation]);

  const triggerClank = useCallback(() => {
    void runAnimation({
      filter: ['brightness(1.5)', 'brightness(1)'],
      transition: { duration: 0.1 },
    });

    if (mergedConfig.enableSound) {
      synthSounds.clank();
    }
  }, [mergedConfig.enableSound, runAnimation]);

  const reset = useCallback(() => {
    clearResistTimeout();
    clearFailureTimeout();
    setState('empty');

    animationControls.set({
      scale: 1,
      x: 0,
      y: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      filter: 'brightness(1)',
      opacity: 1,
    });
  }, [animationControls, clearFailureTimeout, clearResistTimeout, setState]);

  const triggerDetach = useCallback(async () => {
    if (stateRef.current !== 'unlocking' && stateRef.current !== 'active') {
      return;
    }

    clearResistTimeout();
    setState('unlocking');

    await runAnimation({
      scale: 1,
      y: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    });

    if (mergedConfig.enableSound) {
      synthSounds.detach();
    }

    reset();
  }, [clearResistTimeout, mergedConfig.enableSound, reset, runAnimation, setState, stateRef]);

  const resistStart = useCallback(() => {
    if (stateRef.current !== 'active' || isResistingRef.current) {
      return;
    }

    isResistingRef.current = true;
    setState('locked');

    void runAnimation({ scale: 0.95, transition: { duration: 0.1 } });

    clearResistTimeout();
    const duration = Math.max(100, mergedConfig.resistDurationMs);
    resistTimeoutRef.current = window.setTimeout(() => {
      isResistingRef.current = false;
      setState('unlocking');
    }, duration);
  }, [clearResistTimeout, mergedConfig.resistDurationMs, runAnimation, setState]);

  const handleDrop = useCallback((residentId: string) => {
    if (stateRef.current !== 'empty' && stateRef.current !== 'idle') {
      return;
    }

    setState('landing');

    void runAnimation({
      scale: 1.05,
      transition: { duration: 0.2 },
    }).then(() => {
      springToCenter();
    });
  }, [runAnimation, setState, springToCenter]);

  const handleReject = useCallback(() => {
    void triggerShake('reject');
  }, [triggerShake]);

  const handleComplete = useCallback(() => {
    if (stateRef.current !== 'active') {
      return;
    }

    void runAnimation({
      scale: [0.92, 1.1, 1.0],
      opacity: [1, 0.8, 1],
      transition: { duration: 0.6 },
    });

    if (mergedConfig.enableSound) {
      synthSounds.complete();
    }

    reset();
  }, [mergedConfig.enableSound, reset, runAnimation, stateRef]);

  const handleFailed = useCallback((failureType?: 'injury' | 'death' | 'mission_failure') => {
    if (stateRef.current !== 'active') {
      return;
    }

    setState('failed');

    void runAnimation({
      x: [0, -4, 4, -4, 4, -2, 2, 0],
      y: [0, -2, 0, -2, 0, -1, 0],
      opacity: [1, 1, 1, 1, 1, 0.7, 0.5],
      filter: ['brightness(1)', 'brightness(0.8)', 'brightness(0.6)'],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    });

    if (mergedConfig.enableSound) {
      synthSounds.reject();
    }

    clearFailureTimeout();
    failureTimeoutRef.current = window.setTimeout(() => {
      reset();
    }, 1200);
  }, [clearFailureTimeout, mergedConfig.enableSound, reset, runAnimation, setState]);

  useEffect(() => {
    return () => {
      clearResistTimeout();
      clearFailureTimeout();
    };
  }, [clearFailureTimeout, clearResistTimeout]);

  return {
    state,
    animationControls,
    springToCenter,
    triggerShake,
    triggerClank,
    resistStart,
    triggerDetach,
    handleDrop,
    handleReject,
    handleComplete,
    handleFailed,
    reset,
  };
};

/**
 * Synthetic sound effects using Web Audio API
 * No external files, zero latency, mobile-safe
 */
const synthSounds = {
  clank: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio context not available
    }
  },

  reject: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Silently fail
    }
  },

  detach: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      // Silently fail
    }
  },

  complete: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Ascending chime
      oscillator1.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator2.frequency.setValueAtTime(659, audioContext.currentTime); // E5
      
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      oscillator2.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silently fail
    }
  },
};
