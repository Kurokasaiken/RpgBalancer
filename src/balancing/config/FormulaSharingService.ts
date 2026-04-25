/**
 * Balancer Formula Sharing Service - NP-037
 * 
 * Service for exporting and importing balancer formulas, cards, and presets
 * with validation, serialization, and documentation generation.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';
import type { BalancerConfig, StatDefinition, CardDefinition, BalancerPreset } from './types';
import { BalancerConfigSchema } from './schemas';
import { validateFormula, type FormulaValidationResult } from './FormulaEngine';
import { generateDataChecksum } from './storageTelemetryMonitor';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'markdown' | 'yaml';

/**
 * Export scope types
 */
export type ExportScope = 'formulas' | 'cards' | 'presets' | 'full';

/**
 * Formula export entry
 */
export interface FormulaExportEntry {
  statId: string;
  statName: string;
  formula: string;
  validation: FormulaValidationResult;
  metadata: {
    isDerived: boolean;
    isCore: boolean;
    weight: number;
    description?: string;
  };
}

/**
 * Card export entry
 */
export interface CardExportEntry {
  cardId: string;
  title: string;
  color: string;
  icon?: string;
  statIds: string[];
  isCore: boolean;
  order: number;
  metadata: {
    isLocked?: boolean;
    isHidden?: boolean;
  };
}

/**
 * Preset export entry
 */
export interface PresetExportEntry {
  presetId: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  isBuiltIn: boolean;
  metadata: {
    createdAt: string;
    modifiedAt: string;
    targetTurns?: Record<string, number>;
  };
}

/**
 * Complete export package
 */
export interface FormulaExportPackage {
  version: string;
  exportedAt: string;
  exportedBy: string;
  scope: ExportScope;
  format: ExportFormat;
  checksum: string;
  metadata: {
    totalFormulas: number;
    totalCards: number;
    totalPresets: number;
    balancerVersion: string;
  };
  formulas?: FormulaExportEntry[];
  cards?: CardExportEntry[];
  presets?: PresetExportEntry[];
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    formulasToImport: number;
    cardsToImport: number;
    presetsToImport: number;
    conflicts: number;
  };
}

/**
 * Import options
 */
export interface ImportOptions {
  overwriteExisting: boolean;
  skipBuiltIn: boolean;
  validateFormulas: boolean;
  createBackup: boolean;
  dryRun: boolean;
}

/**
 * Zod schema for formula export entry
 */
export const FormulaExportEntrySchema = z.object({
  statId: z.string(),
  statName: z.string(),
  formula: z.string(),
  validation: z.object({
    valid: z.boolean(),
    error: z.string().optional(),
    usedStats: z.array(z.string()),
    warnings: z.array(z.object({
      type: z.enum(['range', 'division', 'complexity', 'performance']),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error']),
      position: z.object({
        start: z.number(),
        end: z.number(),
      }).optional(),
    })).optional(),
    safety: z.object({
      hasCycles: z.boolean(),
      complexity: z.enum(['low', 'medium', 'high']),
      estimatedOperations: z.number(),
      divisionRisk: z.boolean(),
      rangeIssues: z.array(z.object({
        stat: z.string(),
        issue: z.enum(['negative_input', 'zero_division', 'overflow_risk']),
        message: z.string(),
      })),
    }).optional(),
  }),
  metadata: z.object({
    isDerived: z.boolean(),
    isCore: z.boolean(),
    weight: z.number(),
    description: z.string().optional(),
  }),
});

/**
 * Zod schema for card export entry
 */
export const CardExportEntrySchema = z.object({
  cardId: z.string(),
  title: z.string(),
  color: z.string(),
  icon: z.string().optional(),
  statIds: z.array(z.string()),
  isCore: z.boolean(),
  order: z.number(),
  metadata: z.object({
    isLocked: z.boolean().optional(),
    isHidden: z.boolean().optional(),
  }),
});

