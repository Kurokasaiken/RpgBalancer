import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import type {
  MarginalUtilityAnalysis,
  SynergyAnalysis,
} from '../../src/balancing/stressTesting/MarginalUtilityTypes';

/**
 * Default configuration values for the synergy reporter CLI.
 */
const DEFAULT_REPORT_CONFIG = {
  opThreshold: 1.15,
  weakThreshold: 0.95,
  anomalyThreshold: 1.35,
  weakAnomalyThreshold: 0.75,
  highlightLimit: 10,
} as const;

/**
 * Options accepted by the synergy reporter when generating summaries.
 */
export interface SynergyReportOptions {
  /** Threshold above which a pair is considered OP. */
  opThreshold: number;
  /** Threshold below which a pair is considered weak. */
  weakThreshold: number;
  /** Threshold for flagging extreme OP anomalies. */
  anomalyThreshold: number;
  /** Threshold for flagging extreme weak anomalies. */
  weakAnomalyThreshold: number;
  /** Maximum rows in highlight tables. */
  highlightLimit: number;
}

/**
 * Entry describing a single synergy highlight row.
 */
export interface SynergyHighlight {
  pairId: string;
  statIds: [string, string];
  synergyMultiplier: number;
  observedWinRate: number;
  expectedWinRate: number;
  effectSize: number;
  isSignificant: boolean;
}

/**
 * Aggregated synergy report derived from MarginalUtilityAnalysis data.
 */
export interface SynergyReport {
  metadata: {
    generatedAt: string;
    inputFile: string;
  };
  summary: {
    totalPairs: number;
    opSynergies: number;
    weakSynergies: number;
    significantPairs: number;
    avgMultiplier: number;
    maxMultiplier: number;
    minMultiplier: number;
  };
  thresholds: Pick<
    SynergyReportOptions,
    'opThreshold' | 'weakThreshold' | 'anomalyThreshold' | 'weakAnomalyThreshold'
  >;
  highlights: {
    top: SynergyHighlight[];
    weak: SynergyHighlight[];
    anomalies: SynergyHighlight[];
  };
}

/**
 * Builds a highlight entry from a synergy analysis record.
 */
function toHighlight(entry: SynergyAnalysis): SynergyHighlight {
  return {
    pairId: entry.pairId,
    statIds: entry.statIds,
    synergyMultiplier: entry.synergyMultiplier,
    observedWinRate: entry.observedWinRate,
    expectedWinRate: entry.expectedWinRate,
    effectSize: entry.effectSize,
    isSignificant: entry.isSignificant,
  };
}

/**
 * Generates a synergy report from marginal utility analysis data.
 *
 * @param analysis - Marginal utility analysis data produced by KS-105 calculator.
 * @param options - Thresholds and highlight sizing options.
 */
export function generateSynergyReport(
  analysis: MarginalUtilityAnalysis,
  options: SynergyReportOptions = {
    ...DEFAULT_REPORT_CONFIG,
  },
  inputFile = 'analysis.json',
): SynergyReport {
  const { synergyAnalyses } = analysis;
  const totalPairs = synergyAnalyses.length;

  const opSynergies = synergyAnalyses.filter(
    (entry) => entry.synergyMultiplier >= options.opThreshold,
  );
  const weakSynergies = synergyAnalyses.filter(
    (entry) => entry.synergyMultiplier <= options.weakThreshold,
  );

  const highlightLimit = Math.max(1, options.highlightLimit);

  const topHighlights = opSynergies
    .sort((a, b) => b.synergyMultiplier - a.synergyMultiplier)
    .slice(0, highlightLimit)
    .map(toHighlight);

  const weakHighlights = weakSynergies
    .sort((a, b) => a.synergyMultiplier - b.synergyMultiplier)
    .slice(0, highlightLimit)
    .map(toHighlight);

  const anomalies = synergyAnalyses
    .filter(
      (entry) =>
        entry.synergyMultiplier >= options.anomalyThreshold ||
        entry.synergyMultiplier <= options.weakAnomalyThreshold,
    )
    .sort((a, b) => b.effectSize - a.effectSize)
    .slice(0, highlightLimit)
    .map(toHighlight);

  const multipliers = synergyAnalyses.map((entry) => entry.synergyMultiplier);
  const multiplierSum = multipliers.reduce((sum, value) => sum + value, 0);
  const avgMultiplier = multipliers.length ? multiplierSum / multipliers.length : 0;
  const maxMultiplier = multipliers.length ? Math.max(...multipliers) : 0;
  const minMultiplier = multipliers.length ? Math.min(...multipliers) : 0;

  const summary = {
    totalPairs,
    opSynergies: opSynergies.length,
    weakSynergies: weakSynergies.length,
    significantPairs: synergyAnalyses.filter((entry) => entry.isSignificant).length,
    avgMultiplier,
    maxMultiplier,
    minMultiplier,
  };

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      inputFile,
    },
    summary,
    thresholds: {
      opThreshold: options.opThreshold,
      weakThreshold: options.weakThreshold,
      anomalyThreshold: options.anomalyThreshold,
      weakAnomalyThreshold: options.weakAnomalyThreshold,
    },
    highlights: {
      top: topHighlights,
      weak: weakHighlights,
      anomalies,
    },
  };
}

/**
 * Formats a synergy report as Markdown suitable for docs or retro dashboards.
 *
 * @param report - Aggregated synergy report data.
 */
