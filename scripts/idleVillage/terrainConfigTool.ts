/**
 * NP-092 – Terrain Modifier Config Tool CLI
 *
 * Command-line interface for batch configuration of terrain modifiers.
 * Provides preset management, validation, import/export, and bulk operations.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { TerrainModifierConfigTool } from '@/ui/idleVillage/tools/TerrainModifierConfigTool';
import { TerrainModifierPresetManager, type PresetCategory } from '@/ui/idleVillage/tools/TerrainModifierPresetManager';

/**
 * CLI configuration options
 */
interface TerrainConfigCLIConfig {
  /** Command to execute */
  command: 'list' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'validate' | 'analyze' | 'batch' | 'presets';
  /** Configuration directory */
  configDir?: string;
  /** Preset ID */
  presetId?: string;
  /** Preset name */
  presetName?: string;
  /** Preset description */
  presetDescription?: string;
  /** Tags for filtering/searching */
  tags?: string[];
  /** Category filter */
  category?: string;
  /** Output file path */
  outputPath?: string;
  /** Input file path */
  inputPath?: string;
  /** Batch operation file */
  batchFile?: string;
  /** JSON output flag */
  json?: boolean;
  /** Verbose output flag */
  verbose?: boolean;
}

/**
 * Default CLI configuration
 */
const DEFAULT_CLI_CONFIG: Partial<TerrainConfigCLIConfig> = {
  configDir: './data/terrain-modifiers',
  json: false,
  verbose: false,
};

/**
 * Terrain Modifier Config Tool CLI
 */
export class TerrainConfigToolCLI {
  private config: TerrainConfigCLIConfig;
  private configTool: TerrainModifierConfigTool;
  private presetManager: TerrainModifierPresetManager;

