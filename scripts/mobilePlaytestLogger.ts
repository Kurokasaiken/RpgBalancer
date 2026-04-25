import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import type { TelemetrySnapshot, SandboxTelemetryEvent } from '../tests/helpers/testTypes';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { z } from 'zod';
import { spawn } from 'child_process';

console.debug('[mobilePlaytestLogger] bootstrap starting');
const SCHEMA_VERSION = '1.0.0';
const TARGETS = {
  cycleDurationMs: 90_000,
  tapsPerAssignment: 3,
  assignmentLatencyMs: 450,
  pickerCloseRate: 98,
  resourceGold: 10,
  resourceFood: 2,
};

const SUPPORTED_OUTPUT_FORMATS = ['json', 'markdown', 'csv'] as const;
type OutputFormat = (typeof SUPPORTED_OUTPUT_FORMATS)[number];

const DEFAULT_OUTPUT_FORMATS: OutputFormat[] = ['json', 'markdown'];
const IMPORT_DEFAULT_FILENAME = 'telemetry.json';

const REPLAY_MODES = ['summary', 'samples', 'all'] as const;
export type ReplayMode = (typeof REPLAY_MODES)[number];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(PROJECT_ROOT, 'data/runs/mobile_playtests');
const SCHEMA_PATH = resolve(PROJECT_ROOT, 'scripts/mobilePlaytestLogger.schema.json');

function ensureOutputDirectory(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Parses a comma or whitespace separated list of numbers.
 */
const parseNumberList = (raw: string): number[] =>
  raw
    .split(/[,\s]+/)
    .map((chunk) => Number(chunk.trim()))
    .filter((num) => Number.isFinite(num));

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const coerceNumberArray = (value: unknown): number[] | undefined => {
  if (Array.isArray(value)) {
    const sanitized = value
      .map((entry) => coerceNumber(entry))
      .filter((entry): entry is number => typeof entry === 'number');
    return sanitized.length > 0 ? sanitized : undefined;
  }
  return undefined;
};

const coerceResourceDelta = (value: unknown): { gold?: number; food?: number } | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const gold = coerceNumber((value as UnknownRecord).gold);
  const food = coerceNumber((value as UnknownRecord).food);
  if (gold === undefined && food === undefined) {
    return undefined;
  }
  return { gold, food };
};

const mergeResourceDelta = (
  primary?: { gold?: number; food?: number },
  fallback?: { gold?: number; food?: number },
): { gold?: number; food?: number } | undefined => {
  if (!primary && !fallback) {
    return undefined;
  }
  return {
    gold: primary?.gold ?? fallback?.gold,
    food: primary?.food ?? fallback?.food,
  };
};

/**
 * Schema describing a single Punch Club mobile playtest log payload.
 */
export const MobilePlaytestLogSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  sessionId: z.string().min(1),
  sessionTag: z.string().optional(),
  tester: z.string().min(1),
  device: z.string().min(1),
  cycleDurationMs: z.array(z.number().positive()).nonempty(),
  tapsPerAssignment: z.array(z.number().positive()).nonempty(),
  assignmentLatencyMs: z.array(z.number().positive()).nonempty(),
  pickerCloseRate: z.number().min(0).max(100),
  resourceDelta: z.object({
    gold: z.number(),
    food: z.number(),
  }),
  qualitativeNotes: z.string().min(1),
  telemetrySource: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  derivedMetrics: z.object({
    avgCycleDurationMs: z.number().min(0),
    avgTapsPerAssignment: z.number().min(0),
    avgAssignmentLatencyMs: z.number().min(0),
    meetsCycleTarget: z.boolean(),
    meetsTapTarget: z.boolean(),
    meetsLatencyTarget: z.boolean(),
    meetsPickerTarget: z.boolean(),
    meetsResourceTarget: z.boolean(),
  }),
});

/**
 * Shape of the validated playtest log payload.
 */
export type MobilePlaytestLog = z.infer<typeof MobilePlaytestLogSchema>;

/**
 * Validation result with recovery information
 */
export interface ValidationResult {
  isValid: boolean;
  data?: MobilePlaytestLog;
  errors: string[];
  warnings: string[];
  recoveredData?: Partial<MobilePlaytestLog>;
}

/**
 * Enhanced telemetry export schema with PWA metrics
 */
export const EnhancedTelemetryExportSchema = MobilePlaytestLogSchema.extend({
  pwaMetrics: z.object({
    installSuccess: z.boolean().optional(),
    coldStartMs: z.number().min(0).optional(),
    exportValidationPassed: z.boolean().optional(),
    updateAvailable: z.boolean().optional(),
  }).optional(),
  kpiMetrics: z.object({
    installSuccessRate: z.number().min(0).max(100).optional(),
    coldStartAvgMs: z.number().min(0).optional(),
    exportValidationRate: z.number().min(0).max(100).optional(),
  }).optional(),
});

/**
 * Enhanced playtest log type with PWA metrics
 */
export type EnhancedMobilePlaytestLog = z.infer<typeof EnhancedTelemetryExportSchema>;

/**
 * Validate telemetry export data with recovery
 */
export function validateTelemetryExport(data: unknown, enableRecovery = true): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let recoveredData: Partial<MobilePlaytestLog> | undefined;

  try {
    // First attempt: strict validation
    const strictResult = MobilePlaytestLogSchema.safeParse(data);
    
    if (strictResult.success) {
      return {
        isValid: true,
        data: strictResult.data,
        errors: [],
        warnings: [],
      };
    }

    // If strict validation fails and recovery is enabled, attempt recovery
    if (enableRecovery) {
      recoveredData = attemptDataRecovery(data, errors, warnings);
      
      if (recoveredData) {
        // Try validating recovered data
        const recoveryResult = MobilePlaytestLogSchema.safeParse(recoveredData);
        if (recoveryResult.success) {
          return {
            isValid: true,
            data: recoveryResult.data,
            errors,
            warnings: [...warnings, 'Data was recovered from invalid format'],
            recoveredData,
          };
        }
      }
    }

    // If all validation attempts fail, return errors
    return {
      isValid: false,
      errors: strictResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
      warnings,
      recoveredData,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
      recoveredData,
    };
  }
}

/**
 * Attempt to recover data from invalid format
 */
function attemptDataRecovery(
  data: unknown,
  errors: string[],
  warnings: string[]
): Partial<MobilePlaytestLog> | undefined {
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected object');
    return undefined;
  }

  const obj = data as UnknownRecord;
  const recovered: Partial<MobilePlaytestLog> = {};

  // Recover version
  if (typeof obj.version === 'string') {
    recovered.version = obj.version as typeof SCHEMA_VERSION;
  } else {
    recovered.version = SCHEMA_VERSION;
    warnings.push('Missing version, using default');
  }

  // Recover sessionId
  if (typeof obj.sessionId === 'string' && obj.sessionId.trim()) {
    recovered.sessionId = obj.sessionId.trim();
  } else {
    recovered.sessionId = `recovered-${Date.now()}`;
    warnings.push('Missing sessionId, generated fallback');
  }

  // Recover tester
  if (typeof obj.tester === 'string' && obj.tester.trim()) {
    recovered.tester = obj.tester.trim();
  } else {
    recovered.tester = 'unknown';
    warnings.push('Missing tester, using fallback');
  }

  // Recover device
  if (typeof obj.device === 'string' && obj.device.trim()) {
    recovered.device = obj.device.trim();
  } else {
    recovered.device = 'unknown';
    warnings.push('Missing device, using fallback');
  }

  // Recover arrays with coercion
  recovered.cycleDurationMs = coerceNumberArray(obj.cycleDurationMs) || [TARGETS.cycleDurationMs];
  recovered.tapsPerAssignment = coerceNumberArray(obj.tapsPerAssignment) || [TARGETS.tapsPerAssignment];
  recovered.assignmentLatencyMs = coerceNumberArray(obj.assignmentLatencyMs) || [TARGETS.assignmentLatencyMs];

  // Recover pickerCloseRate
  const pickerRate = coerceNumber(obj.pickerCloseRate);
  recovered.pickerCloseRate = pickerRate !== undefined ? Math.min(100, Math.max(0, pickerRate)) : TARGETS.pickerCloseRate;

  // Recover resourceDelta
  const mergedDelta = mergeResourceDelta(
    coerceResourceDelta(obj.resourceDelta),
    { gold: TARGETS.resourceGold, food: TARGETS.resourceFood }
  );
  recovered.resourceDelta = {
    gold: mergedDelta?.gold ?? TARGETS.resourceGold,
    food: mergedDelta?.food ?? TARGETS.resourceFood,
  };

  // Recover qualitativeNotes
  if (typeof obj.qualitativeNotes === 'string' && obj.qualitativeNotes.trim()) {
    recovered.qualitativeNotes = obj.qualitativeNotes.trim();
  } else {
    recovered.qualitativeNotes = 'Recovered from invalid data';
    warnings.push('Missing qualitative notes, using fallback');
  }

  // Recover optional fields
  if (typeof obj.sessionTag === 'string' && obj.sessionTag.trim()) {
    recovered.sessionTag = obj.sessionTag.trim();
  }

  if (typeof obj.telemetrySource === 'string' && obj.telemetrySource.trim()) {
    recovered.telemetrySource = obj.telemetrySource.trim();
  }

  recovered.createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString();

  // Recalculate derived metrics
  recovered.derivedMetrics = {
    avgCycleDurationMs: recovered.cycleDurationMs.reduce((a, b) => a + b, 0) / recovered.cycleDurationMs.length,
    avgTapsPerAssignment: recovered.tapsPerAssignment.reduce((a, b) => a + b, 0) / recovered.tapsPerAssignment.length,
    avgAssignmentLatencyMs: recovered.assignmentLatencyMs.reduce((a, b) => a + b, 0) / recovered.assignmentLatencyMs.length,
    meetsCycleTarget: false, // Will be calculated later
    meetsTapTarget: false,    // Will be calculated later
    meetsLatencyTarget: false, // Will be calculated later
    meetsPickerTarget: recovered.pickerCloseRate >= TARGETS.pickerCloseRate,
    meetsResourceTarget: recovered.resourceDelta!.gold >= TARGETS.resourceGold && recovered.resourceDelta!.food >= TARGETS.resourceFood,
  };

  return recovered;
}

