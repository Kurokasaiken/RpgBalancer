/**
 * Idle Village Resident Fatigue Predictor
 * 
 * Configurable predictor engine for future fatigue with UI sparkline and CLI.
 * Implements multiple prediction algorithms, historical analysis, and trend insights.
 * 
 * @since NP-019
 */

import type { VillageTimeUnit } from '@/engine/game/idleVillage/TimeEngine';
import { writeFileSync } from 'fs';

/**
 * Fatigue prediction data point
 */
export interface FatigueDataPoint {
  /** Timestamp of the data point */
  timestamp: VillageTimeUnit;
  /** Fatigue value at this timestamp */
  fatigue: number;
  /** Activity that contributed to this fatigue change */
  activityId?: string;
  /** Type of fatigue change */
  changeType: 'activity' | 'recovery' | 'baseline';
  /** Confidence score for this prediction */
  confidence: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Fatigue prediction result
 */
export interface FatiguePrediction {
  /** Resident ID */
  residentId: string;
  /** Current fatigue */
  currentFatigue: number;
  /** Predicted fatigue at target time */
  predictedFatigue: number;
  /** Prediction timeline */
  timeline: FatigueDataPoint[];
  /** Prediction algorithm used */
  algorithm: 'linear' | 'exponential' | 'weighted' | 'ml';
  /** Confidence score (0-1) */
  confidence: number;
  /** Risk assessment */
  risk: {
    /** Exhaustion risk (0-1) */
    exhaustionRisk: number;
    /** Time to exhaustion (in time units) */
    timeToExhaustion?: VillageTimeUnit;
    /** Recommended actions */
    recommendations: string[];
  };
  /** Prediction metadata */
  metadata: {
    /** Prediction timestamp */
    predictedAt: VillageTimeUnit;
    /** Target time */
    targetTime: VillageTimeUnit;
    /** Algorithm parameters */
    parameters: Record<string, unknown>;
    /** Historical data points used */
    historicalDataPoints: number;
  };
}

/**
 * Fatigue prediction configuration
 */
export interface FatiguePredictorConfig {
  /** Prediction algorithm to use */
  algorithm: 'linear' | 'exponential' | 'weighted' | 'ml';
  /** Prediction horizon (time units) */
  predictionHorizon: VillageTimeUnit;
  /** Historical data window (time units) */
  historicalWindow: VillageTimeUnit;
  /** Confidence threshold */
  confidenceThreshold: number;
  /** Risk thresholds */
  riskThresholds: {
    /** Low risk threshold */
    low: number;
    /** Medium risk threshold */
    medium: number;
    /** High risk threshold */
    high: number;
  };
  /** Algorithm-specific parameters */
  algorithmParameters: {
    /** Linear regression parameters */
    linear?: {
      /** Weight for recent data */
      recentWeight: number;
      /** Minimum data points */
      minDataPoints: number;
    };
    /** Exponential smoothing parameters */
    exponential?: {
      /** Smoothing factor (0-1) */
      alpha: number;
      /** Trend smoothing factor (0-1) */
      beta: number;
    };
    /** Weighted average parameters */
    weighted?: {
      /** Weight decay factor */
      decayFactor: number;
      /** Activity-specific weights */
      activityWeights: Record<string, number>;
    };
    /** Machine learning parameters */
    ml?: {
      /** Model complexity */
      complexity: 'simple' | 'medium' | 'complex';
      /** Training iterations */
      iterations: number;
      /** Learning rate */
      learningRate: number;
    };
  };
  /** Visualization settings */
  visualization: {
    /** Sparkline data points */
    sparklinePoints: number;
    /** Color thresholds */
    colorThresholds: {
      /** Green threshold */
      green: number;
      /** Yellow threshold */
      yellow: number;
      /** Red threshold */
      red: number;
    };
  };
}

/**
 * Default fatigue predictor configuration
 */
export const DEFAULT_FATIGUE_PREDICTOR_CONFIG: FatiguePredictorConfig = {
  algorithm: 'weighted',
  predictionHorizon: 100, // 100 time units
  historicalWindow: 500, // 500 time units
  confidenceThreshold: 0.7,
  riskThresholds: {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
  },
  algorithmParameters: {
    linear: {
      recentWeight: 0.7,
      minDataPoints: 5,
    },
    exponential: {
      alpha: 0.3,
      beta: 0.1,
    },
    weighted: {
      decayFactor: 0.95,
      activityWeights: {
        'forest-work': 1.2,
        'mining': 1.5,
        'farming': 0.8,
        'crafting': 0.6,
        'guard-duty': 1.0,
        'research': 0.4,
        'teaching': 0.3,
        'healing': 0.5,
        'construction': 1.3,
        'hunting': 1.4,
      },
    },
    ml: {
      complexity: 'simple',
      iterations: 100,
      learningRate: 0.01,
    },
  },
  visualization: {
    sparklinePoints: 20,
    colorThresholds: {
      green: 0.3,
      yellow: 0.6,
      red: 0.8,
    },
  },
};

/**
 * Fatigue trend analysis
 */
export interface FatigueTrendAnalysis {
  /** Trend direction */
  direction: 'increasing' | 'decreasing' | 'stable';
  /** Trend strength (0-1) */
  strength: number;
  /** Trend slope */
  slope: number;
  /** Seasonal patterns */
  seasonal: {
    /** Has seasonal pattern */
    hasPattern: boolean;
    /** Pattern period */
    period?: VillageTimeUnit;
    /** Pattern amplitude */
    amplitude?: number;
  };
  /** Anomalies detected */
  anomalies: Array<{
    timestamp: VillageTimeUnit;
    fatigue: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  /** Insights */
  insights: string[];
}

/**
 * Fatigue predictor engine
 */
export class FatiguePredictor {
  private config: FatiguePredictorConfig;
  private historicalData: Map<string, FatigueDataPoint[]> = new Map();

