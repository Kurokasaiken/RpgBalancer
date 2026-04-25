/**
 * Mobile Performance HUD Hook – NP-256
 * 
 * Real-time performance monitoring for mobile devices:
 * - FPS (frames per second)
 * - CPU usage estimation
 * - Network activity
 * - Battery drain rate
 * 
 * @since NP-256
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface BatteryManagerLike {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Performance metrics
 */
export interface PerfMetrics {
  fps: number;
  cpuUsage: number;
  networkActivity: {
    requests: number;
    bytesReceived: number;
    bytesSent: number;
  };
  batteryDrain: {
    level: number;
    charging: boolean;
    drainRate: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timestamp: number;
}

/**
 * HUD configuration
 */
export interface PerfHUDConfig {
  enabled: boolean;
  updateIntervalMs: number;
  fpsTarget: number;
  cpuWarningThreshold: number;
  memoryWarningThreshold: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
  compact: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_PERF_HUD_CONFIG: PerfHUDConfig = {
  enabled: false,
  updateIntervalMs: 1000,
  fpsTarget: 60,
  cpuWarningThreshold: 70,
  memoryWarningThreshold: 80,
  position: 'top-right',
  opacity: 0.9,
  compact: false,
};

/**
 * FPS counter using requestAnimationFrame
 */
class FPSCounter {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private rafId: number | null = null;

  start(): void {
    this.frames = 0;
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    this.frames++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = currentTime;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  getFPS(): number {
    return this.fps;
  }
}

/**
 * CPU usage estimator based on task timing
 */
class CPUEstimator {
  private samples: number[] = [];
  private maxSamples = 10;

  addSample(taskDuration: number, frameTime: number): void {
    const usage = Math.min(100, (taskDuration / frameTime) * 100);
    this.samples.push(usage);
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  getUsage(): number {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.samples.length);
  }
}

/**
 * Network activity monitor
 */
class NetworkMonitor {
  private requests = 0;
  private bytesReceived = 0;
  private bytesSent = 0;
  private lastReset = Date.now();

  recordRequest(bytes: number, sent = false): void {
    this.requests++;
    if (sent) {
      this.bytesSent += bytes;
    } else {
      this.bytesReceived += bytes;
    }
  }

  getActivity(): { requests: number; bytesReceived: number; bytesSent: number } {
    return {
      requests: this.requests,
      bytesReceived: this.bytesReceived,
      bytesSent: this.bytesSent,
    };
  }

  reset(): void {
    this.requests = 0;
    this.bytesReceived = 0;
    this.bytesSent = 0;
    this.lastReset = Date.now();
  }
}

/**
 * Battery monitor
 */
class BatteryMonitor {
  private battery: BatteryManagerLike | null = null;
  private lastLevel = 100;
  private lastCheck = Date.now();
  private drainRate = 0;

  async initialize(): Promise<void> {
    const navigatorWithBattery = navigator as NavigatorWithBattery;
    if (typeof navigatorWithBattery.getBattery === 'function') {
      try {
        this.battery = await navigatorWithBattery.getBattery();
        this.lastLevel = this.battery.level * 100;
        this.lastCheck = Date.now();
      } catch (error) {
        console.warn('[BatteryMonitor] Failed to initialize:', error);
      }
    }
  }

  update(): void {
    if (!this.battery) return;

    const currentLevel = this.battery.level * 100;
    const currentTime = Date.now();
    const timeDiff = (currentTime - this.lastCheck) / 1000 / 60; // minutes

    if (timeDiff > 0 && currentLevel < this.lastLevel) {
      this.drainRate = (this.lastLevel - currentLevel) / timeDiff; // % per minute
    }

    this.lastLevel = currentLevel;
    this.lastCheck = currentTime;
  }