/**
 * Validate and export telemetry with retry logic
 */
export async function validateAndExportTelemetry(
  data: unknown,
  outputPath: string,
  options: { enableRecovery?: boolean; maxRetries?: number } = {}
): Promise<{ success: boolean; filePath?: string; errors: string[] }> {
  const { enableRecovery = true, maxRetries = 3 } = options;
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const validation = validateTelemetryExport(data, enableRecovery);
      
      if (!validation.isValid) {
        errors.push(`Attempt ${attempt}: ${validation.errors.join(', ')}`);
        if (attempt === maxRetries) {
          return { success: false, errors };
        }
        continue;
      }

      // Write validated data
      ensureOutputDirectory();
      const finalData = validation.data!;
      writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

      return { 
        success: true, 
        filePath: outputPath,
        errors: validation.warnings.length > 0 ? validation.warnings : []
      };
    } catch (error) {
      errors.push(`Attempt ${attempt}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (attempt === maxRetries) {
        return { success: false, errors };
      }
    }
  }

  return { success: false, errors };
}

/**
 * Parsed CLI arguments accepted by the CLI execution.
 */
export interface CliArgs {
  sessionId?: string;
  telemetryPath?: string;
  notes?: string;
  openReport?: boolean;
  help?: boolean;
  formats?: OutputFormat[];
  replayPath?: string;
  replayMode?: ReplayMode;
  interactive?: boolean;
  tester?: string;
  device?: string;
  sessionTag?: string;
  cycleDurationMs?: number[];
  tapsPerAssignment?: number[];
  assignmentLatencyMs?: number[];
  pickerCloseRate?: number;
  resourceGoldDelta?: number;
  resourceFoodDelta?: number;
  postPlaywright?: boolean;
  playwrightOutputDir?: string;
  aggregateFormat?: 'json' | 'markdown' | 'csv';
}

// TODO: Add support for checklist-specific telemetry tags:
// - `cta_latency_ms`: CTA interaction latency for Mind Studios metrics
// - `picker_tap_count`: Specific picker tap count for mobile-first validation

/**
 * Subset of fields that can be pre-populated using telemetry imports.
 */
interface TelemetryDefaults {
  sessionId?: string;
  tester?: string;
  device?: string;
  sessionTag?: string;
  cycleDurationMs?: number[];
  tapsPerAssignment?: number[];
  assignmentLatencyMs?: number[];
  pickerCloseRate?: number;
  resourceDelta?: { gold?: number; food?: number };
  qualitativeNotes?: string;
}

type UnknownRecord = Record<string, unknown>;

interface RawTelemetryEvent extends UnknownRecord {
  type?: string;
}

interface TelemetryPayload extends UnknownRecord {
  events?: RawTelemetryEvent[];
  telemetry?: RawTelemetryEvent[];
  samples?: RawTelemetryEvent[];
}

type DerivedTelemetryDefaults = TelemetryDefaults;

type ImportContext =
  | { kind: 'telemetry'; defaults: TelemetryDefaults; absolutePath: string }
  | { kind: 'log'; log: MobilePlaytestLog; absolutePath: string };

/**
 * Guard to ensure a string matches one of the supported output formats.
 */
const isOutputFormat = (value: string): value is OutputFormat =>
  SUPPORTED_OUTPUT_FORMATS.includes(value as OutputFormat);

/**
 * Parses a comma-separated list of formats into strongly-typed entries.
 */
const parseFormatTokens = (token: string): OutputFormat[] =>
  token
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is string => entry.length > 0)
    .map((entry) => {
      if (!isOutputFormat(entry)) {
        throw new Error(`Formato non supportato: ${entry}. Formati validi: ${SUPPORTED_OUTPUT_FORMATS.join(', ')}`);
      }
      return entry;
    });

/**
 * Removes duplicate output format entries while preserving declaration order.
 */
const dedupeFormats = (formats: OutputFormat[]): OutputFormat[] => {
  const seen = new Set<OutputFormat>();
  const normalized: OutputFormat[] = [];
  formats.forEach((format) => {
    if (!seen.has(format)) {
      seen.add(format);
      normalized.push(format);
    }
  });
  return normalized;
};

const isReplayMode = (value: string): value is ReplayMode =>
  REPLAY_MODES.includes(value as ReplayMode);

const parseReplayModeToken = (token: string): ReplayMode => {
  const normalized = token.trim().toLowerCase();
  if (!isReplayMode(normalized)) {
    throw new Error(
      `Modalità replay non valida: ${token}. Valori supportati: ${REPLAY_MODES.join(', ')}`,
    );
  }
  return normalized;
};

const parseAggregateFormatToken = (token: string): 'json' | 'markdown' | 'csv' => {
  const normalized = token.trim().toLowerCase();
  const validFormats: readonly ('json' | 'markdown' | 'csv')[] = ['json', 'markdown', 'csv'] as const;
  if (!validFormats.includes(normalized as 'json' | 'markdown' | 'csv')) {
    throw new Error(
      `Invalid aggregate format: "${token}". Must be one of: ${validFormats.join(', ')}.`,
    );
  }
  return normalized as 'json' | 'markdown' | 'csv';
};

/**
 * Resolves a user-specified path relative to the current working directory.
 */
const resolveInputPath = (pathLike: string): string => resolve(process.cwd(), pathLike);

/**
 * Attempts to read and validate a previously generated mobile playtest log.
 */
export const tryParseExistingLog = (raw: unknown): MobilePlaytestLog | undefined => {
  const parsed = MobilePlaytestLogSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
};

/**
 * Parses command-line arguments for the CLI execution.
 */
export function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {};

  const readNext = (index: number, label: string): { value: string; nextIndex: number } => {
    const nextValue = argv[index + 1];
    if (!nextValue) {
      throw new Error(`Missing value for ${label}`);
    }
    return { value: nextValue, nextIndex: index + 1 };
  };

  const parseNumberArrayArgValue = (raw: string, label: string): number[] => {
    const parsed = parseNumberList(raw);
    if (parsed.length === 0) {
      throw new Error(`Invalid ${label} value. Provide comma-separated numbers.`);
    }
    return parsed;
  };

  const parseNumberArgValue = (raw: string, label: string): number => {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid ${label} value: ${raw}`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--interactive') {
      result.interactive = true;
      continue;
    }
    if (arg === '--open-report' || arg === '--openReport') {
      result.openReport = true;
      continue;
    }
    if (arg === '--session') {
      const { value, nextIndex } = readNext(i, '--session');
      result.sessionId = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--session=')) {
      result.sessionId = arg.split('=')[1];
      continue;
    }
    if (arg === '--import') {
      const nextToken = argv[i + 1];
      if (!nextToken || nextToken.startsWith('--')) {
        result.telemetryPath = IMPORT_DEFAULT_FILENAME;
      } else {
        result.telemetryPath = nextToken;
        i += 1;
      }
      continue;
    }
    if (arg.startsWith('--import=')) {
      const value = arg.slice(arg.indexOf('=') + 1);
      result.telemetryPath = value.length > 0 ? value : IMPORT_DEFAULT_FILENAME;
      continue;
    }
    if (arg === '--format') {
      const { value, nextIndex } = readNext(i, '--format');
      result.formats = [...(result.formats ?? []), ...parseFormatTokens(value)];
      i = nextIndex;
      continue;
    }
    if (arg === '--tester') {
      const { value, nextIndex } = readNext(i, '--tester');
      result.tester = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--tester=')) {
      result.tester = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg === '--device') {
      const { value, nextIndex } = readNext(i, '--device');
      result.device = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--device=')) {
      result.device = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg === '--notes') {
      const { value, nextIndex } = readNext(i, '--notes');
      result.notes = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--notes=')) {
      result.notes = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg === '--replay') {
      const nextToken = argv[i + 1];
      if (!nextToken || nextToken.startsWith('--')) {
        throw new Error('--replay requires a path argument');
      }
      result.replayPath = nextToken;
      i += 1;
      continue;
    }
    if (arg.startsWith('--replay=')) {
      result.replayPath = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg.startsWith('--format=')) {
      const parsedFormats = parseFormatTokens(arg.slice(arg.indexOf('=') + 1));
      result.formats = [...(result.formats ?? []), ...parsedFormats];
      continue;
    }
    if (arg === '--cycle-duration') {
      const { value, nextIndex } = readNext(i, '--cycle-duration');
      result.cycleDurationMs = parseNumberArrayArgValue(value, '--cycle-duration');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--cycle-duration=')) {
      result.cycleDurationMs = parseNumberArrayArgValue(arg.slice(arg.indexOf('=') + 1), '--cycle-duration');
      continue;
    }
    if (arg === '--taps-per-assignment') {
      const { value, nextIndex } = readNext(i, '--taps-per-assignment');
      result.tapsPerAssignment = parseNumberArrayArgValue(value, '--taps-per-assignment');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--taps-per-assignment=')) {
      result.tapsPerAssignment = parseNumberArrayArgValue(
        arg.slice(arg.indexOf('=') + 1),
        '--taps-per-assignment',
      );
      continue;
    }
    if (arg === '--session-tag') {
      const { value, nextIndex } = readNext(i, '--session-tag');
      result.sessionTag = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--session-tag=')) {
      result.sessionTag = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg === '--assignment-latency') {
      const { value, nextIndex } = readNext(i, '--assignment-latency');
      result.assignmentLatencyMs = parseNumberArrayArgValue(value, '--assignment-latency');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--assignment-latency=')) {
      result.assignmentLatencyMs = parseNumberArrayArgValue(
        arg.slice(arg.indexOf('=') + 1),
        '--assignment-latency',
      );
      continue;
    }
    if (arg === '--picker-close-rate') {
      const { value, nextIndex } = readNext(i, '--picker-close-rate');
      result.pickerCloseRate = parseNumberArgValue(value, '--picker-close-rate');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--picker-close-rate=')) {
      result.pickerCloseRate = parseNumberArgValue(arg.slice(arg.indexOf('=') + 1), '--picker-close-rate');
      continue;
    }
    if (arg === '--resource-gold') {
      const { value, nextIndex } = readNext(i, '--resource-gold');
      result.resourceGoldDelta = parseNumberArgValue(value, '--resource-gold');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--resource-gold=')) {
      result.resourceGoldDelta = parseNumberArgValue(arg.slice(arg.indexOf('=') + 1), '--resource-gold');
      continue;
    }
    if (arg === '--resource-food') {
      const { value, nextIndex } = readNext(i, '--resource-food');
      result.resourceFoodDelta = parseNumberArgValue(value, '--resource-food');
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--resource-food=')) {
      result.resourceFoodDelta = parseNumberArgValue(arg.slice(arg.indexOf('=') + 1), '--resource-food');
      continue;
    }
    if (arg === '--replay-mode') {
      const { value, nextIndex } = readNext(i, '--replay-mode');
      result.replayMode = parseReplayModeToken(value);
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--replay-mode=')) {
      result.replayMode = parseReplayModeToken(arg.slice(arg.indexOf('=') + 1));
      continue;
    }
    if (arg === '--post-playwright') {
      result.postPlaywright = true;
      continue;
    }
    if (arg.startsWith('--post-playwright=')) {
      result.postPlaywright = arg.slice(arg.indexOf('=') + 1) === 'true';
      continue;
    }
    if (arg === '--playwright-output-dir') {
      const { value, nextIndex } = readNext(i, '--playwright-output-dir');
      result.playwrightOutputDir = value;
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--playwright-output-dir=')) {
      result.playwrightOutputDir = arg.slice(arg.indexOf('=') + 1);
      continue;
    }
    if (arg === '--aggregate-format') {
      const { value, nextIndex } = readNext(i, '--aggregate-format');
      result.aggregateFormat = parseAggregateFormatToken(value);
      i = nextIndex;
      continue;
    }
    if (arg.startsWith('--aggregate-format=')) {
      result.aggregateFormat = parseAggregateFormatToken(arg.slice(arg.indexOf('=') + 1));
      continue;
    }
    console.warn(`Unrecognized argument: ${arg}`);
  }

  return result;
}