  constructor(config: Partial<FatiguePredictorConfig> = {}) {
    this.config = { ...DEFAULT_FATIGUE_PREDICTOR_CONFIG, ...config };
  }

  /**
   * Updates historical data with new fatigue data point
   */
  public updateHistoricalData(residentId: string, dataPoint: FatigueDataPoint): void {
    if (!this.historicalData.has(residentId)) {
      this.historicalData.set(residentId, []);
    }

    const data = this.historicalData.get(residentId)!;
    data.push(dataPoint);

    // Sort by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);

    // Limit data to historical window
    const cutoffTime = dataPoint.timestamp - this.config.historicalWindow;
    const filtered = data.filter(point => point.timestamp >= cutoffTime);
    this.historicalData.set(residentId, filtered);
  }

  /**
   * Predicts fatigue for a resident at a target time
   */
  public predictFatigue(
    residentId: string,
    currentFatigue: number,
    targetTime: VillageTimeUnit,
    scheduledActivities: Array<{ activityId: string; startTime: VillageTimeUnit; duration: VillageTimeUnit }> = []
  ): FatiguePrediction {
    const currentTime = Date.now() as VillageTimeUnit;
    const historicalData = this.historicalData.get(residentId) || [];

    // Generate prediction timeline
    const timeline = this.generatePredictionTimeline(
      residentId,
      currentFatigue,
      currentTime,
      targetTime,
      scheduledActivities
    );

    // Calculate predicted fatigue using selected algorithm
    const predictedFatigue = this.calculatePredictedFatigue(
      timeline,
      historicalData,
      this.config.algorithm
    );

    // Calculate confidence score
    const confidence = this.calculateConfidence(historicalData, timeline);

    // Assess risk
    const risk = this.assessRisk(predictedFatigue, timeline);

    return {
      residentId,
      currentFatigue,
      predictedFatigue,
      timeline,
      algorithm: this.config.algorithm,
      confidence,
      risk,
      metadata: {
        predictedAt: currentTime,
        targetTime,
        parameters: this.config.algorithmParameters[this.config.algorithm] || {},
        historicalDataPoints: historicalData.length,
      },
    };
  }

