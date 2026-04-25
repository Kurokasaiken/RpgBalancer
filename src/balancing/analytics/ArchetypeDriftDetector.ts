/**
 * NP-055 – Balancer Archetype Drift Detector
 * 
 * Sentinel-Balancer – Drift QA system for monitoring archetype weight
 * changes between releases. Compares current weight snapshots with
 * historical baselines and calculates drift percentages with severity assessment.
 * 
 * @since 2026-01-20
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Archetype weight snapshot configuration schema.
 */
export const ArchetypeSnapshotConfigSchema = z.object({
  /** Schema version for compatibility */
  schemaVersion: z.string().default('1.0.0'),
  /** Snapshot timestamp */
  timestamp: z.number(),
  /** Balancer configuration version */
  balancerVersion: z.string(),
  /** Node.js version */
  nodeVersion: z.string(),
  /** Platform information */
  platform: z.string(),
  /** Process ID */
  pid: z.number(),
  /** Environment */
  environment: z.enum(['development', 'staging', 'production', 'test']),
  /** Generation method */
  generationMethod: z.enum(['automatic', 'manual', 'test']),
  /** Total number of stats in configuration */
  totalStats: z.number().min(1),
  /** Number of archetypes generated */
  totalArchetypes: z.number().min(1),
  /** Random seed used for generation */
  seed: z.number(),
});

/**
 * Individual archetype weight snapshot.
 */
export const ArchetypeWeightSnapshotSchema = z.object({
  /** Archetype identifier */
  id: z.string(),
  /** Archetype name */
  name: z.string(),
  /** Archetype type (single-stat or pair-stat) */
  archetypeType: z.enum(['single-stat', 'pair-stat']),
  /** Stat weights used for generation */
  statWeights: z.record(z.number()),
  /** Total points allocated */
  totalPoints: z.number().min(0),
  /** Generation timestamp */
  generatedAt: z.number(),
  /** Generation seed */
  seed: z.number(),
});

/**
 * Archetype snapshot with all weight data.
 */
export const ArchetypeSnapshotSchema = z.object({
  /** Configuration metadata */
  config: ArchetypeSnapshotConfigSchema,
  /** Individual archetype weights */
  archetypes: z.array(ArchetypeWeightSnapshotSchema),
  /** Global stat weights from BalancerConfig */
  globalWeights: z.record(z.number()),
  /** Derived stat definitions */
  derivedStats: z.array(z.string()),
  /** Incompatible stat pairs */
  incompatiblePairs: z.array(z.tuple([z.string(), z.string()])),
  /** Generation metadata */
  metadata: z.object({
    generationDurationMs: z.number(),
    memoryUsageMB: z.number(),
    cpuUsagePercent: z.number(),
  }),
});

/**
 * Drift analysis result for a single archetype.
 */
export const ArchetypeDriftAnalysisSchema = z.object({
  /** Archetype identifier */
  archetypeId: z.string(),
  /** Current weight snapshot */
  currentWeights: z.record(z.number()),
  /** Baseline weight snapshot */
  baselineWeights: z.record(z.number()),
  /** Weight change percentage for each stat */
  weightChanges: z.record(z.number()),
  /** Overall drift percentage */
  driftPercentage: z.number(),
  /** Drift severity level */
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  /** Affected stats list */
  affectedStats: z.array(z.string()),
  /** Recommendations for addressing drift */
  recommendations: z.array(z.string()),
  /** Analysis timestamp */
  analyzedAt: z.number(),
});

/**
 * Archetype drift detection configuration schema.
 */
export const ArchetypeDriftDetectionConfigSchema = z.object({
  /** Weight change threshold for detection (0.01-1.0) */
  weightChangeThreshold: z.number().min(0.01).max(1.0),
  /** Severity thresholds for different drift levels */
  severityThresholds: z.object({
    low: z.number().min(0.05).max(0.2),
    medium: z.number().min(0.2).max(0.5),
    high: z.number().min(0.5).max(0.8),
    critical: z.number().min(0.8).max(1.0),
  }),
  /** Minimum sample count for analysis */
  minSampleCount: z.number().min(2),
  /** Include derived stats in analysis */
  includeDerivedStats: z.boolean().default(true),
  /** Enable verbose logging */
  verbose: z.boolean().default(false),
});

/**
 * Complete drift detection result.
 */
