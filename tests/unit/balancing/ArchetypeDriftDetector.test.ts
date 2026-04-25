import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type {
  ArchetypeSnapshotConfigSchema,
  ArchetypeWeightSnapshotSchema,
  ArchetypeSnapshotSchema,
  ArchetypeDriftAnalysisSchema,
  ArchetypeDriftDetectionSchema,
  ArchetypeDriftDetectionConfigSchema,
} from '@/balancing/analytics/ArchetypeDriftDetector';
import {
  ArchetypeDriftDetector,
  createArchetypeDriftDetector,
  defaultArchetypeDriftDetector,
} from '@/balancing/analytics/ArchetypeDriftDetector';

// Mock PersistenceService
const mockLoadData = vi.fn();
const mockSaveData = vi.fn();

// Mock BalancerConfigStore
const mockBalancerConfigStore = vi.fn();

// Mock StressTestArchetypeGenerator
const mockStressTestArchetypeGenerator = vi.fn();

// Mock telemetry
const mockTrackTelemetryEvent = vi.fn();

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: mockLoadData,
  saveData: mockSaveData,
}));

vi.mock('@/balancing/config/BalancerConfigStore', () => ({
  BalancerConfigStore: mockBalancerConfigStore,
}));

vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator', () => ({
  StressTestArchetypeGenerator: mockStressTestArchetypeGenerator,
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: mockTrackTelemetryEvent,
}));

