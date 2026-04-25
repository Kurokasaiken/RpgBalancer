/**
 * Coordinator Prompt Status Auditor CLI
 * Analyzes coordinator prompt status and generates audit reports
 * 
 * @see NP-145 – Coordinator Prompt Status Auditor CLI
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  createPromptStatusAnalyzer,
  type PromptData,
  type StatusAuditConfig,
} from '../../src/coordinator/promptStatusAnalyzer';

// Parse command line arguments
interface CLIArgs {
  window?: number;
  threshold?: number;
  output?: 'json' | 'markdown' | 'both';
  verbose?: boolean;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg === '--window' && argv[i + 1]) {
      args.window = parseInt(argv[i + 1], 10);
      i++;
    } else if (arg === '--threshold' && argv[i + 1]) {
      args.threshold = parseInt(argv[i + 1], 10);
      i++;
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[i + 1] as 'json' | 'markdown' | 'both';
      i++;
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
Coordinator Prompt Status Auditor CLI

Usage:
  tsx scripts/coordinator/promptStatusAuditor.ts [options]

Options:
  --window <days>        Analysis window in days (default: 30)
  --threshold <days>     Stale threshold in days (default: 7)
  --output <format>      Output format: json, markdown, both (default: both)
  --verbose              Enable verbose logging
  --help, -h             Show this help message

Examples:
  tsx scripts/coordinator/promptStatusAuditor.ts
  tsx scripts/coordinator/promptStatusAuditor.ts --window 14 --output json
  tsx scripts/coordinator/promptStatusAuditor.ts --threshold 5 --verbose
  `);
}

/**
 * Load mock prompt data for testing
 */
function loadMockPromptData(): PromptData[] {
  return [
    {
      id: 'NP-200',
      description: 'Damage Number System',
      status: 'Completato',
      assignedTo: 'Lumen-PC',
      startDate: '2026-01-20',
      completionDate: '2026-01-24',
      priority: 'high',
      estimatedPoints: 150,
    },
    {
      id: 'NP-207',
      description: 'Offline Queue System',
      status: 'Completato',
      assignedTo: 'Atlas-Offline',
      startDate: '2026-01-22',
      completionDate: '2026-01-24',
      priority: 'medium',
      estimatedPoints: 140,
    },
    {
      id: 'NP-214',
      description: 'Character Portrait Lazy Loading',
      status: 'Completato',
      assignedTo: 'Flux-Assets',
      startDate: '2026-01-23',
      completionDate: '2026-01-24',
      priority: 'medium',
      estimatedPoints: 130,
    },
    {
      id: 'NP-108',
      description: 'PWA Performance Budget Monitor',
      status: 'Completato',
      assignedTo: 'Atlas-PC',
      startDate: '2026-01-20',
      completionDate: '2026-01-24',
      priority: 'high',
      estimatedPoints: 150,
    },
    {
      id: 'NP-141',
      description: 'Telemetry Drift Visual Diff CLI',
      status: 'Completato',
      assignedTo: 'Vector-PC',
      startDate: '2026-01-22',
      completionDate: '2026-01-24',
      priority: 'medium',
      estimatedPoints: 140,
    },
    {
      id: 'NP-145',
      description: 'Coordinator Prompt Status Auditor CLI',
      status: 'In corso',
      assignedTo: 'Coordinator-Bot',
      startDate: '2026-01-24',
      priority: 'medium',
      estimatedPoints: 120,
    },
    {
      id: 'NP-150',
      description: 'Future Feature A',
      status: 'Non assegnato',
      priority: 'low',
      estimatedPoints: 100,
    },
    {
      id: 'NP-151',
      description: 'Future Feature B',
      status: 'Non assegnato',
      priority: 'medium',
      estimatedPoints: 120,
    },
    {
      id: 'NP-152',
      description: 'Blocked Feature',
      status: 'Bloccato',
      assignedTo: 'Agent-X',
      startDate: '2026-01-10',
      dependencies: ['NP-200', 'NP-999'],
      priority: 'high',
      estimatedPoints: 180,
    },
    {
      id: 'NP-153',
      description: 'Stale Feature',
      status: 'In corso',
      assignedTo: 'Agent-Y',
      startDate: '2026-01-01',
      priority: 'critical',
      estimatedPoints: 200,
    },
  ];
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('🔍 Coordinator Prompt Status Auditor\n');

  // Create analyzer with custom config
  const config: Partial<StatusAuditConfig> = {};
  if (args.window) {
    config.windowDays = args.window;
  }
  if (args.threshold) {
    config.staleThresholdDays = args.threshold;
  }

  const analyzer = createPromptStatusAnalyzer(config);

  // Load prompt data
  if (args.verbose) {
    console.log('📊 Loading prompt data...');
  }

  const prompts = loadMockPromptData();
  analyzer.addPrompts(prompts);

  if (args.verbose) {
    console.log(`✓ Loaded ${prompts.length} prompts\n`);
  }

  // Analyze status
  if (args.verbose) {
    console.log('🔎 Analyzing prompt status...');
  }

  const report = analyzer.analyzeStatus();

  if (args.verbose) {
    console.log('✓ Analysis complete\n');
  }

  // Display summary
  console.log('📈 Summary:');
  console.log(`  Total Prompts: ${report.summary.totalPrompts}`);
  console.log(`  Completato: ${report.summary.completato}`);
  console.log(`  In Corso: ${report.summary.inCorso}`);
  console.log(`  Non Assegnato: ${report.summary.nonAssegnato}`);
  console.log(`  Bloccato: ${report.summary.bloccato}`);
  console.log(`  Stale Prompts: ${report.summary.stalePrompts}`);
  console.log(`  Acceptance Rate: ${report.summary.acceptanceRate.toFixed(1)}%\n`);

  // Display recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    console.log('');
  }

  // Export reports
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = join(process.cwd(), 'test-results');
  const outputFormat = args.output || 'both';

  if (outputFormat === 'json' || outputFormat === 'both') {
    const jsonPath = join(outputDir, `prompt-status-${timestamp}.json`);
    const jsonContent = analyzer.exportToJSON(report);
    writeFileSync(jsonPath, jsonContent, 'utf-8');
    console.log(`✓ JSON report saved: ${jsonPath}`);
  }

  if (outputFormat === 'markdown' || outputFormat === 'both') {
    const mdPath = join(outputDir, `prompt-status-${timestamp}.md`);
    const mdContent = analyzer.exportToMarkdown(report);
    writeFileSync(mdPath, mdContent, 'utf-8');
    console.log(`✓ Markdown report saved: ${mdPath}`);
  }

  console.log('\n✅ Audit complete!');

  // Exit with appropriate code
  if (report.summary.acceptanceRate < 90) {
    console.log('\n⚠️  Warning: Acceptance rate below target (90%)');
    process.exit(1);
  }

  process.exit(0);
}

// Run CLI
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
