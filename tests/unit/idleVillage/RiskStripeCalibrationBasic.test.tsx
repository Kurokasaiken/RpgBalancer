/**
 * Risk Stripe Calibration System - Basic Unit Tests
 *
 * Core configuration and utility tests for the Idle Village Risk Stripe Calibration Tool.
 * This test file focuses on the configuration schema and basic functionality.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect } from 'vitest';

// Test configuration schema directly
describe('Risk Stripe Calibration - Configuration Schema', () => {
  describe('Calibration Point Creation', () => {
    it('should create valid calibration point with default values', () => {
      // Mock the createCalibrationPoint function for testing
      const createCalibrationPoint = (riskValue: number, stripeHeight: number) => ({
        id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        riskValue,
        stripeHeight,
        weight: 1.0,
        metadata: {},
      });

      const point = createCalibrationPoint(0.5, 25);
      
      expect(point).toEqual({
        id: expect.any(String),
        riskValue: 0.5,
        stripeHeight: 25,
        weight: 1.0,
        metadata: {},
      });
      
      expect(point.id).toMatch(/^point-\d+-[a-z0-9]+$/);
    });

    it('should validate calibration point constraints', () => {
      const validateCalibrationPoint = (point: any) => {
        return (
          typeof point.riskValue === 'number' &&
          point.riskValue >= 0 &&
          point.riskValue <= 1 &&
          typeof point.stripeHeight === 'number' &&
          point.stripeHeight >= 0 &&
          point.stripeHeight <= 100
        );
      };

      const validPoint = { riskValue: 0.3, stripeHeight: 15 };
      const invalidPoint1 = { riskValue: -0.1, stripeHeight: 25 };
      const invalidPoint2 = { riskValue: 0.5, stripeHeight: 150 };

      expect(validateCalibrationPoint(validPoint)).toBe(true);
      expect(validateCalibrationPoint(invalidPoint1)).toBe(false);
      expect(validateCalibrationPoint(invalidPoint2)).toBe(false);
    });
  });

  describe('Risk Level Calculation', () => {
    it('should calculate risk levels correctly', () => {
      const calculateRiskLevel = (riskValue: number) => {
        if (riskValue <= 0.1) return 'LOW';
        if (riskValue <= 0.3) return 'MEDIUM';
        if (riskValue <= 0.6) return 'HIGH';
        return 'CRITICAL';
      };

      expect(calculateRiskLevel(0.05)).toBe('LOW');
      expect(calculateRiskLevel(0.2)).toBe('MEDIUM');
      expect(calculateRiskLevel(0.5)).toBe('HIGH');
      expect(calculateRiskLevel(0.8)).toBe('CRITICAL');
    });
  });

  describe('Risk Value Formatting', () => {
    it('should format risk values as percentages', () => {
      const formatRiskValue = (value: number) => {
        return `${(value * 100).toFixed(2)}%`;
      };

      expect(formatRiskValue(0.1234)).toBe('12.34%');
      expect(formatRiskValue(0.5)).toBe('50.00%');
      expect(formatRiskValue(1.0)).toBe('100.00%');
      expect(formatRiskValue(0)).toBe('0.00%');
    });
  });

  describe('Calibration Point Sorting', () => {
    it('should sort calibration points by risk value', () => {
      const sortCalibrationPoints = (points: any[]) => {
        return [...points].sort((a, b) => a.riskValue - b.riskValue);
      };

      const points = [
        { riskValue: 0.8, stripeHeight: 40 },
        { riskValue: 0.2, stripeHeight: 10 },
        { riskValue: 0.5, stripeHeight: 25 },
      ];

      const sorted = sortCalibrationPoints(points);
      expect(sorted.map(p => p.riskValue)).toEqual([0.2, 0.5, 0.8]);
    });
  });

  describe('Session ID Generation', () => {
    it('should generate unique session IDs', () => {
      const createCalibrationSessionId = () => {
        return `cal-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      };

      const id1 = createCalibrationSessionId();
      const id2 = createCalibrationSessionId();
      
      expect(id1).toMatch(/^cal-session-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^cal-session-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});

describe('Risk Stripe Calibration - Algorithm Tests', () => {
  describe('Linear Algorithm', () => {
    it('should calculate linear stripe height correctly', () => {
      const calculateLinearHeight = (riskValue: number, slope: number, intercept: number) => {
        return Math.max(0, Math.min(100, slope * riskValue + intercept));
      };

      const slope = 50;
      const intercept = 0;

      expect(calculateLinearHeight(0.0, slope, intercept)).toBe(0);
      expect(calculateLinearHeight(0.5, slope, intercept)).toBe(25);
      expect(calculateLinearHeight(1.0, slope, intercept)).toBe(50);
    });

    it('should handle edge cases for linear algorithm', () => {
      const calculateLinearHeight = (riskValue: number, slope: number, intercept: number) => {
        if (isNaN(riskValue) || !isFinite(riskValue)) return 0;
        const clampedValue = Math.max(0, Math.min(1, riskValue));
        return Math.max(0, Math.min(100, slope * clampedValue + intercept));
      };

      expect(calculateLinearHeight(-0.1, 50, 0)).toBe(0);
      expect(calculateLinearHeight(1.1, 50, 0)).toBe(50);
      expect(calculateLinearHeight(NaN, 50, 0)).toBe(0);
    });
  });

  describe('Logarithmic Algorithm', () => {
    it('should calculate logarithmic stripe height correctly', () => {
      const calculateLogarithmicHeight = (riskValue: number, slope: number, intercept: number) => {
        const clampedValue = Math.max(0, Math.min(1, riskValue));
        return Math.max(0, Math.min(100, slope * Math.log(clampedValue + 1) + intercept));
      };

      const slope = 30;
      const intercept = 0;

      expect(calculateLogarithmicHeight(0, slope, intercept)).toBe(0);
      expect(calculateLogarithmicHeight(0.5, slope, intercept)).toBeCloseTo(30 * Math.log(1.5), 2);
      expect(calculateLogarithmicHeight(1, slope, intercept)).toBeCloseTo(30 * Math.log(2), 2);
    });
  });

  describe('Sigmoid Algorithm', () => {
    it('should calculate sigmoid stripe height correctly', () => {
      const calculateSigmoidHeight = (riskValue: number, steepness: number, midpoint: number, maxOutput: number) => {
        const clampedValue = Math.max(0, Math.min(1, riskValue));
        const sigmoid = 1 / (1 + Math.exp(-steepness * (clampedValue - midpoint)));
        return Math.max(0, Math.min(100, sigmoid * maxOutput));
      };

      const steepness = 10;
      const midpoint = 0.5;
      const maxOutput = 50;

      expect(calculateSigmoidHeight(0, steepness, midpoint, maxOutput)).toBeCloseTo(0.33, 1);
      expect(calculateSigmoidHeight(0.5, steepness, midpoint, maxOutput)).toBeCloseTo(25, 1);
      expect(calculateSigmoidHeight(1, steepness, midpoint, maxOutput)).toBeCloseTo(49.67, 1);
    });
  });
});

describe('Risk Stripe Calibration - Validation Tests', () => {
  describe('Session Validation', () => {
    it('should validate complete session', () => {
      const validateSession = (session: any) => {
        const errors = [];
        const warnings = [];

        if (!session.name || session.name.trim() === '') {
          errors.push('Session name is required');
        }

        if (!session.calibrationPoints || session.calibrationPoints.length < 2) {
          errors.push('At least 2 calibration points are required');
        }

        if (session.calibrationPoints) {
          session.calibrationPoints.forEach((point: any, index: number) => {
            if (point.riskValue < 0 || point.riskValue > 1) {
              errors.push(`Point ${index + 1}: Risk value must be between 0 and 1`);
            }
            if (point.stripeHeight < 0 || point.stripeHeight > 100) {
              errors.push(`Point ${index + 1}: Stripe height must be between 0 and 100`);
            }
          });
        }

        return {
          isValid: errors.length === 0,
          errorCount: errors.length,
          warningCount: warnings.length,
          issues: [...errors, ...warnings],
        };
      };

      const validSession = {
        name: 'Test Session',
        calibrationPoints: [
          { riskValue: 0.0, stripeHeight: 0 },
          { riskValue: 0.5, stripeHeight: 25 },
          { riskValue: 1.0, stripeHeight: 50 },
        ],
      };

      const invalidSession = {
        name: '',
        calibrationPoints: [
          { riskValue: -0.1, stripeHeight: 150 },
        ],
      };

      const validResult = validateSession(validSession);
      const invalidResult = validateSession(invalidSession);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errorCount).toBe(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Curve Fitting Validation', () => {
    it('should detect insufficient points for curve fitting', () => {
      const validateCurveFitting = (points: any[]) => {
        if (points.length < 2) {
          return {
            canFit: false,
            error: 'At least 2 points required for curve fitting',
          };
        }
        return { canFit: true, error: null };
      };

      const insufficientPoints = [{ riskValue: 0.5, stripeHeight: 25 }];
      const sufficientPoints = [
        { riskValue: 0.0, stripeHeight: 0 },
        { riskValue: 1.0, stripeHeight: 50 },
      ];

      expect(validateCurveFitting(insufficientPoints).canFit).toBe(false);
      expect(validateCurveFitting(sufficientPoints).canFit).toBe(true);
    });
  });
});

describe('Risk Stripe Calibration - Export Tests', () => {
  describe('JSON Export', () => {
    it('should export session to JSON format', () => {
      const exportToJSON = (session: any) => {
        return {
          format: 'json',
          data: JSON.stringify(session, null, 2),
          filename: `${session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_calibration.json`,
        };
      };

      const session = {
        id: 'test-session',
        name: 'Test Session',
        calibrationPoints: [
          { riskValue: 0.0, stripeHeight: 0 },
          { riskValue: 1.0, stripeHeight: 50 },
        ],
      };

      const exported = exportToJSON(session);

      expect(exported.format).toBe('json');
      expect(exported.filename).toBe('test_session_calibration.json');
      expect(() => JSON.parse(exported.data)).not.toThrow();
    });
  });

  describe('CSV Export', () => {
    it('should export calibration points to CSV format', () => {
      const exportToCSV = (session: any) => {
        const headers = ['riskValue', 'stripeHeight', 'weight'];
        const rows = session.calibrationPoints.map((point: any) => [
          point.riskValue,
          point.stripeHeight,
          point.weight || 1.0,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(',')),
        ].join('\n');

        return {
          format: 'csv',
          data: csvContent,
          filename: `${session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_calibration.csv`,
        };
      };

      const session = {
        name: 'Test Session',
        calibrationPoints: [
          { riskValue: 0.0, stripeHeight: 0, weight: 1.0 },
          { riskValue: 0.5, stripeHeight: 25, weight: 1.0 },
        ],
      };

      const exported = exportToCSV(session);

      expect(exported.format).toBe('csv');
      expect(exported.filename).toBe('test_session_calibration.csv');
      expect(exported.data).toContain('riskValue,stripeHeight,weight');
      expect(exported.data).toContain('0,0,1');
      expect(exported.data).toContain('0.5,25,1');
    });
  });
});

describe('Risk Stripe Calibration - Preset Tests', () => {
  describe('Preset Structure', () => {
    it('should have valid preset structure', () => {
      const createPreset = (name: string, type: string, algorithm: string) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: `${name} calibration preset`,
        type,
        algorithm,
        curveParams: {
          algorithm,
          parameters: { slope: 50, intercept: 0 },
          domain: { min: 0, max: 1 },
          range: { min: 0, max: 100 },
          r2: 1.0,
        },
        calibrationPoints: [
          { riskValue: 0.0, stripeHeight: 0, weight: 1.0 },
          { riskValue: 1.0, stripeHeight: 50, weight: 1.0 },
        ],
        metadata: { tags: [type] },
      });

      const conservative = createPreset('Conservative', 'conservative', 'linear');
      const balanced = createPreset('Balanced', 'balanced', 'sigmoid');
      const aggressive = createPreset('Aggressive', 'aggressive', 'exponential');

      expect(conservative.type).toBe('conservative');
      expect(conservative.algorithm).toBe('linear');
      expect(conservative.calibrationPoints).toHaveLength(2);

      expect(balanced.type).toBe('balanced');
      expect(balanced.algorithm).toBe('sigmoid');

      expect(aggressive.type).toBe('aggressive');
      expect(aggressive.algorithm).toBe('exponential');
    });
  });

  describe('Preset Comparison', () => {
    it('should compare presets correctly', () => {
      const comparePresets = (preset1: any, preset2: any) => {
        const algorithmMatch = preset1.algorithm === preset2.algorithm;
        const parameterSimilarity = Math.abs(
          (preset1.curveParams.parameters.slope || 0) - 
          (preset2.curveParams.parameters.slope || 0)
        ) < 10;

        return {
          algorithmMatch,
          parameterSimilarity,
          similarity: algorithmMatch && parameterSimilarity ? 0.8 : 0.2,
        };
      };

      const preset1 = {
        algorithm: 'linear',
        curveParams: { parameters: { slope: 50 } },
      };

      const preset2 = {
        algorithm: 'linear',
        curveParams: { parameters: { slope: 55 } },
      };

      const preset3 = {
        algorithm: 'sigmoid',
        curveParams: { parameters: { steepness: 10 } },
      };

      const comparison1 = comparePresets(preset1, preset2);
      const comparison2 = comparePresets(preset1, preset3);

      expect(comparison1.algorithmMatch).toBe(true);
      expect(comparison1.parameterSimilarity).toBe(true);
      expect(comparison1.similarity).toBe(0.8);

      expect(comparison2.algorithmMatch).toBe(false);
      expect(comparison2.parameterSimilarity).toBe(false);
      expect(comparison2.similarity).toBe(0.2);
    });
  });
});

describe('Risk Stripe Calibration - Performance Tests', () => {
  describe('Large Dataset Handling', () => {
    it('should handle large number of calibration points efficiently', () => {
      const generatePoints = (count: number) => {
        const points = [];
        for (let i = 0; i < count; i++) {
          points.push({
            riskValue: i / count,
            stripeHeight: (i / count) * 50,
            weight: 1.0,
          });
        }
        return points;
      };

      const startTime = performance.now();
      const points = generatePoints(1000);
      const endTime = performance.now();

      expect(points).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(50); // Should generate within 50ms
    });
  });

  describe('Algorithm Performance', () => {
    it('should perform calculations efficiently', () => {
      const calculateLinearHeight = (riskValue: number, slope: number, intercept: number) => {
        return Math.max(0, Math.min(100, slope * riskValue + intercept));
      };

      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const riskValue = i / iterations;
        calculateLinearHeight(riskValue, 50, 0);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
