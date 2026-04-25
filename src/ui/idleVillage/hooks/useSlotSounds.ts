/**
 * useSlotSounds Hook
 * 
 * Synthetic sound effects using Web Audio API with Style Lab tokens
 * No external files, zero latency, mobile-safe
 */

import { useCallback } from 'react';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';

export interface SlotSoundsConfig {
  /** Enable/disable all sounds */
  enabled?: boolean;
  /** Volume multiplier (0-1) */
  volume?: number;
  /** Audio context instance (for testing) */
  audioContext?: AudioContext;
}

export interface SlotSoundsControls {
  /** Play clank sound for successful assignment */
  clank: () => void;
  /** Play reject sound for failed assignment */
  reject: () => void;
  /** Play detach sound when medal is removed */
  detach: () => void;
  /** Play completion sound when activity finishes */
  complete: () => void;
  /** Test all sounds */
  testAll: () => void;
}

const DEFAULT_CONFIG: Required<SlotSoundsConfig> = {
  enabled: true,
  volume: 0.3,
  audioContext: undefined,
};

/**
 * Create synthetic sound effects using Web Audio API oscillators
 */
const createSynthSound = (
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  audioContext: AudioContext
) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const useSlotSounds = (config: SlotSoundsConfig = {}): SlotSoundsControls => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const styleLabTokens = useStyleLabTokens();
  
  // Extract audio physics tokens from Style Lab
  const audioPhysics = (styleLabTokens.preset.interactionPhysics || {
    mass: 1.0,
    damping: 0.15,
    stiffness: 100,
    shadowDepth: 8,
  }) as any;
  
  const getAudioContext = useCallback(() => {
    if (mergedConfig.audioContext) {
      return mergedConfig.audioContext;
    }
    
    try {
      return new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not available:', error);
      return null;
    }
  }, [mergedConfig.audioContext]);

  const clank = useCallback(() => {
    if (!mergedConfig.enabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Clank: oscillator burst with Style Lab physics tokens
    // Frequency and duration influenced by mass and damping
    const frequency = 180 * audioPhysics.mass;
    const duration = 0.1 * (1 + audioPhysics.damping);
    createSynthSound(frequency, 'sine', duration, mergedConfig.volume, audioContext);
  }, [mergedConfig.enabled, mergedConfig.volume, getAudioContext, audioPhysics]);

  const reject = useCallback(() => {
    if (!mergedConfig.enabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Reject: low thud with Style Lab damping influence
    const frequency = 80 / audioPhysics.mass;
    const duration = 0.2 * audioPhysics.damping;
    createSynthSound(frequency, 'square', duration, mergedConfig.volume * 0.7, audioContext);
  }, [mergedConfig.enabled, mergedConfig.volume, getAudioContext, audioPhysics]);

  const detach = useCallback(() => {
    if (!mergedConfig.enabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Detach: soft pop with frequency sweep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(mergedConfig.volume * 0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }, [mergedConfig.enabled, mergedConfig.volume, getAudioContext]);

  const complete = useCallback(() => {
    if (!mergedConfig.enabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Complete: ascending chime (C5 → E5)
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659, audioContext.currentTime); // E5
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    gainNode.gain.setValueAtTime(mergedConfig.volume * 0.7, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.3);
  }, [mergedConfig.enabled, mergedConfig.volume, getAudioContext]);

  const testAll = useCallback(() => {
    // Test all sounds in sequence
    setTimeout(() => clank(), 0);
    setTimeout(() => reject(), 200);
    setTimeout(() => detach(), 400);
    setTimeout(() => complete(), 600);
  }, [clank, reject, detach, complete]);

  return {
    clank,
    reject,
    detach,
    complete,
    testAll,
  };
};