  constructor(config: TerrainConfigCLIConfig) {
    this.config = { ...DEFAULT_CLI_CONFIG, ...config };
    this.configTool = new TerrainModifierConfigTool(this.config.configDir);
    this.presetManager = new TerrainModifierPresetManager(this.configTool);
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(args: string[]): TerrainConfigCLIConfig {
    const parsed: TerrainConfigCLIConfig = {
      command: 'list',
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'list':
        case 'create':
        case 'update':
        case 'delete':
        case 'export':
        case 'import':
        case 'validate':
        case 'analyze':
        case 'batch':
        case 'presets':
          parsed.command = arg;
          break;
        case '--config-dir':
        case '-d':
          parsed.configDir = args[++i];
          break;
        case '--preset-id':
        case '-i':
          parsed.presetId = args[++i];
          break;
        case '--name':
        case '-n':
          parsed.presetName = args[++i];
          break;
        case '--description':
        case '--desc':
          parsed.presetDescription = args[++i];
          break;
        case '--tags':
        case '-t':
          parsed.tags = args[++i].split(',');
          break;
        case '--category':
        case '-c':
          parsed.category = args[++i];
          break;
        case '--output':
        case '-o':
          parsed.outputPath = args[++i];
          break;
        case '--input':
          parsed.inputPath = args[++i];
          break;
        case '--batch-file':
        case '-b':
          parsed.batchFile = args[++i];
          break;
        case '--json':
        case '-j':
          parsed.json = true;
          break;
        case '--verbose':
        case '-v':
          parsed.verbose = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return { ...DEFAULT_CLI_CONFIG, ...parsed };
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
Terrain Modifier Config Tool CLI

Usage: terrain-config <command> [options]

Commands:
  list          List all presets
  create        Create a new preset
  update        Update an existing preset
  delete        Delete a preset
  export        Export preset(s) to file
  import        Import preset from file
  validate      Validate preset configuration
  analyze       Analyze preset compatibility and statistics
  batch         Execute batch operations from file
  presets       Manage preset collections and templates

Options:
  -d, --config-dir <dir>     Configuration directory [default: ./data/terrain-modifiers]
  -i, --preset-id <id>       Preset ID for operations
  -n, --name <name>          Preset name
  --desc <description>       Preset description
  -t, --tags <tags>          Comma-separated tags
  -c, --category <category>  Category filter (environment|structures|events|balanced|challenging|custom)
  -o, --output <file>        Output file path
  --input <file>             Input file path
  -b, --batch-file <file>    Batch operations file
  -j, --json                 JSON output format
  -v, --verbose              Verbose output
  -h, --help                 Show this help message

Examples:
  # List all presets
  terrain-config list

  # Create a new preset
  terrain-config create --preset-id my-preset --name "My Preset" --desc "Custom configuration"

  # Export preset to JSON
  terrain-config export --preset-id my-preset --output ./my-preset.json

  # Import preset from file
  terrain-config import --input ./preset.json

  # Validate all presets
  terrain-config validate

  # Analyze preset compatibility
  terrain-config analyze --preset-id preset1,preset2,preset3

  # Execute batch operations
  terrain-config batch --batch-file ./operations.json

  # Show preset collections
  terrain-config presets --category environment
`);
  }

  /**
   * Execute list command
   */
  private async executeList(): Promise<void> {
    const presets = this.configTool.getAllPresets();

    if (this.config.json) {
      console.log(JSON.stringify(presets, null, 2));
      return;
    }

    console.log(`📋 Terrain Modifier Presets (${presets.length})\n`);

    if (presets.length === 0) {
      console.log('No presets found. Create one with: terrain-config create --preset-id <id> --name <name>');
      return;
    }

    presets.forEach((preset, index) => {
      console.log(`${index + 1}. ${preset.name} (${preset.id})`);
      console.log(`   ${preset.description}`);
      console.log(`   Tags: ${preset.tags.join(', ') || 'None'}`);
      console.log(`   Modifiers: ${preset.modifiers.length}, Layers: ${preset.layers.length}`);
      console.log(`   Created: ${new Date(preset.createdAt).toLocaleDateString()}`);
      console.log('');
    });
  }

  /**
   * Execute create command
   */
  private async executeCreate(): Promise<void> {
    if (!this.config.presetId || !this.config.presetName) {
      throw new Error('Preset ID and name are required. Use --preset-id and --name options.');
    }

    // For now, create an empty preset. In a real implementation, you might want to
    // provide default modifiers or allow specification of initial modifiers.
    const preset = this.configTool.createPreset(
      this.config.presetId,
      this.config.presetName,
      this.config.presetDescription || `Preset: ${this.config.presetName}`,
      [], // Empty modifiers initially
      [], // Empty layers initially
      this.config.tags || []
    );

    if (this.config.json) {
      console.log(JSON.stringify(preset, null, 2));
    } else {
      console.log(`✅ Created preset: ${preset.name} (${preset.id})`);
      console.log(`   Description: ${preset.description}`);
      console.log(`   Tags: ${preset.tags.join(', ') || 'None'}`);
    }
  }

  /**
   * Execute update command
   */
  private async executeUpdate(): Promise<void> {
    if (!this.config.presetId) {
      throw new Error('Preset ID is required. Use --preset-id option.');
    }

    const updates: any = {};
    if (this.config.presetName) updates.name = this.config.presetName;
    if (this.config.presetDescription) updates.description = this.config.presetDescription;
    if (this.config.tags) updates.tags = this.config.tags;

    const preset = this.configTool.updatePreset(this.config.presetId, updates);

    if (!preset) {
      throw new Error(`Preset not found: ${this.config.presetId}`);
    }

    if (this.config.json) {
      console.log(JSON.stringify(preset, null, 2));
    } else {
      console.log(`✅ Updated preset: ${preset.name} (${preset.id})`);
    }
  }

  /**
   * Execute delete command
   */
  private async executeDelete(): Promise<void> {
    if (!this.config.presetId) {
      throw new Error('Preset ID is required. Use --preset-id option.');
    }

    const deleted = this.configTool.deletePreset(this.config.presetId);

    if (!deleted) {
      throw new Error(`Preset not found or could not be deleted: ${this.config.presetId}`);
    }

    if (this.config.json) {
      console.log(JSON.stringify({ deleted: true, presetId: this.config.presetId }, null, 2));
    } else {
      console.log(`✅ Deleted preset: ${this.config.presetId}`);
    }
  }

  /**
   * Execute export command
   */
  private async executeExport(): Promise<void> {
    if (!this.config.presetId) {
      throw new Error('Preset ID is required. Use --preset-id option.');
    }

    const outputPath = this.config.outputPath || `./${this.config.presetId}.json`;
    const success = this.configTool.exportConfiguration(this.config.presetId, outputPath);

    if (!success) {
      throw new Error(`Failed to export preset: ${this.config.presetId}`);
    }

    if (this.config.json) {
      console.log(JSON.stringify({ exported: true, presetId: this.config.presetId, path: outputPath }, null, 2));
    } else {
      console.log(`✅ Exported preset: ${this.config.presetId} → ${outputPath}`);
    }
  }

  /**
   * Execute import command
   */
  private async executeImport(): Promise<void> {
    if (!this.config.inputPath) {
      throw new Error('Input file path is required. Use --input option.');
    }

    if (!existsSync(this.config.inputPath)) {
      throw new Error(`Input file not found: ${this.config.inputPath}`);
    }

    const preset = this.configTool.importConfiguration(
      this.config.inputPath,
      this.config.presetId,
      this.config.presetName,
      this.config.presetDescription
    );

    if (!preset) {
      throw new Error(`Failed to import configuration from: ${this.config.inputPath}`);
    }

    if (this.config.json) {
      console.log(JSON.stringify(preset, null, 2));
    } else {
      console.log(`✅ Imported preset: ${preset.name} (${preset.id})`);
      console.log(`   From: ${this.config.inputPath}`);
    }
  }

  /**
   * Execute validate command
   */
  private async executeValidate(): Promise<void> {
    const presets = this.configTool.getAllPresets();
    let totalValid = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    const results: any[] = [];

    for (const preset of presets) {
      // Convert preset to persistence format for validation
      const persistenceConfig = {
        version: 1,
        modifiers: preset.modifiers,
        layers: preset.layers.map(layer => ({
          id: layer.id,
          visible: layer.defaultVisible,
          order: layer.order,
        })),
      };

      const validation = this.configTool.validateConfiguration(persistenceConfig);
      results.push({
        presetId: preset.id,
        presetName: preset.name,
        valid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        stats: validation.stats,
      });

      if (validation.isValid) totalValid++;
      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    }

    if (this.config.json) {
      console.log(JSON.stringify({
        summary: {
          totalPresets: presets.length,
          validPresets: totalValid,
          totalErrors,
          totalWarnings,
        },
        results,
      }, null, 2));
    } else {
      console.log(`🔍 Validation Results\n`);
      console.log(`Total Presets: ${presets.length}`);
      console.log(`Valid Presets: ${totalValid}`);
      console.log(`Total Errors: ${totalErrors}`);
      console.log(`Total Warnings: ${totalWarnings}\n`);

      results.forEach(result => {
        const status = result.valid ? '✅' : '❌';
        console.log(`${status} ${result.presetName} (${result.presetId})`);

        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.length}`);
          if (this.config.verbose) {
            result.errors.forEach((error: string) => console.log(`     - ${error}`));
          }
        }

        if (result.warnings.length > 0) {
          console.log(`   Warnings: ${result.warnings.length}`);
          if (this.config.verbose) {
            result.warnings.forEach((warning: string) => console.log(`     - ${warning}`));
          }
        }

        console.log('');
      });
    }
  }

  /**
   * Execute analyze command
   */
  private async executeAnalyze(): Promise<void> {
    const presetIds = this.config.presetId ? this.config.presetId.split(',') : [];
    const presets = this.configTool.getAllPresets();

    if (presetIds.length > 0) {
      // Analyze specific preset compatibility
      const compatibility = this.presetManager.analyzePresetCompatibility(presetIds);

      if (this.config.json) {
        console.log(JSON.stringify(compatibility, null, 2));
      } else {
        console.log(`🔗 Preset Compatibility Analysis\n`);
        console.log(`Presets: ${presetIds.join(', ')}\n`);

        if (compatibility.compatible) {
          console.log('✅ All presets are compatible');
        } else {
          console.log('⚠️ Compatibility issues found:');
          compatibility.conflicts.forEach(conflict => {
            const icon = conflict.severity === 'high' ? '🔴' :
                        conflict.severity === 'medium' ? '🟡' : '🟢';
            console.log(`   ${icon} ${conflict.description}`);
          });
        }

        console.log('\n💡 Recommendations:');
        compatibility.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
    } else {
      // Show overall statistics
      const stats = this.configTool.getStatistics();

      if (this.config.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(`📊 Configuration Statistics\n`);
        console.log(`Total Presets: ${stats.totalPresets}`);
        console.log(`Total Modifiers: ${stats.totalModifiers}`);
        console.log(`Total Layers: ${stats.totalLayers}`);
        console.log(`Avg Modifiers/Preset: ${stats.averageModifiersPerPreset.toFixed(1)}\n`);

        console.log('📂 Presets by Category:');
        Object.entries(stats.presetsByTag).forEach(([category, count]) => {
          console.log(`   ${category}: ${count}`);
        });

        console.log('\n🏷️ Most Used Tags:');
        stats.mostUsedTags.slice(0, 10).forEach(({ tag, count }) => {
          console.log(`   ${tag}: ${count}`);
        });
      }
    }
  }

  /**
   * Execute batch command
   */
  private async executeBatch(): Promise<void> {
    if (!this.config.batchFile) {
      throw new Error('Batch file is required. Use --batch-file option.');
    }

    if (!existsSync(this.config.batchFile)) {
      throw new Error(`Batch file not found: ${this.config.batchFile}`);
    }

    const batchContent = readFileSync(this.config.batchFile, 'utf8');
    const batchOperations = JSON.parse(batchContent);

    if (!Array.isArray(batchOperations)) {
      throw new Error('Batch file must contain an array of operations');
    }

    console.log(`🔄 Executing batch operations from: ${this.config.batchFile}\n`);

    const results = [];

    for (const operation of batchOperations) {
      try {
        const result = await this.executeBatchOperation(operation);
        results.push({ operation, success: true, result });
        console.log(`✅ ${operation.type}: ${operation.id || 'batch operation'}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ operation, success: false, error: errorMessage });
        console.log(`❌ ${operation.type}: ${errorMessage}`);
      }
    }

    console.log(`\n📊 Batch execution completed: ${results.filter(r => r.success).length}/${results.length} successful`);

    if (this.config.json) {
      console.log(JSON.stringify(results, null, 2));
    }
  }

  /**
   * Execute a single batch operation
   */
  private async executeBatchOperation(operation: any): Promise<any> {
    switch (operation.type) {
      case 'create_preset':
        return this.configTool.createPreset(
          operation.id,
          operation.name,
          operation.description,
          operation.modifiers || [],
          operation.layers || [],
          operation.tags || []
        );

      case 'update_preset':
        return this.configTool.updatePreset(operation.id, operation.updates);

      case 'delete_preset':
        return this.configTool.deletePreset(operation.id);

      case 'export_preset':
        return this.configTool.exportConfiguration(operation.id, operation.outputPath);

      case 'import_preset':
        return this.configTool.importConfiguration(
          operation.inputPath,
          operation.id,
          operation.name,
          operation.description
        );

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Execute presets command
   */
  private async executePresets(): Promise<void> {
    const collections = this.presetManager.getAllCollections();

    if (this.config.category) {
      // Filter by category
      const categoryPresets = this.presetManager.getCollectionsByCategory(this.config.category as PresetCategory);

      if (this.config.json) {
        console.log(JSON.stringify(categoryPresets, null, 2));
      } else {
        console.log(`📂 ${this.config.category} Preset Collections (${categoryPresets.length})\n`);

        categoryPresets.forEach(collection => {
          console.log(`📁 ${collection.name} (${collection.id})`);
          console.log(`   ${collection.description}`);
          console.log(`   Presets: ${collection.presets.length}`);
          console.log(`   Created: ${new Date(collection.createdAt).toLocaleDateString()}\n`);
        });
      }
    } else {
      // Show all collections
      if (this.config.json) {
        console.log(JSON.stringify(collections, null, 2));
      } else {
        console.log(`📂 Preset Collections (${collections.length})\n`);

        collections.forEach(collection => {
          console.log(`📁 ${collection.name} (${collection.id})`);
          console.log(`   Category: ${collection.category}`);
          console.log(`   ${collection.description}`);
          console.log(`   Presets: ${collection.presets.length}`);
          console.log('');
        });
      }
    }
  }

  /**
   * Run the CLI
   */
  public async run(args: string[]): Promise<void> {
    try {
      this.config = this.parseArgs(args);

      switch (this.config.command) {
        case 'list':
          await this.executeList();
          break;
        case 'create':
          await this.executeCreate();
          break;
        case 'update':
          await this.executeUpdate();
          break;
        case 'delete':
          await this.executeDelete();
          break;
        case 'export':
          await this.executeExport();
          break;
        case 'import':
          await this.executeImport();
          break;
        case 'validate':
          await this.executeValidate();
          break;
        case 'analyze':
          await this.executeAnalyze();
          break;
        case 'batch':
          await this.executeBatch();
          break;
        case 'presets':
          await this.executePresets();
          break;
        default:
          throw new Error(`Unknown command: ${this.config.command}`);
      }
    } catch (error) {
      console.error('CLI execution failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new TerrainConfigToolCLI({} as TerrainConfigCLIConfig);
  await cli.run(process.argv.slice(2));
}
