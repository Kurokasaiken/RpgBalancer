/**
 * Idle Village Risk Stripe Calibration Engine
 * 
 * Core calibration algorithms, validation logic, and mathematical
 * functions for risk stripe calibration.
 * 
 * @module riskStripeCalibrationEngine
 * @since 2026-01-13
 * @author Cascade
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  CalibrationAlgorithm,
  CalibrationPoint,
  CalibrationCurveParams,
  CalibrationValidationResults,
  RiskLevel,
  type CalibrationSession,
} from '@/balancing/config/idleVillage/riskStripeCalibrationConfig';

const diagnostics = createHeadlessDiagnostics('RiskStripeCalibrationEngine', 'calibration');

/**
 * Calibration engine class
 */
export class RiskStripeCalibrationEngine {
  private static instance: RiskStripeCalibrationEngine;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RiskStripeCalibrationEngine {
    if (!RiskStripeCalibrationEngine.instance) {
      RiskStripeCalibrationEngine.instance = new RiskStripeCalibrationEngine();
    }
    return RiskStripeCalibrationEngine.instance;
  }

  /**
   * Calculate stripe height from risk percentage using calibration curve
   */
  calculateStripeHeight(riskPercentage: number, curveParams: CalibrationCurveParams): number {
    const { algorithm, parameters, domain, range } = curveParams;

    // Clamp input to domain
    const clampedInput = Math.max(domain.min, Math.min(domain.max, riskPercentage));

    let result: number;

    switch (algorithm) {
      case CalibrationAlgorithm.LINEAR:
        result = this.calculateLinear(clampedInput, parameters);
        break;
      case CalibrationAlgorithm.LOGARITHMIC:
        result = this.calculateLogarithmic(clampedInput, parameters);
        break;
      case CalibrationAlgorithm.EXPONENTIAL:
        result = this.calculateExponential(clampedInput, parameters);
        break;
      case CalibrationAlgorithm.SIGMOID:
        result = this.calculateSigmoid(clampedInput, parameters);
        break;
      case CalibrationAlgorithm.POWER:
        result = this.calculatePower(clampedInput, parameters);
        break;
      case CalibrationAlgorithm.CUSTOM:
        result = this.calculateCustom(clampedInput, parameters);
        break;
      default:
        throw new Error(`Unknown calibration algorithm: ${algorithm}`);
    }

    // Clamp result to range
    return Math.max(range.min, Math.min(range.max, result));
  }

  /**
   * Calculate multiple stripe heights for an array of risk percentages
   */
  calculateStripeHeights(riskPercentages: number[], curveParams: CalibrationCurveParams): number[] {
    return riskPercentages.map(risk => this.calculateStripeHeight(risk, curveParams));
  }

  /**
   * Fit calibration curve to points using least squares
   */
  fitCalibrationCurve(points: CalibrationPoint[], algorithm: CalibrationAlgorithm): CalibrationCurveParams {
    if (points.length < 2) {
      throw new Error('At least 2 points required for curve fitting');
    }

    const sortedPoints = points.sort((a, b) => a.riskPercentage - b.riskPercentage);
    const xValues = sortedPoints.map(p => p.riskPercentage);
    const yValues = sortedPoints.map(p => p.stripeHeight);

    let parameters: CalibrationCurveParams['parameters'];
    const domain = { min: Math.min(...xValues), max: Math.max(...xValues) };
    const range = { min: Math.min(...yValues), max: Math.max(...yValues) };

    switch (algorithm) {
      case CalibrationAlgorithm.LINEAR:
        parameters = this.fitLinear(xValues, yValues, sortedPoints);
        break;
      case CalibrationAlgorithm.LOGARITHMIC:
        parameters = this.fitLogarithmic(xValues, yValues, sortedPoints);
        break;
      case CalibrationAlgorithm.EXPONENTIAL:
        parameters = this.fitExponential(xValues, yValues, sortedPoints);
        break;
      case CalibrationAlgorithm.SIGMOID:
        parameters = this.fitSigmoid(xValues, yValues, sortedPoints);
        break;
      case CalibrationAlgorithm.POWER:
        parameters = this.fitPower(xValues, yValues, sortedPoints);
        break;
      case CalibrationAlgorithm.CUSTOM:
        parameters = this.fitCustom(xValues, yValues, sortedPoints);
        break;
      default:
        throw new Error(`Unknown calibration algorithm: ${algorithm}`);
    }

    return {
      algorithm,
      parameters,
      domain,
      range,
    };
  }