  getStatus(): { level: number; charging: boolean; drainRate: number } {
    if (!this.battery) {
      return { level: 100, charging: false, drainRate: 0 };
    }

    return {
      level: Math.round(this.battery.level * 100),
      charging: this.battery.charging,
      drainRate: Math.round(this.drainRate * 100) / 100,
    };
  }
}

/**
 * Mobile Performance HUD Hook
 */
export function useMobilePerfHUD(initialConfig: Partial<PerfHUDConfig> = {}) {
  const [config, setConfig] = useState<PerfHUDConfig>({
    ...DEFAULT_PERF_HUD_CONFIG,
    ...initialConfig,
  });
  
  const [metrics, setMetrics] = useState<PerfMetrics>(() => ({
    fps: 0,
    cpuUsage: 0,
    networkActivity: { requests: 0, bytesReceived: 0, bytesSent: 0 },
    batteryDrain: { level: 100, charging: false, drainRate: 0 },
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
    timestamp: Date.now(),
  }));

  const fpsCounter = useRef<FPSCounter>(new FPSCounter());
  const cpuEstimator = useRef<CPUEstimator>(new CPUEstimator());
  const networkMonitor = useRef<NetworkMonitor>(new NetworkMonitor());
  const batteryMonitor = useRef<BatteryMonitor>(new BatteryMonitor());
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize battery monitor
   */
  useEffect(() => {
    batteryMonitor.current.initialize();
  }, []);

  /**
   * Update all metrics
   */
  const updateMetrics = useCallback(() => {
    const taskStart = performance.now();
    
    // Get FPS
    const fps = fpsCounter.current.getFPS();

    // Estimate CPU usage
    const taskEnd = performance.now();
    const taskDuration = taskEnd - taskStart;
    const frameTime = 1000 / (config.fpsTarget || 60);
    cpuEstimator.current.addSample(taskDuration, frameTime);
    const cpuUsage = cpuEstimator.current.getUsage();

    // Get network activity
    const networkActivity = networkMonitor.current.getActivity();

    // Update battery
    batteryMonitor.current.update();
    const batteryDrain = batteryMonitor.current.getStatus();

    // Get memory info
    const perfWithMemory = performance as PerformanceWithMemory;
    const memory = perfWithMemory.memory
      ? {
          usedJSHeapSize: perfWithMemory.memory.usedJSHeapSize,
          totalJSHeapSize: perfWithMemory.memory.totalJSHeapSize,
          jsHeapSizeLimit: perfWithMemory.memory.jsHeapSizeLimit,
        }
      : { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };

    setMetrics({
      fps,
      cpuUsage,
      networkActivity,
      batteryDrain,
      memory,
      timestamp: Date.now(),
    });
  }, [config.fpsTarget]);

  /**
   * Start/stop monitoring based on enabled state
   */
  useEffect(() => {
    const fpsCounterInstance = fpsCounter.current;

    if (config.enabled) {
      fpsCounterInstance.start();
      updateInterval.current = setInterval(() => {
        updateMetrics();
      }, config.updateIntervalMs);
    } else {
      fpsCounterInstance.stop();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    }

    return () => {
      fpsCounterInstance.stop();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [config.enabled, config.updateIntervalMs, updateMetrics]);

  /**
   * Toggle HUD visibility
   */
  const toggle = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<PerfHUDConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Reset network stats
   */
  const resetNetworkStats = useCallback(() => {
    networkMonitor.current.reset();
  }, []);

  /**
   * Record network request
   */
  const recordNetworkRequest = useCallback((bytes: number, sent = false) => {
    networkMonitor.current.recordRequest(bytes, sent);
  }, []);

  /**
   * Check if metrics are healthy
   */
  const isHealthy = useCallback(() => {
    return (
      metrics.fps >= (config.fpsTarget * 0.8) &&
      metrics.cpuUsage < config.cpuWarningThreshold &&
      (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100 < config.memoryWarningThreshold
    );
  }, [metrics, config]);

  return {
    config,
    metrics,
    toggle,
    updateConfig,
    resetNetworkStats,
    recordNetworkRequest,
    isHealthy,
  };
}
