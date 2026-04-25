/**
 * Idle Village Resident Fatigue Predictor - NP-019
 * 
 * Config-first fatigue prediction system that estimates future fatigue levels
 * for residents based on telemetry data and scheduler parameters. Uses weighted
 * factors and deterministic algorithms for predictable results.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { FatigueLevel } from '@/ui/idleVillage/config/fatigueDashboardConfig';

/**
 * Fatigue prediction factors and their weights
 */
export interface FatigueFactors {
  /** Current fatigue level (0-100) */
  currentFatigue: number;
  /** Activity difficulty multiplier */
  activityDifficulty: number;
  /** Activity duration multiplier */
  activityDuration: number;
  /** Resident base fatigue rate */
  baseFatigueRate: number;
  /** Environmental factors (temperature, terrain, etc.) */
  environmentalMultiplier: number;
  /** Crew synergy effects */
  crewSynergyMultiplier: number;
  /** Time of day effects */
  timeOfDayMultiplier: number;
}

/**
 * Prediction result with confidence intervals
 */
export interface FatiguePrediction {
  /** Predicted fatigue after activity */
  predictedFatigue: number;
  /** Fatigue level category */
  fatigueLevel: FatigueLevel;
  /** Confidence score (0-1) */
  confidence: number;
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Time to reach critical fatigue (in activities) */
  timeToCritical: number;
  /** Recommended rest time (in time units) */
  recommendedRest: number;
  /** Prediction factors breakdown */
  factors: FatigueFactors;
  /** Historical accuracy score */
  historicalAccuracy: number;
}

/**
 * Prediction model configuration
 */
export interface FatiguePredictionConfig {
  /** Base fatigue accumulation rate */
  baseFatigueRate: number;
  /** Activity difficulty weights */
  difficultyWeights: Record<number, number>;
  /** Activity duration weights */
  durationWeights: Record<number, number>;
  /** Environmental modifiers */
  environmentalModifiers: {
    hotWeather: number;
    coldWeather: number;
    roughTerrain: number;
    nightTime: number;
  };
  /** Crew synergy bonuses */
  crewSynergyBonus: {
    workingAlone: number;
    smallCrew: number;
    optimalCrew: number;
    overcrowded: number;
  };
  /** Fatigue thresholds */
  thresholds: {
    rested: number;
    normal: number;
    tired: number;
    exhausted: number;
    critical: number;
  };
  /** Prediction confidence factors */
  confidenceFactors: {
    dataAvailability: number;
    historicalAccuracy: number;
    modelComplexity: number;
  };
}

/**
 * Zod schemas for validation
 */
export const FatigueFactorsSchema = z.object({
  currentFatigue: z.number().min(0).max(100),
  activityDifficulty: z.number().min(0.1).max(5),
  activityDuration: z.number().min(1).max(1000),
  baseFatigueRate: z.number().min(0).max(1),
  environmentalMultiplier: z.number().min(0.5).max(2),
  crewSynergyMultiplier: z.number().min(0.5).max(1.5),
  timeOfDayMultiplier: z.number().min(0.8).max(1.2),
});

export const FatiguePredictionSchema = z.object({
  predictedFatigue: z.number().min(0).max(100),
  fatigueLevel: z.enum(['rested', 'normal', 'tired', 'exhausted', 'critical']),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  timeToCritical: z.number().min(0),
  recommendedRest: z.number().min(0),
  factors: FatigueFactorsSchema,
  historicalAccuracy: z.number().min(0).max(1),
});

export const FatiguePredictionConfigSchema = z.object({
  baseFatigueRate: z.number().min(0).max(1),
  difficultyWeights: z.record(z.number().min(0).max(2)),
  durationWeights: z.record(z.number().min(0).max(2)),
  environmentalModifiers: z.object({
    hotWeather: z.number().min(0.5).max(2),
    coldWeather: z.number().min(0.5).max(2),
    roughTerrain: z.number().min(0.5).max(2),
    nightTime: z.number().min(0.5).max(2),
  }),
  crewSynergyBonus: z.object({
    workingAlone: z.number().min(0.5).max(1.5),
    smallCrew: z.number().min(0.5).max(1.5),
    optimalCrew: z.number().min(0.5).max(1.5),
    overcrowded: z.number().min(0.5).max(1.5),
  }),
  thresholds: z.object({
    rested: z.number().min(0).max(100),
    normal: z.number().min(0).max(100),
    tired: z.number().min(0).max(100),
    exhausted: z.number().min(0).max(100),
    critical: z.number().min(0).max(100),
  }),
  confidenceFactors: z.object({
    dataAvailability: z.number().min(0).max(1),
    historicalAccuracy: z.number().min(0).max(1),
    modelComplexity: z.number().min(0).max(1),
  }),
});

/**
 * Default configuration for fatigue prediction
 */