export const ArchetypeDriftDetectionSchema = z.object({
  /** Detection timestamp */
  timestamp: z.number(),
  /** Overall drift severity */
  severity: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  /** Total archetypes analyzed */
  totalArchetypes: z.number(),
  /** Archetypes with significant drift */
  driftedArchetypes: z.array(ArchetypeDriftAnalysisSchema),
  /** Global weight changes */
  globalWeightChanges: z.record(z.number()),
  /** Derived stat changes */
  derivedStatsChanges: z.array(z.string()),
  /** Performance metrics */
  metrics: z.object({
    analysisDurationMs: z.number(),
    snapshotComparisonMs: z.number(),
    driftCalculationMs: z.number(),
  }),
  /** Recommendations */
  recommendations: z.array(z.string()),
  /** Detection configuration */
  detectionConfig: ArchetypeDriftDetectionConfigSchema,
});

/**
 * Telemetry event payload for archetype drift detection.
 */
export interface ArchetypeDriftDetectedTelemetryPayload {
  /** Event type */
  eventType: 'balancer_archetype_drift_detected';
  /** Timestamp */
  timestamp: number;
  /** Detection severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Total archetypes analyzed */
  totalArchetypes: number;
  /** Archetypes with significant drift */
  driftedArchetypes: number;
  /** Global weight changes */
  globalWeightChanges: Record<string, number>;
  /** Most critical drift */
  mostCriticalDrift: {
    archetypeId: string;
    severity: string;
    driftPercentage: number;
    affectedStats: string[];
  } | null;
  /** Detection configuration */
  detectionConfig: {
    weightChangeThreshold: number;
    severityThresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    minSampleCount: number;
    includeDerivedStats: boolean;
  };
}

/**
 * Archetype drift detector class for monitoring weight changes.
 */
export class ArchetypeDriftDetector {
  private config: z.infer<typeof ArchetypeDriftDetectionConfigSchema>;
  private baselineSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null = null;
  private currentSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null = null;
  private detectionHistory: z.infer<typeof ArchetypeDriftDetectionSchema>[] = [];
  private telemetryEnabled: boolean = true;

  constructor(config: Partial<z.infer<typeof ArchetypeDriftDetectionConfigSchema>> = {}) {
    this.config = ArchetypeDriftDetectionConfigSchema.parse({
      weightChangeThreshold: 0.1,
      severityThresholds: {
        low: 0.05,
        medium: 0.2,
        high: 0.5,
        critical: 0.8,
      },
      minSampleCount: 2,
      includeDerivedStats: true,
      verbose: false,
      ...config,
    });
  }