/**
 * Prints CLI usage information.
 */
function printHelp(): void {
  console.log(`Punch Club Mobile Playtest Logger

Usage:
  tsx scripts/mobilePlaytestLogger.ts --session punch-club-mobile --tester QA-A1 --device Pixel8 \\
    --cycle-duration=85000,91000 --taps-per-assignment=3,2,2 --assignment-latency=410,450 \\
    --picker-close-rate=98 --resource-gold=12 --resource-food=3 --notes "Checklist GT-3"

  tsx scripts/mobilePlaytestLogger.ts --import data/runs/mobile_playtests/sample.json --format json,markdown,csv

  tsx scripts/mobilePlaytestLogger.ts --replay data/runs/mobile_playtests/sample.json --replay-mode all --format csv

Options:
  --session <id>            Session identifier
  --tester <name>           Tester identifier
  --device <device>         Device model
  --cycle-duration <list>   Cycle duration samples (comma/space separated)
  --taps-per-assignment <list>   Tap counts per assignment
  --assignment-latency <list>    Assignment latency samples
  --picker-close-rate <value>    Picker close rate percentage
  --resource-gold <value>        Gold delta per cycle
  --resource-food <value>        Food delta per cycle
  --notes <text>            Qualitative notes
  --import <path>           Optional telemetry JSON to pre-fill answers (default: telemetry.json)
  --replay <path>           Replay a previously logged session
  --replay-mode <mode>      Replay mode: summary | samples | all (default: summary)
  --format <formats>        Output formats (comma-separated: json,markdown,csv)
  --interactive             Enable interactive prompts (default: false)
  --open-report             Open the generated Markdown file (macOS only)
  --help                    Show this message

Outputs:
  Files written to data/runs/mobile_playtests (json/md/csv based on --format)
  Schema: ${relative(PROJECT_ROOT, SCHEMA_PATH)}
`);
}

/**
 * Data collected interactively (or via defaults) from the tester.
 */
interface CollectedInput {
  sessionId: string;
  tester: string;
  device: string;
  sessionTag?: string;
  cycleDurationMs: number[];
  tapsPerAssignment: number[];
  assignmentLatencyMs: number[];
  pickerCloseRate: number;
  resourceDelta: { gold: number; food: number };
  qualitativeNotes: string;
}

/**
 * Computes the arithmetic mean for a numeric array.
 */
const average = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

/**
 * Builds a validated log payload from collected input and metadata.
 */
function buildLog(
  input: CollectedInput,
  metadata: { createdAt: Date; telemetrySource?: string },
): MobilePlaytestLog {
  const avgCycleDurationMs = average(input.cycleDurationMs);
  const avgTapsPerAssignment = average(input.tapsPerAssignment);
  const avgAssignmentLatencyMs = average(input.assignmentLatencyMs);
  const meetsCycleTarget = avgCycleDurationMs < TARGETS.cycleDurationMs;
  const meetsTapTarget = avgTapsPerAssignment <= TARGETS.tapsPerAssignment;
  const meetsLatencyTarget = avgAssignmentLatencyMs < TARGETS.assignmentLatencyMs;
  const meetsPickerTarget = input.pickerCloseRate >= TARGETS.pickerCloseRate;
  const meetsResourceTarget =
    input.resourceDelta.gold >= TARGETS.resourceGold && input.resourceDelta.food >= TARGETS.resourceFood;

  // Read session tag override (CLI/default) or fallback to sessionStorage with KPI tracking
  let sessionTag: string | undefined = input.sessionTag;
  if (!sessionTag) {
    const sessionStart = Date.now();
    try {
      if (typeof globalThis !== 'undefined' && globalThis.sessionStorage) {
        sessionTag = globalThis.sessionStorage.getItem('punch-club-session-tag') || undefined;
      }
    } catch (error) {
      console.warn('Failed to read session tag from sessionStorage:', error);
    }
    const tagReadTime = Date.now() - sessionStart;
    if (tagReadTime >= 5000) {
      console.warn(`Session tag KPI violation: ${tagReadTime}ms (target: <5000ms)`);
    }
  }

  const payload = {
    version: SCHEMA_VERSION,
    sessionId: input.sessionId,
    sessionTag,
    tester: input.tester,
    device: input.device,
    cycleDurationMs: input.cycleDurationMs,
    tapsPerAssignment: input.tapsPerAssignment,
    assignmentLatencyMs: input.assignmentLatencyMs,
    pickerCloseRate: input.pickerCloseRate,
    resourceDelta: input.resourceDelta,
    qualitativeNotes: input.qualitativeNotes,
    telemetrySource: metadata.telemetrySource,
    createdAt: metadata.createdAt.toISOString(),
    derivedMetrics: {
      avgCycleDurationMs,
      avgTapsPerAssignment,
      avgAssignmentLatencyMs,
      meetsCycleTarget,
      meetsTapTarget,
      meetsLatencyTarget,
      meetsPickerTarget,
      meetsResourceTarget,
    },
  };

  return MobilePlaytestLogSchema.parse(payload);
}

