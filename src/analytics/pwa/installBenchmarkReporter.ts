import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { z } from 'zod';

export type InstallBenchmarkStageStatus = 'pass' | 'warning' | 'fail';

export interface InstallBenchmarkStageResult {
  id: string;
  label: string;
  durationMs: number;
  budgetMs: number;
  status: InstallBenchmarkStageStatus;
}

export interface InstallBenchmarkSample {
  id: string;
  timestamp: number;
  networkId: string;
  networkLabel: string;
  stages: InstallBenchmarkStageResult[];
  totalDurationMs: number;
  overallStatus: InstallBenchmarkStageStatus;
  notes?: string;
}

export interface InstallBenchmarkSummaryRow {
  networkId: string;
  label: string;
  sampleCount: number;
  avgTotalMs: number;
  p95TotalMs: number;
  failRate: number;
  warningRate: number;
}

export interface InstallBenchmarkSummary {
  generatedAt: number;
  rows: InstallBenchmarkSummaryRow[];
}

export interface InstallBenchmarkRunnerResult {
  durations: Record<string, number>;
  notes?: string;
}

export type InstallBenchmarkRunner = (
  profile: InstallBenchmarkNetworkProfile,
  stages: InstallBenchmarkStageConfig[],
) => Promise<InstallBenchmarkRunnerResult>;

const NetworkProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  latencyMs: z.number().nonnegative(),
  bandwidthMbps: z.number().positive(),
  targetSamples: z.number().int().positive().default(5),
});

const StageConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  budgetMs: z.number().positive(),
});

const TelemetryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  eventName: z.string().default('pwa_install_benchmark_sampled'),
  emitWarningsOnly: z.boolean().default(false),
}).default({
  enabled: true,
  eventName: 'pwa_install_benchmark_sampled',
  emitWarningsOnly: false,
});

const ReporterConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storageKey: z.string().default('pwa.installBenchmark.samples'),
  warningThreshold: z.number().positive().default(1.25),
  networks: z.array(NetworkProfileSchema),
  stages: z.array(StageConfigSchema),
  telemetry: TelemetryConfigSchema,
});

export type InstallBenchmarkConfig = z.infer<typeof ReporterConfigSchema>;
export type InstallBenchmarkNetworkProfile = z.infer<typeof NetworkProfileSchema>;
export type InstallBenchmarkStageConfig = z.infer<typeof StageConfigSchema>;
export type InstallBenchmarkTelemetryConfig = z.infer<typeof TelemetryConfigSchema>;

export const DEFAULT_INSTALL_BENCHMARK_CONFIG: InstallBenchmarkConfig = ReporterConfigSchema.parse({
  enabled: true,
  storageKey: 'pwa.installBenchmark.samples',
  warningThreshold: 1.25,
  telemetry: {
    enabled: true,
    eventName: 'pwa_install_benchmark_sampled',
    emitWarningsOnly: true,
  },
  networks: [
    { id: 'wifi', label: 'Wi-Fi 5 GHz', latencyMs: 20, bandwidthMbps: 120, targetSamples: 5 },
    { id: '5g', label: '5G Sub-6', latencyMs: 35, bandwidthMbps: 80, targetSamples: 5 },
    { id: 'lte', label: '4G LTE', latencyMs: 55, bandwidthMbps: 40, targetSamples: 5 },
  ],
  stages: [
    { id: 'prompt_to_accept', label: 'Prompt → Accept', budgetMs: 7000 },
    { id: 'accept_to_ready', label: 'Accept → Ready', budgetMs: 5000 },
    { id: 'ready_to_launch', label: 'Ready → First Launch', budgetMs: 4000 },
  ],
});

interface PersistenceShape {
  samples: InstallBenchmarkSample[];
}

interface ReporterPersistence {
  save: (key: string, data: PersistenceShape) => Promise<void>;
  load: (key: string, fallback: PersistenceShape) => Promise<PersistenceShape>;
}

interface ReporterDeps {
  persistence: ReporterPersistence;
  telemetryPublisher: (event: string, payload: Record<string, unknown>) => void;
  now: () => number;
  random: () => number;
}

const DEFAULT_PERSISTENCE: ReporterPersistence = {
  save: (key, data) => saveData(key, data),
  load: (key, fallback) => loadData(key, fallback),
};

const DEFAULT_DEPS: ReporterDeps = {
  persistence: DEFAULT_PERSISTENCE,
  telemetryPublisher: trackTelemetryEvent,
  now: () => Date.now(),
  random: () => Math.random(),
};

export class InstallBenchmarkReporter {
  private config: InstallBenchmarkConfig;
  private deps: ReporterDeps;
  private samples: InstallBenchmarkSample[] = [];
  private hydratePromise: Promise<void>;

