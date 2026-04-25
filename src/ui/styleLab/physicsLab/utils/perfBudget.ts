/**
 * Performance Budget Utilities
 *
 * Provides performance monitoring and budget enforcement for Physics Lab.
 * Includes FPS monitoring, CPU usage tracking, and export gating logic.
 */

/**
 * Performance metrics collected by the budget monitor.
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** CPU usage in milliseconds per frame */
  cpuMs: number;
  /** Audio concurrency count */
  audioConcurrency: number;
  /** Haptic concurrency count */
  hapticConcurrency: number;
  /** Memory usage information */
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  /** Timestamp when metrics were collected */
  timestamp: number;
}

/**
 * Performance budget thresholds.
 */
export interface PerformanceBudget {
  /** Minimum acceptable FPS */
  minFps: number;
  /** Maximum acceptable CPU time per frame in milliseconds */
  maxCpuMs: number;
  /** Duration in seconds before triggering block */
  blockDurationSeconds: number;
  /** Maximum audio concurrency */
  maxAudioConcurrency: number;
  /** Maximum haptic concurrency */
  maxHapticConcurrency: number;
}

/**
 * Default performance budget for Physics Lab.
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  minFps: 60,
  maxCpuMs: 8,
  blockDurationSeconds: 3,
  maxAudioConcurrency: 4,
  maxHapticConcurrency: 2,
};

/**
 * Performance budget state.
 */
export interface PerformanceBudgetState {
  /** Current metrics */
  current: PerformanceMetrics;
  /** Historical metrics for median calculation */
  history: PerformanceMetrics[];
  /** Whether export is currently blocked */
  isBlocked: boolean;
  /** Reason for blocking */
  blockReason: string | null;
  /** When the block started (timestamp) */
  blockStartedAt: number | null;
}

/**
 * Rolling median calculator for performance metrics.
 */