/**
 * Zod schema for preset export entry
 */
export const PresetExportEntrySchema = z.object({
  presetId: z.string(),
  name: z.string(),
  description: z.string(),
  weights: z.record(z.number()),
  isBuiltIn: z.boolean(),
  metadata: z.object({
    createdAt: z.string(),
    modifiedAt: z.string(),
    targetTurns: z.record(z.number()).optional(),
  }),
});

/**
 * Zod schema for complete export package
 */
export const FormulaExportPackageSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  exportedBy: z.string(),
  scope: z.enum(['formulas', 'cards', 'presets', 'full']),
  format: z.enum(['json', 'markdown', 'yaml']),
  checksum: z.string(),
  metadata: z.object({
    totalFormulas: z.number(),
    totalCards: z.number(),
    totalPresets: z.number(),
    balancerVersion: z.string(),
  }),
  formulas: z.array(FormulaExportEntrySchema).optional(),
  cards: z.array(CardExportEntrySchema).optional(),
  presets: z.array(PresetExportEntrySchema).optional(),
});

export type FormulaExportPackageType = z.infer<typeof FormulaExportPackageSchema>;

/**
 * Balancer Formula Sharing Service
 */
export class FormulaSharingService {
  private static readonly SUPPORTED_VERSIONS = ['1.0.0', '1.1.0'];
  private static readonly CURRENT_VERSION = '1.1.0';

  /**
   * Export balancer configuration to specified format and scope
   */
  static async exportConfig(
    config: BalancerConfig,
    options: {
      scope: ExportScope;
      format: ExportFormat;
      exportedBy: string;
      includeMetadata?: boolean;
    }
  ): Promise<FormulaExportPackage> {
    const { scope, format, exportedBy, includeMetadata = true } = options;

    // Extract data based on scope
    const formulas = scope === 'formulas' || scope === 'full' 
      ? this.extractFormulas(config) 
      : undefined;
    
    const cards = scope === 'cards' || scope === 'full' 
      ? this.extractCards(config) 
      : undefined;
    
    const presets = scope === 'presets' || scope === 'full' 
      ? this.extractPresets(config) 
      : undefined;

    // Create export package
    const exportPackage: FormulaExportPackage = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy,
      scope,
      format,
      checksum: '', // Will be calculated below
      metadata: {
        totalFormulas: formulas?.length || 0,
        totalCards: cards?.length || 0,
        totalPresets: presets?.length || 0,
        balancerVersion: config.version,
      },
    };

    // Add data if metadata is requested
    if (includeMetadata) {
      exportPackage.formulas = formulas;
      exportPackage.cards = cards;
      exportPackage.presets = presets;
    }

    // Calculate checksum
    exportPackage.checksum = generateDataChecksum(exportPackage);

