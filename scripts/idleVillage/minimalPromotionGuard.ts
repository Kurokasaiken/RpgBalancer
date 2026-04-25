#!/usr/bin/env tsx

import { exec } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Defines a command executed by the promotion guard.
 */
interface CommandSpec {
  name: string;
  command: string;
}

/**
 * Result returned after executing a safeguard command.
 */
export interface CommandExecutionResult {
  name: string;
  command: string;
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

/**
 * Options used to configure a promotion guard run.
 */
export interface PromotionGuardOptions {
  featureId: string;
  screenshotPath?: string;
  implementedPlanPath: string;
  testResultsDir: string;
  rootDir: string;
  timestamp?: string;
}

/**
 * Structured representation of the guard run output.
 */
export interface PromotionGuardSummary {
  featureId: string;
  timestamp: string;
  logPath: string;
  summaryPath: string;
  screenshot?: {
    source: string;
    copiedPath: string;
  };
  commands: CommandExecutionResult[];
  overallSuccess: boolean;
}

/**
 * Signature for functions used to execute guard commands.
 */
export type CommandRunner = (command: string, name: string) => Promise<CommandExecutionResult>;

const PROMOTION_SECTION_HEADER = '## Promotion Guard Runs';
const PROMOTION_TABLE_MARKER_START = '<!-- PROMOTION_GUARD_TABLE_START -->';
const PROMOTION_TABLE_MARKER_END = '<!-- PROMOTION_GUARD_TABLE_END -->';

const DEFAULT_COMMANDS: CommandSpec[] = [
  { name: 'lint', command: 'npm run lint' },
  { name: 'test', command: 'npm run test' },
  { name: 'build:check', command: 'npm run build:check' },
  { name: 'kanban:lint', command: 'npm run kanban:lint' },
];

/**
 * Creates a sanitized timestamp label for filenames.
 */
function createTimestampLabel(timestamp: string): string {
  return timestamp.replace(/[:.]/g, '-');
}

/**
 * Ensures the test-results directory exists.
 */
function ensureResultsDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

/**
 * Creates the default command runner bound to the repository root.
 */
function createDefaultCommandRunner(rootDir: string): CommandRunner {
  return async (command: string, name: string): Promise<CommandExecutionResult> => {
    const start = Date.now();
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: rootDir, maxBuffer: 1024 * 1024 * 10 });
      return {
        name,
        command,
        success: true,
        stdout,
        stderr,
        exitCode: 0,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string | Buffer; status?: number; code?: number; message?: string };
      return {
        name,
        command,
        success: false,
        stdout: (err.stdout as string) || '',
        stderr: typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString('utf8') ?? err.message ?? ''),
        exitCode: err.status ?? err.code ?? 1,
        durationMs: Date.now() - start,
      };
    }
  };
}

/**
 * Copies an optional screenshot into the evidence directory.
 */
function handleScreenshotCopy(sourcePath: string | undefined, destinationDir: string, logLabel: string): { source: string; copiedPath: string } | undefined {
  if (!sourcePath) {
    return undefined;
  }

  const resolvedSource = resolve(sourcePath);
  if (!existsSync(resolvedSource)) {
    throw new Error(`Screenshot file not found at ${resolvedSource}`);
  }

  const destinationPath = join(destinationDir, `${logLabel}-${basename(resolvedSource)}`);
  copyFileSync(resolvedSource, destinationPath);

  return {
    source: resolvedSource,
    copiedPath: destinationPath,
  };
}

/**
 * Builds the textual log for the guard run.
 */
function buildLogContent(summary: PromotionGuardSummary): string {
  const lines: string[] = [];
  lines.push(`Promotion Guard Run - Feature ${summary.featureId}`);
  lines.push(`Timestamp: ${summary.timestamp}`);
  lines.push(`Overall Success: ${summary.overallSuccess}`);
  lines.push('='.repeat(80));

  summary.commands.forEach((command) => {
    lines.push(`Command: ${command.name} (${command.command})`);
    lines.push(`Success: ${command.success}`);
    lines.push(`Exit Code: ${command.exitCode}`);
    lines.push(`Duration: ${command.durationMs}ms`);
    lines.push('--- STDOUT ---');
    lines.push(command.stdout || '(empty)');
    lines.push('--- STDERR ---');
    lines.push(command.stderr || '(empty)');
    lines.push('='.repeat(80));
  });

  if (summary.screenshot) {
    lines.push(`Screenshot Source: ${summary.screenshot.source}`);
    lines.push(`Screenshot Copied To: ${summary.screenshot.copiedPath}`);
    lines.push('='.repeat(80));
  }

  lines.push(`Documentation updated: ${PROMOTION_SECTION_HEADER}`);
  lines.push(`Log stored at: ${summary.logPath}`);
  lines.push(`JSON summary stored at: ${summary.summaryPath}`);
  return lines.join('\n');
}

/**
 * Persists the JSON summary to disk.
 */
function writeJsonSummary(summary: PromotionGuardSummary): void {
  writeFileSync(summary.summaryPath, JSON.stringify(summary, null, 2), 'utf8');
}