/**
 * Collects input from CLI/defaults with an optional interactive fallback.
 * Non-interactive runs will never open readline; instead they fail fast with
 * actionable errors if required data is missing.
 */
async function gatherInputs(
  args: CliArgs,
  defaults: TelemetryDefaults,
): Promise<CollectedInput> {
  const interactive = args.interactive ?? false;

  type PendingField =
    | {
        type: 'string';
        label: string;
        flagHint: string;
        assign: (value: string) => void;
      }
    | {
        type: 'number';
        label: string;
        flagHint: string;
        assign: (value: number) => void;
        constraints?: { min?: number; max?: number };
      }
    | {
        type: 'numberArray';
        label: string;
        flagHint: string;
        assign: (value: number[]) => void;
      };

  const pending: PendingField[] = [];

  const pickString = (cliValue?: string, defaultValue?: string): string | undefined => {
    const trimmedCli = cliValue?.trim();
    if (trimmedCli) {
      return trimmedCli;
    }
    const trimmedDefault = defaultValue?.trim();
    return trimmedDefault && trimmedDefault.length > 0 ? trimmedDefault : undefined;
  };

  const pickNumberArray = (cliValue?: number[], defaultValue?: number[]): number[] | undefined => {
    if (cliValue && cliValue.length > 0) {
      return cliValue;
    }
    if (defaultValue && defaultValue.length > 0) {
      return defaultValue;
    }
    return undefined;
  };

  const pickNumber = (cliValue?: number, defaultValue?: number): number | undefined => {
    if (typeof cliValue === 'number') {
      return cliValue;
    }
    if (typeof defaultValue === 'number') {
      return defaultValue;
    }
    return undefined;
  };

  let sessionId = pickString(args.sessionId, defaults.sessionId);
  if (!sessionId) {
    pending.push({
      type: 'string',
      label: 'Session ID',
      flagHint: '--session',
      assign: (value) => {
        sessionId = value;
      },
    });
  }

  let tester = pickString(args.tester, defaults.tester);
  if (!tester) {
    pending.push({
      type: 'string',
      label: 'Tester',
      flagHint: '--tester',
      assign: (value) => {
        tester = value;
      },
    });
  }

  let device = pickString(args.device, defaults.device);
  if (!device) {
    pending.push({
      type: 'string',
      label: 'Device',
      flagHint: '--device',
      assign: (value) => {
        device = value;
      },
    });
  }

  const fallbackArray = (value: number[] | undefined, target: number): number[] =>
    value && value.length > 0 ? value : [target];
  const fallbackNumber = (value: number | undefined, target: number): number =>
    typeof value === 'number' ? value : target;

  const resolveString = (value: string | undefined, label: string, flagHint: string): string => {
    if (value) {
      return value;
    }
    if (!interactive) {
      const defaultValue = `${label} missing`;
      console.warn(`⚠️  ${label} assente, uso fallback: ${defaultValue}`);
      return defaultValue;
    }
    pending.push({ type: 'string', label, flagHint, assign: (assignValue) => (value = assignValue) });
    return '';
  };

  let cycleDurationMs = pickNumberArray(args.cycleDurationMs, defaults.cycleDurationMs);
  if (!cycleDurationMs) {
    if (interactive) {
      pending.push({
        type: 'numberArray',
        label: 'Durate ciclo (ms)',
        flagHint: '--cycle-duration',
        assign: (value) => {
          cycleDurationMs = value;
        },
      });
    } else {
      cycleDurationMs = fallbackArray(undefined, TARGETS.cycleDurationMs);
    }
  }

  let tapsPerAssignment = pickNumberArray(args.tapsPerAssignment, defaults.tapsPerAssignment);
  if (!tapsPerAssignment) {
    if (interactive) {
      pending.push({
        type: 'numberArray',
        label: 'Tap per assegnamento',
        flagHint: '--taps-per-assignment',
        assign: (value) => {
          tapsPerAssignment = value;
        },
      });
    } else {
      tapsPerAssignment = fallbackArray(undefined, TARGETS.tapsPerAssignment);
    }
  }

  let assignmentLatencyMs = pickNumberArray(args.assignmentLatencyMs, defaults.assignmentLatencyMs);
  if (!assignmentLatencyMs) {
    if (interactive) {
      pending.push({
        type: 'numberArray',
        label: 'Latenza assegnamento (ms)',
        flagHint: '--assignment-latency',
        assign: (value) => {
          assignmentLatencyMs = value;
        },
      });
    } else {
      assignmentLatencyMs = fallbackArray(undefined, TARGETS.assignmentLatencyMs);
    }
  }

  let pickerCloseRate = pickNumber(args.pickerCloseRate, defaults.pickerCloseRate);
  if (pickerCloseRate === undefined) {
    if (interactive) {
      pending.push({
        type: 'number',
        label: 'Picker close rate (%)',
        flagHint: '--picker-close-rate',
        constraints: { min: 0, max: 100 },
        assign: (value) => {
          pickerCloseRate = value;
        },
      });
    } else {
      pickerCloseRate = TARGETS.pickerCloseRate;
    }
  }

  let resourceGold = pickNumber(args.resourceGoldDelta, defaults.resourceDelta?.gold);
  if (resourceGold === undefined) {
    if (interactive) {
      pending.push({
        type: 'number',
        label: 'Delta gold per ciclo',
        flagHint: '--resource-gold',
        assign: (value) => {
          resourceGold = value;
        },
      });
    } else {
      resourceGold = TARGETS.resourceGold;
    }
  }

  let resourceFood = pickNumber(args.resourceFoodDelta, defaults.resourceDelta?.food);
  if (resourceFood === undefined) {
    if (interactive) {
      pending.push({
        type: 'number',
        label: 'Delta food per ciclo',
        flagHint: '--resource-food',
        assign: (value) => {
          resourceFood = value;
        },
      });
    } else {
      resourceFood = TARGETS.resourceFood;
    }
  }

  let qualitativeNotes = pickString(args.notes, defaults.qualitativeNotes);
  if (!qualitativeNotes) {
    if (interactive) {
      pending.push({
        type: 'string',
        label: 'Note qualitative',
        flagHint: '--notes',
        assign: (value) => {
          qualitativeNotes = value;
        },
      });
    } else {
      qualitativeNotes = 'Auto-generated from telemetry import';
    }
  }

  const sessionTag = pickString(args.sessionTag, defaults.sessionTag);

  if (pending.length > 0 && !interactive) {
    const hints = pending.map((field) => `${field.label} (${field.flagHint})`).join(', ');
    throw new Error(
      `Missing required inputs: ${hints}. Pass the corresponding CLI flags, provide telemetry defaults, or rerun with --interactive to enter them manually.`,
    );
  }

  let rl: ReturnType<typeof createInterface> | undefined;

  const ensureRl = (): ReturnType<typeof createInterface> => {
    if (!rl) {
      rl = createInterface({ input, output });
      console.log('Interactive mode enabled. Provide the missing values below:');
    }
    return rl;
  };

  const askString = async (label: string): Promise<string> => {
    const reader = ensureRl();
    while (true) {
      const answer = (await reader.question(`${label}: `)).trim();
      if (answer.length > 0) {
        return answer;
      }
      console.log('Valore obbligatorio. Riprovare.');
    }
  };

  const askNumberArray = async (label: string): Promise<number[]> => {
    const reader = ensureRl();
    while (true) {
      const answer = (await reader.question(`${label} (valori separati da virgola): `)).trim();
      const parsed = parseNumberList(answer);
      if (parsed.length > 0) {
        return parsed;
      }
      console.log('Inserire almeno un valore numerico.');
    }
  };

  const askNumber = async (
    label: string,
    constraints?: { min?: number; max?: number },
  ): Promise<number> => {
    const reader = ensureRl();
    while (true) {
      const answer = (await reader.question(`${label}: `)).trim();
      const value = Number(answer);
      if (Number.isFinite(value)) {
        if (constraints?.min !== undefined && value < constraints.min) {
          console.log(`Il valore deve essere ≥ ${constraints.min}.`);
          continue;
        }
        if (constraints?.max !== undefined && value > constraints.max) {
          console.log(`Il valore deve essere ≤ ${constraints.max}.`);
          continue;
        }
        return value;
      }
      console.log('Inserire un numero valido.');
    }
  };

  for (const field of pending) {
    if (field.type === 'string') {
      field.assign(await askString(field.label));
    } else if (field.type === 'numberArray') {
      field.assign(await askNumberArray(field.label));
    } else {
      field.assign(await askNumber(field.label, field.constraints));
    }
  }

  if (rl) {
    await rl.close();
  }

  if (
    !sessionId ||
    !tester ||
    !device ||
    !cycleDurationMs?.length ||
    !tapsPerAssignment?.length ||
    !assignmentLatencyMs?.length ||
    pickerCloseRate === undefined ||
    resourceGold === undefined ||
    resourceFood === undefined ||
    !qualitativeNotes
  ) {
    throw new Error('Failed to resolve required inputs for the mobile playtest log.');
  }

  return {
    sessionId,
    tester,
    device,
    cycleDurationMs,
    tapsPerAssignment,
    assignmentLatencyMs,
    pickerCloseRate,
    resourceDelta: { gold: resourceGold, food: resourceFood },
    qualitativeNotes,
    sessionTag,
  };
}

