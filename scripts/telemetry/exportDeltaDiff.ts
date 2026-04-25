#!/usr/bin/env tsx
/**
 * Punch Club Telemetry Export Delta Diff CLI - NP-255
 * 
 * Config-first CLI for comparing telemetry exports and detecting schema/metric changes.
 * 
 * @since NP-255
 * @author Vector-PC – Telemetry Schema
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';

/**
 * Schema change type
 */
export const SchemaChangeTypeSchema = z.enum([
  'field_added',
  'field_removed',
  'field_type_changed',
  'field_renamed',
  'field_moved',
  'enum_value_added',
  'enum_value_removed',
  'array_item_type_changed',
  'object_structure_changed',
]);

export type SchemaChangeType = z.infer<typeof SchemaChangeTypeSchema>;

/**
 * Metric change type
 */
export const MetricChangeTypeSchema = z.enum([
  'metric_added',
  'metric_removed',
  'metric_renamed',
  'value_range_changed',
  'precision_changed',
  'unit_changed',
  'aggregation_changed',
  'sampling_rate_changed',
]);

export type MetricChangeType = z.infer<typeof MetricChangeTypeSchema>;

/**
 * Schema change record
 */
export const SchemaChangeSchema = z.object({
  type: SchemaChangeTypeSchema,
  path: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
});

export type SchemaChange = z.infer<typeof SchemaChangeSchema>;

/**
 * Metric change record
 */
export const MetricChangeSchema = z.object({
  type: MetricChangeTypeSchema,
  metricName: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
});

export type MetricChange = z.infer<typeof MetricChangeSchema>;

/**
 * Delta diff result
 */
export const DeltaDiffResultSchema = z.object({
  timestamp: z.number(),
  baselineFile: z.string(),
  comparisonFile: z.string(),
  schemaChanges: z.array(SchemaChangeSchema),
  metricChanges: z.array(MetricChangeSchema),
  summary: z.object({
    totalChanges: z.number(),
    criticalChanges: z.number(),
    highChanges: z.number(),
    mediumChanges: z.number(),
    lowChanges: z.number(),
    schemaChanges: z.number(),
    metricChanges: z.number(),
  }),
  passed: z.boolean(),
});

export type DeltaDiffResult = z.infer<typeof DeltaDiffResultSchema>;

/**
 * CLI options
 */