/**
 * Ensures the Promotion Guard section exists within IMPLEMENTED_PLAN.md.
 */
function ensurePromotionSection(content: string): string {
  if (content.includes(PROMOTION_TABLE_MARKER_START) && content.includes(PROMOTION_TABLE_MARKER_END)) {
    return content;
  }

  const section = [
    '',
    PROMOTION_SECTION_HEADER,
    '',
    'Runs are captured via `npm run component-lab:promote -- --featureId=<id>` and logged automatically.',
    PROMOTION_TABLE_MARKER_START,
    '| Feature ID | Date | Evidence Log |',
    '| --- | --- | --- |',
    PROMOTION_TABLE_MARKER_END,
    '',
  ].join('\n');

  return `${content.trimEnd()}\n\n${section}\n`;
}

/**
 * Inserts a new Promotion Guard row if it is not already present.
 */
function insertPromotionRow(content: string, row: string): string {
  const startIndex = content.indexOf(PROMOTION_TABLE_MARKER_START);
  const endIndex = content.indexOf(PROMOTION_TABLE_MARKER_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return content;
  }

  const before = content.slice(0, endIndex).trimEnd();
  const after = content.slice(endIndex);

  if (before.includes(row)) {
    return content;
  }

  return `${before}\n${row}\n${after}`;
}

/**
 * Updates IMPLEMENTED_PLAN.md with the latest Promotion Guard run.
 */
function updateImplementedPlanDoc(implementedPlanPath: string, row: string): void {
  if (!existsSync(implementedPlanPath)) {
    throw new Error(`IMPLEMENTED_PLAN file not found at ${implementedPlanPath}`);
  }

  const content = readFileSync(implementedPlanPath, 'utf8');
  const ensured = ensurePromotionSection(content);
  const updatedContent = insertPromotionRow(ensured, row);
  writeFileSync(implementedPlanPath, updatedContent, 'utf8');
}

/**
 * Runs the Promotion Guard workflow.
 */
export async function runPromotionGuard(
  options: PromotionGuardOptions,
  commandRunner: CommandRunner = createDefaultCommandRunner(options.rootDir)
): Promise<PromotionGuardSummary> {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const timestampLabel = createTimestampLabel(timestamp);
  ensureResultsDir(options.testResultsDir);

  const logFileName = `minimal-vertical-slice-${options.featureId}-${timestampLabel}.log`;
  const summaryFileName = `minimal-vertical-slice-${options.featureId}-${timestampLabel}.json`;
  const logPath = join(options.testResultsDir, logFileName);
  const summaryPath = join(options.testResultsDir, summaryFileName);

  const commands: CommandExecutionResult[] = [];
  for (const spec of DEFAULT_COMMANDS) {
    const result = await commandRunner(spec.command, spec.name);
    commands.push(result);
    if (!result.success) {
      break;
    }
  }

  const screenshot = handleScreenshotCopy(options.screenshotPath, options.testResultsDir, `evidence-${timestampLabel}`);
  const overallSuccess = commands.every((command) => command.success);

  const summary: PromotionGuardSummary = {
    featureId: options.featureId,
    timestamp,
    logPath,
    summaryPath,
    screenshot,
    commands,
    overallSuccess,
  };

  writeFileSync(logPath, buildLogContent(summary), 'utf8');
  writeJsonSummary(summary);

  if (overallSuccess) {
    const relativeLogPath = relative(options.rootDir, logPath).replace(/\\/g, '/');
    const row = `| ${options.featureId} | ${timestamp} | ${relativeLogPath} |`;
    updateImplementedPlanDoc(options.implementedPlanPath, row);
  }

  return summary;
}

/**
 * Parses CLI arguments.
 */
function parseCliArgs(argv: string[], rootDir: string): PromotionGuardOptions {
  const args = argv.slice(2);
  const featureArg = args.find((arg) => arg.startsWith('--featureId='));
  if (!featureArg) {
    throw new Error('Missing required --featureId argument');
  }

  const featureId = featureArg.split('=')[1];
  if (!featureId) {
    throw new Error('FeatureId must not be empty');
  }

  const screenshotArg = args.find((arg) => arg.startsWith('--screenshot='));
  const implementedPlanArg = args.find((arg) => arg.startsWith('--docPath='));
  const resultsDirArg = args.find((arg) => arg.startsWith('--resultsDir='));

  return {
    featureId,
    screenshotPath: screenshotArg ? screenshotArg.split('=')[1] : undefined,
    implementedPlanPath: implementedPlanArg
      ? resolve(rootDir, implementedPlanArg.split('=')[1])
      : resolve(rootDir, 'src/docs/docs/IMPLEMENTED_PLAN.md'),
    testResultsDir: resultsDirArg
      ? resolve(rootDir, resultsDirArg.split('=')[1])
      : resolve(rootDir, 'test-results'),
    rootDir,
  };
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const options = parseCliArgs(process.argv, rootDir);
  const summary = await runPromotionGuard(options);

  if (!summary.overallSuccess) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Promotion Guard failed:', error);
    process.exit(1);
  });
}