export function formatReportAsMarkdown(report: SynergyReport): string {
  const lines: string[] = [];
  lines.push('# Marginal Utility Synergy Report');
  lines.push('');
  lines.push(`Generated: ${report.metadata.generatedAt}`);
  lines.push(`Input File: ${report.metadata.inputFile}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total Pairs: ${report.summary.totalPairs}`);
  lines.push(`- OP Synergies (>${report.thresholds.opThreshold}×): ${report.summary.opSynergies}`);
  lines.push(
    `- Weak Synergies (<${report.thresholds.weakThreshold}×): ${report.summary.weakSynergies}`,
  );
  lines.push(`- Significant Pairs: ${report.summary.significantPairs}`);
  lines.push(`- Avg Multiplier: ${report.summary.avgMultiplier.toFixed(3)}`);
  lines.push(`- Max Multiplier: ${report.summary.maxMultiplier.toFixed(3)}`);
  lines.push(`- Min Multiplier: ${report.summary.minMultiplier.toFixed(3)}`);
  lines.push('');

  const renderTable = (title: string, highlights: SynergyHighlight[]) => {
    lines.push(`## ${title}`);
    if (!highlights.length) {
      lines.push('');
      lines.push('_No entries within the configured thresholds._');
      lines.push('');
      return;
    }

    lines.push('');
    lines.push('| Pair | Multiplier | Observed | Expected | Effect | Significant |');
    lines.push('|------|------------|----------|----------|--------|-------------|');
    highlights.forEach((highlight) => {
      const pairLabel = `${highlight.statIds[0]} + ${highlight.statIds[1]}`;
      lines.push(
        `| ${pairLabel} | ${highlight.synergyMultiplier.toFixed(3)} | ${highlight.observedWinRate.toFixed(
          3,
        )} | ${highlight.expectedWinRate.toFixed(3)} | ${highlight.effectSize.toFixed(3)} | ${
          highlight.isSignificant ? 'Yes' : 'No'
        } |`,
      );
    });
    lines.push('');
  };

  renderTable('Top Synergies', report.highlights.top);
  renderTable('Weak Synergies', report.highlights.weak);
  renderTable('Anomalies', report.highlights.anomalies);

  lines.push('---');
  lines.push(
    `Config → OP ≥ ${report.thresholds.opThreshold}× | Weak ≤ ${report.thresholds.weakThreshold}× | Anomaly ≥ ${report.thresholds.anomalyThreshold}× or ≤ ${report.thresholds.weakAnomalyThreshold}×`,
  );

  return lines.join('\n');
}

/**
 * Loads marginal utility analysis data from disk.
 *
 * @param inputPath - File path to the calculator output JSON.
 */
export async function loadAnalysis(inputPath: string): Promise<MarginalUtilityAnalysis> {
  const resolvedPath = resolve(inputPath);
  const raw = await readFile(resolvedPath, 'utf-8');
  return JSON.parse(raw) as MarginalUtilityAnalysis;
}

/**
 * Persists formatted output when the user passes --output.
 */
async function persistOutput(outputPath: string, content: string): Promise<void> {
  const resolved = resolve(outputPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, 'utf-8');
  console.log(`[SynergyReport] Saved output to ${resolved}`);
}

/**
 * Executes the CLI using Commander.
 */
export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('sts:synergy-report')
    .description('Generate JSON or Markdown synergy highlights from marginal utility analysis')
    .requiredOption('-i, --input <path>', 'Path to marginal utility analysis JSON file')
    .option('-f, --format <format>', 'Output format: json | markdown', 'json')
    .option('-o, --output <path>', 'File path for output (stdout when omitted)')
    .option('--op-threshold <number>', 'OP synergy threshold', `${DEFAULT_REPORT_CONFIG.opThreshold}`)
    .option('--weak-threshold <number>', 'Weak synergy threshold', `${DEFAULT_REPORT_CONFIG.weakThreshold}`)
    .option(
      '--anomaly-threshold <number>',
      'Anomaly threshold for extreme OP synergies',
      `${DEFAULT_REPORT_CONFIG.anomalyThreshold}`,
    )
    .option(
      '--weak-anomaly-threshold <number>',
      'Anomaly threshold for extreme weak synergies',
      `${DEFAULT_REPORT_CONFIG.weakAnomalyThreshold}`,
    )
    .option('--top <number>', 'Maximum rows per highlight table', `${DEFAULT_REPORT_CONFIG.highlightLimit}`)
    .action(async (options) => {
      const parseNumber = (value: unknown, fallback: number): number => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
        const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const parseInteger = (value: unknown, fallback: number): number => {
        const parsed = parseNumber(value, fallback);
        return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
      };

      const analysis = await loadAnalysis(options.input);

      const reportOptions: SynergyReportOptions = {
        opThreshold: parseNumber(options.opThreshold, DEFAULT_REPORT_CONFIG.opThreshold),
        weakThreshold: parseNumber(options.weakThreshold, DEFAULT_REPORT_CONFIG.weakThreshold),
        anomalyThreshold: parseNumber(
          options.anomalyThreshold,
          DEFAULT_REPORT_CONFIG.anomalyThreshold,
        ),
        weakAnomalyThreshold: parseNumber(
          options.weakAnomalyThreshold,
          DEFAULT_REPORT_CONFIG.weakAnomalyThreshold,
        ),
        highlightLimit: parseInteger(options.top, DEFAULT_REPORT_CONFIG.highlightLimit),
      };

      const report = generateSynergyReport(analysis, reportOptions, resolve(options.input));
      let output = '';

      if (options.format === 'markdown') {
        output = formatReportAsMarkdown(report);
      } else if (options.format === 'json') {
        output = JSON.stringify(report, null, 2);
      } else {
        throw new Error(`Unsupported format: ${options.format}`);
      }

      if (options.output) {
        await persistOutput(options.output, output);
      } else {
        console.log(output);
      }
    });

  await program.parseAsync(argv);
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error('[SynergyReport] Failed to generate report:', error);
    process.exit(1);
  });
}