interface CLIOptions {
  baseline?: string;
  comparison?: string;
  output?: string;
  format?: 'json' | 'markdown' | 'csv' | 'all';
  verbose?: boolean;
  schemaOnly?: boolean;
  metricsOnly?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  help?: boolean;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    format: 'all',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--baseline':
      case '-b':
        options.baseline = args[++i];
        break;
      case '--comparison':
      case '-c':
        options.comparison = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'json' | 'markdown' | 'csv' | 'all';
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--schema-only':
        options.schemaOnly = true;
        break;
      case '--metrics-only':
        options.metricsOnly = true;
        break;
      case '--severity':
      case '-s':
        options.severity = args[++i] as 'low' | 'medium' | 'high' | 'critical';
        break;
      case '--help':
      case '-h':
        options.help = true;
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
Punch Club Telemetry Export Delta Diff CLI

Usage: npm run telemetry:delta-diff -- [options]

Options:
  --baseline, -b <path>      Path to baseline telemetry export JSON
  --comparison, -c <path>    Path to comparison telemetry export JSON
  --output, -o <path>       Output directory (default: test-results)
  --format, -f <format>     Output format: json, markdown, csv, all (default: all)
  --schema-only              Analyze schema changes only
  --metrics-only             Analyze metric changes only
  --severity, -s <level>    Filter by severity: low, medium, high, critical
  --verbose, -v              Enable verbose logging
  --help, -h                 Show this help message

Examples:
  npm run telemetry:delta-diff -- --baseline export1.json --comparison export2.json
  npm run telemetry:delta-diff -- --format markdown --severity high
  npm run telemetry:delta-diff -- --schema-only --verbose

Output:
  Reports are saved to test-results/telemetry-delta-diff-<ts>.{json,md,csv}
`);
}

/**
 * Load telemetry export file
 */
function loadTelemetryExport(filePath: string): any {
  if (!existsSync(filePath)) {
    throw new Error(`Telemetry export file not found: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse telemetry export ${filePath}: ${error}`);
  }
}

/**
 * Extract schema from telemetry export
 */
function extractSchema(exportData: any): any {
  // Try to extract schema from different export formats
  if (exportData.schema) {
    return exportData.schema;
  }
  
  if (exportData.metadata?.schema) {
    return exportData.metadata.schema;
  }
  
  // Build schema from data structure
  return inferSchema(exportData);
}

/**
 * Infer schema from data structure
 */
function inferSchema(data: any): any {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: {} };
    }
    return {
      type: 'array',
      items: inferSchema(data[0]),
    };
  }
  
  if (typeof data === 'object' && data !== null) {
    const properties: any = {};
    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferSchema(value);
    }
    return {
      type: 'object',
      properties,
    };
  }
  
  return {
    type: typeof data,
  };
}

/**
 * Compare schemas and detect changes
 */
function compareSchemas(baseline: any, comparison: any): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  const baselineFields = new Set(Object.keys(baseline.properties || {}));
  const comparisonFields = new Set(Object.keys(comparison.properties || {}));
  
  // Check for added fields
  for (const field of comparisonFields) {
    if (!baselineFields.has(field)) {
      changes.push({
        type: 'field_added',
        path: field,
        newValue: comparison.properties[field],
        severity: 'medium',
        description: `New field '${field}' added to schema`,
      });
    }
  }
  
  // Check for removed fields
  for (const field of baselineFields) {
    if (!comparisonFields.has(field)) {
      changes.push({
        type: 'field_removed',
        path: field,
        oldValue: baseline.properties[field],
        severity: 'high',
        description: `Field '${field}' removed from schema`,
      });
    }
  }
  
  // Check for changed fields
  for (const field of baselineFields) {
    if (comparisonFields.has(field)) {
      const baselineField = baseline.properties[field];
      const comparisonField = comparison.properties[field];
      
      if (JSON.stringify(baselineField) !== JSON.stringify(comparisonField)) {
        changes.push({
          type: 'field_type_changed',
          path: field,
          oldValue: baselineField,
          newValue: comparisonField,
          severity: 'medium',
          description: `Field '${field}' type or structure changed`,
        });
      }
    }
  }
  
  return changes;
}

/**
 * Extract metrics from telemetry export
 */
function extractMetrics(exportData: any): Record<string, any> {
  const metrics: Record<string, any> = {};
  
  // Try different metric extraction strategies
  if (exportData.metrics) {
    Object.assign(metrics, exportData.metrics);
  }
  
  if (exportData.data?.metrics) {
    Object.assign(metrics, exportData.data.metrics);
  }
  
  // Extract from array data
  if (Array.isArray(exportData.data)) {
    for (const item of exportData.data) {
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'number') {
            metrics[key] = value;
          }
        }
      }
    }
  }
  
  return metrics;
}

/**
 * Compare metrics and detect changes
 */
function compareMetrics(baseline: Record<string, any>, comparison: Record<string, any>): MetricChange[] {
  const changes: MetricChange[] = [];
  
  const baselineMetrics = new Set(Object.keys(baseline));
  const comparisonMetrics = new Set(Object.keys(comparison));
  
  // Check for added metrics
  for (const metric of comparisonMetrics) {
    if (!baselineMetrics.has(metric)) {
      changes.push({
        type: 'metric_added',
        metricName: metric,
        newValue: comparison[metric],
        severity: 'low',
        description: `New metric '${metric}' added`,
      });
    }
  }
  
  // Check for removed metrics
  for (const metric of baselineMetrics) {
    if (!comparisonMetrics.has(metric)) {
      changes.push({
        type: 'metric_removed',
        metricName: metric,
        oldValue: baseline[metric],
        severity: 'medium',
        description: `Metric '${metric}' removed`,
      });
    }
  }
  
  // Check for changed metrics
  for (const metric of baselineMetrics) {
    if (comparisonMetrics.has(metric)) {
      const baselineValue = baseline[metric];
      const comparisonValue = comparison[metric];
      
      if (baselineValue !== comparisonValue) {
        const changePercent = baselineValue !== 0 
          ? ((comparisonValue - baselineValue) / baselineValue) * 100 
          : 0;
        
        const severity = Math.abs(changePercent) > 50 ? 'high' : 
                        Math.abs(changePercent) > 20 ? 'medium' : 'low';
        
        changes.push({
          type: 'value_range_changed',
          metricName: metric,
          oldValue: baselineValue,
          newValue: comparisonValue,
          severity,
          description: `Metric '${metric}' changed from ${baselineValue} to ${comparisonValue} (${changePercent.toFixed(1)}%)`,
        });
      }
    }
  }
  
  return changes;
}

/**
 * Run delta diff analysis
 */
function runDeltaDiffInternal(baselinePath: string, comparisonPath: string, options: CLIOptions): DeltaDiffResult {
  console.log(`Loading baseline: ${baselinePath}`);
  const baselineData = loadTelemetryExport(baselinePath);
  
  console.log(`Loading comparison: ${comparisonPath}`);
  const comparisonData = loadTelemetryExport(comparisonPath);
  
  const schemaChanges: SchemaChange[] = [];
  const metricChanges: MetricChange[] = [];
  
  // Analyze schema changes
  if (!options.metricsOnly) {
    console.log('Analyzing schema changes...');
    const baselineSchema = extractSchema(baselineData);
    const comparisonSchema = extractSchema(comparisonData);
    schemaChanges.push(...compareSchemas(baselineSchema, comparisonSchema));
  }
  
  // Analyze metric changes
  if (!options.schemaOnly) {
    console.log('Analyzing metric changes...');
    const baselineMetrics = extractMetrics(baselineData);
    const comparisonMetrics = extractMetrics(comparisonData);
    metricChanges.push(...compareMetrics(baselineMetrics, comparisonMetrics));
  }
  
  // Filter by severity if specified
  const filteredSchemaChanges = options.severity 
    ? schemaChanges.filter(change => change.severity === options.severity)
    : schemaChanges;
    
  const filteredMetricChanges = options.severity
    ? metricChanges.filter(change => change.severity === options.severity)
    : metricChanges;
  
  // Calculate summary
  const totalChanges = filteredSchemaChanges.length + filteredMetricChanges.length;
  const criticalChanges = filteredSchemaChanges.filter(c => c.severity === 'critical').length +
                         filteredMetricChanges.filter(c => c.severity === 'critical').length;
  const highChanges = filteredSchemaChanges.filter(c => c.severity === 'high').length +
                     filteredMetricChanges.filter(c => c.severity === 'high').length;
  const mediumChanges = filteredSchemaChanges.filter(c => c.severity === 'medium').length +
                       filteredMetricChanges.filter(c => c.severity === 'medium').length;
  const lowChanges = filteredSchemaChanges.filter(c => c.severity === 'low').length +
                    filteredMetricChanges.filter(c => c.severity === 'low').length;
  
  const passed = criticalChanges === 0 && highChanges === 0;
  
  return {
    timestamp: Date.now(),
    baselineFile: baselinePath,
    comparisonFile: comparisonFile,
    schemaChanges: filteredSchemaChanges,
    metricChanges: filteredMetricChanges,
    summary: {
      totalChanges,
      criticalChanges,
      highChanges,
      mediumChanges,
      lowChanges,
      schemaChanges: filteredSchemaChanges.length,
      metricChanges: filteredMetricChanges.length,
    },
    passed,
  };
}

/**
 * Generate JSON report
 */
function generateJSONReport(result: DeltaDiffResult, outputPath: string): void {
  const filename = `telemetry-delta-diff-${Date.now()}.json`;
  const filepath = path.join(outputPath, filename);
  
  mkdirSync(outputPath, { recursive: true });
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  
  console.log(`✅ JSON report saved: ${filepath}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(result: DeltaDiffResult, outputPath: string): void {
  let markdown = `# Punch Club Telemetry Export Delta Diff\n\n`;
  markdown += `**Generated:** ${new Date(result.timestamp).toISOString()}\n`;
  markdown += `**Baseline:** ${result.baselineFile}\n`;
  markdown += `**Comparison:** ${result.comparisonFile}\n`;
  markdown += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Changes | ${result.summary.totalChanges} |\n`;
  markdown += `| Critical | ${result.summary.criticalChanges} |\n`;
  markdown += `| High | ${result.summary.highChanges} |\n`;
  markdown += `| Medium | ${result.summary.mediumChanges} |\n`;
  markdown += `| Low | ${result.summary.lowChanges} |\n`;
  markdown += `| Schema Changes | ${result.summary.schemaChanges} |\n`;
  markdown += `| Metric Changes | ${result.summary.metricChanges} |\n\n`;
  
  // Schema changes
  if (result.schemaChanges.length > 0) {
    markdown += `## Schema Changes\n\n`;
    markdown += `| Type | Path | Severity | Description |\n`;
    markdown += `|------|------|----------|-------------|\n`;
    
    for (const change of result.schemaChanges) {
      const emoji = change.severity === 'critical' ? '🚨' : 
                   change.severity === 'high' ? '⚠️' : 
                   change.severity === 'medium' ? '📝' : 'ℹ️';
      markdown += `| ${emoji} ${change.type} | \`${change.path}\` | ${change.severity.toUpperCase()} | ${change.description} |\n`;
    }
    markdown += `\n`;
  }
  