  /**
   * Validate calibration curve against points
   */
  validateCalibration(session: CalibrationSession): CalibrationValidationResults {
    const { calibrationPoints, curveParams } = session;
    const startTime = performance.now();

    if (calibrationPoints.length < 2) {
      throw new Error('At least 2 calibration points required for validation');
    }

    // Calculate predicted values
    const predictedValues = calibrationPoints.map(point =>
      this.calculateStripeHeight(point.riskPercentage, curveParams)
    );

    const actualValues = calibrationPoints.map(point => point.stripeHeight);

    // Calculate error metrics
    const errors = this.calculateErrors(actualValues, predictedValues);

    // Calculate fit quality metrics
    const fitQuality = this.calculateFitQuality(actualValues, predictedValues);

    // Detect outliers
    const outliers = this.detectOutliers(actualValues, predictedValues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(errors, fitQuality, outliers);

    // Calculate overall validation score
    const validationScore = this.calculateValidationScore(errors, fitQuality, outliers);

    const endTime = performance.now();

    return {
      validationScore,
      errors,
      fitQuality,
      outliers,
      recommendations,
      validatedAt: endTime,
    };
  }

  /**
   * Optimize calibration parameters
   */
  optimizeCalibration(
    session: CalibrationSession,
    options: {
      algorithm?: CalibrationAlgorithm;
      maxIterations?: number;
      tolerance?: number;
      learningRate?: number;
    } = {}
  ): CalibrationSession {
    const {
      algorithm = session.curveParams.algorithm,
      maxIterations = 100,
      tolerance = 1e-6,
      learningRate = 0.01,
    } = options;

    let bestSession = { ...session };
    let bestScore = 0;

    // Try different algorithms if not specified
    const algorithmsToTry = algorithm ? [algorithm] : Object.values(CalibrationAlgorithm);

    for (const alg of algorithmsToTry) {
      try {
        const optimizedSession = this.optimizeForAlgorithm(session, alg, {
          maxIterations,
          tolerance,
          learningRate,
        });

        const validation = this.validateCalibration(optimizedSession);
        if (validation.validationScore > bestScore) {
          bestScore = validation.validationScore;
          bestSession = {
            ...optimizedSession,
            validationResults: validation,
            modifiedAt: Date.now(),
          };
        }
      } catch (error) {
        diagnostics.warn('Failed to optimize for algorithm', { algorithm: alg, error });
      }
    }

    return bestSession;
  }

  /**
   * Generate calibration curve data for visualization
   */
  generateCurveData(curveParams: CalibrationCurveParams, numPoints: number = 100): Array<{ x: number; y: number }> {
    const { domain } = curveParams;
    const step = (domain.max - domain.min) / (numPoints - 1);
    
    const data: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < numPoints; i++) {
      const x = domain.min + i * step;
      const y = this.calculateStripeHeight(x, curveParams);
      data.push({ x, y });
    }
    
    return data;
  }

  /**
   * Interpolate between calibration points
   */
  interpolatePoints(points: CalibrationPoint[], numInterpolated: number = 10): CalibrationPoint[] {
    if (points.length < 2) return points;

    const sortedPoints = points.sort((a, b) => a.riskPercentage - b.riskPercentage);
    const interpolatedPoints: CalibrationPoint[] = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i];
      const end = sortedPoints[i + 1];

