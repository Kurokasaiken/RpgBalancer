#!/usr/bin/env tsx
/**
 * Stress Testing Heatmap CLI - NP-123
 * 
 * CLI tool to generate ASCII/PNG heatmaps from Marginal Utility analysis results.
 * Reads JSON results from Phase 10.5 stress testing and renders visualizations.
 * 
 * @since 2026-01-24
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import type { MarginalUtilityAnalysis } from '../../src/balancing/stressTesting/MarginalUtilityTypes';
import { StressHeatmapRenderer, createHeatmapRenderer } from '../../src/balancing/stressTesting/StressHeatmapRenderer';
import type { HeatmapConfig } from '../../src/balancing/config/stressTesting/heatmapConfig';
import { DEFAULT_HEATMAP_CONFIG } from '../../src/balancing/config/stressTesting/heatmapConfig';

/**
 * CLI options
 */
interface CLIOptions {
  input: string;
  output?: string;
  format: 'ascii' | 'png' | 'both';
  preset: 'default' | 'compact' | 'detailed';
  title?: string;
  subtitle?: string;
  sortBy: 'alphabetical' | 'winRate' | 'synergy';
  highlightOP: boolean;
  highlightWeak: boolean;
  showLegend: boolean;
  showTimestamp: boolean;
  colorMode: 'ansi' | 'plain' | 'unicode';
  exportCSV: boolean;
  exportJSON: boolean;
  telemetry: boolean;
}

/**
 * Default CLI options
 */
