/**
 * Idle Village Risk Stripe Calibration Presets and Templates
 * 
 * Comprehensive collection of calibration presets, templates, and
 * preset management utilities for different use cases.
 * 
 * @module riskStripeCalibrationPresets
 * @since 2026-01-13
 * @author Cascade
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  CalibrationPreset,
  CalibrationPresetType,
  CalibrationPoint,
  CalibrationCurveParams,
  RiskStripeConfig,
  CalibrationAlgorithm,
  RiskLevel,
  createCalibrationPoint,
  calculateRiskLevel,
  BUILTIN_CALIBRATION_PRESETS,
  DEFAULT_RISK_STRIPE_CONFIG,
} from '@/balancing/config/idleVillage/riskStripeCalibrationConfig';

const diagnostics = createHeadlessDiagnostics('RiskStripeCalibrationPresets', 'calibration');

/**
 * Preset manager class
 */
export class CalibrationPresetManager {
  private static instance: CalibrationPresetManager;
  private presets: Map<string, CalibrationPreset> = new Map();
  private templates: Map<string, CalibrationPreset> = new Map();

  private constructor() {
    this.initializeBuiltinPresets();
    this.initializeTemplates();
  }

  static getInstance(): CalibrationPresetManager {
    if (!CalibrationPresetManager.instance) {
      CalibrationPresetManager.instance = new CalibrationPresetManager();
    }
    return CalibrationPresetManager.instance;
  }

  /**
   * Get all presets
   */
  getAllPresets(): CalibrationPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get preset by ID
   */
  getPresetById(presetId: string): CalibrationPreset | null {
    return this.presets.get(presetId) || null;
  }

  /**
   * Get presets by type
   */
  getPresetsByType(type: CalibrationPresetType): CalibrationPreset[] {
    return this.getAllPresets().filter(preset => preset.type === type);
  }

  /**
   * Get presets by tags
   */
  getPresetsByTags(tags: string[]): CalibrationPreset[] {
    return this.getAllPresets().filter(preset =>
      preset.tags.some(tag => tags.includes(tag))
    );
  }

  /**
   * Search presets
   */
  searchPresets(query: string): CalibrationPreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPresets().filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add custom preset
   */
  addPreset(preset: CalibrationPreset): void {
    if (this.presets.has(preset.presetId)) {
      throw new Error(`Preset with ID '${preset.presetId}' already exists`);
    }

    const customPreset: CalibrationPreset = {
      ...preset,
      isBuiltin: false,
      metadata: {
        ...preset.metadata,
        tags: [...preset.metadata.tags, 'custom'],
      },
    };

    this.presets.set(preset.presetId, customPreset);
    diagnostics.info('Custom preset added', { presetId: preset.presetId, name: preset.name });
  }

  /**
   * Update preset
   */
  updatePreset(presetId: string, updates: Partial<CalibrationPreset>): void {
    const existingPreset = this.presets.get(presetId);
    if (!existingPreset) {
      throw new Error(`Preset with ID '${presetId}' not found`);
    }

    if (existingPreset.isBuiltin) {
      throw new Error('Cannot update built-in presets');
    }

    const updatedPreset: CalibrationPreset = {
      ...existingPreset,
      ...updates,
      presetId,
      metadata: {
        ...existingPreset.metadata,
        ...updates.metadata,
      },
    };

    this.presets.set(presetId, updatedPreset);
    diagnostics.info('Preset updated', { presetId, name: updatedPreset.name });
  }

