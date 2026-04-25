/**
 * PL-AUD – Physics Lab Audio & Haptics Harness
 * 
 * Audio hook for Physics Lab micro-app with AudioWorklet throttling,
 * cue queue management, and haptics bridge integration.
 * 
 * @since 2026-02-19
 * @author Cascade
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

/**
 * Audio cue event types for Physics Lab interactions
 */
export type PhysicsLabAudioEventType = 
  | 'button_press'
  | 'drag_start'
  | 'slot_snap'
  | 'float_text_spawn'
  | 'preset_change'
  | 'spam_test';

/**
 * Audio cue configuration interface
 */
export interface PhysicsLabAudioConfig {
  /** Master volume level (0-1) */
  masterVolume: number;
  /** Maximum concurrent cues (default 4) */
  maxConcurrentCues: number;
  /** Enable/disable audio playback */
  enabled: boolean;
  /** Sound pack selection */
  soundPack: 'gilded' | 'obsidian' | 'blizzard';
  /** Ducking configuration for overlapping sounds */
  ducking: {
    enabled: boolean;
    amount: number; // 0-1
    fadeTimeMs: number;
  };
  /** Event-specific volume overrides */
  eventVolumes: Record<PhysicsLabAudioEventType, number>;
}

/**
 * Haptic pattern interface
 */
export interface HapticPattern {
  id: string;
  pattern: number[];
  intensity: 'light' | 'medium' | 'strong';
  duration: number;
}

/**
 * Audio cue instance tracking
 */
interface AudioCueInstance {
  id: string;
  eventType: PhysicsLabAudioEventType;
  startTime: number;
  audioBuffer?: AudioBuffer;
  sourceNode?: AudioBufferSourceNode;
  gainNode?: GainNode;
}

/**
 * Hook return interface
 */
export interface UsePhysicsLabAudioReturn {
  // Audio controls
  playCue: (eventType: PhysicsLabAudioEventType, options?: { volume?: number }) => Promise<string | null>;
  stopCue: (instanceId: string) => void;
  stopAllCues: () => void;
  
  // Configuration
  config: PhysicsLabAudioConfig;
  updateConfig: (updates: Partial<PhysicsLabAudioConfig>) => void;
  resetConfig: () => void;
  
  // Haptics bridge
  enqueueHapticPattern: (pattern: HapticPattern) => void;
  clearHapticQueue: () => void;
  
  // Testing utilities
  runSpamTest: (count: number, intervalMs: number) => Promise<void>;
  
  // State
  activeCues: number;
  isInitialized: boolean;
  error: string | null;
}

/**
 * Default audio configuration
 */
const DEFAULT_AUDIO_CONFIG: PhysicsLabAudioConfig = {
  masterVolume: 0.8,
  maxConcurrentCues: 4,
  enabled: true,
  soundPack: 'gilded',
  ducking: {
    enabled: true,
    amount: 0.3,
    fadeTimeMs: 100,
  },
  eventVolumes: {
    button_press: 0.7,
    drag_start: 0.5,
    slot_snap: 0.9,
    float_text_spawn: 0.6,
    preset_change: 0.8,
    spam_test: 0.4,
  },
};

/**
 * Physics Lab audio hook with AudioWorklet support
 */