  /**
   * Load baseline snapshot from storage.
   */
  async loadBaseline(): Promise<void> {
    try {
      // Import PersistenceService dynamically to avoid circular dependencies
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      const data = await loadData<z.infer<typeof ArchetypeSnapshotSchema>>('balancer-archetype-snapshot');
      
      if (data) {
        this.baselineSnapshot = ArchetypeSnapshotSchema.parse(data);
        if (this.config.verbose) {
          console.log('📂 Loaded baseline snapshot:', {
            timestamp: new Date(this.baselineSnapshot.config.timestamp).toISOString(),
            archetypes: this.baselineSnapshot.archetypes.length,
            balancerVersion: this.baselineSnapshot.config.balancerVersion,
          });
        }
      } else {
        if (this.config.verbose) {
          console.log('⚠️ No baseline snapshot found');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load baseline snapshot:', error);
      throw error;
    }
  }

  /**
   * Save current snapshot to storage.
   */
  async saveCurrentSnapshot(): Promise<void> {
    if (!this.currentSnapshot) {
      if (this.config.verbose) {
        console.log('⚠️ No current snapshot to save');
      }
      return;
    }

    try {
      // Import PersistenceService dynamically to avoid circular dependencies
      const { saveData } = await import('@/shared/persistence/PersistenceService');
      await saveData('balancer-archetype-snapshot', this.currentSnapshot);
      
      if (this.config.verbose) {
        console.log('💾 Saved current snapshot:', {
          timestamp: new Date(this.currentSnapshot.config.timestamp).toISOString(),
          archetypes: this.currentSnapshot.archetypes.length,
          balancerVersion: this.currentSnapshot.config.balancerVersion,
        });
      }
    } catch (error) {
      console.error('❌ Failed to save current snapshot:', error);
      throw error;
    }
  }

  /**
   * Create current snapshot from BalancerConfig.
   */
  async createCurrentSnapshot(): Promise<void> {
    try {
      // Import BalancerConfigStore dynamically
      const { BalancerConfigStore } = await import('@/balancing/config/BalancerConfigStore');
      const configStore = new BalancerConfigStore();
      
      const config = configStore.getConfig();
      const archetypes = configStore.getArchetypes();
      
      // Import StressTestArchetypeGenerator for archetype generation
      const { StressTestArchetypeGenerator } = await import('@/balancing/stressTesting/StressTestArchetypeGenerator');
      const generator = new StressTestArchetypeGenerator(config);
      
      const generatedArchetypes = generator.generateArchetypes();
      
      const currentSnapshot: ArchetypeSnapshot = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now(),
          balancerVersion: config.version || 'unknown',
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid,
          environment: process.env.NODE_ENV || 'development',
          generationMethod: 'automatic',
          totalStats: Object.keys(config.stats).length,
          totalArchetypes: generatedArchetypes.length,
          seed: 0, // TODO: Use seeded generator
        },
        archetypes: generatedArchetypes.map(archetype => ({
          id: archetype.id,
          name: archetype.name,
          archetypeType: archetype.type,
          statWeights: archetype.statWeights,
          totalPoints: archetype.totalPoints,
          generatedAt: Date.now(),
          seed: 0, // TODO: Use actual seed
        })),
        globalWeights: config.stats,
        derivedStats: config.getDerivedStats?.() || [],
        incompatiblePairs: config.getIncompatibleStatPairs?.() || [],
        metadata: {
          generationDurationMs: 0, // TODO: Track generation time
          memoryUsageMB: process.memoryUsage().rss / 1024 / 1024,
          cpuUsagePercent: 0, // TODO: Track CPU usage
        },
      };

      this.currentSnapshot = currentSnapshot;
      
      if (this.config.verbose) {
        console.log('📊 Created current snapshot:', {
          timestamp: new Date(currentSnapshot.config.timestamp).toISOString(),
          archetypes: currentSnapshot.archetypes.length,
          balancerVersion: currentSnapshot.config.balancerVersion,
        });
      }
    } catch (error) {
      console.error('❌ Failed to create current snapshot:', error);
      throw error;
    }
  }