  // Metric changes
  if (result.metricChanges.length > 0) {
    markdown += `## Metric Changes\n\n`;
    markdown += `| Type | Metric | Severity | Old Value | New Value | Description |\n`;
    markdown += `|------|--------|----------|-----------|-----------|-------------|\n`;
    
    for (const change of result.metricChanges) {
      const emoji = change.severity === 'critical' ? '🚨' : 
                   change.severity === 'high' ? '⚠️' : 
                   change.severity === 'medium' ? '📊' : '📈';
      markdown += `| ${emoji} ${change.type} | \`${change.metricName}\` | ${change.severity.toUpperCase()} | ${change.oldValue || 'N/A'} | ${change.newValue || 'N/A'} | ${change.description} |\n`;
    }
    markdown += `\n`;
  }
  
  const filename = `telemetry-delta-diff-${Date.now()}.md`;
  const filepath = path.join(outputPath, filename);
  
  mkdirSync(outputPath, { recursive: true });
  writeFileSync(filepath, markdown);
  
  console.log(`✅ Markdown report saved: ${filepath}`);
}

/**
 * Generate CSV report
 */
function generateCSVReport(result: DeltaDiffResult, outputPath: string): void {
  let csv = 'Type,Category,Name,Severity,Old Value,New Value,Description\n';
  
  // Schema changes
  for (const change of result.schemaChanges) {
    csv += `"${change.type}","Schema","${change.path}","${change.severity}","${JSON.stringify(change.oldValue)}","${JSON.stringify(change.newValue)}","${change.description}"\n`;
  }
  
  // Metric changes
  for (const change of result.metricChanges) {
    csv += `"${change.type}","Metric","${change.metricName}","${change.severity}","${change.oldValue}","${change.newValue}","${change.description}"\n`;
  }
  
  const filename = `telemetry-delta-diff-${Date.now()}.csv`;
  const filepath = path.join(outputPath, filename);
  
  mkdirSync(outputPath, { recursive: true });
  writeFileSync(filepath, csv);
  
  console.log(`✅ CSV report saved: ${filepath}`);
}

