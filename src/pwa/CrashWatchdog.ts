/**
 * Punch Club PWA Crash Loop Auto-Recover Watchdog
 * 
 * Monitors application crashes and implements automatic recovery
 * by resetting service worker and cache when crash loop is detected.
 * 
 * @since NP-253
 */

import { z } from 'zod';

const isServiceWorkerRuntime = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (import.meta.env?.MODE === 'test') {
    return true;
  }

  const hostname = window.location.hostname ?? '';
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname.endsWith('.local');
  const isHttp = window.location.protocol === 'http:';

  return (
    'serviceWorker' in navigator &&
    import.meta.env?.VITE_DISABLE_SW !== 'true' &&
    !isLocalHost &&
    !isHttp
  );
};

/**
 * Crash event record for tracking crash history
 */
export interface CrashEvent {
  timestamp: number;
  error?: string;
  url: string;
  userAgent: string;
  sessionId: string;
}

/**
 * Crash detection configuration
 */
export interface CrashWatchdogConfig {
  /** Maximum crashes allowed within time window */
  maxCrashes: number;
  /** Time window in milliseconds to evaluate crashes */
  timeWindowMs: number;
  /** Cooldown period after recovery */
  recoveryCooldownMs: number;
  /** Whether to automatically recover */
  autoRecover: boolean;
}

/**
 * Recovery action types
 */
export type RecoveryAction = 'clear_cache' | 'reset_sw' | 'full_reset';

/**
 * Recovery result
 */
export interface RecoveryResult {
  action: RecoveryAction;
  success: boolean;
  timestamp: number;
  error?: string;
}

/**
 * Zod schema for configuration validation
 */
export const CrashWatchdogConfigSchema = z.object({
  maxCrashes: z.number().min(1).max(10).default(3),
  timeWindowMs: z.number().min(30000).max(300000).default(120000), // 2 minutes
  recoveryCooldownMs: z.number().min(10000).max(300000).default(60000), // 1 minute
  autoRecover: z.boolean().default(true),
});

/**
 * Default configuration
 */
export const DEFAULT_CRASH_WATCHDOG_CONFIG: CrashWatchdogConfig = {
  maxCrashes: 3,
  timeWindowMs: 120000, // 2 minutes
  recoveryCooldownMs: 60000, // 1 minute
  autoRecover: true,
};

/**
 * Storage keys for persistence
 */
const STORAGE_KEYS = {
  CRASH_EVENTS: 'pc_crash_events',
  LAST_RECOVERY: 'pc_last_recovery',
  WATCHDOG_STATE: 'pc_watchdog_state',
} as const;

/**
 * Punch Club Crash Loop Watchdog
 * 
 * Monitors application crashes and implements automatic recovery
 * strategies to prevent crash loops in the PWA environment.
 */
export class CrashWatchdog {
  private config: CrashWatchdogConfig;
  private crashEvents: CrashEvent[] = [];
  private isRecovering = false;
  private sessionId: string;

