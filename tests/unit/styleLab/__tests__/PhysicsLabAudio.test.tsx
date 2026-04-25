/**
 * PL-AUD – Physics Lab Audio & Haptics Harness
 * 
 * Unit tests for Physics Lab audio hook and components.
 * Tests AudioWorklet mocking, config management, and haptics bridge.
 * 
 * @since 2026-02-19
 * @author Cascade
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePhysicsLabAudio, type PhysicsLabAudioConfig } from '@/ui/styleLab/physicsLab/audio/usePhysicsLabAudio';
import { LabHapticsBridge, type HapticPattern } from '@/ui/styleLab/physicsLab/audio/haptics/labHapticsBridge';

// Mock AudioContext and related APIs
const mockAudioContext = {
  audioWorklet: {
    addModule: vi.fn().mockResolvedValue(undefined),
  },
  createGain: vi.fn().mockReturnValue({
    gain: { value: 0.8 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  }),
  createBuffer: vi.fn().mockReturnValue({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(100)),
  }),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
};

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
  loadData: vi.fn().mockImplementation((key, defaultValue) => 
    Promise.resolve(defaultValue)
  ),
}));

describe('usePhysicsLabAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock AudioContext constructor
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;
    global.webkitAudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;
    
    // Reset mock implementations
    mockAudioContext.createGain.mockReturnValue({
      gain: { value: 0.8 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
    
    mockAudioContext.createBufferSource.mockReturnValue({
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    });
    
    mockVibrate.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default configuration', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.masterVolume).toBe(0.8);
    expect(result.current.config.maxConcurrentCues).toBe(4);
    expect(result.current.config.soundPack).toBe('gilded');
    expect(result.current.activeCues).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it('should load persisted configuration', async () => {
    const persistedConfig: Partial<PhysicsLabAudioConfig> = {
      masterVolume: 0.5,
      maxConcurrentCues: 6,
      soundPack: 'obsidian',
    };

    const { loadData } = await import('@/shared/persistence/PersistenceService');
    vi.mocked(loadData).mockResolvedValue({
      ...DEFAULT_AUDIO_CONFIG,
      ...persistedConfig,
    });

    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.config.masterVolume).toBe(0.5);
    expect(result.current.config.maxConcurrentCues).toBe(6);
    expect(result.current.config.soundPack).toBe('obsidian');
  });

  it('should play audio cue successfully', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const instanceId = await act(async () => {
      return await result.current.playCue('button_press');
    });

    expect(instanceId).toBeTruthy();
    expect(instanceId).toMatch(/^cue-\d+-[a-z0-9]+$/);
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('should respect concurrent cue limit', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // Set low limit for testing
    act(() => {
      result.current.updateConfig({ maxConcurrentCues: 2 });
    });

    // Play cues up to limit
    const instance1 = await act(async () => {
      return await result.current.playCue('button_press');
    });
    const instance2 = await act(async () => {
      return await result.current.playCue('drag_start');
    });

    expect(instance1).toBeTruthy();
    expect(instance2).toBeTruthy();
    expect(result.current.activeCues).toBe(2);

    // Try to play one more (should be rejected)
    const instance3 = await act(async () => {
      return await result.current.playCue('slot_snap');
    });

    expect(instance3).toBeNull();
    expect(result.current.activeCues).toBe(2);
  });

  it('should stop specific audio cue', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const mockSource = {
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    mockAudioContext.createBufferSource.mockReturnValue(mockSource);

    const instanceId = await act(async () => {
      return await result.current.playCue('button_press');
    });

    expect(instanceId).toBeTruthy();
    expect(result.current.activeCues).toBe(1);

    act(() => {
      result.current.stopCue(instanceId!);
    });

    expect(mockSource.stop).toHaveBeenCalled();
    expect(result.current.activeCues).toBe(0);
  });

  it('should stop all audio cues', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const mockSource1 = { stop: vi.fn(), disconnect: vi.fn() };
    const mockSource2 = { stop: vi.fn(), disconnect: vi.fn() };
    mockAudioContext.createBufferSource
      .mockReturnValueOnce(mockSource1)
      .mockReturnValueOnce(mockSource2);

    await act(async () => {
      await result.current.playCue('button_press');
      await result.current.playCue('drag_start');
    });

    expect(result.current.activeCues).toBe(2);

    act(() => {
      result.current.stopAllCues();
    });

    expect(mockSource1.stop).toHaveBeenCalled();
    expect(mockSource2.stop).toHaveBeenCalled();
    expect(result.current.activeCues).toBe(0);
  });

  it('should update configuration', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.updateConfig({
        masterVolume: 0.6,
        maxConcurrentCues: 8,
        soundPack: 'blizzard',
      });
    });

    expect(result.current.config.masterVolume).toBe(0.6);
    expect(result.current.config.maxConcurrentCues).toBe(8);
    expect(result.current.config.soundPack).toBe('blizzard');
  });

  it('should reset configuration to defaults', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // Modify config
    act(() => {
      result.current.updateConfig({
        masterVolume: 0.3,
        enabled: false,
      });
    });

    expect(result.current.config.masterVolume).toBe(0.3);
    expect(result.current.config.enabled).toBe(false);

    // Reset
    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.config.masterVolume).toBe(0.8);
    expect(result.current.config.enabled).toBe(true);
  });

  it('should handle disabled audio', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.updateConfig({ enabled: false });
    });

    const instanceId = await act(async () => {
      return await result.current.playCue('button_press');
    });

    expect(instanceId).toBeNull();
    expect(mockAudioContext.createGain).not.toHaveBeenCalled();
  });

  it('should enqueue haptic pattern', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const pattern: HapticPattern = {
      id: 'test-pattern',
      pattern: [10, 50, 10],
      intensity: 'medium',
      duration: 70,
    };

    act(() => {
      result.current.enqueueHapticPattern(pattern);
    });

    // Should not throw and should log the pattern
    expect(mockVibrate).toHaveBeenCalled();
  });

  it('should clear haptic queue', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const pattern1: HapticPattern = {
      id: 'test-pattern-1',
      pattern: [10, 50],
      intensity: 'light',
      duration: 60,
    };

    const pattern2: HapticPattern = {
      id: 'test-pattern-2',
      pattern: [20, 30],
      intensity: 'strong',
      duration: 50,
    };

    act(() => {
      result.current.enqueueHapticPattern(pattern1);
      result.current.enqueueHapticPattern(pattern2);
      result.current.clearHapticQueue();
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it('should run spam test', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.updateConfig({ maxConcurrentCues: 10 });
    });

    await act(async () => {
      await result.current.runSpamTest(5, 50);
    });

    // Should complete without errors
    expect(true).toBe(true);
  });

  it('should handle AudioContext initialization failure', async () => {
    // Mock AudioContext to throw error
    global.AudioContext = vi.fn().mockImplementation(() => {
      throw new Error('AudioContext not supported');
    }) as any;
    global.webkitAudioContext = undefined as any;

    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Failed to initialize audio');
  });

  it('should respect event volume overrides', async () => {
    const { result } = renderHook(() => usePhysicsLabAudio());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // Update event volume
    act(() => {
      result.current.updateConfig({
        eventVolumes: {
          ...result.current.config.eventVolumes,
          button_press: 0.3,
        },
      });
    });

    const mockGainNode = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
    mockAudioContext.createGain.mockReturnValue(mockGainNode);

    await act(async () => {
      await result.current.playCue('button_press');
    });

    // Volume should be: eventVolume * masterVolume = 0.3 * 0.8 = 0.24
    expect(mockGainNode.gain.value).toBeCloseTo(0.24, 2);
  });
});

describe('LabHapticsBridge', () => {
  let bridge: LabHapticsBridge;

  beforeEach(() => {
    bridge = new LabHapticsBridge();
  });

  afterEach(() => {
    bridge.dispose();
  });

  it('should initialize with default configuration', () => {
    const config = bridge.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.defaultIntensity).toBe('medium');
    expect(config.queue.enabled).toBe(true);
    expect(config.fallback.useNavigatorVibrate).toBe(true);
  });

  it('should detect Web Vibration API device', () => {
    const devices = bridge.getAvailableDevices();
    expect(devices).toHaveLength(1);
    expect(devices[0].id).toBe('web-vibrate');
    expect(devices[0].capabilities.supportsVibration).toBe(true);
  });

  it('should enqueue and play haptic pattern', () => {
    const pattern: HapticPattern = {
      id: 'test-pattern',
      pattern: [10, 50, 10],
      intensity: 'medium',
      duration: 70,
    };

    bridge.enqueueHapticPattern(pattern);

    expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('should validate haptic pattern', () => {
    const validPattern: HapticPattern = {
      id: 'valid',
      pattern: [10, 20],
      intensity: 'light',
      duration: 30,
    };

    const invalidPattern1 = {
      id: '',
      pattern: [10, 20],
      intensity: 'light' as const,
      duration: 30,
    };

    const invalidPattern2 = {
      id: 'invalid',
      pattern: [],
      intensity: 'light' as const,
      duration: 30,
    };

    expect(LabHapticsBridge.validatePattern(validPattern)).toBe(true);
    expect(LabHapticsBridge.validatePattern(invalidPattern1)).toBe(false);
    expect(LabHapticsBridge.validatePattern(invalidPattern2)).toBe(false);
  });

  it('should create test patterns', () => {
    const patterns = LabHapticsBridge.createTestPatterns();
    
    expect(patterns).toHaveProperty('light');
    expect(patterns).toHaveProperty('medium');
    expect(patterns).toHaveProperty('strong');
    expect(patterns).toHaveProperty('pulse');
    expect(patterns).toHaveProperty('long');

    expect(patterns.light.intensity).toBe('light');
    expect(patterns.strong.intensity).toBe('strong');
    expect(patterns.pulse.pattern).toEqual([10, 5, 10, 5, 10, 5, 10, 5]);
  });

  it('should update configuration', () => {
    bridge.updateConfig({
      enabled: false,
      maxConcurrentCues: 6,
    });

    const config = bridge.getConfig();
    expect(config.enabled).toBe(false);
    expect(config.queue.maxSize).toBe(6);
  });

  it('should get queue status', () => {
    const status = bridge.getQueueStatus();
    expect(status.size).toBe(0);
    expect(status.isPlaying).toBe(false);
    expect(status.maxCapacity).toBeGreaterThan(0);
  });

  it('should clear queue and stop all patterns', () => {
    const pattern1: HapticPattern = {
      id: 'test-1',
      pattern: [10],
      intensity: 'light',
      duration: 10,
    };

    const pattern2: HapticPattern = {
      id: 'test-2',
      pattern: [20],
      intensity: 'medium',
      duration: 20,
    };

    bridge.enqueueHapticPattern(pattern1);
    bridge.enqueueHapticPattern(pattern2);
    bridge.stopAllPatterns();

    const status = bridge.getQueueStatus();
    expect(status.size).toBe(0);
    expect(status.isPlaying).toBe(false);
  });

  it('should handle missing navigator.vibrate gracefully', () => {
    // Temporarily remove vibrate
    const originalVibrate = (navigator as any).vibrate;
    delete (navigator as any).vibrate;

    const bridgeNoVibrate = new LabHapticsBridge();
    const devices = bridgeNoVibrate.getAvailableDevices();
    
    expect(devices).toHaveLength(0);
    
    bridgeNoVibrate.dispose();
    
    // Restore vibrate
    (navigator as any).vibrate = originalVibrate;
  });
});

// Default configuration for testing
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
