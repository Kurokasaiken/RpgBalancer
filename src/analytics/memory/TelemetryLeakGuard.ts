/**
 * NP-050 – Telemetry Memory Leak Guard
 * 
 * Memory monitoring and leak detection system for telemetry pipelines
 * with configurable thresholds, adaptive sampling, and alert channels.
 * 
 * @since 2026-01-21
 * @author Sentinel-Analytics – Leak Guard
 */

import { performance } from 'perf_hooks';
import { setTimeout, clearTimeout } from 'timers';
import type {
  MemoryLeakGuardConfig,
  MemoryThresholdConfig,
  SamplingConfig,
  AlertChannelConfig
} from './memoryLeakGuardConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// === Memory Sample Types ===

/**
 * Single memory sample point.
 */
export interface MemorySample {
  /** Sample timestamp */
  timestamp: number;
  /** Heap used in MB */
  heapUsedMB: number;
  /** Heap total in MB */
  heapTotalMB: number;
  /** External memory in MB */
  externalMB: number;
  /** RSS memory in MB */
  rssMB: number;
  /** Number of GC collections */
  gcCollections?: number;
  /** Sample collection duration in ms */
  collectionDurationMs: number;
  /** CPU usage during sampling (0-100) */
  cpuUsage: number;
  /** Sample source (guard, cli, manual) */
  source: string;
}

/**
 * Memory trend analysis result.
 */
export interface MemoryTrend {
  /** Time window in minutes */
  windowMin: number;
  /** Number of samples analyzed */
  sampleCount: number;
  /** Memory growth slope (MB per minute) */
  growthSlopeMBPerMin: number;
  /** Correlation coefficient */
  correlation: number;
  /** Predicted memory in next hour (MB) */
  predictedNextHourMB: number;
  /** Time until threshold breach (minutes, null if not breached) */
  timeToThresholdMin: number | null;
  /** Trend confidence (0-1) */
  confidence: number;
}

/**
 * Memory leak detection result.
 */
export interface MemoryLeakDetection {
  /** Detection timestamp */
  timestamp: number;
  /** Leak detected flag */
  leakDetected: boolean;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Current memory usage */
  currentUsage: MemorySample;
  /** Trend analysis */
  trend: MemoryTrend;
  /** Detection reasons */
  reasons: string[];
  /** Recommended actions */
  recommendations: string[];
  /** Alert channels triggered */
  triggeredChannels: string[];
}

/**
 * Telemetry event for leak detection.
 */
export interface TelemetryLeakGuardTriggeredEvent {
  /** Event type */
  eventType: 'telemetry_leak_guard_triggered';
  /** Timestamp */
  timestamp: number;
  /** Guard instance ID */
  instanceId: string;
  /** Detection result */
  detection: MemoryLeakDetection;
  /** Configuration snapshot */
  config: {
    thresholds: MemoryThresholdConfig;
    sampling: SamplingConfig;
  };
  /** Performance impact */
  performanceImpact: {
    cpuUsage: number;
    sampleTimeMs: number;
    memoryImpactMB: number;
  };
}

// === Memory Leak Guard Class ===

/**
 * Main memory leak guard implementation.
 */
export class TelemetryLeakGuard {
  private config: MemoryLeakGuardConfig;
  private samples: MemorySample[] = [];
  private samplingTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCleanup = Date.now();
  private alertCounters = new Map<string, number>();

  constructor(config: MemoryLeakGuardConfig) {
    this.config = config;
  }

  /**
   * Starts the memory leak guard.
   */
  async start(): Promise<void> {
    if (this.isRunning || !this.config.enabled) {
      return;
    }

    console.log(`🛡️ Starting Telemetry Memory Leak Guard (${this.config.instanceId})`);
    
    // Load existing samples
    await this.loadSamples();
    
    // Start sampling
    this.startSampling();
    
    this.isRunning = true;
    
    if (this.config.telemetry.enabled) {
      this.emitTelemetryEvent('guard_started', {
        instanceId: this.config.instanceId,
        sampleCount: this.samples.length,
        config: this.config,
      });
    }
  }

