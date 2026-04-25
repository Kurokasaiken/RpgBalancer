/**
 * Minimal Audio Alert Scaffold
 *
 * Config-first audio alert system for Minimal Gameplay with lazy loading,
 * throttling, and telemetry integration. Provides warning and injury sound alerts.
 */

import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * Audio alert types supported by the system.
 */
export type MinimalAudioAlertType = 'warning' | 'injury';

/**
 * Configuration for Minimal Audio Alerts.
 */
export interface MinimalAudioAlertConfig {
  /** Path to warning sound asset (relative to public/assets/audio/). */
  warningSound: string;
  /** Path to injury sound asset (relative to public/assets/audio/). */
  injurySound: string;
  /** Global volume level (0.0 to 1.0). */
  volume: number;
  /** Minimum time between alerts in milliseconds (throttling). */
  throttleMs: number;
}

/**
 * Default configuration for audio alerts.
 */
export const defaultMinimalAudioAlertConfig: MinimalAudioAlertConfig = {
  warningSound: 'minimal/placeholder.wav',
  injurySound: 'minimal/placeholder.wav',
  volume: 0.7,
  throttleMs: 3000, // 3 seconds minimum between alerts
};

/**
 * Internal state for audio alert system.
 */
let currentConfig: MinimalAudioAlertConfig = { ...defaultMinimalAudioAlertConfig };
let lastAlertTime = 0;
let audioContext: AudioContext | null = null;

/**
 * Initialize Web Audio API context (lazy initialization).
 */
function initializeAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

/**
 * Load audio asset lazily and return AudioBuffer.
 */
async function loadAudioAsset(assetPath: string): Promise<AudioBuffer> {
  try {
    const context = initializeAudioContext();

    // Convert relative path to full URL
    const assetUrl = `/assets/audio/${assetPath}`;

    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Failed to load audio asset: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    return audioBuffer;
  } catch (error) {
    console.warn(`[MinimalAudioAlerts] Failed to load audio asset "${assetPath}":`, error);
    throw error;
  }
}

/**
 * Play audio buffer with current configuration.
 */
async function playAudioBuffer(buffer: AudioBuffer, volume: number): Promise<void> {
  try {
    const context = initializeAudioContext();
    const source = context.createBufferSource();
    const gainNode = context.createGain();

    // Configure volume
    gainNode.gain.value = Math.max(0, Math.min(1, volume));

    // Connect nodes
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);

    // Play audio
    source.start(0);

    // Return promise that resolves when playback ends
    return new Promise((resolve, reject) => {
      source.onended = () => resolve();
      source.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.warn('[MinimalAudioAlerts] Failed to play audio buffer:', error);
    throw error;
  }
}

/**
 * Check if alert should be throttled based on time since last alert.
 */
function shouldThrottleAlert(): boolean {
  const now = Date.now();
  const timeSinceLastAlert = now - lastAlertTime;
  return timeSinceLastAlert < currentConfig.throttleMs;
}

/**
 * Update last alert timestamp.
 */
function updateLastAlertTime(): void {
  lastAlertTime = Date.now();
}

/**
 * Play a minimal audio alert with throttling and telemetry.
 *
 * @param type - Type of alert to play ('warning' or 'injury')
 * @returns Promise that resolves when alert playback completes
 */
export async function playMinimalAlert(type: MinimalAudioAlertType): Promise<void> {
  // Check throttling
  if (shouldThrottleAlert()) {
    console.log(`[MinimalAudioAlerts] Alert throttled: ${type}`);
    trackTelemetryEvent('minimal_audio_alert_throttled', {
      type,
      throttleMs: currentConfig.throttleMs,
      timeSinceLastAlert: Date.now() - lastAlertTime,
    });
    return;
  }

  try {
    // Determine asset path
    const assetPath = type === 'warning'
      ? currentConfig.warningSound
      : currentConfig.injurySound;

    console.log(`[MinimalAudioAlerts] Playing alert: ${type} (${assetPath})`);

    // Load and play audio
    const audioBuffer = await loadAudioAsset(assetPath);
    await playAudioBuffer(audioBuffer, currentConfig.volume);

    // Update timestamp and emit telemetry
    updateLastAlertTime();
    trackTelemetryEvent('minimal_audio_alert_played', {
      type,
      assetPath,
      volume: currentConfig.volume,
      duration: audioBuffer.duration,
      throttled: false,
    });

    console.log(`[MinimalAudioAlerts] Alert completed: ${type}`);

  } catch (error) {
    // Emit telemetry for failed alerts
    trackTelemetryEvent('minimal_audio_alert_failed', {
      type,
      error: error instanceof Error ? error.message : 'Unknown error',
      throttled: false,
    });

    console.warn(`[MinimalAudioAlerts] Alert failed: ${type}`, error);

    // Re-throw to allow caller to handle
    throw error;
  }
}

/**
 * Configure minimal audio alerts with custom settings.
 *
 * @param overrides - Partial configuration to override defaults
 */
export function configureMinimalAlerts(overrides: Partial<MinimalAudioAlertConfig>): void {
  currentConfig = { ...currentConfig, ...overrides };

  console.log('[MinimalAudioAlerts] Configuration updated:', currentConfig);

  trackTelemetryEvent('minimal_audio_alerts_configured', {
    warningSound: currentConfig.warningSound,
    injurySound: currentConfig.injurySound,
    volume: currentConfig.volume,
    throttleMs: currentConfig.throttleMs,
  });
}

/**
 * Get current audio alert configuration.
 */
export function getMinimalAlertConfig(): MinimalAudioAlertConfig {
  return { ...currentConfig };
}

/**
 * Reset audio alert configuration to defaults.
 */
export function resetMinimalAlertConfig(): void {
  currentConfig = { ...defaultMinimalAudioAlertConfig };
  console.log('[MinimalAudioAlerts] Configuration reset to defaults');

  trackTelemetryEvent('minimal_audio_alerts_reset', {});
}

/**
 * Cleanup audio resources (for testing or shutdown).
 */
export function cleanupMinimalAlerts(): void {
  if (audioContext) {
    audioContext.close().catch(error => {
      console.warn('[MinimalAudioAlerts] Failed to close audio context:', error);
    });
    audioContext = null;
  }

  lastAlertTime = 0;
  console.log('[MinimalAudioAlerts] Resources cleaned up');
}