  /**
   * Analyze drift between current and baseline snapshots.
   */
  analyzeDrift(): ArchetypeDriftDetectionSchema {
    if (!this.baselineSnapshot || !this.currentSnapshot) {
      return {
        timestamp: Date.now(),
        severity: 'none',
        totalArchetypes: 0,
        driftedArchetypes: [],
        globalWeightChanges: {},
        derivedStatsChanges: [],
        metrics: {
          analysisDurationMs: 0,
          snapshotComparisonMs: 0,
          driftCalculationMs: 0,
        },
        recommendations: ['No baseline or current snapshot available for analysis'],
        detectionConfig: this.config,
      };
    }

    const startTime = Date.now();
    
    // Calculate global weight changes
    const globalWeightChanges: Record<string, number> = {};
    const derivedStatsChanges: string[] = [];
    
    for (const [statId, currentValue] of Object.entries(this.currentSnapshot.globalWeights)) {
      const baselineValue = this.baselineSnapshot.globalWeights[statId];
      if (baselineValue !== undefined) {
        const change = currentValue - baselineValue;
        const changePercent = (change / baselineValue) * 100;
        if (Math.abs(changePercent) >= this.config.weightChangeThreshold * 100) {
          globalWeightChanges[statId] = change;
          derivedStatsChanges.push(statId);
        }
      }
    }

    // Analyze individual archetype drift
    const driftedArchetypes: ArchetypeDriftAnalysisSchema[] = [];
    
    for (const archetype of this.currentSnapshot.archetypes) {
      const baselineArchetype = this.baselineSnapshot.archetypes.find(
        a => a.id === archetype.id
      );
      
      if (!baselineArchetype) {
        // New archetype, no baseline comparison needed
        continue;
      }

      const weightChanges: Record<string, number> = {};
      const affectedStats: string[] = [];
      
      for (const [statId, currentWeight] of Object.entries(archetype.statWeights)) {
        const baselineWeight = baselineArchetype.statWeights[statId];
        if (baselineWeight !== undefined) {
          const change = currentWeight - baselineWeight;
          const changePercent = (change / baselineWeight) * 100;
          weightChanges[statId] = changePercent;
          
          if (Math.abs(changePercent) >= this.config.weightChangeThreshold * 100) {
            affectedStats.push(statId);
          }
        }
      }

      // Calculate overall drift percentage
      const totalChange = Object.values(weightChanges).reduce((sum, change) => sum + Math.abs(change), 0);
      const avgChange = totalChange / Object.keys(weightChanges).length;
      const driftPercentage = avgChange;

      // Determine severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (driftPercentage >= this.config.severityThresholds.critical) {
        severity = 'critical';
      } else if (driftPercentage >= this.config.severityThresholds.high) {
        severity = 'high';
      } else if (driftPercentage >= this.severityThresholds.medium) {
        severity = 'medium';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (severity !== 'low') {
        recommendations.push(`Review ${archetype.name} archetype - ${driftPercentage.toFixed(2)}% weight change`);
        
        if (affectedStats.length > 0) {
          recommendations.push(`Focus on affected stats: ${affectedStats.join(', ')}`);
        }
        
        if (severity === 'critical') {
          recommendations.push('Immediate attention required for critical drift');
        }
      }

      driftedArchetypes.push({
        archetypeId: archetype.id,
        currentWeights: archetype.statWeights,
        baselineWeights: baselineArchetype.statWeights,
        weightChanges,
        driftPercentage,
        severity,
        affectedStats,
        recommendations,
        analyzedAt: Date.now(),
      });
    }

    // Sort by drift percentage (highest first)
    driftedArchetypes.sort((a, b) => b.driftPercentage - a.driftPercentage);

    const endTime = Date.now();
    
    const detection: ArchetypeDriftDetectionSchema = {
      timestamp: endTime,
      severity: driftedArchetypes.length > 0 
        ? driftedArchetypes[0].severity 
        : 'none',
      totalArchetypes: this.currentSnapshot.archetypes.length,
      driftedArchetypes,
      globalWeightChanges,
      derivedStatsChanges,
      metrics: {
        analysisDurationMs: endTime - startTime,
        snapshotComparisonMs: 0, // TODO: Track comparison time
        driftCalculationMs: endTime - startTime,
      },
      recommendations: driftedArchetypes.length > 0 
        ? driftedArchetypes.flatMap(d => d.recommendations)
        : ['No significant drift detected'],
      detectionConfig: this.config,
    };

    // Add to detection history
    this.detectionHistory.push(detection);
    
    // Maintain history size
    if (this.detectionHistory.length > 50) {
      this.detectionHistory.shift();
    }

    // Send telemetry event if significant drift detected
    if (detection.severity !== 'none' && this.telemetryEnabled) {
      this.sendTelemetryEvent(detection);
    }

    return detection;
  }

