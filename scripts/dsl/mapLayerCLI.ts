#!/usr/bin/env tsx

/**
 * NP-031 – Idle Village Map Layer Configuration DSL
 * 
 * CLI for map layer DSL configuration with preview,
 * validation, and testing capabilities.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { program } from 'commander';
import { MapLayerDSLProcessor, DSL_TEMPLATES, getTemplateNames, getTemplate } from '../../src/ui/idleVillage/dsl/mapLayerConfig';

interface CLIOptions {
  input?: string;
  output?: string;
  template?: string;
  validate?: boolean;
  preview?: boolean;
  watch?: boolean;
  format?: boolean;
  listTemplates?: boolean;
  help?: boolean;
  verbose?: boolean;
}

class MapLayerCLI {
  private processor: MapLayerDSLProcessor;
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.processor = MapLayerDSLProcessor.getInstance();
    this.options = options;
  }

  /**
   * Process DSL file
   */
  async processFile(): Promise<void> {
    if (!this.options.input) {
      console.error('Error: Input file is required');
      process.exit(1);
    }

    if (!existsSync(this.options.input)) {
      console.error(`Error: Input file not found: ${this.options.input}`);
      process.exit(1);
    }

    console.log(`🔧 Processing DSL file: ${this.options.input}`);
    
    try {
      const dsl = readFileSync(this.options.input, 'utf8');
      const result = this.processor.parse(dsl, true);
      
      if (!result.success) {
        console.error('❌ DSL parsing failed:');
        result.errors.forEach(error => {
          console.error(`   Line ${error.line}, Column ${error.column}: ${error.message}`);
        });
        process.exit(1);
      }

      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`   Line ${warning.line}, Column ${warning.column}: ${warning.message}`);
        });
      }

      console.log(`✅ Parsed successfully: ${result.context.layers.length} layers, ${result.context.variables.length} variables`);

      // Validate if requested
      if (this.options.validate) {
        await this.validate(result);
      }

      // Preview if requested
      if (this.options.preview) {
        await this.preview(result);
      }

      // Format if requested
      if (this.options.format) {
        await this.format(dsl);
      }

      // Export if output specified
      if (this.options.output) {
        await this.export(result);
      }

      // Watch if requested
      if (this.options.watch) {
        await this.watch(this.options.input);
      }

    } catch (error) {
      console.error(`❌ Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Generate template
   */
  async generateTemplate(): Promise<void> {
    if (!this.options.template) {
      console.error('Error: Template name is required');
      process.exit(1);
    }

    const template = getTemplate(this.options.template);
    if (!template) {
      console.error(`Error: Template '${this.options.template}' not found`);
      console.log('Available templates:');
      getTemplateNames().forEach(name => {
        console.log(`  - ${name}`);
      });
      process.exit(1);
    }

    console.log(`📝 Generating template: ${this.options.template}`);
    
    if (this.options.output) {
      const outputDir = dirname(this.options.output);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      writeFileSync(this.options.output, template, 'utf8');
      console.log(`✅ Template saved to: ${this.options.output}`);
    } else {
      console.log(template);
    }
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<void> {
    console.log('📋 Available templates:');
    
    getTemplateNames().forEach(name => {
      console.log(`  - ${name}`);
      
      if (this.options.verbose) {
        const template = getTemplate(name);
        if (template) {
          const lines = template.split('\n').length;
          console.log(`    Lines: ${lines}`);
          console.log(`    Preview: ${template.substring(0, 100)}${template.length > 100 ? '...' : ''}`);
        }
      }
    });
  }

  /**
   * Validate DSL
   */
  async validate(result: any): Promise<void> {
    console.log('🔍 Validating DSL...');
    
    // Check for required properties
    const requiredProps = ['id', 'type', 'name'];
    const missingProps = new Set<string>();
    
    result.context.layers.forEach((layer: any, index: number) => {
      requiredProps.forEach(prop => {
        if (!layer[prop]) {
          missingProps.add(`Layer ${index + 1}: ${prop}`);
        }
      });
    });
    
    if (missingProps.size > 0) {
      console.error('❌ Validation failed - Missing required properties:');
      missingProps.forEach(prop => {
        console.error(`   ${prop}`);
      });
      process.exit(1);
    }
    
    // Check for duplicate IDs
    const layerIds = new Set<string>();
    const duplicateIds = new Set<string>();
    
    result.context.layers.forEach((layer: any) => {
      if (layerIds.has(layer.id)) {
        duplicateIds.add(layer.id);
      } else {
        layerIds.add(layer.id);
      }
    });
    
    if (duplicateIds.size > 0) {
      console.error('❌ Validation failed - Duplicate layer IDs:');
      duplicateIds.forEach(id => {
        console.error(`   ${id}`);
      });
      process.exit(1);
    }
    
    // Check for circular dependencies
    const dependencies = new Map<string, string[]>();
    result.context.layers.forEach((layer: any) => {
      dependencies.set(layer.id, layer.metadata.dependencies || []);
    });
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    function hasCircularDependency(layerId: string): boolean {
      if (recursionStack.has(layerId)) return true;
      if (visited.has(layerId)) return false;
      
      visited.add(layerId);
      recursionStack.add(layerId);
      
      const deps = dependencies.get(layerId) || [];
      for (const depId of deps) {
        if (hasCircularDependency(depId)) return true;
      }
      
      recursionStack.delete(layerId);
      return false;
    }
    
    const circularDeps = Array.from(dependencies.keys()).filter(hasCircularDependency);
    
    if (circularDeps.length > 0) {
      console.error('❌ Validation failed - Circular dependencies detected:');
      circularDeps.forEach(id => {
        console.error(`   ${id}`);
      });
      process.exit(1);
    }
    
    console.log('✅ Validation passed');
  }

  /**
   * Preview DSL configuration
   */
  async preview(result: any): Promise<void> {
    console.log('👁 Previewing DSL configuration...');
    console.log('');
    
    console.log('📊 Configuration Summary:');
    console.log(`   Layers: ${result.context.layers.length}`);
    console.log(`   Variables: ${result.context.variables.length}`);
    console.log(`   Imports: ${result.context.imports.length}`);
    console.log(`   Version: ${result.context.version}`);
    console.log(`   Name: ${result.context.metadata.name}`);
    
    if (result.context.layers.length > 0) {
      console.log('');
      console.log('🗺️ Layers:');
      
      result.context.layers.forEach((layer: any, index: number) => {
        console.log(`   ${index + 1}. ${layer.name} (${layer.id})`);
        console.log(`      Type: ${layer.type}`);
        console.log(`      Visible: ${layer.visibility?.visible || 'unknown'}`);
        console.log(`      Z-Index: ${layer.visibility?.zIndex || 'unknown'}`);
        console.log(`      Category: ${layer.metadata?.category || 'unknown'}`);
        console.log(`      Tags: ${(layer.metadata?.tags || []).join(', ') || 'none'}`);
        
        if (layer.source) {
          console.log(`      Source: ${layer.source.type} - ${layer.source.path || layer.source.url || 'unknown'}`);
        }
        
        if (layer.style) {
          console.log(`      Style: ${layer.style.type}`);
        }
        
        console.log('');
      });
    }
    
    if (result.context.variables.length > 0) {
      console.log('🔧 Variables:');
      Object.entries(result.context.variables).forEach(([name, value]) => {
        console.log(`   ${name}: ${JSON.stringify(value)}`);
      });
      console.log('');
    }
  }

  /**
   * Format DSL
   */
  async format(dsl: string): Promise<void> {
    console.log('🎨 Formatting DSL...');
    
    try {
      // Basic formatting - in a real implementation, use a proper formatter like Prettier
      const formatted = dsl
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .replace(/\{\s+/g, '{\n  ')
        .replace(/\}\s+/g, '\n}')
        .replace(/;\s+/g, ';\n')
        .replace(/,\s+/g, ',\n  ');
      
      console.log('✅ DSL formatted');
      
      if (this.options.output) {
        const outputDir = dirname(this.options.output);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }
        
        writeFileSync(this.options.output, formatted, 'utf8');
        console.log(`✅ Formatted DSL saved to: ${this.options.output}`);
      } else {
        console.log('Formatted DSL:');
        console.log('');
        console.log(formatted);
      }
    } catch (error) {
      console.error(`❌ Error formatting DSL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Export configuration
   */
  async export(result: any): Promise<void> {
    console.log('📤 Exporting configuration...');
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: result.context.version,
        layerCount: result.context.layers.length,
        variableCount: result.context.variables.length,
        importCount: result.context.imports.length,
      },
      context: result.context,
      layers: result.context.layers,
      parseResult: {
        success: result.success,
        errors: result.errors,
        warnings: result.warnings,
      },
    };
    
    const outputDir = dirname(this.options.output!);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(this.options.output!, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`✅ Configuration exported to: ${this.options.output}`);
  }

  /**
   * Watch file for changes
   */
  async watch(filePath: string): Promise<void> {
    console.log(`👀 Watching for changes in: ${filePath}`);
    console.log('Press Ctrl+C to stop watching');
    
    let lastModified = Date.now();
    
    const interval = setInterval(() => {
      try {
        const stats = require('fs').statSync(filePath);
        if (stats.mtime > lastModified) {
          console.log(`🔄 File changed: ${filePath}`);
          lastModified = stats.mtime;
          
          // Re-process the file
          const dsl = readFileSync(filePath, 'utf8');
          const result = this.processor.parse(dsl, false);
          
          if (!result.success) {
            console.error('❌ DSL parsing failed after change:');
            result.errors.forEach(error => {
              console.error(`   Line ${error.line}, Column ${error.column}: ${error.message}`);
            });
          } else {
            console.log('✅ Re-parsed successfully');
            
            if (this.options.preview) {
              await this.preview(result);
            }
            
            if (this.options.output) {
              await this.export(result);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error watching file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 1000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Stopped watching');
      process.exit(0);
    });
  }

  /**
   * Run CLI command
   */
  async run(): Promise<void> {
    try {
      if (this.options.listTemplates) {
        await this.listTemplates();
      } else if (this.options.template) {
        await this.generateTemplate();
      } else {
        await this.processFile();
      }
    } catch (error) {
      console.error(`❌ CLI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }
}

// CLI setup
program
  .name('map-layer-dsl')
  .description('Map Layer Configuration DSL CLI')
  .version('1.0.0')
  .option('-i, --input <file>', 'Input DSL file')
  .option('-o, --output <file>', 'Output file for export')
  .option('-t, --template <name>', 'Template to generate')
  .option('--validate', 'Validate DSL configuration')
  .option('--preview', 'Preview configuration')
  .option('--watch', 'Watch file for changes')
  .option('--format', 'Format DSL code')
  .option('--list-templates', 'List available templates')
  .option('--verbose', 'Verbose output')
  .option('-h, --help', 'Show help')
  .parse();

const options = program.opts() as CLIOptions;

// Create and run CLI
const cli = new MapLayerCLI(options);
cli.run().catch(error => {
  console.error('CLI Error:', error);
  process.exit(1);
});