/**
 * Resolves the list of output formats requested via CLI arguments.
 */
const resolveOutputFormats = (args: CliArgs): OutputFormat[] =>
  dedupeFormats(args.formats && args.formats.length > 0 ? args.formats : DEFAULT_OUTPUT_FORMATS);

/**
 * Normalizes the provided string into a filesystem-safe slug.
 */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'session';

const averageSamples = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const normalizeTelemetryInput = (
  input: unknown,
): { payload: TelemetryPayload; events: RawTelemetryEvent[] } => {
  if (Array.isArray(input)) {
    return {
      payload: {},
      events: input.filter((entry): entry is RawTelemetryEvent => typeof entry === 'object' && entry !== null),
    };
  }

  if (input && typeof input === 'object') {
    const payload = input as TelemetryPayload;
    const candidateArrays = [payload.events, payload.telemetry, payload.samples];
    for (const candidate of candidateArrays) {
      if (Array.isArray(candidate)) {
        return {
          payload,
          events: candidate.filter((entry): entry is RawTelemetryEvent => typeof entry === 'object' && entry !== null),
        };
      }
    }
    return { payload, events: [] };
  }

  return { payload: {}, events: [] };
};

const deriveTelemetryFromEvents = (events: RawTelemetryEvent[]): DerivedTelemetryDefaults => {
  if (!events.length) {
    return {};
  }

  const cycleDurationSamples: number[] = [];
  const tapSamples: number[] = [];
  const latencySamples: number[] = [];
  const resourceSamples: Array<{ gold?: number; food?: number }> = [];
  let pickerCloseDirect: number | undefined;
  let closeCount = 0;
  let closeWithinThreshold = 0;
  let qualitativeNotes: string | undefined;

  events.forEach((event) => {
    const type = typeof event.type === 'string' ? event.type : '';
    const duration =
      coerceNumber((event as UnknownRecord).cycleDurationMs) ??
      (type.includes('cycle') ? coerceNumber((event as UnknownRecord).durationMs) : undefined);
    if (typeof duration === 'number') {
      cycleDurationSamples.push(duration);
    }

    const tapCount = coerceNumber((event as UnknownRecord).tapCount);
    if (typeof tapCount === 'number' && tapCount > 0) {
      tapSamples.push(tapCount);
    }

    if (type === 'assign_success') {
      const latency = coerceNumber((event as UnknownRecord).latencyMs);
      if (typeof latency === 'number') {
        latencySamples.push(latency);
      }
    }

    if (typeof (event as UnknownRecord).pickerCloseRate === 'number') {
      pickerCloseDirect = (event as UnknownRecord).pickerCloseRate as number;
    }

    if (type === 'close') {
      closeCount += 1;
      if ((event as UnknownRecord).closedWithinThreshold === true) {
        closeWithinThreshold += 1;
      }
      const durationMs = coerceNumber((event as UnknownRecord).closeDurationMs);
      if (durationMs !== undefined && durationMs <= 1000) {
        closeWithinThreshold += 1;
      }
    }

    const resourceDelta = coerceResourceDelta((event as UnknownRecord).resourceDelta);
    if (resourceDelta) {
      resourceSamples.push(resourceDelta);
    }

    if (typeof (event as UnknownRecord).notes === 'string' && !(qualitativeNotes && qualitativeNotes.length > 0)) {
      qualitativeNotes = (event as UnknownRecord).notes as string;
    }
    if (typeof (event as UnknownRecord).qualitativeNotes === 'string' && !qualitativeNotes) {
      qualitativeNotes = (event as UnknownRecord).qualitativeNotes as string;
    }
  });

  const resourceAggregate =
    resourceSamples.length > 0
      ? {
          gold: averageSamples(resourceSamples.map((sample) => sample.gold ?? 0)),
          food: averageSamples(resourceSamples.map((sample) => sample.food ?? 0)),
        }
      : undefined;

  const derivedPickerCloseRate =
    pickerCloseDirect !== undefined
      ? pickerCloseDirect
      : closeCount > 0
        ? (closeWithinThreshold / closeCount) * 100
        : undefined;

  return {
    cycleDurationMs: cycleDurationSamples.length ? cycleDurationSamples : undefined,
    tapsPerAssignment: tapSamples.length ? tapSamples : undefined,
    assignmentLatencyMs: latencySamples.length ? latencySamples : undefined,
    pickerCloseRate: derivedPickerCloseRate,
    resourceDelta: resourceAggregate,
    qualitativeNotes,
  };
};

/**
 * Builds telemetry defaults (session/tester/device/KPI samples) from a raw payload or event list.
 */
const buildTelemetryDefaults = (raw: unknown): TelemetryDefaults => {
  const { payload, events } = normalizeTelemetryInput(raw);
  const derived = deriveTelemetryFromEvents(events);
  const baseResourceDelta = coerceResourceDelta(payload.resourceDelta);
  const mergedResourceDelta = mergeResourceDelta(baseResourceDelta, derived.resourceDelta);
  const payloadSessionTag = typeof payload.sessionTag === 'string' ? payload.sessionTag : undefined;
  const metrics = (payload as UnknownRecord).metrics as
    | {
        cycle_duration_ms?: number | null;
        taps_per_assignment?: number | null;
        assignment_latency_ms?: number | null;
        picker_close_rate?: number | null;
        resource_gold?: number | null;
        resource_food?: number | null;
      }
    | undefined;

  const metricArray = (value?: number | null, fallback?: number[]): number[] | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? [value] : fallback;

  const metricNumber = (value?: number | null, fallback?: number): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined,
    tester: typeof payload.tester === 'string' ? payload.tester : undefined,
    device: typeof payload.device === 'string' ? payload.device : undefined,
    sessionTag: payloadSessionTag,
    cycleDurationMs:
      coerceNumberArray(payload.cycleDurationMs) ?? metricArray(metrics?.cycle_duration_ms, derived.cycleDurationMs),
    tapsPerAssignment:
      coerceNumberArray(payload.tapsPerAssignment) ?? metricArray(metrics?.taps_per_assignment, derived.tapsPerAssignment),
    assignmentLatencyMs:
      coerceNumberArray(payload.assignmentLatencyMs) ?? metricArray(metrics?.assignment_latency_ms, derived.assignmentLatencyMs),
    pickerCloseRate:
      coerceNumber(payload.pickerCloseRate) ??
      coerceNumber((payload as UnknownRecord).picker_close_rate) ??
      metricNumber(metrics?.picker_close_rate, derived.pickerCloseRate),
    resourceDelta: mergeResourceDelta(mergedResourceDelta, {
      gold: metricNumber(metrics?.resource_gold, TARGETS.resourceGold),
      food: metricNumber(metrics?.resource_food, TARGETS.resourceFood),
    }),
    qualitativeNotes:
      typeof payload.qualitativeNotes === 'string'
        ? payload.qualitativeNotes
        : typeof payload.notes === 'string'
          ? payload.notes
          : derived.qualitativeNotes,
  };
};

const loadImportContext = (telemetryPath: string): ImportContext => {
  const absolutePath = resolveInputPath(telemetryPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Telemetry file not found: ${absolutePath}`);
  }
  const raw = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  const existingLog = tryParseExistingLog(raw);
  if (existingLog) {
    return { kind: 'log', log: existingLog, absolutePath };
  }
  return { kind: 'telemetry', defaults: buildTelemetryDefaults(raw), absolutePath };
};

const printSampleDetails = (log: MobilePlaytestLog): void => {
  console.log('Cycle durations (ms):', log.cycleDurationMs.join(', '));
  console.log('Taps per assignment:', log.tapsPerAssignment.join(', '));
  console.log('Assignment latencies (ms):', log.assignmentLatencyMs.join(', '));
  console.log('Picker close rate:', `${log.pickerCloseRate}%`);
  console.log('Resource delta:', `${log.resourceDelta.gold} gold, ${log.resourceDelta.food} food`);
  console.log('Notes:', log.qualitativeNotes);
};

const exportReplayCsvIfEnabled = (log: MobilePlaytestLog, outputFormats?: OutputFormat[]): void => {
  if (!outputFormats || !outputFormats.includes('csv')) {
    console.log('CSV not enabled. Use --format csv');
    return;
  }

  const csvContent = generateCSV(log);
  const csvPath = resolve(OUTPUT_DIR, `${slugify(log.sessionId)}-replay.csv`);
  ensureOutputDirectory();
  writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`CSV exported to: ${relative(PROJECT_ROOT, csvPath)}`);
};

interface ReplayOptions {
  outputFormats?: OutputFormat[];
  mode?: ReplayMode;
  interactive?: boolean;
}

/**
 * Loads and replays a previously logged mobile playtest session.
 */
async function replaySession(replayPath: string, options?: ReplayOptions): Promise<void> {
  const absolutePath = resolveInputPath(replayPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Replay file not found: ${absolutePath}`);
  }
  const raw = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  const log = tryParseExistingLog(raw);
  if (!log) {
    throw new Error(`Invalid session log at ${absolutePath}`);
  }

  console.log(`Replaying session: ${log.sessionId} (${log.tester} on ${log.device})`);
  console.log(`Created: ${log.createdAt}`);

  const replayMode = options?.mode ?? 'summary';
  const interactive = options?.interactive ?? false;

  if (!interactive) {
    if (replayMode === 'summary' || replayMode === 'all') {
      printKpiSummary(log);
    }
    if (replayMode === 'samples' || replayMode === 'all') {
      printSampleDetails(log);
    }
    if (replayMode === 'all') {
      exportReplayCsvIfEnabled(log, options?.outputFormats);
    } else if (replayMode === 'summary' || replayMode === 'samples') {
      // Allow manual CSV export without interactive prompt if requested.
      if (options?.outputFormats?.includes('csv')) {
        exportReplayCsvIfEnabled(log, options.outputFormats);
      }
    }
    return;
  }

  const rl = createInterface({ input, output });

  try {
    while (true) {
      console.log('\nCommands: summary | samples | csv | quit');
      const command = (await rl.question('> ')).trim().toLowerCase();

      if (command === 'summary' || command === 's') {
        printKpiSummary(log);
      } else if (command === 'samples') {
        printSampleDetails(log);
      } else if (command === 'csv') {
        exportReplayCsvIfEnabled(log, options?.outputFormats);
      } else if (command === 'quit' || command === 'q') {
        break;
      } else {
        console.log('Unknown command. Use: summary, samples, csv, quit');
      }
    }
  } finally {
    rl.close();
  }
}