  constructor(config: Partial<CrashWatchdogConfig> = {}) {
    this.config = {
      ...DEFAULT_CRASH_WATCHDOG_CONFIG,
      ...config,
    };
    
    // Validate configuration
    const validated = CrashWatchdogConfigSchema.parse(this.config);
    this.config = validated;

    // Generate session ID for tracking
    this.sessionId = this.generateSessionId();

    // Load crash history from storage
    this.loadCrashHistory();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load crash history from persistent storage
   */
  private async loadCrashHistory(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CRASH_EVENTS);
      if (stored) {
        const events = JSON.parse(stored) as CrashEvent[];
        // Filter events outside time window
        const cutoff = Date.now() - this.config.timeWindowMs;
        this.crashEvents = events.filter(event => event.timestamp > cutoff);
      }
    } catch (error) {
      console.warn('Failed to load crash history:', error);
      this.crashEvents = [];
    }
  }

  /**
   * Save crash history to persistent storage
   */
  private async saveCrashHistory(): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.CRASH_EVENTS, JSON.stringify(this.crashEvents));
    } catch (error) {
      console.warn('Failed to save crash history:', error);
    }
  }

  /**
   * Record a crash event
   */
  async recordCrash(error?: string): Promise<void> {
    const crashEvent: CrashEvent = {
      timestamp: Date.now(),
      error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };

    // Add to crash history
    this.crashEvents.push(crashEvent);

    // Clean old events outside time window
    const cutoff = Date.now() - this.config.timeWindowMs;
    this.crashEvents = this.crashEvents.filter(event => event.timestamp > cutoff);

    // Save to storage
    await this.saveCrashHistory();

    // Emit telemetry event
    this.emitTelemetry('crash_recorded', {
      sessionId: this.sessionId,
      crashCount: this.crashEvents.length,
      error,
    });

    // Check if recovery is needed
    if (this.shouldRecover()) {
      await this.attemptRecovery();
    }
  }

  /**
   * Check if recovery should be triggered
   */
  private shouldRecover(): boolean {
    if (!this.config.autoRecover || this.isRecovering) {
      return false;
    }

    // Check if we're in cooldown period
    const lastRecovery = this.getLastRecovery();
    if (lastRecovery && Date.now() - lastRecovery.timestamp < this.config.recoveryCooldownMs) {
      return false;
    }

    // Check crash threshold
    return this.crashEvents.length >= this.config.maxCrashes;
  }

  /**
   * Get last recovery attempt
   */
  private getLastRecovery(): RecoveryResult | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_RECOVERY);
      return stored ? JSON.parse(stored) as RecoveryResult : null;
    } catch {
      return null;
    }
  }

  /**
   * Save recovery result
   */
  private async saveRecoveryResult(result: RecoveryResult): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_RECOVERY, JSON.stringify(result));
    } catch (error) {
      console.warn('Failed to save recovery result:', error);
    }
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(): Promise<RecoveryResult> {
    if (this.isRecovering) {
      throw new Error('Recovery already in progress');
    }

    this.isRecovering = true;
    const startTime = Date.now();

    try {
      // Try recovery actions in order of severity
      const actions: RecoveryAction[] = ['clear_cache', 'reset_sw', 'full_reset'];
      
      for (const action of actions) {
        const result = await this.executeRecoveryAction(action);
        
        if (result.success) {
          // Clear crash history after successful recovery
          this.crashEvents = [];
          await this.saveCrashHistory();
          
          // Emit success telemetry
          this.emitTelemetry('recovery_success', {
            action,
            duration: Date.now() - startTime,
            sessionId: this.sessionId,
          });

          return result;
        }
      }

      // All recovery actions failed
      throw new Error('All recovery actions failed');
    } catch (error) {
      const failureResult: RecoveryResult = {
        action: 'full_reset',
        success: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      };

      // Emit failure telemetry
      this.emitTelemetry('recovery_failed', {
        action: failureResult.action,
        duration: Date.now() - startTime,
        error: failureResult.error,
        sessionId: this.sessionId,
      });

      return failureResult;
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Execute a specific recovery action
   */
  private async executeRecoveryAction(action: RecoveryAction): Promise<RecoveryResult> {
    const timestamp = Date.now();

    try {
      switch (action) {
        case 'clear_cache':
          await this.clearCache();
          break;
        case 'reset_sw':
          await this.resetServiceWorker();
          break;
        case 'full_reset':
          await this.fullReset();
          break;
        default:
          throw new Error(`Unknown recovery action: ${action}`);
      }

      return {
        action,
        success: true,
        timestamp,
      };
    } catch (error) {
      return {
        action,
        success: false,
        timestamp,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clear application cache
   */
  private async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }
  }

  /**
   * Reset service worker
   */
  private async resetServiceWorker(): Promise<void> {
    if (!isServiceWorkerRuntime()) {
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Send reset message to service worker
        registration.active?.postMessage({
          type: 'PWA_CRASH_RECOVERY_RESET',
          data: { timestamp: Date.now() },
        });

        // Unregister and re-register
        await registration.unregister();
        
        // Wait a bit before re-registering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-register service worker
        await navigator.serviceWorker.register('/service-worker.js');
      }
    }
  }

  /**
   * Full reset - clear everything and reload
   */
  private async fullReset(): Promise<void> {
    // Clear all storage
    await this.clearCache();
    
    // Clear localStorage (except essential keys)
    const keysToKeep = [STORAGE_KEYS.LAST_RECOVERY as string]; // Keep recovery info
    const allKeys = Object.keys(localStorage);
    
    for (const key of allKeys) {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }

    // Reset service worker
    await this.resetServiceWorker();

    // Reload page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(eventType: string, data: unknown): void {
    const event = new CustomEvent('pc_sw_crash_loop', {
      detail: {
        type: eventType,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        data,
      },
    });

    window.dispatchEvent(event);

    // Also send to service worker if available
    if (isServiceWorkerRuntime() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({
          type: 'PWA_CRASH_WATCHDOG_TELEMETRY',
          data: event.detail,
        });
      }).catch(() => {
        // Service worker not available, ignore
      });
    }
  }

  /**
   * Public method to emit telemetry (for external use)
   */
  public emitTelemetryEvent(eventType: string, data: unknown): void {
    this.emitTelemetry(eventType, data);
  }

  /**
   * Get current crash statistics
   */
  getCrashStats(): {
    totalCrashes: number;
    crashesInWindow: number;
    lastCrash?: CrashEvent;
    isRecovering: boolean;
    lastRecovery?: RecoveryResult;
  } {
    const lastRecovery = this.getLastRecovery();
    
    return {
      totalCrashes: this.crashEvents.length,
      crashesInWindow: this.crashEvents.length,
      lastCrash: this.crashEvents[this.crashEvents.length - 1],
      isRecovering: this.isRecovering,
      lastRecovery: lastRecovery || undefined,
    };
  }

  /**
   * Manually trigger recovery (for testing/admin)
   */
  async manualRecovery(action?: RecoveryAction): Promise<RecoveryResult> {
    if (action) {
      return this.executeRecoveryAction(action);
    } else {
      return this.attemptRecovery();
    }
  }

  /**
   * Reset watchdog state (clear crash history)
   */
  async reset(): Promise<void> {
    this.crashEvents = [];
    await this.saveCrashHistory();
    
    // Clear recovery cooldown
    localStorage.removeItem(STORAGE_KEYS.LAST_RECOVERY);
    
    this.emitTelemetry('watchdog_reset', {
      sessionId: this.sessionId,
    });
  }
}

/**
 * Create a crash watchdog instance with default configuration
 */
export function createCrashWatchdog(config?: Partial<CrashWatchdogConfig>): CrashWatchdog {
  return new CrashWatchdog(config);
}

/**
 * Global error handler integration
 */
export function setupGlobalErrorHandling(watchdog: CrashWatchdog): void {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    watchdog.recordCrash(event.error?.message || event.message);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    watchdog.recordCrash(event.reason?.message || 'Unhandled promise rejection');
  });
}

/**
 * Service worker crash detection
 */
export function setupServiceWorkerMonitoring(watchdog: CrashWatchdog): void {
  if (!isServiceWorkerRuntime() || !('serviceWorker' in navigator)) {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker changed, might indicate recovery
      watchdog.emitTelemetryEvent('sw_controller_changed', {
        sessionId: watchdog['sessionId'],
      });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      if (type === 'PWA_SW_CRASH_DETECTED') {
        watchdog.recordCrash(data?.error || 'Service worker crash');
      }
    });
  }
}