  /**
   * Generates prediction timeline with scheduled activities
   */
  private generatePredictionTimeline(
    residentId: string,
    currentFatigue: number,
    currentTime: VillageTimeUnit,
    targetTime: VillageTimeUnit,
    scheduledActivities: Array<{ activityId: string; startTime: VillageTimeUnit; duration: VillageTimeUnit }>
  ): FatigueDataPoint[] {
    const timeline: FatigueDataPoint[] = [];
    const timeStep = Math.max(1, Math.floor((targetTime - currentTime) / this.config.visualization.sparklinePoints));
    
    let currentFatigueValue = currentFatigue;
    let currentTimestamp = currentTime;

    while (currentTimestamp <= targetTime) {
      // Check for activity at this timestamp
      const activity = scheduledActivities.find(
        act => act.startTime <= currentTimestamp && currentTimestamp < act.startTime + act.duration
      );

      let fatigueChange = 0;
      let changeType: FatigueDataPoint['changeType'] = 'baseline';
      let activityId: string | undefined;

      if (activity) {
        // Apply activity fatigue gain
        const fatigueGain = this.calculateActivityFatigueGain(activity.activityId, activity.duration);
        fatigueChange = fatigueGain / activity.duration; // Per time unit
        changeType = 'activity';
        activityId = activity.activityId;
      } else {
        // Apply baseline recovery (night time)
        if (this.isNightTime(currentTimestamp)) {
          const recoveryRate = this.config.algorithmParameters.exponential?.alpha || 0.1;
          fatigueChange = -recoveryRate;
          changeType = 'recovery';
        }
      }

      currentFatigueValue = Math.max(0, Math.min(100, currentFatigueValue + fatigueChange));

      timeline.push({
        timestamp: currentTimestamp,
        fatigue: currentFatigueValue,
        activityId,
        changeType,
        confidence: this.calculatePointConfidence(currentTimestamp, currentTime, targetTime),
      });

      currentTimestamp += timeStep;
    }

    return timeline;
  }

  /**
   * Calculates predicted fatigue using selected algorithm
   */
  private calculatePredictedFatigue(
    timeline: FatigueDataPoint[],
    historicalData: FatigueDataPoint[],
    algorithm: FatiguePredictorConfig['algorithm']
  ): number {
    if (timeline.length === 0) return 0;

    switch (algorithm) {
      case 'linear':
        return this.linearPrediction(timeline, historicalData);
      case 'exponential':
        return this.exponentialPrediction(timeline, historicalData);
      case 'weighted':
        return this.weightedPrediction(timeline, historicalData);
      case 'ml':
        return this.mlPrediction(timeline, historicalData);
      default:
        return timeline[timeline.length - 1].fatigue;
    }
  }