  /**
   * Delete preset
   */
  deletePreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) {
      return false;
    }

    if (preset.isBuiltin) {
      throw new Error('Cannot delete built-in presets');
    }

    const deleted = this.presets.delete(presetId);
    if (deleted) {
      diagnostics.info('Preset deleted', { presetId, name: preset.name });
    }

    return deleted;
  }

  /**
   * Create session from preset
   */
  createSessionFromPreset(presetId: string, overrides?: Partial<CalibrationPreset>): CalibrationSession {
    const preset = this.getPresetById(presetId);
    if (!preset) {
      throw new Error(`Preset with ID '${presetId}' not found`);
    }

    const session: CalibrationSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: preset.name,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      description: preset.description,
      calibrationPoints: [...preset.defaultPoints],
      curveParams: { ...preset.defaultCurveParams },
      stripeConfig: { ...preset.defaultStripeConfig },
      metadata: {
        version: '1.0.0',
        author: 'Preset Manager',
        tags: [...preset.tags],
        category: preset.type,
      },
    };

    // Apply overrides
    if (overrides) {
      if (overrides.name) {
        session.name = overrides.name;
      }
      if (overrides.description) {
        session.description = overrides.description;
      }
      if (overrides.defaultPoints) {
        session.calibrationPoints = [...overrides.defaultPoints];
      }
      if (overrides.defaultCurveParams) {
        session.curveParams = { ...session.curveParams, ...overrides.defaultCurveParams };
      }
      if (overrides.defaultStripeConfig) {
        session.stripeConfig = { ...session.stripeConfig, ...overrides.defaultStripeConfig };
      }
      if (overrides.metadata) {
        session.metadata = { ...session.metadata, ...overrides.metadata };
      }
    }

    return session;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): CalibrationPreset[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId: string): CalibrationPreset | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Add custom template
   */
  addTemplate(template: CalibrationPreset): void {
    if (this.templates.has(template.presetId)) {
      throw new Error(`Template with ID '${template.presetId}' already exists`);
    }

    this.templates.set(template.presetId, template);
    diagnostics.info('Template added', { templateId: template.presetId, name: template.name });
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      diagnostics.info('Template deleted', { templateId });
    }
    return deleted;
  }

  /**
   * Export presets
   */
  exportPresets(): string {
    const exportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      presets: this.getAllPresets(),
      templates: this.getAllTemplates(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import presets
   */
  importPresets(data: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const importData = JSON.parse(data);

      if (!importData.presets || !Array.isArray(importData.presets)) {
        errors.push('Invalid presets data format');
        return { imported, errors };
      }

      // Import presets
      for (const presetData of importData.presets) {
        try {
          this.addPreset(presetData);
          imported++;
        } catch (error) {
          errors.push(`Failed to import preset '${presetData.presetId}': ${error}`);
        }
      }

      // Import templates
      if (importData.templates && Array.isArray(importData.templates)) {
        for (const templateData of importData.templates) {
          try {
            this.addTemplate(templateData);
          } catch (error) {
            errors.push(`Failed to import template '${templateData.presetId}': ${error}`);
          }
        }
      }

      diagnostics.info('Presets imported', { imported, errors: errors.length });
    } catch (error) {
      errors.push(`Failed to parse import data: ${error}`);
    }

    return { imported, errors };
  }

  /**
   * Initialize built-in presets
   */
  private initializeBuiltinPresets(): void {
    BUILTIN_CALIBRATION_PRESETS.forEach(preset => {
      this.presets.set(preset.presetId, preset);
    });
  }

  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    // Game-specific templates
    this.templates.set('idle-village-low-risk', {
      presetId: 'idle-village-low-risk',
      name: 'Idle Village - Low Risk',
      type: CalibrationPresetType.CONSERVATIVE,
      description: 'Optimized for Idle Village low-risk scenarios with gentle progression',
      defaultPoints: [
        createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'No risk - safe zone'),
        createCalibrationPoint(0.05, 3, RiskLevel.VERY_LOW, 1.0, false, 'Minimal risk - very safe'),
        createCalibrationPoint(0.15, 8, RiskLevel.LOW, 1.0, false, 'Low risk - safe for beginners'),
        createCalibrationPoint(0.3, 20, RiskLevel.LOW, 1.0, true, 'Low-moderate risk - still safe'),
        createCalibrationPoint(0.5, 50, RiskLevel.MEDIUM, 1.0, true, 'Medium risk - requires caution'),
        createCalibrationPoint(0.7, 100, RiskLevel.HIGH, 1.0, false, 'High risk - experienced players'),
        createCalibrationPoint(0.85, 150, RiskLevel.VERY_HIGH, 1.0, false, 'Very high risk - expert players'),
        createCalibrationPoint(1.0, 200, RiskLevel.EXTREME, 1.0, true, 'Maximum risk - extreme caution'),
      ],
      defaultCurveParams: {
        algorithm: CalibrationAlgorithm.SIGMOID,
        parameters: {
          steepness: 3,
          midpoint: 0.4,
        },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 200 },
      },
      defaultStripeConfig: {
        ...DEFAULT_RISK_STRIPE_CONFIG,
        color: {
          ...DEFAULT_RISK_STRIPE_CONFIG.color,
          primary: 'rgb(34, 197, 94)', // green-500
          secondary: 'rgb(22, 163, 74)', // green-600
        },
      },
      tags: ['idle-village', 'low-risk', 'conservative', 'beginner-friendly'],
      isBuiltin: true,
      metadata: {
        version: '1.0.0',
        author: 'System',
        tags: ['idle-village', 'low-risk', 'conservative', 'beginner-friendly'],
        category: CalibrationPresetType.CONSERVATIVE,
      },
    });

    this.templates.set('idle-village-balanced', {
      presetId: 'idle-village-balanced',
      name: 'Idle Village - Balanced',
      type: CalibrationPresetType.BALANCED,
      description: 'Balanced calibration for Idle Village with moderate risk progression',
      defaultPoints: [
        createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'No risk - safe zone'),
        createCalibrationPoint(0.1, 10, RiskLevel.LOW, 1.0, false, 'Low risk - easy challenges'),
        createCalibrationPoint(0.25, 30, RiskLevel.LOW, 1.0, false, 'Low-moderate risk'),
        createCalibrationPoint(0.4, 60, RiskLevel.MEDIUM, 1.0, true, 'Medium risk - standard difficulty'),
        createCalibrationPoint(0.6, 100, RiskLevel.HIGH, 1.0, true, 'High risk - challenging'),
        createCalibrationPoint(0.8, 160, RiskLevel.VERY_HIGH, 1.0, false, 'Very high risk - expert'),
        createCalibrationPoint(1.0, 250, RiskLevel.EXTREME, 1.0, true, 'Maximum risk - extreme challenge'),
      ],
      defaultCurveParams: {
        algorithm: CalibrationAlgorithm.POWER,
        parameters: {
          exponent: 1.8,
          powerScale: 250,
        },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 250 },
      },
      defaultStripeConfig: {
        ...DEFAULT_RISK_STRIPE_CONFIG,
        color: {
          ...DEFAULT_RISK_STRIPE_CONFIG.color,
          primary: 'rgb(59, 130, 246)', // blue-500
          secondary: 'rgb(37, 99, 235)', // blue-600
        },
      },
      tags: ['idle-village', 'balanced', 'standard', 'all-players'],
      isBuiltin: true,
      metadata: {
        version: '1.0.0',
        author: 'System',
        tags: ['idle-village', 'balanced', 'standard', 'all-players'],
        category: CalibrationPresetType.BALANCED,
      },
    });

    this.templates.set('idle-village-hardcore', {
      presetId: 'idle-village-hardcore',
      name: 'Idle Village - Hardcore',
      type: CalibrationPresetType.AGGRESSIVE,
      description: 'Aggressive calibration for Idle Village hardcore players with steep risk progression',
      defaultPoints: [
        createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'No risk - safe zone'),
        createCalibrationPoint(0.05, 2, RiskLevel.VERY_LOW, 1.0, false, 'Minimal risk'),
        createCalibrationPoint(0.2, 5, RiskLevel.LOW, 1.0, false, 'Low risk - early game'),
        createCalibrationPoint(0.4, 25, RiskLevel.MEDIUM, 1.0, false, 'Medium risk - mid game'),
        createCalibrationPoint(0.6, 80, RiskLevel.HIGH, 1.0, true, 'High risk - late game'),
        createCalibrationPoint(0.8, 180, RiskLevel.VERY_HIGH, 1.0, false, 'Very high risk - end game'),
        createCalibrationPoint(0.95, 280, RiskLevel.EXTREME, 1.0, false, 'Extreme risk - final challenge'),
        createCalibrationPoint(1.0, 300, RiskLevel.EXTREME, 1.0, true, 'Maximum risk - ultimate challenge'),
      ],
      defaultCurveParams: {
        algorithm: CalibrationAlgorithm.EXPONENTIAL,
        parameters: {
          expBase: 3,
          expScale: 300,
        },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 300 },
      },
      defaultStripeConfig: {
        ...DEFAULT_RISK_STRIPE_CONFIG,
        color: {
          ...DEFAULT_RISK_STRIPE_CONFIG.color,
          primary: 'rgb(239, 68, 68)', // red-500
          secondary: 'rgb(220, 38, 38)', // red-600
        },
      },
      tags: ['idle-village', 'hardcore', 'aggressive', 'expert'],
      isBuiltin: true,
      metadata: {
        version: '1.0.0',
        author: 'System',
        tags: ['idle-village', 'hardcore', 'aggressive', 'expert'],
        category: CalibrationPresetType.AGGRESSIVE,
      },
    });

    // Tutorial templates
    this.templates.set('tutorial-beginner', {
      presetId: 'tutorial-beginner',
      name: 'Tutorial - Beginner',
      type: CalibrationPresetType.CONSERVATIVE,
      description: 'Gentle calibration perfect for tutorial scenarios and new players',
      defaultPoints: [
        createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'Tutorial start - no risk'),
        createCalibrationPoint(0.1, 2, RiskLevel.VERY_LOW, 1.0, false, 'Tutorial step 1 - very gentle'),
        createCalibrationPoint(0.2, 5, RiskLevel.LOW, 1.0, false, 'Tutorial step 2 - gentle introduction'),
        createCalibrationPoint(0.3, 10, RiskLevel.LOW, 1.0, false, 'Tutorial step 3 - learning phase'),
        createCalibrationPoint(0.4, 15, RiskLevel.LOW, 1.0, false, 'Tutorial step 4 - building confidence'),
        createCalibrationPoint(0.5, 25, RiskLevel.MEDIUM, 1.0, true, 'Tutorial step 5 - mid tutorial'),
        createCalibrationPoint(0.6, 35, RiskLevel.MEDIUM, 1.0, false, 'Tutorial step 6 - advanced concepts'),
        createCalibrationPoint(0.7, 45, RiskLevel.HIGH, 1.0, false, 'Tutorial step 7 - challenging'),
        createCalibrationPoint(0.8, 55, RiskLevel.HIGH, 1.0, false, 'Tutorial step 8 - mastery'),
        createCalibrationPoint(0.9, 65, RiskLevel.VERY_HIGH, 1.0, false, 'Tutorial step 9 - expert level'),
        createCalibrationPoint(1.0, 75, RiskLevel.VERY_HIGH, 1.0, true, 'Tutorial complete'),
      ],
      defaultCurveParams: {
        algorithm: CalibrationAlgorithm.LINEAR,
        parameters: {
          slope: 75,
          intercept: 0,
        },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 75 },
      },
      defaultStripeConfig: {
        ...DEFAULT_RISK_STRIPE_CONFIG,
        color: {
          ...DEFAULT_RISK_STRIPE_CONFIG.color,
          primary: 'rgb(34, 197, 94)', // green-500
          secondary: 'rgb(22, 163, 74)', // green-600
        },
      },
      tags: ['tutorial', 'beginner', 'educational', 'gentle'],
      isBuiltin: true,
      metadata: {
        version: '1.0.0',
        author: 'System',
        tags: ['tutorial', 'beginner', 'educational', 'gentle'],
        category: CalibrationPresetType.CONSERVATIVE,
      },
    });

    // Challenge templates
    this.templates.set('challenge-difficulty-scaling', {
      presetId: 'challenge-difficulty-scaling',
      name: 'Challenge - Difficulty Scaling',
      type: CalibrationPresetType.BALANCED,
      description: 'Dynamic difficulty scaling for challenge modes with adaptive progression',
      defaultPoints: [
        createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'Challenge start - baseline'),
        createCalibrationPoint(0.1, 5, RiskLevel.LOW, 1.0, false, 'Easy challenge - warm-up'),
        createCalibrationPoint(0.2, 12, RiskLevel.LOW, 1.0, false, 'Easy-moderate challenge'),
        createCalibrationPoint(0.3, 25, RiskLevel.MEDIUM, 1.0, false, 'Moderate challenge - getting serious'),
        createCalibrationPoint(0.4, 45, RiskLevel.MEDIUM, 1.0, false, 'Moderate-hard challenge'),
        createCalibrationPoint(0.5, 70, RiskLevel.HIGH, 1.0, true, 'Hard challenge - requires skill'),
        createCalibrationPoint(0.6, 100, RiskLevel.HIGH, 1.0, false, 'Hard challenge - expert level'),
        createCalibrationPoint(0.7, 140, RiskLevel.VERY_HIGH, 1.0, false, 'Very hard challenge - mastery required'),
        createCalibrationPoint(0.8, 190, RiskLevel.VERY_HIGH, 1.0, false, 'Extreme challenge - near impossible'),
        createCalibrationPoint(0.9, 240, RiskLevel.EXTREME, 1.0, false, 'Extreme challenge - legendary'),
        createCalibrationPoint(1.0, 300, RiskLevel.EXTREME, 1.0, true, 'Ultimate challenge - maximum difficulty'),
      ],
      defaultCurveParams: {
        algorithm: CalibrationAlgorithm.POWER,
        parameters: {
          exponent: 2.2,
          powerScale: 300,
        },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 300 },
      },
      defaultStripeConfig: {
        ...DEFAULT_RISK_STRIPE_CONFIG,
        color: {
          ...DEFAULT_RISK_STRIPE_CONFIG.color,
          primary: 'rgb(168, 85, 247)', // purple-500
          secondary: 'rgb(147, 51, 234)', // purple-600
        },
      },
      tags: ['challenge', 'difficulty-scaling', 'adaptive', 'progressive'],
      isBuiltin: true,
      metadata: {
        version: '1.0.0',
        author: 'System',
        tags: ['challenge', 'difficulty-scaling', 'adaptive', 'progressive'],
        category: CalibrationPresetType.BALANCED,
      },
    });
  }

  /**
   * Generate preset statistics
   */
  generateStatistics(): {
    totalPresets: number;
    builtinPresets: number;
    customPresets: number;
    presetsByType: Record<CalibrationPresetType, number>;
    templates: number;
    tags: string[];
    algorithms: Record<CalibrationAlgorithm, number>;
  } {
    const presets = this.getAllPresets();
    const templates = this.getAllTemplates();
    const allTags = new Set<string>();
    const algorithms = new Set<CalibrationAlgorithm>();

    presets.forEach(preset => {
      preset.tags.forEach(tag => allTags.add(tag));
      algorithms.add(preset.defaultCurveParams.algorithm);
    });

    const presetsByType = {
      [CalibrationPresetType.CONSERVATIVE]: 0,
      [CalibrationPresetType.BALANCED]: 0,
      [CalibrationPresetType.AGGRESSIVE]: 0,
      [CalibrationPresetType.CUSTOM]: 0,
    };

    presets.forEach(preset => {
      presetsByType[preset.type]++;
    });

    return {
      totalPresets: presets.length,
      builtinPresets: presets.filter(p => p.isBuiltin).length,
      customPresets: presets.filter(p => !p.isBuiltin).length,
      presetsByType,
      templates: templates.length,
      tags: Array.from(allTags),
      algorithms: {
        [CalibrationAlgorithm.LINEAR]: 0,
        [CalibrationAlgorithm.LOGARITHMIC]: 0,
        [CalibrationAlgorithm.EXPONENTIAL]: 0,
        [CalibrationAlgorithm.SIGMOID]: 0,
        [CalibrationAlgorithm.POWER]: 0,
        [CalibrationAlgorithm.CUSTOM]: 0,
      },
    };
  }

  /**
   * Validate preset
   */
  validatePreset(preset: CalibrationPreset): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!preset.presetId || preset.presetId.trim() === '') {
      errors.push('Preset ID is required');
    }
    if (!preset.name || preset.name.trim() === '') {
      errors.push('Preset name is required');
    }
    if (!preset.description || preset.description.trim() === '') {
      errors.push('Preset description is required');
    }

    // Validate calibration points
    if (!preset.defaultPoints || !Array.isArray(preset.defaultPoints)) {
      errors.push('Default points must be an array');
    } else if (preset.defaultPoints.length < 3) {
      errors.push('At least 3 calibration points required');
    } else {
      preset.defaultPoints.forEach((point, index) => {
        if (point.riskPercentage < 0 || point.riskPercentage > 1) {
          errors.push(`Point ${index}: Risk percentage must be between 0 and 1`);
        }
        if (point.stripeHeight < 0 || point.stripeHeight > 300) {
          errors.push(`Point ${index}: Stripe height must be between 0 and 300`);
        }
        if (point.weight < 0 || point.weight > 1) {
          errors.push(`Point ${index}: Weight must be between 0 and 1`);
        }
      });
    }

    // Validate curve parameters
    if (!preset.defaultCurveParams) {
      errors.push('Curve parameters are required');
    } else {
      if (!preset.defaultCurveParams.algorithm) {
        errors.push('Curve algorithm is required');
      }
      if (!preset.defaultCurveParams.domain || preset.defaultCurveParams.domain.min >= preset.defaultCurveParams.domain.max) {
        errors.push('Invalid domain parameters');
      }
      if (!preset.defaultCurveParams.range || preset.defaultCurveParams.range.min >= preset.defaultCurveParams.range.max) {
        errors.push('Invalid range parameters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone preset
   */
  clonePreset(presetId: string, newName: string): CalibrationPreset {
    const original = this.getPresetById(presetId);
    if (!original) {
      throw new Error(`Preset with ID '${presetId}' not found`);
    }

    const cloned: CalibrationPreset = {
      ...original,
      presetId: `${original.presetId}-clone-${Date.now()}`,
      name: newName,
      description: `${original.description} (Clone)`,
      isBuiltin: false,
      metadata: {
        ...original.metadata,
        tags: [...original.metadata.tags, 'cloned'],
      },
    };

    this.addPreset(cloned);
    return cloned;
  }

  /**
   * Merge presets
   */
  mergePresets(presetIds: string[], newName: string): CalibrationPreset {
    const presets = presetIds.map(id => this.getPresetById(id)).filter(Boolean);
    
    if (presets.length === 0) {
      throw new Error('No valid presets found for merging');
    }

    // Merge calibration points (weighted average)
    const mergedPoints: CalibrationPoint[] = [];
    const referencePoints = presets.flatMap(p => p.defaultPoints.filter(point => point.isReference));
    
    // Create merged reference points
    const uniqueRiskPercentages = [...new Set(referencePoints.map(p => p.riskPercentage))];
    uniqueRiskPercentages.forEach(riskPercentage => {
      const pointsAtRisk = referencePoints.filter(p => p.riskPercentage === riskPercentage);
      const avgHeight = pointsAtRisk.reduce((sum, p) => sum + p.stripeHeight, 0) / pointsAtRisk.length;
      const avgWeight = pointsAtRisk.reduce((sum, p) => sum + p.weight, 0) / pointsAtRisk.length;
      
      mergedPoints.push(createCalibrationPoint(
        riskPercentage,
        avgHeight,
        calculateRiskLevel(riskPercentage),
        avgWeight,
        true,
        `Merged from ${pointsAtRisk.length} presets`
      ));
    });

    // Merge curve parameters (use first preset as base)
    const basePreset = presets[0];
    const mergedCurveParams: CalibrationCurveParams = {
      ...basePreset.defaultCurveParams,
      parameters: { ...basePreset.defaultCurveParams.parameters },
    };

    // Merge stripe config
    const mergedStripeConfig: RiskStripeConfig = {
      ...basePreset.defaultStripeConfig,
    };

    // Merge metadata
    const allTags = new Set(presets.flatMap(p => p.tags));
    const mergedPreset: CalibrationPreset = {
      presetId: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      type: CalibrationPresetType.CUSTOM,
      description: `Merged from ${presets.length} presets: ${presets.map(p => p.name).join(', ')}`,
      defaultPoints: mergedPoints,
      defaultCurveParams: mergedCurveParams,
      defaultStripeConfig: mergedStripeConfig,
      tags: Array.from(allTags),
      isBuiltin: false,
      metadata: {
        version: '1.0.0',
        author: 'Preset Manager',
        tags: Array.from(allTags),
        category: CalibrationPresetType.CUSTOM,
      },
    };

    this.addPreset(mergedPreset);
    return mergedPreset;
  }
}

/**
 * Global preset manager instance
 */
export const calibrationPresetManager = CalibrationPresetManager.getInstance();

/**
 * Preset utilities
 */
export const presetUtils = {
  /**
   * Create preset from session
   */
  createPresetFromSession(session: CalibrationSession, presetId?: string, name?: string): CalibrationPreset {
    return {
      presetId: presetId || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || session.name,
      type: CalibrationPresetType.CUSTOM,
      description: session.description || 'Created from calibration session',
      defaultPoints: [...session.calibrationPoints],
      defaultCurveParams: { ...session.curveParams },
      defaultStripeConfig: { ...session.stripeConfig },
      tags: [...session.metadata.tags, 'from-session'],
      isBuiltin: false,
      metadata: {
        version: '1.0.0',
        author: 'Preset Manager',
        tags: [...session.metadata.tags, 'from-session'],
        category: CalibrationPresetType.CUSTOM,
      },
    };
  },

  /**
   * Compare presets
   */
  comparePresets(preset1: CalibrationPreset, preset2: CalibrationPreset): {
    similarity: number;
    differences: string[];
  } {
    const differences: string[] = [];
    let similarity = 1.0;

    // Compare types
    if (preset1.type !== preset2.type) {
      differences.push(`Type: ${preset1.type} vs ${preset2.type}`);
      similarity -= 0.2;
    }

    // Compare points count
    const pointCountDiff = Math.abs(preset1.defaultPoints.length - preset2.defaultPoints.length);
    if (pointCountDiff > 0) {
      differences.push(`Points: ${preset1.defaultPoints.length} vs ${preset2.defaultPoints.length}`);
      similarity -= pointCountDiff * 0.1;
    }

    // Compare algorithms
    if (preset1.defaultCurveParams.algorithm !== preset2.defaultCurveParams.algorithm) {
      differences.push(`Algorithm: ${preset1.defaultCurveParams.algorithm} vs ${preset2.defaultCurveParams.algorithm}`);
      similarity -= 0.15;
    }

    // Compare point values
    const minLength = Math.min(preset1.defaultPoints.length, preset2.defaultPoints.length);
    let totalDiff = 0;
    
    for (let i = 0; i < minLength; i++) {
      const point1 = preset1.defaultPoints[i];
      const point2 = preset2.defaultPoints[i];
      
      totalDiff += Math.abs(point1.riskPercentage - point2.riskPercentage);
      totalDiff += Math.abs(point1.stripeHeight - point2.stripeHeight) / 300; // Normalize height
    }
    
    const avgDiff = totalDiff / minLength;
    similarity -= avgDiff * 0.5;

    return {
      similarity: Math.max(0, similarity),
      differences,
    };
  },

  /**
   * Find similar presets
   */
  findSimilarPresets(targetPreset: CalibrationPreset, threshold: number = 0.8): CalibrationPreset[] {
    const allPresets = calibrationPresetManager.getAllPresets();
    const similar: CalibrationPreset[] = [];

    allPresets.forEach(preset => {
      if (preset.presetId === targetPreset.presetId) return; // Skip self

      const comparison = presetUtils.comparePresets(targetPreset, preset);
      if (comparison.similarity >= threshold) {
        similar.push(preset);
      }
    });

    return similar.sort((a, b) => presetUtils.comparePresets(targetPreset, b).similarity - presetUtils.comparePresets(targetPreset, a).similarity);
  },

  /**
   * Get recommended presets for session
   */
  getRecommendedPresets(session: CalibrationSession, limit: number = 5): CalibrationPreset[] {
    const allPresets = calibrationPresetManager.getAllPresets();
    const recommendations: { preset: CalibrationPreset; score: number }[] = [];

    allPresets.forEach(preset => {
      let score = 0;

      // Score based on point count similarity
      const pointDiff = Math.abs(preset.defaultPoints.length - session.calibrationPoints.length);
      score += Math.max(0, 1 - pointDiff / 10) * 0.3;

      // Score based on algorithm similarity
      if (preset.defaultCurveParams.algorithm === session.curveParams.algorithm) {
        score += 0.4;
      }

      // Score based on type similarity
      if (preset.type === CalibrationPresetType.BALANCED) {
        score += 0.2;
      }

      // Score based on tags overlap
      const commonTags = preset.tags.filter(tag => session.metadata.tags.includes(tag));
      score += (commonTags.length / Math.max(preset.tags.length, session.metadata.tags.length)) * 0.1;

      recommendations.push({ preset, score });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.preset);
  },
};