/**
 * Print summary to console
 */
function printSummary(result: DeltaDiffResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('Telemetry Export Delta Diff Summary');
  console.log('='.repeat(60));
  console.log(`Total Changes: ${result.summary.totalChanges}`);
  console.log(`Critical: ${result.summary.criticalChanges}`);
  console.log(`High: ${result.summary.highChanges}`);
  console.log(`Medium: ${result.summary.mediumChanges}`);
  console.log(`Low: ${result.summary.lowChanges}`);
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));
  
  if (result.schemaChanges.length > 0) {
    console.log('\nSchema Changes:');
    for (const change of result.schemaChanges.slice(0, 5)) {
      console.log(`  ${change.type}: ${change.path} (${change.severity})`);
    }
    if (result.schemaChanges.length > 5) {
      console.log(`  ... and ${result.schemaChanges.length - 5} more`);
    }
  }
  
  if (result.metricChanges.length > 0) {
    console.log('\nMetric Changes:');
    for (const change of result.metricChanges.slice(0, 5)) {
      console.log(`  ${change.type}: ${change.metricName} (${change.severity})`);
    }
    if (result.metricChanges.length > 5) {
      console.log(`  ... and ${result.metricChanges.length - 5} more`);
    }
  }
  
  console.log('');
}

/**
 * Export the main function for testing
 */