  constructor(config?: Partial<InstallBenchmarkConfig>, deps?: Partial<ReporterDeps>) {
    this.config = ReporterConfigSchema.parse({
      ...DEFAULT_INSTALL_BENCHMARK_CONFIG,
      ...config,
      telemetry: {
        ...DEFAULT_INSTALL_BENCHMARK_CONFIG.telemetry,
        ...config?.telemetry,
      },
      networks: config?.networks ?? DEFAULT_INSTALL_BENCHMARK_CONFIG.networks,
      stages: config?.stages ?? DEFAULT_INSTALL_BENCHMARK_CONFIG.stages,
    });

    this.deps = {
      ...DEFAULT_DEPS,
      ...deps,
      persistence: {
        ...DEFAULT_DEPS.persistence,
        ...deps?.persistence,
      },
    } as ReporterDeps;

    this.hydratePromise = this.restoreSamples();
  }

  /** Resolves when samples are loaded from persistence */
  public get ready(): Promise<void> {
    return this.hydratePromise;
  }

  /** Returns a copy of the in-memory samples */
  getSamples(): InstallBenchmarkSample[] {
    return [...this.samples];
  }

  /** Clears history and persistence */
  async clearHistory(): Promise<void> {
    await this.ready;
    this.samples = [];
    await this.deps.persistence.save(this.config.storageKey, { samples: [] });
  }

  /** Runs a benchmark for the provided network profile */
  async runBenchmark(networkId: string, runner?: InstallBenchmarkRunner): Promise<InstallBenchmarkSample> {
    await this.ready;
    const profile = this.resolveNetwork(networkId);
    const resolvedRunner = runner ?? this.defaultRunner;
    const result = await resolvedRunner(profile, this.config.stages);
    return this.recordResult(profile, result);
  }

  /** Records an externally captured sample */
  async recordSample(networkId: string, durations: Record<string, number>, notes?: string): Promise<InstallBenchmarkSample> {
    await this.ready;
    const profile = this.resolveNetwork(networkId);
    return this.recordResult(profile, { durations, notes });
  }

  /** Generates aggregated summary */
  async getSummary(): Promise<InstallBenchmarkSummary> {
    await this.ready;
    const rows = this.config.networks.map((network) => {
      const networkSamples = this.samples.filter((sample) => sample.networkId === network.id);
      const totals = networkSamples.map((sample) => sample.totalDurationMs).sort((a, b) => a - b);
      const avgTotalMs = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : 0;
      const p95TotalMs = totals.length ? totals[Math.min(totals.length - 1, Math.floor(totals.length * 0.95))] : 0;
      const failRate = networkSamples.length
        ? networkSamples.filter((sample) => sample.overallStatus === 'fail').length / networkSamples.length
        : 0;
      const warningRate = networkSamples.length
        ? networkSamples.filter((sample) => sample.overallStatus === 'warning').length / networkSamples.length
        : 0;

      return {
        networkId: network.id,
        label: network.label,
        sampleCount: networkSamples.length,
        avgTotalMs,
        p95TotalMs,
        failRate,
        warningRate,
      } satisfies InstallBenchmarkSummaryRow;
    });

    return { rows, generatedAt: this.deps.now() };
  }

  /** Exports samples in the requested format */
  async exportSamples(format: 'json' | 'markdown' | 'csv' = 'json'): Promise<string> {
    await this.ready;
    switch (format) {
      case 'markdown':
        return this.toMarkdown();
      case 'csv':
        return this.toCsv();
      case 'json':
      default:
        return JSON.stringify({ generatedAt: this.deps.now(), samples: this.samples }, null, 2);
    }
  }

  private async restoreSamples(): Promise<void> {
    const payload = await this.deps.persistence.load(this.config.storageKey, { samples: [] });
    this.samples = payload.samples ?? [];
  }

  private resolveNetwork(networkId: string): InstallBenchmarkNetworkProfile {
    const profile = this.config.networks.find((network) => network.id === networkId);
    if (!profile) {
      throw new Error(`Unknown network profile: ${networkId}`);
    }
    return profile;
  }

  private async persistSamples(): Promise<void> {
    await this.deps.persistence.save(this.config.storageKey, { samples: this.samples });
  }

