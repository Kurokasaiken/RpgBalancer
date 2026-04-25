#!/usr/bin/env tsx

/**
 * Minimal QA Checklist Generator CLI (NP-MIN-PLAN-209)
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';
import { pathToFileURL } from 'url';
import {
  MINIMAL_GAMEPLAY_CONFIG,
  type MinimalGameplayHUDFieldConfig,
  type MinimalGameplayLocationDefinition,
} from '@/balancing/config/idleVillage/minimalGameplayConfig';

const PROJECT_ROOT = resolve('.');
const DEFAULT_OUTPUT_DIR = resolve(PROJECT_ROOT, 'test-results');
const KANBAN_PATH = resolve(PROJECT_ROOT, 'src/docs/docs/coordinator/agent_assignments.md');
const DEFAULT_SAFEGUARDS = [
  'npm run lint -- scripts/idleVillage',
  'npm run test -- tests/unit/scripts/MinimalQaChecklist.test.ts',
  'npm run build:check',
  'npm run kanban:lint',
];

/**
 * Parsed command-line arguments accepted by the CLI.
 */
export interface CLIArgs {
  includeConfig?: string;
  output?: string;
  help?: boolean;
  verbose?: boolean;
}

/**
 * Minimal representation of a Kanban row from agent_assignments.md.
 */
export interface KanbanRow {
  promptId: string;
  title: string;
  status: string;
  agent: string;
  lastUpdate?: string;
  note?: string;
}

/**
 * Single bullet cluster inside a checklist section.
 */
export interface ChecklistItem {
  title: string;
  bullets: string[];
}

/**
 * Higher-level grouping of checklist bullets.
 */
export interface ChecklistSection {
  title: string;
  description: string;
  items: ChecklistItem[];
}

/**
 * Metadata describing an optional config snapshot referenced in evidence.
 */
export interface ConfigSnapshotInfo {
  path: string;
  exists: boolean;
  sizeBytes?: number;
  excerpt?: string;
}

/**
 * Aggregated data used to render the Markdown checklist.
 */
export interface ChecklistReport {
  generatedAt: string;
  configVersion: string;
  kanbanPath: string;
  locationsTracked: number;
  residentsTracked: number;
  eventLogEntries: number;
  activePrompts: KanbanRow[];
  sections: ChecklistSection[];
  safeguards: string[];
  configSnapshot?: ConfigSnapshotInfo;
}

/**
 * Parse CLI arguments passed to the script.
 */
export function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--include-config':
        result.includeConfig = args[++i];
        break;
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return result;
}

/**
 * Print CLI help instructions.
 */
export function showHelp(): void {
  console.log(
    'Minimal Gameplay QA Checklist CLI\n\n' +
      'Usage:\n  tsx scripts/idleVillage/minimalQaChecklist.ts [options]\n\n' +
      'Options:\n' +
      '  -o, --output <file>        Override output path (defaults to test-results/minimal-qa-checklist-<ts>.md)\n' +
      '      --include-config <p>  Attach config snapshot reference from path <p>\n' +
      '  -v, --verbose             Verbose logging\n' +
      '  -h, --help                Show this message\n' +
      'Example:\n' +
      '  tsx scripts/idleVillage/minimalQaChecklist.ts --include-config data/exports/minimal-snapshot.json\n'
  );
}

/**
 * Convert Kanban markdown table into structured rows.
 */
export function parseKanbanRows(markdown: string): KanbanRow[] {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith('| Prompt ID/Descrizione'));
  if (startIndex === -1) {
    return [];
  }

  const rows: KanbanRow[] = [];
  for (let i = startIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      break;
    }

    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 8) {
      continue;
    }

    const [promptCell, status, _dependsOn, agent, _duration, _estimate, lastUpdate, note] = cells;
    const [promptIdRaw, ...titleParts] = promptCell.split(' – ');
    const promptId = promptIdRaw.trim();
    const title = titleParts.join(' – ').trim();

    rows.push({
      promptId,
      title: title || promptId,
      status,
      agent,
      lastUpdate: lastUpdate || undefined,
      note: note || undefined,
    });
  }

  return rows;
}

/**
 * Return Minimal Gameplay prompts that are not completed.
 */
export function collectActiveMinimalPrompts(rows: KanbanRow[]): KanbanRow[] {
  return rows.filter(
    row => row.promptId.startsWith('MG-') && (row.status === 'In corso' || row.status === 'Non assegnato')
  );
}

/**
 * Collect metadata about a provided config snapshot path for traceability.
 */
function describeConfigSnapshot(pathInput: string): ConfigSnapshotInfo {
  const resolved = resolve(PROJECT_ROOT, pathInput);
  if (!existsSync(resolved)) {
    return { path: resolved, exists: false };
  }

  const stats = statSync(resolved);
  let excerpt: string | undefined;
  try {
    const content = readFileSync(resolved, 'utf-8');
    excerpt = content.slice(0, 600).trim();
  } catch {
    excerpt = undefined;
  }

  return {
    path: resolved,
    exists: true,
    sizeBytes: stats.size,
    excerpt,
  };
}