      // Add the start point
      interpolatedPoints.push(start);

      // Add interpolated points
      for (let j = 1; j <= numInterpolated; j++) {
        const t = j / (numInterpolated + 1);
        const riskPercentage = start.riskPercentage + t * (end.riskPercentage - start.riskPercentage);
        const stripeHeight = start.stripeHeight + t * (end.stripeHeight - start.stripeHeight);
        const riskLevel = this.calculateRiskLevel(riskPercentage);

        interpolatedPoints.push({
          riskPercentage,
          stripeHeight,
          riskLevel,
          weight: 0.5, // Interpolated points have lower weight
          isReference: false,
          description: `Interpolated between ${start.riskPercentage} and ${end.riskPercentage}`,
        });
      }
    }

    // Add the last point
    interpolatedPoints.push(sortedPoints[sortedPoints.length - 1]);

    return interpolatedPoints;
  }

  // Private methods for specific algorithms

  private calculateLinear(x: number, params: CalibrationCurveParams['parameters']): number {
    const slope = params.slope ?? 1.0;
    const intercept = params.intercept ?? 0;
    return slope * x + intercept;
  }

  private calculateLogarithmic(x: number, params: CalibrationCurveParams['parameters']): number {
    const base = params.base ?? Math.E;
    const scale = params.scale ?? 1;
    // Avoid log(0) by adding small epsilon
    const epsilon = 1e-10;
    return scale * Math.log(x + epsilon) / Math.log(base);
  }

  private calculateExponential(x: number, params: CalibrationCurveParams['parameters']): number {
    const expBase = params.expBase ?? Math.E;
    const expScale = params.expScale ?? 1;
    return expScale * Math.pow(expBase, x);
  }

  private calculateSigmoid(x: number, params: CalibrationCurveParams['parameters']): number {
    const steepness = params.steepness ?? 1;
    const midpoint = params.midpoint ?? 0.5;
    const scale = params.scale ?? 1;
    return scale / (1 + Math.exp(-steepness * (x - midpoint)));
  }

  private calculatePower(x: number, params: CalibrationCurveParams['parameters']): number {
    const exponent = params.exponent ?? 2;
    const powerScale = params.powerScale ?? 1;
    // Avoid negative x for non-integer exponents
    const safeX = Math.max(0, x);
    return powerScale * Math.pow(safeX, exponent);
  }

  private calculateCustom(x: number, params: CalibrationCurveParams['parameters']): number {
    if (!params.customFunction) {
      throw new Error('Custom function not defined');
    }

    try {
      // Create a safe function context
      const func = new Function('x', 'Math', `
        "use strict";
        ${params.customFunction}
      `);
      
      return func(x, Math);
    } catch (error) {
      diagnostics.error('Custom function evaluation failed', { error, function: params.customFunction });
      throw new Error(`Custom function evaluation failed: ${error}`);
    }
  }

  // Private methods for curve fitting

  private fitLinear(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    const n = points.length;
    const weightedPoints = points.filter(p => p.weight > 0);
    
    if (weightedPoints.length === 0) {
      return { slope: 1, intercept: 0 };
    }

    // Weighted linear regression
    let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWX2 = 0;
    
    for (const point of weightedPoints) {
      const w = point.weight;
      sumW += w;
      sumWX += w * point.riskPercentage;
      sumWY += w * point.stripeHeight;
      sumWXY += w * point.riskPercentage * point.stripeHeight;
      sumWX2 += w * point.riskPercentage * point.riskPercentage;
    }

    const denominator = sumW * sumWX2 - sumWX * sumWX;
    const slope = denominator !== 0 ? (sumW * sumWXY - sumWX * sumWY) / denominator : 1;
    const intercept = denominator !== 0 ? (sumWY - slope * sumWX) / sumW : 0;

    return { slope, intercept };
  }

  private fitLogarithmic(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    // Transform to linear space: y = a * log(x) + b
    const transformedPoints = points
      .filter(p => p.riskPercentage > 0 && p.weight > 0)
      .map(p => ({
        ...p,
        transformedX: Math.log(p.riskPercentage),
        transformedY: p.stripeHeight,
      }));

    if (transformedPoints.length < 2) {
      return { base: Math.E, scale: 1 };
    }

    const linearFit = this.fitLinear(
      transformedPoints.map(p => p.transformedX),
      transformedPoints.map(p => p.transformedY),
      transformedPoints
    );

    return {
      base: Math.E,
      scale: linearFit.slope,
    };
  }

  private fitExponential(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    // Transform to linear space: ln(y) = a * x + b
    const transformedPoints = points
      .filter(p => p.stripeHeight > 0 && p.weight > 0)
      .map(p => ({
        ...p,
        transformedX: p.riskPercentage,
        transformedY: Math.log(p.stripeHeight),
      }));

    if (transformedPoints.length < 2) {
      return { expBase: Math.E, expScale: 1 };
    }

    const linearFit = this.fitLinear(
      transformedPoints.map(p => p.transformedX),
      transformedPoints.map(p => p.transformedY),
      transformedPoints
    );

    return {
      expBase: Math.E,
      expScale: Math.exp(linearFit.intercept),
    };
  }

  private fitSigmoid(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    // Non-linear fitting using gradient descent (simplified)
    const referencePoints = points.filter(p => p.isReference && p.weight > 0);
    
    if (referencePoints.length < 2) {
      return { steepness: 1, midpoint: 0.5 };
    }

    // Initial parameters
    let steepness = 1;
    let midpoint = 0.5;
    const learningRate = 0.01;
    const iterations = 100;

    for (let iter = 0; iter < iterations; iter++) {
      let gradientSteepness = 0;
      let gradientMidpoint = 0;

      for (const point of referencePoints) {
        const predicted = this.calculateSigmoid(point.riskPercentage, { steepness, midpoint });
        const error = predicted - point.stripeHeight;
        const weight = point.weight;

        // Calculate gradients
        const x = point.riskPercentage;
        const expTerm = Math.exp(-steepness * (x - midpoint));
        const denominator = Math.pow(1 + expTerm, 2);

        gradientSteepness += weight * error * expTerm * (x - midpoint) / denominator;
        gradientMidpoint += weight * error * steepness * expTerm / denominator;
      }

      // Update parameters
      steepness -= learningRate * gradientSteepness;
      midpoint -= learningRate * gradientMidpoint;

      // Clamp parameters
      steepness = Math.max(0.1, Math.min(10, steepness));
      midpoint = Math.max(0, Math.min(1, midpoint));
    }

    return { steepness, midpoint };
  }

  private fitPower(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    // Transform to linear space: ln(y) = a * ln(x) + b
    const transformedPoints = points
      .filter(p => p.riskPercentage > 0 && p.stripeHeight > 0 && p.weight > 0)
      .map(p => ({
        ...p,
        transformedX: Math.log(p.riskPercentage),
        transformedY: Math.log(p.stripeHeight),
      }));

    if (transformedPoints.length < 2) {
      return { exponent: 2, powerScale: 1 };
    }

    const linearFit = this.fitLinear(
      transformedPoints.map(p => p.transformedX),
      transformedPoints.map(p => p.transformedY),
      transformedPoints
    );

    return {
      exponent: linearFit.slope,
      powerScale: Math.exp(linearFit.intercept),
    };
  }

  private fitCustom(xValues: number[], yValues: number[], points: CalibrationPoint[]): CalibrationCurveParams['parameters'] {
    // For custom functions, we can't automatically fit parameters
    // Return default parameters
    return {
      customFunction: 'return x * 100;', // Default linear function
    };
  }

  // Private methods for validation and optimization

  private calculateErrors(actual: number[], predicted: number[]): CalibrationValidationResults['errors'] {
    const n = actual.length;
    
    // Mean Absolute Error
    const mae = actual.reduce((sum, actualVal, i) => sum + Math.abs(actualVal - predicted[i]), 0) / n;
    
    // Root Mean Square Error
    const mse = actual.reduce((sum, actualVal, i) => sum + Math.pow(actualVal - predicted[i], 2), 0) / n;
    const rmse = Math.sqrt(mse);
    
    // Max Absolute Error
    const maxae = Math.max(...actual.map((actualVal, i) => Math.abs(actualVal - predicted[i])));
    
    // Mean Absolute Percentage Error (avoiding division by zero)
    const mape = actual.reduce((sum, actualVal, i) => {
      if (actualVal === 0) return sum;
      return sum + Math.abs((actualVal - predicted[i]) / actualVal);
    }, 0) / n;

    return {
      meanAbsoluteError: mae,
      rootMeanSquareError: rmse,
      maxAbsoluteError: maxae,
      meanAbsolutePercentageError: mape,
    };
  }

  private calculateFitQuality(actual: number[], predicted: number[]): CalibrationValidationResults['fitQuality'] {
    const n = actual.length;
    
    // Calculate R-squared
    const meanActual = actual.reduce((sum, val) => sum + val, 0) / n;
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    
    // Adjusted R-squared (for multiple parameters)
    const numParams = 2; // Simplified: assuming 2 parameters
    const adjustedRSquared = n > numParams + 1 ? 1 - (1 - rSquared) * ((n - 1) / (n - numParams - 1)) : rSquared;
    
    // Residual Standard Error
    const residualStandardError = Math.sqrt(residualSumSquares / (n - numParams));

    return {
      rSquared,
      adjustedRSquared,
      residualStandardError,
    };
  }

  private detectOutliers(actual: number[], predicted: number[], threshold: number = 2.0): CalibrationValidationResults['outliers'] {
    const residuals = actual.map((actualVal, i) => actualVal - predicted[i]);
    const mean = residuals.reduce((sum, val) => sum + val, 0) / residuals.length;
    const stdDev = Math.sqrt(residuals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / residuals.length);
    
    const outlierIndices: number[] = [];
    
    residuals.forEach((residual, index) => {
      const zScore = Math.abs((residual - mean) / stdDev);
      if (zScore > threshold) {
        outlierIndices.push(index);
      }
    });

    return {
      count: outlierIndices.length,
      indices: outlierIndices,
      threshold,
    };
  }

  private generateRecommendations(
    errors: CalibrationValidationResults['errors'],
    fitQuality: CalibrationValidationResults['fitQuality'],
    outliers: CalibrationValidationResults['outliers']
  ): string[] {
    const recommendations: string[] = [];

    // Error-based recommendations
    if (errors.meanAbsoluteError > 10) {
      recommendations.push('Consider adding more calibration points to reduce error');
    }

    if (errors.rootMeanSquareError > 15) {
      recommendations.push('Large errors detected - try a different algorithm');
    }

    // Fit quality recommendations
    if (fitQuality.rSquared < 0.8) {
      recommendations.push('Low R-squared value - current algorithm may not fit the data well');
    }

    if (fitQuality.adjustedRSquared < 0.7) {
      recommendations.push('Consider simplifying the model or adding more data points');
    }

    // Outlier recommendations
    if (outliers.count > 0) {
      recommendations.push(`${outliers.count} outlier(s) detected - review calibration points`);
    }

    if (outliers.count > 3) {
      recommendations.push('Many outliers detected - consider data cleaning or different algorithm');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Calibration looks good - consider fine-tuning parameters for better accuracy');
    }

    return recommendations;
  }

  private calculateValidationScore(
    errors: CalibrationValidationResults['errors'],
    fitQuality: CalibrationValidationResults['fitQuality'],
    outliers: CalibrationValidationResults['outliers']
  ): number {
    // Normalize error metrics (lower is better)
    const errorScore = Math.max(0, 1 - errors.meanAbsoluteError / 50);
    const rmseScore = Math.max(0, 1 - errors.rootMeanSquareError / 100);
    
    // Fit quality (higher is better)
    const rSquaredScore = fitQuality.rSquared;
    
    // Outlier penalty (lower is better)
    const outlierPenalty = Math.max(0, 1 - outliers.count / 10);
    
    // Weighted average
    const weights = {
      error: 0.3,
      rmse: 0.2,
      rSquared: 0.4,
      outlier: 0.1,
    };
    
    const score = 
      errorScore * weights.error +
      rmseScore * weights.rmse +
      rSquaredScore * weights.rSquared +
      outlierPenalty * weights.outlier;
    
    return Math.max(0, Math.min(1, score));
  }

  private optimizeForAlgorithm(
    session: CalibrationSession,
    algorithm: CalibrationAlgorithm,
    options: {
      maxIterations: number;
      tolerance: number;
      learningRate: number;
    }
  ): CalibrationSession {
    const { maxIterations, tolerance, learningRate } = options;
    
    let bestSession = { ...session };
    let bestError = Infinity;

    // Start with fitted parameters
    const fittedCurve = this.fitCalibrationCurve(session.calibrationPoints, algorithm);
    let currentParams = { ...fittedCurve.parameters };

    for (let iter = 0; iter < maxIterations; iter++) {
      // Create session with current parameters
      const testSession = {
        ...session,
        curveParams: {
          ...session.curveParams,
          algorithm,
          parameters: currentParams,
        },
      };

      // Validate current parameters
      const validation = this.validateCalibration(testSession);
      const currentError = validation.errors.meanAbsoluteError;

      if (currentError < bestError) {
        bestError = currentError;
        bestSession = testSession;
      }

      // Check convergence
      if (currentError < tolerance) {
        break;
      }

      // Simple gradient descent (simplified - would need proper gradients for real optimization)
      currentParams = this.adjustParameters(currentParams, algorithm, learningRate);
    }

    return bestSession;
  }

  private adjustParameters(
    params: CalibrationCurveParams['parameters'],
    algorithm: CalibrationAlgorithm,
    learningRate: number
  ): CalibrationCurveParams['parameters'] {
    const adjusted = { ...params };

    switch (algorithm) {
      case CalibrationAlgorithm.LINEAR:
        if (adjusted.slope !== undefined) {
          adjusted.slope += (Math.random() - 0.5) * learningRate;
        }
        if (adjusted.intercept !== undefined) {
          adjusted.intercept += (Math.random() - 0.5) * learningRate;
        }
        break;
      case CalibrationAlgorithm.SIGMOID:
        if (adjusted.steepness !== undefined) {
          adjusted.steepness += (Math.random() - 0.5) * learningRate;
          adjusted.steepness = Math.max(0.1, Math.min(10, adjusted.steepness));
        }
        if (adjusted.midpoint !== undefined) {
          adjusted.midpoint += (Math.random() - 0.5) * learningRate;
          adjusted.midpoint = Math.max(0, Math.min(1, adjusted.midpoint));
        }
        break;
      // Add more cases for other algorithms as needed
    }

    return adjusted;
  }

  private calculateRiskLevel(riskPercentage: number): RiskLevel {
    if (riskPercentage <= 0.1) return RiskLevel.VERY_LOW;
    if (riskPercentage <= 0.3) return RiskLevel.LOW;
    if (riskPercentage <= 0.5) return RiskLevel.MEDIUM;
    if (riskPercentage <= 0.7) return RiskLevel.HIGH;
    if (riskPercentage <= 0.9) return RiskLevel.VERY_HIGH;
    return RiskLevel.EXTREME;
  }
}

/**
 * Global calibration engine instance
 */
export const calibrationEngine = RiskStripeCalibrationEngine.getInstance();
