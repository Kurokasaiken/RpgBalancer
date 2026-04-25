#!/usr/bin/env ts-node
/**
 * NP-261 – PWA Install Benchmark CLI
 *
 * Runs automated benchmarks across configured network presets, captures samples
 * via InstallBenchmarkReporter, and prints summary tables/exports.
 */

import { exit } from 'node:process';
import chalk from 'chalk';
import { InstallBenchmarkReporter, DEFAULT_INSTALL_BENCHMARK_CONFIG, type InstallBenchmarkSummaryRow, type InstallBenchmarkNetworkProfile } from '../../src/analytics/pwa/installBenchmarkReporter';

interface CLIOptions {
  networks: string[] | 'all';
  samplesPerNetwork?: number;
  exportFormat: 'json' | 'markdown' | 'csv';
  output?: string;
  clear?: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = {
    networks: 'all',
    exportFormat: 'markdown',
  };

  argv.forEach((raw) => {
    const [flag, value] = raw.split('=');
    switch (flag) {
      case '--networks':
        options.networks = value && value !== 'all' ? value.split(',').map((id) => id.trim()) : 'all';
        break;
      case '--samples-per-network':
        options.samplesPerNetwork = Number(value);
        break;
      case '--export':
        if (value === 'json' || value === 'markdown' || value === 'csv') {
          options.exportFormat = value;
        }
        break;
      case '--output':
        options.output = value;
        break;
      case '--clear':
        options.clear = value !== 'false';
        break;
      default:
        break;
    }
  });

  return options;
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const reporter = new InstallBenchmarkReporter();
  await reporter.ready;

  if (args.clear) {
    await reporter.clearHistory();
    console.log(chalk.yellow('[install-benchmark-cli] Cleared persisted samples.'));
  }

  const targetNetworks = args.networks === 'all'
    ? DEFAULT_INSTALL_BENCHMARK_CONFIG.networks.map((network: InstallBenchmarkNetworkProfile) => network.id)
    : args.networks;

  const samplesPerNetwork = args.samplesPerNetwork ?? DEFAULT_INSTALL_BENCHMARK_CONFIG.networks[0]?.targetSamples ?? 5;

  for (const networkId of targetNetworks) {
    console.log(chalk.cyan(`\n[install-benchmark-cli] Running samples for ${networkId} (${samplesPerNetwork}x)`));
    for (let i = 0; i < samplesPerNetwork; i += 1) {
      const sample = await reporter.runBenchmark(networkId);
      console.log(
        chalk.gray(
          `  • sample=${sample.id} total=${sample.totalDurationMs.toFixed(0)}ms status=${sample.overallStatus}`,
        ),
      );
    }
  }

  const summary = await reporter.getSummary();
  console.log('\n[install-benchmark-cli] Summary');
  summary.rows.forEach((row: InstallBenchmarkSummaryRow) => {
    const label = chalk.bold(row.label);
    const line = `${label} | samples=${row.sampleCount} avg=${row.avgTotalMs.toFixed(0)}ms p95=${row.p95TotalMs.toFixed(0)}ms warnings=${(row.warningRate * 100).toFixed(1)}% fails=${(row.failRate * 100).toFixed(1)}%`;
    console.log(line);
  });

  const exportData = await reporter.exportSamples(args.exportFormat);
  if (args.output) {
    await writeFile(args.output, exportData);
    console.log(`\n[install-benchmark-cli] Exported data → ${args.output}`);
  } else {
    console.log('\n[install-benchmark-cli] Export preview:\n');
    console.log(exportData);
  }
}

async function writeFile(path: string, data: string): Promise<void> {
  const fs = await import('node:fs/promises');
  await fs.writeFile(path, data, 'utf8');
}

run().catch((error) => {
  console.error(chalk.red('[install-benchmark-cli] Failed'), error);
  exit(1);
});