/**
 * Build the static checklist sections that QA needs to execute.
 */
export function buildChecklistSections(): ChecklistSection[] {
  const config = MINIMAL_GAMEPLAY_CONFIG;

  const persistenceItems: ChecklistItem[] = [
    {
      title: 'Autosave cadence & PersistenceService adherence',
      bullets: [
        `Confirm autosave triggers every ${config.loop.autosaveIntervalMs / 1000} seconds via PersistenceService (no sync storage).`,
        `Validate warmup delay (${config.loop.warmupDelayMs}ms) does not skip the first autosave window.`,
      ],
    },
    {
      title: 'Default event log replay',
      bullets: [
        `Replay the ${config.defaultEventLog.length} default events and verify payloads (activities, rewards, fatigue deltas).`,
        'Ensure event injection respects deterministic ordering when exported via snapshot serializer.',
      ],
    },
    {
      title: 'Versioned config integrity',
      bullets: [
        `Cross-check config version (${config.version}) with latest MinimalGameplayPage build artifacts.`,
        'Record diffs using minimalConfigDiff CLI for archival before/after QA runs.',
      ],
    },
  ];

  const telemetryItems: ChecklistItem[] = config.locations.map((location: MinimalGameplayLocationDefinition): ChecklistItem => ({
    title: `Telemetry for ${location.label}`,
    bullets: [
      `Validate activity ${location.activityId} emits telemetry tags [${(location.telemetryTags || []).join(', ') || 'none'}].`,
      'Ensure drop validation rejects produce dropCopy reasons mapped to telemetry payloads.',
    ],
  }));
  telemetryItems.push({
    title: 'Loop level instrumentation',
    bullets: [
      'Verify minimal_gameplay_tick and pause/resume events remain within expected throughput.',
      'Confirm telemetry buffer flush honors Minimal Loop Telemetry Buffer configuration (NP-MIN-PLAN-203).',
    ],
  });

  const uiItems: ChecklistItem[] = [
    {
      title: `Hero & HUD tokens (${config.ui.hero.subtitle})`,
      bullets: [
        `Validate hero description matches config: "${config.ui.hero.description}".`,
        `Check HUD warning badges for ${config.ui.hudFields
          .filter(field => field.supportsWarningBadge)
          .map(field => field.label)
          .join(', ')} using thresholds (${Math.round(config.ui.thresholds.fatigueDangerPercent * 100)}% fatigue / ${config.ui.thresholds.foodDangerDays} days food).`,
      ],
    },
    ...config.ui.hudFields.map((field: MinimalGameplayHUDFieldConfig): ChecklistItem => ({
      title: `HUD field – ${field.label}`,
      bullets: [
        `Formatting: ${field.format || 'default'}; warnings supported: ${field.supportsWarningBadge ? 'yes' : 'no'}.`,
        'Confirm aria-live regions announce live deltas for accessibility.',
      ],
    })),
    {
      title: 'Roster warning tokens',
      bullets: [
        `Validate Style Lab tokens (fatigue: ${config.ui.warningTokens.fatigueWarningBg}, food: ${config.ui.warningTokens.foodWarningBg}, injury: ${config.ui.warningTokens.injuryWarningBg}).`,
        `Ensure injury badge copy renders as "${config.ui.thresholds.injuryBadgeCopy}".`,
      ],
    },
  ];

  const docsItems: ChecklistItem[] = [
    {
      title: 'Plan alignment',
      bullets: [
        'Update docs/plans/minimal_gameplay_implementation_plan.md with QA notes and new findings.',
        'Cross-reference doc changes with current Kanban note field for MG prompts.',
      ],
    },
    {
      title: 'Checklist archival',
      bullets: [
        'Upload generated Markdown to test-results and share link in evidence log.',
        'Ensure docs/qa/minimal_checklist_howto.md reflects latest CLI flags and cron strategy.',
      ],
    },
    {
      title: 'Prompt commentary',
      bullets: [
        'Append QA outcome summary to agent_assignments row when closing prompt.',
        'Attach config snapshot reference (if provided) to Kanban note for traceability.',
      ],
    },
  ];

  return [
    { title: 'Persistence Validation', description: 'Storage, autosave, and configuration integrity tasks.', items: persistenceItems },
    { title: 'Telemetry Coverage', description: 'Ensure every Minimal Gameplay surface emits the expected analytics events.', items: telemetryItems },
    { title: 'UI & HUD Review', description: 'Visual + accessibility validation driven directly by MinimalGameplayConfig.', items: uiItems },
    { title: 'Documentation & Evidence', description: 'Paper trail, how-to updates, and archival requirements.', items: docsItems },
  ];
}

/**
 * Produce the aggregate data used by the Markdown formatter.
 */
