import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  playMinimalAlert,
  configureMinimalAlerts,
  getMinimalAlertConfig,
  resetMinimalAlertConfig,
  cleanupMinimalAlerts,
  defaultMinimalAudioAlertConfig,
} from '../minimalAlerts';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AudioContext
class MockAudioContext {
  createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start: vi.fn(),
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
  }
  createGain() {
    return { gain: { value: 1 } };
  }
  decodeAudioData = vi.fn<[], Promise<AudioBuffer>>();
  close = vi.fn().mockResolvedValue(undefined);
  destination = {} as AudioDestinationNode;
}

const audioContextMock = vi.fn<[], MockAudioContext>(() => new MockAudioContext());
global.AudioContext = audioContextMock as unknown as typeof AudioContext;
global.webkitAudioContext = global.AudioContext;

const { trackTelemetryEvent } = await import('@/analytics/telemetry/telemetryProvider');
const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

describe('MinimalAlerts', () => {
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset to default config before each test
    resetMinimalAlertConfig();

    // Setup fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    });

    // Setup AudioContext mock
    mockAudioContext = new MockAudioContext();
    audioContextMock.mockImplementation(() => mockAudioContext);

    // Setup decodeAudioData mock
    const mockAudioBuffer = { duration: 2.5 } as AudioBuffer;
    mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
  });

  afterEach(() => {
    cleanupMinimalAlerts();
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = getMinimalAlertConfig();

      expect(config).toEqual(defaultMinimalAudioAlertConfig);
      expect(config.warningSound).toBe('minimal/placeholder.wav');
      expect(config.injurySound).toBe('minimal/placeholder.wav');
      expect(config.volume).toBe(0.7);
      expect(config.throttleMs).toBe(3000);
    });

    it('should configure alerts with overrides', () => {
      const overrides = {
        volume: 0.5,
        throttleMs: 5000,
        warningSound: 'custom/warning.wav',
      };

      configureMinimalAlerts(overrides);

      const config = getMinimalAlertConfig();
      expect(config.volume).toBe(0.5);
      expect(config.throttleMs).toBe(5000);
      expect(config.warningSound).toBe('custom/warning.wav');
      expect(config.injurySound).toBe('minimal/placeholder.wav'); // Unchanged

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alerts_configured', {
        warningSound: 'custom/warning.wav',
        injurySound: 'minimal/placeholder.wav',
        volume: 0.5,
        throttleMs: 5000,
      });
    });

    it('should reset configuration to defaults', () => {
      configureMinimalAlerts({ volume: 0.3, throttleMs: 1000 });
      expect(getMinimalAlertConfig().volume).toBe(0.3);

      resetMinimalAlertConfig();
      expect(getMinimalAlertConfig()).toEqual(defaultMinimalAudioAlertConfig);

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alerts_reset', {});
    });
  });

  describe('playMinimalAlert', () => {
    it('should play warning alert successfully', async () => {
      await playMinimalAlert('warning');

      expect(mockFetch).toHaveBeenCalledWith('/assets/audio/minimal/placeholder.wav');
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_played', {
        type: 'warning',
        assetPath: 'minimal/placeholder.wav',
        volume: 0.7,
        duration: 2.5,
        throttled: false,
      });
    });

    it('should play injury alert successfully', async () => {
      await playMinimalAlert('injury');

      expect(mockFetch).toHaveBeenCalledWith('/assets/audio/minimal/placeholder.wav');
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_played', {
        type: 'injury',
        assetPath: 'minimal/placeholder.wav',
        volume: 0.7,
        duration: 2.5,
        throttled: false,
      });
    });

    it('should throttle rapid alerts', async () => {
      // First alert should play
      await playMinimalAlert('warning');
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_played', expect.any(Object));

      // Second alert should be throttled
      await playMinimalAlert('warning');
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_throttled', {
        type: 'warning',
        throttleMs: 3000,
        timeSinceLastAlert: expect.any(Number),
      });

      // Should not try to fetch audio for throttled alert
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not throttle different alert types', async () => {
      await playMinimalAlert('warning');
      await playMinimalAlert('injury');

      expect(mockTrackTelemetryEvent).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(playMinimalAlert('warning')).rejects.toThrow('Network error');

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_failed', {
        type: 'warning',
        error: 'Network error',
        throttled: false,
      });
    });

    it('should handle audio decode errors', async () => {
      mockAudioContext.decodeAudioData.mockRejectedValueOnce(new Error('Decode failed'));

      await expect(playMinimalAlert('warning')).rejects.toThrow('Decode failed');

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_failed', {
        type: 'warning',
        error: 'Decode failed',
        throttled: false,
      });
    });

    it('should handle audio playback errors', async () => {
      const mockSource = mockAudioContext.createBufferSource();
      mockSource.start = vi.fn(() => {
        throw new Error('Playback failed');
      });

      await expect(playMinimalAlert('warning')).rejects.toThrow('Playback failed');
    });

    it('should use custom volume from configuration', async () => {
      configureMinimalAlerts({ volume: 0.9 });

      await playMinimalAlert('warning');

      // Verify that the gain node was set correctly
      const gainNode = mockAudioContext.createGain();
      expect(gainNode.gain.value).toBe(0.9);
    });

    it('should clamp volume to valid range', async () => {
      configureMinimalAlerts({ volume: 1.5 }); // Over 1.0

      await playMinimalAlert('warning');

      const gainNode = mockAudioContext.createGain();
      expect(gainNode.gain.value).toBeLessThanOrEqual(1.0);
    });

    it('should use custom sound paths', async () => {
      configureMinimalAlerts({
        warningSound: 'custom/warning.wav',
        injurySound: 'custom/injury.wav',
      });

      await playMinimalAlert('warning');
      expect(mockFetch).toHaveBeenCalledWith('/assets/audio/custom/warning.wav');

      await playMinimalAlert('injury');
      expect(mockFetch).toHaveBeenCalledWith('/assets/audio/custom/injury.wav');
    });
  });

  describe('Audio Context Management', () => {
    it('should initialize AudioContext lazily', async () => {
      expect(global.AudioContext).not.toHaveBeenCalled();

      await playMinimalAlert('warning');

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing AudioContext', async () => {
      await playMinimalAlert('warning');
      await playMinimalAlert('injury');

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('should cleanup audio resources', () => {
      // Initialize context
      playMinimalAlert('warning');

      cleanupMinimalAlerts();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle AudioContext close errors', async () => {
      mockAudioContext.close.mockRejectedValueOnce(new Error('Close failed'));

      // Should not throw
      expect(() => cleanupMinimalAlerts()).not.toThrow();
    });
  });

  describe('Throttling Logic', () => {
    it('should reset throttling after timeout', async () => {
      // Set short throttle for testing
      configureMinimalAlerts({ throttleMs: 100 });

      await playMinimalAlert('warning');

      // Fast-forward time past throttle period
      vi.advanceTimersByTime(200);

      await playMinimalAlert('warning');

      // Should play both times
      expect(mockTrackTelemetryEvent).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use custom throttle time', async () => {
      configureMinimalAlerts({ throttleMs: 1000 });

      await playMinimalAlert('warning');
      await playMinimalAlert('warning'); // Should be throttled

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_throttled', {
        type: 'warning',
        throttleMs: 1000,
        timeSinceLastAlert: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid alert types', () => {
      // TypeScript would catch this, but runtime check
      expect(async () => {
        // @ts-expect-error - Testing invalid type
        await playMinimalAlert('invalid');
      }).rejects.toThrow();
    });

    it('should handle fetch response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(playMinimalAlert('warning')).rejects.toThrow('Failed to load audio asset: 404 Not Found');
    });

    it('should handle malformed audio data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Invalid audio format')),
      });

      await expect(playMinimalAlert('warning')).rejects.toThrow('Invalid audio format');
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry for successful playback', async () => {
      await playMinimalAlert('warning');

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_played', {
        type: 'warning',
        assetPath: 'minimal/placeholder.wav',
        volume: 0.7,
        duration: 2.5,
        throttled: false,
      });
    });

    it('should emit telemetry for throttled alerts', async () => {
      await playMinimalAlert('warning');
      await playMinimalAlert('warning'); // Throttled

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_throttled', expect.any(Object));
    });

    it('should emit telemetry for failed alerts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(playMinimalAlert('warning')).rejects.toThrow();

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_failed', {
        type: 'warning',
        error: 'Network error',
        throttled: false,
      });
    });

    it('should emit telemetry for configuration changes', () => {
      configureMinimalAlerts({ volume: 0.8 });

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alerts_configured', expect.any(Object));
    });
  });

  describe('Resource Management', () => {
    it('should properly connect audio nodes', async () => {
      await playMinimalAlert('warning');

      const source = mockAudioContext.createBufferSource();
      const gainNode = mockAudioContext.createGain();

      expect(source.connect).toHaveBeenCalledWith(gainNode);
      expect(gainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('should set buffer and start playback', async () => {
      await playMinimalAlert('warning');

      const source = mockAudioContext.createBufferSource();
      expect(source.start).toHaveBeenCalledWith(0);
    });

    it('should handle source end events', async () => {
      const source = mockAudioContext.createBufferSource();

      await playMinimalAlert('warning');

      // Simulate end event
      if (source.onended) {
        source.onended(new Event('ended'));
      }
    });
  });
});