export function usePhysicsLabAudio(
  preset?: PhysicsPreset
): UsePhysicsLabAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeCuesRef = useRef<Map<string, AudioCueInstance>>(new Map());
  const hapticQueueRef = useRef<HapticPattern[]>([]);
  const [state, setState] = useState({
    config: DEFAULT_AUDIO_CONFIG,
    activeCues: 0,
    isInitialized: false,
    error: null as string | null,
  });

  // Initialize AudioContext and load persisted config
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Load persisted configuration
        const persistedConfig = await loadData<PhysicsLabAudioConfig>(
          'physics-lab-audio-config',
          DEFAULT_AUDIO_CONFIG
        );
        
        setState(prev => ({
          ...prev,
          config: { ...DEFAULT_AUDIO_CONFIG, ...persistedConfig },
        }));

        // Initialize AudioContext
        if (typeof window !== 'undefined' && !audioContextRef.current) {
          const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextCtor) {
            audioContextRef.current = new AudioContextCtor();
            
            // Load worklet module if available
            try {
              await audioContextRef.current.audioWorklet.addModule('/audio/worklets/physics-lab-processor.js');
            } catch (_error) {
              console.warn('[usePhysicsLabAudio] Worklet module not available, using fallback');
            }
          }
        }

        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize audio';
        setState(prev => ({ ...prev, error: message, isInitialized: true }));
      }
    };

    initializeAudio();
  }, []);

  // Save config changes
  useEffect(() => {
    if (state.isInitialized) {
      saveData('physics-lab-audio-config', state.config).catch(console.warn);
    }
  }, [state.config, state.isInitialized]);

  // Update active cues count
  useEffect(() => {
    setState(prev => ({ ...prev, activeCues: activeCuesRef.current.size }));
  }, []);

  /**
   * Play audio cue with throttling and queue management
   */
  const playCue = useCallback(async (
    eventType: PhysicsLabAudioEventType,
    options?: { volume?: number }
  ): Promise<string | null> => {
    if (!state.config.enabled || !audioContextRef.current) {
      return null;
    }

    // Check concurrent cue limit
    if (activeCuesRef.current.size >= state.config.maxConcurrentCues) {
      console.warn('[usePhysicsLabAudio] Max concurrent cues reached');
      return null;
    }

    const instanceId = `cue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const volume = (options?.volume ?? 1) * state.config.eventVolumes[eventType] * state.config.masterVolume;

    try {
      // Create audio nodes
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume;
      
      // Apply ducking if enabled
      if (state.config.ducking.enabled) {
        gainNode.gain.linearRampToValueAtTime(
          volume * (1 - state.config.ducking.amount),
          audioContextRef.current.currentTime + state.config.ducking.fadeTimeMs / 1000
        );
      }

      // Load and play audio buffer (mock implementation)
      const audioBuffer = await loadAudioBufferForEvent(eventType, state.config.soundPack);
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Track instance
      const instance: AudioCueInstance = {
        id: instanceId,
        eventType,
        startTime: Date.now(),
        audioBuffer,
        sourceNode,
        gainNode,
      };
      
      activeCuesRef.current.set(instanceId, instance);

      // Handle playback end
      sourceNode.onended = () => {
        activeCuesRef.current.delete(instanceId);
        setState(prev => ({ ...prev, activeCues: activeCuesRef.current.size }));
      };

      // Start playback
      sourceNode.start(0);

      // Emit telemetry event (stub for PL-TEL)
      emitPhysicsLabAudioEvent(eventType, instanceId, volume);

      return instanceId;
    } catch (error) {
      console.error('[usePhysicsLabAudio] Failed to play cue:', error);
      return null;
    }
  }, [state.config]);

  /**
   * Stop specific audio cue
   */
  const stopCue = useCallback((instanceId: string) => {
    const instance = activeCuesRef.current.get(instanceId);
    if (instance?.sourceNode) {
      try {
        instance.sourceNode.stop();
        instance.sourceNode.disconnect();
        instance.gainNode?.disconnect();
      } catch (_error) {
        // Already stopped or disconnected
      }
      activeCuesRef.current.delete(instanceId);
      setState(prev => ({ ...prev, activeCues: activeCuesRef.current.size }));
    }
  }, []);

  /**
   * Stop all active audio cues
   */
  const stopAllCues = useCallback(() => {
    for (const [instanceId] of activeCuesRef.current) {
      stopCue(instanceId);
    }
  }, [stopCue]);

  /**
   * Update audio configuration
   */
  const updateConfig = useCallback((updates: Partial<PhysicsLabAudioConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  }, []);

  /**
   * Reset configuration to defaults
   */
  const resetConfig = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: DEFAULT_AUDIO_CONFIG,
    }));
  }, []);

  /**
   * Enqueue haptic pattern (bridge implementation)
   */
  const enqueueHapticPattern = useCallback((pattern: HapticPattern) => {
    hapticQueueRef.current.push(pattern);
    
    // Log pattern for now (TODO: implement actual haptic device interface)
    console.log('[usePhysicsLabAudio] Haptic pattern enqueued:', pattern);
    
    // Emit telemetry event (stub for PL-TEL)
    emitPhysicsLabHapticEvent(pattern);
  }, []);

  /**
   * Clear haptic queue
   */
  const clearHapticQueue = useCallback(() => {
    hapticQueueRef.current = [];
  }, []);

  /**
   * Run spam test for performance validation
   */
  const runSpamTest = useCallback(async (count: number, intervalMs: number) => {
    console.log(`[usePhysicsLabAudio] Starting spam test: ${count} cues, ${intervalMs}ms interval`);
    
    for (let i = 0; i < count; i++) {
      await playCue('spam_test');
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    console.log('[usePhysicsLabAudio] Spam test completed');
  }, [playCue]);

  return {
    playCue,
    stopCue,
    stopAllCues,
    config: state.config,
    updateConfig,
    resetConfig,
    enqueueHapticPattern,
    clearHapticQueue,
    runSpamTest,
    activeCues: state.activeCues,
    isInitialized: state.isInitialized,
    error: state.error,
  };
}

/**
 * Load audio buffer for event type (mock implementation)
 */
async function loadAudioBufferForEvent(
  eventType: PhysicsLabAudioEventType,
  soundPack: string
): Promise<AudioBuffer> {
  // Mock implementation - in real scenario, load from /assets/audio/physics-lab/
  const audioContext = new AudioContext();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.1; // 100ms
  const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate simple sine wave based on event type
  const frequency = getFrequencyForEventType(eventType);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
  }
  
  return buffer;
}

/**
 * Get frequency for event type (mock implementation)
 */
function getFrequencyForEventType(eventType: PhysicsLabAudioEventType): number {
  switch (eventType) {
    case 'button_press': return 440; // A4
    case 'drag_start': return 330; // E4
    case 'slot_snap': return 660; // E5
    case 'float_text_spawn': return 550; // C#5
    case 'preset_change': return 880; // A5
    case 'spam_test': return 220; // A3
    default: return 440;
  }
}

/**
 * Emit audio telemetry event (stub for PL-TEL)
 */
function emitPhysicsLabAudioEvent(
  eventType: PhysicsLabAudioEventType,
  instanceId: string,
  volume: number
) {
  // TODO(PL-TEL): Integrate with real telemetry system
  console.log('[TELEMETRY] physics_lab_audio_event', {
    eventType,
    instanceId,
    volume,
    timestamp: Date.now(),
  });
}

/**
 * Emit haptic telemetry event (stub for PL-TEL)
 */
function emitPhysicsLabHapticEvent(pattern: HapticPattern) {
  // TODO(PL-TEL): Integrate with real telemetry system
  console.log('[TELEMETRY] physics_lab_haptic_event', {
    patternId: pattern.id,
    intensity: pattern.intensity,
    duration: pattern.duration,
    timestamp: Date.now(),
  });
}