  /**
   * Send telemetry event for drift detection.
   */
  private async sendTelemetryEvent(detection: ArchetypeDriftDetectionSchema): Promise<void> {
    try {
      // Import telemetry function dynamically
      const { trackTelemetryEvent } = await import('@/analytics/telemetry/telemetryProvider');
      
      const payload: ArchetypeDriftDetectedTelemetryPayload = {
        eventType: 'balancer_archetype_drift_detected',
        timestamp: detection.timestamp,
        severity: detection.severity,
        totalArchetypes: detection.totalArchetypes,
        driftedArchetypes: detection.driftArchetypes.length,
        globalWeightChanges: detection.globalWeightChanges,
        mostCriticalDrift: detection.driftArchetypes.length > 0 ? {
          archetypeId: detection.driftArchetypes[0].archetypeId,
          severity: detection.driftArchetypes[0].severity,
          driftPercentage: detection.driftArchetypes[0].driftPercentage,
          affectedStats: detection.driftArchetypes[0].affectedStats,
        } : null,
        detectionConfig: detection.detectionConfig,
      };

      trackTelemetryEvent('balancer_archetype_drift_detected', payload as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('❌ Failed to send telemetry event:', error);
    }
  }

  /**
   * Get current detector state.
   */
  getState() {
    return {
      config: this.config,
      baselineSnapshot: this.baselineSnapshot,
      currentSnapshot: this.currentSnapshot,
      detectionHistory: [...this.detectionHistory],
      telemetryEnabled: this.telemetryEnabled,
    };
  }

  /**
   * Get current drift analysis.
   */
  getCurrentAnalysis(): ArchetypeDriftAnalysisSchema | null {
    return this.detectionHistory.length > 0 
      ? this.detectionHistory[this.detectionHistory.length - 1] 
      : null;
  }

  /**
   * Get detection history.
   */
  getDetectionHistory(): ArchetypeDriftDetectionSchema[] {
    return [...this.detectionHistory];
  }

  /**
   * Clear detection history.
   */
  clearHistory(): void {
    this.detectionHistory = [];
  }

  /**
   * Update configuration.
   */
  updateConfig(newConfig: Partial<z.infer<typeof ArchetypeDriftDetectionConfigSchema>>): void {
    this.config = ArchetypeDriftDetectionConfigSchema.parse({
      ...this.config,
      ...newConfig,
    });
    
    if (this.config.verbose) {
      console.log('🔧 Updated configuration:', this.config);
    }
  }

  /**
   * Export detector state for persistence.
   */
  exportState(): {
    state: {
      config: z.infer<typeof ArchetypeDriftDetectionConfigSchema>;
      baselineSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null;
      currentSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null;
      detectionHistory: z.infer<typeof ArchetypeDriftDetectionSchema>[];
      telemetryEnabled: boolean;
    };
    exportTimestamp: number;
    version: string;
  } {
    return {
      state: this.getState(),
      exportTimestamp: Date.now(),
      version: '1.0.0',
    };
  }

  /**
   * Import detector state from persistence.
   */
  importState(data: {
    state: {
      config: z.infer<typeof ArchetypeDriftDetectionConfigSchema>;
      baselineSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null;
      currentSnapshot: z.infer<typeof ArchetypeSnapshotSchema> | null;
      detectionHistory: z.infer<typeof ArchetypeDriftDetectionSchema>[];
      telemetryEnabled: boolean;
    };
    exportTimestamp: number;
    version: string;
  }): void {
    if (data.version !== '1.0.0') {
      throw new Error(`Unsupported data version: ${data.version}`);
    }

    // Validate imported state
    const validatedState = {
      config: ArchetypeDriftDetectionConfigSchema.parse(data.state.config),
      baselineSnapshot: data.state.baselineSnapshot ? ArchetypeSnapshotSchema.parse(data.state.baselineSnapshot) : null,
      currentSnapshot: data.state.currentSnapshot ? ArchetypeSnapshotSchema.parse(data.state.currentSnapshot) : null,
      detectionHistory: data.state.detectionHistory.map(d => ArchetypeDriftDetectionSchema.parse(d)),
      telemetryEnabled: data.state.telemetryEnabled,
    };

    // Import state
    this.config = validatedState.config;
    this.baselineSnapshot = validatedState.baselineSnapshot;
    this.currentSnapshot = validatedState.currentSnapshot;
    this.detectionHistory = validatedState.detectionHistory;
    this.telemetryEnabled = validatedState.telemetryEnabled;

    if (this.config.verbose) {
      console.log('📥 Imported detector state:', {
        exportTimestamp: new Date(data.exportTimestamp).toISOString(),
        baselineSnapshot: this.baselineSnapshot ? 'loaded' : 'none',
        currentSnapshot: this.currentSnapshot ? 'loaded' : 'none',
        detectionHistory: this.detectionHistory.length,
        telemetryEnabled: this.telemetryEnabled,
      });
    }
  }

  /**
   * Enable/disable telemetry.
   */
  setTelemetryEnabled(enabled: boolean): void {
    this.telemetryEnabled = enabled;
    if (this.config.verbose) {
      console.log(`📡 Telemetry ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Reset detector state.
   */
  reset(): void {
    this.baselineSnapshot = null;
    this.currentSnapshot = null;
    this.detectionHistory = [];
    
    if (this.config.verbose) {
      console.log('🔄 Detector state reset');
    }
  }
}

/**
 * Default archetype drift detector instance.
 */
export const defaultArchetypeDriftDetector = new ArchetypeDriftDetector();

/**
 * Utility function to create a drift detector with custom config.
 */
export function createArchetypeDriftDetector(config?: Partial<ArchetypeDriftDetectionConfig>): ArchetypeDriftDetector {
  return new ArchetypeDriftDetector(config);
}
