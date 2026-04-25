/**
 * Crew Rotation Documentation Generator – NP‑145 CLI
 * 
 * Generates Markdown and CSV documentation from crew rotation
 * configurations. Supports filtering, templating, and diff output.
 * 
 * @since NP‑145
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, parameters?: Record<string, any>) => void;
  }
}
import type {
  CrewRotationSlot,
  CrewRotationConfig,
} from '@/balancing/config/idleVillage/crewRotationConfig';
import {
  DEFAULT_CREW_ROTATION_CONFIG,
  getEnabledCrewRotations,
  filterRotationsByTags,
  getSlotsByActivityTags,
} from '@/balancing/config/idleVillage/crewRotationConfig';

/**
 * CLI options schema.
 */
const CliOptionsSchema = z.object({
  outputDir: z.string().default('./docs/generated'),
  format: z.enum(['markdown', 'csv', 'both']).default('both'),
  configPath: z.string().optional(),
  tags: z.array(z.string()).default([]),
  activityTags: z.array(z.string()).default([]),
  includeDisabled: z.boolean().default(false),
  template: z.enum(['full', 'compact', 'summary']).default('full'),
  diff: z.string().optional(),
  version: z.string().optional(),
});

type CliOptions = z.infer<typeof CliOptionsSchema>;

/**
 * KPI metrics for a rotation or slot.
 */
interface KpiMetrics {
  minStatMatchScore: number;
  maxFatigueAverage: number;
  minSpecializationScore: number;
  targetEfficiencyMultiplier: number;
}

/**
 * Documentation generation result.
 */
interface DocGenerationResult {
  markdownPath?: string;
  csvPath?: string;
  rotationsProcessed: number;
  slotsProcessed: number;
  generationTime: number;
}

/**
 * Formats KPI targets as a readable string.
 */
function formatKpiTargets(kpi: KpiMetrics): string {
  return [
    `Stat: ${(kpi.minStatMatchScore * 100).toFixed(0)}%`,
    `Fat: ${(kpi.maxFatigueAverage * 100).toFixed(0)}%`,
    `Spec: ${(kpi.minSpecializationScore * 100).toFixed(0)}%`,
    `Eff: ${kpi.targetEfficiencyMultiplier.toFixed(1)}x`,
  ].join(' • ');
}

/**
 * Formats prerequisites as a readable string.
 */
