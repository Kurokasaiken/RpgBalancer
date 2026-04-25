#!/usr/bin/env tsx

/**
 * NP-091 – Idle Village Food Chain Alert CLI
 *
 * Monitors food production/consumption KPIs, raises alerts, and generates reports.
 * Can ingest raw snapshots, scheduler KPIs (from multi-village monitor), or a live village state.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import process from 'process';
import type { IdleVillageConfig } from '../../src/balancing/config/idleVillage/types';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../src/balancing/config/idleVillage/defaultConfig';
import type { VillageState } from '../../src/engine/game/idleVillage/TimeEngine';
import type { SchedulerKPIs } from '../../src/ui/idleVillage/services/multiVillageSchedulerMonitor';
import {
  FoodChainAlertAnalyzer,
  formatFoodChainReport,
  snapshotsFromSchedulerKpis,
  type FoodChainSnapshot,
  type FoodChainSchedulerKpi,
  type FoodChainAnalysisResult,
  type FoodChainAlert,
} from '../../src/analytics/idleVillageFoodChain';
import { createSandboxDiagnostics } from '../../src/ui/idleVillage/utils/sandboxDiagnostics';
import { DEFAULT_FOOD_CHAIN_ALERT_CONFIG } from '../../src/balancing/config/idleVillage/foodChainAlertConfig';

interface CliOptions {
  statePath?: string;
  configPath?: string;
  snapshotsPath?: string;
  schedulerKpisPath?: string;
  monitorExportPath?: string;
  productionPerDay?: number;
  format: 'text' | 'markdown' | 'json';
  outputPath?: string;
  watchIntervalSeconds?: number;
  sample?: boolean;
}

const diagnostics = createSandboxDiagnostics('FoodChainAlertCLI', 'food_chain');

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    format: 'text',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case '--state':
        options.statePath = args[++i];
        break;
      case '--config':
        options.configPath = args[++i];
        break;
      case '--snapshots':
        options.snapshotsPath = args[++i];
        break;
      case '--kpis':
        options.schedulerKpisPath = args[++i];
        break;
      case '--monitor-export':
        options.monitorExportPath = args[++i];
        break;
      case '--production':
        options.productionPerDay = Number(args[++i]);
        break;
      case '--format':
        options.format = args[++i] as CliOptions['format'];
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--watch':
        {
          const next = args[i + 1];
          if (next && !next.startsWith('--')) {
            options.watchIntervalSeconds = Number(args[++i]);
          } else {
            options.watchIntervalSeconds = DEFAULT_FOOD_CHAIN_ALERT_CONFIG.defaultWatchIntervalSeconds;
          }
        }
        break;
      case '--sample':
        options.sample = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Idle Village Food Chain Alert CLI

Usage:
  npm run tsx scripts/idleVillage/foodChainAlert.ts [options]

Options:
  --state <path>          Path to VillageState JSON (default: uses simple sample state)
  --config <path>         Path to IdleVillageConfig JSON (default: default config)
  --snapshots <path>      Path to array of FoodChainSnapshot entries
  --kpis <path>           Path to FoodChainSchedulerKpi JSON array
  --monitor-export <path> JSON exported from multiVillageSchedulerMonitor CLI
  --production <number>   Manual production override (units/day)
  --format <text|markdown|json> Output format (default: text)
  --output <path>         Write report to file
  --watch [seconds]       Re-run analysis every N seconds (default: config default)
  --sample                Use built-in demo dataset for quick smoke tests
  --help                  Show this help message

Examples:
  # Basic run using default data
  npm run tsx scripts/idleVillage/foodChainAlert.ts --sample

  # Analyze saved state + scheduler KPIs
  npm run tsx scripts/idleVillage/foodChainAlert.ts --state tmp/state.json --kpis tmp/kpis.json --format markdown

  # Watch mode (poll every 45s)
  npm run tsx scripts/idleVillage/foodChainAlert.ts --monitor-export tmp/monitor.json --watch 45
`);
}

function loadJson<T>(path?: string): T | null {
  if (!path) return null;
  const absolute = resolve(path);
  const raw = readFileSync(absolute, 'utf-8');
  return JSON.parse(raw) as T;
}

function loadVillageConfig(path?: string): IdleVillageConfig {
  if (!path) {
    return DEFAULT_IDLE_VILLAGE_CONFIG;
  }
  return loadJson<IdleVillageConfig>(path) ?? DEFAULT_IDLE_VILLAGE_CONFIG;
}

function loadVillageState(path?: string): VillageState {
  if (!path) {
    return {
      currentTime: 0,
      resources: { food: 120, gold: 200 },
      residents: {},
      activities: {},
      eventLog: [],
      questOffers: {},
    };
  }
  return loadJson<VillageState>(path) ?? {
    currentTime: 0,
    resources: { food: 0 },
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
  };
}

function loadSnapshots(path?: string): FoodChainSnapshot[] | null {
  if (!path) return null;
  return loadJson<FoodChainSnapshot[]>(path);
}

function loadSchedulerKpis(path?: string): FoodChainSchedulerKpi[] | null {
  if (!path) return null;
  return loadJson<FoodChainSchedulerKpi[]>(path);
}

function convertMonitorExport(path?: string): FoodChainSchedulerKpi[] | null {
  if (!path) return null;
  const exportData = loadJson<Record<string, SchedulerKPIs[]>>(path);
  if (!exportData) return null;
  const productionTags = new Set(DEFAULT_FOOD_CHAIN_ALERT_CONFIG.productionActivityTags);
  const result: FoodChainSchedulerKpi[] = [];

  Object.entries(exportData).forEach(([villageId, kpis]) => {
    if (!kpis.length) return;
    const latest = kpis[kpis.length - 1];
    const productionEntries = Object.entries(latest.activities.byType ?? {}) as Array<[string, number]>;
    const productionCount = productionEntries.reduce((sum, [activityType, activityCount]) => {
      if (productionTags.has(activityType)) {
        return sum + Number(activityCount);
      }
      return sum;
    }, 0);
    result.push({
      villageId,
      productionActivitiesPerDay: productionCount,
      farmingUtilization: latest.residents.total > 0 ? latest.residents.active / latest.residents.total : 0,
      description: 'monitor_export',
    });
  });

  return result;
}

function buildSnapshotsFromOptions(
  options: CliOptions,
  config: IdleVillageConfig,
  state: VillageState,
): FoodChainSnapshot[] {
  if (options.sample) {
    return buildSampleSnapshots();
  }

  const snapshotFile = loadSnapshots(options.snapshotsPath);
  if (snapshotFile?.length) {
    return snapshotFile;
  }

  const directKpis = loadSchedulerKpis(options.schedulerKpisPath);
  if (directKpis?.length) {
    return snapshotsFromSchedulerKpis({ kpis: directKpis, state, config });
  }

  const monitorKpis = convertMonitorExport(options.monitorExportPath);
  if (monitorKpis?.length) {
    return snapshotsFromSchedulerKpis({ kpis: monitorKpis, state, config });
  }

  const productionPerDay = options.productionPerDay ?? 20;
  const analyzer = new FoodChainAlertAnalyzer();
  const singleSnapshotResult = analyzer.analyzeVillageState({
    config,
    state,
    productionPerDay,
  });
  return [
    {
      timestamp: Date.now(),
      foodStock: singleSnapshotResult.metrics.currentFoodStock,
      foodProductionPerDay: productionPerDay,
      foodConsumptionPerDay: singleSnapshotResult.metrics.averageConsumptionPerDay,
    },
  ];
}

function emitTelemetry(result: FoodChainAnalysisResult): void {
  const alertSummary = result.alerts.map((alert: FoodChainAlert) => ({
    id: alert.id,
    severity: alert.severity,
    type: alert.type,
    message: alert.message,
  }));
  diagnostics.info('food_chain_alert', {
    status: result.status,
    alertCount: result.alerts.length,
    alerts: alertSummary,
    metrics: result.metrics,
  });
}

function printReport(result: FoodChainAnalysisResult, format: CliOptions['format'], outputPath?: string): void {
  const content =
    format === 'json'
      ? JSON.stringify(result, null, 2)
      : formatFoodChainReport(result, format === 'markdown' ? 'markdown' : 'text');
  if (outputPath) {
    writeFileSync(resolve(outputPath), content, 'utf-8');
    console.log(`Report saved to ${outputPath}`);
  } else {
    console.log(content);
  }
}

function buildSampleSnapshots(): FoodChainSnapshot[] {
  const now = Date.now();
  return [
    {
      timestamp: now - 2 * 60 * 60 * 1000,
      foodStock: 220,
      foodProductionPerDay: 45,
      foodConsumptionPerDay: 40,
    },
    {
      timestamp: now - 60 * 60 * 1000,
      foodStock: 200,
      foodProductionPerDay: 30,
      foodConsumptionPerDay: 40,
    },
    {
      timestamp: now,
      foodStock: 160,
      foodProductionPerDay: 20,
      foodConsumptionPerDay: 38,
    },
  ];
}

async function runOnce(options: CliOptions): Promise<FoodChainAnalysisResult> {
  const config = loadVillageConfig(options.configPath);
  const state = loadVillageState(options.statePath);
  const snapshots = buildSnapshotsFromOptions(options, config, state);
  const analyzer = new FoodChainAlertAnalyzer();
  const result = analyzer.analyzeSnapshots(snapshots);
  emitTelemetry(result);
  printReport(result, options.format, options.outputPath);
  return result;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const execute = async () => {
    try {
      await runOnce(options);
    } catch (error) {
      console.error('Food Chain analysis failed:', error);
    }
  };

  await execute();

  if (options.watchIntervalSeconds && options.watchIntervalSeconds > 0) {
    console.log(`Watching food chain metrics every ${options.watchIntervalSeconds}s...`);
    setInterval(() => {
      void execute();
    }, options.watchIntervalSeconds * 1000);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { runOnce as runFoodChainAlertCli };