export function runDeltaDiff(baselinePath: string, comparisonPath: string, options: any = {}): DeltaDiffResult {
  console.log(`Loading baseline: ${baselinePath}`);
  const baselineData = loadTelemetryExport(baselinePath);
  
  console.log(`Loading comparison: ${comparisonPath}`);
  const comparisonData = loadTelemetryExport(comparisonPath);
  
  const schemaChanges: SchemaChange[] = [];
  const metricChanges: MetricChange[] = [];
  
  // Analyze schema changes
  if (!options.metricsOnly) {
    console.log('Analyzing schema changes...');
    const baselineSchema = extractSchema(baselineData);
    const comparisonSchema = extractSchema(comparisonData);
    schemaChanges.push(...compareSchemas(baselineSchema, comparisonSchema));
  }
  
  // Analyze metric changes
  if (!options.schemaOnly) {
    console.log('Analyzing metric changes...');
    const baselineMetrics = extractMetrics(baselineData);
    const comparisonMetrics = extractMetrics(comparisonData);
    metricChanges.push(...compareMetrics(baselineMetrics, comparisonMetrics));
  }
  
  // Filter by severity if specified
  const filteredSchemaChanges = options.severity 
    ? schemaChanges.filter(change => change.severity === options.severity)
    : schemaChanges;
    
  const filteredMetricChanges = options.severity
    ? metricChanges.filter(change => change.severity === options.severity)
    : metricChanges;
  
  // Calculate summary
  const totalChanges = filteredSchemaChanges.length + filteredMetricChanges.length;
  const criticalChanges = filteredSchemaChanges.filter(c => c.severity === 'critical').length +
                         filteredMetricChanges.filter(c => c.severity === 'critical').length;
  const highChanges = filteredSchemaChanges.filter(c => c.severity === 'high').length +
                     filteredMetricChanges.filter(c => c.severity === 'high').length;
  const mediumChanges = filteredSchemaChanges.filter(c => c.severity === 'medium').length +
                       filteredMetricChanges.filter(c => c.severity === 'medium').length;
  const lowChanges = filteredSchemaChanges.filter(c => c.severity === 'low').length +
                    filteredMetricChanges.filter(c => c.severity === 'low').length;
  
  const passed = criticalChanges === 0 && highChanges === 0;
  
  return {
    timestamp: Date.now(),
    baselineFile: baselinePath,
    comparisonFile: comparisonPath,
    schemaChanges: filteredSchemaChanges,
    metricChanges: filteredMetricChanges,
    summary: {
      totalChanges,
      criticalChanges,
      highChanges,
      mediumChanges,
      lowChanges,
      schemaChanges: filteredSchemaChanges.length,
      metricChanges: filteredMetricChanges.length,
    },
    passed,
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const options = parseArgs();
  
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  
  if (!options.baseline || !options.comparison) {
    console.error('Error: Both --baseline and --comparison files are required');
    printHelp();
    process.exit(1);
  }
  
  console.log('Punch Club Telemetry Export Delta Diff');
  console.log('=====================================\n');
  
  if (options.verbose) {
    console.log('Options:', JSON.stringify(options, null, 2));
  }
  
  try {
    // Run delta diff
    console.log('Running delta diff analysis...\n');
    const result = runDeltaDiffInternal(options.baseline, options.comparison, options);
    
    // Generate reports
    const outputPath = options.output || 'test-results';
    
    if (options.format === 'json' || options.format === 'all') {
      generateJSONReport(result, outputPath);
    }
    
    if (options.format === 'markdown' || options.format === 'all') {
      generateMarkdownReport(result, outputPath);
    }
    
    if (options.format === 'csv' || options.format === 'all') {
      generateCSVReport(result, outputPath);
    }
    
    // Print summary
    printSummary(result);
    
    // Exit with error code if critical or high changes detected
    if (!result.passed) {
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run CLI
main().catch((error: any) => {
  console.error('Error:', error);
  process.exit(1);
});
