import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';

import {
  EnergyDrinkEconomySimulator,
  EnergyDrinkEconomyConfigOverrides,
  type EnergyDrinkEconomyReport,
  EnergyDrinkEconomySimulatorOptions,
} from '@/balancing/punchClub/EnergyDrinkEconomySimulator';

interface CLIOptions {
  config?: string;
  output?: string;
  iterations?: number;
  days?: number;
  baseSeed?: number;
  disablePersistence?: boolean;
  showSample?: boolean;
  showLastRun?: boolean;
  budgetPerDay?: number;
  dryRun?: boolean;
}

const program = new Command();

program
  .name('energy-drink-economy')
  .description('Balance-Lab – Punch Club energy drink economy simulator CLI')
  .option('-c, --config <path>', 'JSON file with config overrides')
  .option('-o, --output <path>', 'Write full JSON report to this path')
  .option('--iterations <number>', 'Override iteration count', value => Number(value))
  .option('--days <number>', 'Override number of simulated days', value => Number(value))
  .option('--base-seed <number>', 'Override base RNG seed', value => Number(value))
  .option('--budget-per-day <number>', 'Override budget per day for the player profile', value => Number(value))
  .option('--no-persist', 'Disable persistence via PersistenceService')
  .option('--show-sample', 'Print detailed sample days breakdown')
  .option('--show-last-run', 'Print stored persistence snapshot and exit')
  .option('--dry-run', 'Run without writing files even if output is provided')
  .parse(process.argv);

async function main(): Promise<void> {
  const options = program.opts<CLIOptions>();

  if (options.showLastRun) {
    const state = await EnergyDrinkEconomySimulator.loadLastReport();
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  const overrides = loadOverrides(options);
  if (options.iterations) {
    overrides.simulation = { ...(overrides.simulation ?? {}), iterations: options.iterations };
  }
  if (options.days) {
    overrides.simulation = { ...(overrides.simulation ?? {}), days: options.days };
  }
  if (options.baseSeed) {
    overrides.simulation = { ...(overrides.simulation ?? {}), baseSeed: options.baseSeed };
  }
  if (options.disablePersistence) {
    overrides.simulation = { ...(overrides.simulation ?? {}), persistResults: false };
  }
  if (options.budgetPerDay !== undefined) {
    overrides.playerProfile = { ...(overrides.playerProfile ?? {}), budgetPerDay: options.budgetPerDay };
  }

  const simulatorOptions: EnergyDrinkEconomySimulatorOptions = {
    telemetry: (event, payload) => {
      if (process.env.DEBUG?.includes('energy-drink-sim')) {
        console.log(`[telemetry] ${event}`, payload);
      }
    },
  };

  const simulator = new EnergyDrinkEconomySimulator(overrides, simulatorOptions);
  const report = await simulator.runSimulation();

  printSummary(report, options.showSample);

  if (options.output && !options.dryRun) {
    const outputPath = resolve(process.cwd(), options.output);
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to ${outputPath}`);
  }
}

function loadOverrides(options: CLIOptions): EnergyDrinkEconomyConfigOverrides {
  if (!options.config) {
    return {};
  }

  const filePath = resolve(process.cwd(), options.config);
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed satisfies EnergyDrinkEconomyConfigOverrides ? parsed : parsed;
}

function printSummary(report: EnergyDrinkEconomyReport, showSample?: boolean): void {
  console.log('Energy Drink Economy Simulation Summary');
  console.log('=======================================');
  console.log(`Config Version: ${report.configVersion}`);
  console.log(`Iterations:     ${report.iterations}`);
  console.log(`Days Simulated: ${report.daysSimulated}`);
  console.log(`Avg Gold / day: ${report.averageGoldPerDay.toFixed(2)}`);
  console.log(`Avg Drinks/day: ${report.averageDrinksPerDay.toFixed(2)}`);
  console.log(`Adequacy Rate:  ${(report.adequacyRate * 100).toFixed(2)}%`);
  console.log(`Shortage Rate:  ${(report.shortageRate * 100).toFixed(2)}%`);
  console.log(`Dependency Rate:${(report.dependencyRate * 100).toFixed(2)}%`);
  console.log(`Relapse Rate:   ${(report.relapseRate * 100).toFixed(2)}%`);
  console.log(`Detox Rate:     ${(report.detoxRate * 100).toFixed(2)}%`);
  console.log(`Config Digest:  ${report.configDigest}`);

  if (showSample) {
    console.log('\nSample Days (truncated to 10 entries)');
    report.sampleDays.forEach((day) => {
      console.log(
        `Day ${day.dayIndex}: demand=${day.energyDemand.toFixed(1)} supplied=${day.energySupplied.toFixed(1)} ` +
          `gold=${day.goldSpent.toFixed(2)} shortage=${day.shortage} dependencySpike=${day.dependencySpike}`,
      );
      if (day.purchases.length > 0) {
        day.purchases.forEach((purchase) => {
          console.log(
            `  - ${purchase.tierId}: qty=${purchase.quantity} energy=${purchase.energyDelivered.toFixed(1)} ` +
              `gold=${purchase.goldSpent.toFixed(2)}`,
          );
        });
      }
    });
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[energy-drink-economy] CLI failed:', error);
    process.exitCode = 1;
  });
}
