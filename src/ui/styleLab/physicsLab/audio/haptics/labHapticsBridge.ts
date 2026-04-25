/**
 * PL-AUD – Physics Lab Audio & Haptics Harness
 * 
 * Haptics bridge implementation for Physics Lab with generic interface
 * for future peripheral device integration.
 * 
 * @since 2026-02-19
 * @author Cascade
 */

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
 * Haptic device capabilities
 */
export interface HapticDeviceCapabilities {
  /** Device supports vibration */
  supportsVibration: boolean;
  /** Device supports pressure feedback */
  supportsPressure: boolean;
  /** Device supports temperature feedback */
  supportsTemperature: boolean;
  /** Maximum concurrent patterns */
  maxConcurrentPatterns: number;
  /** Supported pattern lengths */
  maxPatternLength: number;
}

/**
 * Haptic device interface
 */
export interface HapticDevice {
  /** Device identifier */
  id: string;
  /** Device name */
  name: string;
  /** Device capabilities */
  capabilities: HapticDeviceCapabilities;
  /** Play haptic pattern */
  playPattern: (pattern: HapticPattern) => Promise<boolean>;
  /** Stop all patterns */
  stopAll: () => Promise<void>;
  /** Check if device is ready */
  isReady: () => boolean;
}

/**
 * Haptic bridge configuration
 */
export interface HapticsBridgeConfig {
  /** Enable haptic feedback */
  enabled: boolean;
  /** Default intensity for patterns */
  defaultIntensity: HapticPattern['intensity'];
  /** Queue management */
  queue: {
    enabled: boolean;
    maxSize: number;
    autoClear: boolean;
    clearTimeoutMs: number;
  };
  /** Fallback settings */
  fallback: {
    useNavigatorVibrate: boolean;
    logPatterns: boolean;
  };
}

/**
 * Haptic bridge implementation
 */
export class LabHapticsBridge {
  private config: HapticsBridgeConfig;
  private devices: Map<string, HapticDevice> = new Map();
  private patternQueue: HapticPattern[] = [];
  private isPlaying = false;
  private clearTimeoutId?: number;

  constructor(config: Partial<HapticsBridgeConfig> = {}) {
    this.config = {
      enabled: true,
      defaultIntensity: 'medium',
      queue: {
        enabled: true,
        maxSize: 10,
        autoClear: true,
        clearTimeoutMs: 5000,
      },
      fallback: {
        useNavigatorVibrate: true,
        logPatterns: true,
      },
      ...config,
    };

    this.initializeDevices();
  }

  /**
   * Initialize available haptic devices
   */
  private initializeDevices(): void {
    // Check for navigator.vibrate (Web Vibration API)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const webVibrateDevice: HapticDevice = {
        id: 'web-vibrate',
        name: 'Web Vibration API',
        capabilities: {
          supportsVibration: true,
          supportsPressure: false,
          supportsTemperature: false,
          maxConcurrentPatterns: 1,
          maxPatternLength: 100,
        },
        playPattern: async (pattern: HapticPattern) => {
          try {
            // Convert pattern to Vibration API format
            const vibratePattern = this.convertToVibratePattern(pattern);
            const success = navigator.vibrate(vibratePattern);
            return success;
          } catch (error) {
            console.error('[LabHapticsBridge] Web vibration failed:', error);
            return false;
          }
        },
        stopAll: async () => {
          navigator.vibrate(0);
        },
        isReady: () => true,
      };
      