export function buildChecklistReport(activePrompts: KanbanRow[], configSnapshot?: ConfigSnapshotInfo): ChecklistReport {
  return {
    generatedAt: new Date().toISOString(),
    configVersion: MINIMAL_GAMEPLAY_CONFIG.version,
    kanbanPath: relative(PROJECT_ROOT, KANBAN_PATH),
    locationsTracked: MINIMAL_GAMEPLAY_CONFIG.locations.length,
    residentsTracked: MINIMAL_GAMEPLAY_CONFIG.residents.length,
    eventLogEntries: MINIMAL_GAMEPLAY_CONFIG.defaultEventLog.length,
    activePrompts,
    sections: buildChecklistSections(),
    safeguards: DEFAULT_SAFEGUARDS,
    configSnapshot,
  };
}

/**
 * Render the human-readable Markdown output.
 */
export function formatChecklistMarkdown(report: ChecklistReport): string {
  const lines: string[] = [];
  lines.push('# Minimal Gameplay QA Checklist');
  lines.push('');
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push(`- **Config Version:** ${report.configVersion}`);
  lines.push(`- **Kanban Source:** ${report.kanbanPath}`);
  lines.push(`- **Locations Tracked:** ${report.locationsTracked}`);
  lines.push(`- **Residents Tracked:** ${report.residentsTracked}`);
  lines.push(`- **Default Event Log Entries:** ${report.eventLogEntries}`);
  lines.push('');

  lines.push('## Active Minimal Gameplay Prompts (Non assegnato / In corso)');
  if (report.activePrompts.length === 0) {
    lines.push('_Nessun prompt attivo nella sezione MG. QA può procedere con regression focus._');
  } else {
    lines.push('| Prompt | Stato | Agente | Ultimo Update | Note |');
    lines.push('| --- | --- | --- | --- | --- |');
    report.activePrompts.forEach((prompt: KanbanRow) => {
      lines.push(
        `| ${prompt.promptId} – ${prompt.title} | ${prompt.status} | ${prompt.agent} | ${prompt.lastUpdate ?? '-'} | ${prompt.note ?? '-'} |`
      );
    });
  }
  lines.push('');

  report.sections.forEach((section: ChecklistSection) => {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(`${section.description}`);
    lines.push('');
    section.items.forEach((item: ChecklistItem) => {
      lines.push(`- **${item.title}**`);
      item.bullets.forEach((bullet: string) => {
        lines.push(`  - ${bullet}`);
      });
    });
    lines.push('');
  });

  lines.push('## Safeguard TODOs');
  lines.push('');
  report.safeguards.forEach((cmd: string) => {
    lines.push(`- [ ] ${cmd}`);
  });
  lines.push('');

  if (report.configSnapshot) {
    const snapshot = report.configSnapshot;
    lines.push('## Config Snapshot Reference');
    lines.push('');
    lines.push(`- **Path:** ${snapshot.path}`);
    lines.push(`- **Exists:** ${snapshot.exists ? 'yes' : 'no'}`);
    if (snapshot.exists) {
      lines.push(`- **Size:** ${snapshot.sizeBytes ?? 0} bytes`);
      if (snapshot.excerpt) {
        lines.push('');
        lines.push('```text');
        lines.push(snapshot.excerpt);
        lines.push('```');
      }
    }
    lines.push('');
  }

  lines.push('## Notes');
  lines.push('');
  lines.push('- Schedule checklist generation alongside nightly MG builds (cron suggestion in docs/qa/minimal_checklist_howto.md).');
  lines.push('- Archive generated Markdown in test-results with timestamped filenames for evidence logs.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Ensure the destination directory exists before writing.
 */
function ensureDirectory(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Convert a Date into a filesystem-safe slug.
 */
function timestampSlug(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * Execute the CLI flow end-to-end.
 */
export function runCli(): void {
  const args = parseArgs();
  if (args.help) {
    showHelp();
    return;
  }

  const outputPath = resolve(
    args.output ?? `${DEFAULT_OUTPUT_DIR}/minimal-qa-checklist-${timestampSlug(new Date())}.md`
  );
  const includeConfigInfo = args.includeConfig ? describeConfigSnapshot(args.includeConfig) : undefined;

  const kanbanContent = readFileSync(KANBAN_PATH, 'utf-8');
  const rows = parseKanbanRows(kanbanContent);
  const activePrompts = collectActiveMinimalPrompts(rows);
  const report = buildChecklistReport(activePrompts, includeConfigInfo);
  const markdown = formatChecklistMarkdown(report);

  ensureDirectory(outputPath);
  writeFileSync(outputPath, markdown, 'utf-8');

  if (args.verbose) {
    console.log(
      `Generated checklist with ${report.sections.reduce((sum, section) => sum + section.items.length, 0)} items.`
    );
  }
  console.log(`Checklist written to ${outputPath}`);
}

const entryUrl = typeof process.argv[1] === 'string' ? pathToFileURL(process.argv[1]).href : '';
if (entryUrl && import.meta.url === entryUrl) {
  runCli();
}
