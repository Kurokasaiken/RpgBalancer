#!/usr/bin/env node

/**
 * Map Asset Consistency CLI
 * 
 * Verifies consistency between Phase E map metadata (JSON) and UI components
 * (WorkerCard/LocationCard) reporting missing assets.
 * 
 * Usage:
 *   npm run map-asset-consistency [options]
 *   node scripts/idleVillage/mapAssetConsistency.ts [options]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Types
interface ConsistencyReport {
  timestamp: string;
  summary: {
    totalAssets: number;
    validAssets: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  assets: AssetReport[];
  recommendations: string[];
}

interface AssetReport {
  id: string;
  type: string;
  status: 'valid' | 'error' | 'warning' | 'info';
  componentPath: string;
  issues: AssetIssue[];
  metadata?: {
    propsValidated: number;
    assetsValidated: number;
    lastModified?: string;
  };
}

interface AssetIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: Record<string, any>;
}

// CLI Options
interface CLIOptions {
  autoOpenReport?: boolean;
  outputPath?: string;
  severity?: 'error' | 'warning' | 'info';
  verbose?: boolean;
  help?: boolean;
}

// Parse CLI arguments
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--auto-open-report':
        options.autoOpenReport = true;
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--severity':
        options.severity = args[++i] as 'error' | 'warning' | 'info';
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

// Show help
function showHelp(): void {
  console.log(`
Map Asset Consistency CLI - Phase E Asset Verification

Usage:
  npm run map-asset-consistency [options]
  node scripts/idleVillage/mapAssetConsistency.ts [options]

Options:
  --auto-open-report    Automatically open the generated report
  --output <path>       Custom output path for the report
  --severity <level>    Minimum severity level to report (error|warning|info)
  --verbose             Enable verbose logging
  --help, -h            Show this help message

Examples:
  npm run map-asset-consistency
  npm run map-asset-consistency --severity error
  npm run map-asset-consistency --auto-open-report --output ./report.md
`);
}

// Get project root directory
function getProjectRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, '../../');
}

// Load asset registry
function loadAssetRegistry(): any {
  const projectRoot = getProjectRoot();
  const registryPath = join(projectRoot, 'src/ui/idleVillage/config/mapAssetRegistry.ts');
  
  if (!existsSync(registryPath)) {
    throw new Error(`Asset registry not found: ${registryPath}`);
  }

  // For now, return a mock registry - in real implementation would parse the TS file
  return {
    assets: [
      {
        id: 'worker-card',
        type: 'worker',
        componentPath: 'src/ui/idleVillage/components/WorkerCard.tsx',
        requiredProps: ['id', 'name', 'hp', 'fatigue'],
        assetPaths: ['src/assets/ui/idleVillage/portraits/'],
      },
      {
        id: 'location-card',
        type: 'location',
        componentPath: 'src/ui/idleVillage/components/LocationCard.tsx',
        requiredProps: ['locationId', 'name', 'featuredActivity'],
        assetPaths: ['src/assets/ui/idleVillage/panorama-hotspring.jpg'],
      },
    ],
  };
}

// Check if component file exists
function checkComponentExists(componentPath: string): boolean {
  const projectRoot = getProjectRoot();
  const fullPath = join(projectRoot, componentPath);
  return existsSync(fullPath);
}

// Check if asset files exist
function checkAssetFilesExist(assetPaths: string[]): AssetIssue[] {
  const issues: AssetIssue[] = [];
  const projectRoot = getProjectRoot();

  for (const assetPath of assetPaths) {
    const fullPath = join(projectRoot, assetPath);
    
    if (!existsSync(fullPath)) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_ASSET',
        message: `Asset file not found: ${assetPath}`,
        details: { fullPath },
      });
    }
  }

  return issues;
}

// Validate component exports
function validateComponentExports(componentPath: string, requiredProps: string[]): AssetIssue[] {
  const issues: AssetIssue[] = [];
  const projectRoot = getProjectRoot();
  const fullPath = join(projectRoot, componentPath);

  if (!existsSync(fullPath)) {
    return [{
      severity: 'error',
      code: 'MISSING_COMPONENT',
      message: `Component file not found: ${componentPath}`,
      details: { fullPath },
    }];
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    
    // Check for React component export
    if (!content.includes('export') || !content.includes('function') && !content.includes('const')) {
      issues.push({
        severity: 'error',
        code: 'INVALID_EXPORT',
        message: `Component does not have valid export: ${componentPath}`,
      });
    }

    // Check for required props in interface or component
    for (const prop of requiredProps) {
      if (!content.includes(prop)) {
        issues.push({
          severity: 'warning',
          code: 'MISSING_PROP',
          message: `Required prop '${prop}' not found in component: ${componentPath}`,
        });
      }
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      code: 'READ_ERROR',
      message: `Failed to read component file: ${componentPath}`,
      details: { error: String(error) },
    });
  }

  return issues;
}

// Run consistency check for a single asset
function checkAssetConsistency(asset: any): AssetReport {
  const issues: AssetIssue[] = [];

  // Check component exists
  if (!checkComponentExists(asset.componentPath)) {
    issues.push({
      severity: 'error',
      code: 'MISSING_COMPONENT',
      message: `Component file not found: ${asset.componentPath}`,
    });
  }

  // Validate component exports and props
  const componentIssues = validateComponentExports(asset.componentPath, asset.requiredProps);
  issues.push(...componentIssues);

  // Check asset files
  const assetIssues = checkAssetFilesExist(asset.assetPaths);
  issues.push(...assetIssues);

  // Determine overall status
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const hasWarnings = issues.some(issue => issue.severity === 'warning');
  
  let status: AssetReport['status'] = 'valid';
  if (hasErrors) status = 'error';
  else if (hasWarnings) status = 'warning';
  else if (issues.length > 0) status = 'info';

  return {
    id: asset.id,
    type: asset.type,
    status,
    componentPath: asset.componentPath,
    issues,
    metadata: {
      propsValidated: asset.requiredProps.length,
      assetsValidated: asset.assetPaths.length,
    },
  };
}

// Generate severity score
function calculateSeverityScore(issues: AssetIssue[]): number {
  const weights = { error: 10, warning: 5, info: 1 };
  return issues.reduce((score, issue) => score + weights[issue.severity], 0);
}

// Generate recommendations
function generateRecommendations(reports: AssetReport[]): string[] {
  const recommendations: string[] = [];
  const errorCount = reports.filter(r => r.status === 'error').length;
  const warningCount = reports.filter(r => r.status === 'warning').length;

  if (errorCount > 0) {
    recommendations.push(`🚨 Fix ${errorCount} component(s) with errors before proceeding`);
  }
  
  if (warningCount > 0) {
    recommendations.push(`⚠️ Review ${warningCount} component(s) with warnings`);
  }

  if (errorCount === 0 && warningCount === 0) {
    recommendations.push('✅ All assets are consistent - ready for deployment');
  }

  return recommendations;
}

// Generate markdown report
function generateMarkdownReport(report: ConsistencyReport): string {
  const { timestamp, summary, assets, recommendations } = report;
  
  let markdown = `# Map Asset Consistency Report\n\n`;
  markdown += `**Generated:** ${new Date(timestamp).toLocaleString()}\n\n`;
  
  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Total Assets:** ${summary.totalAssets}\n`;
  markdown += `- **Valid Assets:** ${summary.validAssets}\n`;
  markdown += `- **Errors:** ${summary.errorCount}\n`;
  markdown += `- **Warnings:** ${summary.warningCount}\n`;
  markdown += `- **Info:** ${summary.infoCount}\n\n`;

  // Asset details
  markdown += `## Asset Details\n\n`;
  
  for (const asset of assets) {
    const statusIcon = asset.status === 'valid' ? '✅' : asset.status === 'error' ? '❌' : asset.status === 'warning' ? '⚠️' : 'ℹ️';
    markdown += `### ${statusIcon} ${asset.id} (${asset.type})\n\n`;
    markdown += `**Path:** \`${asset.componentPath}\`\n\n`;
    markdown += `**Status:** ${asset.status}\n\n`;
    
    if (asset.issues.length > 0) {
      markdown += `**Issues:**\n\n`;
      for (const issue of asset.issues) {
        const severityIcon = issue.severity === 'error' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `- ${severityIcon} **${issue.code}:** ${issue.message}\n`;
        if (issue.details) {
          markdown += `  - Details: \`${JSON.stringify(issue.details)}\`\n`;
        }
      }
      markdown += `\n`;
    }
    
    if (asset.metadata) {
      markdown += `**Metadata:**\n`;
      markdown += `- Props validated: ${asset.metadata.propsValidated}\n`;
      markdown += `- Assets validated: ${asset.metadata.assetsValidated}\n\n`;
    }
  }

  // Recommendations
  markdown += `## Recommendations\n\n`;
  for (const recommendation of recommendations) {
    markdown += `- ${recommendation}\n`;
  }
  markdown += `\n`;

  // Footer
  markdown += `---\n`;
  markdown += `*Report generated by Map Asset Consistency CLI*\n`;

  return markdown;
}

// Emit telemetry event
function emitTelemetry(report: ConsistencyReport): void {
  // TODO: Implement telemetry emission
  console.log('📊 Telemetry: map_asset_consistency_run', {
    timestamp: report.timestamp,
    summary: report.summary,
    assetCount: report.assets.length,
  });
}

// Main execution function
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    if (options.help) {
      showHelp();
      return;
    }

    console.log('🔍 Starting Map Asset Consistency Check...\n');

    // Load asset registry
    const registry = loadAssetRegistry();
    console.log(`📋 Loaded registry with ${registry.assets.length} assets`);

    // Check each asset
    const reports: AssetReport[] = [];
    for (const asset of registry.assets) {
      if (options.verbose) {
        console.log(`  Checking ${asset.id}...`);
      }
      const report = checkAssetConsistency(asset);
      reports.push(report);
      
      if (options.verbose) {
        console.log(`    Status: ${report.status} (${report.issues.length} issues)`);
      }
    }

    // Generate summary
    const summary = {
      totalAssets: reports.length,
      validAssets: reports.filter(r => r.status === 'valid').length,
      errorCount: reports.reduce((count, r) => count + r.issues.filter(i => i.severity === 'error').length, 0),
      warningCount: reports.reduce((count, r) => count + r.issues.filter(i => i.severity === 'warning').length, 0),
      infoCount: reports.reduce((count, r) => count + r.issues.filter(i => i.severity === 'info').length, 0),
    };

    // Generate full report
    const fullReport: ConsistencyReport = {
      timestamp: new Date().toISOString(),
      summary,
      assets: reports,
      recommendations: generateRecommendations(reports),
    };

    // Filter by severity if specified
    if (options.severity) {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      const minSeverity = severityOrder[options.severity];
      fullReport.assets = reports.filter(asset => 
        asset.issues.some(issue => severityOrder[issue.severity] <= minSeverity)
      );
    }

    // Generate output path
    const projectRoot = getProjectRoot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultOutputPath = join(projectRoot, `test-results/map-asset-consistency-${timestamp}.md`);
    const outputPath = options.outputPath || defaultOutputPath;

    // Generate and save report
    const markdown = generateMarkdownReport(fullReport);
    writeFileSync(outputPath, markdown, 'utf-8');

    // Emit telemetry
    emitTelemetry(fullReport);

    // Show results
    console.log(`\n✅ Report generated: ${outputPath}`);
    console.log(`📊 Summary: ${summary.validAssets}/${summary.totalAssets} valid, ${summary.errorCount} errors, ${summary.warningCount} warnings`);
    
    if (options.autoOpenReport && process.platform !== 'linux') {
      try {
        execSync(`open "${outputPath}"`, { stdio: 'ignore' });
        console.log('📖 Report opened in default application');
      } catch (error) {
        console.log('⚠️ Could not open report automatically');
      }
    }

    // Exit with error code if there are errors
    if (summary.errorCount > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runMapAssetConsistency };