  /**
   * Linear regression prediction
   */
  private linearPrediction(timeline: FatigueDataPoint[], historicalData: FatigueDataPoint[]): number {
    const params = this.config.algorithmParameters.linear!;
    if (historicalData.length < params.minDataPoints) {
      return timeline[timeline.length - 1].fatigue;
    }

    // Simple linear regression on historical data
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, point, index) => sum + index, 0);
    const sumY = historicalData.reduce((sum, point) => sum + point.fatigue, 0);
    const sumXY = historicalData.reduce((sum, point, index) => sum + index * point.fatigue, 0);
    const sumX2 = historicalData.reduce((sum, point, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Apply to future timeline
    const futureIndex = historicalData.length + timeline.length - 1;
    return Math.max(0, Math.min(100, slope * futureIndex + intercept));
  }

  /**
   * Exponential smoothing prediction
   */
  private exponentialPrediction(timeline: FatigueDataPoint[], historicalData: FatigueDataPoint[]): number {
    const params = this.config.algorithmParameters.exponential!;
    if (historicalData.length === 0) {
      return timeline[timeline.length - 1].fatigue;
    }

    // Double exponential smoothing
    let smoothed = historicalData[0].fatigue;
    let trend = 0;

    for (let i = 1; i < historicalData.length; i++) {
      const value = historicalData[i].fatigue;
      const prevSmoothed = smoothed;
      smoothed = params.alpha * value + (1 - params.alpha) * (prevSmoothed + trend);
      trend = params.beta * (smoothed - prevSmoothed) + (1 - params.beta) * trend;
    }

    // Forecast future values
    const forecastSteps = timeline.length;
    return Math.max(0, Math.min(100, smoothed + trend * forecastSteps));
  }

  /**
   * Weighted average prediction
   */
  private weightedPrediction(timeline: FatigueDataPoint[], historicalData: FatigueDataPoint[]): number {
    const params = this.config.algorithmParameters.weighted!;
    
    if (timeline.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    // Apply weights to timeline points
    timeline.forEach((point, index) => {
      const recencyWeight = Math.pow(params.decayFactor, timeline.length - index - 1);
      const activityWeight = point.activityId 
        ? (params.activityWeights[point.activityId] || 1.0)
        : 1.0;
      
      const weight = recencyWeight * activityWeight * point.confidence;
      weightedSum += point.fatigue * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : timeline[timeline.length - 1].fatigue;
  }

  /**
   * Simple machine learning prediction
   */
  private mlPrediction(timeline: FatigueDataPoint[], historicalData: FatigueDataPoint[]): number {
    // Simplified neural network for demonstration
    if (historicalData.length < 3) {
      return timeline[timeline.length - 1].fatigue;
    }

    // Feature extraction: recent trends, patterns
    const features = this.extractFeatures(historicalData);
    const weights = this.simpleMLTraining(features, historicalData.map(p => p.fatigue));
    
    // Predict using trained weights
    const currentFeatures = this.extractFeatures([
      ...historicalData.slice(-2),
      ...timeline.slice(0, 1)
    ]);
    
    const prediction = this.applyMLModel(currentFeatures, weights);
    return Math.max(0, Math.min(100, prediction));
  }

  /**
   * Extracts features for ML model
   */
  private extractFeatures(data: FatigueDataPoint[]): number[] {
    if (data.length < 2) return [0, 0, 0];

    const recent = data.slice(-5);
    const avgFatigue = recent.reduce((sum, p) => sum + p.fatigue, 0) / recent.length;
    const trend = recent.length > 1 ? recent[recent.length - 1].fatigue - recent[0].fatigue : 0;
    const variance = recent.reduce((sum, p) => sum + Math.pow(p.fatigue - avgFatigue, 2), 0) / recent.length;

    return [avgFatigue, trend, variance];
  }

  /**
   * Simple ML training
   */
  private simpleMLTraining(features: number[][], targets: number[]): number[] {
    const params = this.config.algorithmParameters.ml!;
    const weights = [0.5, 0.3, 0.2]; // Initialize weights

    for (let iter = 0; iter < params.iterations; iter++) {
      for (let i = 0; i < features.length; i++) {
        const prediction = this.applyMLModel(features[i], weights);
        const error = targets[i] - prediction;
        
        // Gradient descent update
        for (let j = 0; j < weights.length; j++) {
          weights[j] += params.learningRate * error * features[i][j];
        }
      }
    }

    return weights;
  }

  /**
   * Applies ML model
   */
  private applyMLModel(features: number[], weights: number[]): number {
    return features.reduce((sum, feature, index) => sum + feature * weights[index], 0);
  }

  /**
   * Calculates confidence score for prediction
   */
  private calculateConfidence(historicalData: FatigueDataPoint[], timeline: FatigueDataPoint[]): number {
    if (historicalData.length === 0) return 0.5;

    // Base confidence from data quantity
    const dataConfidence = Math.min(1, historicalData.length / 20);

    // Confidence from timeline consistency
    const timelineConfidence = timeline.reduce((sum, point) => sum + point.confidence, 0) / timeline.length;

    // Combine confidences
    return (dataConfidence + timelineConfidence) / 2;
  }

  /**
   * Calculates confidence for individual data point
   */
  private calculatePointConfidence(timestamp: VillageTimeUnit, startTime: VillageTimeUnit, endTime: VillageTimeUnit): number {
    const distanceFromStart = timestamp - startTime;
    const totalDistance = endTime - startTime;
    
    // Confidence decreases with distance from current time
    return Math.max(0.3, 1 - (distanceFromStart / totalDistance) * 0.7);
  }

  /**
   * Assesses risk based on predicted fatigue
   */
  private assessRisk(predictedFatigue: number, timeline: FatigueDataPoint[]): FatiguePrediction['risk'] {
    const exhaustionRisk = predictedFatigue / 100;
    
    // Find time to exhaustion
    let timeToExhaustion: VillageTimeUnit | undefined;
    for (const point of timeline) {
      if (point.fatigue >= 100) {
        timeToExhaustion = point.timestamp - timeline[0].timestamp;
        break;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (exhaustionRisk > this.config.riskThresholds.high) {
      recommendations.push('Immediate rest required');
      recommendations.push('Cancel non-essential activities');
    } else if (exhaustionRisk > this.config.riskThresholds.medium) {
      recommendations.push('Schedule rest periods');
      recommendations.push('Reduce activity intensity');
    } else if (exhaustionRisk > this.config.riskThresholds.low) {
      recommendations.push('Monitor fatigue levels');
      recommendations.push('Plan for recovery time');
    }

    return {
      exhaustionRisk,
      timeToExhaustion,
      recommendations,
    };
  }

  /**
   * Calculates activity fatigue gain
   */
  private calculateActivityFatigueGain(activityId: string, duration: VillageTimeUnit): number {
    const activityWeights = this.config.algorithmParameters.weighted?.activityWeights || {};
    const baseGain = 0.1; // Base fatigue gain per time unit
    const weight = activityWeights[activityId] || 1.0;
    
    return baseGain * weight * duration;
  }

  /**
   * Checks if timestamp is during night time
   */
  private isNightTime(timestamp: VillageTimeUnit): boolean {
    // Simple day/night cycle: day = 0-12, night = 12-24
    const cyclePosition = timestamp % 24;
    return cyclePosition >= 12;
  }

  /**
   * Analyzes fatigue trends
   */
  public analyzeTrends(residentId: string): FatigueTrendAnalysis {
    const data = this.historicalData.get(residentId) || [];
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        slope: 0,
        seasonal: { hasPattern: false },
        anomalies: [],
        insights: ['Insufficient data for trend analysis'],
      };
    }

    // Calculate trend direction and strength
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.fatigue, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.fatigue, 0) / secondHalf.length;
    
    const slope = (secondAvg - firstAvg) / (data.length / 2);
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const strength = Math.abs(slope);

    // Detect anomalies
    const anomalies = this.detectAnomalies(data);

    // Generate insights
    const insights = this.generateInsights(data, direction, strength, anomalies);

    return {
      direction,
      strength,
      slope,
      seasonal: { hasPattern: false }, // Simplified for now
      anomalies,
      insights,
    };
  }

  /**
   * Detects anomalies in fatigue data
   */
  private detectAnomalies(data: FatigueDataPoint[]): FatigueTrendAnalysis['anomalies'] {
    const anomalies: FatigueTrendAnalysis['anomalies'] = [];
    
    if (data.length < 5) return anomalies;

    // Calculate moving average and standard deviation
    const windowSize = 5;
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const avg = window.reduce((sum, p) => sum + p.fatigue, 0) / window.length;
      const stdDev = Math.sqrt(
        window.reduce((sum, p) => sum + Math.pow(p.fatigue - avg, 2), 0) / window.length
      );

      const current = data[i];
      const zScore = Math.abs((current.fatigue - avg) / stdDev);
      
      if (zScore > 2) {
        anomalies.push({
          timestamp: current.timestamp,
          fatigue: current.fatigue,
          severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
          description: `Unusual fatigue level detected (${current.fatigue.toFixed(1)})`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Generates insights from fatigue data
   */
  private generateInsights(
    data: FatigueDataPoint[],
    direction: FatigueTrendAnalysis['direction'],
    strength: number,
    anomalies: FatigueTrendAnalysis['anomalies']
  ): string[] {
    const insights: string[] = [];

    // Trend insights
    if (direction === 'increasing' && strength > 0.5) {
      insights.push('Fatigue is rapidly increasing - consider immediate intervention');
    } else if (direction === 'decreasing' && strength > 0.3) {
      insights.push('Fatigue is improving - current recovery strategy is effective');
    } else if (direction === 'stable') {
      insights.push('Fatigue levels are stable - maintain current schedule');
    }

    // Anomaly insights
    if (anomalies.length > 0) {
      insights.push(`${anomalies.length} unusual fatigue patterns detected in recent history`);
    }

    // Activity-specific insights
    const activityFatigue = new Map<string, number>();
    data.forEach(point => {
      if (point.activityId) {
        activityFatigue.set(
          point.activityId,
          (activityFatigue.get(point.activityId) || 0) + point.fatigue
        );
      }
    });

    if (activityFatigue.size > 0) {
      const mostFatiguing = Array.from(activityFatigue.entries())
        .sort(([, a], [, b]) => b - a)[0];
      insights.push(`Most fatiguing activity: ${mostFatiguing[0]}`);
    }

    return insights;
  }

  /**
   * Gets sparkline data for visualization
   */
  public getSparklineData(residentId: string, points: number = 20): number[] {
    const data = this.historicalData.get(residentId) || [];
    if (data.length === 0) return [];

    // Sample data points for sparkline
    const step = Math.max(1, Math.floor(data.length / points));
    const sparkline: number[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sparkline.push(data[i].fatigue);
    }

    return sparkline.slice(0, points);
  }

  /**
   * Gets color for fatigue level
   */
  public getFatigueColor(fatigue: number): string {
    const thresholds = this.config.visualization.colorThresholds;
    
    if (fatigue <= thresholds.green * 100) return '#10b981'; // green
    if (fatigue <= thresholds.yellow * 100) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }

  /**
   * Updates predictor configuration
   */
  public updateConfig(newConfig: Partial<FatiguePredictorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  public getConfig(): FatiguePredictorConfig {
    return { ...this.config };
  }

  /**
   * Gets historical data for a resident
   */
  public getHistoricalData(residentId: string): FatigueDataPoint[] {
    return this.historicalData.get(residentId) || [];
  }

  /**
   * Clears historical data for a resident
   */
  public clearHistoricalData(residentId: string): void {
    this.historicalData.delete(residentId);
  }

  /**
   * Gets all resident IDs with historical data
   */
  public getResidentIds(): string[] {
    return Array.from(this.historicalData.keys());
  }
}

/**
 * CLI interface for fatigue predictor
 */
export class FatiguePredictorCLI {
  private predictor: FatiguePredictor;

  constructor(config: Partial<FatiguePredictorConfig> = {}) {
    this.predictor = new FatiguePredictor(config);
  }

  /**
   * Parses command line arguments
   */
  private parseArgs(args: string[]): {
    residentId?: string;
    targetTime?: number;
    algorithm?: string;
    horizon?: number;
    output?: string;
    help: boolean;
  } {
    const parsed = {
      residentId: undefined as string | undefined,
      targetTime: undefined as number | undefined,
      algorithm: undefined as string | undefined,
      horizon: undefined as number | undefined,
      output: undefined as string | undefined,
      help: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--resident':
        case '-r':
          parsed.residentId = args[++i];
          break;
        case '--target-time':
        case '-t':
          parsed.targetTime = parseInt(args[++i]);
          break;
        case '--algorithm':
        case '-a':
          parsed.algorithm = args[++i];
          break;
        case '--horizon':
        case '-h':
          parsed.horizon = parseInt(args[++i]);
          break;
        case '--output':
        case '-o':
          parsed.output = args[++i];
          break;
        case '--help':
          parsed.help = true;
          break;
      }
    }

    return parsed;
  }

  /**
   * Shows help information
   */
  private showHelp(): void {
    console.log(`
Idle Village Fatigue Predictor CLI

Usage: fatigue-predictor [options]

Options:
  -r, --resident <id>        Resident ID to predict for
  -t, --target-time <time>    Target time for prediction
  -a, --algorithm <type>      Prediction algorithm (linear|exponential|weighted|ml)
  -h, --horizon <units>       Prediction horizon in time units
  -o, --output <path>         Output file path
  --help                      Show this help message

Examples:
  fatigue-predictor --resident resident-1 --target-time 1000
  fatigue-predictor --resident resident-1 --algorithm weighted --horizon 200
  fatigue-predictor --resident resident-1 --output prediction.json

Algorithms:
  linear      - Linear regression prediction
  exponential - Exponential smoothing prediction
  weighted    - Weighted average prediction
  ml          - Simple machine learning prediction
`);
  }

  /**
   * Runs the CLI prediction
   */
  public async run(args: string[]): Promise<void> {
    const parsed = this.parseArgs(args);

    if (parsed.help) {
      this.showHelp();
      return;
    }

    if (!parsed.residentId) {
      console.error('Error: Resident ID is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    try {
      console.log('Starting fatigue prediction...');
      console.log(`Resident: ${parsed.residentId}`);
      
      if (parsed.algorithm) {
        this.predictor.updateConfig({ algorithm: parsed.algorithm as FatiguePredictorConfig['algorithm'] });
        console.log(`Algorithm: ${parsed.algorithm}`);
      }
      
      if (parsed.horizon) {
        this.predictor.updateConfig({ predictionHorizon: parsed.horizon });
        console.log(`Horizon: ${parsed.horizon} time units`);
      }

      // Generate sample data for demonstration
      this.generateSampleData(parsed.residentId);

      // Make prediction
      const currentFatigue = 25; // Sample current fatigue
      const targetTime = parsed.targetTime || (Date.now() as VillageTimeUnit) + 100;
      
      const prediction = this.predictor.predictFatigue(
        parsed.residentId,
        currentFatigue,
        targetTime
      );

      // Display results
      console.log(`Current fatigue: ${currentFatigue.toFixed(1)}`);
      console.log(`Predicted fatigue: ${prediction.predictedFatigue.toFixed(1)}`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`Exhaustion risk: ${(prediction.risk.exhaustionRisk * 100).toFixed(1)}%`);
      
      if (prediction.risk.timeToExhaustion) {
        console.log(`Time to exhaustion: ${prediction.risk.timeToExhaustion} time units`);
      }

      if (prediction.risk.recommendations.length > 0) {
        console.log('\nRecommendations:');
        prediction.risk.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }

      // Analyze trends
      const trendAnalysis = this.predictor.analyzeTrends(parsed.residentId);
      console.log(`\nTrend: ${trendAnalysis.direction} (strength: ${trendAnalysis.strength.toFixed(2)})`);
      
      if (trendAnalysis.insights.length > 0) {
        console.log('Insights:');
        trendAnalysis.insights.forEach(insight => console.log(`  - ${insight}`));
      }

      // Save to file if requested
      if (parsed.output) {
        const output = {
          prediction,
          trendAnalysis,
          sparklineData: this.predictor.getSparklineData(parsed.residentId),
          config: this.predictor.getConfig(),
        };
        
        writeFileSync(parsed.output, JSON.stringify(output, null, 2));
        console.log(`\nResults saved to: ${parsed.output}`);
      }

      console.log('\nPrediction completed successfully!');
    } catch (error) {
      console.error('Prediction failed:', error);
      process.exit(1);
    }
  }

  /**
   * Generates sample historical data for demonstration
   */
  private generateSampleData(residentId: string): void {
    const now = Date.now() as VillageTimeUnit;
    const dataPoints: FatigueDataPoint[] = [];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (50 - i) * 10;
      const fatigue = 20 + Math.sin(i * 0.2) * 15 + Math.random() * 10;
      
      dataPoints.push({
        timestamp,
        fatigue: Math.max(0, Math.min(100, fatigue)),
        changeType: i % 3 === 0 ? 'activity' : i % 3 === 1 ? 'recovery' : 'baseline',
        confidence: 0.8 + Math.random() * 0.2,
      });
    }

    dataPoints.forEach(point => this.predictor.updateHistoricalData(residentId, point));
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new FatiguePredictorCLI();
  await cli.run(process.argv.slice(2));
}

// Export for testing
export { FatiguePredictorCLI };
