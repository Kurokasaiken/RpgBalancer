/**
 * Unit tests for Idle Village Risk Auto-Tune CLI
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RiskCurveIndividual,
  RiskCurveOptimizer,
  TelemetryPoint,
  OptimizedRiskCurve,
} from '../../../scripts/idleVillage/riskAutoTune';
import { LinearCongruentialGenerator } from '../../../src/balancing/punchClub/lcg';

describe('RiskCurveIndividual', () => {
  let lcg: LinearCongruentialGenerator;

  beforeEach(() => {
    lcg = new LinearCongruentialGenerator({ seed: 42 });
  });

  it('should generate random genes within valid ranges', () => {
    const individual = new RiskCurveIndividual(undefined, lcg);

    expect(individual.genes.injuryCurve.baseRate).toBeGreaterThanOrEqual(0.001);
    expect(individual.genes.injuryCurve.baseRate).toBeLessThanOrEqual(0.1);
    expect(individual.genes.deathCurve.baseRate).toBeGreaterThanOrEqual(0.0001);
    expect(individual.genes.deathCurve.baseRate).toBeLessThanOrEqual(0.01);
    expect(individual.genes.smoothing.factor).toBeGreaterThanOrEqual(0.1);
    expect(individual.genes.smoothing.factor).toBeLessThanOrEqual(2.0);
  });

  it('should mutate genes correctly', () => {
    const individual = new RiskCurveIndividual(undefined, lcg);
    const originalBaseRate = individual.genes.injuryCurve.baseRate;
    
    individual.mutate(lcg, 1.0); // 100% mutation rate
    
    // Should have changed due to mutation
    expect(individual.genes.injuryCurve.baseRate).not.toBe(originalBaseRate);
    
    // Should still be within valid bounds
    expect(individual.genes.injuryCurve.baseRate).toBeGreaterThanOrEqual(0.001);
    expect(individual.genes.injuryCurve.baseRate).toBeLessThanOrEqual(0.1);
  });

  it('should perform crossover correctly', () => {
    const parent1 = new RiskCurveIndividual(undefined, lcg);
    const parent2 = new RiskCurveIndividual(undefined, lcg);
    
    const child = parent1.crossover(parent2, lcg);
    
    // Child should have genes from either parent
    const parent1BaseRate = parent1.genes.injuryCurve.baseRate;
    const parent2BaseRate = parent2.genes.injuryCurve.baseRate;
    const childBaseRate = child.genes.injuryCurve.baseRate;
    
    expect(childBaseRate).toBeOneOf([parent1BaseRate, parent2BaseRate]);
  });

  it('should clone correctly', () => {
    const original = new RiskCurveIndividual(undefined, lcg);
    original.fitness = 0.85;
    
    const clone = original.clone();
    
    expect(clone.genes).toEqual(original.genes);
    expect(clone.fitness).toBe(original.fitness);
    
    // Should be deep copy
    clone.genes.injuryCurve.baseRate = 0.05;
    expect(clone.genes.injuryCurve.baseRate).not.toBe(original.genes.injuryCurve.baseRate);
  });
});

describe('RiskCurveOptimizer', () => {
  let optimizer: RiskCurveOptimizer;
  let telemetry: TelemetryPoint[];

  beforeEach(() => {
    telemetry = generateSampleTelemetryData(100);
    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    optimizer = new RiskCurveOptimizer(telemetry, kpiTargets, 42);
  });

  it('should calculate predicted risk correctly', () => {
    const individual = new RiskCurveIndividual();
    const point: TelemetryPoint = {
      timestamp: Date.now(),
      sessionId: 'test-session',
      eventType: 'injury',
      residentId: 'resident-1',
      residentLevel: 5,
      activityType: 'work',
      locationType: 'forest',
      riskFactors: {
        fatigue: 0.5,
        hunger: 0.3,
        health: 0.8,
        morale: 0.7,
      },
      outcome: {
        severity: 0.4,
        duration: 10,
        recoveryTime: 50,
      },
    };

    const risk = optimizer['calculatePredictedRisk'](point, individual.genes);
    
    expect(risk.injury).toBeGreaterThan(0);
    expect(risk.injury).toBeLessThanOrEqual(1);
    expect(risk.death).toBeGreaterThanOrEqual(0);
    expect(risk.death).toBeLessThanOrEqual(1);
  });

  it('should calculate fitness correctly', () => {
    const individual = new RiskCurveIndividual();
    
    const fitness = optimizer.calculateFitness(individual);
    
    expect(fitness).toBeGreaterThanOrEqual(0);
    expect(fitness).toBeLessThanOrEqual(1);
    expect(individual.genes.fitness.overallScore).toBe(fitness);
  });

  it('should simulate overall rates correctly', () => {
    const individual = new RiskCurveIndividual();
    
    const injuryRate = optimizer['simulateOverallRate'](individual.genes, 'injury');
    const deathRate = optimizer['simulateOverallRate'](individual.genes, 'death');
    
    expect(injuryRate).toBeGreaterThanOrEqual(0);
    expect(injuryRate).toBeLessThanOrEqual(1);
    expect(deathRate).toBeGreaterThanOrEqual(0);
    expect(deathRate).toBeLessThanOrEqual(1);
    expect(deathRate).toBeLessThan(injuryRate); // Death rate should be lower
  });

  it('should calculate KPI compliance correctly', () => {
    const kpiCompliance1 = optimizer['calculateKPICompliance'](0.1, 0.01);
    const kpiCompliance2 = optimizer['calculateKPICompliance'](0.2, 0.03);
    
    expect(kpiCompliance1).toBeGreaterThan(kpiCompliance2);
    expect(kpiCompliance1).toBeLessThanOrEqual(1);
    expect(kpiCompliance2).toBeGreaterThanOrEqual(0);
  });

  it('should perform tournament selection correctly', () => {
    const population: RiskCurveIndividual[] = [];
    for (let i = 0; i < 10; i++) {
      const individual = new RiskCurveIndividual();
      individual.fitness = i / 10; // Fitness from 0 to 0.9
      population.push(individual);
    }

    const selected = optimizer['tournamentSelection'](population, 3);
    
    expect(selected).toBeDefined();
    expect(population).toContain(selected);
  });

  it('should optimize risk curves', () => {
    const params = {
      iterations: 10,
      populationSize: 20,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      eliteSize: 4,
      convergenceThreshold: 5,
      maxGenerations: 10,
    };

    const optimized = optimizer.optimize(params);
    
    expect(optimized).toBeDefined();
    expect(optimized.fitness.overallScore).toBeGreaterThan(0);
    expect(optimized.fitness.injuryAccuracy).toBeGreaterThanOrEqual(0);
    expect(optimized.fitness.deathAccuracy).toBeGreaterThanOrEqual(0);
    expect(optimized.fitness.kpiCompliance).toBeGreaterThanOrEqual(0);
  });
});

describe('Risk Curve Calculations', () => {
  let optimizer: RiskCurveOptimizer;

  beforeEach(() => {
    const telemetry = generateSampleTelemetryData(50);
    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    optimizer = new RiskCurveOptimizer(telemetry, kpiTargets, 42);
  });

  it('should apply linear smoothing correctly', () => {
    const smoothing = { type: 'linear' as const, factor: 0.5, threshold: 0.3 };
    const risk = 0.8;
    
    const smoothed = optimizer['applySmoothing'](risk, smoothing);
    
    expect(smoothed).toBeLessThan(risk);
    expect(smoothed).toBeGreaterThan(smoothing.threshold);
  });

  it('should apply ease-in smoothing correctly', () => {
    const smoothing = { type: 'ease-in' as const, factor: 0.5, threshold: 0.3 };
    const risk = 0.8;
    
    const smoothed = optimizer['applySmoothing'](risk, smoothing);
    
    expect(smoothed).toBeLessThan(risk);
    expect(smoothed).toBeGreaterThan(smoothing.threshold);
  });

  it('should apply ease-out smoothing correctly', () => {
    const smoothing = { type: 'ease-out' as const, factor: 0.5, threshold: 0.3 };
    const risk = 0.8;
    
    const smoothed = optimizer['applySmoothing'](risk, smoothing);
    
    expect(smoothed).toBeLessThan(risk);
    expect(smoothed).toBeGreaterThan(smoothing.threshold);
  });

  it('should apply ease-in-out smoothing correctly', () => {
    const smoothing = { type: 'ease-in-out' as const, factor: 0.5, threshold: 0.3 };
    const risk = 0.8;
    
    const smoothed = optimizer['applySmoothing'](risk, smoothing);
    
    expect(smoothed).toBeLessThan(risk);
    expect(smoothed).toBeGreaterThan(smoothing.threshold);
  });

  it('should not smooth below threshold', () => {
    const smoothing = { type: 'linear' as const, factor: 0.5, threshold: 0.5 };
    const risk = 0.3;
    
    const smoothed = optimizer['applySmoothing'](risk, smoothing);
    
    expect(smoothed).toBe(risk);
  });
});

describe('Genetic Algorithm Components', () => {
  let optimizer: RiskCurveOptimizer;
  let telemetry: TelemetryPoint[];

  beforeEach(() => {
    telemetry = generateSampleTelemetryData(100);
    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    optimizer = new RiskCurveOptimizer(telemetry, kpiTargets, 42);
  });

  it('should improve fitness over generations', () => {
    const params = {
      iterations: 20,
      populationSize: 30,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      eliteSize: 6,
      convergenceThreshold: 10,
      maxGenerations: 20,
    };

    const optimized = optimizer.optimize(params);
    
    // The optimized individual should have reasonable fitness
    expect(optimized.fitness.overallScore).toBeGreaterThan(0.1);
    expect(optimized.fitness.kpiCompliance).toBeGreaterThan(0.1);
  });

  it('should respect convergence threshold', () => {
    const params = {
      iterations: 100,
      populationSize: 20,
      mutationRate: 0.05,
      crossoverRate: 0.8,
      eliteSize: 4,
      convergenceThreshold: 1, // Very low threshold
      maxGenerations: 100,
    };

    const startTime = Date.now();
    const optimized = optimizer.optimize(params);
    const endTime = Date.now();
    
    // Should converge quickly due to low threshold
    expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    expect(optimized.fitness.overallScore).toBeGreaterThan(0);
  });

  it('should handle edge cases in telemetry data', () => {
    const edgeTelemetry: TelemetryPoint[] = [
      {
        timestamp: Date.now(),
        sessionId: 'edge-case',
        eventType: 'injury',
        residentId: 'resident-edge',
        residentLevel: 1,
        activityType: 'work',
        locationType: 'forest',
        riskFactors: {
          fatigue: 0, // Minimum value
          hunger: 0,
          health: 1, // Maximum value
          morale: 1,
        },
        outcome: {
          severity: 0.01, // Very low severity
          duration: 1,
          recoveryTime: 1,
        },
      },
      {
        timestamp: Date.now(),
        sessionId: 'edge-case',
        eventType: 'death',
        residentId: 'resident-edge',
        residentLevel: 20, // Maximum level
        activityType: 'explore',
        locationType: 'mine',
        riskFactors: {
          fatigue: 1, // Maximum value
          hunger: 1,
          health: 0.1, // Very low health
          morale: 0.1,
        },
        outcome: {
          severity: 0.99, // Very high severity
          duration: 100,
          recoveryTime: 1000,
        },
      },
    ];

    const edgeOptimizer = new RiskCurveOptimizer(
      edgeTelemetry,
      { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 },
      42
    );

    const individual = new RiskCurveIndividual();
    const fitness = edgeOptimizer.calculateFitness(individual);
    
    expect(fitness).toBeGreaterThanOrEqual(0);
    expect(fitness).toBeLessThanOrEqual(1);
  });
});

describe('Configuration Validation', () => {
  it('should validate optimized configuration structure', () => {
    const individual = new RiskCurveIndividual();
    const config = individual.genes;

    // Check required properties
    expect(config).toHaveProperty('injuryCurve');
    expect(config).toHaveProperty('deathCurve');
    expect(config).toHaveProperty('smoothing');
    expect(config).toHaveProperty('fitness');

    // Check injury curve properties
    expect(config.injuryCurve).toHaveProperty('baseRate');
    expect(config.injuryCurve).toHaveProperty('fatigueMultiplier');
    expect(config.injuryCurve).toHaveProperty('hungerMultiplier');
    expect(config.injuryCurve).toHaveProperty('healthMultiplier');
    expect(config.injuryCurve).toHaveProperty('moraleMultiplier');
    expect(config.injuryCurve).toHaveProperty('levelScaling');

    // Check death curve properties
    expect(config.deathCurve).toHaveProperty('baseRate');
    expect(config.deathCurve).toHaveProperty('fatigueMultiplier');
    expect(config.deathCurve).toHaveProperty('hungerMultiplier');
    expect(config.deathCurve).toHaveProperty('healthMultiplier');
    expect(config.deathCurve).toHaveProperty('moraleMultiplier');
    expect(config.deathCurve).toHaveProperty('levelScaling');

    // Check smoothing properties
    expect(config.smoothing).toHaveProperty('type');
    expect(config.smoothing).toHaveProperty('factor');
    expect(config.smoothing).toHaveProperty('threshold');

    // Check fitness properties
    expect(config.fitness).toHaveProperty('overallScore');
    expect(config.fitness).toHaveProperty('injuryAccuracy');
    expect(config.fitness).toHaveProperty('deathAccuracy');
    expect(config.fitness).toHaveProperty('kpiCompliance');
  });

  it('should ensure valid value ranges', () => {
    const individual = new RiskCurveIndividual();
    const config = individual.genes;

    // Injury curve ranges
    expect(config.injuryCurve.baseRate).toBeGreaterThanOrEqual(0.001);
    expect(config.injuryCurve.baseRate).toBeLessThanOrEqual(0.1);
    expect(config.injuryCurve.fatigueMultiplier).toBeGreaterThanOrEqual(0.5);
    expect(config.injuryCurve.fatigueMultiplier).toBeLessThanOrEqual(3.0);

    // Death curve ranges
    expect(config.deathCurve.baseRate).toBeGreaterThanOrEqual(0.0001);
    expect(config.deathCurve.baseRate).toBeLessThanOrEqual(0.01);
    expect(config.deathCurve.fatigueMultiplier).toBeGreaterThanOrEqual(0.5);
    expect(config.deathCurve.fatigueMultiplier).toBeLessThanOrEqual(3.0);

    // Smoothing ranges
    expect(config.smoothing.factor).toBeGreaterThanOrEqual(0.1);
    expect(config.smoothing.factor).toBeLessThanOrEqual(2.0);
    expect(config.smoothing.threshold).toBeGreaterThanOrEqual(0.1);
    expect(config.smoothing.threshold).toBeLessThanOrEqual(0.5);

    // Fitness ranges
    expect(config.fitness.overallScore).toBeGreaterThanOrEqual(0);
    expect(config.fitness.overallScore).toBeLessThanOrEqual(1);
    expect(config.fitness.injuryAccuracy).toBeGreaterThanOrEqual(0);
    expect(config.fitness.injuryAccuracy).toBeLessThanOrEqual(1);
    expect(config.fitness.deathAccuracy).toBeGreaterThanOrEqual(0);
    expect(config.fitness.deathAccuracy).toBeLessThanOrEqual(1);
    expect(config.fitness.kpiCompliance).toBeGreaterThanOrEqual(0);
    expect(config.fitness.kpiCompliance).toBeLessThanOrEqual(1);
  });
});

/**
 * Helper function to generate sample telemetry data
 */