  /**
   * Stops the memory leak guard.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 Stopping Telemetry Memory Leak Guard (${this.config.instanceId})`);
    
    // Stop sampling
    if (this.samplingTimer) {
      clearTimeout(this.samplingTimer);
      this.samplingTimer = null;
    }
    
    // Save samples
    await this.saveSamples();
    
    this.isRunning = false;
    
    if (this.config.telemetry.enabled) {
      this.emitTelemetryEvent('guard_stopped', {
        instanceId: this.config.instanceId,
        finalSampleCount: this.samples.length,
      });
    }
  }

  /**
   * Manually collects a memory sample.
   */
  async collectSample(source: string = 'manual'): Promise<MemorySample> {
    const startTime = performance.now();
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed / 1024 / 1024; // Convert to MB
    const heapTotal = memUsage.heapTotal / 1024 / 1024;
    const external = memUsage.external / 1024 / 1024;
    const rss = memUsage.rss / 1024 / 1024;
    
    // Get CPU usage (simplified)
    const cpuUsage = this.getCpuUsage();
    
    // Get GC stats if available
    const gcCollections = this.getGCCollections();
    
    const sample: MemorySample = {
      timestamp: Date.now(),
      heapUsedMB: heapUsed,
      heapTotalMB: heapTotal,
      externalMB: external,
      rssMB: rss,
      gcCollections,
      collectionDurationMs: performance.now() - startTime,
      cpuUsage,
      source,
    };
    
    // Add to samples
    this.samples.push(sample);
    
    // Cleanup old samples
    this.cleanupOldSamples();
    
    // Persist if enabled
    if (this.config.persistence.enabled) {
      await this.saveSamples();
    }
    
    return sample;
  }

  /**
   * Analyzes memory trends and detects leaks.
   */
  async analyzeMemory(): Promise<MemoryLeakDetection> {
    if (this.samples.length < this.config.thresholds.minSamples) {
      return {
        timestamp: Date.now(),
        leakDetected: false,
        severity: 'low',
        currentUsage: this.samples[this.samples.length - 1] || await this.collectSample(),
        trend: this.calculateTrend(),
        reasons: ['Insufficient samples for analysis'],
        recommendations: ['Wait for more samples'],
        triggeredChannels: [],
      };
    }
    
    const currentUsage = this.samples[this.samples.length - 1];
    const trend = this.calculateTrend();
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let leakDetected = false;
    
    // Check absolute memory threshold
    if (currentUsage.heapUsedMB > this.config.thresholds.maxHeapSizeMB) {
      leakDetected = true;
      reasons.push(`Memory usage (${currentUsage.heapUsedMB.toFixed(1)}MB) exceeds threshold (${this.config.thresholds.maxHeapSizeMB}MB)`);
      recommendations.push('Investigate memory allocation patterns');
      severity = this.upgradeSeverity(severity, 'high');
    }
    
    // Check growth rate
    if (trend.growthSlopeMBPerMin > this.config.thresholds.growthRateMBPerMin) {
      leakDetected = true;
      reasons.push(`Memory growth rate (${trend.growthSlopeMBPerMin.toFixed(2)}MB/min) exceeds threshold (${this.config.thresholds.growthRateMBPerMin}MB/min)`);
      recommendations.push('Check for memory leaks or inefficient data structures');
      severity = this.upgradeSeverity(severity, 'medium');
    }
    
    // Check leak slope
    if (trend.growthSlopeMBPerMin > this.config.thresholds.leakSlopeThreshold) {
      leakDetected = true;
      reasons.push(`Memory leak slope (${trend.growthSlopeMBPerMin.toFixed(2)}MB/min) exceeds leak threshold (${this.config.thresholds.leakSlopeThreshold}MB/min)`);
      recommendations.push('Immediate investigation required - likely memory leak');
      severity = this.upgradeSeverity(severity, 'critical');
    }
    
    // Check prediction
    if (trend.predictedNextHourMB > this.config.thresholds.maxHeapSizeMB * 1.5) {
      leakDetected = true;
      reasons.push(`Predicted memory usage in 1 hour (${trend.predictedNextHourMB.toFixed(1)}MB) will exceed safe limits`);
      recommendations.push('Schedule restart or memory optimization');
      severity = this.upgradeSeverity(severity, 'high');
    }
    
    const detection: MemoryLeakDetection = {
      timestamp: Date.now(),
      leakDetected,
      severity,
      currentUsage,
      trend,
      reasons,
      recommendations,
      triggeredChannels: [],
    };
    
    // Trigger alerts if leak detected
    if (leakDetected) {
      await this.triggerAlerts(detection);
    }
    
    return detection;
  }

  /**
   * Gets current memory statistics.
   */
  getMemoryStats(): {
    current: MemorySample | null;
    sampleCount: number;
    trend: MemoryTrend | null;
    isRunning: boolean;
  } {
    return {
      current: this.samples.length > 0 ? this.samples[this.samples.length - 1] : null,
      sampleCount: this.samples.length,
      trend: this.samples.length >= this.config.thresholds.minSamples ? this.calculateTrend() : null,
      isRunning: this.isRunning,
    };
  }

  /**
   * Updates the guard configuration.
   */
  updateConfig(newConfig: Partial<MemoryLeakGuardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart sampling if interval changed
    if (this.isRunning) {
      this.stopSampling();
      this.startSampling();
    }
  }

  // === Private Methods ===

