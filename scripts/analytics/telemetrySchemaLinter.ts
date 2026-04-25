#!/usr/bin/env node

/**
 * NP-264 – Punch Club Telemetry Schema Linter CLI
 *
 * Validates telemetry exports/events against the canonical Punch Club schemas
 * using the TelemetrySchemaLinter domain module. Designed to run inside CI,
 * local audits, and guardian safeguards.
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  TelemetrySchemaLinter,
  DEFAULT_TELEMETRY_SCHEMA_LINT_CONFIG,
  type TelemetrySchemaLintConfig,
  type TelemetrySchemaLintResult,
  type TelemetrySchemaLintMetadata,
  formatLintResultAsMarkdown,
  formatLintResultAsJson,
} from '@/analytics/telemetry/telemetryProvider/telemetrySchemaLinter';

const program = new Command();

program
  .name('telemetry-schema-linter')
  .description('Validate Punch Club telemetry payloads against the central schema')
  .requiredOption('-i, --input <path>', 'Path to telemetry JSON file (events array or export object)')
  .option('-o, --output <path>', 'Output path for the lint report (defaults to test-results directory)')
  .option('-f, --format <format>', 'Report format: markdown | json', 'markdown')
  .option('-c, --config <path>', 'Path to JSON file with TelemetrySchemaLintConfig overrides')
  .option('--source <name>', 'Friendly source label for metadata (e.g. pipeline id)')
  .option('--schema-version <version>', 'Schema/export version override for metadata')
  .option('--export-id <id>', 'Explicit export identifier when linting raw event arrays')
  .option('--relaxed', 'Disable strict-mode enforcement (allows warnings with non-zero issues)')
  .option('--no-persist', 'Disable persistence of lint results via PersistenceService')
  .option('--max-issues-per-event <count>', 'Override max issues collected per event', parseInt)
  .option('--max-issues-total <count>', 'Override total max issues collected', parseInt)
  .option('--suggest-fixes', 'Enable fix suggestions (default true)', true)
  .option('--no-suggest-fixes', 'Disable heuristic fix suggestions')
  .option('--stdin', 'Read telemetry payload from STDIN instead of a file')
  .option('--pretty', 'Pretty-print console summary with separators', false)
  .option('--dry-run', 'Process input but never persist results regardless of config', false)
  .option('--exit-on-issues', 'Force non-zero exit code when issues are present (default true)', true)
  .option('--no-exit-on-issues', 'Allow success exit code even when issues exist');

program.action(async (cliOptions) => {
  const start = performance.now();

  try {
    const payload = await loadTelemetryPayload(cliOptions);
    const config = await buildConfig(cliOptions);
    const metadata = buildMetadata(cliOptions);

    const linter = new TelemetrySchemaLinter(config);
    const result = await linter.lint(payload, metadata);

    if (cliOptions.dryRun) {
      // Re-run lint without persistence by saving a copy without touching PersistenceService
      result.metadata = { ...result.metadata, dryRun: true };
    }

    const report = formatReport(result, cliOptions.format);
    const outputPath = await emitReport(report, cliOptions.output, cliOptions.format);

    logSummary(result, outputPath, performance.now() - start, cliOptions.pretty);

    const shouldExitWithError = (cliOptions.exitOnIssues ?? true) && !result.isValid;
    process.exitCode = shouldExitWithError ? 1 : 0;
  } catch (error) {
    console.error('❌ Telemetry schema lint failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
});

program.parseAsync(process.argv);

async function loadTelemetryPayload(options: Record<string, unknown>): Promise<unknown> {
  if (options.stdin) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Uint8Array);
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(raw);
  }

  const filePath = path.resolve(String(options.input));
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function buildConfig(options: Record<string, any>): Promise<TelemetrySchemaLintConfig> {
  let configOverrides: Partial<TelemetrySchemaLintConfig> = {};

  if (options.config) {
    const configPath = path.resolve(String(options.config));
    const rawConfig = await readFile(configPath, 'utf-8');
    configOverrides = JSON.parse(rawConfig) as Partial<TelemetrySchemaLintConfig>;
  }

  const flagOverrides: Partial<TelemetrySchemaLintConfig> = {};

  if (options.relaxed) {
    flagOverrides.strictMode = false;
  }

  if (options.noPersist || options.dryRun) {
    flagOverrides.autoPersist = false;
  }

  if (typeof options.maxIssuesPerEvent === 'number' && !Number.isNaN(options.maxIssuesPerEvent)) {
    flagOverrides.maxIssuesPerEvent = options.maxIssuesPerEvent;
  }

  if (typeof options.maxIssuesTotal === 'number' && !Number.isNaN(options.maxIssuesTotal)) {
    flagOverrides.maxIssuesTotal = options.maxIssuesTotal;
  }

  if (options.suggestFixes === false || options.noSuggestFixes) {
    flagOverrides.suggestFixes = false;
  }

  return {
    ...DEFAULT_TELEMETRY_SCHEMA_LINT_CONFIG,
    ...configOverrides,
    ...flagOverrides,
  };
}

function buildMetadata(options: Record<string, any>): TelemetrySchemaLintMetadata | undefined {
  const metadata: TelemetrySchemaLintMetadata = {};
  if (options.source) metadata.source = String(options.source);
  if (options.schemaVersion) metadata.schemaVersion = String(options.schemaVersion);
  if (options.exportId) metadata.exportId = String(options.exportId);

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function formatReport(result: TelemetrySchemaLintResult, format: string): string {
  switch (format) {
    case 'json':
      return formatLintResultAsJson(result);
    case 'markdown':
    default:
      return formatLintResultAsMarkdown(result);
  }
}

async function emitReport(content: string, explicitPath: string | undefined, format: string): Promise<string> {
  const extension = format === 'json' ? 'json' : 'md';
  const targetPath = explicitPath
    ? path.resolve(explicitPath)
    : path.resolve('test-results', `telemetry-schema-lint-${Date.now()}.${extension}`);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, 'utf-8');
  return targetPath;
}

function logSummary(
  result: TelemetrySchemaLintResult,
  outputPath: string,
  durationMs: number,
  pretty: boolean,
): void {
  const summaryLines = [
    pretty ? '════════ Telemetry Schema Lint Summary ════════' : undefined,
    `Total events: ${result.summary.totalEvents}`,
    `Valid events: ${result.summary.validEvents}`,
    `Invalid events: ${result.summary.invalidEvents}`,
    `Issue count: ${result.summary.issueCount}`,
    `Report: ${outputPath}`,
    `Status: ${result.isValid ? 'PASS ✅' : 'FAIL ❌'}`,
    `Duration: ${durationMs.toFixed(2)}ms`,
    pretty ? '══════════════════════════════════════════════' : undefined,
  ].filter(Boolean);

  summaryLines.forEach((line) => console.log(line));
}
