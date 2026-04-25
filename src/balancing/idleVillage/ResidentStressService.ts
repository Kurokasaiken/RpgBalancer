/**
 * NP-147 – Resident Stress Notification Service
 * 
 * Centralized service for tracking resident stress levels based on drop rejections,
 * fatigue thresholds, and activity assignment patterns. Provides configurable
 * stress thresholds, persistence via PersistenceService, and telemetry integration.
 * 
 * @since 2026-01-14
 * @author Cascade
 */

import { z } from 'zod';
// import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
// import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// === Core Schema Definitions ===

/**
 * Stress level categories for residents
 */
export const RESIDENT_STRESS_LEVELS = ['low', 'moderate', 'high', 'critical'] as const;
export type ResidentStressLevel = typeof RESIDENT_STRESS_LEVELS[number];

/**
 * Stress event types that can affect resident stress levels
 */
export const STRESS_EVENT_TYPES = [
  'drop_rejected',
  'fatigue_threshold_crossed', 
  'multiple_rejections',
  'recovery_completed',
  'stress_reset',
] as const;

export type StressEventType = typeof STRESS_EVENT_TYPES[number];

/**
 * Individual stress event record
 */
export const ResidentStressEventSchema = z.object({
  /** Unique event identifier */
  id: z.string(),
  /** Resident ID affected by the event */
  residentId: z.string(),
  /** Type of stress event */
  eventType: z.enum(STRESS_EVENT_TYPES),
  /** Timestamp when the event occurred */
  timestamp: z.number(),
  /** Activity ID involved (if applicable) */
  activityId: z.string().optional(),
  /** Stress level before the event */
  stressBefore: z.number(),
  /** Stress level after the event */
  stressAfter: z.number(),
  /** Event context and metadata */
  context: z.object({
    /** Validation result that triggered the event */
    validation: z.any().optional(),
    /** Fatigue level at time of event */
    fatigue: z.number().optional(),
    /** Number of consecutive rejections */
    consecutiveRejections: z.number().optional(),
    /** Additional event-specific data */
    metadata: z.record(z.unknown()).optional(),
  }),
});

/**
 * Resident stress tracking data
 */
export const ResidentStressDataSchema = z.object({
  /** Resident identifier */
  residentId: z.string(),
  /** Current stress level (0-100) */
  currentStress: z.number().min(0).max(100),
  /** Current stress category */
  stressLevel: z.enum(RESIDENT_STRESS_LEVELS),
  /** Total stress events recorded */
  totalEvents: z.number(),
  /** Events in the current session */
  sessionEvents: z.array(ResidentStressEventSchema),
  /** Last updated timestamp */
  lastUpdated: z.number(),
  /** Stress history for trend analysis */
  stressHistory: z.array(z.object({
    timestamp: z.number(),
    stress: z.number(),
    level: z.enum(RESIDENT_STRESS_LEVELS),
  })),
});

/**
 * Service configuration for stress thresholds and behavior
 */
export const ResidentStressConfigSchema = z.object({
  /** Stress thresholds (0-100) */
  thresholds: z.object({
    /** Moderate stress threshold */
    moderate: z.number().min(0).max(100),
    /** High stress threshold */
    high: z.number().min(0).max(100),
    /** Critical stress threshold */
    critical: z.number().min(0).max(100),
  }),
  /** Stress impact factors */
  impactFactors: z.object({
    /** Stress increase for drop rejection */
    dropRejection: z.number().min(0).max(50),
    /** Stress increase for fatigue threshold crossing */
    fatigueThreshold: z.number().min(0).max(30),
    /** Stress increase for consecutive rejections */
    consecutiveRejection: z.number().min(0).max(20),
    /** Stress recovery per tick */
    recoveryPerTick: z.number().min(0).max(5),
    /** Stress reduction for successful assignment */
    successfulAssignment: z.number().min(0).max(15),
  }),
  /** Notification settings */
  notifications: z.object({
    /** Enable stress notifications */
    enabled: z.boolean(),
    /** Minimum stress level for notifications */
    minLevel: z.enum(RESIDENT_STRESS_LEVELS),
    /** Cooldown between notifications (ms) */
    cooldownMs: z.number().min(0),
  }),
  /** Persistence settings */
  persistence: z.object({
    /** Storage key for stress data */
    storageKey: z.string(),
    /** Maximum history entries to keep */
    maxHistoryEntries: z.number().min(10).max(1000),
    /** Session timeout in ms */
    sessionTimeoutMs: z.number().min(60000),
  }),
});

// === Type Definitions ===

export type ResidentStressEvent = z.infer<typeof ResidentStressEventSchema>;
export type ResidentStressData = z.infer<typeof ResidentStressDataSchema>;
export type ResidentStressConfig = z.infer<typeof ResidentStressConfigSchema>;

// === Default Configuration ===