      this.devices.set('web-vibrate', webVibrateDevice);
    }

    // TODO(PL-AUD): Add support for specific haptic devices
    // - Gamepad haptic feedback
    // - TouchForce API
    // - Custom haptic hardware via WebHID/WebUSB
  }

  /**
   * Convert haptic pattern to Vibration API format
   */
  private convertToVibratePattern(pattern: HapticPattern): number[] {
    // Convert pattern array to Vibration API format
    // Pattern format: [vibration1, pause1, vibration2, pause2, ...]
    const vibratePattern: number[] = [];
    
    for (let i = 0; i < pattern.pattern.length; i++) {
      const value = pattern.pattern[i];
      if (i % 2 === 0) {
        // Vibration duration (ms)
        vibratePattern.push(value);
      } else {
        // Pause duration (ms)
        vibratePattern.push(value);
      }
    }
    
    return vibratePattern;
  }

  /**
   * Enqueue haptic pattern for playback
   */
  public enqueueHapticPattern(pattern: HapticPattern): void {
    if (!this.config.enabled) {
      return;
    }

    // Log pattern if fallback logging is enabled
    if (this.config.fallback.logPatterns) {
      console.log('[LabHapticsBridge] Haptic pattern enqueued:', {
        id: pattern.id,
        intensity: pattern.intensity,
        duration: pattern.duration,
        pattern: pattern.pattern,
        timestamp: Date.now(),
      });
    }

    if (this.config.queue.enabled) {
      // Add to queue with size limit
      if (this.patternQueue.length >= this.config.queue.maxSize) {
        // Remove oldest pattern
        this.patternQueue.shift();
      }
      
      this.patternQueue.push(pattern);
      this.processQueue();
    } else {
      // Play immediately
      this.playPattern(pattern);
    }
  }

  /**
   * Clear haptic pattern queue
   */
  public clearQueue(): void {
    this.patternQueue = [];
    this.isPlaying = false;
    
    if (this.clearTimeoutId) {
      clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = undefined;
    }

    // Stop all devices
    this.stopAllDevices();
  }

  /**
   * Process the haptic pattern queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.patternQueue.length === 0) {
      return;
    }

    this.isPlaying = true;

    while (this.patternQueue.length > 0) {
      const pattern = this.patternQueue.shift();
      if (pattern) {
        await this.playPattern(pattern);
      }
    }

    this.isPlaying = false;

    // Auto-clear queue if enabled
    if (this.config.queue.autoClear && this.patternQueue.length === 0) {
      this.clearTimeoutId = window.setTimeout(() => {
        this.clearQueue();
      }, this.config.queue.clearTimeoutMs);
    }
  }

  /**
   * Play haptic pattern on available devices
   */
  private async playPattern(pattern: HapticPattern): Promise<void> {
    const promises: Promise<boolean>[] = [];

    for (const device of this.devices.values()) {
      if (device.isReady()) {
        promises.push(device.playPattern(pattern));
      }
    }

    // Wait for all devices to complete (or fail)
    await Promise.allSettled(promises);
  }

  /**
   * Stop all haptic patterns on all devices
   */
  public stopAllPatterns(): void {
    this.clearQueue();
    this.stopAllDevices();
  }

  /**
   * Stop all devices
   */
  private async stopAllDevices(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const device of this.devices.values()) {
      promises.push(device.stopAll());
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get available devices
   */
  public getAvailableDevices(): HapticDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get device by ID
   */
  public getDevice(id: string): HapticDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<HapticsBridgeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  public getConfig(): HapticsBridgeConfig {
    return { ...this.config };
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    size: number;
    isPlaying: boolean;
    maxCapacity: number;
  } {
    return {
      size: this.patternQueue.length,
      isPlaying: this.isPlaying,
      maxCapacity: this.config.queue.maxSize,
    };
  }

  /**
   * Create test haptic patterns
   */
  public static createTestPatterns(): Record<string, HapticPattern> {
    return {
      light: {
        id: 'test-light',
        pattern: [10, 10],
        intensity: 'light',
        duration: 20,
      },
      medium: {
        id: 'test-medium',
        pattern: [20, 10, 20, 10],
        intensity: 'medium',
        duration: 60,
      },
      strong: {
        id: 'test-strong',
        pattern: [50, 20, 50, 20, 50],
        intensity: 'strong',
        duration: 190,
      },
      pulse: {
        id: 'test-pulse',
        pattern: [10, 5, 10, 5, 10, 5, 10, 5],
        intensity: 'medium',
        duration: 70,
      },
      long: {
        id: 'test-long',
        pattern: [100],
        intensity: 'medium',
        duration: 100,
      },
    };
  }

  /**
   * Validate haptic pattern
   */
  public static validatePattern(pattern: HapticPattern): boolean {
    if (!pattern.id || !pattern.pattern || pattern.pattern.length === 0) {
      return false;
    }

    if (pattern.duration <= 0) {
      return false;
    }

    // Check pattern values are non-negative numbers
    for (const value of pattern.pattern) {
      if (typeof value !== 'number' || value < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Dispose of haptic bridge
   */
  public dispose(): void {
    this.clearQueue();
    this.devices.clear();
    
    if (this.clearTimeoutId) {
      clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = undefined;
    }
  }
}

/**
 * Global haptic bridge instance
 */
let globalHapticsBridge: LabHapticsBridge | null = null;

/**
 * Get or create global haptic bridge instance
 */
export function getHapticsBridge(config?: Partial<HapticsBridgeConfig>): LabHapticsBridge {
  if (!globalHapticsBridge) {
    globalHapticsBridge = new LabHapticsBridge(config);
  }
  return globalHapticsBridge;
}

/**
 * Dispose of global haptic bridge
 */
export function disposeHapticsBridge(): void {
  if (globalHapticsBridge) {
    globalHapticsBridge.dispose();
    globalHapticsBridge = null;
  }
}