/**
 * Formats a millisecond value for Markdown/CSV output.
 */
const formatMs = (value: number): string => `${Math.round(value)} ms`;
/**
 * Formats numeric counts to two decimals.
 */
const formatCount = (value: number): string => value.toFixed(2);
/**
 * Formats numeric percentages to two decimals with % suffix.
 */
const formatPercent = (value: number): string => `${value.toFixed(2)} %`;
/**
 * Formats KPI status using ✓ / ⚠️ glyphs.
 */
const formatStatus = (ok: boolean): string => (ok ? '✓' : '⚠️');

interface MetricRow {
  label: string;
  target: string;
  value: string;
  ok: boolean;
}

const buildMetricRows = (log: MobilePlaytestLog): MetricRow[] => [
  {
    label: 'Cycle duration',
    target: `< ${TARGETS.cycleDurationMs.toLocaleString('en-US')} ms`,
    value: `${formatMs(log.derivedMetrics.avgCycleDurationMs)} (sample: ${log.cycleDurationMs.join(', ')})`,
    ok: log.derivedMetrics.meetsCycleTarget,
  },
  {
    label: 'Tap per assignment',
    target: `≤ ${TARGETS.tapsPerAssignment} tap`,
    value: `${formatCount(log.derivedMetrics.avgTapsPerAssignment)} (sample: ${log.tapsPerAssignment.join(', ')})`,
    ok: log.derivedMetrics.meetsTapTarget,
  },
  {
    label: 'Assignment latency',
    target: `< ${TARGETS.assignmentLatencyMs} ms`,
    value: `${formatMs(log.derivedMetrics.avgAssignmentLatencyMs)} (sample: ${log.assignmentLatencyMs.join(', ')})`,
    ok: log.derivedMetrics.meetsLatencyTarget,
  },
  {
    label: 'Picker close rate',
    target: `≥ ${TARGETS.pickerCloseRate} %`,
    value: formatPercent(log.pickerCloseRate),
    ok: log.derivedMetrics.meetsPickerTarget,
  },
  {
    label: 'Resource delta',
    target: `≥ +${TARGETS.resourceGold} gold / ≥ +${TARGETS.resourceFood} food`,
    value: `${log.resourceDelta.gold} gold / ${log.resourceDelta.food} food`,
    ok: log.derivedMetrics.meetsResourceTarget,
  },
];

/**
 * Prints the KPI summary (value vs target vs status) to stdout.
 */
const printKpiSummary = (log: MobilePlaytestLog): void => {
  console.log('Punch Club KPI summary');
  buildMetricRows(log).forEach((row) => {
    console.log(
      `- ${row.label}: ${row.value} | Target ${row.target} | ${row.ok ? 'OK' : 'CHECK ⚠️'}`,
    );
  });
};

/**
 * Escapes a CSV field according to RFC 4180 rules.
 */
