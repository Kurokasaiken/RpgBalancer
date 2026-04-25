/**
 * Fatigue Predictor Test Suite
 * 
 * Comprehensive tests for the fatigue predictor engine, algorithms,
 * configuration management, and UI components.
 * 
 * @since NP-019
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FatiguePredictor, DEFAULT_FATIGUE_PREDICTION_CONFIG } from '@/balancing/idleVillage/FatiguePredictor';
import type { FatiguePrediction, FatiguePredictionConfig } from '@/balancing/idleVillage/FatiguePredictor';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

describe('FatiguePredictor', () => {
  let predictor: FatiguePredictor;
  const residentId = 'test-resident-1';

  beforeEach(() => {
    predictor = new FatiguePredictor(DEFAULT_FATIGUE_PREDICTION_CONFIG);
  });

  afterEach(() => {
    predictor.clearHistoricalData(residentId);
  });

  describe('Historical Data Management', () => {
    it('should add and retrieve historical data points', () => {
      const dataPoint: FatigueDataPoint = {
        timestamp: Date.now() as VillageTimeUnit,
        fatigue: 25.5,
        changeType: 'activity',
        confidence: 0.8,
        activityId: 'forest-work',
      };

      predictor.updateHistoricalData(residentId, dataPoint);
      const retrieved = predictor.getHistoricalData(residentId);

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toEqual(dataPoint);
    });

    it('should sort historical data by timestamp', () => {
      const now = Date.now() as VillageTimeUnit;
      const dataPoints: FatigueDataPoint[] = [
        { timestamp: now + 100, fatigue: 30, changeType: 'activity', confidence: 0.8 },
        { timestamp: now, fatigue: 25, changeType: 'activity', confidence: 0.8 },
        { timestamp: now + 50, fatigue: 27.5, changeType: 'activity', confidence: 0.8 },
      ];

      dataPoints.forEach(point => predictor.updateHistoricalData(residentId, point));
      const retrieved = predictor.getHistoricalData(residentId);

      expect(retrieved).toHaveLength(3);
      expect(retrieved[0].timestamp).toBe(now);
      expect(retrieved[1].timestamp).toBe(now + 50);
      expect(retrieved[2].timestamp).toBe(now + 100);
    });

    it('should limit historical data to configured window', () => {
      const config = { historicalWindow: 100 };
      predictor = new FatiguePredictor(config);

      const now = Date.now() as VillageTimeUnit;
      const dataPoints: FatigueDataPoint[] = [
        { timestamp: now - 200, fatigue: 20, changeType: 'activity', confidence: 0.8 },
        { timestamp: now - 50, fatigue: 25, changeType: 'activity', confidence: 0.8 },
        { timestamp: now, fatigue: 30, changeType: 'activity', confidence: 0.8 },
      ];

      dataPoints.forEach(point => predictor.updateHistoricalData(residentId, point));
      const retrieved = predictor.getHistoricalData(residentId);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].timestamp).toBe(now - 50);
      expect(retrieved[1].timestamp).toBe(now);
    });
  });

  describe('Prediction Algorithms', () => {
    beforeEach(() => {
      // Generate sample historical data
      const now = Date.now() as VillageTimeUnit;
      for (let i = 0; i < 20; i++) {
        const dataPoint: FatigueDataPoint = {
          timestamp: now - (20 - i) * 10,
          fatigue: 20 + i * 1.5 + Math.random() * 2,
          changeType: i % 2 === 0 ? 'activity' : 'recovery',
          confidence: 0.8 + Math.random() * 0.2,
        };
        predictor.updateHistoricalData(residentId, dataPoint);
      }
    });

    it('should predict fatigue using linear algorithm', () => {
      predictor.updateConfig({ algorithm: 'linear' });
      
      const currentFatigue = 45;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;
      
      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction).toBeDefined();
      expect(prediction.residentId).toBe(residentId);
      expect(prediction.currentFatigue).toBe(currentFatigue);
      expect(prediction.algorithm).toBe('linear');
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedFatigue).toBeLessThanOrEqual(100);
      expect(prediction.timeline).toHaveLength.greaterThan(0);
      expect(prediction.risk).toBeDefined();
      expect(prediction.risk.recommendations).toBeInstanceOf(Array);
    });

    it('should predict fatigue using exponential algorithm', () => {
      predictor.updateConfig({ algorithm: 'exponential' });
      
      const currentFatigue = 45;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;
      
      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction.algorithm).toBe('exponential');
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedFatigue).toBeLessThanOrEqual(100);
    });

    it('should predict fatigue using weighted algorithm', () => {
      predictor.updateConfig({ algorithm: 'weighted' });
      
      const currentFatigue = 45;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;
      
      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction.algorithm).toBe('weighted');
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedFatigue).toBeLessThanOrEqual(100);
    });

    it('should predict fatigue using ML algorithm', () => {
      predictor.updateConfig({ algorithm: 'ml' });
      
      const currentFatigue = 45;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;
      
      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction.algorithm).toBe('ml');
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedFatigue).toBeLessThanOrEqual(100);
    });

    it('should handle scheduled activities in predictions', () => {
      const currentFatigue = 30;
      const targetTime = (Date.now() + 200) as VillageTimeUnit;
      const now = Date.now() as VillageTimeUnit;
      
      const scheduledActivities = [
        { activityId: 'forest-work', startTime: now + 50, duration: 50 },
        { activityId: 'mining', startTime: now + 150, duration: 30 },
      ];

      const prediction = predictor.predictFatigue(
        residentId,
        currentFatigue,
        targetTime,
        scheduledActivities
      );

      expect(prediction.timeline).toHaveLength.greaterThan(0);
      
      // Check that activities are reflected in timeline
      const activityPoints = prediction.timeline.filter(point => point.activityId);
      expect(activityPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Risk Assessment', () => {
    it('should assess low risk correctly', () => {
      const prediction: Partial<FatiguePrediction> = {
        predictedFatigue: 20,
        timeline: [
          { timestamp: Date.now() as VillageTimeUnit, fatigue: 20, changeType: 'baseline', confidence: 0.9 },
        ],
      };

      const risk = predictor['assessRisk'](prediction.predictedFatigue!, prediction.timeline!);

      expect(risk.exhaustionRisk).toBeLessThan(0.3);
      expect(risk.recommendations).toContain('Monitor fatigue levels');
    });

    it('should assess high risk correctly', () => {
      const prediction: Partial<FatiguePrediction> = {
        predictedFatigue: 90,
        timeline: [
          { timestamp: Date.now() as VillageTimeUnit, fatigue: 90, changeType: 'baseline', confidence: 0.9 },
          { timestamp: (Date.now() + 50) as VillageTimeUnit, fatigue: 100, changeType: 'baseline', confidence: 0.8 },
        ],
      };

      const risk = predictor['assessRisk'](prediction.predictedFatigue!, prediction.timeline!);

      expect(risk.exhaustionRisk).toBeGreaterThan(0.8);
      expect(risk.timeToExhaustion).toBeDefined();
      expect(risk.recommendations).toContain('Immediate rest required');
    });
  });

  describe('Trend Analysis', () => {
    beforeEach(() => {
      // Generate trend data
      const now = Date.now() as VillageTimeUnit;
      for (let i = 0; i < 30; i++) {
        const dataPoint: FatigueDataPoint = {
          timestamp: now - (30 - i) * 10,
          fatigue: 20 + i * 0.8 + Math.random() * 1,
          changeType: 'activity',
          confidence: 0.8,
        };
        predictor.updateHistoricalData(residentId, dataPoint);
      }
    });

    it('should analyze increasing trend', () => {
      const trend = predictor.analyzeTrends(residentId);

      expect(trend.direction).toBe('increasing');
      expect(trend.strength).toBeGreaterThan(0);
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.insights).toHaveLength.greaterThan(0);
    });

    it('should detect anomalies', () => {
      // Add anomaly
      const anomalyPoint: FatigueDataPoint = {
        timestamp: Date.now() as VillageTimeUnit,
        fatigue: 95, // Much higher than expected
        changeType: 'activity',
        confidence: 0.9,
      };
      predictor.updateHistoricalData(residentId, anomalyPoint);

      const trend = predictor.analyzeTrends(residentId);

      expect(trend.anomalies.length).toBeGreaterThan(0);
      expect(trend.anomalies[0].severity).toBeOneOf(['low', 'medium', 'high']);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        algorithm: 'exponential' as const,
        predictionHorizon: 150,
        confidenceThreshold: 0.85,
      };

      predictor.updateConfig(newConfig);
      const config = predictor.getConfig();

      expect(config.algorithm).toBe('exponential');
      expect(config.predictionHorizon).toBe(150);
      expect(config.confidenceThreshold).toBe(0.85);
    });

    it('should get sparkline data', () => {
      // Generate sample data
      const now = Date.now() as VillageTimeUnit;
      for (let i = 0; i < 25; i++) {
        const dataPoint: FatigueDataPoint = {
          timestamp: now - (25 - i) * 10,
          fatigue: 20 + Math.sin(i * 0.3) * 10,
          changeType: 'activity',
          confidence: 0.8,
        };
        predictor.updateHistoricalData(residentId, dataPoint);
      }

      const sparklineData = predictor.getSparklineData(residentId, 10);

      expect(sparklineData.length).toBeGreaterThan(0);
      expect(sparklineData.every((value: number) => value >= 0 && value <= 100)).toBe(true);
    });

    it('should get fatigue color', () => {
      const green = predictor.getFatigueColor(20);
      const yellow = predictor.getFatigueColor(50);
      const red = predictor.getFatigueColor(85);

      expect(green).toBe('#10b981');
      expect(yellow).toBe('#f59e0b');
      expect(red).toBe('#ef4444');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty historical data', () => {
      const currentFatigue = 30;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;

      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction).toBeDefined();
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThan(1); // Lower confidence with no data
    });

    it('should handle single data point', () => {
      const dataPoint: FatigueDataPoint = {
        timestamp: Date.now() as VillageTimeUnit,
        fatigue: 25,
        changeType: 'activity',
        confidence: 0.8,
      };
      predictor.updateHistoricalData(residentId, dataPoint);

      const currentFatigue = 30;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;

      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction).toBeDefined();
      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
    });

    it('should clamp fatigue values to 0-100 range', () => {
      const currentFatigue = 50;
      const targetTime = (Date.now() + 100) as VillageTimeUnit;

      const prediction = predictor.predictFatigue(residentId, currentFatigue, targetTime);

      expect(prediction.predictedFatigue).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedFatigue).toBeLessThanOrEqual(100);
      
      prediction.timeline.forEach((point: FatigueDataPoint) => {
        expect(point.fatigue).toBeGreaterThanOrEqual(0);
        expect(point.fatigue).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('FatiguePredictorCLI', () => {
  let cli: FatiguePredictorCLI;

  beforeEach(() => {
    cli = new FatiguePredictorCLI();
  });

  describe('Argument Parsing', () => {
    it('should parse basic arguments', () => {
      const args = ['--resident', 'test-1', '--algorithm', 'linear', '--horizon', '150'];
      const parsed = cli['parseArgs'](args);

      expect(parsed.residentId).toBe('test-1');
      expect(parsed.algorithm).toBe('linear');
      expect(parsed.horizon).toBe(150);
      expect(parsed.help).toBe(false);
    });

    it('should parse short arguments', () => {
      const args = ['-r', 'test-1', '-a', 'exponential', '-h', '200'];
      const parsed = cli['parseArgs'](args);

      expect(parsed.residentId).toBe('test-1');
      expect(parsed.algorithm).toBe('exponential');
      expect(parsed.horizon).toBe(200);
    });

    it('should parse help flag', () => {
      const args = ['--help'];
      const parsed = cli['parseArgs'](args);

      expect(parsed.help).toBe(true);
    });

    it('should handle output file argument', () => {
      const args = ['--resident', 'test-1', '--output', 'prediction.json'];
      const parsed = cli['parseArgs'](args);

      expect(parsed.residentId).toBe('test-1');
      expect(parsed.output).toBe('prediction.json');
    });
  });

  describe('Sample Data Generation', () => {
    it('should generate sample data', () => {
      const residentId = 'test-resident';
      
      cli['generateSampleData'](residentId);
      
      const historicalData = cli['predictor'].getHistoricalData(residentId);
      expect(historicalData).toHaveLength(50);
      
      historicalData.forEach((point: FatigueDataPoint) => {
        expect(point.fatigue).toBeGreaterThanOrEqual(0);
        expect(point.fatigue).toBeLessThanOrEqual(100);
        expect(point.confidence).toBeGreaterThanOrEqual(0.8);
        expect(point.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe('Configuration Validation', () => {
  it('should validate correct configuration', () => {
    const config = {
      algorithm: 'linear' as const,
      predictionHorizon: 100,
      historicalWindow: 500,
      confidenceThreshold: 0.7,
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
      },
    };

    const predictor = new FatiguePredictor(config);
    const retrieved = predictor.getConfig();

    expect(retrieved.algorithm).toBe('linear');
    expect(retrieved.predictionHorizon).toBe(100);
  });

  it('should use default configuration for invalid values', () => {
    const predictor = new FatiguePredictor();
    const config = predictor.getConfig();

    expect(config.algorithm).toBe(DEFAULT_FATIGUE_PREDICTOR_CONFIG.algorithm);
    expect(config.predictionHorizon).toBe(DEFAULT_FATIGUE_PREDICTOR_CONFIG.predictionHorizon);
  });
});

describe('Integration Tests', () => {
  it('should complete full prediction workflow', () => {
    const predictor = new FatiguePredictor({ algorithm: 'weighted' });
    const residentId = 'integration-test';

    // Add historical data
    const now = Date.now() as VillageTimeUnit;
    for (let i = 0; i < 15; i++) {
      const dataPoint: FatigueDataPoint = {
        timestamp: now - (15 - i) * 10,
        fatigue: 25 + i * 1.2 + Math.random() * 1,
        changeType: 'activity',
        confidence: 0.85,
        activityId: i % 2 === 0 ? 'forest-work' : 'mining',
      };
      predictor.updateHistoricalData(residentId, dataPoint);
    }

    // Make prediction
    const currentFatigue = 40;
    const targetTime = now + 120;
    const scheduledActivities = [
      { activityId: 'crafting', startTime: now + 30, duration: 40 },
    ];

    const prediction = predictor.predictFatigue(
      residentId,
      currentFatigue,
      targetTime,
      scheduledActivities
    );

    // Analyze trends
    const trendAnalysis = predictor.analyzeTrends(residentId);

    // Get sparkline data
    const sparklineData = predictor.getSparklineData(residentId);

    // Verify results
    expect(prediction.residentId).toBe(residentId);
    expect(prediction.algorithm).toBe('weighted');
    expect(prediction.timeline.length).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.risk.recommendations.length).toBeGreaterThan(0);

    expect(trendAnalysis.direction).toBeOneOf(['increasing', 'decreasing', 'stable']);
    expect(trendAnalysis.insights.length).toBeGreaterThan(0);

    expect(sparklineData.length).toBeGreaterThan(0);
    expect(sparklineData.every((v: number) => v >= 0 && v <= 100)).toBe(true);

    // Cleanup
    predictor.clearHistoricalData(residentId);
  });
});
