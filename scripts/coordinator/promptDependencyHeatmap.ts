/**
 * Prompt Dependency Heatmap CLI - NP-146
 * 
 * CLI tool for generating prompt dependency heatmaps.
 * 
 * @since 2026-01-24
 */

import * as path from 'path';
import {
  analyzePromptDependencies,
  exportToJSON,
  exportToMarkdown,
  type DependencyConfig,
} from '../../src/coordinator/promptDependencyAnalyzer';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  window: number;
  threshold: number;
  output: string;
  format: 'json' | 'markdown' | 'both';
  includeCompleted: boolean;
  includeInProgress: boolean;
  includeNonAssigned: boolean;
} {
  const args = process.argv.slice(2);
  
  let window = 30;
  let threshold = 0.1;
  let output = 'test-results';
  let format: 'json' | 'markdown' | 'both' = 'both';
  let includeCompleted = true;
  let includeInProgress = true;
  let includeNonAssigned = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--window' && i + 1 < args.length) {
      window = parseInt(args[++i], 10);
    } else if (arg === '--threshold' && i + 1 < args.length) {
      threshold = parseFloat(args[++i]);
    } else if (arg === '--output' && i + 1 < args.length) {
      output = args[++i];
    } else if (arg === '--format' && i + 1 < args.length) {
      format = args[++i] as 'json' | 'markdown' | 'both';
    } else if (arg === '--no-completed') {
      includeCompleted = false;
    } else if (arg === '--no-in-progress') {
      includeInProgress = false;
    } else if (arg === '--include-non-assigned') {
      includeNonAssigned = true;
    } else if (arg === '--help') {
      console.log(`
Prompt Dependency Heatmap Generator

Usage:
  npm run coordinator:heatmap [options]

Options:
  --window <days>              Time window in days (default: 30)
  --threshold <value>          Dependency threshold 0-1 (default: 0.1)
  --output <path>              Output directory (default: test-results)
  --format <type>              Output format: json, markdown, both (default: both)
  --no-completed               Exclude completed prompts
  --no-in-progress             Exclude in-progress prompts
  --include-non-assigned       Include non-assigned prompts
  --help                       Show this help message

Examples:
  npm run coordinator:heatmap
  npm run coordinator:heatmap -- --window 7 --format json
  npm run coordinator:heatmap -- --threshold 0.2 --output ./reports
      `);
      process.exit(0);
    }
  }
  
  return {
    window,
    threshold,
    output,
    format,
    includeCompleted,
    includeInProgress,
    includeNonAssigned,
  };
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  console.log('🔍 Prompt Dependency Heatmap Generator');
  console.log('=====================================\n');
  
  // Parse arguments
  const args = parseArgs();
  
  console.log('Configuration:');
  console.log(`  Window: ${args.window} days`);
  console.log(`  Threshold: ${args.threshold}`);
  console.log(`  Output: ${args.output}`);
  console.log(`  Format: ${args.format}`);
  console.log(`  Include Completed: ${args.includeCompleted}`);
  console.log(`  Include In Progress: ${args.includeInProgress}`);
  console.log(`  Include Non-Assigned: ${args.includeNonAssigned}`);
  console.log('');
  
  // Kanban file path
  const kanbanPath = path.join(
    process.cwd(),
    'src/docs/docs/coordinator/agent_assignments.md'
  );
  
  console.log(`📄 Reading Kanban: ${kanbanPath}\n`);
  
  // Analyze dependencies
  const config: Partial<DependencyConfig> = {
    window: args.window,
    threshold: args.threshold,
    includeCompleted: args.includeCompleted,
    includeInProgress: args.includeInProgress,
    includeNonAssigned: args.includeNonAssigned,
  };
  
  console.log('🔄 Analyzing dependencies...\n');
  
  const heatmapData = await analyzePromptDependencies(kanbanPath, config);
  
  // Display statistics
  console.log('📊 Statistics:');
  console.log(`  Total Prompts: ${heatmapData.stats.totalPrompts}`);
  console.log(`  Total Dependencies: ${heatmapData.stats.totalDependencies}`);
  console.log(`  Avg Dependencies/Prompt: ${heatmapData.stats.avgDependenciesPerPrompt.toFixed(2)}`);
  console.log(`  Max Dependencies: ${heatmapData.stats.maxDependencies}`);
  console.log(`  Circular Dependencies: ${heatmapData.stats.circularDependencies.length}`);
  console.log('');
  
  // Display circular dependencies
  if (heatmapData.stats.circularDependencies.length > 0) {
    console.log('⚠️  Circular Dependencies Detected:');
    for (const cycle of heatmapData.stats.circularDependencies) {
      console.log(`  - ${cycle.join(' → ')}`);
    }
    console.log('');
  }
  
  // Display top dependencies
  const topDeps = heatmapData.prompts
    .map(p => ({ id: p.id, count: p.dependencies.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  if (topDeps.length > 0) {
    console.log('🔝 Top Dependencies:');
    for (const { id, count } of topDeps) {
      console.log(`  - ${id}: ${count} dependencies`);
    }
    console.log('');
  }
  
  // Export data
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `prompt-dependency-heatmap-${timestamp}`;
  
  console.log('💾 Exporting data...\n');
  
  if (args.format === 'json' || args.format === 'both') {
    const jsonPath = path.join(args.output, `${baseFilename}.json`);
    await exportToJSON(heatmapData, jsonPath);
    console.log(`  ✓ JSON: ${jsonPath}`);
  }
  
  if (args.format === 'markdown' || args.format === 'both') {
    const mdPath = path.join(args.output, `${baseFilename}.md`);
    await exportToMarkdown(heatmapData, mdPath);
    console.log(`  ✓ Markdown: ${mdPath}`);
  }
  
  console.log('');
  
  // Emit telemetry
  const telemetryEvent = {
    eventType: 'coordinator_prompt_dependency_heatmap',
    timestamp: Date.now(),
    data: {
      totalPrompts: heatmapData.stats.totalPrompts,
      totalDependencies: heatmapData.stats.totalDependencies,
      circularDependencies: heatmapData.stats.circularDependencies.length,
      window: args.window,
      threshold: args.threshold,
      format: args.format,
    },
  };
  
  console.log('📡 Telemetry Event:');
  console.log(JSON.stringify(telemetryEvent, null, 2));
  console.log('');
  
  const duration = Date.now() - startTime;
  console.log(`✅ Complete in ${duration}ms`);
  console.log('');
}

// Run
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