export const DEFAULT_FATIGUE_PREDICTION_CONFIG: FatiguePredictionConfig = {
  baseFatigueRate: 0.1,
  difficultyWeights: {
    1: 0.8,  // Very easy
    2: 1.0,  // Easy
    3: 1.3,  // Normal
    4: 1.7,  // Hard
    5: 2.2,  // Very hard
  },
  durationWeights: {
    50: 0.7,   // Very short
    100: 1.0,  // Short
    200: 1.3,  // Medium
    400: 1.6,  // Long
    800: 2.0,  // Very long
  },
  environmentalModifiers: {
    hotWeather: 1.3,
    coldWeather: 1.1,
    roughTerrain: 1.2,
    nightTime: 1.15,
  },
  crewSynergyBonus: {
    workingAlone: 1.2,
    smallCrew: 1.0,
    optimalCrew: 0.8,
    overcrowded: 1.1,
  },
  thresholds: {
    rested: 20,
    normal: 40,
    tired: 60,
    exhausted: 80,
    critical: 95,
  },
  confidenceFactors: {
    dataAvailability: 0.8,
    historicalAccuracy: 0.9,
    modelComplexity: 0.7,
  },
};

/**
 * Fatigue Predictor class
 */
export class FatiguePredictor {
  private config: FatiguePredictionConfig;

  constructor(config: FatiguePredictionConfig = DEFAULT_FATIGUE_PREDICTION_CONFIG) {
    this.config = config;
  }

  /**
   * Predict fatigue for a resident performing an activity
   */
  predictFatigue(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: {
      environmentalConditions?: string[];
      crewSize?: number;
      timeOfDay?: string;
      historicalData?: Array<{ activity: ActivityDefinition; fatigueBefore: number; fatigueAfter: number }>;
    } = {}
  ): FatiguePrediction {
    const factors = this.calculateFactors(resident, activity, context);
    const predictedFatigue = this.calculatePredictedFatigue(factors);
    const fatigueLevel = this.getFatigueLevel(predictedFatigue);
    const confidence = this.calculateConfidence(context);
    const riskLevel = this.assessRisk(predictedFatigue);
    const timeToCritical = this.calculateTimeToCritical(predictedFatigue, factors);
    const recommendedRest = this.calculateRecommendedRest(predictedFatigue);
    const historicalAccuracy = this.calculateHistoricalAccuracy(context.historicalData);

    return {
      predictedFatigue,
      fatigueLevel,
      confidence,
      riskLevel,
      timeToCritical,
      recommendedRest,
      factors,
      historicalAccuracy,
    };
  }

