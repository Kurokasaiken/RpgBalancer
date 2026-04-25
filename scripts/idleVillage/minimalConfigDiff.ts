#!/usr/bin/env tsx

/**
 * Minimal Config Diff Reporter CLI
 *
 * CLI tool to compare two versions of Minimal Gameplay config exported as JSON
 * and generate difference reports in JSON or Markdown format.
 *
 * Usage: npm run minimal-config-diff -- --from <config-a.json> --to <config-b.json> [--format json|md] [--output <file>]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Import the schema for validation
import { MinimalConfigSchema } from '@/balancing/config/idleVillage/minimalConfig';

interface DiffOptions {
  from: string;
  to: string;
  format?: 'json' | 'md';
  output?: string;
}

interface ConfigDiff {
  summary: {
    hasChanges: boolean;
    sectionsChanged: string[];
    totalChanges: number;
  };
  sections: {
    resources: SectionDiff;
    ui: SectionDiff;
    loop: SectionDiff;
    warnings: SectionDiff;
  };
  metadata: {
    fromFile: string;
    toFile: string;
    generatedAt: string;
  };
}

interface SectionDiff {
  hasChanges: boolean;
  changes: Change[];
  changeCount: number;
}

interface Change {
  path: string;
  type: 'added' | 'removed' | 'modified';
  from?: any;
  to?: any;
}

/**
 * Load and validate config from JSON file.
 */
function loadConfig(filePath: string): any {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Validate against schema
    const result = MinimalConfigSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid config in ${filePath}: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${filePath}: ${error.message}`);
    }
    throw new Error(`Failed to load config from ${filePath}`);
  }
}

/**
 * Calculate differences between two config objects.
 */
function calculateConfigDiff(fromConfig: any, toConfig: any): Omit<ConfigDiff, 'metadata'> {
  const sections = ['resources', 'ui', 'loop', 'warnings'];
  const sectionDiffs: ConfigDiff['sections'] = {} as any;
  const sectionsChanged: string[] = [];
  let totalChanges = 0;

  for (const section of sections) {
    const diff = calculateSectionDiff(fromConfig[section], toConfig[section], section);
    sectionDiffs[section as keyof typeof sectionDiffs] = diff;

    if (diff.hasChanges) {
      sectionsChanged.push(section);
      totalChanges += diff.changeCount;
    }
  }

  return {
    summary: {
      hasChanges: sectionsChanged.length > 0,
      sectionsChanged,
      totalChanges,
    },
    sections: sectionDiffs,
  };
}

/**
 * Calculate differences for a specific config section.
 */
function calculateSectionDiff(fromSection: any, toSection: any, sectionPath: string): SectionDiff {
  const changes: Change[] = [];

  // Handle different section structures
  switch (sectionPath) {
    case 'resources':
      changes.push(...diffResources(fromSection, toSection));
      break;
    case 'ui':
      changes.push(...diffUI(fromSection, toSection));
      break;
    case 'loop':
      changes.push(...diffLoop(fromSection, toSection));
      break;
    case 'warnings':
      changes.push(...diffWarnings(fromSection, toSection));
      break;
    default:
      changes.push(...diffGeneric(fromSection, toSection, sectionPath));
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    changeCount: changes.length,
  };
}

/**
 * Diff resources section (residents, locations).
 */
function diffResources(from: any, to: any): Change[] {
  const changes: Change[] = [];

  // Compare residents array
  if (JSON.stringify(from.residents) !== JSON.stringify(to.residents)) {
    changes.push({
      path: 'resources.residents',
      type: 'modified',
      from: from.residents,
      to: to.residents,
    });
  }

  // Compare locations array
  if (JSON.stringify(from.locations) !== JSON.stringify(to.locations)) {
    changes.push({
      path: 'resources.locations',
      type: 'modified',
      from: from.locations,
      to: to.locations,
    });
  }

  return changes;
}

/**
 * Diff UI section (tokens, hudFields, etc.).
 */
function diffUI(from: any, to: any): Change[] {
  const changes: Change[] = [];

  // Compare hero section
  if (JSON.stringify(from.hero) !== JSON.stringify(to.hero)) {
    changes.push({
      path: 'ui.hero',
      type: 'modified',
      from: from.hero,
      to: to.hero,
    });
  }

  // Compare HUD fields
  if (JSON.stringify(from.hudFields) !== JSON.stringify(to.hudFields)) {
    changes.push({
      path: 'ui.hudFields',
      type: 'modified',
      from: from.hudFields,
      to: to.hudFields,
    });
  }

  // Compare tokens
  if (JSON.stringify(from.tokens) !== JSON.stringify(to.tokens)) {
    changes.push({
      path: 'ui.tokens',
      type: 'modified',
      from: from.tokens,
      to: to.tokens,
    });
  }

  // Compare other UI settings
  const uiKeys = ['logDisplayLimit', 'showGameOverPanel', 'dropCopy'];
  for (const key of uiKeys) {
    if (JSON.stringify(from[key]) !== JSON.stringify(to[key])) {
      changes.push({
        path: `ui.${key}`,
        type: 'modified',
        from: from[key],
        to: to[key],
      });
    }
  }

  return changes;
}

/**
 * Diff loop section (timings, multipliers).
 */
function diffLoop(from: any, to: any): Change[] {
  const changes: Change[] = [];

  const loopKeys = [
    'tickIntervalMs', 'autosaveIntervalMs', 'warmupDelayMs',
    'maxSpeedMultiplier', 'defaultSpeedMultiplier'
  ];

  for (const key of loopKeys) {
    if (from[key] !== to[key]) {
      changes.push({
        path: `loop.${key}`,
        type: 'modified',
        from: from[key],
        to: to[key],
      });
    }
  }

  return changes;
}

/**
 * Diff warnings section (thresholds, messages).
 */
function diffWarnings(from: any, to: any): Change[] {
  const changes: Change[] = [];

  // Compare warning thresholds
  if (JSON.stringify(from.warningThresholds) !== JSON.stringify(to.warningThresholds)) {
    changes.push({
      path: 'warnings.warningThresholds',
      type: 'modified',
      from: from.warningThresholds,
      to: to.warningThresholds,
    });
  }

  // Compare warning copy
  if (JSON.stringify(from.warningCopy) !== JSON.stringify(to.warningCopy)) {
    changes.push({
      path: 'warnings.warningCopy',
      type: 'modified',
      from: from.warningCopy,
      to: to.warningCopy,
    });
  }

  return changes;
}

/**
 * Generic diff for unknown sections.
 */
function diffGeneric(from: any, to: any, path: string): Change[] {
  if (JSON.stringify(from) !== JSON.stringify(to)) {
    return [{
      path,
      type: 'modified',
      from,
      to,
    }];
  }
  return [];
}

/**
 * Generate Markdown report from diff data.
 */
function generateMarkdownReport(diff: ConfigDiff): string {
  let report = `# Config Diff Report

**From:** \`${diff.metadata.fromFile}\`
**To:** \`${diff.metadata.toFile}\`
**Generated:** ${diff.metadata.generatedAt}

## Summary

- **Changes Detected:** ${diff.summary.hasChanges ? 'Yes' : 'No'}
- **Sections Changed:** ${diff.summary.sectionsChanged.join(', ') || 'None'}
- **Total Changes:** ${diff.summary.totalChanges}

`;

  // Add section details
  for (const [sectionName, sectionDiff] of Object.entries(diff.sections)) {
    report += `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Section

**Changes:** ${sectionDiff.changeCount}

`;

    if (sectionDiff.hasChanges) {
      for (const change of sectionDiff.changes) {
        report += `### ${change.path}

**Type:** ${change.type}

`;
        if (change.from !== undefined) {
          report += `**From:**
\`\`\`json
${JSON.stringify(change.from, null, 2)}
\`\`\`

`;
        }
        if (change.to !== undefined) {
          report += `**To:**
\`\`\`json
${JSON.stringify(change.to, null, 2)}
\`\`\`

`;
        }
      }
    } else {
      report += `No changes detected in this section.

`;
    }
  }

  report += `---
*Generated by NP-MIN-PLAN-205 – Minimal Config Diff Reporter*
`;

  return report;
}