  /**
   * Starts the sampling timer.
   */
  private startSampling(): void {
    const sample = async () => {
      try {
        await this.collectSample('guard');
        
        // Adaptive sampling based on CPU usage
        let nextInterval = this.config.sampling.intervalMs;
        if (this.config.performance.enableAdaptiveSampling) {
          const lastSample = this.samples[this.samples.length - 1];
          if (lastSample && lastSample.cpuUsage > this.config.performance.maxCpuUsage) {
            nextInterval *= 2; // Slow down if CPU is high
          } else if (lastSample && lastSample.cpuUsage < this.config.performance.maxCpuUsage / 2) {
            nextInterval /= 2; // Speed up if CPU is low
          }
        }
        
        this.samplingTimer = setTimeout(sample, Math.max(nextInterval, 1000));
      } catch (error) {
        console.error('Error collecting memory sample:', error);
        this.samplingTimer = setTimeout(sample, this.config.sampling.intervalMs);
      }
    };
    
    this.samplingTimer = setTimeout(sample, this.config.sampling.intervalMs);
  }

  /**
   * Stops the sampling timer.
   */
  private stopSampling(): void {
    if (this.samplingTimer) {
      clearTimeout(this.samplingTimer);
      this.samplingTimer = null;
    }
  }

  /**
   * Calculates memory trend from samples.
   */
  private calculateTrend(): MemoryTrend {
    if (this.samples.length < 2) {
      throw new Error('Insufficient samples for trend calculation');
    }
    
    const relevantSamples = this.samples.slice(-this.config.thresholds.minSamples);
    const timeSpan = (relevantSamples[relevantSamples.length - 1].timestamp - relevantSamples[0].timestamp) / 1000 / 60; // minutes
    
    if (timeSpan < 1) {
      throw new Error('Time span too short for trend calculation');
    }
    
    // Simple linear regression for slope
    const n = relevantSamples.length;
    const sumX = relevantSamples.reduce((sum, _, i) => sum + i, 0);
    const sumY = relevantSamples.reduce((sum, sample) => sum + sample.heapUsedMB, 0);
    const sumXY = relevantSamples.reduce((sum, sample, i) => sum + i * sample.heapUsedMB, 0);
    const sumX2 = relevantSamples.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const slopeMBPerMin = slope * (n / timeSpan);
    
    // Calculate correlation
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = relevantSamples.reduce((sum, sample, i) => sum + (i - meanX) * (sample.heapUsedMB - meanY), 0);
    const denominatorX = Math.sqrt(relevantSamples.reduce((sum, _, i) => sum + Math.pow(i - meanX, 2), 0));
    const denominatorY = Math.sqrt(relevantSamples.reduce((sum, sample) => sum + Math.pow(sample.heapUsedMB - meanY, 2), 0));
    const correlation = denominatorX * denominatorY > 0 ? numerator / (denominatorX * denominatorY) : 0;
    
    // Predict next hour
    const predictedNextHourMB = relevantSamples[relevantSamples.length - 1].heapUsedMB + (slopeMBPerMin * 60);
    
    // Calculate time to threshold
    const timeToThresholdMin = slopeMBPerMin > 0 
      ? (this.config.thresholds.maxHeapSizeMB - relevantSamples[relevantSamples.length - 1].heapUsedMB) / slopeMBPerMin
      : null;
    
    return {
      windowMin: timeSpan,
      sampleCount: relevantSamples.length,
      growthSlopeMBPerMin: slopeMBPerMin,
      correlation,
      predictedNextHourMB,
      timeToThresholdMin,
      confidence: Math.abs(correlation),
    };
  }