  private recordResult(
    profile: InstallBenchmarkNetworkProfile,
    result: InstallBenchmarkRunnerResult,
  ): InstallBenchmarkSample {
    const stages = this.config.stages.map((stage) => {
      const duration = Math.max(0, Math.round(result.durations[stage.id] ?? 0));
      const status = classifyStage(duration, stage.budgetMs, this.config.warningThreshold);
      return {
        id: stage.id,
        label: stage.label,
        durationMs: duration,
        budgetMs: stage.budgetMs,
        status,
      } satisfies InstallBenchmarkStageResult;
    });

    const overallStatus = resolveOverallStatus(stages);
    const sample: InstallBenchmarkSample = {
      id: `install_benchmark_${profile.id}_${Math.floor(this.deps.now())}_${Math.round(this.deps.random() * 1e6)}`,
      timestamp: this.deps.now(),
      networkId: profile.id,
      networkLabel: profile.label,
      stages,
      totalDurationMs: stages.reduce((sum, stage) => sum + stage.durationMs, 0),
      overallStatus,
      notes: result.notes,
    };

    this.samples = [sample, ...this.samples];
    void this.persistSamples();
    this.emitTelemetry(sample);
    return sample;
  }

  private emitTelemetry(sample: InstallBenchmarkSample): void {
    if (!this.config.telemetry.enabled) {
      return;
    }

    if (this.config.telemetry.emitWarningsOnly && sample.overallStatus === 'pass') {
      return;
    }

    this.deps.telemetryPublisher(this.config.telemetry.eventName, {
      sampleId: sample.id,
      networkId: sample.networkId,
      totalDurationMs: sample.totalDurationMs,
      overallStatus: sample.overallStatus,
      stages: sample.stages.map((stage) => ({
        id: stage.id,
        durationMs: stage.durationMs,
        status: stage.status,
        budgetMs: stage.budgetMs,
      })),
    });
  }

  private defaultRunner: InstallBenchmarkRunner = async (profile, stages) => {
    const durations: Record<string, number> = {};
    const networkPenalty = 1 + profile.latencyMs / 200;
    for (const stage of stages) {
      const variability = 0.65 + this.deps.random() * 0.7;
      durations[stage.id] = stage.budgetMs * variability * networkPenalty * (120 / profile.bandwidthMbps);
      await wait(Math.min(25, stage.budgetMs * 0.05));
    }
    return { durations, notes: 'Simulated benchmark run' };
  };

  private toMarkdown(): string {
    const lines = ['# PWA Install Benchmark Report', '', `Generated: ${new Date(this.deps.now()).toISOString()}`, ''];
    lines.push('| Network | Samples | Avg Total (ms) | P95 Total (ms) | Warning % | Fail % |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
    this.config.networks.forEach((network) => {
      const networkSamples = this.samples.filter((sample) => sample.networkId === network.id);
      if (!networkSamples.length) {
        lines.push(`| ${network.label} | 0 | 0 | 0 | 0% | 0% |`);
        return;
      }
      const totals = networkSamples.map((sample) => sample.totalDurationMs).sort((a, b) => a - b);
      const avg = totals.reduce((sum, value) => sum + value, 0) / totals.length;
      const p95 = totals[Math.min(totals.length - 1, Math.floor(totals.length * 0.95))];
      const warningRate = networkSamples.filter((sample) => sample.overallStatus === 'warning').length / totals.length;
      const failRate = networkSamples.filter((sample) => sample.overallStatus === 'fail').length / totals.length;
      lines.push(
        `| ${network.label} | ${totals.length} | ${avg.toFixed(0)} | ${p95.toFixed(0)} | ${(warningRate * 100).toFixed(1)}% | ${(failRate * 100).toFixed(1)}% |`,
      );
    });
    return lines.join('\n');
  }

  private toCsv(): string {
    const header = 'sampleId,networkId,networkLabel,totalDurationMs,overallStatus,stageId,stageDurationMs,stageBudgetMs,stageStatus';
    const rows = this.samples.flatMap((sample) =>
      sample.stages.map((stage) =>
        [
          sample.id,
          sample.networkId,
          escapeCsv(sample.networkLabel),
          sample.totalDurationMs,
          sample.overallStatus,
          stage.id,
          stage.durationMs,
          stage.budgetMs,
          stage.status,
        ].join(','),
      ),
    );
    return [header, ...rows].join('\n');
  }
}

function classifyStage(durationMs: number, budgetMs: number, warningThreshold: number): InstallBenchmarkStageStatus {
  if (durationMs <= budgetMs) {
    return 'pass';
  }
  if (durationMs <= budgetMs * warningThreshold) {
    return 'warning';
  }
  return 'fail';
}

function resolveOverallStatus(stages: InstallBenchmarkStageResult[]): InstallBenchmarkStageStatus {
  if (stages.some((stage) => stage.status === 'fail')) {
    return 'fail';
  }
  if (stages.some((stage) => stage.status === 'warning')) {
    return 'warning';
  }
  return 'pass';
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