describe('ArchetypeDriftDetector', () => {
  let detector: ArchetypeDriftDetector;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock configuration
    mockConfig = {
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
    };

    detector = createArchetypeDriftDetector(mockConfig);
  });

  afterEach(() => {
    detector.reset();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create detector with default configuration', () => {
      const defaultDetector = createArchetypeDriftDetector();
      const state = defaultDetector.getState();
      
      expect(state.config.weightChangeThreshold).toBe(0.1);
      expect(state.config.severityThresholds.low).toBe(0.05);
      expect(state.config.severityThresholds.critical).toBe(0.8);
      expect(state.config.verbose).toBe(false);
      expect(state.baselineSnapshot).toBeNull();
      expect(state.currentSnapshot).toBeNull();
    });

    it('should create detector with custom configuration', () => {
      const customDetector = createArchetypeDriftDetector({
        weightChangeThreshold: 0.2,
        severityThresholds: {
          low: 0.1,
          medium: 0.3,
          high: 0.6,
          critical: 0.9,
        },
        verbose: true,
      });
      
      const state = customDetector.getState();
      expect(state.config.weightChangeThreshold).toBe(0.2);
      expect(state.config.severityThresholds.low).toBe(0.1);
      expect(state.config.verbose).toBe(true);
    });

    it('should start with empty state', () => {
      const state = detector.getState();
      expect(state.baselineSnapshot).toBeNull();
      expect(state.currentSnapshot).toBeNull();
      expect(state.detectionHistory).toEqual([]);
      expect(state.telemetryEnabled).toBe(true);
    });
  });

  describe('Snapshot Management', () => {
    it('should load baseline snapshot from storage', async () => {
      const mockBaseline = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now() - 86400000, // 1 day ago
          balancerVersion: '1.0.0',
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          pid: 12345,
          environment: 'development',
          generationMethod: 'automatic',
          totalStats: 5,
          totalArchetypes: 10,
          seed: 42,
        },
        archetypes: [
          {
            id: 'warrior',
            name: 'Warrior',
            archetypeType: 'single-stat',
            statWeights: { strength: 100, agility: 50 },
            totalPoints: 150,
            generatedAt: Date.now() - 86400000,
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0, agility: 0.8, intelligence: 0.6 },
        derivedStats: ['damage', 'health'],
        incompatiblePairs: [['strength', 'intelligence']],
        metadata: {
          generationDurationMs: 100,
          memoryUsageMB: 50,
          cpuUsagePercent: 10,
        },
      };

      mockLoadData.mockResolvedValue(mockBaseline);
      
      await detector.loadBaseline();
      
      const state = detector.getState();
      expect(state.baselineSnapshot).toEqual(mockBaseline);
      expect(mockLoadData).toHaveBeenCalledWith('balancer-archetype-snapshot');
    });

    it('should handle missing baseline snapshot', async () => {
      mockLoadData.mockResolvedValue(null);
      
      await detector.loadBaseline();
      
      const state = detector.getState();
      expect(state.baselineSnapshot).toBeNull();
    });

    it('should create current snapshot from BalancerConfig', async () => {
      const mockConfig = {
        version: '1.0.0',
        stats: {
          strength: { weight: 1.0, min: 0, max: 100, step: 1 },
          agility: { weight: 0.8, min: 0, max: 100, step: 1 },
          intelligence: { weight: 0.6, min: 0, max: 100, step: 1 },
        },
        getDerivedStats: () => ['damage', 'health'],
        getIncompatibleStatPairs: () => [['strength', 'intelligence']],
      };

      const mockArchetypes = [
        {
          id: 'warrior',
          name: 'Warrior',
          type: 'single-stat',
          statWeights: { strength: 100, agility: 50 },
          totalPoints: 150,
        },
        {
          id: 'mage',
          name: 'Mage',
          type: 'single-stat',
          statWeights: { intelligence: 100, agility: 30 },
          totalPoints: 130,
        },
      ];

      const mockStoreInstance = {
        getConfig: vi.fn().mockReturnValue(mockConfig),
        getArchetypes: vi.fn().mockReturnValue(mockArchetypes),
      };

      const mockGeneratorInstance = {
        generateArchetypes: vi.fn().mockReturnValue(mockArchetypes),
      };

      mockBalancerConfigStore.mockImplementation(() => mockStoreInstance as any);
      mockStressTestArchetypeGenerator.mockImplementation(() => mockGeneratorInstance as any);
      
      await detector.createCurrentSnapshot();
      
      const state = detector.getState();
      expect(state.currentSnapshot).toBeDefined();
      expect(state.currentSnapshot?.archetypes).toHaveLength(2);
      expect(state.currentSnapshot?.globalWeights).toEqual(mockConfig.stats);
      expect(mockStoreInstance.getConfig).toHaveBeenCalled();
      mockGeneratorInstance.generateArchetypes.mockRestore();
    });

    it('should save current snapshot to storage', async () => {
      const mockSnapshot = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now(),
          balancerVersion: '1.0.0',
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          pid: 12345,
          environment: 'development',
          generationMethod: 'automatic',
          totalStats: 3,
          totalArchetypes: 6,
          seed: 42,
        },
        archetypes: [],
        globalWeights: {},
        derivedStats: [],
        incompatiblePairs: [],
        metadata: {
          generationDurationMs: 100,
          memoryUsageMB: 50,
          cpuUsagePercent: 10,
        },
      };

      // Set current snapshot manually for testing
      (detector as any).currentSnapshot = mockSnapshot;
      
      await detector.saveCurrentSnapshot();
      
      expect(mockSaveData).toHaveBeenCalledWith('balancer-archetype-snapshot', mockSnapshot);
    });
  });

  describe('Drift Analysis', () => {
    it('should return no drift when no snapshots available', () => {
      const detection = detector.analyzeDrift();
      
      expect(detection.severity).toBe('none');
      expect(detection.totalArchetypes).toBe(0);
      expect(detection.driftedArchetypes).toEqual([]);
      expect(detection.recommendations).toContain('No baseline or current snapshot available for analysis');
    });

    it('should analyze drift between snapshots', async () => {
      const baselineSnapshot: any = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now() - 86400000,
          balancerVersion: '1.0.0',
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          pid: 12345,
          environment: 'development',
          generationMethod: 'automatic',
          totalStats: 2,
          totalArchetypes: 2,
          seed: 42,
        },
        archetypes: [
          {
            id: 'warrior',
            name: 'Warrior',
            archetypeType: 'single-stat',
            statWeights: { strength: 100, agility: 50 },
            totalPoints: 150,
            generatedAt: Date.now() - 86400000,
            seed: 42,
          },
          {
            id: 'mage',
            name: 'Mage',
            archetypeType: 'single-stat',
            statWeights: { intelligence: 100, agility: 30 },
            totalPoints: 130,
            generatedAt: Date.now() - 86400000,
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0, agility: 0.8, intelligence: 0.6 },
        derivedStats: ['damage', 'health'],
        incompatiblePairs: [['strength', 'intelligence']],
        metadata: {
          generationDurationMs: 100,
          memoryUsageMB: 50,
          cpuUsagePercent: 10,
        },
      };

      const currentSnapshot: any = {
        ...baselineSnapshot,
        config: {
          ...baselineSnapshot.config,
          timestamp: Date.now(),
        },
        archetypes: [
          {
            ...baselineSnapshot.archetypes[0],
            statWeights: { strength: 110, agility: 55 }, // 10% increase
            generatedAt: Date.now(),
          },
          {
            ...baselineSnapshot.archetypes[1],
            statWeights: { intelligence: 120, agility: 33 }, // 20% increase
            generatedAt: Date.now(),
          },
        ],
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      const detection = detector.analyzeDrift();
      
      expect(detection.severity).toBe('medium');
      expect(detection.totalArchetypes).toBe(2);
      expect(detection.driftedArchetypes).toHaveLength(2);
      expect(detection.globalWeightChanges).toEqual({});
      
      // Check individual archetype drift
      const warriorDrift = detection.driftedArchetypes.find(a => a.archetypeId === 'warrior');
      expect(warriorDrift?.driftPercentage).toBe(10); // Average of 10% and 10%
      expect(warriorDrift?.severity).toBe('medium');
      
      const mageDrift = detection.driftArchetypes.find(a => a.archetypeId === 'mage');
      expect(mageDrift?.driftPercentage).toBe(20); // Average of 20% and 10%
      expect(mageDrift?.severity).toBe('medium');
    });

    it('should detect critical drift', async () => {
      const baselineSnapshot: any = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now() - 86400000,
          balancerVersion: '1.0.0',
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          pid: 12345,
          environment: 'development',
          generationMethod: 'automatic',
          totalStats: 1,
          totalArchetypes: 1,
          seed: 42,
        },
        archetypes: [
          {
            id: 'warrior',
            name: 'Warrior',
            archetypeType: 'single-stat',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: ['damage'],
        incompatiblePairs: [],
        metadata: {
          generationDurationMs: 100,
          memoryUsageMB: 50,
          cpuUsagePercent: 10,
        },
      };

      const currentSnapshot: any = {
        ...baselineSnapshot,
        config: {
          ...baselineSnapshot.config,
          timestamp: Date.now(),
        },
        archetypes: [
          {
            ...baselineSnapshot.archetypes[0],
            statWeights: { strength: 200 }, // 100% increase
            generatedAt: Date.now(),
          },
        ],
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      const detection = detector.analyzeDrift();
      
      expect(detection.severity).toBe('critical');
      expect(detection.driftedArchetypes).toHaveLength(1);
      expect(detection.driftedArchetypes[0].driftPercentage).toBe(100);
      expect(detection.driftedArchetypes[0].severity).toBe('critical');
    });

    it('should send telemetry event on significant drift', async () => {
      const baselineSnapshot: any = {
        config: {
          schemaVersion: '1.0.0',
          timestamp: Date.now() - 86400000,
          balancerVersion: '1.0.0',
          nodeVersion: 'v18.0.0',
          platform: 'linux',
          pid: 12345,
          environment: 'development',
          generationMethod: 'automatic',
          totalStats: 1,
          totalArchetypes: 1,
          seed: 42,
        },
        archetypes: [
          {
            id: 'warrior',
            name: 'Warrior',
            archetypeType: 'single-stat',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: ['damage'],
        incompatiblePairs: [],
        metadata: {
          generationDurationMs: 100,
          memoryUsageMB: 50,
          cpuUsagePercent: 10,
        },
      };

      const currentSnapshot: any = {
        ...baselineSnapshot,
        config: {
          ...baselineSnapshot.config,
          timestamp: Date.now(),
        },
        archetypes: [
          {
            ...baselineSnapshot.archetypes[0],
            statWeights: { strength: 120 }, // 20% increase
            generatedAt: Date.now(),
          },
        ],
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      detector.analyzeDrift();
      
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'balancer_archetype_drift_detected',
        expect.any(Object)
      );
      
      const telemetryCall = mockTrackTelemetryEvent.mock.calls[0];
      expect(telemetryCall[0]).toBe('balancer_archetype_drift_detected');
      expect(telemetryCall[1]).toHaveProperty('eventType', 'balancer_archetype_drift_detected');
      expect(telemetryCall[1]).toHaveProperty('severity');
      expect(telemetryCall[1]).toHaveProperty('totalArchetypes');
      expect(telemetryCall[1]).toHaveProperty('driftedArchetypes');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      detector.updateConfig({
        weightChangeThreshold: 0.2,
        verbose: true,
      });
      
      const state = detector.getState();
      expect(state.config.weightChangeThreshold).toBe(0.2);
      expect(state.config.verbose).toBe(true);
      expect(state.config.severityThresholds.low).toBe(mockConfig.severityThresholds.low); // Unchanged
    });

    it('should validate configuration', () => {
      expect(() => {
        detector.updateConfig({
          weightChangeThreshold: -10, // Invalid
        });
      }).not.toThrow(); // Zod should handle validation
      
      // Check that invalid values are handled
      const state = detector.getState();
      expect(state.config.weightChangeThreshold).toBeGreaterThanOrEqual(0.01);
    });
  });

  describe('State Management', () => {
    it('should reset detector state', () => {
      // Set some state
      (detector as any).baselineSnapshot = { config: { timestamp: Date.now() } } as any;
      (detector as any).currentSnapshot = { config: { timestamp: Date.now() } } as any;
      (detector as any).detectionHistory = [{ timestamp: Date.now() } as any];
      
      detector.reset();
      
      const state = detector.getState();
      expect(state.baselineSnapshot).toBeNull();
      expect(state.currentSnapshot).toBeNull();
      expect(state.detectionHistory).toEqual([]);
    });

    it('should export and import state', () => {
      // Set some state
      (detector as any).baselineSnapshot = { config: { timestamp: Date.now() } } as any;
      (detector as any).currentSnapshot = { config: { timestamp: Date.now() } } as any;
      (detector as any).detectionHistory = [{ timestamp: Date.now() } as any];
      
      const exportedData = detector.exportState();
      expect(exportedData.state).toBeDefined();
      expect(exportedData.exportTimestamp).toBeDefined();
      expect(exportedData.version).toBe('1.0.0');
      
      // Create new detector and import data
      const newDetector = createArchetypeDriftDetector();
      newDetector.importState(exportedData);
      
      const importedState = newDetector.getState();
      expect(importedState.config.weightChangeThreshold).toBe(exportedData.state.config.weightChangeThreshold);
      expect(importedState.baselineSnapshot).toEqual(exportedData.state.baselineSnapshot);
      expect(importedState.currentSnapshot).toEqual(exportedData.state.currentSnapshot);
      expect(importedState.detectionHistory).toEqual(exportedState.state.detectionHistory);
    });

    it('should reject invalid version on import', () => {
      const invalidData = {
        state: detector.getState(),
        exportTimestamp: Date.now(),
        version: '2.0.0', // Invalid version
      };
      
      expect(() => {
        detector.importState(invalidData);
      }).toThrow('Unsupported data version: 2.0.0');
    });
  });

  describe('Detection History', () => {
    it('should maintain detection history', async () => {
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 110 },
            totalPoints: 110,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      // Run multiple analyses
      detector.analyzeDrift();
      detector.analyzeDrift();
      detector.analyzeDrift();
      
      const history = detector.getDetectionHistory();
      expect(history.length).toBe(3);
      expect(history[0].detected).toBe(true);
      expect(history[1].detected).toBe(true);
      expect(history[2].detected).toBe(true);
    });

    it('should limit detection history size', async () => {
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 110 },
            totalPoints: 110,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      // Manually add many detections to test limit
      for (let i = 0; i < 60; i++) {
        const mockDetection = {
          timestamp: Date.now(),
          severity: 'medium' as const,
          totalArchetypes: 1,
          driftedArchetypes: [{
            archetypeId: 'warrior',
            currentWeights: { strength: 110 },
            baselineWeights: { strength: 100 },
            weightChanges: { strength: 10 },
            driftPercentage: 10,
            severity: 'medium' as const,
            affectedStats: ['strength'],
            recommendations: ['Review warrior archetype'],
            analyzedAt: Date.now(),
          }],
          globalWeightChanges: {},
          derivedStatsChanges: [],
          metrics: {
            analysisDurationMs: 100,
            snapshotComparisonMs: 50,
            driftCalculationMs: 50,
          },
          recommendations: ['Test recommendation'],
          detectionConfig: mockConfig,
        };
        
        (detector as any).detectionHistory.push(mockDetection);
      }
      
      const history = detector.getDetectionHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Telemetry', () => {
    it('should enable/disable telemetry', () => {
      detector.setTelemetryEnabled(false);
      expect(detector.getState().telemetryEnabled).toBe(false);
      
      detector.setTelemetryEnabled(true);
      expect(detector.getState().telemetryEnabled).toBe(true);
    });

    it('should not send telemetry when disabled', async () => {
      detector.setTelemetryEnabled(false);
      
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 120 },
            totalPoints: 120,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      detector.analyzeDrift();
      
      expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
    });
  });

  describe('Default Instance', () => {
    it('should provide default detector instance', () => {
      expect(defaultArchetypeDriftDetector).toBeInstanceOf(ArchetypeDriftDetector);
      expect(defaultArchetypeDriftDetector.getState().config.weightChangeThreshold).toBe(0.1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty archetypes', async () => {
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [],
        globalWeights: {},
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [],
        globalWeights: {},
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      const detection = detector.analyzeDrift();
      
      expect(detection.severity).toBe('none');
      expect(detection.totalArchetypes).toBe(0);
      expect(detection.driftedArchetypes).toEqual([]);
    });

    it('should handle missing baseline archetype', async () => {
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 110 },
            totalPoints: 110,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
          {
            id: 'mage', // New archetype not in baseline
            statWeights: { intelligence: 100 },
            totalPoints: 100,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Mage',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0, intelligence: 0.6 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      const detection = detector.analyzeDrift();
      
      expect(detection.driftedArchetypes).toHaveLength(1); // Only warrior, mage is new
      expect(detection.driftedArchetypes[0].archetypeId).toBe('warrior');
    });

    it('should handle zero weight changes', async () => {
      const baselineSnapshot: any = {
        config: { timestamp: Date.now() - 86400000 },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 },
            totalPoints: 100,
            generatedAt: Date.now() - 86400000,
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      const currentSnapshot: any = {
        config: { timestamp: Date.now() },
        archetypes: [
          {
            id: 'warrior',
            statWeights: { strength: 100 }, // No change
            totalPoints: 100,
            generatedAt: Date.now(),
            archetypeType: 'single-stat',
            name: 'Warrior',
            seed: 42,
          },
        ],
        globalWeights: { strength: 1.0 },
        derivedStats: [],
        incompatiblePairs: [],
        metadata: { generationDurationMs: 100, memoryUsageMB: 50, cpuUsagePercent: 10 },
      };

      mockLoadData.mockResolvedValue(baselineSnapshot);
      await detector.loadBaseline();
      (detector as any).currentSnapshot = currentSnapshot;
      
      const detection = detector.analyzeDrift();
      
      expect(detection.severity).toBe('none');
      expect(detection.driftedArchetypes).toEqual([]);
    });
  });
});