function formatPrerequisites(prereqs: CrewRotationSlot['prerequisites']): string {
  const parts = [];
  
  if (prereqs.minLevel) parts.push(`Lvl ${prereqs.minLevel}+`);
  if (prereqs.maxFatigue) parts.push(`Fat ≤${(prereqs.maxFatigue * 100).toFixed(0)}%`);
  if (prereqs.requiredActivityTags?.length) {
    parts.push(`Tags: ${prereqs.requiredActivityTags.join(', ')}`);
  }
  if (prereqs.blacklistedActivityTags?.length) {
    parts.push(`Blacklist: ${prereqs.blacklistedActivityTags.join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'None';
}

/**
 * Generates Markdown documentation for crew rotations.
 */
function generateMarkdownDoc(
  config: CrewRotationConfig,
  options: CliOptions
): string {
  const rotations = options.includeDisabled 
    ? config.rotations 
    : getEnabledCrewRotations(config);

  // Apply tag filters
  const filteredRotations = options.tags.length > 0
    ? filterRotationsByTags(rotations, options.tags)
    : rotations;

  const timestamp = new Date().toISOString();
  const title = options.version 
    ? `Crew Rotation Documentation v${options.version}`
    : 'Crew Rotation Documentation';

  let markdown = `# ${title}\n\n`;
  markdown += `*Generated on ${timestamp}*\n\n`;

  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Total Rotations**: ${filteredRotations.length}\n`;
  markdown += `- **Total Slots**: ${filteredRotations.reduce((sum, r) => sum + r.slots.length, 0)}\n`;
  markdown += `- **Config Version**: ${config.version}\n`;
  
  if (options.tags.length > 0) {
    markdown += `- **Tag Filter**: ${options.tags.join(', ')}\n`;
  }
  if (options.activityTags.length > 0) {
    markdown += `- **Activity Tag Filter**: ${options.activityTags.join(', ')}\n`;
  }
  
  markdown += '\n';

  // Rotations section
  markdown += `## Rotations\n\n`;

  for (const rotation of filteredRotations) {
    // Apply activity tag filters to slots
    const slots = options.activityTags.length > 0
      ? getSlotsByActivityTags(rotation, options.activityTags)
      : rotation.slots;

    markdown += `### ${rotation.name}\n\n`;
    
    if (rotation.description) {
      markdown += `${rotation.description}\n\n`;
    }

    // Rotation metadata
    markdown += `**Metadata**\n`;
    markdown += `- **ID**: \`${rotation.id}\`\n`;
    markdown += `- **Version**: ${rotation.version}\n`;
    markdown += `- **Status**: ${rotation.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
    markdown += `- **Tags**: ${rotation.tags.length > 0 ? rotation.tags.map(t => `\`${t}\``).join(', ') : 'None'}\n`;
    markdown += `- **Slots**: ${slots.length} / ${rotation.slots.length}\n\n`;

    // Global KPI targets
    markdown += `**Global KPI Targets**\n`;
    markdown += formatKpiTargets(rotation.globalKpiTargets);
    markdown += '\n\n';

    // Slots section
    if (options.template !== 'summary') {
      markdown += `#### Slots\n\n`;

      for (const slot of slots) {
        markdown += `##### ${slot.label}\n\n`;
        
        if (slot.description) {
          markdown += `${slot.description}\n\n`;
        }

        // Slot metadata
        markdown += `**Slot Details**\n`;
        markdown += `- **ID**: \`${slot.id}\`\n`;
        markdown += `- **Icon**: ${slot.iconName}\n`;
        markdown += `- **Max Residents**: ${slot.maxResidents}\n`;
        markdown += `- **Priority**: ${slot.priorityWeight.toFixed(1)}\n`;
        markdown += `- **Phase Lock**: ${slot.phaseLocked || 'None'}\n`;
        markdown += `- **Tags**: ${slot.tags.length > 0 ? slot.tags.map(t => `\`${t}\``).join(', ') : 'None'}\n`;
        markdown += `- **Supported Activities**: ${slot.supportedActivityTags.map(t => `\`${t}\``).join(', ')}\n\n`;

        // KPI targets
        markdown += `**KPI Targets**\n`;
        markdown += formatKpiTargets(slot.kpiTargets);
        markdown += '\n\n';

        // Prerequisites
        markdown += `**Prerequisites**\n`;
        markdown += formatPrerequisites(slot.prerequisites);
        markdown += '\n\n';

        // Modifiers
        if (slot.modifiers) {
          markdown += `**Modifiers**\n`;
          const mods = [];
          if (slot.modifiers.fatigueMult) mods.push(`Fatigue ×${slot.modifiers.fatigueMult.toFixed(1)}`);
          if (slot.modifiers.riskMult) mods.push(`Risk ×${slot.modifiers.riskMult.toFixed(1)}`);
          if (slot.modifiers.yieldMult) mods.push(`Yield ×${slot.modifiers.yieldMult.toFixed(1)}`);
          markdown += mods.join(' • ');
          markdown += '\n\n';
        }

        markdown += '---\n\n';
      }
    }
  }

  // Statistics section
  if (options.template === 'full') {
    markdown += `## Statistics\n\n`;
    
    // Tag frequency
    const tagFrequency = new Map<string, number>();
    const activityTagFrequency = new Map<string, number>();
    
    filteredRotations.forEach(rotation => {
      rotation.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
      
      rotation.slots.forEach(slot => {
        slot.supportedActivityTags.forEach(tag => {
          activityTagFrequency.set(tag, (activityTagFrequency.get(tag) || 0) + 1);
        });
      });
    });

    markdown += `### Tag Frequency\n\n`;
    markdown += `| Tag | Count |\n`;
    markdown += `|-----|--------|\n`;
    
    Array.from(tagFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([tag, count]) => {
        markdown += `| \`${tag}\` | ${count} |\n`;
      });

    markdown += `\n### Activity Tag Frequency\n\n`;
    markdown += `| Tag | Count |\n`;
    markdown += `|-----|--------|\n`;
    
    Array.from(activityTagFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([tag, count]) => {
        markdown += `| \`${tag}\` | ${count} |\n`;
      });
  }

  return markdown;
}

/**
 * Generates CSV documentation for crew rotations.
 */
function generateCsvDoc(
  config: CrewRotationConfig,
  options: CliOptions
): string {
  const rotations = options.includeDisabled 
    ? config.rotations 
    : getEnabledCrewRotations(config);

  // Apply tag filters
  const filteredRotations = options.tags.length > 0
    ? filterRotationsByTags(rotations, options.tags)
    : rotations;

  const headers = [
    'rotation_id',
    'rotation_name',
    'rotation_version',
    'rotation_enabled',
    'rotation_tags',
    'slot_id',
    'slot_label',
    'slot_icon',
    'slot_max_residents',
    'slot_priority',
    'slot_phase_lock',
    'slot_tags',
    'supported_activities',
    'kpi_min_stat_match',
    'kpi_max_fatigue',
    'kpi_min_specialization',
    'kpi_target_efficiency',
    'prereq_min_level',
    'prereq_max_fatigue',
    'prereq_required_tags',
    'prereq_blacklisted_tags',
    'mod_fatigue_mult',
    'mod_risk_mult',
    'mod_yield_mult',
  ];

  const rows = [headers.join(',')];

  for (const rotation of filteredRotations) {
    // Apply activity tag filters to slots
    const slots = options.activityTags.length > 0
      ? getSlotsByActivityTags(rotation, options.activityTags)
      : rotation.slots;

    for (const slot of slots) {
      const row = [
        `"${rotation.id}"`,
        `"${rotation.name}"`,
        `"${rotation.version}"`,
        rotation.enabled,
        `"${rotation.tags.join(';')}"`,
        `"${slot.id}"`,
        `"${slot.label}"`,
        `"${slot.iconName}"`,
        slot.maxResidents,
        slot.priorityWeight,
        `"${slot.phaseLocked || ''}"`,
        `"${slot.tags.join(';')}"`,
        `"${slot.supportedActivityTags.join(';')}"`,
        slot.kpiTargets.minStatMatchScore,
        slot.kpiTargets.maxFatigueAverage,
        slot.kpiTargets.minSpecializationScore,
        slot.kpiTargets.targetEfficiencyMultiplier,
        slot.prerequisites.minLevel || '',
        slot.prerequisites.maxFatigue || '',
        `"${(slot.prerequisites.requiredActivityTags || []).join(';')}"`,
        `"${(slot.prerequisites.blacklistedActivityTags || []).join(';')}"`,
        slot.modifiers?.fatigueMult || '',
        slot.modifiers?.riskMult || '',
        slot.modifiers?.yieldMult || '',
      ];
      
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Main documentation generation function.
 */
async function generateDocumentation(
  config: CrewRotationConfig,
  options: CliOptions
): Promise<DocGenerationResult> {
  const startTime = Date.now();
  const result: DocGenerationResult = {
    rotationsProcessed: 0,
    slotsProcessed: 0,
    generationTime: 0,
  };

  // Ensure output directory exists
  await mkdir(options.outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = options.version 
    ? `crew-rotation-${options.version}`
    : `crew-rotation-${timestamp}`;

  // Count rotations and slots
  const rotations = options.includeDisabled 
    ? config.rotations 
    : getEnabledCrewRotations(config);
  
  const filteredRotations = options.tags.length > 0
    ? filterRotationsByTags(rotations, options.tags)
    : rotations;

  result.rotationsProcessed = filteredRotations.length;
  result.slotsProcessed = filteredRotations.reduce((sum, r) => sum + r.slots.length, 0);

  // Generate Markdown
  if (options.format === 'markdown' || options.format === 'both') {
    const markdown = generateMarkdownDoc(config, options);
    const markdownPath = join(options.outputDir, `${baseFilename}.md`);
    await writeFile(markdownPath, markdown, 'utf-8');
    result.markdownPath = markdownPath;
  }

  // Generate CSV
  if (options.format === 'csv' || options.format === 'both') {
    const csv = generateCsvDoc(config, options);
    const csvPath = join(options.outputDir, `${baseFilename}.csv`);
    await writeFile(csvPath, csv, 'utf-8');
    result.csvPath = csvPath;
  }

  result.generationTime = Date.now() - startTime;
  return result;
}

/**
 * CLI entry point.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options: CliOptions = {
    outputDir: './docs/generated',
    format: 'both',
    tags: [],
    activityTags: [],
    includeDisabled: false,
    template: 'full',
  };

  // Simple argument parsing (in production, use a proper CLI library)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--format':
      case '-f':
        const format = args[++i];
        if (format === 'markdown' || format === 'csv' || format === 'both') {
          options.format = format;
        }
        break;
      case '--tags':
      case '-t':
        options.tags = args[++i].split(',');
        break;
      case '--activity-tags':
      case '-a':
        options.activityTags = args[++i].split(',');
        break;
      case '--include-disabled':
      case '-d':
        options.includeDisabled = true;
        break;
      case '--template': {
        options.template = args[++i] as 'full' | 'compact' | 'summary';
        break;
      }
      case '--version':
      case '-v':
        options.version = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Crew Rotation Documentation Generator

Usage: npm run crew-rotation-doc [options]

Options:
  -o, --output <dir>        Output directory (default: ./docs/generated)
  -f, --format <format>     Output format: markdown, csv, both (default: both)
  -t, --tags <tags>         Comma-separated rotation tags to filter
  -a, --activity-tags <tags> Comma-separated activity tags to filter
  -d, --include-disabled    Include disabled rotations
  --template <template>     Template: full, compact, summary (default: full)
  -v, --version <version>   Version string for output filenames
  -h, --help               Show this help

Examples:
  npm run crew-rotation-doc --format markdown --template compact
  npm run crew-rotation-doc --tags quest,combat --include-disabled
  npm run crew-rotation-doc --activity-tags gathering --version v1.2.0
        `);
        return;
    }
  }

  // Validate options
  const validatedOptions = CliOptionsSchema.parse(options);

  // Load configuration
  const config = DEFAULT_CREW_ROTATION_CONFIG;
  
  if (validatedOptions.configPath) {
    try {
      // In a real implementation, load and parse the config file
      console.log(`Loading config from: ${validatedOptions.configPath}`);
      // config = await loadConfig(validatedOptions.configPath);
    } catch (error) {
      console.error(`Failed to load config from ${validatedOptions.configPath}:`, error);
      process.exit(1);
    }
  }

  console.log('Generating crew rotation documentation...');
  console.log(`Options:`, validatedOptions);

  try {
    const result = await generateDocumentation(config, validatedOptions);
    
    console.log('\n✅ Documentation generated successfully!');
    console.log(`📊 Rotations processed: ${result.rotationsProcessed}`);
    console.log(`🔧 Slots processed: ${result.slotsProcessed}`);
    console.log(`⏱️ Generation time: ${result.generationTime}ms`);
    
    if (result.markdownPath) {
      console.log(`📝 Markdown: ${result.markdownPath}`);
    }
    if (result.csvPath) {
      console.log(`📊 CSV: ${result.csvPath}`);
    }

    // Emit telemetry event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'crew_rotation_doc_generated', {
        format: validatedOptions.format,
        rotations_count: result.rotationsProcessed,
        slots_count: result.slotsProcessed,
        generation_time_ms: result.generationTime,
      });
    }

  } catch (error) {
    console.error('❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

// Export for testing
export {
  generateMarkdownDoc,
  generateCsvDoc,
  generateDocumentation,
  formatKpiTargets,
  formatPrerequisites,
  type CliOptions,
  type DocGenerationResult,
};

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