  /**
   * Extract duration from formula string (simplified implementation)
   */
  private extractDurationFromFormula(formula?: string): number {
    if (!formula) return 100;
    
    // Simple extraction - look for numeric values in the formula
    const numericMatch = formula.match(/(\d+)/);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10) * 50; // Scale by 50 as a base unit
    }
    
    return 100; // Default duration
  }

  /**
   * Calculate fatigue factors for prediction
   */
  private calculateFactors(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: {
      environmentalConditions?: string[];
      crewSize?: number;
      timeOfDay?: string;
    }
  ): FatigueFactors {
    const currentFatigue = resident.fatigue || 0;
    const activityDifficulty = activity.dangerRating || 3;
    const activityDuration = this.extractDurationFromFormula(activity.durationFormula);
    const baseFatigueRate = this.config.baseFatigueRate;
    
    // Calculate environmental multiplier
    let environmentalMultiplier = 1.0;
    if (context.environmentalConditions) {
      for (const condition of context.environmentalConditions) {
        switch (condition) {
          case 'hot_weather':
            environmentalMultiplier *= this.config.environmentalModifiers.hotWeather;
            break;
          case 'cold_weather':
            environmentalMultiplier *= this.config.environmentalModifiers.coldWeather;
            break;
          case 'rough_terrain':
            environmentalMultiplier *= this.config.environmentalModifiers.roughTerrain;
            break;
        }
      }
    }

    // Calculate crew synergy multiplier
    let crewSynergyMultiplier = 1.0;
    if (context.crewSize) {
      if (context.crewSize === 1) {
        crewSynergyMultiplier = this.config.crewSynergyBonus.workingAlone;
      } else if (context.crewSize <= 3) {
        crewSynergyMultiplier = this.config.crewSynergyBonus.smallCrew;
      } else if (context.crewSize <= 6) {
        crewSynergyMultiplier = this.config.crewSynergyBonus.optimalCrew;
      } else {
        crewSynergyMultiplier = this.config.crewSynergyBonus.overcrowded;
      }
    }

    // Calculate time of day multiplier
    let timeOfDayMultiplier = 1.0;
    if (context.timeOfDay === 'night') {
      timeOfDayMultiplier = this.config.environmentalModifiers.nightTime;
    }

    return {
      currentFatigue,
      activityDifficulty,
      activityDuration,
      baseFatigueRate,
      environmentalMultiplier,
      crewSynergyMultiplier,
      timeOfDayMultiplier,
    };
  }

  /**
   * Calculate predicted fatigue based on factors
   */
  private calculatePredictedFatigue(factors: FatigueFactors): number {
    const difficultyWeight = this.config.difficultyWeights[factors.activityDifficulty] || 1.0;
    const durationWeight = this.config.durationWeights[Math.round(factors.activityDuration / 100) * 100] || 1.0;
    
    const fatigueIncrease = factors.currentFatigue + 
      (factors.baseFatigueRate * difficultyWeight * durationWeight * 
       factors.environmentalMultiplier * factors.crewSynergyMultiplier * 
       factors.timeOfDayMultiplier * factors.activityDuration / 100);

    return Math.min(100, Math.max(0, fatigueIncrease));
  }

  /**
   * Get fatigue level category
   */
  private getFatigueLevel(fatigue: number): FatigueLevel {
    if (fatigue <= this.config.thresholds.rested) return 'rested';
    if (fatigue <= this.config.thresholds.normal) return 'normal';
    if (fatigue <= this.config.thresholds.tired) return 'tired';
    if (fatigue <= this.config.thresholds.exhausted) return 'exhausted';
    return 'critical';
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(context: {
    historicalData?: Array<{ activity: ActivityDefinition; fatigueBefore: number; fatigueAfter: number }>;
  }): number {
    let confidence = 1.0;

    // Data availability factor
    if (!context.historicalData || context.historicalData.length === 0) {
      confidence *= this.config.confidenceFactors.dataAvailability;
    } else if (context.historicalData.length < 5) {
      confidence *= this.config.confidenceFactors.dataAvailability * 0.8;
    }

    // Model complexity factor
    confidence *= this.config.confidenceFactors.modelComplexity;

    return Math.min(1.0, Math.max(0, confidence));
  }

  /**
   * Assess risk level based on predicted fatigue
   */
  private assessRisk(fatigue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (fatigue >= this.config.thresholds.critical) return 'critical';
    if (fatigue >= this.config.thresholds.exhausted) return 'high';
    if (fatigue >= this.config.thresholds.tired) return 'medium';
    return 'low';
  }

  /**
   * Calculate time to reach critical fatigue
   */
  private calculateTimeToCritical(currentFatigue: number, factors: FatigueFactors): number {
    if (currentFatigue >= this.config.thresholds.critical) return 0;
    
    const fatiguePerActivity = factors.baseFatigueRate * 
      this.config.difficultyWeights[factors.activityDifficulty] * 
      this.config.durationWeights[Math.round(factors.activityDuration / 100) * 100] * 
      factors.environmentalMultiplier * factors.crewSynergyMultiplier * 
      factors.timeOfDayMultiplier * factors.activityDuration / 100;

    if (fatiguePerActivity <= 0) return Infinity;
    
    return Math.ceil((this.config.thresholds.critical - currentFatigue) / fatiguePerActivity);
  }

  /**
   * Calculate recommended rest time
   */
  private calculateRecommendedRest(fatigue: number): number {
    if (fatigue <= this.config.thresholds.normal) return 0;
    if (fatigue <= this.config.thresholds.tired) return 50;
    if (fatigue <= this.config.thresholds.exhausted) return 150;
    return 300;
  }

  /**
   * Calculate historical accuracy
   */
  private calculateHistoricalAccuracy(
    historicalData?: Array<{ activity: ActivityDefinition; fatigueBefore: number; fatigueAfter: number }>
  ): number {
    if (!historicalData || historicalData.length === 0) return 0.5;

    let totalError = 0;
    let count = 0;

    for (const data of historicalData) {
      const prediction = this.predictFatigue(
        { ...data.activity, fatigue: data.fatigueBefore } as unknown as ResidentState,
        data.activity
      );
      
      const error = Math.abs(prediction.predictedFatigue - data.fatigueAfter);
      totalError += error;
      count++;
    }

    const averageError = totalError / count;
    return Math.max(0, Math.min(1, 1 - (averageError / 100)));
  }

  /**
   * Batch prediction for multiple residents
   */
  predictBatch(
    predictions: Array<{
      resident: ResidentState;
      activity: ActivityDefinition;
      context?: {
        environmentalConditions?: string[];
        crewSize?: number;
        timeOfDay?: string;
        historicalData?: Array<{ activity: ActivityDefinition; fatigueBefore: number; fatigueAfter: number }>;
      };
    }>
  ): FatiguePrediction[] {
    return predictions.map(p => this.predictFatigue(p.resident, p.activity, p.context));
  }

  /**
   * Get top residents at risk of critical fatigue
   */
  getTopRiskResidents(
    predictions: FatiguePrediction[],
    limit: number = 5
  ): FatiguePrediction[] {
    return predictions
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .sort((a, b) => b.predictedFatigue - a.predictedFatigue)
      .slice(0, limit);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FatiguePredictionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FatiguePredictionConfig {
    return { ...this.config };
  }
}

/**
 * Type exports
 */
export type FatigueFactorsType = z.infer<typeof FatigueFactorsSchema>;
export type FatiguePredictionType = z.infer<typeof FatiguePredictionSchema>;
export type FatiguePredictionConfigType = z.infer<typeof FatiguePredictionConfigSchema>;
