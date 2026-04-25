/**
 * Risk Stripe Calibration System - Comprehensive Unit Tests
 *
 * Test suite for the Idle Village Risk Stripe Calibration Tool including:
 * - Configuration schema validation
 * - Calibration engine algorithms
 * - UI components interaction
 * - Export/import functionality
 * - Preset management
 * - Integration scenarios
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import all modules to test
import {
  // Configuration
  CalibrationAlgorithm,
  CalibrationPresetType,
  RiskLevel,
  type RiskStripeConfig,
  type CalibrationPoint,
  type CalibrationCurveParams,
  type CalibrationSession,
  type CalibrationValidationResults,
  type CalibrationExport,
  type CalibrationPreset,
  type InteractiveCalibrationState,
  createCalibrationSessionId,
  createCalibrationPoint,
  calculateRiskLevel,
  formatRiskValue,
  validateCalibrationPoint,
  sortCalibrationPoints,
  BUILTIN_CALIBRATION_PRESETS,
  DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG,
  DEFAULT_RISK_STRIPE_CONFIG,
} from '@/balancing/config/idleVillage/riskStripeCalibrationConfig';

import {
  calibrationEngine,
  RiskStripeCalibrationEngine,
} from '@/balancing/utils/idleVillage/riskStripeCalibrationEngine';

import {
  CalibrationExportImportManager,
  CalibrationBackupManager,
  exportCalibrationSession,
  importCalibrationSession,
  createCalibrationBackup,
  restoreCalibrationBackup,
} from '@/balancing/utils/idleVillage/riskStripeCalibrationExport';

import {
  CalibrationPresetManager,
  presetUtils,
  getPresetManager,
  createSessionFromPreset,
  comparePresets,
  generatePresetRecommendations,
} from '@/balancing/utils/idleVillage/riskStripeCalibrationPresets';

import RiskStripeCalibrationTool from '@/ui/idleVillage/components/RiskStripeCalibrationTool';

// Mock dependencies
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('Risk Stripe Calibration Configuration', () => {
  describe('Configuration Schema', () => {
    it('should create valid calibration points', () => {
      const point = createCalibrationPoint(0.5, 25);
      
      expect(point).toEqual({
        id: expect.any(String),
        riskValue: 0.5,
        stripeHeight: 25,
        weight: 1.0,
        metadata: {},
      });
      expect(validateCalibrationPoint(point)).toBe(true);
    });

    it('should validate calibration points correctly', () => {
      const validPoint = createCalibrationPoint(0.3, 15);
      const invalidPoint = { riskValue: -0.1, stripeHeight: 150 } as CalibrationPoint;

      expect(validateCalibrationPoint(validPoint)).toBe(true);
      expect(validateCalibrationPoint(invalidPoint)).toBe(false);
    });

    it('should calculate risk levels correctly', () => {
      expect(calculateRiskLevel(0.1)).toBe(RiskLevel.LOW);
      expect(calculateRiskLevel(0.5)).toBe(RiskLevel.MEDIUM);
      expect(calculateRiskLevel(0.9)).toBe(RiskLevel.HIGH);
    });

    it('should format risk values correctly', () => {
      expect(formatRiskValue(0.1234)).toBe('12.34%');
      expect(formatRiskValue(0.5)).toBe('50.00%');
      expect(formatRiskValue(1.0)).toBe('100.00%');
    });

    it('should sort calibration points by risk value', () => {
      const points = [
        createCalibrationPoint(0.8, 40),
        createCalibrationPoint(0.2, 10),
        createCalibrationPoint(0.5, 25),
      ];

      const sorted = sortCalibrationPoints(points);
      expect(sorted.map(p => p.riskValue)).toEqual([0.2, 0.5, 0.8]);
    });

    it('should create unique session IDs', () => {
      const id1 = createCalibrationSessionId();
      const id2 = createCalibrationSessionId();
      
      expect(id1).toMatch(/^cal-session-/);
      expect(id2).toMatch(/^cal-session-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Built-in Presets', () => {
    it('should have all required preset types', () => {
      const presetTypes = new Set(BUILTIN_CALIBRATION_PRESETS.map(p => p.type));
      expect(presetTypes.has(CalibrationPresetType.CONSERVATIVE)).toBe(true);
      expect(presetTypes.has(CalibrationPresetType.BALANCED)).toBe(true);
      expect(presetTypes.has(CalibrationPresetType.AGGRESSIVE)).toBe(true);
    });

    it('should have valid preset configurations', () => {
      BUILTIN_CALIBRATION_PRESETS.forEach(preset => {
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.algorithm).toBeDefined();
        expect(preset.curveParams).toBeDefined();
        expect(preset.calibrationPoints).toBeDefined();
        expect(Array.isArray(preset.calibrationPoints)).toBe(true);
      });
    });
  });

  describe('Default Configurations', () => {
    it('should have valid default tool config', () => {
      expect(DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG.canvas).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG.validation).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG.export).toBeDefined();
    });

    it('should have valid default risk stripe config', () => {
      expect(DEFAULT_RISK_STRIPE_CONFIG).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CONFIG.colors).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CONFIG.dimensions).toBeDefined();
      expect(DEFAULT_RISK_STRIPE_CONFIG.animation).toBeDefined();
    });
  });
});

describe('Calibration Engine', () => {
  describe('Stripe Height Calculation', () => {
    it('should calculate linear stripe height correctly', () => {
      const params: CalibrationCurveParams = {
        algorithm: CalibrationAlgorithm.LINEAR,
        slope: 50,
        intercept: 0,
        r2: 1.0,
      };

      expect(calculateStripeHeight(0.0, params)).toBe(0);
      expect(calculateStripeHeight(0.5, params)).toBe(25);
      expect(calculateStripeHeight(1.0, params)).toBe(50);
    });

    it('should calculate logarithmic stripe height correctly', () => {
      const params: CalibrationCurveParams = {
        algorithm: CalibrationAlgorithm.LOGARITHMIC,
        slope: 30,
        intercept: 0,
        r2: 1.0,
      };

      expect(calculateStripeHeight(0.1, params)).toBeCloseTo(30 * Math.log(0.1 + 1), 2);
      expect(calculateStripeHeight(0.5, params)).toBeCloseTo(30 * Math.log(0.5 + 1), 2);
    });

    it('should handle edge cases gracefully', () => {
      const params: CalibrationCurveParams = {
        algorithm: CalibrationAlgorithm.LINEAR,
        slope: 50,
        intercept: 0,
        r2: 1.0,
      };

      expect(calculateStripeHeight(-0.1, params)).toBe(0);
      expect(calculateStripeHeight(1.1, params)).toBe(50);
      expect(calculateStripeHeight(NaN, params)).toBe(0);
    });
  });

  describe('Curve Fitting', () => {
    it('should fit linear curve to points', () => {
      const points = [
        createCalibrationPoint(0.0, 0),
        createCalibrationPoint(0.5, 25),
        createCalibrationPoint(1.0, 50),
      ];

      const result = fitCalibrationCurve(points, CalibrationAlgorithm.LINEAR);
      
      expect(result.algorithm).toBe(CalibrationAlgorithm.LINEAR);
      expect(result.curveParams.slope).toBeCloseTo(50, 1);
      expect(result.curveParams.intercept).toBeCloseTo(0, 1);
      expect(result.curveParams.r2).toBeCloseTo(1.0, 2);
    });

    it('should handle insufficient points', () => {
      const points = [createCalibrationPoint(0.5, 25)];
      
      const result = fitCalibrationCurve(points, CalibrationAlgorithm.LINEAR);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 points');
    });

    it('should detect outliers correctly', () => {
      const points = [
        createCalibrationPoint(0.0, 0),
        createCalibrationPoint(0.5, 25),
        createCalibrationPoint(1.0, 50),
        createCalibrationPoint(0.3, 100), // Outlier
      ];

      const outliers = detectOutliers(points);
      expect(outliers.length).toBe(1);
      expect(outliers[0].riskValue).toBe(0.3);
    });
  });

  describe('Session Validation', () => {
    it('should validate complete session', () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: 'Test Description',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [
          createCalibrationPoint(0.0, 0),
          createCalibrationPoint(0.5, 25),
          createCalibrationPoint(1.0, 50),
        ],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const validation = validateCalibrationSession(session);
      expect(validation.isValid).toBe(true);
      expect(validation.errorCount).toBe(0);
    });

    it('should detect invalid sessions', () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: '',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [],
        validationResults: {
          isValid: false,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const validation = validateCalibrationSession(session);
      expect(validation.isValid).toBe(false);
      expect(validation.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Error Metrics', () => {
    it('should calculate error metrics correctly', () => {
      const actual = [0, 25, 50];
      const predicted = [2, 23, 48];

      const metrics = calculateErrorMetrics(actual, predicted);
      
      expect(metrics.mae).toBeCloseTo(2.67, 2);
      expect(metrics.rmse).toBeCloseTo(2.89, 2);
      expect(metrics.maxError).toBe(2);
      expect(metrics.meanError).toBeCloseTo(-0.67, 2);
    });
  });

  describe('Optimization', () => {
    it('should generate optimization recommendations', () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 0.8,
        },
        calibrationPoints: [
          createCalibrationPoint(0.0, 0),
          createCalibrationPoint(0.5, 25),
          createCalibrationPoint(1.0, 50),
        ],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const recommendations = generateCalibrationRecommendations(session);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});

describe('Export/Import System', () => {
  let exportManager: CalibrationExportImportManager;
  let backupManager: CalibrationBackupManager;

  beforeEach(() => {
    exportManager = new CalibrationExportImportManager();
    backupManager = new CalibrationBackupManager();
  });

  describe('JSON Export', () => {
    it('should export session to JSON', async () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [createCalibrationPoint(0.5, 25)],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const exported = await exportManager.exportSession(session, {
        format: 'json',
        includeMetadata: true,
      });

      expect(exported.format).toBe('json');
      expect(exported.data).toBeDefined();
      expect(exported.filename).toMatch(/\.json$/);
    });

    it('should import session from JSON', async () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [createCalibrationPoint(0.5, 25)],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const exported = await exportManager.exportSession(session, {
        format: 'json',
        includeMetadata: true,
      });

      const imported = await exportManager.importSession(exported.data, 'json');
      
      expect(imported.success).toBe(true);
      expect(imported.session).toBeDefined();
      expect(imported.session?.name).toBe(session.name);
    });
  });

  describe('CSV Export', () => {
    it('should export calibration points to CSV', async () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [
          createCalibrationPoint(0.0, 0),
          createCalibrationPoint(0.5, 25),
          createCalibrationPoint(1.0, 50),
        ],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const exported = await exportManager.exportSession(session, {
        format: 'csv',
        includeMetadata: false,
      });

      expect(exported.format).toBe('csv');
      expect(exported.data).toContain('riskValue,stripeHeight');
      expect(exported.filename).toMatch(/\.csv$/);
    });
  });

  describe('Backup Management', () => {
    it('should create backup', async () => {
      const sessions: CalibrationSession[] = [
        {
          id: createCalibrationSessionId(),
          name: 'Session 1',
          description: '',
          algorithm: CalibrationAlgorithm.LINEAR,
          curveParams: {
            algorithm: CalibrationAlgorithm.LINEAR,
            slope: 50,
            intercept: 0,
            r2: 1.0,
          },
          calibrationPoints: [createCalibrationPoint(0.5, 25)],
          validationResults: {
            isValid: true,
            errorCount: 0,
            warningCount: 0,
            issues: [],
          },
          metadata: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const backup = await backupManager.createBackup(sessions, {
        includeMetadata: true,
        compression: false,
      });

      expect(backup.id).toBeDefined();
      expect(backup.sessions).toHaveLength(1);
      expect(backup.createdAt).toBeDefined();
    });

    it('should restore from backup', async () => {
      const originalSessions: CalibrationSession[] = [
        {
          id: createCalibrationSessionId(),
          name: 'Session 1',
          description: '',
          algorithm: CalibrationAlgorithm.LINEAR,
          curveParams: {
            algorithm: CalibrationAlgorithm.LINEAR,
            slope: 50,
            intercept: 0,
            r2: 1.0,
          },
          calibrationPoints: [createCalibrationPoint(0.5, 25)],
          validationResults: {
            isValid: true,
            errorCount: 0,
            warningCount: 0,
            issues: [],
          },
          metadata: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const backup = await backupManager.createBackup(originalSessions);
      const restored = await backupManager.restoreBackup(backup.id);

      expect(restored.success).toBe(true);
      expect(restored.sessions).toHaveLength(1);
      expect(restored.sessions[0].name).toBe(originalSessions[0].name);
    });
  });
});

describe('Preset Management', () => {
  let presetManager: CalibrationPresetManager;

  beforeEach(() => {
    presetManager = new CalibrationPresetManager();
  });

  describe('Preset Operations', () => {
    it('should add custom preset', () => {
      const customPreset: CalibrationPreset = {
        id: 'custom-preset',
        name: 'Custom Preset',
        description: 'Test custom preset',
        type: CalibrationPresetType.CUSTOM,
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 40,
          intercept: 5,
          r2: 0.9,
        },
        calibrationPoints: [
          createCalibrationPoint(0.0, 5),
          createCalibrationPoint(1.0, 45),
        ],
        metadata: {},
      };

      const result = presetManager.addPreset(customPreset);
      expect(result.success).toBe(true);

      const retrieved = presetManager.getPreset('custom-preset');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Custom Preset');
    });

    it('should update existing preset', () => {
      const preset = presetManager.getPreset('conservative');
      expect(preset).toBeDefined();

      const updated = { ...preset!, name: 'Updated Conservative' };
      const result = presetManager.updatePreset('conservative', updated);
      expect(result.success).toBe(true);

      const retrieved = presetManager.getPreset('conservative');
      expect(retrieved?.name).toBe('Updated Conservative');
    });

    it('should delete preset', () => {
      const customPreset: CalibrationPreset = {
        id: 'temp-preset',
        name: 'Temp Preset',
        description: '',
        type: CalibrationPresetType.CUSTOM,
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [createCalibrationPoint(0.5, 25)],
        metadata: {},
      };

      presetManager.addPreset(customPreset);
      expect(presetManager.getPreset('temp-preset')).toBeDefined();

      const result = presetManager.deletePreset('temp-preset');
      expect(result.success).toBe(true);
      expect(presetManager.getPreset('temp-preset')).toBeUndefined();
    });

    it('should search presets', () => {
      const results = presetManager.searchPresets('conservative');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Conservative');
    });
  });

  describe('Preset Utilities', () => {
    it('should create session from preset', () => {
      const preset = presetManager.getPreset('balanced');
      expect(preset).toBeDefined();

      const session = createSessionFromPreset(preset!);
      expect(session.name).toContain(preset!.name);
      expect(session.algorithm).toBe(preset!.algorithm);
      expect(session.curveParams).toEqual(preset!.curveParams);
      expect(session.calibrationPoints).toEqual(preset!.calibrationPoints);
    });

    it('should compare presets', () => {
      const preset1 = presetManager.getPreset('conservative');
      const preset2 = presetManager.getPreset('balanced');
      
      expect(preset1).toBeDefined();
      expect(preset2).toBeDefined();

      const comparison = comparePresets(preset1!, preset2!);
      expect(comparison.similarity).toBeGreaterThan(0);
      expect(comparison.differences).toBeDefined();
    });

    it('should generate recommendations', () => {
      const session: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Test Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 30,
          intercept: 5,
          r2: 0.85,
        },
        calibrationPoints: [
          createCalibrationPoint(0.0, 5),
          createCalibrationPoint(0.5, 20),
          createCalibrationPoint(1.0, 35),
        ],
        validationResults: {
          isValid: true,
          errorCount: 0,
          warningCount: 0,
          issues: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const recommendations = generatePresetRecommendations(session);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});

describe('UI Components', () => {
  describe('RiskStripeCalibrationTool', () => {
    const mockSession: CalibrationSession = {
      id: createCalibrationSessionId(),
      name: 'Test Session',
      description: '',
      algorithm: CalibrationAlgorithm.LINEAR,
      curveParams: {
        algorithm: CalibrationAlgorithm.LINEAR,
        slope: 50,
        intercept: 0,
        r2: 1.0,
      },
      calibrationPoints: [
        createCalibrationPoint(0.0, 0),
        createCalibrationPoint(0.5, 25),
        createCalibrationPoint(1.0, 50),
      ],
      validationResults: {
        isValid: true,
        errorCount: 0,
        warningCount: 0,
        issues: [],
      },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should render calibration tool', () => {
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      expect(screen.getByText('Test Session')).toBeInTheDocument();
      expect(screen.getByText('Linear')).toBeInTheDocument();
    });

    it('should add calibration point', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      const addButton = screen.getByText('Add Point');
      await user.click(addButton);
      
      // Check if new point was added (validation should pass)
      await waitFor(() => {
        const points = screen.getAllByTestId(/calibration-point/);
        expect(points).toHaveLength(4); // 3 initial + 1 new
      });
    });

    it('should change algorithm', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      const algorithmSelect = screen.getByLabelText('Algorithm');
      await user.selectOptions(algorithmSelect, 'logarithmic');
      
      expect(screen.getByText('Logarithmic')).toBeInTheDocument();
    });

    it('should validate session', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      const validateButton = screen.getByText('Validate');
      await user.click(validateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Session is valid')).toBeInTheDocument();
      });
    });

    it('should export session', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      const exportJson = screen.getByText('Export as JSON');
      await user.click(exportJson);
      
      // Should trigger download (mocked in test environment)
      await waitFor(() => {
        expect(screen.getByText('Export completed')).toBeInTheDocument();
      });
    });

    it('should load preset', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool initialSession={mockSession} />);
      
      const presetButton = screen.getByText('Load Preset');
      await user.click(presetButton);
      
      const balancedPreset = screen.getByText('Balanced');
      await user.click(balancedPreset);
      
      await waitFor(() => {
        expect(screen.getByText(/Balanced/)).toBeInTheDocument();
      });
    });
  });
});

describe('Integration Scenarios', () => {
  describe('Complete Calibration Workflow', () => {
    it('should complete full calibration workflow', async () => {
      const user = userEvent.setup();
      
      // 1. Start with empty session
      render(<RiskStripeCalibrationTool />);
      
      // 2. Add calibration points
      const addButton = screen.getByText('Add Point');
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);
      
      // 3. Validate session
      const validateButton = screen.getByText('Validate');
      await user.click(validateButton);
      
      // 4. Change algorithm
      const algorithmSelect = screen.getByLabelText('Algorithm');
      await user.selectOptions(algorithmSelect, 'sigmoid');
      
      // 5. Export session
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      const exportJson = screen.getByText('Export as JSON');
      await user.click(exportJson);
      
      // Verify all steps completed successfully
      await waitFor(() => {
        expect(screen.getByText('Export completed')).toBeInTheDocument();
      });
    });
  });

  describe('Preset to Session to Export', () => {
    it('should load preset, modify, and export', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool />);
      
      // Load conservative preset
      const presetButton = screen.getByText('Load Preset');
      await user.click(presetButton);
      const conservativePreset = screen.getByText('Conservative');
      await user.click(conservativePreset);
      
      // Modify a point
      const points = screen.getAllByTestId(/calibration-point/);
      const firstPointEdit = points[0].querySelector('[aria-label="Edit point"]');
      if (firstPointEdit) {
        await user.click(firstPointEdit);
        
        const heightInput = screen.getByLabelText('Stripe Height');
        await user.clear(heightInput);
        await user.type(heightInput, '15');
        
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);
      }
      
      // Export modified session
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      const exportJson = screen.getByText('Export as JSON');
      await user.click(exportJson);
      
      await waitFor(() => {
        expect(screen.getByText('Export completed')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid calibration points', async () => {
      const user = userEvent.setup();
      render(<RiskStripeCalibrationTool />);
      
      // Try to add invalid point
      const addButton = screen.getByText('Add Point');
      await user.click(addButton);
      
      // Edit point to invalid values
      const points = screen.getAllByTestId(/calibration-point/);
      const firstPointEdit = points[0].querySelector('[aria-label="Edit point"]');
      if (firstPointEdit) {
        await user.click(firstPointEdit);
        
        const heightInput = screen.getByLabelText('Stripe Height');
        await user.clear(heightInput);
        await user.type(heightInput, '150'); // Too high
        
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);
        
        // Should show validation error
        await waitFor(() => {
          expect(screen.getByText(/must be between/)).toBeInTheDocument();
        });
      }
    });

    it('should handle algorithm fitting errors', async () => {
      const user = userEvent.setup();
      
      // Create session with insufficient points
      const invalidSession: CalibrationSession = {
        id: createCalibrationSessionId(),
        name: 'Invalid Session',
        description: '',
        algorithm: CalibrationAlgorithm.LINEAR,
        curveParams: {
          algorithm: CalibrationAlgorithm.LINEAR,
          slope: 50,
          intercept: 0,
          r2: 1.0,
        },
        calibrationPoints: [createCalibrationPoint(0.5, 25)], // Only one point
        validationResults: {
          isValid: false,
          errorCount: 1,
          warningCount: 0,
          issues: [{ type: 'error', message: 'Insufficient points' }],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      render(<RiskStripeCalibrationTool initialSession={invalidSession} />);
      
      const validateButton = screen.getByText('Validate');
      await user.click(validateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Insufficient points/)).toBeInTheDocument();
      });
    });
  });
});

describe('Performance Tests', () => {
  it('should handle large number of calibration points', async () => {
    const points: CalibrationPoint[] = [];
    for (let i = 0; i < 100; i++) {
      points.push(createCalibrationPoint(i / 100, i));
    }
    
    const session: CalibrationSession = {
      id: createCalibrationSessionId(),
      name: 'Large Session',
      description: '',
      algorithm: CalibrationAlgorithm.LINEAR,
      curveParams: {
        algorithm: CalibrationAlgorithm.LINEAR,
        slope: 100,
        intercept: 0,
        r2: 1.0,
      },
      calibrationPoints: points,
      validationResults: {
        isValid: true,
        errorCount: 0,
        warningCount: 0,
        issues: [],
      },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const startTime = performance.now();
    render(<RiskStripeCalibrationTool initialSession={session} />);
    const endTime = performance.now();
    
    // Should render within 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should optimize curve fitting quickly', () => {
    const points: CalibrationPoint[] = [];
    for (let i = 0; i < 50; i++) {
      points.push(createCalibrationPoint(i / 50, i * 2));
    }
    
    const startTime = performance.now();
    const result = fitCalibrationCurve(points, CalibrationAlgorithm.LINEAR);
    const endTime = performance.now();
    
    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(50);
  });
});