export const DEFAULT_STRESS_CONFIG: ResidentStressConfig = {
  thresholds: {
    moderate: 30,
    high: 60,
    critical: 85,
  },
  impactFactors: {
    dropRejection: 15,
    fatigueThreshold: 20,
    consecutiveRejection: 10,
    recoveryPerTick: 2,
    successfulAssignment: 10,
  },
  notifications: {
    enabled: true,
    minLevel: 'moderate',
    cooldownMs: 30000, // 30 seconds
  },
  persistence: {
    storageKey: 'idle_village_resident_stress',
    maxHistoryEntries: 100,
    sessionTimeoutMs: 300000, // 5 minutes
  },
};

// === Service Implementation ===

/**
 * Resident Stress Notification Service
 * 
 * Tracks and manages resident stress levels based on validation events,
 * provides notifications, and persists stress data.
 */
export class ResidentStressService {
  private config: ResidentStressConfig;
  private stressData: Map<string, ResidentStressData> = new Map();
  private lastNotificationTime: Map<string, number> = new Map();
  private isInitialized = false;

  constructor(config: Partial<ResidentStressConfig> = {}) {
    this.config = {
      ...DEFAULT_STRESS_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_STRESS_CONFIG.thresholds,
        ...config.thresholds,
      },
      impactFactors: {
        ...DEFAULT_STRESS_CONFIG.impactFactors,
        ...config.impactFactors,
      },
      notifications: {
        ...DEFAULT_STRESS_CONFIG.notifications,
        ...config.notifications,
      },
      persistence: {
        ...DEFAULT_STRESS_CONFIG.persistence,
        ...config.persistence,
      },
    };
  }

  /**
   * Initialize the service by loading persisted stress data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const persistedData = await loadData(this.config.persistence.storageKey);
      
      if (persistedData) {
        const parsedData = z.record(ResidentStressDataSchema).safeParse(persistedData);
        if (parsedData.success) {
          this.stressData = new Map(Object.entries(parsedData.data)) as Map<string, ResidentStressData>;
        }
      }
    } catch (error) {
      console.warn('Failed to load resident stress data:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Get current stress data for a resident
   */
  getResidentStress(residentId: string): ResidentStressData | null {
    return this.stressData.get(residentId) || null;
  }

  /**
   * Get all residents with stress levels at or above specified threshold
   */
  getStressedResidents(minLevel: ResidentStressLevel = 'moderate'): Array<{
    residentId: string;
    stressData: ResidentStressData;
  }> {
    const levelOrder = { low: 0, moderate: 1, high: 2, critical: 3 };
    const minLevelValue = levelOrder[minLevel];

    return Array.from(this.stressData.entries())
      .filter(([, data]) => levelOrder[data.stressLevel] >= minLevelValue)
      .map(([residentId, stressData]) => ({ residentId, stressData }));
  }

  /**
   * Process a stress event and update resident stress levels
   */
  async processStressEvent(event: Omit<ResidentStressEvent, 'id' | 'timestamp'>): Promise<void> {
    await this.ensureInitialized();

    const eventTimestamp = Date.now();

    let residentData = this.stressData.get(event.residentId);
    
    if (!residentData) {
      // Initialize new resident stress data
      residentData = {
        residentId: event.residentId,
        currentStress: 0,
        stressLevel: 'low',
        totalEvents: 0,
        sessionEvents: [],
        lastUpdated: Date.now(),
        stressHistory: [],
      };
      this.stressData.set(event.residentId, residentData);
    }

    // Update stress based on event type
    const stressBefore = residentData.currentStress;
    let stressAfter = stressBefore;

    switch (event.eventType) {
      case 'drop_rejected':
        stressAfter = Math.min(100, stressBefore + this.config.impactFactors.dropRejection);
        break;
      case 'fatigue_threshold_crossed':
        stressAfter = Math.min(100, stressBefore + this.config.impactFactors.fatigueThreshold);
        break;
      case 'multiple_rejections':
        stressAfter = Math.min(100, stressBefore + this.config.impactFactors.consecutiveRejection);
        break;
      case 'recovery_completed':
        stressAfter = Math.max(0, stressBefore - this.config.impactFactors.successfulAssignment);
        break;
      case 'stress_reset':
        stressAfter = 0;
        break;
    }

    const fullEvent: ResidentStressEvent = {
      ...event,
      id: `${event.residentId}-${event.eventType}-${eventTimestamp}`,
      timestamp: eventTimestamp,
      stressBefore,
      stressAfter,
    };

    // Update resident data
    residentData.currentStress = stressAfter;
    residentData.stressLevel = this.calculateStressLevel(stressAfter);
    residentData.totalEvents += 1;
    residentData.sessionEvents.push(fullEvent);
    residentData.lastUpdated = eventTimestamp;
    residentData.stressHistory.push({
      timestamp: eventTimestamp,
      stress: stressAfter,
      level: residentData.stressLevel,
    });

    // Limit history size
    if (residentData.stressHistory.length > this.config.persistence.maxHistoryEntries) {
      residentData.stressHistory = residentData.stressHistory.slice(-this.config.persistence.maxHistoryEntries);
    }

    if (residentData.sessionEvents.length > 50) {
      residentData.sessionEvents = residentData.sessionEvents.slice(-50);
    }

    // Check for notification eligibility
    await this.checkNotification(residentData);

    // Persist changes
    await this.persistData();
  }

  /**
   * Apply stress recovery for all residents (called per tick)
   */
  async applyRecovery(): Promise<void> {
    await this.ensureInitialized();

    const now = Date.now();
    const sessionTimeout = this.config.persistence.sessionTimeoutMs;

    for (const [residentId, residentData] of this.stressData.entries()) {
      // Check if session has timed out
      if (now - residentData.lastUpdated > sessionTimeout) {
        // Apply recovery
        const newStress = Math.max(0, residentData.currentStress - this.config.impactFactors.recoveryPerTick);
        residentData.currentStress = newStress;
        residentData.stressLevel = this.calculateStressLevel(newStress);
        residentData.lastUpdated = now;
        residentData.stressHistory.push({
          timestamp: now,
          stress: newStress,
          level: residentData.stressLevel,
        });
      }
    }

    await this.persistData();
  }

  /**
   * Reset stress for a specific resident
   */
  async resetResidentStress(residentId: string): Promise<void> {
    await this.ensureInitialized();

    const residentData = this.stressData.get(residentId);
    if (residentData) {
      await this.processStressEvent({
        residentId,
        eventType: 'stress_reset',
        stressBefore: residentData.currentStress,
        stressAfter: 0,
        context: {},
      });
    }
  }

  /**
   * Reset stress for all residents
   */
  async resetAllStress(): Promise<void> {
    await this.ensureInitialized();

    for (const residentId of this.stressData.keys()) {
      await this.resetResidentStress(residentId);
    }
  }

  /**
   * Get stress statistics
   */
  getStressStatistics(): {
    totalResidents: number;
    stressedResidents: number;
    criticalResidents: number;
    averageStress: number;
    stressLevelDistribution: Record<ResidentStressLevel, number>;
  } {
    const residents = Array.from(this.stressData.values());
    const levelOrder = { low: 0, moderate: 1, high: 2, critical: 3 };
    
    const stressedResidents = residents.filter(r => levelOrder[r.stressLevel] >= levelOrder.moderate).length;
    const criticalResidents = residents.filter(r => r.stressLevel === 'critical').length;
    const averageStress = residents.length > 0 
      ? residents.reduce((sum, r) => sum + r.currentStress, 0) / residents.length 
      : 0;

    const stressLevelDistribution: Record<ResidentStressLevel, number> = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    residents.forEach(r => {
      stressLevelDistribution[r.stressLevel]++;
    });

    return {
      totalResidents: residents.length,
      stressedResidents,
      criticalResidents,
      averageStress,
      stressLevelDistribution,
    };
  }

  // === Private Methods ===

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private calculateStressLevel(stress: number): ResidentStressLevel {
    if (stress >= this.config.thresholds.critical) return 'critical';
    if (stress >= this.config.thresholds.high) return 'high';
    if (stress >= this.config.thresholds.moderate) return 'moderate';
    return 'low';
  }

  private async checkNotification(residentData: ResidentStressData): Promise<void> {
    if (!this.config.notifications.enabled) return;

    const levelOrder = { low: 0, moderate: 1, high: 2, critical: 3 };
    const minLevelValue = levelOrder[this.config.notifications.minLevel];
    
    if (levelOrder[residentData.stressLevel] < minLevelValue) return;

    const lastNotification = this.lastNotificationTime.get(residentData.residentId) || 0;
    const now = Date.now();
    
    if (now - lastNotification < this.config.notifications.cooldownMs) return;

    // Emit notification event
    this.emitNotification(residentData);
    this.lastNotificationTime.set(residentData.residentId, now);
  }

  private emitNotification(residentData: ResidentStressData): void {
    const event = new CustomEvent('resident-stress-notification', {
      detail: {
        residentId: residentData.residentId,
        stressLevel: residentData.stressLevel,
        currentStress: residentData.currentStress,
        recentEvents: residentData.sessionEvents.slice(-5),
      },
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  private async persistData(): Promise<void> {
    try {
      const dataObject = Object.fromEntries(this.stressData.entries());
      await saveData(this.config.persistence.storageKey, dataObject);
    } catch (error) {
      console.warn('Failed to persist resident stress data:', error);
    }
  }
}

// === Service Instance ===

let residentStressService: ResidentStressService | null = null;

/**
 * Get the singleton instance of the ResidentStressService
 */
export function getResidentStressService(config?: Partial<ResidentStressConfig>): ResidentStressService {
  if (!residentStressService) {
    residentStressService = new ResidentStressService(config);
  }
  return residentStressService;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetResidentStressService(): void {
  residentStressService = null;
}