    return exportPackage;
  }

  /**
   * Import configuration from export package
   */
  static async importConfig(
    exportPackage: FormulaExportPackage,
    currentConfig: BalancerConfig,
    options: ImportOptions
  ): Promise<{
    validation: ImportValidationResult;
    updatedConfig?: BalancerConfig;
    backup?: BalancerConfig;
  }> {
    // Validate export package
    const packageValidation = this.validateExportPackage(exportPackage);
    if (!packageValidation.valid) {
      return {
        validation: {
          valid: false,
          errors: packageValidation.errors,
          warnings: [],
          summary: {
            formulasToImport: 0,
            cardsToImport: 0,
            presetsToImport: 0,
            conflicts: 0,
          },
        },
      };
    }

    // Create backup if requested
    let backup: BalancerConfig | undefined;
    if (options.createBackup && !options.dryRun) {
      backup = JSON.parse(JSON.stringify(currentConfig));
    }

    // Validate import compatibility
    const validation = await this.validateImport(exportPackage, currentConfig, options);
    
    if (!validation.valid || options.dryRun) {
      return { validation, backup };
    }

    // Apply import
    const updatedConfig = this.applyImport(exportPackage, currentConfig, options);

    return { validation, updatedConfig, backup };
  }

  /**
   * Convert export package to specified format string
   */
  static serializePackage(
    packageData: FormulaExportPackage,
    format: ExportFormat
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(packageData, null, 2);
      
      case 'markdown':
        return this.generateMarkdown(packageData);
      
      case 'yaml':
        return this.generateYAML(packageData);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse package from string
   */
  static parsePackage(
    data: string,
    format: ExportFormat
  ): FormulaExportPackage {
    let parsed: any;

    switch (format) {
      case 'json':
        parsed = JSON.parse(data);
        break;
      
      case 'yaml':
        // Note: Would need to add yaml parser dependency
        throw new Error('YAML format not yet implemented');
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return FormulaExportPackageSchema.parse(parsed);
  }

  /**
   * Extract formulas from configuration
   */
  private static extractFormulas(config: BalancerConfig): FormulaExportEntry[] {
    const formulas: FormulaExportEntry[] = [];

    for (const [statId, stat] of Object.entries(config.stats)) {
      if (stat.formula) {
        const validation = validateFormula(stat.formula, {
          stats: Object.fromEntries(
            Object.entries(config.stats).map(([id, s]) => [
              id,
              { min: s.min, max: s.max, current: s.defaultValue }
            ])
          ),
        });

        formulas.push({
          statId,
          statName: stat.label,
          formula: stat.formula,
          validation,
          metadata: {
            isDerived: stat.isDerived,
            isCore: stat.isCore,
            weight: stat.weight,
            description: stat.description,
          },
        });
      }
    }

    return formulas;
  }

  /**
   * Extract cards from configuration
   */
  private static extractCards(config: BalancerConfig): CardExportEntry[] {
    return Object.entries(config.cards).map(([cardId, card]) => ({
      cardId,
      title: card.title,
      color: card.color,
      icon: card.icon,
      statIds: card.statIds,
      isCore: card.isCore,
      order: card.order,
      metadata: {
        isLocked: card.isLocked,
        isHidden: card.isHidden,
      },
    }));
  }

  /**
   * Extract presets from configuration
   */
  private static extractPresets(config: BalancerConfig): PresetExportEntry[] {
    return Object.entries(config.presets).map(([presetId, preset]) => ({
      presetId,
      name: preset.name,
      description: preset.description,
      weights: preset.weights,
      isBuiltIn: preset.isBuiltIn,
      metadata: {
        createdAt: preset.createdAt,
        modifiedAt: preset.modifiedAt,
        targetTurns: config.targetTurns,
      },
    }));
  }

  /**
   * Validate export package structure
   */
  private static validateExportPackage(packageData: any): { valid: boolean; errors: string[] } {
    const result = FormulaExportPackageSchema.safeParse(packageData);
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }

    // Check version compatibility
    if (!this.SUPPORTED_VERSIONS.includes(result.data.version)) {
      return {
        valid: false,
        errors: [`Unsupported version: ${result.data.version}`],
      };
    }

    return { valid: false, errors: [] };
  }

  /**
   * Validate import compatibility
   */
  private static async validateImport(
    exportPackage: FormulaExportPackage,
    currentConfig: BalancerConfig,
    options: ImportOptions
  ): Promise<ImportValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let formulasToImport = 0;
    let cardsToImport = 0;
    let presetsToImport = 0;
    let conflicts = 0;

    // Validate formulas
    if (exportPackage.formulas) {
      for (const formula of exportPackage.formulas) {
        // Check if stat already exists
        if (currentConfig.stats[formula.statId]) {
          conflicts++;
          if (!options.overwriteExisting) {
            errors.push(`Stat ${formula.statId} already exists`);
            continue;
          }
        }

        // Validate formula if requested
        if (options.validateFormulas) {
          const validation = validateFormula(formula.formula, {
            stats: Object.fromEntries(
              Object.entries(currentConfig.stats).map(([id, s]) => [
                id,
                { min: s.min, max: s.max, current: s.defaultValue }
              ])
            ),
          });

          if (!validation.valid) {
            errors.push(`Invalid formula for ${formula.statId}: ${validation.error}`);
            continue;
          }

          if (validation.warnings && validation.warnings.length > 0) {
            warnings.push(
              `Formula warnings for ${formula.statId}: ${validation.warnings.map(w => w.message).join(', ')}`
            );
          }
        }

        formulasToImport++;
      }
    }

    // Validate cards
    if (exportPackage.cards) {
      for (const card of exportPackage.cards) {
        if (currentConfig.cards[card.cardId]) {
          conflicts++;
          if (!options.overwriteExisting) {
            errors.push(`Card ${card.cardId} already exists`);
            continue;
          }
        }

        // Check if all referenced stats exist
        const missingStats = card.statIds.filter(statId => !currentConfig.stats[statId]);
        if (missingStats.length > 0) {
          errors.push(`Card ${card.cardId} references missing stats: ${missingStats.join(', ')}`);
          continue;
        }

        cardsToImport++;
      }
    }

    // Validate presets
    if (exportPackage.presets) {
      for (const preset of exportPackage.presets) {
        if (preset.isBuiltIn && options.skipBuiltIn) {
          warnings.push(`Skipping built-in preset ${preset.presetId}`);
          continue;
        }

        if (currentConfig.presets[preset.presetId]) {
          conflicts++;
          if (!options.overwriteExisting) {
            errors.push(`Preset ${preset.presetId} already exists`);
            continue;
          }
        }

        // Check if all weighted stats exist
        const missingStats = Object.keys(preset.weights).filter(statId => !currentConfig.stats[statId]);
        if (missingStats.length > 0) {
          errors.push(`Preset ${preset.presetId} weights reference missing stats: ${missingStats.join(', ')}`);
          continue;
        }

        presetsToImport++;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        formulasToImport,
        cardsToImport,
        presetsToImport,
        conflicts,
      },
    };
  }

  /**
   * Apply import to configuration
   */
  private static applyImport(
    exportPackage: FormulaExportPackage,
    currentConfig: BalancerConfig,
    options: ImportOptions
  ): BalancerConfig {
    const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

    // Apply formulas
    if (exportPackage.formulas) {
      for (const formula of exportPackage.formulas) {
        const existingStat = updatedConfig.stats[formula.statId];
        
        if (existingStat) {
          // Update existing stat
          existingStat.formula = formula.formula;
          existingStat.isDerived = formula.metadata.isDerived;
        } else {
          // Create new stat
          updatedConfig.stats[formula.statId] = {
            id: formula.statId,
            label: formula.statName,
            type: 'number' as const,
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 0,
            weight: formula.metadata.weight,
            isCore: formula.metadata.isCore,
            isDerived: formula.metadata.isDerived,
            formula: formula.formula,
            description: formula.metadata.description,
          };
        }
      }
    }

    // Apply cards
    if (exportPackage.cards) {
      for (const card of exportPackage.cards) {
        updatedConfig.cards[card.cardId] = {
          id: card.cardId,
          title: card.title,
          color: card.color,
          icon: card.icon,
          statIds: card.statIds,
          isCore: card.isCore,
          order: card.order,
          isLocked: card.metadata.isLocked,
          isHidden: card.metadata.isHidden,
        };
      }
    }

    // Apply presets
    if (exportPackage.presets) {
      for (const preset of exportPackage.presets) {
        if (preset.isBuiltIn && options.skipBuiltIn) {
          continue;
        }

        updatedConfig.presets[preset.presetId] = {
          id: preset.presetId,
          name: preset.name,
          description: preset.description,
          weights: preset.weights,
          isBuiltIn: preset.isBuiltIn,
          createdAt: preset.metadata.createdAt,
          modifiedAt: new Date().toISOString(),
        };
      }
    }

    return updatedConfig;
  }

  /**
   * Generate markdown documentation
   */
  private static generateMarkdown(packageData: FormulaExportPackage): string {
    const lines: string[] = [];

    // Header
    lines.push('# Balancer Formula Export');
    lines.push('');
    lines.push(`**Version:** ${packageData.version}`);
    lines.push(`**Exported:** ${new Date(packageData.exportedAt).toLocaleString()}`);
    lines.push(`**By:** ${packageData.exportedBy}`);
    lines.push(`**Scope:** ${packageData.scope}`);
    lines.push('');

    // Metadata
    lines.push('## Metadata');
    lines.push('');
    lines.push('| Metric | Count |');
    lines.push('|--------|-------|');
    lines.push(`| Formulas | ${packageData.metadata.totalFormulas} |`);
    lines.push(`| Cards | ${packageData.metadata.totalCards} |`);
    lines.push(`| Presets | ${packageData.metadata.totalPresets} |`);
    lines.push(`| Balancer Version | ${packageData.metadata.balancerVersion} |`);
    lines.push('');

    // Formulas
    if (packageData.formulas && packageData.formulas.length > 0) {
      lines.push('## Formulas');
      lines.push('');

      for (const formula of packageData.formulas) {
        lines.push(`### ${formula.statName}`);
        lines.push('');
        lines.push(`**ID:** \`${formula.statId}\``);
        lines.push(`**Formula:** \`${formula.formula}\``);
        lines.push(`**Valid:** ${formula.validation.valid ? '✅' : '❌'}`);
        
        if (formula.validation.error) {
          lines.push(`**Error:** ${formula.validation.error}`);
        }
        
        lines.push(`**Derived:** ${formula.metadata.isDerived ? 'Yes' : 'No'}`);
        lines.push(`**Core:** ${formula.metadata.isCore ? 'Yes' : 'No'}`);
        lines.push(`**Weight:** ${formula.metadata.weight}`);
        
        if (formula.metadata.description) {
          lines.push(`**Description:** ${formula.metadata.description}`);
        }
        
        lines.push('');
      }
    }

    // Cards
    if (packageData.cards && packageData.cards.length > 0) {
      lines.push('## Cards');
      lines.push('');

      for (const card of packageData.cards) {
        lines.push(`### ${card.title}`);
        lines.push('');
        lines.push(`**ID:** \`${card.cardId}\``);
        lines.push(`**Color:** ${card.color}`);
        lines.push(`**Stats:** ${card.statIds.join(', ')}`);
        lines.push(`**Core:** ${card.isCore ? 'Yes' : 'No'}`);
        lines.push(`**Order:** ${card.order}`);
        lines.push('');
      }
    }

    // Presets
    if (packageData.presets && packageData.presets.length > 0) {
      lines.push('## Presets');
      lines.push('');

      for (const preset of packageData.presets) {
        lines.push(`### ${preset.name}`);
        lines.push('');
        lines.push(`**ID:** \`${preset.presetId}\``);
        lines.push(`**Built-in:** ${preset.isBuiltIn ? 'Yes' : 'No'}`);
        lines.push(`**Description:** ${preset.description}`);
        lines.push('');
        lines.push('**Weights:**');
        lines.push('');
        
        for (const [statId, weight] of Object.entries(preset.weights)) {
          lines.push(`- ${statId}: ${weight}`);
        }
        
        lines.push('');
      }
    }

    // Footer
    lines.push('---');
    lines.push(`**Checksum:** \`${packageData.checksum}\``);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate YAML (placeholder - would need yaml library)
   */
  private static generateYAML(packageData: FormulaExportPackage): string {
    // This is a placeholder - would need to add a YAML library
    throw new Error('YAML export not yet implemented');
  }
}