/**
 * Main CLI function.
 */
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<DiffOptions> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--from':
        options.from = args[++i];
        break;
      case '--to':
        options.to = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'json' | 'md';
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Minimal Config Diff Reporter CLI

Usage: npm run minimal-config-diff -- --from <config-a.json> --to <config-b.json> [--format json|md] [--output <file>]

Required Arguments:
  --from <file>     Path to first config JSON file
  --to <file>       Path to second config JSON file

Optional Arguments:
  --format <type>  Output format: 'json' or 'md' (default: json)
  --output <file>  Output file path (default: console output)
  --help, -h       Show this help message

Examples:
  npm run minimal-config-diff -- --from config-v1.json --to config-v2.json
  npm run minimal-config-diff -- --from config-v1.json --to config-v2.json --format md --output diff-report.md

Description:
  Compares two Minimal Gameplay config files and generates a detailed diff report.
  Validates configs against the MinimalConfigSchema and highlights changes in
  resources, UI, loop, and warnings sections.
`);
        process.exit(0);
        break;
      default:
        if (args[i].startsWith('-')) {
          console.error(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  // Validate required arguments
  if (!options.from || !options.to) {
    console.error('Error: Missing required arguments. Use --help for usage information.');
    console.error('Required: --from and --to');
    process.exit(1);
  }

  try {
    console.log(`🔍 Comparing configs: ${options.from} → ${options.to}`);

    // Load and validate configs
    const fromConfig = loadConfig(options.from);
    const toConfig = loadConfig(options.to);

    // Calculate diff
    const diffData = calculateConfigDiff(fromConfig, toConfig);

    // Create complete diff object
    const diff: ConfigDiff = {
      ...diffData,
      metadata: {
        fromFile: options.from,
        toFile: options.to,
        generatedAt: new Date().toISOString(),
      },
    };

    // Generate output
    let output: string;
    const format = options.format || 'json';

    if (format === 'md') {
      output = generateMarkdownReport(diff);
    } else {
      output = JSON.stringify(diff, null, 2);
    }

    // Output handling
    if (options.output) {
      const fileName = options.output.endsWith(`.${format}`)
        ? options.output
        : `${options.output}.${format}`;

      const outputPath = join(process.cwd(), 'test-results', fileName);
      writeFileSync(outputPath, output);
      console.log(`✅ Diff report saved: ${outputPath}`);
    } else {
      console.log(output);
    }

    // Summary
    console.log(`📊 Summary: ${diff.summary.totalChanges} changes across ${diff.summary.sectionsChanged.length} sections`);

  } catch (error) {
    console.error('❌ Diff generation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}

export { calculateConfigDiff, generateMarkdownReport, ConfigDiff, Change };