class RollingMedian {
  private values: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Add a value to the rolling median calculation.
   */
  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  /**
   * Get the current median value.
   */
  median(): number {
    if (this.values.length === 0) return 0;
    
    const sorted = [...this.values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Clear all values.
   */
  clear(): void {
    this.values = [];
  }
}

/**
 * Performance budget monitor.
 */
export class PerformanceBudgetMonitor {
  private budget: PerformanceBudget;
  private state: PerformanceBudgetState;
  private fpsMedian: RollingMedian;
  private cpuMedian: RollingMedian;
  private callbacks: Set<(state: PerformanceBudgetState) => void> = new Set();

  constructor(budget: Partial<PerformanceBudget> = {}) {
    this.budget = { ...DEFAULT_PERFORMANCE_BUDGET, ...budget };
    this.state = {
      current: {
        fps: 0,
        cpuMs: 0,
        audioConcurrency: 0,
        hapticConcurrency: 0,
        memory: {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
        },
        timestamp: Date.now(),
      },
      history: [],
      isBlocked: false,
      blockReason: null,
      blockStartedAt: null,
    };
    this.fpsMedian = new RollingMedian();
    this.cpuMedian = new RollingMedian();
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: PerformanceBudgetState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current state.
   */
  getState(): PerformanceBudgetState {
    return { ...this.state };
  }

  /**
   * Update performance metrics.
   */
  updateMetrics(metrics: Partial<PerformanceMetrics>): void {
    const updatedMetrics = { ...this.state.current, ...metrics };
    this.state.current = updatedMetrics;
    
    // Add to history
    this.state.history.push(updatedMetrics);
    if (this.state.history.length > 100) {
      this.state.history.shift();
    }

    // Update rolling medians
    this.fpsMedian.add(updatedMetrics.fps);
    this.cpuMedian.add(updatedMetrics.cpuMs);

    // Check budget constraints
    this.checkBudgetConstraints();
  }

  /**
   * Check if current metrics violate budget constraints.
   */
  private checkBudgetConstraints(): void {
    const medianFps = this.fpsMedian.median();
    const medianCpu = this.cpuMedian.median();
    
    const fpsViolation = medianFps < this.budget.minFps;
    const cpuViolation = medianCpu > this.budget.maxCpuMs;
    
    const shouldBlock = fpsViolation || cpuViolation;
    
    if (shouldBlock && !this.state.isBlocked) {
      // Start blocking
      this.state.isBlocked = true;
      this.state.blockStartedAt = Date.now();
      this.state.blockReason = fpsViolation ? 'low_fps' : 'high_cpu';
    } else if (!shouldBlock && this.state.isBlocked) {
      // Stop blocking
      this.state.isBlocked = false;
      this.state.blockReason = null;
      this.state.blockStartedAt = null;
    }

    // Notify subscribers
    this.callbacks.forEach(callback => callback(this.getState()));
  }

  /**
   * Check if export should be blocked based on current state.
   */
  shouldBlockExport(): {
    blocked: boolean;
    reason: string | null;
    durationSeconds: number;
  } {
    if (!this.state.isBlocked || !this.state.blockStartedAt) {
      return { blocked: false, reason: null, durationSeconds: 0 };
    }

    const durationSeconds = (Date.now() - this.state.blockStartedAt) / 1000;
    const durationExceeded = durationSeconds >= this.budget.blockDurationSeconds;

    return {
      blocked: this.state.isBlocked && !durationExceeded,
      reason: this.state.blockReason,
      durationSeconds,
    };
  }

  /**
   * Get performance summary for display.
   */
  getSummary(): {
    fps: {
      current: number;
      median: number;
      target: number;
      status: 'good' | 'poor';
    };
    cpu: {
      current: number;
      median: number;
      target: number;
      status: 'good' | 'poor';
    };
    concurrency: {
      audio: {
        current: number;
        max: number;
        status: 'good' | 'warning';
      };
      haptic: {
        current: number;
        max: number;
        status: 'good' | 'warning';
      };
    };
    block: {
      blocked: boolean;
      reason: string | null;
      durationSeconds: number;
      budgetDuration: number;
    };
  } {
    const medianFps = this.fpsMedian.median();
    const medianCpu = this.cpuMedian.median();
    const { blocked, reason, durationSeconds } = this.shouldBlockExport();

    return {
      fps: {
        current: this.state.current.fps,
        median: medianFps,
        target: this.budget.minFps,
        status: medianFps >= this.budget.minFps ? 'good' : 'poor',
      },
      cpu: {
        current: this.state.current.cpuMs,
        median: medianCpu,
        target: this.budget.maxCpuMs,
        status: medianCpu <= this.budget.maxCpuMs ? 'good' : 'poor',
      },
      concurrency: {
        audio: {
          current: this.state.current.audioConcurrency,
          max: this.budget.maxAudioConcurrency,
          status: this.state.current.audioConcurrency <= this.budget.maxAudioConcurrency ? 'good' : 'warning',
        },
        haptic: {
          current: this.state.current.hapticConcurrency,
          max: this.budget.maxHapticConcurrency,
          status: this.state.current.hapticConcurrency <= this.budget.maxHapticConcurrency ? 'good' : 'warning',
        },
      },
      block: {
        blocked,
        reason,
        durationSeconds,
        budgetDuration: this.budget.blockDurationSeconds,
      },
    };
  }

  /**
   * Reset the monitor state.
   */
  reset(): void {
    this.fpsMedian.clear();
    this.cpuMedian.clear();
    this.state.history = [];
    this.state.isBlocked = false;
    this.state.blockReason = null;
    this.state.blockStartedAt = null;
    
    this.callbacks.forEach(callback => callback(this.getState()));
  }
}

/**
 * Create a performance budget monitor instance.
 */
export function createPerformanceBudgetMonitor(
  budget?: Partial<PerformanceBudget>
): PerformanceBudgetMonitor {
  return new PerformanceBudgetMonitor(budget);
}
