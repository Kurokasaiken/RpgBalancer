#!/usr/bin/env tsx

/**
 * Minimal Gameplay Risk Heatmap Export CLI (NP-MIN-PLAN-210)
 *
 * Generates a 10x10 heatmap describing resident fatigue vs. food reserves
 * based on Minimal Gameplay snapshots (NP-MIN-PLAN-206 schema) and
 * config-defined warning thresholds (MG-03).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  deserializeSnapshot,
  type MinimalSnapshot,
  type MinimalGameState,
} from '../../src/engine/game/idleVillage/minimalSnapshotSerializer';
import {
  MINIMAL_GAMEPLAY_CONFIG,
  type MinimalGameplayConfig,
} from '../../src/balancing/config/idleVillage/minimalGameplayConfig';

const PROJECT_ROOT = resolve('.');
const DEFAULT_OUTPUT_DIR = resolve(PROJECT_ROOT, 'test-results');
const SAMPLE_OUTPUT_PATH = resolve(
  PROJECT_ROOT,
  'data/exports/idleVillage/minimal-risk-heatmap-sample.json'
);

const HEATMAP_SIZE = 10;

export type SeverityBucket = 'safe' | 'caution' | 'danger';

export interface CLIArgs {
  snapshotPath?: string;
  configPath?: string;
  outputJson?: string;
  outputCsv?: string;
  verbose?: boolean;
  help?: boolean;
}

export interface HeatmapCell {
  fatigueBucket: number;
  foodBucket: number;
  fatigueRange: [number, number];
  foodRange: [number, number];
  residentCount: number;
  severityBreakdown: Record<SeverityBucket, number>;
  averageFatigue: number;
  averageFoodPercent: number;
  residents: string[];
}

export interface HeatmapSummary {
  totalResidents: number;
  severityCounts: Record<SeverityBucket, number>;
  averageFatigue: number;
  averageFoodPercent: number;
  dangerResidents: string[];
  cautionResidents: string[];
  severityScore: number;
}

export interface HeatmapResult {
  generatedAt: string;
  snapshotMetadata: MinimalSnapshot['metadata'];
  configVersion: string;
  thresholds: MinimalGameplayConfig['ui']['thresholds'];
  grid: HeatmapCell[][];
  summary: HeatmapSummary;
}

export function parseArgs(argv = process.argv.slice(2)): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    switch (token) {
      case '--snapshot':
      case '-s':
        args.snapshotPath = argv[++i];
        break;
      case '--config':
      case '-c':
        args.configPath = argv[++i];
        break;
      case '--output-json':
        args.outputJson = argv[++i];
        break;
      case '--output-csv':
        args.outputCsv = argv[++i];
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (token.startsWith('-')) {
          throw new Error(`Unknown option: ${token}`);
        }
    }
  }

  return args;
}

export function showHelp(): void {
  console.log(`
Minimal Risk Heatmap Export

Usage:
  tsx scripts/idleVillage/minimalRiskHeatmapExport.ts --snapshot <file> [options]

Options:
  -s, --snapshot <path>     Snapshot JSON generated via NP-MIN-PLAN-206 (required)
  -c, --config <path>       Minimal config JSON export (defaults to in-repo config)
      --output-json <path>  Override JSON output path (defaults to test-results)
      --output-csv <path>   Override CSV output path (defaults to test-results)
  -v, --verbose             Enable verbose logging
  -h, --help                Show this message

Outputs:
  - Heatmap JSON + CSV with 10x10 grid, bucket counts, and KPIs
  - Sample JSON mirrored to data/exports/idleVillage for designers

`);
}

function ensureDirectoryExists(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile<T>(path: string): T {
  const absolute = resolve(PROJECT_ROOT, path);
  if (!existsSync(absolute)) {
    throw new Error(`File not found: ${absolute}`);
  }
  const raw = readFileSync(absolute, 'utf-8');
  return JSON.parse(raw) as T;
}

function loadSnapshot(snapshotPath: string, verbose?: boolean): {
  snapshot: MinimalSnapshot;
  state: MinimalGameState;
} {
  const snapshot = readJsonFile<MinimalSnapshot>(snapshotPath);
  const state = deserializeSnapshot(snapshot);
  if (verbose) {
    console.log(
      `🗂️  Snapshot loaded: ${snapshot.metadata.summary.residentCount} residents, day ${snapshot.metadata.summary.currentDay}`
    );
  }
  return { snapshot, state };
}

function loadConfig(configPath?: string, verbose?: boolean): MinimalGameplayConfig {
  if (!configPath) {
    if (verbose) {
      console.log('⚙️  Using in-repo MINIMAL_GAMEPLAY_CONFIG.');
    }
    return MINIMAL_GAMEPLAY_CONFIG;
  }

  const config = readJsonFile<MinimalGameplayConfig>(configPath);
  if (verbose) {
    console.log(`⚙️  Loaded external config: version ${config.version}`);
  }
  return config;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBucketIndex(value: number): number {
  const normalized = clamp(value, 0, 0.999999);
  return Math.floor(normalized * HEATMAP_SIZE);
}

function severityFromFatigue(fatigue: number, threshold: number): SeverityBucket {
  if (fatigue >= threshold) return 'danger';
  if (fatigue >= threshold * 0.7) return 'caution';
  return 'safe';
}

function severityFromFood(days: number, threshold: number): SeverityBucket {
  if (days <= threshold) return 'danger';
  if (days <= threshold * 1.5) return 'caution';
  return 'safe';
}

function mergeSeverity(a: SeverityBucket, b: SeverityBucket): SeverityBucket {
  if (a === 'danger' || b === 'danger') return 'danger';
  if (a === 'caution' || b === 'caution') return 'caution';
  return 'safe';
}

function severityScore(bucket: SeverityBucket): number {
  if (bucket === 'danger') return 1;
  if (bucket === 'caution') return 0.5;
  return 0;
}

function initializeGrid(): HeatmapCell[][] {
  return Array.from({ length: HEATMAP_SIZE }, (_, foodIdx) =>
    Array.from({ length: HEATMAP_SIZE }, (_, fatigueIdx) => ({
      fatigueBucket: fatigueIdx,
      foodBucket: foodIdx,
      fatigueRange: [fatigueIdx / HEATMAP_SIZE, (fatigueIdx + 1) / HEATMAP_SIZE],
      foodRange: [foodIdx / HEATMAP_SIZE, (foodIdx + 1) / HEATMAP_SIZE],
      residentCount: 0,
      severityBreakdown: { safe: 0, caution: 0, danger: 0 },
      averageFatigue: 0,
      averageFoodPercent: 0,
      residents: [],
    }))
  );
}

export function computeResidentFoodDays(state: MinimalGameState): number[] {
  const totalLoad =
    state.residents.reduce((sum: number, resident) => sum + (resident.isWorking ? 1.25 : 1), 0) || 1;
  const baseDaysPerLoad = state.food / totalLoad;
  return state.residents.map(resident => {
    const load = resident.isWorking ? 1.25 : 1;
    return baseDaysPerLoad / load;
  });
}

export function computeRiskHeatmap(
  state: MinimalGameState,
  snapshotMetadata: MinimalSnapshot['metadata'],
  config: MinimalGameplayConfig
): HeatmapResult {
  const thresholds = config.ui.thresholds;
  const residentFoodDays = computeResidentFoodDays(state);
  const grid = initializeGrid();
  const severityCounts: Record<SeverityBucket, number> = {
    safe: 0,
    caution: 0,
    danger: 0,
  };

  let totalFatigue = 0;
  let totalFoodPercent = 0;
  let severityTotal = 0;
  const dangerResidents: string[] = [];
  const cautionResidents: string[] = [];

  state.residents.forEach((resident, index) => {
    const fatiguePercent = resident.fatigue;
    const fatigueBucket = getBucketIndex(fatiguePercent);
    const foodDays = residentFoodDays[index];
    const normalizedFoodPercent = clamp(
      thresholds.foodDangerDays > 0
        ? foodDays / (thresholds.foodDangerDays * 2)
        : 0,
      0,
      1
    );
    const foodBucket = getBucketIndex(normalizedFoodPercent);

    const fatigueSeverity = severityFromFatigue(fatiguePercent, thresholds.fatigueDangerPercent);
    const foodSeverity = severityFromFood(foodDays, thresholds.foodDangerDays);
    const bucket = mergeSeverity(fatigueSeverity, foodSeverity);

    severityCounts[bucket] += 1;
    severityTotal += severityScore(bucket);
    if (bucket === 'danger') {
      dangerResidents.push(resident.name);
    } else if (bucket === 'caution') {
      cautionResidents.push(resident.name);
    }

    totalFatigue += fatiguePercent;
    totalFoodPercent += normalizedFoodPercent;

    const cell = grid[foodBucket][fatigueBucket];
    cell.residentCount += 1;
    cell.severityBreakdown[bucket] += 1;
    cell.residents.push(resident.name);
    cell.averageFatigue =
      ((cell.averageFatigue * (cell.residentCount - 1)) + fatiguePercent) /
      cell.residentCount;
    cell.averageFoodPercent =
      ((cell.averageFoodPercent * (cell.residentCount - 1)) + normalizedFoodPercent) /
      cell.residentCount;
  });

  return {
    generatedAt: new Date().toISOString(),
    snapshotMetadata,
    configVersion: config.version,
    thresholds,
    grid,
    summary: {
      totalResidents: state.residents.length,
      severityCounts,
      averageFatigue: state.residents.length ? totalFatigue / state.residents.length : 0,
      averageFoodPercent: state.residents.length ? totalFoodPercent / state.residents.length : 0,
      dangerResidents,
      cautionResidents,
      severityScore: state.residents.length ? severityTotal / state.residents.length : 0,
    },
  };
}

export function buildCsv(result: HeatmapResult): string {
  const header = [
    'food_bucket',
    'food_range_min',
    'food_range_max',
    'fatigue_bucket',
    'fatigue_range_min',
    'fatigue_range_max',
    'resident_count',
    'safe',
    'caution',
    'danger',
    'avg_fatigue',
    'avg_food_percent',
  ];

  const rows: string[] = [header.join(',')];

  result.grid.forEach(foodRow => {
    foodRow.forEach(cell => {
      if (cell.residentCount === 0) {
        return;
      }
      rows.push(
        [
          cell.foodBucket,
          cell.foodRange[0].toFixed(2),
          cell.foodRange[1].toFixed(2),
          cell.fatigueBucket,
          cell.fatigueRange[0].toFixed(2),
          cell.fatigueRange[1].toFixed(2),
          cell.residentCount,
          cell.severityBreakdown.safe,
          cell.severityBreakdown.caution,
          cell.severityBreakdown.danger,
          cell.averageFatigue.toFixed(3),
          cell.averageFoodPercent.toFixed(3),
        ].join(',')
      );
    });
  });

  return rows.join('\n');
}

function writeJsonOutput(path: string, result: HeatmapResult, verbose?: boolean): void {
  ensureDirectoryExists(path);
  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
  if (verbose) {
    console.log(`✅ JSON written: ${path}`);
  }
}

function writeCsvOutput(path: string, csv: string, verbose?: boolean): void {
  ensureDirectoryExists(path);
  writeFileSync(path, csv, 'utf-8');
  if (verbose) {
    console.log(`✅ CSV written: ${path}`);
  }
}

function writeSample(result: HeatmapResult, verbose?: boolean): void {
  ensureDirectoryExists(SAMPLE_OUTPUT_PATH);
  writeFileSync(SAMPLE_OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  if (verbose) {
    console.log(`📦 Sample updated: ${SAMPLE_OUTPUT_PATH}`);
  }
}

export async function runCli(): Promise<void> {
  try {
    const args = parseArgs();

    if (args.help || !args.snapshotPath) {
      showHelp();
      if (!args.snapshotPath) {
        process.exit(args.help ? 0 : 1);
      }
    }

    const { snapshot, state } = loadSnapshot(args.snapshotPath, args.verbose);
    const config = loadConfig(args.configPath, args.verbose);

    const result = computeRiskHeatmap(state, snapshot.metadata, config);
    const csv = buildCsv(result);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultJsonPath = args.outputJson ??
      resolve(DEFAULT_OUTPUT_DIR, `np-min-plan-210-risk-heatmap-${timestamp}.json`);
    const defaultCsvPath = args.outputCsv ??
      resolve(DEFAULT_OUTPUT_DIR, `np-min-plan-210-risk-heatmap-${timestamp}.csv`);

    writeJsonOutput(defaultJsonPath, result, args.verbose);
    writeCsvOutput(defaultCsvPath, csv, args.verbose);
    writeSample(result, args.verbose);

    if (args.verbose) {
      console.log('📊 Summary:', JSON.stringify(result.summary, null, 2));
    }
  } catch (error) {
    console.error('❌ Risk heatmap export failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const modulePath = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  runCli();
}