  /**
   * Triggers alerts through configured channels.
   */
  private async triggerAlerts(detection: MemoryLeakDetection): Promise<void> {
    const triggeredChannels: string[] = [];
    
    for (const channel of this.config.alertChannels) {
      if (!channel.severity.includes(detection.severity)) {
        continue;
      }
      
      // Rate limiting
      const key = `${channel.type}-${channel.target}`;
      const count = this.alertCounters.get(key) || 0;
      if (count >= channel.rateLimit) {
        continue;
      }
      
      try {
        await this.sendAlert(channel, detection);
        this.alertCounters.set(key, count + 1);
        triggeredChannels.push(`${channel.type}:${channel.target}`);
      } catch (error) {
        console.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
    
    detection.triggeredChannels = triggeredChannels;
  }

  /**
   * Sends alert to a specific channel.
   */
  private async sendAlert(channel: AlertChannelConfig, detection: MemoryLeakDetection): Promise<void> {
    const message = channel.template 
      ? this.formatAlertMessage(channel.template, detection)
      : this.formatDefaultAlertMessage(detection);
    
    switch (channel.type) {
      case 'console':
        console.log(`[MEMORY LEAK ALERT] ${message}`);
        break;
        
      case 'file':
        await this.writeAlertToFile(channel.target, message);
        break;
        
      case 'webhook':
        await this.sendWebhookAlert(channel.target, detection);
        break;
        
      case 'email':
        await this.sendEmailAlert(channel.target, detection);
        break;
        
      default:
        throw new Error(`Unknown alert channel type: ${channel.type}`);
    }
  }

  /**
   * Formats alert message using template.
   */
  private formatAlertMessage(template: string, detection: MemoryLeakDetection): string {
    return template
      .replace('{timestamp}', new Date(detection.timestamp).toISOString())
      .replace('{severity}', detection.severity)
      .replace('{message}', detection.reasons.join('; '))
      .replace('{heapUsed}', detection.currentUsage.heapUsedMB.toFixed(1))
      .replace('{growthRate}', detection.trend.growthSlopeMBPerMin.toFixed(2));
  }

  /**
   * Formats default alert message.
   */
  private formatDefaultAlertMessage(detection: MemoryLeakDetection): string {
    return `Memory leak detected (${detection.severity}): ${detection.reasons.join('; ')}. Current usage: ${detection.currentUsage.heapUsedMB.toFixed(1)}MB, Growth rate: ${detection.trend.growthSlopeMBPerMin.toFixed(2)}MB/min`;
  }

  /**
   * Writes alert to file.
   */
  private async writeAlertToFile(filename: string, message: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filename, `[${new Date().toISOString()}] ${message}\n`, { flag: 'a' });
  }

  /**
   * Sends webhook alert.
   */
  private async sendWebhookAlert(url: string, detection: MemoryLeakDetection): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'memory_leak_alert',
        timestamp: detection.timestamp,
        severity: detection.severity,
        detection,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Sends email alert.
   */
  private async sendEmailAlert(email: string, detection: MemoryLeakDetection): Promise<void> {
    // Placeholder implementation - would integrate with email service
    console.log(`[EMAIL ALERT] To: ${email}, Subject: Memory Leak Detected (${detection.severity})`);
  }

  /**
   * Emits telemetry event.
   */
  private emitTelemetryEvent(eventType: string, data: any): void {
    if (!this.config.telemetry.enabled) {
      return;
    }
    
    const event = {
      eventType: `${this.config.telemetry.eventPrefix}_${eventType}`,
      timestamp: Date.now(),
      instanceId: this.config.instanceId,
      ...data,
    };
    
    // Send to telemetry system
    console.log('[TELEMETRY]', JSON.stringify(event));
  }

  /**
   * Loads samples from persistence.
   */
  private async loadSamples(): Promise<void> {
    if (!this.config.persistence.enabled) {
      return;
    }
    
    try {
      const data = await loadData(this.config.persistence.storageKey);
      if (data && Array.isArray(data.samples)) {
        this.samples = data.samples.filter((sample: any) => 
          typeof sample.timestamp === 'number' && 
          typeof sample.heapUsedMB === 'number'
        );
      }
    } catch (error) {
      console.warn('Failed to load memory samples:', error);
    }
  }

  /**
   * Saves samples to persistence.
   */
  private async saveSamples(): Promise<void> {
    if (!this.config.persistence.enabled) {
      return;
    }
    
    try {
      await saveData(this.config.persistence.storageKey, {
        samples: this.samples,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to save memory samples:', error);
    }
  }

  /**
   * Cleans up old samples.
   */
  private cleanupOldSamples(): void {
    if (!this.config.sampling.enableCleanup) {
      return;
    }
    
    const now = Date.now();
    const retentionMs = this.config.sampling.retentionMin * 60 * 1000;
    const cutoffTime = now - retentionMs;
    
    // Remove old samples
    this.samples = this.samples.filter(sample => sample.timestamp > cutoffTime);
    
    // Limit sample count
    if (this.samples.length > this.config.sampling.maxSamples) {
      this.samples = this.samples.slice(-this.config.sampling.maxSamples);
    }
    
    // Reset alert counters periodically
    if (now - this.lastCleanup > 60 * 60 * 1000) { // 1 hour
      this.alertCounters.clear();
      this.lastCleanup = now;
    }
  }

  /**
   * Gets CPU usage (simplified implementation).
   */
  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    const usage = process.cpuUsage();
    return Math.min(usage.user / 1000000, 100); // Convert to percentage
  }

  /**
   * Gets GC collection count.
   */
  private getGCCollections(): number {
    // Placeholder - would integrate with V8 GC stats if available
    return 0;
  }

  /**
   * Upgrades severity level.
   */
  private upgradeSeverity(current: 'low' | 'medium' | 'high' | 'critical', newLevel: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' | 'critical' {
    const levels = { low: 0, medium: 1, high: 2, critical: 3 };
    return levels[newLevel] > levels[current] ? newLevel : current;
  }
}