const DEFAULT_OPTIONS: CLIOptions = {
  input: '',
  format: 'ascii',
  preset: 'default',
  sortBy: 'alphabetical',
  highlightOP: true,
  highlightWeak: true,
  showLegend: true,
  showTimestamp: true,
  colorMode: 'ansi',
  exportCSV: false,
  exportJSON: false,
  telemetry: true,
};

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CLIOptions {
  const options = { ...DEFAULT_OPTIONS };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      
      case '-f':
      case '--format':
        options.format = args[++i] as CLIOptions['format'];
        break;
      
      case '-p':
      case '--preset':
        options.preset = args[++i] as CLIOptions['preset'];
        break;
      
      case '--title':
        options.title = args[++i];
        break;
      
      case '--subtitle':
        options.subtitle = args[++i];
        break;
      
      case '--sort':
        options.sortBy = args[++i] as CLIOptions['sortBy'];
        break;
      
      case '--no-legend':
        options.showLegend = false;
        break;
      
      case '--no-timestamp':
        options.showTimestamp = false;
        break;
      
      case '--no-highlight-op':
        options.highlightOP = false;
        break;
      
      case '--no-highlight-weak':
        options.highlightWeak = false;
        break;
      
      case '--color-mode':
        options.colorMode = args[++i] as CLIOptions['colorMode'];
        break;
      
      case '--export-csv':
        options.exportCSV = true;
        break;
      
      case '--export-json':
        options.exportJSON = true;
        break;
      
      case '--no-telemetry':
        options.telemetry = false;
        break;
      
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Stress Testing Heatmap CLI - NP-123

Generate ASCII/PNG heatmaps from Marginal Utility analysis results.

USAGE:
  npm run stress:heatmap -- -i <input.json> [options]

OPTIONS:
  -i, --input <file>          Input JSON file with analysis results (required)
  -o, --output <file>         Output file path (default: auto-generated)
  -f, --format <type>         Output format: ascii, png, both (default: ascii)
  -p, --preset <name>         Preset config: default, compact, detailed (default: default)
  
  --title <text>              Custom title for heatmap
  --subtitle <text>           Custom subtitle for heatmap
  --sort <mode>               Sort mode: alphabetical, winRate, synergy (default: alphabetical)
  
  --no-legend                 Hide legend
  --no-timestamp              Hide timestamp
  --no-highlight-op           Don't highlight OP synergies
  --no-highlight-weak         Don't highlight weak synergies
  
  --color-mode <mode>         Color mode: ansi, plain, unicode (default: ansi)
  --export-csv                Export matrix as CSV
  --export-json               Export matrix as JSON
  --no-telemetry              Disable telemetry event
  
  -h, --help                  Show this help message

EXAMPLES:
  # Generate ASCII heatmap
  npm run stress:heatmap -- -i results.json
  
  # Generate compact ASCII heatmap with custom title
  npm run stress:heatmap -- -i results.json -p compact --title "My Analysis"
  
  # Generate both ASCII and PNG with CSV export
  npm run stress:heatmap -- -i results.json -f both --export-csv
  
  # Generate plain ASCII (no colors) for piping
  npm run stress:heatmap -- -i results.json --color-mode plain > output.txt
`);
}

/**
 * Load analysis results from JSON file
 */
function loadAnalysis(inputPath: string): MarginalUtilityAnalysis {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  
  const content = readFileSync(inputPath, 'utf-8');
  
  try {
    return JSON.parse(content) as MarginalUtilityAnalysis;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate output filename
 */
function generateOutputFilename(inputPath: string, format: string, suffix: string = ''): string {
  const baseName = basename(inputPath, '.json');
  const timestamp = new Date().toISOString().split('T')[0];
  const ext = format === 'ascii' ? 'txt' : format;
  return `test-results/${baseName}-heatmap${suffix}-${timestamp}.${ext}`;
}

/**
 * Create renderer configuration from CLI options
 */
function createConfig(options: CLIOptions): Partial<HeatmapConfig> {
  return {
    title: options.title || DEFAULT_HEATMAP_CONFIG.title,
    subtitle: options.subtitle || DEFAULT_HEATMAP_CONFIG.subtitle,
    sortBy: options.sortBy,
    highlightOP: options.highlightOP,
    highlightWeak: options.highlightWeak,
    showTimestamp: options.showTimestamp,
    ascii: {
      ...DEFAULT_HEATMAP_CONFIG.ascii,
      showLegend: options.showLegend,
      colorMode: options.colorMode,
    },
  };
}

/**
 * Emit telemetry event
 */
function emitTelemetry(options: CLIOptions, metadata: { cellCount: number; opCount: number; weakCount: number; strongCount: number; neutralCount: number }): void {
  if (!options.telemetry) return;
  
  const event = {
    eventType: 'stress_heatmap_exported',
    timestamp: Date.now(),
    format: options.format,
    preset: options.preset,
    metadata,
  };
  
  // Log to console for now (would integrate with telemetry system)
  console.error('[Telemetry]', JSON.stringify(event));
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  try {
    // Parse arguments
    const args = process.argv.slice(2);
    const options = parseArgs(args);
    
    // Validate required options
    if (!options.input) {
      console.error('Error: Input file is required. Use -i or --input.');
      console.error('Run with --help for usage information.');
      process.exit(1);
    }
    
    // Load analysis results
    console.error(`Loading analysis from: ${options.input}`);
    const analysis = loadAnalysis(resolve(options.input));
    
    // Create renderer
    const config = createConfig(options);
    const renderer = options.preset === 'default' 
      ? new StressHeatmapRenderer(config)
      : createHeatmapRenderer(options.preset);
    
    if (config) {
      renderer.updateConfig(config);
    }
    
    // Build matrix
    console.error('Building heatmap matrix...');
    const matrix = renderer.buildMatrix(analysis);
    
    // Render ASCII
    if (options.format === 'ascii' || options.format === 'both') {
      console.error('Rendering ASCII heatmap...');
      const output = renderer.renderASCII(matrix);
      
      const outputPath = options.output || generateOutputFilename(options.input, 'ascii');
      writeFileSync(outputPath, output.content, 'utf-8');
      
      console.error(`ASCII heatmap saved to: ${outputPath}`);
      console.error(`Dimensions: ${output.width}x${output.height}`);
      console.error(`Cells: ${output.metadata.cellCount} (OP: ${output.metadata.opCount}, Weak: ${output.metadata.weakCount})`);
      
      // Also print to stdout if no output file specified
      if (!options.output) {
        console.log(output.content);
      }
      
      // Emit telemetry
      emitTelemetry(options, output.metadata);
    }
    
    // Export CSV
    if (options.exportCSV) {
      console.error('Exporting CSV...');
      const csv = renderer.exportCSV(matrix);
      const csvPath = generateOutputFilename(options.input, 'csv', '-matrix');
      writeFileSync(csvPath, csv, 'utf-8');
      console.error(`CSV exported to: ${csvPath}`);
    }
    
    // Export JSON
    if (options.exportJSON) {
      console.error('Exporting JSON...');
      const json = renderer.exportJSON(matrix);
      const jsonPath = generateOutputFilename(options.input, 'json', '-matrix');
      writeFileSync(jsonPath, json, 'utf-8');
      console.error(`JSON exported to: ${jsonPath}`);
    }
    
    console.error('✓ Heatmap generation complete');
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

export { main, parseArgs, loadAnalysis, createConfig };