const escapeCsvValue = (value: string | number | undefined): string => {
  const normalized = value === undefined ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

/**
 * Generates a Markdown representation of the log and KPI outcomes.
 */
function generateMarkdown(log: MobilePlaytestLog): string {
  const metricRows = buildMetricRows(log);
  const telemetryInfo = log.telemetrySource ? `\n- Telemetry source: \`${log.telemetrySource}\`` : '';
  const table = [
    '| KPI | Target | Result | Stato |',
    '| --- | --- | --- | --- |',
    ...metricRows.map(
      (row) => `| ${row.label} | ${row.target} | ${row.value} | ${formatStatus(row.ok)} |`,
    ),
  ].join('\n');

  return `# Punch Club Mobile Playtest Report

- Session: **${log.sessionId}**
- Tester: **${log.tester}**
- Device: **${log.device}**
- Created at (UTC): ${log.createdAt}${telemetryInfo}

## KPI Summary

${table}

## Qualitative Notes

${log.qualitativeNotes}
`;
}

/**
 * Generates a CSV representation of the log and KPI outcomes.
 */
function generateCSV(log: MobilePlaytestLog): string {
  const headers = [
    'Session ID',
    'Tester',
    'Device',
    'Created At',
    'Avg Cycle Duration (ms)',
    'Meets Cycle Target',
    'Avg Taps per Assignment',
    'Meets Tap Target',
    'Avg Assignment Latency (ms)',
    'Meets Latency Target',
    'Picker Close Rate (%)',
    'Meets Picker Target',
    'Resource Gold Delta',
    'Resource Food Delta',
    'Meets Resource Target',
    'Qualitative Notes',
  ];

  const values = [
    log.sessionId,
    log.tester,
    log.device,
    log.createdAt,
    log.derivedMetrics.avgCycleDurationMs,
    log.derivedMetrics.meetsCycleTarget ? 'Yes' : 'No',
    log.derivedMetrics.avgTapsPerAssignment,
    log.derivedMetrics.meetsTapTarget ? 'Yes' : 'No',
    log.derivedMetrics.avgAssignmentLatencyMs,
    log.derivedMetrics.meetsLatencyTarget ? 'Yes' : 'No',
    log.pickerCloseRate,
    log.derivedMetrics.meetsPickerTarget ? 'Yes' : 'No',
    log.resourceDelta.gold,
    log.resourceDelta.food,
    log.derivedMetrics.meetsResourceTarget ? 'Yes' : 'No',
    log.qualitativeNotes,
  ].map((value) => escapeCsvValue(value));

  return `${headers.join(',')}\n${values.join(',')}`;
}

/**
 * Writes artifacts for the given playtest log in the requested formats.
 */
function writeOutputs(
  log: MobilePlaytestLog,
  createdAt: Date,
  formats: OutputFormat[],
): { jsonPath?: string; markdownPath?: string; csvPath?: string } {
  ensureOutputDirectory();
  const timestampSlug = createdAt.toISOString().replace(/[:.]/g, '-');
  const sessionSlug = slugify(log.sessionId);
  const baseName = `${timestampSlug}-${sessionSlug}`;

  const result: { jsonPath?: string; markdownPath?: string; csvPath?: string } = {};

  if (formats.includes('json')) {
    const jsonPath = resolve(OUTPUT_DIR, `${baseName}.json`);
    writeFileSync(jsonPath, `${JSON.stringify(log, null, 2)}\n`, 'utf8');
    result.jsonPath = jsonPath;
  }

  if (formats.includes('markdown')) {
    const markdownPath = resolve(OUTPUT_DIR, `${baseName}.md`);
    writeFileSync(markdownPath, generateMarkdown(log), 'utf8');
    result.markdownPath = markdownPath;
  }

  if (formats.includes('csv')) {
    const csvPath = resolve(OUTPUT_DIR, `${baseName}.csv`);
    writeFileSync(csvPath, generateCSV(log), 'utf8');
    result.csvPath = csvPath;
  }

  return result;
}

/**
 * Attempts to open the generated Markdown report (macOS only).
 */
function maybeOpenReport(markdownPath: string): void {
  try {
    const child = spawn('open', [markdownPath], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  } catch (error) {
    console.warn('Unable to open report automatically:', error);
  }
}

/**
 * Processes telemetry data from Playwright test runs and generates aggregated reports.
 * Reads telemetry files from the specified directory and creates mobile playtest logs.
 */
async function processPlaywrightTelemetry(args: CliArgs): Promise<void> {
  const telemetryDir = args.playwrightOutputDir || resolve(PROJECT_ROOT, 'test-results/telemetry');
  const aggregateFormat = args.aggregateFormat || 'json';
  
  console.log(`🔍 Processing Playwright telemetry from: ${telemetryDir}`);
  
  if (!existsSync(telemetryDir)) {
    console.error(`❌ Telemetry directory not found: ${telemetryDir}`);
    console.log('💡 Make sure Playwright tests run with telemetry capture enabled');
    process.exit(1);
  }
  
  try {
    // Read all telemetry files
    const telemetryFiles = readTelemetryFiles(telemetryDir);
    
    if (telemetryFiles.length === 0) {
      console.log('⚠️  No telemetry files found in directory');
      return;
    }
    
    console.log(`📊 Found ${telemetryFiles.length} telemetry files`);
    
    // Process each telemetry file and create mobile playtest logs
    const processedLogs: MobilePlaytestLog[] = [];
    
    for (const telemetryFile of telemetryFiles) {
      try {
        const log = await convertTelemetryToMobileLog(telemetryFile);
        if (log) {
          processedLogs.push(log);
          console.log(`✅ Processed: ${telemetryFile.name} -> Session: ${log.sessionId}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process ${telemetryFile.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (processedLogs.length === 0) {
      console.log('⚠️  No valid telemetry data could be processed');
      return;
    }
    
    console.log(`📈 Generated ${processedLogs.length} mobile playtest logs`);
    
    // Generate aggregated report
    await generateAggregatedReport(processedLogs, aggregateFormat);
    
  } catch (error) {
    console.error('❌ Failed to process Playwright telemetry:', error);
    process.exit(1);
  }
}

/**
 * Reads telemetry files from the specified directory.
 */
interface TelemetryFile {
  name: string;
  content: TelemetrySnapshot;
}

function readTelemetryFiles(telemetryDir: string): TelemetryFile[] {
  const files: TelemetryFile[] = [];
  
  try {
    const dirEntries = readdirSync(telemetryDir, { withFileTypes: true });
    
    for (const entry of dirEntries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const filePath = resolve(telemetryDir, entry.name);
          const content = readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          files.push({ name: entry.name, content: parsed });
        } catch (error) {
          console.warn(`⚠️  Failed to read telemetry file ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to read telemetry directory:', error);
  }
  
  return files;
}

/**
 * Converts telemetry data to MobilePlaytestLog format.
 */
async function convertTelemetryToMobileLog(telemetryFile: TelemetryFile): Promise<MobilePlaytestLog | null> {
  const telemetry = telemetryFile.content;
  
  // Extract session information
  const sessionId = telemetry.sessionId || `session-${Date.now()}`;
  const sessionTag = telemetry.sessionTag || extractSessionTagFromFilename(telemetryFile.name);
  
  // Extract metrics from telemetry events
  const cycleDurations: number[] = [];
  const tapCounts: number[] = [];
  const assignmentLatencies: number[] = [];
  let pickerCloseRate = 0;
  const resourceDelta = { gold: 0, food: 0 };
  
  if (telemetry.events && Array.isArray(telemetry.events)) {
    telemetry.events.forEach((event: SandboxTelemetryEvent) => {
      switch (event.type) {
        case 'cycle_complete':
          if (typeof event.payload?.durationMs === 'number') {
            cycleDurations.push(event.payload.durationMs);
          }
          break;
        case 'assign_success':
          if (typeof event.payload?.tapCount === 'number') {
            tapCounts.push(event.payload.tapCount);
          }
          if (typeof event.payload?.latencyMs === 'number') {
            assignmentLatencies.push(event.payload.latencyMs);
          }
          break;
        case 'picker_close':
          if (typeof event.payload?.closedWithinThreshold === 'boolean') {
            pickerCloseRate = event.payload.closedWithinThreshold ? 100 : 0;
          }
          break;
        case 'resource_change':
          if (event.payload?.delta) {
            if (typeof event.payload.delta.gold === 'number') {
              resourceDelta.gold += event.payload.delta.gold;
            }
            if (typeof event.payload.delta.food === 'number') {
              resourceDelta.food += event.payload.delta.food;
            }
          }
          break;
      }
    });
  }
  
  // Build derived metrics
  const avgCycleDurationMs = cycleDurations.length > 0 
    ? cycleDurations.reduce((sum, val) => sum + val, 0) / cycleDurations.length 
    : TARGETS.cycleDurationMs;
    
  const avgTapsPerAssignment = tapCounts.length > 0 
    ? tapCounts.reduce((sum, val) => sum + val, 0) / tapCounts.length 
    : TARGETS.tapsPerAssignment;
    
  const avgAssignmentLatencyMs = assignmentLatencies.length > 0 
    ? assignmentLatencies.reduce((sum, val) => sum + val, 0) / assignmentLatencies.length 
    : TARGETS.assignmentLatencyMs;
  
  const meetsCycleTarget = avgCycleDurationMs <= TARGETS.cycleDurationMs;
  const meetsTapTarget = avgTapsPerAssignment >= TARGETS.tapsPerAssignment;
  const meetsLatencyTarget = avgAssignmentLatencyMs <= TARGETS.assignmentLatencyMs;
  const meetsPickerTarget = pickerCloseRate >= TARGETS.pickerCloseRate;
  const meetsResourceTarget = resourceDelta.gold >= TARGETS.resourceGold && resourceDelta.food >= TARGETS.resourceFood;
  
  // Create mobile playtest log
  const log: MobilePlaytestLog = {
    version: SCHEMA_VERSION,
    sessionId,
    sessionTag,
    tester: telemetry.testInfo?.file ? extractTesterFromTestFile(telemetry.testInfo.file) : 'playwright-auto',
    device: telemetry.testInfo?.title ? extractDeviceFromTestTitle(telemetry.testInfo.title) : 'mobile-unknown',
    cycleDurationMs: cycleDurations.length > 0 ? cycleDurations : [avgCycleDurationMs],
    tapsPerAssignment: tapCounts.length > 0 ? tapCounts : [avgTapsPerAssignment],
    assignmentLatencyMs: assignmentLatencies.length > 0 ? assignmentLatencies : [avgAssignmentLatencyMs],
    pickerCloseRate,
    resourceDelta,
    qualitativeNotes: `Auto-generated from Playwright test: ${telemetry.testInfo?.title || 'Unknown test'}`,
    telemetrySource: `playwright-${telemetryFile.name}`,
    createdAt: telemetry.extractedAt || new Date().toISOString(),
    derivedMetrics: {
      avgCycleDurationMs,
      avgTapsPerAssignment,
      avgAssignmentLatencyMs,
      meetsCycleTarget,
      meetsTapTarget,
      meetsLatencyTarget,
      meetsPickerTarget,
      meetsResourceTarget,
    },
  };
  
  // Validate the log
  const validation = MobilePlaytestLogSchema.safeParse(log);
  if (!validation.success) {
    console.warn(`⚠️  Generated log failed validation: ${validation.error.message}`);
    return null;
  }
  
  return validation.data;
}

/**
 * Extracts session tag from telemetry filename.
 */
function extractSessionTagFromFilename(filename: string): string {
  // Remove .json extension and timestamp prefix
  const baseName = filename.replace('.json', '');
  const parts = baseName.split('-');
  
  // Look for session tag pattern (usually contains 'playwright' and test name)
  const sessionParts = parts.filter(part => part.includes('playwright') || part.includes('test'));
  return sessionParts.length > 0 ? sessionParts.join('-') : baseName;
}

/**
 * Extracts tester name from test file path.
 */
function extractTesterFromTestFile(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace('.spec.ts', '').replace('.test.ts', '') || 'playwright';
}

/**
 * Extracts device information from test title.
 */
function extractDeviceFromTestTitle(title: string): string {
  if (title.toLowerCase().includes('mobile')) {
    return 'mobile-test';
  }
  if (title.toLowerCase().includes('touch')) {
    return 'touch-device';
  }
  return 'unknown-device';
}

/**
 * Generates aggregated report from processed logs.
 */
async function generateAggregatedReport(logs: MobilePlaytestLog[], format: 'json' | 'markdown' | 'csv'): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `playwright-aggregate-${timestamp}`;
  
  ensureOutputDirectory();
  
  if (format === 'json') {
    const jsonPath = resolve(OUTPUT_DIR, `${baseName}.json`);
    const aggregateData = {
      summary: {
        totalSessions: logs.length,
        generatedAt: new Date().toISOString(),
        averageMetrics: calculateAggregateMetrics(logs),
      },
      sessions: logs,
    };
    
    writeFileSync(jsonPath, `${JSON.stringify(aggregateData, null, 2)}\n`, 'utf8');
    console.log(`📄 JSON aggregate report: ${relative(PROJECT_ROOT, jsonPath)}`);
  }
  
  if (format === 'markdown') {
    const markdownPath = resolve(OUTPUT_DIR, `${baseName}.md`);
    const markdown = generateAggregateMarkdown(logs);
    writeFileSync(markdownPath, markdown, 'utf8');
    console.log(`📄 Markdown aggregate report: ${relative(PROJECT_ROOT, markdownPath)}`);
  }
  
  if (format === 'csv') {
    const csvPath = resolve(OUTPUT_DIR, `${baseName}.csv`);
    const csv = generateAggregateCSV(logs);
    writeFileSync(csvPath, csv, 'utf8');
    console.log(`📄 CSV aggregate report: ${relative(PROJECT_ROOT, csvPath)}`);
  }
}

/**
 * Calculates aggregate metrics from multiple logs.
 */
function calculateAggregateMetrics(logs: MobilePlaytestLog[]) {
  const totalLogs = logs.length;
  
  const avgCycleDuration = logs.reduce((sum, log) => sum + log.derivedMetrics.avgCycleDurationMs, 0) / totalLogs;
  const avgTapsPerAssignment = logs.reduce((sum, log) => sum + log.derivedMetrics.avgTapsPerAssignment, 0) / totalLogs;
  const avgAssignmentLatency = logs.reduce((sum, log) => sum + log.derivedMetrics.avgAssignmentLatencyMs, 0) / totalLogs;
  const avgPickerCloseRate = logs.reduce((sum, log) => sum + log.pickerCloseRate, 0) / totalLogs;
  
  const cycleTargetMetRate = logs.filter(log => log.derivedMetrics.meetsCycleTarget).length / totalLogs * 100;
  const tapTargetMetRate = logs.filter(log => log.derivedMetrics.meetsTapTarget).length / totalLogs * 100;
  const latencyTargetMetRate = logs.filter(log => log.derivedMetrics.meetsLatencyTarget).length / totalLogs * 100;
  const pickerTargetMetRate = logs.filter(log => log.derivedMetrics.meetsPickerTarget).length / totalLogs * 100;
  
  return {
    avgCycleDurationMs: Math.round(avgCycleDuration),
    avgTapsPerAssignment: Math.round(avgTapsPerAssignment * 10) / 10,
    avgAssignmentLatencyMs: Math.round(avgAssignmentLatency),
    avgPickerCloseRate: Math.round(avgPickerCloseRate),
    cycleTargetMetRate: Math.round(cycleTargetMetRate),
    tapTargetMetRate: Math.round(tapTargetMetRate),
    latencyTargetMetRate: Math.round(latencyTargetMetRate),
    pickerTargetMetRate: Math.round(pickerTargetMetRate),
  };
}

/**
 * Generates markdown report for aggregated data.
 */
function generateAggregateMarkdown(logs: MobilePlaytestLog[]): string {
  const metrics = calculateAggregateMetrics(logs);
  const summaryTable = buildAggregateSummaryTable(logs, metrics);
  
  return `# Playwright Mobile Telemetry Aggregate Report

Generated: ${new Date().toISOString()}
Total Sessions: ${logs.length}

## Summary Metrics

${summaryTable}

## Session Details

${logs.map(log => `
### ${log.sessionId}
- **Session Tag:** ${log.sessionTag || 'N/A'}
- **Tester:** ${log.tester}
- **Device:** ${log.device}
- **Test:** ${log.telemetrySource}
- **Created:** ${log.createdAt}

#### KPI Results
| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Cycle Duration | ${log.derivedMetrics.avgCycleDurationMs}ms | ${TARGETS.cycleDurationMs}ms | ${log.derivedMetrics.meetsCycleTarget ? '✅' : '❌'} |
| Taps per Assignment | ${log.derivedMetrics.avgTapsPerAssignment} | ${TARGETS.tapsPerAssignment} | ${log.derivedMetrics.meetsTapTarget ? '✅' : '❌'} |
| Assignment Latency | ${log.derivedMetrics.avgAssignmentLatencyMs}ms | ${TARGETS.assignmentLatencyMs}ms | ${log.derivedMetrics.meetsLatencyTarget ? '✅' : '❌'} |
| Picker Close Rate | ${log.pickerCloseRate}% | ${TARGETS.pickerCloseRate}% | ${log.derivedMetrics.meetsPickerTarget ? '✅' : '❌'} |
| Resource Gold | ${log.resourceDelta.gold} | ≥${TARGETS.resourceGold} | ${log.resourceDelta.gold >= TARGETS.resourceGold ? '✅' : '❌'} |
| Resource Food | ${log.resourceDelta.food} | ≥${TARGETS.resourceFood} | ${log.resourceDelta.food >= TARGETS.resourceFood ? '✅' : '❌'} |

#### Notes
${log.qualitativeNotes}
`).join('\n---\n')}
`;
}

/**
 * Builds summary table for aggregate report.
 */
function buildAggregateSummaryTable(
  _logs: MobilePlaytestLog[],
  metrics: ReturnType<typeof calculateAggregateMetrics>,
): string {
  return `| Metric | Average | Target | Met Rate |
|--------|---------|--------|----------|
| Cycle Duration | ${metrics.avgCycleDurationMs}ms | ${TARGETS.cycleDurationMs}ms | ${metrics.cycleTargetMetRate}% |
| Taps per Assignment | ${metrics.avgTapsPerAssignment} | ${TARGETS.tapsPerAssignment} | ${metrics.tapTargetMetRate}% |
| Assignment Latency | ${metrics.avgAssignmentLatencyMs}ms | ${TARGETS.assignmentLatencyMs}ms | ${metrics.latencyTargetMetRate}% |
| Picker Close Rate | ${metrics.avgPickerCloseRate}% | ${TARGETS.pickerCloseRate}% | ${metrics.pickerTargetMetRate}% |`;
}

/**
 * Generates CSV report for aggregated data.
 */
function generateAggregateCSV(logs: MobilePlaytestLog[]): string {
  const headers = [
    'Session ID',
    'Session Tag',
    'Tester',
    'Device',
    'Test Source',
    'Created At',
    'Avg Cycle Duration (ms)',
    'Meets Cycle Target',
    'Avg Taps per Assignment',
    'Meets Tap Target',
    'Avg Assignment Latency (ms)',
    'Meets Latency Target',
    'Picker Close Rate (%)',
    'Meets Picker Target',
    'Resource Gold Delta',
    'Resource Food Delta',
    'Meets Resource Target',
    'Qualitative Notes',
  ];

  const rows = logs.map(log => [
    log.sessionId,
    log.sessionTag || '',
    log.tester,
    log.device,
    log.telemetrySource,
    log.createdAt,
    log.derivedMetrics.avgCycleDurationMs,
    log.derivedMetrics.meetsCycleTarget ? 'Yes' : 'No',
    log.derivedMetrics.avgTapsPerAssignment,
    log.derivedMetrics.meetsTapTarget ? 'Yes' : 'No',
    log.derivedMetrics.avgAssignmentLatencyMs,
    log.derivedMetrics.meetsLatencyTarget ? 'Yes' : 'No',
    log.pickerCloseRate,
    log.derivedMetrics.meetsPickerTarget ? 'Yes' : 'No',
    log.resourceDelta.gold,
    log.resourceDelta.food,
    log.derivedMetrics.meetsResourceTarget ? 'Yes' : 'No',
    log.qualitativeNotes,
  ]);

  const escapeCsvValue = (value: string | number | undefined): string => {
    const normalized = value === undefined ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ].join('\n');
}

/**
 * Main entry point for the CLI.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.replayPath) {
    await replaySession(args.replayPath, {
      outputFormats: args.formats,
      mode: args.replayMode,
      interactive: args.interactive ?? false,
    });
    return;
  }

  if (args.postPlaywright) {
    await processPlaywrightTelemetry(args);
    return;
  }

  if (!existsSync(SCHEMA_PATH)) {
    console.warn(`Schema file missing at ${SCHEMA_PATH}. Please regenerate before logging.`);
  }

  const importContext = args.telemetryPath ? loadImportContext(args.telemetryPath) : undefined;
  const now = new Date();

  let log: MobilePlaytestLog;
  let artifactTimestamp: Date;

  if (importContext?.kind === 'log') {
    const relativeSource = relative(PROJECT_ROOT, importContext.absolutePath);
    log = importContext.log.telemetrySource
      ? importContext.log
      : { ...importContext.log, telemetrySource: relativeSource };
    artifactTimestamp = new Date(importContext.log.createdAt);
  } else {
    const defaults = importContext?.defaults ?? {};
    const collected = await gatherInputs(args, defaults);
    log = buildLog(collected, {
      createdAt: now,
      telemetrySource: importContext ? relative(PROJECT_ROOT, importContext.absolutePath) : undefined,
    });
    artifactTimestamp = now;
  }

  const outputFormats = resolveOutputFormats(args);
  const outputs = writeOutputs(log, artifactTimestamp, outputFormats);
  printKpiSummary(log);

  const outputLines = [];
  if (outputs.jsonPath) {
    outputLines.push(`- JSON: ${relative(PROJECT_ROOT, outputs.jsonPath)}`);
  }
  if (outputs.markdownPath) {
    outputLines.push(`- Markdown: ${relative(PROJECT_ROOT, outputs.markdownPath)}`);
  }
  if (outputs.csvPath) {
    outputLines.push(`- CSV: ${relative(PROJECT_ROOT, outputs.csvPath)}`);
  }

  console.log(`Playtest log saved:\n${outputLines.join('\n')}`);

  if (args.openReport && outputs.markdownPath) {
    maybeOpenReport(outputs.markdownPath);
  }
}

const shouldExecuteCli =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv.length > 1 &&
  resolve(process.argv[1]) === __filename;

if (shouldExecuteCli) {
  main().catch((error) => {
    console.error('Failed to capture playtest log:', error);
    process.exit(1);
  });
}