function generateSampleTelemetryData(count: number): TelemetryPoint[] {
  const lcg = new LinearCongruentialGenerator({ seed: 12345 });
  const data: TelemetryPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      timestamp: Date.now() - lcg.nextInt(0, 86400000),
      sessionId: `session-${lcg.nextInt(1, 100)}`,
      eventType: lcg.next() < 0.8 ? 'injury' : 'death',
      residentId: `resident-${lcg.nextInt(1, 50)}`,
      residentLevel: lcg.nextInt(1, 20),
      activityType: lcg.nextChoice(['work', 'explore', 'rest', 'social']),
      locationType: lcg.nextChoice(['forest', 'village', 'mine', 'river']),
      riskFactors: {
        fatigue: lcg.nextFloat(0, 1),
        hunger: lcg.nextFloat(0, 1),
        health: lcg.nextFloat(0.3, 1),
        morale: lcg.nextFloat(0.2, 1),
      },
      outcome: {
        severity: lcg.nextFloat(0.1, 0.9),
        duration: lcg.nextInt(1, 100),
        recoveryTime: lcg.nextInt(10, 500),
      },
    });
  }
  
  return data;
}

describe('Performance and Edge Cases', () => {
  it('should handle large telemetry datasets efficiently', () => {
    const largeTelemetry = generateSampleTelemetryData(1000);
    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    const optimizer = new RiskCurveOptimizer(largeTelemetry, kpiTargets, 42);

    const startTime = Date.now();
    const individual = new RiskCurveIndividual();
    const fitness = optimizer.calculateFitness(individual);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second for 1000 points
    expect(fitness).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty telemetry gracefully', () => {
    const emptyTelemetry: TelemetryPoint[] = [];
    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    const optimizer = new RiskCurveOptimizer(emptyTelemetry, kpiTargets, 42);

    const individual = new RiskCurveIndividual();
    const fitness = optimizer.calculateFitness(individual);

    expect(fitness).toBeGreaterThanOrEqual(0);
    expect(fitness).toBeLessThanOrEqual(1);
  });

  it('should handle single telemetry point', () => {
    const singleTelemetry: TelemetryPoint[] = [
      {
        timestamp: Date.now(),
        sessionId: 'single',
        eventType: 'injury',
        residentId: 'resident-single',
        residentLevel: 10,
        activityType: 'work',
        locationType: 'forest',
        riskFactors: {
          fatigue: 0.5,
          hunger: 0.5,
          health: 0.5,
          morale: 0.5,
        },
        outcome: {
          severity: 0.5,
          duration: 50,
          recoveryTime: 250,
        },
      },
    ];

    const kpiTargets = { maxInjuryRate: 0.15, maxDeathRate: 0.02, targetOverallRisk: 0.1 };
    const optimizer = new RiskCurveOptimizer(singleTelemetry, kpiTargets, 42);

    const individual = new RiskCurveIndividual();
    const fitness = optimizer.calculateFitness(individual);

    expect(fitness).toBeGreaterThanOrEqual(0);
    expect(fitness).toBeLessThanOrEqual(1);
  });
});
